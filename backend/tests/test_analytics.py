"""
Unit tests for CineMind Data Analysis and Visualization Service
Verifies:
- Pandas DataFrame aggregations
- NumPy rating statistics and empty dataset safety
- Matplotlib chart generation (Base64 data URLs & raw bytes)
- Minimum rating-count rule
- Privacy guarantees (no user PII exposed)
- API endpoint integration
"""

import unittest
import pandas as pd
import numpy as np
from app import create_app
from app.models import db, Movie, Rating
from app.services.data_analysis_service import (
    calculate_numpy_rating_statistics,
    analyze_ratings_with_pandas,
    create_genre_analysis_chart,
    create_rating_distribution_chart,
    create_top_rated_movies_chart,
    create_regional_comparison_chart,
    generate_complete_analytics_report,
    get_ratings_dataframe,
    get_movies_dataframe,
    get_genres_dataframe
)


class TestDataAnalysisService(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_numpy_statistics_calculation(self):
        """Test NumPy statistical calculations on sample data"""
        sample_ratings = pd.DataFrame({
            'rating': [3.5, 4.0, 4.5, 4.5, 5.0, 5.0, 5.0]
        })
        stats = calculate_numpy_rating_statistics(sample_ratings)

        expected_mean = float(np.mean([3.5, 4.0, 4.5, 4.5, 5.0, 5.0, 5.0]))
        expected_median = float(np.median([3.5, 4.0, 4.5, 4.5, 5.0, 5.0, 5.0]))
        expected_std = float(np.std([3.5, 4.0, 4.5, 4.5, 5.0, 5.0, 5.0]))

        self.assertAlmostEqual(stats['mean'], round(expected_mean, 3))
        self.assertAlmostEqual(stats['median'], round(expected_median, 2))
        self.assertAlmostEqual(stats['std_dev'], round(expected_std, 3))
        self.assertEqual(stats['min'], 3.5)
        self.assertEqual(stats['max'], 5.0)
        self.assertEqual(stats['total_ratings'], 7)
        self.assertIn(4, stats['star_distribution'])
        self.assertIn(5, stats['star_distribution'])

    def test_numpy_empty_dataset_safety(self):
        """Test NumPy handles empty datasets without crashing"""
        empty_df = pd.DataFrame(columns=['rating'])
        stats = calculate_numpy_rating_statistics(empty_df)
        self.assertEqual(stats['total_ratings'], 0)
        self.assertEqual(stats['mean'], 0.0)
        self.assertEqual(stats['median'], 0.0)
        self.assertEqual(stats['std_dev'], 0.0)
        self.assertEqual(stats['min'], 0.0)
        self.assertEqual(stats['max'], 0.0)

    def test_pandas_aggregations_and_minimum_rating_rule(self):
        """Test Pandas movie aggregations and minimum threshold rule"""
        df_movies = pd.DataFrame([
            {'movie_id': 1, 'title': 'Movie High', 'language': 'Telugu', 'release_year': 2022, 'runtime_minutes': 140, 'bayesian_score': 4.5},
            {'movie_id': 2, 'title': 'Movie Low Count', 'language': 'Tamil', 'release_year': 2023, 'runtime_minutes': 120, 'bayesian_score': 4.8},
            {'movie_id': 3, 'title': 'Movie Zero', 'language': 'Hindi', 'release_year': 2021, 'runtime_minutes': 150, 'bayesian_score': 4.0}
        ])

        # Movie 1 has 6 ratings; Movie 2 has 2 ratings; Movie 3 has 0 ratings
        df_ratings = pd.DataFrame([
            {'movie_id': 1, 'rating': 4.5},
            {'movie_id': 1, 'rating': 5.0},
            {'movie_id': 1, 'rating': 4.5},
            {'movie_id': 1, 'rating': 4.0},
            {'movie_id': 1, 'rating': 5.0},
            {'movie_id': 1, 'rating': 4.5},
            {'movie_id': 2, 'rating': 5.0},
            {'movie_id': 2, 'rating': 5.0}
        ])

        df_genres = pd.DataFrame([
            {'movie_id': 1, 'genre_name': 'Action'},
            {'movie_id': 2, 'genre_name': 'Drama'},
            {'movie_id': 3, 'genre_name': 'Action'}
        ])

        analysis = analyze_ratings_with_pandas(df_ratings, df_movies, df_genres, min_ratings=5)

        # Minimum rating threshold check
        top_movies = analysis['top_rated_movies']
        qualified_ids = [m['movie_id'] for m in top_movies]

        # Movie 1 has 6 ratings -> MUST be included
        self.assertIn(1, qualified_ids)
        # Movie 2 has 2 ratings -> MUST NOT be in verified top-rated list
        self.assertNotIn(2, qualified_ids)
        # Movie 3 has 0 ratings -> MUST NOT be in verified top-rated list
        self.assertNotIn(3, qualified_ids)

        self.assertEqual(analysis['movies_qualified'], 1)
        self.assertEqual(analysis['movies_evaluated'], 3)
        self.assertEqual(analysis['min_ratings_threshold'], 5)

    def test_matplotlib_chart_generation(self):
        """Test Matplotlib charts generate non-empty Base64 strings and valid PNG bytes"""
        sample_stats = {
            'total_ratings': 100,
            'mean': 4.5,
            'median': 4.5,
            'std_dev': 0.4,
            'star_distribution': {1: 0, 2: 2, 3: 10, 4: 48, 5: 40}
        }
        b64, raw_bytes = create_rating_distribution_chart(sample_stats)
        self.assertTrue(b64.startswith("data:image/png;base64,"))
        self.assertGreater(len(raw_bytes), 1000)

        # Test Genre Chart
        sample_genres = [
            {'genre': 'Action', 'average_rating': 4.6, 'ratings_count': 120},
            {'genre': 'Drama', 'average_rating': 4.4, 'ratings_count': 80}
        ]
        g_b64, g_bytes = create_genre_analysis_chart(sample_genres)
        self.assertTrue(g_b64.startswith("data:image/png;base64,"))
        self.assertGreater(len(g_bytes), 1000)

    def test_analytics_api_endpoint(self):
        """Test GET /api/analytics/ratings response structure and privacy"""
        with self.app.app_context():
            res = self.client.get('/api/analytics/ratings?min_ratings=5')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()

            # Check presence of NumPy statistics
            self.assertIn('numpy_statistics', data)
            self.assertIn('mean', data['numpy_statistics'])
            self.assertIn('std_dev', data['numpy_statistics'])

            # Check presence of Pandas aggregations
            self.assertIn('genre_analysis', data)
            self.assertIn('top_rated_movies', data)
            self.assertIn('min_ratings_threshold', data)
            self.assertEqual(data['min_ratings_threshold'], 5)

            # Check presence of Matplotlib charts
            self.assertIn('charts', data)
            self.assertIn('genre_analysis', data['charts'])
            self.assertIn('rating_distribution', data['charts'])
            self.assertIn('top_rated_movies', data['charts'])
            self.assertIn('regional_comparison', data['charts'])

            # Privacy Guarantee: No PII fields in response
            raw_text = res.get_data(as_text=True).lower()
            for forbidden in ['email', 'password', 'user_id']:
                self.assertNotIn(forbidden, raw_text)

    def test_raw_chart_image_endpoints(self):
        """Test GET /api/analytics/charts/<name> endpoints return raw PNGs"""
        with self.app.app_context():
            for chart in ['genre-analysis', 'rating-distribution', 'top-rated', 'regional-comparison']:
                res = self.client.get(f'/api/analytics/charts/{chart}')
                self.assertEqual(res.status_code, 200)
                self.assertEqual(res.content_type, 'image/png')
                self.assertGreater(len(res.data), 1000)

    def test_recommendation_explainability_fields(self):
        """Test that recommendations return all explainability fields"""
        with self.app.app_context():
            res = self.client.get('/api/recommendations')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            recs = data.get('recommendations', [])
            self.assertGreater(len(recs), 0)

            sample = recs[0]
            self.assertIn('movie_title', sample)
            self.assertIn('average_rating', sample)
            self.assertIn('number_of_ratings', sample)
            self.assertIn('recommendation_score', sample)
            self.assertIn('recommendation_reason', sample)


if __name__ == '__main__':
    unittest.main()
