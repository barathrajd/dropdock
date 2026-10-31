# AGENTS.md — DropDock workspace

Workspace: `/Users/barathrajdevarajan/Developer/OpenSource/dropdock`
Type: Turborepo Monorepo managed with **Bun** (`bun.lock` / `package.json` workspaces).

## Architecture
- `apps/web`: React 19 + Base UI + Tailwind CSS frontend
- `apps/api`: Bun + Hono high-performance backend, `bun:sqlite` with Drizzle ORM
- `packages/storage`: Multi-provider storage contracts (`StorageProvider`) & S3/R2/MinIO adapters

## Current Plan
- **Master plan tracker:** `PLAN.md`
- **Active feature spec:** `plans/open-file-upload.md`

## Standing Rules
1. Never commit or push to git without explicit user instruction.
2. Package manager is **Bun** (`bun install`, `bun run`, `bun dev`).
3. Keep storage credentials encrypted with AES-256-GCM in local `bun:sqlite`.
4. Upload payload bytes must always flow directly from browser to storage target (presigned PUT); never proxy file bytes through the backend.
