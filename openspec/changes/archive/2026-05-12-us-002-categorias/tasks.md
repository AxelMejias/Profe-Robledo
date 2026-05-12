# Tasks: us-002-categorias

- [x] model.py — Categoria(id, nombre, descripcion, imagen_url, parent_id FK self, timestamps, eliminado_en)
- [x] schemas.py — CategoriaCreate, CategoriaUpdate, CategoriaRead
- [x] repository.py — BaseRepository[Categoria] + list_paginated con filtro parent_id
- [x] service.py — CRUD con validación de parent circular, soft delete
- [x] router.py — 5 endpoints, require_role ADMIN/STOCK para escritura
