/**
 * English copy for the app. See `./index.js` for how a locale is chosen and `./ar.js` for the
 * rules about where a string belongs — the namespaces here mirror that file exactly.
 *
 * ## This catalog is complete, and the machinery that got it there is still load-bearing
 *
 * <p>Every namespace in `ar.js` is translated and listed in {@link TRANSLATED}, so nothing falls
 * back today. The fallback and the list both stay, and not out of sentiment:
 *
 * - **`t()` falls back to `ar` for any missing key**, which is what makes a key added to `ar.js`
 *   alone a legible Arabic sentence on an English screen rather than a dotted key in the middle of
 *   a page. That is the state between one commit and the next, and it will keep happening.
 * - **{@link TRANSLATED} is what turns that gap from silent into red.** The test asserts every
 *   listed namespace matches `ar.js` key for key, so a string added on that side and forgotten
 *   here fails the build instead of quietly rendering Arabic. Now that the list names everything,
 *   it covers the whole catalog — dropping a namespace from it to get a build green would be
 *   switching that alarm off, not fixing anything.
 *
 * <p>A namespace left out of the array is allowed to be partial, which is how a *new* translation
 * pass works: fill it in, then add it here to sign it off.
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
        tabsLabel: 'Sections',
        tabs: {
            today: 'Today',
            discover: 'Discover',
            books: 'Books',
            articles: 'Articles',
            posts: 'Posts',
            channels: 'Channels',
            read: 'Read',
        },
        history: 'Watch history',
        bookmarks: 'Saved',
        guide: 'How Absarna works',
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
        adminPanelWaiting: 'Admin panel — {count} waiting',
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
        // The back arrow on the phone's full-width search row.
        closeSearch: 'Close search',
        // The avatar button on a phone, which opens the account menu.
        accountMenu: 'Account menu',
    },


    searchBar: {
        placeholder: 'Search...',
        label: 'Search',
        noMatches: 'Nothing matches "{query}"',
    },

    // A picture a person puts on their own channel or account: a channel's logo and cover, or a
    // profile picture. The upload flow is the video poster's, so the wording is too.
    ownerImage: {
        storageFailed: 'Storage refused the upload. Please try again in a moment.',
        channelHeading: 'Logo and cover',
        logo: 'Channel logo',
        logoHint: 'Shown beside the channel name and on every video card. Square works best.',
        banner: 'Cover image',
        bannerHint: 'Shown across the top of the channel page. A wide picture works best, around 2560×800.',
        profilePicture: 'Profile picture',
        profilePictureHint: 'Shown in your account menu.',
        profilePictureNeedsVerification: 'Confirm your email address first, then you can upload a picture.',
        choose: 'Choose a picture',
        replace: 'Replace',
        remove: 'Remove',
        uploading: 'Uploading…',
        removing: 'Removing…',
        saved: 'Picture saved',
        removed: 'Picture removed',
        failed: 'The picture could not be saved: {reason}',
        unsupported: 'That image format is not supported. Choose a JPG, PNG or WEBP.',
        tooLarge: 'That image is too large. Choose one under 5 MB.',
        confirm: {
            explain: 'These pictures were copied from your YouTube channel. Until you confirm they are yours, we refresh them from YouTube every month — so a change there replaces them here.',
            action: 'Confirm these are my pictures',
            done: 'Your pictures are confirmed and will stay as they are',
        },
        youtube: {
            partial: 'One picture was copied; the other could not be fetched from YouTube. Try again later for it.',
            failed: 'We could not fetch your pictures from YouTube. Please try again.',
            explain: 'You can use the logo and cover from your YouTube channel. We copy them onto the platform, and you can change them here any time.',
            action: 'Use my YouTube logo and cover',
            copying: 'Copying…',
            copied: 'Copied your pictures from YouTube',
            nothing: 'Your YouTube channel has no logo or cover to copy',
        },
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

            // See the note on the Arabic entry: the invitation letter opens with the number of
            // lectures, so there is nothing to send until there are some.
            CHANNEL_HAS_NO_CONTENT: 'This channel has no lectures yet, and the invitation opens by naming how many there are. Run the import first, then send it.',

            YOUTUBE_NOT_VERIFIED: 'You have not proved ownership of the YouTube channel yet. Sign in with the Google account that manages it, from the YouTube tab.',
            YOUTUBE_NEEDS_OWNER_VERIFICATION: 'This channel was linked by the platform team, which is enough to import and no more. Uploading the original file needs the channel’s own owner to prove ownership by signing in with Google from the YouTube tab.',

            YOUTUBE_OAUTH_NOT_CONFIGURED: 'Verifying with a Google account is not switched on for this platform, and it is the only way to prove ownership. Get in touch and we will enable it.',
            YOUTUBE_OAUTH_STATE_INVALID: 'That verification attempt has expired or is no longer valid. Go back to the YouTube tab and start again.',
            YOUTUBE_OAUTH_FAILED: 'Signing in with Google did not complete. Please try again.',
            YOUTUBE_OAUTH_SCOPE_DENIED: 'You did not grant permission to see your YouTube account, which is how we identify your channel. Try again and allow it, or use the verification code instead.',
            YOUTUBE_OAUTH_UNAVAILABLE: 'We could not reach Google just now. Nothing is wrong with your channel — try again in a moment.',
            YOUTUBE_OAUTH_QUOTA_EXHAUSTED: 'The platform’s daily YouTube quota is spent. It refreshes every day — try again tomorrow.',
            YOUTUBE_OAUTH_CHANNEL_MISMATCH: 'The account you signed in with manages a different YouTube channel from the one linked here. Try again and pick the account that manages the linked channel — if it belongs to a Brand Account, choose that entry in the list.',
            YOUTUBE_OAUTH_NO_CHANNEL: 'The account you chose has no YouTube channel on it. Try again and pick the account that manages your channel.',

            THUMBNAIL_FORMAT_NOT_ALLOWED: 'That image format is not supported. Choose a JPG, PNG or WEBP.',
            THUMBNAIL_TOO_LARGE: 'That image is too large. Choose one under 5 MB.',
            THUMBNAIL_NOT_UPLOADED: 'The image did not finish uploading. Choose the file again.',
            THUMBNAIL_KEY_INVALID: 'The image could not be saved. Choose the file again.',
            IMAGE_FORMAT_NOT_ALLOWED: 'That image format is not supported. Choose a JPG, PNG or WEBP.',
            IMAGE_TOO_LARGE: 'That image is too large. Choose one under 5 MB.',
            IMAGE_NOT_UPLOADED: 'The image did not finish uploading. Choose the file again.',
            IMAGE_KEY_INVALID: 'The image could not be saved. Choose the file again.',
            YOUTUBE_IMAGES_OWNER_ONLY: 'Only the channel\'s owner can copy its pictures from YouTube.',

            YOUTUBE_IMPORT_ALREADY_RUN: 'This channel has already been imported, or an import is running right now.',
            YOUTUBE_NOT_CONFIGURED: 'Importing from YouTube is not enabled on this platform. Please contact the platform team.',
            YOUTUBE_QUOTA_EXHAUSTED: 'The platform’s daily YouTube quota is spent. Please try tomorrow.',

            USERNAME_TAKEN: 'That username is taken. Please choose another one.',
            EMAIL_TAKEN: 'An account with this email address already exists. Sign in with it, or register with a different address. If you have forgotten the password, ask for a reset link on the sign-in page.',
            PROFILE_EMAIL_TAKEN: 'This email address is used by another account. Please choose a different one.',

            CURRENT_PASSWORD_REQUIRED: 'This action needs your current password. Enter it and try again.',
            ADMIN_ACCOUNT_CANNOT_BE_DELETED: 'A platform admin account cannot be deleted from here.',
            CURRENT_PASSWORD_INVALID: 'That current password is not correct. Check it and try again.',
            CHANNEL_OWNER_ONLY: 'Only the channel\'s owner can delete it from here.',
            ADOPTION_OWNER_ONLY: 'Only the channel\'s owner can confirm its imported video details.',
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
        readingNow: 'Reading now',
        shelfAll: 'See all',
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
        emptyHint: 'When channels write articles you will find them here, to read on a quiet page. You can write one too, from your own channel.',
        loadFailed: 'Could not load the article',
        backToArticles: 'Back to articles',
        emptyOnChannel: 'No articles yet',
    },

    voice: {
        graphicTitle: 'Graphic scenes',
        graphicText: 'This video documents something that may be hard to watch.',
        tapToView: 'Tap to view',
        reveal: 'Show the video',
        removedElsewhere: 'Removed from another platform',
        perChannel: '(according to the channel)',
        formGraphic: 'Contains graphic scenes',
        formGraphicHint: 'Published behind a cover that warns the viewer, never removed for it.',
        formRemoved: 'Removed from another platform',
        formRemovedHint: 'Shown to viewers as the channel’s own statement, since we cannot verify it.',
        keptTitle: 'What is uploaded to Absarna is kept here',
        keptHosted: '{count} uploaded to Absarna directly, kept whatever another platform does',
        keptEmbedded: '{count} shown from YouTube, gone if YouTube removes them',
    },

    channelsPage: {
        title: 'Channels',
        mine: 'My channels',
        manage: 'Manage channel',
        create: 'Create a channel',
        following: 'Your channels',
        manageFollowing: 'Manage subscriptions',
        directory: 'Discover channels',
        more: 'Show more channels',
        empty: 'No channels yet',
        loadFailed: 'Channels could not be loaded',
    },

    postsPage: {
        title: 'Posts',
        followed: 'From your channels',
        all: 'All channels',
        endFollowed: 'That is every post from your channels.',
        endAll: 'That is every post.',
        emptyFollowed: 'No posts from the channels you follow yet',
        emptyAll: 'No posts yet',
        emptyHint: 'This is where channels say something short: an announcement, a comment on the news, a heads-up about a new episode. Follow channels to hear from them first.',
        loadMore: 'Show more',
        loadFailed: 'Posts could not be loaded',
    },

    guide: {
        title: 'The Absarna guide',
        subtitle: 'Everything you need to get started, in a minute.',
        progress: 'Step {step} of {total}',
        skip: 'Skip',
        back: 'Back',
        next: 'Next',
        done: 'Let’s start',
        start: 'Start with Today',
        fullPage: 'Read the full guide',
        open: 'Open {place}',
        steps: {
            welcome: {
                title: 'Welcome to Absarna',
                text: 'A place to know what is happening in the world, to learn something worth knowing, and to hear from those silenced on other platforms. Here is a short tour.',
            },
            today: {
                title: 'Today',
                text: 'Your first page, and it ends: what you started — programmes and books — what you finished this week, and the latest news. You are done when you reach the bottom; it never pulls you into endless scrolling.',
            },
            discover: {
                title: 'Discover',
                text: 'For browsing: what is new from the channels you follow, and suggestions from channels you have not met yet. Pick a format — reports, documentaries, lectures — to narrow it down.',
            },
            read: {
                title: 'Books and articles',
                text: 'A library you read right here. Your place is kept, and Today takes you back to it.',
            },
            posts: {
                title: 'Posts',
                text: 'Short words from channels: an announcement, a comment on the news, a heads-up about a new episode.',
            },
            channels: {
                title: 'Channels',
                text: 'Follow the channels you trust, and what they publish comes to Today and Discover. You can also create a channel of your own and publish in it.',
            },
            voice: {
                title: 'A voice for the silenced',
                text: 'A channel can mark a video “removed elsewhere”, and what is uploaded here stays here. Hard footage sits behind a cover, and opens only when you choose.',
            },
        },
    },

    today: {
        weekTitle: 'Your week',
        weekSpan: 'The last seven days',
        episodesFinished: 'episodes finished',
        booksRead: 'books read in',
        pagesRead: 'pages read',
        programmesCompleted: 'programmes completed',
        closest: '{remaining} to go and you have finished “{title}”',
        continueTitle: 'Continue what you started',
        next: 'Next: {position} of {total}',
        resume: 'Resume at {time}',
        pageShort: 'p. {page}',
        readFrom: 'Continue from page {page}',
        progressAria: '{title}: {position} of {total}',
        readingAria: '{title}: page {page}',
        newsTitle: 'Latest news',
        because: 'Because you finished “{title}”',
        colophonTitle: 'You are up to date, and what you started is waiting',
        colophonText: 'That is today’s page. Everything else is in Discover.',
        toDiscover: 'Discover',
        signInPrompt: 'Sign in to see what you started and what you finished this week here.',
        loadFailed: 'Today’s page could not be loaded',
        welcome: {
            title: 'Welcome to Absarna',
            text: 'A place to know what is happening in the world, to learn something worth knowing, and to hear from those silenced on other platforms.',
            news: 'News and reports',
            learn: 'Programmes, lectures and books',
            voice: 'Voices removed elsewhere',
            howItFills: 'Follow a channel or start a programme, and this page fills with what you started and what you finished.',
            signInWhy: 'Create an account to follow channels, and to find here what you started and what you finished each week.',
            programmesTitle: 'Programmes to start',
            startProgramme: 'Start from episode one of {total}',
            channelsTitle: 'Channels to follow',
            allChannels: 'All channels',
            booksTitle: 'New in the library',
            allBooks: 'All books',
            colophonTitle: 'This is your start, and everything you begin will show up here',
            guide: 'How does Absarna work?',
        },
    },

    formats: {
        one: {
            REPORT: 'Report',
            ANALYSIS: 'Analysis',
            INTERVIEW: 'Interview',
            TESTIMONY: 'Testimony',
            DOCUMENTARY: 'Documentary',
            PROGRAMME: 'Programme',
            LECTURE: 'Lecture',
            TALK: 'Talk',
            SHORT_FILM: 'Short film',
        },
        many: {
            REPORT: 'Reports',
            ANALYSIS: 'Analysis',
            INTERVIEW: 'Interviews',
            TESTIMONY: 'Testimony',
            DOCUMENTARY: 'Documentaries',
            PROGRAMME: 'Programmes',
            LECTURE: 'Lectures',
            TALK: 'Talks',
            SHORT_FILM: 'Short films',
        },
        label: 'Format',
        inherit: 'Same as the channel ({format})',
        inheritPlain: 'Same as the channel',
        unset: 'Not set',
        channelDefaultLabel: 'What this channel mostly makes',
        channelDefaultHint: 'Applies to every video whose format you have not set, imported YouTube videos included. You can still change any single video.',
        channelDefaultNone: 'No default',
    },

    series: {
        badge: 'Series',
        partOf: 'From the series: {title}',
        position: '{series} · {position}',
        positionOf: '{series} · {position} of {total}',
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
            unavailable: 'Taking channels over is not available on this platform right now. Get in touch and we will sort it out.',
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
        tryAgain: 'Try signing in again with the Google account that manages the channel.',
        claimed: 'The channel has been transferred to you',
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
        // No steps any more: signing in IS the method, and it happens on Google's screen. What
        // this carries instead is the reassurance the old steps carried by being visible — that
        // nothing on the owner's YouTube channel is touched.
        verifyIntro: 'Prove the channel is yours by signing in with the Google account that manages it. We change nothing on your channel, and we read only the name of the channel that account manages.',
        // Spells out where the description actually lives: "add it to your channel description"
        // assumes the owner knows that means YouTube Studio → Customisation → Basic info, which
        // is three levels deep and not called "description" at the top level.
        // YouTube's API can lag a minute behind a save; without saying so, a correct attempt reads
        // as a failure and people redo work they already did right.
        // Clipboard access is refused outside a secure context and by some privacy settings. The
        // code is selected for them, so copying is one keystroke rather than a careful drag.
        // The overwhelmingly common failure: YouTube's API has not caught up with the save yet.
        verified: 'Your ownership of this channel is verified',
        verifiedByAdmin: 'This channel was linked by the platform team',

        oauth: {
            button: 'Verify with a Google account',
            redirecting: 'Taking you to Google...',
            hintUnlinked: 'The quickest way: sign in with the Google account that manages your channel, and we link and verify it in one step without changing anything on YouTube.',
            hintLinked: 'Sign in with the Google account that manages this channel and you will not need to change anything on it.',
            hintUpgrade: 'If you own the channel, sign in with the Google account that manages it to prove ownership yourself \u2014 that is what lets you upload original files.',
            // Still "or", because the URL form below it remains a real second way to LINK a
            // channel — it just does not verify one.
            orManual: 'Or link the channel by its URL first:',
            // There is no fallback behind this any more, so an owner on a deployment with no
            // OAuth client cannot verify at all. It points at the platform, not at them.
            unavailable: 'Verifying with Google is not available on this platform right now. Get in touch and we will enable it for your channel.',
            startFailed: 'Could not start verification with Google. Try again in a moment.',
        },

        // Admin-only. Worded as an assertion the admin is making, not as a step being skipped \u2014
        // it is a different check, not a shortcut past one, and it is recorded as such.
        adminAttest: 'Link as platform admin',
        adminAttesting: 'Linking...',
        adminAttestHint: 'Platform team only: for a channel created on its owner\u2019s behalf, where we cannot sign in with their Google account.',
        adminAttestWarning: 'An admin link permits importing only. Uploading the original file in place of a YouTube link needs the channel owner\u2019s own verification.',
        adminAttestFailed: 'Could not link it. Check the URL and try again.',
        // The "check" button's own failure \u2014 the request never got an answer worth reading. Not
        // the same as a check that ran and found no code.

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
        logoHint: 'Optional. If you link your YouTube channel, its logo and cover are copied when you import — a picture you choose here comes first.',
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

        // The owner closing their own channel, from the settings tab. Password-confirmed for the
        // reason deleting the account is: nothing here can be brought back.
        deleteChannel: {
            heading: 'Delete channel',
            intro: 'Deleting a channel is permanent and cannot be undone.',
            whatGoes: 'The channel goes with everything in it — videos, books, articles, posts, series and comments — and its files are removed from storage. Your account stays as it is.',
            button: 'Delete this channel permanently',
            confirmTitle: 'Confirm channel deletion',
            confirmBody: 'Enter your password to confirm deleting “{name}”. This is permanent.',
            confirmButton: 'Delete the channel',
            deleting: 'Deleting...',
            done: 'The channel has been deleted',
            failed: 'Could not delete the channel',
        },

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
            waiting: '{label} — {count} waiting',
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
        reactivate: 'Reactivate',
        reactivated: 'The channel is live again',
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
        reactivateFailed: 'Could not reactivate it',

        /**
         * The invitation link an admin copies into the email. Called an invitation rather than
         * anything with "code" in it, because a code is what the scholar puts in their YouTube
         * description to PROVE ownership, and the two would otherwise sit on one screen meaning
         * different things.
         */
        /**
         * Inviting the scholar a seeded channel is about.
         *
         * THE WORD "INVITATION" AND NOT ANYTHING WITH "CODE" IN IT, for the reason the block
         * below already records: a code is what a scholar once put in their YouTube description
         * to PROVE ownership, and the two would sit on one screen meaning different things.
         *
         * `contents` IS THE LOAD-BEARING STRING. The admin pressing this is the sender of a
         * letter they did not write — one that says we built a page from someone's lectures
         * without asking, and offers to delete it on a reply. Finding that out from a scholar's
         * response is the wrong way round, so the dialog says it before the press.
         */
        invite: {
            action: 'Invite the owner',
            actionAgain: 'Invite again',
            title: 'Invite the owner of {name}',
            intro: 'We will email the invitation, and record that we did. The link in it is the channel page plus the token that shows the claim offer.',
            contents: 'The message says the page holds their lectures and how to take it over, that we assembled it from their public YouTube channel without asking first, and that replying is enough for us to delete it.',
            emailLabel: 'Email address',
            previousAddress: 'This is the address the last invitation went to.',
            localeLabel: 'Write in',
            localeHint: 'There is no account to read a language from, so this is your choice — and it is recorded with the send.',
            send: 'Send the invitation',
            sent: 'The invitation has been sent and recorded on the channel.',
            // Never "delivered": nothing here consumes the provider's bounce webhook, so a hard
            // bounce and a scholar who read it and did nothing look identical from this screen.
            sendFailed: 'Could not send the invitation',
            copyInstead: 'Copy the link instead',
            copied: 'Invitation link copied',
            copyFailed: 'Could not create an invitation link',
            sentNote: 'Invited {when} → {address} ({locale})',
        },
        claimLink: {
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
        priority: {
            urgent: 'Urgent',
            high: 'High priority',
        },
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
        reasonsFailed: 'The reasons did not load.',
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
            MUSIC: {
                label: 'Music',
                hint: 'Music or instruments in the recording.',
            },
            AGAINST_ISLAMIC_VALUES: {
                label: 'Against Islamic values',
                hint: 'Content that does not belong on an Islamic platform, even if no other reason fits it.',
            },
            PROFANITY: {
                label: 'Bad language',
                hint: 'Swearing or obscene words.',
            },
            OTHER: {
                label: 'Something else',
                hint: 'Say what you mean in the detail field below.',
            },
        },
    },
    /**
     * The legal pages, translated. `sourceNotice` is the one string here with no counterpart in
     * the Arabic document: it says which version governs, and `LegalDocument` renders it only when
     * the page is being read in a language it was not written in. A translation of an operative
     * text that does not say it is a translation is a second operative text.
     */
    legal: {
        lastUpdated: 'Last updated: {date}',
        lastUpdatedDate: '22 September 2026',
        contentsHeading: 'On this page',
        sourceNotice: 'These pages were written in Arabic. This English text is provided for convenience; where the two differ, the Arabic version is the one that governs.',

        footer: {
            navLabel: 'Site links',
            about: 'About',
            privacy: 'Privacy Policy',
            terms: 'Terms of Use',
            contact: 'Contact us',
            rights: '© {year} أَبْصَرْنا',
        },

        about: {
            title: 'About the platform',
            metaDescription: 'What أَبْصَرْنا is, who runs it, and how videos are uploaded to its servers, processed, and served from them.',
            intro: [
                'أَبْصَرْنا is a platform for publishing Islamic educational material: videos, books, articles and posts, organised into channels their owners hold and run themselves.',
                'This page describes what the platform actually does: what is uploaded to it, what happens to it, and where it is served to the reader from.',
            ],
            sections: [
                {
                    id: 'about-what',
                    heading: 'What the platform offers',
                    paragraphs: [
                        'The platform is a place to publish, not a directory pointing somewhere else. Every content owner has a channel of their own, which they publish in, arrange and delete from as they see fit, and it holds four kinds of thing:',
                    ],
                    bullets: [
                        'Video — lessons and lectures uploaded to our servers and served from them, or imported from what their owner published on YouTube.',
                        // "No NEED to download", not "no download": this page describes what the software
                        // does, and a download button sits beside the read button on every book that
                        // has a file. The first is a true description of what the built-in reader
                        // saves you; the second read as a denial that the button exists.
                        'Books — files uploaded here and read inside the platform in its own reader, with no need to download anything or install other software, and your place in them is kept. The file can be downloaded as well, if you would rather have it.',
                        'Articles and posts — text written here in the first place.',
                        'Series and biographies — lessons ordered into a series to be followed in sequence, and an introduction to the people behind the material.',
                    ],
                },
                {
                    id: 'about-video',
                    heading: 'Video: uploaded to us, processed by us, served from our servers',
                    paragraphs: [
                        'A channel owner uploads the original video file to our servers straight from their browser, however large it is: the file is split into parts uploaded in turn, so an interrupted upload resumes where it stopped rather than starting again.',
                        'It is then processed here automatically: re-encoded into several qualities so that it suits a slow connection and a fast one alike, cut into short segments delivered as adaptive streaming — so your player picks the quality your connection can carry and moves up or down as you watch — and a thumbnail is extracted from it, which its owner may replace with one of their own.',
                        'Once processing is done the video is served from our own servers, and reaches the reader from them, in a player we built rather than someone else’s. YouTube is not on that path, and neither is anyone else.',
                        'Everything uploaded is scanned automatically before it is published — see the terms of use for what may not be published and what is held back until a human has seen it.',
                        'Books work the same way: the file is uploaded to us, kept here, and read from our servers in the platform’s reader.',
                    ],
                },
                {
                    id: 'about-youtube',
                    heading: 'And what is imported from YouTube',
                    paragraphs: [
                        'A channel owner who already has material published on YouTube may import it into their channel here, once they have proved they own that channel — so their lessons become searchable, ordered into series, and resumable from where you stopped, like everything else on the platform.',
                        'Those, and only those, are played from YouTube’s own player rather than from our servers. Each carries a mark on its card showing where it comes from, and none of it loads at all without your permission.',
                        'The moment its owner uploads the original file to our servers, serving from us replaces that player and the mark disappears by itself. Importing is a door into the platform, not the platform.',
                    ],
                },
                {
                    id: 'about-operator',
                    heading: 'Who runs it',
                    paragraphs: [
                        'One person runs it, in a personal capacity: it is not a company, an institution, or a body with a board. There is no investor and no funder behind it.',
                        'What is published on it belongs to the channel owners, not to us: we host it, display it, and keep from readers what may not be published — we claim ownership of no lesson and no book.',
                        'The address on the "Contact us" page reaches the person who runs the platform: for rights complaints, for other complaints, and for privacy requests.',
                    ],
                },
                {
                    id: 'about-not',
                    heading: 'And what it does not do',
                    paragraphs: [
                        'These are not general promises but a description of what is absent from the software itself — the privacy policy sets out the detail:',
                    ],
                    bullets: [
                        'No advertising and no ad network, no charge to watch and no paid subscription: there is nowhere on the platform where money changes hands.',
                        'No advertising tracker and no third-party measurement. Performance and error measurements go to a server we run ourselves, not to an analytics company.',
                        'No cookies set by the platform.',
                        'No recommendation engine measuring how long you stay in order to lengthen it: the home page shows a bounded amount, fixed for the day; nothing autoplays one video after another; and what you have watched is not used to rank what you are shown.',
                    ],
                },
            ],
        },

        privacy: {
            title: 'Privacy Policy',
            metaDescription: 'What أَبْصَرْنا collects about you, why, where it is kept, and who sees it.',
            intro: [
                'This page describes what أَبْصَرْنا actually collects, not what platforms usually collect. Every clause here is written about behaviour that exists in the software itself: what you read here happens, and what you do not find here does not.',
                'You can browse the platform, read the articles and watch the videos without creating an account. What follows sets out what is collected in both cases: with an account and without one.',
            ],
            sections: [
                {
                    id: 'account-data',
                    heading: 'Account data',
                    paragraphs: [
                        'When you create an account we ask for a username, a password and your gender. Gender is required at registration and cannot be changed afterwards from within the platform; it is shown to you on your profile and to the platform team, and is neither displayed to visitors nor sent to any outside party.',
                        'An email address is optional at registration, but it is necessary to activate the account, to recover your password if you forget it, and to open a channel — a channel cannot be opened without a verified address.',
                        'Your password is stored hashed, and nobody — the platform team included — can read it or recover it. We also store the date your account was created and your role on the platform: reader, channel owner, or moderator.',
                        'The following are entirely optional; you may add them or leave them empty:',
                    ],
                    bullets: [
                        'Full name — shown in place of your username wherever you appear.',
                        'Country — a two-letter country code only, no city and no address.',
                        'A short bio — free text you write on your profile.',
                        'A profile picture URL — a link to an image hosted elsewhere. The platform does not upload or store your picture; it stores the link and displays it.',
                    ],
                },
                {
                    id: 'email-use',
                    heading: 'Email: what we send, and through whom',
                    paragraphs: [
                        'We send you two kinds of message to your account address and no others: an address-verification message, and a password-reset message. There is no newsletter, no marketing mail and no content notifications; there is nothing in the software that sends an account holder anything but these two. (The software can send one further message, and it is never sent to an account: an administrator can email the owner of a channel we assembled for them, once, inviting them to take it over. It goes to an address an administrator was given, not to anything collected here.)',
                        'A verification link is valid for ten minutes, and a password-reset link for one hour and a single use. The brevity is deliberate: whoever holds the link holds the account.',
                        'Mail is sent through a specialist outside provider that handles delivery on our behalf, which receives your address, your display name and the text of the message. Nothing else about your account or your activity reaches it.',
                        'The number of requests is limited: three verification messages an hour, and three password-reset requests an hour.',
                    ],
                },
                {
                    id: 'activity',
                    heading: 'Your activity on the platform',
                    paragraphs: [
                        'If you are signed in, the following is stored against your account. Your watch and reading histories are lists for your own convenience, not tracking logs: each is capped at two hundred entries with the oldest dropped automatically, and each is cleared in full with one press.',
                    ],
                    bullets: [
                        'Watch history — the last two hundred videos you watched and where you stopped in each, so that "continue watching" works.',
                        'Reading history — the same for books: the last two hundred, and the last page you reached.',
                        'Saved items — what you saved to read or watch later.',
                        'Likes, and your channel subscriptions.',
                        'Your comments: their text, your display name and their date. Your email address at the time of writing is stored with the comment for administrative purposes; it is shown to no reader and does not leave with the comment’s data.',
                    ],
                },
                {
                    id: 'view-counts',
                    heading: 'How the view counter is calculated',
                    paragraphs: [
                        'The counter under each video, book or article counts once per viewer per item, not once per page load. To tell viewers apart without tracking them, a "key" is built as follows.',
                        'No cookie, advertising identifier or device fingerprint is involved in any of this. That is the substantive difference between this and an ordinary view counter.',
                        'A channel owner’s own views of their own content are not counted, and neither are the views of platform moderators.',
                    ],
                    bullets: [
                        'If you are signed in, the key is your account number, so one view is counted for the item even if you return to it a year later.',
                        'If you are a visitor with no account, the key is a hash of three things together: today’s date, your IP address and your browser type. Because the date is part of the hash, your key changes every day, so today’s visit cannot be linked to yesterday’s.',
                        'The IP address is not stored at all; what is stored is the hash alone, and it cannot be reversed.',
                        'Rows for visitors without an account are deleted every night, so none survives more than two days.',
                    ],
                },
                {
                    id: 'ip-addresses',
                    heading: 'IP addresses',
                    paragraphs: [
                        'The server uses your IP address in exactly two places and no third: rate-limiting requests, to protect against abuse and flooding, and building the view hash described above.',
                        'In the first, the address stays in the server’s memory temporarily, is never written to a database, and is gone when the server restarts. In the second it is not stored at all; its hash is.',
                        'One exception is worth stating: if an address exceeds the permitted request rate, a warning line containing that address is written to the server logs. Those logs are held on a monitoring server we run ourselves.',
                    ],
                },
                {
                    id: 'analytics',
                    heading: 'Performance and error measurement',
                    paragraphs: [
                        'The application sends performance measurements for how quickly a page appears and responds, unexpected JavaScript errors, and video playback failures. The purpose is one thing: that we learn of a fault when it happens to a reader, rather than when it is reported some time later.',
                        'The difference worth stating is that these measurements go to a server we run, not to an analytics company. There is no advertising tracker on the platform, no ad network and no third-party measurement tool.',
                        'The page address is truncated before sending: everything after the question mark is removed, so no verification code, password-reset code or signed file link leaves your browser. No page text, page content or access token is sent.',
                        'If measurement collection is not configured in this deployment, the module is disabled entirely and nothing at all is sent.',
                    ],
                },
                {
                    id: 'cookies',
                    heading: 'Cookies and local storage',
                    paragraphs: [
                        'The platform sets no cookies, for tracking or for anything else; there is nothing on the server that creates a cookie at all.',
                        'It does use your browser’s local storage, for things that concern your browser alone and never reach us: your access token after signing in, your choice of light or dark mode, the playback speed and volume you set in the player, and the state of an unfinished upload until you resume it.',
                        'An access token is valid for an hour and is renewed with a refresh token valid for seven days. Signing out erases both from your browser.',
                        'The YouTube player, however — on pages of imported videos alone — may store things of its own in your browser, over which we have no control. That player is not loaded at all without your permission; see the "YouTube" section.',
                    ],
                },
                {
                    id: 'your-content',
                    heading: 'What you publish',
                    paragraphs: [
                        'If you open a channel, its name, description, logo and content are public, as is your display name as its owner. Any video, book, article or post you upload is public the moment you publish it, unless you hide it yourself.',
                        'Comments are public, with your display name. Deleting your comment hides it from readers.',
                        'Video and book files are kept in cloud storage and served over a content delivery network, and their links are unguessable.',
                    ],
                },
                {
                    id: 'moderation',
                    heading: 'Review of uploaded content',
                    paragraphs: [
                        'Every video uploaded to the platform passes, before publication, through an automatic check for two things: music, and explicit content. The check runs on the file itself while it is being processed and does not leave our servers for any other party.',
                        'If something is detected, the video may be held from view until a person from the platform team has reviewed it. The video’s owner alone sees the result of the check, in their channel dashboard; it is not shown to readers.',
                        'This check applies to video alone. Books, articles and posts pass through no automatic check, and are reviewed by a person when a report arrives.',
                    ],
                },
                {
                    id: 'youtube',
                    heading: 'YouTube: what we read from it, and what reaches it about you',
                    paragraphs: [
                        'This platform uses YouTube API Services to import channel content, and displays imported videos through YouTube’s own player. Google is therefore a party that receives data about you, and its handling of that data is governed by',
                        ['what is set out in ', { text: 'Google’s Privacy Policy', href: 'https://policies.google.com/privacy' }, ' — over which we have no say and no control.'],
                        'As for what reaches Google about you as a reader, this is the account of it: every imported video card displays its thumbnail from YouTube’s servers, which your browser requests directly from them — on the home page, in search results and on channel pages — before you have pressed anything. Sent to Google with that request are your IP address, your browser type and the page you came from. If you open an imported video’s page, the YouTube player is loaded as well. We use the "youtube-nocookie.com" domain, which reduces what is stored in your browser as cookies, but it does not prevent the requests themselves.',
                        'None of that happens until you permit it. We ask on your first visit, and nothing is loaded from Google’s servers — neither a thumbnail nor the player — unless you agree. If you refuse, imported video cards appear with a substitute image of ours, the whole site carries on working, and you may play any one of those videos by agreeing at that player alone, whenever you wish.',
                        'You may withdraw your permission at any time from the "Your choice about YouTube" link at the foot of every page, after which we ask you again and loading from Google stops. We store only your answer in your browser, so as not to repeat the question on every page; that storage is necessary to carry out your choice and so requires no permission.',
                        'For videos uploaded to the platform directly, nothing about them reaches Google: their file is with us and they are served from our servers, and neither an image nor a player is requested from YouTube.',
                        'As for what we read from YouTube, it is the publicly listed material alone: video titles, descriptions, speaker names, publication dates, durations, thumbnails and playlists. We read no statistics, no comments and nothing about any YouTube user.',
                        'A channel’s owner — and they alone — may import it once, after proving they own it. Proof takes two routes: placing a code we issue them in their channel’s public description on YouTube, which we then read from there, and which involves their Google account not at all; or signing in with the Google account that manages the channel. The second is optional, may not be available in this deployment at all, and we ask it only of someone who chose it themselves.',
                        ['If you choose to sign in with Google, we ask permission to see the name of your YouTube channel and nothing else, and once only: we ask Google "which channel does this account manage?" and then revoke the permission immediately, in the same moment. We store no token and keep no renewable access to your account, and we read neither your mail nor your private videos nor anything besides that. You can review the permissions you have granted, and withdraw them, at any time from ', { text: 'your Google account permissions page', href: 'https://myaccount.google.com/permissions' }, '.'],
                        ['What we receive from Google’s APIs, our use and transfer of it, are governed by the ', { text: 'Google API Services User Data Policy', href: 'https://developers.google.com/terms/api-services-user-data-policy' }, ', including the Limited Use requirement. We use this data only in the platform functions visible to you, never sell it, never use it for advertising or for creditworthiness assessment, and transfer it to nobody except with your permission, where a law requires it, or as the platform’s own safety requires for detecting fraud or abuse.'],
                    ],
                },
                {
                    id: 'third-parties',
                    heading: 'Parties that receive data',
                    paragraphs: [
                        'These are the categories of outside party the system deals with, and they are all there is. Among them there is no ad network, no payment gateway and no external analytics tool.',
                        'We name them by category rather than by name. Anyone who wants the name of a particular provider, and the extent of what reaches it, may ask at the contact address and will be told.',
                    ],
                    bullets: [
                        'A hosting provider — the servers the site runs on, and its database.',
                        'A cloud storage provider and content delivery network — storing video and book files and serving them to readers, and managing the site’s domain.',
                        'An email delivery provider — delivering the verification and password-reset messages.',
                        'Google (YouTube) — in two respects: reading imported channels’ data at import time and at the channel owner’s request, which does not concern readers; and serving thumbnails and the player for imported videos, which every reader’s browser requests directly from Google’s servers. See the "YouTube" section above.',
                    ],
                },
                {
                    id: 'data-location',
                    heading: 'Where data is kept, and where it travels',
                    paragraphs: [
                        'The servers and the database are in Germany, inside the European Union. That is where your account, your content and your activity on the platform are kept.',
                        'Some of the parties named above — the storage and delivery-network provider, and the email provider — are companies based outside the European Union. Uploaded video and book files travel to the first, and your email address, display name and the text of the message to the second, and nothing more. Neither your watch history, nor your reading history, nor your password travels to either.',
                    ],
                },
                {
                    id: 'retention',
                    heading: 'Retention and backups',
                    paragraphs: [
                        'Your account data and your content are kept for as long as the account exists.',
                        'An exception is anything refused under the content rules: a video held or rejected for music or explicit content is deleted, with its files, two weeks after the last change in its state, even if the account remains. This is set out in detail in the Terms of Use.',
                        'View-counter rows for visitors without an account are deleted every night and never exceed two days. Rows tied to a registered account remain, because they are what stops your view being counted more than once; they are a list of the item numbers you opened, and clearing your watch history does not erase them. If you want them deleted, write to us.',
                        'An encrypted backup of the database is taken every night and kept in dedicated storage. This means that what is deleted from the database may remain in backups until their cycle completes.',
                        'Server logs — which contain your account number with every request you send while signed in, and an IP address in the event of a rate limit being exceeded — are kept on the monitoring server we run.',
                    ],
                },
                {
                    id: 'your-rights',
                    heading: 'Your rights, and deleting your account',
                    paragraphs: [
                        'From within the platform you can: edit your full name, bio, picture link and country; change your email address by confirming your current password; change your password; clear your watch history, reading history and saved items; remove likes and subscriptions; delete your comments; and hide or delete your channel’s content.',
                        'You can delete your account yourself from the "Profile" page, by confirming your password. That deletes your account and personal details, your comments, your likes, your subscriptions, your saved items, your watch and reading histories, and your reports; and it deletes your channels with them, with every video, book, article and post in them, and removes their files from storage. The deletion is permanent and cannot be undone.',
                        'After deletion the view counters on what you watched remain, because a counter is a cumulative total that identifies nobody in particular, and old comments written before comments were tied to accounts remain, since nothing links them to your account.',
                        'You may also ask for a copy of what is stored about you, or for an error in it to be corrected, at the same address.',
                    ],
                },
                {
                    id: 'privacy-changes',
                    heading: 'Changes to this policy',
                    paragraphs: [
                        'If anything described here changes, the text of the page is amended and the "last updated" date at the top of it is brought up to date. There is no other copy of this policy anywhere else.',
                    ],
                },
                {
                    id: 'privacy-contact',
                    heading: 'Getting in touch about privacy',
                    paragraphs: [
                        'Everything above — asking for a copy, a correction, an account deletion, or a question about a clause — is addressed to the contact address given on the "Contact us" page.',
                    ],
                },
            ],
        },

        terms: {
            title: 'Terms of Use',
            metaDescription: 'The terms for using أَبْصَرْنا: who may open a channel, what a publisher is answerable for, what may not be published, and how complaints are made.',
            intro: [
                'أَبْصَرْنا is a platform for publishing Islamic educational content: videos, books, articles and posts, organised into channels owned by the people who run them. By using the platform — with an account or without one — you agree to what is on this page.',
                'It is written to be read. We have preferred clarity to fortification, because its reader is a teacher or a student of knowledge, not a legal department.',
            ],
            sections: [
                {
                    id: 'terms-content-rule',
                    heading: 'What may be published: an Islamic platform',
                    paragraphs: [
                        'أَبْصَرْنا is an Islamic platform, and what is published on it is governed by religious rules, not by editorial taste nor by a policy revisited each season. Two plain consequences follow most visibly: music and instruments are not published, and sexual or explicit content is not published.',
                        'These two are not a matter of ranking, nor a notice displayed beside the content, but a condition of publication itself: anything in which such a thing is detected is not shown to readers at all, and stays held until a person from the platform team has looked at it.',
                        'What is refused — whether the automatic check held it or a reviewer rejected it — is not kept here indefinitely: it and its files are deleted two weeks after the last change in its state. The delay is deliberate and means one thing: it is its owner’s opportunity to replace the file with a sound one, and replacing the file voids every prior verdict on it and returns it to checking from the beginning.',
                        'The period is counted from the last change in state, not from the day of the check. If a check held a video and a reviewer then looked at it months later and rejected it, the period begins on the day of rejection, not on the day it was held — otherwise the rejection would be a same-day deletion, leaving its owner nothing to do.',
                        'Anything that could not be checked — because of a fault in the checking tools, for instance — is not included in this deletion, even though it remains held. A check that could not complete is not a verdict on the content, and deleting what has not yet been looked at wrongs its owner.',
                    ],
                },
                {
                    id: 'terms-content-rule-limits',
                    heading: 'And the limits of that check',
                    paragraphs: [
                        'The automatic check is not complete, and we claim no such thing for it. Some things escape it — such as music accompanying speech with a singing voice — and some things it is uncertain about, so it records a preliminary note without holding the item.',
                        'Among these is that a video carrying a preliminary note (such as possible background audio under speech) remains on display while it awaits review, because that note falls on most recitation recordings, so holding them would have meant holding most of the library on a suspicion that does not hold up.',
                        'For that reason reporting was put within every reader’s reach: on videos, books, articles, posts and comments alike. Reports that arrive are looked at by a person. It is readers who see what the machine does not, and the attribution of a saying to a scholar who never said it is something no automatic check uncovers at all.',
                    ],
                },
                {
                    id: 'terms-accounts',
                    heading: 'The account',
                    paragraphs: [
                        'An account is personal, and you are answerable for what happens through it. Keep your password safe, and if you see anything that troubles you, change it from your profile page.',
                        'You may not impersonate anyone else in your username, display name or picture, nor give the impression of a scholarly standing or of an affiliation you do not hold.',
                        'We may suspend an account that breaches these terms.',
                    ],
                },
                {
                    id: 'terms-channels',
                    heading: 'Who may open a channel, and what they are answerable for',
                    paragraphs: [
                        'Opening a channel is available to any account holder with a verified email address. A new channel is not published immediately, but awaits the platform team’s approval; and the team may approve, refuse, or suspend an existing channel.',
                        'A channel’s owner is answerable for everything published on it: the soundness of its attribution, its freedom from breaches, and the publication rights in it. The platform is not a co-publisher of what is in the channels.',
                        'They are likewise answerable for the comments published on their channel, to the extent the management tools allow them.',
                    ],
                },
                {
                    id: 'terms-upload-rights',
                    heading: 'The publisher’s declaration of rights in what they upload',
                    paragraphs: [
                        'By uploading any file — video, book or image — or publishing any text, you declare that you hold the right to publish it, or that you are properly authorised to do so, or that it is among what may lawfully be published.',
                        'You declare that publishing it here infringes no right of an author, editor, publisher or publishing house. Ownership of what you publish remains yours; publishing it on the platform is permission for the platform to store, process and display it to readers within the service.',
                        'We do not verify this in advance — nobody can — and instead act when a report arrives.',
                    ],
                },
                {
                    id: 'terms-prohibited',
                    heading: 'What may not be published',
                    paragraphs: [
                        'Publishing the following on the platform is forbidden, in channel content and in comments alike:',
                    ],
                    bullets: [
                        'Anything that infringes another’s rights, such as books, recordings or images published without their owners’ permission.',
                        'Music and instruments, and audio clips and effects built on them.',
                        'Sexual or explicit content, and anything approaching it.',
                        'Calls to violence, declaring a named individual an unbeliever, or incitement against a person or a group.',
                        'Insult, slander and defamation, and exposing people’s private affairs and personal data.',
                        'Deception, fraud, disguised marketing and repeated messages.',
                        'Falsely attributing a saying to a scholar or a book, and distorting quoted texts.',
                        'Anything contrary to the law of the country you publish from.',
                    ],
                },
                {
                    id: 'terms-moderation',
                    heading: 'Review, removal and channel suspension',
                    paragraphs: [
                        'Every uploaded video passes through an automatic check for music and for explicit content before it is shown, and it may be held until a person reviews it. The video’s owner sees the result of the check in their channel dashboard.',
                        'The platform team may remove any content, hide it, delete a comment, or suspend or refuse a channel — without prior notice if the matter requires it — and the reason is given to the person concerned on request.',
                        'Reviewing a held video is for the platform team alone and not for the channel’s owner: a person reviewing what they uploaded themselves is not a review.',
                        'What is held or rejected is not kept here indefinitely: it and its files are deleted two weeks after the last change in its state, as set out at the start of this page.',
                    ],
                },
                {
                    id: 'terms-comments',
                    heading: 'Comments',
                    paragraphs: [
                        'Commenting is available to account holders. You may edit or delete your comment, and the channel’s owner and the platform team may hide or delete it.',
                        'There is at present no button within the page for reporting a comment; reporting is done by writing to us or to the channel’s owner.',
                    ],
                },
                {
                    id: 'terms-takedown',
                    heading: 'Complaints and rights reports',
                    paragraphs: [
                        'The platform has a report button on videos, books, articles, posts and comments, which reaches the platform team directly and requires you to be signed in.',
                        'If the matter is an infringement of your right, or something the report button does not cover, write to us at the contact address given on the "Contact us" page.',
                        'Help us decide quickly: include the address of the page or video, state how it breaches the rules, and if it is a rights report, state your standing and the basis of your ownership.',
                        'A report may result in the content being removed, hidden, or the channel suspended.',
                    ],
                },
                {
                    id: 'terms-authorship',
                    heading: 'Scholarly and religious content represents those who produced it',
                    paragraphs: [
                        'The lessons, books, articles and opinions published in the channels represent their authors alone. The platform adopts no speaker’s position, does not weigh between schools of thought, and the presence of content on it is no endorsement of it or of its author.',
                        'Accepting a channel is not a testament to its owner’s qualification; it is acceptance of opening a publishing space. Whoever wishes to benefit should verify, and whoever wishes to learn from someone should consider from whom they are learning.',
                        'The platform is no substitute for people of knowledge, and what is on it is neither a ruling directed at you personally nor a judgement on your situation.',
                    ],
                },
                {
                    id: 'terms-service',
                    heading: 'Availability of the service, and disclaimer of warranties',
                    paragraphs: [
                        'The service is provided as it is and as available. We do not warrant that it is free of faults, that it will run without interruption, or that any particular content will remain available indefinitely.',
                        'We are not answerable for the accuracy of what channel owners publish, nor for an error in the attribution of a text, nor for harm arising from reliance on published content.',
                        'Keep a copy of the files that matter to you: the platform is not a storage archive, and a channel’s owner may delete their content whenever they wish.',
                        'To the extent the law permits, our liability is limited to what these terms provide.',
                    ],
                },
                {
                    id: 'terms-hosting',
                    heading: 'Uploading content to our servers, and serving it from them',
                    paragraphs: [
                        'The norm on this platform is that content is uploaded to it and served from it: a channel owner uploads the video or book file to our servers, and it is kept here.',
                        'A video is processed automatically after it is uploaded: re-encoded into several qualities, cut into segments delivered adaptively according to your connection speed, and a thumbnail is extracted from it. It is then served from our servers in the platform’s player, and reaches you from them.',
                        'That processing requires keeping copies of your file at different qualities, which falls within the permission you grant the platform when you upload. When you delete the content, all of its copies are deleted with it.',
                        'Uploaded material is not published until processing is complete and it has passed the automatic scan described above; depending on the length of the material, that may take some time.',
                    ],
                },
                {
                    id: 'terms-youtube',
                    heading: 'Videos displayed from YouTube',
                    paragraphs: [
                        'Some of the content displayed here — as distinct from the above — is imported from YouTube, and plays from YouTube’s own player rather than from our servers. On each such video’s card you will find a mark indicating its source. A channel owner may upload the original file to our servers, and it is then served from us like everything else uploaded here.',
                        ['By using this platform you agree to be bound by the ', { text: 'YouTube Terms of Service', href: 'https://www.youtube.com/t/terms' }, ' in respect of that content, since it is displayed under them.'],
                        'We neither own this content nor control whether it remains: once its owner deletes it from YouTube or makes it private, it stops being shown here, and that is not in our hands.',
                    ],
                },
                {
                    id: 'terms-changes',
                    heading: 'Amendment of these terms',
                    paragraphs: [
                        'These terms may be amended. The "last updated" date at the top of the page is brought up to date with each amendment, and your continued use of the platform afterwards is acceptance of it.',
                    ],
                },
            ],
        },

        contact: {
            title: 'Contact us',
            metaDescription: 'How to write to the أَبْصَرْنا team: rights reports, complaints, and privacy and account-deletion requests.',
            intro: [
                'This is how to reach the platform team. There is no ticketing system and no live chat; email is the route.',
            ],
            emailHeading: 'Address for correspondence',
            emailAction: 'Write to us by email',
            missingHeading: 'No contact address is configured yet',
            missingBody: 'No contact email address has been configured in this build of the site, which is why no write-to-us link appears here. Showing a guessed address would only lose your message with somebody who does not read it.',
            missingOperatorNote: 'Note for whoever runs this deployment: set the VITE_CONTACT_EMAIL variable, then rebuild the frontend.',
            responseNote: 'The platform is run by a small team, and we do not commit to a fixed response time; rights reports and complaints, however, are taken before anything else.',
            sections: [
                {
                    id: 'contact-takedown',
                    heading: 'A rights report or a removal request',
                    paragraphs: [
                        'If a book, recording or text whose rights you hold has been published on the platform without your permission, or there is content you consider to breach the Terms of Use, write to us and state three things: the address of the page or video, how it breaches the rules, and your standing if it is a rights report.',
                    ],
                },
                {
                    id: 'contact-account',
                    heading: 'Account and privacy requests',
                    paragraphs: [
                        'Account deletion is not available from within the platform today, and is carried out manually on request by email. The same applies to requesting a copy of what is stored about you, correcting data, or deleting the view-counter rows tied to your account.',
                        'Write to us from the address registered on your account if you can, as that is quicker for establishing that it is yours.',
                    ],
                },
                {
                    id: 'contact-channel',
                    heading: 'Opening a channel and following up the request',
                    paragraphs: [
                        'A request to open a channel is made from within the platform, and its state is shown to you in your list of channels. If it is delayed or refused and you want an explanation, write to us.',
                    ],
                },
                {
                    id: 'contact-technical',
                    heading: 'A technical fault',
                    paragraphs: [
                        'If a video will not play, or a book will not open, or you see an error on the page, tell us what you were doing, the address of the page, and the browser you are using. Those three cover most of what we need.',
                    ],
                },
            ],
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
    'common', 'fields', 'meta', 'nav', 'searchBar', 'errorBoundary', 'errors',
    'auth', 'validation', 'home', 'video', 'books', 'pdfReader', 'articles', 'series',
    'channel', 'consent', 'createChannel', 'comments', 'likes', 'bookmarks', 'history',
    'subscriptions', 'profile', 'search', 'biography', 'share', 'upload', 'notFound',
    'channelManage', 'youtube', 'youtubeOAuth', 'admin', 'adminReports', 'legal',
    'pager', 'report', 'ownerImage', 'formats', 'guide', 'today', 'postsPage', 'channelsPage', 'voice',
];

export default en;
