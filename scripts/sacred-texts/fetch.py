"""Downloads the sources `build.py` selects from, into `.cache/` beside this file (git-ignored).

Qur'an: Uthmani Arabic from api.quran.com (`text_uthmani`); English from quran.com's own verse
page, where it is labelled "Dr. Mustafa Khattab, The Clear Quran" — the public API does not serve
that translation (see PROGRESS-AND-GOALS.md §8.3 on its licence). Hadith: the Arabic and English
editions of fawazahmed0/hadith-api, numbered as sunnah.com numbers them.

Uses curl rather than urllib so it works on a Python with no certificate bundle configured.
Run: python3 scripts/sacred-texts/fetch.py
"""
import json
import os
import re
import subprocess
import time

from texts import COLLECTIONS, VERSE_KEYS

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.cache')


def get(url):
    return subprocess.run(['curl', '-sL', '--max-time', '120', '-A', 'Mozilla/5.0', url],
                          capture_output=True, text=True, check=True).stdout


def main():
    os.makedirs(CACHE, exist_ok=True)
    quran = {}
    for key in VERSE_KEYS:
        ar = json.loads(get(f'https://api.quran.com/api/v4/verses/by_key/{key}?fields=text_uthmani'))['verse']['text_uthmani']
        page = get(f'https://quran.com/{key}')
        data = json.loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', page, re.S).group(1))
        translation = data['props']['pageProps']['versesResponse']['verses'][0]['translations'][0]
        if 'Clear Quran' not in translation['resourceName']:
            raise SystemExit(f'{key}: expected The Clear Quran, got {translation["resourceName"]}')
        en = re.sub(r'<sup[^>]*>.*?</sup>', '', translation['text']).strip()
        quran[key] = {'ar': ar, 'en': en}
        time.sleep(0.3)
    json.dump(quran, open(os.path.join(CACHE, 'quran.json'), 'w'), ensure_ascii=False, indent=1)

    for collection in COLLECTIONS:
        for lang in ('ara', 'eng'):
            path = os.path.join(CACHE, f'{lang}-{collection}.json')
            if not os.path.exists(path):
                with open(path, 'w') as out:
                    out.write(get(f'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{lang}-{collection}.min.json'))
    print('fetched', len(quran), 'verses and', len(COLLECTIONS), 'collections into', CACHE)


if __name__ == '__main__':
    main()
