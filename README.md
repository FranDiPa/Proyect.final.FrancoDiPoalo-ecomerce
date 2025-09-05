# ProyectoFinal-F.DiPaolo — Simulador Ecommerce (Repuestos VW)

Proyecto final,info de tp

- **Funcionalidad**: flujo completo de compra (listado de productos → carrito → checkout con confirmación de orden). Control de stock y cantidades.
- **Interactividad**: inputs de búsqueda, select de categoría, select de ordenamiento,  carrito, actualización dinámica del HTML.

- **Integridad**: JavaScript separado en `app.js`, CSS en `styles.css`. Carga de datos **JSON** vía `fetch` (asíncrona).
- **Legibilidad**: variables y funciones descriptivas, comentarios clave, formato cuidado.

## Estructura

ProyectoFinal_DiPaolo/
├─ index.html
├─ styles.css
├─ app.js
├─ data/
│   products.json
└─ assets/
   img


## Librerías externas
- [SweetAlert2](https://sweetalert2.github.io/) para reemplazar `alert/prompt/confirm` con UI moderna.
- [dayjs](https://day.js.org/) para tiempo real legibles en la confirmación de compra.
