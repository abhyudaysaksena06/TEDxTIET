import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RouteTitle from './components/RouteTitle';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import ScrollLogo, { SEQ_END, LOGO_MOVE_END, REEL_END } from './components/Stage/ScrollLogo';
import { createProgressStore } from './lib/sequenceProgress';
import ScreenOutline, { OutlineCaption } from './components/ScreenOutline';
import ReelOnScreen from './components/Reel/ReelOnScreen';
import CarpetFigure, { CARPET, FIGURE_H } from './components/Stage/CarpetFigure';
import FigurePlacer, { type Placement } from './components/Stage/FigurePlacer';
import RegistrationSection from './components/RegistrationSection';
import AboutSection from './components/About/AboutSection';
import ImpactSection from './components/Impact/ImpactSection';
import Footer from './components/Footer';
const RegistrationPage = lazy(() => import('./components/Registration/RegistrationPage'));
// Pages ported from TEDxTIET1/TEDxTIET26-27 (src/Components/*). Home stays ours.
const SpeakersPage = lazy(() => import('./pages/Speaker'));
const SponsorsPage = lazy(() => import('./pages/Sponsors'));
const TeamPage = lazy(() => import('./pages/Team'));
const AlumniPage = lazy(() => import('./pages/alumni'));
const EventPage = lazy(() => import('./pages/Event'));
const ContactPage = lazy(() => import('./pages/ContactForm'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
import { preloadAllMedia } from './lib/preloadMedia';
import useSmoothScroll, { jumpTo, glideTo } from './hooks/useSmoothScroll';
import useStageRect from './hooks/useStageRect';
import useIsPhone from './hooks/useIsPhone';
const SphereGallery = lazy(() => import('./components/Gallery/SphereGallery'));

/**
 * Ported pages sit under the fixed navbar AND under the page title that now
 * hangs below it, so the clearance has to cover both.
 */
function PageShell({ children, fit = false }: { children: React.ReactNode; fit?: boolean }) {
    // phones carry the page title as a full heading under the bar, so the
    // content starts lower there; from sm up this is the old clamp exactly
    const clearance = 'pt-[10rem] sm:pt-[clamp(8rem,18vw,11rem)]';
    if (fit) {
        // Exactly one screen that does not scroll, for the "coming soon"
        // pages: there is nothing further down to scroll to. svh is the
        // height with the browser's bars showing, so a phone's toolbar cannot
        // push it past the screen.
        return (
            <div className={`flex h-[100svh] flex-col overflow-hidden bg-black ${clearance}`}>
                <div className="min-h-0 flex-1">{children}</div>
            </div>
        );
    }
    return <div className={`min-h-screen bg-black ${clearance}`}>{children}</div>;
}

// How long the preloader stays up, counted from when the page was opened:
// the 1.6s its animation needs, plus 2s so more of the site's media is in
// hand by the time the curtain lifts.
const PRELOADER_MIN_MS = 1600 + 2000;

export default function App() {
    // preloader from the source repo — shown once on first load
    const [loading, setLoading] = useState(true);
    // eases every scroll on the site; the long pinned sequences depend on it
    useSmoothScroll();

    useEffect(() => {
        let cancelled = false;

        // The preloader itself is in index.html, so it was on screen before
        // this bundle even ran; here we only decide when it lifts. Every piece
        // of media starts downloading now, in parallel, and the hairline under
        // the word follows it. The curtain waits for whichever finishes LAST:
        // the minimum time since the page opened, or the hero media (itself
        // capped, so a slow connection can't strand anyone on the preloader).
        const bar = document.querySelector<HTMLElement>('#preloader .pl-progress');
        const media = preloadAllMedia((f) => bar?.style.setProperty('--p', String(f)));
        const minDisplay = new Promise((resolve) =>
            setTimeout(resolve, Math.max(0, PRELOADER_MIN_MS - performance.now()))
        );

        Promise.all([minDisplay, media]).then(() => {
            if (cancelled) return;
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    // Lift the preloader once the site has mounted underneath it, so the
    // fade reveals a drawn page rather than an empty one.
    useEffect(() => {
        if (loading) return;
        const el = document.getElementById('preloader');
        if (!el) return;
        el.querySelector<HTMLElement>('.pl-progress')?.style.setProperty('--p', '1');
        const fade = setTimeout(() => el.classList.add('is-done'), 60);
        const remove = setTimeout(() => el.remove(), 600);
        return () => {
            clearTimeout(fade);
            clearTimeout(remove);
        };
    }, [loading]);

    if (loading) return null;

    return (
        <BrowserRouter>
            <RouteTitle />
            <Navbar />
            <Suspense
                fallback={
                    <div className="flex min-h-screen items-center justify-center bg-black">
                        <span className="font-mono text-xs tracking-[0.3em] text-white/40">
                            LOADING…
                        </span>
                    </div>
                }
            >
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                {/* kept as an alias of the home page: the carpet figure it was
                    built to try out now ships on / itself */}
                <Route path="/stage-lab" element={<Navigate to="/" replace />} />
                <Route path="/register" element={<RegistrationPage />} />
                {/* the globe owns the whole viewport here — no shell, no page scroll */}
                <Route path="/gallery" element={<SphereGallery fullPage />} />
                <Route path="/speakers" element={<PageShell fit><SpeakersPage /></PageShell>} />
                <Route path="/sponsors" element={<PageShell fit><SponsorsPage /></PageShell>} />
                <Route path="/team" element={<PageShell><TeamPage /></PageShell>} />
                <Route path="/alumni" element={<PageShell><AlumniPage /></PageShell>} />
                <Route path="/event" element={<PageShell><EventPage /></PageShell>} />
                <Route path="/contact" element={<PageShell><ContactPage /></PageShell>} />
                <Route path="*" element={<PageShell><NotFoundPage /></PageShell>} />
            </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

/** intrinsic aspect of HOME_BG.webp (1375x768) */
const HERO_IMAGE_ASPECT = 1375 / 768;

function HomePage() {
    const scrollRootRef = useRef<HTMLDivElement>(null);
    const stageHostRef = useRef<HTMLDivElement>(null);
    const stageBoxRef = useRef<HTMLDivElement>(null);
    // phones fit the photo to the WIDTH so it isn't squeezed into a tall
    // viewport; wider screens cover the box as before
    const isPhone = useIsPhone();
    const stage = useStageRect(stageHostRef, HERO_IMAGE_ASPECT, isPhone ? 'width' : 'cover');

    // The speaker reel is opt-in: scrolling the untouched hero just moves down
    // the page. Clicking the hero flips it to "ARCHIVE OF VOICES" and opens the
    // long scroll track that plays the reel.
    const [archiveOpen, setArchiveOpen] = useState(false);
    // which speaker the reel currently has on the screen's centre line, and
    // whether it is actually ON it — the figure used to appear the moment the
    // hero was clicked, standing in front of the ARCHIVE OF VOICES title with
    // no card anywhere near the middle
    const [centreSpeaker, setCentreSpeaker] = useState(0);
    const [speakerCentred, setSpeakerCentred] = useState(false);

    // ?place=1 opens the placement picker: click the stage to stand the
    // speaker somewhere and read the stage-relative coordinates back out
    const placing =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).has('place');
    const [placement, setPlacement] = useState<Placement>({
        x: CARPET.x,
        y: CARPET.y,
        h: FIGURE_H,
    });

    // The hero only has something to pin against when it owns a full screen.
    // On a phone it never pins, archive open or not: pinning it and opening the
    // 700vh track pushed every section below six screens down, so tapping the
    // hero turned the rest of the page black. There the archive is swiped.
    const heroPinned = !isPhone;

    // On phones the archive sequence is driven by swiping across the stage
    // rather than by the scroll track; see lib/sequenceProgress.
    const [archiveProgress] = useState(createProgressStore);
    useEffect(() => {
        const el = stageBoxRef.current;
        if (!isPhone || !archiveOpen || !el) {
            archiveProgress.set(0); // reopen from the start
            return;
        }
        // Vertical swipes keep scrolling the page and horizontal ones are ours,
        // but pinch-zoom must stay the browser's: people zoom in to see a
        // speaker, and plain pan-y blocked that. Once zoomed in, a sideways
        // drag has to pan the zoomed view, so the reel stands down entirely.
        const prevTouch = el.style.touchAction;
        const vv = window.visualViewport;
        const zoomedIn = () => (vv ? vv.scale > 1.01 : false);
        const setTouch = () => {
            el.style.touchAction = zoomedIn() ? 'auto' : 'pan-y pinch-zoom';
        };
        setTouch();
        vv?.addEventListener('resize', setTouch);

        // Swipe distance, laid out in three phases. The title's fades get a
        // short fixed run; at the film's own pace the first fade alone took
        // ~700px of swiping, so a swipe only dimmed the title and the film sat
        // still. The film in between moves exactly as far as the finger. It
        // stops at SEQ_END: past that the desktop track only slides the next
        // section up, which means nothing here.
        const FADE_PX = 90;
        let swipePx = 0;
        const toProgress = (s: number, travel: number) => {
            if (s <= FADE_PX) return (s / FADE_PX) * LOGO_MOVE_END;
            s -= FADE_PX;
            if (s <= travel) return LOGO_MOVE_END + (s / travel) * (REEL_END - LOGO_MOVE_END);
            s -= travel;
            return REEL_END + Math.min(1, s / FADE_PX) * (SEQ_END - REEL_END);
        };
        const nudge = (px: number) => {
            const travel = archiveProgress.reelTravelPx;
            if (!travel) return;
            // a swipe to the left rolls the film on
            swipePx = Math.min(FADE_PX + travel + FADE_PX, Math.max(0, swipePx - px));
            archiveProgress.set(toProgress(swipePx, travel));
        };

        let down = false;
        let swiped = false;
        const fingers = new Set<number>();
        let axis: null | 'x' | 'y' = null;
        let startX = 0;
        let startY = 0;
        let lastX = 0;
        let lastT = 0;
        let vel = 0; // px per ms
        let coastId = 0;

        /** a flick lets the film coast on, like a reel, and bleed off fast */
        const coastFrom = (v0: number) => {
            let v = v0;
            let prev = performance.now();
            const coast = (now: number) => {
                const dt = now - prev;
                prev = now;
                v *= Math.pow(0.992, dt);
                if (Math.abs(v) < 0.02) return;
                nudge(v * dt);
                coastId = requestAnimationFrame(coast);
            };
            coastId = requestAnimationFrame(coast);
        };

        const onDown = (e: PointerEvent) => {
            fingers.add(e.pointerId);
            cancelAnimationFrame(coastId);
            // a second finger means a pinch: drop the swipe, and swallow the
            // click it might end in
            if (fingers.size > 1 || zoomedIn()) {
                if (down) swiped = true;
                down = false;
                return;
            }
            down = true;
            swiped = false;
            axis = null;
            startX = lastX = e.clientX;
            startY = e.clientY;
            lastT = performance.now();
            vel = 0;
        };
        const onMove = (e: PointerEvent) => {
            if (!down) return;
            if (axis === null && Math.hypot(e.clientX - startX, e.clientY - startY) > 8) {
                axis = Math.abs(e.clientX - startX) > Math.abs(e.clientY - startY) ? 'x' : 'y';
            }
            if (axis !== 'x') return;
            swiped = true;
            const now = performance.now();
            const step = e.clientX - lastX;
            nudge(step); // the film moves exactly as far as the finger
            vel = step / Math.max(1, now - lastT);
            lastX = e.clientX;
            lastT = now;
        };
        const onUp = (e: PointerEvent) => {
            fingers.delete(e.pointerId);
            if (!down) return;
            down = false;
            if (!swiped) return;
            // a finger that stopped before lifting leaves the film where it is
            if (performance.now() - lastT > 90) return;
            coastFrom(vel);
        };
        // Scrolling plays the reel too, which is what people try first: a
        // swipe-only reel left a scroll moving the page instead. Only at the
        // top of the page, where the hero is all there is. The finger's travel
        // goes to the film until the reel reaches an end in that direction,
        // and from there the page scrolls as normal, so the sections below
        // never move. Finger up rolls it on, finger down rolls it back.
        //
        // The page is held from the FIRST movement, before the gesture's
        // direction is known: a browser commits to scrolling on that first
        // move and ignores any later attempt to cancel it. Two fingers are a
        // pinch and are never held.
        const maxPx = () => FADE_PX + archiveProgress.reelTravelPx + FADE_PX;
        let tActive = false;
        let tRolled = false;
        let tAxis: null | 'x' | 'y' = null;
        let tStartX = 0;
        let tStartY = 0;
        let tLastY = 0;
        let tLastT = 0;
        let tVel = 0;
        const onTouchStart = (e: TouchEvent) => {
            tActive = e.touches.length === 1 && !zoomedIn();
            tRolled = false;
            tAxis = null;
            const t = e.touches[0];
            tStartX = t.clientX;
            tStartY = tLastY = t.clientY;
            tLastT = performance.now();
            tVel = 0;
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!tActive) return;
            if (e.touches.length !== 1) {
                tActive = false;
                return;
            }
            const t = e.touches[0];
            const dy = t.clientY - tLastY;
            tLastY = t.clientY;
            if (tAxis === null && Math.hypot(t.clientX - tStartX, t.clientY - tStartY) > 8) {
                tAxis = Math.abs(t.clientY - tStartY) >= Math.abs(t.clientX - tStartX) ? 'y' : 'x';
            }
            if (tAxis === 'x') return; // a sideways swipe: the stage handler has it
            if (window.scrollY > 1) return; // the page has moved on: let it scroll
            const room = dy < 0 ? swipePx < maxPx() : dy > 0 ? swipePx > 0 : true;
            if (!room) return; // at an end of the reel: the page takes it from here
            if (e.cancelable) e.preventDefault();
            if (tAxis !== 'y') return; // still deciding: hold the page, move nothing
            cancelAnimationFrame(coastId);
            tRolled = true;
            nudge(dy); // the film moves as far as the finger
            const now = performance.now();
            tVel = dy / Math.max(1, now - tLastT);
            tLastT = now;
        };
        const onTouchEnd = () => {
            if (!tActive || !tRolled) return;
            tActive = false;
            if (performance.now() - tLastT > 90) return;
            coastFrom(tVel);
        };

        // opened from part-way down: bring the hero back to the top first,
        // since that is where scrolling plays the reel
        if (window.scrollY > 1) glideTo(0);

        // a swipe can still end in a click; it must not close the archive
        const onClickCapture = (e: MouseEvent) => {
            if (!swiped) return;
            swiped = false;
            e.stopPropagation();
            e.preventDefault();
        };

        el.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        el.addEventListener('click', onClickCapture, true);
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchEnd);
        return () => {
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchEnd);
            cancelAnimationFrame(coastId);
            vv?.removeEventListener('resize', setTouch);
            el.style.touchAction = prevTouch;
            el.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            el.removeEventListener('click', onClickCapture, true);
        };
    }, [isPhone, archiveOpen, archiveProgress]);

    // Desktop: hold the reel where it is through a zoom or a resize. The track
    // is 700vh, so zooming changes its height in CSS pixels but leaves the
    // scroll offset alone, and the same offset lands further through the reel:
    // zooming in to look at a speaker jumped the reel on by about two of them.
    // Remember the fraction from the last scroll at a settled size, and put
    // the reader back on it after the size changes.
    useEffect(() => {
        const el = scrollRootRef.current;
        if (isPhone || !archiveOpen || !el) return;
        const fraction = () => {
            const r = el.getBoundingClientRect();
            const scrollable = r.height - window.innerHeight;
            return scrollable > 0 ? Math.min(1, Math.max(0, -r.top / scrollable)) : 0;
        };
        let held = fraction();
        let settledH = window.innerHeight;
        let settledW = window.innerWidth;
        const onScroll = () => {
            // the browser can move the scroll while it relays out for the new
            // size; those are not the reader's, so they must not overwrite it
            if (window.innerHeight !== settledH || window.innerWidth !== settledW) return;
            held = fraction();
        };
        const onResize = () => {
            settledH = window.innerHeight;
            settledW = window.innerWidth;
            const top = el.getBoundingClientRect().top + window.scrollY;
            jumpTo(top + held * (el.offsetHeight - window.innerHeight));
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
        };
    }, [isPhone, archiveOpen]);


    return (
        <>
            {/* Navbar is rendered once by the router above, NOT here: `position: sticky`
                on the hero creates a stacking context, which would trap its z-index
                below every later section no matter how high it was set. */}

            {/* Scroll track. Only one viewport tall until the hero is clicked —
                so a plain scroll goes straight on down the page — then it opens to
                700vh to give the reel sequence room to play. */}
            {/* The hero is pinned for the WHOLE document: its sticky
                containing block is the page itself rather than a fixed-height
                track, so it never scrolls away and every section below rides up
                over it. On a phone with the reel dormant there is nothing to
                pin, so it just sits in flow at the photo's own height. */}
            <div
                className={`w-screen bg-black overflow-hidden text-white font-['Anton'] selection:bg-[#eb0028] selection:text-white ${
                    heroPinned ? 'sticky top-0 z-0 h-screen' : 'relative z-0'
                }`}
            >
                <section
                    className={`w-full pt-6 ${heroPinned ? 'h-full' : 'pb-28'}`}
                >
                        {/* stands in for the fixed navbar so the stage keeps its position */}
                        <div aria-hidden="true" className="h-8" />

                        {/* On a phone the photo is width-fitted, so the box is
                            sized to the photo itself (no dead space above or
                            below) and the caption follows underneath. On wider
                            screens the photo covers a full-height box. */}
                        <div
                            ref={stageHostRef}
                            className={`relative w-full ${
                                isPhone
                                    ? "aspect-[1375/768]"
                                    : "h-[calc(100dvh-120px)]"
                            }`}
                        >
                            {/* The wordmark is rendered in WebGL, so it does not exist
                                for screen readers or search engines. This carries the
                                page's real H1. */}
                            <h1 className="sr-only">
                                TEDxTIET 2026 — Ideas worth spreading
                            </h1>

                            {/* THE STAGE. Photo, drawn screen, logo and reel all live on
                                this one rect, so the outline sits on the venue screen at
                                every viewport instead of drifting as the crop changes. */}
                            <div
                                ref={stageBoxRef}
                                className="absolute overflow-hidden"
                                style={{
                                    left: stage.left,
                                    top: stage.top,
                                    width: stage.width || '100%',
                                    height: stage.height || '100%',
                                }}
                            >
                                <img
                                    src="/HOME_BG.webp"
                                    alt=""
                                    aria-hidden="true"
                                    width={1375}
                                    height={768}
                                    fetchPriority="high"
                                    className="absolute inset-0 h-full w-full object-fill"
                                />
                                {/* grade the photo down so white type stays legible */}
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-0"
                                    style={{
                                        background:
                                            'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.35))',
                                    }}
                                />

                                <ScreenOutline />

                                {/* Nothing on the page said the hero could be
                                    clicked, so the whole reel sequence was
                                    undiscoverable. Set along the screen's
                                    lower edge, inside it at the right, and
                                    gone once the archive is open — by then it
                                    has done its job. "Tap" on a phone. */}
                                <OutlineCaption
                                    text={`${isPhone ? 'Tap' : 'Click'} & scroll to explore the archive of voices`}
                                    endPct={88}
                                    fontPx={Math.min(8.5, Math.max(5.5, window.innerWidth * 0.0058))}
                                    stageW={stage.width}
                                    hidden={archiveOpen}
                                />

                                <ScrollLogo
                                    scrollRootRef={scrollRootRef}
                                    active={archiveOpen}
                                    scaleK={isPhone ? 0.9 : stage.k}
                                    stageW={stage.width}
                                    stageH={stage.height}
                                    progressStore={isPhone ? archiveProgress : null}
                                    onSelect={placing ? undefined : () => {
                                        // collapsing a 700vh track from halfway down would
                                        // yank the page, so close from the top. Phones
                                        // have no track, so they stay where they are.
                                        if (archiveOpen && !isPhone) window.scrollTo({ top: 0 });
                                        setArchiveOpen((open) => !open);
                                    }}
                                />
                                {archiveOpen && (
                                    <ReelOnScreen
                                        scrollRootRef={scrollRootRef}
                                        progressStore={isPhone ? archiveProgress : null}
                                        onCentre={(i, centred) => {
                                            setCentreSpeaker(i);
                                            setSpeakerCentred(centred);
                                        }}
                                    />
                                )}

                                <CarpetFigure
                                    index={centreSpeaker}
                                    visible={placing || (archiveOpen && speakerCentred)}
                                    carpet={placing ? placement : undefined}
                                    figureH={placing ? placement.h : undefined}
                                />

                                {placing && (
                                    <FigurePlacer
                                        stageRef={stageBoxRef}
                                        value={placement}
                                        onChange={setPlacement}
                                    />
                                )}
                            </div>

                            {/* Caption rail sits on the viewport, not the stage, so it keeps
                                its margins on tall phones. Stacks below sm to stop the
                                tagline and the year overlapping. */}
                            <motion.div
                                className="absolute inset-x-0 top-full z-20 mt-5 flex flex-col items-start gap-2 px-5 sm:inset-auto sm:bottom-12 sm:left-0 sm:right-0 sm:top-auto sm:mt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-10 md:px-14"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8, duration: 1 }}
                            >
                                <p className="max-w-[18rem] text-pretty text-sm tracking-widest sm:max-w-[350px] sm:text-xl">
                                    Exploring the boundaries of digital space and time.
                                </p>
                                <p className="w-full text-right text-3xl font-bold uppercase italic leading-none sm:w-auto sm:text-left sm:text-6xl">
                                    20<span className="text-[#eb0028]">26</span>
                                </p>
                            </motion.div>
                        </div>
                </section>
            </div>

            {/* The runway the reel measures its progress against. Pulling it up
                by one screen makes the hero's own screen of flow count as the
                runway's first screen, so the stack below starts exactly one
                screen down when the reel is closed, and 700vh down when it is
                open — all of it while the hero stays pinned underneath. */}
            <div
                ref={scrollRootRef}
                aria-hidden="true"
                className="pointer-events-none"
                style={{
                    height: archiveOpen && !isPhone ? '700vh' : heroPinned ? '100vh' : '0px',
                    marginTop: heroPinned ? '-100vh' : 0,
                }}
            />

            {/* Everything past the hero rides up OVER it rather than pushing it away:
                the negative margin pulls this stack into the hero's last viewport of
                scroll, and the hero stays pinned underneath, so the panel reads as
                sliding up and stacking on top. */}
            {/* NOTE: no overflow-hidden here — it would clip AboutSection's sticky pin */}
            {/* The overlap only makes sense once the track is 700vh — against a
                dormant 100vh hero it would swallow the whole thing. */}
            <div className="relative z-30">
                <RegistrationSection />

                {/* pinned: one viewport of scroll per card, so the page only moves on
                    after TED -> TEDx -> TEDxTIET have all been seen */}
                <AboutSection />

                {/* the sphere gallery lives on /gallery, not here */}
                <ImpactSection />

                <Footer />
            </div>
        </>
    );
}
