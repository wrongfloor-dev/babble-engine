// Script logic checks, no dependencies: node tests/script.mjs
// Covers site/src/script.js: lines and scenes (add, move, drag, rename), status per line (todo, done, redo),
// next line per character, syllables and word alignment for the prompter, trimming, loudness, the tempo follower.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const S = require('../site/src/script.js');
const B = require('../site/src/engine.js');
let problems = 0;
const fail = (what, msg) => { problems++; console.log(`[${what}] ${msg}`) };
const eq = (what, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) fail(what, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`) };

// ---------- lines and scenes ----------
const s = S.newScript('Tutorial', 'nl', 'Intro');
const gids = S.newCharacter('Gids'), kid = S.newCharacter('Kind');
s.characters.push(gids, kid);
const a = S.addLine(s, 'Intro'); a.character = gids.id; a.text = 'Hallo daar!';
const b = S.addLine(s, 'Intro', a); b.text = 'Kom je mee?';
eq('add after keeps character', b.character, gids.id);
s.scenes.push('Bos');
const c = S.addLine(s, 'Bos'); c.character = kid.id; c.text = 'Wat is het hier donker.';
const d = S.addLine(s, 'Intro'); d.character = kid.id; d.text = 'Ja!';
eq('order by scene', S.ordered(s).map(l => l.id), [a.id, b.id, d.id, c.id]);
S.moveLine(s, d.id, -1);
eq('move up', S.ordered(s).map(l => l.id), [a.id, d.id, b.id, c.id]);
S.moveLine(s, b.id, 1);
eq('move down across a scene edge changes the scene', [b.scene, S.ordered(s).map(l => l.id)], ['Bos', [a.id, d.id, b.id, c.id]]);
S.moveLine(s, b.id, 1);
eq('then moves within the scene', S.ordered(s).map(l => l.id), [a.id, d.id, c.id, b.id]);
eq('top line cannot move up', S.moveLine(s, a.id, -1), false);
S.placeLine(s, b.id, a.id);
eq('drag before a line takes its scene', [b.scene, S.ordered(s).map(l => l.id)], ['Intro', [b.id, a.id, d.id, c.id]]);
S.placeLine(s, a.id, null, 'Bos');
eq('drag to the end of a scene', [a.scene, S.ordered(s).map(l => l.id)], ['Bos', [b.id, d.id, c.id, a.id]]);
eq('rename scene', [S.renameScene(s, 'Bos', 'Grot'), c.scene, s.scenes], [true, 'Grot', ['Intro', 'Grot']]);
eq('rename to an existing scene is refused', S.renameScene(s, 'Grot', 'Intro'), false);
{ // scenes: move, merge on delete, delete all
  const m = S.newScript('', 'nl', 'A'); m.scenes.push('B', 'C');
  const a1 = S.addLine(m, 'A'), b1 = S.addLine(m, 'B'), b2 = S.addLine(m, 'B'), c1 = S.addLine(m, 'C');
  eq('move scene down', [S.moveScene(m, 'A', 1), m.scenes, S.ordered(m).map(l => l.id)], [true, ['B', 'A', 'C'], [b1.id, b2.id, a1.id, c1.id]]);
  eq('move scene past the end is refused', S.moveScene(m, 'C', 1), false);
  eq('merge into the scene before', [S.removeScene(m, 'A', true), m.scenes, S.ordered(m).map(l => l.id + l.scene)], [[], ['B', 'C'], [b1.id + 'B', b2.id + 'B', a1.id + 'B', c1.id + 'C']]);
  eq('the first scene merges into the start of the next', [S.removeScene(m, 'B', true), m.scenes, S.ordered(m).map(l => l.id)], [[], ['C'], [b1.id, b2.id, a1.id, c1.id]]);
  eq('delete all returns the removed lines', [S.removeScene(m, 'C', false), m.scenes, m.lines.length], [[b1.id, b2.id, a1.id, c1.id], [], 0]);
  eq('free scene name', S.freeScene({ scenes: ['Scène 1', 'Scène 3'] }, n => 'Scène ' + n), 'Scène 4');
}
S.removeLine(s, d.id);
eq('remove', s.lines.length, 3);
const empty = S.newScript('', 'en');
const first = S.addLine(empty, '');
eq('first line in an empty script', [empty.lines.length, first.scene], [1, '']);

// ---------- status ----------
const takes = { t1: { text: 'Hallo  daar!' } };
const l = S.newLine('x', '', 'Hallo daar!');
eq('todo without take', S.lineStatus(l, takes), 'todo');
l.take = 't1';
eq('done when the take has the same text (spaces do not count)', S.lineStatus(l, takes), 'done');
l.text = 'Hallo daar, jij!';
eq('redo after the text changed', S.lineStatus(l, takes), 'redo');
l.take = 'gone';
eq('a missing take counts as todo', S.lineStatus(l, takes), 'todo');

// next line of the same character that needs a take
const n = S.newScript('', 'en', 'A');
const g = S.newCharacter('Guide'), o = S.newCharacter('Other');
const L = ['one', 'two', 'three', 'four'].map((x, i) => { const y = S.addLine(n, 'A'); y.text = x; y.character = i === 1 ? o.id : g.id; return y });
const tk = { k: { text: 'three' } };
L[2].take = 'k';
eq('next skips other characters and done lines', S.nextFor(n, L[0].id, tk).id, L[3].id);
eq('next wraps to the top', S.nextFor(n, L[3].id, tk).id, L[0].id);
L[0].take = 'k'; L[3].take = 'k'; tk.k.text = 'x';
eq('redo lines count as needing a take', S.nextFor(n, L[0].id, tk).id, L[2].id);
const solo = S.newScript('', 'en', 'A'); const only = S.addLine(solo, 'A'); only.text = 'hi';
eq('no next line', S.nextFor(solo, only.id, {}), null);

// ---------- babble characters (step 2) ----------
{
  const b = S.newScript('', 'en', 'Shop'); b.scenes.push('Street');
  const me = S.newCharacter('Kid'), shop = S.newCharacter('Shopkeeper'); shop.kind = 'babble'; shop.style = 'vemmo'; shop.intent = 'greet';
  const crow = S.newCharacter('Crow'); crow.kind = 'babble'; crow.style = 'animal'; crow.voice = 'pip'; crow.mood = 'blij';
  b.characters.push(me, shop, crow);
  const mk = (scene, c, text) => { const l = S.addLine(b, scene); l.character = c.id; l.text = text; return l };
  const a = mk('Shop', shop, 'Welcome!'), c1 = mk('Shop', crow, 'Caw caw'), m1 = mk('Shop', me, 'Hello there'), a2 = mk('Shop', shop, ''), m2 = mk('Shop', me, 'Bye'), s1 = mk('Street', crow, 'Caw'), m3 = mk('Street', me, 'Wait for me');
  eq('babble lines have their own status', [S.lineStatus(a, {}, b), S.lineStatus(m1, {}, b)], ['babble', 'todo']);
  eq('babble lines never need a take', S.needsTake(c1, {}, b), false);
  eq('every new line has a seed', [a, m1].every(l => Number.isInteger(l.seed) && l.seed > 0), true);
  eq('cue: the babble lines right before, in order', S.cueBefore(b, m1.id).map(l => l.id), [a.id, c1.id]);
  eq('cue: Bloopa Doopa speaks without text', S.cueBefore(b, m2.id).map(l => l.id), [a2.id]);
  eq('cue: stops at the scene edge', S.cueBefore(b, m3.id).map(l => l.id), [s1.id]);
  eq('cue: none before the first line', S.cueBefore(b, a.id), []);
  eq('from a babble line the session starts at the next line to record', S.nextRecord(b, a.id, {}).id, m1.id);
  eq('next line of the same character skips babble', S.nextFor(b, m1.id, {}).id, m2.id);
  eq('module options for a babble line', S.babbleOpts(crow, c1), { style: 'animal', seed: c1.seed, voice: 'pip', mood: 'blij' });
  eq('Bloopa Doopa takes an intent and a length', S.babbleOpts(shop, a), { style: 'vemmo', seed: a.seed, intent: 'greet', length: 'short' });
  const ownV = { ...crow, voice: 'own:v1' };
  eq('an own voice is not a module voice name', 'voice' in S.babbleOpts(ownV, c1), false);
  // mixed line: one part in [ ] you speak yourself, the rest babbles
  eq('parts of a mixed line', S.partsOf('Hi [there you] go'), { before: 'Hi ', rec: 'there you', after: ' go', has: true });
  eq('no part', S.partsOf('Hi there').has, false);
  eq('mark a selection, widened to whole words', S.markPart('Hello there, come along', 2, 8), '[Hello there,] come along');
  eq('mark the word at the cursor', S.markPart('Hello there, come along', 15, 15), 'Hello there, [come] along');
  eq('marking again replaces the old part', S.markPart('[Hello] there', 8, 11), 'Hello [there]');
  eq('nothing marked on a space', S.markPart('Hello  there', 6, 6), 'Hello  there');
  const mx = mk('Shop', crow, '[Caw!] caw caw');
  eq('a mixed line needs a take for its part', [S.lineStatus(mx, {}, b), S.needsTake(mx, {}, b), S.recText(b, mx)], ['todo', true, 'Caw!']);
  mx.take = 'q';
  eq('mixed line done when the take has the part', S.lineStatus(mx, { q: { text: 'Caw!' } }, b), 'done');
  mx.text = '[Caw caw!] caw';
  eq('mixed line redo when the part changes', S.lineStatus(mx, { q: { text: 'Caw!' } }, b), 'redo');
  mx.text = 'Caw! [caw] caw';
  mx.take = null;
  eq('a mixed line is not a cue for the next line', S.cueBefore(b, mx.id).length >= 0 && S.cueBefore(b, mk('Shop', me, 'ok').id), []);
  eq('a recorded character speaks the whole line, brackets or not', S.recText(b, Object.assign(mk('Shop', me, '[Hi] you'), {})), 'Hi you');
  // a saved character as profile: its sliders go to the module
  const prof = { ...crow, sl: { pitch: 310, speed: 1.2, expr: 0.5, form: 1, breath: 0, tilt: 0.4 } };
  eq('profile sliders in module options', S.babbleOpts(prof, c1), { style: 'animal', seed: c1.seed, voice: 'pip', mood: 'blij', pitch: 310, speed: 1.2, expression: 0.5, throat: 1, breath: 0, brightness: 0.4 });
  eq('the module takes them', B.render('Caw caw', S.babbleOpts(prof, c1)).pcm.length > 0, true);
  const old = { characters: [{ id: 'x', name: 'Old' }], lines: [{ id: 'l', character: 'x', text: 'hi' }] };
  S.tidy(old);
  eq('older scripts: characters record, lines get a seed', [old.characters[0].kind, old.lines[0].seed > 0], ['record', true]);
  // the same options give the same sound in the web module
  const o1 = S.babbleOpts(crow, c1);
  const r1 = B.render(c1.text, o1), r2 = B.render(c1.text, o1), r3 = B.render(c1.text, { ...o1, seed: o1.seed + 1 });
  eq('same seed, same sound', r1.pcm.every((v, i) => v === r2.pcm[i]), true);
  eq('other take, other sound', r1.pcm.length === r3.pcm.length && r1.pcm.every((v, i) => v === r3.pcm[i]), false);
  eq('Bloopa line renders', B.render(a2.text, S.babbleOpts(shop, a2)).pcm.length > 0, true);
}

// ---------- syllables and words ----------
eq('syllables nl', ['hallo', 'ijsbeer', 'boerderij', 'eet'].map(w => S.sylCount(w, 'nl')), [2, 2, 3, 1]);
eq('syllables en', ['apple', 'make', 'banana', 'the'].map(w => S.sylCount(w, 'en')), [2, 1, 3, 1]);
const ws = S.wordsOf('  Kom je   mee naar het bos? ', 'nl');
eq('words', ws.map(w => [w.w, w.at]), [['Kom', 0], ['je', 1], ['mee', 2], ['naar', 3], ['het', 4], ['bos?', 5]]);
eq('word at a syllable position', [S.wordAt(ws, 0), S.wordAt(ws, 2.5), S.wordAt(ws, 6)], [0, 2, 6]);
const en = S.wordsOf('Hello there, do you want an apple?', 'en');
eq('align: all heard', S.alignWords(en, 'hello there do you want an apple'), { pos: 7, missing: [] });
eq('align: partway', S.alignWords(en, 'hello there do').pos, 3);
eq('align: a skipped word is missing', S.alignWords(en, 'hello there you want an apple'), { pos: 7, missing: [2] });
eq('align: close spelling counts', S.alignWords(en, 'hallo there').pos, 2);
eq('align: other words do not move it', S.alignWords(en, 'banana split').pos, 0);

// ---------- loudness (BS.1770): a full-scale 997 Hz sine is -3.01 LUFS ----------
const sr = 48000, sine = new Float32Array(sr * 2).map((_, i) => Math.sin(2 * Math.PI * 997 * i / sr));
const ls = S.loudness(sine, sr);
if (Math.abs(ls + 3.01) > 0.05) fail('loudness', `full-scale sine measured ${ls.toFixed(2)} LUFS, want -3.01`);
const half = sine.map(v => v * 0.1);
if (Math.abs(S.loudness(half, sr) + 23.01) > 0.05) fail('loudness', `-20 dB sine measured ${S.loudness(half, sr).toFixed(2)}`);
if (S.loudness(new Float32Array(sr), sr) !== -Infinity) fail('loudness', 'silence should be -Infinity');

// ---------- a take: silence trimmed, level set, silence refused ----------
// a babble render stands in for a voice: 0.8 s of quiet room before, 1 s after
const voice = B.render('Hallo daar, kom je mee?', { style: 'sim', seed: 2, sampleRate: sr }).pcm;
const room = n => Float32Array.from({ length: n }, (_, i) => Math.sin(i * 12.9898) * 43758.5453 % 1 * 0.0005);
const pre = Math.round(sr * 0.8), post = sr;
const rec = new Float32Array(pre + voice.length + post);
rec.set(room(pre)); rec.set(voice.map(v => v * 0.2), pre); rec.set(room(post), pre + voice.length);
const t = S.finishTake(rec, sr);
if (!t) fail('take', 'a voice take was refused');
else {
  if (t.trim[0] < 0.6 || t.trim[0] > 0.85) fail('take', `start cut at ${t.trim[0].toFixed(2)} s, voice starts at 0.80 s`);
  let last = voice.length - 1; while (last > 0 && Math.abs(voice[last]) < 1e-3) last--; // the render ends with a short silence
  const vEnd = (pre + last) / sr;
  if (t.trim[1] < vEnd - 0.15 || t.trim[1] > vEnd + 0.3) fail('take', `end cut at ${t.trim[1].toFixed(2)} s, voice ends at ${vEnd.toFixed(2)} s`);
  const lu = S.loudness(t.pcm, sr);
  let pk = 0; for (const v of t.pcm) pk = Math.max(pk, Math.abs(v));
  if (pk > 0.8915) fail('take', `peak ${pk.toFixed(3)} above -1 dBFS`);
  if (Math.abs(lu - S.TAKE_LUFS) > 0.1 && pk < 0.89) fail('take', `level ${lu.toFixed(2)} LUFS, want ${S.TAKE_LUFS}`);
  if (Math.abs(t.pcm[0]) > 1e-3 || Math.abs(t.pcm[t.pcm.length - 1]) > 1e-3) fail('take', 'no fade at the edges');
}
if (S.finishTake(room(sr * 2), sr) !== null) fail('take', 'a silent take was kept');
if (S.finishTake(new Float32Array(sr), sr) !== null) fail('take', 'digital silence was kept');

// ---------- tempo follower ----------
// 0.5 s room, then 8 syllables at 0.25 s voiced each, short gaps, then silence: starts on the voice, ends on the pause
{
  const f = S.makeFollower(8, 0.25), dt = 1 / 60; let tt = 0, started = -1, ended = -1, maxPos = 0;
  const lvl = x => x < 0.5 ? 0.001 : x < 2.9 ? ((x - 0.5) % 0.3 < 0.25 ? 0.05 : 0.001) : 0.001;
  for (; tt < 6; tt += dt) { S.follow(f, lvl(tt), dt); if (f.state === 'talk' && started < 0) started = tt; maxPos = Math.max(maxPos, f.pos); if (f.state === 'done') { ended = tt; break } }
  if (started < 0.5 || started > 0.65) fail('follow', `started at ${started.toFixed(2)} s, voice at 0.50 s`);
  if (ended < 3.5 || ended > 4.2) fail('follow', `ended at ${ended.toFixed(2)} s, want about 0.8 s after the voice stops (2.9 s)`);
  if (maxPos < 6.5) fail('follow', `marking reached syllable ${maxPos.toFixed(1)} of 8`);
  if (S.tooShort(f.voiced, 8, 0.25)) fail('follow', 'a full line was called too short');
}
{ // a pause in the middle of the line does not end it
  const f = S.makeFollower(10, 0.25), dt = 1 / 60;
  const lvl = x => (x > 0.2 && x < 1.0) || x > 2.2 ? 0.05 : 0.001;
  for (let tt = 0; tt < 2.2; tt += dt) S.follow(f, lvl(tt), dt);
  eq('follow: a pause halfway keeps listening', f.state, 'talk');
}
{ // noise floor: a louder room raises the start threshold
  const f = S.makeFollower(4, 0.25), dt = 1 / 60;
  for (let tt = 0; tt < 3; tt += dt) S.follow(f, 0.004, dt);
  eq('follow: steady room noise does not start a take', f.state, 'wait');
}
{ // a pause after a comma puts the marking at the comma and re-estimates the tempo; a pause near the end finishes the line
  const ws = S.wordsOf('Hallo daar, kom je mee naar het bos?', 'nl');
  eq('follow: stops at punctuation', S.stopsOf(ws), [3]);
  const f = S.makeFollower(S.sylTotal(ws), 0.3, S.stopsOf(ws)), dt = 1 / 60; // spoken at 0.2 s per syllable
  const lvl = x => (x > 0.2 && x < 0.8) || (x > 1.3 && x < 2.3) ? 0.05 : 0.001;
  let atComma = 0, atEnd = 0;
  for (let tt = 0; tt < 2.8; tt += dt) { S.follow(f, lvl(tt), dt); if (tt > 1.2 && tt < 1.25) atComma = f.pos; atEnd = f.pos }
  if (Math.abs(atComma - 3) > 0.05) fail('follow', `marking at ${atComma.toFixed(2)} after the comma, want 3`);
  if (atEnd < S.sylTotal(ws) - 0.1) fail('follow', `marking at ${atEnd.toFixed(2)} after the last word, want ${S.sylTotal(ws)}`);
  eq('follow: the snap does not end the line', f.state, 'talk');
}
eq('tempo learning stays in range', [S.learnTempo(0.3, 0.2 * 10, 10), S.learnTempo(0.3, 100, 10), S.learnTempo(0.3, 1, 2)], [0.25, 0.6, 0.3]);

{ // sound per character
  eq('fx defaults', S.fxOf({}), { pitch: 0, effect: '', room: 'none' });
  eq('fx is cleaned', S.fxOf({ fx: { pitch: 40, effect: 'boom', room: 'cave' } }), { pitch: 12, effect: '', room: 'none' });
  eq('fx presets are valid', Object.values(S.FX_PRESETS).every(p => JSON.stringify(S.fxOf({ fx: p })) === JSON.stringify(p)), true);
  eq('preset found back', [S.fxPreset(S.FX_PRESETS.troll), S.fxPreset({ pitch: 1, effect: '', room: 'none' })], ['troll', '']);
  const sr = 48000, tone = Float32Array.from({ length: sr }, (_, i) => Math.sin(2 * Math.PI * 200 * i / sr) * 0.3);
  eq('an octave up is half as long', S.pitchShift(tone, 12).length, sr / 2);
  eq('no fx leaves the take as it is', S.applyFx(tone, sr, S.fxOf({})) === tone, true);
  const up = S.applyFx(tone, sr, { pitch: 4, effect: 'grumble', room: 'none' });
  eq('fx output is levelled and finite', [up.every(Number.isFinite), Math.abs(S.loudness(up, sr) - S.TAKE_LUFS) < 0.5], [true, true]);
  eq('the original take is untouched', tone[100], Math.fround(Math.sin(2 * Math.PI * 200 * 100 / sr) * 0.3));
}
{ // script file: export, plain text, sync on id
  const s = S.newScript('Tutorial', 'nl', 'Bos'); const g = S.newCharacter('Gids'); g.color = 0; s.characters.push(g);
  const a = S.addLine(s, 'Bos'); a.character = g.id; a.text = 'Hallo daar.'; const b = S.addLine(s, 'Bos'); b.character = g.id; b.text = 'Kom mee.';
  const f = S.toFile(s);
  eq('file format', [f.format, f.version, f.lines.length, f.characters[0].name, f.lines[0].character], ['babble-script', 1, 2, 'Gids', g.id]);
  eq('file round trip', S.parseFile(JSON.stringify(f)).lines.map(l => l.text), ['Hallo daar.', 'Kom mee.']);
  eq('not a script file', [S.parseFile('{"a":1}'), S.parseFile('{oops'), S.parseFile('  ')], [null, null, null]);
  const p = S.parseText('# Winkel\nGids: Hallo!\nWinkelier (blij): Welkom.\nWat mag het zijn?\n');
  eq('plain text', [p.characters.map(c => c.name), p.lines.map(l => [l.scene, l.character, l.dir, l.text])], [['Gids', 'Winkelier'], [['Winkel', 'Gids', '', 'Hallo!'], ['Winkel', 'Winkelier', 'blij', 'Welkom.'], ['Winkel', 'Winkelier', '', 'Wat mag het zijn?']]]);
  // a file from an assistant: one line changed, one new, one gone, a new babble character by name
  const inc = S.parseFile(JSON.stringify({ format: 'babble-script', version: 1, characters: [{ id: g.id, name: 'Gids' }, { name: 'Fern', kind: 'babble', style: 'vemmo' }],
    lines: [{ id: a.id, scene: 'Bos', character: g.id, text: 'Hallo daar, reiziger.' }, { scene: 'Bos', character: 'Fern', text: 'Bloopa!' }] }));
  eq('plan', S.planImport(s, inc), { add: 1, change: 1, same: 0, gone: [b.id], newChars: 1 });
  const take = { [a.id + 't']: { line: a.id, text: 'Hallo daar.' } }; a.take = a.id + 't';
  const kept = JSON.parse(JSON.stringify(s)); eq('keep gone lines', [S.applyImport(kept, inc, false), kept.lines.length], [[], 3]);
  eq('apply', [S.applyImport(s, inc, true), s.lines.map(l => l.text), s.characters.map(c => c.name + ':' + c.kind), s.lines[1].character === s.characters[1].id], [[b.id], ['Hallo daar, reiziger.', 'Bloopa!'], ['Gids:record', 'Fern:babble'], true]);
  eq('changed text means redo, take kept', S.lineStatus(s.lines[0], take, s), 'redo');
  eq('same plain text again changes nothing', S.planImport(s, S.parseText('# Bos\nGids: Hallo daar, reiziger.\nFern: Bloopa!')), { add: 0, change: 0, same: 2, gone: [], newChars: 0 });
}
if (problems) { console.log(`\n${problems} problem(s)`); process.exit(1) }
console.log('script ok: lines and scenes, status, next line, words, alignment, loudness, takes, tempo follower');
