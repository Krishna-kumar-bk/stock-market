import os
from sqlalchemy import create_engine, text  # Added text here
from dotenv import load_dotenv

def test_database_connection():
    load_dotenv()
    
    # Get the database URL from environment variables
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        print("❌ Error: DATABASE_URL not found in environment variables")
        return False

    print("Testing database connection...")
    
    try:
        # Create engine and test connection
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            print("✅ Successfully connected to the database!")
            
            # Test a simple query using text()
            result = conn.execute(text("SELECT version();"))  # Fixed: wrapped in text()
            print(f"Database version: {result.fetchone()[0]}")
            
            # Check if tables exist
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            tables = [row[0] for row in result]
            print(f"Found tables: {', '.join(tables) if tables else 'No tables found'}")
            
            return True
            
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_database_connection()