import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import type { ProgressStore } from "../lib/sequenceProgress";

const noSubscribe = () => () => {};
const zero = () => 0;

/**
 * Tracks 0-1 progress through `ref`'s own scrollable height, i.e. how far the
 * viewport has scrolled past the element's top relative to (element height -
 * viewport height). Used to drive the pinned stage/reel transition.
 *
 * Given a `store`, returns that store's value instead, so the same consumer
 * can be driven by something other than scroll (a swipe, on phones).
 */
export function useScrollProgress(
    ref: RefObject<HTMLElement | null>,
    store?: ProgressStore | null
) {
    const [progress, setProgress] = useState(0);
    const frame = useRef<number | null>(null);

    useEffect(() => {
        const compute = () => {
            const el = ref.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const scrollable = rect.height - window.innerHeight;
            const p = scrollable > 0 ? -rect.top / scrollable : 0;
            setProgress(Math.min(1, Math.max(0, p)));
        };

        const onScroll = () => {
            if (frame.current) return;
            frame.current = requestAnimationFrame(() => {
                frame.current = null;
                compute();
            });
        };

        compute();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", compute);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", compute);
            if (frame.current) cancelAnimationFrame(frame.current);
        };
    }, [ref]);

    const driven = useSyncExternalStore(store ? store.subscribe : noSubscribe, store ? store.get : zero);
    return store ? driven : progress;
}

export default useScrollProgress;
