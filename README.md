# DropDock — Multi-Destination Cloud Storage Manager

A modern, lightweight, open-source file uploader and media browser inspired by Openship's destination model. Register multiple S3-compatible accounts (AWS S3, Cloudflare R2, MinIO, Wasabi, Backblaze B2), verify connectivity with one click, upload videos/images/documents directly via presigned PUT URLs to custom folder paths, and browse media with inline video playback and image lightbox previews.

## Architecture

- **`apps/web`**: React 19 frontend built with **Base UI** (`@base-ui/react`), **Tailwind CSS**, and Vite.
- **`apps/api`**: Ultra-fast **Bun + Hono** backend with zero-config embedded SQLite via **`bun:sqlite`** and **Drizzle ORM** storing encrypted credentials (AES-256-GCM).
- **`packages/storage`**: Modular `StorageProvider` interface and `S3StorageProvider` supporting any S3-compliant target.
- **Monorepo**: Managed via **Turborepo** (`turbo.json`) and **Bun** workspaces.

## Features

1. **Multi-Destination Storage**: Register multiple accounts (AWS S3, Cloudflare R2, MinIO, Custom S3).
2. **Encrypted Credentials**: Secrets are encrypted at rest with AES-256-GCM in local SQLite (`data/dropdock.db`).
3. **One-Click Connectivity Verification**: Test connection and latency against any destination on demand.
4. **Custom Typed Folder Paths**: Type your destination directory prefix (e.g. `videos/tutorials/` or `marketing/banners/`) before dropping files.
5. **Direct Browser-to-Storage Uploads**: Presigned PUT URLs ensure multi-gigabyte videos and media stream straight to S3/R2/MinIO without touching the API server.
6. **Live Progress Bars**: Real-time upload percentage tracking per file.
7. **Media Browser & Previews**:
   - Breadcrumb directory navigation
   - Search and media-type filters (All, Videos, Images, Documents)
   - Inline HTML5 video player with standard controls
   - Inline image lightbox preview
   - Presigned download triggers (`Content-Disposition: attachment`)
   - Permanent file deletion

## Quick Start

### 1. Install dependencies
```bash
bun install
```

### 2. Run the monorepo in development
```bash
bun run dev
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001` (proxied via Vite `/api`)

### 3. Run tests and typechecks
```bash
# Run unit and integration tests across all workspaces
bun test

# Run TypeScript checks across all workspaces
bun run check

# Build production bundles
bun run build
```
