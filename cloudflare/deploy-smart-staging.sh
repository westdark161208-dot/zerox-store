#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
wrangler_bin=${WRANGLER:-wrangler}
db=zerox-smart-engine-staging-db
config=$(mktemp "$PWD/.smart-staging.XXXXXXXX.json")
trap 'rm -f "$config"' EXIT
printf '{}\n' > "$config"
node --test universal/runtime.test.mjs
if ! "$wrangler_bin" d1 info "$db" --config "$config" >/dev/null; then
  "$wrangler_bin" d1 create "$db" --config "$config"
fi
db_id=$("$wrangler_bin" d1 list --json --config "$config" | node -e '
let input=""; process.stdin.on("data",c=>input+=c).on("end",()=>{
 const rows=JSON.parse(input).filter(r=>r.name===process.argv[1]);
 if(rows.length!==1 || !/^[0-9a-f-]{36}$/i.test(rows[0].uuid) || rows[0].uuid==="56da67bb-a83e-4b29-8193-eb3baf0cb404")process.exit(1);
 console.log(rows[0].uuid);
});' "$db")
cat > "$config" <<JSON
{"name":"zerox-smart-engine-staging","main":"smart-staging.mjs","compatibility_date":"2026-09-10","workers_dev":true,"routes":[],"vars":{"RECHARGEGAMES_CATALOG_ENABLED":"true","SMART_TRIALS_ENABLED":"false"},"triggers":{"crons":["0 * * * *"]},"d1_databases":[{"binding":"DB","database_name":"$db","database_id":"$db_id"}]}
JSON
"$wrangler_bin" deploy --dry-run --config "$config"
"$wrangler_bin" d1 execute "$db" --remote --file universal/schema.sql --config "$config"
"$wrangler_bin" deploy --config "$config"
