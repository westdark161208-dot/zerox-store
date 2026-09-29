# Publicación del frontend en Cloudflare Pages

El Worker existente `zerox-sixofire-api` sigue funcionando por separado. No sustituir su configuración ni sus bases de datos con la del frontend.

En Workers & Pages, crear un proyecto **Pages** conectado al repositorio `westdark161208-dot/zerox-store`:

- Rama: `main`.
- Framework: ninguno.
- Directorio raíz: raíz del repositorio (vacío).
- Comando de compilación: `node scripts/build-pages.mjs`.
- Directorio de salida: `dist`.
- Nombre sugerido: `zerox-store` (sujeto a disponibilidad).

Cloudflare asigna la dirección provisional al desplegar; no se da por reservada ninguna dirección antes del primer despliegue. Las actualizaciones de main se publicarán automáticamente con la integración Git.

Nunca publicar la raíz del repositorio como directorio de salida. El script copia solamente las entradas públicas y medios; excluye Worker, costos/recetas del backend, pruebas, documentación y archivos Git. `_config.yml` solo controla Jekyll; no sustituye este build.

## Verificación antes de cambiar el enlace compartido

1. Verificar inicio, imágenes, búsqueda, monedas, categorías, carrito y fichas en móvil, tablet y escritorio.
2. Verificar registro/inicio de sesión, perfil público y panel `manage.html` con cuentas autorizadas. `admin.html` es una página demo antigua cuyo `admin.js` ya falta en el repositorio; no es el panel actual.
3. Comprobar que las llamadas siguen llegando al Worker existente y que no cambian sus bindings D1/R2 ni sus secretos. La API actual usa su URL absoluta y permite CORS; no se amplían permisos en esta migración.
4. Verificar enlaces a perfiles desde el dominio nuevo. Las URLs históricas compartidas no se actualizan solas.
5. El almacenamiento local, carrito y sesión del navegador pertenecen a cada origen: no se transfieren automáticamente de github.io a pages.dev. Volver a iniciar sesión en el nuevo dominio. No borrar el origen anterior ni datos hasta completar la revisión.
6. Los pagos/recargas pendientes de integración continúan desactivados. Cambiar de hosting no los habilita.
7. Tras validar, sustituir el enlace compartido por la URL real asignada; posteriormente conectar el dominio propio. Mantener una vía de reversión durante la transición.

Referencias: https://developers.cloudflare.com/pages/get-started/git-integration/ y https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
