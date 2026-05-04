from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.core.security import decode_access_token
from app.core.uow import UnitOfWork
from app.modules.usuarios.model import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

_401 = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Token inválido o expirado",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Usuario:
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if sub is None:
            raise _401
    except JWTError:
        raise _401

    async with UnitOfWork() as uow:
        user = await uow.usuarios.get_with_roles(int(sub))

    if user is None:
        raise _401

    return user


def require_role(roles: list[str]) -> Callable:
    async def dependency(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        user_roles = {ur.rol_codigo for ur in current_user.usuario_roles}
        if not user_roles.intersection(roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permisos insuficientes",
            )
        return current_user

    return dependency
