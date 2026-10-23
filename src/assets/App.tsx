import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import ScrollLogo from './components/Stage/ScrollLogo';
import ScreenOutline from './components/ScreenOutline';
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
const TeamPage = lazy(() => import('./pages/Team'));
const AlumniPage = lazy(() => import('./pages/alumni'));
const EventPage = lazy(() => import('./pages/Event'));
const ContactPage = lazy(() => import('./pages/ContactForm'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
import Reveal from './components/Reveal';
import { preloadHeroMedia, startBackgroundMediaLoad } from './lib/preloadMedia';
import useSmoothScroll from './hooks/useSmoothScroll';
import useStageRect from './hooks/useStageRect';
import useIsPhone from './hooks/useIsPhone';
const SphereGallery = lazy(() => import('./components/Gallery/SphereGallery'));

/**
 * Ported pages sit under the fixed navbar AND under the page title that now
 * hangs below it, so the clearance has to cover both.
 */
function PageShell({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen bg-black pt-[clamp(8rem,18vw,11rem)]">{children}</div>;
}

// how long the preloader animation needs to play out before it can be dismissed
const PRELOADER_MIN_MS = 1600;

export default function App() {
    // preloader from the source repo — shown once on first load
    const [loading, setLoading] = useState(true);
    // eases every scroll on the site; the long pinned sequences depend on it
    useSmoothScroll();

    useEffect(() => {
        let cancelled = false;

        // Hero media starts downloading with the preloader, not after it, so the
        // background and reel portraits are cached before the curtain lifts.
        // The curtain waits for whichever finishes LAST: the animation's minimum
        // runtime, or the hero fetches (themselves capped, so a slow connection
        // can't strand the user on the preloader).
        const minDisplay = new Promise((resolve) => setTimeout(resolve, PRELOADER_MIN_MS));

        Promise.all([minDisplay, preloadHeroMedia()]).then(() => {
            if (cancelled) return;
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) return <Reveal />;

    return (
        <BrowserRouter>
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
                <Route path="/speakers" element={<PageShell><SpeakersPage /></PageShell>} />
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

    // the hero only has something to pin against when it owns a full screen
    const heroPinned = !(isPhone && !archiveOpen);

    // user is on the home page now — start pulling the other pages' images
    // in the background so /gallery and /team are warm when they get there
    useEffect(() => {
        startBackgroundMediaLoad();
    }, []);

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
                                    undiscoverable. Sits inside the drawn screen
                                    at its lower right, and clears out once the
                                    archive is open — by then it has done its
                                    job. */}
                                <p
                                    aria-hidden={archiveOpen}
                                    className="pointer-events-none absolute z-20 text-right font-mono uppercase leading-snug"
                                    style={{
                                        right: '12%',
                                        // Rides the screen outline's lower
                                        // edge, which is the red line behind it.
                                        // Both numbers come from BOTTOM in
                                        // ScreenOutline.tsx rather than a fresh
                                        // reading of the photo, so the text
                                        // follows the drawn line exactly and
                                        // moves with it if those points change:
                                        // BOTTOM passes 35.8% up from the foot
                                        // of the stage under this text's right
                                        // edge. The clearance is in em so it
                                        // stays tied to the type, which is
                                        // clamped in px, not to the stage.
                                        bottom: 'calc(35.8% + 1.1em)',
                                        maxWidth: '38%',
                                        fontSize: 'clamp(5.5px, 0.58vw, 8.5px)',
                                        letterSpacing: '0.16em',
                                        color: 'rgba(255,255,255,0.42)',
                                        textShadow: '0 1px 8px rgba(0,0,0,0.9)',
                                        // BOTTOM falls 2.66deg across the span
                                        // this line of text occupies. Pivot on
                                        // the right edge, so the text stays put
                                        // where it already sits and the far end
                                        // lifts to follow the line instead of
                                        // converging into it. Anchoring the
                                        // bottom also means a second line, which
                                        // is what phones get, stacks upward and
                                        // leaves the lower edge riding the line.
                                        transform: 'rotate(2.66deg)',
                                        transformOrigin: '100% 100%',
                                        opacity: archiveOpen ? 0 : 1,
                                        transition: 'opacity 500ms ease',
                                    }}
                                >
                                    Click &amp; scroll to explore the archive of voices
                                </p>

                                <ScrollLogo
                                    scrollRootRef={scrollRootRef}
                                    active={archiveOpen}
                                    scaleK={isPhone ? 0.9 : stage.k}
                                    stageW={stage.width}
                                    stageH={stage.height}
                                    onSelect={placing ? undefined : () => {
                                        // collapsing a 700vh track from halfway down would
                                        // yank the page, so close from the top
                                        if (archiveOpen) window.scrollTo({ top: 0 });
                                        setArchiveOpen((open) => !open);
                                    }}
                                />
                                {archiveOpen && (
                                    <ReelOnScreen
                                        scrollRootRef={scrollRootRef}
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
                    height: archiveOpen ? '700vh' : heroPinned ? '100vh' : '0px',
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
