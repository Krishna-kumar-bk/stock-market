#!/bin/bash

# Debug: Print environment variables
echo "=== Environment Variables ==="
printenv | sort
echo "==========================="

# Set default port if not provided
PORT=${PORT:-10000}
echo "Using port: $PORT"

# Install textblob and its data
echo "Installing textblob and its data..."
pip install textblob
python -m textblob.download_corpora

# Install other dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Ensure the database directory exists
echo "Ensuring database directory exists..."
mkdir -p /tmp
chmod 777 /tmp  # Ensure the directory is writable
ls -la /tmp

# Run database migrations
echo "Running database migrations..."
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"

# Start the application using uvicorn
echo "Starting FastAPI application..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT