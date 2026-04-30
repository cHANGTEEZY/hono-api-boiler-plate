# syntax=docker/dockerfile:1

# Match your local Bun major if you hit runtime issues: https://hub.docker.com/r/oven/bun/tags
ARG BUN_VERSION=1

FROM oven/bun:${BUN_VERSION} AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY src ./src
# sharp uses native .node binaries + bundled libvips (.so); keep it external so
# node_modules stays the source of truth at runtime (see sharp install docs).
RUN bun build ./src/server.ts --outdir ./dist --target=bun --external sharp

FROM oven/bun:${BUN_VERSION}-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=builder --chown=bun:bun /app/dist/server.js ./server.js

USER bun
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:' + (process.env.PORT || '3000') + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "server.js"]
