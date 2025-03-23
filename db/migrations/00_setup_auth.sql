-- Set up proper authentication methods
ALTER SYSTEM SET listen_addresses TO '*';

-- Create postgres role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';
  END IF;
END
$$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE pg_essays TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- Configure pg_hba.conf to allow password authentication
-- This doesn't work directly as SQL, but we'll adjust the pg_hba.conf manually if needed 