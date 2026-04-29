# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/mobile` — Expo mobile app for Books and Brews, a premium dark CRM dashboard for web-development leads using the shared API server.
- `artifacts/api-server` — Express API server now includes lead dashboard, list, detail, and update endpoints under `/api`.

## Recent Changes

- Added a client activity notification feed backed by a new `/api/client/notifications` endpoint that aggregates project, message, invoice, file, and support activity.
- Client portal now includes an Activity tab, notification fallback data, a home shortcut, and a new-activity metric sourced from the API client.
- Books and Brews mobile CRM now includes an admin access/onboarding gate, four-tab CRM navigation, advanced lead filters/sorting, quote request and contact inquiry queues, richer lead dossiers with timeline history, follow-up dates, quick email/call actions, and status update flow.
- Lead API records now include `followUpDate` and `activityTimeline` fields, and updates append timeline events for better CRM audit context.
- Admin demo credentials were updated per request; the API keeps development-only demo auth fallback users available when no local database is provisioned.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
