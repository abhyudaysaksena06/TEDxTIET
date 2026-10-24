/**
 * Sponsors — coming soon.
 *
 * A placeholder until the 2026 partners are confirmed, built in the same
 * language as the Speakers page so it reads as part of the site rather than
 * an empty stub. It is not a dead end: anyone who wants to sponsor can write
 * in from here. The page title is in the navbar, so the h1 is sr-only.
 */

import { ArrowRight, ArrowUpRight } from 'lucide-react';

const RED = '#eb0028';
const RULE = '#232323';
const MUTED = '#8a8a8a';

const PARTNER_MAIL = 'mailto:tedx@thapar.edu?subject=Sponsoring%20TEDxTIET%202026';

export default function Sponsors() {
    return (
        <div className="relative h-full bg-black text-white">
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

            {/* one screen, no scroll: the contact row sits on the screen's foot */}
            <main className="relative mx-auto flex h-full w-full max-w-[1440px] flex-col px-5 pb-8 md:px-10 md:pb-10">
                <h1 className="sr-only">Sponsors</h1>

                <p
                    className="font-mono text-[10px] uppercase tracking-[0.3em] sm:text-[11px]"
                    style={{ color: MUTED }}
                >
                    TEDxTIET 2026 — partners
                </p>

                <p
                    className="mt-5 font-['Anton'] uppercase leading-[0.86] tracking-[0.01em] text-white"
                    style={{ fontSize: 'clamp(2.5rem, 11vw, 7rem)' }}
                >
                    Coming
                    <br />
                    <span style={{ color: RED }}>soon.</span>
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-12 md:gap-8">
                    <p
                        className="max-w-prose text-pretty font-body text-sm leading-relaxed md:col-span-6 md:text-base"
                        style={{ color: '#c9c7c2' }}
                    >
                        The organisations behind TEDxTIET 2026 will be announced here. If yours
                        would like to be one of them, we would like to hear from you.
                    </p>

                    <div className="flex flex-col items-start gap-4 md:col-span-6 md:items-end">
                        <a
                            href={PARTNER_MAIL}
                            className="inline-flex items-center gap-2 px-3 py-2 font-['Anton'] text-sm uppercase tracking-[0.06em] text-white transition-opacity duration-300 hover:opacity-85"
                            style={{ backgroundColor: RED }}
                        >
                            Become a partner
                            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                        </a>
                        <p
                            className="font-mono text-[10px] uppercase tracking-[0.16em]"
                            style={{ color: MUTED }}
                        >
                            Opens an email to the organising team
                        </p>
                    </div>
                </div>

                <div aria-hidden="true" className="min-h-8 flex-1" />
                <div
                    className="flex flex-col gap-3 border-t pt-6 font-mono text-[10px] uppercase tracking-[0.2em] sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: RULE, color: MUTED }}
                >
                    <p>Sponsorship enquiries</p>
                    <a
                        href={PARTNER_MAIL}
                        className="group inline-flex items-center gap-2 py-[5px] transition-colors duration-300 hover:text-white"
                    >
                        tedx@thapar.edu
                        <ArrowRight
                            aria-hidden="true"
                            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </a>
                </div>
            </main>
        </div>
    );
}
