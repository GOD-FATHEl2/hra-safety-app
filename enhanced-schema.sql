-- Enhanced Database Schema with Improvements
-- File: enhanced-schema.sql

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 1000;
PRAGMA temp_store = memory;

-- Users table with enhanced security
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  passhash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('underhall','supervisor','superintendent','admin')),
  active INTEGER NOT NULL DEFAULT 1,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TEXT,
  last_login TEXT,
  password_changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Enhanced assessments table
CREATE TABLE IF NOT EXISTS assessments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Basic info
  date TEXT NOT NULL,
  worker_name TEXT NOT NULL,
  worker_email TEXT,
  team TEXT,
  location TEXT,
  task TEXT NOT NULL,
  
  -- Risk assessment
  risk_s INTEGER NOT NULL CHECK(risk_s BETWEEN 1 AND 5),
  risk_k INTEGER NOT NULL CHECK(risk_k BETWEEN 1 AND 5),
  risk_score INTEGER NOT NULL,
  risks TEXT,
  
  -- Checklist and actions
  checklist TEXT NOT NULL, -- JSON array
  actions TEXT,
  further TEXT CHECK(further IN ('Ja', 'Nej')),
  fullrisk TEXT CHECK(fullrisk IN ('Ja', 'Nej')),
  
  -- Approval workflow
  safe TEXT CHECK(safe IN ('Ja', 'Nej')),
  leader TEXT,
  signature TEXT,
  requires_leader INTEGER NOT NULL DEFAULT 0,
  leader_provided INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  -- Status and approval
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK(status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Archived')),
  approved_by INTEGER REFERENCES users(id),
  approved_at TEXT,
  rejected_by INTEGER REFERENCES users(id),
  rejected_at TEXT,
  rejection_reason TEXT,
  
  -- Document management
  pdf_generated INTEGER DEFAULT 0,
  sharepoint_uploaded INTEGER DEFAULT 0,
  sharepoint_url TEXT,
  
  -- Archival
  archivable_after TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  archived_by INTEGER REFERENCES users(id)
);

-- Audit log for compliance
CREATE TABLE IF NOT EXISTS audit_log(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  changed_by INTEGER REFERENCES users(id),
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT
);

-- Attachments table for file uploads
CREATE TABLE IF NOT EXISTS attachments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Session management
CREATE TABLE IF NOT EXISTS user_sessions(
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assess_created ON assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_assess_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assess_created_by ON assessments(created_by);
CREATE INDEX IF NOT EXISTS idx_assess_risk_score ON assessments(risk_score);
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_timestamp 
  AFTER UPDATE ON users
  BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER update_assessments_timestamp 
  AFTER UPDATE ON assessments
  BEGIN
    UPDATE assessments SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

-- Views for common queries
CREATE VIEW IF NOT EXISTS assessment_summary AS
SELECT 
  a.id,
  a.date,
  a.worker_name,
  a.location,
  a.task,
  a.risk_score,
  a.status,
  a.created_at,
  u.name as created_by_name,
  approver.name as approved_by_name,
  a.approved_at
FROM assessments a
JOIN users u ON a.created_by = u.id
LEFT JOIN users approver ON a.approved_by = approver.id
WHERE a.archived = 0;

CREATE VIEW IF NOT EXISTS risk_statistics AS
SELECT 
  DATE(created_at) as assessment_date,
  COUNT(*) as total_assessments,
  SUM(CASE WHEN risk_score <= 4 THEN 1 ELSE 0 END) as low_risk,
  SUM(CASE WHEN risk_score BETWEEN 5 AND 9 THEN 1 ELSE 0 END) as medium_risk,
  SUM(CASE WHEN risk_score >= 10 THEN 1 ELSE 0 END) as high_risk,
  AVG(risk_score) as avg_risk_score
FROM assessments 
WHERE archived = 0
GROUP BY DATE(created_at)
ORDER BY assessment_date DESC;