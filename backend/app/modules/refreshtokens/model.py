from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    token_hash: str = Field(max_length=64, unique=True, index=True)
    usuario_id: int = Field(foreign_key="usuarios.id")
    expires_at: datetime
    revoked_at: Optional[datetime] = Field(default=None)
    creado_en: datetime = Field(default_factory=datetime.utcnow)
