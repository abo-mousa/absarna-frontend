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
    'pager', 'report',
];

export default en;
