# Migracion de Recyclapp a Supabase

## Estado actual del repo

- El dump local disponible es `backups/recyclapp.dump`.
- El dump fue creado el **15 de julio de 2026**.
- Es un dump `CUSTOM` de PostgreSQL 16.14.
- Contiene:
  - schema `recyclapp_schema`
  - extension `pgcrypto`
  - tipos enum
  - tablas
  - datos
  - constraints
  - indices
- Las vistas de lectura viven aparte en `database/views/01_read_views.sql`.

## Lo que falta para restaurar en Supabase

Tu `.env` actual sigue apuntando localmente:

```env
DATABASE_URL=postgresql://postgres:...@localhost:5433/recyclapp?schema=recyclapp_schema
```

Para restaurar en Supabase necesitas agregar una de estas variables con la **conexion PostgreSQL** de Supabase:

```env
SUPABASE_DB_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

o cambiar `DATABASE_URL` para que deje de apuntar a `localhost`.

## Donde sacar la URL correcta

En Supabase:

1. Ve a `Project > Settings > Database > Connection pooling`.
2. Copia la cadena del **Session pooler**.
3. Usa el puerto `5432`.

Evita usar para esta migracion el host directo:

```env
postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

Ese host directo puede resolverse por IPv6 dentro de Docker en Windows y producir errores como `Network unreachable`.

## Ejecucion recomendada

### Opcion A: importar tablas con sus datos actuales

1. Si quieres refrescar el dump desde Docker:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/export-local-docker-db.ps1
```

2. Configura `SUPABASE_DB_URL` en `.env`.

3. Ejecuta la restauracion completa:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-supabase.ps1
```

Eso hace:

1. crea `pgcrypto` y `recyclapp_schema`
2. restaura tablas, datos, constraints e indices desde el dump
3. recrea las vistas
4. aplica grants del schema custom para Supabase
5. corre una verificacion basica

Esta opcion es la correcta si quieres pasar **tablas + datos reales + vistas** desde tu base actual.

### Opcion B: dejar el esquema versionado con Supabase CLI

El repo ya incluye migraciones iniciales en:

- `supabase/migrations/20260716143000_initial_recyclapp_schema.sql`
- `supabase/migrations/20260716143100_recyclapp_views_and_grants.sql`

Estas migraciones sirven para:

- crear enums, tablas, indices y foreign keys
- recrear vistas
- aplicar grants al schema custom

Pero no cargan automaticamente los **datos historicos** del dump.

Flujo CLI:

```powershell
supabase link --project-ref kdeprsibzdvawkpnfaou
supabase db push
```

Si no tienes el CLI instalado, puedes usar `npx supabase`.

## Si quieres usar el schema custom desde Supabase API

Ademas del SQL de grants, agrega `recyclapp_schema` a `API Settings > Exposed schemas` en el dashboard de Supabase.

## Prisma con Supabase

Tus tablas y vistas de negocio no estan en `public`, sino en `recyclapp_schema`.
Por ejemplo, los articulos viven en `recyclapp_schema.d_publicacion` y la vista de lectura en `recyclapp_schema.v_d_publicacion`.

Para evitar que `prisma db pull` falle por una `DATABASE_URL` incompleta o mal formateada, el repo ahora incluye un wrapper que reutiliza la misma normalizacion del runtime:

```powershell
npm run db:pull
```

Si quieres correr otros comandos de Prisma contra Supabase usando esa misma URL normalizada:

```powershell
npm run prisma -- studio
npm run prisma -- migrate status
npm run db:generate
```

La cadena de conexion recomendada en `.env` debe quedar con este formato:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?schema=recyclapp_schema&sslmode=require"
```

## Archivos involucrados

- `scripts/export-local-docker-db.ps1`
- `scripts/restore-supabase.ps1`
- `database/supabase/01_prepare_target.sql`
- `database/supabase/02_expose_custom_schema.sql`
- `database/supabase/03_verify_migration.sql`
- `database/views/01_read_views.sql`
