export function Mountain({ compact = false }: {
    compact?: boolean;
}) {
    return <svg className={compact ? "mountain compact" : "mountain"} viewBox="0 0 1440 920" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrated snow-covered alpine peaks above a forest">
    <defs>
      <linearGradient id="sky" x2="0" y2="1">
    <stop stopColor="#ccdce0"/>
    <stop offset="1" stopColor="#edf0e7"/>
    </linearGradient>
      <linearGradient id="snow" x2="0.4" y2="1">
    <stop stopColor="#f6f5ef"/>
    <stop offset="1" stopColor="#b7cbd0"/>
    </linearGradient>
      <linearGradient id="ridge" x2="0" y2="1">
    <stop stopColor="#6c8c98"/>
    <stop offset="1" stopColor="#2c565b"/>
    </linearGradient>
      <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
    <feFuncA type="linear" slope=".09"/>
    </feComponentTransfer>
    <feBlend in="SourceGraphic" mode="multiply"/>
    </filter>
    </defs>
    <g filter="url(#grain)">
      <path fill="url(#sky)" d="M0 0h1440v920H0z"/>
      <circle cx="1070" cy="155" r="73" fill="#f4eedc" opacity=".8"/>
      <path fill="#b3c7cd" d="M0 550 170 317 275 410 432 240 576 410 760 185 893 345 1050 259 1200 424 1330 290 1440 460v460H0z"/>
      <path fill="url(#snow)" d="m180 620 307-394 86 123 160-199 156 238 83-111 272 365 196-39v317H0V705z"/>
      <path fill="#91adb9" d="m487 226-66 215 33-23-59 138 145-104 33-103zm246-76-70 257 34-19-36 157 119-138 63 146 46-165z"/>
      <path fill="#d9e3e2" d="m733 150 36 183 40-8 33 89-34-41-39 17-37-69-48 54zm239 127-32 152 46-13 54 85-40-142z"/>
      <path fill="#7998a3" d="m0 681 247-190 68 91 107-80 171 156 132-84 201 150 189-166 117 111 208-51v302H0z"/>
      <path fill="url(#ridge)" d="m0 725 182-88 227 142 276-116 263 159 248-139 244 50v187H0z"/>
      <path fill="#dfe8e5" d="m698 692 61 7 72 38 196 183H748l98-82-68-92z" opacity=".7"/>
      {Array.from({ length: 35 }, (_, i) => { const x = i * 44 - 20; const y = 748 + ((i * 19) % 82); const h = 90 + ((i * 13) % 80); return <path key={i} fill={i % 2 ? "#234b4c" : "#315c5b"} d={`M${x} ${y - h}l-22 49h12l-29 50h15l-29 49h48v40h10v-40h48l-29-49h15l-29-50h12z`}/>; })}
      <path fill="#153c3d" d="m0 854 164-21 244 40 224-9 245 44 226-35 337-24v71H0z"/>
    </g>
  </svg>;
}
export function MountainMark() {
    return <svg width="33" height="27" viewBox="0 0 33 27" fill="none" aria-hidden="true">
    <path d="M2 24 13 4l7 12 4-7 8 15H2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="m9 12 4 2 3-3" stroke="currentColor" strokeWidth="2"/>
    </svg>;
}
