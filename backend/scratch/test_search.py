import sys
sys.path.insert(0, '.')
from app import create_app
from app.services.nl_search_service import parse_natural_language_query

app = create_app()
with app.app_context():
    queries = [
        '',
        '   ',
        'Find a Telugu thriller under two hours with a high audience rating',
        'Tamil movies with rating above 4.5',
        'Hindi comedy under 180 minutes',
        'Kannada drama',
        'Malayalam mystery',
        'English sci-fi'
    ]
    for q in queries:
        res = parse_natural_language_query(q)
        print(f"Query: '{q}'")
        print(f"   Matches: {res.get('match_count')} | Summary: {res.get('filter_summary')}")
        if res.get('results'):
            print(f"   First match: {res['results'][0]['title']}")
