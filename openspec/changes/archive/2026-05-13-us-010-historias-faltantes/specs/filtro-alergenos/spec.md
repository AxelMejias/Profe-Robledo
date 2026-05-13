## ADDED Requirements

### Requirement: Filtrar productos excluyendo alérgenos
`GET /productos` SHALL aceptar el query param `excluir_alergenos: list[int]` (IDs de ingredientes). Cuando se provee, el endpoint excluye todos los productos que contengan al menos uno de esos ingredientes.

#### Scenario: Sin filtro de alérgenos
- **WHEN** `excluir_alergenos` no se envía
- **THEN** el catálogo retorna todos los productos disponibles sin filtro adicional

#### Scenario: Excluir por un alérgeno
- **WHEN** `excluir_alergenos=3` (por ejemplo, gluten)
- **THEN** la respuesta excluye todos los productos que tengan el ingrediente id=3

#### Scenario: Excluir por múltiples alérgenos
- **WHEN** `excluir_alergenos=3&excluir_alergenos=7`
- **THEN** se excluyen productos que contengan el ingrediente 3 O el ingrediente 7 (unión)

#### Scenario: Alérgeno inexistente
- **WHEN** se envía un ID de ingrediente que no existe
- **THEN** el filtro se aplica igualmente sin error (simplemente no excluye nada para ese ID)

### Requirement: UI de filtro por alérgenos en catálogo
`FiltrosCatalogo` SHALL mostrar una sección "Sin alérgenos" con checkboxes por cada ingrediente marcado como `es_alergeno: true`. Al seleccionar uno, se agrega su ID al query param y el catálogo se actualiza automáticamente.

#### Scenario: Seleccionar alérgeno en UI
- **WHEN** el usuario marca el checkbox de "Gluten"
- **THEN** `FiltrosCatalogo` agrega el ID de gluten a `excluir_alergenos` y el grid se recarga

#### Scenario: Deseleccionar alérgeno
- **WHEN** el usuario desmarca un checkbox previamente seleccionado
- **THEN** el ID se elimina de `excluir_alergenos` y el grid se recarga
