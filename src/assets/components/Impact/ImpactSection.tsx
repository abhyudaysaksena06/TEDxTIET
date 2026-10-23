import { useEffect, useRef, useState } from "react";
import { impactData, type ImpactStat, type MarkKind } from "./impactData";

/**
 * Our Impact.
 *
 * Two earlier versions to beat: a row of rounded cards with emoji inside
 * circular progress rings (decorative, and the ring never encoded the figure),
 * and a plain ruled ledger (on-brand but inert — nothing but type).
 *
 * This keeps the ledger's editorial structure and gives every figure a mark
 * that actually means something: plays as a waveform, people as a filling
 * grid, years as a dated timeline, speakers as a tally of strokes. The marks
 * are plain elements with staggered CSS transitions — the compositor animates
 * transform and opacity only, so four rows of them cost nothing — while the
 * numerals count up on rAF against real elapsed time.
 *
 * Everything is gated on the section entering the viewport, and anyone who has
 * asked for less motion gets the finished state immediately.
 */

const RED = "#eb0028";
const RULE = "#232323";
const MUTED = "#8a8a8a";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

/** fires once, when the element first comes into view */
function useInView<T extends HTMLElement>(threshold = 0.2) {
    const ref = useRef<T>(null);
    const [seen, setSeen] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setSeen(true);
                    io.disconnect();
                }
            },
            { threshold }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [threshold]);

    return { ref, seen };
}

/**
 * Counts to `target`, eased hard at the front so the number sprints and then
 * settles — that snap is what makes a figure land. Driven by elapsed time, so
 * the run takes the same wall-clock duration at 60Hz and 144Hz.
 */
function Counter({ target, group, run }: { target: number; group?: boolean; run: boolean }) {
    const [n, setN] = useState(0);

    useEffect(() => {
        if (!run) return;
        if (prefersReducedMotion()) {
            setN(target);
            return;
        }

        const DURATION = 1400;
        let frame = 0;
        const start = performance.now();

        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / DURATION);
            const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
            setN(Math.round(target * eased));
            if (t < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [run, target]);

    return <>{group ? n.toLocaleString("en-IN") : n}</>;
}

/* ------------------------------------------------------------------ marks */

/** fixed, not random: the silhouette must be identical on every render */
const WAVE = [
    0.22, 0.46, 0.3, 0.68, 0.92, 0.54, 0.38, 0.74, 1, 0.62, 0.42, 0.84, 0.56, 0.3, 0.5, 0.78,
    0.96, 0.64, 0.36, 0.58, 0.88, 0.48, 0.26, 0.7, 0.82, 0.44, 0.34, 0.6,
];

function Wave({ run }: { run: boolean }) {
    return (
        <div className="flex h-12 w-full items-end gap-[2px] md:h-14">
            {WAVE.map((h, i) => (
                <span
                    key={i}
                    className="flex-1 origin-bottom rounded-[1px]"
                    style={{
                        height: `${h * 100}%`,
                        backgroundColor: i % 4 === 0 ? RED : "#4a4a4a",
                        transform: `scaleY(${run ? 1 : 0})`,
                        transition: `transform 620ms ${EASE} ${i * 22}ms`,
                    }}
                />
            ))}
        </div>
    );
}

const GRID_COLS = 24;
const GRID_ROWS = 4;

function Grid({ run }: { run: boolean }) {
    const cells = GRID_COLS * GRID_ROWS;
    return (
        <div
            className="grid h-12 w-full gap-[3px] md:h-14"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
        >
            {Array.from({ length: cells }, (_, i) => {
                const col = i % GRID_COLS;
                // fill left-to-right in columns, so it reads as a crowd arriving
                const filled = col < GRID_COLS * 0.6;
                return (
                    <span
                        key={i}
                        className="w-full rounded-[1px]"
                        style={{
                            backgroundColor: filled ? RED : "#333",
                            opacity: run ? (filled ? 1 : 0.5) : 0,
                            transform: `scale(${run ? 1 : 0.4})`,
                            transition: `opacity 420ms ease ${col * 26}ms, transform 420ms ${EASE} ${col * 26}ms`,
                        }}
                    />
                );
            })}
        </div>
    );
}

const YEARS = [2015, 2016, 2017, 2018, 2019, 2023, 2024, 2026];

function Timeline({ run }: { run: boolean }) {
    return (
        <div className="relative h-12 w-full md:h-14">
            {/* the spine */}
            <span
                className="absolute bottom-[18px] left-0 h-px w-full origin-left"
                style={{
                    backgroundColor: "#3a3a3a",
                    transform: `scaleX(${run ? 1 : 0})`,
                    transition: `transform 900ms ${EASE}`,
                }}
            />
            <div className="absolute inset-0 flex items-end justify-between">
                {YEARS.map((y, i) => (
                    <span key={y} className="flex flex-col items-center gap-1">
                        <span
                            className="block w-[2px] origin-bottom"
                            style={{
                                height: i === YEARS.length - 1 ? 26 : 14,
                                backgroundColor: i === YEARS.length - 1 ? RED : "#5a5a5a",
                                transform: `scaleY(${run ? 1 : 0})`,
                                transition: `transform 520ms ${EASE} ${200 + i * 70}ms`,
                            }}
                        />
                        <span
                            className="font-mono text-[9px] tabular-nums"
                            style={{
                                color: i === YEARS.length - 1 ? RED : MUTED,
                                opacity: run ? 1 : 0,
                                transition: `opacity 420ms ease ${260 + i * 70}ms`,
                            }}
                        >
                            {i === 0 || i === YEARS.length - 1 ? y : "·"}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}

function Tally({ run }: { run: boolean }) {
    return (
        <div className="flex h-12 w-full items-end gap-[5px] md:h-14">
            {Array.from({ length: 20 }, (_, i) => (
                <span
                    key={i}
                    className="w-[3px] flex-1 origin-bottom"
                    style={{
                        maxWidth: 4,
                        // every fifth stroke taller, like a counted tally
                        height: (i + 1) % 5 === 0 ? "100%" : "62%",
                        backgroundColor: (i + 1) % 5 === 0 ? RED : "#4a4a4a",
                        transform: `scaleY(${run ? 1 : 0})`,
                        transition: `transform 520ms ${EASE} ${i * 45}ms`,
                    }}
                />
            ))}
        </div>
    );
}

const MARKS: Record<MarkKind, (p: { run: boolean }) => React.ReactElement> = {
    wave: Wave,
    grid: Grid,
    timeline: Timeline,
    tally: Tally,
};

/* ------------------------------------------------------------------- row */

function StatRow({ stat, index, run }: { stat: ImpactStat; index: number; run: boolean }) {
    const Mark = MARKS[stat.mark];
    const delay = index * 130;

    return (
        <li className="group relative border-b" style={{ borderColor: RULE }}>
            {/* ghost numeral: depth without another box */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none font-['Anton'] leading-none lg:block"
                style={{
                    fontSize: "9rem",
                    color: "#fff",
                    opacity: run ? 0.028 : 0,
                    transition: `opacity 900ms ease ${delay + 200}ms`,
                }}
            >
                {String(index + 1).padStart(2, "0")}
            </span>

            <div
                className="relative grid gap-5 py-8 md:grid-cols-12 md:items-end md:gap-8 md:py-10"
                style={{
                    opacity: run ? 1 : 0,
                    transform: `translateY(${run ? 0 : 22}px)`,
                    transition: `opacity 700ms ease ${delay}ms, transform 700ms ${EASE} ${delay}ms`,
                }}
            >
                {/* figure */}
                <div className="flex items-end gap-4 md:col-span-4 md:gap-5">
                    <span
                        aria-hidden="true"
                        className="hidden pb-3 font-mono text-[11px] tabular-nums sm:block"
                        style={{ color: MUTED }}
                    >
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <p
                        className="font-['Anton'] uppercase leading-[0.8] tracking-[0.005em] text-white"
                        style={{ fontSize: "clamp(3rem, 10vw, 6rem)" }}
                    >
                        <Counter target={stat.value} group={stat.group} run={run} />
                        <span style={{ color: RED }}>{stat.suffix}</span>
                    </p>
                </div>

                {/* the mark */}
                <div className="md:col-span-5 md:pb-2">
                    <Mark run={run} />
                </div>

                {/* label */}
                <div className="md:col-span-3 md:pb-2 md:text-right">
                    <p className="font-['Anton'] text-lg uppercase tracking-[0.02em] text-white md:text-xl">
                        {stat.label}
                    </p>
                    <p
                        className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] md:text-[11px]"
                        style={{ color: MUTED }}
                    >
                        {stat.description}
                    </p>
                </div>
            </div>

            {/* weight rule: length is the figure's relative scale */}
            <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-[2px] w-full origin-left"
                style={{
                    backgroundColor: RED,
                    transform: `scaleX(${run ? stat.weight : 0})`,
                    transition: `transform 1200ms ${EASE} ${delay + 160}ms`,
                }}
            />
        </li>
    );
}

export default function ImpactSection() {
    const { ref, seen } = useInView<HTMLElement>(0.15);

    return (
        <section
            ref={ref}
            aria-labelledby="impact-heading"
            className="relative w-full overflow-hidden bg-black py-20 md:py-28"
        >
            {/* same faint grid as the footer and the gallery, so the sections
                sit on one continuous ground rather than three backgrounds */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                    backgroundSize: "clamp(70px, 8vw, 120px) clamp(70px, 8vw, 120px)",
                }}
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(60% 45% at 50% 0%, rgba(235,0,40,0.14) 0%, rgba(0,0,0,0) 70%)",
                }}
            />

            <div className="relative mx-auto w-full max-w-[1440px] px-5 md:px-10">
                {/* ---- masthead ---- */}
                <div
                    className="grid gap-6 md:grid-cols-12 md:items-end md:gap-8"
                    style={{
                        opacity: seen ? 1 : 0,
                        transform: `translateY(${seen ? 0 : 18}px)`,
                        transition: `opacity 700ms ease, transform 700ms ${EASE}`,
                    }}
                >
                    <div className="md:col-span-7">
                        <p
                            className="font-mono text-[10px] uppercase tracking-[0.3em] sm:text-[11px]"
                            style={{ color: MUTED }}
                        >
                            {impactData.eyebrow}
                        </p>
                        <h2
                            id="impact-heading"
                            className="mt-4 font-['Anton'] uppercase leading-[0.86] tracking-[0.005em] text-white"
                            style={{ fontSize: "clamp(2.75rem, 11vw, 7.5rem)" }}
                        >
                            Our <span style={{ color: RED }}>Impact</span>
                        </h2>
                    </div>

                    <p
                        className="max-w-prose text-pretty font-body text-sm leading-relaxed md:col-span-5 md:pb-3 md:text-base"
                        style={{ color: "#c9c7c2" }}
                    >
                        {impactData.lede}
                    </p>
                </div>

                {/* ---- the ledger ---- */}
                <ul className="mt-12 list-none border-t md:mt-16" style={{ borderColor: RULE }}>
                    {impactData.statistics.map((stat, i) => (
                        <StatRow key={stat.label} stat={stat} index={i} run={seen} />
                    ))}
                </ul>
            </div>
        </section>
    );
}
