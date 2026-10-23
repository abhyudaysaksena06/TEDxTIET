import { useEffect, useRef, useState } from "react";
import {
    impactData,
    FOUNDED,
    EDITION,
    type ImpactStat,
    type MarkKind,
} from "./impactData";

/**
 * Our Impact.
 *
 * Sized to one screen — everything vertical is in svh, so the section lands
 * inside the viewport instead of running past it. That is also what makes the
 * animation watchable: when the section was taller than the screen it had
 * already finished by the time you scrolled far enough to look at it.
 *
 * The reveal is choreographed rather than fired all at once. The masthead
 * arrives, then each row in turn, and inside a row the numeral rises out of a
 * clipped line first, its mark draws second, its label settles last. Only
 * transform and opacity are animated, so the whole sequence stays on the
 * compositor.
 *
 * Each figure's mark means something: plays as a waveform, the community as a
 * filled grid, years as a dated timeline, speakers as a tally of exactly
 * twenty strokes. There is deliberately no bar comparing the figures to one
 * another — views, followers, years and speakers share no scale.
 */

const RED = "#eb0028";
const RULE = "#232323";
const MUTED = "#8a8a8a";

/** one easing for the whole section, so every move feels related */
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** the sequence, in ms */
const T = {
    mastOut: 0,
    firstRow: 240,
    rowStep: 150,
    mark: 130, // after its row starts
    label: 210,
};

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
 * Fires once, and not until `threshold` of the section is actually on screen —
 * at 0.15 the sequence started the instant the first sliver appeared, so it
 * was over before it was worth watching.
 */
function useInView<T extends HTMLElement>(threshold = 0.4) {
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
 * Counts up on rAF against elapsed time, so the run takes the same wall-clock
 * duration at 60Hz and 144Hz.
 *
 * Eased with easeOutQuart rather than easeOutExpo: expo is past 99% a third of
 * the way in and then crawls, which reads as a snap followed by a stall. Quart
 * is still quick off the mark but actually settles.
 */
function Counter({
    target,
    group,
    run,
    delay,
}: {
    target: number;
    group?: boolean;
    run: boolean;
    delay: number;
}) {
    const [n, setN] = useState(0);

    useEffect(() => {
        if (!run) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setN(target);
            return;
        }

        const DURATION = 1600;
        let frame = 0;
        let start = 0;

        const tick = (now: number) => {
            if (!start) start = now;
            const elapsed = now - start - delay;
            if (elapsed < 0) {
                frame = requestAnimationFrame(tick);
                return;
            }
            const t = Math.min(1, elapsed / DURATION);
            const eased = 1 - Math.pow(1 - t, 4);
            setN(Math.round(target * eased));
            if (t < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [run, target, delay]);

    return <>{group ? n.toLocaleString("en-IN") : n}</>;
}

/* ------------------------------------------------------------------ marks */

const MARK_H = "clamp(1.75rem, 4.6svh, 3rem)";

/** fixed, not random: the silhouette must be identical on every render */
const WAVE = [
    0.22, 0.46, 0.3, 0.68, 0.92, 0.54, 0.38, 0.74, 1, 0.62, 0.42, 0.84, 0.56, 0.3, 0.5, 0.78,
    0.96, 0.64, 0.36, 0.58, 0.88, 0.48, 0.26, 0.7, 0.82, 0.44, 0.34, 0.6,
];

interface MarkProps {
    run: boolean;
    /** ms before this mark begins */
    at: number;
}

function Wave({ run, at }: MarkProps) {
    return (
        <div className="flex w-full items-end gap-[2px]" style={{ height: MARK_H }}>
            {WAVE.map((h, i) => (
                <span
                    key={i}
                    className="flex-1 origin-bottom"
                    style={{
                        height: `${h * 100}%`,
                        backgroundColor: i % 4 === 0 ? RED : "#4a4a4a",
                        transform: `scaleY(${run ? 1 : 0})`,
                        willChange: "transform",
                        transition: `transform 620ms ${EASE} ${at + i * 18}ms`,
                    }}
                />
            ))}
        </div>
    );
}

const GRID_COLS = 30;
const GRID_ROWS = 3;

function Grid({ run, at }: MarkProps) {
    return (
        <div
            className="grid w-full gap-[3px]"
            style={{
                height: MARK_H,
                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
            }}
        >
            {Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
                const col = i % GRID_COLS;
                const row = Math.floor(i / GRID_COLS);
                // sweeps column by column, with each row a touch behind the one
                // above, so the fill reads as a wave rather than a hard edge
                const d = at + col * 20 + row * 45;
                return (
                    <span
                        key={i}
                        style={{
                            backgroundColor: RED,
                            opacity: run ? 1 : 0,
                            transform: `scale(${run ? 1 : 0.4})`,
                            willChange: "transform, opacity",
                            transition: `opacity 420ms ease ${d}ms, transform 420ms ${EASE} ${d}ms`,
                        }}
                    />
                );
            })}
        </div>
    );
}

/** one tick per year from FOUNDED to EDITION — the span the figure states */
function Timeline({ run, at }: MarkProps) {
    const years = Array.from({ length: EDITION - FOUNDED + 1 }, (_, i) => FOUNDED + i);
    return (
        <div className="relative w-full" style={{ height: MARK_H }}>
            <span
                className="absolute bottom-[14px] left-0 h-px w-full origin-left"
                style={{
                    backgroundColor: "#3a3a3a",
                    transform: `scaleX(${run ? 1 : 0})`,
                    willChange: "transform",
                    transition: `transform 760ms ${EASE} ${at}ms`,
                }}
            />
            <div className="absolute inset-0 flex items-end justify-between">
                {years.map((y, i) => {
                    const last = i === years.length - 1;
                    // ticks chase the spine as it draws
                    const d = at + 200 + i * 46;
                    return (
                        <span key={y} className="flex flex-col items-center gap-1">
                            <span
                                className="block w-[2px] origin-bottom"
                                style={{
                                    height: last ? 22 : 11,
                                    backgroundColor: last ? RED : "#5a5a5a",
                                    transform: `scaleY(${run ? 1 : 0})`,
                                    willChange: "transform",
                                    transition: `transform 420ms ${EASE} ${d}ms`,
                                }}
                            />
                            <span
                                className="font-mono text-[9px] tabular-nums leading-none"
                                style={{
                                    color: last ? RED : MUTED,
                                    opacity: run ? 1 : 0,
                                    transition: `opacity 360ms ease ${d + 60}ms`,
                                }}
                            >
                                {i === 0 || last ? y : "·"}
                            </span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

/** exactly twenty strokes, because the figure is twenty */
function Tally({ run, at }: MarkProps) {
    return (
        <div className="flex w-full items-end gap-[5px]" style={{ height: MARK_H }}>
            {Array.from({ length: 20 }, (_, i) => (
                <span
                    key={i}
                    className="flex-1 origin-bottom"
                    style={{
                        maxWidth: 4,
                        height: (i + 1) % 5 === 0 ? "100%" : "62%",
                        backgroundColor: (i + 1) % 5 === 0 ? RED : "#4a4a4a",
                        transform: `scaleY(${run ? 1 : 0})`,
                        willChange: "transform",
                        transition: `transform 480ms ${EASE} ${at + i * 36}ms`,
                    }}
                />
            ))}
        </div>
    );
}

const MARKS: Record<MarkKind, (p: MarkProps) => React.ReactElement> = {
    wave: Wave,
    grid: Grid,
    timeline: Timeline,
    tally: Tally,
};

/* ------------------------------------------------------------------- row */

function StatRow({
    stat,
    index,
    run,
    reduced,
}: {
    stat: ImpactStat;
    index: number;
    run: boolean;
    reduced: boolean;
}) {
    const Mark = MARKS[stat.mark];
    // no waiting around for anyone who asked for less motion
    const base = reduced ? 0 : T.firstRow + index * T.rowStep;

    return (
        <li className="relative">
            <div
                className="grid items-center gap-x-6 gap-y-2 md:grid-cols-12"
                style={{
                    paddingTop: "clamp(0.7rem, 2svh, 1.4rem)",
                    paddingBottom: "clamp(0.7rem, 2svh, 1.4rem)",
                }}
            >
                {/* figure + label share a line on phones so the row stays short */}
                <div className="flex items-end justify-between gap-4 md:col-span-4 md:justify-start md:gap-5">
                    {/* the numeral rises out of its own clipped line, the way
                        the footer wordmark and the menu rows do */}
                    <span className="block overflow-hidden">
                        <span
                            className="block font-['Anton'] uppercase leading-[0.8] tracking-[0.01em] text-white"
                            style={{
                                fontSize: "clamp(2.25rem, 7.4svh, 4.5rem)",
                                transform: `translateY(${run ? "0%" : "108%"})`,
                                willChange: "transform",
                                transition: `transform 760ms ${EASE} ${base}ms`,
                            }}
                        >
                            <Counter
                                target={stat.value}
                                group={stat.group}
                                run={run}
                                delay={base}
                            />
                            <span style={{ color: RED }}>{stat.suffix}</span>
                        </span>
                    </span>

                    <span className="block overflow-hidden md:hidden">
                        <span
                            className="block font-['Anton'] text-base uppercase tracking-[0.02em] text-white"
                            style={{
                                transform: `translateY(${run ? "0%" : "108%"})`,
                                transition: `transform 620ms ${EASE} ${base + T.label}ms`,
                            }}
                        >
                            {stat.label}
                        </span>
                    </span>
                </div>

                <div className="md:col-span-5">
                    <Mark run={run} at={base + (reduced ? 0 : T.mark)} />
                </div>

                <div
                    className="hidden md:col-span-3 md:block md:text-right"
                    style={{
                        opacity: run ? 1 : 0,
                        transform: `translateY(${run ? 0 : 10}px)`,
                        transition: `opacity 560ms ease ${base + T.label}ms, transform 560ms ${EASE} ${base + T.label}ms`,
                    }}
                >
                    <p className="font-['Anton'] text-lg uppercase tracking-[0.02em] text-white">
                        {stat.label}
                    </p>
                    <p
                        className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em]"
                        style={{ color: MUTED }}
                    >
                        {stat.description}
                    </p>
                </div>

                <p
                    className="font-mono text-[10px] uppercase tracking-[0.14em] md:hidden"
                    style={{
                        color: MUTED,
                        opacity: run ? 1 : 0,
                        transition: `opacity 560ms ease ${base + T.label}ms`,
                    }}
                >
                    {stat.description}
                </p>
            </div>

            {/* the divider draws in with its row rather than sitting there
                waiting for it */}
            <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-px w-full origin-left"
                style={{
                    backgroundColor: RULE,
                    transform: `scaleX(${run ? 1 : 0})`,
                    willChange: "transform",
                    transition: `transform 900ms ${EASE} ${base}ms`,
                }}
            />
        </li>
    );
}

export default function ImpactSection() {
    const { ref, seen } = useInView<HTMLElement>(0.4);
    const reduced = usePrefersReducedMotion();

    return (
        <section
            ref={ref}
            aria-labelledby="impact-heading"
            className="relative flex w-full flex-col justify-center overflow-hidden bg-black"
            style={{
                minHeight: "100svh",
                paddingTop: "clamp(2rem, 6svh, 4rem)",
                paddingBottom: "clamp(2rem, 6svh, 4rem)",
            }}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                    backgroundSize: "clamp(70px, 8vw, 120px) clamp(70px, 8vw, 120px)",
                }}
            />
            {/* the glow lifts as the section arrives, so the ground moves too */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(60% 45% at 50% 0%, rgba(235,0,40,0.16) 0%, rgba(0,0,0,0) 70%)",
                    opacity: seen ? 1 : 0,
                    transition: "opacity 1200ms ease",
                }}
            />

            <div className="relative mx-auto w-full max-w-[1440px] px-5 md:px-10">
                <div className="grid gap-4 md:grid-cols-12 md:items-end md:gap-8">
                    <div className="md:col-span-7">
                        <p
                            className="font-mono text-[10px] uppercase tracking-[0.3em]"
                            style={{
                                color: MUTED,
                                opacity: seen ? 1 : 0,
                                transform: `translateY(${seen ? 0 : 8}px)`,
                                transition: `opacity 560ms ease, transform 560ms ${EASE}`,
                            }}
                        >
                            {impactData.eyebrow}
                        </p>

                        {/* the title rises out of a clipped line too */}
                        <span className="mt-3 block overflow-hidden">
                            <h2
                                id="impact-heading"
                                className="block font-['Anton'] uppercase leading-[0.86] tracking-[0.01em] text-white"
                                style={{
                                    fontSize: "clamp(2.25rem, 10svh, 5.5rem)",
                                    transform: `translateY(${seen ? "0%" : "105%"})`,
                                    willChange: "transform",
                                    transition: `transform 820ms ${EASE} 60ms`,
                                }}
                            >
                                Our <span style={{ color: RED }}>Impact</span>
                            </h2>
                        </span>
                    </div>

                    <p
                        className="max-w-prose text-pretty font-body text-sm leading-relaxed md:col-span-5 md:pb-2"
                        style={{
                            color: "#c9c7c2",
                            opacity: seen ? 1 : 0,
                            transform: `translateY(${seen ? 0 : 10}px)`,
                            transition: `opacity 620ms ease 160ms, transform 620ms ${EASE} 160ms`,
                        }}
                    >
                        {impactData.lede}
                    </p>
                </div>

                <ul
                    className="relative list-none"
                    style={{ marginTop: "clamp(1.25rem, 4svh, 3rem)" }}
                >
                    {/* top rule draws before the first row lands */}
                    <span
                        aria-hidden="true"
                        className="absolute left-0 top-0 h-px w-full origin-left"
                        style={{
                            backgroundColor: RULE,
                            transform: `scaleX(${seen ? 1 : 0})`,
                            transition: `transform 900ms ${EASE} 140ms`,
                        }}
                    />
                    {impactData.statistics.map((stat, i) => (
                        <StatRow
                            key={stat.label}
                            stat={stat}
                            index={i}
                            run={seen}
                            reduced={reduced}
                        />
                    ))}
                </ul>
            </div>
        </section>
    );
}
