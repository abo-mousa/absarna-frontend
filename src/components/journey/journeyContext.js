import { createContext, useContext } from 'react';

export const JourneyContext = createContext({ openGoal: () => {}, editGoal: () => {} });

/** `openGoal(prefill?)` starts a goal — pre-filled from a programme, a book or a proposal; `editGoal(goal)` edits one. */
export const useJourney = () => useContext(JourneyContext);
