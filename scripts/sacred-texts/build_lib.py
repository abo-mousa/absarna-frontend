"""The selection and cutting behind texts.py; build.py writes the catalogue from it.

Qur'an: Uthmani text from api.quran.com (text_uthmani), English from quran.com's own pages, where
it is labelled "Dr. Mustafa Khattab, The Clear Quran". Hadith: the fawazahmed0/hadith-api editions
(ara-*, eng-*), whose numbering matches sunnah.com (Muslim by Abd al-Baqi's number).

Every excerpt is SELECTED from its source, never typed: a verse by word range, a hadith by a
start/end phrase matched with diacritics ignored and then cut from the vowelled original. The
script fails if a selector does not match exactly once.
"""
import json
import re

import os

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.cache')
OUT = os.path.join(HERE, '..', '..', 'src', 'lib')
Q = json.load(open(os.path.join(CACHE, 'quran.json')))


def _load_hadith():
    table = {}
    for collection in ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'ibnmajah']:
        ar = json.load(open(os.path.join(CACHE, f'ara-{collection}.json')))['hadiths']
        en = json.load(open(os.path.join(CACHE, f'eng-{collection}.json')))['hadiths']
        english = {h['hadithnumber']: h for h in en}
        for h in ar:
            number = str(h.get('arabicnumber', h['hadithnumber']))
            other = english.get(h['hadithnumber'], {})
            table[f'{collection}:{number}'] = {'ar': h['text'], 'en': other.get('text', ''),
                                               'grades': other.get('grades', h.get('grades', []))}
    return table


H = _load_hadith()

DIAC = re.compile(r'[ً-ٰٟۖ-ۭـ]')
MARKS = '‏‎'


def clean(text):
    for mark in MARKS:
        text = text.replace(mark, '')
    return re.sub(r'\s+', ' ', text).strip()


def cut_arabic(source, start, end):
    """The span of `source` from phrase `start` through phrase `end`, diacritics ignored for
    matching and kept in the result."""
    source = clean(source)
    bare, index = [], []
    for i, ch in enumerate(source):
        if not DIAC.match(ch):
            bare.append(ch)
            index.append(i)
    bare = ''.join(bare)
    s = DIAC.sub('', start)
    e = DIAC.sub('', end)
    assert bare.count(s) >= 1, f'start not found: {start}'
    a = bare.index(s)
    b = bare.index(e, a) + len(e)
    lo = index[a]
    hi = index[b - 1] + 1
    while hi < len(source) and DIAC.match(source[hi]):
        hi += 1
    return source[lo:hi]


def cut_english(source, start, end):
    source = clean(source)
    a = source.index(start)
    b = source.index(end, a) + len(end)
    return source[a:b]


def words(key, first=None, last=None):
    ws = [w for w in Q[key]['ar'].split() if w]
    return ' '.join(ws[first:last])


SURAH = {
    1: ('الفاتحة', 'al-Fatihah'), 2: ('البقرة', 'al-Baqarah'), 9: ('التوبة', 'at-Tawbah'),
    10: ('يونس', 'Yunus'), 14: ('إبراهيم', 'Ibrahim'), 15: ('الحجر', 'al-Hijr'),
    17: ('الإسراء', 'al-Isra'), 18: ('الكهف', 'al-Kahf'), 20: ('طه', 'Ta-Ha'),
    25: ('الفرقان', 'al-Furqan'), 29: ('العنكبوت', "al-'Ankabut"), 50: ('ق', 'Qaf'),
    58: ('المجادلة', 'al-Mujadilah'), 59: ('الحشر', 'al-Hashr'), 64: ('التغابن', 'at-Taghabun'),
    94: ('الشرح', 'ash-Sharh'), 96: ('العلق', "al-'Alaq"), 98: ('البينة', 'al-Bayyinah'),
}
COLLECTION = {
    'bukhari': ('البخاري', 'Sahih al-Bukhari', 'Muhammad Muhsin Khan'),
    'muslim': ('مسلم', 'Sahih Muslim', 'Abdul Hamid Siddiqui'),
    'abudawud': ('أبو داود', 'Sunan Abi Dawud', 'Ahmad Hasan'),
    'tirmidhi': ('الترمذي', "Jami' at-Tirmidhi", 'Darussalam (Abu Khaliyl)'),
    'ibnmajah': ('ابن ماجه', 'Sunan Ibn Majah', 'Darussalam (Nasiruddin al-Khattab)'),
}


def ayah(id, keys, contexts, ar=None, en=None):
    surah = int(keys[0].split(':')[0])
    verses = [int(k.split(':')[1]) for k in keys]
    full_ar = ' ۝ '.join(Q[k]['ar'].strip() for k in keys)
    full_en = ' '.join(clean(Q[k]['en']) for k in keys)
    text_ar = ar if ar is not None else full_ar
    text_en = en if en is not None else full_en
    return {
        'id': id, 'kind': 'AYAH', 'contexts': contexts,
        'ref': {'surah': surah, 'verses': verses},
        'refLabel': {'ar': f'{SURAH[surah][0]} · {"–".join(map(str, [verses[0], verses[-1]] if len(verses) > 1 else verses))}',
                     'en': f'{SURAH[surah][1]} {surah}:{"–".join(map(str, [verses[0], verses[-1]] if len(verses) > 1 else verses))}'},
        'ar': text_ar, 'en': text_en,
        'partial': text_ar != full_ar,
        'translation': 'Dr. Mustafa Khattab, The Clear Quran',
        'sources': {k: {'ar': Q[k]['ar'].strip(), 'en': clean(Q[k]['en'])} for k in keys},
    }


def hadith(id, ref, contexts, ar, en, show='reader', note=None):
    col, num = ref.split(':')
    src = H[ref]
    grades = [f"{g['name']}: {g['grade']}" for g in src.get('grades', [])]
    text_ar = cut_arabic(src['ar'], *ar)
    text_en = cut_english(src['en'], *en)
    entry = {
        'id': id, 'kind': 'HADITH', 'contexts': contexts,
        'ref': {'collection': col, 'number': num.split('.')[0]},
        'refLabel': {'ar': f'رواه {COLLECTION[col][0]} ({num.split(".")[0]})',
                     'en': f'{COLLECTION[col][1]} {num.split(".")[0]}'},
        'ar': text_ar, 'en': text_en,
        # A hadith is quoted by its clause, as a verse is: an excerpt gets the renderer's ellipsis.
        'partial': text_ar != clean(src['ar']) or text_en != clean(src['en']),
        'translation': COLLECTION[col][2],
        'grading': grades or ['in the Sahih'],
        'show': show,
        'sources': {ref: {'ar': clean(src['ar']), 'en': clean(src['en'])}},
    }
    if note:
        entry['note'] = note
    return entry


