/**
 * Arabic copy for the whole app. See `./index.js` for why this is a plain object and what is
 * deliberately not in it.
 *
 * ## How to add a string
 *
 * Put it in the namespace of the screen that shows it; put it in `common` only once a *second*
 * screen needs the same words for the same reason. "Same words" is not enough on its own — the
 * tab label «كتب» and the page heading «المكتبة» are both about books and must stay separate,
 * because a translation of one is not a translation of the other.
 *
 * `{name}` marks an interpolation slot; `t('common.views', { count })` fills it. Prefer a slot
 * over concatenating at the call site — a sentence assembled from fragments cannot be reordered
 * by a translator, and Arabic and English do not order these the same way.
 */
export const ar = {

    /** Words that genuinely mean the same thing everywhere they appear. */
    common: {
        loading: 'جاري التحميل...',
        loadMore: 'تحميل المزيد',
        save: 'حفظ',
        saving: 'جاري الحفظ...',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        close: 'إغلاق',
        sending: 'جاري الإرسال...',
        search: 'بحث',
        backHome: 'العودة للرئيسية',
        back: 'رجوع',
        errorTitle: 'حدث خطأ',
        retry: 'إعادة المحاولة',
        noResults: 'لا توجد نتائج',
        noContent: 'لا يوجد محتوى',
        noData: 'لا توجد بيانات',
        comingSoon: 'سيتم إضافة المحتوى قريباً',
        tryAnotherSearch: 'جرّب كلمة بحث أو تصنيفاً آخر',
        irreversible: 'لا يمكن التراجع عن هذا الإجراء.',
        // Joins items in a run-on list. Arabic uses ، rather than , — punctuation is locale
        // data too, and hardcoding a comma at a call site is the same bug as hardcoding a word.
        listSeparator: '، ',

        // Content-type words in their bare form — tab labels, stat labels, filter chips.
        videos: 'فيديوهات',
        books: 'كتب',
        articles: 'مقالات',
        posts: 'منشورات',
        series: 'سلاسل',
        all: 'الكل',

        // Owner-facing visibility controls, shared by VideoCard and the channel dashboard.
        hidden: 'مخفي',
        hiddenFromVisitors: 'مخفي عن الزوار',
        hideFromVisitors: 'إخفاء عن الزوار',
        showToVisitors: 'إظهار للزوار',

        // Counts. Each keeps its number in a slot rather than being concatenated at the call
        // site, so the number can move to the other side of the word in another language.
        views: '{count} مشاهدات',
        commentCount: '{count} تعليقات',
        pageCount: '{count} صفحة',
        videoCount: '{count} فيديو',
        wordCount: '{count} كلمة',
        readingMinutes: '{count} دقائق',
        readingMinutesLong: '{count} دقائق قراءة',
        originalPublishDate: 'تاريخ النشر الأصلي: {date}',

        allCategories: 'كل التصنيفات',
        sortBy: 'ترتيب حسب: {label}',
        sortNewest: 'الأحدث',
        sortTitle: 'العنوان',
    },

    /** Form field labels and placeholders reused across create/edit forms. */
    fields: {
        title: 'العنوان',
        description: 'الوصف',
        category: 'التصنيف',
        content: 'المحتوى',
        primaryColor: 'اللون الرئيسي',
        originalPublishDateOptional: 'تاريخ النشر الأصلي (اختياري)',
        username: 'اسم المستخدم',
        usernameRequired: 'اسم المستخدم *',
        fullName: 'الاسم الكامل',
        fullNamePlaceholder: 'محمد أحمد',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        passwordRequired: 'كلمة المرور *',
        confirmPassword: 'تأكيد كلمة المرور *',
        showPassword: 'إظهار كلمة المرور',
        hidePassword: 'إخفاء كلمة المرور',
    },

    meta: {
        defaultTitle: 'أَبْصَرْنا | Absarna',
        defaultDescription: 'أَبْصَرْنا — منصة إسلامية للفيديوهات والكتب والمقالات',
        // The suffix appended to every page's own title. Kept next to the default so the two
        // cannot drift apart.
        titleSuffix: '{title} | أَبْصَرْنا',
    },

    nav: {
        brand: 'أَبْصَرْنا',
        brandAlt: 'أبصرنا',
        menu: 'القائمة',
        sideMenu: 'القائمة الجانبية',
        skipToContent: 'تخطي إلى المحتوى',
        lightMode: 'الوضع الفاتح',
        darkMode: 'الوضع الداكن',
        lightShort: 'فاتح',
        darkShort: 'داكن',
        upload: 'رفع محتوى',
        uploadShort: 'رفع',
        profile: 'الملف الشخصي',
        profileShort: 'حسابي',
        adminPanel: 'لوحة التحكم',
        adminShort: 'الإدارة',
        logout: 'تسجيل الخروج',
        logoutShort: 'خروج',
        login: 'دخول',
        register: 'إنشاء حساب',
    },

    sidebar: {
        manageChannel: 'إدارة القناة',
        home: 'الرئيسية',
        subscriptions: 'الاشتراكات',
        watchHistory: 'سجل المشاهدة',
        bookmarks: 'المحفوظات',
        createChannel: 'إنشاء قناة',
        myChannels: 'قنواتي',
        yourSubscriptions: 'اشتراكاتك',
        discoverChannels: 'اكتشف قنوات أخرى',
        noOtherChannels: 'لا توجد قنوات أخرى',
    },

    searchBar: {
        placeholder: 'ابحث...',
        label: 'بحث',
        noMatches: 'لا توجد نتائج مطابقة لـ "{query}"',
    },

    errorBoundary: {
        title: 'عذراً، حدث خطأ غير متوقع',
        fallback: 'يرجى المحاولة مرة أخرى',
        reload: 'إعادة التحميل',
    },

    // One sentence per kind of failure — see lib/describeError.js. Offline and rate-limited say
    // what to do next; the rest are the generic wording a caller falls back to when it has
    // nothing more specific of its own.
    errors: {
        generic: 'حدث خطأ، يرجى المحاولة مرة أخرى',
        offline: 'لا يوجد اتصال بالإنترنت، تحقق من الشبكة ثم أعد المحاولة',
        timeout: 'استغرق الطلب وقتاً أطول من المتوقع، أعد المحاولة',
        rateLimited: 'طلبات كثيرة في وقت قصير، يرجى المحاولة لاحقاً',
        notFound: 'المحتوى غير موجود أو لم يعد متاحاً',
        forbidden: 'ليس لديك صلاحية لهذا الإجراء',
        server: 'حدث خلل في الخادم، يرجى المحاولة لاحقاً',

        /**
         * Why an action was refused, keyed by the backend's `reason` code.
         *
         * <p>These exist because a refusal with a business reason behind it used to arrive as
         * «ليس لديك صلاحية لهذا الإجراء» — which, for the case that prompted this, was true of
         * nothing: the caller was the channel's owner, was authorised, and the channel had simply
         * not been reviewed yet. The status alone can never say that.
         *
         * <p><b>Every sentence here names the reason and then what to do about it</b>, in that
         * order. A refusal a user can do nothing about is worth wording differently from one that
         * clears itself, and «حاول لاحقاً» on the first kind is how people learn to ignore it.
         *
         * <p>The backend sends codes, never Arabic — it names the situation, this file words it,
         * so all copy stays in one place and a code with no entry here falls back to the generic
         * sentence for its status rather than showing English. Adding a code on that side without
         * adding it here is therefore safe, and silent: grep the backend for
         * `ActionNotAllowedException(` and the two-argument `InvalidRequestException(` to find the
         * full set.
         */
        reasons: {
            // Channel review. PENDING is deliberately absent — a channel awaiting review may now
            // import, precisely so it can be reviewed on its content.
            CHANNEL_REJECTED: 'تم رفض هذه القناة من قبل إدارة المنصة، ولا يمكن الاستيراد إليها. راسل الإدارة إن كنت ترى أن هذا خطأ.',
            CHANNEL_SUSPENDED: 'هذه القناة موقوفة مؤقتاً، ولا يمكن الاستيراد إليها حتى يُرفع الإيقاف.',

            // YouTube ownership. The two are separated because the remedy is completely different:
            // the first is something the owner does, the second is something only they can do and
            // an admin cannot do for them.
            YOUTUBE_NOT_VERIFIED: 'لم يتم إثبات ملكيتك لقناة اليوتيوب بعد. ضع رمز التحقق في وصف قناتك ثم اضغط "تحقق".',
            YOUTUBE_NEEDS_OWNER_VERIFICATION: 'تم ربط هذه القناة بواسطة إدارة المنصة، وهذا يكفي للاستيراد فقط. رفع الملف الأصلي يتطلب أن يثبت صاحب القناة ملكيتها بنفسه عبر رمز التحقق.',

            YOUTUBE_IMPORT_ALREADY_RUN: 'تم استيراد هذه القناة بالفعل، أو هناك استيراد جارٍ الآن.',
            // A 503, and the one case where "try again later" is actively wrong: nothing will
            // change until someone configures the deployment.
            YOUTUBE_NOT_CONFIGURED: 'الاستيراد من يوتيوب غير مفعَّل على هذه المنصة حالياً. راسل الإدارة.',
        },
    },

    auth: {
        login: {
            heading: 'تسجيل الدخول',
            welcomeBack: 'مرحباً بعودتك!',
            forgotPassword: 'نسيت كلمة المرور؟',
            submitting: 'جاري الدخول...',
            submit: 'دخول',
            noAccount: 'ليس لديك حساب؟',
            registerLink: 'إنشاء حساب',
            failed: 'تعذر تسجيل الدخول',
            invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        },
        register: {
            heading: 'إنشاء حساب',
            joinUs: 'انضم إلى أَبْصَرْنا',
            submitting: 'جاري التسجيل...',
            submit: 'إنشاء الحساب',
            haveAccount: 'لديك حساب بالفعل؟',
            loginLink: 'تسجيل الدخول',
            created: 'تم إنشاء الحساب! أرسلنا رابط توثيق إلى بريدك الإلكتروني.',
            failed: 'تعذر إنشاء الحساب',
            taken: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل',
        },
        // Shown when a session ends while the visitor is on a public page; a protected page
        // sends them to the login form instead.
        sessionExpired: 'انتهت الجلسة، سجّل الدخول مرة أخرى للمتابعة',
        forgotPassword: {
            title: 'نسيت كلمة المرور',
            heading: 'نسيت كلمة المرور؟',
            instructions: 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.',
            sentHeading: 'تحقق من بريدك الإلكتروني',
            // Deliberately says nothing about whether the address exists — the backend answers
            // identically either way so an address cannot be probed for.
            sentBody: 'إذا كان البريد الإلكتروني مسجلاً لدينا، فسيتم إرسال رابط إعادة تعيين كلمة المرور إليه.',
            backToLogin: 'العودة لتسجيل الدخول',
            submit: 'إرسال رابط إعادة التعيين',
            rememberedIt: 'تذكرت كلمة المرور؟',
            loginLink: 'تسجيل الدخول',
            genericError: 'حدث خطأ ما، يرجى المحاولة لاحقاً',
        },
        resetPassword: {
            title: 'إعادة تعيين كلمة المرور',
            heading: 'إعادة تعيين كلمة المرور',
            instructions: 'أدخل كلمة المرور الجديدة',
            newPassword: 'كلمة المرور الجديدة *',
            doneHeading: 'تم إعادة تعيين كلمة المرور',
            doneBody: 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
            loginLink: 'تسجيل الدخول',
            failedHeading: 'تعذرت إعادة التعيين',
            requestNewLink: 'طلب رابط جديد',
            invalidLink: 'رابط إعادة التعيين غير صالح',
            expiredLink: 'انتهت صلاحية الرابط أو أنه غير صالح',
            submit: 'إعادة تعيين كلمة المرور',
        },
        verifyEmail: {
            title: 'توثيق البريد الإلكتروني',
            verifying: 'جاري توثيق بريدك الإلكتروني...',
            successHeading: 'تم توثيق بريدك الإلكتروني بنجاح',
            successBody: 'يمكنك الآن التعليق وإنشاء قناة.',
            failedHeading: 'تعذر التوثيق',
            invalidLink: 'رابط التوثيق غير صالح',
            expiredLink: 'انتهت صلاحية رابط التوثيق أو أنه غير صالح',
            loginLink: 'تسجيل الدخول',
        },
        verificationNotice: {
            defaultMessage: 'يجب توثيق بريدك الإلكتروني للقيام بهذا الإجراء',
            beforeComment: 'يجب توثيق بريدك الإلكتروني قبل إضافة تعليق',
            beforeChannel: 'يجب توثيق بريدك الإلكتروني قبل إنشاء قناة',
            sent: 'تم إرسال رابط التوثيق، تحقق من بريدك',
            resend: 'إعادة إرسال رابط التوثيق',
            failed: 'تعذر إرسال الرابط، حاول لاحقاً',
        },
        passwordMismatch: 'كلمتا المرور غير متطابقتين',
        passwordTooWeak: 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل مع حرف كبير وحرف صغير ورقم ورمز خاص',
    },

    /**
     * `lib/validation.js`. These mirror the backend's own rules, and the numbers are interpolated
     * from the same constants the checks use — a limit and the sentence describing it must not be
     * able to disagree.
     */
    validation: {
        usernameRequired: 'اسم المستخدم مطلوب',
        usernameTooShort: 'اسم المستخدم يجب أن يكون {min} أحرف على الأقل',
        usernameCharacters: 'اسم المستخدم يمكن أن يحتوي فقط على حروف إنجليزية وأرقام و_',
        // Mirror the backend's @Size limits (RegisterRequest) so the first feedback is not the
        // server's English validation message.
        usernameTooLong: 'اسم المستخدم يجب ألا يتجاوز {max} حرفاً',
        fullNameTooLong: 'الاسم يجب ألا يتجاوز {max} حرفاً',
        emailTooLong: 'البريد الإلكتروني يجب ألا يتجاوز {max} حرفاً',
        ruleLength: '{min} أحرف على الأقل',
        ruleUppercase: 'حرف كبير (A-Z)',
        ruleLowercase: 'حرف صغير (a-z)',
        ruleDigit: 'رقم واحد على الأقل',
        ruleSpecial: 'رمز خاص (!@#$...)',
        ruleMaxBytes: '{max} حرف كحد أقصى',
        strengthVeryStrong: 'قوية جداً',
        strengthStrong: 'قوية',
        strengthMedium: 'متوسطة',
        strengthWeak: 'ضعيفة',
    },

    home: {
        // The curated landing view, versus browsing the whole catalogue. Two named modes rather
        // than one "الكل" chip meaning both — see Home.jsx.
        forYou: 'المقترح لك',
        browseAll: 'كل الفيديوهات',
        // The feed's tail — where the curated sections stop and the catalogue begins.
        more: 'المزيد من الفيديوهات',
        subscribed: 'من القنوات التي تتابعها',
        discover: 'اقتراحات لك',
        featured: 'استكشف',
        loadFailed: 'فشل في تحميل المحتوى',
        empty: 'لا يوجد محتوى بعد',
        deleteVideoTitle: 'حذف الفيديو',
        deleteVideoConfirm: 'هل تريد حذف "{title}"؟ لا يمكن التراجع عن هذا الإجراء.',
        visibilityFailed: 'فشل في تحديث الظهور',
        deleteFailed: 'فشل في الحذف',
    },

    video: {
        watchAria: 'مشاهدة فيديو: {title}',
        // Shown only to the channel's owner, on a video whose transcode has not finished. See
        // VideoCard — nobody else can see such a video at all.
        processing: 'جاري المعالجة',
        // A video whose file lives on a third-party host (sourceType TELEGRAM). The SPA's own
        // Content-Security-Policy allows media only from our storage, so it cannot be played
        // in place; the link is the honest offer. See VideoPlayer.
        externalSourceNotice: 'هذا الفيديو مستضاف على منصة خارجية ولا يمكن تشغيله هنا.',
        openExternalSource: 'فتح الفيديو في المصدر الخارجي',
        deleteAria: 'حذف الفيديو',
        goToChannelAria: 'الذهاب إلى قناة {name}',
        loadFailed: 'فشل في تحميل الفيديو',
        unsupported: 'متصفحك لا يدعم تشغيل الفيديو',
        invalidUrl: 'رابط الفيديو غير صالح',
        watchOnYouTube: 'شاهد على يوتيوب',
        watchVideo: 'شاهد الفيديو',
        quality: 'الجودة',
        /**
         * The player's own settings menu — the gear drawn on top of the video.
         *
         * <p>It exists there rather than under the player because a browser renders only the
         * fullscreen element's subtree: the old quality `<select>` was a sibling of the `<video>`
         * and so did not exist in fullscreen, which is exactly where a viewer reaches for it.
         */
        /**
         * The player's own control bar. It exists because the browser's does not let a settings
         * button in — its controls are a closed shadow root — and because its fullscreen button
         * targets the `<video>`, where nothing of ours can be rendered. Every label here is a
         * button with only an icon, so these are `aria-label`s rather than visible copy.
         */
        controls: {
            // The focusable player itself, so a keyboard viewer who tabs onto it is told what
            // they have landed on — the shortcuts below live there.
            player: 'مشغل الفيديو',
            play: 'تشغيل',
            pause: 'إيقاف مؤقت',
            seek: 'موضع التشغيل',
            // The timeline's spoken value: a screen reader reading "1263" for a position is
            // useless, so it hears the two clock readings a viewer would say out loud.
            timeOf: '{current} من {total}',
            mute: 'كتم الصوت',
            unmute: 'إلغاء كتم الصوت',
            volume: 'مستوى الصوت',
            // Shown only while Safari reports a receiver on the network. It is the one thing the
            // browser's own bar gave for free that ours has to earn back, and it matters here: a
            // lecture is exactly what someone sends to a television.
            airplay: 'البث إلى شاشة أخرى',
            // Announced while the player is stalled waiting for data, which on the hls.js path is
            // most of the first press of play.
            buffering: 'جارٍ التحميل',
            enterFullscreen: 'ملء الشاشة',
            exitFullscreen: 'إنهاء ملء الشاشة',
        },

        settings: {
            label: 'إعدادات المشغل',
            speed: 'سرعة التشغيل',
            // 1x, which is the absence of a choice rather than a measurement — every other speed
            // is a Latin-digit number like the rest of the app's figures (lib/numbers.js).
            normalSpeed: 'عادية',
            // Repeat. Offered because the catalogue is memorisation material as much as it is
            // lectures: a passage learned by heart is watched over and over.
            loop: 'تكرار مستمر',
            // Only offered where the browser exposes it to the page (Chrome, Edge, Safari on the
            // Mac); Firefox has its own picture-in-picture with no page-facing API.
            pictureInPicture: 'صورة داخل صورة',
        },
        /**
         * The quality selector's option labels. Anything not listed falls through to the rung's
         * own name, which is what "1080p" and friends want — they are not words. `audio` is,
         * hence this map: the worker's rung name is an identifier, not copy.
         */
        qualityLabels: {
            // 'auto' and 'audio' are the two options in the selector that are copy rather than a
            // measurement. Every other entry ("1080p", "720p") comes from the manifest and is
            // shown as-is — translating a resolution would be wrong, and tOptional falling
            // through to the raw name is what keeps a rung the worker adds later from rendering
            // as a missing-key warning.
            auto: 'تلقائي',
            audio: 'صوت فقط',
        },
        seriesPart: 'الجزء {index} من {total}',
        next: 'التالي',
        previous: 'السابق',
        related: 'قد يعجبك أيضاً',
    },

    books: {
        title: 'المكتبة',
        metaDescription: 'مكتبة الكتب الإسلامية على أَبْصَرْنا',
        searchPlaceholder: 'ابحث عن كتاب...',
        empty: 'لا توجد كتب',
        emptyDescription: 'سيتم إضافة الكتب قريباً',
        read: 'قراءة',
        download: 'تحميل',
        notFound: 'الكتاب غير موجود',
        backToLibrary: 'العودة للمكتبة',
        tapToRead: 'اضغط للقراءة',
        stoppedAtPage: 'توقفت عند صفحة {page}',
        hideReader: 'إخفاء القراءة',
        continueReading: 'متابعة القراءة',
        readOnline: 'قراءة أونلاين',
        downloadPdf: 'تحميل PDF',
        emptyOnChannel: 'لا توجد كتب بعد',
        loadFailed: 'تعذر تحميل الكتب',
        // The read-url answered, but with nothing the browser may open (no file, or a stored link
        // that failed the scheme allowlist). Distinct from a network failure, which retries.
        noFile: 'لا يوجد ملف متاح لهذا الكتاب',
    },

    pdfReader: {
        loadFailed: 'تعذر تحميل الملف —',
        openInNewTab: 'افتح الملف في تبويب جديد',
        contents: 'المحتويات',
        search: 'بحث',
        noContents: 'لا توجد قائمة محتويات لهذا الملف',
        searchPlaceholder: 'ابحث داخل الملف...',
        searching: 'جاري البحث في الملف...',
        resultPage: 'صفحة {page}',
        nextPage: 'الصفحة التالية',
        previousPage: 'الصفحة السابقة',
        page: 'صفحة',
        goToPage: 'الانتقال إلى صفحة',
        ofPages: 'من {total}',
    },

    articles: {
        title: 'المقالات',
        metaDescription: 'مقالات إسلامية على أَبْصَرْنا',
        searchPlaceholder: 'ابحث عن مقال...',
        empty: 'لا توجد مقالات',
        loadFailed: 'فشل في تحميل المقال',
        backToArticles: 'العودة للمقالات',
        emptyOnChannel: 'لا توجد مقالات بعد',
    },

    series: {
        badge: 'سلسلة',
        // Shown on a card to say which series a video belongs to.
        partOf: 'من سلسلة: {title}',
        notFound: 'السلسلة غير موجودة',
        backToChannel: 'العودة إلى قناة {name}',
        empty: 'لا توجد فيديوهات في هذه السلسلة بعد',
        emptyOnChannel: 'لا توجد سلاسل بعد',
    },

    channel: {
        notFound: 'القناة غير موجودة',
        loadFailed: 'تعذر تحميل القناة',
        subscriberCount: '{count} مشترك',
        manage: 'إدارة القناة',
        subscribed: 'مشترك',
        subscribe: 'اشترك',
        // Shown on hover/focus of the subscribed state. NOT the accessible name — see
        // SubscribeButton: a toggle's name has to stay constant while `aria-pressed` carries
        // the state, or a screen reader announces the two contradicting each other.
        unsubscribe: 'إلغاء الاشتراك',
        subscribeToggleAria: 'الاشتراك في القناة',
        noVideos: 'لا توجد فيديوهات بعد',
        noPosts: 'لا توجد منشورات بعد',
    },

    /**
     * The one-time YouTube import. Copy here has to carry an unusual amount of instruction — the
     * owner leaves the app, edits something on another site, and comes back — so these are
     * sentences rather than labels.
     */
    youtube: {
        heading: 'استيراد من يوتيوب',
        intro: 'استورد فيديوهاتك وقوائم التشغيل من قناتك على يوتيوب مرة واحدة.',
        sourceLabel: 'رابط قناتك على يوتيوب',
        sourcePlaceholder: 'https://youtube.com/@yourchannel',
        // Says all three forms because the canonical UC… id appears nowhere in YouTube's own
        // interface, and a user who only knows the handle would otherwise assume they can't.
        sourceHint: 'يمكنك لصق رابط القناة أو المعرف (@handle) أو معرف القناة',
        link: 'ربط القناة',
        linking: 'جاري الربط...',
        foundChannel: 'وجدنا القناة: {title}',

        verifyHeading: 'أثبت ملكيتك للقناة',
        // Spells out where the description actually lives. "Add it to your channel description"
        // assumes the owner knows that this means YouTube Studio → Customisation → Basic info,
        // which is three levels deep and not called "description" at the top level.
        verifyIntro: 'لإثبات أنك صاحب القناة، ضع الرمز التالي في وصف قناتك على يوتيوب. لن يراه أحد غيرك عملياً، ويمكنك حذفه فور نجاح التحقق.',
        verifyStep1: '١. انسخ الرمز:',
        verifyStep2: '٢. افتح يوتيوب استوديو ← التخصيص ← معلومات أساسية، والصقه في خانة "الوصف"، ثم اضغط "نشر".',
        verifyStep3: '٣. ارجع إلى هنا واضغط "تحقق".',
        verifyStep4: '٤. بعد نجاح التحقق يمكنك حذف الرمز من وصف قناتك.',
        openStudio: 'افتح يوتيوب استوديو',
        // YouTube's API can lag a minute or so behind a save; without saying so, a correct attempt
        // reads as a failure and people re-do work they already did right.
        verifyPatience: 'إن لم ينجح التحقق فوراً، انتظر دقيقة ثم أعد المحاولة — يوتيوب يحتاج وقتاً لتحديث البيانات.',
        copyToken: 'نسخ الرمز',
        tokenCopied: 'تم نسخ الرمز',
        tokenCopyHint: 'اضغط على الرمز لنسخه',
        // Clipboard access is refused outside a secure context and by some privacy settings.
        // The token is selected for them, so copying is one keystroke rather than a careful drag.
        tokenCopyManually: 'تم تحديد الرمز — انسخه يدوياً (Ctrl+C)',
        verify: 'تحقق',
        verifying: 'جاري التحقق...',
        // The overwhelmingly common failure: YouTube's API hasn't caught up with the save yet.
        // Saying "failed" would send people to re-check work they already did correctly.
        notFoundYet: 'لم نجد الرمز في وصف القناة بعد. قد يستغرق يوتيوب دقيقة، حاول مرة أخرى.',
        verified: 'تم التحقق من ملكيتك لهذه القناة',
        verifiedByAdmin: 'تم ربط هذه القناة بواسطة إدارة المنصة',

        // Admin-only. Worded as an assertion the admin is making, not as a step being skipped —
        // it is a different check, not a shortcut past one, and it is recorded as such.
        adminAttest: 'ربط بواسطة الإدارة',
        adminAttesting: 'جاري الربط...',
        adminAttestHint: 'للإدارة فقط: يُستخدم عند إنشاء قناة نيابة عن صاحبها، حيث لا يمكن إضافة رمز التحقق إلى وصف قناته.',
        adminAttestWarning: 'الربط بواسطة الإدارة يسمح بالاستيراد فقط. رفع الملف الأصلي بدل رابط يوتيوب يتطلب تحقق صاحب القناة نفسه.',
        adminAttestFailed: 'تعذر الربط. تأكد من الرابط وحاول مرة أخرى.',

        importHeading: 'الاستيراد',
        importIntro: 'سيتم استيراد الفيديوهات وقوائم التشغيل كسلاسل. يحدث هذا مرة واحدة.',
        startImport: 'ابدأ الاستيراد',
        retryImport: 'أعد المحاولة',
        running: 'جاري الاستيراد... يمكنك مغادرة الصفحة، سيستمر العمل.',
        succeeded: 'تم استيراد {count} فيديو',
        failed: 'فشل الاستيراد: {reason}',
        refresh: 'تحديث',
        // The count climbs during the walk — it is written per committed page, not once at the
        // end — so a multi-hour import shows progress instead of a spinner over a zero.
        progress: 'تم استيراد {count} فيديو',
        // YouTube's own pageInfo.totalResults, hence the "~": it is the channel's video count as
        // YouTube reports it, not a number we counted.
        progressOfTotal: 'تم استيراد {count} من ~{total} فيديو',

        // PARTIAL. Not a failure, and worded so it does not read as one: a catalogue larger than
        // the platform's shared daily YouTube quota reaches this every day until it is finished.
        // The backend saved its place, so the same button continues rather than starting over.
        paused: 'توقف الاستيراد مؤقتاً وحُفِظ موضعه. اضغط "متابعة الاستيراد" للإكمال من حيث توقف.',
        pausedReason: 'السبب: {reason}',
        resumeImport: 'متابعة الاستيراد',
        // Shown when pressing the button itself fails — as opposed to the import failing once it
        // has started, which is `failed` above and comes back through importStatus.
        startFailed: 'تعذر بدء الاستيراد: {reason}',

        // Shown next to an imported video that still plays from YouTube.
        badge: 'يوتيوب',
        uploadOriginal: 'رفع الملف الأصلي',
        uploadingOriginal: 'جاري الرفع... {progress}%',
        uploadedOriginal: 'تم رفع الملف الأصلي — يُشغَّل الآن من المنصة',
        uploadOriginalFailed: 'فشل رفع الملف الأصلي: {reason}',
        // Only an owner's own proof licenses hosting the file; an admin's assertion does not.
        uploadOriginalNeedsOwner: 'رفع الملف الأصلي يتطلب تحقق صاحب القناة نفسه',
        linkFailed: 'تعذر العثور على القناة. تأكد من الرابط وحاول مرة أخرى.',
    },

    createChannel: {
        title: 'إنشاء قناة',
        heading: 'إنشاء قناة جديدة',
        subheading: 'سيتم مراجعة قناتك من قبل الإدارة قبل النشر',
        nameLabel: 'اسم القناة *',
        namePlaceholder: 'مثال: محمد إلهامي',
        slugLabel: 'المعرف (Slug) *',
        slugHint: 'أحرف صغيرة وأرقام وشرطات فقط',
        descriptionPlaceholder: 'وصف القناة...',
        submitting: 'جاري الإنشاء...',
        submit: 'إنشاء القناة',
        youtubeLabel: 'رابط قناتك على يوتيوب (اختياري)',
        youtubeHint: 'إن كان لديك محتوى على يوتيوب، يمكنك استيراده لاحقاً من إعدادات القناة',
        youtubeFetch: 'جلب البيانات',
        youtubeFetching: 'جاري الجلب...',
        // Says what was filled in, because silently overwriting fields the user may have already
        // typed would look like the form losing their work.
        youtubeFetched: 'تم جلب بيانات القناة: {title}',
        // Shown under the field after a successful lookup, so there is visible evidence even when
        // every form field was already filled and nothing appeared to change.
        youtubeFound: 'القناة: {title}',
        youtubeWillLink: 'سيتم ربط القناة تلقائياً بعد الإنشاء، ثم يمكنك بدء الاستيراد.',
        youtubeLinkedAfterCreate: 'تم ربط القناة — ابدأ الاستيراد من هنا',
        youtubeLinkFailedAfterCreate: 'تم إنشاء القناة، لكن تعذر ربطها بيوتيوب. يمكنك ربطها من هنا.',
        youtubeFetchFailed: 'تعذر العثور على القناة. تأكد من الرابط وحاول مرة أخرى.',
        created: 'تم إنشاء القناة! ستظهر بعد موافقة الإدارة.',
        failed: 'فشل في إنشاء القناة',
    },

    /**
     * The channel owner's dashboard. Its five content forms share `fields.*` for labels and
     * differ only in their headings and outcome messages — which is exactly the shape
     * `ContentPublishForm` is built around.
     */
    channelManage: {
        title: 'إدارة القناة',
        titleFor: 'إدارة {name}',
        heading: 'إدارة: {name}',
        notFound: 'القناة غير موجودة',
        notFoundDescription: 'لم نتمكن من العثور على هذه القناة',
        forbidden: 'غير مصرح لك',
        forbiddenDescription: 'ليس لديك صلاحية لإدارة هذه القناة',

        tabs: {
            overview: 'نظرة عامة',
            videos: 'الفيديوهات',
            books: 'الكتب',
            articles: 'المقالات',
            posts: 'المنشورات',
            series: 'السلاسل',
            comments: 'التعليقات',
        },

        emptyContent: 'لا يوجد محتوى بعد',
        edit: 'تعديل',
        editTitle: 'تعديل المحتوى',
        // Shown when editing a video that still plays from YouTube: the change applies here only.
        editYoutubeNote: 'هذا التعديل يظهر على أبصرنا فقط ولا يغيّر شيئاً على يوتيوب.',
        channelName: 'اسم القناة',

        // Every content tab: one publish form, then the owner's own list of that type.
        forms: {
            video: {
                heading: 'رفع فيديو',
                fileLabel: 'ملف الفيديو',
                // Picking a file starts the upload at once; publish only confirms it.
                fileHint: 'يبدأ رفع الفيديو فور اختياره، ويمكنك إكمال البيانات أثناء الرفع. لن يظهر للمشاهدين إلا بعد الضغط على «نشر الفيديو».',
                submit: 'نشر الفيديو',
                listHeading: 'فيديوهاتي ({count})',
                uploaded: 'تم رفع الفيديو',
                published: 'تم نشر الفيديو',
                uploadFailed: 'فشل في رفع الفيديو: {reason}',
                action: 'نشر الفيديو',
            },
            book: {
                heading: 'إضافة كتاب',
                fileLabel: 'ملف PDF',
                fileHint: 'يبدأ رفع الملف فور اختياره، ويمكنك إكمال البيانات أثناء الرفع. لن يظهر الكتاب إلا بعد الضغط على «نشر الكتاب».',
                uploading: 'جاري الرفع...',
                pagesLabel: 'عدد الصفحات',
                submit: 'نشر الكتاب',
                listHeading: 'كتبي ({count})',
                uploaded: 'تم رفع الكتاب',
                published: 'تم نشر الكتاب',
                uploadFailed: 'فشل في رفع الكتاب: {reason}',
                action: 'نشر الكتاب',
            },
            article: {
                heading: 'كتابة مقال',
                submit: 'نشر المقال',
                listHeading: 'مقالاتي ({count})',
                published: 'تم نشر المقال',
                failed: 'فشل في نشر المقال: {reason}',
            },
            post: {
                heading: 'نشر تحديث',
                submit: 'نشر',
                listHeading: 'منشوراتي ({count})',
                published: 'تم نشر التحديث',
                failed: 'فشل في نشر التحديث: {reason}',
            },
        },

        seriesSelectLabel: 'السلسلة (اختياري)',
        seriesSelectNone: 'بدون سلسلة',
        seriesOrderLabel: 'الترتيب داخل السلسلة',
        newSeriesHeading: 'سلسلة جديدة',
        seriesTitleLabel: 'عنوان السلسلة',
        createSeries: 'إنشاء السلسلة',
        seriesListHeading: 'سلاسلي ({count})',
        seriesCreated: 'تم إنشاء السلسلة',
        seriesCreateFailed: 'فشل في إنشاء السلسلة: {reason}',
        seriesDeleted: 'تم حذف السلسلة',
        seriesDeleteFailed: 'فشل في حذف السلسلة',
        deleteSeries: 'حذف السلسلة',
        deleteSeriesConfirm: 'هل تريد حذف سلسلة "{title}"؟ ستبقى الفيديوهات نفسها، فقط تُفصل عن السلسلة.',

        commentsHeading: 'تعليقات على محتوى قناتك ({count})',
        noComments: 'لا توجد تعليقات بعد',
        commentHidden: '(مخفي)',
        commentPinned: 'مثبّت',
        pin: 'تثبيت',
        unpin: 'إلغاء التثبيت',
        hide: 'إخفاء',
        show: 'إظهار',
        commentUpdateFailed: 'فشل في تحديث التعليق',

        deleteConfirm: 'هل تريد حذف "{label}"؟',
        deleted: 'تم الحذف',
        deleteFailed: 'فشل في الحذف',
        visibilityFailed: 'فشل في تحديث الظهور',
        saved: 'تم حفظ التغييرات',
        saveFailed: 'فشل في الحفظ',

        resumePrompt: 'تم العثور على رفع غير مكتمل للملف "{name}". هل تريد إكماله؟',
        /**
         * Shown when the confirm call times out client-side. It deliberately does not say
         * "failed": the server is usually still assembling a multi-gigabyte object, confirm is
         * idempotent on the session id, and one more click finishes the job — telling the user it
         * failed would send them back to re-upload the whole file instead.
         */
        publishSlow: '{action} يستغرق وقتًا أطول من المعتاد. لم يضِع ما رفعته — أعد المحاولة بعد قليل.',
        publishFailed: 'فشل في {action}: {reason}',
    },

    comments: {
        heading: 'التعليقات ({count})',
        commentingAs: 'التعليق باسم',
        placeholder: 'اكتب تعليقك هنا...',
        submit: 'إرسال التعليق',
        loginPrompt: 'سجّل الدخول',
        loginPromptSuffix: 'لإضافة تعليق',
        empty: 'لا توجد تعليقات بعد — كن أول من يعلق!',
        reply: 'رد',
        replyPlaceholder: 'اكتب ردك...',
        submitReply: 'إرسال الرد',
        editAria: 'تعديل التعليق',
        deleteAria: 'حذف التعليق',
        deleteTitle: 'حذف التعليق',
        deleteConfirm: 'هل تريد حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء.',
        createFailed: 'فشل في إرسال التعليق',
        replyFailed: 'فشل في إرسال الرد',
        editFailed: 'فشل في تعديل التعليق',
        deleteFailed: 'فشل في حذف التعليق',
        // dayjs format string, not a sentence — it is passed to `date.format(...)`, so its
        // punctuation is layout rather than copy.
        absoluteDateFormat: 'D MMMM YYYY، HH:mm',
    },

    likes: {
        add: 'إعجاب',
        remove: 'إلغاء الإعجاب',
        // VideoCard's counts column, phrased like common.views / common.commentCount beside it.
        count: '{count} إعجاب',
    },
    bookmarks: {
        title: 'المحفوظات',
        add: 'حفظ لوقت لاحق',
        remove: 'إزالة من المحفوظات',
        clearAll: 'مسح الكل',
        clearConfirm: 'هل تريد إزالة جميع العناصر المحفوظة؟',
        clearFailed: 'فشل في مسح المحفوظات',
        loadFailed: 'فشل في تحميل المحفوظات',
        empty: 'لا يوجد شيء محفوظ هنا بعد',
        emptyDescription: 'اضغط على أيقونة الحفظ على أي فيديو أو كتاب أو مقال لإضافته هنا',
    },

    history: {
        title: 'السجل',
        clear: 'مسح السجل',
        clearWatchConfirm: 'هل تريد مسح سجل المشاهدة بالكامل؟',
        clearReadConfirm: 'هل تريد مسح سجل القراءة بالكامل؟',
        clearFailed: 'فشل في مسح السجل',
        loadFailed: 'فشل في تحميل السجل',
        emptyWatch: 'لا يوجد سجل مشاهدة',
        emptyRead: 'لا يوجد سجل قراءة',
        emptyWatchDescription: 'الفيديوهات التي تشاهدها ستظهر هنا',
        emptyReadDescription: 'الكتب التي تقرأها ستظهر هنا',
    },

    subscriptions: {
        title: 'اشتراكاتي',
        unsubscribeConfirm: 'هل تريد إلغاء الاشتراك؟',
        unsubscribeFailed: 'فشل في إلغاء الاشتراك',
        loadFailed: 'فشل في تحميل الاشتراكات',
        empty: 'لا توجد اشتراكات',
        emptyDescription: 'اشترك في القنوات لمتابعة محتواها',
        visit: 'زيارة',
        unsubscribe: 'إلغاء',
        // First letter shown in the avatar when a subscription row has no channel name.
        avatarFallback: 'ق',
    },

    profile: {
        title: 'الملف الشخصي',
        changePassword: 'تغيير كلمة المرور',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        confirmNewPassword: 'تأكيد كلمة المرور الجديدة',
        passwordChanged: 'تم تغيير كلمة المرور بنجاح',
        passwordChangeFailed: 'فشل في تغيير كلمة المرور',
        bioLabel: 'نبذة عنك',
        bioPlaceholder: 'اكتب نبذة قصيرة...',
        saved: 'تم حفظ الملف الشخصي',
        saveFailed: 'فشل في الحفظ',
    },

    admin: {
        title: 'لوحة التحكم',
        manageChannels: 'إدارة القنوات',
        pendingHeading: 'قنوات بانتظار الموافقة',
        pendingEmpty: 'لا توجد قنوات بانتظار الموافقة',
        pendingCount: 'بانتظار الموافقة ({count})',
        allChannelsCount: 'جميع القنوات ({count})',
        approve: 'موافقة',
        reject: 'رفض',
        suspend: 'تعليق',
        delete: 'حذف القناة',
        deleteTitle: 'حذف القناة نهائياً',
        // States the blast radius plainly. The delete cascades in SQL and nothing is recoverable.
        deleteWarning: 'سيتم حذف القناة وكل محتواها نهائياً: الفيديوهات والكتب والمقالات والمنشورات والسلاسل، وكل التعليقات والمحفوظات وسجلات المشاهدة المرتبطة بها. لا يمكن التراجع.',
        deleteSuggestSuspend: 'إن كنت تريد إخفاءها مؤقتاً فقط، استخدم "تعليق" بدلاً من الحذف.',
        deleteConfirmPrompt: 'اكتب معرف القناة ({slug}) للتأكيد:',
        deleteConfirmMismatch: 'المعرف غير مطابق',
        deleted: 'تم حذف القناة',
        deleteFailed: 'فشل في حذف القناة',
        approveFailed: 'فشل في الموافقة',
        rejectFailed: 'فشل في الرفض',
        suspendFailed: 'فشل في التعليق',
        stats: {
            videos: 'فيديوهات',
            books: 'كتب',
            articles: 'مقالات',
            activeChannels: 'قنوات نشطة',
            pendingChannels: 'بانتظار الموافقة',
        },
        channelStatus: {
            PENDING: 'بانتظار الموافقة',
            ACTIVE: 'نشط',
            REJECTED: 'مرفوض',
            SUSPENDED: 'معلق',
        },
    },

    search: {
        title: 'بحث',
        titleFor: 'بحث: {query}',
        heading: 'نتائج البحث عن: "{query}"',
        resultCount: '{count} نتيجة',
        failed: 'فشل البحث',
        emptyDescription: 'لم يتم العثور على نتائج لـ "{query}"',
    },

    biography: {
        title: 'السيرة الذاتية',
        empty: 'لا توجد معلومات',
        // Shown only if the record itself carries no name.
        defaultName: 'محمد إلهامي',
        education: 'المؤهلات:',
        youtube: 'يوتيوب',
        telegram: 'تيليجرام',
        contact: 'تواصل',
    },

    share: {
        button: 'مشاركة',
        linkAria: 'رابط المشاركة',
        copy: 'نسخ الرابط',
        copied: 'تم نسخ الرابط',
        copyFailed: 'تعذر نسخ الرابط',
        fromTimestamp: 'مشاركة من الدقيقة {time}',
        viaApps: 'مشاركة عبر التطبيقات',
        whatsapp: 'واتساب',
        telegram: 'تيليجرام',
    },

    upload: {
        allowedTypes: 'الملفات المسموح بها: {extensions}',
    },

    notFound: {
        title: 'الصفحة غير موجودة',
        description: 'هذه الصفحة غير موجودة أو تم نقلها',
    },
};

export default ar;
