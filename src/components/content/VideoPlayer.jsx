import { useEffect, useRef } from 'react';
import { resolveMediaUrl, extractYouTubeId } from '@/lib/media';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/client';
import { flushOnUnload } from '@/lib/api/beacon';

// How often onTimeUpdate (fires several times a second) is allowed to actually hit the
// backend — watch history is a convenience feature, not an analytics stream, so this stays
// coarse on purpose. Safe to keep coarse because `pagehide` below now catches the exact-exit
// moment separately — this interval only bounds how much is lost if the tab disappears
// *without* a clean exit (crash, force-kill), not the common refresh/navigate-away case.
const PROGRESS_REPORT_INTERVAL_MS = 60000;

// Below this, a play doesn't count as a "watch" for history purposes — otherwise clicking a
// thumbnail by accident and backing out immediately would still create/bump a watch-history
// row, pushing an actually-watched video out of the per-user cap.
const MIN_WATCH_SECONDS = 5;

function VideoPlayer({ contentId, sourceType, sourceUrl, title }) {
    const { token } = useAuth();
    const videoRef = useRef(null);
    const lastReportedAtRef = useRef(0);
    // Mirrors token/contentId into refs so the unmount effect below always reports against
    // the latest values without re-subscribing (and re-flushing) on every render.
    const authRef = useRef({ token, contentId });
    authRef.current = { token, contentId };

    const reportProgress = (seconds, { token: authToken, contentId: authContentId } = authRef.current) => {
        if (!authToken || !authContentId) return;
        const progressSeconds = Math.floor(seconds);
        if (progressSeconds < MIN_WATCH_SECONDS) return;
        api.post(`/contents/${authContentId}/watch`, { progressSeconds }).catch(() => {
            // Best-effort: never let a failed watch-history write disrupt playback.
        });
    };

    const handleTimeUpdate = (e) => {
        const now = Date.now();
        if (now - lastReportedAtRef.current < PROGRESS_REPORT_INTERVAL_MS) return;
        lastReportedAtRef.current = now;
        reportProgress(e.currentTarget.currentTime);
    };

    const handlePauseOrEnded = (e) => {
        lastReportedAtRef.current = Date.now();
        reportProgress(e.currentTarget.currentTime);
    };

    // Flush the last-seen position on unmount — navigating away mid-playback doesn't
    // reliably fire onPause first. Covers in-app (SPA) navigation only: a real unmount never
    // happens on a hard refresh/tab-close, since the whole JS context is discarded first.
    useEffect(() => {
        return () => {
            const el = videoRef.current;
            if (el && el.currentTime > 0) {
                reportProgress(el.currentTime, authRef.current);
            }
        };
    }, []);

    // Covers the hard-refresh/tab-close/hard-navigation case above: `pagehide` fires in those
    // cases (unlike unmount), but by then a normal axios/XHR call would get cancelled mid-flight
    // by the browser, so this uses a `keepalive` fetch instead — see lib/api/beacon.js.
    useEffect(() => {
        const handlePageHide = () => {
            const el = videoRef.current;
            const { contentId } = authRef.current;
            const progressSeconds = el ? Math.floor(el.currentTime) : 0;
            if (progressSeconds < MIN_WATCH_SECONDS || !contentId) return;
            flushOnUnload(`/contents/${contentId}/watch`, { progressSeconds });
        };
        window.addEventListener('pagehide', handlePageHide);
        return () => window.removeEventListener('pagehide', handlePageHide);
    }, []);

    if (sourceType === 'LOCAL' || sourceType === 'STREAM') {
        return (
            <video
                ref={videoRef}
                controls
                playsInline
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onPause={handlePauseOrEnded}
                onEnded={handlePauseOrEnded}
                className="w-full max-h-[500px] rounded-lg bg-black"
            >
                <source src={resolveMediaUrl(sourceUrl)} type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو
            </video>
        );
    }

    if (sourceType === 'TELEGRAM') {
        return (
            <video
                ref={videoRef}
                controls
                onTimeUpdate={handleTimeUpdate}
                onPause={handlePauseOrEnded}
                onEnded={handlePauseOrEnded}
                className="w-full max-h-[500px] rounded-lg bg-black"
            >
                <source src={sourceUrl} type="video/mp4" />
            </video>
        );
    }

    if (sourceType === 'YOUTUBE') {
        const videoId = extractYouTubeId(sourceUrl);

        if (!videoId) {
            return (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
                    شاهد على يوتيوب
                </a>
            );
        }

        // No native timeupdate event without the YouTube IFrame Player API, so watch
        // progress isn't tracked for embedded YouTube videos.
        return (
            <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden">
                <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={title}
                    frameBorder="0"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
            شاهد الفيديو
        </a>
    );
}

export default VideoPlayer;
