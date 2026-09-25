/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      // Brand palette lives in CSS custom properties (see index.css's `:root`/`.dark`
      // blocks), not literal hex here — that's what lets every existing `bg-surface`/
      // `text-text-primary`/etc. call site repaint for dark mode with zero per-component
      // changes, instead of needing a `dark:` variant added at every usage.
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--color-gold) / <alpha-value>)',
          light: 'rgb(var(--color-gold-light) / <alpha-value>)',
          // Gold as text. DEFAULT is a fill colour and fails contrast as text; see index.css.
          ink: 'rgb(var(--color-gold-ink) / <alpha-value>)',
        },
        // Testimony and the graphic-content warning. See index.css.
        voice: 'rgb(var(--color-voice) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          hover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
        },
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          light: 'rgb(var(--color-border-light) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        // A custom property rather than a list, because the interface face follows the interface
        // LANGUAGE: `index.css` puts Cairo first under `lang="ar"` and Inter first under
        // `lang="en"`. Only this one is locale-dependent — see the note there for why `serif` and
        // `reading` are not.
        //
        // Cairo rather than IBM Plex Sans Arabic: Plex draws no ligature for «الله», so the word
        // arrived without its shadda everywhere anyone wrote it — and no fallback font can supply
        // it, since fallback only reaches a font for characters the first one is MISSING. See the
        // note in index.html.
        sans: 'var(--font-sans)',
        // Wordmark and reading-page headings only — see CLAUDE.md's rebrand note.
        serif: ['Markazi Text', 'Amiri', 'serif'],
        // Prose: what a reader WROTE (comments) and what a reader reads at length (descriptions,
        // article bodies). Naskh is the shape Arabic is read in at length, and this catalogue is
        // mostly that. The interface stays `sans` — a button is a label, not something to read —
        // so the two faces never meet inside one sentence, only across a page.
        reading: ['Noto Naskh Arabic', 'Amiri', 'serif'],
      },
      // Near-square, like a page or a tile, not an app's rounded pill. The redesign's one
      // ornament is the eight-pointed star, and 16px corners on every card read as a video site
      // before anything else on the screen did. `rounded-full` is untouched: a pill still means
      // a toggle (Subscribe) and a circle still means a person (Avatar).
      borderRadius: {
        sm: '2px',
        md: '3px',
        lg: '4px',
        xl: '6px',
        // A video card's picture, and only that: softer than the near-square scale above, which
        // read as sharp on a thumbnail, and still well short of a video site's 12px.
        card: '8px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.04)',
        md: '0 2px 8px rgba(0,0,0,0.06)',
        lg: '0 4px 16px rgba(0,0,0,0.08)',
      },
      maxWidth: {
        reading: '700px',
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(0.5rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
