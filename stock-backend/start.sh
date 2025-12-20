#!/bin/bash

# Debug: Print environment variables
echo "=== Environment Variables ==="
printenv | sort
echo "==========================="

# Set default port if not provided
PORT=${PORT:-10000}
echo "Using port: $PORT"

# Debug: Check if database file exists
if [ -f "stockmarket.db" ]; then
    echo "Database file exists"
    ls -la stockmarket.db
else
    echo "Database file does not exist, will be created"
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "Running database migrations..."
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"

# Start the application using uvicorn
echo "Starting FastAPI application..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT --reload
