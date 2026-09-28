"""What the catalogue holds: which verses and hadith, cut where, and for which moments.

Each entry names its source and a selector; `build.py` does the cutting. Adding a text is adding a
line here and re-running fetch.py (for a new verse or collection) and build.py.
`ayah(id, [verse keys], [moments], ar=words(key, first, last), en=exact English substring)`;
`hadith(id, 'collection:number', [moments], (Arabic start, Arabic end), (English start, English end))`
— Arabic phrases are matched with diacritics ignored and cut from the vowelled source.
"""
from build_lib import ayah, hadith, words, Q

VERSE_KEYS = [
    '15:99', '2:286', '50:39', '98:5', '25:62', '64:16', '2:185', '59:18', '94:7', '94:8', '10:58',
    '58:11', '20:114', '1:5', '14:7', '20:1', '20:2', '29:69', '17:106', '18:30', '96:4',
]
COLLECTIONS = ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'ibnmajah']


def entries():
    return [
        # ---- consistency: Today with no portion yet, «ثباتك», the minimum field
        ayah('q-hijr-99', ['15:99'], ['consistency']),
        hadith('h-muslim-783', 'muslim:783.02', ['consistency'],
               ('أحب الأعمال', 'وإن قل'),
               ('The acts most pleasing', 'even if they are small.'),
               note='Bukhari 6464 has close wording («أحب الأعمال أدومها إلى الله وإن قل»); the wording shown is Muslim\'s.'),
        # ---- capacity: size advice in the goal dialog
        ayah('q-baqarah-286', ['2:286'], ['capacity'], ar=words('2:286', 0, 6),
             en='Allah does not require of any soul more than what it can afford.'),
        hadith('h-bukhari-1970', 'bukhari:1970', ['capacity'],
               ('خذوا من العمل', 'حتى تملوا'),
               ('Do those deeds', 'performing religious deeds)."')),
        # ---- slots: the time step of the goal dialog
        ayah('q-qaf-39', ['50:39'], ['slots'], ar=words('50:39', 4, None),
             en='And glorify the praises of your Lord before sunrise and before sunset.'),
        hadith('h-bukhari-39', 'bukhari:39', ['slots'],
               ('إن الدين يسر', 'من الدلجة'),
               ('Religion is very easy', 'last hours of the nights.')),
        # ---- slotsInsight: the «متى تتعلّم» chart
        hadith('h-abudawud-2606', 'abudawud:2606', ['slotsInsight'],
               ('اللهم بارك', 'في بكورها'),
               ('O Allah, bless my people', 'in their early mornings.')),
        # ---- intention: the intention field
        ayah('q-bayyinah-5', ['98:5'], ['intention'], ar=words('98:5', 0, 8),
             en='they were only commanded to worship Allah ˹alone˺ with sincere devotion to Him'),
        hadith('h-bukhari-1', 'bukhari:1', ['intention'],
               ('إنما الأعمال بالنيات', 'ما نوى'),
               ('The reward of deeds', 'according to what he has intended.')),
        # ---- start: the dialog's last step, «بسم الله، اعقد العزم»
        hadith('h-muslim-2664', 'muslim:2664', ['start'],
               ('احرص على ما ينفعك', 'ولا تعجز'),
               ('cherish that which gives you benefit', 'do not lose heart')),
        # ---- morning: Today during الغدوة, only when no action-bound text is on the page
        ayah('q-fatihah-5', ['1:5'], ['morning']),
        hadith('h-ibnmajah-925', 'ibnmajah:925', ['morning'],
               ('اللهم إني أسألك', 'وعملا متقبلا'),
               ('O Allah, I ask You', 'acceptable deeds')),
        # ---- qada: the make-up card, before noon
        ayah('q-furqan-62', ['25:62'], ['qada']),
        hadith('h-muslim-747', 'muslim:747', ['qada'],
               ('من نام عن حزبه', 'من الليل'),
               ('Should anyone fall asleep', 'during the night')),
        # ---- fallback: a portion moved to its second time (first time in a week only)
        ayah('q-ankabut-69', ['29:69'], ['fallback'], ar=words('29:69', 0, 5),
             en='As for those who struggle in Our cause, We will surely guide them along Our Way.'),
        hadith('h-muslim-746', 'muslim:746.06', ['fallback'],
               ('كان رسول الله', 'ثنتى عشرة ركعة'),
               ('when the Messenger of Allah', 'during the daytime')),
        # ---- rest: the days-a-week step; the first rest day of a week on Today
        ayah('q-taha-1-2', ['20:1', '20:2'], ['rest']),
        hadith('h-bukhari-1968', 'bukhari:1968', ['rest'],
               ('إن لربك عليك حقا', 'صدق سلمان'),
               ('Your Lord has a right on you', 'Salman has spoken the truth')),
        # ---- lighten: two missed days; the delete-goal offer
        ayah('q-taghabun-16', ['64:16'], ['lighten'], ar=words('64:16', 0, 4),
             en='So be mindful of Allah to the best of your ability'),
        hadith('h-bukhari-1152', 'bukhari:1152', ['lighten'],
               ('يا عبد الله', 'فترك قيام الليل'),
               ('O `Abdullah!', 'stopped the night prayer')),
        # ---- excuse: the pause dialog, and the return after a pause
        ayah('q-baqarah-185', ['2:185'], ['excuse'], ar=words('2:185', 30, 38),
             en='Allah intends ease for you, not hardship'),
        hadith('h-bukhari-2996', 'bukhari:2996', ['excuse'],
               ('إذا مرض العبد', 'مقيما صحيحا'),
               ('When a slave falls ill', 'at home when in good health')),
        # ---- missed / returning: the after-noon line; the first visit after ≥3 idle days
        ayah('q-kahf-30', ['18:30'], ['returning'], ar=words('18:30', 5, None),
             en='We certainly never deny the reward of those who are best in deeds.'),
        hadith('h-bukhari-6491', 'bukhari:6491', ['returning'],
               ('فمن هم بحسنة', 'حسنة كاملة'),
               ('If somebody intends to do a good deed and he does not do it', 'a full good deed (in his account with Him)'),
               note='About an intention not acted on at all: the wording beside it must say "your intention is written", never that a missed portion counts as done.'),
        # ---- portionDone: a portion reaches FULL (inline, short)
        hadith('h-ibnmajah-3803', 'ibnmajah:3803', ['portionDone'],
               ('الحمد لله الذي', 'تتم الصالحات'),
               ('Praise is to Allah by Whose grace', 'good deeds are completed')),
        # ---- weekDone: the week-intention star fills
        ayah('q-ibrahim-7', ['14:7'], ['weekDone'], ar=words('14:7', 3, 6),
             en='If you are grateful, I will certainly give you more.'),
        # ---- gradual: the review's INCREASE offer
        ayah('q-isra-106', ['17:106'], ['gradual']),
        hadith('h-bukhari-4993', 'bukhari:4993', ['gradual'],
               ('إنما نزل أول ما نزل', 'الحلال والحرام'),
               ('the first thing that was revealed', 'legal and illegal things were revealed.')),
        # ---- review: the Friday review
        ayah('q-hashr-18', ['59:18'], ['review'], ar=words('59:18', 0, 10),
             en='O believers! Be mindful of Allah and let every soul look to what ˹deeds˺ it has sent forth for tomorrow.'),
        hadith('h-bukhari-39-b', 'bukhari:39', ['review'],
               ('فسددوا', 'وأبشروا'),
               ('So you should not be extremists', 'you will be rewarded')),
        # ---- completion: a series or book finished
        ayah('q-sharh-7-8', ['94:7', '94:8'], ['completion']),
        hadith('h-tirmidhi-3599', 'tirmidhi:3599', ['completion'],
               ('اللهم انفعني', 'وزدني علما'),
               ('O Allah, benefit me', 'increase me in knowledge.')),
        # ---- milestones: the milestones page; milestoneReached: the next visit after one
        ayah('q-mujadilah-11', ['58:11'], ['milestones'], ar=words('58:11', 18, 27),
             en='Allah will elevate those of you who are faithful, and ˹raise˺ those gifted with knowledge in rank.'),
        hadith('h-muslim-2699', 'muslim:2699.01', ['milestones'],
               ('ومن سلك طريقا', 'إلى الجنة'),
               ('he who treads the path', 'leading to Paradise for him')),
        ayah('q-yunus-58', ['10:58'], ['milestoneReached'], ar=words('10:58', 1, 6),
             en='In Allah’s grace and mercy let them rejoice.'),
        # ---- dailyVerse: the overview's card when no state-driven text applies
        ayah('q-taha-114', ['20:114'], ['dailyVerse'], ar=words('20:114', 15, None),
             en='and pray, “My Lord! Increase me in knowledge.”'),
        # ---- benefits: «فوائدي»
        ayah('q-alaq-4', ['96:4'], ['benefits']),
        # No hadith here: Abu Dawud 3646 («اكتب … ما يخرج منه إلا حق») is about writing down the
        # Prophet's ﷺ own words, and over a reader's notes it would lend them that guarantee.
        # ---- internal: design principles, never rendered to readers
        hadith('h-bukhari-69', 'bukhari:69', ['principle'],
               ('يسروا ولا تعسروا', 'ولا تنفروا'),
               ('Facilitate things to people', 'run away (from Islam)'), show='internal'),
        hadith('h-abudawud-4833', 'abudawud:4833', ['companion'],
               ('الرجل على دين خليله', 'من يخالل'),
               ('A man follows the religion of his friend', 'whom he makes his friend'), show='internal',
               note='For the study companion (out of scope for now).'),
    ]
