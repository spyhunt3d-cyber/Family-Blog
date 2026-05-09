# Ghost Blog Stack

A self-hosted [Ghost 5](https://ghost.org/) blog with a custom lightweight post editor, both running as Docker Compose services behind a reverse proxy.

## What's included

### `ghost/`
Ghost 5 + MySQL 8 compose stack. Ghost is configured for invite-only membership with Mailgun SMTP for transactional email.

### `ghost-writer/`
A minimal Node.js post editor that sits alongside Ghost. Instead of using the full Ghost Admin dashboard, it provides a focused writing interface with magic-link authentication — members receive a one-time login link via email and are dropped straight into the editor.

Features:
- Magic-link login (no passwords)
- Create, edit, and publish posts
- Image upload via Ghost Admin API
- Session-based auth with secure cookies

## Requirements

- Docker + Docker Compose
- A running reverse proxy (e.g. Nginx Proxy Manager) on a shared Docker network
- A Mailgun account for SMTP
- A Ghost Admin API key (generated inside Ghost Admin)

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/spyhunt3d-cyber/Family-Blog.git
cd Family-Blog
```

### 2. Configure Ghost

```bash
cp ghost/.env.example ghost/.env
```

Edit `ghost/.env` and fill in:
- `GHOST_URL` — public URL of your blog (e.g. `https://blog.example.com`)
- `GHOST_CONTENT_PATH` — host path for Ghost content storage
- `MYSQL_DATA_PATH` — host path for MySQL data
- `DOCKER_NETWORK` — name of your external Docker network
- Database credentials and Mailgun SMTP credentials

### 3. Configure Ghost Writer

```bash
cp ghost-writer/.env.example ghost-writer/.env
```

Edit `ghost-writer/.env` and fill in:
- `GHOST_URL` — same public URL as above
- `GHOST_COOKIE_DOMAIN` / `GHOST_HOST` — hostname only (no scheme)
- `HOST_LAN_IP` — LAN IP of the Docker host (used for internal DNS resolution)
- `GHOST_WRITER_APP_PATH` — absolute host path to `ghost-writer/app/`
- `DOCKER_NETWORK` — same network as above
- `GHOST_ADMIN_API_KEY` — from Ghost Admin → Settings → Integrations → Add custom integration
- `SESSION_SECRET` — random string, e.g. `openssl rand -base64 32`

### 4. Start Ghost

```bash
docker compose -f ghost/docker-compose.yml up -d
```

Visit your Ghost URL and complete the setup wizard. Then come back and generate the Admin API key for ghost-writer.

### 5. Start Ghost Writer

```bash
docker compose -f ghost-writer/docker-compose.yml up -d
```

Ghost Writer runs on port `2369`. Route `/write*` from your reverse proxy to this container.

## Reverse proxy routing

| Path | Target |
|---|---|
| `/*` | Ghost on port `2368` |
| `/write*` | Ghost Writer on port `2369` |

Ghost Writer needs WebSocket support disabled and should have `extra_hosts` configured so internal API calls to Ghost resolve over LAN rather than going out through your public domain.

## Network

Both services attach to a pre-existing external Docker network. Create it if it doesn't exist:

```bash
docker network create your-network-name
```

## Environment variable reference

See `ghost/.env.example` and `ghost-writer/.env.example` for full documentation of every variable.
