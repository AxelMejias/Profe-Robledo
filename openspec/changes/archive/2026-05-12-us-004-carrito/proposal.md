# Proposal: us-004-carrito

## Qué
Validación server-side del carrito antes de crear el pedido. El carrito es stateless en cliente (Zustand), el backend solo valida.

## Por qué
Garantizar que al crear un pedido los productos existen, están disponibles y tienen stock suficiente — sin depender del cliente.

## Alcance
- `POST /api/v1/carrito/validar` — recibe lista de items, verifica stock y disponibilidad, devuelve `{ valido, errores }`

## Commit
eba9070 feat(change 4 carrito): implement POST /carrito/validar server-side validation
