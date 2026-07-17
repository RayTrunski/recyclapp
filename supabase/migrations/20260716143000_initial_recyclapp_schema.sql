-- Generated from prisma/schema.prisma on 2026-07-16
create extension if not exists pgcrypto;
create schema if not exists recyclapp_schema;
set search_path to recyclapp_schema;
-- CreateEnum
CREATE TYPE "cat_rol_usuario" AS ENUM ('CIUDADANO', 'RECOLECTOR', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "cat_estado_verificacion" AS ENUM ('PENDIENTE', 'VERIFICADO', 'RECHAZADO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "cat_condicion_articulo" AS ENUM ('NUEVO', 'BUENO', 'DESGASTADO', 'DANIADO', 'INSERVIBLE');

-- CreateEnum
CREATE TYPE "cat_tipo_accion" AS ENUM ('DONAR', 'RECICLAR', 'REPARAR');

-- CreateEnum
CREATE TYPE "cat_estado_publicacion" AS ENUM ('BORRADOR', 'PENDIENTE_REVISION', 'APROBADA', 'RECHAZADA', 'RESERVADA', 'EN_PROCESO', 'RECOLECTADA', 'DONADA', 'RECICLADA', 'REPARADA', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "cat_estado_solicitud_donacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA');

-- CreateEnum
CREATE TYPE "cat_estado_recoleccion" AS ENUM ('SOLICITADA', 'PROGRAMADA', 'ASIGNADA', 'EN_RUTA', 'COMPLETADA', 'CANCELADA', 'FALLIDA');

-- CreateEnum
CREATE TYPE "cat_estado_reparacion" AS ENUM ('SOLICITADA', 'COTIZADA', 'APROBADA', 'EN_TRABAJO', 'REPARADA', 'ENTREGADA', 'NO_REPARABLE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "cat_tipo_centro_ecologico" AS ENUM ('MUNICIPAL', 'DONACION', 'REPARACION', 'PUNTO_VERDE');

-- CreateEnum
CREATE TYPE "cat_tipo_notificacion" AS ENUM ('INFORMATIVA', 'EXITO', 'ALERTA', 'ERROR');

-- CreateEnum
CREATE TYPE "cat_metodo_pago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'DEMO');

-- CreateEnum
CREATE TYPE "cat_estado_pago" AS ENUM ('PENDIENTE', 'AUTORIZADO', 'PAGADO', 'FALLIDO', 'REEMBOLSADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "d_usuario" (
    "id_usuario" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100),
    "nombre_mostrado" VARCHAR(120),
    "correo" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(30),
    "url_avatar" TEXT,
    "rol" "cat_rol_usuario" NOT NULL DEFAULT 'CIUDADANO',
    "estado_verificacion" "cat_estado_verificacion" NOT NULL DEFAULT 'PENDIENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_ultimo_acceso" TIMESTAMP(3),
    "id_direccion_principal" UUID,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "d_direccion" (
    "id_direccion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID,
    "etiqueta" VARCHAR(80),
    "nombre_contacto" VARCHAR(120),
    "telefono" VARCHAR(30),
    "pais" VARCHAR(2) NOT NULL DEFAULT 'MX',
    "estado" VARCHAR(100) NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "municipio" VARCHAR(100),
    "colonia" VARCHAR(120),
    "codigo_postal" VARCHAR(10),
    "direccion_linea_1" VARCHAR(200) NOT NULL,
    "direccion_linea_2" VARCHAR(200),
    "referencia" TEXT,
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_direccion_pkey" PRIMARY KEY ("id_direccion")
);

-- CreateTable
CREATE TABLE "c_categoria" (
    "id_categoria" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clave" VARCHAR(60) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden_visual" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_categoria_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "d_publicacion" (
    "id_publicacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "id_categoria" UUID NOT NULL,
    "id_usuario_aprobador" UUID,
    "id_direccion_recoleccion" UUID,
    "titulo" VARCHAR(150) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "condicion" "cat_condicion_articulo" NOT NULL,
    "tipo_accion" "cat_tipo_accion" NOT NULL,
    "estado_publicacion" "cat_estado_publicacion" NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "requiere_recoleccion" BOOLEAN NOT NULL DEFAULT false,
    "fecha_disponible" TIMESTAMP(3),
    "peso_estimado_kg" DECIMAL(10,2),
    "valor_estimado" DECIMAL(10,2),
    "co2_estimado_kg" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_publicacion" TIMESTAMP(3),
    "fecha_aprobacion" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_publicacion_pkey" PRIMARY KEY ("id_publicacion")
);

-- CreateTable
CREATE TABLE "d_imagen_publicacion" (
    "id_imagen_publicacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_publicacion" UUID NOT NULL,
    "url_imagen" TEXT NOT NULL,
    "ruta_storage" TEXT,
    "texto_alternativo" VARCHAR(160),
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "orden_visual" INTEGER NOT NULL DEFAULT 1,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "d_imagen_publicacion_pkey" PRIMARY KEY ("id_imagen_publicacion")
);

-- CreateTable
CREATE TABLE "r_favorito" (
    "id_favorito" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "id_publicacion" UUID NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "r_favorito_pkey" PRIMARY KEY ("id_favorito")
);

-- CreateTable
CREATE TABLE "t_solicitud_donacion" (
    "id_solicitud_donacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_publicacion" UUID NOT NULL,
    "id_usuario_solicitante" UUID NOT NULL,
    "mensaje" TEXT,
    "estado_solicitud" "cat_estado_solicitud_donacion" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_respuesta" TIMESTAMP(3),
    "fecha_cierre" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_solicitud_donacion_pkey" PRIMARY KEY ("id_solicitud_donacion")
);

-- CreateTable
CREATE TABLE "t_recoleccion" (
    "id_recoleccion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_publicacion" UUID,
    "id_usuario_solicitante" UUID NOT NULL,
    "id_recolector" UUID,
    "id_direccion_recoleccion" UUID NOT NULL,
    "id_categoria" UUID,
    "titulo_item" VARCHAR(150) NOT NULL,
    "notas" TEXT,
    "fecha_preferida" TIMESTAMP(3),
    "bloque_horario" VARCHAR(60),
    "estado_recoleccion" "cat_estado_recoleccion" NOT NULL DEFAULT 'SOLICITADA',
    "fecha_programada" TIMESTAMP(3),
    "fecha_recolectada" TIMESTAMP(3),
    "fecha_cancelacion" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_recoleccion_pkey" PRIMARY KEY ("id_recoleccion")
);

-- CreateTable
CREATE TABLE "d_perfil_recolector" (
    "id_perfil_recolector" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "tipo_vehiculo" VARCHAR(80),
    "placa_vehiculo" VARCHAR(20),
    "carga_maxima_kg" DECIMAL(10,2),
    "zona_cobertura" VARCHAR(150),
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "fecha_verificacion" TIMESTAMP(3),
    "notas" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_perfil_recolector_pkey" PRIMARY KEY ("id_perfil_recolector")
);

-- CreateTable
CREATE TABLE "c_taller_reparacion" (
    "id_taller_reparacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clave_taller" VARCHAR(80) NOT NULL,
    "nombre_taller" VARCHAR(150) NOT NULL,
    "especialidad" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "telefono" VARCHAR(30),
    "correo" VARCHAR(150),
    "sitio_web" TEXT,
    "id_direccion" UUID,
    "calificacion_promedio" DECIMAL(3,2),
    "acepta_visita_domicilio" BOOLEAN NOT NULL DEFAULT false,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_taller_reparacion_pkey" PRIMARY KEY ("id_taller_reparacion")
);

-- CreateTable
CREATE TABLE "t_reparacion" (
    "id_reparacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario_solicitante" UUID NOT NULL,
    "id_publicacion" UUID,
    "id_taller_reparacion" UUID,
    "id_categoria" UUID,
    "nombre_item" VARCHAR(150) NOT NULL,
    "descripcion_problema" TEXT,
    "costo_estimado_min" DECIMAL(10,2),
    "costo_estimado_max" DECIMAL(10,2),
    "estado_reparacion" "cat_estado_reparacion" NOT NULL DEFAULT 'SOLICITADA',
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cotizacion" TIMESTAMP(3),
    "fecha_aprobacion" TIMESTAMP(3),
    "fecha_finalizacion" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_reparacion_pkey" PRIMARY KEY ("id_reparacion")
);

-- CreateTable
CREATE TABLE "c_centro_ecologico" (
    "id_centro_ecologico" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clave_centro" VARCHAR(80) NOT NULL,
    "nombre_centro" VARCHAR(150) NOT NULL,
    "tipo_centro" "cat_tipo_centro_ecologico" NOT NULL,
    "descripcion" TEXT,
    "id_direccion" UUID,
    "telefono" VARCHAR(30),
    "correo" VARCHAR(150),
    "horario" VARCHAR(150),
    "materiales_aceptados" TEXT[],
    "calificacion_promedio" DECIMAL(3,2),
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_centro_ecologico_pkey" PRIMARY KEY ("id_centro_ecologico")
);

-- CreateTable
CREATE TABLE "log_notificacion" (
    "id_notificacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "titulo" VARCHAR(160) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo_notificacion" "cat_tipo_notificacion" NOT NULL DEFAULT 'INFORMATIVA',
    "url_accion" TEXT,
    "fecha_lectura" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_notificacion_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateTable
CREATE TABLE "t_pago" (
    "id_pago" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "id_publicacion" UUID,
    "id_solicitud_donacion" UUID,
    "id_reparacion" UUID,
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'MXN',
    "metodo_pago" "cat_metodo_pago" NOT NULL,
    "estado_pago" "cat_estado_pago" NOT NULL DEFAULT 'PENDIENTE',
    "referencia" VARCHAR(100),
    "es_demo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_pago" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_pago_pkey" PRIMARY KEY ("id_pago")
);

-- CreateTable
CREATE TABLE "d_indicador_impacto_usuario" (
    "id_usuario" UUID NOT NULL,
    "total_publicaciones" INTEGER NOT NULL DEFAULT 0,
    "total_donaciones" INTEGER NOT NULL DEFAULT 0,
    "total_reciclajes" INTEGER NOT NULL DEFAULT 0,
    "total_reparaciones" INTEGER NOT NULL DEFAULT 0,
    "total_recolecciones_completadas" INTEGER NOT NULL DEFAULT 0,
    "co2_ahorrado_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_indicador_impacto_usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "h_auditoria" (
    "id_auditoria" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID,
    "id_publicacion" UUID,
    "id_solicitud_donacion" UUID,
    "id_recoleccion" UUID,
    "id_reparacion" UUID,
    "id_pago" UUID,
    "tipo_evento" VARCHAR(80) NOT NULL,
    "tipo_entidad" VARCHAR(80) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "metadata" JSONB,
    "fecha_evento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "h_auditoria_pkey" PRIMARY KEY ("id_auditoria")
);

-- CreateIndex
CREATE UNIQUE INDEX "d_usuario_correo_key" ON "d_usuario"("correo");

-- CreateIndex
CREATE INDEX "d_usuario_rol_idx" ON "d_usuario"("rol");

-- CreateIndex
CREATE INDEX "d_usuario_estado_verificacion_idx" ON "d_usuario"("estado_verificacion");

-- CreateIndex
CREATE INDEX "d_direccion_id_usuario_idx" ON "d_direccion"("id_usuario");

-- CreateIndex
CREATE INDEX "d_direccion_estado_ciudad_idx" ON "d_direccion"("estado", "ciudad");

-- CreateIndex
CREATE UNIQUE INDEX "c_categoria_clave_key" ON "c_categoria"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "c_categoria_nombre_key" ON "c_categoria"("nombre");

-- CreateIndex
CREATE INDEX "d_publicacion_id_usuario_idx" ON "d_publicacion"("id_usuario");

-- CreateIndex
CREATE INDEX "d_publicacion_estado_publicacion_idx" ON "d_publicacion"("estado_publicacion");

-- CreateIndex
CREATE INDEX "d_publicacion_id_categoria_estado_publicacion_idx" ON "d_publicacion"("id_categoria", "estado_publicacion");

-- CreateIndex
CREATE INDEX "d_publicacion_tipo_accion_estado_publicacion_idx" ON "d_publicacion"("tipo_accion", "estado_publicacion");

-- CreateIndex
CREATE INDEX "d_publicacion_requiere_recoleccion_fecha_disponible_idx" ON "d_publicacion"("requiere_recoleccion", "fecha_disponible");

-- CreateIndex
CREATE INDEX "d_publicacion_fecha_creacion_idx" ON "d_publicacion"("fecha_creacion");

-- CreateIndex
CREATE INDEX "d_imagen_publicacion_id_publicacion_es_principal_idx" ON "d_imagen_publicacion"("id_publicacion", "es_principal");

-- CreateIndex
CREATE UNIQUE INDEX "d_imagen_publicacion_id_publicacion_orden_visual_key" ON "d_imagen_publicacion"("id_publicacion", "orden_visual");

-- CreateIndex
CREATE INDEX "r_favorito_id_publicacion_idx" ON "r_favorito"("id_publicacion");

-- CreateIndex
CREATE UNIQUE INDEX "r_favorito_id_usuario_id_publicacion_key" ON "r_favorito"("id_usuario", "id_publicacion");

-- CreateIndex
CREATE INDEX "t_solicitud_donacion_estado_solicitud_fecha_solicitud_idx" ON "t_solicitud_donacion"("estado_solicitud", "fecha_solicitud");

-- CreateIndex
CREATE UNIQUE INDEX "t_solicitud_donacion_id_publicacion_id_usuario_solicitante_key" ON "t_solicitud_donacion"("id_publicacion", "id_usuario_solicitante");

-- CreateIndex
CREATE INDEX "t_recoleccion_id_usuario_solicitante_estado_recoleccion_idx" ON "t_recoleccion"("id_usuario_solicitante", "estado_recoleccion");

-- CreateIndex
CREATE INDEX "t_recoleccion_id_recolector_estado_recoleccion_idx" ON "t_recoleccion"("id_recolector", "estado_recoleccion");

-- CreateIndex
CREATE INDEX "t_recoleccion_fecha_preferida_estado_recoleccion_idx" ON "t_recoleccion"("fecha_preferida", "estado_recoleccion");

-- CreateIndex
CREATE UNIQUE INDEX "d_perfil_recolector_id_usuario_key" ON "d_perfil_recolector"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "c_taller_reparacion_clave_taller_key" ON "c_taller_reparacion"("clave_taller");

-- CreateIndex
CREATE UNIQUE INDEX "c_taller_reparacion_nombre_taller_key" ON "c_taller_reparacion"("nombre_taller");

-- CreateIndex
CREATE INDEX "c_taller_reparacion_verificado_idx" ON "c_taller_reparacion"("verificado");

-- CreateIndex
CREATE INDEX "t_reparacion_id_usuario_solicitante_estado_reparacion_idx" ON "t_reparacion"("id_usuario_solicitante", "estado_reparacion");

-- CreateIndex
CREATE INDEX "t_reparacion_id_taller_reparacion_estado_reparacion_idx" ON "t_reparacion"("id_taller_reparacion", "estado_reparacion");

-- CreateIndex
CREATE UNIQUE INDEX "c_centro_ecologico_clave_centro_key" ON "c_centro_ecologico"("clave_centro");

-- CreateIndex
CREATE INDEX "c_centro_ecologico_tipo_centro_verificado_idx" ON "c_centro_ecologico"("tipo_centro", "verificado");

-- CreateIndex
CREATE INDEX "log_notificacion_id_usuario_fecha_lectura_idx" ON "log_notificacion"("id_usuario", "fecha_lectura");

-- CreateIndex
CREATE UNIQUE INDEX "t_pago_id_solicitud_donacion_key" ON "t_pago"("id_solicitud_donacion");

-- CreateIndex
CREATE UNIQUE INDEX "t_pago_referencia_key" ON "t_pago"("referencia");

-- CreateIndex
CREATE INDEX "t_pago_id_usuario_estado_pago_idx" ON "t_pago"("id_usuario", "estado_pago");

-- CreateIndex
CREATE INDEX "t_pago_id_publicacion_idx" ON "t_pago"("id_publicacion");

-- CreateIndex
CREATE INDEX "t_pago_id_reparacion_idx" ON "t_pago"("id_reparacion");

-- CreateIndex
CREATE INDEX "h_auditoria_tipo_evento_fecha_evento_idx" ON "h_auditoria"("tipo_evento", "fecha_evento");

-- CreateIndex
CREATE INDEX "h_auditoria_id_usuario_idx" ON "h_auditoria"("id_usuario");

-- AddForeignKey
ALTER TABLE "d_usuario" ADD CONSTRAINT "d_usuario_id_direccion_principal_fkey" FOREIGN KEY ("id_direccion_principal") REFERENCES "d_direccion"("id_direccion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_direccion" ADD CONSTRAINT "d_direccion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "d_usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_publicacion" ADD CONSTRAINT "d_publicacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "d_usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_publicacion" ADD CONSTRAINT "d_publicacion_id_usuario_aprobador_fkey" FOREIGN KEY ("id_usuario_aprobador") REFERENCES "d_usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_publicacion" ADD CONSTRAINT "d_publicacion_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "c_categoria"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_publicacion" ADD CONSTRAINT "d_publicacion_id_direccion_recoleccion_fkey" FOREIGN KEY ("id_direccion_recoleccion") REFERENCES "d_direccion"("id_direccion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_imagen_publicacion" ADD CONSTRAINT "d_imagen_publicacion_id_publicacion_fkey" FOREIGN KEY ("id_publicacion") REFERENCES "d_publicacion"("id_publicacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_favorito" ADD CONSTRAINT "r_favorito_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "d_usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_favorito" ADD CONSTRAINT "r_favorito_id_publicacion_fkey" FOREIGN KEY ("id_publicacion") REFERENCES "d_publicacion"("id_publicacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_solicitud_donacion" ADD CONSTRAINT "t_solicitud_donacion_id_publicacion_fkey" FOREIGN KEY ("id_publicacion") REFERENCES "d_publicacion"("id_publicacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_solicitud_donacion" ADD CONSTRAINT "t_solicitud_donacion_id_usuario_solicitante_fkey" FOREIGN KEY ("id_usuario_solicitante") REFERENCES "d_usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_recoleccion" ADD CONSTRAINT "t_recoleccion_id_publicacion_fkey" FOREIGN KEY ("id_publicacion") REFERENCES "d_publicacion"("id_publicacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_recoleccion" ADD CONSTRAINT "t_recoleccion_id_usuario_solicitante_fkey" FOREIGN KEY ("id_usuario_solicitante") REFERENCES "d_usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_recoleccion" ADD CONSTRAINT "t_recoleccion_id_recolector_fkey" FOREIGN KEY ("id_recolector") REFERENCES "d_usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_recoleccion" ADD CONSTRAINT "t_recoleccion_id_direccion_recoleccion_fkey" FOREIGN KEY ("id_direccion_recoleccion") REFERENCES "d_direccion"("id_direccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_recoleccion" ADD CONSTRAINT "t_recoleccion_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "c_categoria"("id_categoria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_perfil_recolector" ADD CONSTRAINT "d_perfil_recolector_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "d_usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_taller_reparacion" ADD CONSTRAINT "c_taller_reparacion_id_direccion_fkey" FOREIGN KEY ("id_direccion") REFERENCES "d_direccion"("id_direccion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_reparacion" ADD CONSTRAINT "t_reparacion_id_usuario_solicitante_fkey" FOREIGN KEY ("id_usuario_solicitante") REFERENCES "d_usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_reparacion" ADD CONSTRAINT "t_reparacion_id_publicacion_fkey" FOREIGN KEY ("id_publicacion") REFERENCES "d_publicacion"("id_publicacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_reparacion" ADD CONSTRAINT "t_reparacion_id_taller_reparacion_fkey" FOREIGN KEY ("id_taller_reparacion") REFERENCES "c_taller_reparacion"("id_taller_reparacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_reparacion" ADD CONSTRAINT "t_reparacion_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "c_categoria"("id_categoria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_centro_ecologico" ADD CONSTRAINT "c_centro_ecologico_id_direccion_fkey" FOREIGN KEY ("id_direccion") REFERENCES "d_direccion"("id_direccion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_notificacion" ADD CONSTRAINT "log_notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "d_usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_pago" ADD CONSTRAINT "t_pago_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "d_usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_pago" ADD CONSTRAINT "t_pago_id_publicacion_fkey" FOREIGN KEY ("id_publicacion") REFERENCES "d_publicacion"("id_publicacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_pago" ADD CONSTRAINT "t_pago_id_solicitud_donacion_fkey" FOREIGN KEY ("id_solicitud_donacion") REFERENCES "t_solicitud_donacion"("id_solicitud_donacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_pago" ADD CONSTRAINT "t_pago_id_reparacion_fkey" FOREIGN KEY ("id_reparacion") REFERENCES "t_reparacion"("id_reparacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_indicador_impacto_usuario" ADD CONSTRAINT "d_indicador_impacto_usuario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "d_usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h_auditoria" ADD CONSTRAINT "h_auditoria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "d_usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h_auditoria" ADD CONSTRAINT "h_auditoria_id_publicacion_fkey" FOREIGN KEY ("id_publicacion") REFERENCES "d_publicacion"("id_publicacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h_auditoria" ADD CONSTRAINT "h_auditoria_id_solicitud_donacion_fkey" FOREIGN KEY ("id_solicitud_donacion") REFERENCES "t_solicitud_donacion"("id_solicitud_donacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h_auditoria" ADD CONSTRAINT "h_auditoria_id_recoleccion_fkey" FOREIGN KEY ("id_recoleccion") REFERENCES "t_recoleccion"("id_recoleccion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h_auditoria" ADD CONSTRAINT "h_auditoria_id_reparacion_fkey" FOREIGN KEY ("id_reparacion") REFERENCES "t_reparacion"("id_reparacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h_auditoria" ADD CONSTRAINT "h_auditoria_id_pago_fkey" FOREIGN KEY ("id_pago") REFERENCES "t_pago"("id_pago") ON DELETE CASCADE ON UPDATE CASCADE;


