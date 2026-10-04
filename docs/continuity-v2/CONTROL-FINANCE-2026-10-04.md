# Control: consulta financiera y proveedores

Continuación del PR #4 desde `b47c6102483273acbda3984705a7b6c201a12a0a`. Conservados los cambios de paneles y los fundamentos desactivados. Main sigue en ad5e52f; esta etapa se prepara en la misma rama de revisión, sin activación financiera ni llamadas reales.

## Incremento

- `cloudflare/control/routes.mjs`: endpoint GET `/api/admin/control/wallet`, solo fundador activo. Consulta el ledger existente sin inicializarlo. Devuelve 20 movimientos por página y cursor estable por rowid. No devuelve usuario, actor, referencia externa ni clave de idempotencia. Rechaza cursores inválidos; respuestas no-store. Tabla ausente se distingue de libro vacío.
- `control.html`: áreas de movimientos Wallet y Recargas América, con controles de consulta manual y aclaración de monedas separadas.
- `control-finance.js`: vistas privadas, paginación, configuración del proveedor y saldo manual únicamente si el backend confirma lectura y credencial configuradas. Al limpiar Control aborta solicitudes y borra datos; respuestas tardías se descartan si cambia sesión o visibilidad. No escribe preferencias financieras ni datos privados en almacenamiento.
- `control.js`: eventos de ciclo de vida para limpiar/habilitar las vistas; limpieza también al vaciar localStorage en otra pestaña. Texto de configuración actualizado sin afirmar conexión productiva.
- `control.css`: disposición compacta de acciones y tablas con scroll; tema azul/verde del borrador conservado.
- `scripts/build-pages.mjs`: añade módulo público de consultas; no publica backend, docs ni pruebas.
- `tests/control-finance.test.mjs`, `tests/control-finance-view.test.mjs`: permisos, lectura sin creación de tablas, cursores, paginación, datos excluidos, cancelación y respuestas tardías; integración desactivada no solicita saldo; moneda del proveedor preservada.

## Verificación

43 pruebas Node aprobadas; suite revendedores aprobada. Sintaxis, diff y build público aprobados (209 archivos). Los tests usan SQLite local y respuestas simuladas, no D1 remoto ni una cuenta del proveedor. No hay nueva activación, escritura de saldo, orden de proveedor, credencial, migración remota o cobro.

Revisión visual y flujo fundador real siguen pendientes. Esa limitación no impide completar y probar módulos independientes; debe mantenerse explícita antes de afirmar validación visual. La publicación productiva de esta rama aún no se ha efectuado.

## Continuidad

La consulta de movimientos no sustituye los estados/intenciones de pago, conciliación, webhook al ledger ni compra con reserva/compensación. Recargas América conserva RA_READ_ENABLED desactivado por defecto; su estado de configuración no ejecuta peticiones externas. No se activan métodos productivos en el footer.

Reversión: descartar este commit o revertirlo y restaurar b47c610 para retirar solamente estas vistas. No hay cambios de datos que revertir. La rama y PR mantienen el progreso sin sobrescribir main.
