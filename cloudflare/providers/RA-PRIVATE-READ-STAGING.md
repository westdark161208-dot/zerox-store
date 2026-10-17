# ZERO'X RA — puente privado de lectura (etapa de desarrollo)

**Alcance:** conecta las rutas ya existentes del backend de Zero'X Store para saldo del Fundador y catálogo RA, únicamente mediante Cloudflare Worker service binding al Worker de pruebas zerox-ra-vpc-test. Este cambio está solo en la rama codex/ra-founder-private-bridge-20261017. No despliega nada.

## Qué cambia
- cloudflare/providers/ra-admin-service.mjs: adaptador de solo lectura (GET, timeout, límites de tamaño, esquema estricto, sin fallback directo a Recargas América).
- cloudflare/providers/founder-balances.mjs: el saldo RA del Fundador usa el adaptador; sigue requiriendo isFounder=true y cuenta activa.
- cloudflare/providers/routes.mjs: las lecturas administrativas wallet y catalog usan el adaptador, preservando verificación de sesión/permisos. Se bloquea la validación heredada durante modo de lectura administrativo.
- cloudflare/providers/ra-admin-service.test.mjs: 24 pruebas locales simuladas; no consulta recursos reales.

La interfaz founder-balances.js y providers-panel.js ya consume esas rutas; nunca se inserta un token de RA en el navegador. El saldo del proveedor en USD es distinto del saldo de clientes en MXN. Las consultas no ejecutan compras.

## Requisitos exclusivos de un futuro Worker de STAGING aislado

Configurar solo tras auditar el entorno destino:
- Service binding privado RA_READ_SERVICE con destino zerox-ra-vpc-test, en la misma cuenta Cloudflare.
- Secret RA_READ_ADMIN_TOKEN: exactamente el token administrativo hexadecimal de 64 caracteres generado por V5 y guardado localmente en Termux; cargar como secret en el Worker backend de staging. NO escribir ni copiar su valor en Git, frontend, logs, URL ni chat.
- Variables de staging: RA_ADMIN_READ_ENABLED=true, RA_ADMIN_READ_TRANSPORT=service-binding, RA_ADMIN_READ_CONTRACT_VERIFIED=true.
- Sin estos elementos el adaptador falla de modo cerrado, sin conexión directa ni fallback. No es necesario copiar la API Key RA al Worker backend.

**ATENCIÓN: no desplegar todavía.** cloudflare/wrangler.jsonc apunta al Worker principal zerox-sixofire-api y contiene indicadores financieros en true. No usar ese archivo para staging ni ejecutar wrangler deploy sin un manifiesto de staging revisado y autorización explícita. Mantener compras/entregas RA desactivadas en el Worker de pruebas.

Otros módulos heredados (readiness, cotizaciones, asociaciones y validaciones) necesitan auditoría independiente del transporte antes de un despliegue integral. Este cambio solo sustituye wallet/catalog administrativos del panel; no todos los consumidores históricos de RA.

## Pruebas locales

    node --test cloudflare/providers/ra-admin-service.test.mjs
    node --check cloudflare/providers/ra-admin-service.mjs
    node --check cloudflare/providers/routes.mjs
    node --check cloudflare/providers/founder-balances.mjs

## Verificación futura de staging (sin exponer saldos ni secretos)
1. Confirmar login válido del Fundador en backend de staging.
2. Confirmar que solicitudes anónimas/no Fundador obtienen HTTP 401/403.
3. Consultar wallet y catálogo y registrar solo estado HTTP, moneda USD y número de productos; verificar compras desactivadas.
4. Desactivar flag de lectura y comprobar fail-closed sin fallback.
5. Conservar backend principal, sesión Zerito, secretos y bindings de Oracle intactos.

**No hay despliegue, compras, consultas de saldos reales, ni cambios en main como parte de esta rama.**
