import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * Navigation.
 *
 * The site's whole identity is the stage: a curved screen, a red circle, a
 * reel of past talks. The menu borrows that language — the house goes red,
 * and each destination is a cue line you can read at a glance.
 *
 * Two things the previous version got wrong. It numbered the destinations
 * 01–05, which encoded nothing (a menu is not a sequence), and it laid the
 * panel out with centred stacks and fixed padding, which collided with itself
 * above 768px. Here every destination is a full-width ruled row, so the layout
 * cannot overlap at any width, and the mono line carries something true about
 * what is on the other side instead of an index.
 */

const RED = "#eb0028";

interface Destination {
    title: string;
    href: string;
    /** what is actually there — the reason to pick this one */
    detail: string;
}

const DESTINATIONS: Destination[] = [
    { title: "Home", href: "/home", detail: "TEDxTIET 2026" },
    { title: "Gallery", href: "/gallery", detail: "35 frames" },
    { title: "Team", href: "/team", detail: "38 students" },
    { title: "Speakers", href: "/speakers", detail: "Archive of Voices" },
    { title: "Alumni", href: "/alumni", detail: "Past organisers" },
];

const SOCIALS = [
    { label: "Instagram", href: "https://www.instagram.com/tedxtiet/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/tedxtiet/" },
    {
        label: "YouTube",
        href: "https://www.youtube.com/playlist?list=PLwvmGZzdo6jA8Fk6aVwQ5zAksnJfCf1o4",
    },
];

/**
 * The bar carries the page name, so each page's own headline can be dropped
 * rather than printing the same word twice down the screen.
 * /register is deliberately absent: that form opens with its own REGISTER NOW
 * headline at the top of the viewport, and the two landed on each other.
 */
const PAGE_TITLES: Record<string, string> = {
    "/gallery": "Gallery",
    "/team": "Team",
    "/speakers": "Speakers",
    "/alumni": "Alumni",
    "/event": "Events",
    "/contact": "Contact",
};

/** "/" and "/home" are the same destination, so treat them as one. */
function normalizePath(path: string) {
    const clean = path.replace(/\/+$/, "");
    return clean === "" ? "/home" : clean;
}

/**
 * How the page is being scrolled, so the bar can earn its background instead
 * of wearing one permanently (and instead of a backdrop-blur, which smeared
 * the artwork under it and cost a full-width filter pass every frame).
 */
function useScrollState() {
    const [state, setState] = useState({ atTop: true, hidden: false });
    const lastY = useRef(0);
    const frame = useRef(0);

    useEffect(() => {
        const read = () => {
            frame.current = 0;
            const y = window.scrollY;
            const goingDown = y > lastY.current;
            const delta = Math.abs(y - lastY.current);
            setState((prev) => {
                const atTop = y < 24;
                const hidden = delta < 6 ? prev.hidden : goingDown && y > 160;
                return prev.atTop === atTop && prev.hidden === hidden ? prev : { atTop, hidden };
            });
            lastY.current = y;
        };
        const onScroll = () => {
            if (!frame.current) frame.current = requestAnimationFrame(read);
        };
        read();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (frame.current) cancelAnimationFrame(frame.current);
        };
    }, []);

    return state;
}

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { atTop, hidden } = useScrollState();
    const panelRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);

    const currentPath = normalizePath(useLocation().pathname);
    const pageTitle = PAGE_TITLES[currentPath] ?? null;
    const needsScrim = ["/gallery", "/team", "/alumni"].includes(currentPath);

    // Escape closes, the page underneath stops scrolling, and focus moves into
    // the panel and back to the button — the menu is a modal surface, so it
    // should behave like one.
    useEffect(() => {
        if (!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", onKey);

        const firstLink = panelRef.current?.querySelector<HTMLElement>("a");
        firstLink?.focus();

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKey);
            toggleRef.current?.focus();
        };
    }, [isOpen]);

    const solid = !atTop && !isOpen;
    const photoScrim = needsScrim && atTop && !isOpen;

    return (
        <>
            <nav
                className={`fixed inset-x-0 top-0 z-[9999] flex items-center justify-between px-5 pb-4 pt-6 transition-[transform,background-color,border-color] duration-300 ease-out sm:px-8 md:px-12 ${
                    hidden && !isOpen ? "-translate-y-full" : "translate-y-0"
                } ${solid ? "border-b border-white/10 bg-black/95" : "border-b border-transparent"} ${
                    photoScrim ? "bg-gradient-to-b from-black/90 via-black/50 to-transparent" : ""
                }`}
            >
                <Link
                    to="/"
                    aria-label="TEDxTIET home"
                    className="relative z-[2] text-2xl font-bold tracking-tighter transition-opacity hover:opacity-80"
                    style={{ color: isOpen ? "#000" : RED }}
                >
                    TEDxTIET
                </Link>

                {pageTitle && !isOpen && (
                    <span className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.34em] text-white/70 sm:block">
                        {pageTitle}
                    </span>
                )}

                <button
                    ref={toggleRef}
                    type="button"
                    onClick={() => setIsOpen((v) => !v)}
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isOpen}
                    className="group relative z-[2] -mr-2 flex h-11 w-11 cursor-pointer flex-col items-end justify-center gap-[6px] bg-transparent p-0"
                >
                    {/* widths are CSS, not animated props: Framer skips animated
                        properties entirely under prefers-reduced-motion, which
                        once collapsed these bars to 0px and made the control
                        invisible */}
                    <span
                        className={`block h-[2px] origin-center transition-all duration-300 ${
                            isOpen
                                ? "w-[26px] translate-y-[4px] rotate-45 bg-black"
                                : "w-[30px] bg-white group-hover:bg-[#eb0028]"
                        }`}
                    />
                    <span
                        className={`block h-[2px] origin-center transition-all duration-300 ${
                            isOpen
                                ? "w-[26px] -translate-y-[4px] -rotate-45 bg-black"
                                : "w-[20px] bg-white group-hover:bg-[#eb0028]"
                        }`}
                    />
                </button>
            </nav>

            {/* ---------------- the panel ---------------- */}
            <div
                ref={panelRef}
                id="site-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Site menu"
                className={`fixed inset-0 z-[9998] flex flex-col transition-[clip-path,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
                }`}
                style={{
                    backgroundColor: RED,
                    // the house coming down from the bar, in one move
                    clipPath: isOpen ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
                }}
            >
                {/* clears the fixed bar */}
                <div aria-hidden="true" className="h-[84px] shrink-0" />

                <nav aria-label="Pages" className="flex flex-1 flex-col justify-center overflow-y-auto">
                    <ul className="list-none border-t border-black/20">
                        {DESTINATIONS.map((d, i) => {
                            const isCurrent = d.href === currentPath;
                            return (
                                <li key={d.href} className="border-b border-black/20">
                                    <Link
                                        to={d.href}
                                        onClick={() => setIsOpen(false)}
                                        aria-current={isCurrent ? "page" : undefined}
                                        className="group relative flex items-center justify-between gap-5 overflow-hidden px-5 py-3 sm:px-8 md:px-12 md:py-4"
                                        style={{
                                            opacity: isOpen ? 1 : 0,
                                            transform: `translateY(${isOpen ? 0 : 14}px)`,
                                            transition: `opacity 420ms ease ${180 + i * 60}ms, transform 420ms cubic-bezier(0.22,1,0.36,1) ${180 + i * 60}ms`,
                                        }}
                                    >
                                        {/* the row fills with the opposite ground,
                                            the same wipe the footer uses */}
                                        <span
                                            aria-hidden="true"
                                            className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-black transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
                                        />

                                        <span className="relative flex min-w-0 items-baseline gap-4">
                                            <span
                                                className="font-['Anton'] uppercase leading-[0.95] text-white"
                                                style={{ fontSize: "clamp(2rem, 7vw, 4.25rem)" }}
                                            >
                                                {d.title}
                                            </span>
                                            {isCurrent && (
                                                <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-black/70 group-hover:text-white/70 sm:inline">
                                                    you are here
                                                </span>
                                            )}
                                        </span>

                                        <span className="relative shrink-0 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-black/65 transition-colors duration-300 group-hover:text-white/75 sm:text-[11px]">
                                            {d.detail}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* ---- foot ---- */}
                <div
                    className="shrink-0 border-t border-black/20 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-8 md:px-12"
                    style={{
                        opacity: isOpen ? 1 : 0,
                        transition: "opacity 400ms ease 480ms",
                    }}
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <Link
                                to="/register"
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-2 bg-black px-3 py-2 font-['Anton'] text-sm uppercase tracking-[0.06em] text-white transition-opacity duration-300 hover:opacity-85"
                            >
                                Register
                            </Link>
                            <Link
                                to="/contact"
                                onClick={() => setIsOpen(false)}
                                className="py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-black/70 transition-colors duration-300 hover:text-white"
                            >
                                Contact
                            </Link>
                            <a
                                href="mailto:tedxtiet@thapar.edu"
                                className="py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-black/70 transition-colors duration-300 hover:text-white"
                            >
                                tedxtiet@thapar.edu
                            </a>
                        </div>

                        <ul className="flex list-none flex-wrap gap-x-5 gap-y-1">
                            {SOCIALS.map((s) => (
                                <li key={s.label}>
                                    <a
                                        href={s.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-black/70 transition-colors duration-300 hover:text-white"
                                    >
                                        {s.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
