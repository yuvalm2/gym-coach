// library.js — built-in exercise/machine catalog with muscle + joint + complexity tags.
// Each exercise:
//   id, name, type(machine|cable|free|bodyweight|cardio), pattern(slot it fills),
//   primary[], secondary[]        muscle keys
//   complexity: simple|moderate|complex
//   joints[]: joints under meaningful load (knee|spine|shoulder)
//   friendlyFor[]: joints for which this is still a gentle/controllable option
//   mitigation{joint:text}: how to make it safer
//   common: true => pre-selected when a new gym is created
const MUSCLES = {
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves',
  lower_back: 'Lower back', chest: 'Chest', upper_back: 'Upper back', lats: 'Lats',
  shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps', abs: 'Abs',
  obliques: 'Obliques', cardio: 'Cardio / conditioning'
};

const PATTERNS = {
  lower_push: 'Lower body push (quads)',
  lower_pull: 'Lower body pull (hamstrings / glutes)',
  upper_push: 'Upper body push (chest / shoulders / triceps)',
  upper_pull: 'Upper body pull (back / biceps)',
  core: 'Core',
  calves: 'Calves',
  conditioning: 'Conditioning'
};

const LIBRARY = [
  // ---- Lower push ----
  { id: 'leg-press', name: 'Leg Press', type: 'machine', pattern: 'lower_push', primary: ['quads'], secondary: ['glutes', 'hamstrings'], complexity: 'simple', joints: ['knee'], friendlyFor: ['knee'], mitigation: { knee: 'Stay in the top two-thirds of the range, keep knees tracking over your toes, and drive through your heels.' }, common: true },
  { id: 'leg-extension', name: 'Leg Extension', type: 'machine', pattern: 'lower_push', primary: ['quads'], secondary: [], complexity: 'simple', joints: ['knee'], friendlyFor: ['knee'], mitigation: { knee: 'Use a moderate load, control the tempo, and avoid snapping into a hard lockout at the top.' }, common: true },
  { id: 'hack-squat', name: 'Hack Squat', type: 'machine', pattern: 'lower_push', primary: ['quads'], secondary: ['glutes'], complexity: 'moderate', joints: ['knee', 'spine'], friendlyFor: ['knee'], mitigation: { knee: 'Keep depth comfortable with knees tracking your toes.' }, common: false },
  { id: 'smith-squat', name: 'Smith Machine Squat', type: 'machine', pattern: 'lower_push', primary: ['quads'], secondary: ['glutes'], complexity: 'moderate', joints: ['knee', 'spine'], friendlyFor: ['knee'], mitigation: { knee: 'The fixed bar path aids control; keep depth comfortable.' }, common: false },
  { id: 'goblet-squat', name: 'Goblet Squat', type: 'free', pattern: 'lower_push', primary: ['quads'], secondary: ['glutes'], complexity: 'moderate', joints: ['knee', 'spine'], friendlyFor: [], mitigation: {}, common: false },

  // ---- Lower pull ----
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', type: 'machine', pattern: 'lower_pull', primary: ['hamstrings'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: true },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl', type: 'machine', pattern: 'lower_pull', primary: ['hamstrings'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: true },
  { id: 'hip-thrust', name: 'Machine Hip Thrust', type: 'machine', pattern: 'lower_pull', primary: ['glutes'], secondary: ['hamstrings'], complexity: 'simple', joints: ['spine'], friendlyFor: ['spine'], mitigation: { spine: 'Keep ribs down and chin tucked; squeeze the glutes at the top instead of arching your lower back.' }, common: false },
  { id: 'hip-abduction', name: 'Hip Abduction Machine', type: 'machine', pattern: 'lower_pull', primary: ['glutes'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: true },
  { id: 'glute-kickback', name: 'Cable Glute Kickback', type: 'cable', pattern: 'lower_pull', primary: ['glutes'], secondary: ['hamstrings'], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: false },
  { id: 'back-extension', name: 'Back Extension (Hyperextension)', type: 'bodyweight', pattern: 'lower_pull', primary: ['lower_back'], secondary: ['glutes', 'hamstrings'], complexity: 'moderate', joints: ['spine'], friendlyFor: [], mitigation: {}, common: false },
  { id: 'rdl', name: 'Romanian Deadlift', type: 'free', pattern: 'lower_pull', primary: ['hamstrings'], secondary: ['glutes', 'lower_back'], complexity: 'complex', joints: ['spine'], friendlyFor: [], mitigation: {}, common: false },

  // ---- Upper push ----
  { id: 'chest-press', name: 'Chest Press Machine', type: 'machine', pattern: 'upper_push', primary: ['chest'], secondary: ['triceps', 'shoulders'], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: true },
  { id: 'incline-chest-press', name: 'Incline Chest Press Machine', type: 'machine', pattern: 'upper_push', primary: ['chest'], secondary: ['shoulders', 'triceps'], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: false },
  { id: 'pec-deck', name: 'Pec Deck (Chest Fly)', type: 'machine', pattern: 'upper_push', primary: ['chest'], secondary: [], complexity: 'simple', joints: ['shoulder'], friendlyFor: ['shoulder'], mitigation: { shoulder: 'Keep a slight elbow bend and a comfortable range; don’t over-stretch at the back.' }, common: true },
  { id: 'shoulder-press', name: 'Shoulder Press Machine', type: 'machine', pattern: 'upper_push', primary: ['shoulders'], secondary: ['triceps'], complexity: 'simple', joints: ['shoulder'], friendlyFor: ['shoulder'], mitigation: { shoulder: 'Stop just short of lockout and keep the range pain-free.' }, common: true },
  { id: 'lateral-raise', name: 'Lateral Raise (Cable/DB)', type: 'cable', pattern: 'upper_push', primary: ['shoulders'], secondary: [], complexity: 'simple', joints: ['shoulder'], friendlyFor: ['shoulder'], mitigation: { shoulder: 'Lead with the elbows and stay around shoulder height if higher pinches.' }, common: false },
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', type: 'cable', pattern: 'upper_push', primary: ['triceps'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: true },
  { id: 'assisted-dip', name: 'Assisted Dip', type: 'machine', pattern: 'upper_push', primary: ['chest'], secondary: ['triceps', 'shoulders'], complexity: 'moderate', joints: ['shoulder'], friendlyFor: ['shoulder'], mitigation: { shoulder: 'Use enough assistance to control the bottom; don’t drop below a comfortable depth.' }, common: false },
  { id: 'overhead-press', name: 'Overhead Barbell Press', type: 'free', pattern: 'upper_push', primary: ['shoulders'], secondary: ['triceps'], complexity: 'complex', joints: ['shoulder', 'spine'], friendlyFor: [], mitigation: {}, common: false },
  { id: 'bench-press', name: 'Bench Press (Barbell)', type: 'free', pattern: 'upper_push', primary: ['chest'], secondary: ['triceps', 'shoulders'], complexity: 'moderate', joints: ['shoulder'], friendlyFor: ['shoulder'], mitigation: { shoulder: 'Keep your shoulder blades pinched back and don’t let the bar sink too deep; a slight elbow tuck protects the shoulder.' }, common: true },
  { id: 'arnold-press', name: 'Arnold Press', type: 'free', pattern: 'upper_push', primary: ['shoulders'], secondary: ['triceps'], complexity: 'moderate', joints: ['shoulder'], friendlyFor: ['shoulder'], mitigation: { shoulder: 'Rotate smoothly and stop just short of lockout, keeping the range pain-free.' }, common: true },

  // ---- Upper pull ----
  { id: 'lat-pulldown', name: 'Lat Pulldown', type: 'machine', pattern: 'upper_pull', primary: ['lats'], secondary: ['biceps'], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: true },
  { id: 'chest-supported-row', name: 'Chest-Supported Row Machine', type: 'machine', pattern: 'upper_pull', primary: ['upper_back'], secondary: ['lats', 'biceps'], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: true },
  { id: 'seated-row', name: 'Seated Cable Row', type: 'cable', pattern: 'upper_pull', primary: ['upper_back'], secondary: ['lats', 'biceps'], complexity: 'simple', joints: ['spine'], friendlyFor: ['spine'], mitigation: { spine: 'Keep your back straight and core braced; pull with your arms rather than swinging the torso.' }, common: true },
  { id: 'assisted-pullup', name: 'Assisted Pull-Up', type: 'machine', pattern: 'upper_pull', primary: ['lats'], secondary: ['biceps'], complexity: 'moderate', joints: ['shoulder'], friendlyFor: ['shoulder'], mitigation: { shoulder: 'Use enough assistance to control the bottom; avoid a jerky dead-hang start.' }, common: false },
  { id: 'face-pull', name: 'Face Pull', type: 'cable', pattern: 'upper_pull', primary: ['shoulders'], secondary: ['upper_back'], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: false },
  { id: 'rear-delt-fly', name: 'Reverse Pec Deck (Rear Delt)', type: 'machine', pattern: 'upper_pull', primary: ['shoulders'], secondary: ['upper_back'], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: false },
  { id: 'biceps-curl', name: 'Biceps Curl (Machine/Cable)', type: 'cable', pattern: 'upper_pull', primary: ['biceps'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: true },
  { id: 'bent-row', name: 'Bent-Over Barbell Row', type: 'free', pattern: 'upper_pull', primary: ['upper_back'], secondary: ['lats', 'lower_back'], complexity: 'complex', joints: ['spine'], friendlyFor: [], mitigation: {}, common: false },

  // ---- Core ----
  { id: 'ab-crunch-machine', name: 'Ab Crunch Machine', type: 'machine', pattern: 'core', primary: ['abs'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: true },
  { id: 'cable-crunch', name: 'Cable Crunch', type: 'cable', pattern: 'core', primary: ['abs'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: false },
  { id: 'plank', name: 'Plank', type: 'bodyweight', pattern: 'core', primary: ['abs'], secondary: ['obliques'], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: true },
  { id: 'pallof-press', name: 'Pallof Press', type: 'cable', pattern: 'core', primary: ['obliques'], secondary: ['abs'], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: false },
  { id: 'captains-chair', name: 'Captain’s Chair Knee Raise', type: 'machine', pattern: 'core', primary: ['abs'], secondary: ['obliques'], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: false },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', type: 'bodyweight', pattern: 'core', primary: ['abs'], secondary: [], complexity: 'moderate', joints: ['spine'], friendlyFor: [], mitigation: {}, common: false },

  // ---- Calves ----
  { id: 'standing-calf-raise', name: 'Standing Calf Raise Machine', type: 'machine', pattern: 'calves', primary: ['calves'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: false },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', type: 'machine', pattern: 'calves', primary: ['calves'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: false },

  // ---- Conditioning ----
  { id: 'recumbent-bike', name: 'Recumbent Bike', type: 'cardio', pattern: 'conditioning', primary: ['cardio'], secondary: [], complexity: 'simple', joints: [], friendlyFor: ['knee'], mitigation: { knee: 'Low-impact; set the seat so your knees never fully lock or over-bend.' }, common: true },
  { id: 'elliptical', name: 'Elliptical', type: 'cardio', pattern: 'conditioning', primary: ['cardio'], secondary: [], complexity: 'simple', joints: [], friendlyFor: ['knee'], mitigation: { knee: 'Low-impact gliding motion — easy on the knees.' }, common: true },
  { id: 'treadmill-walk', name: 'Treadmill (Incline Walk)', type: 'cardio', pattern: 'conditioning', primary: ['cardio'], secondary: [], complexity: 'simple', joints: ['knee'], friendlyFor: ['knee'], mitigation: { knee: 'Favour brisk incline walking over running to spare the knees.' }, common: true },
  { id: 'stationary-bike', name: 'Stationary Bike', type: 'cardio', pattern: 'conditioning', primary: ['cardio'], secondary: [], complexity: 'simple', joints: [], friendlyFor: ['knee'], mitigation: {}, common: true },
  { id: 'rower', name: 'Rowing Machine', type: 'cardio', pattern: 'conditioning', primary: ['cardio'], secondary: ['upper_back'], complexity: 'moderate', joints: ['spine'], friendlyFor: ['spine'], mitigation: { spine: 'Drive with the legs first and keep a neutral spine; don’t round your back at the catch.' }, common: false },
  { id: 'stairmaster', name: 'Stairmaster', type: 'cardio', pattern: 'conditioning', primary: ['cardio'], secondary: [], complexity: 'moderate', joints: ['knee'], friendlyFor: [], mitigation: {}, common: false }
];

// Importable under Node for the content coverage test; harmless in the browser.
if (typeof module !== 'undefined' && module.exports) module.exports = { MUSCLES, PATTERNS, LIBRARY };
