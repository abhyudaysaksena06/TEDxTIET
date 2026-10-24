import { useRef } from "react";
import type { RefObject } from "react";
import StageScene from "./StageScene";
import useScrollProgress from "../../hooks/useScrollProgress";
import type { ProgressStore } from "../../lib/sequenceProgress";
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
    /** drive the sequence from this instead of the scroll track (phones swipe it) */
    progressStore?: ProgressStore | null;
}


export default function ScrollLogo({
    scrollRootRef,
    active = false,
    onSelect,
    scaleK = 1,
    stageW = 0,
    stageH = 0,
    progressStore = null,
}: Props) {
    const progress = useScrollProgress(scrollRootRef, progressStore);
    const frozenRef = useRef({ frozen: false, x: FROZEN_ROTATION.x, y: FROZEN_ROTATION.y });
    // "as soon as I scroll" — any progress at all freezes cursor/drag rotation
    frozenRef.current.frozen = active && progress > 0;

    // The crossfade between TEDxTIET and ARCHIVE OF VOICES lives inside
    // StageScene now, driven from its render loop. It used to be staged here
    // with two setTimeouts and a CSS opacity dip, which could not line up with
    // the moment the new meshes actually existed — so the title popped. Here we
    // only say WHICH title we want; the scene handles getting there.
    const titleMode: 'logo' | 'archive' = active ? 'archive' : 'logo';

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
    const shown = opacity;

    return (
        <div
            className="absolute inset-0 z-10"
            style={{
                transform: `translate(${x}px, ${y}px) scale(${scale})`,
                opacity: shown,
                // no CSS transition: this opacity is scroll-driven and must
                // track the scrollbar exactly. The title change is animated
                // inside the scene instead.
                transition: 'none',
                // fully faded out: stop it swallowing pointer events over the reel
                pointerEvents: shown < 0.05 ? "none" : "auto",
            }}
        >
            <StageScene
                frozenRef={frozenRef}
                mode={titleMode}
                // always clickable: the scene reads its target mode every frame,
                // so clicking mid-transition just reverses it
                onSelect={onSelect}
            />
        </div>
    );
}
