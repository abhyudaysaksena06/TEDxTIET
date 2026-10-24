import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { IMAGE_COUNT } from "./Gallery/galleryPhotos";
import { TEAM_COUNT } from "../data/team";

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

// Counts come from the data itself. They were typed in by hand, and the
// menu went on saying 35 frames and 38 students after the gallery grew to
// 114 and the team shrank to 31.
const DESTINATIONS: Destination[] = [
    // "/" rather than "/home", which only redirects there
    { title: "Home", href: "/", detail: "TEDxTIET 2026" },
    { title: "Gallery", href: "/gallery", detail: `${IMAGE_COUNT} frames` },
    { title: "Team", href: "/team", detail: `${TEAM_COUNT} students` },
    // the page leads with the 2026 line-up, which is not announced yet
    { title: "Speakers", href: "/speakers", detail: "2026 line-up soon" },
    { title: "Sponsors", href: "/sponsors", detail: "Coming soon" },
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
    "/sponsors": "Sponsors",
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

                {/* The page title has two states that share the bar's own
                    scroll mechanics.

                    At the top it is a masthead hanging off the bar's lower
                    edge, deliberately NOT boxed inside it, so the bar gains no
                    divider of its own. Once scrolled it retracts up behind the
                    bar and hands over to a compact label sitting IN it — which
                    is what stops it stranding itself over the page. It was a
                    child of the bar before, but it overflows the bar's box, so
                    -translate-y-full moved the bar by its own height and left
                    the title behind on the content. */}
                {pageTitle && !isOpen && (
                    <>
                        {/* scrolled: compact, inside the bar */}
                        <span
                            className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.34em] text-white/70 sm:block"
                            style={{
                                opacity: atTop ? 0 : 1,
                                transition: "opacity 260ms ease",
                            }}
                        >
                            {pageTitle}
                        </span>

                        {/* At the top: the masthead. On a desktop it sits
                            centred in the bar, between the logo and the menu.
                            A phone's bar has no room for it there, so it used
                            to drop below as a small centred label, floating
                            off the left edge that the logo, the menu and every
                            page's content share. On phones it is now the
                            page's heading: on that edge, at heading size. */}
                        <div
                            className="pointer-events-none absolute inset-x-0 top-full -mt-2 flex justify-start px-5 sm:justify-center"
                            style={{
                                opacity: atTop ? 1 : 0,
                                transform: atTop ? "translateY(0)" : "translateY(-45%)",
                                transition:
                                    "opacity 280ms ease, transform 320ms cubic-bezier(0.22,1,0.36,1)",
                            }}
                        >
                            <span className="relative block">
                                <span
                                    className="block font-['Anton'] text-[2.6rem] uppercase leading-[0.85] text-white sm:text-[clamp(1.75rem,6vw,3.75rem)]"
                                    style={{
                                        letterSpacing: "0.02em",
                                        // the stage pages run bright under it
                                        textShadow: "0 2px 18px rgba(0,0,0,0.65)",
                                    }}
                                >
                                    {pageTitle}
                                </span>
                                {/* the rule runs past the word on both sides so
                                    the title reads as a masthead rather than a
                                    label sitting in a box */}
                                <span
                                    aria-hidden="true"
                                    className="absolute -inset-x-3 -bottom-2 hidden h-[3px] sm:block"
                                    style={{
                                        background:
                                            "linear-gradient(to right, transparent, #eb0028 20%, #eb0028 80%, transparent)",
                                    }}
                                />
                                {/* on a phone the heading starts on the edge,
                                    so the rule starts flush and trails off */}
                                <span
                                    aria-hidden="true"
                                    className="absolute -bottom-2 left-0 -right-10 block h-[3px] sm:hidden"
                                    style={{
                                        background:
                                            "linear-gradient(to right, #eb0028, #eb0028 55%, transparent)",
                                    }}
                                />
                            </span>
                        </div>
                    </>
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

                            {/* The rows split whatever height there is between
                                the bar and the foot, equally, and each name is
                                sized from its row as well as from the width. They
                                were sized by width alone, so at six rows a
                                screen shorter than ~900px ran out of room and the
                                list grew a scrollbar. Now it cannot outgrow the
                                screen, so it clips instead of scrolling. */}
                            <nav aria-label="Pages" className="min-h-0 flex-1 overflow-hidden">
                                <ul className="flex h-full list-none flex-col border-t border-black/20 [container-type:size]">
                                    {DESTINATIONS.map((d, i) => {
                                        const isCurrent = normalizePath(d.href) === currentPath;
                                        return (
                                            <li key={d.href} className="min-h-0 flex-1 border-b border-black/20">
                                                <motion.div custom={i} variants={linkVariants} className="h-full">
                                                    <Link
                                                        to={d.href}
                                                        onClick={() => setIsOpen(false)}
                                                        aria-current={isCurrent ? "page" : undefined}
                                                        className="group relative flex h-full items-center justify-between gap-5 overflow-hidden px-5 sm:px-8 md:px-12"
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
                                                                    // the old width-based size
                                                                    // (never under 2rem), capped
                                                                    // at 62% of a row's height
                                                                    // — cqh is the list's height
                                                                    fontSize: `clamp(1.5rem, min(max(2rem, 7vw), ${
                                                                        62 / DESTINATIONS.length
                                                                    }cqh), 4.25rem)`,
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
