from supabase import create_client, Client
import os
from dotenv import load_dotenv
import time
from database import SessionLocal
from models import User
from database import get_password_hash

def test_supabase_connection():
    load_dotenv()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
        return None
        
    print("🔄 Testing Supabase connection...")
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            supabase: Client = create_client(url, key)
            # Test connection by getting the current user (unauthenticated)
            response = supabase.auth.get_user()
            print("✅ Successfully connected to Supabase!")
            print("ℹ️  Connection test successful")
            return supabase
                
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⚠️  Attempt {attempt + 1} failed. Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print(f"❌ Failed to connect to Supabase after {max_retries} attempts")
                print(f"Error: {str(e)}")
                return None

def test_add_user(supabase):
    if not supabase:
        print("❌ Cannot test user creation: No Supabase connection")
        return None

    test_user = {
        "email": "23csec45.krishnakumar@gmail.com",
        "password": "123456",
        "user_metadata": {
            "full_name": "Krishna kumar B K",
            "username": "krishnakumar"
        }
    }
    
    try:
        print("\n🔄 Testing user authentication...")
        try:
            # First try to sign in
            sign_in = supabase.auth.sign_in_with_password({
                "email": test_user["email"],
                "password": test_user["password"]
            })
            print("✅ Successfully signed in existing user!")
            print(f"👤 User ID: {sign_in.user.id}")
            print(f"📧 Email: {sign_in.user.email}")
            return sign_in
            
        except Exception as sign_in_error:
            error_msg = str(sign_in_error)
            
            if "Invalid login credentials" in error_msg:
                print("ℹ️  User doesn't exist, attempting to create...")
                result = supabase.auth.sign_up({
                    "email": test_user["email"],
                    "password": test_user["password"],
                    "options": {
                        "data": test_user["user_metadata"]
                    }
                })
                if result.user:
                    print("✅ Test user created successfully!")
                    print(f"👤 User ID: {result.user.id}")
                    print(f"📧 Email: {result.user.email}")
                    print("📬 Please check your email to confirm your account")
                    return result
                    
            elif "Email not confirmed" in error_msg:
                print("⚠️  Email not confirmed. Sending confirmation email...")
                try:
                    # Resend confirmation email
                    supabase.auth.resend({
                        "type": "signup",
                        "email": test_user["email"]
                    })
                    print("📬 Confirmation email sent! Please check your inbox.")
                except Exception as email_error:
                    print(f"❌ Failed to resend confirmation email: {str(email_error)}")
                
                # Try to sign in with unconfirmed email (for testing only)
                print("⚠️  For testing, trying to sign in with unconfirmed email...")
                try:
                    sign_in = supabase.auth.sign_in_with_password({
                        "email": test_user["email"],
                        "password": test_user["password"]
                    })
                    print("✅ Successfully signed in with unconfirmed email!")
                    return sign_in
                except Exception as e:
                    print(f"❌ Failed to sign in with unconfirmed email: {str(e)}")
                    return None
                    
            else:
                print(f"❌ Sign in error: {error_msg}")
                return None
                
    except Exception as e:
        print(f"❌ Error during user authentication: {str(e)}")
        return None

if __name__ == "__main__":
    # Test the connection first
    supabase = test_supabase_connection()
    
    # If connection is successful, test user operations
    if supabase:
        test_add_user(supabase)