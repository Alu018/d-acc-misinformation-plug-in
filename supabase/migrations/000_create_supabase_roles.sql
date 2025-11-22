-- Create Supabase system roles with passwords matching docker-compose.yml

-- Create required schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS graphql_public;
CREATE SCHEMA IF NOT EXISTS _realtime;

-- Create authenticator role for PostgREST
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator WITH LOGIN PASSWORD 'your-super-secret-and-long-postgres-password';
  END IF;
END $$;

-- Create anon role for anonymous access
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
    GRANT anon TO authenticator;
  END IF;
END $$;

-- Create authenticated role
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
    GRANT authenticated TO authenticator;
  END IF;
END $$;

-- Create service_role for admin operations
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
    GRANT service_role TO authenticator;
  END IF;
END $$;

-- Create supabase_auth_admin for GoTrue (auth service)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin WITH LOGIN PASSWORD 'your-super-secret-and-long-postgres-password';
  END IF;
END $$;

-- Create supabase_storage_admin for storage service
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin WITH LOGIN PASSWORD 'your-super-secret-and-long-postgres-password';
  END IF;
END $$;

-- Create supabase_admin for general admin operations
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin WITH LOGIN CREATEROLE CREATEDB PASSWORD 'your-super-secret-and-long-postgres-password';
  END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON DATABASE postgres TO supabase_admin;

-- Grant on public schema
GRANT ALL ON SCHEMA public TO supabase_admin, supabase_auth_admin, supabase_storage_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_admin, supabase_auth_admin, supabase_storage_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_admin, supabase_auth_admin, supabase_storage_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_admin, supabase_auth_admin, supabase_storage_admin;

-- Grant on auth schema
GRANT ALL ON SCHEMA auth TO supabase_admin, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_admin, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_admin, supabase_auth_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO supabase_admin, supabase_auth_admin;

-- Grant on storage schema
GRANT ALL ON SCHEMA storage TO supabase_admin, supabase_storage_admin;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO supabase_admin, supabase_storage_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO supabase_admin, supabase_storage_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA storage TO supabase_admin, supabase_storage_admin;

-- Grant on _realtime schema
GRANT ALL ON SCHEMA _realtime TO supabase_admin;
GRANT ALL ON ALL TABLES IN SCHEMA _realtime TO supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA _realtime TO supabase_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA _realtime TO supabase_admin;

-- Grant usage to anon and authenticated roles
GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, supabase_auth_admin, supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, supabase_auth_admin, supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role, supabase_auth_admin, supabase_storage_admin;
