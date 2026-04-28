from datetime import datetime, timezone
from typing import Generic, Type, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel

T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def get_by_id(self, entity_id: int) -> T | None:
        obj = await self.session.get(self.model, entity_id)
        if obj is None:
            return None
        if hasattr(obj, "eliminado_en") and obj.eliminado_en is not None:
            return None
        return obj

    async def list_all(self, skip: int = 0, limit: int = 20) -> list[T]:
        stmt = select(self.model)
        if hasattr(self.model, "eliminado_en"):
            stmt = stmt.where(self.model.eliminado_en.is_(None))
        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self) -> int:
        stmt = select(func.count()).select_from(self.model)
        if hasattr(self.model, "eliminado_en"):
            stmt = stmt.where(self.model.eliminado_en.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def create(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def soft_delete(self, entity: T) -> None:
        entity.eliminado_en = datetime.now(timezone.utc)  # type: ignore[attr-defined]
        self.session.add(entity)
        await self.session.flush()

    async def hard_delete(self, entity: T) -> None:
        await self.session.delete(entity)
        await self.session.flush()
