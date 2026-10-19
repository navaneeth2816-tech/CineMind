import urllib.request
import urllib.parse
import json

headers = {'User-Agent': 'CineMindBot/1.0 (contact@cinemind.test)'}
title = "File:'96 film poster.jpg"
params = urllib.parse.urlencode({
    'action': 'query',
    'titles': title,
    'prop': 'imageinfo',
    'iiprop': 'url',
    'format': 'json'
})
url = f"https://en.wikipedia.org/w/api.php?{params}"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read().decode())
    for pid, pdata in data['query']['pages'].items():
        print(title, pdata.get('imageinfo', [{}])[0].get('url'))
