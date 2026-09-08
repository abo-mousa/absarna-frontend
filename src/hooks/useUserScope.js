import { useAuth } from '@/contexts/AuthContext';
import { userScopeOf } from '@/lib/queryKeys';

/**
 * The cache scope for the current viewer — see `lib/queryKeys.js`.
 *
 * <p>Read from the token, not from `user`, so it is available synchronously on the first render
 * and does not flip from `null` to an id once the profile fetch lands (which would run every
 * scoped query twice per page load).
 */
export const useUserScope = () => userScopeOf(useAuth()?.token);

export default useUserScope;
