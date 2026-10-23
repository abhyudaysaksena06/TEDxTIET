import { useEffect, useRef } from "react";
import { filmFramesData } from "../Reel/filmData";

/**
 * The speaker currently centred in the reel, standing on the red circle in the
 * stage photograph.
 *
 * The carpet's position is measured from HOME_BG's own pixels rather than
 * eyeballed — the ellipse was found by scanning the lower half of the decoded
 * bitmap for saturated red, excluding the railings at either edge:
 *
 *     centre   x 49.93%  y 65.69%   of the stage box
 *     ellipse  63.93% wide, 8.20% tall
 *
 * The figures are real cut-outs of the speakers on that stage, matted locally
 * from the same photographs the reel shows. Nothing about them is invented —
 * their own pixels are kept and the background is dropped, so a seated
 * performer stays seated.
 */

/** carpet centre, as a percentage of the stage box */
export const CARPET = { x: 49.93, y: 65.69 };

/** figure height as a share of the stage height — a person at that distance */
export const FIGURE_H = 12;

/**
 * Every cut-out renders at the same height, which is right for the nine
 * standing speakers but wrong for Keshav: he performed seated with a guitar,
 * and a seated silhouette drawn to a standing person's height reads as a giant.
 * Scaled to roughly the proportion a seated figure actually occupies.
 */
const HEIGHT_FACTOR: Record<string, number> = {
    keshav2: 0.62,
};

/** how far the figure leans toward the pointer */
const LEAN_DEG = 7;
const SHIFT_PX = 10;

/** the matted counterpart of each reel frame */
const CUTOUTS = filmFramesData.map((f) => {
    const src = f.image.replace("/Speakers/", "/Speakers/cut/");
    const key = src.split("/").pop()!.replace(".webp", "");
    return { name: f.name, src, heightFactor: HEIGHT_FACTOR[key] ?? 1 };
});

interface Props {
    /** index into filmFramesData of the speaker nearest the screen centre */
    index: number;
    /** false while the reel is dormant or the logo owns the screen */
    visible: boolean;
    /** where the feet stand, in % of the stage box — the placer overrides this */
    carpet?: { x: number; y: number };
    /** figure height as a share of the stage height */
    figureH?: number;
}

export default function CarpetFigure({
    index,
    visible,
    carpet = CARPET,
    figureH = FIGURE_H,
}: Props) {
    const leanRef = useRef<HTMLDivElement>(null);
    const frame = useRef(0);
    const target = useRef(0);
    const current = useRef(0);

    // A photograph cannot turn its head, so this does not pretend to be gaze:
    // the figure leans a few degrees toward the pointer and the contact shadow
    // slides the other way, which is what makes the lean read as physical.
    useEffect(() => {
        if (!visible) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) return;

        const paint = () => {
            frame.current = 0;
            // ease toward the pointer rather than snapping to it
            current.current += (target.current - current.current) * 0.08;
            const el = leanRef.current;
            if (el) {
                const t = current.current;
                // the -100% must stay in front: it is what puts the FEET on the
                // carpet rather than the figure's middle
                el.style.transform = `translateY(-100%) translateX(${t * SHIFT_PX}px) rotateY(${t * LEAN_DEG}deg)`;
            }
            // keep easing until it has settled
            if (Math.abs(target.current - current.current) > 0.001) {
                frame.current = requestAnimationFrame(paint);
            }
        };

        const onMove = (e: PointerEvent) => {
            // -1 (pointer far left) .. +1 (far right)
            target.current = (e.clientX / window.innerWidth) * 2 - 1;
            if (!frame.current) frame.current = requestAnimationFrame(paint);
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        return () => {
            window.removeEventListener("pointermove", onMove);
            if (frame.current) cancelAnimationFrame(frame.current);
        };
    }, [visible]);

    return (
        <div
            aria-hidden="true"
            data-carpet-figure=""
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
            style={{
                opacity: visible ? 1 : 0,
                transition: "opacity 600ms ease",
            }}
        >
            <div
                ref={leanRef}
                className="absolute"
                style={{
                    left: `${carpet.x}%`,
                    top: `${carpet.y}%`,
                    height: `${figureH}%`,
                    // A zero-width box anchored ON the carpet point. translateY
                    // (-100%) lifts it so its BOTTOM edge sits on the circle —
                    // the figure stands on the carpet instead of being centred
                    // on it — and the images inside centre themselves on its
                    // left edge, which is the carpet's x.
                    width: 0,
                    transform: "translateY(-100%)",
                    transformOrigin: "bottom center",
                    perspective: "900px",
                    willChange: "transform",
                }}
            >
                {/* contact shadow, squashed to the carpet's own perspective */}
                <div
                    className="absolute left-0 -translate-x-1/2"
                    style={{
                        bottom: "-1.5%",
                        width: "9vw",
                        height: "7%",
                        borderRadius: "50%",
                        background:
                            "radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)",
                    }}
                />

                {/* every cut-out is mounted; only the centred one is opaque, so
                    the change is a crossfade with nothing to load mid-scroll */}
                {CUTOUTS.map((c, i) => (
                    <img
                        key={c.src}
                        src={c.src}
                        alt=""
                        className="absolute bottom-0 left-0 w-auto max-w-none -translate-x-1/2 select-none"
                        style={{
                            height: `${c.heightFactor * 100}%`,
                            opacity: i === index ? 1 : 0,
                            transition: "opacity 520ms ease",
                            // lit from above like the rest of the stage
                            filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.45)) brightness(0.96)",
                        }}
                        draggable={false}
                    />
                ))}
            </div>
        </div>
    );
}
