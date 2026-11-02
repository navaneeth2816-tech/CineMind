import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend/.env is loaded reliably regardless of working directory
BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'cinemind-super-secret-key-2026-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'cinemind-jwt-secret-token-key-2026')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '72'))
    
    # MySQL Connector database connection configuration with resilient URL normalization
    _raw_db_url = os.getenv(
        'DATABASE_URL', 
        f"sqlite:///{os.path.join(BASE_DIR, 'cinemind.db')}"
    )
    # Ensure MySQL Connector/Python driver is used if mysql protocol is configured
    if _raw_db_url.startswith('mysql+pymysql://'):
        _raw_db_url = _raw_db_url.replace('mysql+pymysql://', 'mysql+mysqlconnector://', 1)
    elif _raw_db_url.startswith('mysql://'):
        _raw_db_url = _raw_db_url.replace('mysql://', 'mysql+mysqlconnector://', 1)

    SQLALCHEMY_DATABASE_URI = _raw_db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Connection pool and liveness configuration for MySQL Connector
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 280,
        'pool_pre_ping': True,
    }
    
    # Rating evidence smoothing parameters
    BAYESIAN_EVIDENCE_M = int(os.getenv('BAYESIAN_EVIDENCE_M', '25'))
    
    # Rate limiting / Security
    PASSWORD_MIN_LENGTH = 8
