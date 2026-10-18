import re
import datetime
import functools
import bcrypt
import jwt
from flask import request, jsonify, current_app
from app.models import User, db

COMMON_WEAK_PASSWORDS = {
    'password', 'password123', 'admin123', '12345678', 'qwertyuiop', 
    'welcome1', 'cinemind123', 'letmein123', 'iloveyou', 'monkey123'
}

def validate_password_policy(password: str):
    """
    Validates password based on PRD Section 6.3:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    - Reject common passwords
    Returns (is_valid: bool, errors: list, strength_score: int)
    """
    errors = []
    
    if not password or len(password) < 8:
        errors.append("Password must be at least 8 characters long.")
    
    if not re.search(r"[A-Z]", password or ""):
        errors.append("Password must contain at least one uppercase letter.")
        
    if not re.search(r"[a-z]", password or ""):
        errors.append("Password must contain at least one lowercase letter.")
        
    if not re.search(r"\d", password or ""):
        errors.append("Password must contain at least one number.")
        
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\/`~]", password or ""):
        errors.append("Password must contain at least one special character (!@#$%^&*...).")
        
    if (password or "").lower() in COMMON_WEAK_PASSWORDS:
        errors.append("This password is too common and easily guessed.")

    # Calculate strength score (0 - 100)
    score = 0
    if len(password or "") >= 8: score += 20
    if len(password or "") >= 12: score += 15
    if len(password or "") >= 16: score += 15
    if re.search(r"[A-Z]", password or ""): score += 15
    if re.search(r"[a-z]", password or ""): score += 10
    if re.search(r"\d", password or ""): score += 15
    if re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\/`~]", password or ""): score += 10
    if (password or "").lower() in COMMON_WEAK_PASSWORDS: score = 10

    score = min(100, score)
    return len(errors) == 0, errors, score

def hash_password(password: str) -> str:
    """Hashes a password with bcrypt (salt generated automatically)"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against the stored bcrypt hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def generate_jwt_token(user: User) -> str:
    """Generates an expiring JWT token with user id and role"""
    payload = {
        'sub': str(user.id),
        'role': user.role,
        'email': user.email,
        'name': user.name,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=current_app.config['JWT_EXPIRATION_HOURS'])
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def decode_jwt_token(token: str):
    """Decodes and validates a JWT token"""
    try:
        return jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception):
        return None

def get_current_user():
    """Extracts the authenticated user from the Authorization header if valid"""
    auth_header = request.headers.get('Authorization', None)
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    payload = decode_jwt_token(token)
    if not payload or 'sub' not in payload:
        return None
    try:
        return User.query.get(int(payload['sub']))
    except (ValueError, TypeError):
        return None

def auth_required(f):
    """Route decorator requiring authenticated user"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        return f(*args, user=user, **kwargs)
    return decorated_function

def optional_auth(f):
    """Route decorator optionally providing current user if token present"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        return f(*args, user=user, **kwargs)
    return decorated_function

def admin_required(f):
    """Route decorator requiring admin role"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user or user.role != 'admin':
            return jsonify({'error': 'Forbidden. Admin privileges required.'}), 403
        return f(*args, user=user, **kwargs)
    return decorated_function
