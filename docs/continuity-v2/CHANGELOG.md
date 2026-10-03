# Changelog de continuidad v2

## Fase 0 — 2026-10-03 UTC
- Leídos paquete v2, base v1 y documento Word.
- Recuperadas fuentes del commit remoto ae23197 mediante GitHub; clonación directa bloqueada por conectividad del proxy.
- Creada rama remota work/zerox-continuidad-v2 desde ae23197.
- Inventariados perfiles, autenticación, administración, ledger revendedor, motor de diamantes y Mercado Pago TEST.
- Conservada especificación en docs/continuity-v2/specification, excluida del build público por la allowlist existente.

## Fase 1 — propuesta, sin publicación productiva
- index.html y profile.html: firma de origen en rojo; actualización de versiones CSS. index.html añade título de niveles.
- responsive.css y profile.css: reducción de tarjetas mediante divisores/espaciado, sin retirar controles ni datos.
- Pruebas base: diamantes 6/6, Mercado Pago TEST 3/3, suite revendedores PASS.
- Pendiente: revisión visual Android/escritorio y E2E autenticado en preview; Chromium no disponible en el entorno.
- No modificados backend, secretos, base de datos, saldos ni main.

- Validación estática: IDs HTML existentes preservados; sintaxis de app.js/profile.js aprobadas. Build local aprobado (22 entradas públicas, sin medios recuperados); docs/backend excluidos.

## Incremento 2 — fundamentos de backend, sin despliegue
- MXN confirmado por usuario. Recibidos y leídos colección Postman y plugin RA.
- Permisos centralizados; sesiones propias consultables y revocables con auditoría.
- Cuentas deshabilitadas bloqueadas, JSON no-store y errores internos sin datos sensibles.
- Service worker preparado para excluir API/datos privados si se reactiva; sigue desactivado.
- Ledger MXN inmutable, atómico e idempotente, separado del saldo revendedor; API solo lectura y desactivada por defecto.
- Recargas América: adaptador solo lectura de saldo/catálogo para Fundador; sin llamadas reales ni compras.
- Pruebas nuevas: 11 casos de seguridad, rutas Worker, proveedor y ledger aprobados. Regresiones previas aprobadas.
- Detalle de archivos, condiciones de activación y pendientes: BACKEND-FOUNDATIONS.md.
- No incluye passkeys/step-up ni sesión administrativa separada; no afirmar que la fase completa de seguridad está terminada.
