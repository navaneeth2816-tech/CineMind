import random
from datetime import datetime, timedelta
from app.models import db, User, Genre, Movie, Rating, MovieReview, UserPreference, Watchlist
from app.services.auth_service import hash_password
from app.services.trust_service import update_movie_cached_ratings

GENRES_LIST = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 
    'Crime', 'Drama', 'Fantasy', 'History', 'Horror', 
    'Mystery', 'Romance', 'Sci-Fi', 'Thriller'
]

MOVIES_DATA = [
    # --- TELUGU CINEMA ---
    {
        'title': 'RRR',
        'release_year': 2022,
        'language': 'Telugu',
        'runtime_minutes': 187,
        'overview': 'A fearless warrior on a perilous mission comes face to face with a steely cop serving British forces in pre-independent India.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/wE0noFU2ETo9hgQAtzlXMZ7bEip.jpg',
        'genres': ['Action', 'Drama', 'Adventure'],
        'ratings_dist': (4.8, 85),
        'reviews': [
            {'author': 'CinemaBuff_HYD', 'text': 'Unmatched kinetic energy, breathtaking action choreography and deep emotional core.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Action, Friendship, Direction'},
            {'author': 'ReviewerRaj', 'text': 'The interval block and climax battle scene are peak visual spectacle.', 'sentiment': 'positive', 'has_spoilers': True, 'themes': 'Spectacle, Action, Patriotism'}
        ]
    },
    {
        'title': 'Baahubali 2: The Conclusion',
        'release_year': 2017,
        'language': 'Telugu',
        'runtime_minutes': 167,
        'overview': 'When Shiva, the son of Bahubali, learns about his heritage, he begins to look for answers while vengeance awaits him.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/21sC2assImQIYCEDA84Qh9d1RsK.jpg',
        'genres': ['Action', 'Fantasy', 'Drama'],
        'ratings_dist': (4.7, 78),
        'reviews': [
            {'author': 'TollywoodAnalyst', 'text': 'Grand scale world-building that redefined Indian cinema on the global stage.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Mythology, Epic, Visual Effects'}
        ]
    },
    {
        'title': 'C/o Kancharapalem',
        'release_year': 2018,
        'language': 'Telugu',
        'runtime_minutes': 152,
        'overview': 'Four unconventional love stories set in the rustic neighborhood of Kancharapalem showcase the nuances of love across different ages and societal strata.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/vJv3K1y2fI8Y4N0U3eF5I7S6f1c.jpg',
        'genres': ['Drama', 'Romance'],
        'ratings_dist': (4.9, 42),
        'reviews': [
            {'author': 'IndieLover', 'text': 'An honest, deeply poetic portrayal of human warmth, community, and unconditional love.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Realism, Emotion, Indie'}
        ]
    },
    {
        'title': 'Jersey',
        'release_year': 2019,
        'language': 'Telugu',
        'runtime_minutes': 157,
        'overview': 'A failed cricketer decides to revive his cricketing career in his late 30s despite health challenges to fulfill his young son’s wish.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/5k7B6W5E9F9D6K2F7U4G0H8L1M.jpg',
        'genres': ['Drama', 'Biography'],
        'ratings_dist': (4.6, 55),
        'reviews': [
            {'author': 'SportsCine', 'text': 'Heart-wrenching and triumphant. Nani delivers a career-defining performance as Arjun.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Sports, Father-Son, Resilience'}
        ]
    },
    {
        'title': 'Eega',
        'release_year': 2012,
        'language': 'Telugu',
        'runtime_minutes': 145,
        'overview': 'A murdered man is reincarnated as a common housefly and seeks to protect his true love while exacting revenge on his wealthy murderer.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/o71gM5K1fE4Q0L3A6J8D7R9T2W.jpg',
        'genres': ['Fantasy', 'Action', 'Comedy'],
        'ratings_dist': (4.4, 60),
        'reviews': [
            {'author': 'CreativeCritique', 'text': 'Incredible concept executed with imaginative visual effects and playful storytelling.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Innovation, CGI, Revenge'}
        ]
    },

    # --- TAMIL CINEMA ---
    {
        'title': 'Vikram',
        'release_year': 2022,
        'language': 'Tamil',
        'runtime_minutes': 174,
        'overview': 'A special investigator uncovers a syndicate of masked vigilantes led by a ghost from the past battling a ruthless drug cartel.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/lP9m5rBvN1kK9gA8E2vB3bK0k5R.jpg',
        'genres': ['Action', 'Thriller', 'Crime'],
        'ratings_dist': (4.7, 72),
        'reviews': [
            {'author': 'KollywoodLens', 'text': 'Anirudh’s background score elevates every high-octane set piece in this thrilling cinematic universe.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Action, Music, Cinematic Universe'},
            {'author': 'SpoilerAlertTamil', 'text': 'The Rolex cameo at the end completely changes the stakes for the upcoming sequels.', 'sentiment': 'positive', 'has_spoilers': True, 'themes': 'Cameo, Climax, Universe'}
        ]
    },
    {
        'title': 'Jai Bhim',
        'release_year': 2021,
        'language': 'Tamil',
        'runtime_minutes': 164,
        'overview': 'A brave activist-lawyer fights for justice when a tribal man is falsely accused and mysteriously disappears from police custody.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/spAgr5zEclwL2aW5jUf2FkY6D8G.jpg',
        'genres': ['Crime', 'Drama', 'Mystery'],
        'ratings_dist': (4.8, 68),
        'reviews': [
            {'author': 'JusticeWatch', 'text': 'A harrowing, powerful courtroom drama that gives voice to the marginalized with legal precision.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Courtroom, Social Justice, Performance'}
        ]
    },
    {
        'title': 'Super Deluxe',
        'release_year': 2019,
        'language': 'Tamil',
        'runtime_minutes': 176,
        'overview': 'An unfaithful wife, an estranged father, a corrupt cop, and a determined boy find their destinies intertwined on an eventful day.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/uU8V7X7aB3M7rQ9D8k9L4V2b6E.jpg',
        'genres': ['Drama', 'Thriller', 'Crime'],
        'ratings_dist': (4.5, 45),
        'reviews': [
            {'author': 'AuteurFan', 'text': 'A bold, eccentric masterwork exploring morality, faith, and cosmic coincidence.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Philosophy, Multi-narrative, Dark Comedy'}
        ]
    },
    {
        'title': '96',
        'release_year': 2018,
        'language': 'Tamil',
        'runtime_minutes': 158,
        'overview': 'Two high school sweethearts meet at a reunion after 22 years and spend an emotionally poignant night reminiscing about their past.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/p4T5fE3H7rB1M9kK6b0K4F7U9L.jpg',
        'genres': ['Romance', 'Drama'],
        'ratings_dist': (4.6, 50),
        'reviews': [
            {'author': 'MelancholyLover', 'text': 'Pure nostalgia, unspoken longing, and sublime chemistry between Vijay Sethupathi and Trisha.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Romance, Nostalgia, Music'}
        ]
    },

    # --- MALAYALAM CINEMA ---
    {
        'title': 'Manjummel Boys',
        'release_year': 2024,
        'language': 'Malayalam',
        'runtime_minutes': 135,
        'overview': 'A group of friends from a small town embark on a vacation to Kodaikanal, where an unexpected mishap inside Guna Caves tests their ultimate bond.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/7aE7fW5K8bM1rQ3D7k9L4V2b6E.jpg',
        'genres': ['Adventure', 'Drama', 'Thriller'],
        'ratings_dist': (4.8, 64),
        'reviews': [
            {'author': 'KeralaCinephile', 'text': 'Tense, gripping, and deeply moving survival thriller grounded in authentic friendship.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Survival, Friendship, Cinematography'}
        ]
    },
    {
        'title': 'Drishyam',
        'release_year': 2013,
        'language': 'Malayalam',
        'runtime_minutes': 160,
        'overview': 'A humble cable TV operator resorts to intelligent deception to protect his family after they commit an accidental crime.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/y6Z1A0K5rB7M9kL6b0K4F7U9L.jpg',
        'genres': ['Crime', 'Thriller', 'Mystery'],
        'ratings_dist': (4.9, 90),
        'reviews': [
            {'author': 'SuspenseGuru', 'text': 'The gold standard of investigative suspense and family thriller writing.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Screenplay, Alibi, Tension'},
            {'author': 'PlotAnalyst', 'text': 'The revelation of where the body was actually buried under the newly constructed police station is pure genius.', 'sentiment': 'positive', 'has_spoilers': True, 'themes': 'Twist, Climax, Alibi'}
        ]
    },
    {
        'title': 'Kumbalangi Nights',
        'release_year': 2019,
        'language': 'Malayalam',
        'runtime_minutes': 135,
        'overview': 'Four dysfunctional brothers living in a dilapidated home find courage, love, and reconciliation when a series of domestic crises arise.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/d9kK4F7U9L6b0K5rB7M9kL6b0K.jpg',
        'genres': ['Drama', 'Comedy', 'Romance'],
        'ratings_dist': (4.7, 58),
        'reviews': [
            {'author': 'WarmCinema', 'text': 'Brimming with organic character evolution, subtle feminism, and luminous coastal aesthetics.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Family, Brotherhood, Realism'}
        ]
    },
    {
        'title': 'Bramayugam',
        'release_year': 2024,
        'language': 'Malayalam',
        'runtime_minutes': 139,
        'overview': 'A folk singer escaping slavery stumbles into a mysterious aristocratic mansion ruled by an enigmatic and sinister sorcerer.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/8kK5rB7M9kL6b0K4F7U9L6b0K5.jpg',
        'genres': ['Horror', 'Mystery', 'Thriller'],
        'ratings_dist': (4.6, 38),
        'reviews': [
            {'author': 'AtmosphereWatch', 'text': 'A haunting monochrome masterpiece of folklore horror and psychological torment.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Monochrome, Folklore, Dread'}
        ]
    },

    # --- KANNADA CINEMA ---
    {
        'title': 'Kantara',
        'release_year': 2022,
        'language': 'Kannada',
        'runtime_minutes': 148,
        'overview': 'When greed paves the way for betrayal and rebellion, a young tribal champion invokes the ancient spirit of Bhoota Kola to protect his sacred forest.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/n5kK4F7U9L6b0K5rB7M9kL6b0K.jpg',
        'genres': ['Action', 'Drama', 'Fantasy', 'Thriller'],
        'ratings_dist': (4.8, 80),
        'reviews': [
            {'author': 'CoastalRoots', 'text': 'The final 20 minutes of divine possession and trance performance are an unforgettable sensory tour de force.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Tradition, Possession, Folklore'}
        ]
    },
    {
        'title': 'K.G.F: Chapter 1',
        'release_year': 2018,
        'language': 'Kannada',
        'runtime_minutes': 156,
        'overview': 'A ruthless young mercenary rises through Bombay’s criminal underworld and is hired to assassinate the tyrannical overlord of the Kolar Gold Fields.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/t7M9kL6b0K4F7U9L6b0K5rB7M.jpg',
        'genres': ['Action', 'Crime', 'Drama'],
        'ratings_dist': (4.5, 75),
        'reviews': [
            {'author': 'MassCinemaAddict', 'text': 'Electrifying elevation shots, gritty dark aesthetics, and commanding screen presence by Yash.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Mass Heroism, Style, BGM'}
        ]
    },
    {
        'title': '777 Charlie',
        'release_year': 2022,
        'language': 'Kannada',
        'runtime_minutes': 164,
        'overview': 'A lonely, cynical factory worker’s solitary life is transformed when a lively Labrador puppy wanders into his home.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/6b0K4F7U9L6b0K5rB7M9kL6b0K.jpg',
        'genres': ['Adventure', 'Comedy', 'Drama'],
        'ratings_dist': (4.7, 44),
        'reviews': [
            {'author': 'CanineLover', 'text': 'Prepare your tissues. An emotionally touching journey celebrating the unconditional bond between human and dog.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Pets, Redemption, Road Trip'}
        ]
    },

    # --- HINDI CINEMA ---
    {
        'title': '3 Idiots',
        'release_year': 2009,
        'language': 'Hindi',
        'runtime_minutes': 170,
        'overview': 'Two friends search for their long-lost companion while revisiting their college days and the eccentric philosopher who urged them to follow their passions.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg',
        'genres': ['Comedy', 'Drama', 'Romance'],
        'ratings_dist': (4.8, 95),
        'reviews': [
            {'author': 'BollywoodBuff', 'text': 'A timeless critique of rote learning packed with humor, tears, and enduring life lessons.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Education, Friendship, Humor'}
        ]
    },
    {
        'title': 'Dangal',
        'release_year': 2016,
        'language': 'Hindi',
        'runtime_minutes': 161,
        'overview': 'Former wrestler Mahavir Singh Phogat trains his young daughters Geeta and Babita to overcome cultural prejudices and win Commonwealth Gold.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/lP9m5rBvN1kK9gA8E2vB3bK0k5R.jpg',
        'genres': ['Action', 'Biography', 'Drama'],
        'ratings_dist': (4.8, 88),
        'reviews': [
            {'author': 'SportsCinema', 'text': 'Authentic wrestling sequences, inspiring true story, and extraordinary dedication from the entire cast.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Wrestling, Empowerment, True Story'}
        ]
    },
    {
        'title': 'Tumbbad',
        'release_year': 2018,
        'language': 'Hindi',
        'runtime_minutes': 104,
        'overview': 'A mythological horror story revolving around human greed, a cursed village, and a decaying ancestral manor hiding a secret gold treasure.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/9kL6b0K4F7U9L6b0K5rB7M9kL6.jpg',
        'genres': ['Fantasy', 'Horror', 'Drama'],
        'ratings_dist': (4.7, 52),
        'reviews': [
            {'author': 'CineGothic', 'text': 'One of Indian cinema’s finest visual achievements. Rain-drenched, grotesque, and atmospheric.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Atmosphere, Greed, Mythological Horror'}
        ]
    },
    {
        'title': 'Andhadhun',
        'release_year': 2018,
        'language': 'Hindi',
        'runtime_minutes': 139,
        'overview': 'A visually impaired pianist unwittingly becomes entangled in the murder cover-up of a former Bollywood star.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/dyhaB19AIC4PkUVUT2Et09y97Mz.jpg',
        'genres': ['Crime', 'Thriller', 'Comedy'],
        'ratings_dist': (4.7, 70),
        'reviews': [
            {'author': 'TwistMaster', 'text': 'Wickedly funny and relentlessly suspenseful. Sriram Raghavan keeps you guessing until the final frame.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Dark Comedy, Piano, Suspense'}
        ]
    },

    # --- MOVIELENS / GLOBAL BENCHMARKS ---
    {
        'title': 'Inception',
        'release_year': 2010,
        'language': 'English',
        'runtime_minutes': 148,
        'overview': 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
        'genres': ['Action', 'Sci-Fi', 'Adventure'],
        'ratings_dist': (4.8, 120),
        'reviews': [
            {'author': 'SciFiEnthusiast', 'text': 'Architectural mind-bender with Hans Zimmer’s iconic brass-heavy score and flawless editing.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Dreams, Heist, Concept'},
            {'author': 'CinemaTheorist', 'text': 'The spinning top at the end cuts to black before settling, deliberately leaving reality ambiguous.', 'sentiment': 'positive', 'has_spoilers': True, 'themes': 'Ambiguity, Climax, Totem'}
        ]
    },
    {
        'title': 'Interstellar',
        'release_year': 2014,
        'language': 'English',
        'runtime_minutes': 169,
        'overview': 'A team of explorers travel through a newly discovered wormhole in space in an attempt to ensure humanity’s survival.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        'genres': ['Sci-Fi', 'Drama', 'Adventure'],
        'ratings_dist': (4.7, 115),
        'reviews': [
            {'author': 'CosmicVoyager', 'text': 'A visually magnificent blend of theoretical physics and deeply emotional father-daughter bond.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Relativity, Space, Father-Daughter'}
        ]
    },
    {
        'title': 'The Dark Knight',
        'release_year': 2008,
        'language': 'English',
        'runtime_minutes': 152,
        'overview': 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        'genres': ['Action', 'Crime', 'Drama', 'Thriller'],
        'ratings_dist': (4.9, 140),
        'reviews': [
            {'author': 'NolanObsessive', 'text': 'Heath Ledger’s Joker remains the pinnacle of cinematic villainy in modern film.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Joker, Chaos, Moral Ambiguity'}
        ]
    },
    {
        'title': 'Parasite',
        'release_year': 2019,
        'language': 'English', # Released with global subtitles
        'runtime_minutes': 132,
        'overview': 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
        'genres': ['Comedy', 'Drama', 'Thriller'],
        'ratings_dist': (4.8, 92),
        'reviews': [
            {'author': 'WorldCinemaLover', 'text': 'Razor-sharp social satire seamlessly shifting into pitch-black psychological thriller.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Class Warfare, Metaphor, Architecture'}
        ]
    },
    {
        'title': 'Pulp Fiction',
        'release_year': 1994,
        'language': 'English',
        'runtime_minutes': 154,
        'overview': 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
        'poster_url': 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
        'genres': ['Crime', 'Drama'],
        'ratings_dist': (4.7, 105),
        'reviews': [
            {'author': 'CultClassics', 'text': 'Non-linear storytelling perfection punctuated by indelible dialogue and unforgettable characters.', 'sentiment': 'positive', 'has_spoilers': False, 'themes': 'Non-linear, Dialogue, Style'}
        ]
    }
]

def seed_database():
    """Seeds the database with genres, movies, ratings, reviews, and test accounts"""
    db.create_all()

    # 1. Seed Genres
    genre_map = {}
    for g_name in GENRES_LIST:
        genre = Genre.query.filter_by(name=g_name).first()
        if not genre:
            genre = Genre(name=g_name)
            db.session.add(genre)
            db.session.flush()
        genre_map[g_name] = genre

    # 2. Seed Default Accounts
    admin_user = User.query.filter_by(email='admin@cinemind.com').first()
    if not admin_user:
        admin_user = User(
            name='CineMind Admin',
            email='admin@cinemind.com',
            password_hash=hash_password('Admin@12345'),
            role='admin',
            email_verified_at=datetime.utcnow()
        )
        db.session.add(admin_user)

    demo_viewer = User.query.filter_by(email='viewer@cinemind.com').first()
    if not demo_viewer:
        demo_viewer = User(
            name='Aarav Sharma',
            email='viewer@cinemind.com',
            password_hash=hash_password('Viewer@12345'),
            role='viewer',
            email_verified_at=datetime.utcnow(),
            runtime_limit=160
        )
        db.session.add(demo_viewer)

    db.session.commit()

    # 3. Seed Movies, Ratings & Reviews
    random.seed(42) # Reproducible ratings
    created_movie_ids = []

    for item in MOVIES_DATA:
        movie = Movie.query.filter_by(title=item['title']).first()
        if not movie:
            movie = Movie(
                title=item['title'],
                release_year=item['release_year'],
                language=item['language'],
                runtime_minutes=item['runtime_minutes'],
                overview=item['overview'],
                poster_url=item['poster_url'],
                metadata_source='MovieLens Benchmark + Verified Metadata'
            )
            # Add genres
            for g_name in item['genres']:
                if g_name in genre_map:
                    movie.genres.append(genre_map[g_name])
            db.session.add(movie)
            db.session.flush()

            # Seed Simulated Ratings
            target_mean, count = item['ratings_dist']
            for i in range(count):
                # Sample around target mean with realistic variance
                r_val = round(max(1.0, min(5.0, random.gauss(target_mean, 0.45))) * 2) / 2
                source = 'movielens' if i < int(count * 0.75) else 'cinemind'
                rating = Rating(
                    user_id=None,
                    movie_id=movie.id,
                    rating=r_val,
                    source=source,
                    rated_at=datetime.utcnow() - timedelta(days=random.randint(1, 400))
                )
                db.session.add(rating)

            # Seed Reviews
            for rev in item['reviews']:
                m_rev = MovieReview(
                    movie_id=movie.id,
                    author=rev['author'],
                    source='CineMind Critic Circle',
                    review_text=rev['text'],
                    sentiment=rev['sentiment'],
                    has_spoilers=rev['has_spoilers'],
                    key_themes=rev['themes']
                )
                db.session.add(m_rev)

        created_movie_ids.append(movie.id)

    db.session.commit()

    # 4. Update Bayesian & Cache Scores for all movies
    for m_id in created_movie_ids:
        update_movie_cached_ratings(m_id)

    # 5. Seed Demo User Preferences & Ratings (for instant Taste DNA demonstration)
    if demo_viewer:
        # Give demo user a set of rated movies: e.g. loves Sci-Fi and Thriller
        demo_ratings = [
            ('Inception', 5.0),
            ('Interstellar', 4.5),
            ('RRR', 5.0),
            ('Drishyam', 5.0),
            ('Vikram', 4.5),
            ('Kantara', 4.0),
            ('Super Deluxe', 4.0),
            ('3 Idiots', 4.5),
            ('Tumbbad', 4.5)
        ]
        for t, score in demo_ratings:
            m = Movie.query.filter_by(title=t).first()
            if m:
                existing = Rating.query.filter_by(user_id=demo_viewer.id, movie_id=m.id).first()
                if not existing:
                    r = Rating(
                        user_id=demo_viewer.id,
                        movie_id=m.id,
                        rating=score,
                        source='cinemind',
                        rated_at=datetime.utcnow() - timedelta(days=random.randint(2, 30))
                    )
                    db.session.add(r)

        # Seed Watchlist items for demo viewer
        watchlist_titles = ['Manjummel Boys', 'Bramayugam', 'Jai Bhim']
        for wt in watchlist_titles:
            wm = Movie.query.filter_by(title=wt).first()
            if wm:
                if not Watchlist.query.filter_by(user_id=demo_viewer.id, movie_id=wm.id).first():
                    db.session.add(Watchlist(user_id=demo_viewer.id, movie_id=wm.id))

        # Explicit preferences
        if not UserPreference.query.filter_by(user_id=demo_viewer.id).first():
            db.session.add(UserPreference(user_id=demo_viewer.id, preference_type='genre', preference_value='Sci-Fi', weight=0.9))
            db.session.add(UserPreference(user_id=demo_viewer.id, preference_type='genre', preference_value='Thriller', weight=0.85))
            db.session.add(UserPreference(user_id=demo_viewer.id, preference_type='language', preference_value='Telugu', weight=0.8))

        db.session.commit()
    
    print("Database successfully initialized with authentic catalogue, ratings, and demo accounts.")
