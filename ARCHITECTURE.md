# Ajaia Docs — Architecture

## 1. System Overview

The application follows a standard Next.js full-stack pattern:

```
User (browser)
  → Next.js Dashboard / Editor pages
    → Server Components (data fetch)
    → Client Components (interaction)
      → API Route Handlers (mutations)
        → Supabase PostgreSQL
```

Tiptap is the rich-text editor. Document content is stored as Tiptap JSON in a JSONB column.

## 2. Main Components

| Component | Path | Responsibility |
|-----------|------|----------------|
| Dashboard | `apps/web/app/dashboard/page.tsx` | Server component listing owned + shared documents |
| Document Editor | `apps/web/app/documents/[id]/page.tsx` | Server component loading document + owner, passing to editor shell |
| Editor Shell | `apps/web/components/document/editor-shell.tsx` | Client component managing title editing, debounced autosave, share dialog, save status |
| Advanced Editor | `apps/web/components/tailwind/advanced-editor.tsx` | Tiptap wrapper with formatting toolbar, slash commands, image upload |
| API Routes | `apps/web/app/api/documents/` | CRUD + sharing endpoints |
| Data Layer | `apps/web/lib/documents.ts` | Server-side Supabase queries |
| Access Control | `apps/web/lib/access.ts` | Pure application-level role resolution |
| Mock Users | `apps/web/lib/users.ts` | Seeded user identities for assessment |
| Headless Package | `packages/headless/` | Novel/Tiptap editor primitives |

## 3. Data Model

### `documents`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `uuid` | Primary key |
| `title` | `text` | Document title |
| `content` | `jsonb` | Tiptap JSON document structure |
| `owner_id` | `text` | Mock user ID of the owner |
| `created_at` | `timestamptz` | Creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |

`content` uses JSONB because Tiptap natively produces and consumes JSON. Storing JSON preserves formatting, nodes, marks, and extensions without serialization loss.

### `document_shares`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `uuid` | Primary key |
| `document_id` | `uuid` | Foreign key to `documents.id` |
| `user_id` | `text` | Mock user ID granted access |
| `created_at` | `timestamptz` | Grant timestamp |

Unique constraint on `(document_id, user_id)` prevents duplicate shares.

## 4. Document Lifecycle

1. **Create**: User clicks New Document → `POST /api/documents` → `createDocument()` inserts row in Supabase with `emptyEditorContent` → real UUID returned → client navigates to `/documents/{id}`.
2. **Edit**: Server page loads document via `getDocument()` → passes `initialTitle`, `initialContent`, `ownerId` to `EditorShell` → `TailwindAdvancedEditor` renders Tiptap with initial content.
3. **Autosave**: Tiptap `onUpdate` fires → `editor.getJSON()` → debounced callback (~1s) → `PATCH /api/documents/{id}` → `updateDocument()` updates Supabase row.
4. **Share**: Owner opens Share dialog → `POST /api/documents/{id}/shares` → `grantShare()` inserts `document_shares` row.
5. **Reopen**: Dashboard reloads documents from Supabase; shared docs appear under "Shared With Me."

## 5. Autosave Design

The editor uses a ~1 second debounced autosave. On every Tiptap content change:

- The latest JSON is stored in a ref.
- A save is scheduled after 1 second of inactivity.
- In-flight saves are aborted if superseded by newer changes (AbortController).
- On page unload, a `keepalive` request flushes pending saves.

This avoids a database request per keystroke while keeping the UX responsive.

## 6. Ownership and Sharing

- **Owner**: read, edit, share, delete.
- **Shared user**: read, edit. Cannot share or delete.
- **Unshared user**: no normal application access (application-level access control returns 404).

Ownership is determined by `owner_id` on the `documents` row. Sharing is tracked via `document_shares`.

## 7. Mock Identity Decision

The assignment explicitly allowed seeded/mock users. This choice keeps the assessment focused on demonstrating ownership, sharing, and product behavior instead of spending time on signup, OAuth, and session flows.

The "current user" is a client-side selection stored in a cookie, propagated via route handlers. There are no passwords, no OAuth, and no Supabase Auth.

This is not production authentication.

## 8. File Import

Supported formats: `.txt`, `.md`, `.markdown`.

1. User selects a file via the sidebar import button.
2. Client reads the file text.
3. `textToTiptapContent()` converts plain text / simple Markdown headings into valid Tiptap JSON.
4. `createDocument()` persists the new document with the importing user as owner.
5. Client navigates to the new document.

## 9. Access Control

Application-level enforcement is implemented in `apps/web/lib/access.ts`:

- `resolveAccess()` returns `"owner"`, `"shared"`, or `"none"`.
- `canRead()`, `canEdit()`, `canShare()`, `canDelete()` gate UI actions.
- API routes double-check access server-side via `getDocumentForUser()`.

Database RLS is intentionally permissive because no real Supabase Auth is used in this assessment.

**Production design** would use Supabase Auth + `auth.uid()`-based RLS policies on both tables.

## 10. Key Engineering Decisions

- **Tiptap**: Chosen over building a custom rich-text editor. Provides proven extension ecosystem (slash commands, images, code blocks, math).
- **JSONB content**: Tiptap JSON survives reload and preserves full document structure without custom serialization.
- **Supabase**: Fastest path to PostgreSQL persistence for the assessment scope.
- **Mock users**: Deliberate scope cut to focus on product behavior rather than auth infrastructure.
- **Debounced autosave**: Balances UX responsiveness with database load.
- **TXT/MD import only**: Sufficient for assessment; DOCX requires heavier dependencies.
- **No realtime/comments/version history**: Out of scope for the core assignment.

## 11. What I Would Build Next

1. Supabase Auth + strict `auth.uid()`-based RLS
2. Stronger integration/E2E test coverage
3. Real-time collaboration / presence (Tiptap + Liveblocks or similar)
4. Comments and version history if product required
5. Expanded import/export (DOCX, PDF preview)
6. UX/performance hardening (virtualized long documents, image optimization)
