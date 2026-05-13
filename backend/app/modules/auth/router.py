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
    UpdateProfileRequest,
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
    return auth_service.me(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UpdateProfileRequest,
    current_user: Usuario = Depends(get_current_user),
) -> UserResponse:
    async with UnitOfWork() as uow:
        return await auth_service.update_profile(uow, current_user, body)
