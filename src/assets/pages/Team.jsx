import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Team — one roster, one layout, one source of truth.
 *
 * What this replaces: the page kept the same people in four arrays
 * (TEAM_MEMBERS, BOARD_LEFT/RIGHT, COMMITTEE_LEFT/RIGHT) split by which COLUMN
 * they were meant to land in, so the data carried layout state and the same
 * person could be — and was — spelled two different ways in two places. It also
 * shipped a desktop list and a separate mobile card grid for every section,
 * and a 20-panel requestAnimationFrame marquee that wrote width + height on
 * each panel every frame.
 *
 * Now: BOARD and COMMITTEE are plain data. One <Roster> renders both at every
 * breakpoint. Every row carries its own thumbnail, so nothing is hover-only —
 * the big portrait that tracks the cursor is enhancement for fine pointers,
 * not the only way to see a face.
 */

const RED = '#eb0028';
const RULE = '#232323';
const MUTED = '#8a8a8a';

/**
 * Names are stored in natural case and uppercased in CSS, so assistive tech and
 * image alt text read "Rohan Sharma" rather than shouting. Spelling is
 * normalised to one form per person — the old arrays disagreed on
 * SHRADOOL/SHARDOOL and SURYA PRATAP/PARTAP — and "Organiser" is used
 * throughout rather than alternating with "Organizer".
 */
const BOARD = [
    { name: 'Rohan Sharma', role: 'Lead Organiser', image: '/ExecutiveBoard/ROHANSHARMA.webp' },
    { name: 'Poorva Puri', role: 'Co-Lead Organiser', image: '/ExecutiveBoard/POORVAPURI.webp' },
    { name: 'Shardool', role: 'Co-Lead Organiser', image: '/ExecutiveBoard/SHRADOOL.webp' },
    { name: 'Vrinda Chhabra', role: 'Curation Head', image: '/ExecutiveBoard/VRINDACHHABRA.webp' },
    { name: 'Aniket Gupta', role: 'Relations & Strategy Head', image: '/ExecutiveBoard/ANIKETGUPTA.webp' },
    { name: 'Sanya Rajput', role: 'Events & Outreach Head', image: '/ExecutiveBoard/SANYARAJPUT.webp' },
    { name: 'Surya Pratap Singh', role: 'Operations & Media Head', image: '/ExecutiveBoard/SURYAPRATAPSINGH.webp' },
    { name: 'Aanya Garg', role: 'Marketing Head', image: '/ExecutiveBoard/AANYAGARG.webp' },
    { name: 'Daksh Sachdeva', role: 'Design Head', image: '/ExecutiveBoard/DAKSHSACHDEVA.webp' },
    { name: 'Disha Verma', role: 'Experience Head', image: '/ExecutiveBoard/DISHAVERMA.webp' },
];

const COMMITTEE = [
    { name: 'Rajat Verma', image: '/ExecutiveCommittee/RAJAT.webp' },
    { name: 'Kanan Mahajan', image: '/ExecutiveCommittee/KANAN.webp' },
    { name: 'Doreen Sidhu', image: '/ExecutiveCommittee/DOREEN.webp' },
    { name: 'Samaira Nayyar', image: '/ExecutiveCommittee/SAMAIRA.webp' },
    { name: 'Raghav Garg', image: '/ExecutiveCommittee/RAGHAV.webp' },
    { name: 'Utkarsh Uppal', image: '/ExecutiveCommittee/UTKARSH.webp' },
    { name: 'Kuwar Kalra', image: '/ExecutiveCommittee/KUWAR.webp' },
    { name: 'Hardik Jain', image: '/ExecutiveCommittee/HARDIK.webp' },
    { name: 'Shreya Sarin', image: '/ExecutiveCommittee/SHREYA.webp' },
    { name: 'Bhavyadeep Singh', image: '/ExecutiveCommittee/BHAVYA.webp' },
    { name: 'Rhytham Gupta', image: '/ExecutiveCommittee/RHYTHAM.webp' },
    { name: 'Ridhi Batra', image: '/ExecutiveCommittee/RIDHI.webp' },
    { name: 'Arav Panchhi Chaturvedi', image: '/ExecutiveCommittee/AARAV.webp' },
    { name: 'Diya Gupta', image: '/ExecutiveCommittee/DIYA.webp' },
    { name: 'Hardaksh Sabharwal', image: '/ExecutiveCommittee/HARDAKSH.webp' },
    { name: 'Waris Mittal', image: '/ExecutiveCommittee/WARIS.webp' },
    { name: 'Khusboo Gaur', image: '/ExecutiveCommittee/KHUSBOO.webp' },
    { name: 'Kartik Goyal', image: '/ExecutiveCommittee/KARTIK.webp' },
    { name: 'Nishtha Sidana', image: '/ExecutiveCommittee/NISHTHA.webp' },
    { name: 'Ayush Mathur', image: '/ExecutiveCommittee/AYUSH.webp' },
    { name: 'Aadya Verma', image: '/ExecutiveCommittee/AADYA.webp' },
    { name: 'Shashank Jain', image: '/ExecutiveCommittee/SHASHANK.webp' },
    { name: 'Raghu Raja', image: '/ExecutiveCommittee/RAGHU.webp' },
    { name: 'Aaditi Singh', image: '/ExecutiveCommittee/AADITI.webp' },
    { name: 'Jatin Bansal', image: '/ExecutiveCommittee/JATIN.webp' },
    { name: 'Nakul Garg', image: '/ExecutiveCommittee/NAKUL.webp' },
    { name: 'Twisha Jain', image: '/ExecutiveCommittee/TWISHA.webp' },
    { name: 'Harkirat Singh', image: '/ExecutiveCommittee/HARKIRAT.webp' },
];

/** true only where a real cursor can hover, and where motion is welcome */
function usePointerFine() {
    const [fine, setFine] = useState(false);
    useEffect(() => {
        const q = window.matchMedia('(hover: hover) and (pointer: fine)');
        const r = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setFine(q.matches && !r.matches);
        sync();
        q.addEventListener('change', sync);
        r.addEventListener('change', sync);
        return () => {
            q.removeEventListener('change', sync);
            r.removeEventListener('change', sync);
        };
    }, []);
    return fine;
}

/**
 * The portrait that trails the cursor. One element for the whole page, moved by
 * writing a transform inside a rAF — pointermove fires far more often than the
 * screen refreshes, so the write is coalesced to one per frame. It is `fixed`,
 * so unlike the old per-row absolute card it can never be clipped by a column
 * or pushed off the viewport edge.
 */
function PortraitFollower({ member, enabled }) {
    const ref = useRef(null);
    const frame = useRef(0);
    const point = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!enabled) return;

        const paint = () => {
            frame.current = 0;
            const el = ref.current;
            if (!el) return;
            const { x, y } = point.current;
            el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        };

        const onMove = (e) => {
            point.current = { x: e.clientX, y: e.clientY };
            if (!frame.current) frame.current = requestAnimationFrame(paint);
        };

        window.addEventListener('pointermove', onMove, { passive: true });
        return () => {
            window.removeEventListener('pointermove', onMove);
            if (frame.current) cancelAnimationFrame(frame.current);
        };
    }, [enabled]);

    if (!enabled) return null;

    return (
        <div
            ref={ref}
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 z-[60] hidden w-[15rem] md:block"
            style={{
                opacity: member ? 1 : 0,
                transition: 'opacity 220ms ease-out',
                willChange: 'transform',
            }}
        >
            <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: RED }}>
                {member && (
                    <img src={member.image} alt="" className="h-full w-full object-cover" />
                )}
            </div>
        </div>
    );
}

/**
 * One roster row. Layout is a single tree for every breakpoint: below `sm` the
 * name and role stack under the thumbnail, from `sm` up the index appears and
 * the role is pushed out to the right margin.
 */
function RosterRow({ member, index, size, onEnter, onLeave }) {
    const big = size === 'board';

    return (
        <li
            onMouseEnter={() => onEnter(member)}
            onMouseLeave={onLeave}
            className="group relative border-b"
            style={{ borderColor: RULE }}
        >
            {/* red marker that grows out of the rule on hover */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full"
                style={{ backgroundColor: RED }}
            />

            <div
                className={`flex items-center gap-4 px-4 transition-colors duration-300 group-hover:bg-white/[0.035] sm:gap-6 md:px-6 ${
                    big ? 'py-4 sm:py-5' : 'py-3 sm:py-4'
                }`}
            >
                <span
                    className="hidden w-7 shrink-0 font-mono text-[11px] tabular-nums sm:block"
                    style={{ color: MUTED }}
                >
                    {String(index + 1).padStart(2, '0')}
                </span>

                {/* always present, so no face is locked behind a hover */}
                <span
                    className={`relative shrink-0 overflow-hidden bg-[#111111] ${
                        big ? 'w-11 sm:w-12' : 'w-9 sm:w-10'
                    }`}
                    style={{ aspectRatio: '3 / 4' }}
                >
                    <img
                        src={member.image}
                        alt={member.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover opacity-80 grayscale transition-[filter,opacity] duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                    />
                </span>

                <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                    <h3
                        className={`font-['Anton'] uppercase leading-[0.95] tracking-[0.005em] text-white transition-colors duration-300 group-hover:text-[#eb0028] ${
                            big
                                ? 'text-[clamp(1.35rem,5.2vw,2.75rem)]'
                                : 'text-[clamp(1.05rem,4vw,1.85rem)]'
                        }`}
                    >
                        {member.name}
                    </h3>

                    {member.role && (
                        <p
                            className="mt-1 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors duration-300 group-hover:text-white sm:mt-0 sm:text-[11px]"
                            style={{ color: MUTED }}
                        >
                            {member.role}
                        </p>
                    )}
                </div>
            </div>
        </li>
    );
}

function Roster({ id, label, accent, count, members, size, onEnter, onLeave }) {
    return (
        <section aria-labelledby={id} className="mt-20 md:mt-28">
            <header
                className="flex items-end justify-between gap-4 border-b px-4 pb-3 md:px-6"
                style={{ borderColor: RULE }}
            >
                <h2
                    id={id}
                    className="font-['Anton'] uppercase leading-[0.9] tracking-[0.005em] text-white"
                    style={{ fontSize: 'clamp(1.75rem, 6.5vw, 4rem)' }}
                >
                    {label} <span style={{ color: RED }}>{accent}</span>
                </h2>
                <p
                    className="shrink-0 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] sm:text-[11px]"
                    style={{ color: MUTED }}
                >
                    {String(count).padStart(2, '0')}
                </p>
            </header>

            <ul className="list-none">
                {members.map((m, i) => (
                    <RosterRow
                        key={m.image}
                        member={m}
                        index={i}
                        size={size}
                        onEnter={onEnter}
                        onLeave={onLeave}
                    />
                ))}
            </ul>
        </section>
    );
}

/**
 * The page's one moving part: a portrait strip that drifts sideways forever.
 * It is a CSS keyframe on a single transform — the version this replaces drove
 * twenty panels from a rAF loop and set `width` and `height` on each of them
 * every frame, forcing layout twenty times a frame. Hovering pauses it, and the
 * global reduced-motion rule stops it outright.
 */
function PortraitStrip({ members }) {
    // doubled so the -50% keyframe lands exactly on a seam
    const loop = useMemo(() => [...members, ...members], [members]);

    return (
        <div
            aria-hidden="true"
            className="team-strip group relative mt-10 overflow-hidden border-y py-4 md:mt-14"
            style={{ borderColor: RULE }}
        >
            {/* spacing is margin-right on EVERY tile, not `gap`: a gap is omitted
                after the last child, which would leave the -50% keyframe half a
                gap short of the seam and jog once per cycle */}
            <div className="team-strip__track flex w-max">
                {loop.map((m, i) => (
                    <div
                        key={`${m.image}-${i}`}
                        className="relative mr-3 w-[7.5rem] shrink-0 overflow-hidden bg-[#111111] md:mr-4 md:w-[9.5rem]"
                        style={{ aspectRatio: '3 / 4' }}
                    >
                        <img
                            src={m.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover opacity-55 grayscale transition-[filter,opacity] duration-500 hover:opacity-100 hover:grayscale-0"
                        />
                    </div>
                ))}
            </div>

            {/* fade the strip into the page at both ends */}
            <div
                className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-28"
                style={{ background: 'linear-gradient(to right, #000, transparent)' }}
            />
            <div
                className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-28"
                style={{ background: 'linear-gradient(to left, #000, transparent)' }}
            />
        </div>
    );
}

export default function Team() {
    const [hovered, setHovered] = useState(null);
    const pointerFine = usePointerFine();

    const onEnter = useCallback((m) => setHovered(m), []);
    const onLeave = useCallback(() => setHovered(null), []);

    const total = BOARD.length + COMMITTEE.length;

    return (
        <div className="relative min-h-screen bg-black text-white">
            <PortraitFollower member={hovered} enabled={pointerFine} />

            <main className="mx-auto w-full max-w-[1440px] px-0 pb-28 pt-6 md:pt-10">
                {/* ---- masthead ---- */}
                <header className="px-4 md:px-6">
                    <p
                        className="font-mono text-[10px] uppercase tracking-[0.3em] sm:text-[11px]"
                        style={{ color: MUTED }}
                    >
                        TEDxTIET 2026 — the people behind it
                    </p>

                    <h1
                        className="mt-4 font-['Anton'] uppercase leading-[0.86] tracking-[0.005em]"
                        style={{ fontSize: 'clamp(3.25rem, 15vw, 11rem)' }}
                    >
                        Our <span style={{ color: RED }}>Team</span>
                    </h1>

                    <div className="mt-6 grid gap-6 md:grid-cols-12 md:gap-8">
                        <p
                            className="max-w-prose text-pretty font-body text-sm leading-relaxed md:col-span-7 md:text-base"
                            style={{ color: '#c9c7c2' }}
                        >
                            {total} students run TEDxTIET — booking the speakers, building the stage,
                            cutting the films and opening the doors. Most of the work happens in the
                            months nobody sees, around classes, in a campus block in Patiala.
                        </p>

                        <dl className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[10px] uppercase tracking-[0.18em] md:col-span-5 md:justify-end md:gap-x-10 md:text-[11px]">
                            {[
                                ['Board', BOARD.length],
                                ['Committee', COMMITTEE.length],
                                ['Total', total],
                            ].map(([k, v]) => (
                                <div key={k}>
                                    <dt style={{ color: MUTED }}>{k}</dt>
                                    <dd className="mt-1 font-['Anton'] text-2xl tracking-normal text-white md:text-3xl">
                                        {String(v).padStart(2, '0')}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </header>

                <PortraitStrip members={[...BOARD, ...COMMITTEE]} />

                <Roster
                    id="executive-board"
                    label="Executive"
                    accent="Board"
                    count={BOARD.length}
                    members={BOARD}
                    size="board"
                    onEnter={onEnter}
                    onLeave={onLeave}
                />

                <Roster
                    id="executive-committee"
                    label="Executive"
                    accent="Committee"
                    count={COMMITTEE.length}
                    members={COMMITTEE}
                    size="committee"
                    onEnter={onEnter}
                    onLeave={onLeave}
                />

                {/* ---- closing line ---- */}
                <div
                    className="mt-20 flex flex-col gap-4 border-t px-4 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] sm:flex-row sm:items-center sm:justify-between md:mt-28 md:px-6"
                    style={{ borderColor: RULE, color: MUTED }}
                >
                    <p>Want to join the next one?</p>
                    <a
                        href="mailto:tedxtiet@thapar.edu"
                        className="group inline-flex items-center gap-2 transition-colors duration-300 hover:text-white"
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
