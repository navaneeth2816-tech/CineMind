"""
CineMind Database Migration Tool: SQLite to MySQL
Copies all existing movies, genres, users, ratings, watchlists,
preferences, reviews, and sessions from SQLite to MySQL without data loss.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

load_dotenv(Path(__file__).parent / ".env")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import create_app
from app.models import (
    db,
    Genre,
    Movie,
    movie_genres,
    User,
    Rating,
    Watchlist,
    UserPreference,
    ViewHistory,
    GroupSession,
    GroupMember,
    GroupVote,
    MovieReview,
    AdminAuditLog,
    ActiveSession,
)


def migrate(mysql_url: str):
    print("=" * 65)
    print(" CineMind: SQLite -> MySQL Migration Tool")
    print("=" * 65)

    sqlite_path = Path(__file__).parent / "app" / "cinemind.db"
    sqlite_url = f"sqlite:///{sqlite_path.resolve()}"

    print(f"[*] Source Database : {sqlite_url}")
    print(f"[*] Target Database : {mysql_url.split('@')[-1] if '@' in mysql_url else mysql_url}")

    # 1. Connect to SQLite source
    sqlite_engine = create_engine(sqlite_url)
    SqliteSession = sessionmaker(bind=sqlite_engine)
    sqlite_session = SqliteSession()

    # 2. Connect to MySQL target and create tables
    mysql_engine = create_engine(mysql_url)
    
    print("[*] Creating MySQL schema...")
    db.metadata.create_all(bind=mysql_engine)

    MysqlSession = sessionmaker(bind=mysql_engine)
    mysql_session = MysqlSession()

    try:
        # Disable foreign key checks during bulk migration for safe insertion
        mysql_session.execute(db.text("SET FOREIGN_KEY_CHECKS = 0;"))
        mysql_session.commit()

        # Migrate Genres
        genres = sqlite_session.query(Genre).all()
        for g in genres:
            if not mysql_session.query(Genre).filter_by(id=g.id).first():
                mysql_session.add(Genre(id=g.id, name=g.name))
        mysql_session.commit()
        print(f"[+] Migrated {len(genres)} Genres.")

        # Migrate Users
        users = sqlite_session.query(User).all()
        for u in users:
            if not mysql_session.query(User).filter_by(id=u.id).first():
                mysql_session.add(User(
                    id=u.id,
                    name=u.name,
                    email=u.email,
                    password_hash=u.password_hash,
                    role=u.role,
                    email_verified_at=u.email_verified_at,
                    created_at=u.created_at,
                    runtime_limit=u.runtime_limit,
                    excluded_genres=u.excluded_genres,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(users)} Users.")

        # Migrate Movies
        movies = sqlite_session.query(Movie).all()
        for m in movies:
            if not mysql_session.query(Movie).filter_by(id=m.id).first():
                mysql_session.add(Movie(
                    id=m.id,
                    title=m.title,
                    release_year=m.release_year,
                    language=m.language,
                    runtime_minutes=m.runtime_minutes,
                    overview=m.overview,
                    poster_url=m.poster_url,
                    metadata_source=m.metadata_source,
                    rating_mean=m.rating_mean,
                    rating_count=m.rating_count,
                    bayesian_score=m.bayesian_score,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(movies)} Movies.")

        # Migrate Movie-Genre associations
        mg_rows = sqlite_session.execute(movie_genres.select()).fetchall()
        for row in mg_rows:
            exists = mysql_session.execute(
                movie_genres.select().where(
                    (movie_genres.c.movie_id == row.movie_id) & (movie_genres.c.genre_id == row.genre_id)
                )
            ).first()
            if not exists:
                mysql_session.execute(
                    movie_genres.insert().values(movie_id=row.movie_id, genre_id=row.genre_id)
                )
        mysql_session.commit()
        print(f"[+] Migrated {len(mg_rows)} Movie-Genre links.")

        # Migrate Ratings
        ratings = sqlite_session.query(Rating).all()
        for r in ratings:
            if not mysql_session.query(Rating).filter_by(id=r.id).first():
                mysql_session.add(Rating(
                    id=r.id,
                    user_id=r.user_id,
                    movie_id=r.movie_id,
                    rating=r.rating,
                    source=r.source,
                    rated_at=r.rated_at,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(ratings)} Ratings.")

        # Migrate Watchlists
        watchlists = sqlite_session.query(Watchlist).all()
        for w in watchlists:
            if not mysql_session.query(Watchlist).filter_by(user_id=w.user_id, movie_id=w.movie_id).first():
                mysql_session.add(Watchlist(
                    user_id=w.user_id,
                    movie_id=w.movie_id,
                    added_at=w.added_at,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(watchlists)} Watchlist items.")

        # Migrate Preferences
        prefs = sqlite_session.query(UserPreference).all()
        for p in prefs:
            if not mysql_session.query(UserPreference).filter_by(id=p.id).first():
                mysql_session.add(UserPreference(
                    id=p.id,
                    user_id=p.user_id,
                    preference_type=p.preference_type,
                    preference_value=p.preference_value,
                    weight=p.weight,
                    updated_at=p.updated_at,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(prefs)} User Preferences.")

        # Migrate View History
        views = sqlite_session.query(ViewHistory).all()
        for v in views:
            if not mysql_session.query(ViewHistory).filter_by(id=v.id).first():
                mysql_session.add(ViewHistory(
                    id=v.id,
                    user_id=v.user_id,
                    movie_id=v.movie_id,
                    viewed_at=v.viewed_at,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(views)} View History items.")

        # Migrate Reviews
        reviews = sqlite_session.query(MovieReview).all()
        for rev in reviews:
            if not mysql_session.query(MovieReview).filter_by(id=rev.id).first():
                mysql_session.add(MovieReview(
                    id=rev.id,
                    movie_id=rev.movie_id,
                    author=rev.author,
                    source=rev.source,
                    review_text=rev.review_text,
                    sentiment=rev.sentiment,
                    has_spoilers=rev.has_spoilers,
                    key_themes=rev.key_themes,
                    created_at=rev.created_at,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(reviews)} Movie Reviews.")

        # Migrate Group Sessions
        groups = sqlite_session.query(GroupSession).all()
        for g in groups:
            if not mysql_session.query(GroupSession).filter_by(id=g.id).first():
                mysql_session.add(GroupSession(
                    id=g.id,
                    code=g.code,
                    creator_user_id=g.creator_user_id,
                    objective=g.objective,
                    constraints_json=g.constraints_json,
                    expires_at=g.expires_at,
                    status=g.status,
                    created_at=g.created_at,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(groups)} Group Sessions.")

        # Migrate Group Members
        members = sqlite_session.query(GroupMember).all()
        for gm in members:
            if not mysql_session.query(GroupMember).filter_by(id=gm.id).first():
                mysql_session.add(GroupMember(
                    id=gm.id,
                    group_id=gm.group_id,
                    user_id=gm.user_id,
                    participant_name=gm.participant_name,
                    preferences_json=gm.preferences_json,
                    joined_at=gm.joined_at,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(members)} Group Members.")

        # Migrate Group Votes
        votes = sqlite_session.query(GroupVote).all()
        for gv in votes:
            if not mysql_session.query(GroupVote).filter_by(id=gv.id).first():
                mysql_session.add(GroupVote(
                    id=gv.id,
                    group_id=gv.group_id,
                    member_id=gv.member_id,
                    movie_id=gv.movie_id,
                    vote_score=gv.vote_score,
                    submitted_at=gv.submitted_at,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(votes)} Group Votes.")

        # Migrate Admin Audit Logs
        logs = sqlite_session.query(AdminAuditLog).all()
        for al in logs:
            if not mysql_session.query(AdminAuditLog).filter_by(id=al.id).first():
                mysql_session.add(AdminAuditLog(
                    id=al.id,
                    admin_user_id=al.admin_user_id,
                    action=al.action,
                    target_id=al.target_id,
                    details=al.details,
                    timestamp=al.timestamp,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(logs)} Admin Audit Logs.")

        # Migrate Active Sessions
        sessions = sqlite_session.query(ActiveSession).all()
        for act in sessions:
            if not mysql_session.query(ActiveSession).filter_by(id=act.id).first():
                mysql_session.add(ActiveSession(
                    id=act.id,
                    user_id=act.user_id,
                    session_token_hash=act.session_token_hash,
                    device_info=act.device_info,
                    ip_address=act.ip_address,
                    created_at=act.created_at,
                    last_seen_at=act.last_seen_at,
                    revoked_at=act.revoked_at,
                ))
        mysql_session.commit()
        print(f"[+] Migrated {len(sessions)} Active Sessions.")

        # Re-enable foreign key checks
        mysql_session.execute(db.text("SET FOREIGN_KEY_CHECKS = 1;"))
        mysql_session.commit()

        print("=" * 65)
        print("[SUCCESS] Full SQLite -> MySQL migration completed successfully!")
        print("=" * 65)

    except Exception as e:
        mysql_session.rollback()
        print(f"[ERROR] Migration failed: {e}")
        raise e
    finally:
        sqlite_session.close()
        mysql_session.close()


if __name__ == "__main__":
    mysql_conn = os.getenv("DATABASE_URL")
    if not mysql_conn or not mysql_conn.startswith("mysql"):
        print("Usage:")
        print("  Set DATABASE_URL in backend/.env to your MySQL URI:")
        print("  DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:3306/<database>")
        print("  Then run: python migrate_to_mysql.py")
        sys.exit(1)

    migrate(mysql_conn)
