"""Provision and verify the isolated Smart Engine rehearsal from Oracle."""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NAME = 'zerox-smart-engine-staging'
DATABASE = NAME + '-db'
# Pin the operator account using its verified workers.dev subdomain below.
WRANGLER = os.getenv('WRANGLER_BIN') or shutil.which('wrangler')
TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN')
if not WRANGLER or not TOKEN:
    sys.exit('Configura WRANGLER_BIN y CLOUDFLARE_API_TOKEN en Oracle.')
ACCOUNT = os.environ.get('CLOUDFLARE_ACCOUNT_ID', '')
if not re.fullmatch('[0-9a-f]{32}', ACCOUNT):
    sys.exit('Configura CLOUDFLARE_ACCOUNT_ID con el ID de cuenta del panel.')

def api(path):
    request = urllib.request.Request('https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/'+path,
                                     headers={'Authorization':'Bearer '+TOKEN})
    with urllib.request.urlopen(request,timeout=30) as response:
        body=json.load(response)
    if not body['success']:
        raise RuntimeError('Cloudflare API request failed')
    return body['result']

def run(*args,capture=False):
    return subprocess.run([WRANGLER,*args],cwd=ROOT,check=True,text=True,
                          stdout=subprocess.PIPE if capture else None,
                          env={**os.environ,'CLOUDFLARE_ACCOUNT_ID':ACCOUNT,'CI':'true'}).stdout

def deploy():
    subdomain=api('workers/subdomain')['subdomain']
    if subdomain!='westdark161208':
        sys.exit('Cuenta inesperada. Solo se admite westdark161208.workers.dev.')
    with tempfile.TemporaryDirectory(dir=ROOT/'staging/smart-engine') as tmp:
        config=Path(tmp)/'wrangler.json'
        settings={'name':NAME,'main':str(ROOT/'staging/smart-engine/worker.mjs'),
                  'compatibility_date':'2026-09-10','workers_dev':True,'preview_urls':False,
                  'triggers':{'crons':['0 * * * *']},
                  'vars':{key:'false' for key in ['RECHARGEGAMES_CATALOG_ENABLED','SMART_TRIALS_ENABLED',
                          'SMART_RA_CATALOG_ENABLED','SMART_SIXOFIRE_CATALOG_ENABLED','SMART_PUBLIC_CATALOG_ENABLED']}}
        config.write_text(json.dumps(settings))
        def wr(*args,capture=False):
            return run(*args,'--config',str(config),capture=capture)
        wr('deploy','--dry-run','--outdir',tmp+'/bundle')
        def databases():
            return [d for d in json.loads(wr('d1','list','--json',capture=True)) if d['name']==DATABASE]
        matches=databases()
        if not matches:
            wr('d1','create',DATABASE)
            matches=databases()
        if len(matches)!=1:
            sys.exit('No se pudo verificar la D1 exclusiva.')
        uid=matches[0]['uuid']
        if not re.fullmatch(r'[a-f0-9-]{36}',uid) or uid=='56da67bb-a83e-4b29-8193-eb3baf0cb404':
            sys.exit('Destino D1 rechazado.')
        settings['d1_databases']=[{'binding':'DB','database_name':DATABASE,'database_id':uid}]
        config.write_text(json.dumps(settings))
        wr('d1','execute','DB','--remote','--yes','--file',str(ROOT/'cloudflare/universal/schema.sql'))
        wr('deploy')
        origin='https://'+NAME+'.'+subdomain+'.workers.dev'
        for attempt in range(12):
            try:
                with urllib.request.urlopen(origin+'/health',timeout=10) as response:
                    health=json.load(response)
                if health['service']==NAME and health['livePurchases'] is False:
                    print('STAGING_OK',origin+'/api/providers/rechargegames/webhook')
                    return
            except (OSError,ValueError,KeyError):
                pass
            time.sleep(5)
        sys.exit('Despliegue enviado. Falta verificar /health antes de cargar secretos.')

if __name__=='__main__':
    deploy()
