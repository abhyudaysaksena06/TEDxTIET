import React, { useEffect, useRef } from 'react';

import { asset } from "../lib/basePath";
const TEAM_MEMBERS = [
  { name: 'VRINDA CHHABRA', role: 'CURATION HEAD', image: asset('/ExecutiveBoard/VRINDACHHABRA.webp') },
  { name: 'DAKSH SACHDEVA', role: 'DESIGN HEAD', image: asset('/ExecutiveBoard/DAKSHSACHDEVA.webp') },
  { name: 'AANYA GARG', role: 'MARKETING HEAD', image: asset('/ExecutiveBoard/AANYAGARG.webp') },
  { name: 'ANIKET GUPTA', role: 'RELATIONS AND STRATEGY HEAD', image: asset('/ExecutiveBoard/ANIKETGUPTA.webp') },
  { name: 'POORVA PURI', role: 'CO LEAD ORGANISER', image: asset('/ExecutiveBoard/POORVAPURI.webp') },
  { name: 'ROHAN SHARMA', role: 'Lead Organizer', image: asset('/ExecutiveBoard/ROHANSHARMA.webp') },
  { name: 'SHARDOOL', role: 'CO LEAD ORGANISER', image: asset('/ExecutiveBoard/SHRADOOL.webp') },
  { name: 'SANYA RAJPUT', role: 'EVENTS AND OUTREACH HEAD', image: asset('/ExecutiveBoard/SANYARAJPUT.webp') },
  { name: 'SURYA PRATAP SINGH', role: 'OPERATIONS AND MEDIA HEAD', image: asset('/ExecutiveBoard/SURYAPRATAPSINGH.webp') },
  { name: 'DISHA VERMA', role: 'EXPERIENCE HEAD', image: asset('/ExecutiveBoard/DISHAVERMA.webp') },
];

const TeamMatrix = () => {
  const containerRef = useRef(null);
  const itemsRef = useRef([]);
  const requestRef = useRef(null);
  const progressRef = useRef(0);
  const hoveredIndexRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const widthsRef = useRef([]);
  const scalesRef = useRef([]);
  // the recentring offset is eased too — it used to snap to its new value the
  // instant the hovered panel changed, which is what made moving between two
  // photos feel like a jolt rather than a transition
  const alignRef = useRef(0);

  // Interaction Refs
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const velocityRef = useRef(0);
  const interactionTimeRef = useRef(0);

  // Fraction of one full loop advanced per frame. 0.00021 took ~80s and read
  // as frozen; 0.00072 took ~23s and moved faster than you could look at
  // anyone. This sits between them at roughly 44 seconds a pass — moving
  // clearly, slow enough to read a face as it goes by.
  const speed = 0.00038;

  useEffect(() => {
    widthsRef.current = TEAM_MEMBERS.map(() => 0);
    scalesRef.current = TEAM_MEMBERS.map(() => 1);

    const animate = () => {
      const items = itemsRef.current;
      if (!items.length || !containerRef.current) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      const containerWidth = containerRef.current.offsetWidth;
      const baseWidth = containerWidth / 9;
      const expandedWidth = baseWidth * 2.5;

      const logicalCount = 10;
      const shrinkFactor = (expandedWidth - baseWidth) / (logicalCount - 1);
      const logicalLoopWidth = widthsRef.current.reduce((a, b) => a + b, 0);

      // 1. Interpolate sizes
      TEAM_MEMBERS.forEach((_, i) => {
        const isHovered = hoveredIndexRef.current === i;
        // Apply 70% width reduction for Aniket Gupta (index 3) as requested
        const targetExpandedWidth = i === 3 ? expandedWidth * 0.7 : expandedWidth;

        const targetWidth = hoveredIndexRef.current !== null
          ? (isHovered ? targetExpandedWidth : baseWidth - shrinkFactor)
          : baseWidth;
        const targetScale = isHovered ? 1.25 : 1;

        // gentler easing on both: the old 0.12 / 0.08 settled fast enough to
        // read as a snap when the hover moved from one panel to the next
        widthsRef.current[i] = widthsRef.current[i] === 0
          ? targetWidth
          : widthsRef.current[i] + (targetWidth - widthsRef.current[i]) * 0.07;

        scalesRef.current[i] = scalesRef.current[i] + (targetScale - scalesRef.current[i]) * 0.055;
      });

      // 2. Momentum & Auto-Drift
      const now = Date.now();
      const isManual = isDraggingRef.current || (now - interactionTimeRef.current < 2000);

      if (!isDraggingRef.current) {
        // Apply momentum friction
        progressRef.current += velocityRef.current / (logicalLoopWidth || 1);
        velocityRef.current *= 0.95;

        // Auto-drift if not recently interacted
        if (!isManual) {
          progressRef.current = (progressRef.current + speed) % 1;
        }
      }

      // 3. Alignment Shift — eased toward its target, never set outright
      let targetAlign = 0;
      if (hoveredIndexRef.current !== null) {
        const h = hoveredIndexRef.current;
        const targetLogicalCenter = (h + 0.5) * baseWidth;

        let cumulativeBefore = 0;
        for (let j = 0; j < h; j++) cumulativeBefore += widthsRef.current[j];
        const currentLogicalCenter = cumulativeBefore + (widthsRef.current[h] / 2);

        targetAlign = targetLogicalCenter - currentLogicalCenter;
      }
      alignRef.current += (targetAlign - alignRef.current) * 0.07;
      const alignmentShift = alignRef.current;

      const totalPhysicalLength = logicalLoopWidth * 2;
      const globalOffset = progressRef.current * logicalLoopWidth;

      // 4. Position items
      let cumulativeX = 0;
      items.forEach((item, i) => {
        if (!item) return;
        const logicalIndex = i % 10;

        let xPos = (cumulativeX + (widthsRef.current[logicalIndex] / 2) + globalOffset + alignmentShift) % totalPhysicalLength;

        if (xPos > containerWidth + widthsRef.current[logicalIndex]) {
          xPos -= totalPhysicalLength;
        } else if (xPos < -widthsRef.current[logicalIndex] * 2) {
          xPos += totalPhysicalLength;
        }

        const screenCenterX = containerWidth / 2;
        const distFromCenter = Math.abs(xPos - screenCenterX);
        const threshold = containerWidth / 1.5;
        const heightScale = Math.max(0.4, 1 - (distFromCenter / threshold) * 0.8);

        item.style.width = `${widthsRef.current[logicalIndex]}px`;
        item.style.transform = `translateX(${xPos}px) translate(-50%, -50%)`;
        item.style.height = `${heightScale * 100}%`;
        item.style.zIndex = hoveredIndexRef.current === logicalIndex ? 1000 : Math.round(heightScale * 100);
        item.style.opacity = Math.max(0.15, heightScale);

        const img = item.querySelector('.bg-image');
        if (img) img.style.transform = `scale(${scalesRef.current[logicalIndex]})`;

        cumulativeX += widthsRef.current[logicalIndex];
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    velocityRef.current = 0;
    interactionTimeRef.current = Date.now();
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velocityRef.current = deltaX;

    const logicalLoopWidth = widthsRef.current.reduce((a, b) => a + b, 0);
    progressRef.current = (progressRef.current + deltaX / logicalLoopWidth) % 1;
    interactionTimeRef.current = Date.now();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    const logicalLoopWidth = widthsRef.current.reduce((a, b) => a + b, 0);
    progressRef.current = (progressRef.current - e.deltaX / logicalLoopWidth) % 1;
    interactionTimeRef.current = Date.now();
    velocityRef.current = -e.deltaX * 0.5;
  };

  const handleMouseEnter = (i) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      hoveredIndexRef.current = i % 10;
    }, 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoveredIndexRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-[1500px] parabolic-grid mt-[-30px] mb-32 relative h-[70vh] mx-auto overflow-hidden select-none cursor-grab active:cursor-grabbing`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { handleMouseUp(); handleMouseLeave(); }}
      onWheel={handleWheel}
    >
      {[...TEAM_MEMBERS, ...TEAM_MEMBERS].map((member, i) => (
        <div
          key={`${member.name}-${i}`}
          ref={(el) => (itemsRef.current[i] = el)}
          className="team-panel overflow-hidden pointer-events-none grayscale absolute top-1/2 left-0 px-[5px] transition-[filter] duration-500 hover:grayscale-0 group"
          style={{ height: '100%' }}
        >
          {/* Hitbox inside panel */}
          <div
            className="absolute inset-y-0 left-[10%] w-[80%] z-50 pointer-events-auto"
            onMouseEnter={() => handleMouseEnter(i)}
          />

          <div
            className="bg-image absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out"
            style={{ backgroundImage: `url(${member.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="panel-content absolute bottom-8 left-8 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <p className="text-white text-xl md:text-2xl uppercase tracking-[0.02em] leading-tight">{member.name}</p>
            <p className="text-primary font-label text-[10px] tracking-[0.3em] uppercase mt-1 accent-title">{member.role}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamMatrix;
