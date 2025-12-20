#!/bin/bash
# Run database migrations
echo "Running database migrations..."
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"

# Start the application using uvicorn
echo "Starting FastAPI application..."
uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
