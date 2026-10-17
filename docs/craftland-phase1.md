# Craftland Premium — Fase 1 (borrador aislado)

Esta rama fue creada desde main para preparar el nuevo producto sin cambiar index.html, scripts activos, pagos, saldos, proveedores, sesiones ni rutas del comercio. No despliega una venta.

## Alcance
- Producto: Free Fire / Craftland / Nivel 6 + Nick Colorido.
- Ficha preliminar en `catalog-drafts/craftland-level6.json`.
- Deshabilitado: `publicVisible=false`, `checkoutEnabled=false`, precio y existencias sin definir.
- No se garantiza la disponibilidad, permanencia, compatibilidad regional ni legitimidad de los beneficios hasta verificar con un proveedor habilitado.

## Lista de implementación posterior
1. Confirmar por escrito que el proveedor puede ofrecer y revender el servicio y que no contraviene las normas del juego; confirmar país/regiones, características exactas, precio final y reembolsos.
2. Crear una ficha comercial ORIGINAL (sin reutilizar creativos, logos o textos de GGMAX sin permiso). No usar scraping ni APIs no oficiales de GGMAX.
3. Añadir campo UID Free Fire y región con validación en servidor, minimizando datos personales. Nunca solicitar contraseña, QR, token ni códigos OTP.
4. Mantener orden como `awaiting_manual_validation` antes de habilitar el pago. Comprobar inventario y condiciones de servicio.
5. Cobro sólo mediante la infraestructura ya existente, después de validar su flujo en entorno de pruebas; idempotencia de pagos, comprobantes y estados verificables. No modificar integración RA/Sixofire.
6. El operador envía la solicitud manualmente al proveedor autorizado y verifica evidencia de entrega. No aceptar exclusivamente capturas del vendedor como garantía.
7. Comprobante y seguimiento; vía de reembolso y atención si se incumple lo contratado.
8. Pruebas unitarias y E2E de nuevas rutas, doble cobro, acceso a órdenes ajenas, UID/región inválidos, suspensión del proveedor y transición de estados.

## Criterios para activar
- Proveedor y autorización comprobados.
- Precio MXN y margen aprobados.
- Países elegibles confirmados.
- Pruebas de pago y entrega aprobadas.
- Reembolso/documentación y comunicación al consumidor revisados.
- Aprobación explícita para pasar de borrador a venta.

Fuente comercial estudiada: https://ggmax.com.br/anuncio/nick-colorido-ff-craftland-nivel-6-todos-os-beneficios . Es un anuncio externo, NO una integración acordada.
