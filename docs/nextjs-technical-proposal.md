# Propuesta Técnica Next.js

Documentación extra de la demo ReCyClapp movida fuera del front el 17 de julio de 2026.

## Resumen

La demo se organiza como una plataforma de economía circular lista para crecer por módulos.

Esta vista resume cómo se reparte la responsabilidad entre UI, reglas de negocio y almacenamiento para sostener la operación sin perder claridad.

## Capas

### Capa de experiencia

Next.js App Router entrega la interfaz principal y concentra las vistas de catálogo, perfil, mapas y panel operativo.

### Capa de negocio

Los módulos del cliente disparan flujos de publicaciones, solicitudes de retiro y derivación a talleres con estado persistido.

### Capa de datos

Prisma y Supabase permiten consultar publicaciones, recolecciones y talleres desde una base unificada.

## Estructura sugerida

- `app/` -> rutas de Next.js y endpoints API
- `src/` -> experiencia cliente, módulos y tipos
- `lib/` -> utilidades compartidas y helpers de imágenes
- `prisma/` -> schema, seed y configuración de datos
- `docs/` -> notas de arquitectura y soporte funcional

## Principios de implementación

### Separación por responsabilidades

Las acciones del usuario viven en módulos concretos y los datos se cargan desde endpoints claros para evitar acoplamientos.

### Persistencia lista para crecer

Prisma deja preparada la evolución del schema y Supabase da una base rápida para lectura y escritura de la demo.

### Operación trazable

Publicaciones, rutas y reparaciones exponen estados legibles para que cada actor entienda qué sigue en el proceso.
