## Run Locally
**Prerequisites:** Node.js 20.9+


1. Install dependencies:
   `npm install`
2. Run the Next.js app:
   `npm run dev`
3. Open:
   `http://localhost:3000`

## Stack

- Next.js App Router
- React 19
- Tailwind CSS 4
- Prisma
- Supabase/PostgreSQL

## Database

1. Start PostgreSQL with Docker:
   `docker compose up -d`
2. Use the local connection from `.env.example` in DBeaver (`localhost:5433`).
3. Push the Prisma schema:
   `npx prisma db push`
4. Seed base catalogs:
   `npx tsx prisma/seed.ts`
5. Create the read views from:
   `database/views/01_read_views.sql`

## Supabase

Si ya moviste `DATABASE_URL` a Supabase, el backend con Prisma puede seguir funcionando sin reescribir el login actual.

Guia corta:
`docs/supabase-integration.md`

Migracion de tablas, datos y vistas:
`docs/supabase-migration.md`
