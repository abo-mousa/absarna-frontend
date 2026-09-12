/**
 * An untouched date/number field is `''` in form state, and Jackson's coercion of `""` into a
 * LocalDate/Integer on the backend is version-dependent — so strip empty strings rather than send
 * them and hope.
 */
export const stripEmpty = (obj) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== ''));
