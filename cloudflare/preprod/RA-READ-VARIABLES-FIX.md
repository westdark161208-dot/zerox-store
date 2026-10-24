# Corrección mínima de variables del lector del fundador

## Causa y alcance

El código `catalogReadReady` exige exactamente estas variables de texto:

```json
{
  "RA_CATALOG_READ_ENABLED": "true",
  "RA_CATALOG_READ_CONTRACT_VERIFIED": "true"
}
```

`RA_CATALOG_PRIVATE_READ_ENABLED` y `RA_WALLET_PRIVATE_READ_ENABLED` no son alias reconocidos. Con solo esos nombres y el token independiente presente, el estado devuelve `readEnabled:false` y wallet/catalog fallan con 503 antes de invocar el binding. Una respuesta 200 del lector consultado directamente no valida esta guarda del Worker principal.

La configuración desplegada y las versiones aa62397e/b68d9ffa fueron reportadas por el propietario; no se inspeccionaron ni modificaron desde este trabajo. La incompatibilidad se reproduce localmente con proveedores simulados. Tampoco se prueba aquí la igualdad de los secretos desplegados.

## Manifiesto corregido

`cloudflare/wrangler.jsonc` contiene ahora los dos nombres correctos y:

```json
"services": [
  { "binding": "RA_READ_SERVICE", "service": "zerox-ra-vpc-test" }
]
```

Conservar cualquier otro service binding existente en el manifiesto de despliegue real. El diff frente al padre solo añade las dos variables y este binding ausente en el manifiesto del repositorio. No cambia flags comerciales, D1, R2, cron, código de compras ni credenciales. No agregar el token a `vars`: `RA_CATALOG_READ_TOKEN` debe seguir siendo un secreto ya configurado, independiente y compatible con el lector. No regenerarlo.

El parche anterior `ra-panel-read-APPROVAL-REQUIRED.patch` ya está incorporado a este manifiesto; NO volver a aplicarlo. No aplicar parches de activación FF110.

## Aplicación posterior desde Oracle/Cloudflare — requiere autorización de publicación

Este cambio no se aplica a Cloudflare con un commit. No se publicó ninguna versión.

1. En Oracle, entrar en la copia existente del repositorio, rama `codex/ra-ff110-launch-pilot-20261018`. Revisar `git status --short` y actualizar esa rama solo si no hay modificaciones pendientes. No cambiar de rama sobre trabajo local ni sustituir el manifiesto usado para b68d9ffa por el del repositorio sin comparar sus bindings y variables.
2. En el manifiesto **exacto usado para el Worker principal**, dentro de `vars`, añadir o corregir únicamente las dos entradas de texto mostradas arriba. Las dos variables con nombres antiguos pueden permanecer: no son usadas por esta guarda. Mantener todas las demás entradas. Verificar que `RA_READ_SERVICE` ya apunta a `zerox-ra-vpc-test`; no duplicarlo. No modificar el manifiesto del lector privado.
3. En Cloudflare → Worker principal `zerox-sixofire-api` → configuración, comprobar la existencia del secreto `RA_CATALOG_READ_TOKEN` sin revelar su contenido, y el binding anterior. No ejecutar `secret put`, no rotar credenciales ni copiar secretos a archivos. Si el token falta o no coincide con el lector, detener esta activación y resolverlo mediante el mecanismo privado existente.
4. Validar localmente usando el Wrangler ya instalado y el manifiesto revisado:

```sh
# Desde la copia existente del repositorio. No publica:
npx --no-install wrangler deploy --dry-run --config cloudflare/wrangler.jsonc
```

Si el manifiesto utilizado externamente está en otra ruta, usar esa ruta en `--config` en lugar de la anterior. No instalar otra versión de Wrangler. Revisar que el resultado conserve los bindings, recursos y flags actuales. Un dry-run no confirma secretos ni conectividad.

5. **Detenerse aquí hasta autorizar una publicación.** Tras aprobación, la corrección mínima en el panel Cloudflare es añadir las dos variables de texto al Worker principal y guardar/publicar la configuración, conservando el código activo y todas las demás opciones. Si se usa Wrangler, publicar únicamente el mismo artefacto de código aprobado con el manifiesto revisado; no desplegar automáticamente el código de una rama con otros cambios pendientes. Registrar el nuevo ID de versión. No publicar el lector, no modificar Oracle ni reiniciar servicios.
6. Con la sesión autenticada del fundador, comprobar GET `/api/admin/providers/recargas-america/status` (`readEnabled:true`), luego `/api/admin/providers/recargas-america/wallet`, `/api/admin/providers/recargas-america/catalog` y `/api/admin/providers/founder-balances`. Confirmar saldo USD y catálogo actual en el Panel Control, sin exportar saldo, tokens ni respuestas privadas a logs o capturas públicas. El conteo es dinámico; 213 es el reporte externo, no un valor que el código fuerce.
7. Si status sigue deshabilitado, revisar nombres, valores de texto, binding y requisitos del secreto (64 caracteres hexadecimales minúsculos, distinto de los secretos comerciales). Si status está habilitado pero las consultas fallan, los flags ya pasaron: comprobar versión activa y contrato/autenticación del lector. No habilitar flags comerciales para corregirlo.

Reversión de esta corrección: restaurar únicamente los valores anteriores de las dos variables nuevas, o poner `RA_CATALOG_READ_ENABLED` en `false`. No retirar el binding compartido ni borrar secretos. Toda publicación/reversión requiere autorización; no afecta intencionalmente la configuración comercial.

## Validación local

`tests/ra-catalog-independent.test.mjs` reproduce nombres incorrectos → status deshabilitado y 503 sin llamadas; carga las variables del manifiesto corregido → status habilitado y GET wallet/catalog 200 simulados. Comprueba token independiente, autorización de fundador, rechazo de POST y configuración de compras idéntica antes/después.
