const REGISTRATION_URL = "/register";

export default function RegistrationSection() {
    return (
        // rounded top + upward shadow so it reads as a panel stacking onto the hero
        <section className="relative w-full bg-[#0d0d0d] text-white px-8 md:px-12 py-11 md:py-14 overflow-hidden rounded-t-[2rem] shadow-[0_-30px_60px_rgba(0,0,0,0.9)]">
            <div className="relative mx-auto max-w-4xl text-center">
                {/* quote glyph */}
                <div
                    className="font-serif text-5xl md:text-6xl leading-none text-white/25 mb-10 select-none"
                    aria-hidden="true"
                >
                    &rdquo;
                </div>

                <blockquote className="text-3xl md:text-5xl font-bold uppercase leading-[1.15] tracking-tight">
                    &quot;It is in your moments of decision that{" "}
                    <span className="text-[#eb0028]">your destiny is shaped</span>.&quot;
                </blockquote>

                <p className="mt-10 font-mono text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b52]">
                    &mdash; Tony Robbins
                </p>

                <a
                    href={REGISTRATION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-16 inline-flex items-center gap-3 rounded-full bg-[#eb0028] px-9 py-4 text-sm md:text-base font-bold uppercase tracking-widest text-white transition-colors duration-300 hover:bg-white hover:text-[#eb0028]"
                >
                    Register Now
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
            </div>
        </section>
    );
}
