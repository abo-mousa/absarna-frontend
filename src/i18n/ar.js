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
        // The two days a date-only value can name without inventing a time of day. A backend
        // `LocalDate` carries no hour, so «منذ 15 ساعة» on it was never the upload time — it was
        // the time of day, counted backwards from midnight (see lib/datetime.js).
        // The one thing every account-only control says when nobody is signed in. It is a title
        // and an aria-label rather than visible copy: the controls are disabled, and a disabled
        // control with no explanation is just a dead one (see LikeButton).
        loginRequired: 'سجّل الدخول للقيام بهذا',
        today: 'اليوم',
        yesterday: 'أمس',
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
        // The × on an in-page filter box (ui/SearchField). Its own label rather than
        // `common.close`: it empties a field, it does not dismiss anything.
        clearSearch: 'مسح البحث',
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
        // Bare labels, for the confirmation screen's list of what is being affirmed. `fields.*`
        // elsewhere are form labels; these are the same words used as facts rather than inputs.
        speaker: 'الملقي',
        duration: 'المدة',
        originalPublishDate: 'تاريخ النشر الأصلي',
        username: 'اسم المستخدم',
        usernameRequired: 'اسم المستخدم *',
        fullName: 'الاسم الكامل',
        fullNamePlaceholder: 'محمد أحمد',
        email: 'البريد الإلكتروني',
        emailRequired: 'البريد الإلكتروني *',
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
        adminPanelWaiting: 'لوحة التحكم — {count} بانتظارك',
        logout: 'تسجيل الخروج',
        logoutShort: 'خروج',
        login: 'دخول',
        register: 'إنشاء حساب',
        // The language switcher. `language` is the control's accessible name; each locale's own
        // label comes from `LOCALES[...].nativeName` and is never translated — "English" has to
        // read as English to somebody currently looking at the Arabic build, which is exactly
        // what a translated label would destroy.
        language: 'اللغة',
        languageSwitchedTo: 'اللغة: {name}',
        // The back arrow on the phone's full-width search row.
        closeSearch: 'إغلاق البحث',
        // The avatar button on a phone, which opens the account menu.
        accountMenu: 'قائمة الحساب',
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

    // صورة يضعها الشخص على قناته أو حسابه: شعار القناة وغلافها، أو الصورة الشخصية.
    ownerImage: {
        storageFailed: 'رفض الخادم حفظ الصورة. حاول مرة أخرى بعد قليل.',
        channelHeading: 'الشعار وصورة الغلاف',
        logo: 'شعار القناة',
        logoHint: 'يظهر بجانب اسم القناة وعلى كل بطاقة فيديو. الأفضل أن يكون مربعاً.',
        banner: 'صورة الغلاف',
        bannerHint: 'تظهر أعلى صفحة القناة. الأفضل أن تكون صورة عريضة، بمقاس 2560×800 تقريباً.',
        profilePicture: 'الصورة الشخصية',
        profilePictureHint: 'تظهر في قائمة حسابك.',
        profilePictureNeedsVerification: 'أكّد بريدك الإلكتروني أولاً، ثم يمكنك رفع صورة.',
        choose: 'اختيار صورة',
        replace: 'استبدال',
        remove: 'إزالة',
        uploading: 'جارٍ الرفع…',
        removing: 'جارٍ الإزالة…',
        saved: 'تم حفظ الصورة',
        removed: 'تمت إزالة الصورة',
        failed: 'تعذّر حفظ الصورة: {reason}',
        unsupported: 'صيغة الصورة غير مدعومة. اختر صورة بصيغة JPG أو PNG أو WEBP.',
        tooLarge: 'الصورة كبيرة جداً. اختر صورة أصغر من 5 ميغابايت.',
        confirm: {
            explain: 'نُسخت هذه الصور من قناتك على يوتيوب. إلى أن تؤكد أنها لك، نحدّثها من يوتيوب كل شهر، فأي تغيير هناك يستبدلها هنا.',
            action: 'تأكيد أن هذه صوري',
            done: 'تم تأكيد صورك، وستبقى كما هي',
        },
        youtube: {
            partial: 'نُسخت إحدى الصورتين، وتعذّر جلب الأخرى من يوتيوب. حاول لاحقاً لجلبها.',
            failed: 'تعذّر جلب صورك من يوتيوب. حاول مرة أخرى.',
            explain: 'يمكنك استخدام شعار قناتك وصورة غلافها على يوتيوب. سننسخهما إلى المنصة، ويمكنك تغييرهما من هنا في أي وقت.',
            action: 'استخدام شعار يوتيوب وصورة الغلاف',
            copying: 'جارٍ النسخ…',
            copied: 'تم نسخ صورك من يوتيوب',
            nothing: 'لا يوجد شعار أو صورة غلاف على قناتك في يوتيوب لنسخها',
        },
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

            // Sending a claim invitation. The letter opens by saying how many lectures we hold, so
            // a channel with none makes it read "أعددنا لقناتكم صفحةً وفيها ٠ محاضرة" — which is
            // why the backend refuses rather than sending it. Worded as "not yet", because that
            // is what it is: the import has not run or it failed.
            CHANNEL_HAS_NO_CONTENT: 'لا توجد محاضرات على هذه القناة بعد، والدعوة تبدأ بذكر عددها. شغّل الاستيراد أولاً ثم أرسل الدعوة.',

            // YouTube ownership. The two are separated because the remedy is completely different:
            // the first is something the owner does, the second is something only they can do and
            // an admin cannot do for them.
            YOUTUBE_NOT_VERIFIED: 'لم يتم إثبات ملكيتك لقناة اليوتيوب بعد. سجّل الدخول بحساب Google الذي يدير القناة من تبويب يوتيوب.',
            YOUTUBE_NEEDS_OWNER_VERIFICATION: 'تم ربط هذه القناة بواسطة إدارة المنصة، وهذا يكفي للاستيراد فقط. رفع الملف الأصلي يتطلب أن يثبت صاحب القناة ملكيتها بنفسه، بتسجيل الدخول بحساب Google من تبويب يوتيوب.',

            // "Verify with Google". Every one of these ends by pointing somewhere the owner can go:
            // the description token needs none of this machinery, so it is always the way out.
            YOUTUBE_OAUTH_NOT_CONFIGURED: 'التحقق عبر حساب Google غير مفعّل على المنصة حالياً، وهو الطريقة الوحيدة لإثبات الملكية. تواصل معنا حتى نفعّله.',
            // Expired (ten minutes), or started by another account on this browser.
            YOUTUBE_OAUTH_STATE_INVALID: 'انتهت صلاحية عملية التحقق أو لم تعد صالحة. ارجع إلى تبويب يوتيوب وابدأ من جديد.',
            YOUTUBE_OAUTH_FAILED: 'لم يكتمل تسجيل الدخول بحساب Google. حاول مرة أخرى.',
            YOUTUBE_OAUTH_SCOPE_DENIED: 'لم تمنح الإذن بعرض حساب يوتيوب الخاص بك، وهو ما نحتاجه لمعرفة قناتك. حاول مرة أخرى ووافق على هذا الإذن، أو استخدم رمز التحقق.',
            YOUTUBE_OAUTH_UNAVAILABLE: 'تعذر الاتصال بـ Google الآن. لا يوجد خلل في قناتك — حاول مرة أخرى بعد قليل.',
            YOUTUBE_OAUTH_QUOTA_EXHAUSTED: 'استُهلكت حصة المنصة اليومية من طلبات يوتيوب. الحصة تتجدد يومياً — حاول غداً.',
            // By far the likeliest: the right person, the wrong account in Google's chooser — a
            // channel run under a Brand Account is a separate entry there from the personal one.
            YOUTUBE_OAUTH_CHANNEL_MISMATCH: 'الحساب الذي سجلت الدخول به يدير قناة يوتيوب مختلفة عن القناة المربوطة هنا. أعد المحاولة واختر الحساب الذي يدير القناة المربوطة (إن كانت القناة تابعة لحساب علامة تجارية فاختره من القائمة).',
            YOUTUBE_OAUTH_NO_CHANNEL: 'لا توجد قناة يوتيوب على الحساب الذي اخترته. أعد المحاولة واختر الحساب الذي يدير قناتك.',

            // Choosing a video's poster. Each says what to do next, because every one of them is
            // recoverable by the owner in a single step.
            THUMBNAIL_FORMAT_NOT_ALLOWED: 'صيغة الصورة غير مدعومة. اختر صورة بصيغة JPG أو PNG أو WEBP.',
            THUMBNAIL_TOO_LARGE: 'حجم الصورة كبير. اختر صورة أصغر من 5 ميجابايت.',
            // The browser's direct upload to التخزين did not finish — a dropped connection, or a
            // tab closed mid-upload. Nothing was changed, so picking the file again is the fix.
            THUMBNAIL_NOT_UPLOADED: 'لم يكتمل رفع الصورة. اختر الصورة مرة أخرى.',
            THUMBNAIL_KEY_INVALID: 'تعذر حفظ الصورة. اختر الصورة مرة أخرى.',
            IMAGE_FORMAT_NOT_ALLOWED: 'صيغة الصورة غير مدعومة. اختر صورة بصيغة JPG أو PNG أو WEBP.',
            IMAGE_TOO_LARGE: 'الصورة كبيرة جداً. اختر صورة أصغر من 5 ميغابايت.',
            IMAGE_NOT_UPLOADED: 'لم يكتمل رفع الصورة. اختر الملف مرة أخرى.',
            IMAGE_KEY_INVALID: 'تعذّر حفظ الصورة. اختر الملف مرة أخرى.',
            YOUTUBE_IMAGES_OWNER_ONLY: 'نسخ صور القناة من يوتيوب متاح لمالك القناة فقط.',

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

            // Signing up with a name or an address somebody already has. The only two refusals
            // on that form the visitor could not have been warned about while typing — every
            // other one is checked here before the request leaves — so they are also the only
            // two that used to reach the screen as «تعذر إنشاء الحساب» and leave a person
            // pressing the same button again.
            USERNAME_TAKEN: 'اسم المستخدم هذا محجوز. اختر اسماً آخر.',
            // Points at the login page rather than just refusing: somebody whose address is
            // already registered almost always has an account and has forgotten it, and telling
            // them "used already" without saying where to go leaves them stuck on a form that
            // will never accept them.
            EMAIL_TAKEN: 'يوجد حساب مسجّل بهذا البريد الإلكتروني. سجّل الدخول به، أو أنشئ الحساب ببريد آخر. وإن نسيت كلمة المرور فاطلب رابط استعادتها من صفحة الدخول.',
            // The same situation from inside the account, where the advice above does not apply:
            // this reader is already signed in.
            PROFILE_EMAIL_TAKEN: 'هذا البريد الإلكتروني مستخدم في حساب آخر. اختر بريداً غيره.',

            // Two actions ask for the password: changing the email address (a step in taking the
            // account over — the verification and reset links both go to whatever is stored) and
            // deleting the account. So the wording names neither: one string, both callers. The
            // two codes are separated because the remedy differs: the first is a field the form
            // failed to send, the second is a value the user got wrong.
            CURRENT_PASSWORD_REQUIRED: 'هذا الإجراء يتطلب تأكيد كلمة المرور الحالية. أدخلها ثم أعد المحاولة.',
            ADMIN_ACCOUNT_CANNOT_BE_DELETED: 'لا يمكن حذف حساب إدارة المنصة من هنا.',
            CURRENT_PASSWORD_INVALID: 'كلمة المرور الحالية غير صحيحة. تأكد منها ثم أعد المحاولة.',
            // Deleting a channel through its own settings is the owner's alone; an admin has
            // the admin screen's delete.
            CHANNEL_OWNER_ONLY: 'حذف القناة من هنا متاح لمالكها فقط.',
            // Confirming imported metadata is a statement by the owner about their own words, so
            // nobody else — a platform admin included — can make it for them.
            ADOPTION_OWNER_ONLY: 'تأكيد بيانات المقاطع المستوردة متاح لمالك القناة فقط.',
            // Email is required at signup now, so this reaches only accounts created before that
            // — a profile edit cannot clear the field, since a blank one is read as "no change".
            // Adding an address on the profile page sends the link by itself.
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
            // The box is ticked by default, so the hint is what a person reads before unticking
            // it — it has to say what the choice costs on a computer that is not theirs, not just
            // name the feature.
            stayLoggedIn: 'أبقني مسجّلاً للدخول',
            stayLoggedInHint: 'أزل التحديد على جهاز مشترك؛ عندها ينتهي تسجيل دخولك بإغلاق المتصفح.',
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
            // The way out, and it has to be said rather than implied. A verification link is short
            // lived, so "expired" is the ordinary ending of this page and not a rare one — and the
            // resend button lives behind a login, on a banner the reader has not seen yet. Without
            // this sentence the page named a problem and offered a button that looks unrelated to
            // it.
            expiredHelp: 'سجّل الدخول ثم اطلب رابطاً جديداً من التنبيه الظاهر أعلى الصفحة.',
            loginLink: 'تسجيل الدخول',
        },
        verificationNotice: {
            defaultMessage: 'يجب توثيق بريدك الإلكتروني للقيام بهذا الإجراء',
            banner: 'حسابك غير موثّق بعد. افتح رابط التوثيق المُرسَل إلى بريدك الإلكتروني لتتمكن من التعليق والإعجاب والاشتراك وإنشاء قناة.',
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
            // The flash a double-tap on the side of the picture leaves behind. Two forms because
            // the numbers it produces straddle Arabic's break: 3–10 take the plural of paucity
            // («10 ثوانٍ»), 11 and up take the singular («20 ثانية»). The digits stay Latin like
            // every other figure in the app (lib/numbers.js).
            seekSecondsFew: '{seconds} ثوانٍ',
            seekSeconds: '{seconds} ثانية',
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
        // The gold line above a card's title. {position} and {total} are numbers, so t() gives them
        // the locale's digits; {series} is the owner's own words and passes through untouched —
        // «السيرة النبوية | 102» keeps its 102.
        position: '{series} · {position}',
        positionOf: '{series} · {position} من {total}',
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
        // The videos tab's own filter box, and the empty state when it matches nothing. The
        // second is worded so it cannot be read as "this channel has no videos" — the tab says
        // that already, and the two mean different things to someone who has typed a word.
        searchVideos: 'ابحث في فيديوهات القناة',
        noVideosMatch: 'لا توجد فيديوهات تطابق بحثك في هذه القناة',

        /**
         * Taking over a channel the platform built for someone who was not on it.
         *
         * The reader of every one of these strings is a scholar who has just been told that a
         * page about them exists, which they did not ask for. So the copy leads with what was
         * made and why, says plainly that the videos still play from YouTube — the first thing
         * anyone in their position wonders — and offers to remove it as readily as to hand it
         * over. Nothing here congratulates them on being featured.
         */
        claim: {
            /**
             * WRITTEN IN THE THIRD PERSON, and that is the whole point of these two strings.
             *
             * This banner sits on a PUBLIC page — the channel URL is the invitation we send, so
             * every visitor sees it, not only the scholar it concerns. The first draft said «هذه
             * القناة جُمعت لك» («this channel was gathered for YOU»), which reads correctly to
             * exactly one reader and addresses everybody else as somebody they are not.
             *
             * So the notice states a fact about the page, which is true for every reader and
             * worth telling all of them: this was assembled by us and its subject has not
             * endorsed it. The invitation is a separate, quieter line below.
             */
            banner: 'صفحة أعدّها فريق أَبْصَرْنا',
            bannerBody: 'جمعنا محتوى هذه الصفحة من قناة صاحبها على يوتيوب، ولم يستلمها بعد. الفيديوهات تُعرض من يوتيوب كما هي، والمشاهدات والأرباح تبقى لصاحب القناة.',
            // The invitation, and it asks rather than assumes — a stranger reading it should be
            // able to answer «no» and move on without having been addressed as someone else.
            cta: 'هل هذه قناتك؟ استلمها',
            // Kept separate from the signed-in call to action because it promises a different
            // next step, and a control that says "claim" and opens a login form is one that lied.
            ctaSignedOut: 'هل هذه قناتك؟ سجّل الدخول لاستلامها',
            removeInstead: 'اطلب إزالة الصفحة',
            title: 'استلام القناة',
            intro: 'لاستلام القناة أثبت أنك تملك قناة يوتيوب المرتبطة بها. لا يمكن تغيير القناة المرتبطة — الإثبات يخصّ هذه القناة وحدها.',
            linkedChannel: 'قناة يوتيوب المرتبطة',
            withGoogle: 'أثبت عبر تسجيل الدخول بجوجل',
            withGoogleHint: 'الأسرع والأدق: يكفي أن تسجّل الدخول بالحساب الذي يملك القناة.',
            // Google sign-in is the only proof, so a deployment without an OAuth client cannot
            // take claims at all. This says so plainly instead of leaving an empty panel, which
            // reads as a page that failed to load — and it points at the platform rather than at
            // the reader, because there is nothing for them to fix.
            unavailable: 'استلام القنوات غير متاح حالياً على هذه المنصة. تواصل معنا وسنتولى الأمر.',
            success: 'تم استلام القناة. أصبحت الآن قناتك.',
            failed: 'تعذر استلام القناة',
        },
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
        // Replaced `tokenStillWorks`, which pointed at a description-token method that no longer
        // exists. Nothing stands behind a failure here now, so the only honest thing to say is
        // "try again" — naming a second route the reader cannot take is worse than saying little.
        tryAgain: 'حاول تسجيل الدخول مرة أخرى بحساب Google الذي يدير القناة.',
        // A claim is a transfer, not just a verification: the reader now OWNS this channel. Saying
        // «تم التحقق» for it would undersell what just happened to someone who had been waiting.
        claimed: 'تم نقل ملكية القناة إليك',
        backToChannel: 'العودة إلى تبويب يوتيوب',
    },

    // The EU consent question, asked of every reader.
    //
    // WHAT IT IS FOR. Imported videos play from YouTube's own player and every card for one asks
    // img.youtube.com for its thumbnail — both are requests from the reader's browser straight to
    // Google, carrying their IP address, user agent and referring page, before anything has been
    // clicked. Google's EU User Consent Policy requires consent for the storage the player sets
    // and disclosure of Google as a recipient; ePrivacy requires the consent to come BEFORE the
    // request, which is why nothing loads until this is answered.
    //
    // WORDING RULES THAT ARE NOT STYLE. Google is NAMED — consent is only informed if the
    // recipient is identified, so «شركاؤنا» would fail. And neither button's label is weighted:
    // «أوافق» against «رفض» rather than «أوافق» against «إدارة التفضيلات», because a refusal that
    // takes more reading than an acceptance is not a free one.
    //
    // THE COMPARISON IS THE EXPLANATION, and it replaced an inventory. This used to recite «عنوان
    // بروتوكول الإنترنت الخاص بك ونوع متصفّحك والصفحة التي تتصفّحها» and that the player «قد يحفظ شيئاً
    // في جهازك» — every word true, and read by an ordinary person as a warning about a danger,
    // because a list of what is disclosed is the shape a breach notice has. «ومشاهدتُها عندنا
    // كمشاهدتها هناك» is the same fact measured against a baseline the reader already has, and it
    // is MORE informative rather than less: nobody needs to be told what an IP address discloses
    // to know what watching a video on YouTube means. The inventory is not gone — it is in the
    // privacy policy one link away, where a reader who wants it is looking, and `more` is now the
    // question it answers rather than a heading over it.
    //
    // THE PROMISE IS SCOPED TO YOUTUBE CONTENT on purpose: «ولا نعرض منه شيئاً قبل إذنك», not the
    // «ولن نحمّل منها شيئاً حتّى تأذن» it replaced. The wider sentence was not true while index.html
    // loads its webfonts from fonts.googleapis.com on every page — a request to Google that a
    // refusing reader cannot avoid — and of everything on this banner, the guarantee is the one
    // sentence that must not overstate itself.
    consent: {
        label: 'خيارك بشأن محتوى يوتيوب',
        title: 'فيديوهات يوتيوب داخل الموقع',
        body: 'بعض الفيديوهات هنا معروضة من يوتيوب مباشرةً، ومشاهدتُها عندنا كمشاهدتها هناك: يرى موقعُ جوجل أنّك تشاهدها، كما لو فتحتَ يوتيوب بنفسك. ولا نعرض منه شيئاً قبل إذنك؛ فإن لم تأذن بقي الموقع يعمل كالمعتاد، وما رفعناه بأنفسنا يُشاهَد من عندنا على كلّ حال.',
        more: 'ما الذي يصل إلى جوجل؟',
        grant: 'أوافق',
        deny: 'رفض',
        // The withdrawal route, on every page. Named as reopening a choice rather than as
        // "cookie settings", which describes a mechanism instead of a decision.
        footerLink: 'خيارك بشأن يوتيوب',
        // The in-context grant, on the player of a video the reader actually came to watch. Says
        // plainly that the permission is general, because a reader who thinks they are allowing
        // one video and finds they allowed all of them was not informed.
        playerBody: 'هذا الفيديو معروض من يوتيوب، ومشاهدتُه هنا كمشاهدته هناك: يرى موقعُ جوجل أنّك تشاهده، كما لو فتحتَه بنفسك. وإذنُك يشمل فيديوهات يوتيوب في الموقع كلّه، ولك سحبه متى شئت من أسفل الصفحة.',
        playerAllow: 'أوافق وشغّل',
    },

    youtube: {
        /**
         * Said before the import button is pressed, because the consequence is not reversible by
         * the owner and is not something "استيراد" suggests: the channel leaves the site until a
         * platform admin has looked at what arrived.
         *
         * <p>It is worded as a reason rather than a warning. An owner told only "your channel
         * will be hidden" would read it as a punishment; told WHY — that an imported video never
         * passes through the checks an uploaded one does — it is a rule with a shape they can
         * agree with.
         */
        reviewOnImport: 'بعد بدء الاستيراد ستُخفى القناة عن الزوار حتى تراجعها الإدارة. الفيديوهات المستوردة لا تمر بفحص المحتوى الذي يمر به الرفع المباشر، فالمراجعة هنا هي البديل. المحتوى الذي نشرته بنفسك يعود للظهور فور الموافقة.',
        reviewPending: 'القناة الآن بانتظار مراجعة الإدارة بسبب الاستيراد، وهي مخفية عن الزوار حتى تتم الموافقة.',

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
        // No steps any more: signing in IS the method, and it happens on Google's screen. What
        // this has to carry instead is the reassurance the old steps carried by being visible —
        // that nothing on the owner's YouTube channel is touched.
        verifyIntro: 'أثبت ملكيتك بتسجيل الدخول بحساب Google الذي يدير القناة. لا نعدّل شيئاً على قناتك، ولا نطّلع إلا على اسم القناة التي يديرها الحساب.',
        verified: 'تم التحقق من ملكيتك لهذه القناة',
        verifiedByAdmin: 'تم ربط هذه القناة بواسطة إدارة المنصة',

        // "Verify with Google" — the only way an owner proves a channel is theirs.
        oauth: {
            button: 'تحقق عبر حساب Google',
            redirecting: 'جاري الانتقال إلى Google...',
            hintUnlinked: 'الطريقة الأسرع: سجّل الدخول بحساب Google الذي يدير قناتك، فنربطها ونتحقق منها في خطوة واحدة دون تعديل أي شيء على يوتيوب.',
            hintLinked: 'سجّل الدخول بحساب Google الذي يدير هذه القناة، ولن تحتاج إلى تعديل أي شيء فيها.',
            hintUpgrade: 'إن كنت صاحب القناة، سجّل الدخول بحساب Google الذي يديرها لتثبت ملكيتك بنفسك، فيصبح بإمكانك رفع الملفات الأصلية.',
            // Still «أو», because the URL form below it remains a real second way to LINK a
            // channel — it just does not verify one.
            orManual: 'أو اربط القناة برابطها أولاً:',
            // There is no fallback behind this any more, so an owner on a deployment with no
            // OAuth client cannot verify at all. It points at the platform, not at them.
            unavailable: 'التحقق عبر Google غير متاح حالياً على هذه المنصة. تواصل معنا حتى نفعّله لقناتك.',
            startFailed: 'تعذر بدء التحقق عبر Google. حاول مرة أخرى بعد قليل.',
        },

        // Admin-only. Worded as an assertion the admin is making, not as a step being skipped —
        // it is a different check, not a shortcut past one, and it is recorded as such.
        adminAttest: 'ربط بواسطة الإدارة',
        adminAttesting: 'جاري الربط...',
        adminAttestHint: 'للإدارة فقط: يُستخدم عند إنشاء قناة نيابة عن صاحبها، حيث لا يمكن تسجيل الدخول بحسابه.',
        adminAttestWarning: 'الربط بواسطة الإدارة يسمح بالاستيراد فقط. رفع الملف الأصلي بدل رابط يوتيوب يتطلب تحقق صاحب القناة نفسه.',
        adminAttestFailed: 'تعذر الربط. تأكد من الرابط وحاول مرة أخرى.',
        // Confirming that an imported catalogue's metadata is the owner's own work.
        //
        // WHY THE PLATFORM ASKS. Titles read through YouTube's API may only be kept for thirty
        // days. This platform keeps them indefinitely on purpose — the importer never overwrites a
        // title, because an owner may have corrected it here — and the way out of that is not to
        // delete them but to hold them on a different basis: the owner wrote them, so once they
        // have read them and said so, what we hold is their submission rather than our copy of
        // someone else's data. The backend records each confirmation with a snapshot of the text.
        //
        // NOTE THE ONE STRING THAT IS NOT HERE. The affirmation itself — the sentence the owner
        // agrees to — is served by the backend and rendered from the response, because the wording
        // shown has to be the wording the record names. Adding it to this file would put a second
        // copy next to the first and there would be no way to tell which one anybody read. See
        // AffirmationText in absarna-backend.
        adoption: {
            heading: 'تأكيد بيانات المحتوى المستورد',
            // States the reason, not the rule. An owner told only "confirm your titles" would read
            // it as a formality; told why — that these were read from يوتيوب and that confirming
            // them is what makes them ours to keep — it is a step with a shape they can agree to.
            intro: 'العناوين والأوصاف وأسماء الملقين في المحتوى المستورد قرأناها من يوتيوب. وتأكيدك أنها من عملك هو ما يجعلها بياناتك عندنا، فنحتفظ بها ونعرضها بوصفها محتواك أنت لا نسخةً من بيانات غيرنا.',
            // Says what REMAINS, unlike the import line above it: that is work the platform does
            // for the owner, and this is work the owner does themselves.
            remaining: 'بقي {count} من {total} بانتظار التأكيد',
            allConfirmed: 'تم تأكيد {count} مقطعاً',
            // The entry point on the panel. Worded as the task, not as a destination.
            open: 'راجع وأكّد',
            done: 'تم تأكيد كل المحتوى المستورد في هذه القناة. لا شيء متبقٍ.',
            nothingImported: 'لا يوجد في هذه القناة محتوى مستورد من يوتيوب.',
            // canAdopt === false: an admin linked this channel, so the owner's own proof is
            // missing. Said as the step that is left, not as a refusal — the remedy is the
            // verification panel directly above this one.
            needsOwnerVerification: 'لا يمكن التأكيد قبل أن تثبت ملكيتك لقناة يوتيوب بنفسك. الربط الذي تم بواسطة الإدارة يكفي للاستيراد، أما التأكيد فهو إقرار منك أنت عن محتواك، فلا ينوب عنك فيه أحد. أثبت ملكيتك من الأعلى ثم عد إلى هنا.',
            // The dashboard-wide notice. Says the CONSEQUENCE, not the task: «أكّد بياناتك» is a
            // chore with nothing in it for the owner, while «سنعيد قراءتها من يوتيوب شهرياً وتُستبدل»
            // is a fact about their own page. Both are true; only the second gets acted on.
            noticeTitle: 'بقي {count} مقطعاً بانتظار تأكيدك',
            noticeBody: 'العناوين والأوصاف وأسماء الملقين في هذه المقاطع قرأناها من يوتيوب ولم تُقرّها بعد. وما لم تُقرّها فإننا نعيد قراءتها من يوتيوب كل شهر، فيُستبدل ما هو مكتوب هنا بما هو هناك — وما تعدّله أنت أو تؤكّده يبقى كما تركته.',
            confirmPage: 'أؤكّد هذه الصفحة ({count})',
            confirming: 'جاري التأكيد...',
            confirmed: 'تم تأكيد {count} مقطعاً',
            confirmFailed: 'تعذر حفظ التأكيد. حاول مرة أخرى.',
            editTitle: 'تصحيح العنوان والوصف',
            // Said above the list, because correcting a title before confirming it is the better
            // outcome and an owner who assumes the text is fixed will not try.
            editHint: 'إن كان في عنوان أو وصف خطأ فصحّحه قبل التأكيد — التصحيح إقرار بالملكية أوضح من الموافقة.',
        },

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

        /**
         * The daily catch-up — `YOUTUBE_REFRESH` on the backend, which re-reads the new end of an
         * approved channel's catalogue once a day so a video its owner publishes on YouTube appears
         * here without them asking.
         *
         * <p><b>These lines are the only place it is visible.</b> It has no button, no progress and
         * nothing to poll, so an owner with no copy here would have no way to tell "the platform
         * checks every day and there was nothing new" from "the platform stopped looking". The
         * second is the one worth being able to rule out, which is why a check that found nothing
         * still says so rather than rendering nothing.
         */
        autoUpdate: {
            heading: 'التحديث التلقائي',
            // Once the channel is actually in the rotation, evidenced by a check having happened.
            active: 'نتحقق من قناتك على يوتيوب مرة كل يوم، وننشر ما نشرته حديثاً تلقائياً.',
            // Imported and approved, but the rotation has not reached it yet — at most a day.
            soon: 'سيبدأ التحديث التلقائي خلال يوم، ثم نتحقق من قناتك مرة كل يوم.',
            // The import is still going or paused, so the channel is not in the rotation: a
            // refresh reads the NEWEST page, and pressing it against a half-walked catalogue would
            // be starting from the wrong end.
            afterImport: 'يبدأ التحديث التلقائي بعد اكتمال الاستيراد.',
            // Awaiting the admin's decision. Stated because it is the one case where the owner is
            // waiting on somebody else rather than on us.
            afterApproval: 'يبدأ التحديث التلقائي بعد موافقة الإدارة على الاستيراد.',
            // «آخر تحقق منذ 3 ساعات — لا جديد». The "nothing new" half is the point: it is the
            // ordinary answer on almost every day, and silence would read as a broken feature.
            // A check whose timestamp lands in the future — clock skew between the server writing
            // it and this browser reading it, or a dev backend not running UTC — must not render
            // «آخر تحقق بعد 39 دقيقة», which reads as a broken page. Same call formatPublishDate
            // makes about a publish date in the future.
            justNow: 'قبل قليل',
            lastCheckedNothing: 'آخر تحقق {when} — لا جديد',
            // One is the common case for a daily check, so it gets its own form rather than
            // «أضفنا 1 فيديو».
            lastCheckedAddedOne: 'آخر تحقق {when} — أضفنا فيديو واحداً',
            lastCheckedAdded: 'آخر تحقق {when} — أضفنا {count} فيديو',
            // A refresh has no button, so this never asks for an action: the next day's check is
            // the retry. Worded so it does not read as something the owner has to fix.
            failed: 'تعذر التحقق في آخر محاولة، وسنعيد المحاولة تلقائياً.',
            failedReason: 'تعذر التحقق في آخر محاولة: {reason} وسنعيد المحاولة تلقائياً.',
            // The backend's `refreshReason`, worded. Kept apart from `importReasons` because those
            // tell the owner to press «متابعة الاستيراد», and there is no button here to press.
            // A code with no entry falls back to `failed` above, so the two repos still deploy
            // separately.
            reasons: {
                YOUTUBE_UNREACHABLE: 'لم يستجب يوتيوب.',
                YOUTUBE_QUOTA_EXHAUSTED: 'استُهلكت حصة المنصة اليومية من طلبات يوتيوب.',
            },
        },

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
        logoHint: 'اختياري. إن ربطت قناتك على يوتيوب، يُنسخ شعارها وغلافها عند الاستيراد، والصورة التي تختارها هنا تُقدَّم عليهما.',
        title: 'إنشاء قناة',
        heading: 'إنشاء قناة جديدة',
        // A channel is live the moment it is created. What USED to be here — «سيتم مراجعة قناتك
        // من قبل الإدارة قبل النشر» — was a promise of a wait that no longer happens, and the
        // wait it promised answered nothing: every uploaded video is examined per video by the
        // server. The one case that is still reviewed is importing a YouTube catalogue, and the
        // import tab says so at the point of pressing it, not here.
        subheading: 'قناتك تظهر مباشرة بعد الإنشاء، ويمكنك النشر فوراً.',
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
        created: 'تم إنشاء القناة، وهي ظاهرة الآن.',
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
            // The dot's third state. Named as the work rather than as "YouTube", because that is
            // what the owner will be looking for once the import itself is long finished.
            confirm: 'محتوى مستورد بانتظار تأكيدك',
        },

        emptyContent: 'لا يوجد محتوى بعد',

        // The dashboard's filter box. One placeholder for all four tabs: each tab passes its own
        // when the type is worth naming, and this is the fallback.
        searchContent: 'ابحث في محتواك',
        searchVideos: 'ابحث في فيديوهاتك',
        searchBooks: 'ابحث في كتبك',
        searchArticles: 'ابحث في مقالاتك',
        searchPosts: 'ابحث في منشوراتك',
        // Never «لا يوجد محتوى بعد» while a term is active: that is a claim about the channel, and
        // an owner who believed it would re-upload something they already have.
        searchNoMatches: 'لا يوجد ما يطابق بحثك',
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
            // The 30-day sweep found this imported video is no longer on YouTube. Said as a
            // fact about YouTube and not as an error of ours or theirs: the uploader deleted it or
            // made it private, and neither the owner nor the platform did anything wrong.
            //
            // The hint names all three recourses because the row already has controls for each —
            // a button here would be a second path to the same three — and because "hidden" with
            // no way out reads as a punishment rather than a pause.
            youtubeGone: 'لم يعد هذا الفيديو موجوداً على يوتيوب',
            youtubeGoneHint: 'حُذف من يوتيوب أو جُعل خاصاً، فلم يعد يُشغَّل هنا، وأخفيناه عن الزوار حتى تقرّر. ولم نحذفه: تعليقاته وإعجاباته وسجلّ مشاهدته باقية. يمكنك رفع الملف الأصلي ليعود العرض من خوادمنا، أو تعديل بياناته وإبقاءه، أو حذفه.',
            // The per-row badge. The quietest thing on the row by design — it is true of every
            // row of a freshly imported catalogue, and a warning repeated two thousand times is
            // how an owner learns to stop reading the moderation notices underneath it.
            needsConfirming: 'بانتظار تأكيدك',
            needsConfirmingHint: 'هذه البيانات قرأناها من يوتيوب. ما لم تؤكّدها أو تعدّلها، نعيد قراءتها من يوتيوب كل شهر ويُستبدل ما هو مكتوب هنا.',
            retryQueued: 'أُعيد الفيديو إلى قائمة المعالجة.',
            retryFailed: 'تعذّرت إعادة المعالجة.',
        },
        /**
         * The banner an owner sees while their channel is hidden pending review.
         *
         * <p>Two wordings because there are two ways in and they call for different next steps:
         * an import is something the owner just did and will end on its own, while anything else
         * (a suspension an admin has partly lifted, say) is not theirs to resolve. Both say the
         * dashboard still works, because the thing that makes this state confusing is that
         * everything below the banner behaves normally while nobody can see the result.
         */
        underReviewImport: 'قناتك مخفية عن الزوار حتى تراجع الإدارة المحتوى الذي استوردته من يوتيوب. يمكنك متابعة الرفع والتعديل من هنا الآن، وسيظهر كل شيء فور الموافقة.',
        underReview: 'قناتك مخفية عن الزوار حتى تراجعها الإدارة. يمكنك متابعة الرفع والتعديل من هنا الآن.',

        editTitle: 'تعديل المحتوى',
        // Shown when editing a video that still plays from YouTube: the change applies here only.
        editYoutubeNote: 'هذا التعديل يظهر على أبصرنا فقط ولا يغيّر شيئاً على يوتيوب.',

        /**
         * The poster an owner picks for a video, inside the edit dialog.
         *
         * <p>«الصورة الافتراضية» rather than «لا توجد صورة»: there is always a picture — the
         * frame the server cut, or the YouTube poster — and telling an owner there is none when
         * a visitor can see one would be false. The distinction the copy has to carry is whose
         * picture it is, not whether one exists.
         */
        thumbnail: {
            label: 'صورة الفيديو',
            usingCustom: 'هذه صورة اخترتها بنفسك.',
            usingDefault: 'الصورة الافتراضية، يلتقطها الخادم من الفيديو.',
            choose: 'اختيار صورة',
            replace: 'استبدال الصورة',
            remove: 'إزالة',
            uploading: 'جاري الرفع...',
            saved: 'تم حفظ صورة الفيديو.',
            removed: 'أُعيدت الصورة الافتراضية.',
            failed: 'تعذر حفظ الصورة: {reason}',
            unsupported: 'صيغة الصورة غير مدعومة. اختر صورة بصيغة JPG أو PNG أو WEBP.',
            tooLarge: 'حجم الصورة كبير. اختر صورة أصغر من 5 ميجابايت.',
            hint: 'JPG أو PNG أو WEBP، وبحد أقصى 5 ميجابايت. يُفضّل عرض 1280×720.',
            /*
             * The poster step offered right after a first upload.
             *
             * `afterPublishBody` has one job beyond describing the control: to say that the video
             * is already published and this is optional. The dialog opens on its own the moment an
             * upload succeeds, which is exactly the shape of a required step, and an owner who
             * reads it that way will sit looking for a picture rather than closing it. It also
             * says where to find this later, so dismissing it is not a door closing.
             */
            afterPublishTitle: 'تم نشر الفيديو',
            afterPublishBody: 'الفيديو منشور بالفعل. يمكنك اختيار صورة له الآن، أو تركه وسيلتقط الخادم صورة من الفيديو — ويمكنك تغييرها لاحقاً من تعديل الفيديو.',
            afterPublishDone: 'تم',
        },

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

        // The owner closing their own channel, from the settings tab. Password-confirmed for the
        // reason deleting the account is: nothing here can be brought back.
        deleteChannel: {
            heading: 'حذف القناة',
            intro: 'حذف القناة نهائي ولا يمكن التراجع عنه.',
            whatGoes: 'ستُحذف القناة بكل ما فيها من فيديوهات وكتب ومقالات ومنشورات وسلاسل وتعليقات، وتُحذف ملفاتها من التخزين. يبقى حسابك كما هو.',
            button: 'حذف هذه القناة نهائياً',
            confirmTitle: 'تأكيد حذف القناة',
            confirmBody: 'أدخل كلمة المرور لتأكيد حذف قناة «{name}». هذا الإجراء نهائي.',
            confirmButton: 'أؤكد حذف القناة',
            deleting: 'جاري الحذف...',
            done: 'تم حذف القناة',
            failed: 'تعذر حذف القناة',
        },

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
        verification: {
            heading: 'توثيق البريد الإلكتروني',
            verified: 'بريدك الإلكتروني موثّق.',
            notVerified: 'بريدك الإلكتروني غير موثّق بعد. لن تتمكن من التعليق أو الإعجاب أو الاشتراك أو إنشاء قناة قبل التوثيق.',
        },
        deleteAccount: {
            heading: 'حذف الحساب',
            intro: 'حذف الحساب نهائي ولا يمكن التراجع عنه.',
            whatGoes: 'سيُحذف: حسابك وبياناتك الشخصية، وتعليقاتك، وإعجاباتك، واشتراكاتك، وقائمة المحفوظات، وسجل المشاهدة والقراءة، وبلاغاتك.',
            channelsGo: 'ستُحذف أيضاً قنواتك ({count}) بكل ما فيها من فيديوهات وكتب ومقالات ومنشورات، وتُحذف ملفاتها من التخزين.',
            button: 'حذف حسابي نهائياً',
            confirmTitle: 'تأكيد حذف الحساب',
            confirmBody: 'أدخل كلمة المرور لتأكيد حذف الحساب. هذا الإجراء نهائي.',
            confirmButton: 'أؤكد الحذف',
            deleting: 'جاري الحذف...',
            done: 'تم حذف حسابك',
            failed: 'تعذر حذف الحساب',
        },
    },

    admin: {
        title: 'لوحة التحكم',
        manageChannels: 'إدارة القنوات',
        // The admin section's own menu, on all four of its screens. Labelled rather than left as
        // a bare <nav>, because a page can hold several and a screen reader lists them by name.
        nav: {
            label: 'أقسام لوحة التحكم',
            waiting: '{label} — {count} بانتظارك',
        },
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
                    // reports BLOCKED when the anatomy model (NudeNet) finds a dwelling scene; the
                    // other model alone now reports ADVISORY, which publishes. And UNCHECKED
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

        /**
         * Why a channel is in this queue, and how to go and look at it.
         *
         * <p>Creating a channel no longer queues anything — every uploaded video is examined per
         * video by the server — so a row here is almost always an import: a catalogue pulled in
         * from YouTube that nothing has examined, because those videos never enter the upload
         * pipeline at all. Saying so is the difference between «وافق» as a rubber stamp and a
         * reviewer knowing what they are being asked to look at.
         *
         * <p>`openChannel` is the link this queue was missing. The channel is not public while it
         * is here, but an admin can open it — the visibility check lets them — so reviewing is
         * one click rather than typing a URL from a slug.
         */
        pendingReasonImport: 'استوردت محتوى من يوتيوب — راجع المحتوى قبل الموافقة.',
        pendingReasonOther: 'بانتظار المراجعة.',
        openChannel: 'فتح القناة للمراجعة',
        allChannelsCount: 'جميع القنوات ({count})',
        approve: 'موافقة',
        reject: 'رفض',
        suspend: 'تعليق',
        reactivate: 'إعادة التفعيل',
        reactivated: 'أصبحت القناة ظاهرة من جديد',
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
        reactivateFailed: 'فشل في إعادة التفعيل',

        /**
         * Excusing a channel from the content detectors.
         *
         * <p>THE COPY HAS TWO JOBS AND THE SECOND IS THE HARDER ONE. The first is obvious: say
         * what is being switched off. The second is to say what this does NOT do, because an
         * admin will assume one of two wrong things otherwise — that ticking a box publishes the
         * videos this channel already has held (it does not; those stay in the review queue until
         * a human decides on them), or that it re-examines what has already been uploaded (it
         * does not; nothing is re-queued, since re-running a ladder to skip a scan would spend
         * exactly the CPU this saves). `scope` is that sentence and it is not decoration.
         *
         * <p>`badge` sits on the channel row, not only inside this dialog. A channel nothing
         * scans looks exactly like a channel whose uploads all came back clean, which is the
         * whole reason the exemption has to be visible without anyone going to look for it.
         *
         * <p>The reason box is required, and the field opens EMPTY every time rather than
         * pre-filled with what was written before: every save restamps who decided and why, so
         * carrying the previous sentence forward would attribute one admin's reasoning to another
         * admin's decision.
         */
        /**
         * The invitation link an admin copies into the email.
         *
         * Worded as «رابط الدعوة» rather than anything with «رمز» in it, because a token is what
         * the scholar puts in their YouTube description to PROVE ownership, and these two strings
         * would otherwise sit on the same screen meaning different things.
         */
        /**
         * Inviting the scholar a seeded channel is about.
         *
         * `contents` IS THE LOAD-BEARING STRING — see the English catalog for why: the admin
         * pressing this is the sender of a letter they did not write.
         */
        invite: {
            action: 'ادعُ صاحب القناة',
            actionAgain: 'أعد إرسال الدعوة',
            title: 'دعوة صاحب قناة {name}',
            intro: 'نرسل الدعوة بالبريد ونسجّل ذلك على القناة. والرابط فيها هو صفحة القناة مع الرمز الذي يُظهر عرض الاستلام.',
            contents: 'تذكر الرسالة أنّ الصفحة تحوي دروسه وكيف يستلمها، وأنّنا أعددناها من قناته العامة على يوتيوب من غير استئذان، وأنّ ردّاً على الرسالة يكفي لحذفها.',
            emailLabel: 'البريد الإلكتروني',
            previousAddress: 'هذا هو العنوان الذي أُرسلت إليه الدعوة السابقة.',
            localeLabel: 'لغة الرسالة',
            localeHint: 'لا حساب هنا تُقرأ منه اللغة، فالاختيار اختيارك، ويُسجَّل مع الإرسال.',
            send: 'أرسل الدعوة',
            sent: 'أُرسلت الدعوة وسُجّلت على القناة.',
            sendFailed: 'تعذر إرسال الدعوة',
            copyInstead: 'انسخ الرابط بدلاً من ذلك',
            copied: 'نُسخ رابط الدعوة',
            copyFailed: 'تعذر إنشاء رابط الدعوة',
            sentNote: 'دُعي {when} ← {address} ({locale})',
        },
        claimLink: {
            /**
             * Opening an invitation is the act of inviting, and it is deliberate: linking a
             * channel no longer opens one by itself.
             *
             * The confirmation says what became PUBLIC rather than just "done", because that is
             * the part an admin cannot see from this screen — the channel page now tells every
             * visitor that the platform assembled it and its owner has not taken it over.
             */
            open: 'افتح الدعوة',
            opened: 'فُتحت الدعوة. صار ظاهراً لكل زائر أن الصفحة من إعدادنا ولم يستلمها صاحبها، ويمكنك الآن نسخ الرابط وإرساله.',
            // Worded as withdrawing rather than hiding, because that is what it does: the link
            // already sent stops working.
            withdraw: 'اسحب الدعوة',
            withdrawn: 'سُحبت الدعوة، وبطل الرابط الذي أُرسل، ولم يعد التنويه ظاهراً للزوار.',
            toggleFailed: 'تعذر تغيير حالة الدعوة',
        },
        exemptions: {
            action: 'الفحص التلقائي',
            title: 'الفحص التلقائي لقناة {name}',
            badge: 'بدون فحص: {types}',
            intro: 'اختر الفحوصات التي لن تُجرى على الفيديوهات المرفوعة من هذه القناة. هذا يختصر وقت المعالجة بشكل كبير.',
            scope: 'لا يؤثر هذا على الفيديوهات السابقة: ما هو محجوز للمراجعة يبقى كذلك حتى يبتّ فيه مشرف، ولا يُعاد فحص ما رُفع من قبل.',
            detector: {
                MUSIC: 'الموسيقى',
                NUDITY: 'المحتوى غير اللائق',
            },
            detectorHint: {
                MUSIC: 'كشف الموسيقى والألحان في الصوت.',
                NUDITY: 'كشف المحتوى غير اللائق في الصورة.',
            },
            change: 'تعديل الاستثناءات',
            noneYet: 'تُفحص كل الفيديوهات المرفوعة من هذه القناة.',
            reasonLabel: 'سبب الاستثناء',
            reasonHint: 'يُحفظ مع اسمك وتاريخ القرار. مطلوب أيضاً عند إعادة تفعيل الفحص.',
            saved: 'تم حفظ إعدادات الفحص',
            saveFailed: 'فشل في حفظ إعدادات الفحص',
        },
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
        reasonsFailed: 'تعذّر تحميل أسباب البلاغ.',
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
         * order `GET /api/reports/reasons` returns — the backend's, argued on `ReportReason`.
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
            MUSIC: {
                label: 'موسيقى',
                hint: 'موسيقى أو معازف في المقطع.',
            },
            AGAINST_ISLAMIC_VALUES: {
                label: 'مخالف للقيم الإسلامية',
                hint: 'محتوى لا يليق بمنصة إسلامية، وإن لم يندرج تحت سبب آخر.',
            },
            PROFANITY: {
                label: 'ألفاظ بذيئة',
                hint: 'سبّ أو كلام فاحش.',
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
        priority: {
            urgent: 'عاجل',
            high: 'أولوية عالية',
        },
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
        lastUpdatedDate: '22 سبتمبر 2026',
        contentsHeading: 'محتويات الصفحة',
        // WHICH VERSION GOVERNS. Rendered by `LegalDocument` only when the page is being read in a
        // language it was not written in, so the Arabic build never shows it — these documents ARE
        // the Arabic, and telling their own readers they are a translation would be false. The
        // entry exists here because the catalogs have to carry the same keys, and because the
        // sentence it states is a fact about the Arabic text rather than about the English one.
        sourceNotice: 'كُتبت هذه الصفحات بالعربية، وهذا النصّ العربي هو المعتمد عند الاختلاف.',

        footer: {
            navLabel: 'روابط الموقع',
            about: 'عن المنصة',
            privacy: 'سياسة الخصوصية',
            terms: 'شروط الاستخدام',
            contact: 'تواصل معنا',
            // {year} comes from the clock in Footer.jsx. Latin digits, like every other number in
            // this app — see lib/numbers.js on why the app has one digit system and not two.
            rights: '© {year} أَبْصَرْنا',
        },

        /**
         * WHAT THIS PLATFORM IS — the page that did not exist, and the absence showed in two
         * directions at once.
         *
         * <p>A reader arriving on a lecture had no page telling them what they had arrived at, who
         * runs it, or whether the video they are watching is ours or YouTube's. And an outside
         * reviewer — Google's, when the OAuth client is verified, or YouTube's under III.I's
         * "significant independent value" test — had nothing to read but a feed, from which a
         * platform that hosts, transcodes and serves its own media is indistinguishable from a
         * site that embeds other people's.
         *
         * <p><b>The video section is the load-bearing one</b> and is written for both readers at
         * once, which is why it describes the pipeline in plain words rather than claiming a
         * capability. Upload, re-encode into several qualities, segment, serve from our own
         * hosts — every clause is a thing `UploadSessionService`, the worker and
         * `MediaUrlService` actually do, and the import is placed after it as the secondary path
         * it is. Getting that order wrong is how the page would read as a YouTube front end with
         * a feature list attached.
         *
         * <p>NOT rendered with `LegalDocument`: it is not an operative text, so the shared
         * "last updated" line (a claim about when the *terms* were last reviewed) and the numbered
         * table of contents would both be borrowed clothes. Same data shape, own page — exactly
         * the trade `Contact.jsx` documents.
         */
        about: {
            title: 'عن المنصة',
            metaDescription: 'ما هي منصة أَبْصَرْنا، ومن يديرها، وكيف تُرفَع الفيديوهات إلى خوادمها وتُعالَج وتُعرَض منها.',
            intro: [
                'أَبْصَرْنا منصةٌ لنشر محتوى إسلاميّ تعليميّ: فيديوهاتٌ وكتبٌ ومقالاتٌ ومنشورات، منظَّمةٌ في قنواتٍ يملكها أصحابها ويديرونها بأنفسهم.',
                'وهذه الصفحة تصف ما تفعله المنصة فعلاً: ما يُرفَع إليها، وما يجري عليه، ومن أين يُعرَض للقارئ.',
            ],
            sections: [
                {
                    id: 'about-what',
                    heading: 'ما تقدّمه المنصة',
                    paragraphs: [
                        'المنصة موضعُ نشرٍ لأصحاب المحتوى العلميّ، لا مجرّد دليلٍ يحيل إلى مواضع أخرى. ولكلّ صاحب محتوى قناةٌ يملكها، ينشر فيها ويرتّبها ويحذف منها متى شاء، وفيها أربعةُ أنواع:',
                    ],
                    bullets: [
                        'الفيديو — دروسٌ ومحاضراتٌ تُرفَع إلى خوادمنا وتُعرَض منها، أو تُستورَد ممّا نشره صاحبها على يوتيوب.',
                        // «من غير حاجةٍ إلى تنزيل» لا «بلا تنزيل»: الصفحة تصف ما يقع في البرنامج، وزرُّ التنزيل
                        // قائمٌ إلى جانب زرّ القراءة في كل كتابٍ له ملف. فالأول وصفٌ صحيح لما يُغني عنه
                        // القارئ الداخلي، والثاني كان يُقرأ نفياً لما هو موجود.
                        'الكتب — ملفّاتٌ تُرفَع فتُقرَأ داخل المنصة في قارئها الخاصّ، من غير حاجةٍ إلى تنزيلٍ ولا إلى برنامجٍ آخر، ويُحفَظ لك موضعُ وقوفك منها. ولك تنزيلُ الملف إن شئت.',
                        'المقالات والمنشورات — نصوصٌ تُكتَب هنا ابتداءً.',
                        'السلاسل والتراجم — ترتيبُ الدروس في سلسلةٍ تُتابَع على وجهها، وتعريفٌ بأصحاب المحتوى.',
                    ],
                },
                {
                    // THE SECTION THIS PAGE WAS ADDED FOR. See the block comment above.
                    id: 'about-video',
                    heading: 'الفيديو: يُرفَع إلينا، ويُعالَج عندنا، ويُعرَض من خوادمنا',
                    paragraphs: [
                        'يرفع صاحبُ القناة ملفَّ الفيديو الأصليّ إلى خوادمنا من متصفّحه مباشرةً، مهما كَبُر: يُقسَّم الملف أجزاءً تُرفَع على التوالي، فإن انقطع الرفع استُؤنف من موضعه ولم يُعَد من أوّله.',
                        'ثم يُعالَج آلياً عندنا: يُعاد ترميزُه إلى عدّة جودات ليناسب الشبكة البطيئة والسريعة جميعاً، ويُقطَّع مقاطعَ قصيرة تُبَثّ بالبثّ المتكيّف — فيختار مشغّلُك الجودةَ التي تحتملها شبكتُك ويرتفع بها أو ينزل أثناء المشاهدة — وتُستخرج له صورةٌ مصغّرة، ولصاحبه أن يضع صورةً من عنده بدلاً منها.',
                        'فإذا فرغت المعالجة عُرِض الفيديو من خوادمنا نحن، ومنها يصل إلى القارئ، في مشغّلٍ من صنعنا لا من صنع غيرنا. وليس في هذا الطريق يوتيوب ولا سواه.',
                        'ويُفحَص كلُّ ما يُرفَع فحصاً آلياً قبل أن يُنشَر — انظر شروط الاستخدام في بيان ما يُمنع نشره وما يُحجَب حتى يراه إنسان.',
                        'والكتب مثلُه: يُرفَع الملفّ إلينا ويُحفَظ عندنا، ويُقرَأ من خوادمنا في قارئ المنصة.',
                    ],
                },
                {
                    id: 'about-youtube',
                    heading: 'والمستورَد من يوتيوب',
                    paragraphs: [
                        'ولصاحب القناة — إن كان له محتوًى منشورٌ على يوتيوب — أن يستورده إلى قناته هنا بعد أن يثبت ملكيتَه لها، فتصير دروسه مفهرسةً في البحث، ومرتَّبةً في سلاسل، ومحفوظاً موضعُ وقوفك منها، كسائر ما في المنصة.',
                        'وهذه وحدها تُعرَض من مشغّل يوتيوب نفسه لا من خوادمنا، وعلى بطاقة كلّ واحدٍ منها علامةٌ تدلّ على مصدره، ولا يُحمَّل شيءٌ منها إلا بإذنك.',
                        'ومتى رفع صاحبُها الملفَّ الأصليَّ إلى خوادمنا حلَّ العرضُ من عندنا محلَّ ذلك المشغّل وسقطت العلامة من نفسها. فالاستيراد بابٌ من أبواب المنصة إليها، وليس هو المنصة.',
                    ],
                },
                {
                    id: 'about-operator',
                    heading: 'من يديرها',
                    paragraphs: [
                        'يديرها شخصٌ واحدٌ بصفته الشخصيّة: ليست شركةً ولا مؤسسةً ولا جهةً لها هيئةُ إدارة، وليس وراءها مستثمرٌ ولا مموّل.',
                        'وما يُنشَر فيها فهو لأصحاب القنوات، لا لنا: نحن نستضيفه ونعرضه ونحمي القارئَ ممّا يُمنع نشرُه، ولا ندّعي ملكيةَ درسٍ ولا كتاب.',
                        'وعنوان التواصل في صفحة «تواصل معنا» هو الطريق إلى مُدير المنصة: للبلاغات عن الحقوق، وللشكاوى، ولطلبات الخصوصية.',
                    ],
                },
                {
                    id: 'about-not',
                    heading: 'وما لا تفعله',
                    paragraphs: [
                        'وهذه ليست وعوداً عامّة، وإنما وصفٌ لما ليس في البرنامج أصلاً — ومَن أراد التفصيل ففي سياسة الخصوصية بيانُه:',
                    ],
                    bullets: [
                        'لا إعلانَ في المنصة ولا شبكةَ إعلانات، ولا رسمَ مشاهدةٍ ولا اشتراكاً مدفوعاً: ليس في المنصة موضعٌ يُدفَع فيه مال.',
                        'ولا أداةَ تتبّعٍ إعلانيّ ولا مقياسَ طرفٍ ثالث. وقياساتُ الأداء والأعطال تُرسَل إلى خادمٍ نديره نحن، لا إلى شركة تحليلات.',
                        'ولا كوكيز تضعها المنصة.',
                        'ولا ترشيحَ يقيس زمنَ بقائك ليطيله: الصفحة الرئيسة تعرض قدراً محدوداً ثابتاً في يومه، ولا تشغيلَ تلقائياً لفيديو بعد فيديو، وما شاهدتَه لا يُستعمل لترتيب ما يُعرَض عليك.',
                    ],
                },
            ],
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
                        'لا نرسل إلى بريد حسابك إلا نوعين من الرسائل: رسالة تفعيل البريد، ورسالة إعادة تعيين كلمة المرور. ليست هناك نشرة بريدية، ولا رسائل تسويقية، ولا إشعارات محتوى؛ ولا يوجد في البرنامج ما يرسل إلى صاحب الحساب غير هاتين. (وفي البرنامج رسالة ثالثة لا تُرسل إلى حساب قطّ: يرسلها مشرف مرةً واحدة إلى صاحب قناةٍ أعددناها له يدعوه فيها إلى استلامها، وتذهب إلى عنوانٍ بلغ المشرفَ من خارج الموقع، لا إلى شيء جُمع هنا.)',
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
                        // «لا تضع المنصة كوكيز» is true of OUR server and was the whole section:
                        // accurate about the thing it names, and misleading on any page that
                        // loads Google's player, which sets storage of its own. A policy that is
                        // narrowly true and broadly wrong is the shape a reader has no way to
                        // catch, so the qualifier belongs here rather than only in the section
                        // that explains it.
                        'على أن مشغّل يوتيوب — في صفحات الفيديوهات المستوردة وحدها — قد يحفظ في متصفّحك ما يخصّه هو، ولا سلطان لنا عليه. ولا يُحمَّل هذا المشغّل أصلاً إلا بإذنك، وانظر قسم «يوتيوب».',
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
                    // THE TWO SENTENCES THIS SECTION USED TO CARRY WERE BOTH FALSE, and they are
                    // worth recording because each was false in a way that reads as careful.
                    //
                    // «ولا يُرسَل إلى يوتيوب ولا إلى جوجل شيء عن قرّاء المنصة ولا عن نشاطهم» was
                    // wrong on essentially every page of the site. Every card for an imported
                    // video builds an img.youtube.com thumbnail URL (lib/media.js), so the
                    // reader's browser fetches an image from Google — on the home feed, in search,
                    // on channel pages — before anyone clicks anything, carrying their IP address,
                    // user agent and referring URL. The embed then loads Google's player.
                    // `youtube-nocookie` limits COOKIES, not requests, which is most likely how
                    // the sentence came to be believed.
                    //
                    // «فلا نطلب منك تسجيل الدخول إلى جوجل، ولا نأخذ إذناً بقراءة حسابك» was
                    // unconditional while the Google sign-in flow exists and ships. It is optional
                    // and off by default, and the honest version says so rather than denying it.
                    //
                    // III.A of YouTube's API Services Terms separately requires a privacy policy
                    // to say that the service uses YouTube API Services and to LINK to Google's
                    // privacy policy; offering OAuth adds the revocation link. All three are here,
                    // as links, which is why LegalDocument learned to render them.
                    id: 'youtube',
                    heading: 'يوتيوب: ما نقرأ منه، وما يصل إليه عنك',
                    paragraphs: [
                        'تستعمل هذه المنصة خدمات واجهة بيانات يوتيوب (YouTube API Services) لاستيراد محتوى القنوات، وتعرض الفيديوهات المستوردة عبر مشغّل يوتيوب نفسه. وبذلك فإن جوجل جهةٌ تصلها بيانات عنك، ويحكم تعاملَها بها ',
                        ['ما تنصّ عليه ', { text: 'سياسة خصوصية جوجل', href: 'https://policies.google.com/privacy' }, ' — ونحن لا نملك من ذلك شيئاً ولا نتحكّم فيه.'],
                        'أما ما يصل إلى جوجل عنك أنت بوصفك قارئاً، فهذا بيانه: كلُّ بطاقة فيديو مستورد تعرض صورتَه المصغّرة من خوادم يوتيوب، فيطلبها متصفّحك منها مباشرةً — في الصفحة الرئيسة، وفي نتائج البحث، وفي صفحات القنوات — قبل أن تضغط على شيء. ويصل إلى جوجل مع هذا الطلب عنوانُ بروتوكول الإنترنت الخاص بك، ونوعُ متصفّحك، والصفحةُ التي جئتَ منها. فإذا فتحتَ صفحة فيديو مستورد حُمِّل مشغّل يوتيوب كذلك. ونستعمل نطاق «youtube-nocookie.com» وهو يقلّل ما يُحفَظ في متصفّحك من كوكيز، لكنه لا يمنع الطلبات نفسها.',
                        // The consent mechanism itself. A policy that describes a data flow and
                        // omits that the reader controls it is describing something they would
                        // reasonably think they cannot stop — and the withdrawal route has to be
                        // stated, not just implemented, for it to be "as easy as giving".
                        'ولا يحدث شيء من ذلك حتى تأذن به. فعند أول زيارة نسألك، ولا يُحمَّل من خوادم جوجل شيء — لا صورةٌ مصغّرة ولا مشغّل — ما لم توافق. وإن رفضت ظهرت بطاقاتُ الفيديوهات المستوردة بصورةٍ بديلة من عندنا، وبقي الموقع كلّه يعمل، ولك أن تشغّل أيّ فيديو منها بالموافقة عند مشغّله وحده حين تشاء.',
                        'ولك سحبُ إذنك متى شئت من رابط «خيارك بشأن يوتيوب» أسفل كلّ صفحة، فنعود إلى سؤالك من جديد ويتوقف التحميل من جوجل. ونحفظ في متصفّحك جوابَك وحده حتى لا نعيد السؤال في كل صفحة؛ وهذا الحفظ لازمٌ لتنفيذ اختيارك فلا يحتاج إذناً.',
                        'والفيديوهات التي رُفعت إلى المنصة مباشرةً لا يصل إلى جوجل عنها شيء: ملفُّها عندنا وتُعرض من خوادمنا، ولا يُطلب من يوتيوب فيها صورةٌ ولا مشغّل.',
                        'وأما ما نقرأه نحن من يوتيوب فهو المعلن للعموم وحده: عناوينُ الفيديوهات وأوصافُها وأسماءُ ملقيها وتواريخُ نشرها ومددُها وصورُها وقوائمُ التشغيل. ولا نقرأ إحصاءاتٍ ولا تعليقاتٍ ولا شيئاً عن أيّ مستخدم في يوتيوب.',
                        'ويستطيع صاحب القناة — وهو وحده — أن يستوردها مرةً واحدة، بعد أن يثبت ملكيتها. والإثبات طريقان: أن يضع رمزاً نتيحه له في وصف قناته العلنيّ على يوتيوب فنقرأه من هناك، وهذا لا يمرّ بحسابه في جوجل ألبتة؛ أو أن يسجّل الدخول بحساب جوجل الذي يدير القناة. والثاني اختياريّ، وقد لا يكون متاحاً في هذا النشر أصلاً، ولا نطلبه إلا ممّن اختاره بنفسه.',
                        ['وإن اخترتَ تسجيل الدخول بجوجل فإننا نطلب إذناً بالاطّلاع على اسم قناتك في يوتيوب لا غير، ولمرّةٍ واحدة: نسأل جوجل «أيُّ قناة يديرها هذا الحساب؟» ثم نُبطل الإذن فوراً في اللحظة نفسها. فلا نحفظ رمزاً ولا نُبقي وصولاً متجدّداً إلى حسابك، ولا نقرأ بريدك ولا فيديوهاتك الخاصة ولا شيئاً سوى ذلك. ويمكنك مراجعة ما منحته من أذونات وسحبُه في أيّ وقت من ', { text: 'صفحة أذونات حسابك في جوجل', href: 'https://myaccount.google.com/permissions' }, '.'],
                        // THE LIMITED USE DISCLOSURE. Not a flourish: Google's API Services User
                        // Data Policy requires an app requesting a SENSITIVE scope — which
                        // `youtube.readonly` is — to state in its privacy policy that its use and
                        // transfer of data received from Google APIs follows that policy,
                        // INCLUDING the Limited Use requirements. Missing it is one of the
                        // commonest OAuth verification rejections, and it is checked by reading
                        // this page.
                        //
                        // The sentence is only true because of the paragraph above it: one call,
                        // nothing stored, the grant revoked in the same moment. If that ever
                        // changes — a kept refresh token, a second scope — this claim becomes the
                        // next «ولا يُرسَل إلى يوتيوب... شيء», so it is worded as the promise it is
                        // rather than as boilerplate.
                        ['وما نتلقّاه من واجهات جوجل البرمجيّة فاستعمالُنا له ونقلُه محكومان بـ', { text: 'سياسة بيانات مستخدمي خدمات واجهات جوجل', href: 'https://developers.google.com/terms/api-services-user-data-policy' }, '، بما فيها شرط «الاستعمال المحدود». فلا نستعمل هذه البيانات إلا فيما يظهر لك من وظائف المنصّة، ولا نبيعها ألبتة، ولا نستعملها في إعلانٍ ولا في تقييم جدارةٍ ائتمانيّة، ولا ننقلها إلى أحدٍ إلا بإذنك، أو حيث يوجبه نظام، أو لِما تقتضيه سلامةُ المنصّة من كشف احتيالٍ أو إساءة.'],
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
                        // Was «عند استيراد قناة، وبطلب من صاحبها وحده», which described the API
                        // call and omitted the far larger flow: Google receives a request from
                        // every reader's browser on every page that shows an imported video. A
                        // list of "who receives data" that names the once-per-channel case and
                        // leaves out the once-per-page one is the most misleading shape available.
                        'جوجل (يوتيوب) — من جهتين: قراءةُ بيانات القنوات المستوردة عند الاستيراد وبطلب من صاحب القناة، وهذه لا تخصّ القرّاء؛ وعرضُ الصور المصغّرة والمشغّل للفيديوهات المستوردة، وهذه يطلبها متصفّح كلّ قارئ مباشرةً من خوادم جوجل. انظر قسم «يوتيوب» أعلاه.',
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
                        'وتستطيع حذف حسابك بنفسك من صفحة «الملف الشخصي»، بتأكيد كلمة المرور. يُحذف حينها حسابك وبياناتك الشخصية، وتعليقاتك، وإعجاباتك، واشتراكاتك، ومحفوظاتك، وسجلّا المشاهدة والقراءة، وبلاغاتك؛ وتُحذف معه قنواتك بكل ما فيها من فيديوهات وكتب ومقالات ومنشورات، وتُحذف ملفاتها من التخزين. والحذف نهائي لا رجعة فيه.',
                        'ويبقى بعد الحذف عدّاد المشاهدات على ما شاهدتَه، لأنه مجموع تراكمي لا يدلّ على أحد بعينه، وتبقى التعليقات القديمة التي كُتبت قبل ربط التعليقات بالحسابات، إذ لا شيء يربطها بحسابك.',
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
                        'في المنصة زرُّ إبلاغ على الفيديوهات والكتب والمقالات والمنشورات والتعليقات، يصل إلى إدارة المنصة مباشرة، ويحتاج إلى تسجيل الدخول.',
                        'وإن كان الأمر اعتداءً على حقّك، أو ما لا يسعه زرُّ الإبلاغ، فراسلنا على عنوان التواصل المبيَّن في صفحة «تواصل معنا».',
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
                    // WHAT HAPPENS TO A FILE AFTER IT IS UPLOADED, and it is deliberately placed
                    // IMMEDIATELY BEFORE the YouTube clause rather than beside the upload-rights
                    // one. Read in that order the document says "this is what we do with your
                    // video" and then "and here is the one kind we don't host" — the true shape.
                    // The other order leaves the YouTube clause as the only statement anywhere
                    // about how video reaches a reader, from which both a reader and an outside
                    // reviewer would reasonably conclude that embedding is all this platform does.
                    //
                    // `terms-upload-rights` already grants the licence to «تخزينه ومعالجته
                    // وعرضه». That is the permission; this is the description of what is done
                    // with it, which is a different thing and was missing.
                    id: 'terms-hosting',
                    heading: 'رفعُ المحتوى إلى خوادمنا وعرضُه منها',
                    paragraphs: [
                        'الأصل في هذه المنصة أن المحتوى يُرفَع إليها ويُعرَض منها: يرفع صاحبُ القناة ملفَّ الفيديو أو الكتاب إلى خوادمنا، فيُحفَظ عندنا.',
                        'ويُعالَج الفيديو بعد رفعه آلياً: يُعاد ترميزُه إلى عدّة جودات، ويُقطَّع مقاطعَ تُبَثّ بثّاً متكيّفاً مع سرعة شبكتك، وتُستخرج له صورةٌ مصغّرة. ثم يُعرَض من خوادمنا في مشغّل المنصة، ويصل إليك منها.',
                        'وهذه المعالجة تقتضي حفظَ نسخٍ من ملفك بجودات مختلفة، وهو داخلٌ في الإذن الذي تمنحه المنصة عند الرفع. ومتى حذفتَ المحتوى حُذفت نسخُه كلُّها.',
                        'ولا يُنشَر المرفوع حتى تتمّ معالجتُه ويجتاز الفحص الآليّ المبيَّن أعلاه؛ وقد يمضي على ذلك وقتٌ بحسب طول المادّة.',
                    ],
                },
                {
                    // REQUIRED BY III.A OF YOUTUBE'S API SERVICES TERMS, which says a client's
                    // terms of use must display a link to youtube.com/t/terms and state that
                    // users of the client agree to be bound by it. `Terms.jsx` did not mention
                    // YouTube at all, which is pure omission — there was no design question
                    // behind it, only a renderer that could not display a link.
                    //
                    // Placed before «تعديل الشروط», which is the closing clause: a document's
                    // last section should be about the document.
                    id: 'terms-youtube',
                    heading: 'الفيديوهات المعروضة من يوتيوب',
                    paragraphs: [
                        'وبعض المحتوى المعروض هنا — دون ما سبق — مستوردٌ من يوتيوب، ويُشغَّل من مشغّل يوتيوب نفسه لا من خوادمنا. وتجد على بطاقة كلّ فيديو من هذه علامةً تدلّ على مصدره. ولصاحب القناة أن يرفع الملفَّ الأصليَّ إلى خوادمنا، فيُعرَض حينئذٍ من عندنا كسائر ما رُفِع إلينا.',
                        ['وباستعمالك هذه المنصة فإنك توافق على أن تلتزم بـ', { text: 'شروط خدمة يوتيوب', href: 'https://www.youtube.com/t/terms' }, ' فيما يخصّ هذا المحتوى، فهو معروض بمقتضاها.'],
                        'ونحن لا نملك هذا المحتوى ولا نتحكّم في بقائه: فمتى حذفه صاحبه من يوتيوب أو جعله خاصاً توقّف عرضه هنا، وليس ذلك بأيدينا.',
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
