from fastapi import APIRouter

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

# TODO: implementar en change us-001-auth
# GET  /        (ADMIN)
# GET  /{id}    (ADMIN)
# PUT  /{id}    (ADMIN)
# DELETE /{id}  (ADMIN, soft delete)
