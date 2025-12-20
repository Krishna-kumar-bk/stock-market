#!/bin/bash

# Debug: Print environment variables
echo "=== Environment Variables ==="
printenv | sort
echo "==========================="

# Set default port if not provided
PORT=${PORT:-10000}
echo "Using port: $PORT"

# Run database migrations
echo "Running database migrations..."
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"

# Start the application using uvicorn
echo "Starting FastAPI application..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
