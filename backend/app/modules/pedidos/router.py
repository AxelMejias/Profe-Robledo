from fastapi import APIRouter

router = APIRouter(prefix="/pedidos", tags=["pedidos"])

# TODO: implementar en change us-005-pedidos
# GET    /              (CLIENT→propios, ADMIN/PEDIDOS→todos)
# GET    /{id}          (propietario/ADMIN)
# POST   /              (CLIENT — UoW atómico)
# PATCH  /{id}/estado   (ADMIN/PEDIDOS — FSM)
# GET    /{id}/historial (propietario/ADMIN)
# DELETE /{id}           (CLIENT propietario — cancelar)
