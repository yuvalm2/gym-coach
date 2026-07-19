// art.js — inline SVG visuals, no dependencies, no network (works fully offline).
//   * Machine illustrations: a schematic line-art glyph per machine, keyed by
//     exercise id, with a per-movement-pattern fallback for custom machines.
//   * Muscle body map: a front/back figure that highlights a muscle group, plus
//     a plain-language blurb — used by the muscle-name tooltips.
// Everything is a pure string builder (no DOM), so it also loads under Node for
// the coverage test in tests/.
const Art = (() => {

  // ---- machine illustrations ------------------------------------------------
  // One shared viewBox + stroke style so every glyph reads as one set. Colour
  // comes from CSS `currentColor`, so the art adapts to the card it sits on.
  const mi = (inner) => `<svg class="mi" viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  // A weight stack: outlined housing with slot lines. Height 24.
  const stack = (x, y) => `<rect x="${x}" y="${y}" width="11" height="24" rx="1.5"/><path d="M${x} ${y + 6} h11 M${x} ${y + 12} h11 M${x} ${y + 18} h11"/>`;

  const ART = {
    'leg-press':     mi(`<path d="M8 34 V22 M8 34 H18"/><path d="M16 32 L38 12"/><path d="M30 22 L44 8"/>${stack(48, 10)}`),
    'leg-extension': mi(`<path d="M8 16 H24 V28"/><circle cx="24" cy="28" r="1.8" fill="currentColor" stroke="none"/><path d="M24 28 L40 20"/><path d="M40 20 v7"/>${stack(48, 12)}`),
    'leg-curl':      mi(`<path d="M8 20 H26"/><path d="M10 20 v6 M24 20 v6"/><circle cx="30" cy="20" r="1.8" fill="currentColor" stroke="none"/><path d="M30 20 L44 26"/><path d="M44 26 v-6"/>${stack(50, 12)}`),
    'squat':         mi(`<path d="M14 38 V8 M50 38 V8"/><path d="M14 14 H50"/><path d="M24 24 h16"/><path d="M27 24 v10 M37 24 v10"/><circle cx="32" cy="19" r="3"/>`),
    'hip-thrust':    mi(`<path d="M10 30 H30"/><path d="M30 30 H42"/><circle cx="44" cy="24" r="4"/><path d="M30 30 L38 40 M30 30 L24 40"/>`),
    'hip-abduction': mi(`<path d="M20 14 H44 V30 H20 Z"/><path d="M26 30 L18 40 M38 30 L46 40"/><circle cx="18" cy="40" r="2" fill="currentColor" stroke="none"/><circle cx="46" cy="40" r="2" fill="currentColor" stroke="none"/>`),
    'cable':         mi(`<path d="M16 6 V38 M48 6 V38"/><path d="M16 8 H48"/><circle cx="32" cy="12" r="2.5"/><path d="M32 14 V26"/><path d="M28 26 h8"/>${stack(38, 16)}`),
    'back-extension':mi(`<path d="M14 36 L30 20"/><circle cx="13" cy="37" r="2" fill="currentColor" stroke="none"/><path d="M30 20 L45 12"/><circle cx="48" cy="10" r="4"/><path d="M30 20 v8"/>`),
    'barbell':       mi(`<path d="M8 22 H56"/><rect x="10" y="13" width="5" height="18" rx="1" fill="currentColor" stroke="none"/><rect x="16" y="16" width="4" height="12" rx="1" fill="currentColor" stroke="none"/><rect x="49" y="13" width="5" height="18" rx="1" fill="currentColor" stroke="none"/><rect x="44" y="16" width="4" height="12" rx="1" fill="currentColor" stroke="none"/>`),
    'dumbbell':      mi(`<path d="M22 22 H42"/><rect x="12" y="12" width="8" height="20" rx="2" fill="currentColor" stroke="none"/><rect x="44" y="12" width="8" height="20" rx="2" fill="currentColor" stroke="none"/>`),
    'chest-press':   mi(`<path d="M14 12 V36 M14 36 H24"/><path d="M14 20 H34 M14 28 H34"/><path d="M34 20 v8"/>${stack(46, 12)}`),
    'pec-deck':      mi(`<path d="M32 10 V36 M30 36 H40"/><path d="M32 18 L18 12 M32 18 L46 12"/><circle cx="18" cy="12" r="2.5"/><circle cx="46" cy="12" r="2.5"/><circle cx="32" cy="18" r="1.8" fill="currentColor" stroke="none"/>`),
    'shoulder-press':mi(`<path d="M14 16 V36 H26"/><path d="M18 16 V8 M30 16 V8"/><path d="M18 8 H30"/>${stack(46, 12)}`),
    'assisted':      mi(`<path d="M14 6 V38 M50 6 V38"/><path d="M14 8 H50"/><path d="M22 8 v6 M42 8 v6"/><rect x="26" y="26" width="12" height="6" rx="2"/>`),
    'lat-pulldown':  mi(`<path d="M12 6 V38 M12 8 H40"/><circle cx="40" cy="10" r="2.5"/><path d="M40 12 V18"/><path d="M32 18 H48"/><path d="M18 24 H30 V34 H18"/>`),
    'row':           mi(`<path d="M46 12 V36 M40 36 H50"/><path d="M20 24 H44"/><path d="M20 24 l-6 -3 M20 24 l-6 3"/>${stack(8, 14)}`),
    'crunch':        mi(`<path d="M18 14 H40 M18 14 V30"/><circle cx="18" cy="30" r="1.8" fill="currentColor" stroke="none"/><path d="M18 30 H38"/><path d="M30 14 v-6"/>${stack(46, 12)}`),
    'plank':         mi(`<path d="M10 34 H54"/><path d="M14 30 L46 22"/><circle cx="49" cy="20" r="3.5"/><path d="M18 30 V34 M21 28 V34"/>`),
    'captains':      mi(`<path d="M20 8 V30 H36"/><path d="M20 20 H12 M20 26 H12"/><path d="M30 30 V40 L38 36"/>`),
    'calf':          mi(`<path d="M18 12 H34 M22 12 V30 M30 12 V30"/><path d="M16 30 H36"/><path d="M22 30 V38 M30 30 V38"/><path d="M18 38 H34"/>${stack(46, 12)}`),
    'treadmill':     mi(`<path d="M10 34 H44"/><path d="M10 34 L40 30"/><circle cx="12" cy="34" r="2"/><circle cx="42" cy="30.5" r="2"/><path d="M44 30 V10 H34"/><path d="M34 10 v6"/>`),
    'bike':          mi(`<circle cx="18" cy="30" r="9"/><path d="M18 30 L30 16 L44 30"/><circle cx="44" cy="30" r="3"/><path d="M30 16 V8 H24"/><path d="M30 16 L37 13"/>`),
    'elliptical':    mi(`<ellipse cx="28" cy="30" rx="16" ry="6"/><path d="M16 30 L20 40 M40 30 L38 40"/><path d="M46 30 V8"/><path d="M46 12 l-6 -3"/>`),
    'rower':         mi(`<path d="M8 30 H52"/><circle cx="12" cy="24" r="5"/><path d="M12 24 H30"/><rect x="30" y="26" width="8" height="6" rx="1.5"/><path d="M38 30 l6 6"/>`),
    'stairs':        mi(`<path d="M12 38 H22 V32 H30 V26 H38 V20 H46 V14 H54"/><path d="M46 20 V12"/>`)
  };

  // exercise id -> art key (only where a machine deserves its own glyph)
  const ID_ART = {
    'leg-press': 'leg-press', 'leg-extension': 'leg-extension',
    'hack-squat': 'squat', 'smith-squat': 'squat', 'goblet-squat': 'dumbbell',
    'seated-leg-curl': 'leg-curl', 'lying-leg-curl': 'leg-curl',
    'hip-thrust': 'hip-thrust', 'hip-abduction': 'hip-abduction',
    'glute-kickback': 'cable', 'back-extension': 'back-extension', 'rdl': 'barbell',
    'chest-press': 'chest-press', 'incline-chest-press': 'chest-press',
    'pec-deck': 'pec-deck', 'shoulder-press': 'shoulder-press',
    'lateral-raise': 'cable', 'triceps-pushdown': 'cable', 'assisted-dip': 'assisted',
    'overhead-press': 'barbell', 'bench-press': 'barbell', 'arnold-press': 'dumbbell',
    'lat-pulldown': 'lat-pulldown', 'chest-supported-row': 'row', 'seated-row': 'row',
    'assisted-pullup': 'assisted', 'face-pull': 'cable', 'rear-delt-fly': 'pec-deck',
    'biceps-curl': 'cable', 'bent-row': 'barbell',
    'ab-crunch-machine': 'crunch', 'cable-crunch': 'cable', 'plank': 'plank',
    'pallof-press': 'cable', 'captains-chair': 'captains', 'hanging-leg-raise': 'captains',
    'standing-calf-raise': 'calf', 'seated-calf-raise': 'calf',
    'recumbent-bike': 'bike', 'stationary-bike': 'bike', 'elliptical': 'elliptical',
    'treadmill-walk': 'treadmill', 'rower': 'rower', 'stairmaster': 'stairs'
  };

  // fallback by movement pattern (covers custom/photo-added machines)
  const PATTERN_ART = {
    lower_push: 'leg-press', lower_pull: 'leg-curl', upper_push: 'chest-press',
    upper_pull: 'lat-pulldown', core: 'crunch', calves: 'calf', conditioning: 'treadmill'
  };

  function machineArt(ex) {
    const key = (ex && (ID_ART[ex.id] || PATTERN_ART[ex.pattern])) || 'dumbbell';
    return ART[key] || ART.dumbbell;
  }

  // ---- muscle body map ------------------------------------------------------
  // A front + back figure. The silhouette is drawn once per side (`FIGURE`);
  // highlighting a muscle overlays its region shape(s) in accent on the right
  // side. Region coords are figure-local (0..100 wide, 0..205 tall) and placed
  // inside a translated <g>, so the same defs work on either figure.
  const FIGURE = `
    <circle class="bm-base" cx="50" cy="20" r="12"/>
    <rect class="bm-base" x="45" y="30" width="10" height="9" rx="3"/>
    <path class="bm-base" d="M32 42 L68 42 L62 104 L38 104 Z"/>
    <circle class="bm-base" cx="30" cy="44" r="9"/>
    <circle class="bm-base" cx="70" cy="44" r="9"/>
    <rect class="bm-base" x="20" y="44" width="11" height="34" rx="5"/>
    <rect class="bm-base" x="69" y="44" width="11" height="34" rx="5"/>
    <rect class="bm-base" x="19" y="74" width="10" height="36" rx="5"/>
    <rect class="bm-base" x="71" y="74" width="10" height="36" rx="5"/>
    <path class="bm-base" d="M38 102 L62 102 L60 122 L40 122 Z"/>
    <rect class="bm-base" x="39" y="118" width="11" height="42" rx="5"/>
    <rect class="bm-base" x="50" y="118" width="11" height="42" rx="5"/>
    <rect class="bm-base" x="40" y="160" width="9" height="40" rx="4"/>
    <rect class="bm-base" x="51" y="160" width="9" height="40" rx="4"/>`;

  const hi = (d) => `<path class="bm-hi" d="${d}"/>`;
  const hiRect = (x, y, w, h, r) => `<rect class="bm-hi" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const delts = `<circle class="bm-hi" cx="30" cy="44" r="9"/><circle class="bm-hi" cx="70" cy="44" r="9"/>`;

  // muscle key -> { name, blurb, front, back }  (front/back are highlight SVG)
  const MUSCLE_INFO = {
    quads:      { name: 'Quads', blurb: 'Front of the thighs — straighten the knee; the main driver in leg presses, extensions and squats.',
                  front: hiRect(39, 118, 11, 40, 5) + hiRect(50, 118, 11, 40, 5) },
    hamstrings: { name: 'Hamstrings', blurb: 'Back of the thighs — bend the knee and extend the hip; the target of leg curls and hip hinges.',
                  back: hiRect(39, 122, 11, 36, 5) + hiRect(50, 122, 11, 36, 5) },
    glutes:     { name: 'Glutes', blurb: 'Your buttocks — the big hip extensors that power thrusts, bridges and squats.',
                  back: hi('M39 104 Q50 100 61 104 L61 120 Q50 126 39 120 Z') },
    calves:     { name: 'Calves', blurb: 'Back of the lower leg — raise the heel onto the toes; trained by calf raises.',
                  back: hiRect(40, 160, 9, 36, 4) + hiRect(51, 160, 9, 36, 4) },
    lower_back: { name: 'Lower back', blurb: 'Spinal erectors along the lower spine — keep the torso upright and braced during hinges and rows.',
                  back: hiRect(43, 88, 14, 14, 3) },
    chest:      { name: 'Chest', blurb: 'Pectorals across the front of the ribcage — push the arms forward and together in presses and flyes.',
                  front: hi('M35 44 Q50 54 65 44 L63 62 Q50 68 37 62 Z') },
    upper_back: { name: 'Upper back', blurb: 'Traps and rhomboids between the shoulder blades — squeeze them together in rows and pulls.',
                  back: hi('M34 42 L66 42 L62 60 L38 60 Z') },
    lats:       { name: 'Lats', blurb: 'Broad muscles down the sides of the back — pull the arms down and in during pulldowns and pull-ups.',
                  back: hi('M38 58 L62 58 L54 90 L46 90 Z') },
    shoulders:  { name: 'Shoulders', blurb: 'Deltoids capping each shoulder — press overhead and raise the arms out and up.',
                  front: delts, back: delts },
    biceps:     { name: 'Biceps', blurb: 'Front of the upper arm — bend the elbow; they assist on every pulling movement.',
                  front: hiRect(20, 52, 11, 22, 5) + hiRect(69, 52, 11, 22, 5) },
    triceps:    { name: 'Triceps', blurb: 'Back of the upper arm — straighten the elbow; they assist on every pressing movement.',
                  back: hiRect(20, 50, 11, 24, 5) + hiRect(69, 50, 11, 24, 5) },
    abs:        { name: 'Abs', blurb: 'The muscles down the front of the trunk — flex and brace the spine in crunches and planks.',
                  front: hiRect(42, 66, 16, 30, 3) },
    obliques:   { name: 'Obliques', blurb: 'Along the sides of the waist — rotate and side-bend the trunk, and resist twisting.',
                  front: hiRect(35, 66, 6, 28, 2) + hiRect(59, 66, 6, 28, 2) },
    cardio:     { name: 'Cardio / conditioning', blurb: 'Heart and lungs — conditioning work that raises your heart rate and builds endurance.',
                  front: hi('M50 58 C44 48 33 51 40 60 C44 66 50 69 50 69 C50 69 56 66 60 60 C67 51 56 48 50 58 Z') }
  };

  function bodyMap(keys) {
    let front = '', back = '';
    (keys || []).forEach((k) => {
      const r = MUSCLE_INFO[k];
      if (!r) return;
      front += r.front || '';
      back += r.back || '';
    });
    return `<svg class="bm" viewBox="0 0 216 216" aria-hidden="true">
      <g transform="translate(6,4)">${FIGURE}${front}</g>
      <g transform="translate(116,4)">${FIGURE}${back}</g>
      <text class="bm-label" x="56" y="214">Front</text>
      <text class="bm-label" x="166" y="214">Back</text>
    </svg>`;
  }

  return { machineArt, bodyMap, MUSCLE_INFO };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Art;
