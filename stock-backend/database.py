from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus  # <--- NEW IMPORT

# Load credentials from .env file
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
raw_password = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "stock_app")

# SAFETY FIX: Encode the password to handle special characters like '@'
DB_PASS = quote_plus(raw_password)

# Create Database URL
SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

# Create Engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

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