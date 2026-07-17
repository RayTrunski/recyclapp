# Nomenclatura de Base de Datos y Vistas

## Objetivo

Este documento define la convención de nombres usada en la base de datos de Recyclapp para:

- tablas físicas
- columnas
- enums
- vistas de lectura
- objetos de apoyo

La meta es que el modelo sea entendible desde DBeaver, Prisma y los endpoints sin tener que traducir nombres técnicos al contexto del negocio.

## Principios generales

- Los nombres físicos de base de datos se escriben en `snake_case`.
- Los nombres se escriben en español.
- Se evita usar acentos, `ñ` y caracteres especiales en identificadores.
- Las tablas físicas usan prefijos por tipo.
- Las vistas de lectura usan el prefijo `v_` y conservan el tipo del objeto que exponen.
- Prisma puede seguir usando nombres de modelo en inglés o PascalCase, pero el nombre físico real en PostgreSQL se controla con `@map` y `@@map`.

## Prefijos oficiales

| Prefijo | Tipo | Uso |
|---|---|---|
| `c_` | Catálogo | Datos relativamente estáticos que sirven como opciones o clasificaciones |
| `d_` | Dato o detalle | Información principal registrada por el sistema |
| `t_` | Transacción | Operaciones o movimientos realizados |
| `r_` | Relación | Tablas puente para relaciones muchos a muchos |
| `h_` | Histórico | Registros anteriores, cambios o auditoría |
| `p_` | Parámetro | Configuración general del sistema |
| `tmp_` | Temporal | Información provisional o de procesamiento |
| `log_` | Bitácora | Errores, accesos, acciones o eventos del sistema |
| `v_` | Vista | Consultas almacenadas para lectura |

## Tablas físicas usadas en Recyclapp

### Catálogos `c_`

- `c_categoria`
- `c_taller_reparacion`
- `c_centro_ecologico`

### Datos `d_`

- `d_usuario`
- `d_direccion`
- `d_publicacion`
- `d_imagen_publicacion`
- `d_perfil_recolector`
- `d_indicador_impacto_usuario`

### Transacciones `t_`

- `t_solicitud_donacion`
- `t_recoleccion`
- `t_reparacion`
- `t_pago`

### Relaciones `r_`

- `r_favorito`

### Históricos `h_`

- `h_auditoria`

### Bitácora `log_`

- `log_notificacion`

## Vistas usadas en Recyclapp

Las vistas siguen la forma:

`v_` + prefijo lógico + nombre funcional

Ejemplos:

- `v_c_categoria`
- `v_c_taller_reparacion`
- `v_c_centro_ecologico`
- `v_d_usuario`
- `v_d_publicacion`
- `v_r_favorito`
- `v_t_solicitud_donacion`
- `v_t_recoleccion`
- `v_t_reparacion`
- `v_t_pago`
- `v_h_auditoria`

## Convención para nombres de columnas

### Identificadores primarios

- `id_usuario`
- `id_publicacion`
- `id_categoria`
- `id_recoleccion`
- `id_reparacion`
- `id_pago`

Regla:

- La PK debe tener nombre específico del dominio, no solo `id`.

### Claves foráneas

Se nombran igual que la PK referenciada:

- `id_usuario`
- `id_categoria`
- `id_direccion_recoleccion`
- `id_taller_reparacion`

Regla:

- Si la relación necesita contexto, se agrega el sufijo funcional.
- Ejemplo: `id_direccion_principal`, `id_direccion_recoleccion`, `id_usuario_aprobador`.

### Campos descriptivos

- `nombre`
- `titulo`
- `descripcion`
- `mensaje`
- `especialidad`
- `referencia`

### Campos booleanos

Se nombran como estado legible:

- `activo`
- `verificado`
- `disponible`
- `requiere_recoleccion`
- `es_principal`
- `es_demo`

### Campos de fecha

Formato recomendado:

- `fecha_creacion`
- `fecha_actualizacion`
- `fecha_publicacion`
- `fecha_aprobacion`
- `fecha_solicitud`
- `fecha_pago`
- `fecha_evento`

Regla:

- Prefijo `fecha_` para momentos puntuales del negocio.

### Campos numéricos y métricos

- `peso_estimado_kg`
- `co2_ahorrado_kg`
- `valor_estimado`
- `costo_estimado_min`
- `costo_estimado_max`
- `calificacion_promedio`
- `orden_visual`

Regla:

- Cuando aplique, incluir unidad en el nombre, por ejemplo `_kg`.

## Convención para enums

En Prisma:

- el nombre del enum puede mantenerse técnico para el código, por ejemplo `UserRole`
- los valores físicos en PostgreSQL se mapean en español con `@map(...)`

Ejemplos actuales:

- `UserRole -> cat_rol_usuario`
- `VerificationStatus -> cat_estado_verificacion`
- `ListingStatus -> cat_estado_publicacion`
- `PickupStatus -> cat_estado_recoleccion`
- `RepairStatus -> cat_estado_reparacion`
- `PaymentStatus -> cat_estado_pago`

Regla:

- Los enums físicos también se consideran catálogos, por eso usan el prefijo `cat_`.

## Convención para modelos Prisma

En Prisma usamos esta separación:

- nombre de modelo: orientado a código
- nombre físico en DB: orientado a negocio

Ejemplo:

```prisma
model User {
  id        String @map("id_usuario")
  firstName String @map("nombre")

  @@map("d_usuario")
}
```

Eso permite:

- escribir código legible en TypeScript
- ver tablas y columnas correctas en DBeaver

## Reglas para vistas

- Las vistas son de lectura.
- Deben exponer nombres de negocio ya listos para consultas.
- Deben evitar que el frontend conozca joins internos innecesarios.
- Deben construirse sobre el schema `recyclapp_schema`.

Regla recomendada:

- Escrituras: tablas físicas
- Lecturas de API, dashboard, reportes y catálogos: vistas `v_*`

## Ejemplos correctos

### Tabla física

- `d_publicacion`
- `t_recoleccion`
- `h_auditoria`

### Vista

- `v_d_publicacion`
- `v_t_recoleccion`
- `v_h_auditoria`

### Columna

- `id_usuario`
- `estado_publicacion`
- `fecha_actualizacion`
- `co2_estimado_kg`

## Ejemplos incorrectos

- `users`
- `pickup_requests`
- `createdAt`
- `isActive`
- `categoryId`

Estos nombres pueden existir a nivel de código Prisma, pero no deberían ser el nombre físico visible en PostgreSQL.

## Resumen práctico

- PostgreSQL físico: español + `snake_case` + prefijos por tipo.
- Prisma: nombres de modelo cómodos para código, mapeados con `@map` y `@@map`.
- Vistas: `v_` + tipo lógico + nombre funcional.
- Fechas: `fecha_*`
- IDs: `id_*`
- Booleanos: nombre de estado claro
- Métricas: incluir unidad cuando haga sentido
