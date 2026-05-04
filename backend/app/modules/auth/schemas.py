from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str

    @field_validator("nombre", "apellido")
    @classmethod
    def min_length_2(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("debe tener al menos 2 caracteres")
        return v.strip()

    @field_validator("password")
    @classmethod
    def min_length_8(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("debe tener al menos 8 caracteres")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    email: str
    roles: list[str]
    creado_en: datetime

    model_config = {"from_attributes": True}


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str
