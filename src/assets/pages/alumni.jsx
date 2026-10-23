import Image9 from '../gridimages/Image9.webp';
import Image7 from '../gridimages/Image7.webp';
import Image10 from '../gridimages/Image10.webp';
import Image8 from '../gridimages/Image8.webp';
import Image2 from '../gridimages/Image2.webp';
import Image6 from '../gridimages/Image6.webp';
import Image3 from '../gridimages/Image3.webp';
import Image5 from '../gridimages/Image5.webp';
import Image1 from '../gridimages/Image1.webp';
import Image4 from '../gridimages/Image4.webp';

/**
 * Alumni.
 *
 * Rebuilt in the site's own language. The ported version arrived with its own
 * identity — Playfair Display and DM Sans pulled in through an injected
 * <style> tag, rounded cards, a red glow on hover — none of which appears
 * anywhere else here. It now uses the same vocabulary as the team page and the
 * footer: black ground, Anton display, IBM Plex Mono micro-type, hairline
 * rules, square corners, and the ink wipe on hover.
 *
 * The page title lives in the navbar, so the h1 here is sr-only.
 */

const RED = '#eb0028';
const RULE = '#232323';
const MUTED = '#8a8a8a';

const allAlumni = [
  { name: 'Japneet Khanna', url: 'https://www.linkedin.com/in/japneet-khanna-069919288/', img: Image9 },
  { name: 'Pranjal Batish', url: 'https://www.linkedin.com/in/pranjalbatish/', img: Image7 },
  { name: 'Tanay Mukker', url: 'https://www.linkedin.com/in/tanay-mukker/', img: Image10 },
  { name: 'Aman Aasees Kaur', url: 'https://www.linkedin.com/in/aman-aasees-kaur/', img: Image8 },
  { name: 'Shambhavi Sharma', url: 'https://www.linkedin.com/in/shambhavi-sharma-42b04b258/', img: Image2 },
  { name: 'Amit Katoch', url: 'https://www.linkedin.com/in/amit-katoch-5o5/', img: Image6 },
  { name: 'Raghav Jindal', url: 'https://www.linkedin.com/in/raghavjindal17/', img: Image3 },
  { name: 'Rohit Arora', url: 'https://www.linkedin.com/in/rohit-arora-93415024a/', img: Image5 },
  { name: 'Priyam Ganguli', url: 'https://www.linkedin.com/in/priyam-ganguli/', img: Image1 },
  { name: 'Bhavya Arora', url: 'https://www.linkedin.com/in/bhavya-arora-7a9381266/', img: Image4 },
];

function AlumniCard({ name, url, img, index }) {
  return (
    <li className="group relative">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${name} on LinkedIn`}
        className="block"
      >
        <div
          className="relative overflow-hidden border transition-colors duration-500"
          style={{ aspectRatio: '3 / 4', borderColor: RULE, backgroundColor: '#0d0d0d' }}
        >
          <img
            src={img}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover opacity-85 grayscale transition-[filter,opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0"
          />

          {/* grade the foot of the frame so the index stays readable */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0) 45%)' }}
          />

          <span
            aria-hidden="true"
            className="absolute bottom-2 left-3 font-mono text-[10px] tabular-nums"
            style={{ color: MUTED }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* the red rule wipes in from the left, as the footer and menu do */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
            style={{ backgroundColor: RED }}
          />
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="font-['Anton'] text-base uppercase leading-tight tracking-[0.02em] text-white transition-colors duration-300 group-hover:text-[#eb0028] md:text-lg">
            {name}
          </p>
          <span
            aria-hidden="true"
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            style={{ color: MUTED }}
          >
            in ↗
          </span>
        </div>
      </a>
    </li>
  );
}

export default function Alumni() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* the same faint grid the footer, impact and gallery sit on */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: 'clamp(70px, 8vw, 120px) clamp(70px, 8vw, 120px)',
        }}
      />

      <main className="relative mx-auto w-full max-w-[1440px] px-5 pb-28 md:px-10">
        {/* the navbar carries the page name — see the note in Navbar.tsx */}
        <h1 className="sr-only">Alumni</h1>

        <div className="grid gap-5 md:grid-cols-12 md:items-end md:gap-8">
          <p
            className="max-w-prose text-pretty font-body text-sm leading-relaxed md:col-span-7 md:text-base"
            style={{ color: '#c9c7c2' }}
          >
            The people who built TEDxTIET before this team did — and where they
            went next.
          </p>

          <p
            className="font-mono text-[10px] uppercase tracking-[0.2em] md:col-span-5 md:text-right md:text-[11px]"
            style={{ color: MUTED }}
          >
            {allAlumni.length} past organisers
          </p>
        </div>

        <ul
          className="mt-10 grid list-none grid-cols-2 gap-x-4 gap-y-8 border-t pt-8 sm:grid-cols-3 md:mt-14 md:grid-cols-4 md:gap-x-6 lg:grid-cols-5"
          style={{ borderColor: RULE }}
        >
          {allAlumni.map((a, i) => (
            <AlumniCard key={a.url} {...a} index={i} />
          ))}
        </ul>

        <div
          className="mt-16 flex flex-col gap-3 border-t px-0 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] sm:flex-row sm:items-center sm:justify-between md:mt-24"
          style={{ borderColor: RULE, color: MUTED }}
        >
          <p>Organised TEDxTIET before?</p>
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
