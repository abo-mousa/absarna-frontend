/**
 * English copy for the app. See `./index.js` for how a locale is chosen and `./ar.js` for the
 * rules about where a string belongs — the namespaces here mirror that file exactly.
 *
 * ## This catalog is deliberately incomplete, and a gap is not a bug
 *
 * <p>`t()` falls back to `ar` for any key missing here, so an untranslated screen renders Arabic
 * rather than a dotted key. {@link TRANSLATED} names the namespaces that are *finished*; the test
 * asserts those are complete key-for-key and prints the rest as the outstanding list. Adding a
 * namespace to that array is how a translation pass is signed off — before that it may be partial,
 * after it, a key added to `ar.js` and forgotten here turns the build red.
 *
 * <p>What is outstanding, and why it is last: the channel owner's dashboard (`channelManage`), the
 * YouTube import (`youtube`, `youtubeOAuth`), the platform admin console (`admin`, `adminReports`)
 * and the legal pages (`legal`). Every one of them is read by somebody who already reads Arabic —
 * an owner managing an Arabic catalogue, a platform moderator, a reader of terms drafted in
 * Arabic — where every namespace here is read by a visitor who may not.
 *
 * ## The one known wart
 *
 * <p><b>Counts have a single form, so `{count} views` renders "1 views".</b> `ar.js` writes its
 * counts inline and defers plural rules deliberately (Arabic has six forms, and a library is what
 * that eventually buys); English has two, which is few enough that the single form is *visible*
 * where in Arabic it was merely a simplification. It is left rather than papered over: fixing it
 * for real means plural selection in `t()` and a second form at every counting call site, which is
 * the same change either language needs and is worth doing once, not twice.
 */
export const en = {

    /** Words that genuinely mean the same thing everywhere they appear. */
    common: {
        loginRequired: 'Sign in to do this',
        today: 'Today',
        yesterday: 'Yesterday',
        loading: 'Loading...',
        loadMore: 'Load more',
        showMore: 'Show more',
        showLess: 'Show less',
        save: 'Save',
        saving: 'Saving...',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        sending: 'Sending...',
        search: 'Search',
        clearSearch: 'Clear search',
        backHome: 'Back to home',
        back: 'Back',
        errorTitle: 'Something went wrong',
        retry: 'Try again',
        noResults: 'No results',
        noContent: 'Nothing here',
        noData: 'No data',
        comingSoon: 'Content is on its way',
        tryAnotherSearch: 'Try another search term or category',
        irreversible: 'This cannot be undone.',
        chooseFile: 'Choose file',
        changeFile: 'Change file',
        noFileChosen: 'No file chosen',
        opensInNewTab: '(opens in a new tab)',
        // Punctuation is locale data too — see the note on the Arabic entry, which uses «،».
        listSeparator: ', ',

        videos: 'Videos',
        books: 'Books',
        articles: 'Articles',
        posts: 'Posts',
        series: 'Series',
        all: 'All',

        hidden: 'Hidden',
        hiddenFromVisitors: 'Hidden from visitors',
        hideFromVisitors: 'Hide from visitors',
        showToVisitors: 'Show to visitors',

        views: '{count} views',
        commentCount: '{count} comments',
        pageCount: '{count} pages',
        videoCount: '{count} videos',
        wordCount: '{count} words',
        readingMinutes: '{count} min',
        readingMinutesLong: '{count} min read',
        originalPublishDate: 'Originally published: {date}',

        allCategories: 'All categories',
        sortBy: 'Sort by: {label}',
        sortNewest: 'Newest',
        sortTitle: 'Title',
    },

    fields: {
        title: 'Title',
        description: 'Description',
        category: 'Category',
        content: 'Content',
        primaryColor: 'Primary colour',
        originalPublishDateOptional: 'Original publish date (optional)',
        speaker: 'Speaker',
        duration: 'Duration',
        originalPublishDate: 'Original publish date',
        username: 'Username',
        usernameRequired: 'Username *',
        fullName: 'Full name',
        fullNamePlaceholder: 'Muhammad Ahmad',
        email: 'Email address',
        emailRequired: 'Email address *',
        password: 'Password',
        passwordRequired: 'Password *',
        confirmPassword: 'Confirm password *',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        gender: 'Gender',
        genderMale: 'Male',
        genderFemale: 'Female',
    },

    meta: {
        // Byte-identical to `ar.js` — the brand is not a translatable string. See the note on
        // `nav.brand` below, and `i18n.test.js`, which pins these against the Arabic entries. The
        // default title already carried both scripts before there was an English build.
        defaultTitle: 'أَبْصَرْنا | Absarna',
        defaultDescription: 'أَبْصَرْنا — an Islamic platform for lectures, books and articles',
        titleSuffix: '{title} | أَبْصَرْنا',
    },

    nav: {
        // THE BRAND IS NEVER TRANSLATED, AND NEVER TRANSLITERATED. «أَبْصَرْنا» is the name of the
        // thing rather than a word describing it, so it reads the same to every reader — the same
        // rule the language switcher's own labels follow, and for a stronger reason: a wordmark
        // that changes script between builds is two identities, and the top of the page is the one
        // place a reader checks they are still where they think they are. `brandAlt` is the
        // unvocalised form the screen reader gets, exactly as in `ar.js`.
        brand: 'أَبْصَرْنا',
        brandAlt: 'أبصرنا',
        menu: 'Menu',
        sideMenu: 'Side menu',
        skipToContent: 'Skip to content',
        lightMode: 'Light mode',
        darkMode: 'Dark mode',
        lightShort: 'Light',
        darkShort: 'Dark',
        upload: 'Upload content',
        uploadShort: 'Upload',
        profile: 'Profile',
        profileShort: 'Account',
        adminPanel: 'Admin panel',
        adminShort: 'Admin',
        logout: 'Sign out',
        logoutShort: 'Out',
        login: 'Sign in',
        register: 'Create account',
        // The language switcher. `language` is the control's accessible name; each locale's own
        // label comes from `LOCALES[...].nativeName`, never from a catalog — «العربية» has to
        // read as Arabic to somebody currently looking at the English build, which is exactly
        // what a translated label would destroy.
        language: 'Language',
        languageSwitchedTo: 'Language: {name}',
    },

    sidebar: {
        manageChannel: 'Manage channel',
        home: 'Home',
        subscriptions: 'Subscriptions',
        watchHistory: 'Watch history',
        bookmarks: 'Saved',
        createChannel: 'Create a channel',
        myChannels: 'My channels',
        yourSubscriptions: 'Your subscriptions',
        discoverChannels: 'Discover other channels',
        moreChannels: 'Show more channels',
        noOtherChannels: 'No other channels',
    },

    searchBar: {
        placeholder: 'Search...',
        label: 'Search',
        noMatches: 'Nothing matches "{query}"',
    },

    errorBoundary: {
        title: 'Sorry — something went wrong',
        fallback: 'Please try again',
        reload: 'Reload',
    },

    errors: {
        generic: 'Something went wrong, please try again',
        offline: 'No internet connection. Check your network and try again',
        timeout: 'That took longer than expected. Please try again',
        rateLimited: 'Too many requests in a short time. Please try again shortly',
        notFound: 'This content does not exist, or is no longer available',
        forbidden: 'You do not have permission to do this',
        server: 'The server had a problem. Please try again later',

        /**
         * Why an action was refused, keyed by the backend's `reason` code. The backend sends codes
         * and never prose, so a code with no entry here falls back to the generic sentence for its
         * status — adding one on that side without adding it here is safe and silent.
         *
         * <p>Every sentence names the reason and then what to do about it, in that order. See the
         * Arabic entries for why: "try again later" on a refusal that will never clear itself is
         * how people learn to ignore the ones that would.
         */
        reasons: {
            CHANNEL_REJECTED: 'This channel was rejected by the platform team, so nothing can be imported into it. Contact us if you believe that is a mistake.',
            CHANNEL_SUSPENDED: 'This channel is suspended, and nothing can be imported into it until the suspension is lifted.',

            YOUTUBE_NOT_VERIFIED: 'You have not proved ownership of the YouTube channel yet. Put the verification code in your channel description, then press "Check".',
            YOUTUBE_NEEDS_OWNER_VERIFICATION: 'This channel was linked by the platform team, which is enough to import and no more. Uploading the original file needs the channel’s own owner to prove ownership by signing in with Google from the YouTube tab.',

            YOUTUBE_OAUTH_NOT_CONFIGURED: 'Verifying with a Google account is unavailable right now. Use the verification code in the channel description instead.',
            YOUTUBE_OAUTH_STATE_INVALID: 'That verification attempt has expired or is no longer valid. Go back to the YouTube tab and start again.',
            YOUTUBE_OAUTH_FAILED: 'Signing in with Google did not complete. Please try again.',
            YOUTUBE_OAUTH_SCOPE_DENIED: 'You did not grant permission to see your YouTube account, which is how we identify your channel. Try again and allow it, or use the verification code instead.',
            YOUTUBE_OAUTH_UNAVAILABLE: 'We could not reach Google just now. Try again later, or use the verification code in the channel description.',
            YOUTUBE_OAUTH_QUOTA_EXHAUSTED: 'The platform’s daily YouTube quota is spent. Use the verification code in the channel description, or try tomorrow.',
            YOUTUBE_OAUTH_CHANNEL_MISMATCH: 'The account you signed in with manages a different YouTube channel from the one linked here. Try again and pick the account that manages the linked channel — if it belongs to a Brand Account, choose that entry in the list.',
            YOUTUBE_OAUTH_NO_CHANNEL: 'The account you chose has no YouTube channel on it. Try again and pick the account that manages your channel.',

            THUMBNAIL_FORMAT_NOT_ALLOWED: 'That image format is not supported. Choose a JPG, PNG or WEBP.',
            THUMBNAIL_TOO_LARGE: 'That image is too large. Choose one under 5 MB.',
            THUMBNAIL_NOT_UPLOADED: 'The image did not finish uploading. Choose the file again.',
            THUMBNAIL_KEY_INVALID: 'The image could not be saved. Choose the file again.',

            YOUTUBE_IMPORT_ALREADY_RUN: 'This channel has already been imported, or an import is running right now.',
            YOUTUBE_NOT_CONFIGURED: 'Importing from YouTube is not enabled on this platform. Please contact the platform team.',
            YOUTUBE_QUOTA_EXHAUSTED: 'The platform’s daily YouTube quota is spent. Please try tomorrow.',

            CURRENT_PASSWORD_REQUIRED: 'This action needs your current password. Enter it and try again.',
            ADMIN_ACCOUNT_CANNOT_BE_DELETED: 'A platform admin account cannot be deleted from here.',
            CURRENT_PASSWORD_INVALID: 'That current password is not correct. Check it and try again.',
            EMAIL_ADDRESS_MISSING: 'Your account has no email address on it. Add one on your profile page and the verification link will be sent by itself.',

            TRANSCODE_NOT_RETRYABLE: 'This video cannot be reprocessed right now: either its processing did not fail, or it was never uploaded here in the first place. Refresh the page to see its current state.',
        },
    },

    auth: {
        login: {
            heading: 'Sign in',
            welcomeBack: 'Welcome back',
            forgotPassword: 'Forgotten your password?',
            submitting: 'Signing in...',
            submit: 'Sign in',
            noAccount: 'No account yet?',
            registerLink: 'Create one',
            stayLoggedIn: 'Keep me signed in',
            stayLoggedInHint: 'Untick this on a shared computer — your session then ends when the browser closes.',
            failed: 'Could not sign in',
            invalidCredentials: 'That username or password is not correct',
        },
        register: {
            heading: 'Create account',
            joinUs: 'Join أَبْصَرْنا',
            submitting: 'Creating your account...',
            submit: 'Create account',
            haveAccount: 'Already have an account?',
            loginLink: 'Sign in',
            created: 'Account created. We have sent a verification link to your email address.',
            failed: 'Could not create the account',
            taken: 'That username or email address is already in use',
            // Four pieces rather than one sentence because two of them are links. English joins
            // with a spaced "and"; the Arabic «و» is prefixed to the word after it, which is why
            // the conjunction is a string here rather than punctuation in the JSX.
            acceptPrefix: 'I accept the',
            acceptTerms: 'Terms of Use',
            acceptConjunction: 'and the',
            acceptPrivacy: 'Privacy Policy',
        },
        sessionExpired: 'Your session has ended. Sign in again to continue',
        forgotPassword: {
            title: 'Forgotten password',
            heading: 'Forgotten your password?',
            instructions: 'Enter your email address and we will send you a link to reset your password.',
            sentHeading: 'Check your email',
            sentBody: 'If that address is registered with us, a password reset link is on its way to it.',
            backToLogin: 'Back to sign in',
            submit: 'Send reset link',
            rememberedIt: 'Remembered it?',
            loginLink: 'Sign in',
            genericError: 'Something went wrong. Please try again later',
        },
        resetPassword: {
            title: 'Reset password',
            heading: 'Reset your password',
            instructions: 'Choose a new password',
            newPassword: 'New password *',
            doneHeading: 'Password reset',
            doneBody: 'You can now sign in with your new password.',
            loginLink: 'Sign in',
            failedHeading: 'Could not reset it',
            requestNewLink: 'Request a new link',
            invalidLink: 'That reset link is not valid',
            expiredLink: 'That link has expired, or is not valid',
            submit: 'Reset password',
        },
        verifyEmail: {
            title: 'Verify email address',
            verifying: 'Verifying your email address...',
            successHeading: 'Your email address is verified',
            successBody: 'You can now comment and create a channel.',
            failedHeading: 'Could not verify it',
            invalidLink: 'That verification link is not valid',
            expiredLink: 'That verification link has expired, or is not valid',
            expiredHelp: 'Sign in, then request a new link from the notice at the top of the page.',
            loginLink: 'Sign in',
        },
        verificationNotice: {
            defaultMessage: 'Verify your email address to do this',
            banner: 'Your account is not verified yet. Open the verification link we emailed you to comment, like, subscribe and create a channel.',
            beforeComment: 'Verify your email address before commenting',
            beforeChannel: 'Verify your email address before creating a channel',
            sent: 'Verification link sent — check your email',
            resend: 'Resend verification link',
            failed: 'Could not send the link. Please try again later',
        },
        passwordMismatch: 'Those passwords do not match',
        passwordTooWeak: 'A password needs at least 8 characters, with an upper-case letter, a lower-case letter, a digit and a symbol',
    },

    validation: {
        usernameRequired: 'A username is required',
        usernameTooShort: 'A username needs at least {min} characters',
        usernameCharacters: 'A username may contain only Latin letters, digits and _',
        usernameTooLong: 'A username may be at most {max} characters',
        fullNameTooLong: 'A name may be at most {max} characters',
        emailTooLong: 'An email address may be at most {max} characters',
        genderRequired: 'Please choose one',
        termsRequired: 'You must accept the Terms of Use and the Privacy Policy',
        ruleLength: 'At least {min} characters',
        ruleUppercase: 'An upper-case letter (A-Z)',
        ruleLowercase: 'A lower-case letter (a-z)',
        ruleDigit: 'At least one digit',
        ruleSpecial: 'A symbol (!@#$...)',
        ruleMaxBytes: '{max} characters at most',
        strengthVeryStrong: 'Very strong',
        strengthStrong: 'Strong',
        strengthMedium: 'Medium',
        strengthWeak: 'Weak',
    },

    home: {
        forYou: 'For you',
        browseAll: 'All videos',
        more: 'More videos',
        subscribed: 'From channels you follow',
        discover: 'Suggestions for you',
        featured: 'Explore',
        loadFailed: 'Could not load this content',
        empty: 'Nothing here yet',
        deleteVideoTitle: 'Delete video',
        deleteVideoConfirm: 'Delete "{title}"? This cannot be undone.',
        visibilityFailed: 'Could not update visibility',
        deleteFailed: 'Could not delete it',
    },

    video: {
        watchAria: 'Watch video: {title}',
        processing: 'Processing',
        transcodeFailed: 'Processing failed',
        review: {
            moreSpansOne: 'and one more place',
            moreSpans: 'and {count} more places',

            /**
             * Whether anyone can see the video. Which of the three applies is the backend's
             * `holds`, never something this file decides — see the Arabic entry for why that
             * split is load-bearing.
             */
            outcome: {
                hidden: {
                    badge: 'Under review',
                    title: 'This video is under review',
                    body: 'It will not be shown to visitors until a moderator has reviewed it.',
                    suffix: ', and it will not be shown to visitors until a moderator has reviewed it.',
                },
                refused: {
                    badge: 'Rejected',
                    title: 'This video was rejected',
                    body: 'It will not be shown to visitors. You can upload a different file.',
                    suffix: ', so it will not be shown to visitors. You can upload a different file.',
                },
                published: {
                    badge: 'Note',
                    title: 'Published, with a note',
                    body: 'The video is published and playing normally, and a moderator will take a look at it.',
                    suffix: ', and the video is published and playing normally, and a moderator will take a look at it.',
                },
            },

            // What was found, per detector and per state, and nothing about who can see it. Every
            // string here is a clause with no final stop — `outcome.*.suffix` finishes it.
            music: {
                held: {
                    body: 'We detected music in the audio',
                    bodyWithSpans: 'We detected music in the audio at {spans}',
                },
                rejected: {
                    body: 'A moderator reviewed this video and found music in it',
                    bodyWithSpans: 'A moderator reviewed this video and found music in it at {spans}',
                },
                advisory: {
                    body: 'There may be background music in the audio',
                    bodyWithSpans: 'There may be background music in the audio at {spans}',
                },
                unchecked: {
                    body: 'The automatic audio check could not be completed',
                    bodyWithSpans: 'The automatic audio check could not be completed',
                },
            },
            nudity: {
                held: {
                    body: 'We detected what may be explicit scenes',
                    bodyWithSpans: 'We detected what may be explicit scenes at {spans}',
                },
                rejected: {
                    body: 'A moderator reviewed this video and found explicit scenes in it',
                    bodyWithSpans: 'A moderator reviewed this video and found explicit scenes in it at {spans}',
                },
                advisory: {
                    body: 'This video may contain explicit scenes',
                    bodyWithSpans: 'This video may contain explicit scenes at {spans}',
                },
                unchecked: {
                    body: 'The automatic video content check could not be completed',
                    bodyWithSpans: 'The automatic video content check could not be completed',
                },
            },
        },
        externalSourceNotice: 'This video is hosted on another platform and cannot be played here.',
        openExternalSource: 'Open the video at its source',
        deleteAria: 'Delete video',
        goToChannelAria: 'Go to the {name} channel',
        loadFailed: 'Could not load the video',
        playbackFailed: 'The video could not be played. Check your connection and try again.',
        unsupported: 'Your browser cannot play this video',
        invalidUrl: 'That video link is not valid',
        watchOnYouTube: 'Watch on YouTube',
        watchVideo: 'Watch video',
        quality: 'Quality',
        controls: {
            player: 'Video player',
            play: 'Play',
            replay: 'Play again',
            pause: 'Pause',
            seek: 'Playback position',
            timeOf: '{current} of {total}',
            // English has one form where Arabic needs two; both entries are filled because the
            // call site picks between them by the Arabic rule (VideoPlayer.jsx).
            seekSecondsFew: '{seconds} seconds',
            seekSeconds: '{seconds} seconds',
            mute: 'Mute',
            unmute: 'Unmute',
            volume: 'Volume',
            airplay: 'Play on another screen',
            buffering: 'Loading',
            enterFullscreen: 'Full screen',
            exitFullscreen: 'Exit full screen',
        },

        settings: {
            label: 'Player settings',
            speed: 'Playback speed',
            normalSpeed: 'Normal',
            loop: 'Loop',
            pictureInPicture: 'Picture in picture',
        },
        qualityLabels: {
            auto: 'Auto',
            audio: 'Audio only',
        },
        seriesPart: 'Part {index} of {total}',
        next: 'Next',
        previous: 'Previous',
        related: 'You may also like',
    },

    books: {
        title: 'Library',
        metaDescription: 'The Islamic book library on أَبْصَرْنا',
        searchPlaceholder: 'Search for a book...',
        empty: 'No books',
        emptyDescription: 'Books are on their way',
        read: 'Read',
        download: 'Download',
        notFound: 'That book does not exist',
        backToLibrary: 'Back to the library',
        tapToRead: 'Tap to read',
        stoppedAtPage: 'You stopped at page {page}',
        hideReader: 'Hide the reader',
        continueReading: 'Continue reading',
        readOnline: 'Read online',
        downloadPdf: 'Download PDF',
        emptyOnChannel: 'No books yet',
        loadFailed: 'Could not load the books',
        noFile: 'There is no file available for this book',
    },

    pdfReader: {
        loadFailed: 'Could not load the file —',
        openInNewTab: 'Open the file in a new tab',
        contents: 'Contents',
        search: 'Search',
        noContents: 'This file has no table of contents',
        searchPlaceholder: 'Search inside the file...',
        searching: 'Searching the file...',
        resultPage: 'Page {page}',
        nextPage: 'Next page',
        previousPage: 'Previous page',
        page: 'Page',
        goToPage: 'Go to page',
        ofPages: 'of {total}',
    },

    articles: {
        title: 'Articles',
        metaDescription: 'Islamic articles on أَبْصَرْنا',
        searchPlaceholder: 'Search for an article...',
        empty: 'No articles',
        loadFailed: 'Could not load the article',
        backToArticles: 'Back to articles',
        emptyOnChannel: 'No articles yet',
    },

    series: {
        badge: 'Series',
        partOf: 'From the series: {title}',
        notFound: 'That series does not exist',
        backToChannel: 'Back to the {name} channel',
        empty: 'No videos in this series yet',
        emptyOnChannel: 'No series yet',
        hiddenBadge: 'Hidden from visitors',
        hiddenNoticeTitle: 'This series is hidden from visitors',
        hiddenNoticeBody: 'Nobody but you can see this series, because it holds no published video: its videos are hidden, or still processing, or held for review, or none have been added yet.',
        manageInDashboard: 'Manage it in the channel dashboard',
    },

    channel: {
        notFound: 'That channel does not exist',
        loadFailed: 'Could not load the channel',
        subscriberCount: '{count} subscribers',
        manage: 'Manage channel',
        subscribed: 'Subscribed',
        subscribe: 'Subscribe',
        unsubscribe: 'Unsubscribe',
        subscribeToggleAria: 'Subscribe to this channel',
        unsubscribeConfirmAria: 'Press again to unsubscribe',
        noVideos: 'No videos yet',
        noPosts: 'No posts yet',
        searchVideos: 'Search this channel’s videos',
        noVideosMatch: 'No videos in this channel match your search',

        /**
         * Taking over a channel the platform built for someone who was not on it. Written in the
         * third person on purpose — see the Arabic entry: this banner sits on a PUBLIC page, so
         * most of its readers are not the person it concerns.
         */
        claim: {
            banner: 'A page prepared by the أَبْصَرْنا team',
            bannerBody: 'We gathered this page from its owner’s YouTube channel, and they have not taken it over yet. The videos play from YouTube as they are, and the views and revenue stay with the channel’s owner.',
            cta: 'Is this your channel? Take it over',
            ctaSignedOut: 'Is this your channel? Sign in to take it over',
            removeInstead: 'Ask us to remove the page',
            title: 'Take over this channel',
            intro: 'To take this channel over, prove that you own the YouTube channel linked to it. The linked channel cannot be changed — the proof is about that channel alone.',
            linkedChannel: 'Linked YouTube channel',
            withGoogle: 'Prove it by signing in with Google',
            withGoogleHint: 'The quickest and most reliable way: just sign in with the account that owns the channel.',
            withToken: 'Or prove it through the channel description',
            withTokenOnly: 'Prove it through the channel description',
            tokenStep1: 'Copy this code:',
            tokenStep2: 'Put it in your YouTube channel description and save.',
            tokenStep3: 'Then press "Check". You can remove the code once the check succeeds.',
            getToken: 'Get the code',
            check: 'Check',
            notYet: 'We have not found the code in the channel description yet. YouTube can take a minute — save the description, then try again.',
            success: 'Channel taken over. It is yours now.',
            failed: 'Could not take the channel over',
        },
    },

    consent: {
        label: 'Your choice about YouTube content',
        title: 'YouTube videos inside this site',
        body: 'Some videos here are shown straight from YouTube, and watching them with us is the same as watching them there: Google sees that you are watching, exactly as if you had opened YouTube yourself. We load nothing from them before you allow it; if you do not, the site carries on working as usual, and anything we host ourselves plays from us either way.',
        more: 'What reaches Google?',
        grant: 'Allow',
        deny: 'Refuse',
        footerLink: 'Your choice about YouTube',
        playerBody: 'This video is shown from YouTube, and watching it here is the same as watching it there: Google sees that you are watching, exactly as if you had opened it yourself. Your permission covers YouTube videos across the whole site, and you can withdraw it at any time from the foot of the page.',
        playerAllow: 'Allow and play',
    },

    // The page Google sends the owner back to after "verify with Google".
    youtubeOAuth: {
        title: 'YouTube channel verification',
        verifying: 'Verifying your channel...',
        success: 'Your ownership of the channel is verified',
        failedHeading: 'Verification did not complete',
        denied: 'You cancelled the Google sign-in, so nothing was verified.',
        invalidLink: 'The return link from Google is not valid, or is incomplete.',
        tokenStillWorks: 'You can always verify by putting the code in your channel description instead.',
        backToChannel: 'Back to the YouTube tab',
    },

    youtube: {
        /**
         * Said before the import button is pressed, because the consequence is not reversible by
         * the owner and is not something "import" suggests: the channel leaves the site until a
         * platform admin has looked at what arrived. Worded as a reason rather than a warning \u2014
         * an owner told only "your channel will be hidden" reads it as a punishment.
         */
        reviewOnImport: 'Once the import starts, your channel is hidden from visitors until the platform team has reviewed it. Imported videos do not go through the content checks a direct upload does, so this review is what stands in their place. Anything you published yourself is visible again the moment it is approved.',
        reviewPending: 'Your channel is awaiting review because of the import, and is hidden from visitors until it is approved.',

        heading: 'Import from YouTube',
        intro: 'Import your videos and playlists from your YouTube channel, once.',
        sourceLabel: 'Your YouTube channel URL',
        sourcePlaceholder: 'https://youtube.com/@yourchannel',
        // Names all three forms because the canonical UC… id appears nowhere in YouTube's own
        // interface, and someone who only knows the handle would otherwise assume they cannot.
        sourceHint: 'Paste the channel URL, the @handle, or the channel id',
        link: 'Link channel',
        linking: 'Linking...',
        foundChannel: 'Found the channel: {title}',

        verifyHeading: 'Prove you own the channel',
        // Spells out where the description actually lives: "add it to your channel description"
        // assumes the owner knows that means YouTube Studio → Customisation → Basic info, which
        // is three levels deep and not called "description" at the top level.
        verifyIntro: 'To prove the channel is yours, put the code below in your YouTube channel description. In practice nobody else will see it, and you can remove it as soon as the check succeeds.',
        verifyStep1: '1. Copy the code:',
        verifyStep2: '2. Open YouTube Studio → Customisation → Basic info, paste it into the "Description" box, and press "Publish".',
        verifyStep3: '3. Come back here and press "Check".',
        verifyStep4: '4. Once the check succeeds you can remove the code from your description.',
        openStudio: 'Open YouTube Studio',
        // YouTube's API can lag a minute behind a save; without saying so, a correct attempt reads
        // as a failure and people redo work they already did right.
        verifyPatience: 'If the check does not succeed straight away, wait a minute and try again \u2014 YouTube needs time to update its data.',
        copyToken: 'Copy code',
        tokenCopied: 'Code copied',
        tokenCopyHint: 'Press the code to copy it',
        // Clipboard access is refused outside a secure context and by some privacy settings. The
        // code is selected for them, so copying is one keystroke rather than a careful drag.
        tokenCopyManually: 'The code is selected \u2014 copy it manually (Ctrl+C)',
        verify: 'Check',
        verifying: 'Checking...',
        // The overwhelmingly common failure: YouTube's API has not caught up with the save yet.
        notFoundYet: 'We have not found the code in the channel description yet. YouTube can take a minute \u2014 try again.',
        verified: 'Your ownership of this channel is verified',
        verifiedByAdmin: 'This channel was linked by the platform team',

        oauth: {
            button: 'Verify with a Google account',
            redirecting: 'Taking you to Google...',
            hintUnlinked: 'The quickest way: sign in with the Google account that manages your channel, and we link and verify it in one step without changing anything on YouTube.',
            hintLinked: 'Sign in with the Google account that manages this channel and you will not need to edit its description.',
            hintUpgrade: 'If you own the channel, sign in with the Google account that manages it to prove ownership yourself \u2014 that is what lets you upload original files.',
            orManual: 'Or link the channel by its URL and verify with a code in its description:',
            orToken: 'Or put the verification code in the channel description:',
            startFailed: 'Could not start verification with Google. Try again, or use the verification code.',
        },

        // Admin-only. Worded as an assertion the admin is making, not as a step being skipped \u2014
        // it is a different check, not a shortcut past one, and it is recorded as such.
        adminAttest: 'Link as platform admin',
        adminAttesting: 'Linking...',
        adminAttestHint: 'Platform team only: for a channel created on its owner\u2019s behalf, where a verification code cannot be added to their description.',
        adminAttestWarning: 'An admin link permits importing only. Uploading the original file in place of a YouTube link needs the channel owner\u2019s own verification.',
        adminAttestFailed: 'Could not link it. Check the URL and try again.',
        // The "check" button's own failure \u2014 the request never got an answer worth reading. Not
        // the same as a check that ran and found no code.
        checkFailed: 'Could not check just now. Try again shortly.',

        /**
         * Confirming that an imported catalogue's metadata is the owner's own work.
         *
         * <p>Titles read through YouTube's API may only be kept for thirty days. This platform
         * keeps them indefinitely on purpose \u2014 the importer never overwrites a title, because an
         * owner may have corrected it here \u2014 and the way out is not to delete them but to hold
         * them on a different basis: the owner wrote them, so once they have read them and said
         * so, what we hold is their submission rather than our copy of someone else's data.
         *
         * <p><b>The affirmation sentence itself is deliberately not here.</b> It is served by the
         * backend and rendered from the response, because the wording shown has to be the wording
         * the record names. A copy in this file could not be told apart from the real one.
         */
        adoption: {
            heading: 'Confirm your imported content\u2019s details',
            intro: 'The titles, descriptions and speaker names in your imported content were read from YouTube. Confirming that they are your own work is what makes them your data with us \u2014 held and shown as your content, rather than as our copy of somebody else\u2019s.',
            // Says what REMAINS, unlike the import line above it: that is work the platform does
            // for the owner, and this is work the owner does themselves.
            remaining: '{count} of {total} still awaiting confirmation',
            allConfirmed: '{count} items confirmed',
            open: 'Review and confirm',
            done: 'Every imported item in this channel is confirmed. Nothing is left.',
            nothingImported: 'This channel has no content imported from YouTube.',
            // canAdopt === false: an admin linked this channel, so the owner's own proof is
            // missing. Said as the step that is left, not as a refusal.
            needsOwnerVerification: 'You cannot confirm until you have proved you own the YouTube channel yourself. An admin link is enough to import, but confirming is your own statement about your own content, so nobody can make it for you. Prove ownership above, then come back here.',
            // Says the CONSEQUENCE, not the task: "confirm your details" is a chore with nothing
            // in it for the owner, while "we re-read them from YouTube monthly and replace them"
            // is a fact about their own page. Both are true; only the second gets acted on.
            noticeTitle: '{count} items are awaiting your confirmation',
            noticeBody: 'The titles, descriptions and speaker names on these items were read from YouTube and you have not confirmed them yet. Until you do, we re-read them from YouTube every month and what is written here is replaced by what is there \u2014 anything you edit or confirm stays as you left it.',
            confirmPage: 'I confirm this page ({count})',
            confirming: 'Confirming...',
            confirmed: '{count} items confirmed',
            confirmFailed: 'Could not save the confirmation. Try again.',
            editTitle: 'Correct the title and description',
            // Said above the list, because correcting a title before confirming it is the better
            // outcome and an owner who assumes the text is fixed will not try.
            editHint: 'If a title or description is wrong, correct it before confirming \u2014 a correction is a clearer statement of ownership than an agreement.',
        },

        importHeading: 'The import',
        importIntro: 'Your videos will be imported, and your playlists as series. This happens once.',
        startImport: 'Start the import',
        retryImport: 'Try again',
        running: 'Importing... you can leave this page, the work carries on.',
        succeeded: '{count} videos imported',
        failed: 'The import failed: {reason}',
        refresh: 'Refresh',
        // The count climbs during the walk \u2014 written per committed page, not once at the end \u2014
        // so a multi-hour import shows progress instead of a spinner over a zero.
        progress: '{count} videos imported',
        // YouTube's own pageInfo.totalResults, hence the "~": the channel's video count as
        // YouTube reports it, not a number we counted.
        progressOfTotal: '{count} of ~{total} videos imported',

        // PARTIAL. Not a failure, and worded so it does not read as one: a catalogue larger than
        // the platform's shared daily YouTube quota reaches this every day until it is finished.
        paused: 'The import paused and saved its place. Press "Continue the import" to carry on from where it stopped.',
        pausedReason: 'Reason: {reason}',
        resumeImport: 'Continue the import',
        pausedToast: 'The YouTube import paused \u2014 you can continue it from where it stopped.',

        // The backend's `importReason` on a run \u2014 a code, worded here. Kept apart from
        // `errors.reasons` because these are not a request being refused: they describe a run that
        // is already going, or has stopped. A code with no entry falls back to the English
        // `importMessage`, so the two repos still deploy separately.
        importReasons: {
            YOUTUBE_RETRYING: 'YouTube is not responding just now, and we will retry automatically in a moment. There is nothing for you to do.',
            YOUTUBE_UNREACHABLE: 'YouTube did not respond after several attempts, so we stopped the import and saved its place. Wait a little, then press "Continue the import".',
            YOUTUBE_QUOTA_EXHAUSTED: 'The platform\u2019s daily YouTube quota is spent. Continue the import tomorrow and it will pick up where it stopped.',
        },
        startFailed: 'Could not start the import: {reason}',

        /**
         * The daily catch-up. <b>These lines are the only place it is visible.</b> It has no
         * button, no progress and nothing to poll, so an owner with no copy here could not tell
         * "the platform checks every day and there was nothing new" from "the platform stopped
         * looking". The second is the one worth being able to rule out.
         */
        autoUpdate: {
            heading: 'Automatic updates',
            active: 'We check your YouTube channel once a day and publish anything newly posted there.',
            soon: 'Automatic updates start within a day, after which we check your channel once a day.',
            // A refresh reads the NEWEST page, so running it against a half-walked catalogue
            // would be starting from the wrong end.
            afterImport: 'Automatic updates start once the import has finished.',
            afterApproval: 'Automatic updates start once the platform team has approved the import.',
            justNow: 'just now',
            // The "nothing new" half is the point: it is the ordinary answer on almost every day,
            // and silence would read as a broken feature.
            lastCheckedNothing: 'Last checked {when} \u2014 nothing new',
            lastCheckedAddedOne: 'Last checked {when} \u2014 we added one video',
            lastCheckedAdded: 'Last checked {when} \u2014 we added {count} videos',
            // A refresh has no button, so this never asks for an action: the next day's check is
            // the retry.
            failed: 'The last check did not succeed, and we will try again automatically.',
            failedReason: 'The last check did not succeed: {reason} We will try again automatically.',
            reasons: {
                YOUTUBE_UNREACHABLE: 'YouTube did not respond.',
                YOUTUBE_QUOTA_EXHAUSTED: 'The platform\u2019s daily YouTube quota is spent.',
            },
        },

        badge: 'YouTube',
        uploadOriginal: 'Upload the original file',
        uploadingOriginal: 'Uploading... {progress}%',
        uploadedOriginal: 'Original file uploaded \u2014 it now plays from the platform',
        uploadOriginalFailed: 'Could not upload the original file: {reason}',
        // Only an owner's own proof licenses hosting the file; an admin's assertion does not.
        uploadOriginalNeedsOwner: 'Uploading the original file needs the channel owner\u2019s own verification',
        linkFailed: 'We could not find that channel. Check the URL and try again.',
    },

    createChannel: {
        title: 'Create a channel',
        heading: 'Create a new channel',
        subheading: 'Your channel goes live the moment you create it, and you can publish straight away.',
        nameLabel: 'Channel name *',
        namePlaceholder: 'For example: Muhammad Elhamy',
        slugLabel: 'Slug *',
        slugHint: 'Lower-case letters, digits and hyphens only',
        descriptionPlaceholder: 'Channel description...',
        submitting: 'Creating...',
        submit: 'Create channel',
        youtubeLabel: 'Your YouTube channel URL (optional)',
        youtubeHint: 'If you have content on YouTube, you can import it later from the "Import from YouTube" tab in the channel dashboard',
        youtubeFetch: 'Fetch details',
        youtubeFetching: 'Fetching...',
        youtubeFetched: 'Channel details fetched: {title}',
        youtubeFound: 'Channel: {title}',
        youtubeWillLink: 'The channel will be linked automatically once it is created, and you can then start the import.',
        youtubeLinkedAfterCreate: 'Channel linked — start the import here',
        youtubeLinkFailedAfterCreate: 'The channel was created, but could not be linked to YouTube. You can link it here.',
        youtubeFetchFailed: 'We could not find that channel. Check the URL and try again.',
        created: 'Channel created, and it is live now.',
        failed: 'Could not create the channel',
    },

    /**
     * The channel owner's dashboard. Its five content forms share `fields.*` for labels and
     * differ only in their headings and outcome messages.
     */
    channelManage: {
        title: 'Manage channel',
        titleFor: 'Manage {name}',
        notFound: 'Channel not found',
        notFoundDescription: 'We could not find this channel',
        forbidden: 'Not allowed',
        forbiddenDescription: 'You do not have permission to manage this channel',

        tabs: {
            videos: 'Videos',
            books: 'Books',
            articles: 'Articles',
            posts: 'Posts',
            comments: 'Comments',
            youtube: 'Import from YouTube',
            settings: 'Channel settings',
        },

        subtitle: 'Manage channel',
        viewChannel: 'View channel',
        navLabel: 'Channel management sections',
        sections: {
            content: 'Content',
            community: 'Community',
            channel: 'Channel',
        },
        importIndicator: {
            running: 'YouTube import running',
            paused: 'YouTube import paused',
            // Named as the work rather than as "YouTube", because that is what an owner will be
            // looking for once the import itself is long finished.
            confirm: 'Imported content awaiting your confirmation',
        },

        emptyContent: 'Nothing here yet',

        searchContent: 'Search your content',
        searchVideos: 'Search your videos',
        searchBooks: 'Search your books',
        searchArticles: 'Search your articles',
        searchPosts: 'Search your posts',
        // Never "nothing here yet" while a term is active: that is a claim about the channel, and
        // an owner who believed it would re-upload something they already have.
        searchNoMatches: 'Nothing matches your search',
        edit: 'Edit',

        videoStatus: {
            processing: 'Processing',
            processingHint: 'The server is preparing this video. It is not shown to visitors until processing finishes, and there is no notification \u2014 refresh the page in a little while.',
            failed: 'Processing failed',
            // Says what failed, what did NOT fail (the file is still on the servers), and what to
            // do. The last part matters most: before the retry button existed the only way out
            // was deleting the video and uploading it again from scratch.
            failedHint: 'Processing this file did not complete. The original is still stored, so there is no need to upload it again \u2014 press "Reprocess" to try once more. If it keeps failing, the file itself most likely cannot be read.',
            retry: 'Reprocess',
            retrying: 'Sending...',
            // Said as a fact about YouTube, not as an error of ours or theirs: the uploader
            // deleted it or made it private, and nobody here did anything wrong.
            youtubeGone: 'This video is no longer on YouTube',
            youtubeGoneHint: 'It was deleted there or made private, so it no longer plays here, and we have hidden it from visitors until you decide. We have not deleted it: its comments, likes and watch history are intact. You can upload the original file so it plays from our servers, edit its details and keep it, or delete it.',
            // The quietest thing on the row by design \u2014 it is true of every row of a freshly
            // imported catalogue, and a warning repeated two thousand times is how an owner learns
            // to stop reading the moderation notices underneath it.
            needsConfirming: 'Awaiting your confirmation',
            needsConfirmingHint: 'We read these details from YouTube. Unless you confirm or edit them, we re-read them from YouTube every month and whatever is written here is replaced.',
            retryQueued: 'The video is back in the processing queue.',
            retryFailed: 'Could not reprocess it.',
        },
        underReviewImport: 'Your channel is hidden from visitors until the platform team has reviewed what you imported from YouTube. You can carry on uploading and editing here in the meantime, and everything appears the moment it is approved.',
        underReview: 'Your channel is hidden from visitors until the platform team has reviewed it. You can carry on uploading and editing here in the meantime.',

        editTitle: 'Edit content',
        editYoutubeNote: 'This edit appears on \u0623\u064e\u0628\u0652\u0635\u064e\u0631\u0652\u0646\u0627 only and changes nothing on YouTube.',

        /**
         * "The default picture" rather than "no picture": there is always one \u2014 the frame the
         * server cut, or the YouTube poster \u2014 and telling an owner there is none when a visitor
         * can see one would be false. What the copy has to carry is whose picture it is.
         */
        thumbnail: {
            label: 'Video picture',
            usingCustom: 'This is a picture you chose yourself.',
            usingDefault: 'The default picture, taken from the video by the server.',
            choose: 'Choose a picture',
            replace: 'Replace picture',
            remove: 'Remove',
            uploading: 'Uploading...',
            saved: 'Video picture saved.',
            removed: 'The default picture is back.',
            failed: 'Could not save the picture: {reason}',
            unsupported: 'That image format is not supported. Choose a JPG, PNG or WEBP.',
            tooLarge: 'That image is too large. Choose one under 5 MB.',
            hint: 'JPG, PNG or WEBP, 5 MB at most. 1280\u00d7720 works best.',
            // Says the video is ALREADY published and this is optional: the dialog opens by itself
            // the moment an upload succeeds, which is exactly the shape of a required step.
            afterPublishTitle: 'Video published',
            afterPublishBody: 'The video is already published. You can choose a picture for it now, or leave it and the server will take one from the video \u2014 and you can change it later by editing the video.',
            afterPublishDone: 'Done',
        },

        channelName: 'Channel name',

        forms: {
            uploadingProgress: 'Uploading {progress}%',
            video: {
                heading: 'Upload a video',
                fileLabel: 'Video file',
                fileHint: 'The upload starts as soon as you choose a file, and you can fill in the details while it runs. Nothing is shown to viewers until you press "Publish video".',
                submit: 'Publish video',
                listHeading: 'My videos ({count})',
                uploaded: 'Video uploaded',
                published: 'Video published',
                uploadFailed: 'Could not upload the video: {reason}',
                action: 'Publish video',
            },
            book: {
                heading: 'Add a book',
                fileLabel: 'PDF file',
                fileHint: 'The upload starts as soon as you choose a file, and you can fill in the details while it runs. The book is not shown until you press "Publish book".',
                uploading: 'Uploading...',
                pagesLabel: 'Number of pages',
                submit: 'Publish book',
                listHeading: 'My books ({count})',
                uploaded: 'Book uploaded',
                published: 'Book published',
                uploadFailed: 'Could not upload the book: {reason}',
                action: 'Publish book',
            },
            article: {
                heading: 'Write an article',
                submit: 'Publish article',
                listHeading: 'My articles ({count})',
                published: 'Article published',
                failed: 'Could not publish the article: {reason}',
            },
            post: {
                heading: 'Post an update',
                submit: 'Post',
                listHeading: 'My posts ({count})',
                published: 'Update posted',
                failed: 'Could not post the update: {reason}',
            },
        },

        seriesSelectLabel: 'Series (optional)',
        seriesSelectNone: 'No series',
        seriesOrderLabel: 'Position in the series',
        newSeriesHeading: 'New series',
        seriesTitleLabel: 'Series title',
        createSeries: 'Create series',
        seriesListHeading: 'My series ({count})',
        seriesCreated: 'Series created',
        seriesCreateFailed: 'Could not create the series: {reason}',
        seriesDeleted: 'Series deleted',
        seriesDeleteFailed: 'Could not delete the series',
        deleteSeries: 'Delete series',
        deleteSeriesConfirm: 'Delete the series "{title}"? The videos themselves stay \u2014 they are only detached from the series.',

        seriesView: {
            all: 'All videos',
            bySeries: 'By series',
            backToSeries: 'All series',
            // Uploads never assigned, and imports found in no playlist. Without this entry a view
            // organised by series would lose them.
            noSeries: 'Videos with no series',
            noSeriesHint: 'Videos that have not been added to any series',
            seriesVideosHeading: '{title} ({count})',
            allHidden: 'Series hidden from visitors',
            someHidden: '{hidden} of {count} hidden',
            hide: 'Hide series',
            show: 'Show series',
            hidden: 'The series and every video in it are now hidden',
            shown: 'The series is visible again. Videos you hid yourself stay hidden.',
            visibilityFailed: 'Could not change the series\u2019 visibility',
            edit: 'Edit series',
            saved: 'Series saved',
            saveFailed: 'Could not save the series',
            deleteTitle: 'Delete the series "{title}"',
            // Two separate choices, the keeping one first: on an imported channel the second
            // deletes a whole course in one click.
            deleteKeep: 'Delete the series only',
            deleteKeepHint: 'The videos stay published as they are, detached from the series.',
            deleteWithVideos: 'Delete the series and {count} videos',
            deleteWithVideosHint: 'The videos are deleted permanently, with their files and comments. This cannot be undone.',
            deletedWithVideos: 'The series and its videos were deleted',
        },

        commentsHeading: 'Comments on your channel\u2019s content ({count})',
        noComments: 'No comments yet',
        commentHidden: '(hidden)',
        commentPinned: 'Pinned',
        pin: 'Pin',
        unpin: 'Unpin',
        hide: 'Hide',
        show: 'Show',
        commentUpdateFailed: 'Could not update the comment',

        deleteConfirm: 'Delete "{label}"?',
        deleted: 'Deleted',
        deleteFailed: 'Could not delete it',
        visibilityFailed: 'Could not update visibility',
        saved: 'Changes saved',
        saveFailed: 'Could not save',

        resumePrompt: 'We found an unfinished upload of "{name}". Would you like to resume it?',
        /**
         * Deliberately does not say "failed": the server is usually still assembling a
         * multi-gigabyte object, confirm is idempotent on the session id, and one more click
         * finishes the job \u2014 "failed" would send an owner back to re-upload the whole file.
         */
        publishSlow: '{action} is taking longer than usual. Nothing you uploaded is lost \u2014 try again shortly.',
        publishFailed: 'Could not {action}: {reason}',
    },

    comments: {
        loadMore: 'Show more comments',
        heading: 'Comments ({count})',
        commentingAs: 'Commenting as',
        placeholder: 'Write your comment here...',
        submit: 'Post comment',
        loginPrompt: 'Sign in',
        loginPromptSuffix: 'to leave a comment',
        empty: 'No comments yet — be the first.',
        reply: 'Reply',
        replyPlaceholder: 'Write your reply...',
        submitReply: 'Post reply',
        editAria: 'Edit comment',
        deleteAria: 'Delete comment',
        deleteTitle: 'Delete comment',
        deleteConfirm: 'Delete this comment? This cannot be undone.',
        createFailed: 'Could not post the comment',
        replyFailed: 'Could not post the reply',
        editFailed: 'Could not edit the comment',
        deleteFailed: 'Could not delete the comment',
        // A dayjs format string, not a sentence — its punctuation is layout rather than copy.
        absoluteDateFormat: 'D MMMM YYYY, HH:mm',
    },

    likes: {
        add: 'Like',
        remove: 'Unlike',
        count: '{count} likes',
    },
    bookmarks: {
        title: 'Saved',
        add: 'Save for later',
        remove: 'Remove from saved',
        clearAll: 'Clear all',
        clearConfirm: 'Remove everything you have saved?',
        clearFailed: 'Could not clear your saved items',
        loadFailed: 'Could not load your saved items',
        empty: 'Nothing saved here yet',
        emptyDescription: 'Press the save icon on any video, book or article to add it here',
    },

    history: {
        title: 'History',
        clear: 'Clear history',
        clearWatchConfirm: 'Clear your whole watch history?',
        clearReadConfirm: 'Clear your whole reading history?',
        clearFailed: 'Could not clear the history',
        loadFailed: 'Could not load the history',
        emptyWatch: 'No watch history',
        emptyRead: 'No reading history',
        emptyWatchDescription: 'Videos you watch will appear here',
        emptyReadDescription: 'Books you read will appear here',
    },

    subscriptions: {
        title: 'My subscriptions',
        unsubscribeConfirm: 'Unsubscribe from this channel?',
        unsubscribeFailed: 'Could not unsubscribe',
        loadFailed: 'Could not load your subscriptions',
        empty: 'No subscriptions',
        emptyDescription: 'Subscribe to channels to follow what they publish',
        visit: 'Visit',
        unsubscribe: 'Cancel',
        // First letter shown in the avatar when a subscription row has no channel name.
        avatarFallback: 'C',
    },

    profile: {
        title: 'Profile',
        changePassword: 'Change password',
        currentPassword: 'Current password',
        newPassword: 'New password',
        confirmNewPassword: 'Confirm new password',
        passwordChanged: 'Your password has been changed',
        passwordChangeFailed: 'Could not change the password',
        bioLabel: 'About you',
        bioPlaceholder: 'Write a short bio...',
        saved: 'Profile saved',
        saveFailed: 'Could not save',
        emailChangeNeedsPassword: 'Changing your email address needs your current password.',
        verification: {
            heading: 'Email verification',
            verified: 'Your email address is verified.',
            notVerified: 'Your email address is not verified yet. You cannot comment, like, subscribe or create a channel until it is.',
        },
        deleteAccount: {
            heading: 'Delete account',
            intro: 'Deleting your account is permanent and cannot be undone.',
            whatGoes: 'This deletes: your account and personal details, your comments, your likes, your subscriptions, your saved items, your watch and reading history, and your reports.',
            channelsGo: 'It also deletes your channels ({count}) with every video, book, article and post in them, and removes their files from storage.',
            button: 'Delete my account permanently',
            confirmTitle: 'Confirm account deletion',
            confirmBody: 'Enter your password to confirm. This is permanent.',
            confirmButton: 'Confirm deletion',
            deleting: 'Deleting...',
            done: 'Your account has been deleted',
            failed: 'Could not delete the account',
        },
    },

    admin: {
        title: 'Admin panel',
        manageChannels: 'Manage channels',
        // Labelled rather than left as a bare <nav>, because a page can hold several and a screen
        // reader lists them by name.
        nav: {
            label: 'Admin panel sections',
        },
        /**
         * The moderation queue across every detector. Platform-admin only, and the only way a
         * held video ever becomes visible again \u2014 if nobody reads this screen, uploads sit in it
         * forever, which is why the backlog count is on the heading rather than buried.
         */
        review: {
            title: 'Content review',
            short: 'Review',
            // One sub-tab per detector, each with its own backlog count, because "how big is the
            // queue" is a different question for each.
            tabs: {
                music: 'Music',
                nudity: 'Explicit content',
                all: 'All',
            },
            depth: '{count}',
            // The reviewer-facing name of each state. These used to render as the raw enum \u2014
            // HELD, ADVISORY, UNCHECKED \u2014 in an app whose rule is that every user-facing string
            // reaches the screen through t().
            states: {
                held: 'Held',
                advisory: 'Note',
                unchecked: 'Not scanned',
                cleared: 'Cleared',
                rejected: 'Rejected',
                clean: 'Clean',
            },
            // Shown in the decision panel when the video carries a finding from another detector.
            // Not a demand to act on it \u2014 a warning against deciding blind.
            alsoFlagged: 'Also detected in:',
            empty: 'Nothing is awaiting review',
            emptyDescription: 'Everything the automatic scan flagged has been reviewed.',
            // The queue is fetched UNFILTERED \u2014 one page holds the findings of every detector, so
            // a reviewer may open a tab whose backlog count is large and find nothing on the page
            // they happen to be on. Saying so is the difference between a working pager and an
            // empty screen that reads as a bug.
            pagesSpanTypes: 'A single page holds results from every kind of scan, so a tab can be empty on one page and full on another.',
            emptyOnThisPage: 'Nothing of this kind on this page',
            emptyOnThisPageDescription: '{count} are still awaiting review on other pages. Move between pages below.',
            // Per TYPE, because "possibly music under speech" and "possible explicit content" are
            // different problems and one shared sentence would serve neither.
            reason: {
                music: {
                    held: 'Music was detected in this video, and it is held from visitors.',
                    advisory: 'There may be background music under the speech. The video is published.',
                    unchecked: 'The scan could not be completed. The video is published and awaiting review.',
                    cleared: 'Reviewed and cleared.',
                    rejected: 'Reviewed and rejected.',
                },
                nudity: {
                    // UNCHECKED HIDES for this type \u2014 explicit content fails closed \u2014 so it must
                    // not be worded like music's, which correctly says the clip is published. The
                    // row's held/published column reads the backend's `holds`; these sentences
                    // have to agree with it.
                    held: 'Scenes that may be explicit were detected in this video, and it is held from visitors.',
                    advisory: 'This video may contain explicit scenes. It is published and awaiting review.',
                    unchecked: 'The scan could not be completed, and the video is held from visitors until it has been reviewed.',
                    cleared: 'Reviewed and cleared.',
                    rejected: 'Reviewed and rejected.',
                },
            },
        },
        musicReview: {
            title: 'Music review',
            short: 'Music',
            heading: 'Videos awaiting review ({count})',
            // Names the one number that actually blocks people. ADVISORY and UNCHECKED rows are a
            // backlog; HELD rows are uploads nobody can see.
            heldCount: 'Held: {count}',
            advisoryCount: 'Notes: {count}',
            uncheckedCount: 'Not scanned: {count}',
            empty: 'No videos are awaiting review',
            emptyDescription: 'Everything the automatic scan flagged has been reviewed.',
            // The list is the queue; the panel is the one video being decided.
            pickOne: 'Pick a video from the list to review it.',
            spansHeading: 'Detected places ({count})',
            // The core interaction, and worth saying out loud: these are jump points, not an edit
            // list. The reviewer listens and decides; nothing trims anything.
            spansHint: 'Press any place to jump there and listen.',
            noSpans: 'The scan did not mark any particular place in this video.',
            coveredSeconds: 'Detected in total: {seconds} seconds',
            openVideo: 'Open the video page',
            clear: 'Clear and publish',
            reject: 'Reject',
            clearing: 'Clearing...',
            rejecting: 'Rejecting...',
            cleared: 'The video was cleared and published.',
            rejected: 'The video was rejected.',
            decisionFailed: 'Could not save the decision.',
            // Rejection is the one that takes something away from an uploader, so it is the one
            // that asks first.
            confirmRejectTitle: 'Reject this video?',
            confirmRejectBody: '"{title}" will not be shown to visitors. You can undo this later by clearing it.',
            confirmRejectAction: 'Yes, reject it',
            playbackUnavailable: 'This video could not be played.',
        },
        pendingHeading: 'Channels awaiting approval',
        pendingEmpty: 'No channels are awaiting approval',
        pendingCount: 'Awaiting approval ({count})',

        /**
         * Creating a channel no longer queues anything \u2014 every uploaded video is examined per
         * video by the server \u2014 so a row here is almost always an import: a catalogue pulled in
         * from YouTube that nothing has examined, because those videos never enter the upload
         * pipeline at all. Saying so is the difference between "approve" as a rubber stamp and a
         * reviewer knowing what they are being asked to look at.
         */
        pendingReasonImport: 'Imported content from YouTube \u2014 review the content before approving.',
        pendingReasonOther: 'Awaiting review.',
        openChannel: 'Open the channel to review it',
        allChannelsCount: 'All channels ({count})',
        approve: 'Approve',
        reject: 'Reject',
        suspend: 'Suspend',
        delete: 'Delete channel',
        deleteTitle: 'Delete the channel permanently',
        // States the blast radius plainly. The delete cascades in SQL and nothing is recoverable.
        deleteWarning: 'The channel and everything in it will be deleted permanently: videos, books, articles, posts and series, and every comment, saved item and watch-history row attached to them. This cannot be undone.',
        deleteSuggestSuspend: 'If you only want to hide it for now, use "Suspend" instead of deleting.',
        deleteConfirmPrompt: 'Type the channel slug ({slug}) to confirm:',
        deleteConfirmMismatch: 'That slug does not match',
        deleted: 'Channel deleted',
        deleteFailed: 'Could not delete the channel',
        approveFailed: 'Could not approve it',
        rejectFailed: 'Could not reject it',
        suspendFailed: 'Could not suspend it',

        /**
         * The invitation link an admin copies into the email. Called an invitation rather than
         * anything with "code" in it, because a code is what the scholar puts in their YouTube
         * description to PROVE ownership, and the two would otherwise sit on one screen meaning
         * different things.
         */
        claimLink: {
            action: 'Invitation link',
            copied: 'Invitation link copied',
            failed: 'Could not create an invitation link',
            /**
             * Opening an invitation is the act of inviting, and it is deliberate: linking a
             * channel no longer opens one by itself. The confirmation says what became PUBLIC
             * rather than just "done", because that is the part an admin cannot see from here.
             */
            open: 'Open the invitation',
            opened: 'The invitation is open. Every visitor can now see that this page was assembled by us and its owner has not taken it over, and you can copy the link and send it.',
            // Worded as withdrawing rather than hiding, because that is what it does: the link
            // already sent stops working.
            withdraw: 'Withdraw the invitation',
            withdrawn: 'The invitation is withdrawn, the link already sent no longer works, and the notice is no longer shown to visitors.',
            toggleFailed: 'Could not change the invitation\u2019s state',
        },
        /**
         * Excusing a channel from the content detectors.
         *
         * <p>THE COPY HAS TWO JOBS AND THE SECOND IS THE HARDER ONE. The first is obvious: say
         * what is being switched off. The second is to say what this does NOT do, because an admin
         * will otherwise assume one of two wrong things \u2014 that ticking a box publishes the videos
         * this channel already has held (it does not; those stay in the review queue until a human
         * decides), or that it re-examines what has already been uploaded (it does not; nothing is
         * re-queued, since re-running a ladder to skip a scan would spend exactly the CPU this
         * saves). `scope` is that sentence and it is not decoration.
         *
         * <p>`badge` sits on the channel row, not only inside this dialog: a channel nothing scans
         * looks exactly like a channel whose uploads all came back clean.
         *
         * <p>The reason box is required and opens EMPTY every time rather than pre-filled: every
         * save restamps who decided and why, so carrying the previous sentence forward would
         * attribute one admin's reasoning to another admin's decision.
         */
        exemptions: {
            action: 'Automatic scanning',
            title: 'Automatic scanning for {name}',
            badge: 'Not scanned: {types}',
            intro: 'Choose which scans will not be run on videos uploaded to this channel. This shortens processing time considerably.',
            scope: 'This does not affect earlier videos: anything held for review stays held until a moderator decides on it, and nothing already uploaded is scanned again.',
            detector: {
                MUSIC: 'Music',
                NUDITY: 'Explicit content',
            },
            detectorHint: {
                MUSIC: 'Detects music and melody in the audio.',
                NUDITY: 'Detects explicit content in the picture.',
            },
            change: 'Change exemptions',
            noneYet: 'Every video uploaded to this channel is scanned.',
            reasonLabel: 'Reason for the exemption',
            reasonHint: 'Saved with your name and the date of the decision. Also required when switching scanning back on.',
            saved: 'Scanning settings saved',
            saveFailed: 'Could not save the scanning settings',
        },
        stats: {
            videos: 'Videos',
            books: 'Books',
            articles: 'Articles',
            activeChannels: 'Active channels',
            pendingChannels: 'Awaiting approval',
        },
        channelStatus: {
            PENDING: 'Awaiting approval',
            ACTIVE: 'Active',
            REJECTED: 'Rejected',
            SUSPENDED: 'Suspended',
        },
    },

    search: {
        title: 'Search',
        titleFor: 'Search: {query}',
        heading: 'Search results for "{query}"',
        resultCount: '{count} results',
        failed: 'The search failed',
        emptyDescription: 'Nothing was found for "{query}"',
    },

    biography: {
        title: 'Biography',
        empty: 'No information',
        // A person's name. Left in Arabic on purpose: inventing a transliteration for a real
        // person is worse than showing the name they actually go by.
        defaultName: 'محمد إلهامي',
        education: 'Qualifications:',
        youtube: 'YouTube',
        telegram: 'Telegram',
        contact: 'Contact',
    },

    share: {
        button: 'Share',
        linkAria: 'Share link',
        copy: 'Copy link',
        copied: 'Link copied',
        copyFailed: 'Could not copy the link',
        fromTimestamp: 'Share from {time}',
        viaApps: 'Share via apps',
        whatsapp: 'WhatsApp',
        telegram: 'Telegram',
    },

    upload: {
        allowedTypes: 'Allowed files: {extensions}',
    },

    notFound: {
        title: 'Page not found',
        description: 'This page does not exist, or has moved',
    },

    pager: {
        previous: 'Previous',
        next: 'Next',
        position: 'Page {page} of {total}',
        label: 'Page navigation',
    },

    /**
     * The platform's queue of viewer reports \u2014 admin only.
     *
     * <p><b>The sentence this screen cannot do without is `decisionOnly`.</b> A moderator pressing
     * "Actioned" records that a human looked and acted; it does not hide, delete or suspend
     * anything. A button a reviewer believes takes the video down, and does not, is the single
     * worst thing this screen could be wrong about \u2014 so it is said at the top of the page and
     * again beside the buttons.
     */
    adminReports: {
        title: 'Viewer reports',
        short: 'Reports',
        // The size of the whole backlog, which one page cannot answer. Beside the heading rather
        // than inside the list, for the reason the review queue's depth is: a number only visible
        // after paging to the end is a number nobody reads.
        openTotal: 'Open reports: {count}',
        decisionOnly: 'A decision here records what the reviewer saw and changes nothing about the content: it neither hides nor deletes it. To act on the content itself, open the item and use the hide or delete controls, or suspend the channel from Manage channels.',

        filters: {
            status: 'Status',
            targetType: 'Content type',
            all: 'All',
        },
        // Reviewer-facing names for the wire enums. Looked up with tOptional, so a value a newer
        // backend sends renders as itself rather than as a dotted key in the middle of the page.
        statuses: {
            open: 'Open',
            actioned: 'Actioned',
            dismissed: 'No breach',
        },
        targetTypes: {
            video: 'Video',
            book: 'Book',
            article: 'Article',
            post: 'Post',
            comment: 'Comment',
        },

        empty: 'No reports',
        emptyDescription: 'Nothing is awaiting review in this category.',
        loadFailed: 'Could not load the reports',

        reporter: 'Reporter #{id}',
        reportedAt: 'Reported: {date}',
        decidedAt: 'Decided: {date}',
        decidedBy: 'Decision by moderator #{id}',
        // Rendered only when it is more than one \u2014 see `corroboration` in lib/reports.js. This
        // is the line that turns a list of separate objections into one case.
        corroboration: '{count} open reports on the same item',
        openTarget: 'Open the reported content',
        openChannel: 'Open the channel',
        // A post has no page of its own and a comment lives under whatever it was written on, so
        // the link falls back to the channel. Said plainly rather than left as a dead control.
        noDirectLink: 'This item has no page of its own.',

        noteHeading: 'What the reporter said',
        noNote: 'The reporter wrote no details.',
        moderatorNoteLabel: 'Reviewer\u2019s note (optional)',
        moderatorNoteHeading: 'Reviewer\u2019s note',
        moderatorNotePlaceholder: 'What did you do, and why? Read later when reports recur on the same channel.',

        actioned: 'Actioned',
        dismiss: 'No breach',
        deciding: 'Saving...',
        decided: 'Decision saved.',
        decisionFailed: 'Could not save the decision.',

        otherReports: 'The other reports on this item',
        showOtherReports: 'Show the other reports ({count})',
        hideOtherReports: 'Hide the other reports',
        otherReportsFailed: 'Could not load the other reports.',
        // Absolute, never relative: "3 days ago" is the wrong unit for a queue whose whole
        // question is how long someone has been waiting.
        dateFormat: 'D MMMM YYYY, HH:mm',
    },

    report: {
        action: 'Report',
        aria: 'Report this content',
        reported: 'Reported',
        reportedAria: 'You have already reported this',
        reportedHint: 'We have your report and a moderator will review it. There is no need to send it again.',

        title: 'Report a problem',
        intro: 'Pick the closest reason for what you are seeing. A person from the platform team reads every report, and nothing is deleted or hidden by the report itself.',
        reasonLegend: 'Reason',
        noteLabel: 'More detail (optional)',
        notePlaceholder: 'What should the reviewer know? If this is a misattribution, name the real speaker or the source if you know it.',
        noteCounter: '{count}/{max}',
        submit: 'Send report',
        submitting: 'Sending...',
        success: 'Your report has arrived, and a moderator will review it.',
        failed: 'Could not send the report.',

        /**
         * The reasons, each a label and a line saying what it covers. The hints are not
         * decoration: without them "misinformation" and "misattribution" are picked
         * interchangeably and the routing they exist for does nothing.
         */
        reasons: {
            MISATTRIBUTION: {
                label: 'Wrongly attributed',
                hint: 'Words or a book credited to a scholar or author who did not say or write them.',
            },
            MISINFORMATION: {
                label: 'Incorrect information',
                hint: 'A claim or ruling presented as settled when it is not.',
            },
            SEXUAL_CONTENT: {
                label: 'Explicit scenes or images',
                hint: 'Sexual content or nudity.',
            },
            VIOLENCE: {
                label: 'Violence or gore',
                hint: 'Brutal or bloody scenes.',
            },
            HATE_OR_ABUSE: {
                label: 'Abuse or incitement',
                hint: 'Insults, degradation, or incitement against a person or a group.',
            },
            COPYRIGHT: {
                label: 'Copyright infringement',
                hint: 'Published without the rights holder’s permission.',
            },
            SPAM_OR_SCAM: {
                label: 'Spam or a scam',
                hint: 'Repeated advertising, or an attempt to defraud.',
            },
            OTHER: {
                label: 'Something else',
                hint: 'Say what you mean in the detail field below.',
            },
        },
    },
};

/**
 * The namespaces that are finished, key for key.
 *
 * <p>The test asserts each of these matches `ar.js` exactly, so a string added on that side and
 * forgotten here fails the build. A namespace **absent** from this list may be partial or missing
 * altogether and falls back to Arabic at runtime — adding it here is how a translation pass is
 * signed off, and it is the only thing that makes "which screens are English" an answerable
 * question rather than a matter of clicking around.
 */
export const TRANSLATED = [
    'common', 'fields', 'meta', 'nav', 'sidebar', 'searchBar', 'errorBoundary', 'errors',
    'auth', 'validation', 'home', 'video', 'books', 'pdfReader', 'articles', 'series',
    'channel', 'consent', 'createChannel', 'comments', 'likes', 'bookmarks', 'history',
    'subscriptions', 'profile', 'search', 'biography', 'share', 'upload', 'notFound',
    'channelManage', 'youtube', 'youtubeOAuth', 'admin', 'adminReports',
    'pager', 'report',
];

export default en;
