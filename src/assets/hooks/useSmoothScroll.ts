import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Site-wide smooth scrolling (the same library the Becky Entertainment site
 * uses). Lenis intercepts wheel/touch input and eases `window.scrollY` toward
 * the target instead of jumping, which is what makes long scroll-driven
 * sequences — our hero reel, the pinned About cards — feel fluid rather than
 * stepped.
 *
 * It writes to the real scroll position, so every existing scroll listener
 * (useScrollProgress, IntersectionObservers, sticky positioning) keeps working
 * untouched.
 */
export function useSmoothScroll() {
    useEffect(() => {
        // respect users who've asked the OS for reduced motion
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const lenis = new Lenis({
            duration: 1.05,
            // gentle exponential ease-out: quick to respond, soft to settle
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 1.6,
        });

        let frame = 0;
        const raf = (time: number) => {
            lenis.raf(time);
            frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(frame);
            lenis.destroy();
        };
    }, []);
}

export default useSmoothScroll;
