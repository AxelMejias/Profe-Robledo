from typing import Optional

from sqlalchemy import func, select, text

from app.core.repository import BaseRepository
from app.modules.categorias.model import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session) -> None:
        super().__init__(Categoria, session)

    async def get_by_nombre_and_parent(
        self, nombre: str, parent_id: Optional[int]
    ) -> Categoria | None:
        stmt = (
            select(Categoria)
            .where(Categoria.nombre == nombre)
            .where(Categoria.eliminado_en.is_(None))
        )
        if parent_id is None:
            stmt = stmt.where(Categoria.parent_id.is_(None))
        else:
            stmt = stmt.where(Categoria.parent_id == parent_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_flat(self) -> list[Categoria]:
        stmt = (
            select(Categoria)
            .where(Categoria.eliminado_en.is_(None))
            .order_by(Categoria.nombre)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def has_active_products(self, categoria_id: int) -> bool:
        """RN-CA03: verifica productos activos asociados."""
        stmt = text(
            "SELECT COUNT(*) FROM producto_categorias pc "
            "JOIN productos p ON pc.producto_id = p.id "
            "WHERE pc.categoria_id = :id AND p.eliminado_en IS NULL"
        )
        result = await self.session.execute(stmt, {"id": categoria_id})
        return result.scalar_one() > 0

    async def has_active_children(self, categoria_id: int) -> bool:
        stmt = (
            select(func.count())
            .select_from(Categoria)
            .where(Categoria.parent_id == categoria_id)
            .where(Categoria.eliminado_en.is_(None))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one() > 0

    async def would_create_cycle(self, categoria_id: int, new_parent_id: int) -> bool:
        """RN-CA02: True si asignar new_parent_id como padre generaría un ciclo."""
        if categoria_id == new_parent_id:
            return True
        stmt = text(
            "WITH RECURSIVE ancestors AS ("
            "  SELECT id, parent_id FROM categorias WHERE id = :start AND eliminado_en IS NULL"
            "  UNION ALL"
            "  SELECT c.id, c.parent_id FROM categorias c"
            "  INNER JOIN ancestors a ON c.id = a.parent_id"
            "  WHERE c.eliminado_en IS NULL"
            ") SELECT COUNT(*) FROM ancestors WHERE id = :check"
        )
        result = await self.session.execute(
            stmt, {"start": new_parent_id, "check": categoria_id}
        )
        return result.scalar_one() > 0
