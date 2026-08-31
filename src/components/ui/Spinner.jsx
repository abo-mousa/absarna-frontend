// size stays inline (runtime-variable), everything else is Tailwind — including
// the spin animation itself, which Tailwind ships as `animate-spin` out of the box.
function Spinner({ size = '40px' }) {
    return (
        <div className="flex justify-center py-10">
            <div
                className="rounded-full border-[3px] border-border border-t-primary animate-spin"
                style={{ width: size, height: size }}
            />
        </div>
    );
}

export default Spinner;
