GRANT USAGE ON SCHEMA recyclapp_schema TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA recyclapp_schema TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA recyclapp_schema TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA recyclapp_schema TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA recyclapp_schema
GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA recyclapp_schema
GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA recyclapp_schema
GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
