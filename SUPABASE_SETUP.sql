-- =============================================================================
-- AJAIA DOCS — Supabase Setup SQL
-- Run this in your Supabase project's SQL Editor (Dashboard → SQL Editor).
--
-- IMPORTANT: This assessment uses MOCK USERS, not Supabase Auth.
-- Application-level access control is enforced in the server routes.
-- RLS policies below are intentionally permissive for the anon role so that
-- the server-side Supabase client (using the anon key) can perform all operations.
-- DO NOT enable Supabase Auth without redesigning the access layer.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. documents table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL DEFAULT 'Untitled Document',
  content    jsonb,
  owner_id   text NOT NULL,          -- mock user id: "user-1", "user-2", "user-3"
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. document_shares table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_shares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id     text NOT NULL,         -- mock user id
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, user_id)      -- prevents duplicate shares
);

-- ---------------------------------------------------------------------------
-- 3. Enable Row Level Security (required to apply policies)
-- ---------------------------------------------------------------------------
ALTER TABLE documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. Drop any existing policies before recreating (idempotent re-run)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_documents"  ON documents;
DROP POLICY IF EXISTS "anon_insert_documents"  ON documents;
DROP POLICY IF EXISTS "anon_update_documents"  ON documents;
DROP POLICY IF EXISTS "anon_delete_documents"  ON documents;

DROP POLICY IF EXISTS "anon_select_shares"     ON document_shares;
DROP POLICY IF EXISTS "anon_insert_shares"     ON document_shares;
DROP POLICY IF EXISTS "anon_delete_shares"     ON document_shares;

-- ---------------------------------------------------------------------------
-- 5. documents: permissive anon policies
--    (application-level enforcement handles ownership/sharing checks)
-- ---------------------------------------------------------------------------
CREATE POLICY "anon_select_documents"
  ON documents FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_documents"
  ON documents FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_documents"
  ON documents FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_documents"
  ON documents FOR DELETE
  TO anon
  USING (true);

-- ---------------------------------------------------------------------------
-- 6. document_shares: permissive anon policies
-- ---------------------------------------------------------------------------
CREATE POLICY "anon_select_shares"
  ON document_shares FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_shares"
  ON document_shares FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_delete_shares"
  ON document_shares FOR DELETE
  TO anon
  USING (true);

-- ---------------------------------------------------------------------------
-- 7. Performance indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_documents_owner_id
  ON documents(owner_id);

CREATE INDEX IF NOT EXISTS idx_documents_updated_at
  ON documents(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_shares_document_id
  ON document_shares(document_id);

CREATE INDEX IF NOT EXISTS idx_shares_user_id
  ON document_shares(user_id);

-- ---------------------------------------------------------------------------
-- END — Verify with:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public';
-- ---------------------------------------------------------------------------
