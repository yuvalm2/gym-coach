// Coverage tests for the visual + instructional content (art.js, guide.js).
// Guards that every machine has a glyph, a detailed illustration and a
// per-exercise guide, and that every muscle has a body-map region.
// Run: node --test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { LIBRARY, MUSCLES } = require('../library.js');
const Art = require('../art.js');
const Guide = require('../guide.js');

const isSvg = (s) => typeof s === 'string'
  && s.trim().startsWith('<svg') && s.trim().endsWith('</svg>')
  && !s.includes('undefined')
  && (s.match(/<svg/g) || []).length === (s.match(/<\/svg>/g) || []).length;

test('every machine has a clean line icon', () => {
  for (const ex of LIBRARY) assert.ok(isSvg(Art.machineArt(ex)), `icon: ${ex.id}`);
});

test('every machine has a clean detailed illustration', () => {
  for (const ex of LIBRARY) assert.ok(isSvg(Art.machineArtDetailed(ex)), `detailed: ${ex.id}`);
});

test('every machine has a complete per-exercise guide', () => {
  for (const ex of LIBRARY) {
    const g = Guide.forExercise(ex);
    assert.ok(g && g.use && g.efficient && g.safe, `guide: ${ex.id}`);
    assert.ok(Guide._GUIDE[ex.id], `guide is exercise-specific, not a fallback: ${ex.id}`);
  }
});

test('every muscle has a body-map region and a blurb', () => {
  for (const key of Object.keys(MUSCLES)) {
    const info = Art.MUSCLE_INFO[key];
    assert.ok(info && info.name && info.blurb, `muscle info: ${key}`);
    const map = Art.bodyMap([key]);
    assert.ok(isSvg(map), `bodyMap svg: ${key}`);
    assert.ok(map.includes('bm-hi'), `bodyMap highlights something: ${key}`);
  }
});

test('exerciseMap and coverageMap render for real data', () => {
  const ex = LIBRARY[0];
  assert.ok(isSvg(Art.exerciseMap(ex.primary, ex.secondary)));
  assert.ok(isSvg(Art.coverageMap({ [ex.primary[0]]: 'done', [Object.keys(MUSCLES)[3]]: 'plan' })));
});
