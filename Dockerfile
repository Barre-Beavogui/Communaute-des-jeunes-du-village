FROM node:22-slim AS builder

WORKDIR /app
RUN npm install --global pnpm@11.19.0

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build:api

FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000

COPY --from=builder /app/artifacts/api-server/dist ./dist

EXPOSE 10000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
