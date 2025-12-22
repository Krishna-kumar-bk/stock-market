from database import SessionLocal
from models import User
from main import get_password_hash

db = SessionLocal()

# Check if user already exists
existing_user = db.query(User).filter(User.email == "23csec45.krishnakumar@gmail.com").first()

if not existing_user:
    # Create the user
    new_user = User(
        email="23csec45.krishnakumar@gmail.com",
        full_name="Krishna kumar B K",
        password_hash=get_password_hash("123456")
    )
    db.add(new_user)
    db.commit()
    print("User created successfully!")
else:
    print("User already exists!")

db.close()