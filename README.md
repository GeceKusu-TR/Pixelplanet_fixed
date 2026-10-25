# PixelPlanet.fun — Fixed Edition

A community-maintained, modified version of **PixelPlanet.fun**, focused on fixing deployment and security problems in the original source code. This repository is **not the official PixelPlanet.fun repository**.

**Original source:** [TheRdMelon/pixelplanet](https://github.com/TheRdMelon/pixelplanet)  
**This edition:** [GeceKusu-TR/Pixelplanet_fixed](https://github.com/GeceKusu-TR/Pixelplanet_fixed)

## What changed?

Compared with the upstream version, this source snapshot includes security and deployment improvements, including:

- Application database credentials, session secret, and privileged WebSocket key are configured through environment variables.
- Privileged `/mcws` WebSocket connections require an API key.
- Session cookies use `Secure`, `HttpOnly`, and `SameSite=Lax` settings.
- OAuth state validation, CSRF/origin protections, and restrictions on state-changing GET requests.
- Application defaults to listening on localhost, intended for use behind an HTTPS reverse proxy.
- Safer IP handling for selected administrator and password-reset rate limits.

These are documented changes, **not a guarantee that the application has no vulnerabilities**.

## Installation

This edition aims to simplify deployment compared with the upstream project. **A fully automated one-command installation from a fresh server has not been verified for this archive.** The following steps are a manual fallback.

### Requirements

- Linux (Ubuntu recommended)
- Node.js and npm compatible with the legacy dependencies (Node.js 12 is end-of-life; test upgrades before deploying)
- MySQL/MariaDB, Redis, and PM2
- HTTPS reverse proxy such as Nginx

### Download and build

```bash
git clone https://github.com/GeceKusu-TR/Pixelplanet_fixed.git
cd Pixelplanet_fixed
npm install
npm run build
```

### Configuration

Set the required environment variables **outside the public repository**:

| Variable | Purpose |
| --- | --- |
| `HOST` | Bind address, normally `127.0.0.1` |
| `PORT` | Internal HTTP port, e.g. `3000` |
| `REDIS_URL` | Redis URL |
| `MYSQL_HOST` | Database hostname |
| `MYSQL_DATABASE` | Database name |
| `MYSQL_USER` | Dedicated database username (do not use MySQL root) |
| `MYSQL_PW` | Database password |
| `SESSION_SECRET` | Random session secret |
| `APISOCKET_KEY` | Random privileged WebSocket API key |

Configure OAuth client IDs and secrets only for the providers you use. See `src/core/config.js` and `ecosystem.example.yml` for examples. **Do not commit actual secrets, backups, or user data.**

### Run

After preparing MySQL, Redis, and the required environment variables, build the application and adapt the supplied example PM2 configuration to your server. Run it behind an HTTPS reverse proxy; keep the Node.js service bound to localhost. The example configuration is **not** a production-ready installer.

### Basic verification

- `npm run build` completes successfully.
- The website loads over HTTPS.
- Authentication and session cookies work.
- Privileged WebSocket requests without the key are rejected.
- Cross-origin state-changing requests are rejected.
- MySQL and Redis data persist across restarts.

## Known limitations

- The dependency tree includes old Node.js, Express, and Sequelize versions; review and upgrade in a staging environment.
- Some OAuth providers may still use `dummy` placeholders when unconfigured; check provider configuration.
- A clean-server, one-command install has **not** been independently verified from this archive.
- This source archive does not include production database contents or credentials.

## Attribution and license

Based on [TheRdMelon/pixelplanet](https://github.com/TheRdMelon/pixelplanet). The upstream project's existing copyright notices and **GNU GPL v3** license must be preserved. Third-party artwork, branding, and other assets may have separate rights.

## Security

Never publish `.env` files, credentials, SQL dumps, private tokens, or user data. Please report sensitive security issues privately to the repository maintainer.
