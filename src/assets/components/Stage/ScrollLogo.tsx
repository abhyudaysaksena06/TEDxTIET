import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import StageScene from "./StageScene";
import useScrollProgress from "../../hooks/useScrollProgress";
import { TOP, BOTTOM } from "../ScreenOutline";

/**
 * The centre of the drawn screen, in % of the stage box, derived from the same
 * measured keystones the outline is built from. The logo is placed here rather
 * than at hand-tuned pixel offsets, so it stays centred on the screen at every
 * viewport instead of drifting as the crop changes.
 */
const meanY = (pts: [number, number][]) => pts.reduce((s, p) => s + p[1], 0) / pts.length;
export const OUTLINE_CENTER = {
    x: (TOP[0][0] + TOP[TOP.length - 1][0]) / 2,
    y: (meanY(TOP) + meanY(BOTTOM)) / 2,
};

// the logo holds this pose for the whole sequence — it no longer travels to a
// corner; it simply fades out to hand the screen over to the reel, then back in.
// x/y are the old hand-tuned fallback, used only until the stage is measured.
export const START_TRANSFORM = { x: 20.8, y: -48.8, scale: 0.8536 };
export const FROZEN_ROTATION = { x: 0.0424, y: 0.0392 };

// The hero track is 700vh (600vh of scroll). The whole logo+reel sequence is
// finished by SEQ_END, leaving the final ~100vh free for the registration panel
// to slide up and stack over the still-pinned hero. These fractions are the old
// 0.2 / 0.85 rescaled into that shorter window, so the pacing is unchanged.
export const SEQ_END = 0.8333;
export const LOGO_MOVE_END = 0.1667;

// the reel finishes here; the scroll between this and SEQ_END fades the logo back
// in so the hero is whole again before the next section climbs over it
export const REEL_END = 0.7083;

const ease = (t: number) => t * t * (3 - 2 * t); // smoothstep, for a swift-but-smooth fade

interface Props {
    scrollRootRef: RefObject<HTMLElement | null>;
    /** stage width / desktop reference width — keeps the logo proportional
     *  to the drawn screen instead of a fixed pixel size */
    scaleK?: number;
    /** the stage box in px, so the logo can be centred on the drawn screen */
    stageW?: number;
    stageH?: number;
    /** false until the user clicks the hero: the reel sequence is dormant */
    active?: boolean;
    onSelect?: () => void;
}

/** half of the title crossfade: out, swap, back in */
const SWAP_FADE_MS = 420;

export default function ScrollLogo({
    scrollRootRef,
    active = false,
    onSelect,
    scaleK = 1,
    stageW = 0,
    stageH = 0,
}: Props) {
    const progress = useScrollProgress(scrollRootRef);
    const frozenRef = useRef({ frozen: false, x: FROZEN_ROTATION.x, y: FROZEN_ROTATION.y });
    // "as soon as I scroll" — any progress at all freezes cursor/drag rotation
    frozenRef.current.frozen = active && progress > 0;

    // The 3D title can't tween between two different letter meshes, so the swap
    // is hidden inside a crossfade: dim all the way out, rebuild the geometry
    // while nothing is visible, then bring it back up.
    const [titleMode, setTitleMode] = useState<'logo' | 'archive'>('logo');
    const [swapping, setSwapping] = useState(false);
    // true for the whole out-and-back window; gates the CSS transition so it
    // can't add lag to the scroll-driven fade later on
    const [swapActive, setSwapActive] = useState(false);

    // `titleMode` is read through a ref, NOT listed as a dependency. It used to
    // be one, so calling setTitleMode below re-ran this effect, and the cleanup
    // cancelled its own still-pending `setSwapActive(false)` timer. swapActive
    // then stayed true forever, and since onSelect is suppressed while it is
    // true, the title could never be clicked back to TEDxTIET.
    const modeRef = useRef(titleMode);
    modeRef.current = titleMode;

    useEffect(() => {
        const wanted = active ? 'archive' : 'logo';
        if (wanted === modeRef.current) return;

        setSwapActive(true);
        setSwapping(true);
        const swap = setTimeout(() => {
            setTitleMode(wanted);
            // one more frame at zero so the new mesh is never seen popping in
            requestAnimationFrame(() => setSwapping(false));
        }, SWAP_FADE_MS);
        const done = setTimeout(() => setSwapActive(false), SWAP_FADE_MS * 2 + 60);

        return () => {
            clearTimeout(swap);
            clearTimeout(done);
        };
    }, [active]);

    // The logo never leaves its pose — it fades out to clear the screen for the
    // reel, holds hidden, then fades back in. Three phases:
    //   0 -> LOGO_MOVE_END : fade out
    //   .. -> REEL_END     : hidden while the reel plays
    //   .. -> SEQ_END      : fade back in
    let opacity: number;
    if (!active) {
        opacity = 1; // dormant: the hero just sits there, waiting to be clicked
    } else if (progress <= LOGO_MOVE_END) {
        opacity = 1 - ease(progress / LOGO_MOVE_END);
    } else if (progress >= REEL_END) {
        opacity = ease(Math.min(1, (progress - REEL_END) / (SEQ_END - REEL_END)));
    } else {
        opacity = 0;
    }

    // tuned on the desktop stage; scale with it so phones get the same composition
    const k = scaleK > 0 ? scaleK : 1;
    // The wrapper is inset-0 of the stage, so its untransformed centre is the
    // stage centre; this translation moves it onto the drawn screen's centre.
    // (CSS applies `scale` before `translate`, so the offset is NOT scaled.)
    const x = stageW ? ((OUTLINE_CENTER.x - 50) / 100) * stageW : START_TRANSFORM.x * k;
    const y = stageH ? ((OUTLINE_CENTER.y - 50) / 100) * stageH : START_TRANSFORM.y * k;
    const scale = START_TRANSFORM.scale * k;
    // during the swap the title dips to zero regardless of scroll state
    const shown = swapping ? 0 : opacity;

    return (
        <div
            className="absolute inset-0 z-10"
            style={{
                // a hair of scale on the dip makes the crossfade feel intentional
                transform: `translate(${x}px, ${y}px) scale(${scale * (swapping ? 0.965 : 1)})`,
                opacity: shown,
                transition: swapActive
                    ? `opacity ${SWAP_FADE_MS}ms cubic-bezier(0.4,0,0.2,1), transform ${SWAP_FADE_MS}ms cubic-bezier(0.4,0,0.2,1)`
                    : 'none',
                // fully faded out: stop it swallowing pointer events over the reel
                pointerEvents: shown < 0.05 ? "none" : "auto",
            }}
        >
            <StageScene
                frozenRef={frozenRef}
                mode={titleMode}
                // clickable in both modes so the title toggles back and forth;
                // suppressed mid-crossfade so a double-click can't desync it
                onSelect={swapActive ? undefined : onSelect}
            />
        </div>
    );
}
