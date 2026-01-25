import React from 'react'

function Logo() {
  return (
    <div>
        <div className="flex items-center justify-center gap-6 mb-12">
          
          {/* Left Line (Gradient Fade) */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/20 to-[#C59D5F] w-full max-w-[200px] hidden md:block"></div>
          
          {/* TEXT LOGO */}
          <a href="index.html" className="shrink-0 text-center group">
            <h2 className="text-4xl md:text-5xl font-barlow font-extrabold uppercase italic tracking-wider leading-none">
              <span className="text-white group-hover:text-gray-200 transition-colors drop-shadow-md">Khabar</span>
              <span className="text-[#C59D5F] group-hover:text-white transition-colors drop-shadow-md">Table</span>
            </h2>
            <p className="text-xs font-['Inter'] tracking-[0.4em] text-gray-500 uppercase mt-1 group-hover:tracking-[0.5em] transition-all duration-300">
              .com
            </p>
          </a>

          {/* Right Line (Gradient Fade) */}
          <div className="h-[1px] bg-gradient-to-l from-transparent via-white/20 to-[#C59D5F] w-full max-w-[200px] hidden md:block"></div>
        </div>
    </div>
  )
}

export default Logo