# Integracion de Supabase en este proyecto

## Que ya queda funcionando con esta adaptacion

1. Si `DATABASE_URL` apunta a Supabase, `Prisma` ya consulta la base en la nube.
2. El login actual sigue funcionando porque usa `Prisma`, no `@supabase/ssr`.
3. Si quieres consumir Supabase desde el navegador, usa `lib/supabase/client.ts`.
4. Si quieres consumir Supabase desde el servidor Node, usa `lib/supabase/server.ts`.

## Variables de entorno

En Next.js, las variables expuestas al navegador deben comenzar con `NEXT_PUBLIC_`.

Variables recomendadas:

- `DATABASE_URL`: conexion PostgreSQL de Supabase para Prisma.
- `SUPABASE_URL`: URL base del proyecto Supabase.
- `SUPABASE_PUBLISHABLE_KEY`: clave publica para servidor sin privilegios especiales.
- `SUPABASE_SERVICE_ROLE_KEY`: solo para procesos de servidor confiables.
- `NEXT_PUBLIC_SUPABASE_URL`: URL base para el cliente del navegador.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave publica para el cliente del navegador.

## Ejemplos de uso

Cliente React:

```ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = createSupabaseBrowserClient();
```

Servidor Node:

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabase = createSupabaseServerClient();
```

Servidor Node con privilegios elevados:

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabase = createSupabaseServerClient({ useServiceRole: true });
```

## Nota sobre autenticacion

Tu formulario actual en `src/components/AuthModule.tsx` no usa Supabase Auth. Hace `POST` a `/api/auth/login`, y ese endpoint valida contra la tabla de usuarios usando Prisma.

Eso significa que:

- mover `DATABASE_URL` a Supabase ya cambia la base usada por el login
- no necesitas `middleware.ts` de Supabase para que ese login siga funcionando

Si despues quieres migrar a **Supabase Auth** real, ahi si habria que rediseñar el flujo de inicio de sesion.
