"""GET-only remote metadata audit. No secrets, balances, logs or customer data emitted.
Run locally: python cloudflare/preprod/audit-cloudflare.py
The token is entered with hidden input; never pass it as a command argument.
"""
import getpass
import json
import re
import urllib.request
import urllib.error

FLAGS = ('RA_ADMIN_READ_ENABLED', 'RA_ADMIN_READ_TRANSPORT',
         'RA_ADMIN_READ_CONTRACT_VERIFIED', 'RA_READ_ENABLED', 'RA_AUTO_ASSOCIATE_US',
         'RA_DELIVERY_ENABLED', 'RA_CONTRACT_VERIFIED', 'DIAMOND_PRODUCTION_ENABLED')
TARGETS = ('zerox-sixofire-api', 'zerox-ra-vpc-test', 'zerox-ra-founder-staging')

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

def summarize(body):
    bindings = body.get('bindings', [])
    by_name = {b.get('name'): b for b in bindings}
    flags = {}
    for name in FLAGS:
        value = by_name.get(name, {}).get('text')
        flags[name] = value if value in ('true', 'false', 'service-binding') else 'UNVERIFIED'
    return {'flags': flags,
            'bindings': [{k: b[k] for k in ('name', 'type', 'service', 'environment', 'id') if k in b}
                         for b in bindings if b.get('name') in ('RA_READ_SERVICE', 'RA_GATEWAY', 'RA_PRIVATE', 'DB', 'STAGING_AUTH_DB')],
            'admin_secret_present': by_name.get('RA_READ_ADMIN_TOKEN', {}).get('type') == 'secret_text'}

def main():
    account = input('Cloudflare Account ID: ').strip()
    if not re.fullmatch(r'[0-9a-f]{32}', account):
        raise SystemExit('ACCOUNT_ID_INVALID')
    token = getpass.getpass('Token Cloudflare (oculto, solo Workers Scripts Read necesario): ').strip()
    if not token:
        raise SystemExit('TOKEN_MISSING')
    opener = urllib.request.build_opener(NoRedirect)
    report = {'readOnly': True, 'oracleConnectivity': 'NOT_TESTED', 'workers': {}}
    for worker in TARGETS:
        path = f'https://api.cloudflare.com/client/v4/accounts/{account}/workers/scripts/{worker}/settings'
        request = urllib.request.Request(path, headers={'Authorization': 'Bearer ' + token}, method='GET')
        try:
            with opener.open(request, timeout=20) as response:
                body = json.loads(response.read(2 * 1024 * 1024))
            report['workers'][worker] = summarize(body['result']) if body.get('success') is True else {'error': 'API_FAILURE'}
        except urllib.error.HTTPError as error:
            report['workers'][worker] = {'http': error.code}
        except Exception:
            report['workers'][worker] = {'error': 'AUDIT_UNAVAILABLE'}
    print(json.dumps(report, indent=2))

if __name__ == '__main__':
    main()
