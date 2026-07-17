# Módulos, Endpoints y Funcionalidad

## Propósito de este documento

Este archivo describe la aplicación por módulos funcionales.

La idea no es documentar solamente componentes visuales, sino explicar:

- qué hace cada módulo
- qué datos necesita
- qué endpoints toca
- cómo se relaciona con el resto del flujo

## Vista general

La interfaz principal vive en [`src/App.tsx`](../src/App.tsx).

`App` funciona como coordinador de la experiencia:

- carga publicaciones desde la base
- conserva la sesión del usuario
- distribuye datos a los módulos
- centraliza varias acciones del frontend hacia los endpoints

Los módulos visibles se renderizan por pestaña:

- `inicio`
- `articulos`
- `publicar`
- `recolecciones`
- `reparaciones`
- `centros`
- `mensajeria`
- `estadisticas`
- `perfil`
- `admin`

## Mapa rápido de módulos

| Módulo | Componente | Objetivo principal | Endpoints relacionados |
| --- | --- | --- | --- |
| Autenticación | `src/components/AuthModule.tsx` | iniciar sesión y crear cuentas | `POST /api/auth/login`, `POST /api/auth/register` |
| Catálogo | `src/components/CatalogModule.tsx` | explorar publicaciones y solicitar artículos | `GET /api/listings`, `POST /api/claims` |
| Publicación | `src/components/PublishModule.tsx` | crear artículos en la base | `POST /api/listings` |
| Recolecciones | `src/components/CollectionModule.tsx` | programar retiros y consultar agenda | `GET /api/pickups`, `POST /api/pickups` |
| Reparaciones | `src/components/RepairModule.tsx` | derivar artículos a talleres | `GET /api/repairs`, `POST /api/repairs` |
| Centros | `src/components/GeoModule.tsx` | mostrar mapa operativo y talleres | `GET /api/repairs` |
| Mensajería | `src/components/MessagingModule.tsx` | conversar en tiempo real y compartir ubicación | `GET /api/conversations`, `GET /api/conversations/[conversationId]`, `POST /api/conversations/[conversationId]/messages`, `POST /api/conversations/[conversationId]/read`, `POST /api/location` |
| Estadísticas | `src/components/StatsModule.tsx` | mostrar impacto real y gamificación | `GET /api/stats` |
| Administración | `src/components/AdminPanel.tsx` | supervisión visual del demo | usa estado cargado en `App` |

## Módulos funcionales

### 1. Autenticación

**Componente**

- [`src/components/AuthModule.tsx`](../src/components/AuthModule.tsx)

**Qué hace**

- permite iniciar sesión con usuario almacenado en la base
- permite crear una cuenta nueva
- sincroniza la sesión del frontend con Supabase Auth para habilitar mensajería en tiempo real
- devuelve al usuario un perfil local usable por el resto de módulos

**Qué datos maneja**

- correo o identificador
- contraseña
- datos básicos de registro
- dirección principal opcional
- persistencia de sesión local

**Endpoints**

- `POST /api/auth/login`
- `POST /api/auth/register`

**Observaciones**

- el login funcional no depende únicamente de Supabase Auth
- primero valida contra la tabla de usuarios vía Prisma
- después intenta sincronizar Supabase Auth para Realtime

### 2. Catálogo de artículos

**Componente**

- [`src/components/CatalogModule.tsx`](../src/components/CatalogModule.tsx)

**Qué hace**

- muestra publicaciones visibles en la plataforma
- permite filtrar por categoría, tipo de acción y búsqueda
- abre una ficha detallada del artículo
- permite solicitar un artículo disponible

**Datos que recibe**

- `listings`
- `currentUser`
- callback para solicitar artículo

**Cómo llega la información**

- `App` carga publicaciones desde `GET /api/listings`
- el módulo recibe esa lista ya resuelta como props

**Endpoints relacionados**

- `GET /api/listings`
- `POST /api/claims`

**Comportamiento importante**

- los artículos `pendiente` siguen siendo privados para su dueño
- las publicaciones aprobadas o ya activas se muestran a todos los usuarios

### 3. Publicación de artículos

**Componente**

- [`src/components/PublishModule.tsx`](../src/components/PublishModule.tsx)

**Qué hace**

- guía al usuario para registrar un artículo
- recoge título, categoría, estado, acción, descripción, imagen y ubicación
- crea la publicación con persistencia inmediata

**Endpoint relacionado**

- `POST /api/listings`

**Resultado esperado**

- el artículo queda disponible en la base
- se refleja en el catálogo
- se actualiza el estado local del frontend

### 4. Recolecciones

**Componente**

- [`src/components/CollectionModule.tsx`](../src/components/CollectionModule.tsx)

**Qué hace**

- muestra la agenda de recolecciones de un usuario
- permite programar retiro de artículos propios
- soporta vista distinta para ciudadanos y recolectores

**Datos que usa**

- publicaciones del usuario
- solicitudes de recolección ya existentes
- dirección y horario preferido

**Endpoints relacionados**

- `GET /api/pickups?userId=...`
- `POST /api/pickups`

**Notas**

- para un ciudadano, la agenda se filtra por solicitante
- para un recolector, la agenda se filtra por recolector asignado

### 5. Reparaciones

**Componente**

- [`src/components/RepairModule.tsx`](../src/components/RepairModule.tsx)

**Qué hace**

- conecta un artículo del usuario con un taller registrado
- muestra seguimiento de solicitudes de reparación
- ofrece talleres destacados y lista completa

**Datos que usa**

- artículos del usuario
- talleres disponibles
- solicitudes previas de reparación

**Endpoints relacionados**

- `GET /api/repairs?userId=...`
- `POST /api/repairs`

**Notas**

- el endpoint también sirve como fuente de talleres para otros módulos
- los estados de reparación se generan con una lógica demo para mostrar avance realista

### 6. Centros y mapa operativo

**Componente**

- [`src/components/GeoModule.tsx`](../src/components/GeoModule.tsx)

**Qué hace**

- muestra mapa operativo con centros estáticos y talleres reales
- mezcla puntos de demo con talleres cargados desde base
- permite buscar talleres, filtrar y enfocar uno en el mapa

**Subcomponentes relacionados**

- [`src/components/OperationalCentersMap.tsx`](../src/components/OperationalCentersMap.tsx)

**Endpoint relacionado**

- `GET /api/repairs`

**Notas**

- este módulo requiere login
- los talleres se leen desde base
- las coordenadas del demo se calculan de forma estable para la experiencia visual

### 7. Mensajería en tiempo real

**Componente**

- [`src/components/MessagingModule.tsx`](../src/components/MessagingModule.tsx)

**Qué hace**

- abre hilos reales entre participantes
- muestra mensajes y ubicación compartida
- marca conversaciones como leídas
- usa Supabase Realtime para actualizar mensajes y presencia

**Subcomponentes relacionados**

- [`src/components/SharedLocationMap.tsx`](../src/components/SharedLocationMap.tsx)

**Endpoints relacionados**

- `GET /api/conversations?userId=...`
- `GET /api/conversations/[conversationId]?userId=...`
- `POST /api/conversations/[conversationId]/messages`
- `POST /api/conversations/[conversationId]/read`
- `POST /api/location`

**Comportamientos importantes**

- la ubicación compartida en un mensaje guarda snapshot histórico
- la última ubicación del usuario se conserva aparte
- el mapa del mensaje se abre en modal
- el chat permite presencia en línea vía Supabase

### 8. Estadísticas y gamificación

**Componente**

- [`src/components/StatsModule.tsx`](../src/components/StatsModule.tsx)

**Qué hace**

- construye un panel de impacto real del usuario
- resume publicaciones, entregas, actividad y ubicación compartida
- resuelve mensajes de gamificación e insignias

**Endpoint relacionado**

- `GET /api/stats?userId=...`

**Fuente de datos**

- publicaciones
- solicitudes
- recolecciones
- reparaciones
- mensajes con ubicación
- tabla opcional `public.gamification_messages`

**Notas**

- si la tabla `public.gamification_messages` no existe, el endpoint usa mensajes locales de fallback

### 9. Administración

**Componente**

- [`src/components/AdminPanel.tsx`](../src/components/AdminPanel.tsx)

**Qué hace**

- muestra una vista de supervisión para el rol admin
- consume el estado cargado previamente por `App`
- permite aprobar o rechazar publicaciones y asignar recolectores en la UI demo

**Endpoints**

- no consume un endpoint exclusivo
- trabaja sobre los datos ya cargados por:
  - `GET /api/listings`
  - `GET /api/pickups`

## Catálogo de endpoints

### `POST /api/auth/login`

**Propósito**

- validar credenciales contra la tabla de usuarios
- devolver un perfil listo para sesión
- intentar sincronizar Supabase Auth

**Body esperado**

```json
{
  "usuario": "correo@ejemplo.com",
  "password": "secreto"
}
```

**Responde**

- `200` con `{ success, user, realtimeEnabled, realtimeMessage }`
- `400` si faltan datos
- `401` si las credenciales no coinciden

### `POST /api/auth/register`

**Propósito**

- crear un usuario real en la base
- guardar dirección principal si se proporciona información suficiente
- sincronizar Supabase Auth

**Body esperado**

```json
{
  "firstName": "Clara",
  "lastName": "Solís",
  "displayName": "Clara Solís",
  "email": "clara@recyclapp.mx",
  "password": "secreto",
  "phone": "+52 55 1234 5678",
  "addressLine1": "Av. Reforma 120",
  "neighborhood": "Centro",
  "city": "Ciudad de México",
  "state": "CDMX"
}
```

**Responde**

- `201` con el usuario creado
- `400` si faltan nombre, correo o contraseña
- `409` si el correo ya existe

### `GET /api/listings`

**Propósito**

- devolver publicaciones activas para el catálogo

**Uso principal**

- `App` al iniciar
- `App` al volver a la pestaña `Artículos`

**Responde**

- lista de `Listing`

### `POST /api/listings`

**Propósito**

- crear una nueva publicación

**Reglas clave**

- requiere `ownerId`, `title`, `category`, `location` e `image`
- crea dirección de pickup asociada
- registra la publicación como `APPROVED` en el demo actual

### `POST /api/claims`

**Propósito**

- crear una solicitud de donación sobre una publicación

**Qué hace además**

- evita solicitudes sobre artículos propios
- evita múltiples solicitudes activas
- crea un `pickupRequest`
- abre una conversación
- crea el primer mensaje del hilo

### `GET /api/pickups?userId=...`

**Propósito**

- devolver agenda de recolecciones de un usuario

**Comportamiento**

- si el usuario es recolector, filtra por `collectorId`
- si no, filtra por `requesterId`

### `POST /api/pickups`

**Propósito**

- crear una solicitud de recolección a partir de una publicación propia

**Qué hace**

- crea dirección de retiro
- elige recolector al azar si existe alguno activo
- devuelve el pickup ya formateado desde la vista SQL

### `GET /api/repairs`

**Propósito**

- servir dos cosas a la vez:
  - reparaciones del usuario si viene `userId`
  - talleres disponibles para toda la app

**Uso**

- `RepairModule`
- `GeoModule`

### `POST /api/repairs`

**Propósito**

- registrar una nueva solicitud de reparación

**Qué hace**

- valida usuario, artículo y taller
- crea la reparación
- asigna estado y rango de costo demo
- devuelve la reparación desde la vista SQL

### `GET /api/conversations?userId=...`

**Propósito**

- devolver la bandeja resumida de conversaciones

**Incluye**

- participante contrario
- último mensaje
- último punto de ubicación conocido
- conteo de no leídos

### `GET /api/conversations/[conversationId]?userId=...`

**Propósito**

- devolver el detalle completo de una conversación

**Incluye**

- participantes
- mensajes
- snapshots de ubicación en mensajes
- última ubicación conocida de cada participante

### `POST /api/conversations/[conversationId]/messages`

**Propósito**

- enviar mensajes de texto, sistema o ubicación

**Casos**

- `TEXT`
- `SYSTEM`
- `LOCATION`

**Comportamiento extra para ubicación**

- guarda el mensaje con latitud, longitud y precisión
- actualiza `userLastLocation`

### `POST /api/conversations/[conversationId]/read`

**Propósito**

- marcar una conversación como leída para un participante

### `POST /api/location`

**Propósito**

- guardar o actualizar la última ubicación conocida del usuario

**Uso actual**

- al entrar con sesión
- durante flujos de ubicación relacionados con chat

### `GET /api/stats?userId=...`

**Propósito**

- devolver el panel de estadísticas y gamificación del usuario

**Incluye**

- métricas de impacto
- mensaje de impacto
- mensaje de logro
- siguiente reto
- insignias desbloqueadas
- próxima insignia

## Relaciones clave entre módulos

### Publicación -> Catálogo

Cuando un usuario crea un artículo:

- `PublishModule` hace `POST /api/listings`
- `App` actualiza el estado local
- el catálogo vuelve a consultar publicaciones al entrar a `Artículos`

### Catálogo -> Claims -> Mensajería

Cuando alguien solicita un artículo:

- `CatalogModule` activa `POST /api/claims`
- el backend crea `ListingClaim`
- el backend crea `PickupRequest`
- el backend abre `Conversation`
- el backend crea el primer mensaje

### Mensajería -> Ubicación

Cuando se comparte una ubicación:

- el chat envía `POST /api/conversations/[conversationId]/messages`
- el mensaje conserva su snapshot histórico
- además se actualiza la última ubicación conocida del usuario

### Actividad -> Estadísticas

`StatsModule` no inventa métricas:

- las calcula desde publicaciones
- solicitudes
- entregas detectadas
- reparaciones
- días de actividad
- ubicación compartida

## Archivos principales relacionados

- [`src/App.tsx`](../src/App.tsx)
- [`src/components/AuthModule.tsx`](../src/components/AuthModule.tsx)
- [`src/components/CatalogModule.tsx`](../src/components/CatalogModule.tsx)
- [`src/components/PublishModule.tsx`](../src/components/PublishModule.tsx)
- [`src/components/CollectionModule.tsx`](../src/components/CollectionModule.tsx)
- [`src/components/RepairModule.tsx`](../src/components/RepairModule.tsx)
- [`src/components/GeoModule.tsx`](../src/components/GeoModule.tsx)
- [`src/components/MessagingModule.tsx`](../src/components/MessagingModule.tsx)
- [`src/components/StatsModule.tsx`](../src/components/StatsModule.tsx)
- [`app/api/`](../app/api)
