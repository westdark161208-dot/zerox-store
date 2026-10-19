#!/usr/bin/env bash
# Oracle FF110 sidecar PRECHECK: read-only. Does not print secrets or alter services.
# Run INSIDE the already-authenticated Oracle shell using bash, not sudo.
set -u
printf 'ZEROX_FF110_ORACLE_PREFLIGHT_V1\n'
printf 'HOST: '; hostname -s 2>/dev/null || printf 'UNAVAILABLE\n'
printf 'USER: '; id -un 2>/dev/null || printf 'UNAVAILABLE\n'
if command -v node >/dev/null 2>&1; then
  printf 'NODE_VERSION: '; node -v
  if node --no-warnings --input-type=module -e "import('node:sqlite').then(({DatabaseSync})=>{const d=new DatabaseSync(':memory:');d.close()})" </dev/null >/dev/null 2>&1; then
    printf 'NODE_SQLITE: AVAILABLE\n'
  else
    printf 'NODE_SQLITE: UNAVAILABLE\n'
  fi
  if node --no-warnings -e 'const v=process.versions.node.split(".").map(Number);process.exit(v[0]>22||(v[0]===22&&v[1]>=13)?0:1)' </dev/null >/dev/null 2>&1; then
    printf 'NODE_VERSION_REQUIRED: OK\n'
  else
    printf 'NODE_VERSION_REQUIRED: NOT_MET\n'
  fi
else
  printf 'NODE_VERSION: NOT_FOUND\nNODE_SQLITE: UNAVAILABLE\nNODE_VERSION_REQUIRED: NOT_MET\n'
fi
for unit in zerox-ra-gateway.service zerox-ra-health.service; do
  printf 'SERVICE_%s: ' "${unit%.service}"
  if command -v systemctl >/dev/null 2>&1; then
    systemctl is-active "$unit" 2>/dev/null || true
  else
    printf 'SYSTEMCTL_UNAVAILABLE\n'
  fi
done
if command -v ss >/dev/null 2>&1; then
  ss -H -ltn 2>/dev/null | awk '
    $4 ~ /:8789$/ {a=1}
    $4 ~ /:8790$/ {b=1}
    $4 ~ /:8791$/ {c=1; print "PORT_8791_LISTENING: " $4}
    END {
      print "PORT_8789_LISTENING: " (a ? "YES" : "NO");
      print "PORT_8790_LISTENING: " (b ? "YES" : "NO");
      if (!c) print "PORT_8791_LISTENING: NO"
    }'
else
  printf 'SOCKET_AUDIT: SS_UNAVAILABLE\n'
fi
if ip -o -4 addr show 2>/dev/null | grep -q 'inet 10\.0\.1\.170/'; then
  printf 'PRIVATE_SOURCE_ADDRESS: PRESENT\n'
else
  printf 'PRIVATE_SOURCE_ADDRESS: NOT_FOUND\n'
fi
printf 'STORAGE_HOME: '
df -Pk "$HOME" 2>/dev/null | awk 'NR==2 {print "AVAILABLE_KB=" $4}'
for target in "$HOME/zerox-ra-gateway/server.js" "$HOME/zerox-ra-proxy/server.js"; do
  if [ -f "$target" ]; then printf 'EXISTING_GATEWAY_FILE: PRESENT\n'; else printf 'EXISTING_GATEWAY_FILE: NOT_FOUND\n'; fi
done
printf 'CHANGES_ORACLE: NONE\n'
