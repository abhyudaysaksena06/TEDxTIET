import { useEffect, useRef, type RefObject } from "react";
import FilmFrame from "./FilmFrame";
import CurvedPerforations, { BAND_H, HOLES } from "./CurvedPerforations";
import { filmFramesData } from "./filmData";
import { TOP, BOTTOM, smoothPath } from "../ScreenOutline";
import { LOGO_MOVE_END, REEL_END } from "../Stage/ScrollLogo";
import useScrollProgress from "../../hooks/useScrollProgress";

// same outline path as ScreenOutline, normalized to 0-1 for an objectBoundingBox clipPath
function buildClipPath() {
    const norm = (pts: [number, number][]): [number, number][] => pts.map(([x, y]) => [x / 100, y / 100]);
    const top = smoothPath(norm(TOP));
    const bottomReversed = norm(BOTTOM).reverse();
    const right = `L ${bottomReversed[0][0]} ${bottomReversed[0][1]} `;
    const bottom = smoothPath(bottomReversed).replace(/^M[^C]+/, "");
    const left = `L ${TOP[0][0] / 100} ${TOP[0][1] / 100} Z`;
    return top + right + bottom + left;
}

const CLIP_ID = "tedx-screen-clip";

// reel runs between the logo moving out and the logo coming back
const REEL_START = LOGO_MOVE_END;

// baseline size multiplier applied on top of the curve-derived per-frame scaling
const FRAME_SCALE = 1;

// piecewise-linear lookup of the curve's y (%) at a given x (%), from the same
// keystone points that define the white outline
function yAt(points: [number, number][], px: number) {
    const clamped = Math.min(points[points.length - 1][0], Math.max(points[0][0], px));
    for (let i = 0; i < points.length - 1; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        if (clamped >= x1 && clamped <= x2) {
            const t = x2 === x1 ? 0 : (clamped - x1) / (x2 - x1);
            return y1 + (y2 - y1) * t;
        }
    }
    return points[points.length - 1][1];
}

// the screen's own physical height (bottom curve - top curve) at a given x (%) —
// tallest at both ends, shortest around the middle
function screenHeightAt(px: number) {
    return yAt(BOTTOM, px) - yAt(TOP, px);
}
const MID_HEIGHT = screenHeightAt(50);

// outline's horizontal extent (%), used to position the reel area exactly on it
const LEFT_X = TOP[0][0];
const RIGHT_X = TOP[TOP.length - 1][0];
const TOP_MIN = Math.min(...TOP.map(([, y]) => y));
const BOTTOM_MAX = Math.max(...BOTTOM.map(([, y]) => y));

interface Props {
    scrollRootRef: RefObject<HTMLElement | null>;
}

export default function ReelOnScreen({ scrollRootRef }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const perfRef = useRef<HTMLDivElement>(null);
    const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
    const progress = useScrollProgress(scrollRootRef);

    const reelProgress = Math.min(1, Math.max(0, (progress - REEL_START) / (REEL_END - REEL_START)));

    useEffect(() => {
        const container = containerRef.current;
        const track = trackRef.current;
        if (!container || !track) return;

        const containerRect = container.getBoundingClientRect();
        const trackWidth = track.scrollWidth;
        // ONE constant-velocity travel for the whole phase: the film starts fully
        // off the right edge and ends fully off the left edge. Entry, roll and exit
        // are all the same linear motion, so the pace never changes.
        const totalTravel = containerRect.width + trackWidth;
        const x = containerRect.width - totalTravel * reelProgress;
        track.style.transform = `translateX(${x}px)`;

        // ---- sprocket bands: bounded by the film's leading AND trailing edges ----
        const perfLayer = perfRef.current;
        if (perfLayer) {
            // container width in outline-% terms -> px per outline-%
            const pxPerPct = containerRect.width / (RIGHT_X - LEFT_X);
            // band exists only where the film physically is, so it enters and leaves
            // with it. Insets are % of the full-width layer, so they carry the
            // outline's own left/right offsets too.
            const leadPct = LEFT_X + Math.max(0, x) / pxPerPct;
            const trailPx = Math.max(0, containerRect.width - (x + trackWidth));
            const trailPct = 100 - RIGHT_X + trailPx / pxPerPct;
            perfLayer.style.clipPath = `inset(0 ${Math.min(100, trailPct)}% 0 ${Math.min(100, leadPct)}%)`;

            // scroll offset in outline-% — identical speed/direction to the track
            const offsetPct = x / pxPerPct;
            const span = RIGHT_X - LEFT_X;
            const spacing = span / HOLES;
            perfLayer.querySelectorAll<SVGRectElement>(".reel-hole").forEach((hole) => {
                const idx = Number(hole.dataset.idx);
                const band = hole.dataset.band;
                const base = (idx + 0.5) * spacing;
                const wrapped = ((((base + offsetPct) % span) + span) % span);
                const hx = LEFT_X + wrapped;
                hole.setAttribute("x", String(hx - 0.55));
                hole.setAttribute(
                    "y",
                    band === "t"
                        ? String(yAt(TOP, hx) + BAND_H / 2 - 0.75)
                        : String(yAt(BOTTOM, hx) - BAND_H / 2 - 0.75)
                );
            });
        }

        frameRefs.current.forEach((el) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const frameCenter = rect.left + rect.width / 2;
            // map this frame's center onto the outline's own 0-100 x space —
            // its size derives purely from where IT sits on the curved screen
            const px =
                LEFT_X + ((frameCenter - containerRect.left) / containerRect.width) * (RIGHT_X - LEFT_X);
            const localHeight = screenHeightAt(px);
            // big at both ends (screen is tallest there), easing to the mid size at center
            const relativeScale = (localHeight / MID_HEIGHT) * FRAME_SCALE;
            const nx = Math.min(1, Math.max(-1, (px - 50) / 50));
            const rotateY = nx * 10;
            el.style.transform = `scale(${relativeScale}) rotateY(${rotateY}deg)`;
        });
    }, [reelProgress]);

    return (
        <>
            <svg width="0" height="0" className="absolute">
                <defs>
                    <clipPath id={CLIP_ID} clipPathUnits="objectBoundingBox">
                        <path d={buildClipPath()} />
                    </clipPath>
                </defs>
            </svg>
            {/* clip container is STATIC and identical to the outline — the reel can
                never escape it horizontally or vertically */}
            <div
                className="absolute inset-0 z-0 overflow-hidden"
                style={{
                    clipPath: `url(#${CLIP_ID})`,
                    // dulled 30% so the reel reads as projected light, not a UI overlay
                    filter: "brightness(0.95) saturate(0.95)",
                }}
            >
                <div className="absolute inset-0">
                    {/* reel area spans the outline's own bounding box, so the strip's
                        top/bottom bars sit right on the outline's upper/lower edges and
                        get shaved by the clip along the curves — reading as connected */}
                    <div
                        ref={containerRef}
                        className="absolute"
                        style={{
                            left: `${LEFT_X}%`,
                            right: `${100 - RIGHT_X}%`,
                            top: `${TOP_MIN}%`,
                            bottom: `${100 - BOTTOM_MAX}%`,
                        }}
                    >
                        <div
                            ref={trackRef}
                            className="absolute inset-y-0 will-change-transform"
                            style={{ perspective: "1400px", width: "max-content" }}
                        >
                            <div className="flex h-full items-center gap-4 sm:gap-5 md:gap-6 px-3 md:px-5 bg-[#141210]">
                                {filmFramesData.map((frame, i) => (
                                    <div
                                        key={frame.id}
                                        ref={(el) => {
                                            frameRefs.current[i] = el;
                                        }}
                                        className="flex-shrink-0"
                                    >
                                        <FilmFrame data={frame} index={i} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* sprocket bands drawn along the actual curves — revealed with the
                        film's leading edge, holes rolling at exactly the track's speed */}
                    <div ref={perfRef} className="absolute inset-0">
                        <CurvedPerforations />
                    </div>
                </div>
            </div>
        </>
    );
}
