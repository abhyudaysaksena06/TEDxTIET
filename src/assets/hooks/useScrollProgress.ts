import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Tracks 0-1 progress through `ref`'s own scrollable height, i.e. how far the
 * viewport has scrolled past the element's top relative to (element height -
 * viewport height). Used to drive the pinned stage/reel transition.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
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

    return progress;
}

export default useScrollProgress;
