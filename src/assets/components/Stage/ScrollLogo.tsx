import { useRef } from "react";
import type { RefObject } from "react";
import StageScene from "./StageScene";
import useScrollProgress from "../../hooks/useScrollProgress";

export const START_TRANSFORM = { x: 20.8, y: -48.8, scale: 0.8536 };
export const END_TRANSFORM = { x: -259.9139, y: 105.52, scale: 0.357975 };
export const FROZEN_ROTATION = { x: 0.0424, y: 0.0392 };

// The hero track is 700vh (600vh of scroll). The whole logo+reel sequence is
// finished by SEQ_END, leaving the final ~100vh free for the registration panel
// to slide up and stack over the still-pinned hero. These fractions are the old
// 0.2 / 0.85 rescaled into that shorter window, so the pacing is unchanged.
export const SEQ_END = 0.8333;
export const LOGO_MOVE_END = 0.1667;

// the reel finishes here; the scroll between this and SEQ_END walks the logo back
// to START so the hero is whole again before the next section climbs over it
export const REEL_END = 0.7083;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t); // smoothstep, for a swift-but-smooth transit

interface Props {
    scrollRootRef: RefObject<HTMLElement | null>;
}

export default function ScrollLogo({ scrollRootRef }: Props) {
    const progress = useScrollProgress(scrollRootRef);
    const frozenRef = useRef({ frozen: false, x: FROZEN_ROTATION.x, y: FROZEN_ROTATION.y });
    // "as soon as I scroll" — any progress at all freezes cursor/drag rotation
    frozenRef.current.frozen = progress > 0;

    // three phases: move out (0 -> LOGO_MOVE_END), hold while the reel plays,
    // then walk back to START between REEL_END and SEQ_END
    let from = START_TRANSFORM;
    let to = END_TRANSFORM;
    let t: number;
    if (progress <= LOGO_MOVE_END) {
        t = ease(progress / LOGO_MOVE_END);
    } else if (progress >= REEL_END) {
        from = END_TRANSFORM;
        to = START_TRANSFORM;
        t = ease(Math.min(1, (progress - REEL_END) / (SEQ_END - REEL_END)));
    } else {
        t = 1; // parked at END for the whole reel
    }

    const x = lerp(from.x, to.x, t);
    const y = lerp(from.y, to.y, t);
    const scale = lerp(from.scale, to.scale, t);

    return (
        <div
            className="absolute inset-0 z-10"
            style={{ transform: `translate(${x}px, ${y}px) scale(${scale})` }}
        >
            <StageScene frozenRef={frozenRef} />
        </div>
    );
}
