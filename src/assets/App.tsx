import { motion } from 'framer-motion';
import Navbar from './components/Navbar';

export default function App() {
    return (
        <div className="h-screen w-screen bg-black overflow-hidden text-white font-['Anton'] selection:bg-[#eb0028] selection:text-white">
            {/* Navbar Section */}
            <section className="w-full h-full px-8 md:px-12 pt-6">
                <Navbar />

                <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] relative">
                    <motion.h1
                        className="text-[15vw]  leading-none text-[#eb0028] tracking-tighter cursor-default"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
                    >
                        TEDxTIET
                    </motion.h1>
                    <motion.div
                        className="w-full flex justify-between items-end absolute bottom-12 px-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                    >
                        <p className="text-sm  tracking-widest max-w-[200px]">
                            Exploring the boundaries of digital space and time.
                        </p>
                        <p className="text-4xl font-bold uppercase italic">
                            2026
                        </p>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
