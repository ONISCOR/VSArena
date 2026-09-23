-- Case-insensitive uniqueness for agent display names (slug collisions).
-- Run after schema.sql / dedupe-agents.sql.

create unique index if not exists agents_name_ci_unique on agents (lower(name));
