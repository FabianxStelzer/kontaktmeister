#!/usr/bin/env bash
# Ein-Klick-Redeploy auf dem Server
# Nutzung: bash /opt/kontaktmeister/deploy/redeploy.sh
set -euo pipefail

cd /opt/kontaktmeister

echo "== 1/9 git pull =="
git fetch origin
git reset --hard origin/main

echo "== 2/9 .env.production Check =="
if [ ! -f ".env.production" ]; then
  echo "FEHLER: /opt/kontaktmeister/.env.production fehlt"
  exit 1
fi

required=(AUTH_SECRET ENCRYPTION_KEY NEXTAUTH_URL AUTH_URL APP_URL PUBLIC_URL DATABASE_URL REDIS_URL)
missing=()
for v in "${required[@]}"; do
  if ! grep -qE "^${v}=" .env.production; then
    missing+=("$v")
  fi
done
if [ ${#missing[@]} -ne 0 ]; then
  echo "FEHLER: In .env.production fehlen: ${missing[*]}"
  exit 1
fi

sed -i 's#^NEXTAUTH_URL=.*#NEXTAUTH_URL=https://app.kontaktmeister.de#' .env.production
sed -i 's#^AUTH_URL=.*#AUTH_URL=https://app.kontaktmeister.de#'         .env.production
sed -i 's#^APP_URL=.*#APP_URL=https://app.kontaktmeister.de#'           .env.production
sed -i 's#^PUBLIC_URL=.*#PUBLIC_URL=https://app.kontaktmeister.de#'     .env.production
if grep -qE "^AUTH_TRUST_HOST=" .env.production; then
  sed -i 's#^AUTH_TRUST_HOST=.*#AUTH_TRUST_HOST=true#' .env.production
else
  echo "AUTH_TRUST_HOST=true" >> .env.production
fi
sed -i 's#@localhost:5432#@postgres:5432#g' .env.production
sed -i 's#redis://localhost:6379#redis://redis:6379#g' .env.production

echo "--- Effektive URL-Variablen in .env.production ---"
grep -E "^(NEXTAUTH_URL|AUTH_URL|AUTH_TRUST_HOST|APP_URL|PUBLIC_URL|DATABASE_URL|REDIS_URL)=" .env.production

echo "== 3/9 alte Container + Image entfernen =="
docker compose -f deploy/docker-compose.yml down || true
docker rmi -f kontaktmeister-app:latest 2>/dev/null || true
docker builder prune -f 2>/dev/null || true

echo "== 4/9 Neu bauen (ohne Cache fuer app und worker) =="
docker compose -f deploy/docker-compose.yml build --no-cache app worker

echo "== 5/9 Starten =="
docker compose -f deploy/docker-compose.yml up -d
docker compose -f deploy/docker-compose.yml ps

echo "== 6/9 Warten bis Postgres bereit =="
for i in $(seq 1 30); do
  if docker exec km_postgres pg_isready -U kontaktmeister >/dev/null 2>&1; then
    echo "Postgres ready."
    break
  fi
  sleep 1
done

echo "== 7/9 DB-Schema anlegen (prisma db push) + seeden =="
docker exec km_app npx prisma db push --skip-generate --accept-data-loss
docker exec km_app npm run db:seed || echo "Seed hatte Warnings, weiter."

echo "== 8/9 Sanity-Check im Container =="
echo "--- Laeuft noch eine middleware.ts im Image? ---"
docker exec km_app ls /app/middleware.ts 2>&1 || echo "(gut - keine middleware.ts)"
echo "--- middleware-manifest.json ---"
docker exec km_app cat /app/.next/server/middleware-manifest.json 2>/dev/null | head -30 || echo "(nicht vorhanden)"
echo "--- Env in km_app (ausgewaehlt) ---"
docker exec km_app sh -c 'printenv | grep -E "^(NODE_ENV|NEXTAUTH_URL|AUTH_URL|AUTH_TRUST_HOST|APP_URL|PUBLIC_URL)="'

echo "--- tatsaechliche app/layout.tsx IM Container ---"
docker exec km_app cat /app/app/layout.tsx 2>/dev/null | head -30 || echo "(kein layout.tsx)"
echo "--- tatsaechliche app/ping/page.tsx IM Container ---"
docker exec km_app cat /app/app/ping/page.tsx 2>/dev/null || echo "(kein ping page)"
echo "--- .next/server/app Inhalt ---"
docker exec km_app sh -c 'ls -la /app/.next/server/app/ 2>/dev/null | head -30' || true
echo "--- routes-manifest redirects ---"
docker exec km_app sh -c 'cat /app/.next/routes-manifest.json 2>/dev/null' | python3 -c "import sys,json;d=json.load(sys.stdin);print('redirects:',json.dumps(d.get('redirects',[]),indent=2));print('rewrites:',json.dumps(d.get('rewrites',[]),indent=2));print('staticRoutes sample:',[r.get('page') for r in d.get('staticRoutes',[])[:10]]);print('dynamicRoutes sample:',[r.get('page') for r in d.get('dynamicRoutes',[])[:10]])" 2>/dev/null || echo "(parse failed)"

echo "== 9/9 Test =="
echo "---- /api/healthz (intern) ----"
docker exec km_caddy wget -qO- http://app:3000/api/healthz || true
echo
echo "---- /api/debug (intern, zeigt Env + Headers) ----"
docker exec km_caddy wget -qO- http://app:3000/api/debug || true
echo
echo "---- /ping (intern, volle Header + Body) ----"
docker exec km_caddy wget -S -O /tmp/ping.html "http://app:3000/ping" 2>&1 | head -20 || true
docker exec km_caddy sh -c 'head -c 400 /tmp/ping.html 2>/dev/null || echo "(kein body)"'
echo
echo "---- / (intern, volle Header) ----"
docker exec km_caddy wget -S -O /dev/null "http://app:3000/" 2>&1 | head -15 || true
echo "---- /login (intern, volle Header) ----"
docker exec km_caddy wget -S -O /dev/null "http://app:3000/login" 2>&1 | head -15 || true
echo
echo "---- / (public ueber Caddy, alle Header) ----"
curl -sI https://app.kontaktmeister.de/ | head -15
echo "---- /login (public ueber Caddy, alle Header) ----"
curl -sI https://app.kontaktmeister.de/login | head -15
echo "---- /ping (public ueber Caddy, alle Header) ----"
curl -sI https://app.kontaktmeister.de/ping | head -15
echo
echo "---- km_app Logs nach Testrequests (wichtig: suchen nach [ROOT_LAYOUT] und [PING_PAGE]) ----"
docker logs km_app --tail 80
echo
echo "Fertig."
