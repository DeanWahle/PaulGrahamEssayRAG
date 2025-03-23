#!/bin/bash

# Navigate to the project root
cd "$(dirname "$0")/.."

echo "Stopping existing containers..."
docker-compose down

echo "Removing existing database volume to ensure clean slate..."
docker volume rm bluebook_pg_data || true

echo "Starting Supabase PostgreSQL container..."
docker-compose up -d

echo "Waiting for database to be ready (30 seconds)..."
sleep 30

# Try to check database users
echo "Checking database users and roles..."
docker exec bluebook-supabase-db-1 bash -c "psql -c '\du'" || echo "Could not connect with default user"

# Try with postgres user
echo "Trying with postgres user..."
docker exec bluebook-supabase-db-1 bash -c "psql -U postgres -c '\du'" || echo "Could not connect with postgres user"

echo "Running upload script..."
# Activate virtual environment before running Python script
source venv/bin/activate
python3 scripts/upload_to_supabase.py

echo "Process complete!" 