/**
 * The separator between two items on a metadata line — a short drawn rule, never a «·».
 *
 * <p>Set beside Arabic-Indic digits a middle dot reads as a zero: «السيرة النبوية · ١٠٣» looked
 * like «٠١٠٣», and «مشاهدات · ٣ مارس» like a date with a digit too many. A drawn rule is not a
 * character, so no font can make it one. `bg-current` takes the line's own text colour, so it is as
 * quiet as the words around it. Decorative only: the items it separates carry the meaning.
 */
function MetaDivider({ className = '' }) {
    return <span aria-hidden="true" className={`inline-block w-px h-2.5 mx-0.5 bg-current opacity-50 flex-shrink-0 ${className}`} />;
}

export default MetaDivider;
