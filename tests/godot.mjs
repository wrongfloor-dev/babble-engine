// Godot addon vs web module: the same lines must give the same sound. Needs Godot 4:
//   GODOT="path/to/Godot_console.exe" node tests/godot.mjs
// It copies addons/babble_engine into a temporary Godot project, so the repo itself is no Godot project.
import { createRequire } from 'module';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
const require = createRequire(import.meta.url);
const B = require('../site/src/engine.js');
const root = new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const GODOT = process.env.GODOT || 'godot';

const TEXT = 'Hi! I found three apples. Do you want one?';
const ALL = B.styles().map(s => s.id), VOICE_STYLES = ALL.filter(id => id !== 'vemmo');
const cases = [];
for (const s of B.styles())
  for (const v of s.voices) cases.push({ text: TEXT, options: { style: s.id, voice: v.id, seed: 5 } });
for (const style of ['animal', 'sim', 'bark', 'droid', 'tone', 'blip', 'radio'])
  for (const mood of ['happy', 'angry', 'sad', 'flirty', 'surprised']) cases.push({ text: TEXT, options: { style, mood, seed: 2 } });
for (const style of VOICE_STYLES) {
  cases.push({ text: 'Hahaha, Élodie said ça va... OK?! Wait: 42 ships!', options: { style, seed: 9 } });
  cases.push({ text: 'Short.', options: { style, seed: 1, sample_rate: 22050 } });
  cases.push({ text: '', options: { style } });
}
for (const style of ['animal', 'sim', 'grumble', 'echo', 'tone', 'instr'])
  cases.push({ text: TEXT, options: { style, seed: 77, pitch: 300, speed: 1.3, expression: 0.9, throat: 1.2, breath: 0.4, brightness: 0.6, hiss: 0 } });
for (const intent of B.styles().find(s => s.id === 'vemmo').intents)
  for (const length of ['short', 'medium']) for (const seed of [1, 2, 3]) cases.push({ text: '', options: { style: 'vemmo', intent, length, seed } });
for (const name of ['Pikachu', 'Élodie', 'Bulbasaur', 'Xy', 'Schnitzel'])
  cases.push({ text: 'Hello there! Who are you? I am fine.', options: { style: 'name', name, seed: 4 } });
const bad = [{ style: 'nope' }, { style: 'sim', voice: 'nope' }, { mood: 'nope' }, { style: 'vemmo', intent: 'nope' }, { style: 'name', name: 'Brr' }];
for (const o of bad) cases.push({ text: 'Hi', options: o, bad: true });

// own voice: two made-up voices (a tone per script sound, gliding, with a noise burst for the consonant), one with every round, one basic
function madeUpVoice(kinds) {
  const sr = 32000, grains = [];
  let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (const kind of kinds) B.buildScript(kind).forEach(row => row.forEach((it, pos) => {
    const f0 = 150 + rnd() * 70, L = Math.round(sr * (it.bark ? 0.34 : 0.17 + rnd() * 0.08)), g = new Float32Array(L), cl = Math.round(sr * 0.03);
    for (let j = 0, ph = 0; j < L; j++) {
      ph += f0 * (1 + 0.08 * j / L) / sr; const env = Math.sin(Math.PI * Math.min(1, j / L * 1.1)) * (it.vc && j > L * 0.6 ? 0.35 : 1);
      g[j] = env * (0.5 * Math.sin(2 * Math.PI * ph) + 0.2 * Math.sin(4 * Math.PI * ph) + 0.1 * Math.sin(6 * Math.PI * ph)) + (it.c && j < cl ? (rnd() * 2 - 1) * 0.3 : 0);
    }
    if (it.bark !== undefined) g.bark = it.bark; else { g.c = it.c; g.v = it.v; if (it.k !== undefined) g.k = it.k; if (it.vc) g.tail = true }
    g.pos = pos; g.loud = 0.8; g.f0 = Math.round(f0 * 1.04); grains.push(g);
  }));
  return JSON.stringify(B.voiceToFile({ name: 'Made up', median: 180, grains }, sr));
}
const VOICES = { full: madeUpVoice(['basis', 'extra', 'bloopa', 'ends', 'barks']), basic: madeUpVoice(['basis']) };
const OWN = 'Hi! Bob, krik, plop and hmm... OK? Wait: 42 ships!';
for (const s of B.styles().filter(s => s.ownVoice))
  cases.push({ text: OWN, voice: 'full', options: { style: s.id, seed: 3, ...(s.id === 'name' ? { name: 'Flibbo' } : {}) } });
for (const [style, steady, sample_rate] of [['sim', 0, 22050], ['animal', 0.5, 48000], ['bark', 1, 32000], ['vemmo', 1, 48000], ['echo', 0, 32000]])
  cases.push({ text: OWN, voice: 'basic', options: { style, steady, sample_rate, seed: 6, intent: 'joy', length: 'medium' } });
cases.push({ text: OWN, voice: 'full', options: { style: 'tone' }, bad: true });
cases.push({ text: OWN, bad_voice: true, options: { style: 'sim' }, bad: true });
cases.push({ text: '', load_voice: { format: 'x' }, options: {}, bad: true });

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'babble-godot-'));
fs.cpSync(path.join(root, 'addons'), path.join(dir, 'addons'), { recursive: true });
fs.copyFileSync(path.join(root, 'tests/godot/runner.gd'), path.join(dir, 'runner.gd'));
fs.copyFileSync(path.join(root, 'tests/godot/speaker.gd'), path.join(dir, 'speaker.gd'));
fs.writeFileSync(path.join(dir, 'project.godot'), 'config_version=5\n\n[application]\nconfig/name="babble-test"\n');
fs.writeFileSync(path.join(dir, 'cases.json'), JSON.stringify(cases));
for (const [k, v] of Object.entries(VOICES)) fs.writeFileSync(path.join(dir, `voice_${k}.json`), v);
const loaded = Object.fromEntries(Object.entries(VOICES).map(([k, v]) => [k, B.loadVoice(v)]));
fs.mkdirSync(path.join(dir, 'out'));
const run = args => { const r = spawnSync(GODOT, ['--headless', '--path', dir, ...args], { encoding: 'utf8', timeout: 900000 }); if (r.error) throw r.error; return (r.stdout || '') + (r.stderr || '') };
let log = '';
try { log += run(['--import', '--quit-after', '2']); log += run(['-s', 'runner.gd', '--quit-after', '2']); log += run(['-s', 'speaker.gd']) }
catch (e) { console.log(e.stdout || '', e.stderr || e.message); process.exit(1) }
if (/SCRIPT ERROR|Parse Error/.test(log) || !fs.existsSync(path.join(dir, 'out/summary.json'))) { console.log(log); process.exit(1) }
const summary = JSON.parse(fs.readFileSync(path.join(dir, 'out/summary.json'), 'utf8'));

let problems = 0, worst = 0, gdMs = 0, jsMs = 0;
const fail = (what, msg) => { problems++; console.log(`[${what}] ${msg}`) };
cases.forEach((c, i) => {
  const g = summary[i], id = `${i} ${c.voice ? c.voice + ' voice ' : ''}${JSON.stringify(c.options)}`;
  if (c.bad) { if (!g.error) fail('errors', `${id}: no error`); return }
  if (g.error) return fail('render', `${id}: Godot gave an error`);
  const { sample_rate, ...rest } = c.options;
  const t0 = performance.now(), j = B.render(c.text, { ...rest, sampleRate: sample_rate, ...(c.voice ? { ownVoice: loaded[c.voice] } : {}) });
  jsMs += performance.now() - t0; gdMs += g.ms;
  const buf = fs.readFileSync(path.join(dir, `out/${i}.f32`)), gp = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  if (gp.length !== j.pcm.length) return fail('length', `${id}: Godot ${gp.length}, web ${j.pcm.length} samples`);
  let d = 0; for (let k = 0; k < gp.length; k++) d = Math.max(d, Math.abs(gp[k] - j.pcm[k]));
  worst = Math.max(worst, d);
  if (d > 1e-4) fail('samples', `${id}: max difference ${d.toExponential(2)}`);
  if (g.syllables.length !== j.syllables.length || g.syllables.some((s, k) => s.text !== j.syllables[k].text || Math.abs(s.time - j.syllables[k].time) > 1e-9))
    fail('syllables', `${id}: ${JSON.stringify(g.syllables.slice(0, 4))} vs ${JSON.stringify(j.syllables.slice(0, 4))}`);
});
// BabbleSpeaker: the replaced line never plays, every syllable is signalled once, in order, near its time (headless audio runs ~70 ms ahead)
const sp = JSON.parse(fs.readFileSync(path.join(dir, 'out/speaker.json'), 'utf8'));
if (sp.started.length !== 1 || sp.started[0] !== 'Hi there! Wait, wrong line.') fail('speaker', `started: ${JSON.stringify(sp.started)}`);
if (!sp.finished) fail('speaker', 'line_finished never came');
if (sp.syllables.length !== sp.expected.length || sp.syllables.some(([i, t, at], n) => i !== n || t !== sp.expected[n].text || Math.abs(at - sp.expected[n].time) > 0.15))
  fail('speaker', `syllables ${JSON.stringify(sp.syllables)} vs ${JSON.stringify(sp.expected)}`);
const gdVersion = (fs.readFileSync(path.join(root, 'addons/babble_engine/babble_engine.gd'), 'utf8').match(/const VERSION := "([^"]+)"/) || [])[1];
if (gdVersion !== B.version) fail('version', `addon ${gdVersion}, web module ${B.version}`);
fs.rmSync(dir, { recursive: true, force: true });
if (problems) { console.log(`\n${problems} problem(s)`); process.exit(1) }
console.log(`godot ok: BabbleSpeaker signals every syllable; ${cases.length} cases match the web module (max difference ${worst.toExponential(1)}); Godot ${(gdMs / 1000).toFixed(1)} s, web ${(jsMs / 1000).toFixed(1)} s`);
