// Godot addon vs web module: the same lines must give the same sound. Needs Godot 4:
//   GODOT="path/to/Godot_console.exe" node tests/godot.mjs
// It copies addons/babble_engine into a temporary Godot project, so the repo itself is no Godot project.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
const require = createRequire(import.meta.url);
const B = require('../site/src/engine.js');
const root = new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const GODOT = process.env.GODOT || 'godot';

const TEXT = 'Hi! I found three apples. Do you want one?';
const cases = [];
for (const s of B.styles().filter(s => ['animal', 'sim'].includes(s.id)))
  for (const v of s.voices) cases.push({ text: TEXT, options: { style: s.id, voice: v.id, seed: 5 } });
for (const style of ['animal', 'sim']) {
  for (const mood of ['happy', 'angry', 'sad', 'flirty', 'surprised']) cases.push({ text: TEXT, options: { style, mood, seed: 2 } });
  cases.push({ text: 'Hahaha, Élodie said ça va... OK?! Wait: 42 ships!', options: { style, seed: 9 } });
  cases.push({ text: 'Short.', options: { style, seed: 1, sample_rate: 22050 } });
  cases.push({ text: TEXT, options: { style, seed: 77, pitch: 300, speed: 1.3, expression: 0.9, throat: 1.2, breath: 0.4, brightness: 0.6, hiss: 0 } });
  cases.push({ text: '', options: { style } });
}
const bad = [{ style: 'nope' }, { style: 'sim', voice: 'nope' }, { mood: 'nope' }];
for (const o of bad) cases.push({ text: 'Hi', options: o, bad: true });

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'babble-godot-'));
fs.cpSync(path.join(root, 'addons'), path.join(dir, 'addons'), { recursive: true });
fs.copyFileSync(path.join(root, 'tests/godot/runner.gd'), path.join(dir, 'runner.gd'));
fs.writeFileSync(path.join(dir, 'project.godot'), 'config_version=5\n\n[application]\nconfig/name="babble-test"\n');
fs.writeFileSync(path.join(dir, 'cases.json'), JSON.stringify(cases));
fs.mkdirSync(path.join(dir, 'out'));
const run = args => execFileSync(GODOT, ['--headless', '--path', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000 });
let log = '';
try { log += run(['--import', '--quit-after', '2']); log += run(['-s', 'runner.gd', '--quit-after', '2']) }
catch (e) { console.log(e.stdout || '', e.stderr || e.message); process.exit(1) }
if (/SCRIPT ERROR|Parse Error/.test(log)) { console.log(log); process.exit(1) }
const summary = JSON.parse(fs.readFileSync(path.join(dir, 'out/summary.json'), 'utf8'));

let problems = 0, worst = 0, gdMs = 0, jsMs = 0;
const fail = (what, msg) => { problems++; console.log(`[${what}] ${msg}`) };
cases.forEach((c, i) => {
  const g = summary[i], id = `${i} ${JSON.stringify(c.options)}`;
  if (c.bad) { if (!g.error) fail('errors', `${id}: no error`); return }
  if (g.error) return fail('render', `${id}: Godot gave an error`);
  const { sample_rate, ...rest } = c.options;
  const t0 = performance.now(), j = B.render(c.text, { ...rest, sampleRate: sample_rate });
  jsMs += performance.now() - t0; gdMs += g.ms;
  const buf = fs.readFileSync(path.join(dir, `out/${i}.f32`)), gp = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  if (gp.length !== j.pcm.length) return fail('length', `${id}: Godot ${gp.length}, web ${j.pcm.length} samples`);
  let d = 0; for (let k = 0; k < gp.length; k++) d = Math.max(d, Math.abs(gp[k] - j.pcm[k]));
  worst = Math.max(worst, d);
  if (d > 1e-4) fail('samples', `${id}: max difference ${d.toExponential(2)}`);
  if (g.syllables.length !== j.syllables.length || g.syllables.some((s, k) => s.text !== j.syllables[k].text || Math.abs(s.time - j.syllables[k].time) > 1e-9))
    fail('syllables', `${id}: ${JSON.stringify(g.syllables.slice(0, 4))} vs ${JSON.stringify(j.syllables.slice(0, 4))}`);
});
fs.rmSync(dir, { recursive: true, force: true });
if (problems) { console.log(`\n${problems} problem(s)`); process.exit(1) }
console.log(`godot ok: ${cases.length} cases match the web module (max difference ${worst.toExponential(1)}); Godot ${(gdMs / 1000).toFixed(1)} s, web ${(jsMs / 1000).toFixed(1)} s`);
