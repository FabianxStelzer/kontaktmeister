# Deployment auf Hetzner (app.kontaktmeister.de)

## 1) Strato DNS

Lege folgende Records an:

- `A` Record `app` -> `<IP_DEINES_HETZNER_SERVERS>`
- `A` Record `p` -> `<IP_DEINES_HETZNER_SERVERS>`
- `TXT` SPF: `v=spf1 include:_spf.strato.com ~all`
- DKIM/DMARC in Strato-Mailverwaltung aktivieren

## 2) Hetzner Server vorbereiten

- Ubuntu 24.04 aufsetzen (z. B. CX22)
- SSH-Key hinterlegen
- Repo auf Server klonen nach `/opt/kontaktmeister`

Dann:

```bash
cd /opt/kontaktmeister
bash deploy/setup-server.sh git@github.com:<owner>/<repo>.git
```

## 3) .env.production ausfuellen

Wichtige Werte:

- `DATABASE_URL=postgresql://kontaktmeister:kontaktmeister@postgres:5432/kontaktmeister?schema=public`
- `REDIS_URL=redis://redis:6379`
- `APP_URL=https://app.kontaktmeister.de`
- `PUBLIC_URL=https://p.kontaktmeister.de`
- `SMTP_HOST=smtp.strato.de`
- `SMTP_PORT=465`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `SMTP_FROM_EMAIL=...`
- `AUTH_SECRET=...`
- `ENCRYPTION_KEY=...` (64 hex chars)

## 4) GitHub Secrets

Im GitHub-Repo setzen:

- `HETZNER_HOST`
- `HETZNER_USER`
- `HETZNER_SSH_KEY`

## 5) Automatischer Deploy

Bei Push auf `main`:

1. Build + Tests in GitHub Actions
2. Docker Image nach GHCR
3. SSH auf Server
4. `docker compose pull && up -d`

Workflow: `.github/workflows/deploy.yml`

## 6) Backup

Beispiel-Cronjob (taeglich 03:00):

```bash
0 3 * * * docker exec km_postgres pg_dump -U kontaktmeister kontaktmeister | gzip > /opt/kontaktmeister/backups/db-$(date +\%F).sql.gz
```
