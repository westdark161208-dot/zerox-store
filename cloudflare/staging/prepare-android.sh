#!/data/data/com.termux/files/usr/bin/bash
# ZERO'X RA staging: local download, exact Git blob verification and dry run.
# Does not create/update any Cloudflare resource and never reads an API token.
set -euo pipefail
ROOT="$HOME/zerox-ra-staging-src"
if [ -e "$ROOT" ]; then
  echo "DETENIDO: CARPETA_LOCAL_YA_EXISTE; NO_SE_SOBRESCRIBE"
  exit 1
fi
if ! command -v python >/dev/null 2>&1; then
  echo "DETENIDO: INSTALA_PYTHON_CON_pkg_install_python"
  exit 1
fi
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1 || ! command -v npx >/dev/null 2>&1; then
  echo "DETENIDO: INSTALA_NODE_CON_pkg_install_nodejs"
  exit 1
fi
node -e 'if (Number(process.versions.node.split(".")[0]) < 20) { console.log("DETENIDO: NODE_REQUIERE_VERSION_20_O_SUPERIOR"); process.exit(1); }'
mkdir -p "$ROOT"
export ZRX_STAGING_LOCAL_ROOT="$ROOT"
python - <<'PY'
from pathlib import Path
import os, json, re, hashlib, urllib.request, sys
root = Path(os.environ["ZRX_STAGING_LOCAL_ROOT"])
saved = Path.home() / "zerox-ra-staging/d1.json"
EXPECTED_ACCOUNT_DB = "a54b8020-71a4-4d4d-a576-800ee112a5cf"
REF = "3f3db3e352f1d4fec759297e6fd52fe4707ea033"
files = {
"cloudflare/staging/wrangler.jsonc":"be16482406eb7e1a2583a91e671f5ff190bf3363",
"cloudflare/staging/worker.mjs":"84cf3ccf0f713d8e657efe070c1c6aa679a9f14b",
"cloudflare/staging/auth.mjs":"4c0b187c21932677777352e249bd8a16db9d0580",
"cloudflare/staging/panel.mjs":"6569023f3c791e93820f193f252a543f16aca3a0",
"cloudflare/providers/ra-admin-service.mjs":"b117ca05eb20693855e9bf243e0469ba5fa6b056",
"cloudflare/providers/founder-balances.mjs":"2f6cba80385bd606ce2350ab58d7b70bb6eacb52",
"cloudflare/security/founder.mjs":"4605a3202bbab3b8da99c3e5f330059fe3622369"
}
try:
    info=json.loads(saved.read_text())
    if (info.get("name")!="zerox-ra-founder-staging-auth" or
        info.get("database_id")!=EXPECTED_ACCOUNT_DB or
        not re.fullmatch(r"[0-9a-fA-F]{32}", info.get("account_id",""))):
        raise ValueError("BASE_D1_LOCAL_NO_COINCIDE")
    for path,sha in files.items():
        url=("https://raw.githubusercontent.com/westdark161208-dot/zerox-store/"
             +REF+"/"+path)
        req=urllib.request.Request(url,headers={"User-Agent":"ZeroX-RA-staging-integrity-check"})
        with urllib.request.urlopen(req,timeout=35) as res: data=res.read(1024*1024)
        gitblob=hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
        if gitblob!=sha: raise ValueError("HASH_NO_COINCIDE_"+path)
        dest=root/path
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_bytes(data)
    config=json.loads((root/"cloudflare/staging/wrangler.jsonc").read_text())
    db=config.get("d1_databases",[])
    flags=config.get("vars",{})
    if not (
       config.get("name")=="zerox-ra-founder-staging" and
       config.get("workers_dev") is False and
       config.get("preview_urls") is False and
       not any(x in config for x in ("routes","route","triggers")) and
       config.get("main")=="worker.mjs" and
       config.get("services")==[{"binding":"RA_READ_SERVICE","service":"zerox-ra-vpc-test"}] and
       db==[{"binding":"STAGING_AUTH_DB","database_name":"zerox-ra-founder-staging-auth","database_id":EXPECTED_ACCOUNT_DB}] and
       all(flags.get(x)=="false" for x in ("RA_DELIVERY_ENABLED","RA_CONTRACT_VERIFIED","DIAMOND_PRODUCTION_ENABLED")) and
       flags.get("STAGING_READ_ONLY")=="true"
    ): raise ValueError("MANIFIESTO_INSEGURO")
    print("FUENTES_STAGING_VERIFICADAS",len(files),"HASHES_OK")
    print("DB_STAGING_UUID_VERIFICADO")
    print("ACCESO_PUBLICO_DESACTIVADO")
    print("COMPRAS_RA_DESACTIVADAS")
except Exception as exc:
    print("DETENIDO:",type(exc).__name__,str(exc)[:100])
    print("CAMBIOS_REMOTOS: NINGUNO")
    sys.exit(1)
PY
cd "$ROOT"
# Bundle-only: Wrangler docs guarantee --dry-run does not deploy.
npx --yes wrangler@4 deploy --config cloudflare/staging/wrangler.jsonc --dry-run --outdir "$ROOT/build"
echo "STAGING_DRY_RUN_OK"
echo "CAMBIOS_CLOUDFLARE: NINGUNO"
echo "SIGUIENTE: VERIFICAR_DESTINO_Y_CREAR_WORKER"
