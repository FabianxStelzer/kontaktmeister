#!/usr/bin/env bash
# Ein-Klick-Redeploy auf dem Server
# Nutzung: bash /opt/kontaktmeister/deploy/redeploy.sh
set -euo pipefail

cd /opt/kontaktmeister

echo "== 1/8 git pull =="
git fetch origin
git reset --hard origin/main

echo "== 2/8 .env.production Check =="
if [ ! -f ".env.production" ]; then
  echo "FEHLER: /opt/kontaktmeister/.env.production fehlt"
  exit 1
fi

# Pflichtvariablen pruefen und auf Produktions-URL zwingen
required=(AUTH_SECRET ENCRYPTION_KEY NEXTAUTH_URL AUTH_URL APP_URL PUBLIC_URL DATABASE_URL REDIS_URL)
missing=()
for v in "${required[@]}"; do
  if ! grep -qE "^${v}=" .env.production; then
    missing+=("$v")
  fi
done
if [ ${#missing[@]} -ne 0 ]; then
  echo "FEHLER: In .env.production fehlen: ${missing[*]}"
  echo "Bitte .env.production ergaenzen. Beispielwerte siehe .env.example"
  exit 1
fi

# Sicherheitshalber die Produktions-URLs auf app.kontaktmeister.de zwingen,
# falls jemand localhost drinstehen hat.
sed -i 's#^NEXTAUTH_URL=.*#NEXTAUTH_URL=https://app.kontaktmeister.de#' .env.production
sed -i 's#^AUTH_URL=.*#AUTH_URL=https://app.kontaktmeister.de#'         .env.production
sed -i 's#^APP_URL=.*#APP_URL=https://app.kontaktmeister.de#'           .env.production
sed -i 's#^PUBLIC_URL=.*#PUBLIC_URL=https://app.kontaktmeister.de#'     .env.production
# AUTH_TRUST_HOST sicher auf true
if grep -qE "^AUTH_TRUST_HOST=" .env.production; then
  sed -i 's#^AUTH_TRUST_HOST=.*#AUTH_TRUST_HOST=true#' .env.production
else
  echo "AUTH_TRUST_HOST=true" >> .env.production
fi
# DB- und Redis-Host auf die Service-Namen zwingen
sed -i 's#@localhost:5432#@postgres:5432#g' .env.production
sed -i 's#redis://localhost:6379#redis://redis:6379#g' .env.production

echo "--- Effektive URL-Variablen in .env.production ---"
grep -E "^(NEXTAUTH_URL|AUTH_URL|AUTH_TRUST_HOST|APP_URL|PUBLIC_URL|DATABASE_URL|REDIS_URL)=" .env.production

echo "== 3/8 alte Container + Image entfernen =="
docker compose -f deploy/docker-compose.yml down || true
docker rmi -f kontaktmeister-app:latest 2>/dev/null || true

echo "== 4/8 Neu bauen (ohne Cache fuer app und worker) =="
docker compose -f deploy/docker-compose.yml build --no-cache app worker

echo "== 5/8 Starten =="
docker compose -f deploy/docker-compose.yml up -d
docker compose -f deploy/docker-compose.yml ps

echo "== 6/8 Warten bis Postgres bereit =="
for i in $(seq 1 30); do
  if docker exec km_postgres pg_isready -U kontaktmeister >/dev/null 2>&1; then
    echo "Postgres ready."
    break
  fi
  sleep 1
done

echo "== 7/8 DB-Schema anlegen (prisma db push) + seeden =="
# Kein prisma/migrations/ im Repo -> direkt db push, damit alle Tabellen entstehen
docker exec km_app npx prisma db push --skip-generate --accept-data-loss
docker exec km_app npm run db:seed || echo "Seed hatte Warnings, weiter."

echo "== 8/8 Test =="
echo "---- /api/healthz (intern) ----"
docker exec km_caddy wget -qO- http://app:3000/api/healthz || true
echo
echo "---- / (intern, nur Status) ----"
docker exec km_caddy wget -S -O /dev/null "http://app:3000/" 2>&1 | grep -E "HTTP/|Location" | head -n 4 || true
echo "---- /login (intern, nur Status) ----"
docker exec km_caddy wget -S -O /dev/null "http://app:3000/login" 2>&1 | grep -E "HTTP/|Location" | head -n 4 || true
echo "---- / (public ueber Caddy) ----"
curl -sI https://app.kontaktmeister.de/ | head -n 3
echo "---- /login (public ueber Caddy) ----"
curl -sI https://app.kontaktmeister.de/login | head -n 3
echo
echo "---- Letzte km_app Logs ----"
docker logs km_app --tail 40
echo
echo "Fertig."
