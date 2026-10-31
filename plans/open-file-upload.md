# Open File Upload — Multi-Destination Storage Manager

## Objective
Build a modern, lightweight, open-source file uploader and media browser at `/Users/barathrajdevarajan/Developer/OpenSource/fileupload` inspired by Openship's destination model. It empowers developers and teams to register multiple S3-compatible storage accounts (AWS S3, Cloudflare R2, MinIO, Wasabi, Backblaze B2), verify connections, upload video/image/any files directly via presigned URLs into custom typed folder paths, and browse/preview media inline without enterprise bloat.

## Success criteria
- Project initialized at `/Users/barathrajdevarajan/Developer/OpenSource/fileupload` using Bun workspace layout: `apps/web` (TanStack Start / React 19 + Tailwind CSS) and `apps/api` (Bun + Hono).
- Storage destinations CRUD operational with encrypted credentials stored in an embedded SQLite database using `bun:sqlite` and Drizzle ORM.
- One-click "Verify Connection" action successfully tests read/write permissions against registered S3/R2/MinIO buckets and displays visual status (Verified / Failed).
- Direct browser-to-storage presigned PUT upload with live progress bar for videos, images, and documents without routing file payloads through the backend server.
- Interactive folder path navigation where users can type a custom path prefix (e.g. `videos/tutorials/` or `assets/2026/`) before uploading.
- Media browser listing objects under selected prefixes with inline image lightbox, HTML5 video player, file download links, and deletion.
- Modular `StorageProvider` TypeScript interface enabling future non-S3 storage adapters (e.g. Google Cloud Storage, Azure Blob, Supabase) without touching frontend or routing code.

## In scope / Out of scope
### In scope
- Storage Destination Management: Add, edit, test/verify, set default, and delete storage destinations.
- S3-compatible adapter: AWS S3, Cloudflare R2, MinIO, Backblaze B2, and Wasabi (custom endpoint, region, bucket, credentials, path prefix, and public CDN base URL).
- Local embedded credential persistence: AES-256-GCM encrypted secret keys in `bun:sqlite` via Drizzle ORM.
- Presigned Direct Uploads: Single and multi-file uploads with progress tracking and MIME-type detection.
- Path Prefix Control: Text input for destination directory path prefix before dropping/selecting files.
- Media Explorer: Breadcrumb navigation, file list/grid with file size, modified date, inline image preview, and inline video player.
- Developer experience: Fast dev startup with `bun run dev` and type-safe RPC/API routes.

### Out of scope
- Multi-tenant user login, signup, JWT sessions, or team permission roles (single-tenant / local network self-hosted tool).
- Server-side file transcoding or video compression (raw file preservation).
- Background automated folder sync or rsync daemon capabilities.
- Paid billing, stripe integration, or cloud hosting coordination.

## Approach
The application employs a clean decoupled architecture in a Bun workspace:
1. **Backend (`apps/api`):** Powered by **Bun + Hono**. Uses Drizzle ORM on top of native `bun:sqlite` for zero-configuration, lightning-fast local storage of destination settings and encrypted secrets. Exposes clean REST endpoints for destination management, connection verification, presigned PUT/GET generation, and object listing.
2. **Extensible Storage Architecture (`packages/storage` or `lib/storage`):** An abstract `StorageProvider` interface contracts `verifyConnection()`, `createPresignedPutUrl()`, `createPresignedGetUrl()`, `listFiles()`, and `deleteFile()`. The initial `S3StorageProvider` uses `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` supporting any S3-compliant target.
3. **Frontend (`apps/web`):** Powered by **TanStack Start** (React 19 + TanStack Router + Vite + Tailwind CSS). Features an Openship-inspired Destination switcher, connection status badge, folder path text field, drag-and-drop dropzone, and responsive media grid with instant video playback and image previews.

## Milestones
- [x] **M1: Monorepo Scaffold & Embedded Data Layer** — Initialize `/Users/barathrajdevarajan/Developer/OpenSource/fileupload` with Bun workspace, Hono backend, and Drizzle ORM with `bun:sqlite` schema for encrypted storage destinations.
- [x] **M2: Storage Provider Engine & Connection Verification** — Implement `StorageProvider` contract and `S3StorageProvider` adapter; implement `POST /api/destinations` and `POST /api/destinations/:id/verify`.
- [x] **M3: Presigned Direct-to-Storage Upload API** — Build `POST /api/destinations/:id/presign-upload` and `DELETE /api/destinations/:id/files` endpoints with path prefix validation.
- [x] **M4: TanStack Start Frontend & Destination Manager** — Build frontend shell with TanStack Router, Destination list/modal (S3, R2, MinIO), and real-time connectivity test button.
- [x] **M5: Uploader UI with Typed Path & Progress Bar** — Build drag-and-drop file uploader with custom destination path text input, direct S3 upload via Axios/Fetch, and progress indicator.
- [x] **M6: Media Browser & Inline Video/Image Previews** — Implement file explorer view with folder breadcrumbs, image lightbox preview, HTML5 video player, download triggers, and file deletion.

## Risks & open questions
- **Risk: S3 CORS Configuration:** Direct browser-to-S3 uploads fail if bucket lacks CORS permissions.  
  *Fallback:* The connection verification step inspects or tests CORS/preflight requirements and provides clear copy-paste CORS JSON rules in the UI.
- **Risk: Large Video Uploads (>5GB):** Standard S3 single PUT is limited to 5GB.  
  *Fallback:* Support single PUT for files up to 5GB in the initial slice; design presigned API to allow multi-part presigned URLs in subsequent iteration.
- **Risk: Video streaming latency on private buckets:** Large video playback from private S3 requires range requests.  
  *Fallback:* Support public base URLs (e.g. Cloudflare CDN) for public buckets, and generate presigned GET URLs with `Accept-Ranges` support for private buckets.

## Boundaries
- Do not add external cloud database requirements (Postgres/MySQL) — must run completely zero-config with `bun:sqlite`.
- Do not route file upload binary data through the Hono server — all payload bytes travel straight from browser to storage target.
- Do not modify existing GokulDigital application code or configurations.
