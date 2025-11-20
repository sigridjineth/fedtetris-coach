-- kv_entries (L1 Cache)
CREATE TABLE IF NOT EXISTS kv_entries (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  model_id TEXT NOT NULL,
  ttl_at INTEGER,
  created_at INTEGER,
  updated_at INTEGER
);

-- episodes (Game Logs)
CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  wallet TEXT,
  start_at INTEGER,
  end_at INTEGER,
  score INTEGER,
  lines_cleared INTEGER,
  meta_json TEXT
);

-- steps (Detailed Replay)
CREATE TABLE IF NOT EXISTS steps (
  episode_id TEXT,
  seq INTEGER,
  state_key TEXT,
  action TEXT,
  score_delta REAL,
  PRIMARY KEY (episode_id, seq)
);

-- snapshots (L2 Index - Strategy Snapshots)
CREATE TABLE IF NOT EXISTS snapshots (
  cid TEXT PRIMARY KEY,
  owner TEXT,
  rules_json TEXT,         -- fingerprint rules
  policy_json TEXT,        -- policy content
  summary TEXT,            -- strategy summary
  created_at INTEGER
);
