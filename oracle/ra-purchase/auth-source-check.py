#!/usr/bin/env python3
"""Read-only, fixed-target auth source indicators. Never emit source or values."""
import json
import re
import subprocess
from pathlib import Path


def indicators(source, environment_names):
    names = set(re.findall(r'process\.env\.([A-Z][A-Z0-9_]*)', source))
    names.update(re.findall(r'''process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]''', source))
    # Output counts, not arbitrary names or strings extracted from source.
    relevant = {n for n in names if re.search(r'SECRET|TOKEN|KEY|AUTH|CONFIG|CREDENTIAL', n)}
    return {
        'credential_env_references': len(relevant),
        'referenced_variables_present': len(relevant & environment_names),
        'file_read_indicator': bool(re.search(r'readFile|readFileSync', source)),
        'systemd_credentials_indicator': 'CREDENTIALS_DIRECTORY' in source,
        'proxy_header_indicator': 'x-zerox-proxy-key' in source,
        'bearer_indicator': 'bearer' in source.lower(),
        'safe_compare_indicator': 'timingSafeEqual' in source,
    }


def main():
    report = {'mode': 'read-only', 'static_analysis': 'indicators_only'}
    try:
        def prop(name):
            r = subprocess.run(['systemctl', 'show', 'zerox-ra-gateway', '-p', name, '--value'],
                               capture_output=True, text=True, check=True, timeout=5)
            return r.stdout.strip()
        pid = int(prop('MainPID'))
        report['active_process'] = pid > 0
        names = set()
        if pid > 0:
            raw = Path('/proc', str(pid), 'environ').read_bytes()
            names = {entry.split(b'=', 1)[0].decode(errors='replace') for entry in raw.split(b'\0') if b'=' in entry}
        report['systemd_environment_files_present'] = bool(prop('EnvironmentFiles'))
        report['systemd_load_credential_present'] = bool(prop('LoadCredential'))
        source = Path('/home/opc/zerox-ra-gateway/server.js').read_text()
        report.update(indicators(source, names))
        report['historical_proxy_file_exists'] = Path('/home/opc/zerox-ra-gateway/proxy.secret').is_file()
    except Exception:
        report['inspection_incomplete'] = True
        # No exception strings: commands and files may contain sensitive data.
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
