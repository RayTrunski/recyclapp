BEGIN;

SET search_path TO recyclapp_schema;

DROP VIEW IF EXISTS v_h_auditoria;
DROP VIEW IF EXISTS v_t_pago;
DROP VIEW IF EXISTS v_t_reparacion;
DROP VIEW IF EXISTS v_t_recoleccion;
DROP VIEW IF EXISTS v_t_solicitud_donacion;
DROP VIEW IF EXISTS v_r_favorito;
DROP VIEW IF EXISTS v_d_publicacion;
DROP VIEW IF EXISTS v_d_usuario;
DROP VIEW IF EXISTS v_c_centro_ecologico;
DROP VIEW IF EXISTS v_c_taller_reparacion;
DROP VIEW IF EXISTS v_c_categoria;

CREATE VIEW v_c_categoria AS
SELECT
  c.id_categoria,
  c.clave AS clave_categoria,
  c.nombre AS nombre_categoria,
  c.descripcion AS descripcion_categoria,
  c.orden_visual,
  c.activo,
  c.fecha_creacion,
  c.fecha_actualizacion
FROM c_categoria c;

CREATE VIEW v_c_taller_reparacion AS
SELECT
  t.id_taller_reparacion,
  t.clave_taller,
  t.nombre_taller,
  t.especialidad,
  t.descripcion,
  t.telefono,
  t.correo,
  t.sitio_web,
  t.acepta_visita_domicilio,
  t.calificacion_promedio,
  t.verificado,
  d.id_direccion,
  d.estado,
  d.ciudad,
  d.municipio,
  d.colonia,
  d.codigo_postal,
  d.direccion_linea_1,
  d.direccion_linea_2,
  d.latitud,
  d.longitud,
  t.fecha_creacion,
  t.fecha_actualizacion
FROM c_taller_reparacion t
LEFT JOIN d_direccion d
  ON d.id_direccion = t.id_direccion;

CREATE VIEW v_c_centro_ecologico AS
SELECT
  c.id_centro_ecologico,
  c.clave_centro,
  c.nombre_centro,
  c.tipo_centro,
  c.descripcion,
  c.telefono,
  c.correo,
  c.horario,
  c.materiales_aceptados,
  c.calificacion_promedio,
  c.verificado,
  d.id_direccion,
  d.estado,
  d.ciudad,
  d.municipio,
  d.colonia,
  d.codigo_postal,
  d.direccion_linea_1,
  d.direccion_linea_2,
  d.latitud,
  d.longitud,
  c.fecha_creacion,
  c.fecha_actualizacion
FROM c_centro_ecologico c
LEFT JOIN d_direccion d
  ON d.id_direccion = c.id_direccion;

CREATE VIEW v_d_usuario AS
SELECT
  u.id_usuario,
  u.nombre,
  u.apellido,
  COALESCE(u.nombre_mostrado, CONCAT_WS(' ', u.nombre, u.apellido)) AS nombre_mostrado,
  u.correo,
  u.telefono,
  u.url_avatar,
  u.rol,
  u.estado_verificacion,
  u.activo,
  u.fecha_ultimo_acceso,
  d.id_direccion AS id_direccion_principal,
  d.estado,
  d.ciudad,
  d.municipio,
  d.colonia,
  d.codigo_postal,
  d.direccion_linea_1,
  d.direccion_linea_2,
  d.latitud,
  d.longitud,
  COALESCE(i.total_publicaciones, 0) AS total_publicaciones,
  COALESCE(i.total_donaciones, 0) AS total_donaciones,
  COALESCE(i.total_reciclajes, 0) AS total_reciclajes,
  COALESCE(i.total_reparaciones, 0) AS total_reparaciones,
  COALESCE(i.total_recolecciones_completadas, 0) AS total_recolecciones_completadas,
  COALESCE(i.co2_ahorrado_kg, 0) AS co2_ahorrado_kg,
  u.fecha_creacion,
  u.fecha_actualizacion
FROM d_usuario u
LEFT JOIN d_direccion d
  ON d.id_direccion = u.id_direccion_principal
LEFT JOIN d_indicador_impacto_usuario i
  ON i.id_usuario = u.id_usuario;

CREATE VIEW v_d_publicacion AS
SELECT
  p.id_publicacion,
  p.titulo,
  p.descripcion,
  p.condicion,
  p.tipo_accion,
  p.estado_publicacion,
  p.requiere_recoleccion,
  p.fecha_disponible,
  p.peso_estimado_kg,
  p.valor_estimado,
  p.co2_estimado_kg,
  p.activo,
  c.id_categoria,
  c.clave AS clave_categoria,
  c.nombre AS nombre_categoria,
  u.id_usuario,
  COALESCE(u.nombre_mostrado, CONCAT_WS(' ', u.nombre, u.apellido)) AS nombre_usuario,
  u.correo AS correo_usuario,
  u.telefono AS telefono_usuario,
  d.id_direccion AS id_direccion_recoleccion,
  d.estado,
  d.ciudad,
  d.municipio,
  d.colonia,
  d.codigo_postal,
  d.direccion_linea_1,
  d.direccion_linea_2,
  d.latitud,
  d.longitud,
  img.id_imagen_publicacion,
  img.url_imagen,
  img.ruta_storage,
  img.texto_alternativo,
  p.fecha_publicacion,
  p.fecha_aprobacion,
  p.fecha_creacion,
  p.fecha_actualizacion
FROM d_publicacion p
INNER JOIN c_categoria c
  ON c.id_categoria = p.id_categoria
INNER JOIN d_usuario u
  ON u.id_usuario = p.id_usuario
LEFT JOIN d_direccion d
  ON d.id_direccion = p.id_direccion_recoleccion
LEFT JOIN LATERAL (
  SELECT
    ip.id_imagen_publicacion,
    ip.url_imagen,
    ip.ruta_storage,
    ip.texto_alternativo
  FROM d_imagen_publicacion ip
  WHERE ip.id_publicacion = p.id_publicacion
  ORDER BY ip.es_principal DESC, ip.orden_visual ASC
  LIMIT 1
) img
  ON TRUE;

CREATE VIEW v_r_favorito AS
SELECT
  f.id_favorito,
  f.id_usuario,
  COALESCE(u.nombre_mostrado, CONCAT_WS(' ', u.nombre, u.apellido)) AS nombre_usuario,
  f.id_publicacion,
  p.titulo AS titulo_publicacion,
  p.estado_publicacion,
  f.fecha_creacion
FROM r_favorito f
INNER JOIN d_usuario u
  ON u.id_usuario = f.id_usuario
INNER JOIN d_publicacion p
  ON p.id_publicacion = f.id_publicacion;

CREATE VIEW v_t_solicitud_donacion AS
SELECT
  s.id_solicitud_donacion,
  s.id_publicacion,
  p.titulo AS titulo_publicacion,
  p.estado_publicacion,
  s.id_usuario_solicitante,
  COALESCE(us.nombre_mostrado, CONCAT_WS(' ', us.nombre, us.apellido)) AS nombre_solicitante,
  us.correo AS correo_solicitante,
  s.mensaje,
  s.estado_solicitud,
  up.id_usuario AS id_usuario_propietario,
  COALESCE(up.nombre_mostrado, CONCAT_WS(' ', up.nombre, up.apellido)) AS nombre_propietario,
  s.fecha_solicitud,
  s.fecha_respuesta,
  s.fecha_cierre,
  s.fecha_creacion,
  s.fecha_actualizacion
FROM t_solicitud_donacion s
INNER JOIN d_publicacion p
  ON p.id_publicacion = s.id_publicacion
INNER JOIN d_usuario us
  ON us.id_usuario = s.id_usuario_solicitante
INNER JOIN d_usuario up
  ON up.id_usuario = p.id_usuario;

CREATE VIEW v_t_recoleccion AS
SELECT
  r.id_recoleccion,
  r.id_publicacion,
  p.titulo AS titulo_publicacion,
  r.id_usuario_solicitante,
  COALESCE(us.nombre_mostrado, CONCAT_WS(' ', us.nombre, us.apellido)) AS nombre_solicitante,
  r.id_recolector,
  COALESCE(ur.nombre_mostrado, CONCAT_WS(' ', ur.nombre, ur.apellido)) AS nombre_recolector,
  r.id_categoria,
  c.nombre AS nombre_categoria,
  r.titulo_item,
  r.notas,
  r.bloque_horario,
  r.estado_recoleccion,
  d.estado,
  d.ciudad,
  d.municipio,
  d.colonia,
  d.codigo_postal,
  d.direccion_linea_1,
  d.direccion_linea_2,
  d.latitud,
  d.longitud,
  r.fecha_preferida,
  r.fecha_programada,
  r.fecha_recolectada,
  r.fecha_cancelacion,
  r.fecha_creacion,
  r.fecha_actualizacion
FROM t_recoleccion r
LEFT JOIN d_publicacion p
  ON p.id_publicacion = r.id_publicacion
INNER JOIN d_usuario us
  ON us.id_usuario = r.id_usuario_solicitante
LEFT JOIN d_usuario ur
  ON ur.id_usuario = r.id_recolector
LEFT JOIN c_categoria c
  ON c.id_categoria = r.id_categoria
INNER JOIN d_direccion d
  ON d.id_direccion = r.id_direccion_recoleccion;

CREATE VIEW v_t_reparacion AS
SELECT
  r.id_reparacion,
  r.id_publicacion,
  p.titulo AS titulo_publicacion,
  r.id_usuario_solicitante,
  COALESCE(u.nombre_mostrado, CONCAT_WS(' ', u.nombre, u.apellido)) AS nombre_solicitante,
  r.id_taller_reparacion,
  t.nombre_taller,
  r.id_categoria,
  c.nombre AS nombre_categoria,
  r.nombre_item,
  r.descripcion_problema,
  r.costo_estimado_min,
  r.costo_estimado_max,
  r.estado_reparacion,
  r.fecha_solicitud,
  r.fecha_cotizacion,
  r.fecha_aprobacion,
  r.fecha_finalizacion,
  r.fecha_creacion,
  r.fecha_actualizacion
FROM t_reparacion r
INNER JOIN d_usuario u
  ON u.id_usuario = r.id_usuario_solicitante
LEFT JOIN c_taller_reparacion t
  ON t.id_taller_reparacion = r.id_taller_reparacion
LEFT JOIN c_categoria c
  ON c.id_categoria = r.id_categoria
LEFT JOIN d_publicacion p
  ON p.id_publicacion = r.id_publicacion;

CREATE VIEW v_t_pago AS
SELECT
  p.id_pago,
  p.id_usuario,
  COALESCE(u.nombre_mostrado, CONCAT_WS(' ', u.nombre, u.apellido)) AS nombre_usuario,
  p.id_publicacion,
  pub.titulo AS titulo_publicacion,
  p.id_solicitud_donacion,
  p.id_reparacion,
  p.monto,
  p.moneda,
  p.metodo_pago,
  p.estado_pago,
  p.referencia,
  p.es_demo,
  p.fecha_pago,
  p.fecha_creacion,
  p.fecha_actualizacion
FROM t_pago p
INNER JOIN d_usuario u
  ON u.id_usuario = p.id_usuario
LEFT JOIN d_publicacion pub
  ON pub.id_publicacion = p.id_publicacion;

CREATE VIEW v_h_auditoria AS
SELECT
  a.id_auditoria,
  a.id_usuario,
  COALESCE(u.nombre_mostrado, CONCAT_WS(' ', u.nombre, u.apellido)) AS nombre_usuario,
  a.id_publicacion,
  p.titulo AS titulo_publicacion,
  a.id_solicitud_donacion,
  a.id_recoleccion,
  a.id_reparacion,
  a.id_pago,
  a.tipo_evento,
  a.tipo_entidad,
  a.descripcion,
  a.metadata,
  a.fecha_evento
FROM h_auditoria a
LEFT JOIN d_usuario u
  ON u.id_usuario = a.id_usuario
LEFT JOIN d_publicacion p
  ON p.id_publicacion = a.id_publicacion;

COMMIT;
