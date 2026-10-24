# FF110 private runner — code only, NOT deployed

Commit scope: staging runner and local tests. The runner is scheduled-only:
no fetch handler, no routes, no workers.dev, no preview URL, and no cron
trigger by default. Its FF110_RUNNER_EXPIRES_AT is 0 (deny by default).
The simulation Worker has its own independent expiry guard.

## Local verification (Node >=22.13)

From the repository root:

```sh
node --test tests/ff110-staging-runner.test.mjs tests/ff110-staging-harness.test.mjs tests/ff110-private-e2e.test.mjs
```

This verifies an in-process service binding and temporary loopback HTTP.
It does NOT prove deployed Cloudflare -> Oracle VPC connectivity.

## Deployment checklist — SEPARATE OWNER APPROVAL REQUIRED

1. Review the exact staging commit and all manifests. Check there are no
   public routes or custom domains and that the target VPC service remains
   the existing isolated 8791 service, not commercial 8790.
2. Start ONLY the temporary Oracle simulator on loopback 8791 with a new
   random 64-character lowercase hex proxy secret. Never use RA credentials.
   Do not start/install systemd or touch the commercial gateway.
3. Configure two distinct temporary secrets for the simulation Worker:
   FF110_SIM_PROXY_SECRET (same as simulator) and FF110_SIM_SERVICE_TOKEN.
   The runner receives ONLY FF110_SIM_SERVICE_TOKEN. Never print secrets.
4. Set both expiry variables to the same future epoch-millisecond time no
   more than 20 minutes ahead. Verify their values before activation.
5. Deploy only the isolated simulation Worker and runner; ensure the runner
   service binding resolves to zerox-ff110-sim-staging. A one-time temporary
   scheduled trigger requires an explicit, separately reviewed manifest
   change: this repository deliberately ships with NO cron configured.
   Do not use public URLs, previews or the live checkout to trigger it.
6. Inspect only PASS/FAIL labels. Failure means stop and investigate;
   never retry a submit with a new operation ID to hide uncertainty.
7. Remove the scheduled trigger and both temporary Workers, revoke their
   secrets, stop only the temporary simulator PID, verify 8791 free.
   Preserve the shared VPC service and all commercial configuration.

This runner tests success mode and negative authentication/scope cases.
The existing harness covers processing/reject/timeout/partial modes locally;
remote failure-mode tests require separate isolated simulator sessions.
No live purchase, payment, customer data, or RA API is involved.
