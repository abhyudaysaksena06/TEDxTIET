import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Footer — rebuilt to the structure of mrdev4u.com, measured from the live page:
 *
 *   footer            min-h-svh, flex column, #111 ground with a faint grid
 *   ├─ top row        3 bordered cells, each with a small mono meta line above
 *   │                 an oversized Anton link; hovering wipes the cell with an
 *   │                 ink fill from the bottom and inverts the type
 *   ├─ middle         12-col grid: display statement (7) | contact stack (5)
 *   ├─ wordmark       one line, letters spread edge-to-edge via justify-between
 *   └─ credit bar     mono micro-type
 *
 * Palette taken from the reference (#111 paper, #EBE9E4 ink, #2C2C2C rules,
 * #8A8A8A muted), except the accent, which stays TEDx red rather than their
 * orange. Display face is Anton, which is also the hero's.
 */

const PAPER = "#111111";
const INK = "#ebe9e4";
const RULE = "#2c2c2c";
const MUTED = "#8a8a8a";

/** the three destinations worth offering at the end of the page */
const BIG_LINKS = [
    { label: "Team", href: "/team", meta: "TEDxTIET" },
    { label: "Gallery", href: "/gallery", meta: "Moments from the stage" },
    { label: "Contact", href: "/contact", meta: "tedxtiet@thapar.edu" },
];

const SOCIALS = [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/tedxtiet/" },
    { label: "Instagram", href: "https://www.instagram.com/tedxtiet/" },
    { label: "Facebook", href: "https://www.facebook.com/tedxtiet/" },
    {
        label: "YouTube",
        href: "https://www.youtube.com/playlist?list=PLwvmGZzdo6jA8Fk6aVwQ5zAksnJfCf1o4",
    },
];

/**
 * The closing wordmark. `justify-between` on a nowrap line spreads the glyphs
 * from edge to edge — that even distribution is the signature of the reference,
 * not the size alone. Each letter also rises into place on first view and
 * takes the brand red on hover.
 */
function Wordmark({ text }: { text: string }) {
    const ref = useRef<HTMLParagraphElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) setShown(true);
            },
            { threshold: 0.2 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <p
            ref={ref}
            aria-hidden="true"
            className="flex select-none justify-between overflow-hidden whitespace-nowrap px-4 font-['Anton'] uppercase leading-[0.9] md:px-6"
            style={{ fontSize: "clamp(3.5rem, 13.5vw, 11rem)", color: INK }}
        >
            {text.split("").map((ch, i) => (
                <span key={i} className="inline-block overflow-hidden">
                    <span
                        className="inline-block cursor-default pt-[0.04em] hover:text-[#eb0028]"
                        style={{
                            transform: shown ? "translateY(0)" : "translateY(105%)",
                            transition: `transform 820ms cubic-bezier(0.22,1,0.36,1) ${i * 55}ms, color 300ms`,
                        }}
                    >
                        {ch}
                    </span>
                </span>
            ))}
        </p>
    );
}

export default function Footer() {
    return (
        <footer
            className="relative z-10 flex min-h-svh w-full flex-col overflow-hidden"
            style={{ backgroundColor: PAPER, color: INK }}
        >
            {/* faint grid ground */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                    backgroundSize: "clamp(70px, 8vw, 120px) clamp(70px, 8vw, 120px)",
                }}
            />

            {/* ---- top row: three bordered destinations ---- */}
            <div
                className="relative grid shrink-0 grid-cols-3 border-y"
                style={{ height: "clamp(5.5rem, 15.5svh, 7.5rem)", borderColor: RULE }}
            >
                {BIG_LINKS.map((l) => (
                    <div
                        key={l.label}
                        className="group relative flex min-w-0 flex-col justify-between border-r px-3 py-2 last:border-r-0 md:px-5"
                        style={{ borderColor: RULE }}
                    >
                        {/* ink wipe, bottom-up, on hover */}
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
                            style={{ backgroundColor: INK }}
                        />

                        <span
                            className="relative z-10 hidden truncate font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-300 group-hover:text-[#111111] sm:block"
                            style={{ color: MUTED }}
                        >
                            {l.meta}
                        </span>

                        <Link
                            to={l.href}
                            className="relative z-10 mt-auto block truncate font-['Anton'] uppercase leading-none tracking-[0.005em] transition-colors duration-300 group-hover:text-[#111111]"
                            style={{ fontSize: "min(7.5vw, 9.5svh)", color: INK }}
                        >
                            {l.label}
                        </Link>
                    </div>
                ))}
            </div>

            {/* ---- middle: statement | contact stack ---- */}
            <div className="relative flex flex-1 flex-col gap-8 px-4 py-[3svh] md:grid md:grid-cols-12 md:gap-6 md:px-6">
                <h2
                    className="font-['Anton'] uppercase leading-[0.92] tracking-[0.005em] md:col-span-7"
                    style={{ fontSize: "min(10.5vw, 13svh)" }}
                >
                    Ideas worth
                    <br />
                    spreading,
                    <br />
                    <span style={{ color: "#eb0028" }}>on stage.</span>
                </h2>

                <div className="flex flex-1 flex-col gap-6 md:col-span-5 md:justify-between">
                    {/* email rule sits first on desktop, last on mobile */}
                    <a
                        href="mailto:tedxtiet@thapar.edu"
                        className="group order-last flex w-full items-center justify-between gap-4 border-b pb-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 md:-order-1"
                        style={{ borderColor: RULE, color: MUTED }}
                    >
                        <span>Email</span>
                        <span className="flex min-w-0 items-center gap-2 truncate transition-colors duration-300 group-hover:text-[#ebe9e4]">
                            tedxtiet@thapar.edu
                            <span
                                aria-hidden="true"
                                className="transition-transform duration-300 group-hover:translate-x-1"
                            >
                                →
                            </span>
                        </span>
                    </a>

                    <div className="md:self-end md:text-right">
                        <p
                            className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] md:mb-3"
                            style={{ color: MUTED }}
                        >
                            Follow
                        </p>
                        <ul className="flex list-none flex-wrap gap-x-5 gap-y-1 md:flex-col md:items-end md:gap-y-0">
                            {SOCIALS.map((s) => (
                                <li key={s.label}>
                                    <a
                                        href={s.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group inline-flex items-center gap-1.5 font-['Anton'] text-[clamp(1.1rem,2.2vw,1.75rem)] uppercase leading-tight transition-colors duration-300 hover:text-[#ebe9e4]"
                                        style={{ color: "#a9a7a2" }}
                                    >
                                        {s.label}
                                        <span
                                            aria-hidden="true"
                                            className="font-mono text-[0.55em] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                        >
                                            ↗
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* squared accent chip, sized as the reference does */}
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 self-start px-2 py-1 font-['Anton'] text-sm uppercase tracking-[0.06em] transition-opacity duration-300 hover:opacity-85 md:self-end"
                        style={{ backgroundColor: "#eb0028", color: PAPER }}
                    >
                        <span aria-hidden="true" className="text-[0.7em]">
                            ●
                        </span>
                        Registrations open
                    </Link>
                </div>
            </div>

            {/* ---- wordmark, letters spread edge to edge ---- */}
            <div className="relative shrink-0">
                <Wordmark text="TEDxTIET" />
            </div>

            {/* ---- credit bar ---- */}
            <div
                className="relative flex shrink-0 flex-col gap-2 border-t px-4 py-4 font-mono text-[10px] uppercase tracking-[0.18em] sm:flex-row sm:items-center sm:justify-between md:px-6"
                style={{ borderColor: RULE, color: MUTED }}
            >
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
