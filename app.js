// app.js — UI, state, and wiring. Plain DOM, event delegation, no framework.

const DEFAULT_PROFILE = {
  goal: 'weight_loss', days: 3,
  kneeCare: true, backCare: true, shoulderCare: false, avoidComplex: true,
  jointMode: 'friendly', variety: 'expand',
  favorites: ['leg-press', 'lat-pulldown', 'bench-press', 'arnold-press', 'ab-crunch-machine'], avoid: [], cycleIndex: 0
};

const App = {
  profile: null, gyms: [], sessions: [], customExercises: [],
  currentGymId: null, editingGymId: null, view: 'today',
  plan: null, log: {},
  aiKeySet: false, photoDraft: null,
  exPhotoIds: []   // exercise ids that have a user-attached photo (meta: exphoto:<id>)
};

// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
const val = (sel) => { const e = $(sel); return e ? String(e.value).trim() : ''; };
const uid = (p) => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const allExercises = () => LIBRARY.concat(App.customExercises);
const exById = (id) => allExercises().find((e) => e.id === id);
const gymById = (id) => App.gyms.find((g) => g.id === id);
const currentGym = () => gymById(App.currentGymId) || App.gyms[0] || null;
const muscleNames = (keys) => (keys || []).map((k) => MUSCLES[k] || k).join(', ');
const muscleTag = (k, muted) => `<button class="mtag${muted ? ' muted' : ''}" data-muscle="${esc(k)}">${esc(MUSCLES[k] || k)}</button>`;
const muscleTags = (keys, muted) => (keys || []).map((k) => muscleTag(k, muted)).join('<span class="msep">, </span>');
const hasExPhoto = (id) => App.exPhotoIds.indexOf(id) >= 0;
const fmtDate = (iso) => new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const saveProfile = () => DB.setMeta('profile', App.profile);
const saveGym = (g) => DB.put('gyms', g);

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
}

// ---------- plan ----------
function generatePlan() {
  const gym = currentGym();
  if (!gym) { App.plan = null; return; }
  const recent = App.sessions.filter((s) => s.gymId === gym.id).sort((a, b) => b.date.localeCompare(a.date));
  App.plan = Engine.generateSession(App.profile, gym, allExercises(), recent);
  App.plan.items.forEach((it, i) => {
    it._i = i;
    if (it.exercise) { it.options = [it.exercise.id].concat(it.alternatives || []); it.optIndex = 0; }
  });
}

function swap(idx) {
  const it = App.plan && App.plan.items[idx];
  if (!it || !it.options || it.options.length < 2) return;
  it.optIndex = (it.optIndex + 1) % it.options.length;
  it.exercise = exById(it.options[it.optIndex]);
  it.cues = Engine.evaluateExercise(it.exercise, App.profile).cues;
  it.isNew = false;
  render();
}

function finishWorkout() {
  if (!App.plan) return;
  const gym = currentGym();
  const entries = [];
  App.plan.items.forEach((it) => {
    if (it.missing || !it.exercise) return;
    const id = it.exercise.id;
    const logged = App.log[id] || [];
    let sets;
    if (it.pattern === 'conditioning') {
      sets = [{ minutes: (logged[0] && logged[0].minutes) != null ? logged[0].minutes : null }];
    } else {
      sets = [];
      for (let i = 0; i < it.sets; i++) { const l = logged[i] || {}; sets.push({ weight: l.weight != null ? l.weight : null, reps: l.reps != null ? l.reps : null }); }
    }
    entries.push({ exerciseId: id, name: it.exercise.name, pattern: it.pattern, sets });
  });
  if (!entries.length) return;
  const session = { id: uid('s'), date: new Date().toISOString(), gymId: gym.id, goal: App.profile.goal, templateName: App.plan.templateName, dayIndex: App.plan.dayIndex, entries };
  DB.put('sessions', session).then(() => {
    App.sessions.push(session);
    App.profile.cycleIndex = (App.profile.cycleIndex || 0) + 1;
    saveProfile();
    App.log = {};
    generatePlan();
    render();
    toast('Workout saved — nice work! 💪');
  });
}

// ---------- views ----------
function section(title, body) { return `<h1 class="vtitle">${esc(title)}</h1>${body}`; }
function infoCard(html) { return `<div class="card info">${html}</div>`; }
function emptyState(title, text, btn, action) {
  return `<div class="card empty"><div class="empty-t">${esc(title)}</div><p class="muted">${esc(text)}</p><button class="primary" data-action="${action}">${esc(btn)}</button></div>`;
}

function viewToday() {
  const gym = currentGym();
  if (!App.gyms.length) return section('Today', emptyState('No gyms yet', 'Add a gym and tick the machines it has — then I’ll build your session.', 'Set up a gym', 'go-gyms'));
  const opts = App.gyms.map((g) => `<option value="${g.id}" ${g.id === gym.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('');
  let body = `<div class="row gymsel"><label>Gym</label><select data-change="today-gym">${opts}</select></div>`;
  if (!gym.machineIds || !gym.machineIds.length) { body += infoCard('No machines marked at this gym yet. Open <b>Gyms</b> → edit, and tick what’s available.'); return section('Today', body); }
  const p = App.plan;
  if (!p) { body += infoCard('Couldn’t build a session for this gym.'); return section('Today', body); }
  const pre = p.preset;
  body += `<div class="plan-meta"><span class="pill accent">${esc(p.templateName)}</span><span class="pill">${esc(pre.label)}</span><span class="pill">${pre.repLow}–${pre.repHigh} reps</span><span class="pill">${pre.restSec}s rest</span></div>`;
  body += `<div id="covSlot">${renderCoverage()}</div>`;
  body += p.blocks.map(renderBlock).join('');
  body += `<button class="primary big" data-action="finish">Finish &amp; save workout</button>`;
  return section('Today', body);
}

function renderBlock(b) {
  const head = b.type === 'superset' ? `Superset ${b.label} <span class="muted">· alternate, short rest</span>`
    : b.type === 'conditioning' ? 'Finisher'
    : `Exercise ${b.label}`;
  return `<div class="block"><div class="block-head">${head}</div>${b.items.map(renderItem).join('')}</div>`;
}

function renderItem(it) {
  if (it.missing) return `<div class="card miss">No available option for <b>${esc(PATTERNS[it.pattern] || it.pattern)}</b>. Add one in Gyms.</div>`;
  const ex = it.exercise;
  const cues = Object.entries(it.cues || {}).map(([j, txt]) => `<div class="cue">⚠ <b>${j === 'spine' ? 'back' : j}:</b> ${esc(txt)}</div>`).join('');
  const newBadge = it.isNew ? '<span class="badge new">NEW · try it</span>' : '';
  const swapBtn = (it.options && it.options.length > 1) ? `<button class="mini" data-action="swap" data-idx="${it._i}">↻ swap</button>` : '';
  let logUI;
  if (it.pattern === 'conditioning') {
    const v = (App.log[ex.id] && App.log[ex.id][0] && App.log[ex.id][0].minutes != null) ? App.log[ex.id][0].minutes : '';
    logUI = `<div class="setrow"><span class="setlabel">Time</span><input class="num" type="number" inputmode="numeric" placeholder="min" data-field="minutes" data-ex="${ex.id}" data-set="0" value="${v}"><span class="muted small">min · moderate–hard intervals</span></div>`;
  } else {
    let rows = '';
    for (let i = 0; i < it.sets; i++) {
      const l = (App.log[ex.id] && App.log[ex.id][i]) || {};
      rows += `<div class="setrow"><span class="setlabel">Set ${i + 1}</span>`
        + `<input class="num" type="number" inputmode="decimal" placeholder="kg" data-field="weight" data-ex="${ex.id}" data-set="${i}" value="${l.weight != null ? l.weight : ''}">`
        + `<input class="num" type="number" inputmode="numeric" placeholder="${it.repLow}–${it.repHigh}" data-field="reps" data-ex="${ex.id}" data-set="${i}" value="${l.reps != null ? l.reps : ''}"></div>`;
    }
    logUI = rows;
  }
  return `<div class="card ex">
    <div class="ex-top">
      <button class="ex-art" data-action="ex-sheet" data-ex="${ex.id}" aria-label="Details for ${esc(ex.name)}">${Art.machineArt(ex)}</button>
      <div class="ex-main"><div class="ex-name">${esc(ex.name)} ${newBadge}</div>
      <div class="ex-sub">${muscleTags(ex.primary)}${ex.secondary && ex.secondary.length ? `<span class="muted"> · </span>${muscleTags(ex.secondary, true)}` : ''}</div></div>
      <div class="ex-actions"><button class="mini" data-action="ex-sheet" data-ex="${ex.id}">ⓘ&nbsp;Guide</button><span class="type-badge">${esc(ex.type)}</span>${swapBtn}</div>
    </div>${cues}<div class="sets">${logUI}</div></div>`;
}

// ---------- session muscle coverage ----------
// State per muscle: 'done' (logged a set on an exercise hitting it),
// 'plan' (in today's session, not logged yet), or absent = not in today's plan.
function coverageState() {
  const p = App.plan;
  const st = {};
  if (!p) return st;
  const musclesOf = (ex) => (ex.primary || []).concat(ex.secondary || []);
  p.items.forEach((it) => { if (!it.missing && it.exercise) musclesOf(it.exercise).forEach((m) => { if (!st[m]) st[m] = 'plan'; }); });
  p.items.forEach((it) => {
    if (it.missing || !it.exercise) return;
    const logged = (App.log[it.exercise.id] || []).some((s) => s && (s.weight != null || s.reps != null || s.minutes != null));
    if (logged) musclesOf(it.exercise).forEach((m) => { st[m] = 'done'; });
  });
  return st;
}

function renderCoverage() {
  const st = coverageState();
  const keys = Object.keys(MUSCLES);
  const done = keys.filter((k) => st[k] === 'done');
  const planned = keys.filter((k) => st[k] === 'plan');
  const inPlay = done.length + planned.length;
  if (!inPlay) return '';
  const still = planned.map((k) => MUSCLES[k]).join(', ');
  return `<div class="card coverage">
    <div class="cov-top"><span class="cov-h">Today's muscle coverage</span><span class="cov-count">${done.length}<small> / ${inPlay} worked</small></span></div>
    <div class="cov-body">
      <div class="cov-map">${Art.coverageMap(st)}</div>
      <div class="cov-side">
        <div class="cov-leg"><span class="dot done"></span>Worked this visit</div>
        <div class="cov-leg"><span class="dot plan"></span>In the plan — not yet</div>
        <div class="cov-leg"><span class="dot off"></span>Not in today's plan</div>
        ${planned.length ? `<p class="cov-still">Still to hit: <b>${esc(still)}</b></p>` : `<p class="cov-still done">All planned muscles worked 💪</p>`}
      </div>
    </div>
  </div>`;
}
function refreshCoverage() { const s = $('#covSlot'); if (s) s.innerHTML = renderCoverage(); }

// ---------- muscle tooltip (single muscle) ----------
let mpopEl = null;
function ensureMpop() {
  if (!mpopEl) { mpopEl = document.createElement('div'); mpopEl.className = 'mpop'; mpopEl.hidden = true; document.body.appendChild(mpopEl); }
  return mpopEl;
}
function openMusclePopover(key, target) {
  const info = Art.MUSCLE_INFO[key];
  if (!info) return;
  const el = ensureMpop();
  if (el.dataset.key === key && !el.hidden) { closeMusclePopover(); return; }
  el.dataset.key = key;
  el.innerHTML = `<div class="mpop-h">${esc(info.name)}</div><div class="mpop-map">${Art.bodyMap([key])}</div><div class="mpop-d">${esc(info.blurb)}</div>`;
  el.hidden = false;
  const r = target.getBoundingClientRect();
  const w = el.offsetWidth, h = el.offsetHeight;
  let left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8));
  let top = r.bottom + 8;
  if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
  el.style.left = left + 'px'; el.style.top = top + 'px';
}
function closeMusclePopover() { if (mpopEl) { mpopEl.hidden = true; mpopEl.dataset.key = ''; } }

// ---------- exercise detail sheet ----------
let sheetUrl = null;
function ensureSheet() {
  let el = $('#sheet');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'sheet'; el.className = 'sheet-overlay'; el.hidden = true;
  el.addEventListener('click', (e) => {
    const mus = e.target.closest('[data-muscle]');
    if (mus) { e.stopPropagation(); openMusclePopover(mus.dataset.muscle, mus); return; }
    if (e.target === el) { closeSheet(); return; }
    const t = e.target.closest('[data-action]');
    if (!t) return;
    if (t.dataset.action === 'sheet-close') closeSheet();
    else if (t.dataset.action === 'ex-photo-remove') removeExPhoto(t.dataset.ex);
  });
  el.addEventListener('change', (e) => {
    if (e.target.id !== 'exPhotoFile') return;
    const f = e.target.files && e.target.files[0], id = e.target.dataset.ex;
    e.target.value = '';
    if (f) handleExPhoto(f, id);
  });
  document.body.appendChild(el);
  return el;
}
function openSheet(exId) {
  const ex = exById(exId);
  if (!ex) return;
  closeMusclePopover();
  renderSheetInto(ensureSheet(), ex);
  $('#sheet').hidden = false;
  document.body.classList.add('modal-open');
}
function closeSheet() {
  const el = $('#sheet'); if (el) el.hidden = true;
  document.body.classList.remove('modal-open');
  if (sheetUrl) { URL.revokeObjectURL(sheetUrl); sheetUrl = null; }
}
function renderSheetInto(el, ex) {
  const g = Guide.forExercise(ex);
  const photo = hasExPhoto(ex.id);
  el.innerHTML = `<div class="sheet-card" role="dialog" aria-label="${esc(ex.name)}">
    <button class="sheet-x" data-action="sheet-close" aria-label="Close">✕</button>
    <div class="sheet-head"><span class="sname">${esc(ex.name)}</span><span class="type-badge">${esc(ex.type)}</span></div>
    <div class="sheet-vis">
      <div class="sh-ill" id="shIll">${Art.machineArtDetailed(ex) || Art.machineArt(ex)}</div>
      <div class="sh-map">${Art.exerciseMap(ex.primary, ex.secondary)}
        <div class="worklist"><span class="wp">${esc(muscleNames(ex.primary))}</span>${ex.secondary && ex.secondary.length ? `<span class="ws">${esc(muscleNames(ex.secondary))}</span>` : ''}</div>
      </div>
    </div>
    <div class="sh-photo">
      <label class="mini filebtn">📷 ${photo ? 'Replace photo' : 'Add your photo'}<input type="file" accept="image/*" capture="environment" id="exPhotoFile" data-ex="${ex.id}" hidden></label>
      ${photo ? `<button class="mini danger" data-action="ex-photo-remove" data-ex="${ex.id}">Remove</button>` : '<span class="muted small">a real photo, stored on this device</span>'}
    </div>
    <div class="instr">
      <div class="ins"><span class="ik">How to use</span><p>${esc(g.use)}</p></div>
      <div class="ins"><span class="ik">Do it well</span><p>${esc(g.efficient)}</p></div>
      <div class="ins safe"><span class="ik">Stay safe</span><p>${esc(g.safe)}</p></div>
    </div>
  </div>`;
  if (photo) loadExPhoto(ex.id);
}
async function loadExPhoto(id) {
  const blob = await DB.getMeta('exphoto:' + id, null);
  if (!blob) return;
  if (sheetUrl) URL.revokeObjectURL(sheetUrl);
  sheetUrl = URL.createObjectURL(blob);
  const ill = $('#shIll');
  if (ill) ill.innerHTML = `<img class="sh-photo-img" src="${sheetUrl}" alt="${esc((exById(id) || {}).name || 'machine')}">`;
}
async function handleExPhoto(file, id) {
  try {
    const photo = await Identify.preparePhoto(file);   // reuse the downscaler, no API call
    await DB.setMeta('exphoto:' + id, photo.blob);
    if (!hasExPhoto(id)) { App.exPhotoIds.push(id); await DB.setMeta('exPhotoIds', App.exPhotoIds); }
    const ex = exById(id); if (ex) renderSheetInto(ensureSheet(), ex);
    toast('Photo saved on this device');
  } catch (err) { toast('Couldn’t read that image'); }
}
async function removeExPhoto(id) {
  await DB.delete('meta', 'exphoto:' + id);
  App.exPhotoIds = App.exPhotoIds.filter((x) => x !== id);
  await DB.setMeta('exPhotoIds', App.exPhotoIds);
  const ex = exById(id); if (ex) renderSheetInto(ensureSheet(), ex);
  toast('Photo removed');
}

function viewGyms() {
  let body = `<div class="row addgym"><input id="newGymName" placeholder="Gym name (e.g. Home, Holmes Place)"><button class="primary" data-action="add-gym">Add</button></div>`;
  if (!App.gyms.length) body += infoCard('Add a gym to begin. New gyms arrive pre-filled with common machines — just untick anything yours doesn’t have.');
  body += App.gyms.map((g) => {
    const sel = g.id === App.currentGymId;
    return `<div class="card gym ${sel ? 'sel' : ''}">
      <div class="gym-top">
        <div><div class="ex-name">${esc(g.name)} ${sel ? '<span class="badge">current</span>' : ''}</div><div class="muted">${(g.machineIds || []).length} machines</div></div>
        <div class="ex-actions">
          ${sel ? '' : `<button class="mini" data-action="select-gym" data-id="${g.id}">use</button>`}
          <button class="mini" data-action="edit-gym" data-id="${g.id}">${App.editingGymId === g.id ? 'close' : 'edit'}</button>
          <button class="mini danger" data-action="delete-gym" data-id="${g.id}">del</button>
        </div>
      </div>${App.editingGymId === g.id ? renderGymEditor(g) : ''}</div>`;
  }).join('');
  return section('Gyms', body);
}

function renderGymEditor(g) {
  const avail = new Set(g.machineIds || []);
  const favs = new Set(App.profile.favorites || []);
  const avoids = new Set(App.profile.avoid || []);
  const all = allExercises();
  let html = '<div class="editor">';
  Object.keys(PATTERNS).forEach((pat) => {
    const list = all.filter((e) => e.pattern === pat);
    if (!list.length) return;
    html += `<div class="grp-title">${esc(PATTERNS[pat])}</div>`;
    html += list.map((e) => {
      const on = avail.has(e.id), fav = favs.has(e.id), av = avoids.has(e.id);
      return `<div class="mrow">
        <label class="chk"><input type="checkbox" data-change="avail" data-id="${e.id}" ${on ? 'checked' : ''}> <span class="mart">${Art.machineArt(e)}</span> <span>${esc(e.name)}</span></label>
        <div class="mrow-actions"><button class="tag" data-action="ex-sheet" data-ex="${e.id}" title="details">ⓘ</button>${on ? `<button class="tag ${fav ? 'on' : ''}" data-action="fav" data-id="${e.id}" title="favourite">★</button><button class="tag ${av ? 'on danger' : ''}" data-action="avoid" data-id="${e.id}" title="never suggest">🚫</button>` : ''}</div>
      </div>`;
    }).join('');
  });
  html += renderPhotoSection(g);
  const muscleOpts = Object.entries(MUSCLES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  const patOpts = Object.entries(PATTERNS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  html += `<div class="grp-title">Add a custom machine</div><div class="custom">
    <input id="cName" placeholder="Machine name">
    <select id="cPattern">${patOpts}</select>
    <select id="cMuscle">${muscleOpts}</select>
    <select id="cType"><option value="machine">machine</option><option value="cable">cable</option><option value="free">free weight</option><option value="bodyweight">bodyweight</option><option value="cardio">cardio</option></select>
    <button class="primary" data-action="add-custom" data-gym="${g.id}">Add machine</button></div>`;
  html += '</div>';
  return html;
}

// ---------- photo → identify ----------
function renderPhotoSection(g) {
  const d = App.photoDraft && App.photoDraft.gymId === g.id ? App.photoDraft : null;
  let inner;
  if (!App.aiKeySet) {
    inner = `<p class="muted small">Snap a machine and AI tags it for the catalog (muscles, joints, cues). Needs your Claude API key — add it in Profile.</p>
      <div class="row"><button class="mini" data-action="go-profile">Open Profile</button></div>`;
  } else if (!d) {
    inner = `<label class="mini filebtn">📷 Photo → identify<input type="file" accept="image/*" capture="environment" id="photoFile" data-gym="${g.id}" hidden></label>
      <span class="muted small">Identified with Claude (${Identify.MODEL}); you review before anything is added.</span>`;
  } else if (d.status === 'busy') {
    inner = `<p class="muted">🔎 Identifying…</p>`;
  } else if (d.status === 'error') {
    inner = `<div class="cue">⚠ ${esc(d.error)}</div><div class="row"><button class="mini" data-action="photo-discard">OK</button></div>`;
  } else {
    inner = renderPhotoReview(d);
  }
  return `<div class="grp-title">Add by photo</div><div class="custom photo">${inner}</div>`;
}

function renderPhotoReview(d) {
  const r = d.result;
  const img = `<img class="photothumb" src="${d.blobUrl}" alt="machine photo">`;
  const conf = `<span class="pill ${r.confidence === 'high' ? 'accent' : ''}">confidence: ${esc(r.confidence)}</span>`;
  const matched = r.match_id ? exById(r.match_id) : null;
  if (matched && !d.asNew) {
    return `${img}<div class="rev">${conf}
      <p>Looks like <b>${esc(matched.name)}</b> — already in the catalog.</p>
      <div class="row wrap"><button class="primary" data-action="photo-match">✓ Tick it for this gym</button>
      <button class="mini" data-action="photo-asnew">Add as new instead</button>
      <button class="mini" data-action="photo-discard">Discard</button></div></div>`;
  }
  const sel = (field, opts, cur) => `<select data-change="draft" data-field="${field}">`
    + opts.map((o) => `<option value="${o.v}" ${String(cur) === String(o.v) ? 'selected' : ''}>${esc(o.t)}</option>`).join('') + '</select>';
  const patOpts = Object.entries(PATTERNS).map(([k, v]) => ({ v: k, t: v }));
  const typeOpts = ['machine', 'cable', 'free', 'bodyweight', 'cardio'].map((t) => ({ v: t, t }));
  const cxOpts = ['simple', 'moderate', 'complex'].map((t) => ({ v: t, t }));
  const cues = Object.entries(r.mitigation || {}).filter(([, txt]) => txt)
    .map(([j, txt]) => `<div class="cue">⚠ <b>${j === 'spine' ? 'back' : j}:</b> ${esc(txt)}</div>`).join('');
  const tip = r.better_photo ? `<p class="muted small">📷 For a surer ID: ${esc(r.better_photo)}</p>` : '';
  return `${img}<div class="rev">${conf}
    <input data-change="draft" data-field="name" value="${esc(r.name)}">
    ${sel('pattern', patOpts, r.pattern)}${sel('type', typeOpts, r.type)}${sel('complexity', cxOpts, r.complexity)}
    <div class="ex-sub">${esc(muscleNames(r.primary))}${(r.secondary || []).length ? ` <span class="muted">· ${esc(muscleNames(r.secondary))}</span>` : ''}</div>
    ${cues}${tip}
    <div class="row wrap"><button class="primary" data-action="photo-accept">Add to catalog + this gym</button>
    <button class="mini" data-action="photo-discard">Discard</button></div></div>`;
}

async function handlePhotoFile(file, gymId) {
  const key = await DB.getMeta('anthropicKey', null);
  if (!key) { toast('Add your Claude API key in Profile first'); return; }
  clearPhotoDraft();
  App.photoDraft = { gymId, status: 'busy' };
  render();
  try {
    const photo = await Identify.preparePhoto(file);
    const result = await Identify.identify(key, photo.base64, { exercises: allExercises(), profile: App.profile });
    App.photoDraft = { gymId, status: 'review', result, blob: photo.blob, blobUrl: URL.createObjectURL(photo.blob) };
  } catch (err) {
    const msg = err && err.status === 401 ? 'API key rejected — check it in Profile.'
      : err && err.status === 429 ? 'Rate-limited — try again in a minute.'
      : !navigator.onLine ? 'No connection — photo ID needs internet.'
      : 'Identification failed: ' + (err && err.message ? err.message : err);
    App.photoDraft = { gymId, status: 'error', error: msg };
  }
  render();
}

function acceptPhotoDraft() {
  const d = App.photoDraft;
  if (!d || d.status !== 'review') return;
  const r = d.result;
  const mitigation = {};
  Object.entries(r.mitigation || {}).forEach(([j, txt]) => { if (txt) mitigation[j] = txt; });
  const ex = {
    id: uid('ex'), name: r.name, type: r.type, pattern: r.pattern,
    primary: r.primary, secondary: r.secondary || [], complexity: r.complexity,
    joints: r.joints || [], friendlyFor: r.friendly_for || [], mitigation,
    common: false, custom: true, photo: d.blob
  };
  App.customExercises.push(ex); DB.put('exercises', ex);
  const g = gymById(d.gymId);
  if (g) { const set = new Set(g.machineIds || []); set.add(ex.id); g.machineIds = Array.from(set); saveGym(g); }
  clearPhotoDraft();
  App.plan = null; render(); toast('Machine added from photo');
}

function clearPhotoDraft() {
  if (App.photoDraft && App.photoDraft.blobUrl) URL.revokeObjectURL(App.photoDraft.blobUrl);
  App.photoDraft = null;
}

function viewHistory() {
  if (!App.sessions.length) return section('History', emptyState('No workouts yet', 'Finish a session on the Today tab and it’ll appear here.', 'Go to Today', 'go-today'));
  const sorted = App.sessions.slice().sort((a, b) => b.date.localeCompare(a.date));
  const body = sorted.map((s) => {
    const gym = gymById(s.gymId);
    const lines = s.entries.map((e) => `<li>${esc(e.name)} <span class="muted">${esc(bestSet(e))}</span></li>`).join('');
    return `<details class="card hist"><summary><b>${esc(fmtDate(s.date))}</b> · ${esc(gym ? gym.name : '—')} <span class="muted">· ${esc(s.templateName || '')}</span></summary><ul class="histlist">${lines}</ul></details>`;
  }).join('');
  return section('History', body);
}

function bestSet(e) {
  if (!e.sets || !e.sets.length) return '';
  if (e.pattern === 'conditioning') { const m = e.sets[0] && e.sets[0].minutes; return m ? m + ' min' : ''; }
  let best = null;
  e.sets.forEach((s) => { if (s.weight != null || s.reps != null) { const v = (s.weight || 0) * (s.reps || 0); if (!best || v > best.v) best = { v, w: s.weight, r: s.reps }; } });
  if (!best) return '';
  return `${best.w ? best.w + 'kg × ' : ''}${best.r != null ? best.r + ' reps' : ''}`.trim();
}

function viewProfile() {
  const p = App.profile;
  const sel = (field, opts) => `<select data-change="profile" data-field="${field}">` + opts.map((o) => `<option value="${o.v}" ${String(p[field]) === String(o.v) ? 'selected' : ''}>${o.t}</option>`).join('') + '</select>';
  const toggle = (field, label) => `<label class="chk big"><input type="checkbox" data-change="profile" data-field="${field}" ${p[field] ? 'checked' : ''}> ${label}</label>`;
  const body = `
    <div class="card">
      <div class="frow"><label>Training goal</label>${sel('goal', [{ v: 'weight_loss', t: 'Weight loss / conditioning' }, { v: 'hypertrophy', t: 'Muscle growth' }, { v: 'strength', t: 'Strength' }, { v: 'general', t: 'General fitness' }])}</div>
      <div class="frow"><label>Days / week</label>${sel('days', [{ v: 2, t: '2' }, { v: 3, t: '3' }, { v: 4, t: '4' }, { v: 5, t: '5' }])}</div>
      <div class="frow"><label>Variety</label>${sel('variety', [{ v: 'expand', t: 'Gradually expand' }, { v: 'fixed', t: 'Only what I approve' }, { v: 'surprise', t: 'Surprise me more' }])}</div>
      <div class="frow"><label>Joint handling</label>${sel('jointMode', [{ v: 'friendly', t: 'Joint-friendly + cues' }, { v: 'avoid', t: 'Avoid risky entirely' }, { v: 'show', t: 'Show all, flag risk' }])}</div>
    </div>
    <div class="card">
      <div class="grp-title">Go easy on…</div>
      ${toggle('kneeCare', 'Knees')}${toggle('backCare', 'Lower back')}${toggle('shoulderCare', 'Shoulders')}
      <div class="grp-title">Other</div>
      ${toggle('avoidComplex', 'Avoid complex lifts (barbell squat, deadlift, etc.)')}
    </div>
    <div class="card">
      <div class="grp-title">AI photo identification</div>
      <p class="muted">Photograph a machine in <b>Gyms → edit → Add by photo</b> and Claude tags it for your catalog. Bring your own Anthropic API key — it's stored only in this app on this device and sent only to api.anthropic.com. Rough cost: ~1¢ per photo (model: ${esc(Identify.MODEL)}).</p>
      ${App.aiKeySet
        ? `<div class="row"><span class="pill accent">Key saved on this device ✓</span><button class="mini danger" data-action="remove-ai-key">Remove</button></div>`
        : `<div class="row"><input id="aiKey" type="password" placeholder="sk-ant-…" autocomplete="off"><button class="mini" data-action="save-ai-key">Save</button></div>`}
    </div>
    <div class="card">
      <div class="grp-title">Your data</div>
      <p class="muted">Everything stays on this device. Export a backup, or import one to move to another phone.</p>
      <div class="row"><button class="mini" data-action="export">Export backup</button>
      <label class="mini filebtn">Import<input type="file" accept="application/json" id="importFile" hidden></label></div>
    </div>`;
  return section('Profile', body);
}

// ---------- mutations ----------
function addGym() {
  const name = val('#newGymName'); if (!name) return;
  const common = LIBRARY.filter((e) => e.common).map((e) => e.id);
  const gym = { id: uid('g'), name, machineIds: common };
  App.gyms.push(gym); saveGym(gym);
  if (!App.currentGymId) { App.currentGymId = gym.id; DB.setMeta('currentGymId', gym.id); }
  App.editingGymId = gym.id; App.plan = null; render();
}
function deleteGym(id) {
  if (!confirm('Delete this gym?')) return;
  DB.delete('gyms', id);
  App.gyms = App.gyms.filter((g) => g.id !== id);
  if (App.currentGymId === id) { App.currentGymId = App.gyms[0] ? App.gyms[0].id : null; DB.setMeta('currentGymId', App.currentGymId); }
  if (App.editingGymId === id) App.editingGymId = null;
  App.plan = null; render();
}
function toggleAvail(id, checked) {
  const g = gymById(App.editingGymId); if (!g) return;
  const set = new Set(g.machineIds || []);
  if (checked) set.add(id); else set.delete(id);
  g.machineIds = Array.from(set); saveGym(g); App.plan = null; render();
}
function toggleSet(field, id) {
  const arr = App.profile[field] || [];
  App.profile[field] = arr.includes(id) ? arr.filter((x) => x !== id) : arr.concat(id);
  saveProfile(); if (field === 'avoid') App.plan = null; render();
}
function addCustom(gymId) {
  const name = val('#cName'); if (!name) return;
  const ex = { id: uid('ex'), name, type: val('#cType') || 'machine', pattern: val('#cPattern') || 'upper_push', primary: [val('#cMuscle') || 'chest'], secondary: [], complexity: 'simple', joints: [], friendlyFor: [], mitigation: {}, common: false, custom: true };
  App.customExercises.push(ex); DB.put('exercises', ex);
  const g = gymById(gymId); if (g) { const set = new Set(g.machineIds || []); set.add(ex.id); g.machineIds = Array.from(set); saveGym(g); }
  App.plan = null; render(); toast('Machine added');
}
function setProfileField(field, elm) {
  const bools = ['kneeCare', 'backCare', 'shoulderCare', 'avoidComplex'];
  if (bools.includes(field)) App.profile[field] = elm.checked;
  else if (field === 'days') App.profile.days = parseInt(elm.value, 10);
  else App.profile[field] = elm.value;
  saveProfile(); App.plan = null;
}

function exportData() {
  // Photo blobs don't survive JSON; the backup carries everything except photos.
  const data = { version: 1, exportedAt: new Date().toISOString(), profile: App.profile, gyms: App.gyms, sessions: App.sessions, customExercises: App.customExercises.map(({ photo, ...rest }) => rest) };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'gym-coach-backup.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function importData(file) {
  try {
    const data = JSON.parse(await file.text());
    await DB.setMeta('profile', Object.assign({}, DEFAULT_PROFILE, data.profile || {}));
    await DB.clear('gyms'); for (const g of data.gyms || []) await DB.put('gyms', g);
    await DB.clear('sessions'); for (const s of data.sessions || []) await DB.put('sessions', s);
    await DB.clear('exercises'); for (const e of data.customExercises || []) await DB.put('exercises', e);
    await init(); toast('Backup imported');
  } catch (err) { toast('Import failed — invalid file'); }
}

// ---------- events ----------
const handlers = {
  'go-gyms': () => { App.view = 'gyms'; render(); },
  'go-today': () => { App.view = 'today'; App.plan = null; generatePlan(); render(); },
  'add-gym': addGym,
  'select-gym': (t) => { App.currentGymId = t.dataset.id; DB.setMeta('currentGymId', App.currentGymId); App.plan = null; render(); },
  'edit-gym': (t) => { App.editingGymId = App.editingGymId === t.dataset.id ? null : t.dataset.id; render(); },
  'delete-gym': (t) => deleteGym(t.dataset.id),
  'fav': (t) => toggleSet('favorites', t.dataset.id),
  'avoid': (t) => toggleSet('avoid', t.dataset.id),
  'add-custom': (t) => addCustom(t.dataset.gym),
  'swap': (t) => swap(parseInt(t.dataset.idx, 10)),
  'ex-sheet': (t) => openSheet(t.dataset.ex),
  'finish': finishWorkout,
  'export': exportData,
  'go-profile': () => { App.view = 'profile'; render(); },
  'photo-accept': acceptPhotoDraft,
  'photo-match': () => {
    const d = App.photoDraft;
    if (!d || !d.result || !d.result.match_id) return;
    const g = gymById(d.gymId);
    if (g) { const set = new Set(g.machineIds || []); set.add(d.result.match_id); g.machineIds = Array.from(set); saveGym(g); }
    clearPhotoDraft();
    App.plan = null; render(); toast('Ticked for this gym');
  },
  'photo-asnew': () => { if (App.photoDraft) { App.photoDraft.asNew = true; render(); } },
  'photo-discard': () => { clearPhotoDraft(); render(); },
  'save-ai-key': async () => {
    const k = val('#aiKey'); if (!k) return;
    await DB.setMeta('anthropicKey', k);
    App.aiKeySet = true; render(); toast('API key saved on this device');
  },
  'remove-ai-key': async () => {
    await DB.delete('meta', 'anthropicKey');
    App.aiKeySet = false; render(); toast('API key removed');
  }
};

function onClick(e) {
  const m = e.target.closest('[data-muscle]');
  if (m) { e.stopPropagation(); openMusclePopover(m.dataset.muscle, m); return; }
  const t = e.target.closest('[data-action]');
  if (t && handlers[t.dataset.action]) handlers[t.dataset.action](t);
}
function onChange(e) {
  if (e.target.id === 'importFile') { const f = e.target.files && e.target.files[0]; if (f) importData(f); return; }
  if (e.target.id === 'photoFile') {
    const f = e.target.files && e.target.files[0];
    const gymId = e.target.dataset.gym;
    e.target.value = '';
    if (f) handlePhotoFile(f, gymId);
    return;
  }
  const ds = e.target.dataset;
  if (ds.change === 'today-gym') { App.currentGymId = e.target.value; DB.setMeta('currentGymId', App.currentGymId); App.log = {}; App.plan = null; generatePlan(); render(); }
  else if (ds.change === 'avail') toggleAvail(ds.id, e.target.checked);
  else if (ds.change === 'profile') { setProfileField(ds.field, e.target); render(); }
  else if (ds.change === 'draft') { if (App.photoDraft && App.photoDraft.result) App.photoDraft.result[ds.field] = e.target.value; }
}
function onInput(e) {
  const ds = e.target.dataset;
  if (ds.field && ds.ex !== undefined) {
    const id = ds.ex, i = parseInt(ds.set, 10);
    const had = (App.log[id] || []).some((s) => s && (s.weight != null || s.reps != null || s.minutes != null));
    App.log[id] = App.log[id] || [];
    App.log[id][i] = App.log[id][i] || {};
    App.log[id][i][ds.field] = e.target.value === '' ? null : Number(e.target.value);
    const has = App.log[id].some((s) => s && (s.weight != null || s.reps != null || s.minutes != null));
    if (had !== has) refreshCoverage();   // a muscle just flipped worked/not — update the map
  }
}

// ---------- render ----------
function render() {
  closeMusclePopover();   // anchors are about to be replaced
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === App.view));
  const c = $('#app');
  if (App.view === 'today') { if (!App.plan && currentGym()) generatePlan(); c.innerHTML = viewToday(); }
  else if (App.view === 'gyms') c.innerHTML = viewGyms();
  else if (App.view === 'history') c.innerHTML = viewHistory();
  else if (App.view === 'profile') c.innerHTML = viewProfile();
  if (App._lastView !== App.view) { window.scrollTo(0, 0); App._lastView = App.view; }
}

async function init() {
  App.profile = Object.assign({}, DEFAULT_PROFILE, await DB.getMeta('profile', {}));
  App.gyms = await DB.getAll('gyms');
  App.sessions = await DB.getAll('sessions');
  App.customExercises = await DB.getAll('exercises');
  App.currentGymId = await DB.getMeta('currentGymId', null);
  App.aiKeySet = !!(await DB.getMeta('anthropicKey', null));
  App.exPhotoIds = await DB.getMeta('exPhotoIds', []);
  if (!App.currentGymId && App.gyms.length) App.currentGymId = App.gyms[0].id;
  App.plan = null;
  if (App.view === 'today') generatePlan();
  render();
}

function setup() {
  const app = $('#app');
  app.addEventListener('click', onClick);
  app.addEventListener('change', onChange);
  app.addEventListener('input', onInput);
  document.querySelectorAll('.nav-btn').forEach((b) => b.addEventListener('click', () => {
    App.view = b.dataset.view;
    if (App.view === 'today') { App.plan = null; generatePlan(); }
    closeSheet();
    render();
  }));
  // Dismiss the muscle tooltip on an outside tap / Escape / scroll; Escape also closes the sheet.
  document.addEventListener('click', (e) => { if (!e.target.closest('[data-muscle]') && !e.target.closest('.mpop')) closeMusclePopover(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMusclePopover(); closeSheet(); } });
  window.addEventListener('scroll', closeMusclePopover, true);
  window.addEventListener('resize', closeMusclePopover);
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

document.addEventListener('DOMContentLoaded', () => { setup(); init(); });
