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

  function artKey(ex) { return (ex && (ID_ART[ex.id] || PATTERN_ART[ex.pattern])) || 'dumbbell'; }
  function machineArt(ex) { return ART[artKey(ex)] || ART.dumbbell; }

  // ---- detailed illustrations (shown on demand in the exercise sheet) --------
  // Richer, shaded drawings keyed by the same art keys. Colours are baked for
  // the dark UI (via .d-* classes). Not every key is filled in yet;
  // machineArtDetailed returns null when there's no drawing, so the caller can
  // fall back to the simple line glyph or a user-supplied photo.
  const md = (inner) => `<svg class="mid" viewBox="0 0 220 150" aria-hidden="true">${inner}</svg>`;
  const floor = `<ellipse class="d-floor" cx="110" cy="140" rx="94" ry="7"/>`;
  const arrow = (d, head) => `<path class="d-arrow" d="${d}"/><path class="d-arrow" d="${head}"/>`;
  const dStack = (x, y) => `<rect class="d-stack" x="${x}" y="${y}" width="20" height="50" rx="3"/>`
    + `<path class="d-cable" d="M${x + 2} ${y + 8} h16 M${x + 2} ${y + 18} h16 M${x + 2} ${y + 28} h16 M${x + 2} ${y + 38} h16"/>`;

  const DETAIL = {
    'leg-press': md(floor
      + `<path class="d-frame" d="M24 126 H150"/>`
      + `<rect class="d-pad" x="26" y="84" width="16" height="44" rx="6"/>`
      + `<rect class="d-seat" x="34" y="118" width="52" height="12" rx="6"/>`
      + `<path class="d-frame" d="M70 120 L166 48 M82 128 L178 56"/>`
      + `<path class="d-bar" d="M150 44 L176 66"/>`
      + `<circle class="d-plate" cx="150" cy="42" r="15"/><circle class="d-plate" cx="150" cy="42" r="7"/>`
      + arrow('M104 100 L134 78', 'M134 78 l-10 2 M134 78 l2 10')),
    'lat-pulldown': md(floor
      + `<path class="d-frame" d="M40 24 V128 M40 26 H150"/>`
      + `<circle class="d-plate" cx="150" cy="30" r="6"/>`
      + `<path class="d-cable" d="M150 34 V52"/>`
      + `<path class="d-bar" d="M130 54 H170"/>`
      + `<rect class="d-seat" x="52" y="92" width="42" height="12" rx="6"/>`
      + `<rect class="d-pad" x="58" y="70" width="30" height="10" rx="5"/>`
      + `<path class="d-frame" d="M66 104 V126"/>`
      + dStack(30, 70)
      + arrow('M150 60 L150 84', 'M150 84 l-6 -9 M150 84 l6 -9')),
    'chest-press': md(floor
      + `<path class="d-frame" d="M150 40 V128"/>`
      + `<rect class="d-pad" x="52" y="56" width="14" height="46" rx="6"/>`
      + `<rect class="d-seat" x="60" y="100" width="46" height="12" rx="6"/>`
      + `<path class="d-bar" d="M66 70 H140 M66 90 H140"/>`
      + `<path class="d-bar" d="M140 64 V96"/>`
      + dStack(150, 60)
      + arrow('M96 80 L128 80', 'M128 80 l-9 -5 M128 80 l-9 5')),
    'cable': md(floor
      + `<path class="d-frame" d="M46 22 V128 M174 22 V128 M46 24 H174"/>`
      + `<circle class="d-plate" cx="60" cy="40" r="6"/><circle class="d-plate" cx="160" cy="40" r="6"/>`
      + `<path class="d-cable" d="M60 44 L98 92"/>`
      + `<path class="d-bar" d="M94 90 l-7 9"/>`
      + dStack(50, 66) + dStack(150, 66)
      + arrow('M100 96 L124 78', 'M124 78 l-10 1 M124 78 l1 10')),
    'treadmill': md(floor
      + `<path class="d-frame" d="M150 120 V44 H108"/>`
      + `<rect class="d-pad" x="148" y="38" width="28" height="18" rx="3"/>`
      + `<path class="d-bar" d="M108 44 H90"/>`
      + `<path class="d-belt" d="M28 124 L44 116 L150 116 L150 124 Z"/>`
      + `<circle class="d-plate" cx="34" cy="122" r="6"/><circle class="d-plate" cx="146" cy="120" r="6"/>`
      + arrow('M62 110 L104 106', 'M104 106 l-10 -2 M104 106 l-8 5')),
    'barbell': md(floor
      + `<rect class="d-pad" x="70" y="98" width="80" height="12" rx="6"/>`
      + `<path class="d-frame" d="M84 110 V126 M136 110 V126 M60 58 V100 M160 58 V100"/>`
      + `<path class="d-bar" d="M30 66 H190"/>`
      + `<rect class="d-plate" x="44" y="52" width="10" height="28" rx="2"/><rect class="d-plate" x="33" y="56" width="8" height="20" rx="2"/>`
      + `<rect class="d-plate" x="166" y="52" width="10" height="28" rx="2"/><rect class="d-plate" x="179" y="56" width="8" height="20" rx="2"/>`
      + arrow('M110 84 V74', 'M110 74 l-5 8 M110 74 l5 8')),
    'plank': md(floor
      + `<path class="d-mat" d="M24 128 H196"/>`
      + `<path class="d-body" d="M42 108 L148 84"/>`
      + `<circle class="d-bodyfill" cx="156" cy="80" r="9"/>`
      + `<path class="d-body" d="M50 108 V126 M58 100 V126"/>`
      + `<path class="d-body" d="M138 88 L152 126"/>`),
    'leg-extension': md(floor
      + `<path class="d-frame" d="M28 126 H150"/>`
      + `<rect class="d-pad" x="28" y="72" width="16" height="52" rx="6"/>`
      + `<rect class="d-seat" x="38" y="112" width="54" height="12" rx="6"/>`
      + `<circle class="d-plate" cx="96" cy="110" r="11"/>`
      + `<path class="d-frame" d="M96 110 L154 82"/>`
      + `<rect class="d-pad" x="150" y="76" width="12" height="20" rx="5"/>`
      + arrow('M116 100 L148 86', 'M148 86 l-10 1 M148 86 l-1 -9')),
    'leg-curl': md(floor
      + `<path class="d-frame" d="M28 126 H150"/>`
      + `<rect class="d-pad" x="28" y="74" width="16" height="50" rx="6"/>`
      + `<rect class="d-seat" x="38" y="112" width="54" height="12" rx="6"/>`
      + `<rect class="d-pad" x="70" y="94" width="26" height="10" rx="5"/>`
      + `<circle class="d-plate" cx="96" cy="112" r="10"/>`
      + `<path class="d-frame" d="M96 112 L150 124"/>`
      + `<rect class="d-pad" x="146" y="118" width="12" height="16" rx="5"/>`
      + arrow('M118 118 L146 124', 'M146 124 l-10 -2 M146 124 l-5 6')),
    'squat': md(floor
      + `<path class="d-frame" d="M56 128 V34 M164 128 V34 M56 40 H164"/>`
      + `<path class="d-bar" d="M40 74 H180"/>`
      + `<circle class="d-plate" cx="52" cy="74" r="12"/><circle class="d-plate" cx="168" cy="74" r="12"/>`
      + `<circle class="d-bodyfill" cx="110" cy="60" r="8"/>`
      + `<path class="d-body" d="M110 68 V96 M110 96 L98 122 M110 96 L122 122"/>`
      + arrow('M136 96 V80', 'M136 80 l-5 8 M136 80 l5 8')),
    'hip-thrust': md(floor
      + `<rect class="d-pad" x="34" y="86" width="70" height="12" rx="6"/>`
      + `<path class="d-frame" d="M44 98 V122 M92 98 V122"/>`
      + `<circle class="d-bodyfill" cx="92" cy="80" r="8"/>`
      + `<path class="d-body" d="M98 86 L128 90 L150 122"/>`
      + `<path class="d-bar" d="M108 74 H150"/>`
      + `<circle class="d-plate" cx="118" cy="74" r="11"/><circle class="d-plate" cx="140" cy="74" r="11"/>`
      + arrow('M129 90 V78', 'M129 78 l-5 8 M129 78 l5 8')),
    'hip-abduction': md(floor
      + `<path class="d-frame" d="M110 128 V54"/>`
      + `<rect class="d-seat" x="82" y="98" width="56" height="14" rx="6"/>`
      + `<rect class="d-pad" x="66" y="72" width="12" height="28" rx="5"/>`
      + `<rect class="d-pad" x="142" y="72" width="12" height="28" rx="5"/>`
      + `<path class="d-frame" d="M110 92 L72 86 M110 92 L148 86"/>`
      + `<circle class="d-plate" cx="110" cy="92" r="10"/>`
      + arrow('M96 96 L76 90', 'M76 90 l9 -1 M76 90 l-1 8')
      + arrow('M124 96 L144 90', 'M144 90 l-9 -1 M144 90 l1 8')),
    'back-extension': md(floor
      + `<path class="d-frame" d="M44 128 H150"/>`
      + `<path class="d-frame" d="M110 128 L92 76"/>`
      + `<rect class="d-seat" x="82" y="70" width="20" height="12" rx="6"/>`
      + `<rect class="d-pad" x="140" y="112" width="14" height="10" rx="4"/>`
      + `<path class="d-body" d="M92 74 L150 116"/>`
      + `<path class="d-body" d="M92 74 L54 92"/>`
      + `<circle class="d-bodyfill" cx="48" cy="96" r="8"/>`
      + arrow('M64 104 V88', 'M64 88 l-5 8 M64 88 l5 8')),
    'dumbbell': md(floor
      + `<rect class="d-pad" x="60" y="96" width="100" height="12" rx="6"/>`
      + `<path class="d-frame" d="M74 108 V126 M146 108 V126 M110 108 V126"/>`
      + `<path class="d-bar" d="M96 66 H124"/>`
      + `<rect class="d-plate" x="84" y="56" width="12" height="20" rx="3"/><rect class="d-plate" x="124" y="56" width="12" height="20" rx="3"/>`
      + arrow('M110 84 V72', 'M110 72 l-5 8 M110 72 l5 8')),
    'pec-deck': md(floor
      + `<path class="d-frame" d="M110 128 V44"/>`
      + `<rect class="d-seat" x="94" y="98" width="34" height="12" rx="6"/>`
      + `<rect class="d-pad" x="102" y="60" width="14" height="38" rx="6"/>`
      + `<path class="d-frame" d="M110 66 L74 58 M110 66 L146 58"/>`
      + `<rect class="d-pad" x="64" y="48" width="10" height="24" rx="5"/><rect class="d-pad" x="146" y="48" width="10" height="24" rx="5"/>`
      + arrow('M84 62 L100 66', 'M100 66 l-10 -2 M100 66 l-5 7')
      + arrow('M136 62 L120 66', 'M120 66 l10 -2 M120 66 l5 7')),
    'shoulder-press': md(floor
      + `<path class="d-frame" d="M40 126 H150"/>`
      + `<rect class="d-pad" x="60" y="66" width="14" height="48" rx="6"/>`
      + `<rect class="d-seat" x="68" y="110" width="44" height="12" rx="6"/>`
      + `<path class="d-bar" d="M76 68 V42 M104 68 V42 M76 42 H104"/>`
      + dStack(150, 58)
      + arrow('M124 60 V44', 'M124 44 l-5 8 M124 44 l5 8')),
    'assisted': md(floor
      + `<path class="d-frame" d="M50 24 V128 M170 24 V128 M50 26 H170"/>`
      + `<path class="d-bar" d="M78 26 V40 M142 26 V40"/>`
      + `<path class="d-bar" d="M96 60 H124"/>`
      + `<rect class="d-seat" x="94" y="86" width="32" height="12" rx="6"/>`
      + `<path class="d-frame" d="M110 98 V118"/>`
      + dStack(150, 66)
      + arrow('M110 82 V62', 'M110 62 l-5 8 M110 62 l5 8')),
    'row': md(floor
      + `<path class="d-frame" d="M150 126 V60"/>`
      + `<rect class="d-seat" x="116" y="98" width="42" height="12" rx="6"/>`
      + `<rect class="d-pad" x="150" y="66" width="12" height="34" rx="6"/>`
      + `<path class="d-cable" d="M150 80 L86 84"/>`
      + `<path class="d-bar" d="M82 78 V90"/>`
      + dStack(160, 66)
      + arrow('M96 82 L118 82', 'M118 82 l-9 -4 M118 82 l-9 4')),
    'crunch': md(floor
      + `<path class="d-frame" d="M40 126 H150"/>`
      + `<rect class="d-pad" x="60" y="46" width="40" height="12" rx="6"/>`
      + `<path class="d-bar" d="M80 46 V34"/>`
      + `<path class="d-frame" d="M64 58 V96"/>`
      + `<circle class="d-plate" cx="64" cy="98" r="9"/>`
      + `<rect class="d-seat" x="64" y="104" width="44" height="12" rx="6"/>`
      + dStack(150, 58)
      + arrow('M92 62 V80', 'M92 80 l-5 -8 M92 80 l5 -8')),
    'captains': md(floor
      + `<path class="d-frame" d="M70 128 V40 M70 42 H86"/>`
      + `<rect class="d-pad" x="70" y="60" width="12" height="40" rx="5"/>`
      + `<rect class="d-pad" x="82" y="72" width="26" height="10" rx="5"/>`
      + `<rect class="d-pad" x="82" y="88" width="26" height="10" rx="5"/>`
      + `<circle class="d-bodyfill" cx="92" cy="66" r="7"/>`
      + `<path class="d-body" d="M92 74 V96 L120 96 L120 84"/>`
      + arrow('M132 100 V84', 'M132 84 l-5 8 M132 84 l5 8')),
    'calf': md(floor
      + `<path class="d-frame" d="M60 128 V40 M150 128 V40 M60 52 H150"/>`
      + `<rect class="d-pad" x="88" y="48" width="34" height="10" rx="5"/>`
      + `<circle class="d-bodyfill" cx="105" cy="40" r="7"/>`
      + `<path class="d-body" d="M105 58 V104 M105 104 L98 116 M105 104 L112 116"/>`
      + `<path class="d-bar" d="M86 116 H124"/>`
      + dStack(154, 64)
      + arrow('M138 108 V92', 'M138 92 l-5 8 M138 92 l5 8')),
    'bike': md(floor
      + `<circle class="d-frame" cx="70" cy="104" r="24"/>`
      + `<circle class="d-plate" cx="70" cy="104" r="8"/>`
      + `<path class="d-frame" d="M70 104 L112 60 L150 104"/>`
      + `<circle class="d-plate" cx="150" cy="104" r="6"/>`
      + `<path class="d-bar" d="M112 60 V40 H92"/>`
      + `<path class="d-frame" d="M126 66 L140 50"/>`
      + `<rect class="d-seat" x="132" y="44" width="22" height="8" rx="4"/>`),
    'elliptical': md(floor
      + `<path class="d-frame" d="M40 118 H150"/>`
      + `<circle class="d-plate" cx="150" cy="96" r="14"/>`
      + `<path class="d-frame" d="M40 118 L60 96 L150 96"/>`
      + `<rect class="d-pad" x="52" y="112" width="24" height="8" rx="3"/>`
      + `<path class="d-frame" d="M150 96 V40"/>`
      + `<path class="d-bar" d="M150 52 L120 44 M150 52 L118 66"/>`
      + `<rect class="d-pad" x="146" y="32" width="26" height="12" rx="3"/>`
      + arrow('M70 106 L104 104', 'M104 104 l-9 -2 M104 104 l-8 5')),
    'rower': md(floor
      + `<path class="d-frame" d="M28 116 H186"/>`
      + `<circle class="d-frame" cx="42" cy="92" r="18"/>`
      + `<circle class="d-plate" cx="42" cy="92" r="9"/>`
      + `<path class="d-cable" d="M58 92 H118"/>`
      + `<path class="d-bar" d="M118 86 V98"/>`
      + `<rect class="d-seat" x="122" y="104" width="24" height="8" rx="4"/>`
      + `<rect class="d-pad" x="40" y="112" width="16" height="8" rx="3"/>`
      + arrow('M100 92 L134 92', 'M134 92 l-9 -4 M134 92 l-9 4')),
    'stairs': md(floor
      + `<path class="d-belt" d="M36 128 L36 108 L60 108 L60 92 L84 92 L84 76 L108 76 L108 60 L132 60 L132 128 Z"/>`
      + `<path class="d-frame" d="M132 60 V36 H150"/>`
      + `<rect class="d-pad" x="128" y="30" width="30" height="14" rx="3"/>`
      + `<path class="d-bar" d="M132 52 H106"/>`
      + arrow('M96 84 V70', 'M96 70 l-5 8 M96 70 l5 8'))
  };
  function machineArtDetailed(ex) { return DETAIL[artKey(ex)] || null; }

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

  // Region geometry is stored class-free; `paint()` colours it per use — the
  // single-muscle tooltip, an exercise's primary/secondary, or 3-state coverage.
  const hi = (d) => `<path d="${d}"/>`;
  const hiRect = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const delts = `<circle cx="30" cy="44" r="9"/><circle cx="70" cy="44" r="9"/>`;

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

  const paint = (shapes, cls) => (shapes || '').replace(/<(path|rect|circle|ellipse)\b/g, `<$1 class="${cls}"`);
  const svgWrap = (f, b) => `<svg class="bm" viewBox="0 0 216 216" aria-hidden="true">`
    + `<g transform="translate(6,4)">${FIGURE}${f}</g>`
    + `<g transform="translate(116,4)">${FIGURE}${b}</g>`
    + `<text class="bm-label" x="56" y="214">Front</text>`
    + `<text class="bm-label" x="166" y="214">Back</text></svg>`;

  // A single muscle lit up — used by the per-muscle name tooltip.
  function bodyMap(keys) {
    let f = '', b = '';
    (keys || []).forEach((k) => { const r = MUSCLE_INFO[k]; if (r) { f += paint(r.front, 'bm-hi'); b += paint(r.back, 'bm-hi'); } });
    return svgWrap(f, b);
  }

  // One exercise's muscles — primary solid, secondary faded. For the exercise tooltip.
  function exerciseMap(primary, secondary) {
    let f = '', b = '';
    (secondary || []).forEach((k) => { const r = MUSCLE_INFO[k]; if (r) { f += paint(r.front, 'bm-hi2'); b += paint(r.back, 'bm-hi2'); } });
    (primary || []).forEach((k) => { const r = MUSCLE_INFO[k]; if (r) { f += paint(r.front, 'bm-hi'); b += paint(r.back, 'bm-hi'); } });
    return svgWrap(f, b);
  }

  // Session coverage — state per muscle: 'done' (worked this visit),
  // 'plan' (in today's plan, not yet), 'off' (not in today's plan).
  function coverageMap(state) {
    const st = state || {};
    let f = '', b = '';
    ['off', 'plan', 'done'].forEach((s) => {          // draw dim first, worked on top
      Object.keys(MUSCLE_INFO).forEach((k) => {
        if ((st[k] || 'off') !== s) return;
        const r = MUSCLE_INFO[k];
        f += paint(r.front, 'bm-' + s); b += paint(r.back, 'bm-' + s);
      });
    });
    return svgWrap(f, b);
  }

  return { machineArt, machineArtDetailed, bodyMap, exerciseMap, coverageMap, MUSCLE_INFO };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Art;
