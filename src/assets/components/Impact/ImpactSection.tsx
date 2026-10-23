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
 * Sized to one screen. Everything vertical is expressed in svh so the whole
 * section lands inside the viewport instead of running past it — which also
 * fixes the animation: when the section was taller than the screen it had
 * already finished playing by the time you scrolled far enough to look at it.
 * It now holds until roughly half of it is on screen, then plays in front of
 * you.
 *
 * Each figure gets a mark that means something: plays as a waveform, the
 * community as a filled grid, years as a dated timeline, speakers as a tally
 * of exactly twenty strokes. There is deliberately no bar comparing the
 * figures to each other — views, followers, years and speakers share no scale,
 * so any such comparison would be decoration pretending to be data.
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

/**
 * Fires once, and not until `threshold` of the section is actually on screen —
 * at the old 0.15 the sequence started the instant the first sliver appeared,
 * so it was over before it was worth watching.
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

/** Counts up, eased hard at the front so the figure sprints then settles. */
function Counter({ target, group, run }: { target: number; group?: boolean; run: boolean }) {
    const [n, setN] = useState(0);

    useEffect(() => {
        if (!run) return;
        if (prefersReducedMotion()) {
            setN(target);
            return;
        }
        const DURATION = 1500;
        let frame = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / DURATION);
            const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            setN(Math.round(target * eased));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [run, target]);

    return <>{group ? n.toLocaleString("en-IN") : n}</>;
}

/* ------------------------------------------------------------------ marks */

const MARK_H = "clamp(1.75rem, 4.6svh, 3rem)";

/** fixed, not random: the silhouette must be identical on every render */
const WAVE = [
    0.22, 0.46, 0.3, 0.68, 0.92, 0.54, 0.38, 0.74, 1, 0.62, 0.42, 0.84, 0.56, 0.3, 0.5, 0.78,
    0.96, 0.64, 0.36, 0.58, 0.88, 0.48, 0.26, 0.7, 0.82, 0.44, 0.34, 0.6,
];

function Wave({ run }: { run: boolean }) {
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
                        transition: `transform 560ms ${EASE} ${i * 20}ms`,
                    }}
                />
            ))}
        </div>
    );
}

const GRID_COLS = 30;
const GRID_ROWS = 3;

function Grid({ run }: { run: boolean }) {
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
                return (
                    <span
                        key={i}
                        style={{
                            backgroundColor: RED,
                            opacity: run ? 1 : 0,
                            transform: `scale(${run ? 1 : 0.35})`,
                            transition: `opacity 360ms ease ${col * 22}ms, transform 360ms ${EASE} ${col * 22}ms`,
                        }}
                    />
                );
            })}
        </div>
    );
}

/** one tick per year from FOUNDED to EDITION — the span the figure states */
function Timeline({ run }: { run: boolean }) {
    const years = Array.from({ length: EDITION - FOUNDED + 1 }, (_, i) => FOUNDED + i);
    return (
        <div className="relative w-full" style={{ height: MARK_H }}>
            <span
                className="absolute bottom-[14px] left-0 h-px w-full origin-left"
                style={{
                    backgroundColor: "#3a3a3a",
                    transform: `scaleX(${run ? 1 : 0})`,
                    transition: `transform 800ms ${EASE}`,
                }}
            />
            <div className="absolute inset-0 flex items-end justify-between">
                {years.map((y, i) => {
                    const last = i === years.length - 1;
                    return (
                        <span key={y} className="flex flex-col items-center gap-1">
                            <span
                                className="block w-[2px] origin-bottom"
                                style={{
                                    height: last ? 22 : 11,
                                    backgroundColor: last ? RED : "#5a5a5a",
                                    transform: `scaleY(${run ? 1 : 0})`,
                                    transition: `transform 460ms ${EASE} ${160 + i * 55}ms`,
                                }}
                            />
                            <span
                                className="font-mono text-[9px] tabular-nums leading-none"
                                style={{
                                    color: last ? RED : MUTED,
                                    opacity: run ? 1 : 0,
                                    transition: `opacity 380ms ease ${220 + i * 55}ms`,
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
function Tally({ run }: { run: boolean }) {
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
                        transition: `transform 460ms ${EASE} ${i * 40}ms`,
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
    const delay = index * 140;

    return (
        <li
            className="border-b"
            style={{
                borderColor: RULE,
                opacity: run ? 1 : 0,
                transform: `translateY(${run ? 0 : 18}px)`,
                transition: `opacity 620ms ease ${delay}ms, transform 620ms ${EASE} ${delay}ms`,
            }}
        >
            <div
                className="grid items-center gap-x-6 gap-y-2 md:grid-cols-12"
                style={{ paddingTop: "clamp(0.7rem, 2svh, 1.4rem)", paddingBottom: "clamp(0.7rem, 2svh, 1.4rem)" }}
            >
                {/* figure + label share a line on phones so the row stays short */}
                <div className="flex items-end justify-between gap-4 md:col-span-4 md:justify-start md:gap-5">
                    <p
                        className="font-['Anton'] uppercase leading-[0.8] tracking-[0.01em] text-white"
                        style={{ fontSize: "clamp(2.25rem, 7.4svh, 4.5rem)" }}
                    >
                        <Counter target={stat.value} group={stat.group} run={run} />
                        <span style={{ color: RED }}>{stat.suffix}</span>
                    </p>

                    <p className="font-['Anton'] text-base uppercase tracking-[0.02em] text-white md:hidden">
                        {stat.label}
                    </p>
                </div>

                <div className="md:col-span-5">
                    <Mark run={run} />
                </div>

                <div className="hidden md:col-span-3 md:block md:text-right">
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
                    style={{ color: MUTED }}
                >
                    {stat.description}
                </p>
            </div>
        </li>
    );
}

export default function ImpactSection() {
    const { ref, seen } = useInView<HTMLElement>(0.4);

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
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(60% 45% at 50% 0%, rgba(235,0,40,0.14) 0%, rgba(0,0,0,0) 70%)",
                }}
            />

            <div className="relative mx-auto w-full max-w-[1440px] px-5 md:px-10">
                <div
                    className="grid gap-4 md:grid-cols-12 md:items-end md:gap-8"
                    style={{
                        opacity: seen ? 1 : 0,
                        transform: `translateY(${seen ? 0 : 14}px)`,
                        transition: `opacity 620ms ease, transform 620ms ${EASE}`,
                    }}
                >
                    <div className="md:col-span-7">
                        <p
                            className="font-mono text-[10px] uppercase tracking-[0.3em]"
                            style={{ color: MUTED }}
                        >
                            {impactData.eyebrow}
                        </p>
                        <h2
                            id="impact-heading"
                            className="mt-3 font-['Anton'] uppercase leading-[0.86] tracking-[0.01em] text-white"
                            style={{ fontSize: "clamp(2.25rem, 10svh, 5.5rem)" }}
                        >
                            Our <span style={{ color: RED }}>Impact</span>
                        </h2>
                    </div>

                    <p
                        className="max-w-prose text-pretty font-body text-sm leading-relaxed md:col-span-5 md:pb-2"
                        style={{ color: "#c9c7c2" }}
                    >
                        {impactData.lede}
                    </p>
                </div>

                <ul
                    className="list-none border-t"
                    style={{ borderColor: RULE, marginTop: "clamp(1.25rem, 4svh, 3rem)" }}
                >
                    {impactData.statistics.map((stat, i) => (
                        <StatRow key={stat.label} stat={stat} index={i} run={seen} />
                    ))}
                </ul>
            </div>
        </section>
    );
}
