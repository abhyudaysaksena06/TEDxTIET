import React, { useEffect, useRef, useState } from "react";
import "./infiniteGallery.css";

// Pool of all gallery images
const allImages = Array.from({ length: 35 }, (_, i) => `/Gallery/img${i + 1}.jpeg`);

// Helper to shuffle an array
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function InfiniteGallery() {
  const containerRef = useRef(null);
  const touchStartRef = useRef({ x: null, y: null });
  const activeColRef = useRef(0);

  const [isMobile, setIsMobile] = useState(false);
  const [offsets, setOffsets] = useState([0, 0, 0, 0]);
  const [columnData, setColumnData] = useState([]);

  // Detect screen size and initialize column data
  useEffect(() => {
    const checkSize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      
      // Create unique shuffled sets for each column to avoid repetition
      const colCount = mobile ? 1 : 4;
      const newColData = Array.from({ length: colCount }, () => shuffleArray(allImages));
      setColumnData(newColData);
      setOffsets(Array.from({ length: colCount }, () => 0));
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Prevent page scroll while gallery is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Layout constants
  const imageHeight = 288; // 18rem equivalent
  const gap = 32; // 2rem equivalent
  const totalItemHeight = imageHeight + gap;

  // Sync offsets when switching mobile/desktop
  useEffect(() => {
    setOffsets(Array.from({ length: columnData.length }, () => 0));
  }, [columnData.length]);

  // --- Active column helpers ---
  const getActiveColumnFromX = (x) => {
    const el = containerRef.current;
    if (!el) return activeColRef.current;
    const rect = el.getBoundingClientRect();
    const relX = Math.min(Math.max(x - rect.left, 0), rect.width - 1);
    const widthPerCol = rect.width / columnData.length;
    return Math.min(
      columnData.length - 1,
      Math.max(0, Math.floor(relX / widthPerCol))
    );
  };

  const applyDelta = (deltaY) => {
    setOffsets((prev) =>
      prev.map((off, i) => {
        const dist = Math.abs(i - activeColRef.current);
        const factor = isMobile ? 1 : Math.max(0.3, 1 - 0.4 * dist);
        return off + deltaY * factor;
      })
    );
  };

  // --- Event handlers ---
  const onWheel = (event) => {
    event.preventDefault();
    activeColRef.current = getActiveColumnFromX(event.clientX);
    applyDelta(event.deltaY);
  };

  const onMouseMove = (event) => {
    if (!isMobile) {
      activeColRef.current = getActiveColumnFromX(event.clientX);
    }
  };

  const onTouchStart = (event) => {
    const t = event.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
    activeColRef.current = getActiveColumnFromX(t.clientX);
  };

  const onTouchMove = (event) => {
    const t = event.touches[0];
    const start = touchStartRef.current;
    if (!start || start.y == null) return;
    const deltaY = start.y - t.clientY;
    activeColRef.current = getActiveColumnFromX(t.clientX);
    applyDelta(deltaY);
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = () => {
    touchStartRef.current = { x: null, y: null };
  };

  // --- Tilt + gap correction ---
  const tiltDeg = isMobile ? 0 : -2.5;
  const tiltRad = (Math.PI / 180) * Math.abs(tiltDeg);
  const desiredGap = 24; 
  const adjustedGap = desiredGap / Math.cos(tiltRad);

  if (columnData.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="gallery-container"
      onWheel={onWheel}
      onMouseMove={onMouseMove}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: "none" }}
    >
      <div
        className="gallery-content"
        style={{
          gap: `${adjustedGap}px`,
          transform: `rotate(${tiltDeg}deg)`,
          transformOrigin: "center center",
        }}
      >
        {columnData.map((colImgs, colIdx) => {
          // We double the array for seamless infinite looping
          const displayImgs = [...colImgs, ...colImgs];
          const columnHeight = colImgs.length * totalItemHeight;
          const raw = offsets[colIdx];
          const offset = ((raw % columnHeight) + columnHeight) % columnHeight;

          return (
            <div key={colIdx} className="gallery-column">
              <div
                className="gallery-column-content"
                style={{ transform: `translateY(${-offset}px)` }}
              >
                {displayImgs.map((src, i) => (
                  <div
                    key={i}
                    className="gallery-item"
                  >
                    <img
                      src={src}
                      alt=""
                      className="gallery-image"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
