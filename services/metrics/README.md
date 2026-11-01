# Minimal audio task counters

Maintainer: Codex, 2026-11-01. The main site remains on GitHub Pages. This independent Cloudflare Worker accepts small fixed-enum events and immediately increments daily D1 aggregates. It has no public stats/admin endpoint.

## Stored fields and meaning

`day` (server UTC date), `environment` (`production` or `test`), `event`, `group_name`, `outcome`, `language`, and `count` only. No per-event log, audio, filenames, paths, metadata, artwork, raw exception text, user IDs, IPs or user agents in this table. Cloudflare still handles connection data and platform diagnostics under its own policies. Sampled diagnostic logs/traces are configured with query redaction and invocation logging disabled; application errors contain a fixed enum only.

- `process_finished`: one terminal result per admitted file attempt, including invalid input and cancellation. Group is derived locally from the extension: ordinary/special/existing_mp3/unknown. This is not a confirmed codec or a unique person.
- `download_triggered`: single/zip browser download handoff, not proof the file was saved.
- `zip_failed`: a failed ZIP creation attempt, separate from processing failures.
- No support/payment click event, payment confirmation, cookies, localStorage telemetry or tracking identifiers.

No retries: collection is best-effort and may undercount. Tracking failures, offline state, a five-second timeout, and the receiver's cap never block conversion or download. Do Not Track and Global Privacy Control suppress requests. `?metrics=off` disables collection for that tool-page visit; `?metrics=test` labels QA traffic as test. Local/unknown hosts default to test. Spoofable browser-origin checks are validation, not authentication; public metrics may contain automated/noisy submissions. Do not use them for billing or an exact visitor funnel.

## Limits and retention

JSON-only POST, exact keys and enums, at most 256 bytes, exact canonical-site CORS origin; the explicit local test origin accepts test events only. One atomic UPSERT per accepted event, indexed aggregate table, 10,000 accepted events per UTC day across both environments. This caps accepted events, not all requests/platform costs; do not enable a paid plan or promise free unlimited ingestion. Free-platform quotas may stop collection while the static converter remains usable.

Scheduled cleanup at 03:15 UTC retains the latest 90 UTC dates in the live application table. Provider backup/recovery and connection/diagnostic retention differ; this is not a promise of irreversible deletion from every provider copy at 90 days. Monitor scheduled-job failures with the existing account tools.

## Deployment and authorized inspection

Use the pinned `cf` package with a supported Node runtime. The current project was checked with bundled Node 24.22.1. No credentials belong in this directory. `cloudflare.config.ts` binds only this database; it changes no main-site DNS. The public endpoint is https://zhuanmp3.com/api/metrics; only this exact Worker route is added, preserving the Pages site and DNS. Main-site CSP allows only the verified receiver path in addition to its existing advertising exceptions.

```text
npm ci --ignore-scripts --no-audit --no-fund
cf auth whoami
cf build
cf deploy --dry-run
cf deploy --prebuilt --no-provision
```

Before first deployment, create the named D1 database once and apply `schema.sql`; never recreate or delete an existing database on an update. The database UUID in the config is a resource identifier, not a secret.

For owner-only viewing, use the account's D1 console or authenticated CLI (substitute the UUID already in the config):

```sql
SELECT day, group_name, outcome, language, SUM(count) AS attempts
FROM daily_counters
WHERE environment='production' AND event='process_finished'
GROUP BY day,group_name,outcome,language ORDER BY day DESC;

SELECT day, event, outcome, SUM(count) AS triggers
FROM daily_counters
WHERE environment='production' AND event IN ('download_triggered','zip_failed')
GROUP BY day,event,outcome ORDER BY day DESC;
```

QA must always use `environment='test'`; compare its before/after counts through an authenticated query. Never infer payment, file-save success, indexing, or human demand from these numbers. Do not publish account tokens, raw logs or private console exports.
