#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Kontaktmeister Smoke Test =="

if [ ! -f ".env" ]; then
  echo "WARN: .env fehlt. Kopiere .env.example nach .env und passe Werte an."
  exit 1
fi

echo "[1/8] Dependencies pruefen"
if [ ! -d "node_modules" ]; then
  npm install
fi

echo "[2/8] Dev-Infrastruktur starten (Postgres + Redis)"
docker compose -f docker-compose.dev.yml up -d

echo "[3/8] Warten bis Postgres erreichbar ist"
TRIES=0
until docker exec "$(docker ps --format '{{.Names}}' | awk '/postgres/{print $1; exit}')" pg_isready -U kontaktmeister >/dev/null 2>&1; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -gt 30 ]; then
    echo "ERROR: Postgres nicht bereit."
    exit 1
  fi
  sleep 2
done

echo "[4/8] Prisma Client generieren"
npm run db:generate

echo "[5/8] Migrationen anwenden"
npm run db:migrate

echo "[6/8] Seed ausfuehren"
npm run db:seed

echo "[7/8] Typecheck + Lint"
npm run typecheck
npm run lint

echo "[8/8] Abschluss"
echo "OK: Smoke-Test erfolgreich."
echo "Naechste Schritte:"
echo "  Terminal 1: npm run dev"
echo "  Terminal 2: npm run worker"
