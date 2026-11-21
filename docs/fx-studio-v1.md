# FX Studio V1 · Informe de entrega

## Uso en Zero’X Editor

Abre un artículo y pulsa **Efectos visuales FX**. Añade una capa, elige el efecto y su plano y ajusta los parámetros en la vista previa. Arrastrar sobre la imagen mueve la capa seleccionada. **Guardar cambios** aplica los FX de ese artículo. **Restaurar configuración** recupera su presentación original.

**Biblioteca FX** está disponible desde la barra del editor y desde cada artículo. Incluye seis diseños predeterminados y permite guardar combinaciones personalizadas, duplicarlas, buscarlas, filtrarlas y reunirlas en colecciones de favoritos. Al editar un diseño vinculado, la confirmación indica cuántos artículos recibirán la actualización. Al eliminarlo, los artículos vinculados conservan una copia. Las escrituras simultáneas sobre la misma revisión se rechazan para evitar perder cambios.

## Integración y archivos

| Archivo | Función |
| --- | --- |
| `store-editor.js`, `index.html` | Accesos desde el editor y carga de la presentación en la tienda. |
| `fx-studio/model.mjs` | Esquema V1, límites, validación, diseños y comandos de biblioteca. |
| `fx-studio/effects.mjs` | Doce efectos procedurales Canvas 2D. El humo combina texturas de ruido con desplazamientos, rotaciones y escalas independientes. |
| `fx-studio/renderer.mjs` | Dos planos de dibujo, visibilidad, reducción de movimiento y presupuesto de animaciones compartido. |
| `fx-studio/storefront.mjs` | Asociación por ID en las tarjetas públicas y gestión de reemplazos del catálogo. |
| `fx-studio/editor.mjs`, `fx-studio/studio.css` | Editor de capas, biblioteca, vista previa y estilos aislados. |
| `functions/api/fx-studio.js` | Lectura pública de efectos activos y guardado con revisión condicional. |
| `functions/api/manual-recharges.js` | Exportación de la comprobación de fundador que ya utilizaba el panel. |
| `scripts/build-pages.mjs` | Archivos públicos permitidos y preparación de la demostración en la rama de revisión. |
| `tests/fx-studio.test.mjs`, `tests/fx-browser.mjs` | Pruebas de reglas, API, navegador y rendimiento. |
| `tests/fx-review.html`, `tests/fx-review.mjs` | Demostración con tres tarjetas de diamantes y almacenamiento local al navegador. |
| `.github/workflows/fx-studio-review.yml` | Validación de la rama de desarrollo con Chrome y R2 local. |

## Persistencia

FX Studio utiliza un objeto exclusivo de R2, `storefront/fx-studio/v1.json`, y la comprobación de sesión fundadora existente. No requiere migraciones D1. La respuesta pública incluye solo las configuraciones necesarias para dibujar los artículos activos. Los nombres de las colecciones y las descripciones privadas permanecen en el editor. Los diseños se guardan mediante comandos por artículo, diseño o colección y con comprobación de la revisión previa.

La clave de artículo corresponde a `data-product`. El orden de la lista define la profundidad dentro de cada plano. Las configuraciones tienen versión y cada capa conserva su ID, tipo, plano, estado y parámetros. Las configuraciones incompatibles se omiten al dibujar. Una escritura nunca sustituye un documento de versión desconocida.

## Validación y rendimiento

La revisión de desarrollo ejercitó el editor de la tienda en Chrome, con sesión de prueba, servicios comerciales simulados y la función FX ejecutada sobre R2 local. La prueba creó cuatro capas, cambió planos, colores, intensidad y velocidad, reordenó y arrastró una capa, guardó un diseño, lo añadió a favoritos, aplicó un vínculo y verificó la persistencia después de recargar. La suite comprueba las copias independientes, las confirmaciones sobre vínculos, el rechazo de revisiones vencidas y la conservación de artículos sin FX. Las peticiones de escritura externas se contabilizan durante la prueba y deben sumar cero.

Se compararon los píxeles de los doce efectos en dos instantes, la congelación con movimiento reducido, la liberación de lienzos fuera de pantalla y los anchos de 390, 768 y 1320 píxeles. En la primera ejecución de revisión, dibujar el ejemplo de cuatro capas a 240 × 240 px tomó 8.4 ms de mediana y 9.6 ms en el percentil 95 sobre 50 muestras de Chrome en Linux. Es una medición del dibujo en el entorno de prueba. El rendimiento en un teléfono físico y el consumo de batería dependen del dispositivo.

| Perfil | Capas animadas entre tarjetas visibles | Lado máximo del lienzo | Frecuencia objetivo |
| --- | ---: | ---: | ---: |
| Móvil o capacidad reducida | 8 | 240 px | 20 Hz |
| Escritorio | 20 | 400 px | 30 Hz |

El presupuesto se comparte con vistas previas y miniaturas. Las tarjetas adicionales producen una imagen estática. El motor deja de animar en segundo plano, libera lienzos fuera de pantalla y reduce su calidad si detecta fotogramas costosos. Una configuración puede tener hasta cuatro capas. La aplicación por categoría queda para una versión posterior. La prueba utiliza los ID reales de los diamantes y una configuración de muestra exclusiva del entorno de revisión.

## Nubes y profundidad

**Cúmulos 3D** combina un banco de nubes iluminado detrás del artículo con nubes más pequeñas en primer plano. En la demostración de desarrollo se ve en los 110 diamantes de Primera Vez. El preset violeta de Ilimitados utiliza humo filamentoso.

El generador `scripts/build-fx-clouds.py` integra la densidad de seis volúmenes tridimensionales a lo largo del rayo de cámara y calcula la sombra hacia una fuente superior izquierda. Guarda la iluminación y la opacidad en `assets/fx/cloud-light-v1.png`. En el navegador, `fx-studio/volume.mjs` tiñe las texturas con los colores de la capa, ordena los volúmenes por distancia y cambia su tamaño y movimiento según la profundidad. El recurso se carga al dibujar la primera nube, tormenta o humo. Los demás efectos usan proyección, facetas y núcleos luminosos según su forma. La luz precalculada mantiene una orientación fija.

El test de Chrome comprueba que el atlas se decodifica y mide el contraste entre zonas claras y oscuras en el interior opaco de las nubes. En la revisión `24722f2`, pasaron las 224 pruebas y la prueba del editor en Chrome. El ejemplo violeta con cuatro capas a 240 × 240 píxeles tomó 6,7 ms de mediana y 7,4 ms en el percentil 95 (50 muestras, Chrome en Linux). La textura compartida ocupa 58 312 bytes. Esta revisión conserva el formato de configuraciones y el almacenamiento existentes.

## Repetición

Desde la raíz, ejecuta `node --test tests/*.test.mjs`. Para repetir las pruebas con navegador, usa los pasos y versiones del flujo **FX Studio review**. El entorno de demostración se incluye en la compilación de la rama `codex/fx-studio-v1` o con `ZX_FX_REVIEW=1`. La compilación normal de producción excluye la demostración.
