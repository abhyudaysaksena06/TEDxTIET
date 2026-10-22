import { useEffect, useState, type RefObject } from "react";

export type FitMode = "cover" | "width";

export interface StageRect {
    left: number;
    top: number;
    width: number;
    height: number;
    /** stage width relative to the desktop reference, for scaling tuned px values */
    k: number;
}

/**
 * Width of the stage on a 1440x900 desktop, where the hero's px-tuned values
 * (logo offset/scale) were dialled in. Everything scales off this so the
 * desktop composition is untouched while smaller screens stay proportional.
 */
export const REFERENCE_STAGE_W = 1396;

/**
 * Where a background image of `aspect` actually lands inside `ref`.
 *
 * This is the single source of truth for the hero: the photo, the drawn screen
 * outline and the reel are all placed on the returned rect, so the outline sits
 * on the venue screen at EVERY viewport. Previously the photo used CSS `cover`
 * while the outline was stretched across the whole container — the two only
 * agreed when the container happened to match the image's aspect ratio.
 *
 *  - "cover": fill the box, cropping the overflow (desktop)
 *  - "width": match the width, let height follow the aspect (phones — keeps the
 *    photo unsqueezed instead of cropping it to a tall viewport)
 */
export function useStageRect(
    ref: RefObject<HTMLElement | null>,
    aspect: number,
    mode: FitMode
): StageRect {
    const [rect, setRect] = useState<StageRect>({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        k: 1,
    });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const measure = () => {
            const cw = el.clientWidth;
            const ch = el.clientHeight;
            if (!cw || !ch) return;

            let width: number;
            let height: number;

            if (mode === "width") {
                width = cw;
                height = cw / aspect;
            } else {
                // cover: whichever axis is short decides the scale
                if (cw / ch > aspect) {
                    width = cw;
                    height = cw / aspect;
                } else {
                    height = ch;
                    width = ch * aspect;
                }
            }

            setRect((prev) => {
                const next = {
                    left: (cw - width) / 2,
                    top: (ch - height) / 2,
                    width,
                    height,
                    k: width / REFERENCE_STAGE_W,
                };
                // avoid a render when nothing moved (ResizeObserver fires often)
                return prev.width === next.width &&
                    prev.height === next.height &&
                    prev.left === next.left &&
                    prev.top === next.top
                    ? prev
                    : next;
            });
        };

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        window.addEventListener("resize", measure);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, [ref, aspect, mode]);

    return rect;
}

export default useStageRect;
