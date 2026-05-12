# Tasks: us-008-direcciones

- [x] model.py — DireccionEntrega(id, usuario_id FK, alias, linea1, linea2, ciudad, codigo_postal, referencia, es_principal, timestamps, eliminado_en)
- [x] schemas.py — DireccionCreate, DireccionUpdate, DireccionRead
- [x] repository.py — DireccionRepository: list_del_usuario, get_del_usuario, count_del_usuario, desactivar_todas (UPDATE SET es_principal=False WHERE usuario_id)
- [x] service.py — crear (RN-DI01), actualizar, eliminar (soft), marcar_principal (RN-DI02: desactivar_todas + set True)
- [x] router.py — 6 endpoints, DELETE retorna 204
- [x] uow.py — registrar DireccionRepository como self.direcciones
