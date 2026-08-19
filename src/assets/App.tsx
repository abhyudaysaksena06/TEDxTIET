import { useEffect, useRef, useState } from 'react';
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
import RegistrationPage from './components/Registration/RegistrationPage';
// Pages ported from TEDxTIET1/TEDxTIET26-27 (src/Components/*). Home stays ours.
import GalleryPage from './pages/infiniteGallery';
import SpeakersPage from './pages/Speaker';
import TeamPage from './pages/Team';
import AlumniPage from './pages/alumni';
import EventPage from './pages/Event';
import ContactPage from './pages/ContactForm';
import NotFoundPage from './pages/NotFound';
import Reveal from './components/Reveal';

/** Ported pages sit under the fixed navbar, so they need clearance at the top. */
function PageShell({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen bg-black pt-20">{children}</div>;
}

export default function App() {
    // preloader from the source repo — shown once on first load
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1600);
        return () => clearTimeout(timer);
    }, []);

    if (loading) return <Reveal />;

    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/register" element={<RegistrationPage />} />
                <Route path="/gallery" element={<PageShell><GalleryPage /></PageShell>} />
                <Route path="/speakers" element={<PageShell><SpeakersPage /></PageShell>} />
                <Route path="/team" element={<PageShell><TeamPage /></PageShell>} />
                <Route path="/alumni" element={<PageShell><AlumniPage /></PageShell>} />
                <Route path="/event" element={<PageShell><EventPage /></PageShell>} />
                <Route path="/contact" element={<PageShell><ContactPage /></PageShell>} />
                <Route path="*" element={<PageShell><NotFoundPage /></PageShell>} />
            </Routes>
        </BrowserRouter>
    );
}

function HomePage() {
    const scrollRootRef = useRef<HTMLDivElement>(null);

    return (
        <>
            {/* Navbar is rendered once by the router above, NOT here: `position: sticky`
                on the hero creates a stacking context, which would trap its z-index
                below every later section no matter how high it was set. */}

            {/* tall scroll track: gives the pinned viewport below room to scrub through
                the logo-move -> reel-play sequence */}
            <div ref={scrollRootRef} className="relative h-[700vh] bg-black">
                <div
                    className="sticky top-0 h-screen w-screen bg-black bg-cover bg-center overflow-hidden text-white font-['Anton'] selection:bg-[#eb0028] selection:text-white"
                    style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.35)), url('/HOME_BG.png')" }}
                >
                    <section className="w-full h-full px-8 md:px-12 pt-6">
                        {/* stands in for the fixed navbar so the stage keeps its position */}
                        <div aria-hidden="true" className="h-8" />

                        <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] relative">
                            <ScreenOutline />

                            <ScrollLogo scrollRootRef={scrollRootRef} />
                            <ReelOnScreen scrollRootRef={scrollRootRef} />

                            <motion.div
                                className="w-full flex justify-between items-center absolute bottom-12 px-2 z-20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8, duration: 1 }}
                            >
                                <p
                                    className="tracking-widest max-w-[350px]"
                                    style={{ fontSize: '23.84px', transform: 'translate(19.2px, 62.4px)' }}
                                >
                                    Exploring the boundaries of digital space and time.
                                </p>
                                <p
                                    className="font-bold uppercase italic"
                                    style={{ fontSize: '65.76px', transform: 'translate(-29.6px, 62.4px)' }}
                                >
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
            <div className="relative z-30 -mt-[100vh]">
                <RegistrationSection />

                {/* pinned: one viewport of scroll per card, so the page only moves on
                    after TED -> TEDx -> TEDxTIET have all been seen */}
                <AboutSection />

                <ImpactSection />

                <Footer />
            </div>
        </>
    );
}
