from database import SessionLocal
from models import User
from main import get_password_hash, verify_password

# Test password verification
password = "123456"
hashed_password = get_password_hash(password)
print(f"Hashed password: {hashed_password}")

# Verify password
is_valid = verify_password(password, hashed_password)
print(f"Password verification: {is_valid}")

# Check user in database
db = SessionLocal()
user = db.query(User).filter(User.email == "23csec45.krishnakumar@gmail.com").first()
if user:
    print(f"\nUser found in database:")
    print(f"Email: {user.email}")
    print(f"Full Name: {user.full_name}")
    print(f"Password Hash: {user.password_hash}")
    
    # Test verification with stored hash
    is_stored_valid = verify_password(password, user.password_hash)
    print(f"Stored password verification: {is_stored_valid}")
else:
    print("User not found in database!")
db.close()
