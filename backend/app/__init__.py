from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.models import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for React frontend (PRD Section 12)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.movies import movies_bp
    from app.routes.user import user_bp
    from app.routes.recommendations import recommendations_bp
    from app.routes.search import search_bp
    from app.routes.assistant import assistant_bp
    from app.routes.groups import groups_bp
    from app.routes.analytics import analytics_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(movies_bp, url_prefix='/api/movies')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    app.register_blueprint(search_bp, url_prefix='/api')
    app.register_blueprint(assistant_bp, url_prefix='/api/assistant')
    app.register_blueprint(groups_bp, url_prefix='/api/groups')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Global standard error handlers (PRD Section 10)
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad Request', 'message': str(error)}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized', 'message': 'Authentication is required to access this resource.'}), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden', 'message': 'You do not have permission to access this resource.'}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not Found', 'message': 'The requested resource could not be found.'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal Server Error', 'message': 'An unexpected server error occurred.'}), 500

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'product': 'CineMind API',
            'version': '2.0.0'
        }), 200

    # Auto-seed database if movies table is empty
    with app.app_context():
        from app.services.seed_data import seed_database
        from app.models import Movie
        db.create_all()
        if Movie.query.count() == 0:
            print("Empty movie catalogue detected. Seeding benchmark & regional dataset...")
            seed_database()

    return app
