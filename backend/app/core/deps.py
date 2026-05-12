from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.core.security import decode_access_token
from app.core.uow import UnitOfWork
from app.modules.usuarios.model import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Usuario:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    async with UnitOfWork() as uow:
        usuario = await uow.usuarios.get_with_roles(int(user_id))

    if usuario is None:
        raise credentials_exc
    return usuario


def require_role(roles: list[str]) -> Callable:
    async def dependency(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        user_roles: list[str] = current_user.__dict__.get("_roles", [])
        if not any(r in user_roles for r in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permiso insuficiente",
            )
        return current_user

    return dependency
