import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./About.css";

/**
 * About.jsx
 * --------------------------------------------------------------------------
 * TEDxTIET About section — React + Vite + Tailwind CSS.
 *
 * Styling split:
 *   - Layout, spacing, sizing, typography, flex/grid, and color come from
 *     Tailwind utility classes directly on the JSX below.
 *   - Complex visual effects that Tailwind isn't a good fit for — the dark
 *     gradient background, the card's layered box-shadow,
 *     gradient-clip-text, ::before/::after pseudo-elements,
 *     and every @keyframes animation — live in About.css, hooked to a
 *     small set of custom class names (about-stage, timeline,
 *     content-card-stage, content-card, timeline__rail-fill,
 *     timeline__node-ring, content-card__watermark, about-scroll-chevron).
 *     Those class names appear below ONLY where About.css still targets
 *     them; every other element was fully converted to Tailwind.
 *
 * Logic is unchanged: activeSection/direction/inView state, the
 * wheel/touch/keyboard scroll-lock effects, and the click handler are
 * identical to the previous version.
 * --------------------------------------------------------------------------
 */

/* ---------------------------------------------------------------------- */
/* 1. Data                                                                 */
/* ---------------------------------------------------------------------- */

const ABOUT_SECTIONS = [
  {
    id: "ted",
    index: "01",
    tag: "GLOBAL",
    title: "TED",
    meta: "Est. 1984 — worldwide",
    body: "TED is a nonprofit, nonpartisan organization dedicated to discovering, debating and spreading ideas that spark conversation, deepen understanding and drive meaningful change. Our organization is devoted to curiosity, reason, wonder and the pursuit of knowledge — without an agenda. We welcome people from every discipline and culture who seek a deeper understanding of the world and connection with others, and we invite everyone to engage with ideas and activate them in their community.",
  },
  {
    id: "tedx",
    index: "02",
    tag: "REGIONAL",
    title: "TEDx",
    meta: "x = independently organized",
    body: "In the spirit of discovering and spreading ideas, TEDx is a program of local, self-organized events that bring people together to share a TED-like experience. At a TEDx event, TED Talks video and live speakers combine to spark deep discussion and connection. These local, self-organized events are branded TEDx, where x = independently organized TED event. The TED Conference provides general guidance for the TEDx program, but individual TEDx events are self-organized, subject to certain rules and regulations.",
  },
  {
    id: "tedxtiet",
    index: "03",
    tag: "LOCAL",
    title: "TEDxTIET",
    meta: "Est. 2015 — Patiala, India",
    body: "TEDxTIET is an annual independently organized TED event that commenced in 2015. It is driven by a dedicated team of passionate volunteers, comprising undergraduate and post-graduate students of Thapar Institute of Engineering and Technology (TIET). The main conference is a culmination of months of meticulous preparation, bringing together visionaries, innovators, and changemakers for an extraordinary day of exploration and inspiration. Set against the backdrop of Thapar University in Patiala, this event transcends traditional conferences, embodying a celebration of human creativity and resilience.",
  },
];


// Transition length must match the motion.div duration below (0.6s) plus a
// small buffer, so rapid wheel ticks during an animation can't double-fire.
const LOCK_MS = 750;

// Seconds the rail fill takes to cross a single dot-to-dot gap. Jumping two
// dots at once takes proportionally longer (up to RAIL_MAX_S) so the bar
// travels at one steady speed instead of racing to cover the extra distance.
const RAIL_STEP_S = 0.75;
const RAIL_MAX_S = 1.2;

const railDuration = (steps) =>
  `${Math.min(RAIL_STEP_S * Math.max(1, steps), RAIL_MAX_S)}s`;

const cardVariants = {
  enter: (direction) => ({ opacity: 0, y: direction > 0 ? 28 : -28 }),
  center: { opacity: 1, y: 0 },
  exit: (direction) => ({ opacity: 0, y: direction > 0 ? -28 : 28 }),
};

/* ---------------------------------------------------------------------- */
/* 2. Pure helper function (no hooks, no JSX component — called from      */
/*    inside the single component's render).                              */
/* ---------------------------------------------------------------------- */

function renderSectionTitle(title) {
  if (title === "TEDx") {
    return (
      <>
        TED<span className="text-tedx-red">x</span>
      </>
    );
  }
  if (title === "TEDxTIET") {
    return (
      <>
        TED<span className="text-tedx-red">x</span>TIET
      </>
    );
  }
  return title;
}

/* ---------------------------------------------------------------------- */
/* 3–5. The single component: state, effects, and render.                 */
/* ---------------------------------------------------------------------- */

export { ABOUT_SECTIONS };

/**
 * `controlledSection` (optional) puts the card index under a parent's control —
 * AboutSection drives it from scroll position so the page physically cannot move
 * past this section until all three cards have been stepped through. When it is
 * supplied the internal wheel/touch/key hijacking is switched off, since the
 * parent's scroll track is doing that job instead.
 */
/** @param {{ controlledSection?: number|null }} props */
export default function About({ controlledSection = null }) {
  const isControlled = controlledSection !== null;
  const [uncontrolledSection, setActiveSection] = useState(0);
  const activeSection = isControlled ? controlledSection : uncontrolledSection;
  const [direction, setDirection] = useState(1);
  const [inView, setInView] = useState(false);

  const stageRef = useRef(null);
  const lockRef = useRef(false);
  const touchStartY = useRef(null);

  // The rail is positioned from the nodes' measured centres rather than from
  // hard-coded offsets — the node column's x depends on the nav's padding and
  // its y depends on how tall each label wraps, so both have to be read back
  // from layout to stay dead-centre through every breakpoint and font swap.
  const navRef = useRef(null);
  const nodeRefs = useRef([]);
  const [rail, setRail] = useState({ x: 0, top: 0, height: 0, offsets: [] });
  const [railSpan, setRailSpan] = useState(1);

  const current = ABOUT_SECTIONS[activeSection];

  const goTo = useCallback(
    (next) => {
      if (next < 0 || next > ABOUT_SECTIONS.length - 1) return;
      if (lockRef.current) return;
      lockRef.current = true;
      setDirection(next > activeSection ? 1 : -1);
      setRailSpan(Math.abs(next - activeSection));
      setActiveSection(next);
      window.setTimeout(() => {
        lockRef.current = false;
      }, LOCK_MS);
    },
    [activeSection]
  );

  const measureRail = useCallback(() => {
    const nav = navRef.current;
    const nodes = nodeRefs.current.filter(Boolean);
    if (!nav || nodes.length < 2) return;

    const navBox = nav.getBoundingClientRect();
    const centers = nodes.map((el) => {
      const box = el.getBoundingClientRect();
      return {
        x: box.left + box.width / 2 - navBox.left,
        y: box.top + box.height / 2 - navBox.top,
      };
    });

    const next = {
      x: centers[0].x,
      top: centers[0].y,
      height: centers[centers.length - 1].y - centers[0].y,
      offsets: centers.map((c) => c.y - centers[0].y),
    };

    setRail((prev) =>
      prev.x === next.x &&
      prev.top === next.top &&
      prev.height === next.height &&
      prev.offsets.length === next.offsets.length &&
      prev.offsets.every((v, i) => v === next.offsets[i])
        ? prev
        : next
    );
  }, []);

  // Re-measure on anything that can move the nodes: the breakpoint switch
  // (md: bumps both the label size and the row gap), a window resize, a late
  // web-font swap, and each step through the sections.
  useLayoutEffect(() => {
    measureRail();

    const nav = navRef.current;
    if (!nav) return;

    const observer = new ResizeObserver(measureRail);
    observer.observe(nav);
    nodeRefs.current.forEach((el) => el && observer.observe(el));

    window.addEventListener("resize", measureRail);
    if (document.fonts?.ready) document.fonts.ready.then(measureRail);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureRail);
    };
  }, [measureRail]);

  useLayoutEffect(measureRail, [measureRail, activeSection]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.intersectionRatio > 0.6),
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // in controlled mode the parent's scroll track sets the index; track the
  // direction so the card keeps animating in from the correct side
  const prevControlled = useRef(controlledSection);
  useEffect(() => {
    if (!isControlled) return;
    if (controlledSection !== prevControlled.current) {
      setDirection(controlledSection > prevControlled.current ? 1 : -1);
      setRailSpan(Math.abs(controlledSection - prevControlled.current) || 1);
      prevControlled.current = controlledSection;
    }
  }, [isControlled, controlledSection]);

  useEffect(() => {
    if (isControlled) return; // parent owns scrolling
    const onWheel = (e) => {
      if (!inView) return;
      const goingDown = e.deltaY > 0;
      const atEnd = activeSection === ABOUT_SECTIONS.length - 1;
      const atStart = activeSection === 0;

      if (lockRef.current) {
        if (!((goingDown && atEnd) || (!goingDown && atStart))) e.preventDefault();
        return;
      }
      if (Math.abs(e.deltaY) < 6) return;

      if (goingDown && !atEnd) {
        e.preventDefault();
        goTo(activeSection + 1);
      } else if (!goingDown && !atStart) {
        e.preventDefault();
        goTo(activeSection - 1);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [inView, activeSection, goTo, isControlled]);

  useEffect(() => {
    if (isControlled) return; // parent owns scrolling
    const onTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (!inView || touchStartY.current == null) return;
      const dy = touchStartY.current - e.touches[0].clientY;
      const goingDown = dy > 0;
      const atEnd = activeSection === ABOUT_SECTIONS.length - 1;
      const atStart = activeSection === 0;

      if (lockRef.current) {
        if (!((goingDown && atEnd) || (!goingDown && atStart))) e.preventDefault();
        return;
      }
      if (Math.abs(dy) < 45) return;

      if (goingDown && !atEnd) {
        e.preventDefault();
        goTo(activeSection + 1);
        touchStartY.current = e.touches[0].clientY;
      } else if (!goingDown && !atStart) {
        e.preventDefault();
        goTo(activeSection - 1);
        touchStartY.current = e.touches[0].clientY;
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [inView, activeSection, goTo, isControlled]);

  useEffect(() => {
    if (isControlled) return; // parent owns scrolling
    const onKeyDown = (e) => {
      if (!inView) return;
      if ((e.key === "ArrowDown" || e.key === "PageDown") && activeSection < ABOUT_SECTIONS.length - 1) {
        e.preventDefault();
        goTo(activeSection + 1);
      }
      if ((e.key === "ArrowUp" || e.key === "PageUp") && activeSection > 0) {
        e.preventDefault();
        goTo(activeSection - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inView, activeSection, goTo, isControlled]);

  const handleSelect = (index) => {
    // controlled mode: jump the page to the scroll offset that maps to this card
    if (isControlled) {
      window.dispatchEvent(new CustomEvent("tedx-about-goto", { detail: index }));
      return;
    }
    setDirection(index > activeSection ? 1 : -1);
    if (lockRef.current) return;
    lockRef.current = true;
    setRailSpan(Math.abs(index - activeSection));
    setActiveSection(index);
    window.setTimeout(() => {
      lockRef.current = false;
    }, LOCK_MS);
  };

  return (
    <section
      ref={stageRef}
      aria-label="About TEDxTIET"
      className="about-stage relative w-full h-auto min-h-screen overflow-visible overflow-x-hidden md:h-screen md:min-h-0 md:overflow-hidden font-body text-white/75"
    >
      <div className="about-inner relative z-[2] mx-auto max-w-[1440px] h-full flex flex-col items-stretch gap-6 px-6 pt-12 pb-16 md:flex-row md:items-center md:gap-24 md:pr-12 md:pt-0 md:pb-0">
        {/* ---------------- Left: sticky heading + timeline ---------------- */}
        <aside className="timeline relative w-full pb-4 md:w-[32%] md:shrink-0 md:sticky md:top-24 md:self-start md:pb-0">
          <p className="font-mono text-[11px] tracking-[0.25em] font-semibold text-tedx-red m-0">
            WHO WE ARE
          </p>
          {/* h2, not h1: this is a section of the home page, whose h1 is the hero */}
          <h2 className="font-display font-black tracking-[-0.01em] leading-[0.85] text-[clamp(2.25rem,2.6vw,3.4rem)] whitespace-nowrap text-white mt-2">
            ABOUT US
          </h2>
          <p className="hidden md:block mt-4 max-w-[30ch] text-sm leading-[1.6] text-white/60">
            From a global stage to a Patiala auditorium — the same idea,
            scaled to where you're standing.
          </p>

          <nav ref={navRef} className="relative mt-7 md:mt-12 pl-2" aria-label="About sections">
            <div
              aria-hidden="true"
              className="absolute w-0.5 -translate-x-1/2 rounded-full bg-white/15"
              style={{ left: rail.x, top: rail.top, height: rail.height }}
            />
            <div
              aria-hidden="true"
              className="timeline__rail-fill absolute w-0.5 -translate-x-1/2 rounded-full"
              style={{
                left: rail.x,
                top: rail.top,
                height: rail.offsets[activeSection] ?? 0,
                "--rail-duration": railDuration(railSpan),
              }}
            />

            <ul className="list-none m-0 p-0 flex flex-col gap-6 md:gap-9">
              {ABOUT_SECTIONS.map((section, i) => {
                const isActive = activeSection === i;
                const isDone = activeSection > i;

                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(i)}
                      aria-current={isActive ? "true" : undefined}
                      className="group flex items-center gap-4 w-full bg-transparent border-0 p-0 cursor-pointer text-left transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-[3px]"
                    >
                      <span className="relative flex items-center justify-center w-8 h-8 shrink-0">
                        {isActive && (
                          <span className="timeline__node-ring absolute inset-0 rounded-full bg-tedx-red opacity-50" />
                        )}
                        <span
                          ref={(el) => {
                            nodeRefs.current[i] = el;
                          }}
                          className={`timeline__node relative w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                            isActive
                              ? "is-active bg-tedx-red border-tedx-red"
                              : isDone
                              ? "bg-tedx-red border-tedx-red"
                              : "bg-transparent border-white/15"
                          }`}
                        />
                      </span>
                      <span>
                        <span
                          className={`block font-mono text-[10px] tracking-[0.2em] font-semibold ${
                            isActive ? "text-tedx-red" : "text-white/60"
                          }`}
                        >
                          {section.index} · {section.tag}
                        </span>
                        <span
                          className={`block font-display font-bold text-xl md:text-2xl leading-none mt-1 transition-colors duration-300 ${
                            isActive
                              ? "text-white"
                              : isDone
                              ? "text-white/75"
                              : "text-white/60 group-hover:text-white/85"
                          }`}
                        >
                          {section.title}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2 mt-10 font-mono text-[11px] tracking-[0.2em] text-white/45">
            <span className="w-1.5 h-1.5 rounded-full bg-tedx-red" />
            {String(activeSection + 1).padStart(2, "0")} / {String(ABOUT_SECTIONS.length).padStart(2, "0")}
          </div>
        </aside>

        {/* ---------------- Right: single animated content card ---------------- */}
        <main className="content-card-stage relative z-0 flex items-center w-full md:w-[68%] min-h-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.id}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {/* Editorial layout: no card, no glass. A hairline rule, an
                  oversized outlined index as structure, and one long measure.
                  The index is a real design element here rather than a blurred
                  watermark, and the counter appears once (in the rail) instead
                  of twice. */}
              <article className="relative">
                {/* Two columns, two rows. The index and the title share row 2,
                    so `items-baseline` sits "01" on the SAME line as "TED",
                    with the tag stacked directly above the title in row 1.
                    Previously the index and the tag-plus-title stack were
                    baseline-aligned as siblings, which lined "01" up with the
                    small tag and left the title dropping away below it. */}
                <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 md:gap-x-8">
                  <p className="col-start-2 row-start-1 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-tedx-red">
                    {current.tag}
                  </p>

                  <span
                    aria-hidden="true"
                    className="about-index col-start-1 row-start-2 shrink-0 font-display font-black leading-none select-none text-[clamp(56px,9vw,120px)]"
                  >
                    {current.index}
                  </span>

                  <h2 className="col-start-2 row-start-2 mt-2 min-w-0 font-display font-black tracking-[-0.015em] leading-[0.88] text-balance text-white text-[clamp(2.5rem,9vw,3.25rem)] md:text-[clamp(3rem,4.6vw,4.75rem)]">
                    {renderSectionTitle(current.title)}
                  </h2>
                </div>

                {/* red rule carries the eye from the title into the body */}
                <div className="mt-7 flex items-center gap-4">
                  <span className="h-px w-16 shrink-0 bg-tedx-red" />
                  <span className="font-mono text-[11px] tracking-[0.18em] text-white/50">
                    {current.meta}
                  </span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <p className="mt-7 max-w-[64ch] text-pretty text-[1rem] leading-[1.75] text-white/80 md:text-[1.0625rem]">
                  {current.body}
                </p>

                <p className="mt-8 font-mono text-[10px] tracking-[0.3em] text-white/35">
                  INDEPENDENTLY ORGANIZED
                </p>
              </article>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {activeSection < ABOUT_SECTIONS.length - 1 && (
        <div className="hidden md:flex flex-col items-center gap-1 absolute bottom-6 left-1/2 -translate-x-1/2 z-[3] font-mono text-[10px] tracking-[0.2em] text-white/45">
          <span>SCROLL</span>
          <span className="about-scroll-chevron" />
        </div>
      )}
    </section>
  );
}
