// Unit tests for the pure workout engine (engine.js).
// Run: node --test   (from the gym-coach folder)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../engine.js');

// --- a small, explicit exercise pool ---------------------------------------
// Two options for lower_push so rotation is observable.
const EXERCISES = [
  { id: 'legpress', name: 'Leg Press', pattern: 'lower_push', primary: ['quads'], secondary: ['glutes'],
    complexity: 'simple', joints: ['knee'], friendlyFor: ['knee'], mitigation: { knee: 'friendly' } },
  { id: 'hacksquat', name: 'Hack Squat', pattern: 'lower_push', primary: ['quads'], secondary: [],
    complexity: 'complex', joints: ['knee'], friendlyFor: [], mitigation: { knee: 'show' } },
  { id: 'chestpress', name: 'Chest Press', pattern: 'upper_push', primary: ['chest'], secondary: ['triceps'],
    complexity: 'simple', joints: ['shoulder'], friendlyFor: ['shoulder'], mitigation: {} },
  { id: 'latpulldown', name: 'Lat Pulldown', pattern: 'upper_pull', primary: ['lats'], secondary: ['biceps'],
    complexity: 'simple', joints: [], friendlyFor: [], mitigation: {} },
  { id: 'crunch', name: 'Cable Crunch', pattern: 'core', primary: ['abs'], secondary: [],
    complexity: 'simple', joints: [], friendlyFor: [], mitigation: {} },
];

const GYM = { machineIds: EXERCISES.map((e) => e.id) };

function baseProfile(over = {}) {
  return Object.assign({
    goal: 'strength', days: 3, cycleIndex: 0, variety: 'fixed',
    avoidComplex: false, jointMode: 'friendly',
    kneeCare: false, backCare: false, shoulderCare: false,
    avoid: [], favorites: [],
  }, over);
}

// --- templateDays -----------------------------------------------------------

test('templateDays returns the goal/day template when present', () => {
  const preset = Engine.GOAL_PRESETS.strength;
  const days = Engine.templateDays('strength', 3, preset);
  assert.equal(days.length, 3);
  assert.equal(days[0].name, 'Full body A');
});

test('templateDays falls back to generic full-body for an unknown day count', () => {
  const preset = Engine.GOAL_PRESETS.strength;
  const days = Engine.templateDays('strength', 5, preset); // no 5-day template
  assert.ok(days.length >= 1);
  assert.ok(days.every((d) => d.name.startsWith('Full body')));
});

// --- evaluateExercise -------------------------------------------------------

test('avoidComplex rejects complex exercises', () => {
  const ex = EXERCISES.find((e) => e.id === 'hacksquat');
  const res = Engine.evaluateExercise(ex, baseProfile({ avoidComplex: true }));
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'complex');
});

test('jointMode "avoid" blocks an exercise loading a cared-for joint', () => {
  const ex = EXERCISES.find((e) => e.id === 'legpress'); // joints: ['knee']
  const res = Engine.evaluateExercise(ex, baseProfile({ kneeCare: true, jointMode: 'avoid' }));
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'joint:knee');
});

test('jointMode "friendly" allows a friendly exercise and surfaces its cue', () => {
  const ex = EXERCISES.find((e) => e.id === 'legpress'); // friendlyFor knee, mitigation.knee
  const res = Engine.evaluateExercise(ex, baseProfile({ kneeCare: true, jointMode: 'friendly' }));
  assert.equal(res.ok, true);
  assert.equal(res.cues.knee, 'friendly');
});

test('jointMode "friendly" blocks a non-friendly exercise on a cared-for joint', () => {
  const ex = EXERCISES.find((e) => e.id === 'hacksquat'); // not friendlyFor knee
  const res = Engine.evaluateExercise(ex, baseProfile({ kneeCare: true, jointMode: 'friendly' }));
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'joint:knee');
});

// --- generateSession --------------------------------------------------------

test('generateSession fills one exercise per slot from available machines', () => {
  const session = Engine.generateSession(baseProfile(), GYM, EXERCISES, []);
  const slots = session.items.length;
  assert.equal(slots, 4); // strength day A: lower_push, upper_push, upper_pull, core
  assert.ok(session.items.every((it) => it.missing || it.exercise));
});

test('a slot with no available machine is marked missing', () => {
  const gymWithoutPull = { machineIds: ['legpress', 'chestpress', 'crunch'] };
  const session = Engine.generateSession(baseProfile(), gymWithoutPull, EXERCISES, []);
  const pull = session.items.find((it) => it.pattern === 'upper_pull');
  assert.equal(pull.missing, true);
});

test('rotation prefers a never-used machine over a recently-used one', () => {
  // hacksquat was used last session; legpress never used -> legpress should win.
  const recent = [{ entries: [{ exerciseId: 'hacksquat' }] }];
  const session = Engine.generateSession(baseProfile(), GYM, EXERCISES, recent);
  const lower = session.items.find((it) => it.pattern === 'lower_push');
  assert.equal(lower.exercise.id, 'legpress');
  // The other option is still offered as an alternative.
  assert.ok(lower.alternatives.includes('hacksquat'));
});

test('avoided machines are never selected', () => {
  const session = Engine.generateSession(baseProfile({ avoid: ['legpress'] }), GYM, EXERCISES, []);
  const lower = session.items.find((it) => it.pattern === 'lower_push');
  assert.equal(lower.exercise.id, 'hacksquat'); // legpress excluded -> falls to the other
});

test('weight_loss goal builds supersets (paired blocks)', () => {
  // Give every weight_loss slot a machine so the day fills, then check pairing.
  const wlExercises = EXERCISES.concat([
    { id: 'rowmachine', name: 'Row', pattern: 'upper_pull', primary: ['lats'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {} },
    { id: 'legcurl', name: 'Leg Curl', pattern: 'lower_pull', primary: ['hams'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {} },
    { id: 'bike', name: 'Bike', pattern: 'conditioning', primary: ['cardio'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {} },
  ]);
  const gym = { machineIds: wlExercises.map((e) => e.id) };
  const session = Engine.generateSession(baseProfile({ goal: 'weight_loss' }), gym, wlExercises, []);
  const supersets = session.blocks.filter((b) => b.type === 'superset');
  assert.ok(supersets.length >= 1, 'weight_loss should produce at least one superset block');
  assert.ok(session.blocks.some((b) => b.type === 'conditioning'), 'conditioning becomes a finisher block');
});
