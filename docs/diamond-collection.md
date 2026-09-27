# Colección visual Zero’X — Diamantes Ilimitados

## Separación de responsabilidades

`diamond-collection.js` contiene 45 asignaciones visuales exactas. No crea productos,
no calcula precios, no cambia IDs, cantidades, disponibilidad, monedas ni pedidos.
`app.js` consulta esta capa únicamente en `artFor` y en los atributos del artículo.
`resellers.js` reutiliza el mismo recurso a través del producto público y conserva
los precios enviados por el servidor. `diamonds.js` y el Worker no cambian.

El catálogo actual tiene 50 paquetes, de los que 16 coinciden con las nuevas
asignaciones. Los restantes conservan sus cantidades y reciben la ficha neutral
Zero’X. No se asignan personajes por cercanía numérica. Las 29 cantidades nuevas,
incluida 50,446, están preparadas visualmente pero NO se publican como productos
comprables sin catálogo/precio aprobado.

## Sustituir una ilustración

1. Añadir `assets/diamonds/unlimited/CANTIDAD.webp` (640 × 800) y
   `CANTIDAD-320.webp` (320 × 400), sin texto ni precios incrustados.
2. Añadir la cantidad al conjunto `ready` de `diamond-collection.js`.
3. Incrementar la versión del script en `index.html`.

Se recomienda WebP calidad 82, cabeza dentro del encuadre y 15% inferior oscuro.
La carga usa srcset/sizes, lazy loading, decoding async y dimensiones explícitas.
No se solicitan las imágenes pendientes. Si falla una imagen lista, el listener
de error recupera el cristal provisional manteniendo número y botones.
Los dos catálogos comparten los mismos archivos. No duplicar recursos por nivel
revendedor. Los precios NO deben incluirse en este manifiesto.

## Acabados

- Esencial: hasta 4,796, metal oscuro y aura suave.
- Premium: desde 6,160, marco interior y partículas discretas.
- Épica: desde 15,884, marco en perspectiva, sombras y fondo energético.
- Mítica: desde 30,008, doble marco y partículas interactivas.
- Legendaria: desde 43,120, metal dorado y brillos interactivas.
- 50,446: Luffy Gear 5, sello ZERO’X EDITION exclusivo.

No hay animación en reposo: solo hover en dispositivos compatibles. Se respeta
prefers-reduced-motion. Las fichas comparten proporción 4:5, tipografía, posiciones
y botones táctiles de al menos 44px. Los detalles se conservan en un desplegable.

## Ilustraciones iniciales

Generadas mediante la herramienta integrada de generación de imágenes. Los seis
prompts pidieron retratos 4:5, anime dimensional, fondo negro, cabeza dentro del
encuadre, legibilidad en miniatura, 15% inferior oscuro y sin texto/marco/marca de agua.
Variaciones de los prompts por cantidad:

| Cantidad | Personaje y dirección artística |
| --- | --- |
| 2,398 | Megumi Fushiguro; uniforme azul oscuro, gesto de invocación; aura violeta/azul discreta, acentos rojos. |
| 6,160 | Levi Ackerman; capa, corbatín blanco y arnés ODM, espadas; negro/gris metálico, aura roja y brasas. |
| 17,116 | Portgas D. Ace; sombrero naranja, pecas y collar rojo; mano en llamas, rim light dorado y profundidad épica. |
| 30,008 | Yuta Okkotsu con katana y Rika detrás; chaqueta blanca, vórtice azul/violeta y motas; acabado mítico. |
| 43,120 | Zoro King of Hell avanzado; bandana, tres espadas, fuego esmeralda y haki violeta; metal dorado legendario. |
| 50,446 | Luffy Gear 5; cabello y ropa blancos, sonrisa, nubes y halo dorado; máxima edición blanca/violeta. |

Los prompts completos se encuentran en el historial de la tarea. Las otras 39
ilustraciones permanecen pendientes: las tarjetas usan un cristal SVG provisional.
No se presenta el cristal como ilustración del personaje.

## Validación

Comprobados 45 montos únicos, rutas únicas, seis pares WebP, asignación exacta,
exclusión de categorías ajenas, y conservación de catálogo/precios/checkout.
No se realizaron pagos, pedidos ni cambios de saldo reales.
