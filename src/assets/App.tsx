import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import ScrollLogo from './components/Stage/ScrollLogo';
import ScreenOutline from './components/ScreenOutline';
import ReelOnScreen from './components/Reel/ReelOnScreen';
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

/** Ported pages sit under the fixed navbar, so they need clearance at the top. */
function PageShell({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen bg-black pt-20">{children}</div>;
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
    // phones fit the photo to the WIDTH so it isn't squeezed into a tall
    // viewport; wider screens cover the box as before
    const isPhone = useIsPhone();
    const stage = useStageRect(stageHostRef, HERO_IMAGE_ASPECT, isPhone ? 'width' : 'cover');

    // The speaker reel is opt-in: scrolling the untouched hero just moves down
    // the page. Clicking the hero flips it to "ARCHIVE OF VOICES" and opens the
    // long scroll track that plays the reel.
    const [archiveOpen, setArchiveOpen] = useState(false);

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
            <div
                ref={scrollRootRef}
                className="relative bg-black"
                style={{ height: archiveOpen ? '700vh' : '100vh' }}
            >
                <div className="sticky top-0 h-screen w-screen bg-black overflow-hidden text-white font-['Anton'] selection:bg-[#eb0028] selection:text-white">
                    <section className="w-full h-full pt-6">
                        {/* stands in for the fixed navbar so the stage keeps its position */}
                        <div aria-hidden="true" className="h-8" />

                        <div
                            ref={stageHostRef}
                            className="relative h-[calc(100dvh-120px)] w-full"
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

                                <ScrollLogo
                                    scrollRootRef={scrollRootRef}
                                    active={archiveOpen}
                                    scaleK={stage.k}
                                    onSelect={() => {
                                        // collapsing a 700vh track from halfway down would
                                        // yank the page, so close from the top
                                        if (archiveOpen) window.scrollTo({ top: 0 });
                                        setArchiveOpen((open) => !open);
                                    }}
                                />
                                {archiveOpen && <ReelOnScreen scrollRootRef={scrollRootRef} />}
                            </div>

                            {/* Caption rail sits on the viewport, not the stage, so it keeps
                                its margins on tall phones. Stacks below sm to stop the
                                tagline and the year overlapping. */}
                            <motion.div
                                className="absolute bottom-6 sm:bottom-12 left-0 right-0 z-20 flex flex-col items-start gap-2 px-5 sm:px-10 md:px-14 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8, duration: 1 }}
                            >
                                <p className="max-w-[18rem] text-pretty text-sm tracking-widest sm:max-w-[350px] sm:text-xl">
                                    Exploring the boundaries of digital space and time.
                                </p>
                                <p className="text-5xl font-bold uppercase italic leading-none sm:text-6xl">
                                    2026
                                </p>
                            </motion.div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Everything past the hero rides up OVER it rather than pushing it away:
                the negative margin pulls this stack into the hero's last viewport of
                scroll, and the hero stays pinned underneath, so the panel reads as
                sliding up and stacking on top. */}
            {/* NOTE: no overflow-hidden here — it would clip AboutSection's sticky pin */}
            {/* The overlap only makes sense once the track is 700vh — against a
                dormant 100vh hero it would swallow the whole thing. */}
            <div className={`relative z-30 ${archiveOpen ? '-mt-[100vh]' : ''}`}>
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
