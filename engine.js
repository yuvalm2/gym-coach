// engine.js — goal-aware workout generator.
// Pure logic: given a profile + gym + exercise pool + recent history, it returns a session plan.
const Engine = (() => {

  // Each goal parameterises reps / rest / set count / structure / cardio.
  const GOAL_PRESETS = {
    weight_loss: { key: 'weight_loss', label: 'Weight loss / conditioning', repLow: 12, repHigh: 15, restSec: 40, sets: 3, style: 'superset', conditioning: 'finisher' },
    hypertrophy: { key: 'hypertrophy', label: 'Muscle growth', repLow: 8, repHigh: 12, restSec: 75, sets: 4, style: 'straight', conditioning: 'none' },
    strength:    { key: 'strength', label: 'Strength', repLow: 4, repHigh: 6, restSec: 150, sets: 5, style: 'straight', conditioning: 'none' },
    general:     { key: 'general', label: 'General fitness', repLow: 10, repHigh: 12, restSec: 60, sets: 3, style: 'straight', conditioning: 'light' }
  };

  // (goal x days) -> list of day templates. Missing combos fall back to generic full-body.
  const TEMPLATES = {
    weight_loss: {
      3: [
        { name: 'Full body A', slots: ['lower_push', 'upper_pull', 'upper_push', 'lower_pull', 'core', 'conditioning'] },
        { name: 'Full body B', slots: ['lower_pull', 'upper_push', 'upper_pull', 'lower_push', 'core', 'conditioning'] },
        { name: 'Full body C', slots: ['lower_push', 'upper_push', 'upper_pull', 'lower_pull', 'core', 'conditioning'] }
      ]
    },
    hypertrophy: {
      3: [
        { name: 'Push', slots: ['upper_push', 'upper_push', 'upper_push', 'core'] },
        { name: 'Pull', slots: ['upper_pull', 'upper_pull', 'upper_pull', 'core'] },
        { name: 'Legs', slots: ['lower_push', 'lower_pull', 'lower_push', 'calves', 'core'] }
      ],
      4: [
        { name: 'Upper A', slots: ['upper_push', 'upper_pull', 'upper_push', 'upper_pull', 'core'] },
        { name: 'Lower A', slots: ['lower_push', 'lower_pull', 'lower_push', 'calves', 'core'] },
        { name: 'Upper B', slots: ['upper_pull', 'upper_push', 'upper_pull', 'upper_push', 'core'] },
        { name: 'Lower B', slots: ['lower_pull', 'lower_push', 'lower_pull', 'calves', 'core'] }
      ]
    },
    strength: {
      3: [
        { name: 'Full body A', slots: ['lower_push', 'upper_push', 'upper_pull', 'core'] },
        { name: 'Full body B', slots: ['lower_pull', 'upper_pull', 'upper_push', 'core'] },
        { name: 'Full body C', slots: ['lower_push', 'upper_push', 'upper_pull', 'lower_pull'] }
      ]
    },
    general: {
      3: [
        { name: 'Full body A', slots: ['lower_push', 'upper_pull', 'upper_push', 'lower_pull', 'core', 'conditioning'] },
        { name: 'Full body B', slots: ['lower_pull', 'upper_push', 'upper_pull', 'lower_push', 'core', 'conditioning'] },
        { name: 'Full body C', slots: ['lower_push', 'upper_push', 'upper_pull', 'lower_pull', 'core', 'conditioning'] }
      ]
    }
  };

  function genericFullBody(days, preset) {
    const base = ['lower_push', 'upper_push', 'upper_pull', 'lower_pull', 'core'];
    const slots = preset.conditioning && preset.conditioning !== 'none' ? base.concat('conditioning') : base;
    const n = Math.max(1, Math.min(days || 3, 3));
    const out = [];
    for (let i = 0; i < n; i++) out.push({ name: 'Full body ' + String.fromCharCode(65 + i), slots: slots.slice() });
    return out;
  }

  function templateDays(goal, days, preset) {
    const t = TEMPLATES[goal];
    if (t && t[days]) return t[days];
    return genericFullBody(days, preset);
  }

  // Decide if an exercise is allowed under the user's constraints, and collect any safety cues.
  function evaluateExercise(ex, profile) {
    if (profile.avoidComplex && ex.complexity === 'complex') return { ok: false, reason: 'complex' };
    const cared = [];
    if (profile.kneeCare) cared.push('knee');
    if (profile.backCare) cared.push('spine');
    if (profile.shoulderCare) cared.push('shoulder');
    const cues = {};
    for (const j of ex.joints || []) {
      if (!cared.includes(j)) continue;
      if (profile.jointMode === 'avoid') return { ok: false, reason: 'joint:' + j };
      if (profile.jointMode === 'friendly' && !(ex.friendlyFor || []).includes(j)) return { ok: false, reason: 'joint:' + j };
      if (ex.mitigation && ex.mitigation[j]) cues[j] = ex.mitigation[j]; // 'friendly' (kept) or 'show'
    }
    return { ok: true, cues };
  }

  function expandCount(variety) {
    if (variety === 'fixed') return 0;
    if (variety === 'surprise') return 2;
    return 1; // 'expand' (default)
  }

  function generateSession(profile, gym, allExercises, recentSessions) {
    const preset = GOAL_PRESETS[profile.goal] || GOAL_PRESETS.weight_loss;
    const days = templateDays(profile.goal, profile.days, preset);
    const cycleIndex = profile.cycleIndex || 0;
    const dayIdx = days.length ? (cycleIndex % days.length) : 0;
    const day = days[dayIdx];

    const availSet = new Set(gym.machineIds || []);
    const avoidSet = new Set(profile.avoid || []);
    const favSet = new Set(profile.favorites || []);

    // recency: exerciseId -> sessions-ago (0 = most recent). Absent => never done.
    const recency = {};
    (recentSessions || []).forEach((s, i) => {
      (s.entries || []).forEach((e) => { if (!(e.exerciseId in recency)) recency[e.exerciseId] = i; });
    });
    const tried = new Set(Object.keys(recency));

    const evalCache = {};
    function candidatesFor(pattern) {
      return allExercises
        .filter((e) => e.pattern === pattern && availSet.has(e.id) && !avoidSet.has(e.id))
        .map((e) => { if (!(e.id in evalCache)) evalCache[e.id] = evaluateExercise(e, profile); return { ex: e, ev: evalCache[e.id] }; })
        .filter((c) => c.ev.ok);
    }

    // Which slots should try to introduce something new this session.
    const newSlots = new Set();
    const count = expandCount(profile.variety);
    if (day && count > 0) {
      for (let k = 0; k < count; k++) newSlots.add((cycleIndex + k) % day.slots.length);
    }

    const pickedIds = new Set();
    const usedPrimary = new Set();
    const items = [];

    (day ? day.slots : []).forEach((pattern, idx) => {
      const pool = candidatesFor(pattern).filter((c) => !pickedIds.has(c.ex.id));
      if (!pool.length) { items.push({ pattern, missing: true }); return; }
      const wantNew = newSlots.has(idx) && tried.size > 0 && pool.some((c) => !tried.has(c.ex.id));

      const score = (c) => {
        const id = c.ex.id;
        let s = 0;
        if (favSet.has(id)) s += 5;
        s += (id in recency) ? Math.min(recency[id], 6) : 8;          // stale or never-used ranks higher
        if (!usedPrimary.has(c.ex.primary[0])) s += 3;                 // spread muscles within the session
        if ((c.ex.secondary || []).length) s += 2;                    // prefer compounds over isolations for a slot
        if (wantNew && !tried.has(id)) s += 20;                        // gradual expansion
        if (c.ex.complexity === 'simple') s += 1;
        return s;
      };
      pool.sort((a, b) => score(b) - score(a) || a.ex.name.localeCompare(b.ex.name));

      const chosen = pool[0];
      pickedIds.add(chosen.ex.id);
      if (chosen.ex.primary[0]) usedPrimary.add(chosen.ex.primary[0]);
      items.push({
        pattern,
        exercise: chosen.ex,
        cues: chosen.ev.cues,
        isNew: wantNew && !tried.has(chosen.ex.id),
        sets: preset.sets,
        repLow: preset.repLow,
        repHigh: preset.repHigh,
        restSec: preset.restSec,
        alternatives: pool.slice(1).map((c) => c.ex.id)
      });
    });

    return {
      templateName: day ? day.name : 'Workout',
      dayIndex: dayIdx,
      cycleIndex,
      goal: profile.goal,
      preset,
      items,
      blocks: buildBlocks(items, preset)
    };
  }

  function buildBlocks(items, preset) {
    const conditioning = items.filter((i) => i.pattern === 'conditioning');
    const main = items.filter((i) => i.pattern !== 'conditioning');
    const blocks = [];
    if (preset.style === 'superset') {
      for (let i = 0; i < main.length; i += 2) {
        const grp = main.slice(i, i + 2);
        blocks.push({ type: grp.length > 1 ? 'superset' : 'single', label: String.fromCharCode(65 + blocks.length), items: grp });
      }
    } else {
      main.forEach((it, i) => blocks.push({ type: 'single', label: String(i + 1), items: [it] }));
    }
    conditioning.forEach((c) => blocks.push({ type: 'conditioning', label: 'Finisher', items: [c] }));
    return blocks;
  }

  return { GOAL_PRESETS, TEMPLATES, generateSession, evaluateExercise, templateDays };
})();
