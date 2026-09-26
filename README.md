# ReCyClapp

ReCyClapp es una demo funcional de economía circular pensada para conectar personas, publicaciones, recolecciones, reparaciones, mensajería y centros operativos en una sola experiencia.

La idea del proyecto es mostrar cómo un hogar puede publicar un artículo, otro usuario puede solicitarlo, abrir un hilo de mensajería, compartir ubicación y coordinar la entrega mientras todo queda respaldado por una base de datos real.

Este repositorio contiene la aplicación web construida con `Next.js`, `Prisma` y `Supabase`. La documentación técnica y operativa más detallada vive en la carpeta [`docs/`](./docs).

## Qué hace el proyecto

ReCyClapp organiza el flujo circular en varios módulos conectados:

- `Artículos`: catálogo de publicaciones visibles para los usuarios.
- `Donar / Reciclar`: creación de artículos con persistencia en base de datos.
- `Recolecciones`: seguimiento de solicitudes y retiros.
- `Reparaciones`: derivación de artículos a talleres registrados.
- `Centros`: mapa operativo con talleres, puntos verdes y centros de donación.
- `Mensajería`: conversaciones en tiempo real entre participantes, con geolocalización compartida.
- `Estadísticas`: progreso del usuario, impacto ecológico y gamificación.

## Estado del demo

La aplicación ya integra piezas reales del backend:

- base de datos PostgreSQL modelada con Prisma
- sincronización con Supabase
- autenticación propia apoyada por base de datos
- Supabase Realtime para mensajería
- Geolocation API del navegador para ubicación
- mapas con Leaflet y OpenStreetMap

Algunas partes siguen orientadas a demo y prototipo, pero la estructura ya está preparada para crecer hacia una implementación más completa.

## Stack principal

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Prisma`
- `Supabase`
- `PostgreSQL`
- `Leaflet / React Leaflet`

## Estructura general

- [`app/`](./app): rutas de Next.js y endpoints API
- [`src/components/`](./src/components): módulos visibles de la aplicación
- [`lib/`](./lib): utilidades, helpers de auth, Prisma y Supabase
- [`prisma/`](./prisma): esquema y seed
- [`supabase/`](./supabase): migraciones SQL para Supabase
- [`docs/`](./docs): documentación técnica, integración y migración

## Cómo correrlo localmente

### Requisitos

- `Node.js 20.9+`
- variables de entorno configuradas
- acceso a una base PostgreSQL local o en Supabase

### Pasos básicos

1. Instala dependencias:

```bash
npm install
```

2. Configura tu archivo `.env`.

3. Ejecuta la aplicación:

```bash
npm run dev
```

4. Abre:

```text
http://localhost:3000
```

## Base de datos y datos semilla

Si vas a trabajar con la base local o quieres regenerar catálogos y datos demo:

1. Levanta PostgreSQL con Docker:

```bash
docker compose up -d
```

2. Revisa el esquema de Prisma en [`prisma/schema.prisma`](./prisma/schema.prisma).

3. Ejecuta el seed:

```bash
npm run db:seed
```

4. Si necesitas comandos de Prisma:

```bash
npm run prisma -- generate
npm run db:pull
```

## Documentación

La documentación detallada no vive en este README. Este archivo es solo una introducción al proyecto.

Para profundizar, revisa:

- [`docs/nextjs-technical-proposal.md`](./docs/nextjs-technical-proposal.md): panorama técnico general y capas del proyecto
- [`docs/supabase-integration.md`](./docs/supabase-integration.md): integración de Supabase en la app
- [`docs/supabase-migration.md`](./docs/supabase-migration.md): migración de base de datos y vistas hacia Supabase

## Enfoque del repositorio

Este proyecto está pensado como una base demostrativa pero seria:

- la UI busca comunicar el flujo completo del producto
- los módulos ya intercambian datos reales
- la arquitectura está separada para poder crecer sin rehacer todo

