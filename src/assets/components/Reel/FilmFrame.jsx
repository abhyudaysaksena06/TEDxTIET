import React from 'react';
import { motion } from 'framer-motion';

/**
 * FilmFrame Component
 * Speaker Card Film Frame with:
 * - Rounded corners, clean white border, soft shadow, glass-like surface
 * - Subtle hover scale & slight red glow
 * - Speaker Photo, Speaker Name, Short Subtitle, 3-4 word topic badge
 */
export const FilmFrame = ({ data, index }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.09, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex-shrink-0 w-[225px] sm:w-[285px] md:w-[330px] aspect-[16/9] bg-gradient-to-br from-[#18181B]/90 via-black/95 to-[#09090B] rounded-xl border border-white/20 hover:border-[#EB0028]/80 shadow-[0_10px_25px_rgba(0,0,0,0.8)] hover:shadow-[0_18px_45px_rgba(235,0,40,0.35)] transition-[border-color,box-shadow] duration-300 overflow-hidden group select-none flex flex-col justify-between cursor-pointer"
    >
      {/* Top Header Stamp */}
      <div className="absolute top-0 inset-x-0 z-30 px-3 py-1.5 flex items-center justify-between bg-black/75 border-b border-white/10 text-[9px] sm:text-[10px] font-mono text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EB0028] animate-pulse" />
          <span className="text-[#EB0028] font-bold tracking-wider">{data.code}</span>
        </div>
        <span className="tracking-widest uppercase font-mono text-[9px] text-gray-400">
          {data.category}
        </span>
      </div>

      {/* Speaker Image Background with Vignette Overlay */}
      <div className="relative w-full h-full pt-8 pb-3 px-4 flex items-center overflow-hidden">
        {/* Speaker Photo */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            src={data.image}
            alt={data.name}
            style={{ objectPosition: data.objectPosition || 'center top' }}
            className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Subtle Red & Dark Ambient Vignette */}
          {/* vignette kept only at the base, so the text stays legible without
              greying out the speaker's face */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent z-10" />
        </div>

        {/* Content Details Layer */}
        <div className="relative z-20 mt-auto w-full flex items-end justify-between">
          <div className="space-y-1">
            {/* Domain Topic Badge */}
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#EB0028]/20 border border-[#EB0028]/40 text-[#FF4D66] font-mono text-[9px] uppercase tracking-wider font-semibold">
              {data.topic}
            </span>

            {/* Speaker Name */}
            <h3 className="text-[15px] sm:text-lg font-extrabold font-sans text-white tracking-tight group-hover:text-red-400 transition-colors duration-300">
              {data.name}
            </h3>

            {/* Speaker Role / Short Subtitle */}
            <p className="text-[12px] sm:text-[13px] text-gray-300 font-sans font-medium">
              {data.role}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FilmFrame;
