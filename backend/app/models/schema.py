from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Association table for Movie - Genre Many-to-Many
movie_genres = db.Table(
    'movie_genres',
    db.Column('movie_id', db.Integer, db.ForeignKey('movies.id', ondelete='CASCADE'), primary_key=True),
    db.Column('genre_id', db.Integer, db.ForeignKey('genres.id', ondelete='CASCADE'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='viewer', nullable=False)  # 'viewer' or 'admin'
    email_verified_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # User-configurable constraints (PRD 6.12)
    runtime_limit = db.Column(db.Integer, nullable=True)  # in minutes
    excluded_genres = db.Column(db.Text, nullable=True)   # comma-separated genre names
    
    # Relationships
    ratings = db.relationship('Rating', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    watchlist = db.relationship('Watchlist', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    preferences = db.relationship('UserPreference', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    view_history = db.relationship('ViewHistory', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'email_verified': bool(self.email_verified_at),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'runtime_limit': self.runtime_limit,
            'excluded_genres': [g.strip() for g in self.excluded_genres.split(',') if g.strip()] if self.excluded_genres else []
        }

class Genre(db.Model):
    __tablename__ = 'genres'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

class Movie(db.Model):
    __tablename__ = 'movies'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False, index=True)
    release_year = db.Column(db.Integer, nullable=False, index=True)
    language = db.Column(db.String(50), nullable=False, index=True) # e.g. Telugu, Tamil, Malayalam, Kannada, Hindi, English
    runtime_minutes = db.Column(db.Integer, nullable=True)
    overview = db.Column(db.Text, nullable=True)
    poster_url = db.Column(db.String(500), nullable=True)
    metadata_source = db.Column(db.String(100), default='MovieLens + TMDB verified', nullable=False)
    
    # Pre-calculated evidence fields (updated on rating updates)
    rating_mean = db.Column(db.Float, default=0.0)
    rating_count = db.Column(db.Integer, default=0)
    bayesian_score = db.Column(db.Float, default=0.0)
    
    # Relationships
    genres = db.relationship('Genre', secondary=movie_genres, backref=db.backref('movies', lazy='dynamic'))
    ratings = db.relationship('Rating', backref='movie', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('MovieReview', backref='movie', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_genres=True):
        data = {
            'id': self.id,
            'title': self.title,
            'release_year': self.release_year,
            'language': self.language,
            'runtime_minutes': self.runtime_minutes,
            'overview': self.overview,
            'poster_url': self.poster_url,
            'metadata_source': self.metadata_source,
            'rating_mean': round(self.rating_mean, 2) if self.rating_mean else 0.0,
            'rating_count': self.rating_count,
            'bayesian_score': round(self.bayesian_score, 2) if self.bayesian_score else 0.0
        }
        if include_genres:
            data['genres'] = [g.name for g in self.genres]
        return data

class Rating(db.Model):
    __tablename__ = 'ratings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False, index=True)
    rating = db.Column(db.Float, nullable=False) # 1.0 - 5.0
    source = db.Column(db.String(30), default='cinemind', nullable=False) # 'cinemind' or 'movielens'
    rated_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Constraint to prevent duplicate ratings from the same user on the same movie
    __table_args__ = (
        db.UniqueConstraint('user_id', 'movie_id', name='uq_user_movie_rating'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'movie_id': self.movie_id,
            'rating': self.rating,
            'source': self.source,
            'rated_at': self.rated_at.isoformat() if self.rated_at else None
        }

class Watchlist(db.Model):
    __tablename__ = 'watchlists'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id', ondelete='CASCADE'), primary_key=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    movie = db.relationship('Movie', backref='in_watchlists')

class UserPreference(db.Model):
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    preference_type = db.Column(db.String(50), nullable=False) # 'genre', 'language', 'era'
    preference_value = db.Column(db.String(100), nullable=False)
    weight = db.Column(db.Float, default=1.0) # Affinity weight (-1.0 to 2.0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ViewHistory(db.Model):
    __tablename__ = 'view_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False)
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow)

    movie = db.relationship('Movie')

class GroupSession(db.Model):
    __tablename__ = 'group_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), unique=True, nullable=False, index=True)
    creator_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    objective = db.Column(db.String(50), default='best_average', nullable=False) # 'best_average' or 'avoid_mismatch'
    constraints_json = db.Column(db.Text, nullable=True) # JSON: max_runtime, allowed_languages, allowed_genres
    expires_at = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='active', nullable=False) # 'active', 'closed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    members = db.relationship('GroupMember', backref='session', lazy='dynamic', cascade='all, delete-orphan')
    votes = db.relationship('GroupVote', backref='session', lazy='dynamic', cascade='all, delete-orphan')

class GroupMember(db.Model):
    __tablename__ = 'group_members'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    participant_name = db.Column(db.String(100), nullable=False)
    preferences_json = db.Column(db.Text, nullable=True) # JSON preferred genres, constraints
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

class GroupVote(db.Model):
    __tablename__ = 'group_votes'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    member_id = db.Column(db.Integer, db.ForeignKey('group_members.id', ondelete='CASCADE'), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False)
    vote_score = db.Column(db.Integer, nullable=False) # 1 (like) or -1 (veto/dislike)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

class MovieReview(db.Model):
    __tablename__ = 'movie_reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False, index=True)
    author = db.Column(db.String(100), default='Verified Viewer')
    source = db.Column(db.String(100), default='MovieLens Community')
    review_text = db.Column(db.Text, nullable=False)
    sentiment = db.Column(db.String(20), default='positive') # 'positive', 'mixed', 'critical'
    has_spoilers = db.Column(db.Boolean, default=False)
    key_themes = db.Column(db.String(255), nullable=True) # Comma-separated theme tags
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'author': self.author,
            'source': self.source,
            'review_text': self.review_text,
            'sentiment': self.sentiment,
            'has_spoilers': self.has_spoilers,
            'key_themes': [t.strip() for t in self.key_themes.split(',')] if self.key_themes else [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AdminAuditLog(db.Model):
    __tablename__ = 'admin_audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    admin_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = db.Column(db.String(100), nullable=False) # e.g. 'CREATE_MOVIE', 'UPDATE_MOVIE', 'ARCHIVE_MOVIE'
    target_id = db.Column(db.String(50), nullable=True)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'admin_user_id': self.admin_user_id,
            'action': self.action,
            'target_id': self.target_id,
            'details': self.details,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class ActiveSession(db.Model):
    __tablename__ = 'active_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    session_token_hash = db.Column(db.String(255), nullable=False)
    device_info = db.Column(db.String(255), default='Web Browser')
    ip_address = db.Column(db.String(50), default='127.0.0.1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen_at = db.Column(db.DateTime, default=datetime.utcnow)
    revoked_at = db.Column(db.DateTime, nullable=True)
