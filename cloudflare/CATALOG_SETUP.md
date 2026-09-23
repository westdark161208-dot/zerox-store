# Catálogo multimedia Zero'X (borrador)

Esta rama prepara un editor separado para Cuentas, Venta de Clanes y Honor de Clanes.
No debe fusionarse con `main` ni desplegarse hasta completar las vinculaciones y
validar el flujo de administrador. El splash, Service Worker, endpoint de pedidos y
precios de revendedores quedan fuera de este cambio.

## Recursos que faltan

1. Reutilizar la base D1 existente `zerox-store-db` (confirmada en Cloudflare) y crear un bucket R2 para medios. No crear otra D1.
2. Vincular la base al Worker como `DB` y el bucket como `MEDIA`. Como el Worker
   se despliega desde GitHub con `npx wrangler deploy`, anotar el ID real de D1 y
   el nombre real del bucket en `wrangler.jsonc` antes del despliegue:

```jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "NOMBRE_REAL_D1",
    "database_id": "ID_REAL_D1"
  }],
  "r2_buckets": [{
    "binding": "MEDIA",
    "bucket_name": "NOMBRE_REAL_R2"
  }]
}
```

No insertar IDs inventados ni claves en el repositorio.

3. Crear una cuenta normal desde el formulario de registro existente. El Worker
   crea las tablas de autenticación y el campo `role` con valor `customer`.
4. Con una cuenta identificada y permiso de propietario en D1, asignar `admin`
   a esa cuenta concreta desde la consola SQL de D1:

```sql
UPDATE zx_users SET role = 'admin' WHERE email = 'CORREO_EXACTO_DEL_PROPIETARIO';
```

   Confirmar que se actualizó exactamente una fila. El registro público nunca
   asigna el rol `admin`.
5. Abrir `manage.html`, iniciar sesión con esa cuenta y crear un producto de
   prueba como borrador. Verificar imagen (8 MB máximo), video (25 MB máximo),
   precio y descripción. Publicarlo únicamente tras comprobar la ficha en la
   sección correcta.
6. Probar los seis bloques, varios reinicios de la web y el estado 403 de
   `POST /api/order` antes de fusionar la rama y anunciar el despliegue.

Los tokens de sesión se conservan solo en memoria en la página de administración.
La API comprueba el rol en cada escritura. Los medios se guardan con claves
aleatorias en R2. El catálogo público solo devuelve productos activos.
