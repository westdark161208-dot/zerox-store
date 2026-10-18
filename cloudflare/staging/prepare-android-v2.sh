#!/data/data/com.termux/files/usr/bin/bash
# ZERO'X RA staging V2: resumable, pinned and strictly local dry-run.
# No Cloudflare API token, no Cloudflare mutations, no secrets.
set -euo pipefail
ROOT="$HOME/zerox-ra-staging-src"
if [ -L "$ROOT" ]; then
  echo "DETENIDO: CARPETA_LOCAL_ES_ENLACE"
  exit 1
fi
if [ -e "$ROOT" ] && [ ! -d "$ROOT" ]; then
  echo "DETENIDO: RUTA_LOCAL_INVALIDA"
  exit 1
fi
for cmd in python curl node npm npx; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "DETENIDO: FALTA_HERRAMIENTA_$cmd"
    exit 1
  fi
done
node -e 'if (Number(process.versions.node.split(".")[0]) < 20) { console.log("DETENIDO: NODE_REQUIERE_VERSION_20_O_SUPERIOR"); process.exit(1); }'
mkdir -p "$ROOT"
export ZRX_STAGING_LOCAL_ROOT="$ROOT"
python - <<'PY'
from pathlib import Path
import os, json, re, hashlib, subprocess, sys

root = Path(os.environ["ZRX_STAGING_LOCAL_ROOT"])
saved = Path.home() / "zerox-ra-staging/d1.json"
expected_db = "a54b8020-71a4-4d4d-a576-800ee112a5cf"
ref = "3f3db3e352f1d4fec759297e6fd52fe4707ea033"
files = {
    "cloudflare/staging/wrangler.jsonc": "be16482406eb7e1a2583a91e671f5ff190bf3363",
    "cloudflare/staging/worker.mjs": "84cf3ccf0f713d8e657efe070c1c6aa679a9f14b",
    "cloudflare/staging/auth.mjs": "4c0b187c21932677777352e249bd8a16db9d0580",
    "cloudflare/staging/panel.mjs": "6569023f3c791e93820f193f252a543f16aca3a0",
    "cloudflare/providers/ra-admin-service.mjs": "b117ca05eb20693855e9bf243e0469ba5fa6b056",
    "cloudflare/providers/founder-balances.mjs": "2f6cba80385bd606ce2350ab58d7b70bb6eacb52",
    "cloudflare/security/founder.mjs": "4605a3202bbab3b8da99c3e5f330059fe3622369"
}

def blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

try:
    info = json.loads(saved.read_text())
    if (info.get("name") != "zerox-ra-founder-staging-auth" or
        info.get("database_id") != expected_db or
        not re.fullmatch(r"[0-9a-fA-F]{32}", info.get("account_id", ""))):
        raise ValueError("BASE_D1_LOCAL_NO_COINCIDE")

    for path, sha in files.items():
        dest = root / path
        if dest.is_symlink():
            raise ValueError("ARCHIVO_LOCAL_ES_ENLACE_" + path)
        if dest.exists():
            if not dest.is_file() or blob_sha(dest.read_bytes()) != sha:
                raise ValueError("ARCHIVO_EXISTENTE_NO_COINCIDE_" + path)
            print("ARCHIVO_VERIFICADO", path, flush=True)
            continue

        dest.parent.mkdir(parents=True, exist_ok=True)
        partial = dest.with_name(dest.name + ".partial")
        if partial.is_symlink():
            raise ValueError("ARCHIVO_PARCIAL_ES_ENLACE_" + path)
        if partial.exists():
            partial.unlink()
        url = ("https://raw.githubusercontent.com/westdark161208-dot/zerox-store/"
               + ref + "/" + path)
        result = subprocess.run([
            "curl", "-fLsS", "--retry", "6", "--retry-all-errors",
            "--retry-delay", "2", "--connect-timeout", "15",
            "--max-time", "90", "--output", str(partial), url
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if result.returncode != 0:
            partial.unlink(missing_ok=True)
            raise RuntimeError("DESCARGA_INTERRUPPIDA_" + path)
        data = partial.read_bytes()
        if blob_sha(data) != sha:
            partial.unlink(missing_ok=True)
            raise ValueError("HASH_NO_COINCIDE_" + path)
        partial.replace(dest)
        print("ARCHIVO_DESCARGADO_Y_VERIFICADO", path, flush=True)

    config = json.loads((root / "cloudflare/staging/wrangler.jsonc").read_text())
    expected_binding = [{"binding": "STAGING_AUTH_DB",
                         "database_name": "zerox-ra-founder-staging-auth",
                         "database_id": expected_db}]
    expected_service = [{"binding": "RA_READ_SERVICE",
                         "service": "zerox-ra-vpc-test"}]
    flags = config.get("vars", {})
    if not (
        config.get("name") == "zerox-ra-founder-staging"
        and config.get("main") == "worker.mjs"
        and config.get("workers_dev") is False
        and config.get("preview_urls") is False
        and not any(key in config for key in
                    ("routes", "route", "triggers", "r2_buckets", "kv_namespaces"))
        and config.get("d1_databases") == expected_binding
        and config.get("services") == expected_service
        and all(flags.get(name) == "false" for name in
                ("RA_DELIVERY_ENABLED", "RA_CONTRACT_VERIFIED",
                 "DIAMOND_PRODUCTION_ENABLED"))
        and flags.get("STAGING_READ_ONLY") == "true"
    ):
        raise ValueError("MANIFIESTO_INSEGURO")
    print("FUENTES_STAGING_VERIFICADAS", len(files), "HASHES_OK", flush=True)
    print("DB_STAGING_UUID_VERIFICADO")
    print("ACCESO_PUBLICO_DESACTIVADO")
    print("COMPRAS_RA_DESACTIVADAS")
except Exception as error:
    print("DETENIDO:", str(error)[:160])
    print("PUEDES_REANUDAR_CON_EL_MISMO_SCRIPT")
    print("CAMBIOS_CLOUDFLARE: NINGUNO")
    sys.exit(1)
PY
cd "$ROOT"
# Never remove --dry-run. This compiles locally and cannot publish Workers.
npx --yes wrangler@4 deploy --config cloudflare/staging/wrangler.jsonc --dry-run --outdir "$ROOT/build"
echo "STAGING_DRY_RUN_OK"
echo "CAMBIOS_CLOUDFLARE: NINGUNO"
