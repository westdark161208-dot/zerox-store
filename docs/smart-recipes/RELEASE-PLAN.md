# Plan de publicación separado

## 1. Backend en entorno aislado

1. Congelar el SHA revisado de la rama piloto; comprobar que nadie haya cambiado el backend publicado desde la referencia solicitada `a4aeddb3`. No usar el manifiesto productivo como staging.
2. Preparar Worker de ensayo con D1 exclusiva vacía, sin bindings de compras, sin cron, sin claves de pago, sin rutas productivas. Mantener entrega RA/FF110 y producción de diamantes deshabilitadas.
3. Primero usar fixtures RA. Confirmar las tarifas y límites de `RA_SMART_RECIPE_POLICY`; después probar únicamente lectura privada autorizada. Ningún valor de ejemplo es evidencia comercial.
4. Ejecutar creación/publicación/edición/despublicación, lectura del catálogo y cotización por región. Las tablas del Editor se inicializan con el esquema existente; no hay una nueva migración requerida para combos.

## 2. Editor y Panel Control

Publicar una vista previa del frontend apuntando al backend aislado. Validar móvil, sesión fundador y denegación a cliente anónimo. Crear varios combos, cambiar precios y regiones, despublicar y confirmar catálogo/planificador. Comprobar que el botón de compra permanezca deshabilitado.

El Panel Control ya administra seis asociaciones base. Mantener precedencia comercial actual:

- `RA_DIAMOND_PACKS` no vacío tiene prioridad; no borrarlo ni desbloquear edición a la fuerza.
- Sin esa variable, se leen las asociaciones guardadas. Smart Recipes no usa sugerencias automáticas por nombre como prueba de verificación.
- Para transición futura: exportar configuración vigente y revisiones, copiarla solamente a D1 aislada, cotejar SKU/ID/base/bono/región y comparar recetas. Documentar diferencias y rollback.
- El cambio productivo de precedencia requiere una publicación separada y revisada. No convertir automáticamente los datos del panel en configuración comercial ni alterar pedidos históricos.

## 3. Frontend público

Tras aprobar la validación aislada, preparar diff exacto de publicación y respaldo de la versión vigente. Publicar primero backend compatible y luego assets del Editor/frontend. Verificar caché/service worker y los dos catálogos. El bundle público excluye módulos backend y documentación.

Esta publicación solo ofrecería catálogo y vistas administrativas. No incluir flags para activar compras. El código comercial existente no acepta los IDs de combos nuevos.

## 4. Futura activación comercial — fuera de V1

Requiere integrar los combos al checkout comercial existente, revalidación fresca de catálogo, tarifas, precio, región, UID y disponibilidad; snapshot inmutable; idempotencia y conciliación. Probar rechazos sin débito, cambios concurrentes, respuesta incierta, reintentos, órdenes antiguas y reembolsos. No usar la cotización administrativa como comprobante o autorización.

No activar FF110 ni ejecutar una compra como parte de esta entrega. La publicación a producción debe aprobarse con los resultados concretos del entorno aislado, no con una afirmación genérica de que los tests pasaron.
