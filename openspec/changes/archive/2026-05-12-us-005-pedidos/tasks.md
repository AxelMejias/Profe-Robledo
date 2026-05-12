# Tasks: us-005-pedidos

- [x] schemas.py — ItemPedidoRequest, CrearPedidoRequest, AvanzarEstadoRequest, DetallePedidoRead, HistorialRead, PedidoRead, PedidoDetail, PedidoListResponse
- [x] repository.py — PedidoRepository: list_paginated, get_detalles, get_historial, get_forma_pago, get_direccion_del_usuario, get_producto_for_update (SELECT FOR UPDATE), add_detalle, add_historial
- [x] service.py — crear_pedido (validate stock FOR UPDATE + snapshot), avanzar_estado (FSM + stock restore en CONFIRMADO→CANCELADO), cancelar_pedido (CLIENT, solo PENDIENTE)
- [x] router.py — 6 endpoints, avanzar_estado require_role ADMIN/PEDIDOS
- [x] uow.py — registrar PedidoRepository como self.pedidos
