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
        // The disclosure control on a collapsed block of prose (ExpandableText). Distinct from
        // `loadMore`, which fetches a further page — these two only change what is already here.
        showMore: 'عرض المزيد',
        showLess: 'عرض أقل',
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
        // FilePicker — our own words for what the browser's file input used to print in English.
        chooseFile: 'اختيار ملف',
        changeFile: 'تغيير الملف',
        noFileChosen: 'لم يتم اختيار أي ملف',
        // Read after a link's text by screen readers, for links that open a new browser tab.
        opensInNewTab: '(يفتح في نافذة جديدة)',
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
        // Registration only. The backend's Gender enum has exactly two values and the field is
        // @NotNull on RegisterRequest, so there is no «أفضل عدم الإفصاح» option to word here —
        // an empty submit is a 400, not a stored null. It is also write-once: ProfileUpdateRequest
        // deliberately has no gender field, so these strings have no profile-screen counterpart.
        gender: 'الجنس',
        genderMale: 'ذكر',
        genderFemale: 'أنثى',
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
        // Under the sidebar's discover list, which loads twenty channels at a time.
        moreChannels: 'عرض المزيد من القنوات',
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
            YOUTUBE_NEEDS_OWNER_VERIFICATION: 'تم ربط هذه القناة بواسطة إدارة المنصة، وهذا يكفي للاستيراد فقط. رفع الملف الأصلي يتطلب أن يثبت صاحب القناة ملكيتها بنفسه، بتسجيل الدخول بحساب Google من تبويب يوتيوب.',

            // "Verify with Google". Every one of these ends by pointing somewhere the owner can go:
            // the description token needs none of this machinery, so it is always the way out.
            YOUTUBE_OAUTH_NOT_CONFIGURED: 'التحقق عبر حساب Google غير متاح حالياً. استخدم رمز التحقق في وصف القناة بدلاً منه.',
            // Expired (ten minutes), or started by another account on this browser.
            YOUTUBE_OAUTH_STATE_INVALID: 'انتهت صلاحية عملية التحقق أو لم تعد صالحة. ارجع إلى تبويب يوتيوب وابدأ من جديد.',
            YOUTUBE_OAUTH_FAILED: 'لم يكتمل تسجيل الدخول بحساب Google. حاول مرة أخرى.',
            YOUTUBE_OAUTH_SCOPE_DENIED: 'لم تمنح الإذن بعرض حساب يوتيوب الخاص بك، وهو ما نحتاجه لمعرفة قناتك. حاول مرة أخرى ووافق على هذا الإذن، أو استخدم رمز التحقق.',
            YOUTUBE_OAUTH_UNAVAILABLE: 'تعذر الاتصال بـ Google الآن. حاول لاحقاً، أو استخدم رمز التحقق في وصف القناة.',
            YOUTUBE_OAUTH_QUOTA_EXHAUSTED: 'استُهلكت حصة المنصة اليومية من طلبات يوتيوب. استخدم رمز التحقق في وصف القناة، أو حاول غداً.',
            // By far the likeliest: the right person, the wrong account in Google's chooser — a
            // channel run under a Brand Account is a separate entry there from the personal one.
            YOUTUBE_OAUTH_CHANNEL_MISMATCH: 'الحساب الذي سجلت الدخول به يدير قناة يوتيوب مختلفة عن القناة المربوطة هنا. أعد المحاولة واختر الحساب الذي يدير القناة المربوطة (إن كانت القناة تابعة لحساب علامة تجارية فاختره من القائمة).',
            YOUTUBE_OAUTH_NO_CHANNEL: 'لا توجد قناة يوتيوب على الحساب الذي اخترته. أعد المحاولة واختر الحساب الذي يدير قناتك.',

            YOUTUBE_IMPORT_ALREADY_RUN: 'تم استيراد هذه القناة بالفعل، أو هناك استيراد جارٍ الآن.',
            // A 503, and the one case where "try again later" is actively wrong: nothing will
            // change until someone configures the deployment.
            YOUTUBE_NOT_CONFIGURED: 'الاستيراد من يوتيوب غير مفعَّل على هذه المنصة حالياً. راسل الإدارة.',
            // A REQUEST refused because the platform's shared daily YouTube budget is spent —
            // pressing "check" on the verification token, say. Worded differently from
            // `youtube.importReasons.YOUTUBE_QUOTA_EXHAUSTED`, which is the same cause on a run
            // that has already started and saved its place: there the instruction is "continue
            // tomorrow", here there is nothing in progress to continue.
            YOUTUBE_QUOTA_EXHAUSTED: 'استُهلكت حصة المنصة اليومية من طلبات يوتيوب. حاول غداً.',

            // Changing the address on the account is a step in taking the account over — the
            // verification and reset links both go to whatever is stored — so the backend asks
            // for the current password whenever, and only when, PUT /api/user/profile would
            // change it. The two codes are separated because the remedy differs: the first is a
            // field the form failed to send, the second is a value the user got wrong.
            CURRENT_PASSWORD_REQUIRED: 'تغيير البريد الإلكتروني يتطلب تأكيد كلمة المرور الحالية. أدخلها ثم أعد المحاولة.',
            CURRENT_PASSWORD_INVALID: 'كلمة المرور الحالية غير صحيحة. تأكد منها ثم أعد المحاولة.',
            // Email is optional at signup, so an account can ask to verify an address it never
            // gave. Adding one on the profile page sends the link by itself.
            EMAIL_ADDRESS_MISSING: 'لا يوجد بريد إلكتروني مسجّل في حسابك. أضف بريدك من صفحة الملف الشخصي وسيصلك رابط التوثيق.',

            // Re-queueing a failed transcode. Refused when the video is not FAILED (there may be
            // a job still running, and a second one would be a duplicate full transcode) or when
            // it has no uploaded file at all (an imported video plays from YouTube and never had
            // one). Both read to the owner as "this row is not in the state you think it is",
            // which is why the sentence sends them to refresh rather than to try again.
            TRANSCODE_NOT_RETRYABLE: 'لا يمكن إعادة معالجة هذا الفيديو الآن: إمّا أن معالجته لم تفشل، أو أنه ليس مرفوعاً على المنصة أصلاً. حدّث الصفحة لترى حالته الحالية.',
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
            // Four pieces rather than one sentence because two of them are links, and the
            // conjunction is here rather than in the JSX so the rule that no Arabic word is
            // written outside this catalog keeps holding. `و` is prefixed to the word after it
            // with no space, so the JSX puts the space BEFORE it and none after.
            acceptPrefix: 'أوافق على',
            acceptTerms: 'شروط الاستخدام',
            acceptConjunction: 'و',
            acceptPrivacy: 'سياسة الخصوصية',
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
        genderRequired: 'يرجى اختيار الجنس',
        termsRequired: 'يجب الموافقة على شروط الاستخدام وسياسة الخصوصية',
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
        // The other end of that story, and the half that was missing: a transcode can FAIL, and
        // nothing retries it automatically -- a source ffmpeg cannot decode fails identically
        // every time, so the reconciler deliberately leaves it alone. Until this existed the card
        // rendered exactly like a video still being processed, forever, and the owner's only
        // recourse was deleting it and uploading the whole file again. Two words on the card; the
        // explanation and the retry button are on the dashboard, where an owner can act.
        transcodeFailed: 'فشلت المعالجة',
        // WHAT AN OWNER IS TOLD ABOUT THEIR OWN VIDEO, per detector and per state.
        //
        // Owner-facing only: the backend does not send `review` to anyone else. Keyed by TYPE
        // first because the two detectors are not the same conversation -- "we found music" and
        // "this may contain explicit scenes" need different words, and one shared sentence would
        // serve neither. It replaced a music-only `musicReview` block that could not say the
        // second thing at all.
        //
        // SOME OF THESE STATES MEAN THE VIDEO IS HIDDEN AND SOME DO NOT, and the wording has to
        // carry that difference. `held` and `rejected` are the ones where the owner's video has
        // disappeared from the platform -- with no message at all that is indistinguishable from a
        // bug, and this design has no notification channel, so these strings are the entire
        // mechanism by which they are ever told. `advisory` is a note on a video that is published
        // and playing normally; wording it like a problem would make owners think something is
        // wrong when nothing is. `unchecked` is PER TYPE: it publishes for music and HIDES for
        // explicit content, so its two blocks below say opposite things on purpose. Which applies
        // is the backend's `holds`, not something this file decides.
        review: {
            // The tail of a truncated span list, and part of that list's own phrase -- NOT a
            // sentence of its own. It used to render as a separate paragraph after the body had
            // already finished, leaving «و5 مواضع أخرى.» hanging with nothing to attach to.
            //
            // Two forms because Arabic counted nouns agree: «و1 مواضع أخرى» and «و5 موضع آخر» are
            // both wrong. One takes the singular; 3-10 takes the plural, which is the range this
            // realistically covers (the list is capped at three, so the remainder is small).
            moreSpansOne: 'وموضع آخر',
            moreSpans: 'و{count} مواضع أخرى',

            /**
             * WHETHER ANYONE CAN SEE THE VIDEO — the only place in this repo that says so.
             *
             * <p>The detector blocks below describe what was FOUND and nothing else. This block
             * describes what it COST, and which of the three applies is the backend's `holds`
             * (plus, for `refused`, the state — a human having decided is not something `holds`
             * can express). That split is the whole point: the fail-open/fail-closed rule lives
             * in `ReviewFindingType.failsClosed()` on the backend, and a second copy of it here,
             * written into Arabic prose, is a copy nothing can test against the first.
             *
             * <p>It used to be written into the prose. `music.unchecked` said «الفيديو منشور» and
             * `nudity.unchecked` said «لن يظهر للزوار», which are both correct today and are both
             * assertions this repo has no business making: the day a fail-closed type is added,
             * or music is made to fail closed, the sentence stays and becomes a lie in the one
             * direction that matters — an owner told their video is published going to look for
             * it, or told it is hidden when everyone can see it.
             *
             * <p>`body` is the standalone form, for a finding whose type or state this build does
             * not recognise and therefore has no detail sentence for. `suffix` is the same thing
             * joined onto one — Arabic connectives differ («و» after a statement, «ف» after a
             * verdict), so the two forms are written out rather than assembled.
             */
            outcome: {
                hidden: {
                    badge: 'قيد المراجعة',
                    title: 'هذا الفيديو قيد المراجعة',
                    body: 'لن يظهر الفيديو للزوار حتى يراجعه أحد المشرفين.',
                    suffix: '، ولن يظهر الفيديو للزوار حتى يراجعه أحد المشرفين.',
                },
                // A human looked and said no. Hidden like the above, but a different thing to be
                // told: nothing is pending, and the next move is the owner's.
                refused: {
                    badge: 'مرفوض',
                    title: 'تم رفض هذا الفيديو',
                    body: 'لن يظهر الفيديو للزوار. يمكنك رفع نسخة أخرى.',
                    suffix: '، فلن يظهر للزوار. يمكنك رفع نسخة أخرى.',
                },
                published: {
                    badge: 'ملاحظة',
                    // Deliberately opens by saying the video is published. It is, and the owner's
                    // first question on seeing any notice at all is whether it still is.
                    title: 'الفيديو منشور، مع ملاحظة',
                    body: 'الفيديو منشور ويعمل بشكل طبيعي، وسيلقي أحد المشرفين نظرة عليه.',
                    suffix: '، والفيديو منشور ويعمل بشكل طبيعي، وسيلقي أحد المشرفين نظرة عليه.',
                },
            },

            // WHAT WAS FOUND, per detector and per state, and nothing about who can see it.
            //
            // Keyed by TYPE first because the two detectors are not the same conversation --
            // "we found music" and "this may contain explicit scenes" need different words, and
            // one shared sentence would serve neither.
            //
            // Every string here is a clause, not a sentence: it ends with no punctuation and
            // `outcome.<...>.suffix` finishes it. A full stop here is the shape the visibility
            // claim crept back in through last time.
            music: {
                held: {
                    body: 'رصدنا موسيقى في الصوت',
                    bodyWithSpans: 'رصدنا موسيقى في الصوت عند {spans}',
                },
                rejected: {
                    body: 'راجع أحد المشرفين الفيديو ووجد فيه موسيقى',
                    bodyWithSpans: 'راجع أحد المشرفين الفيديو ووجد فيه موسيقى عند {spans}',
                },
                advisory: {
                    body: 'قد تكون هناك موسيقى خلفية في الصوت',
                    bodyWithSpans: 'قد تكون هناك موسيقى خلفية في الصوت عند {spans}',
                },
                // Says what happened without blaming the video: nothing is wrong with it, the
                // check itself did not finish. Whether that publishes or holds is NOT said here.
                unchecked: {
                    body: 'تعذّر إكمال فحص الصوت تلقائيًا',
                    bodyWithSpans: 'تعذّر إكمال فحص الصوت تلقائيًا',
                },
            },
            nudity: {
                held: {
                    body: 'رُصد في الفيديو ما قد يكون مشاهد غير لائقة',
                    bodyWithSpans: 'رُصد في الفيديو ما قد يكون مشاهد غير لائقة عند {spans}',
                },
                rejected: {
                    body: 'راجع أحد المشرفين الفيديو ووجد فيه مشاهد غير لائقة',
                    bodyWithSpans: 'راجع أحد المشرفين الفيديو ووجد فيه مشاهد غير لائقة عند {spans}',
                },
                advisory: {
                    body: 'قد يحتوي الفيديو على مشاهد غير لائقة',
                    bodyWithSpans: 'قد يحتوي الفيديو على مشاهد غير لائقة عند {spans}',
                },
                unchecked: {
                    body: 'تعذّر إكمال فحص محتوى الفيديو تلقائيًا',
                    bodyWithSpans: 'تعذّر إكمال فحص محتوى الفيديو تلقائيًا',
                },
            },
        },
        // A video whose file lives on a third-party host (sourceType TELEGRAM). The SPA's own
        // Content-Security-Policy allows media only from our storage, so it cannot be played
        // in place; the link is the honest offer. See VideoPlayer.
        externalSourceNotice: 'هذا الفيديو مستضاف على منصة خارجية ولا يمكن تشغيله هنا.',
        openExternalSource: 'فتح الفيديو في المصدر الخارجي',
        deleteAria: 'حذف الفيديو',
        goToChannelAria: 'الذهاب إلى قناة {name}',
        loadFailed: 'فشل في تحميل الفيديو',
        // THE PLAYER GAVE UP, and until this existed it gave up in silence. Two different routes
        // end here and the viewer cannot tell them apart, so neither can this sentence: the
        // request for the playback URL failed outright (a 5xx, a dropped connection — the query
        // does not retry, so nothing further happens on its own), or hls.js spent its refresh
        // budget on segments it could not fetch. The second is what a missing CORS policy on the
        // media bucket looks like in Chrome and Firefox.
        //
        // Deliberately not a diagnosis: from here it is indistinguishable from a bad minute of
        // someone's connection, and «أعد المحاولة» is the only useful thing to say either way.
        playbackFailed: 'تعذّر تشغيل الفيديو. تحقق من اتصالك ثم أعد المحاولة.',
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
            // The centre button's label on the last frame, where the action is not "play" but
            // "play it again" — the only text a screen reader gets for that button.
            replay: 'إعادة التشغيل',
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
        // Owner-only: on their own channel page, a series no visitor can see. Feminine, agreeing
        // with «سلسلة» — common.hiddenFromVisitors is worded for a video.
        hiddenBadge: 'مخفية عن الزوار',
        hiddenNoticeTitle: 'هذه السلسلة مخفية عن الزوار',
        // Covers every way a series ends up unlisted, since the page cannot tell them apart and
        // the remedy is the same place for all of them.
        hiddenNoticeBody: 'لا تظهر هذه السلسلة لأحد غيرك لأنه لا يوجد فيها فيديو منشور: إما أن فيديوهاتها مخفية، أو لم تنتهِ معالجتها، أو محجوبة للمراجعة، أو لم تُضف إليها فيديوهات بعد.',
        manageInDashboard: 'إدارتها من لوحة القناة',
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
        // The accessible name only while the button is armed — the touch equivalent of the hover
        // swap above, where a first press has warned and a second press acts. See SubscribeButton
        // for why this one state is allowed to move the name off `subscribeToggleAria`.
        unsubscribeConfirmAria: 'اضغط مرة أخرى لإلغاء الاشتراك',
        noVideos: 'لا توجد فيديوهات بعد',
        noPosts: 'لا توجد منشورات بعد',
    },

    /**
     * The one-time YouTube import. Copy here has to carry an unusual amount of instruction — the
     * owner leaves the app, edits something on another site, and comes back — so these are
     * sentences rather than labels.
     */
    // The page Google sends the owner back to after "verify with Google".
    youtubeOAuth: {
        title: 'التحقق من قناة يوتيوب',
        verifying: 'جاري التحقق من قناتك...',
        success: 'تم التحقق من ملكيتك للقناة',
        failedHeading: 'لم يكتمل التحقق',
        denied: 'ألغيت تسجيل الدخول بحساب Google، فلم يتم التحقق.',
        invalidLink: 'رابط العودة من Google غير صالح أو ناقص.',
        tokenStillWorks: 'يمكنك دائماً التحقق بوضع الرمز في وصف القناة بدلاً من ذلك.',
        backToChannel: 'العودة إلى تبويب يوتيوب',
    },

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

        // "Verify with Google". Shown only when the deployment offers it; the token steps are the
        // fallback and stay on screen beneath it.
        oauth: {
            button: 'تحقق عبر حساب Google',
            redirecting: 'جاري الانتقال إلى Google...',
            hintUnlinked: 'الطريقة الأسرع: سجّل الدخول بحساب Google الذي يدير قناتك، فنربطها ونتحقق منها في خطوة واحدة دون تعديل أي شيء على يوتيوب.',
            hintLinked: 'سجّل الدخول بحساب Google الذي يدير هذه القناة، ولن تحتاج إلى تعديل وصفها.',
            hintUpgrade: 'إن كنت صاحب القناة، سجّل الدخول بحساب Google الذي يديرها لتثبت ملكيتك بنفسك، فيصبح بإمكانك رفع الملفات الأصلية.',
            orManual: 'أو اربط القناة برابطها وتحقق برمز في وصفها:',
            orToken: 'أو ضع رمز التحقق في وصف القناة:',
            startFailed: 'تعذر بدء التحقق عبر Google. حاول مرة أخرى أو استخدم رمز التحقق.',
        },

        // Admin-only. Worded as an assertion the admin is making, not as a step being skipped —
        // it is a different check, not a shortcut past one, and it is recorded as such.
        adminAttest: 'ربط بواسطة الإدارة',
        adminAttesting: 'جاري الربط...',
        adminAttestHint: 'للإدارة فقط: يُستخدم عند إنشاء قناة نيابة عن صاحبها، حيث لا يمكن إضافة رمز التحقق إلى وصف قناته.',
        adminAttestWarning: 'الربط بواسطة الإدارة يسمح بالاستيراد فقط. رفع الملف الأصلي بدل رابط يوتيوب يتطلب تحقق صاحب القناة نفسه.',
        adminAttestFailed: 'تعذر الربط. تأكد من الرابط وحاول مرة أخرى.',
        // The "check" button's own failure — the request never got an answer worth reading. Not
        // the same as a check that ran and found no token, which is `tokenMissing` in place.
        checkFailed: 'تعذر التحقق الآن. حاول مرة أخرى بعد قليل.',

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
        // Toasted when a run the owner is watching goes from RUNNING to PARTIAL. The panel already
        // says it in place; this is for an owner looking at another part of the settings tab.
        pausedToast: 'توقف استيراد يوتيوب مؤقتاً — يمكنك متابعته من حيث توقف.',

        // The backend's `importReason` on a run — a code, worded here. Kept apart from
        // `errors.reasons` because these are not a request being refused: they describe a run
        // that is already going, or has stopped. A code with no entry falls back to the English
        // `importMessage`, so the two repos still deploy separately.
        importReasons: {
            // Set while RUNNING: a call went unanswered and the import is waiting to ask again.
            // Without it, a count that stops climbing for two minutes reads as a stuck import.
            YOUTUBE_RETRYING: 'يوتيوب لا يستجيب حالياً، وسنعيد المحاولة تلقائياً بعد لحظات. لا حاجة لفعل أي شيء.',
            // PARTIAL after every retry went unanswered. The place is saved, so nothing is lost.
            YOUTUBE_UNREACHABLE: 'لم يستجب يوتيوب رغم عدة محاولات، فأوقفنا الاستيراد وحفظنا موضعه. انتظر قليلاً ثم اضغط "متابعة الاستيراد".',
            YOUTUBE_QUOTA_EXHAUSTED: 'استُهلكت حصة المنصة اليومية من طلبات يوتيوب. تابع الاستيراد غداً وسيكمل من حيث توقف.',
        },
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
        youtubeHint: 'إن كان لديك محتوى على يوتيوب، يمكنك استيراده لاحقاً من تبويب "الاستيراد من يوتيوب" في إدارة القناة',
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
        notFound: 'القناة غير موجودة',
        notFoundDescription: 'لم نتمكن من العثور على هذه القناة',
        forbidden: 'غير مصرح لك',
        forbiddenDescription: 'ليس لديك صلاحية لإدارة هذه القناة',

        tabs: {
            videos: 'الفيديوهات',
            books: 'الكتب',
            articles: 'المقالات',
            posts: 'المنشورات',
            comments: 'التعليقات',
            youtube: 'الاستيراد من يوتيوب',
            // Was «نظرة عامة», over a tab that held a settings form and nothing to overview.
            settings: 'إعدادات القناة',
        },

        // The side menu. Groups say which sections are worked in daily and which are set up once.
        subtitle: 'إدارة القناة',
        viewChannel: 'عرض القناة',
        navLabel: 'أقسام إدارة القناة',
        sections: {
            content: 'المحتوى',
            community: 'التفاعل',
            channel: 'القناة',
        },
        // The dot on the YouTube item, read aloud and shown on hover.
        importIndicator: {
            running: 'استيراد يوتيوب جارٍ',
            paused: 'استيراد يوتيوب متوقف مؤقتاً',
        },

        emptyContent: 'لا يوجد محتوى بعد',
        edit: 'تعديل',

        // The owner's dashboard row for a video, which is where an owner actually looks -- the
        // badge on the home feed told them a video was held and this list said nothing at all.
        videoStatus: {
            processing: 'جاري المعالجة',
            processingHint: 'يعمل الخادم على تجهيز الفيديو. لا يظهر للزوار قبل انتهاء المعالجة، ولا يوجد إشعار — حدّث الصفحة بعد قليل.',
            failed: 'فشلت المعالجة',
            // Says what failed, what did NOT fail (the file is still on the servers), and what to
            // do. The last part matters most: before the retry button existed the only way out
            // was deleting the video and uploading it again from scratch.
            failedHint: 'تعثّرت معالجة هذا الملف. الملف الأصلي ما زال محفوظاً، فلا داعي لرفعه من جديد — اضغط «إعادة المعالجة» للمحاولة مرة أخرى. إن تكرّر الفشل فالغالب أن الملف نفسه لا يمكن قراءته.',
            retry: 'إعادة المعالجة',
            retrying: 'جاري الإرسال...',
            retryQueued: 'أُعيد الفيديو إلى قائمة المعالجة.',
            retryFailed: 'تعذّرت إعادة المعالجة.',
        },
        editTitle: 'تعديل المحتوى',
        // Shown when editing a video that still plays from YouTube: the change applies here only.
        editYoutubeNote: 'هذا التعديل يظهر على أبصرنا فقط ولا يغيّر شيئاً على يوتيوب.',
        channelName: 'اسم القناة',

        // Every content tab: one publish form, then the owner's own list of that type.
        forms: {
            // On a section's upload button (videos, books) while a file is on its way and the
            // dialog is closed.
            uploadingProgress: 'جاري الرفع {progress}%',
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

        // The videos section browsed by series (SeriesBrowser). Series used to be a tab of their
        // own, apart from the videos they hold.
        seriesView: {
            all: 'كل الفيديوهات',
            bySeries: 'حسب السلسلة',
            backToSeries: 'كل السلاسل',
            // The videos in no series: uploads never assigned, and imports found in no playlist.
            // Without this entry a view organised by series would lose them.
            noSeries: 'فيديوهات بلا سلسلة',
            noSeriesHint: 'الفيديوهات غير المضافة إلى أي سلسلة',
            seriesVideosHeading: '{title} ({count})',
            allHidden: 'السلسلة مخفية عن الزوار',
            someHidden: '{hidden} من {count} مخفي',
            hide: 'إخفاء السلسلة',
            show: 'إظهار السلسلة',
            // Hiding hides every video in it; showing undoes only that, so the sentence says so.
            hidden: 'تم إخفاء السلسلة وكل فيديوهاتها',
            shown: 'تم إظهار السلسلة. الفيديوهات التي أخفيتها بنفسك بقيت مخفية.',
            visibilityFailed: 'تعذر تغيير ظهور السلسلة',
            edit: 'تعديل السلسلة',
            saved: 'تم حفظ السلسلة',
            saveFailed: 'فشل في حفظ السلسلة',
            deleteTitle: 'حذف سلسلة "{title}"',
            // Two separate choices, the keeping one first: for an imported channel the second
            // deletes a whole course in one click.
            deleteKeep: 'حذف السلسلة فقط',
            deleteKeepHint: 'تبقى الفيديوهات منشورة كما هي، وتُفصل عن السلسلة.',
            deleteWithVideos: 'حذف السلسلة و{count} فيديو',
            deleteWithVideosHint: 'تُحذف الفيديوهات نهائياً مع ملفاتها وتعليقاتها. لا يمكن التراجع عن هذا الإجراء.',
            deletedWithVideos: 'تم حذف السلسلة وفيديوهاتها',
        },

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
        // Under a thread, which loads twenty top-level comments at a time.
        loadMore: 'عرض المزيد من التعليقات',
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
        // Shown only once the email field differs from the stored address. Worded as the reason
        // the field appeared rather than as an instruction on its own, because it materialises
        // mid-form under someone who was editing a name a moment ago.
        emailChangeNeedsPassword: 'تغيير البريد الإلكتروني يتطلب تأكيد كلمة المرور الحالية.',
    },

    admin: {
        title: 'لوحة التحكم',
        manageChannels: 'إدارة القنوات',
        // The music review queue. Platform-admin only, and the only way a held video ever
        // becomes visible again -- if nobody reads this screen, uploads sit in it forever, which
        // is why the backlog count is on the heading rather than buried.
        // The moderation queue across every detector. Sits beside musicReview rather than
        // replacing it: the old tab keeps working until the last caller moves.
        //
        // TRANSLATION NEEDS A NATIVE REVIEW, PARTICULARLY THE EXPLICIT-CONTENT WORDING. These
        // strings are shown to reviewers on an Islamic platform and the register matters; they
        // were drafted alongside the feature, not by a translator.
        review: {
            title: 'مراجعة المحتوى',
            short: 'المراجعة',
            // Sub-tabs. One per detector, each with its own backlog count, because "how big is
            // the queue" is a different question for each.
            tabs: {
                music: 'الموسيقى',
                nudity: 'محتوى صريح',
                all: 'الكل',
            },
            depth: '{count}',
            // The reviewer-facing name of each state. These used to render as the raw English
            // enum -- HELD, ADVISORY, UNCHECKED -- in an app whose rule is that every user-facing
            // string lives here and reaches the screen through t(). The i18n test that walks the
            // source for literal t('...') keys could not catch it, because there was no t() call
            // to find.
            states: {
                held: 'محجوب',
                advisory: 'ملاحظة',
                unchecked: 'لم يُفحص',
                cleared: 'معتمد',
                rejected: 'مرفوض',
                clean: 'سليم',
            },
            // Shown in the decision panel when the video carries a finding from another
            // detector. Not a demand to act on it -- a warning against deciding blind.
            alsoFlagged: 'مرصود أيضًا في:',
            empty: 'لا توجد عناصر بانتظار المراجعة',
            emptyDescription: 'كل ما رصده الفحص التلقائي تمت مراجعته.',
            // The queue is fetched UNFILTERED -- one page holds the findings of every detector,
            // so a reviewer may open a tab whose backlog count is large and find nothing on the
            // page they happen to be on. Saying so is the difference between a working pager and
            // an empty screen that reads as a bug.
            pagesSpanTypes: 'الصفحة الواحدة تضم نتائج كل أنواع الفحص، فقد تجد تبويباً فارغاً في صفحة وممتلئاً في غيرها.',
            emptyOnThisPage: 'لا يوجد في هذه الصفحة شيء من هذا النوع',
            emptyOnThisPageDescription: 'ما زال هناك {count} بانتظار المراجعة في صفحات أخرى. تنقّل بين الصفحات بالأسفل.',
            // Per TYPE, because "possibly music under speech" and "possible explicit content" are
            // different problems and one shared sentence would serve neither.
            reason: {
                music: {
                    held: 'رُصدت موسيقى في هذا المقطع، وهو محجوب عن الزوار.',
                    advisory: 'قد تكون هناك موسيقى خلفية تحت الكلام. المقطع منشور.',
                    unchecked: 'تعذّر إكمال الفحص. المقطع منشور وبانتظار المراجعة.',
                    cleared: 'تمت مراجعته واعتماده.',
                    rejected: 'تمت مراجعته ورفضه.',
                },
                nudity: {
                    // HELD here comes from the detector as well as from a human: the worker
                    // reports BLOCKED when both models agree on a dwelling scene. And UNCHECKED
                    // HIDES for this type -- explicit content fails closed -- so it must not be
                    // worded like music's, which correctly says the clip is published. The row's
                    // hidden/published column reads the backend's `holds`; these sentences have
                    // to agree with it.
                    held: 'رُصدت في هذا المقطع مشاهد قد تكون غير لائقة، وهو محجوب عن الزوار.',
                    advisory: 'قد يحتوي المقطع على مشاهد غير لائقة. المقطع منشور وبانتظار المراجعة.',
                    unchecked: 'تعذّر إكمال الفحص، والمقطع محجوب عن الزوار حتى تتم مراجعته.',
                    cleared: 'تمت مراجعته واعتماده.',
                    rejected: 'تمت مراجعته ورفضه.',
                },
            },
        },
        musicReview: {
            title: 'مراجعة الموسيقى',
            short: 'الموسيقى',
            heading: 'مقاطع بانتظار المراجعة ({count})',
            // Names the one number that actually blocks people. ADVISORY and UNCHECKED rows are a
            // backlog; HELD rows are uploads nobody can see.
            heldCount: 'محجوب: {count}',
            advisoryCount: 'ملاحظات: {count}',
            uncheckedCount: 'لم تُفحص: {count}',
            empty: 'لا توجد مقاطع بانتظار المراجعة',
            emptyDescription: 'كل ما رصده الفحص التلقائي تمت مراجعته.',
            // The list is the queue; the panel is the one video being decided.
            pickOne: 'اختر مقطعًا من القائمة لمراجعته.',
            spansHeading: 'المواضع المرصودة ({count})',
            // The core interaction, and worth saying out loud: these are jump points, not an
            // edit list. The reviewer listens and decides; nothing trims anything.
            spansHint: 'اضغط على أي موضع للانتقال إليه والاستماع.',
            noSpans: 'لم يحدد الفحص مواضع بعينها في هذا المقطع.',
            coveredSeconds: 'إجمالي المرصود: {seconds} ثانية',
            openVideo: 'فتح صفحة الفيديو',
            clear: 'اعتماد ونشر',
            reject: 'رفض',
            clearing: 'جاري الاعتماد...',
            rejecting: 'جاري الرفض...',
            cleared: 'تم اعتماد المقطع ونشره.',
            rejected: 'تم رفض المقطع.',
            decisionFailed: 'تعذّر حفظ القرار.',
            // Rejection is the one that takes something away from an uploader, so it is the one
            // that asks first.
            confirmRejectTitle: 'رفض هذا المقطع؟',
            confirmRejectBody: 'لن يظهر "{title}" للزوار. يمكنك التراجع لاحقًا باعتماده.',
            confirmRejectAction: 'نعم، ارفض',
            playbackUnavailable: 'تعذّر تشغيل هذا المقطع.',
        },
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

    /**
     * Paging controls, shared by the two moderation queues.
     *
     * <p>Its own namespace rather than a corner of `common`, because the rule at the top of this
     * file is that `common` holds words that genuinely mean the same thing everywhere — and these
     * three are not words, they are one control's vocabulary. Kept together so a reworded
     * "previous" cannot end up disagreeing with "next" two hundred lines away.
     */
    pager: {
        previous: 'السابق',
        next: 'التالي',
        // Latin digits, like every other number in the app (lib/numbers.js). The page numbers
        // here are ONE-BASED while the API is zero-based: the pager is read by a person.
        position: 'صفحة {page} من {total}',
        // The accessible name for the whole control, which is otherwise two unlabelled arrows.
        label: 'تنقّل بين الصفحات',
    },

    /**
     * Viewer content reporting — the button, and the dialog behind it.
     *
     * <h4>The wording carries two things the UI cannot</h4>
     *
     * <p><b>That a human reads it, and that nothing is removed automatically.</b> A report button
     * that says nothing about what happens next is read one of two wrong ways: as a delete button
     * (so people press it on things they merely disagree with) or as a void (so people stop
     * pressing it at all). Saying plainly that a person from the platform reads it, and that the
     * content is not taken down by the press itself, is what makes the queue worth reading.
     *
     * <p><b>That the reason list is a routing decision, not a survey.</b> Each reason names what
     * a reviewer would do about it, which is why «نسبة خاطئة» is first: no detector on this
     * platform will ever have an opinion about a lecture credited to the wrong scholar, and the
     * readers are the only people who can catch it. See `lib/reports.js` for the ordering.
     */
    report: {
        action: 'إبلاغ',
        // A CONSTANT accessible name, like SubscribeButton's: what the control is FOR does not
        // change when its state does. The already-reported state has its own name below because
        // there the difference is what the control does next, not merely how it looks.
        aria: 'الإبلاغ عن هذا المحتوى',
        reported: 'تم الإبلاغ',
        reportedAria: 'سبق أن أبلغت عن هذا المحتوى',
        // Shown as the control's tooltip once reported, because a disabled control with no
        // explanation reads as broken. Says the report arrived AND that nothing more is expected
        // of the reader.
        reportedHint: 'وصلنا بلاغك وهو بانتظار مراجعة أحد المشرفين. لا حاجة لتكراره.',

        title: 'الإبلاغ عن مخالفة',
        // The two facts above, in the order a reader needs them.
        intro: 'اختر أقرب سبب لما تراه. يقرأ البلاغَ إنسانٌ من إدارة المنصة، ولا يُحذف المحتوى ولا يُخفى بمجرّد الإبلاغ.',
        reasonLegend: 'سبب البلاغ',
        noteLabel: 'تفاصيل إضافية (اختياري)',
        // Names the one piece of information that most often makes a misattribution report
        // actionable, since a reviewer who cannot verify the claim can do nothing with it.
        notePlaceholder: 'ما الذي ينبغي أن يعرفه المراجع؟ إن كان البلاغ عن نسبة خاطئة فاذكر القائل الصحيح أو المصدر إن عرفته.',
        noteCounter: '{count}/{max}',
        submit: 'إرسال البلاغ',
        submitting: 'جاري الإرسال...',
        success: 'وصل بلاغك، وسيراجعه أحد المشرفين.',
        failed: 'تعذّر إرسال البلاغ.',

        /**
         * The reasons, each a label and a line saying what it covers.
         *
         * <p>The hints are not decoration: without them «معلومة غير صحيحة» and «نسبة خاطئة» are
         * picked interchangeably, and the code then routes nothing. Read in the order of
         * REPORT_REASONS in `lib/reports.js`, which is where the ordering is argued.
         */
        reasons: {
            MISATTRIBUTION: {
                label: 'نسبة خاطئة',
                hint: 'كلام أو كتاب منسوب إلى عالم أو مؤلف لم يقله ولم يكتبه.',
            },
            MISINFORMATION: {
                label: 'معلومة غير صحيحة',
                hint: 'خبر أو حكم يُقدَّم على أنه ثابت وليس كذلك.',
            },
            SEXUAL_CONTENT: {
                label: 'مشاهد أو صور غير لائقة',
                hint: 'محتوى جنسي أو صور عارية.',
            },
            VIOLENCE: {
                label: 'عنف أو مشاهد دموية',
                hint: 'مشاهد قاسية أو دموية.',
            },
            HATE_OR_ABUSE: {
                label: 'إساءة أو تحريض',
                hint: 'سبّ أو تحقير أو تحريض على شخص أو فئة.',
            },
            COPYRIGHT: {
                label: 'مخالفة حقوق النشر',
                hint: 'نُشر دون إذن صاحب الحق.',
            },
            SPAM_OR_SCAM: {
                label: 'إعلانات أو احتيال',
                hint: 'دعاية مكرّرة أو محاولة نصب.',
            },
            OTHER: {
                label: 'سبب آخر',
                hint: 'اكتب ما تريد قوله في حقل التفاصيل أدناه.',
            },
        },
    },

    /**
     * The platform's queue of viewer reports — admin only.
     *
     * <p><b>The sentence this screen cannot do without is `decisionOnly`.</b> A moderator
     * pressing «تم التصرف» records that a human looked and acted; it does not hide, delete or
     * suspend anything. A button that a reviewer believes takes the video down, and does not, is
     * the single worst thing this screen could be wrong about — so it is said at the top of the
     * page and again beside the buttons.
     */
    adminReports: {
        title: 'بلاغات الزوار',
        short: 'البلاغات',
        // The size of the whole backlog, which one page cannot answer. Beside the heading rather
        // than inside the list for the same reason the review queue's depth is: a number only
        // visible after paging to the end is a number nobody reads.
        openTotal: 'بلاغات مفتوحة: {count}',
        decisionOnly: 'القرار هنا تسجيل لِما رآه المراجع، ولا يغيّر المحتوى: لا يُخفيه ولا يحذفه. للتصرف في المحتوى نفسه افتح العنصر واستخدم أدوات الإخفاء أو الحذف، أو علّق القناة من إدارة القنوات.',

        filters: {
            status: 'الحالة',
            targetType: 'نوع المحتوى',
            all: 'الكل',
        },
        // Reviewer-facing names for the wire enums. Looked up with tOptional, so a value a newer
        // backend sends renders as itself rather than as a dotted key in the middle of the page.
        statuses: {
            open: 'مفتوح',
            actioned: 'تم التصرف',
            dismissed: 'لا مخالفة',
        },
        targetTypes: {
            video: 'فيديو',
            book: 'كتاب',
            article: 'مقال',
            post: 'منشور',
            comment: 'تعليق',
        },

        empty: 'لا توجد بلاغات',
        emptyDescription: 'لا شيء بانتظار المراجعة ضمن هذا التصنيف.',
        loadFailed: 'تعذّر تحميل البلاغات',

        reporter: 'المُبلِّغ رقم {id}',
        reportedAt: 'أُبلغ عنه: {date}',
        decidedAt: 'تاريخ القرار: {date}',
        decidedBy: 'قرار المشرف رقم {id}',
        // Rendered only when it is more than one — see `corroboration` in lib/reports.js. This is
        // the line that turns a list of separate objections into one case.
        corroboration: '{count} بلاغات مفتوحة على العنصر نفسه',
        openTarget: 'فتح المحتوى المبلَّغ عنه',
        openChannel: 'فتح القناة',
        // A post has no page of its own and a comment lives under whatever it was written on, so
        // the link falls back to the channel. Said plainly rather than left as a dead control.
        noDirectLink: 'لا توجد صفحة مستقلة لهذا العنصر.',

        noteHeading: 'كلام المُبلِّغ',
        noNote: 'لم يكتب المُبلِّغ تفاصيل.',
        moderatorNoteLabel: 'ملاحظة المراجع (اختيارية)',
        moderatorNoteHeading: 'ملاحظة المراجع',
        moderatorNotePlaceholder: 'ماذا فعلت، ولماذا؟ تُقرأ لاحقاً عند تكرار البلاغات على القناة نفسها.',

        actioned: 'تم التصرف',
        dismiss: 'لا مخالفة',
        deciding: 'جاري الحفظ...',
        decided: 'تم حفظ القرار.',
        decisionFailed: 'تعذّر حفظ القرار.',

        otherReports: 'بقية البلاغات على العنصر نفسه',
        showOtherReports: 'عرض بقية البلاغات ({count})',
        hideOtherReports: 'إخفاء بقية البلاغات',
        otherReportsFailed: 'تعذّر تحميل بقية البلاغات.',
        // Absolute, never relative: «منذ 3 أيام» is the wrong unit for a queue whose whole
        // question is how long someone has been waiting. Latin digits, like every number here.
        dateFormat: 'D MMMM YYYY، HH:mm',
    },

    /**
     * The legal/contact surface: the privacy policy, the terms of use, and the contact page.
     *
     * <h4>Why this namespace is shaped differently from every other one</h4>
     *
     * <p>Everywhere else in this file a screen's strings are a flat bag of named keys, because a
     * screen's strings ARE a flat bag: a button label, a heading, an error. A privacy policy is
     * not. It is an ordered document, and the edit somebody will actually make to it is "insert a
     * paragraph in clause 4" or "these two sections should swap". Named keys turn that into a
     * renumbering exercise across two files, one of which is JSX — which is precisely the thing a
     * lawyer or a translator must not have to open.
     *
     * <p>So the documents below are DATA: `intro` is a list of paragraphs, `sections` is an ordered
     * list of `{ id, heading, paragraphs, bullets }`, and `components/layout/LegalDocument.jsx`
     * renders whatever it finds. Adding a section is adding an object here. Nothing else changes.
     *
     * <p><b>The consequence, stated plainly:</b> these strings do NOT go through `t()`, so the
     * source-walking test in `i18n/__tests__` does not cover them — it can only check literal
     * `t('…')` calls. The page chrome below (titles, `lastUpdated`, `contentsHeading`, the footer,
     * the contact page's labels) is flat and DOES go through `t()`, so the parts that can silently
     * vanish are the parts the test watches.
     *
     * <h4>The `id` on a section is a URL, not a slug</h4>
     *
     * <p>It becomes the anchor a clause is linked by — `/privacy#view-counts`. Renaming one breaks
     * every link anyone has ever sent to that clause, including the ones inside these documents.
     * Treat them as published.
     *
     * <h4>Accuracy is the whole point of this text</h4>
     *
     * <p>Every factual claim below was checked against the backend before it was written: the
     * signup fields, the two mails and their token lifetimes, the view-dedup key, what the rate
     * limiter keeps, what the transcode pipeline scans, what the YouTube import reads, and the
     * absence of a delete-account endpoint. Do not add a reassuring sentence here because it is
     * the kind of thing a privacy policy says. A promise this platform does not keep in code is
     * worse than no policy at all, and the only reason this one is worth reading is that it does
     * not contain any.
     */
    legal: {
        // Written into the catalog rather than computed from the clock: it is a claim about when a
        // human last read the wording, and a page that silently dates itself to today is lying
        // about exactly the thing this line exists to establish.
        lastUpdated: 'آخر تحديث: {date}',
        lastUpdatedDate: '16 سبتمبر 2026',
        contentsHeading: 'محتويات الصفحة',

        footer: {
            navLabel: 'روابط الموقع',
            privacy: 'سياسة الخصوصية',
            terms: 'شروط الاستخدام',
            contact: 'تواصل معنا',
            // {year} comes from the clock in Footer.jsx. Latin digits, like every other number in
            // this app — see lib/numbers.js on why the app has one digit system and not two.
            rights: '© {year} أَبْصَرْنا',
        },

        privacy: {
            title: 'سياسة الخصوصية',
            metaDescription: 'ما الذي تجمعه منصة أَبْصَرْنا عنك، ولماذا، وأين يُحفظ، ومن يطّلع عليه.',
            intro: [
                'هذه الصفحة تصف ما تجمعه منصة أَبْصَرْنا فعلاً، لا ما تجمعه المنصات عادةً. كل بند فيها مكتوب عن سلوك قائم في البرنامج نفسه: فما قرأتَه هنا فهو يقع، وما لم تجده هنا فالأصل أنه لا يقع.',
                'ويمكنك تصفّح المنصة وقراءة المقالات ومشاهدة الفيديوهات دون إنشاء حساب. وما يلي يبيّن ما يُجمع في الحالتين: بحساب وبغير حساب.',
            ],
            sections: [
                {
                    id: 'account-data',
                    heading: 'بيانات الحساب',
                    paragraphs: [
                        'عند إنشاء حساب نطلب اسم المستخدم وكلمة المرور والجنس. والجنس مطلوب عند التسجيل ولا يمكن تعديله بعد ذلك من داخل المنصة؛ يظهر لك في ملفك الشخصي ولإدارة المنصة، ولا يُعرض للزوار ولا يُرسَل إلى جهة خارجية.',
                        'والبريد الإلكتروني اختياري عند التسجيل، غير أنه ضروري لتفعيل الحساب، ولاستعادة كلمة المرور إن نسيتها، ولفتح قناة — فالقناة لا تُفتح إلا ببريد مُفعَّل.',
                        'وكلمة المرور تُحفَظ مُعمّاة، ولا يستطيع أحد — ولا إدارة المنصة — قراءتها ولا استرجاعها. ويُحفَظ كذلك تاريخ إنشاء حسابك ودورك على المنصة: قارئ، أو صاحب قناة، أو مشرف.',
                        'وهذه بيانات اختيارية تماماً، لك أن تضيفها أو تتركها فارغة:',
                    ],
                    bullets: [
                        'الاسم الكامل — يظهر مكان اسم المستخدم حيث تظهر أنت.',
                        'الدولة — رمز الدولة فقط من حرفين، لا مدينة ولا عنوان.',
                        'نبذة عنك — نصّ حرّ تكتبه في ملفك الشخصي.',
                        'رابط صورة شخصية — رابط لصورة مستضافة في مكان آخر. المنصة لا ترفع صورتك ولا تخزّنها، وإنما تحفظ الرابط وتعرضه.',
                    ],
                },
                {
                    id: 'email-use',
                    heading: 'البريد الإلكتروني: ماذا نرسل، وعبر من',
                    paragraphs: [
                        'لا نرسل إليك إلا نوعين من الرسائل: رسالة تفعيل البريد، ورسالة إعادة تعيين كلمة المرور. ليست هناك نشرة بريدية، ولا رسائل تسويقية، ولا إشعارات محتوى؛ ولا يوجد في البرنامج ما يرسل غير هاتين.',
                        'ورابط التفعيل صالح عشر دقائق، ورابط إعادة تعيين كلمة المرور صالح ساعة واحدة ويُستعمل مرة واحدة. والقِصَر مقصود: من ملك الرابط ملك الحساب.',
                        'ويُرسَل البريد عبر جهة خارجية متخصّصة تتولّى التسليم نيابةً عنا، فيصلها عنوان بريدك واسمك المعروض ونصّ الرسالة. ولا يصلها شيء آخر عن حسابك ولا عن نشاطك.',
                        'وعدد الطلبات محدود: ثلاث رسائل تفعيل في الساعة، وثلاثة طلبات لإعادة تعيين كلمة المرور في الساعة.',
                    ],
                },
                {
                    id: 'activity',
                    heading: 'نشاطك على المنصة',
                    paragraphs: [
                        'إن كنت مسجّل الدخول حُفِظ ما يلي مرتبطاً بحسابك. وسجلّا المشاهدة والقراءة قائمتان لراحتك أنت لا سجلَّا تتبّع: كلٌّ منهما محدود بمئتي مدخل يُحذف أقدمها تلقائياً، وكلٌّ منهما يُمسَح كاملاً بضغطة واحدة.',
                    ],
                    bullets: [
                        'سجل المشاهدة — آخر مئتي فيديو شاهدتَها وموضع توقّفك في كلٍّ منها، ليعمل «أكمل المشاهدة».',
                        'سجل القراءة — مثله للكتب: آخر مئتي كتاب وآخر صفحة بلغتَها.',
                        'المحفوظات — ما حفظتَه لقراءته أو مشاهدته لاحقاً.',
                        'الإعجابات، والاشتراكات في القنوات.',
                        'تعليقاتك: نصّها، واسمك المعروض، وتاريخها. ويُحفَظ مع التعليق عنوانُ بريدك وقت كتابته لأغراض الإدارة، ولا يظهر هذا العنوان لأيّ قارئ ولا يخرج مع بيانات التعليق.',
                    ],
                },
                {
                    id: 'view-counts',
                    heading: 'كيف يُحسب عدّاد المشاهدات',
                    paragraphs: [
                        'العدّاد تحت كل فيديو أو كتاب أو مقال يُحسب مرة واحدة لكل مُشاهِد لكل عنصر، لا مرة في كل فتح للصفحة. ولتمييز المشاهدين دون تتبّعهم يُبنى «مفتاح» على النحو الآتي.',
                        'ولا يدخل في هذا كوكي ولا معرّف إعلاني ولا بصمة جهاز. وهذا هو الفرق الجوهري بينه وبين عدّاد المشاهدات المعتاد.',
                        'ولا تُحسب لصاحب القناة مشاهداتُه لمحتواه، ولا تُحسب مشاهدات مشرفي المنصة.',
                    ],
                    bullets: [
                        'إن كنت مسجّل الدخول فالمفتاح هو رقم حسابك، فتُحسب لك مشاهدة واحدة للعنصر ولو عدتَ إليه بعد سنة.',
                        'وإن كنت زائراً بلا حساب فالمفتاح بصمةُ تعميةٍ لثلاثة أشياء مجتمعة: تاريخِ اليوم، وعنوانِ IP، ونوعِ المتصفّح. ولأن تاريخ اليوم داخلٌ في البصمة يتغيّر مفتاحك كل يوم، فلا يمكن ربط زيارتك اليوم بزيارتك أمس.',
                        'وعنوان IP لا يُخزَّن أصلاً؛ الذي يُخزَّن ناتجُ التعمية وحده، وهو لا يُفكّ ولا يُردّ إلى أصله.',
                        'وصفوف الزوار غير المسجّلين تُحذف كل ليلة، فلا تبقى أكثر من يومين.',
                    ],
                },
                {
                    id: 'ip-addresses',
                    heading: 'عناوين IP',
                    paragraphs: [
                        'يستعمل الخادم عنوان IP في موضعين اثنين لا ثالث لهما: تحديدِ معدّل الطلبات حمايةً من الإساءة وإغراق الخادم، وبناءِ بصمة المشاهدة المذكورة أعلاه.',
                        'ففي الأول يبقى العنوان في ذاكرة الخادم مؤقتاً ولا يُكتب في قاعدة بيانات، ويزول بإعادة تشغيل الخادم. وفي الثاني لا يُخزَّن، وإنما تُخزَّن بصمته.',
                        'ويبقى استثناء يجدر ذكره: إذا تجاوز عنوانٌ الحدَّ المسموح من الطلبات كُتب سطرُ تنبيهٍ في سجلات الخادم يتضمّن ذلك العنوان. وهذه السجلات محفوظة على خادم مراقبة نديره نحن.',
                    ],
                },
                {
                    id: 'analytics',
                    heading: 'قياس الأداء والأخطاء',
                    paragraphs: [
                        'يرسل التطبيق قياساتِ أداءٍ لسرعة ظهور الصفحة واستجابتها، وأخطاءَ جافاسكربت غير المتوقّعة، وأعطالَ تشغيل الفيديو. والغرض واحد: أن نعلم بالعطل حين يقع عند القارئ، لا حين يُبلَّغ عنه بعد حين.',
                        'والفرق الذي يستحق الذكر أن هذه القياسات تُرسَل إلى خادم نديره نحن، لا إلى شركة تحليلات. وليس في المنصة أداةُ تتبّع إعلاني، ولا شبكة إعلانات، ولا مقياس طرف ثالث.',
                        'ويُقتطع عنوان الصفحة قبل الإرسال: كل ما بعد علامة الاستفهام يُحذف، فلا يخرج من متصفّحك رمزُ تفعيل، ولا رمزُ إعادة تعيين كلمة مرور، ولا رابطُ ملفٍّ موقَّع. ولا يُرسَل نصُّ صفحةٍ ولا محتواها ولا رمزُ دخولك.',
                        'وإن لم يكن جمع القياسات مضبوطاً في هذا النشر فالوحدة معطَّلة بالكامل ولا يُرسَل شيء ألبتة.',
                    ],
                },
                {
                    id: 'cookies',
                    heading: 'الكوكيز والتخزين المحلي',
                    paragraphs: [
                        'لا تضع المنصة كوكيز، لا للتتبّع ولا لغيره؛ وليس في الخادم ما يُنشئ كوكي أصلاً.',
                        'وإنما تستعمل التخزين المحلي في متصفّحك، لأمور تخصّ متصفّحك وحده ولا تصل إلينا: رمزِ دخولك بعد تسجيل الدخول، واختيارِك الوضع الفاتح أو الداكن، وسرعةِ التشغيل ومستوى الصوت اللذين ضبطتهما في المشغّل، وحالةِ رفعٍ لم يكتمل حتى تستأنفه.',
                        'ورمز الدخول صالح ساعة، ويُجدَّد برمز تجديد صالح سبعة أيام. وتسجيل الخروج يمحو كليهما من متصفّحك.',
                    ],
                },
                {
                    id: 'your-content',
                    heading: 'ما تنشره أنت',
                    paragraphs: [
                        'إن فتحتَ قناة فاسمها ووصفها وشعارها ومحتواها معروضة للعموم، وكذلك اسمك المعروض بوصفك صاحبها. وما ترفعه من فيديو أو كتاب أو مقال أو منشور معروض للعموم بمجرّد نشره، إلا أن تخفيه بنفسك.',
                        'والتعليقات معروضة للعموم مع اسمك المعروض. وحذفُك تعليقَك يخفيه عن القرّاء.',
                        'وملفات الفيديو والكتب تُخزَّن في مساحة تخزين سحابية وتُقدَّم عبر شبكة توزيع محتوى، وروابطها غير قابلة للتخمين.',
                    ],
                },
                {
                    id: 'moderation',
                    heading: 'مراجعة المحتوى المرفوع',
                    paragraphs: [
                        'كل فيديو يُرفَع إلى المنصة يمرّ قبل نشره على فحص آليّ لأمرين اثنين: الموسيقى، والمحتوى المكشوف. والفحص يجري على الملف نفسه أثناء معالجته ولا يخرج من خوادمنا إلى جهة أخرى.',
                        'فإن رُصد شيء فقد يُحجَب الفيديو عن العرض حتى يراجعه إنسان من إدارة المنصة. وصاحب الفيديو وحده هو من يرى نتيجة الفحص في لوحة قناته؛ ولا تظهر للقرّاء.',
                        'وهذا الفحص للفيديو وحده. أما الكتب والمقالات والمنشورات فلا تمرّ على فحص آليّ، وإنما تُراجَع بشرياً عند ورود بلاغ.',
                    ],
                },
                {
                    id: 'youtube',
                    heading: 'استيراد قناة يوتيوب',
                    paragraphs: [
                        'يستطيع صاحب القناة — وهو وحده — أن يستورد قناته على يوتيوب مرةً واحدة. ويتمّ ذلك عبر واجهة بيانات يوتيوب بمفتاح يخصّ المنصة، لا عبر حسابك في جوجل: فلا نطلب منك تسجيل الدخول إلى جوجل، ولا نأخذ إذناً بقراءة حسابك.',
                        'وإثبات الملكية يكون بوضع رمزٍ نتيحه لك في وصف قناتك العلنيّ على يوتيوب ثم قراءته من هناك. ولا نقرأ من يوتيوب إلا ما هو معلن للعموم: عناوينَ الفيديوهات وأوصافَها وتواريخَ نشرها ومددَها وصورَها وقوائمَ التشغيل.',
                        'ولا يُرسَل إلى يوتيوب ولا إلى جوجل شيء عن قرّاء المنصة ولا عن نشاطهم.',
                    ],
                },
                {
                    id: 'third-parties',
                    heading: 'الجهات التي تصلها بيانات',
                    paragraphs: [
                        'هذه أصناف الجهات الخارجية التي يتعامل معها النظام، وهي كلّ ما هناك. وليست فيها شبكة إعلانات، ولا بوابة دفع، ولا أداة تحليلات خارجية.',
                        'ونذكرها بأصنافها لا بأسمائها. فمن أراد اسم جهةٍ بعينها، ومَبلغَ ما يصلها، فليطلب ذلك على عنوان التواصل ويُذكر له.',
                    ],
                    bullets: [
                        'مزوّد استضافة — الخوادم التي يعمل عليها الموقع، وقاعدة بياناته.',
                        'مزوّد تخزين سحابيّ وشبكة توزيع محتوى — حفظ ملفات الفيديو والكتب وتقديمها للقرّاء، وإدارة نطاق الموقع.',
                        'مزوّد إرسال بريد — تسليم رسالتَي التفعيل وإعادة تعيين كلمة المرور.',
                        'واجهة بيانات يوتيوب من جوجل — عند استيراد قناة، وبطلب من صاحبها وحده.',
                    ],
                },
                {
                    id: 'data-location',
                    heading: 'أين تُحفَظ البيانات، وإلى أين تنتقل',
                    paragraphs: [
                        'الخوادمُ وقاعدةُ البيانات في ألمانيا، داخل الاتحاد الأوروبي. وهناك يُحفَظ حسابُك ومحتواك ونشاطُك على المنصة.',
                        'وبعضُ الجهات المذكورة قبلُ — مزوّدُ التخزين وشبكةِ التوزيع، ومزوّدُ البريد — شركاتٌ مقرُّها خارجَ الاتحاد الأوروبي. فينتقل إلى الأولى ما يُرفَع من ملفات الفيديو والكتب، وإلى الثانية عنوانُ بريدك واسمُك المعروض ونصُّ الرسالة، لا غير. ولا ينتقل إلى واحدةٍ منهما سجلُّ مشاهدتك ولا سجلُّ قراءتك ولا كلمةُ مرورك.',
                    ],
                },
                {
                    id: 'retention',
                    heading: 'مدّة الاحتفاظ والنسخ الاحتياطية',
                    paragraphs: [
                        'بيانات حسابك ومحتواك محفوظة ما دام الحساب قائماً.',
                        'ويُستثنى من ذلك ما رُفض بموجب ضوابط المحتوى: الفيديو الذي حُجب أو رُدّ لموسيقى أو لمحتوى مكشوف يُحذف هو وملفاته بعد أسبوعين من آخر تغيّرٍ في حاله، وإن بقي الحساب قائماً. وتفصيل ذلك في شروط الاستخدام.',
                        'وصفوف عدّاد المشاهدة الخاصة بالزوار غير المسجّلين تُحذف كل ليلة ولا تتجاوز يومين. أما الصفوف المرتبطة بحساب مسجّل فتبقى، لأنها هي التي تمنع احتساب مشاهدتك أكثر من مرة؛ وهي قائمة بأرقام العناصر التي فتحتَها، ولا يمحوها مسحُ سجل المشاهدة. فإن أردت حذفها فراسلنا.',
                        'وتُؤخذ من قاعدة البيانات نسخةٌ احتياطية مشفَّرة كل ليلة تُحفَظ في مساحة تخزين خاصة. ومعنى ذلك أن ما يُحذف من قاعدة البيانات قد يبقى في النسخ الاحتياطية حتى تنتهي دورتها.',
                        'وسجلات الخادم — وفيها رقم حسابك مع كل طلب تُرسله وأنت مسجّل الدخول، وعنوان IP في حال تجاوز حدّ الطلبات — محفوظة على خادم المراقبة الذي نديره.',
                    ],
                },
                {
                    id: 'your-rights',
                    heading: 'حقوقك، وحذف الحساب',
                    paragraphs: [
                        'تستطيع من داخل المنصة: تعديلَ اسمك الكامل ونبذتك ورابط صورتك ودولتك، وتغييرَ بريدك الإلكتروني بتأكيد كلمة المرور الحالية، وتغييرَ كلمة المرور، ومسحَ سجل المشاهدة وسجل القراءة والمحفوظات، وإلغاءَ الإعجابات والاشتراكات، وحذفَ تعليقاتك، وإخفاءَ محتوى قناتك أو حذفه.',
                        'ولا يوجد في المنصة اليوم زرٌّ لحذف الحساب. نذكر ذلك كما هو بدل أن نَعِد بما لا يقع: فإن أردت حذف حسابك وما يتعلق به فراسلنا على عنوان التواصل، ويُنفَّذ الطلب يدوياً.',
                        'ولك كذلك أن تطلب نسخةً مما هو محفوظ عنك، أو تصحيحَ خطأ فيه، على العنوان نفسه.',
                    ],
                },
                {
                    id: 'privacy-changes',
                    heading: 'تعديلات على هذه السياسة',
                    paragraphs: [
                        'إن تغيّر شيء مما ذُكر هنا عُدِّل نصّ الصفحة وحُدِّث تاريخ «آخر تحديث» في أعلاها. وليست لهذه السياسة نسخة أخرى في مكان آخر.',
                    ],
                },
                {
                    id: 'privacy-contact',
                    heading: 'التواصل بشأن الخصوصية',
                    paragraphs: [
                        'كلُّ ما سبق — طلبُ نسخة، أو تصحيحٌ، أو حذفُ حساب، أو سؤال عن بند — يُراسَل به عنوانُ التواصل المبيَّن في صفحة «تواصل معنا».',
                    ],
                },
            ],
        },

        terms: {
            title: 'شروط الاستخدام',
            metaDescription: 'شروط استعمال منصة أَبْصَرْنا: من يفتح قناة، وما يتحمّله الناشر، وما يُمنع نشره، وكيف تُقدَّم الشكاوى.',
            intro: [
                'أَبْصَرْنا منصة لنشر محتوى إسلاميّ تعليميّ: فيديوهات وكتب ومقالات ومنشورات، منظَّمة في قنوات يملكها أصحابها. وباستعمالك المنصة — بحساب أو بغير حساب — فأنت موافق على ما في هذه الصفحة.',
                'وهي مكتوبة لتُقرأ. آثرنا فيها الوضوح على التحصين، لأن قارئها معلّم وطالب علم، لا إدارة قانونية.',
            ],
            sections: [
                {
                    // FIRST, and before the account section, because it is the reason the rest of
                    // this document is shaped the way it is. What is enforced here is described in
                    // the backend's ReviewFindingType, ReviewState.REFUSED and
                    // ReviewRetentionSweeper -- every sentence below is a claim about running code
                    // and must be changed with it, not independently of it.
                    id: 'terms-content-rule',
                    heading: 'ضوابط ما يُنشر: منصة إسلامية',
                    paragraphs: [
                        'أَبْصَرْنا منصة إسلامية، وما يُنشر فيها محكومٌ بضوابط شرعية، لا بذوقٍ تحريريّ ولا بسياسةٍ تُراجَع كلَّ موسم. وأظهرُ ما يترتّب على ذلك أمران صريحان: لا تُنشر الموسيقى والمعازف، ولا يُنشر المحتوى الجنسيّ أو المكشوف.',
                        'وهذان ليسا تفضيلاً في الترتيب ولا تنبيهاً يُعرض إلى جانب المحتوى، بل شرطٌ في النشر نفسه: ما يُرصد فيه شيء من ذلك لا يُعرض على القرّاء أصلاً، ويبقى محجوباً حتى ينظر فيه إنسان من إدارة المنصة.',
                        'وما يُرفض — سواءٌ حجبه الفحص الآليّ أو ردّه المراجع — لا يبقى عندنا إلى غير أجل: يُحذف هو وملفاته بعد أسبوعين من آخر تغيّرٍ في حاله. والمهلة مقصودة ولها معنى واحد: هي فرصة صاحبه ليستبدل الملف بآخر سليم، فاستبدالُ الملف يُلغي كلَّ حكمٍ سابق عليه ويعيده إلى الفحص من أوّله.',
                        'وحساب المهلة من آخر تغيّرٍ في الحال، لا من يوم الفحص. فلو حَجَب الفحصُ فيديو ثم نظر فيه المراجع بعد شهور فردَّه، ابتدأت المهلة من يوم ردِّه، لا من يوم حجبه — وإلا لكان الردُّ حذفاً في يومه، ولم يبقَ لصاحبه ما يصنع.',
                        'وما تعذّر فحصه — لعطلٍ في أدوات الفحص مثلاً — لا يدخل في هذا الحذف، وإن بقي محجوباً. فتعذُّرُ الفحص ليس حكماً على المحتوى، وحذفُ ما لم يُنظر فيه بعدُ ظلمٌ لصاحبه.',
                    ],
                },
                {
                    // Honesty about the limits, and it is not optional: the worker's own
                    // design-music-detection.md records that vocal-led Arabic music under speech is
                    // caught at no level, and that the ADVISORY rule fires on most recitation
                    // uploads -- which is precisely why ADVISORY publishes instead of holding.
                    // A terms page claiming the checks are complete would be false in both
                    // directions at once.
                    id: 'terms-content-rule-limits',
                    heading: 'وحدود هذا الفحص',
                    paragraphs: [
                        'والفحص الآليّ ليس تامّاً، ولا نزعم له ذلك. منه ما يفوته — كالموسيقى المصاحبة للكلام بصوتٍ مغنٍّ — ومنه ما يشتبه عليه فيضع ملاحظةً مبدئية دون حجب.',
                        'ومن ذلك أن الفيديو الذي وُضعت عليه ملاحظةٌ مبدئية (كخلفيةٍ صوتية محتملة تحت الكلام) يبقى معروضاً ريثما يُنظر فيه، لأن هذه الملاحظة تقع على أكثر تسجيلات التلاوة، فحجبُها كان يعني حجب أكثر المكتبة على شبهةٍ لا تثبت.',
                        'ولذلك جُعل الإبلاغ في متناول كل قارئ: على الفيديوهات والكتب والمقالات والمنشورات والتعليقات جميعاً. وما يرِد من بلاغات ينظر فيه إنسان. فالقرّاء هم الذين يرون ما لا تراه الآلة، ونسبةُ قولٍ إلى عالمٍ لم يقله لا يكشفها فحصٌ آليّ أصلاً.',
                    ],
                },
                {
                    id: 'terms-accounts',
                    heading: 'الحساب',
                    paragraphs: [
                        'الحساب شخصيّ، وأنت مسؤول عمّا يقع منه. فاحفظ كلمة مرورك، وإن رأيت ما يريبك فغيّرها من صفحة ملفك الشخصي.',
                        'ولا يجوز انتحال شخصية غيرك في اسم المستخدم أو الاسم المعروض أو الصورة، ولا الإيهام بصفة علمية أو بانتساب إلى جهة لا تنتسب إليها.',
                        'ولنا أن نوقف حساباً خالف هذه الشروط.',
                    ],
                },
                {
                    id: 'terms-channels',
                    heading: 'من يفتح قناة، وما يتحمّله',
                    paragraphs: [
                        'فتح القناة متاح لكل صاحب حسابٍ مُفعَّلِ البريد. والقناة الجديدة لا تُنشر مباشرةً، بل تنتظر موافقة إدارة المنصة؛ ولها أن توافق، أو ترفض، أو تعلّق قناةً قائمة.',
                        'وصاحب القناة مسؤول عن كل ما يُنشر فيها: صحّةِ نسبته، وسلامتِه من المخالفات، وحقوقِ النشر فيه. والمنصة ليست ناشراً مشاركاً لما في القنوات.',
                        'وهو مسؤول كذلك عمّا يُنشر في قناته من تعليقات، بقدر ما تتيحه له أدوات الإدارة.',
                    ],
                },
                {
                    id: 'terms-upload-rights',
                    heading: 'إقرار الناشر بحقوق ما يرفع',
                    paragraphs: [
                        'برفعك أيَّ ملف — فيديو أو كتاب أو صورة — أو نشرِك أيَّ نصّ، فأنت تقرّ بأنك تملك حقّ نشره، أو أنك مأذون لك فيه إذناً صحيحاً، أو أنه ممّا يجوز نشره.',
                        'وتقرّ بأن نشره هنا لا يعتدي على حقّ مؤلّف ولا محقِّق ولا ناشر ولا دار نشر. وتبقى ملكية ما تنشره لك؛ ونشرُك إياه على المنصة إذنٌ لها بتخزينه ومعالجته وعرضه للقرّاء ضمن الخدمة.',
                        'ونحن لا نتحقّق من ذلك سلفاً — ولا يستطيعه أحد — وإنما نتصرّف عند ورود بلاغ.',
                    ],
                },
                {
                    id: 'terms-prohibited',
                    heading: 'ما لا يجوز نشره',
                    paragraphs: [
                        'يُمنع نشر ما يلي على المنصة، في محتوى القنوات وفي التعليقات سواء:',
                    ],
                    bullets: [
                        'ما اعتُدي به على حقوق غيرك، من كتب أو تسجيلات أو صور منشورة بغير إذن أصحابها.',
                        'الموسيقى والمعازف، وما قام عليها من مقاطع الصوت والمؤثّرات.',
                        'المحتوى الجنسيّ أو المكشوف، وما يقاربه.',
                        'الدعوة إلى العنف، أو تكفير المعيَّن، أو التحريض على فرد أو طائفة.',
                        'السبّ والقذف والتشهير، وكشفُ أسرار الناس وبياناتهم الخاصة.',
                        'الغشّ والاحتيال والتسويق المموَّه والرسائل المكرَّرة.',
                        'الكذب في نسبة قولٍ إلى عالمٍ أو كتاب، وتحريفُ النصوص المنقولة.',
                        'كلُّ ما يخالف نظام البلد الذي تنشر منه.',
                    ],
                },
                {
                    id: 'terms-moderation',
                    heading: 'المراجعة والإزالة وتعليق القناة',
                    paragraphs: [
                        'كل فيديو يُرفَع يمرّ على فحص آليّ للموسيقى وللمحتوى المكشوف قبل أن يُعرض، وقد يُحجَب حتى يراجعه إنسان. وصاحب الفيديو يرى نتيجة الفحص في لوحة قناته.',
                        'وللإدارة أن تزيل أيَّ محتوى، أو تخفيه، أو تحذف تعليقاً، أو تعلّق قناةً أو ترفضها — بغير إشعار سابق إن اقتضى الأمر — ويُبيَّن السبب لصاحب الشأن عند طلبه.',
                        'ومراجعةُ الفيديو المحجوب من اختصاص إدارة المنصة وحدها دون صاحب القناة: فمراجعةُ المرء ما رفعه بنفسه ليست مراجعة.',
                        'وما حُجب أو رُدّ لا يُحفظ عندنا إلى غير أجل: يُحذف هو وملفاته بعد أسبوعين من آخر تغيّرٍ في حاله، على ما فُصّل في أول هذه الصفحة.',
                    ],
                },
                {
                    id: 'terms-comments',
                    heading: 'التعليقات',
                    paragraphs: [
                        'التعليق متاح لأصحاب الحسابات. ولك أن تعدّل تعليقك أو تحذفه، ولصاحب القناة وللإدارة إخفاؤه أو حذفه.',
                        'ولا يوجد اليوم زرّ للإبلاغ عن تعليق من داخل الصفحة؛ فالإبلاغ يكون بمراسلتنا أو بمراسلة صاحب القناة.',
                    ],
                },
                {
                    id: 'terms-takedown',
                    heading: 'الشكاوى وبلاغات الحقوق',
                    paragraphs: [
                        'إن رأيت على المنصة ما يعتدي على حقّك، أو ما يخالف ما تقدّم، فراسلنا على عنوان التواصل المبيَّن في صفحة «تواصل معنا». وهذا هو المسار الوحيد؛ ليس في المنصة زرُّ إبلاغ.',
                        'وأعِنْ على سرعة البتّ: ضع رابط الصفحة أو الفيديو، وبيّن وجه المخالفة، وإن كان بلاغَ حقوقٍ فبيّن صفتك ووجهَ ملكيتك.',
                        'وقد يترتّب على البلاغ إزالةُ المحتوى، أو إخفاؤه، أو تعليقُ القناة.',
                    ],
                },
                {
                    id: 'terms-authorship',
                    heading: 'المحتوى العلميّ والدينيّ يمثّل أصحابه',
                    paragraphs: [
                        'ما يُنشر في القنوات من دروس وكتب ومقالات وآراء يمثّل أصحابه وحدهم. فلا تتبنّى المنصة قول قائل، ولا ترجّح بين المذاهب، ولا يُعدّ وجودُ محتوى عليها تزكيةً له ولا لصاحبه.',
                        'وقبولُ قناةٍ ليس شهادةً بأهلية صاحبها، وإنما هو قبولٌ لفتح مساحة نشر. فمن أراد الاستفادة فليتحرَّ، ومن أراد أن يأخذ عن أحد فلينظر عمّن يأخذ.',
                        'ولا تُغني المنصة عن أهل العلم، وما فيها ليس فتوى موجَّهة إلى شخصك ولا حكماً على حالك.',
                    ],
                },
                {
                    id: 'terms-service',
                    heading: 'إتاحة الخدمة وإخلاء الضمانات',
                    paragraphs: [
                        'الخدمة مقدَّمة كما هي وبحسب ما هو متاح. ولا نضمن خلوّها من الخلل، ولا استمرارَ عملها بلا انقطاع، ولا بقاءَ محتوى بعينه متاحاً إلى أجل.',
                        'ولسنا مسؤولين عن دقّة ما ينشره أصحاب القنوات، ولا عن خطأ في نسبة نصّ، ولا عن ضرر ترتّب على الاعتماد على محتوى منشور.',
                        'واحتفظ بنسخةٍ مما يهمّك من ملفاتك: فالمنصة ليست مستودعَ حفظ، ولصاحب القناة أن يحذف محتواه متى شاء.',
                        'وفي حدود ما يسمح به النظام، تقتصر مسؤوليتنا على ما نصّت عليه هذه الشروط.',
                    ],
                },
                {
                    id: 'terms-changes',
                    heading: 'تعديل الشروط',
                    paragraphs: [
                        'قد تُعدَّل هذه الشروط. ويُحدَّث تاريخ «آخر تحديث» في أعلى الصفحة عند كل تعديل، واستمرارُك في استعمال المنصة بعده قبولٌ به.',
                    ],
                },
            ],
        },

        contact: {
            title: 'تواصل معنا',
            metaDescription: 'كيف تراسل إدارة منصة أَبْصَرْنا: بلاغات الحقوق، والشكاوى، وطلبات الخصوصية وحذف الحساب.',
            intro: [
                'هذه هي طريقة الوصول إلى إدارة المنصة. ليس فيها نظام تذاكر ولا محادثة مباشرة، والبريد هو المسار.',
            ],
            emailHeading: 'عنوان المراسلة',
            emailAction: 'مراسلتنا عبر البريد',
            // The not-configured state. Two audiences in one place on purpose: the reader needs to
            // know the address is missing rather than see a mailto: that goes nowhere, and the
            // operator needs to know which knob fixes it — this screen is the only place that
            // mistake is ever visible.
            missingHeading: 'عنوان التواصل غير مضبوط بعد',
            missingBody: 'لم يُضبط عنوان بريدٍ للتواصل في هذه النسخة من الموقع، ولذلك لا يظهر هنا رابط مراسلة. ولو عرضنا عنواناً تقديرياً لضاعت رسالتك عند مَن لا يقرؤها.',
            missingOperatorNote: 'ملاحظة لمن يدير هذا النشر: اضبط المتغيّر VITE_CONTACT_EMAIL ثم أعد بناء الواجهة.',
            responseNote: 'يدير المنصة فريق صغير، ولا نلتزم بمدّة ردٍّ محدَّدة؛ غير أن بلاغات الحقوق والشكاوى تُقدَّم على غيرها.',
            sections: [
                {
                    id: 'contact-takedown',
                    heading: 'بلاغ حقوق أو طلب إزالة',
                    paragraphs: [
                        'إن نُشر على المنصة كتاب أو تسجيل أو نصّ تملك حقّه بغير إذنك، أو محتوى ترى فيه مخالفةً لشروط الاستخدام، فراسلنا وبيّن ثلاثة أشياء: رابطَ الصفحة أو الفيديو، ووجهَ المخالفة، وصفتَك إن كان بلاغَ حقوق.',
                    ],
                },
                {
                    id: 'contact-account',
                    heading: 'طلبات الحساب والخصوصية',
                    paragraphs: [
                        'حذف الحساب ليس متاحاً من داخل المنصة اليوم، ويُنفَّذ بطلبٍ عبر البريد يدوياً. وكذلك طلبُ نسخةٍ مما هو محفوظ عنك، أو تصحيحُ بيانات، أو حذفُ صفوف عدّاد المشاهدة المرتبطة بحسابك.',
                        'وراسلنا من العنوان المسجَّل في حسابك إن أمكن، فهو أسرع في إثبات أنك صاحبه.',
                    ],
                },
                {
                    id: 'contact-channel',
                    heading: 'فتح قناة ومتابعة طلبها',
                    paragraphs: [
                        'طلب فتح القناة يُقدَّم من داخل المنصة، ويظهر لك حالُه في قائمة قنواتك. فإن تأخّر أو رُفض وأردت البيان، فراسلنا.',
                    ],
                },
                {
                    id: 'contact-technical',
                    heading: 'عطل تقنيّ',
                    paragraphs: [
                        'إن تعذّر تشغيل فيديو، أو فتحُ كتاب، أو رأيت خطأً في الصفحة، فاذكر ما كنت تفعل، ورابطَ الصفحة، والمتصفّحَ الذي تستعمله. هذه الثلاثة تختصر أكثر ما نحتاجه.',
                    ],
                },
            ],
        },
    },
};

export default ar;
