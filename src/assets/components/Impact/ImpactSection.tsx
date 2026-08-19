import { useEffect, useRef, useState } from "react";
import { impactData, type ImpactStat } from "./impactData";

/** Counts 0 -> target once the element scrolls into view. */
function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const done = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || done.current) return;
                done.current = true;
                const start = Date.now();
                const tick = () => {
                    const p = Math.min((Date.now() - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    setCount(Math.floor(target * eased));
                    if (p < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            },
            { threshold: 0.5 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [target, duration]);

    return <span ref={ref}>{count.toLocaleString()}</span>;
}

/** Ring that sweeps to `progress`% when the card becomes visible. */
function CircularProgress({
    progress,
    size,
    strokeWidth = 4,
}: {
    progress: number;
    size: number;
    strokeWidth?: number;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#E62B1E"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 2s cubic-bezier(0.4,0,0.2,1)" }}
            />
        </svg>
    );
}

function StatCard({ stat, index }: { stat: ImpactStat; index: number }) {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setTimeout(() => setVisible(true), index * 150);
            },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [index]);

    return (
        <div
            ref={ref}
            className={`group flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 transition-all duration-700 hover:-translate-y-1.5 hover:border-[#E62B1E]/60 hover:bg-white/[0.06] ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
            <div className="relative mb-6 flex items-center justify-center">
                <CircularProgress progress={visible ? stat.maxProgress : 0} size={110} />
                <span className="absolute text-3xl">{stat.icon}</span>
            </div>

            <div className="font-display text-4xl font-black leading-none text-white">
                {stat.isStatic ? (
                    stat.number
                ) : (
                    <>
                        <AnimatedCounter target={stat.value} />
                        {stat.number.includes("+") ? "+" : ""}
                    </>
                )}
            </div>

            <div className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-tedx-red">
                {stat.label}
            </div>

            <p className="mt-2 max-w-[24ch] font-body text-sm leading-relaxed text-white/55">
                {stat.description}
            </p>
        </div>
    );
}

export default function ImpactSection() {
    return (
        <section className="relative w-full bg-black px-6 pt-24 pb-10 md:pt-28 md:pb-12 font-body">
            <div className="mx-auto max-w-[1400px]">
                <header className="mb-16 text-center">
                    <h2 className="font-display text-[clamp(2rem,6vw,3.5rem)] font-black leading-none text-tedx-red">
                        {impactData.title}
                    </h2>
                    <p className="mt-3 text-[clamp(1rem,3vw,1.3rem)] font-light text-white/90">
                        {impactData.subtitle}
                    </p>
                    <p className="mx-auto mt-4 max-w-[600px] text-[clamp(0.9rem,2.5vw,1rem)] leading-relaxed text-white/60">
                        {impactData.description}
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {impactData.statistics.map((stat, i) => (
                        <StatCard key={stat.label} stat={stat} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
