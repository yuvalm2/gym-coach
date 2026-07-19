// guide.js — how-to / efficiency / injury-prevention notes per exercise.
// Keyed by exercise id, with a per-movement-pattern fallback for custom or
// photo-added machines. Three short facets each:
//   use       — set up and perform the movement
//   efficient — get the most stimulus per set
//   safe      — keep it joint-friendly (complements library.js mitigation cues)
// Dependency-free; also loads under Node for the coverage test.
const Guide = (() => {

  const GUIDE = {
    'leg-press': {
      use: 'Sit with your whole back flat on the pad and feet mid-platform, shoulder-width. Unlock the safety handles, lower until your knees reach about 90°, then press back up.',
      efficient: 'Lower under control for 2–3 seconds and stop just short of locking the knees to keep the quads loaded the whole set. Add a little weight once you clear the top of your rep range.',
      safe: 'Keep your knees tracking over your toes and never let your lower back round off the pad at the bottom — shorten the range before you let the hips tuck under.'
    },
    'lat-pulldown': {
      use: 'Set the thigh pad so your legs are pinned, take a grip a little wider than your shoulders, and sit tall. Pull the bar to your upper chest by driving your elbows down, then rise under control.',
      efficient: 'Lead with the elbows, not the hands, and squeeze your shoulder blades down and together at the bottom. Let the bar travel all the way up for a full stretch each rep — no half reps.',
      safe: 'Pull in front of your head, not behind your neck, and avoid leaning way back and heaving — a slight backward lean is fine, a swinging torso is not.'
    },
    'treadmill-walk': {
      use: 'Straddle the belt before starting, set a brisk walking pace, then add incline. Stand tall, let your arms swing, and only hold the rails for balance, not support.',
      efficient: 'For fat-burning conditioning, favour a steep incline walk over flat running — it lifts your heart rate with far less joint pounding. Keep a pace where you can talk but not sing.',
      safe: 'Clip the safety stop to your waistband, look ahead rather than at your feet, and step down onto the side rails to stop rather than jumping off a moving belt.'
    },

    // ---- lower push ----
    'leg-extension': {
      use: 'Sit back fully, line the pivot up with your knee, and set the ankle pad just above your feet. Straighten your legs smoothly, then lower under control.',
      efficient: 'Pause for a beat at the top with the quads fully contracted, then take 2–3 seconds to lower. Light-to-moderate weight with a clean squeeze beats heaving heavy.',
      safe: 'Avoid snapping into a hard lockout and keep the load moderate — this is the one machine where too much weight really bothers the kneecap.'
    },
    'hack-squat': {
      use: 'Set shoulders under the pads, feet mid-platform and shoulder-width, unlock the handles, then descend to a comfortable depth and drive back up through your heels.',
      efficient: 'Control the descent and go only as deep as you can keep your heels down and back flat. A slightly higher foot placement eases the knees.',
      safe: 'Keep knees tracking over your toes and stop the depth before your pelvis tucks under — never bounce out of the bottom.'
    },
    'smith-squat': {
      use: 'Position the bar across your upper back, step your feet slightly forward of the bar line, unrack, then squat to a comfortable depth and stand back up.',
      efficient: 'The fixed bar path lets you focus on depth and tempo — lower for 2–3 seconds and drive up smoothly. Feet a touch forward loads the quads and spares the knees.',
      safe: 'Because the path is fixed, set your feet carefully so your knees and back aren’t forced into an awkward line; twist the bar to re-rack if anything pinches.'
    },
    'goblet-squat': {
      use: 'Hold a dumbbell or kettlebell against your chest, feet shoulder-width, and squat down between your knees keeping your chest tall, then stand.',
      efficient: 'Let your elbows brush the inside of your knees at the bottom for a full range, and keep the weight close to your body throughout.',
      safe: 'Brace your core and keep your torso upright; go only as low as you can without your lower back rounding at the bottom.'
    },

    // ---- lower pull ----
    'seated-leg-curl': {
      use: 'Set the back pad so your knees line up with the pivot, secure the thigh pad, and place your lower shins on the ankle roller. Curl your heels under the seat, then release slowly.',
      efficient: 'Squeeze the hamstrings hard at the bottom of the curl and resist on the way back — a slow return is where much of the work happens.',
      safe: 'Keep your hips down on the seat and avoid jerking the weight; let the hamstrings, not your lower back, do the pulling.'
    },
    'lying-leg-curl': {
      use: 'Lie face-down with the ankle roller just above your heels and knees off the edge of the pad. Curl your heels toward your glutes, then lower under control.',
      efficient: 'Curl all the way up without letting your hips pop off the pad, then lower slowly for a full stretch.',
      safe: 'Stop your hips from rising by bracing your core; if your lower back arches to move the weight, drop the load.'
    },
    'hip-thrust': {
      use: 'Sit with your upper back against the bench and the pad over your hips, feet flat and shoulder-width. Drive through your heels to lift your hips until your body is level, then lower.',
      efficient: 'Pause and squeeze your glutes hard at the top of every rep; think about tucking your ribs rather than arching to get higher.',
      safe: 'Keep your ribs down and chin tucked — finish the lift with a glute squeeze, not a lower-back arch.'
    },
    'hip-abduction': {
      use: 'Sit back against the pad with the outer-thigh pads against your knees, then press your knees outward against the resistance and return slowly.',
      efficient: 'Push all the way out and pause, then control the return — a slight forward lean shifts the work toward the upper glutes.',
      safe: 'Move smoothly through a comfortable range; don’t force the knees wider than feels natural or let the weight snap back.'
    },
    'glute-kickback': {
      use: 'Attach the cuff to one ankle, face the tower and hold on for balance, then drive that leg back and up, squeezing the glute, before returning under control.',
      efficient: 'Lead with the heel and pause at the top; keep the movement slow rather than swinging the leg for momentum.',
      safe: 'Keep a soft knee and a braced core — extend at the hip, not by arching your lower back to gain range.'
    },
    'back-extension': {
      use: 'Set the pad just below your hip bones, cross your arms or hold a plate to your chest, then hinge down and rise until your body is straight — no higher.',
      efficient: 'Move in a slow, controlled arc and stop at a straight line; add a plate to your chest only once bodyweight is easy.',
      safe: 'Do not hyperextend past straight at the top — over-arching is what strains the lower back this movement is meant to strengthen.'
    },
    'rdl': {
      use: 'Stand with the bar close to your shins, soft knees, and push your hips back to lower the bar down your thighs, then drive your hips forward to stand.',
      efficient: 'Feel the stretch in your hamstrings and go only as low as you can keep a flat back; the bar should travel in a straight vertical line close to your legs.',
      safe: 'A flat, braced back is everything here — the moment it starts to round, you’ve gone too low or too heavy. Keep the bar against your legs the whole time.'
    },

    // ---- upper push ----
    'chest-press': {
      use: 'Set the seat so the handles are at mid-chest height, sit back with shoulder blades down, and press forward to almost-straight arms, then return slowly.',
      efficient: 'Stop just short of locking the elbows to keep tension on the chest, and let the handles come back far enough for a stretch without pinching.',
      safe: 'Keep your shoulder blades pulled back against the pad — pressing with rounded, forward shoulders is what aggravates them.'
    },
    'incline-chest-press': {
      use: 'On the incline setting, line the handles up with your upper chest, sit back firmly, and press up and slightly in, then lower under control.',
      efficient: 'Drive the handles together at the top to bias the upper chest, and control the descent for a full stretch.',
      safe: 'Keep the range pain-free at the bottom and shoulder blades set back; don’t let the elbows drop far below the shoulders.'
    },
    'pec-deck': {
      use: 'Set the seat so your forearms meet the pads at chest height, then bring the pads together in front of you and open slowly back to a comfortable stretch.',
      efficient: 'Squeeze your chest for a beat when the pads meet, then resist on the way back — this is about the contraction, not heavy weight.',
      safe: 'Keep a slight bend at the elbows and don’t let the pads drag your arms too far back — over-stretching is hard on the front of the shoulder.'
    },
    'shoulder-press': {
      use: 'Set the seat so the handles start at shoulder height, sit tall with your back on the pad, and press overhead to nearly straight arms, then lower under control.',
      efficient: 'Stop just short of lockout and lower slowly to about ear height each rep; keep your core braced so you press with the shoulders, not your back.',
      safe: 'Keep the range pain-free and don’t force the handles behind your head; if the shoulder pinches at the top, shorten the range slightly.'
    },
    'lateral-raise': {
      use: 'With a light cable or dumbbells at your sides, raise your arms out to about shoulder height with a slight elbow bend, then lower slowly.',
      efficient: 'Lead with your elbows, not your hands, and keep the tempo slow — light weight done strictly builds the side delts better than swinging heavy.',
      safe: 'Stay at or just below shoulder height if going higher pinches, and don’t shrug or heave the weight up with your traps.'
    },
    'triceps-pushdown': {
      use: 'Face the cable with the bar at chest height, tuck your elbows to your sides, and push down to straight arms, then let it rise under control.',
      efficient: 'Keep your upper arms pinned to your sides and only move at the elbow; squeeze at the bottom and control the return.',
      safe: 'Avoid leaning over and using your bodyweight — keep it strict; if your elbows ache, widen the grip slightly.'
    },
    'assisted-dip': {
      use: 'Set the assistance so you can control the movement, place your knees or feet on the pad, and lower until your upper arms are about parallel before pressing back up.',
      efficient: 'Reduce the assistance gradually over time; a slow lowering phase builds the most strength as you progress toward unassisted dips.',
      safe: 'Use enough assistance to control the bottom and don’t drop below a comfortable depth — going too deep loads the front of the shoulder.'
    },
    'overhead-press': {
      use: 'Hold the bar at shoulder height, brace your core and squeeze your glutes, then press overhead in a straight line, moving your head slightly back then forward under the bar.',
      efficient: 'Keep the bar path vertical and finish with the bar over your mid-foot; a tight core turns your whole body into a stable base.',
      safe: 'Don’t lean back and arch your lower back to press — if you can’t keep a braced, near-vertical torso, the weight is too heavy.'
    },
    'bench-press': {
      use: 'Lie back with eyes under the bar, grip a little wider than shoulders, unrack, and lower the bar to your mid-chest with elbows tucked to about 45°, then press up.',
      efficient: 'Keep your shoulder blades pinched and feet planted for a stable base; touch the chest lightly and drive up without bouncing.',
      safe: 'Use a spotter or safety pins, keep the elbows tucked rather than flared, and don’t let the bar sink heavily into the chest.'
    },
    'arnold-press': {
      use: 'Start with dumbbells in front at shoulder height, palms facing you, then rotate your palms forward as you press overhead, reversing on the way down.',
      efficient: 'Rotate smoothly and continuously through the press so the delts work the whole range; use a lighter weight than a straight press.',
      safe: 'Stop just short of lockout, keep the movement controlled, and skip the rotation if it pinches your shoulder — a plain press is fine.'
    },

    // ---- upper pull ----
    'chest-supported-row': {
      use: 'Set your chest against the pad, take the handles, and row them toward your ribs by driving your elbows back, squeezing your shoulder blades, then return slowly.',
      efficient: 'Pause with your shoulder blades pinched at the end of the pull, and let the weight stretch your back fully on the return.',
      safe: 'Because your chest is supported, you can go heavy safely — just keep your neck relaxed and avoid shrugging the traps up to your ears.'
    },
    'seated-row': {
      use: 'Sit with a slight knee bend, chest up, grab the handle, and pull it to your stomach by driving your elbows back, then extend your arms under control.',
      efficient: 'Squeeze your shoulder blades together at the end and allow a full stretch forward each rep — pull with the back, not just the arms.',
      safe: 'Keep your back straight and core braced; pull with your arms rather than rocking your torso back and forth to move the weight.'
    },
    'assisted-pullup': {
      use: 'Set the assistance, kneel or stand on the pad, take a shoulder-width overhand grip, and pull your chest toward the bar, then lower to a full hang under control.',
      efficient: 'Lower the assistance over the weeks and control the descent; think about pulling your elbows down and back rather than just yanking your chin up.',
      safe: 'Avoid a jerky dead-hang start — begin each rep with your shoulders set, and use enough assistance to stay smooth at the bottom.'
    },
    'face-pull': {
      use: 'Set a rope at head height, step back for tension, and pull the ends toward your face, flaring your elbows out and squeezing the rear shoulders, then return slowly.',
      efficient: 'Aim the rope at your forehead and pause at the end with your shoulder blades pulled together — this is a light, high-rep movement.',
      safe: 'Keep it light and controlled; it’s a shoulder-health exercise, so quality of contraction matters far more than load.'
    },
    'rear-delt-fly': {
      use: 'Sit facing the pad of the reverse pec deck, take the handles, and open your arms out and back in a wide arc, squeezing the rear shoulders, then return slowly.',
      efficient: 'Lead with the elbows and pause at the back of the movement; keep the weight light so the rear delts do the work, not the traps.',
      safe: 'Keep a slight elbow bend and avoid shrugging — smooth, controlled reps protect the shoulder joint.'
    },
    'biceps-curl': {
      use: 'With the cable or machine set, keep your elbows at your sides and curl the handle up toward your shoulders, then lower under control.',
      efficient: 'Squeeze the biceps at the top and take 2–3 seconds to lower; keep your upper arms still so only the elbow moves.',
      safe: 'Avoid swinging your body or flaring your elbows forward — if you need momentum to lift it, the weight is too heavy.'
    },
    'bent-row': {
      use: 'Hinge at the hips with a flat back and soft knees, let the bar hang, then row it to your lower ribs by driving your elbows back, and lower under control.',
      efficient: 'Keep your torso angle steady and pull the bar to the same spot each rep, squeezing your back at the top.',
      safe: 'A flat, braced back is critical — don’t round your spine or heave with your legs; reduce the weight before form slips.'
    },

    // ---- core ----
    'ab-crunch-machine': {
      use: 'Set the seat and pad, grip the handles, and crunch your ribs toward your pelvis by rounding your upper back, then return slowly.',
      efficient: 'Exhale and curl through your abs rather than just pulling with your arms; pause at the fully contracted position for a beat.',
      safe: 'Move smoothly and avoid yanking with the arms or straining your neck — the abs should drive the crunch.'
    },
    'cable-crunch': {
      use: 'Kneel facing the tower with a rope behind your head, hips still, and crunch your elbows down toward your knees by rounding your spine, then rise slowly.',
      efficient: 'Keep your hips fixed so the movement comes from your abs curling, not from bending at the hips; squeeze hard at the bottom.',
      safe: 'Don’t pull with your arms or strain your neck — anchor your hands by your head and let the abs do the crunch.'
    },
    'plank': {
      use: 'Rest on your forearms and toes with your body in a straight line from head to heels, elbows under your shoulders, and hold while breathing steadily.',
      efficient: 'Squeeze your glutes and brace your abs as if bracing for a punch; a hard 20–30 seconds beats a saggy minute.',
      safe: 'Keep your hips level — don’t let them sag toward the floor or pike up — and stop the set when your form starts to break rather than pushing to failure.'
    },
    'pallof-press': {
      use: 'Stand side-on to a cable at chest height, hold the handle at your chest, and press it straight out in front of you, resisting the pull to rotate, then return.',
      efficient: 'Move slowly and pause with your arms extended; the goal is to resist twisting, so focus on staying square rather than on reps.',
      safe: 'Keep your core braced and hips facing forward — let your trunk resist the rotation rather than your lower back compensating.'
    },
    'captains-chair': {
      use: 'Support yourself on the arm pads with your back against the pad, then raise your knees toward your chest by curling your pelvis up, and lower under control.',
      efficient: 'Curl your pelvis at the top rather than just lifting the thighs, and lower slowly instead of dropping the legs.',
      safe: 'Avoid swinging — if you can’t control the legs down, bend the knees more or reduce the range.'
    },
    'hanging-leg-raise': {
      use: 'Hang from a bar with a firm grip, then raise your legs in front of you by curling your pelvis up, and lower under control without swinging.',
      efficient: 'Curl your hips up at the top for a full ab contraction; bend your knees to make it easier while you build strength.',
      safe: 'Move slowly to avoid swinging, and keep a slight ab brace so the effort stays in your abs rather than your lower back.'
    },

    // ---- calves ----
    'standing-calf-raise': {
      use: 'Set the shoulder pads, place the balls of your feet on the platform with heels hanging off, then rise onto your toes and lower your heels for a full stretch.',
      efficient: 'Pause at the top squeeze and at the bottom stretch on every rep — a slow, full range beats fast bouncing.',
      safe: 'Control the bottom so your ankle isn’t jolted, and keep your knees slightly soft rather than locked.'
    },
    'seated-calf-raise': {
      use: 'Sit with the balls of your feet on the platform and the pad over your knees, then press up onto your toes and lower your heels below the platform.',
      efficient: 'The bent-knee position targets the deeper calf muscle — pause at the top and get a full stretch at the bottom each rep.',
      safe: 'Move through a controlled full range and avoid bouncing out of the bottom stretch.'
    },

    // ---- conditioning ----
    'recumbent-bike': {
      use: 'Adjust the seat so your knees stay slightly bent at full extension, sit back against the support, and pedal at a steady, sustainable effort.',
      efficient: 'Work in intervals — alternate a couple of harder minutes with easier recovery — to get more conditioning from the same time.',
      safe: 'The reclined position is very knee- and back-friendly; just set the seat so your knees never fully lock or over-bend.'
    },
    'elliptical': {
      use: 'Stand tall on the pedals, hold the moving handles, and drive a smooth stride with your legs while your arms push and pull in rhythm.',
      efficient: 'Add resistance or incline rather than just going faster, and use the handles to involve the upper body for more total work.',
      safe: 'Keep the motion smooth and gliding — it’s low-impact and easy on the knees, so let it stay that way rather than stomping.'
    },
    'stationary-bike': {
      use: 'Set the seat height so your knee is slightly bent at the bottom of the stroke, then pedal at a steady effort with a light grip on the bars.',
      efficient: 'Mix steady riding with short harder intervals out of the saddle to lift your heart rate and burn more in less time.',
      safe: 'Keep the resistance high enough that you’re not bouncing in the seat, and set the seat height to protect the knees.'
    },
    'rower': {
      use: 'Strap in your feet, start compressed with shins vertical, then drive with your legs, lean back slightly, and finish by pulling the handle to your lower ribs — reverse in that order.',
      efficient: 'Most of the power comes from your legs, not your arms; aim for a strong drive and a slower recovery, roughly a 1:2 ratio.',
      safe: 'Drive with the legs first and keep a neutral spine — don’t round your back at the catch or yank with your lower back.'
    },
    'stairmaster': {
      use: 'Step onto the rotating stairs, stand tall, and walk at a steady pace using the rails only for light balance, not to hold yourself up.',
      efficient: 'Let go of the rails and stand upright to make your legs do the full work; a steady moderate pace for longer beats sprinting briefly.',
      safe: 'Don’t hunch over and hang on the rails — that removes the effort and strains your wrists and back. Take full steps to protect the knees.'
    }
  };

  // Fallback by movement pattern — generic but still useful for custom machines.
  const PATTERN = {
    lower_push: { use: 'Set the seat or pad so your knees start bent and your back is supported, then press through the mid-foot.', efficient: 'Control the lowering phase and stop just short of lockout to keep tension on the working muscles.', safe: 'Keep knees tracking over the toes and stop before your lower back rounds or the joint pinches.' },
    lower_pull: { use: 'Anchor your hips and torso, then move only at the hip or knee the machine is built for.', efficient: 'Pause and squeeze at the fully-shortened position, then lower slowly for a stretch.', safe: 'Brace your core and keep a neutral spine — drive with the target muscle, not by yanking with your back.' },
    upper_push: { use: 'Set the seat so the handles line up with mid-chest or shoulders, then press smoothly to almost-straight arms.', efficient: 'Stop just short of lockout, control the return, and keep your shoulder blades set down and back.', safe: 'Keep a slight bend at the elbow at the top and don’t let the handles travel so far back that the shoulder over-stretches.' },
    upper_pull: { use: 'Set your chest or thigh support, take the prescribed grip, and pull by driving the elbows.', efficient: 'Squeeze the back muscles at the end of the pull and allow a full stretch on the return.', safe: 'Move the weight with your back and arms, not by swinging your torso; keep the neck relaxed.' },
    core: { use: 'Set any pad or support, then move slowly through the range the machine allows.', efficient: 'Brace and exhale as you contract; hold the shortened position for a beat before releasing.', safe: 'Avoid pulling on your neck and keep the movement smooth — no fast jerks.' },
    calves: { use: 'Place the balls of your feet on the platform and let your heels drop for a stretch, then press up onto your toes.', efficient: 'Pause at the top and the bottom of every rep — a full stretch and squeeze beats a bouncy partial.', safe: 'Keep the motion controlled so the ankle isn’t jolted at the bottom.' },
    conditioning: { use: 'Set a pace you can sustain, keep good posture, and hold on only for balance.', efficient: 'Work in moderate–hard intervals rather than a flat easy pace to get more out of the time.', safe: 'Build intensity gradually and keep a controlled, low-impact motion to spare the joints.' }
  };

  const DEFAULT = { use: 'Set up so the working muscle is supported and move through a comfortable, controlled range.', efficient: 'Control every rep and keep tension on the target muscle rather than rushing.', safe: 'Keep good posture, avoid painful ranges, and stop a rep or two before form breaks down.' };

  function forExercise(ex) {
    return (ex && (GUIDE[ex.id] || PATTERN[ex.pattern])) || DEFAULT;
  }

  return { forExercise, _GUIDE: GUIDE };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Guide;
