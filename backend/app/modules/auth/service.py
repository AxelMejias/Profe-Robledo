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
from app.modules.auth.model import UsuarioRol
from app.modules.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.modules.refreshtokens.model import RefreshToken
from app.modules.usuarios.model import Usuario


def _roles_from(usuario: Usuario) -> list[str]:
    return usuario.__dict__.get("_roles", [])


async def _create_token_pair(
    uow: UnitOfWork, usuario: Usuario, roles: list[str]
) -> TokenResponse:
    access_token = create_access_token(
        {
            "sub": str(usuario.id),
            "email": usuario.email,
            "roles": roles,
        }
    )
    raw_refresh = create_refresh_token()
    token_hash = hashlib.sha256(raw_refresh.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    await uow.refresh_tokens.create(
        RefreshToken(
            token_hash=token_hash,
            usuario_id=usuario.id,
            expires_at=expires_at,
        )
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


async def register(uow: UnitOfWork, data: RegisterRequest) -> TokenResponse:
    existing = await uow.usuarios.get_by_email(data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
            headers={"X-Error-Code": "EMAIL_TAKEN"},
        )
    usuario = await uow.usuarios.create(
        Usuario(
            nombre=data.nombre,
            apellido=data.apellido,
            email=data.email,
            password_hash=hash_password(data.password),
        )
    )
    uow._session.add(UsuarioRol(usuario_id=usuario.id, rol_codigo="CLIENT"))
    await uow.flush()

    return await _create_token_pair(uow, usuario, ["CLIENT"])


async def login(uow: UnitOfWork, data: LoginRequest) -> TokenResponse:
    _invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
    )
    usuario = await uow.usuarios.get_by_email(data.email)
    if usuario is None or not verify_password(data.password, usuario.password_hash):
        raise _invalid

    usuario_con_roles = await uow.usuarios.get_with_roles(usuario.id)
    roles = _roles_from(usuario_con_roles)
    return await _create_token_pair(uow, usuario, roles)


async def refresh(uow: UnitOfWork, raw_token: str) -> TokenResponse:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    rt = await uow.refresh_tokens.get_by_hash(token_hash)

    if rt is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    if rt.revoked_at is not None:
        # Replay attack — revocar todos los tokens del usuario
        await uow.refresh_tokens.revoke_all_for_user(rt.usuario_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token ya utilizado. Sesión terminada por seguridad.",
        )

    if rt.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")

    await uow.refresh_tokens.revoke(rt)

    usuario = await uow.usuarios.get_with_roles(rt.usuario_id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    roles = _roles_from(usuario)
    return await _create_token_pair(uow, usuario, roles)


async def logout(uow: UnitOfWork, raw_token: str, current_user: Usuario) -> None:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    rt = await uow.refresh_tokens.get_by_hash(token_hash)

    if rt is None or rt.usuario_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido")

    if rt.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token ya revocado")

    await uow.refresh_tokens.revoke(rt)


def me(current_user: Usuario) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        nombre=current_user.nombre,
        apellido=current_user.apellido,
        email=current_user.email,
        telefono=current_user.telefono,
        roles=_roles_from(current_user),
        creado_en=current_user.creado_en,
    )


async def update_profile(
    uow: UnitOfWork, current_user: Usuario, data: UpdateProfileRequest
) -> UserResponse:
    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        return me(current_user)

    # Obtener una instancia attachada a la sesión del UoW
    user = await uow.usuarios.get_by_id(current_user.id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar campos
    if "nombre" in update_data:
        user.nombre = update_data["nombre"]
    if "apellido" in update_data:
        user.apellido = update_data["apellido"]
    if "telefono" in update_data:
        user.telefono = update_data["telefono"]

    await uow.usuarios.update(user)

    # Recargar con roles
    usuario_con_roles = await uow.usuarios.get_with_roles(user.id)
    return UserResponse(
        id=usuario_con_roles.id,
        nombre=usuario_con_roles.nombre,
        apellido=usuario_con_roles.apellido,
        email=usuario_con_roles.email,
        telefono=usuario_con_roles.telefono,
        roles=_roles_from(usuario_con_roles),
        creado_en=usuario_con_roles.creado_en,
    )
