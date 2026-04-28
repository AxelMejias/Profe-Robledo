from fastapi import APIRouter

router = APIRouter(prefix="/productos", tags=["productos"])

# TODO: implementar en change us-003-productos
# GET    /                              (público, paginado, filtros)
# GET    /{id}                          (público)
# POST   /                              (ADMIN, STOCK)
# PUT    /{id}                          (ADMIN, STOCK)
# PATCH  /{id}/disponibilidad           (ADMIN, STOCK)
# DELETE /{id}                          (ADMIN, soft delete)
# GET    /{id}/ingredientes             (público)
# POST   /{id}/ingredientes             (ADMIN)
# DELETE /{id}/ingredientes/{ing_id}    (ADMIN)
