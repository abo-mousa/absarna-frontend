import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { JourneyContext } from './journeyContext';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSignInPrompt } from '@/contexts/SignInPromptContext';
import { useUserScope } from '@/hooks/useUserScope';
import { onProgressReport } from '@/lib/progressEvents';
import { activeQadaGoalId, endQada } from '@/lib/qada';
import { queryKeys } from '@/lib/queryKeys';
import { safeStorage } from '@/lib/safeStorage';
import { goalTitle, isolate } from '@/lib/goalText';
import { t } from '@/i18n';

// Both carry the Qur'an and hadith catalogue, which no page but these needs: loaded when first
// opened, so the entry bundle every visitor downloads does not carry it.
const GoalDialog = lazy(() => import('./GoalDialog'));
const CompletionMoment = lazy(() => import('./CompletionMoment'));

const SHOWN_KEY = 'absarna.completionsShown';

function readShown() {
    try {
        return JSON.parse(safeStorage.getItem(SHOWN_KEY) || '[]');
    } catch {
        return [];
    }
}

/**
 * The progress tab's app-wide half: the one goal dialog every «اجعله وِردًا» opens, and the
 * listener for what a progress report answers — the finishing moment when a programme or book is
 * completed, and a short word when a daily portion is filled (PROGRESS-AND-GOALS.md §7.5).
 *
 * <p>Signed out, «اجعله وِردًا» opens the sign-in popup, whose links come back here; unverified,
 * the dialog shows the verification notice instead of a form (§7.10).
 */
export function JourneyProvider({ children }) {
    const { token, user } = useAuth();
    const { promptSignIn } = useSignInPrompt();
    const [dialog, setDialog] = useState(null);

    const navigate = useNavigate();
    /**
     * With a target (a programme, a book, a habit, a proposal) the dialog opens on how much; with
     * nothing, choosing WHAT is a page of its own (`/journey/choose`), not a first step squeezed
     * into a dialog. `onCreated` runs once the goal exists — the choosing page goes to «طلب العلم».
     */
    const openGoal = useCallback((prefill = null, { onCreated = null } = {}) => {
        if (!token) {
            promptSignIn('goal');
            return;
        }
        if (!prefill?.kind) {
            navigate('/journey/choose');
            return;
        }
        setDialog({ prefill, onCreated });
    }, [token, promptSignIn, navigate]);
    const editGoal = useCallback((goal) => setDialog({ goal }), []);
    const value = useMemo(() => ({ openGoal, editGoal }), [openGoal, editGoal]);

    return (
        <JourneyContext.Provider value={value}>
            {children}
            {token && (
                <>
                    {dialog && (
                        <Suspense fallback={null}>
                            <GoalDialog
                                open
                                onClose={() => setDialog(null)}
                                goal={dialog.goal || null}
                                prefill={dialog.prefill || null}
                                onCreated={dialog.onCreated || null}
                                unverified={user?.emailVerified === false}
                            />
                        </Suspense>
                    )}
                    <ProgressMoments onNextGoal={() => navigate('/journey/choose')} />
                </>
            )}
        </JourneyContext.Provider>
    );
}

function ProgressMoments({ onNextGoal }) {
    const [completion, setCompletion] = useState(null);
    const queryClient = useQueryClient();
    const scope = useUserScope();
    const { showToast } = useToast();

    useEffect(() => onProgressReport((answer) => {
        if (answer.completion) {
            const shown = readShown();
            if (shown.includes(answer.completion.id)) return;
            safeStorage.setItem(SHOWN_KEY, JSON.stringify([...shown, answer.completion.id].slice(-50)));
            setCompletion(answer.completion);
            return;
        }
        // The make-up ends the moment yesterday's portion is done: every report after it is
        // today's (the backend stops crediting too, so this only keeps the tab honest).
        if (answer.portionsCompleted.some((done) => done.goalId === activeQadaGoalId())) endQada();
        // One word per filled portion, named — never a count, never a streak.
        const goals = queryClient.getQueryData(queryKeys.goals(scope)) || [];
        answer.portionsCompleted.forEach((done) => {
            const goal = goals.find((candidate) => candidate.id === done.goalId);
            showToast(goal
                ? t('journey.portionDone', { title: isolate(goalTitle(goal)) })
                : t('journey.portionDonePlain'), 'success', 5000);
        });
    }), [queryClient, scope, showToast]);

    if (!completion) return null;
    return (
        <Suspense fallback={null}>
            <CompletionMoment
                completion={completion}
                onClose={() => setCompletion(null)}
                onNextGoal={() => { setCompletion(null); onNextGoal(); }}
            />
        </Suspense>
    );
}

export default JourneyProvider;
