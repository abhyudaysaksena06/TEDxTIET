import { useEffect, useRef } from "react";
// @ts-expect-error — About is untyped JSX ported from the sibling project
import About, { ABOUT_SECTIONS } from "./About";
import useScrollProgress from "../../hooks/useScrollProgress";

const COUNT = (ABOUT_SECTIONS as unknown[]).length; // 3: TED -> TEDx -> TEDxTIET

/**
 * Pins the About stage and spends one viewport of scroll per card, so the page
 * cannot reach whatever follows until TED, TEDx and TEDxTIET have each been
 * stepped through. The card index is derived from scroll position rather than
 * from intercepted wheel events, so dragging the scrollbar or jumping with
 * Home/End stays in sync instead of skipping cards.
 */
export default function AboutSection() {
    const scrollRootRef = useRef<HTMLDivElement>(null);
    const progress = useScrollProgress(scrollRootRef);

    // progress 0..1 -> card 0..COUNT-1, with each card holding an equal slice
    const active = Math.min(COUNT - 1, Math.floor(progress * COUNT * 0.999));

    // clicking a timeline node scrolls to that card's slice
    useEffect(() => {
        const onGoto = (e: Event) => {
            const index = (e as CustomEvent<number>).detail;
            const el = scrollRootRef.current;
            if (!el) return;
            const scrollable = el.offsetHeight - window.innerHeight;
            const target =
                el.offsetTop + scrollable * ((index + 0.5) / COUNT);
            window.scrollTo({ top: target, behavior: "smooth" });
        };
        window.addEventListener("tedx-about-goto", onGoto);
        return () => window.removeEventListener("tedx-about-goto", onGoto);
    }, []);

    return (
        <div ref={scrollRootRef} className="relative" style={{ height: `${COUNT * 100}vh` }}>
            <div className="sticky top-0 h-screen overflow-hidden">
                <About controlledSection={active} />
            </div>
        </div>
    );
}
