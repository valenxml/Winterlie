# Build the API from the monorepo root. Back4App detects this file automatically at the repository root.

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
# Prisma reads these at generate time, but no connection is made. Placeholders are enough.
ENV DATABASE_URL=postgresql://placeholder@localhost:5432/placeholder
ENV DIRECT_URL=postgresql://placeholder@localhost:5432/placeholder
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workshop/database generate
RUN pnpm --filter @workshop/validators build \
 && pnpm --filter @workshop/design-schema build \
 && pnpm --filter @workshop/api build

FROM node:22-alpine
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
EXPOSE 4000
# Apply pending migrations, then start. Real values come from the platform's environment variables.
CMD ["sh", "-c", "pnpm --filter @workshop/database migrate:deploy && node dist/main.js"]
