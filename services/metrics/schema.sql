-- No event log, visitor identity, names, paths, IP addresses, or audio metadata.
CREATE TABLE IF NOT EXISTS daily_counters (
  day TEXT NOT NULL,
  environment TEXT NOT NULL CHECK(environment IN ('production','test')),
  event TEXT NOT NULL,
  group_name TEXT NOT NULL,
  outcome TEXT NOT NULL,
  language TEXT NOT NULL CHECK(language IN ('zh','en')),
  count INTEGER NOT NULL CHECK(count > 0),
  PRIMARY KEY(day, environment, event, group_name, outcome, language)
) WITHOUT ROWID;
