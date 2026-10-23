import { useEffect, useRef, type RefObject } from "react";
import FilmFrame from "./FilmFrame";
import CurvedPerforations, { BAND_H, HOLES } from "./CurvedPerforations";
import { filmFramesData } from "./filmData";
import { TOP, BOTTOM, smoothPath } from "../ScreenOutline";
import { LOGO_MOVE_END, REEL_END } from "../Stage/ScrollLogo";

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
const SPAN = RIGHT_X - LEFT_X;

interface Props {
    scrollRootRef: RefObject<HTMLElement | null>;
}

/**
 * The film strip that rolls across the drawn screen.
 *
 * This used to hang off `useScrollProgress`, so every scroll tick set React
 * state, re-rendered, and ran an effect that called getBoundingClientRect()
 * on the container and again on all ten frames — reading layout, writing
 * styles, then reading again, which forces a synchronous re-layout per frame.
 * That is what made the roll stutter.
 *
 * Now the geometry that cannot change mid-scroll (container width, track
 * width, each frame's centre inside the track, the sprocket hole nodes) is
 * measured ONCE into `geom`, and a single rAF loop reads the scroll position
 * and writes transforms. No React render, no layout read, per frame. The
 * measurement is redone only when the element actually resizes.
 */
export default function ReelOnScreen({ scrollRootRef }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const perfRef = useRef<HTMLDivElement>(null);
    const frameRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const container = containerRef.current;
        const track = trackRef.current;
        const perfLayer = perfRef.current;
        if (!container || !track) return;

        /** everything measured from layout, refreshed only on resize */
        let geom = {
            containerW: 0,
            trackW: 0,
            totalTravel: 0,
            pxPerPct: 1,
            /** each frame's centre, in px from the track's left edge */
            centres: [] as number[],
            holes: [] as { el: SVGRectElement; base: number; top: boolean }[],
        };

        const measure = () => {
            const containerW = container.getBoundingClientRect().width;
            const trackW = track.scrollWidth;
            const spacing = SPAN / HOLES;

            geom = {
                containerW,
                trackW,
                // ONE constant-velocity travel for the whole phase: the film starts
                // fully off the right edge and ends fully off the left edge, so
                // entry, roll and exit are all the same linear motion.
                totalTravel: containerW + trackW,
                pxPerPct: containerW / SPAN,
                // offsetLeft is layout, and the per-frame scaling is a transform,
                // so these centres stay valid however the frames are scaled
                centres: frameRefs.current.map((el) =>
                    el ? el.offsetLeft + el.offsetWidth / 2 : 0
                ),
                holes: perfLayer
                    ? Array.from(perfLayer.querySelectorAll<SVGRectElement>(".reel-hole")).map(
                          (el) => ({
                              el,
                              base: (Number(el.dataset.idx) + 0.5) * spacing,
                              top: el.dataset.band === "t",
                          })
                      )
                    : [],
            };
        };

        /** writes one frame of the sequence; pure math, no layout reads */
        const paint = (reelProgress: number) => {
            const { containerW, trackW, totalTravel, pxPerPct, centres, holes } = geom;

            const x = containerW - totalTravel * reelProgress;
            track.style.transform = `translate3d(${x}px, 0, 0)`;

            // ---- sprocket bands: bounded by the film's leading AND trailing edges ----
            if (perfLayer) {
                const leadPct = LEFT_X + Math.max(0, x) / pxPerPct;
                const trailPx = Math.max(0, containerW - (x + trackW));
                const trailPct = 100 - RIGHT_X + trailPx / pxPerPct;
                perfLayer.style.clipPath = `inset(0 ${Math.min(100, trailPct)}% 0 ${Math.min(
                    100,
                    leadPct
                )}%)`;

                // scroll offset in outline-% — identical speed/direction to the track
                const offsetPct = x / pxPerPct;
                for (let i = 0; i < holes.length; i++) {
                    const h = holes[i];
                    const wrapped = (((h.base + offsetPct) % SPAN) + SPAN) % SPAN;
                    const hx = LEFT_X + wrapped;
                    h.el.setAttribute("x", String(hx - 0.55));
                    h.el.setAttribute(
                        "y",
                        h.top
                            ? String(yAt(TOP, hx) + BAND_H / 2 - 0.75)
                            : String(yAt(BOTTOM, hx) - BAND_H / 2 - 0.75)
                    );
                }
            }

            // ---- per-frame size from where the frame sits on the curved screen ----
            for (let i = 0; i < frameRefs.current.length; i++) {
                const el = frameRefs.current[i];
                if (!el) continue;
                // centre of this frame relative to the container, derived rather
                // than measured — no getBoundingClientRect in the loop
                const centreInContainer = x + centres[i];
                const px = LEFT_X + (centreInContainer / containerW) * SPAN;
                // big at both ends (the screen is tallest there), easing to the
                // mid size at the centre
                const relativeScale = (screenHeightAt(px) / MID_HEIGHT) * FRAME_SCALE;
                const nx = Math.min(1, Math.max(-1, (px - 50) / 50));
                el.style.transform = `scale(${relativeScale}) rotateY(${nx * 10}deg)`;
            }
        };

        let frameId = 0;
        let lastP = -1;

        const tick = () => {
            const root = scrollRootRef.current;
            if (root) {
                const rect = root.getBoundingClientRect();
                const scrollable = rect.height - window.innerHeight;
                const raw = scrollable > 0 ? -rect.top / scrollable : 0;
                const progress = Math.min(1, Math.max(0, raw));
                const p = Math.min(
                    1,
                    Math.max(0, (progress - REEL_START) / (REEL_END - REEL_START))
                );
                // sub-pixel changes aren't worth a repaint
                if (Math.abs(p - lastP) > 0.00002) {
                    lastP = p;
                    paint(p);
                }
            }
            frameId = requestAnimationFrame(tick);
        };

        measure();
        paint(0);
        frameId = requestAnimationFrame(tick);

        // the stage box changes with the viewport, so the cached geometry has to
        const ro = new ResizeObserver(() => {
            measure();
            lastP = -1; // force the next tick to repaint against the new geometry
        });
        ro.observe(container);

        return () => {
            cancelAnimationFrame(frameId);
            ro.disconnect();
        };
    }, [scrollRootRef]);

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
                            style={{
                                perspective: "1400px",
                                width: "max-content",
                                // keeps the strip on its own compositor layer so the
                                // per-frame transform writes never repaint the page
                                backfaceVisibility: "hidden",
                            }}
                        >
                            <div className="flex h-full items-center gap-4 sm:gap-5 md:gap-6 px-3 md:px-5 bg-[#141210]">
                                {filmFramesData.map((frame, i) => (
                                    <div
                                        key={frame.id}
                                        ref={(el) => {
                                            frameRefs.current[i] = el;
                                        }}
                                        className="flex-shrink-0 will-change-transform"
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
