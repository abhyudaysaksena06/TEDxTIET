import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Footer — layout and typography follow the Enactus reference: a left CTA block
 * with a newsletter capture, right-hand link columns, a divider, then a social
 * row + copyright, closing on an oversized wordmark bled off the bottom edge.
 *
 * Link targets and social accounts come from the TEDxTIET26-27 repo
 * (src/Components/Footer.jsx and src/App.js routes).
 */

/**
 * The closing wordmark, revealed letter by letter: each glyph sits in its own
 * overflow-hidden column and rises from below the baseline when the footer
 * scrolls into view, so the name assembles rather than just being there.
 */
function WordmarkReveal({ text }: { text: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setRevealed(true);
            },
            { threshold: 0.25 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            aria-hidden="true"
            className="pointer-events-none flex min-w-0 select-none justify-start"
            style={{ marginBottom: "-0.22em" }}
        >
            {text.split("").map((char, i) => (
                <span key={i} className="overflow-hidden" style={{ display: "inline-block" }}>
                    <span
                        className="block font-display text-[clamp(3rem,14vw,13rem)] font-black leading-[0.8] tracking-tight"
                        style={{
                            // inline, and shorthand-free: a `background:` shorthand would
                            // reset background-clip and paint the whole box instead of the glyph.
                            // "TEDx" (the first four glyphs) carries the brand red.
                            backgroundImage:
                                i < 4
                                    ? "linear-gradient(to bottom, rgba(230,43,30,0.95), rgba(230,43,30,0.15))"
                                    : "linear-gradient(to bottom, rgba(255,255,255,0.30), rgba(255,255,255,0.02))",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            color: "transparent",
                            transform: revealed ? "translateY(0)" : "translateY(110%)",
                            transition: `transform 900ms cubic-bezier(0.22,1,0.36,1) ${i * 70}ms`,
                        }}
                    >
                        {char}
                    </span>
                </span>
            ))}
        </div>
    );
}

const NAVIGATE = [
    { label: "Home", href: "/home" },
    { label: "About Us", href: "/aboutus" },
    { label: "Speakers", href: "/speakers" },
    { label: "Team", href: "/team" },
    { label: "Alumni", href: "/alumni" },
];

const SOCIALS = [
    {
        label: "LinkedIn",
        href: "https://www.linkedin.com/company/tedxtiet/",
        path: "M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8h4.56v12H.22V8zm7.4 0h4.37v1.64h.06c.61-1.1 2.1-2.26 4.32-2.26 4.62 0 5.47 2.83 5.47 6.5V20h-4.56v-5.3c0-1.27-.02-2.9-1.8-2.9-1.8 0-2.08 1.38-2.08 2.81V20H7.62V8z",
    },
    {
        label: "Instagram",
        href: "https://www.instagram.com/tedxtiet/",
        path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.38.66-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.13-.67-.66-1.34-1.08-2.13-1.38-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32A6.16 6.16 0 0012 5.84zm0 10.16a4 4 0 110-8 4 4 0 010 8zm7.85-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z",
    },
    {
        label: "Facebook",
        href: "https://www.facebook.com/tedxtiet/",
        path: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z",
    },
    {
        label: "YouTube",
        href: "https://www.youtube.com/playlist?list=PLwvmGZzdo6jA8Fk6aVwQ5zAksnJfCf1o4",
        path: "M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z",
    },
];

function LinkList({ links }: { links: { label: string; href: string }[] }) {
    return (
        <ul className="space-y-3">
            {links.map((link) => (
                <li key={link.label}>
                    <Link
                        to={link.href}
                        className="text-[15px] text-white/70 transition-colors duration-200 hover:text-white"
                    >
                        {link.label}
                    </Link>
                </li>
            ))}
        </ul>
    );
}

/** Two columns: the heading sits over the first, the overflow fills the second. */
function NavColumns({ title, links }: { title: string; links: { label: string; href: string }[] }) {
    const first = links.slice(0, 3);
    const second = links.slice(3);

    return (
        <div className="flex gap-10 sm:gap-14">
            <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-tedx-red">
                    {title}
                </p>
                <div className="mt-5">
                    <LinkList links={first} />
                </div>
            </div>
            {/* spacer matches the heading's height so both lists start on the same line */}
            <div>
                <p aria-hidden="true" className="font-mono text-[11px] invisible">
                    .
                </p>
                <div className="mt-5">
                    <LinkList links={second} />
                </div>
            </div>
        </div>
    );
}

export default function Footer() {
    return (
        <footer className="relative w-full overflow-hidden bg-black pt-4 font-body text-white">
            <div className="mx-auto max-w-[1400px] px-6 md:px-10">
                {/* socials + contact CTA + copyright */}
                <div className="flex flex-col items-center gap-6 py-8 sm:flex-row sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        {SOCIALS.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`TEDxTIET on ${social.label}`}
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors duration-300 hover:border-tedx-red hover:bg-tedx-red hover:text-white"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
                                    <path d={social.path} />
                                </svg>
                            </a>
                        ))}

                        <Link
                            to="/contact"
                            className="group ml-1 inline-flex items-center gap-2 rounded-full border border-tedx-red px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-tedx-red transition-colors duration-300 hover:bg-tedx-red hover:text-white"
                        >
                            Contact Us
                            <span className="transition-transform duration-300 group-hover:translate-x-1">
                                →
                            </span>
                        </Link>
                    </div>

                    <p className="text-center text-sm text-white/45 sm:text-right">
                        © {new Date().getFullYear()} TEDxTIET · This independent TEDx event is
                        operated under license from TED.
                    </p>
                </div>
            </div>

            {/* oversized wordmark, bled off the bottom edge, with the nav sitting
                in the space its shorter final letters leave on the right */}
            <div className="flex items-end justify-between gap-8 pl-6 md:pl-14 pr-6 md:pr-12">
                <WordmarkReveal text="TEDxTIET" />
                <div className="shrink-0 pb-10 md:pb-14 pr-4 md:pr-16">
                    <NavColumns title="Navigate" links={NAVIGATE} />
                </div>
            </div>
        </footer>
    );
}
