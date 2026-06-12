// identify.js — photo → machine identification via the Claude API (browser-direct).
// The user's API key is entered in Profile and lives only in IndexedDB on this
// device; requests go straight from the browser to api.anthropic.com.
const Identify = (() => {
  const MODEL = 'claude-opus-4-8';
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.104.1/+esm';
  const MAX_EDGE = 1280; // long-edge px for the uploaded photo — plenty for ID, keeps tokens low

  let sdkPromise = null;
  const loadSDK = () => (sdkPromise = sdkPromise || import(SDK_URL).then((m) => m.default));

  // Downscale + JPEG-encode a camera photo (EXIF orientation respected), return blob + base64.
  async function preparePhoto(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(blob);
    });
    return { blob, base64: dataUrl.slice(dataUrl.indexOf(',') + 1) };
  }

  const nullable = (t) => ({ anyOf: [{ type: t }, { type: 'null' }] });
  const JOINTS = ['knee', 'spine', 'shoulder'];

  function buildSchema(knownIds) {
    const muscleArr = { type: 'array', items: { type: 'string', enum: Object.keys(MUSCLES) } };
    const jointArr = { type: 'array', items: { type: 'string', enum: JOINTS } };
    return {
      type: 'object',
      additionalProperties: false,
      required: ['match_id', 'confidence', 'name', 'pattern', 'type', 'primary', 'secondary',
                 'complexity', 'joints', 'friendly_for', 'mitigation', 'better_photo'],
      properties: {
        match_id: { anyOf: [{ type: 'string', enum: knownIds }, { type: 'null' }],
          description: 'If the photo shows one of the known catalog machines, its id; else null.' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        name: { type: 'string', description: 'Concise gym-goer name, e.g. "Converging Chest Press (Hammer Strength)".' },
        pattern: { type: 'string', enum: Object.keys(PATTERNS) },
        type: { type: 'string', enum: ['machine', 'cable', 'free', 'bodyweight', 'cardio'] },
        primary: muscleArr,
        secondary: muscleArr,
        complexity: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
        joints: jointArr,
        friendly_for: jointArr,
        mitigation: {
          type: 'object', additionalProperties: false, required: JOINTS,
          properties: { knee: nullable('string'), spine: nullable('string'), shoulder: nullable('string') }
        },
        better_photo: { anyOf: [{ type: 'string' }, { type: 'null' }],
          description: 'If confidence is not high: exactly what extra shot would settle the ID.' }
      }
    };
  }

  function buildPrompt(exercises, profile) {
    const known = exercises.map((e) => `${e.id} — ${e.name}`).join('\n');
    const muscles = Object.entries(MUSCLES).map(([k, v]) => `${k} (${v})`).join(', ');
    const patterns = Object.entries(PATTERNS).map(([k, v]) => `${k} = ${v}`).join('; ');
    const care = [profile.kneeCare && 'knees', profile.backCare && 'lower back', profile.shoulderCare && 'shoulders']
      .filter(Boolean).join(' and ') || 'no specific joints';
    return `Identify the gym machine/equipment in this photo for a personal workout app. Read any name plate, placard diagram, or brand text visible.

Known catalog (if the photo shows one of these — same movement, any brand — set match_id to its id instead of describing it as new):
${known}

Use ONLY these taxonomy keys.
Muscles: ${muscles}
Patterns (the slot it fills in a session): ${patterns}
Type: machine (pin/plate loaded, guided), cable, free (free weights), bodyweight, cardio.
Complexity: simple = guided/fixed path, hard to do wrong; moderate = needs some setup or technique; complex = barbell/technical lifts.
joints = joints under meaningful load on this equipment (of knee, spine, shoulder).

The user is a long-time trainee who is cautious about ${care} and avoids complex lifts. For EVERY joint you list in joints, write a one-sentence imperative mitigation cue in plain coaching language (e.g. "Keep your back straight and core braced; pull with your arms rather than swinging the torso."). Set friendly_for to the joints for which this equipment is still a gentle, controllable option when the cue is followed.

If the photo is not gym equipment, or too unclear to identify: set confidence to low, name to your best description, and better_photo to the shot that would help (e.g. "straight-on photo of the name plate" or "full side view showing the seat and lever path").`;
  }

  // -> parsed result object (see buildSchema). Throws on network/auth errors.
  async function identify(apiKey, imageBase64, ctx) {
    const Anthropic = await loadSDK();
    const client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
      defaultHeaders: { 'anthropic-dangerous-direct-browser-access': 'true' }
    });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { format: { type: 'json_schema', schema: buildSchema(ctx.exercises.map((e) => e.id)) } },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: buildPrompt(ctx.exercises, ctx.profile) }
        ]
      }]
    });
    const text = resp.content.find((b) => b.type === 'text');
    return JSON.parse(text.text);
  }

  return { MODEL, preparePhoto, identify };
})();
