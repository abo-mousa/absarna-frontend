import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * The origin part of a URL, or null. Turns a configured API/storage URL into the value a CSP
 * source list wants — `https://host:port`, never a path.
 */
const originOf = (url) => {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

/**
 * Injects a Content-Security-Policy meta tag into index.html.
 *
 * **Why this exists.** The app keeps its access token in `localStorage`, renders URLs that
 * originated in the database, and embeds a third-party player. There was no CSP at all, so the one
 * mitigation that turns "an injected script ran" into "an injected script could do nothing" was
 * simply absent. A meta tag is the right delivery here because the SPA is static files — there is
 * no server of ours in the request path to set a header, and the backend's own CSP (see
 * SecurityConfig) rides only on API responses, never on this document.
 *
 * **The inline theme script is hashed, not allowed.** index.html carries one inline script, which
 * has to run before paint to avoid a flash of the light theme. Allowing `'unsafe-inline'` for it
 * would hand every injected `<script>` the same permission and leave the policy decorative, so its
 * hash is computed here, at build time, from the file actually being served. That means it cannot
 * drift when the script is edited — a hash pasted into the HTML by hand is wrong the first time
 * someone changes a character of it.
 *
 * **`style-src` does keep `'unsafe-inline'`.** react-pdf's text and annotation layers position
 * every span with a generated style rule, and there is no hash-based way to express that. Inline
 * style is a far weaker vector than inline script — it cannot execute — so this is the one
 * concession, made deliberately rather than by omission.
 */
/**
 * What the compose stack in `absarna-backend` serves locally. Used as the dev default so
 * `npm run dev` keeps working with no `.env` at all — the CSP applies in dev exactly as it does in
 * a build, so without this the policy would block MinIO on every developer machine.
 */
const LOCAL_API = 'http://localhost:8080'
const LOCAL_STORAGE = 'http://localhost:9000'

const contentSecurityPolicy = (env, isProduction) => ({
  name: 'absarna-csp',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const inlineScriptHashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
        .map((match) => `'sha256-${crypto.createHash('sha256').update(match[1], 'utf8').digest('base64')}'`)

      // Where the app talks to. Both are deployment-specific, so they are read from the same env
      // the app itself uses rather than hardcoded — a policy that does not name the real API
      // origin blocks every request the app makes, which is a worse failure than no policy.
      const api = originOf(env.VITE_API_BASE_URL) ?? LOCAL_API
      // Object storage is not otherwise part of the frontend's configuration: bytes are fetched
      // from presigned URLs the backend mints, so this origin is only ever seen at runtime. It
      // still has to be declared, because connect-src, media-src and img-src all reach it.
      // Unset falls back to the local compose stack in dev, and to nothing in a production build
      // — where guessing localhost would be worse than an explicit failure.
      const storage = originOf(env.VITE_STORAGE_ORIGIN) ?? (isProduction ? null : LOCAL_STORAGE)
      if (!storage) {
        // Loud, because the failure is otherwise deferred and confusing: the app builds, deploys
        // and renders, and only playing a video or opening a book fails — as a CSP violation in
        // the console, nowhere near the missing variable that caused it.
        console.warn(
          '\n[absarna] VITE_STORAGE_ORIGIN is not set, so the Content-Security-Policy will not\n'
          + '          allow object storage. Video playback and PDF reading will be blocked.\n'
          + '          Set it to the bucket origin, e.g. https://nbg1.your-objectstorage.com\n')
      }

      const directives = {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'object-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"],
        // youtube.com serves the IFrame Player API this app loads on demand for embedded videos.
        'script-src': ["'self'", 'https://www.youtube.com', ...inlineScriptHashes],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        // blob: and data: are for what the app generates itself — pdf.js renders pages to
        // canvases and hands back blob URLs, and small inline images arrive as data URIs.
        // img.youtube.com/i.ytimg.com are video posters derived from a YouTube id. The yt3 hosts
        // are channel avatars: /api/youtube/resolve prefills a new channel's logoUrl with one, and
        // it is then hotlinked as that channel's avatar on every card, detail page and channel
        // header. Without them here the prefill silently produces a broken image in production
        // and works fine in dev, since a meta CSP is the only thing enforcing this.
        'img-src': [
          "'self'", 'data:', 'blob:',
          'https://img.youtube.com', 'https://i.ytimg.com',
          'https://yt3.ggpht.com', 'https://yt3.googleusercontent.com',
          storage,
        ],
        'media-src': ["'self'", 'blob:', storage],
        'connect-src': ["'self'", api, storage],
        'frame-src': ['https://www.youtube.com', 'https://www.youtube-nocookie.com'],
        // pdf.js runs its parser in a worker loaded from our own bundle; blob: covers the
        // fallback path where it inlines the worker instead.
        'worker-src': ["'self'", 'blob:'],
      }

      const policy = Object.entries(directives)
        .map(([name, sources]) => `${name} ${sources.filter(Boolean).join(' ')}`)
        .join('; ')

      return {
        html,
        tags: [{
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        }],
      }
    },
  },
})

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, __dirname, '')
  const isProduction = command === 'build' && mode === 'production'
  return {
    plugins: [react(), contentSecurityPolicy(env, isProduction)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
    },
  }
})
