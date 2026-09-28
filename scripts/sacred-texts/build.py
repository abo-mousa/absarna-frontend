"""Writes src/lib/sacredTexts.js and its test fixture from texts.py and the fetched sources.

Run after fetch.py:  python3 scripts/sacred-texts/build.py
Fails if any selector does not match its source exactly.
"""
import json
import os

from build_lib import H, OUT, clean
from texts import entries

T = entries()

for t in T:
    t['reviewed'] = False
    t.setdefault('show', 'reader')
    for key, src in t['sources'].items():
        assert t['ar'] in src['ar'] or t['kind'] == 'AYAH' and len(t['sources']) > 1, (t['id'], 'ar')
    if t['kind'] == 'AYAH' and len(t['sources']) == 1:
        (only,) = t['sources'].values()
        assert t['ar'] in only['ar'], (t['id'], t['ar'])
        assert t['en'] in only['en'], (t['id'], t['en'])
    # A quotation mark from the source's own punctuation is not part of the words (Bukhari 1970's
    # English and 1968's Arabic both once ended on one).
    assert '"' not in t['ar'] and '"' not in t['en'], (t['id'], 'stray quotation mark')
    if t['kind'] == 'HADITH':
        (only,) = t['sources'].values()
        assert t['en'] in only['en'], (t['id'], t['en'])

sources = {}
for t in T:
    for key, src in t.pop('sources').items():
        sources[('quran:' if t['kind'] == 'AYAH' else '') + key] = src
    t['sourceKeys'] = [('quran:' + k if t['kind'] == 'AYAH' else k) for k in
                       ([f"{t['ref']['surah']}:{v}" for v in t['ref']['verses']] if t['kind'] == 'AYAH'
                        else [next(k for k in H if k.startswith(t['ref']['collection'] + ':' + t['ref']['number']) and
                                   H[k]['en'] and clean(H[k]['en']).find(t['en']) >= 0)])]

js = []
js.append("""/**
 * The Qur'an and Sunnah texts the progress tab and Today show — data, not catalog strings: the
 * Arabic is the same in both builds, and the English build shows a translation beneath it.
 *
 * <p><b>Generated, not typed.</b> Every `ar`/`en` here was cut from its source by a script and is
 * pinned against that source by `__tests__/sacredTexts.test.js`, which reads the full texts in
 * `__fixtures__/sacredTextSources.json`. Qur'an: Uthmani text (api.quran.com, `text_uthmani`) and
 * Dr. Mustafa Khattab's The Clear Quran as published on quran.com. Hadith: the Arabic and English
 * of the cited collection in the numbering sunnah.com uses (Muslim by Abd al-Baqi's number). A
 * wording that is "almost right" is the failure this guards against — the first draft quoted
 * Muslim's wording under Bukhari's number, and Bukhari's narration under Muslim's.
 *
 * <p><b>Nothing here ships until `reviewed` is true for every entry shown to readers</b>
 * (PROGRESS-AND-GOALS.md §8), and the translations' licences are cleared (§8.3).
 *
 * <p>`show: 'internal'` entries are design principles recorded beside the rest; nothing renders
 * them. `partial` marks a clause cut from a longer verse or hadith; the renderer prefixes the English with an
 * ellipsis and never adds or removes words.
 */
""")
js.append('export const SACRED_TEXTS = ' + json.dumps(T, ensure_ascii=False, indent=4) + ';\n')
js.append("""
/** Every context a screen may ask for, and the moment each is for (PROGRESS-AND-GOALS.md §8.1). */
export const TEXT_CONTEXTS = [...new Set(SACRED_TEXTS.flatMap((text) => text.contexts))];

/**
 * The texts for one moment. `kind` narrows to 'AYAH' or 'HADITH' when a screen shows one of each;
 * internal entries are never returned.
 */
export function textsFor(context, kind = null) {
    return SACRED_TEXTS.filter((text) =>
        text.show === 'reader' && text.contexts.includes(context) && (!kind || text.kind === kind));
}

/**
 * One text for a moment, the same for a whole day: `seed` is the reader's local date
 * ('YYYY-MM-DD'), so a page does not change what it says on a refresh.
 */
export function pickText(context, seed, kind = null) {
    const options = textsFor(context, kind);
    if (options.length === 0) return null;
    let hash = 0;
    for (const ch of `${context}|${seed}`) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
    return options[hash % options.length];
}
""")
open(f'{OUT}/sacredTexts.js', 'w').write('\n'.join(js).replace('"', "'") if False else '\n'.join(js))

os.makedirs(f'{OUT}/__fixtures__', exist_ok=True)
json.dump(sources, open(f'{OUT}/__fixtures__/sacredTextSources.json', 'w'), ensure_ascii=False, indent=1)
print(len(T), 'texts;', len(sources), 'sources')
for t in T:
    print(f"{t['id']:18} {t['refLabel']['en']:26} | {t['ar'][:70]} | {t['en'][:70]}")
