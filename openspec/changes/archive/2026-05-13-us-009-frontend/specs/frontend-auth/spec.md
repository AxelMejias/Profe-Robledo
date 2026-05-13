# Spec: frontend-auth — Autenticación y Autorización

## ADDED Requirements

### Requirement: User can register

El sistema SHALL permitir el registro de nuevos usuarios con email, nombre, apellido y contraseña.

#### Scenario: Registro exitoso
- **WHEN** usuario completa formulario con email válido, nombre, apellido y contraseña >= 8 caracteres
- **THEN** sistema llama `POST /api/v1/auth/register`, recibe tokens, almacena en authStore y redirige a `/catalogo`

#### Scenario: Email duplicado
- **WHEN** usuario intenta registrarse con email ya existente
- **THEN** sistema muestra error "El email ya está registrado"

#### Scenario: Contraseña débil
- **WHEN** usuario ingresa contraseña con menos de 8 caracteres
- **THEN** sistema muestra error de validación antes de enviar al backend

### Requirement: User can login

El sistema SHALL permitir inicio de sesión con email y contraseña, almacenando tokens JWT y datos de usuario.

#### Scenario: Login exitoso
- **WHEN** usuario ingresa credenciales válidas
- **THEN** sistema llama `POST /api/v1/auth/login`, almacena accessToken y refreshToken en authStore, carga datos de usuario con `GET /api/v1/auth/me`, y redirige a última ruta visitada o `/catalogo`

#### Scenario: Credenciales inválidas
- **WHEN** usuario ingresa email o contraseña incorrectos
- **THEN** sistema muestra error "Email o contraseña incorrectos" sin revelar cuál es incorrecto

#### Scenario: Rate limit excedido
- **WHEN** usuario supera 5 intentos fallidos en 15 minutos
- **THEN** sistema muestra error "Demasiados intentos, reintenta en X minutos" (HTTP 429)

### Requirement: User can logout

El sistema SHALL permitir cierre de sesión invalidando el refresh token en backend y limpiando el estado local.

#### Scenario: Logout exitoso
- **WHEN** usuario autenticado hace clic en "Salir"
- **THEN** sistema llama `POST /api/v1/auth/logout` con refreshToken, limpia authStore, y redirige a `/login`

#### Scenario: Logout con backend caído
- **WHEN** usuario hace logout pero backend no responde
- **THEN** sistema limpia authStore de todas formas y redirige a `/login` (logout local)

### Requirement: System refreshes tokens automatically

El sistema SHALL renovar el access token automáticamente cuando expire usando el refresh token, de forma transparente para el usuario.

#### Scenario: Token expirado en request
- **WHEN** access token expira y usuario hace una acción que requiere auth
- **THEN** interceptor Axios detecta 401, llama `POST /api/v1/auth/refresh` con refreshToken, obtiene nuevos tokens, actualiza authStore, y reintenta request original

#### Scenario: Refresh token expirado
- **WHEN** refresh token expira y sistema intenta renovar
- **THEN** backend responde 401, sistema limpia authStore y redirige a `/login`

### Requirement: Routes are protected by authentication

El sistema SHALL proteger rutas que requieren autenticación, redirigiendo a login si el usuario no está autenticado.

#### Scenario: Usuario no autenticado accede a ruta protegida
- **WHEN** usuario no autenticado intenta acceder a `/carrito`, `/pedidos`, `/perfil`, o `/admin`
- **THEN** sistema redirige a `/login` con query param `?redirect=/ruta-original`

#### Scenario: Usuario autenticado accede a ruta protegida
- **WHEN** usuario autenticado accede a ruta protegida
- **THEN** sistema permite el acceso y renderiza la página

#### Scenario: Login exitoso redirige a ruta original
- **WHEN** usuario se loguea después de ser redirigido desde ruta protegida
- **THEN** sistema redirige a la ruta original (del query param `redirect`)

### Requirement: Routes are protected by role

El sistema SHALL proteger rutas administrativas verificando que el usuario tenga el rol ADMIN.

#### Scenario: Usuario sin rol ADMIN accede a /admin
- **WHEN** usuario autenticado con rol CLIENT intenta acceder a `/admin/*`
- **THEN** sistema muestra página 403 "No tenés permisos para acceder a esta sección"

#### Scenario: Usuario con rol ADMIN accede a /admin
- **WHEN** usuario autenticado con rol ADMIN accede a `/admin/dashboard`
- **THEN** sistema permite el acceso y renderiza el dashboard

#### Scenario: Menú adaptado por rol
- **WHEN** usuario con rol CLIENT ve el menú de navegación
- **THEN** sistema muestra solo: Catálogo, Carrito, Mis Pedidos, Perfil (sin opciones de Admin)

#### Scenario: Menú admin visible para ADMIN
- **WHEN** usuario con rol ADMIN ve el menú de navegación
- **THEN** sistema muestra todas las opciones incluyendo Admin
