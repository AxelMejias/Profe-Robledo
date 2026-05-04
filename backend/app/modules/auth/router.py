from fastapi import APIRouter, Depends, Request, Response, status

from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.uow import UnitOfWork
from app.modules.auth import service as auth_service
from app.modules.auth.schemas import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest) -> TokenResponse:
    async with UnitOfWork() as uow:
        return await auth_service.register(uow, body)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def login(request: Request, body: LoginRequest) -> TokenResponse:
    async with UnitOfWork() as uow:
        return await auth_service.login(uow, body)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest) -> TokenResponse:
    async with UnitOfWork() as uow:
        return await auth_service.refresh(uow, body.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: LogoutRequest,
    current_user: Usuario = Depends(get_current_user),
) -> Response:
    async with UnitOfWork() as uow:
        await auth_service.logout(uow, body.refresh_token, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserResponse)
async def me(current_user: Usuario = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        nombre=current_user.nombre,
        apellido=current_user.apellido,
        email=current_user.email,
        roles=[ur.rol_codigo for ur in current_user.usuario_roles],
        creado_en=current_user.creado_en,
    )
