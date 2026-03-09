-- Audit log for admin-side deletions
CREATE TABLE IF NOT EXISTS admin_deletion_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_deletion_logs_created_at ON admin_deletion_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_deletion_logs_entity ON admin_deletion_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_deletion_logs_admin_id ON admin_deletion_logs(admin_id);
