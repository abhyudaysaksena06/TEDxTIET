import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";

/**
 * Navigation.
 *
 * The opening animation is the original one, restored verbatim: five red
 * columns whose height sweeps down on a 0.05s stagger, reversing on exit,
 * and the destinations rising 30px into place behind them. Durations, delays
 * and easing are untouched.
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
 * Framer skips animated properties outright under prefers-reduced-motion, so
 * the bars would stay at height 0 and leave the panel see-through. For those
 * users only, the panel paints its own red ground. Anyone with motion enabled
 * gets the untouched animation and never sees this.
 */
function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const q = window.matchMedia("(prefers-reduced-motion: reduce)");
        const sync = () => setReduced(q.matches);
        sync();
        q.addEventListener("change", sync);
        return () => q.removeEventListener("change", sync);
    }, []);
    return reduced;
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
    const reduced = usePrefersReducedMotion();
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

    // ---- the original animation, unchanged ----
    const barVariants: Variants = {
        initial: { height: 0 },
        animate: (i: number) => ({
            height: "100%",
            transition: {
                duration: 0.5,
                delay: 0.05 * i,
                ease: [0.33, 1, 0.68, 1] as const,
            },
        }),
        exit: (i: number) => ({
            height: 0,
            transition: {
                duration: 0.5,
                delay: 0.05 * (4 - i), // Reverse stagger on exit
                ease: [0.33, 1, 0.68, 1] as const,
            },
        }),
    };

    const linkVariants: Variants = {
        initial: { opacity: 0, y: 30 },
        animate: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                delay: 0.3 + 0.1 * i,
                ease: "easeOut",
            },
        }),
        exit: {
            opacity: 0,
            y: 30,
            transition: {
                duration: 0.3,
            },
        },
    };

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
                    className="relative z-[2] block transition-opacity duration-300 hover:opacity-80"
                >
                    {/* The official lockup: red TEDx, white TIET, built for a
                        dark ground. Over the open menu's red the red half would
                        vanish, so the whole mark is knocked to black there —
                        matching the close button beside it. */}
                    <img
                        src="/tedxtiet-lockup.png"
                        alt=""
                        width={1255}
                        height={202}
                        className="h-[22px] w-auto select-none sm:h-[26px]"
                        style={{
                            filter: isOpen ? "brightness(0)" : "none",
                            transition: "filter 300ms ease",
                        }}
                        draggable={false}
                    />
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
                    aria-controls="site-menu"
                    className="group relative z-[2] -mr-2 flex h-11 w-11 cursor-pointer flex-col items-end justify-center gap-[6px] bg-transparent p-0"
                >
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
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={panelRef}
                        id="site-menu"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Site menu"
                        className="fixed inset-0 z-[9998] flex"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        // only for people who asked for less motion; see the hook
                        style={reduced ? { backgroundColor: RED } : undefined}
                    >
                        {/* five columns, original variants */}
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={barVariants}
                                className="flex-1 bg-[#eb0028]"
                            />
                        ))}

                        {/* ---- content ---- */}
                        <div className="absolute inset-0 flex flex-col">
                            {/* clears the fixed bar */}
                            <div aria-hidden="true" className="h-[84px] shrink-0" />

                            <nav
                                aria-label="Pages"
                                className="flex flex-1 flex-col justify-center overflow-y-auto"
                            >
                                <ul className="list-none border-t border-black/20">
                                    {DESTINATIONS.map((d, i) => {
                                        const isCurrent = d.href === currentPath;
                                        return (
                                            <li key={d.href} className="border-b border-black/20">
                                                <motion.div custom={i} variants={linkVariants}>
                                                    <Link
                                                        to={d.href}
                                                        onClick={() => setIsOpen(false)}
                                                        aria-current={isCurrent ? "page" : undefined}
                                                        className="group relative flex items-center justify-between gap-5 overflow-hidden px-5 py-3 sm:px-8 md:px-12 md:py-4"
                                                    >
                                                        {/* the row fills with the
                                                            opposite ground — the
                                                            wipe the footer uses */}
                                                        <span
                                                            aria-hidden="true"
                                                            className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-black transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
                                                        />

                                                        <span className="relative flex min-w-0 items-baseline gap-4">
                                                            <span
                                                                className="font-['Anton'] uppercase leading-[0.95] text-white"
                                                                style={{
                                                                    fontSize:
                                                                        "clamp(2rem, 7vw, 4.25rem)",
                                                                }}
                                                            >
                                                                {d.title}
                                                            </span>
                                                            {isCurrent && (
                                                                <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-black group-hover:text-white/75 sm:inline">
                                                                    you are here
                                                                </span>
                                                            )}
                                                        </span>

                                                        <span className="relative shrink-0 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-black transition-colors duration-300 group-hover:text-white/75 sm:text-[11px]">
                                                            {d.detail}
                                                        </span>
                                                    </Link>
                                                </motion.div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>

                            {/* ---- foot ---- */}
                            <motion.div
                                custom={DESTINATIONS.length}
                                variants={linkVariants}
                                className="shrink-0 border-t border-black/20 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-8 md:px-12"
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
                                            className="py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-black transition-colors duration-300 hover:text-white"
                                        >
                                            Contact
                                        </Link>
                                        <a
                                            href="mailto:tedxtiet@thapar.edu"
                                            className="py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-black transition-colors duration-300 hover:text-white"
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
                                                    className="inline-block py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-black transition-colors duration-300 hover:text-white"
                                                >
                                                    {s.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
