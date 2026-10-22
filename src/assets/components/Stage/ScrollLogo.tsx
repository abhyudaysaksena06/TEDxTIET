import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import StageScene from "./StageScene";
import useScrollProgress from "../../hooks/useScrollProgress";

// the logo holds this pose for the whole sequence — it no longer travels to a
// corner; it simply fades out to hand the screen over to the reel, then back in
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
    /** false until the user clicks the hero: the reel sequence is dormant */
    active?: boolean;
    onSelect?: () => void;
}

/** half of the title crossfade: out, swap, back in */
const SWAP_FADE_MS = 420;

export default function ScrollLogo({ scrollRootRef, active = false, onSelect }: Props) {
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

    useEffect(() => {
        const wanted = active ? 'archive' : 'logo';
        if (wanted === titleMode) return;

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
    }, [active, titleMode]);

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

    const { x, y, scale } = START_TRANSFORM;
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
