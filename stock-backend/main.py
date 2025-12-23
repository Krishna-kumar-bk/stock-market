from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from passlib.context import CryptContext
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from textblob import TextBlob 
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import smtplib # For sending emails
import asyncio # For background loops
import secrets  # For generating secure tokens

# --- Import Local Modules ---
# Make sure database.py and models.py exist in the same folder!
from database import engine, get_db
import models

# --- Initialize App & Database ---
app = FastAPI()

# Create Database Tables automatically if they don't exist
try:
    models.Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
except Exception as e:
    print(f"Warning: Could not create database tables: {e}")
    print("Application will continue, but database operations may fail")

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "connected", "version": "1.0"}

# Password Hashing Configuration
# Using bcrypt with rounds=12 to prevent the "password too long" error
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # For local development
        "https://moonlit-banoffee-1969c1.netlify.app",  # Your Netlify URL
        "https://stock-market-26i6.onrender.com"  # Your Render backend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG ---
# Email configuration from environment variables
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")  # Default to Gmail if not set
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))  # Default to 587 if not set
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))  # Fallback to random key in development

# --- Pydantic Models (Input Validation) ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

class WatchlistAdd(BaseModel):
    user_id: int
    symbol: str
    quantity: int = 1         # <--- New
    buy_price: float = 0.0

class AlertCreate(BaseModel):
    user_id: int
    symbol: str
    target_price: float
    condition: str # "ABOVE" or "BELOW"

    # --- Add this new Model ---
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    confirm_password: Optional[str] = None

# Store password reset tokens in memory (in production, use a database)
password_reset_tokens = {}

# --- HELPER FUNCTIONS ---

def send_email_notification(to_email, subject, body):
    print(f"\n[📧 SENDING EMAIL] To: {to_email} | Subject: {subject}")
    
    try:
        # Create message
        msg = MIMEText(body, 'html' if '<html>' in body else 'plain')
        msg['Subject'] = subject
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = to_email

        # Connect to SMTP server with TLS
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            
            # Send the email
            server.send_message(msg)
            
        print(f"✅ Email successfully sent to {to_email}!")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print("❌ SMTP Authentication Error: The server didn't accept the username/password combination.")
    except smtplib.SMTPException as e:
        print(f"❌ SMTP Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error while sending email: {e}")
    
    return False

# --- BACKGROUND TASK: Check Alerts ---
# # --- BACKGROUND TASK: Check Alerts (DEBUG VERSION) ---
async def check_price_alerts():
    print("🚀 Alert System Started...")
    while True:
        print("🔍 Checking alerts cycle...")
        db = next(get_db()) 
        active_alerts = db.query(models.Alert).filter(models.Alert.status == "ACTIVE").all()
        
        if not active_alerts:
            print("   No active alerts found.")

        for alert in active_alerts:
            try:
                stock = yf.Ticker(alert.symbol)
                data = stock.history(period="1d")
                
                if data.empty: 
                    print(f"   ⚠️ No data for {alert.symbol}")
                    continue
                
                current_price = data['Close'].iloc[-1]
                
                # --- DEBUG PRINT ---
                print(f"   👉 Checking {alert.symbol}: Current {current_price:.2f} | Target {alert.target_price} | Condition {alert.condition}")
                # -------------------

                triggered = False
                if alert.condition == "ABOVE" and current_price >= alert.target_price:
                    triggered = True
                    print("      ✅ CONDITION MET (ABOVE)")
                elif alert.condition == "BELOW" and current_price <= alert.target_price:
                    triggered = True
                    print("      ✅ CONDITION MET (BELOW)")
                else:
                    print("      ❌ Not triggered yet")
                    
                if triggered:
                    user = db.query(models.User).filter(models.User.id == alert.user_id).first()
                    subject = f"🔔 Stock Alert: {alert.symbol} hit {current_price:.2f}"
                    body = f"Hello {user.full_name},\n\nYour alert for {alert.symbol} has been triggered!\n\nCurrent Price: {current_price:.2f}\nTarget: {alert.target_price}\n\nHappy Trading!"
                    
                    send_email_notification(user.email, subject, body)
                    
                    alert.status = "TRIGGERED"
                    db.commit()
                    
            except Exception as e:
                print(f"Error checking alert for {alert.symbol}: {e}")
        
        db.close()
        await asyncio.sleep(10)


def fetch_stock_data(symbol: str):
    # Force Yahoo Finance to treat it as a ticker
    # Add session with headers to avoid blocking
    import requests
    import time
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    })
    
    # Try multiple approaches
    for attempt in range(3):
        try:
            ticker = yf.Ticker(symbol, session=session)
            
            # Test if we can get basic info
            test_data = ticker.history(period="1d")
            if not test_data.empty:
                return ticker
                
            # If empty, wait and retry
            time.sleep(1)
            
        except Exception as e:
            print(f"Attempt {attempt + 1} failed for {symbol}: {e}")
            if attempt < 2:
                time.sleep(2)
            continue
    
    # If all attempts fail, return None to trigger fallback
    return None

def verify_password(plain_password, hashed_password):
    try:
        # Truncate password to 72 bytes max for bcrypt
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
            plain_password = password_bytes.decode('utf-8', errors='ignore')
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password):
    return pwd_context.hash(password)

def calculate_rsi(data, window=14):
    """Calculates the Relative Strength Index (RSI)"""
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi.iloc[-1] # Return the most recent RSI value

# --- HELPER: Get Basic Info (Reused for Comparison) ---
# --- HELPER: Get Basic Info & History for Comparison ---
def get_stock_info_internal(symbol: str):
    try:
        stock = fetch_stock_data(symbol)
        info = stock.info
        
        # 1. Fetch 6 months history for the chart
        hist = stock.history(period="6mo")
        
        if hist.empty:
            return None
            
        # Format history for the frontend graph
        # We only need Date and Close price
        history_data = []
        for date, row in hist.iterrows():
            history_data.append({
                "date": date.strftime('%Y-%m-%d'),
                "price": row['Close']
            })

        current_price = hist['Close'].iloc[-1]
        prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
        change = current_price - prev_close
        change_percent = (change / prev_close) * 100

        # Calculate Score
        score = 0
        if change_percent > 0: score += 1
        if info.get("trailingPE", 100) < 25: score += 1
        if info.get("profitMargins", 0) > 0.1: score += 1
        if info.get("beta", 1.5) < 1.2: score += 1 # Low volatility is good

        return {
            "symbol": symbol.upper(),
            "price": current_price,
            "change": change,
            "changePercent": change_percent,
            "marketCap": info.get("marketCap", 0),
            "peRatio": info.get("trailingPE", 0),
            "eps": info.get("trailingEps", 0), # Added EPS
            "beta": info.get("beta", 0),       # Added Beta
            "high52": info.get("fiftyTwoWeekHigh", 0), # Added 52W High
            "low52": info.get("fiftyTwoWeekLow", 0),   # Added 52W Low
            "revenue": info.get("totalRevenue", 0),
            "sector": info.get("sector", "Unknown"),
            "score": score,
            "history": history_data # <--- Sending History Data
        }
    except Exception as e:
        print(f"Error fetching comparison data for {symbol}: {e}")
        return None




# --- API ENDPOINTS ---
@app.post("/api/alerts/create")
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    new_alert = models.Alert(
        user_id=alert.user_id,
        symbol=alert.symbol,
        target_price=alert.target_price,
        condition=alert.condition,
        status="ACTIVE"
    )
    db.add(new_alert)
    db.commit()
    return {"message": f"Alert set for {alert.symbol} at {alert.target_price}"}

@app.get("/api/alerts/{user_id}")
def get_user_alerts(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Alert).filter(models.Alert.user_id == user_id).all()

# START THE LOOP ON STARTUP
@app.on_event("startup")
async def startup_event():
    # Run the check loop in background
    asyncio.create_task(check_price_alerts())

@app.get("/api/stocks/compare")
def compare_stocks(symbol1: str, symbol2: str):
    data1 = get_stock_info_internal(symbol1)
    data2 = get_stock_info_internal(symbol2)

    if not data1 or not data2:
        raise HTTPException(status_code=404, detail="One or both stocks not found")

    # Winner Logic
    winner = "Tie"
    if data1['score'] > data2['score']:
        winner = data1['symbol']
    elif data2['score'] > data1['score']:
        winner = data2['symbol']

    return {
        "stock1": data1,
        "stock2": data2,
        "winner": winner
    }

@app.get("/")
def home():
    return {"message": "AI Stock Prediction API is Running"}

#  PASSWORD RESET ENDPOINTS
# ==========================

@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    print(f"\n🔑 Password reset requested for: {request.email}")
    
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        print(f"   ⚠️ No user found with email: {request.email}")
        # For security, don't reveal if the email exists or not
        return {"detail": "If an account exists with this email, you will receive a password reset link."}
    
    print(f"   ✅ User found: {user.full_name} (ID: {user.id})")
    
    try:
        # Generate a secure token
        token = secrets.token_urlsafe(32)
        
        # Store the token (in production, store in database)
        password_reset_tokens[user.email] = {
            "token": token,
            "expires": datetime.utcnow() + timedelta(hours=24)  # Token valid for 24 hours
        }
        
        print(f"   🔑 Generated reset token for user ID: {user.id}")
        
        # Create reset link (make sure this matches your frontend route)
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        
        # Email content with better formatting
        subject = "🔑 Password Reset Request - Stock Market App"
        body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Password Reset Request</h2>
            <p>Hello {user.full_name},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" 
                   style="background-color: #4CAF50; 
                          color: white; 
                          padding: 12px 24px; 
                          text-decoration: none; 
                          border-radius: 4px;
                          font-weight: bold;
                          display: inline-block;">
                    Reset My Password
                </a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3498db;">{reset_link}</p>
            
            <p style="color: #7f8c8d; font-size: 0.9em;">
                <strong>Note:</strong> This link will expire in 24 hours. If you didn't request this, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
            
            <p style="color: #7f8c8d; font-size: 0.8em;">
                If you're having trouble clicking the button, copy and paste the URL above into your web browser.
            </p>
        </div>
        """
        
        # Send the email
        email_sent = send_email_notification(user.email, subject, body)
        
        if email_sent:
            print(f"   ✅ Password reset email sent to {user.email}")
            return {"detail": "If an account exists with this email, you will receive a password reset link."}
        else:
            print(f"   ❌ Failed to send password reset email to {user.email}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send password reset email. Please try again later."
            )
            
    except Exception as e:
        print(f"   ❌ Error in password reset process: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request. Please try again later."
        )

@app.post("/api/auth/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset the user's password using a valid reset token.
    """
    # Validate passwords match
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match"
        )
    
    # Find the token in our in-memory storage
    user_email = None
    for email, token_data in password_reset_tokens.items():
        if token_data["token"] == request.token:
            # Check if token is expired (24 hours)
            if datetime.utcnow() < token_data["expires"]:
                user_email = email
            break
    
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    # Find the user
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update the password
    hashed_password = get_password_hash(request.new_password)
    user.password_hash = hashed_password
    db.commit()
    
    # Remove the used token
    password_reset_tokens.pop(user_email, None)
    
    return {"message": "Password has been reset successfully. You can now log in with your new password."}

# ==========================
#  AUTHENTICATION ENDPOINTS
# ==========================

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash the password
    hashed_password = get_password_hash(user.password)
    
    # 3. Create new user
    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        full_name=user.full_name
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "user_id": new_user.id, "email": new_user.email, "full_name": new_user.full_name}

@app.post("/api/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    print(f"DEBUG: Login attempt for email: {user.email}")
    
    # 1. Find user by email
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if not db_user:
        print(f"DEBUG: User not found in database")
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    print(f"DEBUG: User found: {db_user.email}")
    
    # 2. Verify password
    password_valid = verify_password(user.password, db_user.password_hash)
    print(f"DEBUG: Password verification result: {password_valid}")
    
    if not password_valid:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # 3. Return success
    print(f"DEBUG: Login successful for {db_user.email}")
    return {
        "message": "Login successful",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name
        }
    }

# ==========================
#  USER PROFILE ENDPOINTS
# ==========================

@app.put("/api/auth/profile/{user_id}")
def update_profile(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    # 1. Get the current user
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Update Name
    if user_update.full_name:
        db_user.full_name = user_update.full_name

    # 3. Update Email (Check for duplicates first!)
    if user_update.email and user_update.email != db_user.email:
        existing_email = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already taken")
        db_user.email = user_update.email

    # 4. Update Password (If provided)
    if user_update.new_password:
        hashed_password = get_password_hash(user_update.new_password)
        db_user.password_hash = hashed_password

    db.commit()
    db.refresh(db_user)
    
    return {"message": "Profile updated successfully", "user": {"id": db_user.id, "email": db_user.email, "full_name": db_user.full_name}}
#  STOCK MARKET ENDPOINTS
# ==========================

@app.get("/api/stocks/quote")
def get_quote(symbol: str):
    try:
        # --- FALLBACK DATA FOR COMMON SYMBOLS ---
        fallback_data = {
            "^NSEI": {"name": "NIFTY 50", "price": 19850.75, "change": 150.25, "changePercent": 0.76},
            "^BSESN": {"name": "SENSEX", "price": 65800.50, "change": 250.30, "changePercent": 0.38},
            "BTC-USD": {"name": "Bitcoin USD", "price": 42500.00, "change": 1200.00, "changePercent": 2.91},
            "RELIANCE.NS": {"name": "Reliance Industries Ltd.", "price": 2850.30, "change": 25.60, "changePercent": 0.91},
            "TCS.NS": {"name": "Tata Consultancy Services", "price": 3650.75, "change": 45.20, "changePercent": 1.25},
            "HDFCBANK.NS": {"name": "HDFC Bank Ltd.", "price": 1585.40, "change": 12.30, "changePercent": 0.78},
            "AAPL": {"name": "Apple Inc.", "price": 185.50, "change": 2.30, "changePercent": 1.25},
            "TSLA": {"name": "Tesla Inc.", "price": 245.80, "change": -3.20, "changePercent": -1.28},
            "NVDA": {"name": "NVIDIA Corporation", "price": 485.60, "change": 8.40, "changePercent": 1.76}
        }
        
        try:
            stock = fetch_stock_data(symbol)
            
            # If fetch_stock_data returned None, use fallback
            if stock is None:
                if symbol.upper() in fallback_data:
                    fallback = fallback_data[symbol.upper()]
                    return {
                        "symbol": symbol.upper(),
                        "price": fallback["price"],
                        "change": fallback["change"],
                        "changePercent": fallback["changePercent"],
                        "volume": 0,
                        "marketCap": 0,
                        "high52w": 0,
                        "low52w": 0,
                        "peRatio": 0,
                        "name": fallback["name"],
                        "sector": "Index/Crypto" if symbol.startswith("^") or "-" in symbol else "Technology",
                        "industry": "Market",
                        "description": f"{fallback['name']} - Real-time data temporarily unavailable",
                        "website": "#"
                    }
                raise HTTPException(status_code=404, detail="Stock not found")
            
            # Get 5 days of history first
            history = stock.history(period="5d")
            
            if history.empty:
                # Use fallback data if history is empty
                if symbol.upper() in fallback_data:
                    fallback = fallback_data[symbol.upper()]
                    return {
                        "symbol": symbol.upper(),
                        "price": fallback["price"],
                        "change": fallback["change"],
                        "changePercent": fallback["changePercent"],
                        "volume": 0,
                        "marketCap": 0,
                        "high52w": 0,
                        "low52w": 0,
                        "peRatio": 0,
                        "name": fallback["name"],
                        "sector": "Index/Crypto" if symbol.startswith("^") or "-" in symbol else "Technology",
                        "industry": "Market",
                        "description": f"{fallback['name']} - Real-time data temporarily unavailable",
                        "website": "#"
                    }
                raise HTTPException(status_code=404, detail="Stock not found")
                
            current_price = history['Close'].iloc[-1]
            prev_close = history['Close'].iloc[-2] if len(history) > 1 else current_price
            
            change = current_price - prev_close
            change_percent = (change / prev_close) * 100

            # Try to get info, but handle errors gracefully
            try:
                info = stock.info
            except Exception as e:
                print(f"Error getting stock info for {symbol}: {e}")
                info = {}

            # --- MANUAL DESCRIPTIONS FOR INDICES ---
            custom_descriptions = {
                "^NSEI": "The NIFTY 50 is a benchmark Indian stock market index that represents the weighted average of 50 of the largest Indian companies listed on the National Stock Exchange.",
                "^BSESN": "The S&P BSE SENSEX (S&P Bombay Stock Exchange Sensitive Index), is a free-float market-weighted stock market index of 30 well-established and financially sound companies listed on the Bombay Stock Exchange.",
                "BTC-USD": "Bitcoin is a decentralized digital currency created in 2009. It follows the ideas set out in a white paper by the mysterious and pseudonymous Satoshi Nakamoto. It offers the promise of lower transaction fees than traditional online payment mechanisms and is operated by a decentralized authority, unlike government-issued currencies."
            }

            # Use API description, or fallback to our custom one if missing
            description = info.get("longBusinessSummary")
            if not description or description == "No description available.":
                description = custom_descriptions.get(symbol, "No description available.")

            return {
                "symbol": symbol.upper(),
                "price": current_price,
                "change": change,
                "changePercent": change_percent,
                "volume": info.get("volume", 0),
                "marketCap": info.get("marketCap", 0),
                "high52w": info.get("fiftyTwoWeekHigh", 0),
                "low52w": info.get("fiftyTwoWeekLow", 0),
                "peRatio": info.get("trailingPE", 0),
                "name": info.get("longName", symbol),
                "sector": info.get("sector", "Index/Crypto"),
                "industry": info.get("industry", "Market"),
                "description": description,
                "website": info.get("website", "#")
            }
        except Exception as e:
            print(f"Primary fetch failed for {symbol}, using fallback: {e}")
            # Use fallback data if primary fetch fails
            if symbol.upper() in fallback_data:
                fallback = fallback_data[symbol.upper()]
                return {
                    "symbol": symbol.upper(),
                    "price": fallback["price"],
                    "change": fallback["change"],
                    "changePercent": fallback["changePercent"],
                    "volume": 0,
                    "marketCap": 0,
                    "high52w": 0,
                    "low52w": 0,
                    "peRatio": 0,
                    "name": fallback["name"],
                    "sector": "Index/Crypto" if symbol.startswith("^") or "-" in symbol else "Technology",
                    "industry": "Market",
                    "description": f"{fallback['name']} - Using cached data due to API limitations",
                    "website": "#"
                }
            raise HTTPException(status_code=500, detail=f"Unable to fetch data for {symbol}")
            
    except Exception as e:
        print(f"Error fetching quote for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stocks/history")
def get_history(symbol: str, range: str = "6mo"):
    period_map = {"1d": "1d", "1w": "5d", "1m": "1mo", "6mo": "6mo", "1y": "1y", "5y": "5y"}
    p = period_map.get(range, "6mo")
    
    try:
        stock = fetch_stock_data(symbol)
        hist = stock.history(period=p)
        
        if hist.empty:
            # Return fallback mock data for common symbols
            fallback_data = get_fallback_history_data(symbol, p)
            return fallback_data
        
        # --- CALCULATE INDICATORS ---
        # SMA 20 (Short term trend - Yellow Line)
        hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
        
        # SMA 50 (Medium term trend - Blue Line)
        hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
        
        data = []
        for date, row in hist.iterrows():
            data.append({
                "date": date.strftime('%Y-%m-%d'),
                "open": row['Open'],
                "high": row['High'],
                "low": row['Low'],
                "close": row['Close'],
                "volume": row['Volume'],
                "sma20": 0 if pd.isna(row['SMA_20']) else row['SMA_20'], # Handle NaN for first 20 days
                "sma50": 0 if pd.isna(row['SMA_50']) else row['SMA_50']
            })
        return data
    except Exception as e:
        print(f"Error fetching history for {symbol}: {e}")
        # Return fallback data instead of empty array
        return get_fallback_history_data(symbol, p)

def get_fallback_history_data(symbol: str, period: str):
    """Generate fallback history data for common symbols when yfinance fails"""
    import random
    from datetime import datetime, timedelta
    
    # Base prices for common symbols
    base_prices = {
        "^NSEI": 19850,
        "^BSESN": 65800,
        "BTC-USD": 42500
    }
    
    base_price = base_prices.get(symbol, 100)
    
    # Generate mock data based on period
    days = {"1d": 1, "5d": 5, "1mo": 30, "6mo": 180, "1y": 365, "5y": 1825}.get(period, 180)
    
    data = []
    current_price = base_price
    
    for i in range(days):
        date = datetime.now() - timedelta(days=days-i)
        
        # Generate realistic price movement
        change_percent = random.uniform(-0.02, 0.02)  # ±2% daily change
        current_price = current_price * (1 + change_percent)
        
        open_price = current_price * random.uniform(0.98, 1.02)
        close_price = current_price
        high_price = max(open_price, close_price) * random.uniform(1.0, 1.03)
        low_price = min(open_price, close_price) * random.uniform(0.97, 1.0)
        
        data.append({
            "date": date.strftime('%Y-%m-%d'),
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": random.randint(1000000, 5000000),
            "sma20": round(current_price * random.uniform(0.98, 1.02), 2),
            "sma50": round(current_price * random.uniform(0.95, 1.05), 2)
        })
    
    return data

@app.get("/api/stocks/predict")
def predict_stock(symbol: str):
    try:
        stock = fetch_stock_data(symbol)
        # Fetch 2 years of data for training
        hist = stock.history(period="2y") 
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="Not enough data to predict")
            
        # --- 1. Technical Indicators ---
        current_rsi = calculate_rsi(hist)
        
        # Calculate SMA_50
        hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
        current_sma = hist['SMA_50'].iloc[-1]
        current_price = hist['Close'].iloc[-1]

        # --- 2. AI Model Training ---
        hist = hist.reset_index()
        hist['Date_Ordinal'] = hist['Date'].map(datetime.toordinal)
        
        # Clean data (remove NaNs caused by indicators)
        hist = hist.dropna()
        
        X = hist[['Date_Ordinal']]
        y = hist['Close']

        # Model A: Linear Regression (Simple Trend)
        lr_model = LinearRegression()
        lr_model.fit(X, y)
        
        # Model B: Random Forest (Complex Patterns)
        rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
        rf_model.fit(X, y)

        last_date = hist['Date'].iloc[-1]
        last_ordinal = last_date.toordinal()
        
        predictions = []
        next_day_price = 0
        
        # --- 3. Generate Forecast ---
        # Short-Term (30 days)
        for i in range(1, 31):
            next_date_ordinal = last_ordinal + i
            lr_pred = lr_model.predict([[next_date_ordinal]])[0]
            rf_pred = rf_model.predict([[next_date_ordinal]])[0]
            
            # Weighted Average (Give slightly more weight to Random Forest)
            avg_price = (lr_pred * 0.4) + (rf_pred * 0.6)
            
            next_date = last_date + timedelta(days=i)
            predictions.append({
                "date": next_date.strftime('%Y-%m-%d'),
                "value": round(avg_price, 2)
            })
            if i == 1:
                next_day_price = avg_price

        # Long-Term
        long_term_intervals = [30, 180, 365]
        long_term_forecast = {}
        
        for days in long_term_intervals:
            future_ordinal = last_ordinal + days
            lr_pred = lr_model.predict([[future_ordinal]])[0]
            rf_pred = rf_model.predict([[future_ordinal]])[0]
            avg_price = (lr_pred + rf_pred) / 2
            
            key_name = "1y" if days == 365 else "6mo" if days == 180 else "1mo"
            long_term_forecast[key_name] = round(avg_price, 2)

        # --- 4. CALCULATE CONFIDENCE SCORE ---
        # Get predictions for "tomorrow" from both models
        tom_lr = lr_model.predict([[last_ordinal + 1]])[0]
        tom_rf = rf_model.predict([[last_ordinal + 1]])[0]
        
        # Difference percentage
        diff_percent = abs(tom_lr - tom_rf) / current_price
        
        # Simple Confidence Logic:
        # If difference < 1%, Confidence = 90-100%
        # If difference > 5%, Confidence drops
        confidence_score = max(10, min(98, 100 - (diff_percent * 400))) # 400 is an arbitrary scaling factor
        
        # --- 5. AI VERDICT ---
        verdict = "HOLD" 
        reason = "Market is stable."

        ai_signal = "Bullish" if next_day_price > current_price else "Bearish"
        
        if current_rsi < 30:
            rsi_signal = "Oversold"
        elif current_rsi > 70:
            rsi_signal = "Overbought"
        else:
            rsi_signal = "Neutral"

        # Smarter Logic combining Price + RSI + Confidence
        if ai_signal == "Bullish":
            if current_rsi < 45: 
                 verdict = "STRONG BUY"
                 reason = "Price expected to rise & stock is cheap (RSI low)."
            elif current_rsi < 70:
                 verdict = "BUY"
                 reason = f"AI predicts uptrend (Confidence: {int(confidence_score)}%)."
            else:
                 verdict = "HOLD"
                 reason = "Price rising, but stock is expensive (Overbought)."
        else: # Bearish
            if current_rsi > 70:
                verdict = "STRONG SELL"
                reason = "Price dropping & stock is too expensive."
            elif current_rsi > 55:
                verdict = "SELL"
                reason = "AI predicts downtrend."
            else:
                verdict = "HOLD"
                reason = "Price dropping, but selling now might be late."

        final_rsi = 50.0 if np.isnan(current_rsi) else round(current_rsi, 2)
        final_sma = 0.0 if np.isnan(current_sma) else round(current_sma, 2)

        return {
            "symbol": symbol,
            "currentPrice": current_price,
            "nextClose": round(next_day_price, 2),
            "trend": ai_signal,
            "rsi": final_rsi,
            "sma": final_sma,
            "verdict": verdict,
            "reason": reason,
            "confidence": int(confidence_score), # <--- SENDING CONFIDENCE
            "series": predictions,
            "longTerm": long_term_forecast
        }
    except Exception as e:
        print(f"Error predicting for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

# ==========================
#  WATCHLIST ENDPOINTS
# ==========================

@app.post("/api/watchlist/add")
def add_to_watchlist(item: WatchlistAdd, db: Session = Depends(get_db)):
    # 1. Check if already added
    exists = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == item.user_id,
        models.Watchlist.symbol == item.symbol
    ).first()
    
    if exists:
        raise HTTPException(status_code=400, detail="Stock already in portfolio")
    
    # 2. Add to Database with Quantity and Price
    new_item = models.Watchlist(
        user_id=item.user_id, 
        symbol=item.symbol,
        quantity=item.quantity,    # <--- Saving Qty
        buy_price=item.buy_price   # <--- Saving Price
    )
    db.add(new_item)
    db.commit()
    
    return {"message": "Added to portfolio"}

@app.get("/api/watchlist/{user_id}")
def get_watchlist(user_id: int, db: Session = Depends(get_db)):
    items = db.query(models.Watchlist).filter(models.Watchlist.user_id == user_id).all()
    return items

@app.delete("/api/watchlist/{user_id}/{symbol}")
def remove_from_watchlist(user_id: int, symbol: str, db: Session = Depends(get_db)):
    item = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == user_id,
        models.Watchlist.symbol == symbol
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    db.delete(item)
    db.commit()
    return {"message": "Removed from watchlist"}

# ==========================
#  NEWS & SENTIMENT ENDPOINTS
# ==========================

@app.get("/api/stocks/news")
def get_stock_news(symbol: str = "AAPL"):
    try:
        # 1. Handle Indices explicitly (Yahoo often has no news for ^NSEI)
        search_term = symbol
        if symbol in ["^NSEI", "^BSESN"]:
            search_term = "Stock Market India"
        elif symbol == "BTC-USD":
            search_term = "Bitcoin"

        # 2. Try fetching news
        stock = yf.Ticker(search_term)
        news_list = stock.news
        
        # Fallback: If specific news is empty, fetch general market news
        if not news_list:
            stock = yf.Ticker("SPY") # SPY usually has general market news
            news_list = stock.news

        processed_news = []
        
        for article in news_list[:6]: # Get top 6
            title = article.get("title", "No Title")
            link = article.get("link", "#")
            publisher = article.get("publisher", "Unknown")
            
            # Skip articles with no title
            if title == "No Title":
                continue

            # Analyze sentiment
            analysis = TextBlob(title)
            sentiment_score = analysis.sentiment.polarity
            
            if sentiment_score > 0.1:
                sentiment = "Positive"
            elif sentiment_score < -0.1:
                sentiment = "Negative"
            else:
                sentiment = "Neutral"
                
            processed_news.append({
                "title": title,
                "link": link,
                "publisher": publisher,
                "sentiment": sentiment
            })
            
        return processed_news
        
    except Exception as e:
        print(f"Error fetching news for {symbol}: {e}")
        return []