# Spec: frontend-catalogo — Catálogo de Productos y Carrito

## ADDED Requirements

### Requirement: User can view product catalog

El sistema SHALL mostrar el listado de productos disponibles con paginación, filtros y búsqueda.

#### Scenario: Listado inicial
- **WHEN** usuario accede a `/catalogo`
- **THEN** sistema llama `GET /api/v1/productos?page=1&size=12`, muestra productos en grid responsive (1 col mobile, 2 md, 3-4 lg) con nombre, precio, imagen y botón "Agregar"

#### Scenario: Paginación
- **WHEN** usuario hace clic en página 2
- **THEN** sistema llama `GET /api/v1/productos?page=2&size=12` y muestra nuevos productos sin recargar la página completa

#### Scenario: Búsqueda por nombre
- **WHEN** usuario escribe "pizza" en el buscador (con debounce 500ms)
- **THEN** sistema llama `GET /api/v1/productos?busqueda=pizza&page=1&size=12` y muestra solo productos que coincidan

#### Scenario: Filtro por categoría
- **WHEN** usuario selecciona categoría "Hamburguesas" del sidebar
- **THEN** sistema llama `GET /api/v1/productos?categoria_id=3&page=1&size=12` y muestra solo productos de esa categoría

#### Scenario: Filtro por rango de precio
- **WHEN** usuario ajusta slider de precio (ej: $500-$2000)
- **THEN** sistema filtra productos client-side cuyo precio esté en el rango

#### Scenario: Producto sin stock
- **WHEN** producto tiene `stock_cantidad = 0` o `disponible = false`
- **THEN** sistema muestra botón deshabilitado "No disponible"

#### Scenario: Loading state
- **WHEN** productos están cargando
- **THEN** sistema muestra 12 skeleton loaders con forma de card

#### Scenario: Empty state
- **WHEN** búsqueda no retorna resultados
- **THEN** sistema muestra mensaje "No encontramos productos con ese criterio" + botón "Limpiar filtros"

### Requirement: User can view product detail

El sistema SHALL mostrar detalle completo del producto incluyendo ingredientes y alérgenos.

#### Scenario: Ver detalle
- **WHEN** usuario hace clic en un producto
- **THEN** sistema navega a `/producto/:id`, llama `GET /api/v1/productos/:id`, muestra nombre, descripción, precio, imagen grande, categorías, ingredientes con badge de alérgeno destacado

#### Scenario: Ingredientes con alérgenos
- **WHEN** producto tiene ingredientes con `es_alergeno = true`
- **THEN** sistema muestra badge rojo "⚠ Alérgeno" junto al nombre del ingrediente

#### Scenario: Producto eliminado
- **WHEN** usuario accede a `/producto/999` de un producto eliminado
- **THEN** sistema muestra página 404 "Producto no encontrado"

### Requirement: User can add products to cart

El sistema SHALL permitir agregar productos al carrito con personalización de ingredientes.

#### Scenario: Agregar producto sin personalización
- **WHEN** usuario hace clic en "Agregar al carrito" en producto con stock > 0
- **THEN** sistema llama `cartStore.addItem({ producto_id, nombre, precio, imagen_url, personalizacion: [] })`, muestra toast "Agregado al carrito", actualiza badge del ícono carrito

#### Scenario: Agregar producto con personalización
- **WHEN** usuario selecciona ingredientes a excluir (ej: sin cebolla, sin lechuga) y hace clic en "Agregar"
- **THEN** sistema agrega item con `personalizacion: [id_cebolla, id_lechuga]` al carrito

#### Scenario: Producto ya en carrito
- **WHEN** usuario agrega producto que ya está en el carrito
- **THEN** sistema incrementa cantidad del item existente en lugar de duplicar

#### Scenario: Actualizar cantidad en carrito
- **WHEN** usuario cambia cantidad de un item en el CartDrawer
- **THEN** sistema llama `cartStore.updateCantidad(producto_id, nueva_cantidad)`, recalcula subtotal y total

#### Scenario: Remover item del carrito
- **WHEN** usuario hace clic en botón "✕" de un item en CartDrawer
- **THEN** sistema llama `cartStore.removeItem(producto_id)`, actualiza badge del carrito

### Requirement: User can view cart

El sistema SHALL mostrar el carrito con todos los items, subtotal, costo de envío y total.

#### Scenario: Ver carrito
- **WHEN** usuario hace clic en ícono del carrito
- **THEN** sistema abre CartDrawer lateral mostrando items con nombre, precio unitario, cantidad, subtotal por item, subtotal general, costo de envío ($50 fijo), total

#### Scenario: Carrito vacío
- **WHEN** carrito no tiene items
- **THEN** sistema muestra ilustración + mensaje "El carrito está vacío" + botón "Ver catálogo"

#### Scenario: Persistencia del carrito
- **WHEN** usuario agrega items, cierra el navegador y vuelve a abrir
- **THEN** sistema carga items desde localStorage (cartStore persist), el carrito sigue con los mismos items

### Requirement: System validates cart before checkout

El sistema SHALL validar stock y disponibilidad de items del carrito antes de permitir crear pedido.

#### Scenario: Validación exitosa
- **WHEN** usuario hace clic en "Validar stock" en CartDrawer
- **THEN** sistema llama `POST /api/v1/carrito/validar` con lista de items, backend responde `{ valido: true, errores: [] }`, muestra toast verde "✓ Carrito válido"

#### Scenario: Producto sin stock suficiente
- **WHEN** usuario valida carrito pero un producto no tiene stock suficiente
- **THEN** backend responde `{ valido: false, errores: ["Pizza Margherita: stock insuficiente"] }`, sistema muestra error en CartDrawer con lista de items con problema

#### Scenario: Producto no disponible
- **WHEN** usuario valida carrito pero un producto fue desactivado por admin
- **THEN** backend responde error, sistema sugiere remover el item del carrito
