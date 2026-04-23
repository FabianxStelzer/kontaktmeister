#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/kontaktmeister"

echo "[1/6] System aktualisieren"
sudo apt update && sudo apt upgrade -y

echo "[2/6] Docker installieren"
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"

echo "[3/6] App-Verzeichnis anlegen"
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

echo "[4/6] Repo klonen (falls noch nicht vorhanden)"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$1" "$APP_DIR"
fi

echo "[5/6] .env.production vorbereiten"
cd "$APP_DIR"
if [ ! -f .env.production ]; then
  cp .env.example .env.production
  echo "Bitte .env.production ausfuellen!"
fi

echo "[6/6] Starten"
docker compose -f deploy/docker-compose.yml up -d
echo "Fertig. Caddy holt SSL automatisch."
