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
let active: Lenis | null = null;

/**
 * Jump straight to `y`, without easing. Goes through Lenis when it is
 * running: it keeps its own copy of the scroll position, so a bare
 * window.scrollTo in the middle of a glide would be pulled back toward the
 * old target on its next frame. Lenis also caps every jump at the page height
 * it last measured, and after a zoom or resize that measurement lags, so it
 * re-measures first or the jump lands short.
 */
export function jumpTo(y: number) {
    if (active) {
        active.resize();
        active.scrollTo(y, { immediate: true, force: true });
    } else window.scrollTo(0, y);
}

/** Glide to `y` on the site's usual easing. */
export function glideTo(y: number) {
    if (active) active.scrollTo(y);
    else window.scrollTo({ top: y, behavior: "smooth" });
}

export function useSmoothScroll() {
    useEffect(() => {
        const lenis = new Lenis({
            // Longer settle and a shorter throw per notch. The home page packs a
            // 700vh reel track behind one screen, so at a 1:1 wheel multiplier a
            // single notch covered a lot of that sequence and the whole page
            // read as racing. 0.62 puts roughly a third less distance under each
            // notch and the longer duration lets it glide to a stop.
            duration: 1.25,
            // gentle exponential ease-out: quick to respond, soft to settle
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 0.62,
            touchMultiplier: 1.0,
        });

        active = lenis;

        let frame = 0;
        const raf = (time: number) => {
            lenis.raf(time);
            frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(frame);
            if (active === lenis) active = null;
            lenis.destroy();
        };
    }, []);
}

export default useSmoothScroll;
