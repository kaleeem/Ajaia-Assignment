# Ajaia Docs

A lightweight collaborative document editor built for the Ajaia AI-Native Full Stack Developer Assessment.

**Live Deployment**: [https://ajaia-assignment-web-vk87.vercel.app/welcome](https://ajaia-assignment-web-vk87.vercel.app/welcome)

## Overview

Ajaia Docs supports creating, renaming, editing, persisting, importing, owning, and sharing rich-text documents between seeded users. The application uses Tiptap for rich-text editing, Supabase/PostgreSQL for persistence, and Next.js App Router for the web interface.

This is an assessment implementation, not a production-ready Google Docs equivalent.

## Features

- Create documents
- Rename documents
- Rich-text editing (bold, italic, underline, headings, lists)
- Slash-command menu and formatting controls
- Debounced autosave (~1 second)
- Persistence across reload/reopen
- Supabase/PostgreSQL persistence
- Owned documents view
- Shared documents view
- Seeded user switching (sidebar)
- Document sharing (owner-only)
- Shared-user editing
- TXT/Markdown file import
- Owner-only delete and share actions
- Basic application-level access control

## Tech Stack

- Next.js 15 (App Router)
- React 18
- TypeScript
- Tiptap (rich-text editor)
- Supabase / PostgreSQL
- Tailwind CSS
- Turborepo + pnpm workspaces
- Vitest

## Project Structure

```
ajaia-docs/
  apps/web/                  # Next.js application
    app/
      api/documents/         # Document CRUD + sharing routes
      dashboard/             # Dashboard page
      documents/[id]/        # Editor page
      layout.tsx             # Root layout
    components/
      dashboard/             # Dashboard header, sidebar, document cards
      document/editor-shell.tsx  # Autosave, sharing, save status
      tailwind/
        advanced-editor.tsx  # Tiptap editor wrapper
        ui/                  # Radix UI primitives
    lib/
      supabase/              # Server/client Supabase clients
      content.ts             # emptyEditorContent
      documents.ts           # Server-side data access
      documents-client.ts    # Client-side data access
      access.ts              # Application-level access rules
      access.test.ts         # Vitest tests
      import.ts              # TXT/MD to Tiptap conversion
      types.ts               # Document, DocumentRow types
      users.ts               # Seeded mock users
    package.json
  packages/headless/         # Novel/Tiptap headless editor package
    src/
    package.json
  package.json               # Turborepo root
  pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9.5.0
- A Supabase project

### Install

```bash
cd ajaia-docs
pnpm install
```

### Environment Variables

Create `apps/web/.env.local` (do not commit this file):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Do not commit `.env.local`.**

### Database Setup

Run the following SQL in your Supabase project SQL Editor to create the required tables:

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Document',
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  owner_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  unique(document_id, user_id)
);

create index idx_documents_owner_id on documents(owner_id);
create index idx_document_shares_document_id on document_shares(document_id);
create index idx_document_shares_user_id on document_shares(user_id);
```

The permissive anon RLS policy is intentional for the seeded/mock-user assessment implementation and is **not** production authorization. For production, use Supabase Auth with `auth.uid()`-based RLS policies.

### Run Locally

```bash
cd ajaia-docs
pnpm dev
```

The app is available at `http://localhost:3000`.

## Demo Users

The sidebar user switcher simulates authentication for assessment/demo purposes. No passwords are required.

| Name | ID | Email |
|------|----|-------|
| Kaleem | user-1 | kaleem@ajaia.demo |
| Sarah Chen | user-2 | sarah@ajaia.demo |
| Marcus Webb | user-3 | marcus@ajaia.demo |

## Quick Reviewer Test

1. Select **Kaleem** from the sidebar.
2. Click **New Document**.
3. Type a title and some rich text (bold, heading, list).
4. Wait for the **Saved** badge.
5. Open the **Share** dialog and share with **Sarah Chen**.
6. Switch to **Sarah Chen** in the sidebar.
7. Open the document under **Shared With Me**.
8. Edit and save — verify the **Saved** badge appears.
9. Switch back to **Kaleem** and confirm changes persisted.
10. Try **Import** with a `.txt` or `.md` file.

## Testing

```bash
cd ajaia-docs/apps/web
pnpm test
```

8 automated access-control and business-logic tests currently pass.

## Production Build

```bash
cd ajaia-docs
pnpm build
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md).

## AI-Native Workflow

See [AI_WORKFLOW.md](./AI_WORKFLOW.md).

## Known Limitations

- Seeded/mock identities — not real authentication
- App-level authorization demonstration rather than production-grade security
- Permissive assessment RLS (no Supabase Auth integration)
- No real-time simultaneous cursor collaboration
- No comments or version history
- TXT/Markdown import only (no DOCX)

## Attribution

The rich-text editor foundation and headless components were adapted from the open-source [Novel](https://novel.sh) Tiptap ecosystem. The `packages/headless` workspace preserves upstream attribution and licensing as required. See `packages/headless/package.json` and the root `LICENSE` file.
