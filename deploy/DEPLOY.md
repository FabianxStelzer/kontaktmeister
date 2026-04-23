# Deployment via GitHub Actions → Hetzner

Ablauf ab jetzt:

```
git push origin main
        │
        ▼
 GitHub Actions
   ├─ baut Docker-Image
   ├─ push → ghcr.io/fabianxstelzer/kontaktmeister:latest
   └─ SSH → Hetzner
              ├─ docker login ghcr.io
              ├─ docker pull <neues image>
              └─ docker compose -f deploy/docker-compose.prod.yml up -d
```

Kein manuelles Einloggen auf dem Server mehr noetig. Ein `git push` reicht.

---

## Einmalige Einrichtung (ca. 10 Minuten)

### 1. SSH-Deploy-Key erzeugen (auf deinem Mac)

```bash
ssh-keygen -t ed25519 -C "github-deploy@kontaktmeister" -f ~/.ssh/kontaktmeister_deploy -N ""
```

Ergibt zwei Dateien:
- `~/.ssh/kontaktmeister_deploy`     → **privat**  (geht in GitHub Secret)
- `~/.ssh/kontaktmeister_deploy.pub` → **public** (geht auf den Server)

### 2. Public Key auf dem Server hinterlegen

```bash
# Key ans Ende der authorized_keys haengen
ssh root@168.119.172.100 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys" < ~/.ssh/kontaktmeister_deploy.pub
```

Test:
```bash
ssh -i ~/.ssh/kontaktmeister_deploy root@168.119.172.100 "echo OK"
```

Erwartet: `OK`

### 3. GitHub-Secrets hinzufuegen

Gehe zu:  
https://github.com/FabianxStelzer/kontaktmeister/settings/secrets/actions

Klick **"New repository secret"** und lege diese drei an:

| Name               | Wert                                          |
| ------------------ | --------------------------------------------- |
| `HETZNER_HOST`     | `168.119.172.100`                             |
| `HETZNER_USER`     | `root`                                        |
| `HETZNER_SSH_KEY`  | kompletter Inhalt von `~/.ssh/kontaktmeister_deploy` (inkl. `-----BEGIN`/`-----END`-Zeilen) |

Praktisch zum Kopieren:
```bash
pbcopy < ~/.ssh/kontaktmeister_deploy   # Mac: Inhalt liegt in der Zwischenablage
```

Optional (nur falls du den SSH-Port geaendert hast):  
`HETZNER_SSH_PORT` = `22` (Standard, nicht noetig wenn Port 22)

### 4. GHCR-Package oeffentlich machen (empfohlen) ODER authentifiziert pullen

Nach dem **ersten erfolgreichen Workflow-Run** erscheint hier das Paket:  
https://github.com/FabianxStelzer?tab=packages

Bei `kontaktmeister` →  *Package settings* →  *Change visibility* → **Public**.  
Dann braucht der Server kein GHCR-Login beim Pullen.  
(Alternativ: privat lassen – der Workflow loggt bei jedem Deploy automatisch ein.)

### 5. Einmalige Server-Migration (alte auf neue compose-Datei umstellen)

Auf dem Server (SSH):

```bash
cd /opt/kontaktmeister

# 1. aktuelle Container stoppen (neue starten danach automatisch)
docker compose -f deploy/docker-compose.yml down

# 2. neuesten Code ziehen (enthaelt schon docker-compose.prod.yml + update.sh)
git fetch origin && git reset --hard origin/main

# 3. update.sh ausfuehrbar machen
chmod +x deploy/update.sh

# 4. Erster manueller Pull+Start mit dem neuen Flow
#    (ab jetzt laeuft das automatisch aus GitHub Actions)
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
bash deploy/update.sh
```

**Falls das Package privat ist** – einmalig `docker login` mit einem Personal Access Token
(Classic, Scope `read:packages`): https://github.com/settings/tokens/new?scopes=read:packages

```bash
docker login ghcr.io -u FabianxStelzer
# Password: <dein PAT>
```

---

## Ab jetzt: typischer Arbeitsablauf

```bash
# lokal am Mac
git add -A
git commit -m "feat: neue funktion xy"
git push
```

Dann auf https://github.com/FabianxStelzer/kontaktmeister/actions zuschauen – der Deploy
dauert ~3–4 Minuten. Wenn der gruene Haken kommt, ist die Version live.

### Manuellen Deploy ausloesen (ohne Push)
Actions-Tab → Workflow **"Build & Deploy to Hetzner"** → **"Run workflow"** Button.

### Rollback auf eine alte Version
Jedes Build erzeugt zusaetzlich zu `:latest` einen `:sha-<kurzhash>`-Tag.  
Auf dem Server einmalig:
```bash
APP_IMAGE=ghcr.io/fabianxstelzer/kontaktmeister:sha-abc1234 \
  bash deploy/update.sh
```

### Logs im Server pruefen
```bash
ssh root@168.119.172.100 "cd /opt/kontaktmeister && docker compose -f deploy/docker-compose.prod.yml logs --tail 80 app worker"
```
