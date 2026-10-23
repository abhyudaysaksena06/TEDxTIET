import { useEffect, useRef, useState } from "react";
import { impactData, type ImpactStat } from "./impactData";

/**
 * Our Impact.
 *
 * The previous version was a row of rounded cards, each with an emoji inside a
 * circular progress ring — a dashboard idiom that belonged to a different site
 * and sat oddly against the hero, the team page and the footer. This is built
 * from the same vocabulary as the rest: black ground, a faint grid, oversized
 * Anton numerals, IBM Plex Mono micro-type, hairline rules, square corners,
 * and the footer's red wipe on hover.
 *
 * The figures read as a ledger rather than a set of tiles: one ruled row per
 * number, the numeral large enough to be the thing you actually see, and a
 * thin red rule under each whose length carries its weight — scale you can
 * glance at, without a chart.
 */

const RED = "#eb0028";
const RULE = "#232323";
const MUTED = "#8a8a8a";

/** fires once, when the element first comes into view */
function useInView<T extends HTMLElement>(threshold = 0.25) {
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
 * Counts to `target` over `duration`, eased. Driven by rAF against real
 * elapsed time rather than a per-frame increment, so the run takes the same
 * wall-clock time on a 60Hz and a 144Hz screen. Anyone who has asked for less
 * motion just gets the final figure.
 */
function Counter({ target, group, run }: { target: number; group?: boolean; run: boolean }) {
    const [n, setN] = useState(0);

    useEffect(() => {
        if (!run) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setN(target);
            return;
        }

        const DURATION = 1500;
        let frame = 0;
        const start = performance.now();

        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / DURATION);
            // easeOutExpo — fast off the mark, long settle
            const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            setN(Math.round(target * eased));
            if (t < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [run, target]);

    return <>{group ? n.toLocaleString("en-IN") : n}</>;
}

function StatRow({ stat, index, run }: { stat: ImpactStat; index: number; run: boolean }) {
    return (
        <li
            className="group relative border-b"
            style={{ borderColor: RULE }}
        >
            {/* the footer's wipe, so the two read as one system */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-[0.06]"
                style={{ backgroundColor: RED }}
            />

            <div className="relative flex flex-col gap-3 py-7 sm:flex-row sm:items-end sm:justify-between sm:gap-8 md:py-9">
                <div className="flex items-end gap-4 md:gap-6">
                    <span
                        aria-hidden="true"
                        className="hidden pb-2 font-mono text-[11px] tabular-nums sm:block"
                        style={{ color: MUTED }}
                    >
                        {String(index + 1).padStart(2, "0")}
                    </span>

                    <p
                        className="font-['Anton'] uppercase leading-[0.82] tracking-[0.005em] text-white transition-colors duration-300"
                        style={{ fontSize: "clamp(3rem, 11vw, 7rem)" }}
                    >
                        <Counter target={stat.value} group={stat.group} run={run} />
                        <span style={{ color: RED }}>{stat.suffix}</span>
                    </p>
                </div>

                <div className="sm:pb-3 sm:text-right">
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
                className="absolute bottom-0 left-0 h-[2px] origin-left transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                    backgroundColor: RED,
                    width: "100%",
                    transform: `scaleX(${run ? stat.weight : 0})`,
                    transitionDelay: `${index * 120}ms`,
                }}
            />
        </li>
    );
}

export default function ImpactSection() {
    const { ref, seen } = useInView<HTMLElement>(0.2);

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
                <div className="grid gap-6 md:grid-cols-12 md:items-end md:gap-8">
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
                <ul
                    className="mt-12 list-none border-t md:mt-16"
                    style={{ borderColor: RULE }}
                >
                    {impactData.statistics.map((stat, i) => (
                        <StatRow key={stat.label} stat={stat} index={i} run={seen} />
                    ))}
                </ul>
            </div>
        </section>
    );
}
