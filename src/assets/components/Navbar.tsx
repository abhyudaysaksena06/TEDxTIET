import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";

const navLinks = [
    { title: "Home", href: "/home" },
    { title: "Gallery", href: "/gallery" },
    { title: "Team", href: "/team" },
    { title: "Speakers", href: "/speakers" },
    { title: "Alumni", href: "/alumni" },
];

/** label shown centred in the bar, so each page announces itself */
const PAGE_TITLES: Record<string, string> = {
    "/gallery": "Gallery",
    "/team": "Team",
    "/speakers": "Speakers",
    "/alumni": "Alumni",
    "/event": "Events",
    "/contact": "Contact",
    "/register": "Register",
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

    return (
        // fixed, so the wordmark and hamburger stay reachable on every section.
        // A soft blurred scrim sits behind it on image-heavy pages (gallery, team)
        // where the wordmark would otherwise disappear into the photos.
        <nav
            className={`fixed top-0 inset-x-0 flex justify-between items-center z-[9999] px-8 md:px-12 pt-6 pb-4 ${
                needsScrim && !isOpen
                    ? "bg-gradient-to-b from-black/85 via-black/55 to-transparent backdrop-blur-md"
                    : ""
            }`}
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
                        {/* Background animated bars */}
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={barVariants}
                                className="flex-1 bg-[#eb0028]"
                            />
                        ))}

                        {/* Links Overlay */}
                        <div className="absolute inset-0 flex flex-col items-start justify-center pointer-events-auto pl-[6vw]">
                            <div className="flex flex-col gap-4">
                                {visibleLinks.map((link, i) => (
                                    <div key={i} className="overflow-hidden">
                                        <motion.div custom={i} variants={linkVariants}>
                                            <Link
                                                to={link.href}
                                                onClick={() => setIsOpen(false)}
                                                className="text-[6vw] font-bold uppercase leading-tight text-white hover:text-black transition-all duration-300 block text-left"
                                            >
                                                {link.title}
                                            </Link>
                                        </motion.div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}