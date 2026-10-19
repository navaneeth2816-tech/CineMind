import urllib.request

POSTER_URLS = {
    1: 'https://image.tmdb.org/t/p/w500/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg',
    2: 'https://image.tmdb.org/t/p/w500/21sC2assImQIYCEDA84Qh9d1RsK.jpg',
    3: 'https://image.tmdb.org/t/p/w500/fDsN0xMM7OUJohZbCxjMB3JXu8h.jpg',
    4: 'https://image.tmdb.org/t/p/w500/bU9q9yVtxeBiC0Do27CekHXNE6D.jpg',
    5: 'https://image.tmdb.org/t/p/w500/pX7fn4EZrg2YFlV4GNMIfHDOQZ6.jpg',
    6: 'https://image.tmdb.org/t/p/w500/774UV1aCURb4s4JfEFg3IEMu5Zj.jpg',
    7: 'https://image.tmdb.org/t/p/w500/ehybiOtBUtrMkmtB39zQEtq1Jie.jpg',
    8: 'https://image.tmdb.org/t/p/w500/4B2NFKN713AdXJExc8Kayr6qofu.jpg',
    9: 'https://upload.wikimedia.org/wikipedia/en/c/c4/%2796_film_poster.jpg',
    10: 'https://upload.wikimedia.org/wikipedia/en/9/99/Manjummel_Boys_poster.jpg',
    11: 'https://image.tmdb.org/t/p/w500/gPBldHTnqpgsrnDnSrAlFwE6Q1t.jpg',
    12: 'https://image.tmdb.org/t/p/w500/lJ3RvIirE2C7gdBKvPRaoQ3iCo2.jpg',
    13: 'https://upload.wikimedia.org/wikipedia/en/0/09/Bramayugam_poster.jpg',
    14: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
    15: 'https://upload.wikimedia.org/wikipedia/en/c/cc/K.G.F_Chapter_1_poster.jpg',
    16: 'https://upload.wikimedia.org/wikipedia/en/1/19/777_Charlie_official_poster.jpg',
    17: 'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg',
    18: 'https://image.tmdb.org/t/p/w500/cJRPOLEexI7qp2DKtFfCh7YaaUG.jpg',
    19: 'https://image.tmdb.org/t/p/w500/z1xOCxw780WFJC5uCTMfCkQ4Agi.jpg',
    20: 'https://image.tmdb.org/t/p/w500/dy3K6hNvwE05siGgiLJcEiwgpdO.jpg',
    21: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
    22: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    23: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    24: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    25: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
all_ok = True
for movie_id in sorted(POSTER_URLS.keys()):
    url = POSTER_URLS[movie_id]
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                print(f"Movie {movie_id:2d}: 200 OK -> {url[:65]}...")
            else:
                print(f"Movie {movie_id:2d}: Status {res.status}")
                all_ok = False
    except Exception as e:
        print(f"Movie {movie_id:2d}: FAILED -> {e}")
        all_ok = False

if all_ok:
    print("\nSUCCESS: All 25 posters return HTTP 200 OK!")
else:
    print("\nSome posters failed.")
