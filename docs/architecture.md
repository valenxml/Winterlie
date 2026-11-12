# Architecture (Phase 1 status)

Modular monolith, pnpm monorepo. See the root spec for the full target structure.

| Package | Status | Verified |
|---|---|---|
| `packages/validators` | Done: project DTOs, DesignForge brief | typecheck + 3 tests |
| `packages/design-schema` | Done: tokens, 15 section types, spec validation, immutable edit operations | typecheck + 9 tests |
| `packages/database` | Prisma schema for Phase 1 entities | NOT yet validated (needs `pnpm install`) |
| `apps/api` | Written: projects CRUD (workspace-scoped), AI provider layer (mock + Anthropic adapter), dev auth bypass | 9 pure tests pass in sandbox; Nest/Prisma typecheck pending your `pnpm install` + `prisma generate` |
| `apps/web` | Written: Next.js shell, Dashboard (live API health), Projects list + create | Not yet built; verify with `pnpm --filter @workshop/web build` on your machine |

## DesignForge security model
AI output is untrusted. The design spec is plain data: text rejects `<`/`>`, links must be
`#anchor`, `/path`, http(s) or mailto, images are placeholders or stored asset ids, fonts come
from an allowlist. Section types are a closed union; there is no HTML or JS field. Every edit
(`replaceSection`, `moveSection`, `addSection`, `removeSection`) re-validates the whole spec.

## Local setup
    pnpm install && cp .env.example .env && pnpm db:up
    pnpm --filter @workshop/database migrate:dev
    pnpm typecheck && pnpm test

## API notes
- Projects are scoped through workspace membership. Foreign IDs return 404, never 403.
- `CurrentUser` reads `x-dev-user-id` only when `AUTH_DEV_BYPASS=true` and `NODE_ENV` is not production. This is temporary and must be replaced by real session auth.
- AI provider defaults to `mock`. Set `AI_DEFAULT_PROVIDER=anthropic` and `ANTHROPIC_API_KEY` to switch.
- Before API typecheck: `pnpm --filter @workshop/database generate` (Prisma client types).

## Design direction (Winterlie)
Light lavender surfaces, one violet accent (#6D4AFF), white cards with soft shadows, dark pill CTA, sidebar navigation, bold headings with the accent on one key word. Tokens live in apps/web/app/globals.css. Reference screenshots inspire the look only; no assets or copy are reused.
