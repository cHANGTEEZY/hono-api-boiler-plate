<h1 align="center">Hono API Boilerplate</h1>

<p align="center">
  A production-ready REST API starter built with <strong>Bun</strong> and <strong>Hono</strong>, featuring <strong>Better Auth</strong>, <strong>PostgreSQL</strong> via <strong>Drizzle ORM</strong>, and <strong>Arcjet</strong> security.
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-000000?style=flat-square&logo=bun&logoColor=white" alt="Bun" /></a>
  <a href="https://hono.dev"><img src="https://img.shields.io/badge/Hono-E36002?style=flat-square&logo=hono&logoColor=white" alt="Hono" /></a>
  <a href="https://www.postgresql.org"><img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="https://www.better-auth.com"><img src="https://img.shields.io/badge/Better%20Auth-000000?style=flat-square" alt="Better Auth" /></a>
  <a href="https://arcjet.com"><img src="https://img.shields.io/badge/Arcjet-000000?style=flat-square" alt="Arcjet" /></a>
</p>

---

## Overview

This boilerplate gives you a typed, secure API foundation without rebuilding the same infrastructure on every project. It ships with email/password authentication, database migrations, CORS configured for SPAs, structured logging, and runtime security — so you can focus on your product logic.

### Features

- **Fast runtime** — [Bun](https://bun.sh) for dev, build, test, and production
- **Lightweight framework** — [Hono](https://hono.dev) with middleware, CORS, and secure headers
- **Authentication** — [Better Auth](https://www.better-auth.com) with Drizzle adapter and session middleware
- **Database** — [PostgreSQL](https://www.postgresql.org) + [Drizzle ORM](https://orm.drizzle.team) with migration workflow
- **Security** — [Arcjet](https://arcjet.com) shield, rate limiting, and signup abuse protection
- **API docs** — Scalar API reference at `/docs`
- **Observability** — Request IDs, structured Pino logging, graceful shutdown
- **Docker** — Multi-stage Dockerfile with health checks

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | [Bun](https://bun.sh) |
| HTTP framework | [Hono](https://hono.dev) |
| Auth | [Better Auth](https://www.better-auth.com) + `@better-auth/drizzle-adapter` |
| Database | [PostgreSQL](https://www.postgresql.org) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) + Drizzle Kit |
| Security | [Arcjet](https://arcjet.com) (`@arcjet/bun`) |
| Validation | [Zod](https://zod.dev) |
| Logging | [Pino](https://getpino.io) |
| API docs | [Scalar](https://scalar.com) |

---

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- [PostgreSQL](https://www.postgresql.org/download/) 14+ (local, Docker, or hosted e.g. Neon)
- An [Arcjet](https://app.arcjet.com) API key (optional in development — fails open without a valid key)

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd hono-api-boiler-plate
bun install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Generate a Better Auth secret:

```bash
openssl rand -base64 32
```

### 3. Set up the database

Create a PostgreSQL database matching your `DATABASE_URL`, then run migrations:

```bash
bun run db:migrate
```

### 4. Start the dev server

```bash
bun run dev
```

The API listens at **http://localhost:3000** by default.

| Endpoint | Description |
| --- | --- |
| `GET /health` | Health check |
| `GET /api/v1/users/me` | Current user profile (auth required) |
| `GET/POST /api/auth/*` | Better Auth handlers |
| `GET /docs` | Scalar API reference |

---

## Environment Variables

All variables are validated at startup via Zod in `src/config/env.ts`. Bun loads `.env.local` automatically.

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Server port (default: `3000`) |
| `HOST` | No | Bind address (default: `0.0.0.0`) |
| `NODE_ENV` | No | `development` \| `production` \| `test` |
| `LOG_LEVEL` | No | Pino log level (default: `info`) |
| `CORS_ORIGIN` | No | Allowed origin(s) or `*` |
| `FRONTEND_ORIGIN` | **Yes** | SPA origin for auth callbacks |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `DATABASE_URL_UNPOOLED` | No | Direct URL for Neon migrations |
| `BETTER_AUTH_URL` | No | Auth base URL (default: `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | **Yes** | Min 32 chars — encryption & hashing |
| `ARCJET_KEY` | **Yes** | Arcjet site key from [app.arcjet.com](https://app.arcjet.com) |
| `ARCJET_ENV` | No | `development` \| `production` (default: `development`) |

See [`.env.example`](.env.example) for a full template.

---

## Authentication (Better Auth)

Auth is configured in [`src/modules/auth/auth.service.ts`](src/modules/auth/auth.service.ts) with the Drizzle adapter and email/password enabled.

### Auth routes

Better Auth is mounted at `/api/auth/*`. Common endpoints:

```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","password":"secure-password"}'

# Sign in
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secure-password"}'

# Get session
curl http://localhost:3000/api/auth/get-session \
  -H "Cookie: <session-cookie>"
```

### Protecting routes

Use the `requireAuth()` middleware on routes that need a logged-in user:

```typescript
import { requireAuth } from "./middleware/require-auth";

router.get("/me", requireAuth(), (c) => {
  return c.json({ user: c.get("user") });
});
```

Session context (`user`, `session`) is populated globally in [`src/app.ts`](src/app.ts).

### Regenerating auth schema

After changing Better Auth plugins or config:

```bash
bun run auth:generate   # Better Auth → Drizzle schema
bun run db:generate     # Drizzle Kit → SQL migration
bun run db:migrate      # Apply migration
```

---

## Database (PostgreSQL + Drizzle)

Schemas live under [`src/db/schema/`](src/db/schema/). The barrel file [`src/db/schema/index.ts`](src/db/schema/index.ts) is the single entry point for Drizzle Kit.

```
src/db/
├── index.ts              # Drizzle client + pg Pool
└── schema/
    ├── index.ts          # Re-exports all tables
    └── auth.ts           # Better Auth tables (generated)
```

### Commands

| Script | Description |
| --- | --- |
| `bun run auth:generate` | Generate Better Auth Drizzle schema |
| `bun run db:generate` | Generate SQL migrations |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:push` | Push schema directly (dev only) |
| `bun run db:studio` | Open Drizzle Studio |

---

## Security (Arcjet)

Arcjet is configured in [`src/shared/utils/arcjet.ts`](src/shared/utils/arcjet.ts) and applied per route handler (not global middleware), following Arcjet best practices.

| Client | Rules | Applied to |
| --- | --- | --- |
| `aj` | Shield (WAF) | Health check |
| `ajApi` | Shield + sliding window (100/min) | `/api/v1/*` |
| `ajAuth` | Shield + sliding window (30/min) | `/api/auth/*` |
| `ajAuthSignup` | Bot block, email validation, rate limit | Sign-up POST |

The Bun server wraps `app.fetch` with `aj.handler()` for accurate client IP detection. Denied requests return structured JSON errors via [`src/shared/utils/arcjet-deny.ts`](src/shared/utils/arcjet-deny.ts).

### Get an Arcjet key

```bash
npx @arcjet/cli auth login
npx @arcjet/cli sites get-key --site-id <site_id> --output json --fields key
```

Set the key in `.env.local` as `ARCJET_KEY=ajkey_...`.

---

## Project Structure

```
├── drizzle/                 # SQL migrations
├── scripts/
│   └── migrate.ts           # Migration runner
├── src/
│   ├── app.ts               # Hono app, middleware, route mounting
│   ├── server.ts            # Bun.serve entry point
│   ├── config/
│   │   └── env.ts           # Zod env validation
│   ├── docs/
│   │   └── openapi.ts       # OpenAPI spec registration
│   ├── db/
│   │   ├── index.ts         # Drizzle + pg Pool
│   │   └── schema/          # Drizzle schemas
│   ├── middleware/          # Session, auth, request ID, logging
│   ├── shared/
│   │   ├── utils/           # Logger, Arcjet, CORS helpers
│   │   ├── types/           # App context types
│   │   └── errors/          # HTTP error builders
│   └── modules/
│       ├── auth/            # Better Auth module
│       ├── health/          # Health check module
│       ├── users/           # Users module
│       └── v1.routes.ts     # API v1 route aggregator
├── test/                    # Bun test suite
├── .env.example
├── drizzle.config.ts
├── Dockerfile
└── package.json
```

---

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start dev server with hot reload |
| `bun run serve` | Start server (no watch) |
| `bun run build` | Build for production |
| `bun run start` | Run production build |
| `bun run test` | Run test suite |
| `bun run typecheck` | TypeScript check |

---

## Docker

Build and run with Docker:

```bash
docker build -t hono-api .
docker run -p 3000:3000 --env-file .env.local hono-api
```

The image uses a multi-stage build on `oven/bun`, runs as the non-root `bun` user, and includes a `/health` check.

---

## Development

### CORS & cookies

CORS is configured for SPA frontends with credentials support. Auth responses merge CORS headers via `mergeCorsIntoAuthResponse()` so browsers accept `Set-Cookie` on cross-origin requests.

Set `CORS_ORIGIN` and `FRONTEND_ORIGIN` to your frontend URL (e.g. `http://localhost:5173` for Vite).

### Adding routes

1. Create a module under `src/modules/<name>/` (routes, controller, service, docs)
2. Register routes in [`src/modules/v1.routes.ts`](src/modules/v1.routes.ts) or [`src/app.ts`](src/app.ts)
3. Call `ajApi.protect()` (or another Arcjet client) in the controller
4. Use `requireAuth()` for protected endpoints

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
