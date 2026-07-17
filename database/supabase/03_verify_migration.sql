\echo 'Tablas en recyclapp_schema'
SELECT
  schemaname,
  relname AS objeto,
  n_live_tup AS filas_estimadas
FROM pg_stat_user_tables
WHERE schemaname = 'recyclapp_schema'
ORDER BY relname;

\echo 'Vistas en recyclapp_schema'
SELECT
  table_schema,
  table_name
FROM information_schema.views
WHERE table_schema = 'recyclapp_schema'
ORDER BY table_name;
