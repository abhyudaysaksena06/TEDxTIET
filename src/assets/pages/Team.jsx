import React, { useState, useEffect } from 'react';
import TeamMatrix from './TeamMatrix';

export const TEAM_MEMBERS = [
  { name: 'VRINDA CHHABRA', role: 'CURATION HEAD', image: '/ExecutiveBoard/VRINDACHHABRA.webp' },
  { name: 'DAKSH SACHDEVA', role: 'DESIGN HEAD', image: '/ExecutiveBoard/DAKSHSACHDEVA.webp' },
  { name: 'AANYA GARG', role: 'MARKETING HEAD', image: '/ExecutiveBoard/AANYAGARG.webp' },
  { name: 'ANIKET GUPTA', role: 'RELATIONS AND STRATEGY HEAD', image: '/ExecutiveBoard/ANIKETGUPTA.webp' },
  { name: 'POORVA PURI', role: 'CO LEAD ORGANISER', image: '/ExecutiveBoard/POORVAPURI.webp' },
  { name: 'ROHAN SHARMA', role: 'Lead Organizer', image: '/ExecutiveBoard/ROHANSHARMA.webp' },
  { name: 'SHARDOOL', role: 'CO LEAD ORGANISER', image: '/ExecutiveBoard/SHRADOOL.webp' },
  { name: 'SANYA RAJPUT', role: 'EVENTS AND OUTREACH HEAD', image: '/ExecutiveBoard/SANYARAJPUT.webp' },
  { name: 'SURYA PRATAP SINGH', role: 'OPERATIONS AND MEDIA HEAD', image: '/ExecutiveBoard/SURYAPRATAPSINGH.webp' },
  { name: 'DISHA VERMA', role: 'EXPERIENCE HEAD', image: '/ExecutiveBoard/DISHAVERMA.webp' },
];

const BOARD_LEFT = [
  { name: "ROHAN SHARMA", role: "Lead Organizer", image: "/ExecutiveBoard/ROHANSHARMA.webp", side: 'left' },
  { name: "SHARDOOL", role: "CO LEAD ORGANISER", image: "/ExecutiveBoard/SHRADOOL.webp", side: 'left' },
  { name: "SANYA RAJPUT", role: "EVENTS AND OUTREACH HEAD", image: "/ExecutiveBoard/SANYARAJPUT.webp", side: 'left' },
  { name: "SURYA PRATAP SINGH", role: "OPERATIONS AND MEDIA HEAD", image: "/ExecutiveBoard/SURYAPRATAPSINGH.webp", side: 'left' },
  { name: "DISHA VERMA", role: "EXPERIENCE HEAD", image: "/ExecutiveBoard/DISHAVERMA.webp", side: 'left' },
];

const BOARD_RIGHT = [
  { name: "POORVA PURI", role: "CO LEAD ORGANISER", image: "/ExecutiveBoard/POORVAPURI.webp", side: 'right' },
  { name: "ANIKET GUPTA", role: "RELATIONS AND STRATEGY HEAD", image: "/ExecutiveBoard/ANIKETGUPTA.webp", side: 'right' },
  { name: "AANYA GARG", role: "MARKETING HEAD", image: "/ExecutiveBoard/AANYAGARG.webp", side: 'right' },
  { name: "DAKSH SACHDEVA", role: "DESIGN HEAD", image: "/ExecutiveBoard/DAKSHSACHDEVA.webp", side: 'right' },
  { name: "VRINDA CHHABRA", role: "CURATION HEAD", image: "/ExecutiveBoard/VRINDACHHABRA.webp", side: 'right' },
];

const COMMITTEE_LEFT = [
  { name: "RAJAT VERMA", side: 'left', image: "/ExecutiveCommittee/RAJAT.webp" },
  { name: "Doreen Sidhu", side: 'left', image: "/ExecutiveCommittee/DOREEN.webp" },
  { name: "Raghav Garg", side: 'left', image: "/ExecutiveCommittee/RAGHAV.webp" },
  { name: "Kuwar Kalra", side: 'left', image: "/ExecutiveCommittee/KUWAR.webp" },
  { name: "Shreya Sarin", side: 'left', image: "/ExecutiveCommittee/SHREYA.webp" },
  { name: "Rhytham Gupta", side: 'left', image: "/ExecutiveCommittee/RHYTHAM.webp" },
  { name: "Arav Panchhi Chaturvedi", side: 'left', image: "/ExecutiveCommittee/AARAV.webp" },
  { name: "Hardaksh Sabharwal", side: 'left', image: "/ExecutiveCommittee/HARDAKSH.webp" },
  { name: "Khusboo Gaur", side: 'left', image: "/ExecutiveCommittee/KHUSBOO.webp" },
  { name: "Nishtha Sidana", side: 'left', image: "/ExecutiveCommittee/NISHTHA.webp" },
  { name: "Aadya Verma", side: 'left', image: "/ExecutiveCommittee/AADYA.webp" },
  { name: "Raghu Raja", side: 'left', image: "/ExecutiveCommittee/RAGHU.webp" },
  { name: "Jatin Bansal", side: 'left', image: "/ExecutiveCommittee/JATIN.webp" },
  { name: "Twisha Jain", side: 'left', image: "/ExecutiveCommittee/TWISHA.webp" },
];

const COMMITTEE_RIGHT = [
  { name: "KANAN MAHAJAN", side: 'right', image: "/ExecutiveCommittee/KANAN.webp" },
  { name: "Samaira Nayyar", side: 'right', image: "/ExecutiveCommittee/SAMAIRA.webp" },
  { name: "Utkarsh Uppal", side: 'right', image: "/ExecutiveCommittee/UTKARSH.webp" },
  { name: "Hardik Jain", side: 'right', image: "/ExecutiveCommittee/HARDIK.webp" },
  { name: "Bhavyadeep Singh", side: 'right', image: "/ExecutiveCommittee/BHAVYA.webp" },
  { name: "Ridhi Batra", side: 'right', image: "/ExecutiveCommittee/RIDHI.webp" },
  { name: "Diya Gupta", side: 'right', image: "/ExecutiveCommittee/DIYA.webp" },
  { name: "Waris Mittal", side: 'right', image: "/ExecutiveCommittee/WARIS.webp" },
  { name: "Kartik Goyal", side: 'right', image: "/ExecutiveCommittee/KARTIK.webp" },
  { name: "Ayush Mathur", side: 'right', image: "/ExecutiveCommittee/AYUSH.webp" },
  { name: "Shashank Jain", side: 'right', image: "/ExecutiveCommittee/SHASHANK.webp" },
  { name: "Aaditi Singh", side: 'right', image: "/ExecutiveCommittee/AADITI.webp" },
  { name: "Nakul Garg", side: 'right', image: "/ExecutiveCommittee/NAKUL.webp" },
  { name: "Harkirat Singh", side: 'right', image: "/ExecutiveCommittee/HARKIRAT.webp" },
];

const MemberCard = ({ name, role, image }) => (
  <div className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800 transition-all hover:border-[#eb0028]/50 group">
    <div className="aspect-[3/4] overflow-hidden relative">
      <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
      <div className="absolute bottom-4 left-4 right-4">
        <p className="text-white font-bold text-lg leading-tight uppercase tracking-tight">{name}</p>
        {role && <p className="text-[#eb0028] text-[10px] font-bold uppercase tracking-widest mt-1">{role}</p>}
      </div>
    </div>
  </div>
);

const ExecutiveBoardItem = ({ name, role, image, side }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageTop, setImageTop] = useState(0);
  const nameRef = React.useRef(null);
  const timeoutRef = React.useRef(null);

  const onEnter = () => {
    if (nameRef.current) {
      const top = nameRef.current.offsetTop + nameRef.current.offsetHeight / 2;
      setImageTop(top);
    }
    timeoutRef.current = setTimeout(() => setIsHovered(true), 100);
  };

  const onLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(false);
  };

  return (
    <div className="md:block hidden">
      <div
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className="group flex flex-col py-6 border-b border-zinc-800 hover:bg-zinc-900 transition-colors duration-300 px-4 cursor-pointer relative"
      >
        <div className="relative w-fit">
          <h3
            ref={nameRef}
            className="font-headline tracking-[0.02em] uppercase text-white text-5xl md:text-6xl group-hover:text-[#eb0028] transition-colors z-10"
          >
            {name}
          </h3>

          {isHovered && (
            <div
              className={`absolute w-64 h-80 bg-[#eb0028] rounded-[10px] overflow-hidden shadow-2xl team-pop pointer-events-none z-[100] ${side === 'left' ? 'left-full ml-10' : 'right-full mr-10'}`}
              style={{
                top: imageTop,
                transform: 'translateY(-50%)',
              }}
            >
              <div
                className="w-full h-full bg-cover bg-center transition-all duration-700"
                style={{ backgroundImage: `url(${image})` }}
              />
            </div>
          )}
        </div>
        <span className="font-body text-xs uppercase tracking-widest mt-2 text-zinc-500 group-hover:text-[#eb0028] transition-colors z-10">{role}</span>
      </div>
    </div>
  );
};

const ExecutiveBoard = () => {
  return (
    <div className="mb-16 relative">
      <h2 className="font-headline text-5xl md:text-7xl tracking-[0.015em] uppercase mb-8 md:mb-12 text-white px-4 md:px-0">
        Executive <span className="text-[#eb0028]">Board</span>
      </h2>
      
      {/* Mobile Card Grid */}
      <div className="grid grid-cols-2 gap-4 px-4 md:hidden">
        {[...BOARD_LEFT, ...BOARD_RIGHT].map((m, idx) => (
          <MemberCard key={idx} {...m} />
        ))}
      </div>

      {/* Desktop List View */}
      <section className="hidden md:grid grid-cols-2 gap-x-24 relative min-h-[500px] px-16">
        <div className="flex flex-col relative">
          {BOARD_LEFT.map((m, idx) => (
            <ExecutiveBoardItem key={idx} {...m} />
          ))}
        </div>
        <div className="flex flex-col relative">
          {BOARD_RIGHT.map((m, idx) => (
            <ExecutiveBoardItem key={idx} {...m} />
          ))}
        </div>
      </section>
    </div>
  );
};

const ExecutiveCommitteeItem = ({ name, image, side }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageTop, setImageTop] = useState(0);
  const nameRef = React.useRef(null);
  const timeoutRef = React.useRef(null);

  const onEnter = () => {
    if (nameRef.current) {
      const top = nameRef.current.offsetTop + nameRef.current.offsetHeight / 2;
      setImageTop(top);
    }
    timeoutRef.current = setTimeout(() => setIsHovered(true), 100);
  };

  const onLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(false);
  };

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group flex flex-col py-8 border-b border-zinc-800 hover:bg-zinc-900 transition-colors duration-300 px-4 cursor-pointer relative"
    >
      <div className="relative w-fit">
        <h2
          ref={nameRef}
          className="font-headline text-4xl md:text-5xl tracking-[0.02em] uppercase text-white group-hover:text-[#eb0028] transition-colors z-10"
        >
          {name}
        </h2>

        {isHovered && (
          <div
            className={`absolute w-64 h-80 bg-[#eb0028] rounded-[10px] overflow-hidden shadow-2xl team-pop pointer-events-none z-[100] ${side === 'left' ? 'left-full ml-10' : 'right-full mr-10'}`}
            style={{
              top: imageTop,
              transform: 'translateY(-50%)',
            }}
          >
            <div
              className="w-full h-full bg-cover bg-center transition-all duration-700"
              style={{ backgroundImage: `url(${image})` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ExecutiveCommittee = () => {
  return (
    <div className="mt-24 md:mt-32 mb-16">
      <h2 className="font-headline text-5xl md:text-7xl tracking-[0.015em] uppercase mb-8 md:mb-12 text-white px-4 md:px-0">
        Executive <span className="text-[#eb0028]">Committee</span>
      </h2>

      {/* Mobile Card Grid */}
      <div className="grid grid-cols-2 gap-4 px-4 md:hidden">
        {[...COMMITTEE_LEFT, ...COMMITTEE_RIGHT].map((m, idx) => (
          <MemberCard key={idx} {...m} />
        ))}
      </div>

      {/* Desktop List View */}
      <section className="hidden md:grid grid-cols-2 gap-x-24 px-16 relative">
        <div className="flex flex-col">
          {COMMITTEE_LEFT.map((m, idx) => (
            <ExecutiveCommitteeItem key={idx} {...m} />
          ))}
        </div>
        <div className="flex flex-col md:mt-[4.5rem]">
          {COMMITTEE_RIGHT.map((m, idx) => (
            <ExecutiveCommitteeItem key={idx} {...m} />
          ))}
        </div>
      </section>
    </div>
  );
};

const Team = () => {
  // brief fade-in only; the full-screen splash that used to gate the page
  // duplicated the navbar's TEAM title and blocked content for a second
  const [isIntroActive, setIsIntroActive] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setIsIntroActive(false), 350);
    return () => clearTimeout(timer);
  }, []);

  // NOTE: there used to be a second effect here that fired
  // window.scrollTo({ behavior: 'smooth' }) once the intro cleared. It ran
  // after the overlay had already gone, so it yanked the page back up from
  // under anyone who had started scrolling. The scrollTo(0,0) above is enough.

  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative">

      <main className={`flex-1 w-full max-w-[1440px] mx-auto px-0 md:px-12 pt-8 pb-24 relative transition-opacity duration-1000 ${isIntroActive ? 'opacity-0' : 'opacity-100'}`}>
        {/* The visible page name is the one in the navbar. This keeps the
            document's level-1 heading for assistive tech and search engines
            without printing TEAM twice down the screen. */}
        <h1 className="sr-only">Our Team</h1>
        
        {/* Parabolic Matrix for Desktop */}
        <div className="hidden md:block">
          <TeamMatrix />
        </div>

        <ExecutiveBoard />
        <ExecutiveCommittee />

        {/* Decorative Elements */}
        <div className="fixed top-1/4 right-0 pointer-events-none opacity-[0.03] select-none hidden md:block">
          <span className="font-headline text-[30rem] font-black leading-none -rotate-90 block">TEDxTIET</span>
        </div>
      </main>
    </div>
  );
};

export default Team;
