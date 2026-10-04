-- Admin password reset tokens.
-- Only a SHA-256 hash of each token is stored, so a database leak can't be used
-- to take over an admin account. Tokens are single-use and short-lived.

CREATE TABLE IF NOT EXISTS admin_password_reset_tokens (
	token_hash TEXT PRIMARY KEY,
	admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
	expires_at TIMESTAMPTZ NOT NULL,
	used_at TIMESTAMPTZ,
	requested_ip TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_reset_tokens_admin ON admin_password_reset_tokens(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_reset_tokens_expires ON admin_password_reset_tokens(expires_at);

-- Only the server (service role, which bypasses RLS) may touch this table.
ALTER TABLE admin_password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Admin sessions should go away with their admin, so a reset can clear them all.
ALTER TABLE admin_sessions DROP CONSTRAINT IF EXISTS admin_sessions_admin_id_fkey;
ALTER TABLE admin_sessions
	ADD CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE;
