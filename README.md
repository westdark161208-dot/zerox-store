# Zero'X Store V4

Versión funcional de demostración con estética negro/rojo basada en la identidad visual indicada.

## Incluye
- PWA instalable.
- Imagen principal personalizada en el hero.
- Catálogo administrable.
- Precios de diamantes en MXN y visualización de referencia en USD/COP/ARS/BRL.
- Carrito local.
- Checkout demo por UID.
- Cupones.
- Seguimiento de pedidos.
- Sección y formulario de revendedores.
- Panel administrativo existente en `/admin.html`.
- Arquitectura de múltiples proveedores con fallback demo.
- Render config para publicación.

## Ejecutar
```bash
node server.js
```
Abrir `http://localhost:3000`.

Panel demo: `http://localhost:3000/admin.html`  
Clave demo: `zerox-demo`

## Importante
Los pagos y los proveedores siguen siendo de demostración. Antes de producción deben conectarse cuentas comerciales reales, webhooks, base de datos persistente y proveedores autorizados.
