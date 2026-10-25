# Pixarea 🎨

Pixarea is a community pixel-canvas web application derived from **PixelPlanet.fun**. This repository contains the Pixarea source snapshot and its project-specific security changes.

> **Upstream and attribution:** [TheRdMelon/pixelplanet](https://github.com/TheRdMelon/pixelplanet) — original PixelPlanet.fun project. Pixarea is a modified derivative, **not** the official PixelPlanet.fun repository. Original copyright notices and the **GPL-3.0** license are retained.

## What is different?

Compared with the upstream project's published README, this Pixarea snapshot contains several security-focused changes:

- Database credentials, session secrets and privileged WebSocket API keys are read from environment variables rather than bundled production secrets.
- The privileged `/mcws` interface requires a configured API key; the old reusable fallback key is removed.
- Session cookie options include `Secure`, `HttpOnly` and `SameSite=Lax`.
- CSRF/origin checks, OAuth state validation and restrictions on state-changing GET routes were added in the modified application.
- The default bind address is `127.0.0.1`, intended for deployment behind a trusted HTTPS reverse proxy.
- Some administrator and account-recovery paths have improved request-origin/IP handling.

These are **source-level features**, not a claim of a complete penetration test. The repository still contains older dependencies and some OAuth providers use placeholder `dummy` values if unconfigured; configure providers deliberately.

## Installation and deployment

**Pixarea is intended to be simpler to deploy than the upstream manual setup.** On the operator's existing server, a prepared deployment was brought online, but **this public ZIP does not contain a verified one-command installer**. Do not assume a single command provisions MySQL, Redis, TLS and PM2 automatically. The steps below are the documented manual fallback.

### Requirements

- Linux server (Ubuntu recommended)
- Node.js and npm compatible with this legacy dependency tree (test in a staging environment; Node.js 12 is end-of-life)
- MySQL or MariaDB, Redis, and PM2
- An HTTPS reverse proxy (e.g., Nginx) for public access

### 1. Download and build

```bash
git clone <YOUR-PIXAREA-REPOSITORY-URL>
cd <YOUR-PIXAREA-REPOSITORY-FOLDER>
npm install
npm run build
```

Replace the placeholders with the URL and directory of your published repository. Legacy native dependencies may need additional build packages; installation has **not** been validated from scratch against a fresh server.

### 2. Prepare services and secrets

Create a **dedicated, least-privileged** MySQL database and user. Start Redis. Supply configuration as environment variables (do **not** commit real credentials):

| Variable | Purpose |
| --- | --- |
| `HOST` | Bind host, normally `127.0.0.1` |
| `PORT` | Internal application port, e.g. `3000` |
| `REDIS_URL` | Redis connection URL (match your server's actual Redis port) |
| `MYSQL_HOST` | Database host |
| `MYSQL_DATABASE` | Database name |
| `MYSQL_USER` | Dedicated application database user |
| `MYSQL_PW` | Database password |
| `SESSION_SECRET` | Strong, randomly generated session secret |
| `APISOCKET_KEY` | Strong, randomly generated key for privileged WebSocket operations |
| `ADMIN_IDS` | Comma-separated administrator account IDs (optional) |

OAuth integrations require provider-specific client IDs and secrets. Set only the integrations you intend to enable. See `src/core/config.js` for further configuration options.

### 3. Run behind HTTPS

The source includes `tools/example-ecosystem.yml` as a **reference**, not a ready-to-run production configuration. Build the application, supply environment variables through a private PM2 configuration or service environment, and use the appropriate generated entry point in `build/`.

Keep the Node service on localhost; configure your reverse proxy for HTTPS and trusted forwarded headers. **Never expose MySQL or Redis publicly.** Run the application under a dedicated non-root OS account where practical.

### 4. Verify

- Build succeeds (`npm run build`).
- The home page responds over HTTPS.
- Login and sessions work with `Secure` cookies.
- Unauthorized privileged WebSocket connections are rejected.
- Cross-origin state-changing requests are rejected.
- Database and Redis data persist after restart.

## Known limitations

- Older Node.js, Express, Sequelize and other dependencies need a staged upgrade and vulnerability review.
- Some OAuth configuration still uses `dummy` placeholders; this is **not** a substitute for provider setup.
- No clean-server, one-command installation was independently demonstrated from this ZIP.
- The source snapshot is not a database backup and does not include production data, credentials or deployment secrets.
- The code may retain upstream branding, assets and configuration defaults. Review them before public deployment.

## Project lineage and license

Pixarea is based on [TheRdMelon/pixelplanet](https://github.com/TheRdMelon/pixelplanet). The original upstream project is licensed under **GNU GPL v3**. This derivative retains the supplied `LICENSE` file and must preserve applicable copyright and attribution notices. Third-party media and trademarks may have separate terms.

## Contributing and security

Please do not post passwords, API keys, private user data or exploit details in public issues. Report security issues privately to the repository maintainer using an appropriate private channel.
