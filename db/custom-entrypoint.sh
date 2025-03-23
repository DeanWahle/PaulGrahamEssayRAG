#!/bin/bash
set -e

# This script is based on the official postgres docker-entrypoint.sh script
# but is modified to ensure proper authentication for our setup

# Create the data directory
mkdir -p "$PGDATA"
chmod 700 "$PGDATA"

# Initialize the database if it doesn't exist
if [ -z "$(ls -A "$PGDATA")" ]; then
  echo "Initializing PostgreSQL database..."
  initdb --username="$POSTGRES_USER" --pwfile=<(echo "$POSTGRES_PASSWORD") --auth-host=md5 --auth-local=md5
  
  # Enable password authentication
  echo "host all all all md5" >> "$PGDATA/pg_hba.conf"
  
  # Start PostgreSQL
  pg_ctl -D "$PGDATA" -o "-c listen_addresses='*'" -w start
  
  # Create database
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE "$POSTGRES_DB";
    GRANT ALL PRIVILEGES ON DATABASE "$POSTGRES_DB" TO "$POSTGRES_USER";
EOSQL
  
  # Run initialization scripts
  for f in /docker-entrypoint-initdb.d/*; do
    case "$f" in
      *.sql)    echo "$0: running $f"; psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f" ;;
      *.sql.gz) echo "$0: running $f"; gunzip -c "$f" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" ;;
      *)        echo "$0: ignoring $f" ;;
    esac
  done
  
  # Stop PostgreSQL
  pg_ctl -D "$PGDATA" -m fast -w stop
fi

# Start PostgreSQL with the main process
exec postgres 