from flask import Blueprint, request, jsonify
from app.services.auth_service import optional_auth
from app.services.assistant_service import run_smart_assistant

assistant_bp = Blueprint('assistant', __name__)

@assistant_bp.route('', methods=['POST'])
@optional_auth
def smart_assistant_chat(user):
    """
    CineMind Smart Assistant conversation endpoint (PRD Section 6.10)
    Grounded in real catalogue records, Bayesian statistics, and user Taste DNA.
    """
    data = request.get_json() or {}
    message = (data.get('message') or "").strip()
    movie_context_id = data.get('movie_context_id')

    if not message:
        return jsonify({'error': 'Message cannot be empty.'}), 400

    user_id = user.id if user else None
    result = run_smart_assistant(
        user_message=message,
        user_id=user_id,
        movie_context_id=movie_context_id
    )

    return jsonify(result), 200
