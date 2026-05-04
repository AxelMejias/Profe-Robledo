from pydantic import BaseModel

VALID_ROLES = {"ADMIN", "STOCK", "PEDIDOS", "CLIENT"}


class AssignRolesRequest(BaseModel):
    roles: list[str]


class UserRolesResponse(BaseModel):
    id: int
    email: str
    roles: list[str]

    model_config = {"from_attributes": True}
