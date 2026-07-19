# Ajaia Docs — Submission

## Candidate

Kaleem M.

## Project

Ajaia Docs is a collaborative rich-text document editor built with Next.js, Tiptap, and Supabase. It supports creating, editing, persisting, importing, owning, and sharing documents between multiple users.

## Links

- GitHub Repository: [ADD LINK]
- Live Application: [ADD LINK]
- Walkthrough Video: [ADD LINK]
- Google Drive Submission Folder: [ADD LINK]

## Included Deliverables

- Source code
- `README.md`
- `ARCHITECTURE.md`
- `AI_WORKFLOW.md`
- `SUBMISSION.md`
- `LICENSE`
- Automated tests (`apps/web/lib/access.test.ts`)
- Walkthrough video (external / Drive link above)
- Screenshots (if included in Drive folder)

## Quick Reviewer Evaluation Path

1. Open the live application or run locally with `pnpm dev`.
2. Select **Kaleem** from the sidebar.
3. Click **New Document**, enter a title, and type some formatted text.
4. Wait for the **Saved** badge.
5. Open **Share** and select **Sarah Chen**.
6. Switch to **Sarah Chen** in the sidebar.
7. Open the document under **Shared With Me**.
8. Edit and save — verify persistence.
9. Switch back to **Kaleem** and confirm changes.
10. Test **Import** with a `.txt` or `.md` file.

## Demo Users

| Name | ID | Email |
|------|----|-------|
| Kaleem | user-1 | kaleem@ajaia.demo |
| Sarah Chen | user-2 | sarah@ajaia.demo |
| Marcus Webb | user-3 | marcus@ajaia.demo |

No credentials or passwords are needed. These are seeded mock identities selected from the sidebar.

## Verified Functionality

- [x] Create document
- [x] Rename document
- [x] Rich-text editing
- [x] Bold / italic / underline / headings / lists
- [x] Slash-command menu
- [x] Debounced autosave
- [x] Persistence after refresh
- [x] Reopen saved document
- [x] User switching
- [x] Ownership display
- [x] Owned / Shared filtering
- [x] Sharing (owner-only)
- [x] Shared-user editing
- [x] Cross-user persistence
- [x] Unauthorized-user isolation
- [x] TXT / Markdown import
- [x] Owner-only delete
- [x] Automated tests
- [x] Production build

## Automated Verification

| Check | Command | Result |
|-------|---------|--------|
| TypeScript typecheck | `pnpm typecheck` | PASS |
| Automated tests | `pnpm test` | 8/8 PASS |
| Production build | `pnpm build` | PASS |

## Known Limitations

- Seeded/mock identities — not real authentication
- App-level authorization demonstration rather than production-grade security
- Permissive assessment RLS (no Supabase Auth integration)
- No real-time simultaneous cursor collaboration
- No comments or version history
- TXT/Markdown import only (no DOCX)

## What I Would Build With Another 2–4 Hours

1. Supabase Auth + strict `auth.uid()`-based RLS
2. Stronger integration / E2E test coverage
3. Deployment / observability hardening
4. UX / performance polish (virtualized long documents, image optimization)
5. One collaboration enhancement (presence indicators or comments)

## Final Note

The scope was deliberately focused on core document behavior (create, edit, persist, share, access control) rather than stretching into authentication infrastructure, real-time collaboration, or advanced import formats. This kept the assessment time focused on demonstrating product and engineering quality within the constraints given.
