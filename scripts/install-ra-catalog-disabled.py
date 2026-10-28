"""Install only a new, disabled Oracle catalogue service. Never edits RA 8789/8790."""
import json, os, pathlib, socket, subprocess, tempfile, time, urllib.request
os.umask(0o077)
root = pathlib.Path(__file__).resolve().parent.parent
private = pathlib.Path('/home/opc/zerox-ra-catalog-private')
unit = pathlib.Path('/etc/systemd/system/zerox-ra-catalog.service')
node = pathlib.Path('/home/opc/zerox-ff110-runtime/node22/bin/node')
if os.getuid() == 0 or subprocess.check_output(['id','-un'],text=True).strip() != 'opc':
    raise SystemExit('DETENIDO: ejecutar como opc, sin sudo global.')
if unit.exists() or private.exists():
    raise SystemExit('DETENIDO: ya existe una instalación; no se sobrescribió.')
if not node.is_file() or not (root/'oracle/ra-catalog/server.mjs').is_file():
    raise SystemExit('DETENIDO: faltan archivos de ejecución.')
probe=socket.socket()
try:
    probe.bind(('127.0.0.1',8791))
except OSError:
    raise SystemExit('DETENIDO: puerto 8791 ocupado.')
finally:
    probe.close()
subprocess.run(['sudo','-v'],check=True)
private.mkdir(mode=0o700)
config=private/'config.json'
config.write_text(json.dumps({'enabled':False,'journalPath':str(private/'operations.sqlite')},indent=2))
service=f'''[Unit]
Description=ZeroX RA catalogue purchases (disabled until configured)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=opc
WorkingDirectory={root}
Environment=RA_CATALOG_CONFIG_FILE={config}
ExecStart={node} {root}/oracle/ra-catalog/server.mjs
Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths={private}

[Install]
WantedBy=multi-user.target
'''
with tempfile.TemporaryDirectory(prefix='ra-catalog-unit-') as temp:
    source=pathlib.Path(temp)/unit.name
    source.write_text(service)
    subprocess.run(['sudo','install','-m','0644',str(source),str(unit)],check=True)
subprocess.run(['sudo','systemctl','daemon-reload'],check=True)
subprocess.run(['sudo','systemctl','enable','--now',unit.name],check=True)
opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
for _ in range(15):
    try:
        with opener.open('http://127.0.0.1:8791/healthz',timeout=2) as response:
            data=json.loads(response.read(16384))
        if data.get('ok') is True and data.get('service')=='zerox-ra-catalog' and data.get('version')==1 and data.get('purchasesEnabled') is False:
            print('SERVICIO: zerox-ra-catalog.service')
            print('SALUD: OK · puerto local 8791')
            print('COMPRAS: DESACTIVADAS')
            print('SIN CAMBIOS EN LOS SERVICIOS 8789/8790 NI EN CLOUDFLARE.')
            break
    except Exception:
        pass
    time.sleep(0.3)
else:
    subprocess.run(['sudo','systemctl','stop',unit.name],check=False)
    raise SystemExit('DETENIDO: no se confirmó salud; nuevo servicio detenido. No se habilitaron compras.')
