from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    full_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    watchlist_items = relationship("Watchlist", back_populates="owner")
    alerts = relationship("Alert", back_populates="owner") # <--- Link to Alerts

class Watchlist(Base):
    __tablename__ = "watchlist"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String(20))
    quantity = Column(Integer, default=1)
    buy_price = Column(Float, default=0.0)
    added_at = Column(DateTime, default=datetime.datetime.utcnow)
    owner = relationship("User", back_populates="watchlist_items")

# --- NEW TABLE: ALERTS ---
class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String(20))
    target_price = Column(Float)
    condition = Column(String(10)) # "ABOVE" or "BELOW"
    status = Column(String(20), default="ACTIVE") # ACTIVE, TRIGGERED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    owner = relationship("User", back_populates="alerts")