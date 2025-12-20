from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment variables, fall back to SQLite if not set
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./stockmarket.db")
print(f"Using database URL: {DATABASE_URL}")

# For SQLite, we need to add some additional configuration
if DATABASE_URL.startswith("sqlite"):
    SQLALCHEMY_DATABASE_URL = DATABASE_URL.replace("sqlite://", "sqlite:///")
    connect_args = {"check_same_thread": False}
    print("Using SQLite database with thread-safe settings")
else:
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    connect_args = {}
    print(f"Using database at: {SQLALCHEMY_DATABASE_URL}")

try:
    # Create database engine
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        echo=True  # Enable SQL query logging
    )
    print("Database engine created successfully")
    
    # Test the database connection
    with engine.connect() as conn:
        print("Successfully connected to the database")
        
except Exception as e:
    print(f"Error creating database engine: {str(e)}")
    raise

# Create Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Helper function to get DB session
def get_db():
    db = SessionLocal()
    try:
        print("Creating new database session")
        yield db
    finally:
        print("Closing database session")
        db.close()