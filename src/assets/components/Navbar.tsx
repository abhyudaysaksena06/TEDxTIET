import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

const navLinks = [
    { title: "Events", href: "/" },
    { title: "Team", href: "/" },
    { title: "Contact Us", href: "/" },
    { title: "About", href: "/" },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

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
        <nav className="flex justify-between items-center relative z-50">
            <div className="text-2xl font-bold tracking-tighter text-[#eb0028]">TEDxTIET</div>

            {/* Animated Hamburger Icon */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="z-50 cursor-pointer flex flex-col gap-[6px] items-end group"
            >
                <motion.div
                    animate={isOpen ? { rotate: 45, y: 4, width: "30px" } : { rotate: 0, y: 0, width: "30px" }}
                    className="h-[2px] bg-white group-hover:bg-[#eb0028] transition-colors origin-center"
                />
                <motion.div
                    animate={isOpen ? { rotate: -45, y: -4, width: "30px" } : { rotate: 0, y: 0, width: "20px" }}
                    className="h-[2px] bg-white group-hover:bg-[#eb0028] transition-colors origin-center"
                />
            </div>

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
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto">
                            <div className="flex flex-col gap-4">
                                {navLinks.map((link, i) => (
                                    <div key={i} className="overflow-hidden">
                                        <motion.a
                                            href={link.href}
                                            custom={i}
                                            variants={linkVariants}
                                            className="text-[6vw] font-bold uppercase leading-tight text-white hover:italic transition-all duration-300 block"
                                        >
                                            {link.title}
                                        </motion.a>
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