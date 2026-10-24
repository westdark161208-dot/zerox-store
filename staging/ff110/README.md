# FF110 staging simulado — NO desplegado

Continúa PR #48 / tarea #49. Usa createGateway y Journal reales, el bridge existente
como módulo y el producto ficticio compartido con ff110-private-e2e. No importa
el servidor comercial ni lee sus archivos de configuración. Sin API Key RA,
sin cliente HTTPS a RA, sin pagos ni acceso a las bases reales.

## Ejecución local

Node >=22.13. Desde la raíz del repositorio:

```bash
node --test tests/ff110-staging-harness.test.mjs tests/ff110-private-e2e.test.mjs
```

El test inicia HTTP en loopback con puerto efímero, simula el binding del Worker,
firma solicitudes y cierra servidor/SQLite al terminar. No es una prueba remota
Cloudflare VPC. Prueba completa de regresión:

```bash
node --test tests/*.test.mjs cloudflare/providers/ra-admin-service.test.mjs cloudflare/staging/*.test.mjs
```

Servidor manual, SOLO en entorno local aislado con puerto 8791 disponible:

```bash
export FF110_SIM_PROXY_SECRET="$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")"
FF110_SIM_MODE=success node staging/ff110/server.mjs
```

No imprimir el secreto; no usar valores comerciales. El servidor usa SQLite temporal
con permisos privados, escucha exclusivamente 127.0.0.1:8791 y se detiene con Ctrl+C,
SIGTERM o al cumplir 20 minutos. Si el puerto está ocupado, falla sin matar procesos.
Los modos disponibles son success, processing, reject, timeout y partial. Todos
usan respuestas ficticias: timeout modela resultado incierto, no una espera real.
No cambiar el modo mientras existan operaciones a conciliar. El diario temporal se
borra solo al cerrar este harness; NO se aplica este comportamiento al diario real.

## Plan remoto — requiere aprobación NUEVA, no ejecutar todavía

La autorización del Worker de diagnóstico NO autoriza estos recursos.

1. Aprobar una ventana para ejecutar exclusivamente este proceso temporal en Oracle
   y desplegar `zerox-ff110-sim-staging`. No instalar systemd ni iniciar el servicio
   comercial; no modificar 8789/8790, el túnel, la tienda, Zerito o los otros Workers.
2. Usar checkout aislado del commit revisado. Arrancar el harness temporal con secreto
   aleatorio exclusivo; no copiar ninguna configuración del gateway comercial.
3. Configurar mediante `wrangler secret put --config staging/ff110/wrangler.jsonc`
   los secretos FF110_SIM_PROXY_SECRET y FF110_SIM_SERVICE_TOKEN, distintos entre sí.
   El primero debe coincidir exclusivamente con este proceso temporal Oracle.
4. El manifiesto solo usa FF110_SIM_GATEWAY al servicio VPC existente. No tocar
   RA_PURCHASE_GATEWAY del Worker comercial. workers_dev y preview_urls siguen false.
   Caducidad FF110_SIM_EXPIRES_AT: epoch milisegundos, máximo 20 minutos desde ahora.
   Por defecto es 0: todas las llamadas quedan bloqueadas.
5. Para invocación privada, preparar un runner de staging separado con service binding
   al Worker simulado y ejecución scheduled temporal. Este runner también requiere
   aprobación: sin URL pública, sin DB comercial y sin tokens RA. Debe emitir solo
   PASS/FAIL por caso, no cuerpos, firmas o tokens. No usar previews ni tienda real
   para disparar la prueba. El runner aún no está implementado/desplegado.
6. Ejecutar validate, submit duplicado y lookup; comprobar exclusivamente referencias
   SIM-. Complementar con credencial inválida y modos de fallo, sin solicitar RA.
7. Detener el proceso temporal (su PID solamente), retirar el disparador/runner y
   Worker de simulación, revocar sus dos secretos; comprobar 8791 libre con `ss`.
   No borrar el servicio VPC compartido ni archivos/configuración comerciales.

## Evidencias y límites

7 tests nuevos del harness + 29 E2E de pagos existentes. Autenticación, firmas,
replay, contrato validate/submit/lookup, idempotencia, fallos y alcance ficticio.
Producto real ID 5 se rechaza; el entorno simulado nunca habilita flags del Worker
comercial. Las flags traducidas dentro del wrapper son locales a esta llamada.
No se realizó despliegue, llamada VPC remota, compra ni transacción financiera.
La conectividad previa VPC reportada por el propietario se conserva como evidencia;
este paquete no vuelve a auditarla ni afirma haberla ejecutado desde Work.
