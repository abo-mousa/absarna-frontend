/**
 * «هل تقصد name@gmail.com؟» — the common mistyped domain, caught while the address is being typed,
 * before a verification mail goes to a mailbox that does not exist (and bounces, and costs the
 * sending domain reputation). Nothing is changed unless the reader taps the suggestion: a domain
 * one letter off a popular one is usually a typo and occasionally somebody's real address.
 *
 * <p>Two lists, for that reason. `POPULAR` is what a typo is pulled towards — the providers readers
 * here actually use. `REAL` is every domain that must never be "corrected", popular or not:
 * `mail.com` is one letter from `gmail.com`, and `ymail.com` one from `yahoo.com`'s neighbour.
 */
const POPULAR = [
    'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com',
    'msn.com', 'aol.com', 'proton.me', 'protonmail.com', 'yandex.com', 'mail.ru',
    'hotmail.fr', 'yahoo.fr', 'outlook.fr', 'hotmail.co.uk', 'yahoo.co.uk', 'gmx.de', 'web.de', 'googlemail.com',
];
const REAL = new Set([
    ...POPULAR,
    'mail.com', 'ymail.com', 'gmx.com', 'gmx.net', 'me.com', 'mac.com', 'live.fr', 'live.co.uk',
    'outlook.sa', 'hotmail.de', 'yahoo.de', 'rocketmail.com', 'pm.me', 'zoho.com', 'tutanota.com',
    'fastmail.com', 'hey.com', 'qq.com', '163.com', 'naver.com',
]);

/** Optimal-string-alignment distance: an edit, an insertion, a deletion or two letters swapped. */
function distance(a, b) {
    const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) rows[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
            }
        }
    }
    return rows[a.length][b.length];
}

/**
 * The address with its domain corrected, or null when there is nothing to suggest — not an
 * address yet, a domain we know is real, or nothing popular close enough to be the one meant.
 * Close enough is one edit for a short domain and two for a longer one ("hotnail.cmo").
 */
export function suggestEmail(address) {
    const value = (address || '').trim();
    const at = value.lastIndexOf('@');
    if (at < 1 || at === value.length - 1) return null;
    const local = value.slice(0, at);
    const domain = value.slice(at + 1).toLowerCase();
    if (REAL.has(domain)) return null;
    // "name@gmail" — the ending left off; "name@gmailcom" — its dot.
    if (!domain.includes('.')) {
        const whole = POPULAR.find((known) => known.split('.')[0] === domain || known.replaceAll('.', '') === domain);
        return whole ? `${local}@${whole}` : null;
    }
    let best = null;
    let bestDistance = Infinity;
    for (const known of POPULAR) {
        const d = distance(domain, known);
        if (d < bestDistance) {
            best = known;
            bestDistance = d;
        }
    }
    const allowed = domain.length <= 8 ? 1 : 2;
    return bestDistance > 0 && bestDistance <= allowed ? `${local}@${best}` : null;
}
