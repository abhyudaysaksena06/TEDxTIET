import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";

/**
 * Tracks how the page is being scrolled, so the bar can earn its background
 * instead of wearing one permanently.
 *
 * `atTop` — nothing scrolled yet, so the bar can stay fully transparent and
 *            let the hero through.
 * `hidden` — the reader is moving DOWN the page and past the fold, so the bar
 *            gets out of the way; any upward scroll brings it straight back.
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
                // ignore jitter, and never hide before the bar has cleared the fold
                const hidden = delta < 6 ? prev.hidden : goingDown && y > 160;
                return prev.atTop === atTop && prev.hidden === hidden
                    ? prev
                    : { atTop, hidden };
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

const navLinks = [
    { title: "Home", href: "/home" },
    { title: "Gallery", href: "/gallery" },
    { title: "Team", href: "/team" },
    { title: "Speakers", href: "/speakers" },
    { title: "Alumni", href: "/alumni" },
];

/** shown at the foot of the open menu, so the panel carries something useful */
const OVERLAY_SOCIALS = [
    { label: "Instagram", href: "https://www.instagram.com/tedxtiet/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/tedxtiet/" },
    {
        label: "YouTube",
        href: "https://www.youtube.com/playlist?list=PLwvmGZzdo6jA8Fk6aVwQ5zAksnJfCf1o4",
    },
];

/** label shown centred in the bar, so each page announces itself */
const PAGE_TITLES: Record<string, string> = {
    "/gallery": "Gallery",
    "/team": "Team",
    "/speakers": "Speakers",
    "/alumni": "Alumni",
    "/event": "Events",
    "/contact": "Contact",
    // NOT /register: that form opens with its own "REGISTER NOW" headline at
    // the very top of the viewport, and the centred bar title landed straight
    // on top of it. The form's own heading is the page title there.
};

/** "/" and "/home" are the same destination, so treat them as one. */
function normalizePath(path: string) {
    const clean = path.replace(/\/+$/, "");
    return clean === "" ? "/home" : clean;
}

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    // don't offer a link to the page the user is already on. useLocation (not
    // window.location) so this re-evaluates on client-side navigation.
    const currentPath = normalizePath(useLocation().pathname);
    const visibleLinks = navLinks.filter((link) => link.href !== currentPath);

    // pages whose content runs bright/photographic right under the navbar
    const pageTitle = PAGE_TITLES[currentPath] ?? null;
    const needsScrim = ["/gallery", "/team", "/alumni"].includes(currentPath);

    // Animation variants for the background bars
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

    // Animation variants for the links
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

    const { atTop, hidden } = useScrollState();

    // The bar used to carry a permanent blurred scrim on image-heavy pages,
    // which smeared the artwork directly under it and cost a full-width
    // backdrop-filter pass every frame. Instead it now earns its surface:
    //   - at the top of any page it is completely transparent
    //   - once scrolled it becomes a solid bar with a hairline rule, which is
    //     more legible than a blur and costs nothing to composite
    //   - on pages that open straight onto photography it keeps a plain
    //     gradient (no blur) so the wordmark never sits on a bright frame
    // It also gets out of the way while reading down and returns on any
    // upward scroll, which is the behaviour people already expect.
    const solid = !atTop && !isOpen;
    const photoScrim = needsScrim && atTop && !isOpen;

    return (
        <nav
            className={`fixed top-0 inset-x-0 flex justify-between items-center z-[9999] px-8 md:px-12 pt-6 pb-4 transition-[transform,background-color,border-color] duration-300 ease-out ${
                hidden && !isOpen ? "-translate-y-full" : "translate-y-0"
            } ${
                solid
                    ? "border-b border-white/10 bg-black/95"
                    : "border-b border-transparent"
            } ${photoScrim ? "bg-gradient-to-b from-black/90 via-black/50 to-transparent" : ""}`}
        >
            <Link
                to="/"
                aria-label="TEDxTIET home"
                className="text-2xl font-bold tracking-tighter text-[#eb0028] transition-opacity hover:opacity-80"
            >
                TEDxTIET
            </Link>

            {pageTitle && !isOpen && (
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-['Anton'] text-base uppercase tracking-[0.3em] text-white/80 sm:text-lg">
                    {pageTitle}
                </span>
            )}

            {/* Animated Hamburger Icon */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                className="z-50 -mr-2 flex h-11 w-11 cursor-pointer flex-col items-end justify-center gap-[6px] bg-transparent p-0 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eb0028]"
            >
                <motion.div
                    animate={isOpen ? { rotate: 45, y: 4, width: "30px" } : { rotate: 0, y: 0, width: "30px" }}
                    className={`h-[2px] w-[30px] transition-colors origin-center ${isOpen ? "bg-black" : "bg-white group-hover:bg-[#eb0028]"}`}
                />
                <motion.div
                    animate={isOpen ? { rotate: -45, y: -4, width: "30px" } : { rotate: 0, y: 0, width: "20px" }}
                    className={`h-[2px] transition-colors origin-center ${isOpen ? "w-[30px] bg-black" : "w-[20px] bg-white group-hover:bg-[#eb0028]"}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 flex pointer-events-none z-40"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        {/* Solid base, plain CSS. The five bars below are the
                            flourish, but their height is animated, and Framer
                            skips animated properties outright under
                            prefers-reduced-motion — which left the panel
                            see-through for those users. The backdrop must not
                            depend on an animation running. */}
                        <div aria-hidden="true" className="absolute inset-0 bg-[#eb0028]" />

                        {/* Background animated bars */}
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={barVariants}
                                className="relative flex-1 bg-[#eb0028]"
                            />
                        ))}

                        {/* Links Overlay.
                            On a phone this used to be four small items floating
                            in the middle of a tall red field with nothing else
                            in it. The type now scales with the viewport, each
                            item is numbered so the list reads as a set, and the
                            panel ends with the contact details — so the menu is
                            a destination rather than a mostly-empty screen. */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-auto px-[7vw] pb-[max(2rem,env(safe-area-inset-bottom))] pt-28 md:pl-[6vw] md:pr-10">
                            <nav className="flex flex-1 flex-col justify-center">
                                <ul className="flex list-none flex-col gap-1 md:gap-2">
                                    {visibleLinks.map((link, i) => (
                                        <li key={link.href} className="overflow-hidden">
                                            <motion.div custom={i} variants={linkVariants}>
                                                <Link
                                                    to={link.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className="group flex items-baseline gap-4 py-1 text-white transition-colors duration-300 hover:text-black md:gap-6"
                                                >
                                                    <span className="font-mono text-[10px] tabular-nums opacity-60 md:text-xs">
                                                        {String(i + 1).padStart(2, "0")}
                                                    </span>
                                                    <span
                                                        className="font-bold uppercase leading-[1.05]"
                                                        style={{
                                                            fontSize: "clamp(2.25rem, 11vw, 5.5rem)",
                                                        }}
                                                    >
                                                        {link.title}
                                                    </span>
                                                </Link>
                                            </motion.div>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            <motion.div
                                custom={visibleLinks.length}
                                variants={linkVariants}
                                className="shrink-0 border-t border-black/25 pt-5"
                            >
                                <a
                                    href="mailto:tedxtiet@thapar.edu"
                                    className="block font-mono text-[11px] uppercase tracking-[0.18em] text-white transition-colors duration-300 hover:text-black"
                                >
                                    tedxtiet@thapar.edu
                                </a>
                                <ul className="mt-3 flex list-none flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-white/80">
                                    {OVERLAY_SOCIALS.map((s) => (
                                        <li key={s.label}>
                                            <a
                                                href={s.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-block py-1 transition-colors duration-300 hover:text-black"
                                            >
                                                {s.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}