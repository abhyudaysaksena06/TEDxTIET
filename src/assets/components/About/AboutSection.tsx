import { useEffect, useRef, useState } from "react";
import About, { ABOUT_SECTIONS } from "./About";

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

    // Only the card index is state. This used to keep the raw scroll progress
    // in state, so the whole About component re-rendered on every frame of
    // scrolling through it, though all it ever needs is which of three cards
    // is showing. Now it renders when that changes: twice on the way through.
    const [active, setActive] = useState(0);
    useEffect(() => {
        let frame = 0;
        const read = () => {
            frame = 0;
            const el = scrollRootRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const scrollable = rect.height - window.innerHeight;
            const progress = Math.min(1, Math.max(0, scrollable > 0 ? -rect.top / scrollable : 0));
            // progress 0..1 -> card 0..COUNT-1, with each card holding an equal slice
            const next = Math.min(COUNT - 1, Math.floor(progress * COUNT * 0.999));
            setActive((prev) => (prev === next ? prev : next));
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(read);
        };
        read();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", read);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", read);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

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
