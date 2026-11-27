// Generic cartoon hockey player (bust) for the "Uhodni hráče" format — helmet, visor, jersey in two colours
// and a number. Deliberately no likeness of any real person: the clues do the guessing, not the face.
// mystery = dark silhouette with a "?" (before the reveal).
export function playerSVG({ jersey = "#C8102E", trim = "#FFFFFF", num = "", mystery = false } = {}) {
  const J = mystery ? "#1a1a1f" : jersey, T = mystery ? "#26262c" : trim, skin = mystery ? "#1a1a1f" : "#F1C7A5";
  const line = mystery ? "rgba(255,255,255,.55)" : "#111";
  const n = String(num).slice(0, 2);
  return `<svg viewBox="0 0 600 640" xmlns="http://www.w3.org/2000/svg">
  <defs><clipPath id="pj"><path d="M60 640 C70 520 120 455 210 430 L390 430 C480 455 530 520 540 640 Z"/></clipPath></defs>
  <g stroke="${line}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round">
    <!-- jersey -->
    <path d="M60 640 C70 520 120 455 210 430 L390 430 C480 455 530 520 540 640 Z" fill="${J}"/>
    <g clip-path="url(#pj)" stroke="none">
      <rect x="0" y="560" width="600" height="34" fill="${T}"/>
      <rect x="40" y="500" width="70" height="200" fill="${T}" transform="rotate(-18 75 600)"/>
      <rect x="490" y="500" width="70" height="200" fill="${T}" transform="rotate(18 525 600)"/>
    </g>
    <path d="M60 640 C70 520 120 455 210 430 L390 430 C480 455 530 520 540 640" fill="none"/>
    <!-- collar -->
    <path d="M230 430 L300 492 L370 430" fill="${T}"/>
    ${n && !mystery ? `<text x="300" y="612" text-anchor="middle" font-family="Montserrat" font-weight="900" font-style="italic" font-size="104" fill="${T}" stroke="${line}" stroke-width="6" paint-order="stroke">${n}</text>` : ""}
    <!-- neck + head -->
    <rect x="262" y="370" width="76" height="80" rx="20" fill="${skin}"/>
    <ellipse cx="300" cy="282" rx="118" ry="128" fill="${skin}"/>
    <!-- helmet -->
    <path d="M176 270 C170 150 230 92 300 92 C370 92 430 150 424 270 L424 300 L392 300 L392 262 C392 246 380 236 364 236 L236 236 C220 236 208 246 208 262 L208 300 L176 300 Z" fill="${J}"/>
    <path d="M206 140 C240 110 360 110 394 140" fill="none" stroke="${T}" stroke-width="16"/>
    <rect x="176" y="282" width="40" height="54" rx="12" fill="${J}"/>
    <rect x="384" y="282" width="40" height="54" rx="12" fill="${J}"/>
    <!-- visor -->
    <path d="M196 236 L404 236 L398 298 C360 312 240 312 202 298 Z" fill="${mystery ? "rgba(255,255,255,.08)" : "rgba(170,215,255,.45)"}"/>
    ${mystery ? "" : `<!-- face -->
    <circle cx="258" cy="276" r="12" fill="#111" stroke="none"/><circle cx="342" cy="276" r="12" fill="#111" stroke="none"/>
    <circle cx="262" cy="272" r="4" fill="#fff" stroke="none"/><circle cx="346" cy="272" r="4" fill="#fff" stroke="none"/>
    <path d="M300 300 L292 330 L306 332" fill="none" stroke-width="7"/>
    <path d="M262 356 C284 374 318 374 340 356" fill="none" stroke-width="8"/>
    <!-- chin strap -->
    <path d="M196 330 C214 392 386 392 404 330" fill="none" stroke="${J}" stroke-width="12"/>`}
  </g>
  ${mystery ? `<text x="300" y="350" text-anchor="middle" font-family="Montserrat" font-weight="900" font-style="italic" font-size="230" fill="#E30613" stroke="#fff" stroke-width="8" paint-order="stroke">?</text>` : ""}
</svg>`;
}

// tiny icons for the clue cards (white strokes on the red tile)
const I = {
  pos: '<path d="M14 6 L30 42 L40 42"/><path d="M34 6 L22 34"/><circle cx="12" cy="40" r="4"/>',
  born: '<rect x="8" y="14" width="32" height="26" rx="4"/><path d="M8 22 H40 M16 8 V16 M32 8 V16"/>',
  career: '<circle cx="10" cy="38" r="4"/><circle cx="38" cy="10" r="4"/><path d="M14 38 H26 C34 38 34 24 26 24 H22 C14 24 14 10 22 10 H34"/>',
  trophy: '<path d="M14 8 H34 V18 C34 26 28 30 24 30 C20 30 14 26 14 18 Z"/><path d="M14 12 H8 C8 20 12 22 15 22 M34 12 H40 C40 20 36 22 33 22 M24 30 V38 M16 40 H32"/>',
  num: '<path d="M14 8 L8 14 L12 22 L16 20 V40 H32 V20 L36 22 L40 14 L34 8 C32 12 28 14 24 14 C20 14 16 12 14 8 Z"/>',
  fact: '<circle cx="24" cy="20" r="12"/><path d="M19 36 H29 M20 41 H28"/>',
};
export const clueIcon = (k) => `<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">${I[k] || I.fact}</svg>`;
