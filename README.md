# Sipon UI

Frontend for **Sipon**, built with Nuxt 4 + `@nuxt/ui`. Talks to [`sipon-api`](../sipon-api) (Go backend).

See [CLAUDE.md](CLAUDE.md) for architecture, conventions, and the auth/RBAC design this project follows.

## Setup

```bash
npm install
cp .env.example .env   # set NUXT_PUBLIC_API_BASE to your sipon-api URL
```

## Development

```bash
npm run dev
```

Runs on `http://localhost:3000`. Requires `sipon-api` running (default `http://localhost:8888`, see its own
`docker-compose.dev.yml`).

## Production

```bash
npm run build
npm run preview   # preview the production build locally
```
