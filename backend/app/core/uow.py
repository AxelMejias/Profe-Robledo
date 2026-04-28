from types import TracebackType

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal


class UnitOfWork:
    """
    Gestiona la transacción de BD para una operación de negocio completa.

    Uso:
        async with UnitOfWork() as uow:
            producto = await uow.productos.get_by_id(1)
            ...
        # commit automático al salir sin excepción
        # rollback automático si ocurre cualquier excepción

    Regla de oro: ningún service llama session.commit() directamente.
    Solo el UoW hace commit/rollback.
    """

    _session: AsyncSession

    async def __aenter__(self) -> "UnitOfWork":
        self._session = AsyncSessionLocal()
        self._init_repositories()
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        if exc_type is not None:
            await self._session.rollback()
        else:
            await self._session.commit()
        await self._session.close()

    async def flush(self) -> None:
        await self._session.flush()

    def _init_repositories(self) -> None:
        # Los repositorios de cada módulo se agregan aquí a medida que se implementan.
        # Ejemplo (change us-001-auth):
        #   from app.modules.usuarios.repository import UsuarioRepository
        #   self.usuarios = UsuarioRepository(self._session)
        pass
