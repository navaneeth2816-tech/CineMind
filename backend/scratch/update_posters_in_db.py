import sqlite3

UPDATES = {
    1: 'https://image.tmdb.org/t/p/w500/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg',
    2: 'https://image.tmdb.org/t/p/w500/21sC2assImQIYCEDA84Qh9d1RsK.jpg',
    3: 'https://image.tmdb.org/t/p/w500/fDsN0xMM7OUJohZbCxjMB3JXu8h.jpg',
    4: 'https://image.tmdb.org/t/p/w500/bU9q9yVtxeBiC0Do27CekHXNE6D.jpg',
    5: 'https://image.tmdb.org/t/p/w500/pX7fn4EZrg2YFlV4GNMIfHDOQZ6.jpg',
    6: 'https://image.tmdb.org/t/p/w500/774UV1aCURb4s4JfEFg3IEMu5Zj.jpg',
    7: 'https://image.tmdb.org/t/p/w500/ehybiOtBUtrMkmtB39zQEtq1Jie.jpg',
    8: 'https://image.tmdb.org/t/p/w500/4B2NFKN713AdXJExc8Kayr6qofu.jpg',
    9: 'https://image.tmdb.org/t/p/w500/dYImzEquIZglfzDnJlHYdlUIeSo.jpg',
    10: 'https://image.tmdb.org/t/p/w500/zGsHpuMN412VyzJZZnQeq4lMdjF.jpg',
    11: 'https://image.tmdb.org/t/p/w500/gPBldHTnqpgsrnDnSrAlFwE6Q1t.jpg',
    12: 'https://image.tmdb.org/t/p/w500/lJ3RvIirE2C7gdBKvPRaoQ3iCo2.jpg',
    13: 'https://image.tmdb.org/t/p/w500/snQLwRrfQAl5YFKVefZq9Lbscki.jpg',
    14: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
    15: 'https://image.tmdb.org/t/p/w500/ltHlJwvxKv7d0ooCiKSAvfwV9tX.jpg',
    16: 'https://image.tmdb.org/t/p/w500/qArPmXH0aWsT3SEtYl8XrU2Oz48.jpg',
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

conn = sqlite3.connect('app/cinemind.db')
c = conn.cursor()

updated_count = 0
for movie_id, poster_url in UPDATES.items():
    c.execute("UPDATE movies SET poster_url = ? WHERE id = ?", (poster_url, movie_id))
    updated_count += c.rowcount

conn.commit()
print(f"Successfully updated poster_url for {updated_count} movies in cinemind.db")

# Verify sample
c.execute("SELECT id, title, poster_url FROM movies WHERE id IN (1, 6, 9, 10, 15, 16, 20)")
for row in c.fetchall():
    print(f"ID {row[0]}: {row[1]} -> {row[2]}")

conn.close()
