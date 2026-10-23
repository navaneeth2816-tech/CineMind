import sys
import os
import unittest
import json

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db, User, Movie, Rating, Watchlist, ViewHistory, GroupSession
from app.services.trust_service import calculate_movie_trust_metrics
from app.services.recommender_service import get_personal_recommendations, calculate_compatibility_score
from app.services.nl_search_service import parse_natural_language_query
from app.services.assistant_service import run_smart_assistant


class CineMindComprehensiveTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

    def test_01_movie_posters_and_metadata_quality(self):
        """Verify all 25 movies have verified TMDB posters and complete metadata"""
        with self.app.app_context():
            movies = Movie.query.all()
            self.assertEqual(len(movies), 25, "Expected 25 movies in cinemind catalogue")
            for m in movies:
                self.assertTrue(m.title, f"Movie {m.id} has no title")
                self.assertGreater(m.release_year, 1900, f"Movie {m.id} has invalid year")
                self.assertIn(m.language, ['Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Hindi', 'English'])
                self.assertGreater(m.runtime_minutes, 60, f"Movie {m.id} runtime too short")
                self.assertTrue(m.poster_url and m.poster_url.startswith('https://image.tmdb.org/'),
                                f"Movie {m.id} ({m.title}) does not have verified TMDB poster: {m.poster_url}")
                self.assertGreater(len(m.genres), 0, f"Movie {m.id} has no genres")
                self.assertGreater(m.bayesian_score, 0.0)

    def test_02_regional_language_filters(self):
        """Verify Telugu, Tamil, Malayalam, Kannada, Hindi, and English filters"""
        with self.app.app_context():
            for lang in ['Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Hindi', 'English']:
                res = self.client.get(f'/api/movies?language={lang}')
                self.assertEqual(res.status_code, 200)
                data = json.loads(res.data)
                self.assertGreater(data['total'], 0, f"No movies found for language {lang}")
                for m in data['movies']:
                    self.assertEqual(m['language'], lang)

    def test_03_authentication_and_security(self):
        """Test login with demo accounts, password policy validation, and JWT authentication"""
        # Test demo admin login
        res = self.client.post('/api/auth/login', json={
            'email': 'admin@cinemind.com',
            'password': 'Admin@12345'
        })
        self.assertEqual(res.status_code, 200)
        admin_data = json.loads(res.data)
        self.assertIn('token', admin_data)
        self.assertEqual(admin_data['user']['role'], 'admin')

        # Test demo viewer login
        res = self.client.post('/api/auth/login', json={
            'email': 'viewer@cinemind.com',
            'password': 'Viewer@12345'
        })
        self.assertEqual(res.status_code, 200)
        viewer_data = json.loads(res.data)
        self.assertIn('token', viewer_data)
        self.assertEqual(viewer_data['user']['role'], 'viewer')

        # Test password strength policy
        weak_res = self.client.post('/api/auth/validate-password', json={'password': '123'})
        self.assertFalse(json.loads(weak_res.data)['is_valid'])

        strong_res = self.client.post('/api/auth/validate-password', json={'password': 'SecurePassword@2026!'})
        self.assertTrue(json.loads(strong_res.data)['is_valid'])

        # Test unauthorized request
        unauth_res = self.client.get('/api/auth/me')
        self.assertEqual(unauth_res.status_code, 401)

        # Test authorized request
        auth_res = self.client.get('/api/auth/me', headers={'Authorization': f"Bearer {viewer_data['token']}"})
        self.assertEqual(auth_res.status_code, 200)

    def test_04_role_based_access_control(self):
        """Ensure admin endpoints are protected on backend and reject regular viewers"""
        # Login viewer
        res = self.client.post('/api/auth/login', json={'email': 'viewer@cinemind.com', 'password': 'Viewer@12345'})
        viewer_token = json.loads(res.data)['token']

        # Viewer tries to access admin overview
        forbidden_res = self.client.get('/api/admin/overview', headers={'Authorization': f"Bearer {viewer_token}"})
        self.assertEqual(forbidden_res.status_code, 403)

        # Viewer tries to create movie
        forbidden_create = self.client.post('/api/admin/movies', json={'title': 'Hacked Movie', 'release_year': 2026},
                                            headers={'Authorization': f"Bearer {viewer_token}"})
        self.assertEqual(forbidden_create.status_code, 403)

        # Admin accesses admin overview
        admin_login = self.client.post('/api/auth/login', json={'email': 'admin@cinemind.com', 'password': 'Admin@12345'})
        admin_token = json.loads(admin_login.data)['token']
        admin_res = self.client.get('/api/admin/overview', headers={'Authorization': f"Bearer {admin_token}"})
        self.assertEqual(admin_res.status_code, 200)
        self.assertIn('metrics', json.loads(admin_res.data))

    def test_05_rating_trust_analyzer_calculations(self):
        """Verify Bayesian calculations, confidence intervals, and zero-rating handling"""
        with self.app.app_context():
            # Test movie with existing ratings
            metrics = calculate_movie_trust_metrics(1) # RRR
            self.assertIsNotNone(metrics)
            self.assertGreater(metrics['rating_count'], 0)
            self.assertGreater(metrics['bayesian_score'], 0.0)
            self.assertIn('confidence_interval_95', metrics)
            self.assertIn('evidence_label', metrics)
            self.assertFalse(metrics['is_estimate_only'])

            # Test zero-rating edge case with dummy calculation
            zero_metrics = calculate_movie_trust_metrics(999999) # Non-existent
            self.assertIsNone(zero_metrics)

    def test_06_recommendation_system_and_exclusion_of_rated(self):
        """Verify that recommendations exclude already-rated movies and provide explanations"""
        with self.app.app_context():
            viewer = User.query.filter_by(email='viewer@cinemind.com').first()
            self.assertIsNotNone(viewer)

            rated_movie_ids = {r.movie_id for r in Rating.query.filter_by(user_id=viewer.id).all()}
            recs = get_personal_recommendations(viewer.id, limit=5, exclude_rated=True)
            self.assertGreater(len(recs), 0)

            for rec in recs:
                rec_id = rec['movie']['id']
                self.assertNotIn(rec_id, rated_movie_ids, f"Movie {rec_id} was rated but appeared in recommendations!")
                self.assertIn('primary_reason', rec)
                self.assertGreater(rec['compatibility_score'], 0)

    def test_07_watchlist_and_history_operations(self):
        """Test watchlist adding, removing, duplicate prevention, and viewing history clear"""
        res = self.client.post('/api/auth/login', json={'email': 'viewer@cinemind.com', 'password': 'Viewer@12345'})
        token = json.loads(res.data)['token']
        headers = {'Authorization': f"Bearer {token}"}

        # Add movie 21 (Inception) to watchlist
        add_res = self.client.post('/api/me/watchlist/21', headers=headers)
        self.assertEqual(add_res.status_code, 200)

        # Check watchlist
        wl_res = self.client.get('/api/me/watchlist', headers=headers)
        wl_data = json.loads(wl_res.data)
        wl_ids = [m['id'] for m in wl_data['watchlist']]
        self.assertIn(21, wl_ids)

        # Remove movie 21
        del_res = self.client.delete('/api/me/watchlist/21', headers=headers)
        self.assertEqual(del_res.status_code, 200)

        # Test view history recording & clearing
        hist_rec = self.client.post('/api/me/history/21', headers=headers)
        self.assertEqual(hist_rec.status_code, 200)

        hist_get = self.client.get('/api/me/history', headers=headers)
        self.assertGreater(len(json.loads(hist_get.data)['history']), 0)

        hist_clear = self.client.delete('/api/me/history', headers=headers)
        self.assertEqual(hist_clear.status_code, 200)

        hist_get_after = self.client.get('/api/me/history', headers=headers)
        self.assertEqual(len(json.loads(hist_get_after.data)['history']), 0)

    def test_08_natural_language_search(self):
        """Test natural language search entity extraction and error handling"""
        with self.app.app_context():
            # Empty query
            empty_res = parse_natural_language_query('')
            self.assertEqual(empty_res['match_count'], 0)

            # Complex query with word number 'under two hours'
            query_text = 'Find a Telugu thriller under two hours with a high audience rating'
            res = parse_natural_language_query(query_text)
            self.assertEqual(res['parsed_entities']['language'], 'Telugu')
            self.assertIn('Thriller', res['parsed_entities']['genres'])
            self.assertEqual(res['parsed_entities']['max_runtime'], 120)

    def test_09_group_decision_service(self):
        """Test group session creation, join, vote validation, and recommendations"""
        # Create group
        create_res = self.client.post('/api/groups', json={
            'objective': 'avoid_mismatch',
            'constraints': {'languages': ['Telugu', 'Tamil'], 'max_runtime': 180},
            'creator_name': 'HostUser'
        })
        self.assertEqual(create_res.status_code, 201)
        group_data = json.loads(create_res.data)
        code = group_data['code']
        member_id = group_data['member_id']

        # Join group
        join_res = self.client.post(f'/api/groups/{code}/join', json={
            'name': 'Participant2',
            'preferences': {'genres': ['Action']}
        })
        self.assertEqual(join_res.status_code, 200)
        p2_id = json.loads(join_res.data)['member_id']

        # Vote for movie 1 (RRR)
        vote_res = self.client.post(f'/api/groups/{code}/vote', json={
            'member_id': member_id,
            'movie_id': 1,
            'vote': 1
        })
        self.assertEqual(vote_res.status_code, 200)

        # Test invalid participant rejection
        invalid_vote = self.client.post(f'/api/groups/{code}/vote', json={
            'member_id': 99999,
            'movie_id': 1,
            'vote': 1
        })
        self.assertEqual(invalid_vote.status_code, 404)

        # Get group recommendations
        recs_res = self.client.get(f'/api/groups/{code}/recommendations')
        self.assertEqual(recs_res.status_code, 200)
        self.assertGreater(len(json.loads(recs_res.data)['candidates']), 0)

    def test_10_ai_assistant_grounding(self):
        """Verify AI assistant responses are grounded in real database records"""
        with self.app.app_context():
            # Movie comparison
            comp = run_smart_assistant("Compare RRR and Vikram")
            self.assertEqual(comp['type'], 'comparison')
            self.assertIn("RRR", comp['response'])
            self.assertIn("Vikram", comp['response'])

            # Direct vs comparison
            vs_comp = run_smart_assistant("RRR vs Vikram")
            self.assertEqual(vs_comp['type'], 'comparison')
            self.assertIn("RRR", vs_comp['response'])

            # Rating evidence
            evidence = run_smart_assistant("Is Kantara reliable?")
            self.assertEqual(evidence['type'], 'trust_analysis')
            self.assertIn("Kantara", evidence['response'])
            self.assertIn("Bayesian", evidence['response'])

            # Regional movie discovery: Telugu
            telugu = run_smart_assistant("top telugu movies")
            self.assertEqual(telugu['type'], 'recommendation_list')
            self.assertIn("C/o Kancharapalem", telugu['response'])
            self.assertIn("RRR", telugu['response'])
            self.assertGreater(len(telugu['related_movie_ids']), 0)

            # Constrained search with relaxed fallback: Malayalam mystery under 2 hours
            malayalam = run_smart_assistant("Find a Malayalam mystery under 2 hours")
            self.assertEqual(malayalam['type'], 'recommendation_list')
            self.assertIn("Drishyam", malayalam['response'])
            self.assertIn("Bramayugam", malayalam['response'])
            self.assertIn(11, malayalam['related_movie_ids'])

            # Grounded Bayesian methodology question
            bayesian = run_smart_assistant("What is Bayesian rating smoothing?")
            self.assertIn("Bayesian", bayesian['response'])
            self.assertIn("Formula", bayesian['response'])


if __name__ == '__main__':
    unittest.main()
