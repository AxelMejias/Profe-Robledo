from fastapi import APIRouter

router = APIRouter(prefix="/categorias", tags=["categorias"])

# TODO: implementar en change us-002-categorias
# GET    /           (público)
# GET    /{id}       (público)
# GET    /{id}/arbol (CTE recursiva, público)
# POST   /           (ADMIN, STOCK)
# PUT    /{id}       (ADMIN, STOCK)
# DELETE /{id}       (ADMIN, STOCK, soft delete)
