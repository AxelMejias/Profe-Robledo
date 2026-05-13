# Spec: frontend-admin — Panel de Administración

## ADDED Requirements

### Requirement: Admin can view KPI dashboard

El sistema SHALL mostrar dashboard con métricas clave del negocio actualizadas en tiempo real.

#### Scenario: Ver KPIs principales
- **WHEN** usuario ADMIN accede a `/admin/dashboard`
- **THEN** sistema llama `GET /api/v1/admin/metricas`, muestra 4 cards con: Total pedidos, Ingresos hoy ($X), Pedidos pendientes, Productos sin stock

#### Scenario: Gráfico de ingresos 7 días
- **WHEN** dashboard carga
- **THEN** sistema llama `GET /api/v1/admin/metricas/ingresos-7-dias`, renderiza gráfico de línea (Recharts) con eje X = fecha, eje Y = ingresos

#### Scenario: Gráfico de pedidos por estado
- **WHEN** dashboard carga
- **THEN** sistema llama `GET /api/v1/admin/metricas/por-estado`, renderiza gráfico de barras horizontales con estados (PENDIENTE, CONFIRMADO, etc.) y cantidad de pedidos

#### Scenario: Actualización automática de métricas
- **WHEN** usuario deja dashboard abierto
- **THEN** sistema hace polling cada 60s para actualizar KPIs sin reload manual

### Requirement: Admin can manage products

El sistema SHALL permitir CRUD completo de productos con categorías e ingredientes.

#### Scenario: Listar productos (admin view)
- **WHEN** usuario ADMIN accede a `/admin/productos`
- **THEN** sistema llama `GET /api/v1/productos?incluir_eliminados=true&page=1&size=20`, muestra tabla con todas las columnas: nombre, precio, stock, disponible, categorías, acciones (editar, eliminar)

#### Scenario: Crear producto
- **WHEN** admin hace clic en "Nuevo producto", completa formulario (nombre, descripción, precio, stock inicial, disponible, imagen URL, categorías M2M, ingredientes M2M) y guarda
- **THEN** sistema llama `POST /api/v1/productos`, invalida query de productos, muestra toast "Producto creado", cierra modal

#### Scenario: Editar producto
- **WHEN** admin hace clic en "Editar" de un producto, modifica campos y guarda
- **THEN** sistema llama `PUT /api/v1/productos/:id`, invalida query, muestra toast "Producto actualizado"

#### Scenario: Eliminar producto (soft delete)
- **WHEN** admin hace clic en "Eliminar" de un producto
- **THEN** sistema muestra confirmación "¿Eliminar producto X?", si confirma llama `DELETE /api/v1/productos/:id` (soft delete), producto desaparece del catálogo público pero sigue en tabla admin con badge "Eliminado"

#### Scenario: Gestionar stock
- **WHEN** admin hace clic en "Gestionar stock" de un producto, ajusta cantidad y guarda
- **THEN** sistema llama `PATCH /api/v1/productos/:id/stock`, actualiza stock_cantidad

#### Scenario: Validación de precio
- **WHEN** admin intenta guardar producto con precio negativo o inválido
- **THEN** sistema muestra error de validación "El precio debe ser mayor a 0"

### Requirement: Admin can manage categories

El sistema SHALL permitir CRUD de categorías con soporte jerárquico.

#### Scenario: Listar categorías con árbol
- **WHEN** usuario ADMIN accede a `/admin/categorias`
- **THEN** sistema llama `GET /api/v1/categorias`, muestra árbol expandible con categorías padre e hijas indentadas

#### Scenario: Crear categoría raíz
- **WHEN** admin crea categoría sin padre
- **THEN** sistema llama `POST /api/v1/categorias` con `{ nombre, descripcion, parent_id: null }`, categoría aparece en nivel raíz del árbol

#### Scenario: Crear subcategoría
- **WHEN** admin selecciona categoría padre "Alimentos" y crea "Lácteos"
- **THEN** sistema crea categoría con `parent_id = id_alimentos`, aparece indentada bajo "Alimentos" en el árbol

#### Scenario: Validar ciclo jerárquico
- **WHEN** admin intenta asignar categoría "Lácteos" como padre de "Alimentos" (que ya es su padre)
- **THEN** frontend valida antes de enviar y muestra error "No se puede crear ciclo en jerarquía" (backend también valida)

#### Scenario: Eliminar categoría con productos
- **WHEN** admin intenta eliminar categoría que tiene productos asociados
- **THEN** backend responde error 422 "No se puede eliminar categoría con productos activos", frontend muestra error

### Requirement: Admin can manage users and roles

El sistema SHALL permitir ver usuarios, editar sus datos y asignar roles (RBAC).

#### Scenario: Listar usuarios
- **WHEN** usuario ADMIN accede a `/admin/usuarios`
- **THEN** sistema llama `GET /api/v1/usuarios?page=1&size=20`, muestra tabla con nombre, email, roles (badges), fecha de registro, acciones

#### Scenario: Asignar rol a usuario
- **WHEN** admin hace clic en "Editar roles" de un usuario, selecciona roles ADMIN, STOCK y guarda
- **THEN** sistema llama `PUT /api/v1/usuarios/:id/roles` con `{ roles: ["ADMIN", "STOCK"] }`, actualiza badges de roles en la tabla

#### Scenario: No puede quitarse rol ADMIN a sí mismo si es el último
- **WHEN** admin intenta quitarse el rol ADMIN siendo el último admin del sistema
- **THEN** backend responde error 422 "No podés quitarte el rol ADMIN si sos el último administrador", frontend muestra error

#### Scenario: Desactivar usuario (soft delete)
- **WHEN** admin hace clic en "Desactivar" de un usuario
- **THEN** sistema llama soft delete, usuario ya no puede loguearse

### Requirement: Admin can manage all orders

El sistema SHALL permitir ver todos los pedidos del sistema con filtros y avanzar estados.

#### Scenario: Listar todos los pedidos
- **WHEN** usuario ADMIN accede a `/admin/pedidos`
- **THEN** sistema llama `GET /api/v1/pedidos?page=1&size=20`, muestra todos los pedidos (no solo propios) con filtro por estado, usuario, fecha

#### Scenario: Avanzar estado de pedido
- **WHEN** admin hace clic en "Avanzar estado" de pedido CONFIRMADO
- **THEN** sistema muestra botón "→ EN_PREP", al hacer clic llama `PATCH /api/v1/pedidos/:id/estado`, actualiza estado

#### Scenario: Cancelar pedido EN_PREP
- **WHEN** admin cancela pedido EN_PREP (solo ADMIN puede hacerlo, RN-RB08)
- **THEN** sistema pide motivo obligatorio, llama cancelación, backend valida rol y restaura stock

#### Scenario: Ver historial completo
- **WHEN** admin ve detalle de pedido
- **THEN** sistema muestra historial append-only con todos los cambios de estado incluyendo usuario responsable y timestamp
