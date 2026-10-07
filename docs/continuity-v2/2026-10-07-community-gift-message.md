# Continuidad — comunidad, fichas y mensajes de regalo

Se conserva la tienda existente y la ruta de pagos publicada en PR29.

## Implementado
- Fichas ilimitadas: marco doble neón con el color individual existente, halo y cristal SVG junto a la cantidad. No cambia personajes, cantidades, precios ni recetas.
- Footer: Tienda de Diamantes, Consultar Pedido, Mi Información, Referencias & Comprobantes, Top Recargueros y Portal Admin; soporte adicional conservado.
- Comunidad: reseñas de compras completadas propias, 1–10 estrellas, comentario y hasta cinco fotos/videos. JPG/PNG/WebP (2 MB por imagen), MP4/WebM (8 MB por video), 12 MB total. Consentimiento expreso para publicar nombre de usuario y archivos. R2 privado servido por ruta que revisa consentimiento y compra cada vez. Nunca publica folio/UID/contacto automáticamente.
- Las reseñas históricas conservan anonimato y archivos privados; escala 1–5 normalizada ×2 solo al presentar en la nueva sección. Edición nueva sustituye su visualización histórica, sin duplicar.
- Ranking: desbloqueo comprobado en servidor a 100 ventas completadas/pagadas. Excluye métodos de prueba con fondos RA/SF de fundador. Filtra diario/7/30/365 días. Clasificación por diamantes ilimitados entregados y número de compras; no infiere cantidades de combos.
- Mensaje Sixofire: `message`, solo `GIFT`, hasta 100 caracteres. Predeterminado `Gracias por su preferencia. https://zeroxstore.com`. Configuración de fundador en Control, captura en el plan de cada pedido. Otros tipos no reciben el campo.
- Diagnóstico privado de entrega conserva causas de credencial, permiso SHOP_ORDER o suscripción, sin mostrarlas a clientes. Añadida asociación explícita de cajas Evo en Control.

## Evidencia
- Documentación oficial Sixofire consultada 2026-10-07: https://sixoff.com/docs/ord-new (bundle oficial `/assets/index-CDz95CpG.js`). El producto usa ID del catálogo de venta, no externalId de Garena. UID 8–12, producto 4–5 dígitos. Mensaje solo GIFT, máximo 100. Catálogo: https://sixoff.com/docs/ord-items.
- Recargas América: el contrato suministrado no acredita mensaje personalizado; no se añade un campo desconocido a compras reales.
- 169 pruebas automatizadas pasan, incluyendo consentimiento, aislamiento entre cuentas, revocación pública, medios inválidos, umbral 99→100 y payload GIFT vs no GIFT. Build público 253 archivos.

## Pendiente real, no marcar como resuelto
- Browser sin sesión fundadora. No se pudo leer catálogo privado real, asociar el producto exacto Booyah ni acreditar una compra real en esta sesión.
- No se eliminan controles de región, disponibilidad, tipo, saldo ni importes para ocultar el error PRODUCT_DELIVERY_MAPPING_REQUIRED. Hace falta consulta autenticada de Control para conocer el SKU real y el motivo exacto.
- Los medios sustituidos quedan privados en R2; limpieza diferida pendiente para evitar borrar objetos de ediciones simultáneas.
- Todo lo pendiente del ZIP sigue documentado en 2026-10-06-wallet-checkout-geography.md.
