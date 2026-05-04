import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.core.uow import UnitOfWork
from app.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.modules.refreshtokens.model import RefreshToken
from app.modules.usuarios.model import Usuario


async def _create_token_pair(uow: UnitOfWork, usuario: Usuario) -> TokenResponse:
    roles = [ur.rol_codigo for ur in usuario.usuario_roles]
    access_token = create_access_token(
        {"sub": str(usuario.id), "email": usuario.email, "roles": roles}
    )
    raw_refresh = create_refresh_token()
    token_hash = hashlib.sha256(raw_refresh.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    rt = RefreshToken(
        token_hash=token_hash,
        usuario_id=usuario.id,
        expires_at=expires_at,
    )
    await uow.refresh_tokens.create(rt)
    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


async def register(uow: UnitOfWork, data: RegisterRequest) -> TokenResponse:
    if await uow.usuarios.get_by_email(data.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )
    usuario = Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    await uow.usuarios.create(usuario)
    await uow.usuarios.add_rol(usuario.id, "CLIENT", asignado_por_id=usuario.id)
    usuario_with_roles = await uow.usuarios.get_with_roles(usuario.id)
    return await _create_token_pair(uow, usuario_with_roles)


async def login(uow: UnitOfWork, data: LoginRequest) -> TokenResponse:
    usuario = await uow.usuarios.get_by_email(data.email)
    if usuario is None or not verify_password(data.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )
    usuario_with_roles = await uow.usuarios.get_with_roles(usuario.id)
    return await _create_token_pair(uow, usuario_with_roles)


async def refresh(uow: UnitOfWork, refresh_token: str) -> TokenResponse:
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    rt = await uow.refresh_tokens.get_by_hash(token_hash)

    if rt is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    if rt.revoked_at is not None:
        # UoW separado para que el commit de revocación no quede atado
        # al rollback que dispara la HTTPException en el UoW del router.
        async with UnitOfWork() as revoke_uow:
            await revoke_uow.refresh_tokens.revoke_all_for_user(rt.usuario_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token ya revocado",
        )
    if datetime.now(timezone.utc) > rt.expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
        )

    await uow.refresh_tokens.revoke(rt)
    usuario = await uow.usuarios.get_with_roles(rt.usuario_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )
    return await _create_token_pair(uow, usuario)


async def logout(uow: UnitOfWork, refresh_token: str, current_user: Usuario) -> None:
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    rt = await uow.refresh_tokens.get_by_hash(token_hash)

    if rt is None or rt.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido",
        )
    if rt.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token ya revocado",
        )
    await uow.refresh_tokens.revoke(rt)
