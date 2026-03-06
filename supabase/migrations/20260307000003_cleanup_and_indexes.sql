-- ─── Cleanup Functions ──────────────────────────────────
-- These can be called periodically via Supabase Edge Functions, cron, or manually.

-- Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  DELETE FROM admin_sessions WHERE expires_at < now();
  RETURN deleted_count;
END;
$$;

-- Clean up used/expired password reset tokens
CREATE OR REPLACE FUNCTION cleanup_password_reset_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM password_reset_tokens WHERE used = 1 OR expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Purge old product views (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_product_views(_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM product_views WHERE created_at < now() - (_days || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Purge old search history (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_search_history(_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM search_history WHERE created_at < now() - (_days || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Master cleanup: call all cleanup functions at once
CREATE OR REPLACE FUNCTION run_all_cleanup()
RETURNS TABLE(sessions_cleaned INTEGER, tokens_cleaned INTEGER, views_cleaned INTEGER, searches_cleaned INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  sessions_cleaned := cleanup_expired_sessions();
  tokens_cleaned := cleanup_password_reset_tokens();
  views_cleaned := cleanup_old_product_views(90);
  searches_cleaned := cleanup_old_search_history(90);
  RETURN NEXT;
END;
$$;

-- ─── Indexes for cleanup performance ────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_product_views_created_at ON product_views(created_at);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);
