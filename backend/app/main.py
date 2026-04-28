from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings

# ---------------------------------------------------------------------------
# Rate limiter — se inyecta como dependencia en los routers que lo necesiten
# (principalmente POST /auth/login)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Food Store API",
    description="API REST para el sistema de e-commerce Food Store",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Middlewares
# ---------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers — se descomentan a medida que se implementa cada change
# ---------------------------------------------------------------------------
# from app.modules.auth.router import router as auth_router
# from app.modules.usuarios.router import router as usuarios_router
# from app.modules.direcciones.router import router as direcciones_router
# from app.modules.categorias.router import router as categorias_router
# from app.modules.productos.router import router as productos_router
# from app.modules.pedidos.router import router as pedidos_router
# from app.modules.pagos.router import router as pagos_router
# from app.modules.admin.router import router as admin_router

# app.include_router(auth_router,       prefix="/api/v1")
# app.include_router(usuarios_router,   prefix="/api/v1")
# app.include_router(direcciones_router, prefix="/api/v1")
# app.include_router(categorias_router, prefix="/api/v1")
# app.include_router(productos_router,  prefix="/api/v1")
# app.include_router(pedidos_router,    prefix="/api/v1")
# app.include_router(pagos_router,      prefix="/api/v1")
# app.include_router(admin_router,      prefix="/api/v1")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "version": "1.0.0"}
