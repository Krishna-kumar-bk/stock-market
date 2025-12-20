from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment variables, fall back to SQLite if not set
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback to SQLite for local development
    DATABASE_URL = "sqlite:///./stockmarket.db"

# For SQLite, we need to add some additional configuration
if DATABASE_URL.startswith("sqlite"):
    SQLALCHEMY_DATABASE_URL = DATABASE_URL.replace("sqlite://", "sqlite:///")
    connect_args = {"check_same_thread": False}
else:
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    connect_args = {}

# Create database engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=True  # Enable SQL query logging for debugging
)

# Create Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Helper function to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()