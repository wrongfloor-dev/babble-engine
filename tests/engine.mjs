// Engine render checks for the web module, no dependencies: node tests/engine.mjs
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const B = require('../site/src/engine.js');
let problems = 0;
const fail = (what, msg) => { problems++; console.log(`[${what}] ${msg}`) };
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const TEXT = 'Hi! I found three apples. Do you want one?';

// every style and voice: sound comes out, no NaN, within range, syllables in order
for (const s of B.styles()) for (const v of s.voices) {
  const r = B.render(TEXT, { style: s.id, voice: v.id, seed: 5 });
  const id = `${s.id}/${v.id}`;
  if (!(r.pcm instanceof Float32Array) || r.pcm.length < r.sampleRate * 0.3) fail('render', `${id}: too short (${r.pcm.length})`);
  let peak = 0, bad = 0;
  for (const x of r.pcm) { if (!Number.isFinite(x)) bad++; else peak = Math.max(peak, Math.abs(x)) }
  if (bad) fail('render', `${id}: ${bad} non-finite samples`);
  if (peak < 0.01 || peak > 1.5) fail('render', `${id}: peak ${peak.toFixed(3)}`);
  if (!r.syllables.length || r.syllables.some((x, i) => i && x.time < r.syllables[i - 1].time)) fail('render', `${id}: syllable times`);
}

// seed: same seed same sound, other seed other sound
for (const style of ['animal', 'sim', 'radio', 'echo', 'tone', 'vemmo']) {
  const a = B.render(TEXT, { style, seed: 3 }).pcm, b = B.render(TEXT, { style, seed: 3 }).pcm, c = B.render(TEXT, { style, seed: 4 }).pcm;
  if (!same(a, b)) fail('seed', `${style}: same seed gave different sound`);
  if (same(a, c)) fail('seed', `${style}: other seed gave the same sound`);
}
// a render does not leave the seeded generator behind
B.render(TEXT, { seed: 9 }); const r1 = Math.random();
if (!(r1 >= 0 && r1 < 1)) fail('seed', 'Math.random broken after render');

// options: mood names, overrides, errors
if (same(B.render(TEXT, { mood: 'happy' }).pcm, B.render(TEXT, { mood: 'angry' }).pcm)) fail('options', 'mood has no effect');
if (same(B.render(TEXT, { pitch: 200 }).pcm, B.render(TEXT, { pitch: 500 }).pcm)) fail('options', 'pitch has no effect');
for (const bad of [{ style: 'nope' }, { voice: 'nope' }, { mood: 'nope' }, { style: 'vemmo', intent: 'nope' }]) {
  let threw = false; try { B.render(TEXT, bad) } catch (e) { threw = /^Babble: /.test(e.message) }
  if (!threw) fail('options', `no clear error for ${JSON.stringify(bad)}`);
}

// WAV: valid header and length
const r = B.render('Hello', { sampleRate: 22050 }), w = new DataView(B.toWav(r));
const tag = o => String.fromCharCode(...[0, 1, 2, 3].map(i => w.getUint8(o + i)));
if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE' || tag(36) !== 'data') fail('wav', 'bad header');
if (w.getUint32(24, true) !== 22050 || w.getUint32(40, true) !== r.pcm.length * 2) fail('wav', 'rate or length wrong');

// ES module entry gives the same API, versions agree
const M = await import('../site/src/babble.mjs');
if (M.render !== B.render || M.default !== B.Babble) fail('esm', 'babble.mjs exports differ');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
if (pkg.version !== B.version) fail('version', `package.json ${pkg.version}, engine ${B.version}`);

if (problems) { console.log(`\n${problems} problem(s)`); process.exit(1) }
console.log(`engine ok: ${B.styles().reduce((n, s) => n + s.voices.length, 0)} voices in ${B.styles().length} styles render, seed repeats, WAV valid, v${B.version}`);
