# Go-Live Checkliste (Hetzner + Strato)

Diese Checkliste ist auf deine Ziel-Domain ausgelegt:

- App: `app.kontaktmeister.de`
- Landingpages: `p.kontaktmeister.de`

## 1) Vorbereitungen

- [ ] Hetzner Server erstellt (Ubuntu 24.04, z. B. CX22)
- [ ] SSH-Zugang mit Key aktiv
- [ ] GitHub-Repository vorhanden
- [ ] Strato Domain `kontaktmeister.de` aktiv

## 2) DNS bei Strato

- [ ] `A` Record `app` -> `<HETZNER_SERVER_IP>`
- [ ] `A` Record `p` -> `<HETZNER_SERVER_IP>`
- [ ] SPF TXT gesetzt: `v=spf1 include:_spf.strato.com ~all`
- [ ] DKIM in Strato-Mailverwaltung aktiviert
- [ ] DMARC TXT gesetzt (Start): `v=DMARC1; p=none; rua=mailto:dmarc@kontaktmeister.de`

Pruefen:

```bash
dig +short app.kontaktmeister.de
dig +short p.kontaktmeister.de
```

## 3) Server Bootstrap

Auf dem Hetzner-Server:

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Neu einloggen, dann:

```bash
sudo mkdir -p /opt/kontaktmeister
sudo chown -R $USER:$USER /opt/kontaktmeister
cd /opt/kontaktmeister
git clone <DEIN_GIT_REPO_URL> .
cp .env.example .env.production
```

## 4) Produktions-ENV ausfuellen (`/opt/kontaktmeister/.env.production`)

Mindestens setzen:

- [ ] `NODE_ENV=production`
- [ ] `APP_URL=https://app.kontaktmeister.de`
- [ ] `PUBLIC_URL=https://p.kontaktmeister.de`
- [ ] `AUTH_SECRET=<openssl rand -base64 32>`
- [ ] `ENCRYPTION_KEY=<openssl rand -hex 32>`
- [ ] `DATABASE_URL=postgresql://kontaktmeister:kontaktmeister@postgres:5432/kontaktmeister?schema=public`
- [ ] `REDIS_URL=redis://redis:6379`
- [ ] `SMTP_HOST=smtp.strato.de`
- [ ] `SMTP_PORT=465`
- [ ] `SMTP_SECURE=true`
- [ ] `SMTP_USER=<STRATO_MAIL_USER>`
- [ ] `SMTP_PASS=<STRATO_MAIL_PASS>`
- [ ] `SMTP_FROM_EMAIL=<ABSENDER@kontaktmeister.de>`
- [ ] `SUPERADMIN_EMAIL=<DEINE_ADMIN_MAIL>`
- [ ] `SUPERADMIN_PASSWORD=<STARKES_PASSWORT>`

## 5) GitHub Secrets (für CI/CD)

Im Repo unter Settings -> Secrets:

- [ ] `HETZNER_HOST`
- [ ] `HETZNER_USER`
- [ ] `HETZNER_SSH_KEY`

Optional:

- [ ] `HETZNER_PORT` (falls nicht 22)

## 6) Erstes Deployment

### Option A: Manuell auf Server

```bash
cd /opt/kontaktmeister
docker compose -f deploy/docker-compose.yml up -d --build
```

### Option B: CI/CD (empfohlen)

- [ ] Push auf `main`
- [ ] GitHub Action `Deploy Kontaktmeister` erfolgreich
- [ ] Container laufen:

```bash
docker ps
```

## 7) Datenbank initialisieren

Im App-Container:

```bash
docker exec -it km_app npm run db:migrate:deploy
docker exec -it km_app npm run db:seed
```

## 8) Funktionstests (Smoke in Produktion)

- [ ] `https://app.kontaktmeister.de` erreichbar
- [ ] `https://p.kontaktmeister.de` erreichbar
- [ ] Registrierung + Login funktionieren
- [ ] Kontakt anlegen / CSV importieren
- [ ] Kampagne erstellen und starten
- [ ] HeyGen Video wird erzeugt
- [ ] Landingpage zeigt Video
- [ ] E-Mail wird via Strato zugestellt
- [ ] Open/Click Tracking im Dashboard sichtbar
- [ ] Unsubscribe-Link funktioniert
- [ ] PDF-Download und Batch-ZIP funktionieren
- [ ] Superadmin Login unter `/admin/login` funktioniert

## 9) Sicherheit & Betrieb

- [ ] UFW aktivieren:
  - [ ] `22/tcp`
  - [ ] `80/tcp`
  - [ ] `443/tcp`
- [ ] Kein direkter Expose von Postgres/Redis
- [ ] Fail2ban optional aktivieren
- [ ] Regelmaessige Updates (OS + Docker Images)

## 10) Backups

- [ ] Backup-Ordner erstellen: `/opt/kontaktmeister/backups`
- [ ] Cronjob fuer DB-Dump setzen:

```bash
0 3 * * * docker exec km_postgres pg_dump -U kontaktmeister kontaktmeister | gzip > /opt/kontaktmeister/backups/db-$(date +\%F).sql.gz
```

- [ ] Restore-Test mindestens 1x durchfuehren

## 11) Go-Live Done

- [ ] DNS propagiert
- [ ] SSL aktiv (Caddy/Let's Encrypt)
- [ ] End-to-End Test abgeschlossen
- [ ] Monitoring/Alerting geplant (Sentry/Uptime Kuma als naechster Schritt)
