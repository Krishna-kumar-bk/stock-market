from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment variables
DATABASE_URL = os.getenv("dpg-d54btckhg0os739cupi0-a")

if not DATABASE_URL:
    # Local development with SQLite
    DATABASE_URL = "sqlite:///./stockmarket.db"
    connect_args = {"check_same_thread": False}
    print("Using SQLite database for local development")
else:
    # For PostgreSQL on Render
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    connect_args = {}
    print("Using PostgreSQL database from DATABASE_URL")

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        echo=True
    )
    print("Database engine created successfully")
    
    with engine.connect() as conn:
        print("Successfully connected to the database")
        
except Exception as e:
    print(f"Error creating database engine: {str(e)}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()