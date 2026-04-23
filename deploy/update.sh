#!/usr/bin/env bash
# Wird vom GitHub-Actions-Deployment via SSH ausgefuehrt.
# Kann auch manuell auf dem Server gestartet werden:
#   cd /opt/kontaktmeister && APP_IMAGE=ghcr.io/fabianxstelzer/kontaktmeister:latest bash deploy/update.sh
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE_FILE="deploy/docker-compose.prod.yml"
export APP_IMAGE="${APP_IMAGE:-ghcr.io/fabianxstelzer/kontaktmeister:latest}"

echo "== .env.production Check =="
if [ ! -f ".env.production" ]; then
  echo "FEHLER: $(pwd)/.env.production fehlt"
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

echo "== Pulle Image: $APP_IMAGE =="
docker pull "$APP_IMAGE"

echo "== Starte/Aktualisiere Container =="
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "== Warten bis Postgres bereit =="
for i in $(seq 1 30); do
  if docker exec km_postgres pg_isready -U kontaktmeister >/dev/null 2>&1; then
    echo "Postgres ready."
    break
  fi
  sleep 1
done

echo "== DB-Schema anlegen + seeden =="
docker exec km_app npx prisma db push --skip-generate --accept-data-loss || true
docker exec km_app npm run db:seed || echo "Seed hatte Warnings, weiter."

echo "== Aufraeumen ungenutzter Images =="
docker image prune -f

echo "== Health-Check =="
for i in $(seq 1 20); do
  if docker exec km_caddy wget -qO- http://app:3000/api/healthz >/dev/null 2>&1; then
    echo "App antwortet auf /api/healthz"
    break
  fi
  sleep 1
done

echo "Fertig."
