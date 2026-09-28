/**
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

export const SACRED_TEXTS = [
    {
        "id": "q-hijr-99",
        "kind": "AYAH",
        "contexts": [
            "consistency"
        ],
        "ref": {
            "surah": 15,
            "verses": [
                99
            ]
        },
        "refLabel": {
            "ar": "الحجر · 99",
            "en": "al-Hijr 15:99"
        },
        "ar": "وَٱعْبُدْ رَبَّكَ حَتَّىٰ يَأْتِيَكَ ٱلْيَقِينُ",
        "en": "and worship your Lord until the inevitable comes your way.",
        "partial": false,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:15:99"
        ]
    },
    {
        "id": "h-muslim-783",
        "kind": "HADITH",
        "contexts": [
            "consistency"
        ],
        "ref": {
            "collection": "muslim",
            "number": "783"
        },
        "refLabel": {
            "ar": "رواه مسلم (783)",
            "en": "Sahih Muslim 783"
        },
        "ar": "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ تَعَالَى أَدْوَمُهَا وَإِنْ قَلَّ",
        "en": "The acts most pleasing to Allah are those which are done continuously, even if they are small.",
        "partial": true,
        "translation": "Abdul Hamid Siddiqui",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "note": "Bukhari 6464 has close wording («أحب الأعمال أدومها إلى الله وإن قل»); the wording shown is Muslim's.",
        "reviewed": false,
        "sourceKeys": [
            "muslim:783.02"
        ]
    },
    {
        "id": "q-baqarah-286",
        "kind": "AYAH",
        "contexts": [
            "capacity"
        ],
        "ref": {
            "surah": 2,
            "verses": [
                286
            ]
        },
        "refLabel": {
            "ar": "البقرة · 286",
            "en": "al-Baqarah 2:286"
        },
        "ar": "لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
        "en": "Allah does not require of any soul more than what it can afford.",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:2:286"
        ]
    },
    {
        "id": "h-bukhari-1970",
        "kind": "HADITH",
        "contexts": [
            "capacity"
        ],
        "ref": {
            "collection": "bukhari",
            "number": "1970"
        },
        "refLabel": {
            "ar": "رواه البخاري (1970)",
            "en": "Sahih al-Bukhari 1970"
        },
        "ar": "خُذُوا مِنَ الْعَمَلِ مَا تُطِيقُونَ، فَإِنَّ اللَّهَ لاَ يَمَلُّ حَتَّى تَمَلُّوا",
        "en": "Do those deeds which you can do easily, as Allah will not get tired (of giving rewards) till you get bored and tired (of performing religious deeds)",
        "partial": true,
        "translation": "Muhammad Muhsin Khan",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "bukhari:1970"
        ]
    },
    {
        "id": "q-qaf-39",
        "kind": "AYAH",
        "contexts": [
            "slots"
        ],
        "ref": {
            "surah": 50,
            "verses": [
                39
            ]
        },
        "refLabel": {
            "ar": "ق · 39",
            "en": "Qaf 50:39"
        },
        "ar": "وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ ٱلشَّمْسِ وَقَبْلَ ٱلْغُرُوبِ",
        "en": "And glorify the praises of your Lord before sunrise and before sunset.",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:50:39"
        ]
    },
    {
        "id": "h-bukhari-39",
        "kind": "HADITH",
        "contexts": [
            "slots"
        ],
        "ref": {
            "collection": "bukhari",
            "number": "39"
        },
        "refLabel": {
            "ar": "رواه البخاري (39)",
            "en": "Sahih al-Bukhari 39"
        },
        "ar": "إِنَّ الدِّينَ يُسْرٌ، وَلَنْ يُشَادَّ الدِّينَ أَحَدٌ إِلاَّ غَلَبَهُ، فَسَدِّدُوا وَقَارِبُوا وَأَبْشِرُوا، وَاسْتَعِينُوا بِالْغَدْوَةِ وَالرَّوْحَةِ وَشَىْءٍ مِنَ الدُّلْجَةِ",
        "en": "Religion is very easy and whoever overburdens himself in his religion will not be able to continue in that way. So you should not be extremists, but try to be near to perfection and receive the good tidings that you will be rewarded; and gain strength by worshipping in the mornings, the afternoons, and during the last hours of the nights.",
        "partial": true,
        "translation": "Muhammad Muhsin Khan",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "bukhari:39"
        ]
    },
    {
        "id": "h-abudawud-2606",
        "kind": "HADITH",
        "contexts": [
            "slotsInsight"
        ],
        "ref": {
            "collection": "abudawud",
            "number": "2606"
        },
        "refLabel": {
            "ar": "رواه أبو داود (2606)",
            "en": "Sunan Abi Dawud 2606"
        },
        "ar": "اللَّهُمَّ بَارِكْ لأُمَّتِي فِي بُكُورِهَا",
        "en": "O Allah, bless my people in their early mornings.",
        "partial": true,
        "translation": "Ahmad Hasan",
        "grading": [
            "Al-Albani: Sahih",
            "Muhammad Muhyi Al-Din Abdul Hamid: Sahih",
            "Shuaib Al Arnaut: Sahih Lighairihi",
            "Zubair Ali Zai: Hasan"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "abudawud:2606"
        ]
    },
    {
        "id": "q-bayyinah-5",
        "kind": "AYAH",
        "contexts": [
            "intention"
        ],
        "ref": {
            "surah": 98,
            "verses": [
                5
            ]
        },
        "refLabel": {
            "ar": "البينة · 5",
            "en": "al-Bayyinah 98:5"
        },
        "ar": "وَمَآ أُمِرُوٓا۟ إِلَّا لِيَعْبُدُوا۟ ٱللَّهَ مُخْلِصِينَ لَهُ ٱلدِّينَ",
        "en": "they were only commanded to worship Allah ˹alone˺ with sincere devotion to Him",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:98:5"
        ]
    },
    {
        "id": "h-bukhari-1",
        "kind": "HADITH",
        "contexts": [
            "intention"
        ],
        "ref": {
            "collection": "bukhari",
            "number": "1"
        },
        "refLabel": {
            "ar": "رواه البخاري (1)",
            "en": "Sahih al-Bukhari 1"
        },
        "ar": "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
        "en": "The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended.",
        "partial": true,
        "translation": "Muhammad Muhsin Khan",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "bukhari:1"
        ]
    },
    {
        "id": "h-muslim-2664",
        "kind": "HADITH",
        "contexts": [
            "start"
        ],
        "ref": {
            "collection": "muslim",
            "number": "2664"
        },
        "refLabel": {
            "ar": "رواه مسلم (2664)",
            "en": "Sahih Muslim 2664"
        },
        "ar": "احْرِصْ عَلَى مَا يَنْفَعُكَ وَاسْتَعِنْ بِاللَّهِ وَلاَ تَعْجِزْ",
        "en": "cherish that which gives you benefit (in the Hereafter) and seek help from Allah and do not lose heart",
        "partial": true,
        "translation": "Abdul Hamid Siddiqui",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "muslim:2664"
        ]
    },
    {
        "id": "q-fatihah-5",
        "kind": "AYAH",
        "contexts": [
            "morning"
        ],
        "ref": {
            "surah": 1,
            "verses": [
                5
            ]
        },
        "refLabel": {
            "ar": "الفاتحة · 5",
            "en": "al-Fatihah 1:5"
        },
        "ar": "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        "en": "You ˹alone˺ we worship and You ˹alone˺ we ask for help.",
        "partial": false,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:1:5"
        ]
    },
    {
        "id": "h-ibnmajah-925",
        "kind": "HADITH",
        "contexts": [
            "morning"
        ],
        "ref": {
            "collection": "ibnmajah",
            "number": "925"
        },
        "refLabel": {
            "ar": "رواه ابن ماجه (925)",
            "en": "Sunan Ibn Majah 925"
        },
        "ar": "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلاً مُتَقَبَّلاً",
        "en": "O Allah, I ask You for beneficial knowledge, goodly provision and acceptable deeds",
        "partial": true,
        "translation": "Darussalam (Nasiruddin al-Khattab)",
        "grading": [
            "Al-Albani: Sahih",
            "Muhammad Fouad Abd al-Baqi: Sahih",
            "Zubair Ali Zai: Daif"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "ibnmajah:925"
        ]
    },
    {
        "id": "q-furqan-62",
        "kind": "AYAH",
        "contexts": [
            "qada"
        ],
        "ref": {
            "surah": 25,
            "verses": [
                62
            ]
        },
        "refLabel": {
            "ar": "الفرقان · 62",
            "en": "al-Furqan 25:62"
        },
        "ar": "وَهُوَ ٱلَّذِى جَعَلَ ٱلَّيْلَ وَٱلنَّهَارَ خِلْفَةً لِّمَنْ أَرَادَ أَن يَذَّكَّرَ أَوْ أَرَادَ شُكُورًا",
        "en": "And He is the One Who causes the day and the night to alternate, ˹as a sign˺ for whoever desires to be mindful or to be grateful.",
        "partial": false,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:25:62"
        ]
    },
    {
        "id": "h-muslim-747",
        "kind": "HADITH",
        "contexts": [
            "qada"
        ],
        "ref": {
            "collection": "muslim",
            "number": "747"
        },
        "refLabel": {
            "ar": "رواه مسلم (747)",
            "en": "Sahih Muslim 747"
        },
        "ar": "مَنْ نَامَ عَنْ حِزْبِهِ أَوْ عَنْ شَىْءٍ مِنْهُ فَقَرَأَهُ فِيمَا بَيْنَ صَلاَةِ الْفَجْرِ وَصَلاَةِ الظُّهْرِ كُتِبَ لَهُ كَأَنَّمَا قَرَأَهُ مِنَ اللَّيْلِ",
        "en": "Should anyone fall asleep and fail to recite his portion of the Qur'an, or a part of it, if he recites it between the dawn prayer and the noon prayer, it will be recorded for him as though he had recited it during the night",
        "partial": true,
        "translation": "Abdul Hamid Siddiqui",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "note": "Said of one's night ḥizb of Qur'an or prayer; followed here as a model for making up a portion. The wording beside it must not promise that reward for a missed lesson.",
        "reviewed": false,
        "sourceKeys": [
            "muslim:747"
        ]
    },
    {
        "id": "q-ankabut-69",
        "kind": "AYAH",
        "contexts": [
            "fallback"
        ],
        "ref": {
            "surah": 29,
            "verses": [
                69
            ]
        },
        "refLabel": {
            "ar": "العنكبوت · 69",
            "en": "al-'Ankabut 29:69"
        },
        "ar": "وَٱلَّذِينَ جَـٰهَدُوا۟ فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا",
        "en": "As for those who struggle in Our cause, We will surely guide them along Our Way.",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:29:69"
        ]
    },
    {
        "id": "h-muslim-746",
        "kind": "HADITH",
        "contexts": [
            "fallback"
        ],
        "ref": {
            "collection": "muslim",
            "number": "746"
        },
        "refLabel": {
            "ar": "رواه مسلم (746)",
            "en": "Sahih Muslim 746"
        },
        "ar": "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم إِذَا عَمِلَ عَمَلاً أَثْبَتَهُ وَكَانَ إِذَا نَامَ مِنَ اللَّيْلِ أَوْ مَرِضَ صَلَّى مِنَ النَّهَارِ ثِنْتَىْ عَشْرَةَ رَكْعَةً",
        "en": "when the Messenger of Allah (ﷺ) decided upon doing any act, he continued to do it, and when he slept at night or fell sick he observed twelve rak'ahs during the daytime",
        "partial": true,
        "translation": "Abdul Hamid Siddiqui",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "muslim:746.06"
        ]
    },
    {
        "id": "q-taha-1-2",
        "kind": "AYAH",
        "contexts": [
            "rest"
        ],
        "ref": {
            "surah": 20,
            "verses": [
                1,
                2
            ]
        },
        "refLabel": {
            "ar": "طه · 1–2",
            "en": "Ta-Ha 20:1–2"
        },
        "ar": "طه ۝ مَآ أَنزَلْنَا عَلَيْكَ ٱلْقُرْءَانَ لِتَشْقَىٰٓ",
        "en": "Ṭâ-Hâ. We have not revealed the Quran to you ˹O Prophet˺ to cause you distress,",
        "partial": false,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:20:1",
            "quran:20:2"
        ]
    },
    {
        "id": "h-bukhari-1975",
        "kind": "HADITH",
        "contexts": [
            "rest"
        ],
        "ref": {
            "collection": "bukhari",
            "number": "1975"
        },
        "refLabel": {
            "ar": "رواه البخاري (1975)",
            "en": "Sahih al-Bukhari 1975"
        },
        "ar": "وَقُمْ وَنَمْ، فَإِنَّ لِجَسَدِكَ عَلَيْكَ حَقًّا",
        "en": "offer prayers and also sleep at night, as your body has a right on you",
        "partial": true,
        "translation": "Muhammad Muhsin Khan",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "bukhari:1975"
        ]
    },
    {
        "id": "q-taghabun-16",
        "kind": "AYAH",
        "contexts": [
            "lighten"
        ],
        "ref": {
            "surah": 64,
            "verses": [
                16
            ]
        },
        "refLabel": {
            "ar": "التغابن · 16",
            "en": "at-Taghabun 64:16"
        },
        "ar": "فَٱتَّقُوا۟ ٱللَّهَ مَا ٱسْتَطَعْتُمْ",
        "en": "So be mindful of Allah to the best of your ability",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:64:16"
        ]
    },
    {
        "id": "h-bukhari-43",
        "kind": "HADITH",
        "contexts": [
            "lighten"
        ],
        "ref": {
            "collection": "bukhari",
            "number": "43"
        },
        "refLabel": {
            "ar": "رواه البخاري (43)",
            "en": "Sahih al-Bukhari 43"
        },
        "ar": "عَلَيْكُمْ بِمَا تُطِيقُونَ، فَوَاللَّهِ لاَ يَمَلُّ اللَّهُ حَتَّى تَمَلُّوا",
        "en": "Do (good) deeds which is within your capacity (without being overtaxed) as Allah does not get tired (of giving rewards) but (surely) you will get tired",
        "partial": true,
        "translation": "Muhammad Muhsin Khan",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "bukhari:43"
        ]
    },
    {
        "id": "q-baqarah-185",
        "kind": "AYAH",
        "contexts": [
            "excuse"
        ],
        "ref": {
            "surah": 2,
            "verses": [
                185
            ]
        },
        "refLabel": {
            "ar": "البقرة · 185",
            "en": "al-Baqarah 2:185"
        },
        "ar": "يُرِيدُ ٱللَّهُ بِكُمُ ٱلْيُسْرَ وَلَا يُرِيدُ بِكُمُ ٱلْعُسْرَ",
        "en": "Allah intends ease for you, not hardship",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:2:185"
        ]
    },
    {
        "id": "q-kahf-30",
        "kind": "AYAH",
        "contexts": [
            "returning"
        ],
        "ref": {
            "surah": 18,
            "verses": [
                30
            ]
        },
        "refLabel": {
            "ar": "الكهف · 30",
            "en": "al-Kahf 18:30"
        },
        "ar": "إِنَّا لَا نُضِيعُ أَجْرَ مَنْ أَحْسَنَ عَمَلًا",
        "en": "We certainly never deny the reward of those who are best in deeds.",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:18:30"
        ]
    },
    {
        "id": "h-bukhari-6491",
        "kind": "HADITH",
        "contexts": [
            "returning"
        ],
        "ref": {
            "collection": "bukhari",
            "number": "6491"
        },
        "refLabel": {
            "ar": "رواه البخاري (6491)",
            "en": "Sahih al-Bukhari 6491"
        },
        "ar": "فَمَنْ هَمَّ بِحَسَنَةٍ فَلَمْ يَعْمَلْهَا كَتَبَهَا اللَّهُ لَهُ عِنْدَهُ حَسَنَةً كَامِلَةً",
        "en": "If somebody intends to do a good deed and he does not do it, then Allah will write for him a full good deed (in his account with Him)",
        "partial": true,
        "translation": "Muhammad Muhsin Khan",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "note": "About an intention not acted on at all: the wording beside it must say \"your intention is written\", never that a missed portion counts as done.",
        "reviewed": false,
        "sourceKeys": [
            "bukhari:6491"
        ]
    },
    {
        "id": "h-ibnmajah-3803",
        "kind": "HADITH",
        "contexts": [
            "portionDone"
        ],
        "ref": {
            "collection": "ibnmajah",
            "number": "3803"
        },
        "refLabel": {
            "ar": "رواه ابن ماجه (3803)",
            "en": "Sunan Ibn Majah 3803"
        },
        "ar": "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ",
        "en": "Praise is to Allah by Whose grace good deeds are completed",
        "partial": true,
        "translation": "Darussalam (Nasiruddin al-Khattab)",
        "grading": [
            "Al-Albani: Hasan",
            "Muhammad Fouad Abd al-Baqi: Hasan",
            "Shuaib Al Arnaut: Hasan Lighairihi",
            "Zubair Ali Zai: Daif"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "ibnmajah:3803"
        ]
    },
    {
        "id": "q-ibrahim-7",
        "kind": "AYAH",
        "contexts": [
            "weekDone"
        ],
        "ref": {
            "surah": 14,
            "verses": [
                7
            ]
        },
        "refLabel": {
            "ar": "إبراهيم · 7",
            "en": "Ibrahim 14:7"
        },
        "ar": "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
        "en": "If you are grateful, I will certainly give you more.",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:14:7"
        ]
    },
    {
        "id": "q-isra-106",
        "kind": "AYAH",
        "contexts": [
            "gradual"
        ],
        "ref": {
            "surah": 17,
            "verses": [
                106
            ]
        },
        "refLabel": {
            "ar": "الإسراء · 106",
            "en": "al-Isra 17:106"
        },
        "ar": "وَقُرْءَانًا فَرَقْنَـٰهُ لِتَقْرَأَهُۥ عَلَى ٱلنَّاسِ عَلَىٰ مُكْثٍ وَنَزَّلْنَـٰهُ تَنزِيلًا",
        "en": "˹It is˺ a Quran We have revealed in stages so that you may recite it to people at a deliberate pace. And We have sent it down in successive revelations.",
        "partial": false,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:17:106"
        ]
    },
    {
        "id": "h-bukhari-4993",
        "kind": "HADITH",
        "contexts": [
            "gradual"
        ],
        "ref": {
            "collection": "bukhari",
            "number": "4993"
        },
        "refLabel": {
            "ar": "رواه البخاري (4993)",
            "en": "Sahih al-Bukhari 4993"
        },
        "ar": "إِنَّمَا نَزَلَ أَوَّلَ مَا نَزَلَ مِنْهُ سُورَةٌ مِنَ الْمُفَصَّلِ فِيهَا ذِكْرُ الْجَنَّةِ وَالنَّارِ حَتَّى إِذَا ثَابَ النَّاسُ إِلَى الإِسْلاَمِ نَزَلَ الْحَلاَلُ وَالْحَرَامُ",
        "en": "the first thing that was revealed thereof was a Sura from Al-Mufassal, and in it was mentioned Paradise and the Fire. When the people embraced Islam, the Verses regarding legal and illegal things were revealed.",
        "partial": true,
        "translation": "Muhammad Muhsin Khan",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "bukhari:4993"
        ]
    },
    {
        "id": "q-hashr-18",
        "kind": "AYAH",
        "contexts": [
            "review"
        ],
        "ref": {
            "surah": 59,
            "verses": [
                18
            ]
        },
        "refLabel": {
            "ar": "الحشر · 18",
            "en": "al-Hashr 59:18"
        },
        "ar": "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱتَّقُوا۟ ٱللَّهَ وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ",
        "en": "O believers! Be mindful of Allah and let every soul look to what ˹deeds˺ it has sent forth for tomorrow.",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:59:18"
        ]
    },
    {
        "id": "h-bukhari-39-b",
        "kind": "HADITH",
        "contexts": [
            "review"
        ],
        "ref": {
            "collection": "bukhari",
            "number": "39"
        },
        "refLabel": {
            "ar": "رواه البخاري (39)",
            "en": "Sahih al-Bukhari 39"
        },
        "ar": "فَسَدِّدُوا وَقَارِبُوا وَأَبْشِرُوا",
        "en": "So you should not be extremists, but try to be near to perfection and receive the good tidings that you will be rewarded",
        "partial": true,
        "translation": "Muhammad Muhsin Khan",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "bukhari:39"
        ]
    },
    {
        "id": "q-sharh-7-8",
        "kind": "AYAH",
        "contexts": [
            "completion"
        ],
        "ref": {
            "surah": 94,
            "verses": [
                7,
                8
            ]
        },
        "refLabel": {
            "ar": "الشرح · 7–8",
            "en": "ash-Sharh 94:7–8"
        },
        "ar": "فَإِذَا فَرَغْتَ فَٱنصَبْ ۝ وَإِلَىٰ رَبِّكَ فَٱرْغَب",
        "en": "So once you have fulfilled ˹your duty˺, strive ˹in devotion˺, turning to your Lord ˹alone˺ with hope.",
        "partial": false,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:94:7",
            "quran:94:8"
        ]
    },
    {
        "id": "h-tirmidhi-3599",
        "kind": "HADITH",
        "contexts": [
            "completion"
        ],
        "ref": {
            "collection": "tirmidhi",
            "number": "3599"
        },
        "refLabel": {
            "ar": "رواه الترمذي (3599)",
            "en": "Jami' at-Tirmidhi 3599"
        },
        "ar": "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنْفَعُنِي وَزِدْنِي عِلْمًا",
        "en": "O Allah, benefit me with that which You have taught me, and teach me that which will benefit me, and increase me in knowledge.",
        "partial": true,
        "translation": "Darussalam (Abu Khaliyl)",
        "grading": [
            "Ahmad Muhammad Shakir: Sahih",
            "Al-Albani: Sahih",
            "Zubair Ali Zai: Daif"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "tirmidhi:3599"
        ]
    },
    {
        "id": "q-mujadilah-11",
        "kind": "AYAH",
        "contexts": [
            "milestones"
        ],
        "ref": {
            "surah": 58,
            "verses": [
                11
            ]
        },
        "refLabel": {
            "ar": "المجادلة · 11",
            "en": "al-Mujadilah 58:11"
        },
        "ar": "يَرْفَعِ ٱللَّهُ ٱلَّذِينَ ءَامَنُوا۟ مِنكُمْ وَٱلَّذِينَ أُوتُوا۟ ٱلْعِلْمَ دَرَجَـٰتٍ",
        "en": "Allah will elevate those of you who are faithful, and ˹raise˺ those gifted with knowledge in rank.",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:58:11"
        ]
    },
    {
        "id": "h-muslim-2699",
        "kind": "HADITH",
        "contexts": [
            "milestones"
        ],
        "ref": {
            "collection": "muslim",
            "number": "2699"
        },
        "refLabel": {
            "ar": "رواه مسلم (2699)",
            "en": "Sahih Muslim 2699"
        },
        "ar": "وَمَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
        "en": "he who treads the path in search of knowledge, Allah would make that path easy, leading to Paradise for him",
        "partial": true,
        "translation": "Abdul Hamid Siddiqui",
        "grading": [
            "in the Sahih"
        ],
        "show": "reader",
        "reviewed": false,
        "sourceKeys": [
            "muslim:2699.01"
        ]
    },
    {
        "id": "q-yunus-58",
        "kind": "AYAH",
        "contexts": [
            "milestoneReached"
        ],
        "ref": {
            "surah": 10,
            "verses": [
                58
            ]
        },
        "refLabel": {
            "ar": "يونس · 58",
            "en": "Yunus 10:58"
        },
        "ar": "بِفَضْلِ ٱللَّهِ وَبِرَحْمَتِهِۦ فَبِذَٰلِكَ فَلْيَفْرَحُوا۟",
        "en": "In Allah’s grace and mercy let them rejoice.",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:10:58"
        ]
    },
    {
        "id": "q-taha-114",
        "kind": "AYAH",
        "contexts": [
            "dailyVerse"
        ],
        "ref": {
            "surah": 20,
            "verses": [
                114
            ]
        },
        "refLabel": {
            "ar": "طه · 114",
            "en": "Ta-Ha 20:114"
        },
        "ar": "وَقُل رَّبِّ زِدْنِى عِلْمًا",
        "en": "and pray, “My Lord! Increase me in knowledge.”",
        "partial": true,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:20:114"
        ]
    },
    {
        "id": "q-alaq-4",
        "kind": "AYAH",
        "contexts": [
            "benefits"
        ],
        "ref": {
            "surah": 96,
            "verses": [
                4
            ]
        },
        "refLabel": {
            "ar": "العلق · 4",
            "en": "al-'Alaq 96:4"
        },
        "ar": "ٱلَّذِى عَلَّمَ بِٱلْقَلَمِ",
        "en": "Who taught by the pen—",
        "partial": false,
        "translation": "Dr. Mustafa Khattab, The Clear Quran",
        "reviewed": false,
        "show": "reader",
        "sourceKeys": [
            "quran:96:4"
        ]
    },
    {
        "id": "h-bukhari-69",
        "kind": "HADITH",
        "contexts": [
            "principle"
        ],
        "ref": {
            "collection": "bukhari",
            "number": "69"
        },
        "refLabel": {
            "ar": "رواه البخاري (69)",
            "en": "Sahih al-Bukhari 69"
        },
        "ar": "يَسِّرُوا وَلاَ تُعَسِّرُوا، وَبَشِّرُوا وَلاَ تُنَفِّرُوا",
        "en": "Facilitate things to people (concerning religious matters), and do not make it hard for them and give them good tidings and do not make them run away (from Islam)",
        "partial": true,
        "translation": "Muhammad Muhsin Khan",
        "grading": [
            "in the Sahih"
        ],
        "show": "internal",
        "reviewed": false,
        "sourceKeys": [
            "bukhari:69"
        ]
    },
    {
        "id": "h-abudawud-4833",
        "kind": "HADITH",
        "contexts": [
            "companion"
        ],
        "ref": {
            "collection": "abudawud",
            "number": "4833"
        },
        "refLabel": {
            "ar": "رواه أبو داود (4833)",
            "en": "Sunan Abi Dawud 4833"
        },
        "ar": "الرَّجُلُ عَلَى دِينِ خَلِيلِهِ فَلْيَنْظُرْ أَحَدُكُمْ مَنْ يُخَالِلُ",
        "en": "A man follows the religion of his friend; so each one should consider whom he makes his friend",
        "partial": true,
        "translation": "Ahmad Hasan",
        "grading": [
            "Al-Albani: Hasan",
            "Muhammad Muhyi Al-Din Abdul Hamid: Hasan",
            "Shuaib Al Arnaut: Hasan",
            "Zubair Ali Zai: Isnaad Hasan"
        ],
        "show": "internal",
        "note": "For the study companion (out of scope for now).",
        "reviewed": false,
        "sourceKeys": [
            "abudawud:4833"
        ]
    }
];


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
