import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Footer — structured after mrdev4u.com: a row of oversized destinations, a
 * display statement with the social stack opposite, a ruled contact line, then
 * a giant wordmark bled off the bottom edge above a thin credit bar.
 *
 * Display type is Anton (the hero face) against a faint grid; supporting text
 * is mono at small sizes, which is what gives the reference its contrast
 * between huge and tiny with nothing in between.
 *
 * Link targets and social accounts come from the TEDxTIET26-27 repo.
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


/** Two columns: the heading sits over the first, the overflow fills the second. */

/** the three places worth sending someone from the bottom of the page */
const BIG_LINKS = [
    { label: "Team", href: "/team" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
];

export default function Footer() {
    return (
        <footer className="relative w-full overflow-hidden bg-[#0b0b0b] font-body text-[#ebe9e4]">
            {/* faint grid, so the big type sits on a surface rather than a void */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                    backgroundSize: "120px 120px",
                }}
            />

            <div className="relative mx-auto max-w-[1500px] px-6 pt-16 md:px-10">
                {/* ---- oversized destinations ---- */}
                <ul className="grid list-none grid-cols-1 gap-8 border-b border-white/10 pb-12 sm:grid-cols-3 sm:gap-10">
                    {BIG_LINKS.map((l) => (
                        <li key={l.label} className="min-w-0">
                            <Link to={l.href} className="group block min-w-0">
                                <span className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                                    {l.href}
                                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                                        ↗
                                    </span>
                                </span>
                                <span className="block truncate font-['Anton'] text-[clamp(2.25rem,5.2vw,4.25rem)] uppercase leading-[0.9] tracking-[0.005em] text-[#ebe9e4] transition-colors duration-300 group-hover:text-tedx-red">
                                    {l.label}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* ---- statement + follow ---- */}
                <div className="flex flex-col gap-12 pt-14 lg:flex-row lg:justify-between lg:gap-16">
                    <h2 className="font-['Anton'] text-[clamp(2.5rem,8vw,5.5rem)] uppercase leading-[0.92] tracking-[0.005em] text-[#ebe9e4]">
                        Ideas worth
                        <br />
                        spreading,
                        <br />
                        <span className="text-tedx-red">on stage.</span>
                    </h2>

                    <div className="lg:text-right">
                        <p className="font-mono text-[12px] uppercase tracking-[0.25em] text-white/40">
                            Follow
                        </p>
                        <ul className="mt-4 list-none space-y-1">
                            {SOCIALS.map((social) => (
                                <li key={social.label}>
                                    <a
                                        href={social.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group inline-flex items-center gap-2 font-['Anton'] text-[clamp(1.35rem,2.6vw,1.9rem)] uppercase tracking-[0.01em] text-[#a9a7a2] transition-colors duration-300 hover:text-[#ebe9e4]"
                                    >
                                        {social.label}
                                        <span aria-hidden="true" className="text-[0.7em] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                                            ↗
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>

                        <Link
                            to="/register"
                            className="mt-8 inline-flex items-center gap-2 rounded-full bg-tedx-red px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors duration-300 hover:bg-white hover:text-black"
                        >
                            <span aria-hidden="true" className="text-[0.8em]">●</span>
                            Registrations Open
                        </Link>
                    </div>
                </div>

                {/* ---- contact rule ---- */}
                <a
                    href="mailto:tedxtiet@thapar.edu"
                    className="group mt-16 flex items-center justify-between gap-6 border-t border-white/10 pt-5 font-mono text-[11px] uppercase tracking-[0.22em] text-white/45 transition-colors duration-300 hover:text-[#ebe9e4]"
                >
                    <span>Email</span>
                    <span className="flex items-center gap-2 truncate">
                        tedxtiet@thapar.edu
                        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                            →
                        </span>
                    </span>
                </a>
            </div>

            {/* ---- giant wordmark, bled off the bottom ---- */}
            <div className="relative">
                <WordmarkReveal text="TEDxTIET" />
            </div>

            {/* ---- bottom bar ---- */}
            <div className="relative mx-auto flex max-w-[1500px] flex-col gap-3 px-6 pb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 sm:flex-row sm:items-center sm:justify-between md:px-10">
                <p>Independently organised · Thapar Institute, Patiala</p>
                <p className="flex items-center gap-4">
                    <span>© {new Date().getFullYear()} TEDxTIET</span>
                    <a href="#top" className="transition-colors duration-300 hover:text-[#ebe9e4]">
                        Back to top ↑
                    </a>
                </p>
            </div>
        </footer>
    );
}
