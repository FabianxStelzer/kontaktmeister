#!/usr/bin/env bash
# Ein-Klick-Redeploy auf dem Server
# Nutzung: bash /opt/kontaktmeister/deploy/redeploy.sh
set -euo pipefail

cd /opt/kontaktmeister

echo "== 1/7 git pull =="
git fetch origin
git reset --hard origin/main

echo "== 2/7 .env.production Check =="
if [ ! -f ".env.production" ]; then
  echo "FEHLER: /opt/kontaktmeister/.env.production fehlt"
  exit 1
fi

echo "== 3/7 alte Container + Image entfernen =="
docker compose -f deploy/docker-compose.yml down || true
docker rmi -f kontaktmeister-app:latest 2>/dev/null || true

echo "== 4/7 Neu bauen (ohne Cache fuer app und worker) =="
docker compose -f deploy/docker-compose.yml build --no-cache app worker

echo "== 5/7 Starten =="
docker compose -f deploy/docker-compose.yml up -d
docker compose -f deploy/docker-compose.yml ps

echo "== 6/7 DB migrieren + seeden =="
sleep 5
docker exec km_app npx prisma migrate deploy || true
docker exec km_app npm run db:seed || true

echo "== 7/7 Test =="
echo "---- App direkt (intern) ----"
docker exec km_caddy wget -S --spider -q http://app:3000/ 2>&1 | head -n 10 || true
echo "---- via Caddy (public) ----"
curl -sI https://app.kontaktmeister.de | head -n 10
echo ""
echo "Fertig. Logs mit:  docker logs km_app --tail 50"
