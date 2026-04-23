# Kontaktmeister

Deutschsprachige SaaS-Software für Agenturen und Dienstleister, die ihren B2B-Outreach mit personalisierten HeyGen-Videos, Landingpages und getracktem E-Mail-Versand automatisieren wollen.

## Features

- **Multi-Tenant**: Jeder Kunde hat einen eigenen Workspace mit Team, Kontakten und API-Keys
- **Kontakte**: CSV-Import, manuelles Anlegen, Firmen-Zuordnung, Duplikat-Erkennung
- **Kampagnen**: Automatisierte Video-Erstellung via HeyGen pro Kontakt
- **Landingpages**: Personalisierte Seite pro Kontakt mit Video, Text und Buchungs-CTA
- **Versand**: E-Mail über Strato SMTP (pluggable) oder PDF-Brief mit QR-Code
- **Tracking**: Open, Page-View, Click — alles DSGVO-konform
- **Opt-Out**: Jede Mail enthält einen Unsubscribe-Link (List-Unsubscribe-Header)
- **Superadmin**: Betreiber-Bereich zur Verwaltung aller Workspaces
- **Dashboard**: KPIs, Aktivitätsfeed, Kampagnen-Stats

## Tech-Stack

- Next.js 15 (App Router, Server Components) + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL 16 + Prisma
- Auth.js v5 (NextAuth)
- BullMQ + Redis (Jobs für Video/Mail/PDF)
- Nodemailer (Strato SMTP)
- @react-pdf/renderer + qrcode (PDF-Briefe)
- Docker + Caddy (Deployment)

## Lokale Entwicklung

### Voraussetzungen

- Node.js 20+ (empfohlen: 22)
- pnpm oder npm
- Docker (für lokale PostgreSQL + Redis)

### Setup

```bash
# Dependencies
npm install

# ENV-Datei kopieren und ausfüllen
cp .env.example .env

# Postgres + Redis per Docker starten
docker compose -f docker-compose.dev.yml up -d

# DB-Schema pushen und Seed laden
npm run db:migrate
npm run db:seed

# Dev-Server starten
npm run dev

# In zweitem Terminal: Worker für Video/Mail-Jobs
npm run worker
```

App läuft auf http://localhost:3000

### Wichtige npm-Skripte

| Skript | Zweck |
|--------|-------|
| `npm run dev` | Next.js Dev-Server |
| `npm run build` | Produktions-Build |
| `npm run start` | Produktions-Server |
| `npm run worker` | BullMQ-Worker (Videos, Mails, PDFs) |
| `npm run db:migrate` | Prisma-Migration erstellen + anwenden |
| `npm run db:studio` | Prisma Studio (DB-GUI) |
| `npm run db:seed` | Demo-Daten laden |
| `npm run typecheck` | TypeScript-Check |
| `npm run lint` | ESLint |

## Ordnerstruktur

```
app/                  Next.js App Router (Pages + API-Routes)
  (marketing)/        Öffentliche Marketing-Seiten
  (auth)/             Login, Registrierung
  (dashboard)/        Workspace-Dashboard (authenticated)
  admin/              Superadmin-Bereich
  p/[slug]/           Öffentliche Landingpages
  api/                API-Endpunkte (Tracking, Webhooks, etc.)
components/
  ui/                 shadcn/ui-Komponenten
lib/                  Utilities (DB, Auth, Mail, Encryption, HeyGen-Client, ...)
workers/              BullMQ-Worker (separater Prozess)
prisma/               Schema, Migrations, Seed
emails/               E-Mail-Templates
deploy/               Dockerfile, docker-compose.yml, Caddyfile
.github/workflows/    CI/CD (Deploy nach Hetzner)
docs/                 Dokumentation (Deployment, Roadmap, DSGVO)
```

## Deployment

Siehe [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) für die vollständige Hetzner-Server- und Strato-DNS-Anleitung.

Kurzfassung:
1. Hetzner Cloud Server (CX22) mit Ubuntu 24.04
2. Strato DNS: A-Record `app.kontaktmeister.de` auf Server-IP
3. GitHub Secrets setzen (SSH-Key, Server-IP)
4. `git push` nach `main` → GitHub Actions baut + deployed automatisch

## DSGVO / Recht

- Jede Mail enthält einen `List-Unsubscribe`-Header + sichtbaren Opt-Out-Link
- Opt-Outs werden global im Workspace gespeichert
- Impressum + Datenschutz unter `/impressum` und `/datenschutz`
- Auftragsverarbeitungsvertrag-Vorlage in [docs/AV-VERTRAG.md](docs/AV-VERTRAG.md)

## Lizenz

Proprietär. Alle Rechte vorbehalten.
