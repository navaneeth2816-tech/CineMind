import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'cinemind-super-secret-key-2026-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'cinemind-jwt-secret-token-key-2026')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '72'))
    
    # Default to SQLite for zero-config local run, or MySQL if DATABASE_URL is set
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL', 
        f"sqlite:///{os.path.join(BASE_DIR, 'cinemind.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Rating evidence smoothing parameters
    BAYESIAN_EVIDENCE_M = int(os.getenv('BAYESIAN_EVIDENCE_M', '25'))
    
    # Rate limiting / Security
    PASSWORD_MIN_LENGTH = 8
