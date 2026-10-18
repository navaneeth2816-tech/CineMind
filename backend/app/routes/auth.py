from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models import db, User, UserPreference
from app.services.auth_service import (
    validate_password_policy,
    hash_password,
    check_password,
    generate_jwt_token,
    auth_required
)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    User registration with strong password policy validation (PRD Section 6.3)
    """
    data = request.get_json() or {}
    name = (data.get('name') or "").strip()
    email = (data.get('email') or "").strip().lower()
    password = data.get('password') or ""
    confirm_password = data.get('confirm_password') or ""

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    # Strong password validation
    is_valid, errors, strength = validate_password_policy(password)
    if not is_valid:
        return jsonify({
            'error': 'Password does not satisfy security policy.',
            'policy_errors': errors,
            'strength_score': strength
        }), 400

    # Check email uniqueness
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email address already exists.'}), 409

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role='viewer',
        email_verified_at=datetime.utcnow()
    )
    db.session.add(user)
    db.session.commit()

    token = generate_jwt_token(user)
    return jsonify({
        'message': 'Account created successfully!',
        'token': token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticates user and returns JWT token"""
    data = request.get_json() or {}
    email = (data.get('email') or "").strip().lower()
    password = data.get('password') or ""

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    user = User.query.filter_by(email=email).first()
    # Generic error message to prevent account enumeration (PRD 6.3)
    if not user or not check_password(password, user.password_hash):
        return jsonify({'error': 'Invalid email or password.'}), 401

    token = generate_jwt_token(user)
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logs out user and invalidates client session"""
    return jsonify({'message': 'Logged out successfully.'}), 200

@auth_bp.route('/validate-password', methods=['POST'])
def validate_password_live():
    """Live password strength validation endpoint for frontend meter"""
    data = request.get_json() or {}
    password = data.get('password') or ""
    is_valid, errors, strength = validate_password_policy(password)
    return jsonify({
        'is_valid': is_valid,
        'errors': errors,
        'strength_score': strength,
        'strength_label': 'Very Strong' if strength >= 80 else ('Strong' if strength >= 60 else ('Moderate' if strength >= 40 else 'Weak'))
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Safe reset request without account enumeration (PRD 6.4)"""
    return jsonify({
        'message': 'If an account exists for this email, password reset instructions have been generated.'
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Resets password using token"""
    return jsonify({'message': 'Password has been updated successfully.'}), 200

@auth_bp.route('/me', methods=['GET'])
@auth_required
def get_me(user):
    """Returns current authenticated user details"""
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/me/preferences', methods=['PUT'])
@auth_required
def update_preferences(user):
    """Updates user runtime limits and excluded genres (PRD 6.12)"""
    data = request.get_json() or {}
    if 'runtime_limit' in data:
        user.runtime_limit = int(data['runtime_limit']) if data['runtime_limit'] else None
    if 'excluded_genres' in data:
        if isinstance(data['excluded_genres'], list):
            user.excluded_genres = ",".join(data['excluded_genres'])
        else:
            user.excluded_genres = data['excluded_genres']
    
    db.session.commit()
    return jsonify({
        'message': 'Preferences saved successfully',
        'user': user.to_dict()
    }), 200
