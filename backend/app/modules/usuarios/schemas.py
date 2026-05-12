from pydantic import BaseModel


class AssignRolesRequest(BaseModel):
    roles: list[str]


class UserRolesResponse(BaseModel):
    id: int
    email: str
    roles: list[str]
