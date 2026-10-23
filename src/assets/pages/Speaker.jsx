/**
 * Speakers — not announced yet.
 *
 * Rebuilt in the site's own language rather than the ported "Coming Soon"
 * page, which carried its own Helvetica stack and centred everything in the
 * middle of an empty screen. The page title is in the navbar, so the h1 here
 * is sr-only.
 *
 * It points at the thing that DOES exist — the Archive of Voices reel on the
 * home page — instead of being a dead end.
 */

import { Link } from 'react-router-dom';

const RED = '#eb0028';
const RULE = '#232323';
const MUTED = '#8a8a8a';

export default function Speaker() {
    return (
        <div className="relative min-h-screen bg-black text-white">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
                    backgroundSize: 'clamp(70px, 8vw, 120px) clamp(70px, 8vw, 120px)',
                }}
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(55% 40% at 50% 0%, rgba(235,0,40,0.16) 0%, rgba(0,0,0,0) 70%)',
                }}
            />

            <main className="relative mx-auto w-full max-w-[1440px] px-5 pb-28 md:px-10">
                <h1 className="sr-only">Speakers</h1>

                <p
                    className="font-mono text-[10px] uppercase tracking-[0.3em] sm:text-[11px]"
                    style={{ color: MUTED }}
                >
                    TEDxTIET 2026 — line-up
                </p>

                <p
                    className="mt-5 font-['Anton'] uppercase leading-[0.86] tracking-[0.01em] text-white"
                    style={{ fontSize: 'clamp(2.5rem, 11vw, 7rem)' }}
                >
                    Not announced
                    <br />
                    <span style={{ color: RED }}>yet.</span>
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-12 md:gap-8">
                    <p
                        className="max-w-prose text-pretty font-body text-sm leading-relaxed md:col-span-6 md:text-base"
                        style={{ color: '#c9c7c2' }}
                    >
                        Curation runs for months before a name is public. When the 2026
                        line-up is confirmed it lands here first — and in the meantime the
                        people who have already spoken on this stage are not hard to find.
                    </p>

                    <div className="flex flex-col items-start gap-4 md:col-span-6 md:items-end">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-3 py-2 font-['Anton'] text-sm uppercase tracking-[0.06em] text-white transition-opacity duration-300 hover:opacity-85"
                            style={{ backgroundColor: RED }}
                        >
                            Watch the Archive of Voices
                            <span aria-hidden="true">→</span>
                        </Link>
                        <p
                            className="font-mono text-[10px] uppercase tracking-[0.16em]"
                            style={{ color: MUTED }}
                        >
                            Ten past speakers, on the home page
                        </p>
                    </div>
                </div>

                {/* the years that have happened, same device as Our Impact */}
                <div className="mt-16 border-t pt-6 md:mt-24" style={{ borderColor: RULE }}>
                    <p
                        className="font-mono text-[10px] uppercase tracking-[0.2em]"
                        style={{ color: MUTED }}
                    >
                        Editions
                    </p>
                    <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                        {[2015, 2016, 2017, 2018, 2019, 2023, 2024, 2026].map((y) => {
                            const next = y === 2026;
                            return (
                                <span
                                    key={y}
                                    className="font-['Anton'] text-xl tabular-nums tracking-[0.02em] md:text-2xl"
                                    style={{ color: next ? RED : '#4a4a4a' }}
                                >
                                    {y}
                                    {next && (
                                        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em]">
                                            next
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>

                <div
                    className="mt-14 flex flex-col gap-3 border-t pt-6 font-mono text-[10px] uppercase tracking-[0.2em] sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: RULE, color: MUTED }}
                >
                    <p>Want to propose a speaker?</p>
                    <a
                        href="mailto:tedxtiet@thapar.edu"
                        className="group inline-flex items-center gap-2 py-[5px] transition-colors duration-300 hover:text-white"
                    >
                        tedxtiet@thapar.edu
                        <span
                            aria-hidden="true"
                            className="transition-transform duration-300 group-hover:translate-x-1"
                        >
                            →
                        </span>
                    </a>
                </div>
            </main>
        </div>
    );
}
