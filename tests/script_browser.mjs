// Browser test of the Script studio (task flows 1 and 3 of dossier/bouwbrief-script.md) plus the IndexedDB upgrade.
// Needs playwright-core and Chrome: PLAYWRIGHT=<path to playwright-core> node tests/script_browser.mjs
// (not in npm test: the repo has no dependencies). Serves site/ itself on a free port.
// The fake microphone plays a WAV made here: room tone, a babble line, a pause, on repeat. A tone, not a voice:
// a real voice still needs a manual check.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const SITE = path.join(ROOT, 'site');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright-core');
const B = require(path.join(SITE, 'src/engine.js'));
let problems = 0;
const fail = (what, msg) => { problems++; console.log(`[${what}] ${msg}`) };
const check = (what, ok, msg) => { if (!ok) fail(what, msg) };

// ---------- fake microphone: 1 s room, the line, 2.5 s room ----------
const sr = 48000, voice = B.render('Hallo daar, kom je mee naar het bos?', { style: 'sim', seed: 4, sampleRate: sr }).pcm;
const pad = n => Float32Array.from({ length: n }, (_, i) => (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.0004);
const loop = new Float32Array(sr + voice.length + sr * 2.5);
loop.set(pad(sr)); loop.set(voice.map(v => v * 0.5), sr); loop.set(pad(loop.length - sr - voice.length), sr + voice.length);
const wavPath = path.join(os.tmpdir(), 'babble-fake-mic.wav');
fs.writeFileSync(wavPath, Buffer.from(B.toWav(loop, sr)));

// ---------- static server for site/ ----------
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.xml': 'application/xml' };
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(SITE, p);
  if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ channel: 'chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${wavPath}`, '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
await ctx.grantPermissions(['microphone'], { origin: BASE });
const pg = await ctx.newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
const ev = (fn, arg) => pg.evaluate(fn, arg);

// ---------- IndexedDB upgrade: a voice saved by the old version (1) is still there ----------
await pg.goto(BASE + '/robots.txt');
await ev(() => new Promise((res, rej) => { const r = indexedDB.open('babble-machine', 1); r.onupgradeneeded = () => r.result.createObjectStore('voices', { keyPath: 'id' });
  r.onsuccess = () => { const db = r.result, tx = db.transaction('voices', 'readwrite');
    tx.objectStore('voices').put({ id: 'vOld', name: 'Old voice', created: 1, script: 'basis', median: 200, labeled: true, complete: true, linesDone: 23, linesTotal: 23, grains: [{ d: new Float32Array(480), c: 'k', v: 'a', pos: 0, f0: 200 }] });
    tx.oncomplete = () => { db.close(); res() } }; r.onerror = () => rej(r.error) }));
await pg.goto(BASE + '/#script'); await pg.waitForSelector('#viewScript:not([hidden]) #scDoc .ln', { timeout: 5000 });
// the first visit shows an example script: lines to record, babble lines and a mixed line
const exs = await ev(() => ({ n: SC.doc.lines.length, scenes: SC.doc.scenes.length, kinds: [...new Set(SC.doc.lines.map(l => SCR.lineStatus(l, SC.takes, SC.doc)))].sort(), mixed: SC.doc.lines.some(l => SCR.partsOf(l.text).has), title: SC.doc.title }));
check('example', exs.n === 6 && exs.scenes === 2 && exs.kinds.join() === 'babble,todo' && exs.mixed && /Voorbeeld|Example/.test(exs.title), `example script ${JSON.stringify(exs)}`);
await pg.click('#scMore'); await pg.click('#scNew'); await pg.waitForSelector('#scEmpty:not([hidden])');
const up = await ev(() => new Promise(res => { const r = indexedDB.open('babble-machine'); r.onsuccess = () => { const db = r.result; res({ v: db.version, stores: [...db.objectStoreNames].sort() }); db.close() } }));
check('upgrade', up.v === 2 && up.stores.join() === 'scripts,takes,voices', `db ${JSON.stringify(up)}`);
await pg.click('#navVoices'); await pg.waitForTimeout(200);
check('upgrade', (await pg.textContent('#vlist')).includes('Old voice'), 'the version 1 voice is missing under My voices');

// ---------- flow 1: new script, type lines, character "Gids", speak them, takes kept ----------
await pg.click('#navScript'); await pg.waitForSelector('#scEmpty:not([hidden])');
check('empty', (await pg.textContent('#scEmpty')).length > 10, 'empty state without explanation');
await pg.fill('#scTitle', 'Tutorial');
await pg.click('#scWho .sc-who'); await pg.fill('#chList input', 'Gids'); await pg.click('#chClose');
await pg.click('#scFirst');
await pg.keyboard.type('Hallo daar, kom je mee naar het bos?'); await pg.keyboard.press('Enter');
await pg.keyboard.type('Kom je mee naar het bos, hallo daar?');
// a line reads as text; the one you work on is open with its controls
const rows = () => ev(() => [...document.querySelectorAll('#scDoc .ln')].map(li => ({ who: li.querySelector('.sc-whosel') ? li.querySelector('.sc-whosel').selectedOptions[0].textContent : li.querySelector('.ln-who').textContent, text: li.querySelector('.sc-txt') ? li.querySelector('.sc-txt').value : li.querySelector('.ln-t .tx').textContent, st: li.querySelector('.ln-st').className })));
const open = async sel => { await ev(sel => { const li = document.querySelector(sel); if (!li.querySelector('.sc-txt')) li.querySelector('.ln-t').click() }, sel); await pg.focus(sel + ' .sc-txt') };
const doc = await rows();
check('flow1', doc.length === 2 && doc.every(d => d.who === 'Gids'), `lines ${JSON.stringify(doc)}`);
check('prompter', (await pg.textContent('#pmLine')).replace(/\s/g, '') === 'Komjemeenaarhetbos,hallodaar?', `prompter shows "${await pg.textContent('#pmLine')}"`);
// back to the first line, then record: both lines in one hands-free session
await open('#scDoc .ln:first-child');
await pg.click('#pmRec');
await pg.waitForFunction(() => document.getElementById('pmStatTxt').textContent && document.getElementById('pmStat').classList.contains('rec'), null, { timeout: 5000 });
const words = await ev(() => document.querySelectorAll('#pmLine .w').length);
check('prompter', words === 8, `${words} words in the prompter`);
let sawNow = false;
for (let i = 0; i < 80 && !sawNow; i++) { sawNow = await ev(() => !!document.querySelector('#pmLine .w.now')); await pg.waitForTimeout(100) }
check('follow', sawNow, 'no word was marked while the voice played');
await pg.waitForFunction(() => !document.getElementById('pmStat').classList.contains('rec'), null, { timeout: 30000 }).catch(() => fail('flow1', 'the session did not end by itself after the last line'));
const after = await ev(() => ({ st: [...document.querySelectorAll('#scDoc .ln-st')].map(x => x.className), note: document.getElementById('pmNote').textContent, takes: document.querySelectorAll('#pmTakes .tk').length }));
check('flow1', after.st.every(c => c.includes('done')), `status after recording ${JSON.stringify(after)}`);
const durs = await ev(() => new Promise(res => { const r = indexedDB.open('babble-machine'); r.onsuccess = () => { const q = r.result.transaction('takes').objectStore('takes').getAll(); q.onsuccess = () => res(q.result.map(t => ({ dur: t.dur, sr: t.sr, n: t.pcm.length, warn: t.warn }))) } }));
check('takes', durs.length === 2, `${durs.length} takes stored`);
const vDur = voice.length / sr;
durs.forEach((d, i) => check('takes', d.dur > vDur - 0.6 && d.dur < vDur + 0.6, `take ${i + 1} is ${d.dur.toFixed(2)} s, the voice is ${vDur.toFixed(2)} s`));

// ---------- another take of a recorded line, and choosing none ----------
await open('#scDoc .ln:first-child'); await ev(() => document.activeElement.blur());
check('again', /Nog een take|Another take/.test(await pg.textContent('#pmRecTxt')) && !(await ev(() => document.getElementById('pmRec').disabled)), `record button on a recorded line: "${await pg.textContent('#pmRecTxt')}"`);
const firstId = await ev(() => SCR.ordered(SC.doc)[0].id);
await pg.click('#pmRec');
await pg.waitForFunction(() => document.getElementById('pmStat').classList.contains('rec'), null, { timeout: 5000 });
await pg.waitForFunction(() => !document.getElementById('pmStat').classList.contains('rec'), null, { timeout: 30000 }).catch(() => fail('again', 'the session did not stop after another take'));
const ag = await ev(id => ({ cur: SC.cur, n: Object.values(SC.takes).filter(k => k.line === id).length, chosen: SC.doc.lines.find(l => l.id === id).take, last: Object.values(SC.takes).filter(k => k.line === id).sort((a, b) => a.created - b.created).pop().id, picks: [...document.querySelectorAll('#pmTakes .tk-pick')].map(b => b.getAttribute('aria-pressed')) }), firstId);
check('again', ag.cur === firstId && ag.n === 2 && ag.chosen === ag.last && ag.picks.join() === 'false,true', `another take ${JSON.stringify(ag)}`);
await pg.click('#pmTakes .tk:nth-of-type(2) .tk-pick'); // the chosen one again: none
const none = await ev(id => ({ take: SC.doc.lines.find(l => l.id === id).take, st: document.querySelector('#scDoc .ln:first-child .ln-st').className, rec: document.getElementById('pmRecTxt').textContent }), firstId);
check('again', !none.take && none.st.includes('todo') && /Opnemen|Record/.test(none.rec), `no take chosen ${JSON.stringify(none)}`);
await pg.click('#pmTakes .tk-pick'); // take 1 back
check('again', await ev(id => SCR.lineStatus(SC.doc.lines.find(l => l.id === id), SC.takes, SC.doc) === 'done', firstId), 'choosing take 1 again did not mark the line recorded');

// ---------- reload: script and takes come back ----------
await pg.reload(); await pg.waitForSelector('#viewScript:not([hidden]) #scDoc .ln');
const back = await ev(() => ({ title: document.getElementById('scTitle').value, st: [...document.querySelectorAll('#scDoc .ln-st')].map(x => x.className) }));
check('saved', back.title === 'Tutorial' && back.st.length === 2 && back.st.every(c => c.includes('done')), `after reload ${JSON.stringify(back)}`);

// ---------- flow 3: change the text of a recorded line ----------
await open('#scDoc .ln:first-child'); await pg.keyboard.press('End'); await pg.keyboard.type(' Nu!');
const f3 = await ev(() => ({ st: document.querySelector('#scDoc .ln:first-child .ln-st').className, txt: document.querySelector('#scDoc .ln:first-child .ln-st').title, pm: document.getElementById('pmLine').textContent, old: document.querySelector('#pmTakes .tag') && document.querySelector('#pmTakes .tag').textContent }));
check('flow3', f3.st.includes('redo') && f3.txt.length > 5, `status after edit ${JSON.stringify(f3)}`);
check('flow3', f3.pm.includes('Nu!'), 'the prompter did not follow the edit');
check('flow3', !!f3.old, 'the take is not marked as recorded with earlier text');

// ---------- keyboard: move a line with the arrow keys on its handle ----------
await pg.focus('#scDoc .ln:nth-child(2) .ln-grip'); await pg.keyboard.press('ArrowUp');
const moved = (await rows())[0].text;
check('keyboard', moved.startsWith('Kom je mee'), `first line after moving up: "${moved}"`);

// ---------- flow 4: a babble character; its lines play, and play as the cue before your line ----------
await pg.click('#scAddChar'); await pg.fill('#chList li:last-child input', 'Winkelier');
await pg.selectOption('#chList li:last-child .ch-kind', 'babble');
check('flow4', await pg.isVisible('#chList li:last-child .ch-bab select'), 'no style and voice for a babble character');
await pg.click('#chClose');
await open('#scDoc .ln:last-child'); await pg.keyboard.press('End'); await pg.keyboard.press('Enter');
await pg.selectOption('#scDoc .ln:last-child .sc-whosel', { label: 'Winkelier' }); await pg.click('#scDoc .ln:last-child .sc-txt');
await pg.keyboard.type('Goedemiddag, wat mag het zijn?');
await pg.click('#scDoc .ln:last-child .sc-txt'); await pg.keyboard.press('Enter');
await pg.selectOption('#scDoc .ln:last-child .sc-whosel', { label: 'Gids' }); await pg.click('#scDoc .ln:last-child .sc-txt');
await pg.keyboard.type('Hallo daar, kom je mee naar het bos?');
const bab = '#scDoc .ln:nth-last-child(2)';
check('flow4', /♪/.test(await pg.textContent(bab + ' .ln-st')), 'the babble line has no babble status');
await pg.click(bab + ' .ln-play');
check('flow4', (await pg.textContent(bab + ' .ln-play')) === '■', 'the babble line does not play');
await pg.click(bab + ' .ln-play');
await open(bab);
const nTakes = async () => ev(() => new Promise(res => { const r = indexedDB.open('babble-machine'); r.onsuccess = () => { const q = r.result.transaction('takes').objectStore('takes').getAll(); q.onsuccess = () => res(q.result) } }));
const before = (await nTakes()).length;
await pg.click('#pmRec');
await pg.waitForFunction(() => document.getElementById('pmStat').classList.contains('cue'), null, { timeout: 5000 }).catch(() => fail('cue', 'the babble line did not play as a cue'));
check('cue', (await pg.textContent('#pmWho')) === 'Winkelier', `prompter shows ${await pg.textContent('#pmWho')} during the cue`);
await pg.waitForFunction(() => !document.getElementById('pmStat').classList.contains('cue') && document.getElementById('pmStat').classList.contains('rec'), null, { timeout: 10000 }).catch(() => fail('cue', 'listening did not start after the cue'));
check('cue', (await pg.textContent('#pmWho')) === 'Gids', 'the prompter did not go back to your line after the cue');
await pg.waitForFunction(() => !document.getElementById('pmStat').classList.contains('rec'), null, { timeout: 40000 }).catch(() => fail('cue', 'the session did not end'));
const lastLine = await ev(() => { const li = document.querySelector('#scDoc .ln:last-child'); return li.dataset.id });
const cueTakes = (await nTakes()).filter(x => x.line === lastLine);
// the fake microphone loops, so listening may start halfway through its line: the take can be shorter, never longer
check('cue', cueTakes.length === 1 && cueTakes[0].dur > 0.3 && cueTakes[0].dur < vDur + 0.6, `takes of the line after the cue: ${JSON.stringify(cueTakes.map(x => x.dur))}, voice ${vDur.toFixed(2)} s`);
check('cue', (await nTakes()).length > before, 'no take was stored');
const ph = await pg.isVisible('#pmPhones');
check('cue', ph, 'no headphones hint with babble and real voices in one script');

// ---------- mixed line: the first words of a babble line spoken yourself, the rest babbles ----------
await open(bab); await ev(sel => { const tx = document.querySelector(sel + ' .sc-txt'); tx.focus(); tx.setSelectionRange(0, 5) }, bab);
await pg.click(bab + ' .sc-mark');
const mixed = await ev(sel => ({ text: document.querySelector(sel + ' .sc-txt').value, st: document.querySelector(sel + ' .ln-st').className, mark: !!document.querySelector(sel + ' .sc-hl mark') }), bab);
check('mixed', mixed.text === '[Goedemiddag,] wat mag het zijn?' && mixed.st.includes('todo') && mixed.mark, `after marking ${JSON.stringify(mixed)}`);
await open(bab);
check('mixed', (await ev(() => [document.querySelectorAll('#pmLine .w').length, document.querySelectorAll('#pmLine .wb').length])).join() === '1,4', 'the prompter does not set the spoken part apart from the babble');
await pg.click('#pmRec');
await pg.waitForFunction(() => document.getElementById('pmStat').classList.contains('rec'), null, { timeout: 5000 });
await pg.waitForFunction(() => !document.getElementById('pmStat').classList.contains('rec'), null, { timeout: 40000 }).catch(() => fail('mixed', 'the session did not end'));
const babId = await ev(sel => document.querySelector(sel).dataset.id, bab);
const mixTakes = (await nTakes()).filter(x => x.line === babId);
check('mixed', mixTakes.length === 1 && mixTakes[0].text === 'Goedemiddag,', `takes of the mixed line ${JSON.stringify(mixTakes.map(x => x.text))}`);
check('mixed', (await ev(sel => document.querySelector(sel + ' .ln-st').className, bab)).includes('done'), 'the mixed line is not recorded after its take');
await pg.click(bab + ' .ln-play');
check('mixed', (await pg.textContent(bab + ' .ln-play')) === '■', 'the mixed line does not play');
await pg.click(bab + ' .ln-play');

// ---------- an audio file as a take (an AI voice for the spoken part), and a file that is not audio ----------
const filePath = path.join(os.tmpdir(), 'babble-hallo.wav'), badPath = path.join(os.tmpdir(), 'babble-bad.wav');
fs.writeFileSync(filePath, Buffer.from(B.toWav(voice.slice(0, sr), sr))); fs.writeFileSync(badPath, 'not audio');
await open(bab);
for (const f of [filePath, badPath]) { const [fc] = await Promise.all([pg.waitForEvent('filechooser'), pg.click(bab + ' .sc-file')]); await fc.setFiles(f); await pg.waitForTimeout(600) }
check('file', /WAV/.test(await pg.textContent('#pmNote')), `no message for a file that is not audio: "${await pg.textContent('#pmNote')}"`);
const fileTakes = (await nTakes()).filter(x => x.line === babId);
check('file', fileTakes.length === 2 && fileTakes[1].file === 'babble-hallo.wav' && fileTakes[1].text === 'Goedemiddag,', `takes after the file ${JSON.stringify(fileTakes.map(x => [x.file, x.text]))}`);
check('file', (await ev(() => [...document.querySelectorAll('#pmTakes .tag')].map(x => x.textContent))).length >= 1, 'the file take has no label');

// ---------- scenes: a second scene, delete it by merging; duplicate the script with its takes ----------
const nLines = (await rows()).length;
await pg.click('#scAddScene2'); await pg.keyboard.type('Tot ziens!');
check('scenes', (await ev(() => document.querySelectorAll('#scScenes li').length)) === 2, 'no second scene in the overview');
await pg.click('#scS1 h3 .more'); await pg.click('#scS1 h3 .menu .danger'); await pg.click('#sdMerge');
check('scenes', (await ev(() => document.querySelectorAll('#scScenes li').length)) === 1 && (await rows()).length === nLines + 1, 'merging the scene lost lines or kept the scene');
await pg.click('#scMore'); await pg.click('#scDup'); await pg.waitForTimeout(400);
const dup = await ev(() => ({ title: document.getElementById('scTitle').value, done: [...document.querySelectorAll('#scDoc .ln-st')].filter(x => x.classList.contains('done')).length }));
check('duplicate', /Tutorial/.test(dup.title) && dup.title !== 'Tutorial' && dup.done >= 3, `copy ${JSON.stringify(dup)}`);

// ---------- sound per character (step 3): a preset changes playback, the stored take stays as recorded ----------
await pg.click('#scWho .sc-who'); await pg.selectOption('#chList li:first-child .fx-pre', 'giant');
const snd = await ev(async () => { const l = SC.doc.lines.find(x => x.take && SC.takes[x.take] && SCR.kindOf(SC.doc, x) === 'record'), tk = SC.takes[l.take], n = tk.pcm.length, b = await scTakeBuf(tk);
  return { fx: charOf(l.character).fx, n, out: b.length, want: Math.floor((n - 1) / Math.pow(2, -6 / 12)) + 1 + irData[0].length, same: tk.pcm.length === n, note: document.querySelector('#chList li:first-child .fx-note').textContent } });
check('sound', snd.fx && snd.fx.room === 'big' && snd.out === snd.want && snd.same && snd.note.length > 3, `sound ${JSON.stringify(snd)}`);
await pg.click('#chClose');
await pg.waitForFunction(() => /·/.test(document.querySelector('#scWho .sc-who small').textContent), null, { timeout: 3000 }).catch(() => fail('sound', 'the overview does not show the sound'));

// ---------- step 4: export for the game, script file round trip, backup, audio files by line id, pasted text ----------
const unzip = buf => { const out = {}; let p = 0; while (p + 30 <= buf.length && buf.readUInt32LE(p) === 0x04034b50) { const n = buf.readUInt32LE(p + 18), nl = buf.readUInt16LE(p + 26), xl = buf.readUInt16LE(p + 28); out[buf.toString('utf8', p + 30, p + 30 + nl)] = buf.subarray(p + 30 + nl + xl, p + 30 + nl + xl + n); p += 30 + nl + xl + n } return out };
const grab = async btn => { const [d] = await Promise.all([pg.waitForEvent('download'), pg.click(btn)]); const f = path.join(os.tmpdir(), 'babble-' + d.suggestedFilename()); await d.saveAs(f); return { name: d.suggestedFilename(), buf: fs.readFileSync(f), file: f } };
await ev(() => { const w = SC.doc.characters.find(c => c.kind === 'babble'), l = SCR.addLine(SC.doc, SC.doc.scenes[0]); l.character = w.id; l.text = 'Fijne dag nog!'; saveDoc(true); scRenderDoc() }); // a plain babble line
await pg.click('#scExport2');
const game = await grab('#xpGame'), gz = unzip(game.buf), gj = JSON.parse(gz['script.json']);
const wavs = Object.keys(gz).filter(k => k.endsWith('.wav'));
check('export', game.name.endsWith('.zip') && gj.format === 'babble-script-export' && wavs.length >= 4 && gj.lines.every(l => !l.file || gz[l.file]), `game zip ${game.name}: ${Object.keys(gz).join(', ')}`);
check('export', gj.lines.some(l => l.babble && l.babble.style) && gj.lines.some(l => l.syllables && l.syllables.length) && gj.lines.some(l => l.mixed), 'script.json lacks babble options, syllables or the mixed line');
check('export', wavs.every(k => gz[k].toString('ascii', 0, 4) === 'RIFF'), 'a file in the zip is not a WAV');
const sf = await grab('#xpScript'), sj = JSON.parse(sf.buf.toString('utf8'));
check('export', sf.name.endsWith('.babble-script.json') && sj.format === 'babble-script' && sj.lines.length === gj.lines.length, `script file ${sf.name}`);
const bk = await grab('#xpBackup'), bz = unzip(bk.buf);
check('backup', !!bz['script.babble-script.json'] && Object.keys(bz).filter(k => k.startsWith('takes/')).length >= 4, `backup ${Object.keys(bz).length} files`);
await pg.click('#xpClose');
// the script file edited (as an assistant would): first line new text, one line gone, one new line
const ed = JSON.parse(JSON.stringify(sj)); ed.lines[0].text = 'Welkom in het bos.'; const goneId = ed.lines.pop().id; ed.lines.push({ scene: ed.lines[0].scene, character: 'Gids', text: 'Tot de volgende keer!' });
const edPath = path.join(os.tmpdir(), 'babble-edited.babble-script.json'); fs.writeFileSync(edPath, JSON.stringify(ed));
await pg.click('#scMore'); await pg.click('#scImportBtn'); await pg.setInputFiles('#ioPick1', edPath); await pg.waitForSelector('#ioPlan:not([hidden])');
const sum = await pg.textContent('#ioSum');
check('import', /^1 /.test(sum) && /1 changed|1 gewijzigd/.test(sum) && await pg.isVisible('#ioGoneRow'), `summary "${sum}"`);
await pg.check('#ioGone'); await pg.click('#ioApply');
const after4 = await ev(gid => ({ n: SC.doc.lines.length, gone: SC.doc.lines.some(l => l.id === gid), first: SCR.lineStatus(SCR.ordered(SC.doc)[0], SC.takes, SC.doc), last: SCR.plain(SCR.ordered(SC.doc).slice(-1)[0].text) }), goneId);
check('import', after4.n === sj.lines.length && !after4.gone && after4.first === 'redo' && after4.last === 'Tot de volgende keer!', `after import ${JSON.stringify(after4)}`);
// pasted text: same lines again change nothing; a new line is new
await pg.click('#scMore'); await pg.click('#scImportBtn'); await pg.fill('#ioText', 'Gids: Tot de volgende keer!\nGids: Nog eentje.'); await pg.click('#ioRead');
check('paste', /^1 /.test(await pg.textContent('#ioSum')), `paste summary "${await pg.textContent('#ioSum')}"`); await pg.click('#ioBack');
// audio files named by line id
const lastId = await ev(() => SCR.ordered(SC.doc).slice(-1)[0].id), named = path.join(os.tmpdir(), lastId + '.wav'), stray = path.join(os.tmpdir(), 'nope.wav');
fs.writeFileSync(named, Buffer.from(B.toWav(voice.slice(0, sr), sr))); fs.writeFileSync(stray, Buffer.from(B.toWav(voice.slice(0, sr), sr)));
await pg.setInputFiles('#ioPick2', [named, stray]); await pg.waitForSelector('#ioErr:not([hidden])');
check('audio files', /1 /.test(await pg.textContent('#ioErr')) && /nope.wav/.test(await pg.textContent('#ioErr')), `audio files "${await pg.textContent('#ioErr')}"`);
check('audio files', await ev(id => SCR.lineStatus(SC.doc.lines.find(l => l.id === id), SC.takes, SC.doc) === 'done', lastId), 'the named file did not become the take of its line');
// the backup comes back as a new script with its takes
await pg.setInputFiles('#ioPick1', bk.file); await pg.waitForSelector('#ioPlan:not([hidden])'); await pg.click('#ioApply'); await pg.waitForTimeout(400);
const rest = await ev(() => ({ list: SC.list.length, takes: Object.keys(SC.takes).length, done: SC.doc.lines.filter(l => SCR.lineStatus(l, SC.takes, SC.doc) === 'done').length }));
check('backup', rest.takes >= 4 && rest.done >= 3, `restored ${JSON.stringify(rest)}`);

// ---------- Big: F and Esc ----------
await ev(() => document.activeElement.blur());
await pg.keyboard.press('f'); check('big', await ev(() => document.body.classList.contains('sc-focus')), 'F did not make the prompter big');
await pg.keyboard.press('Escape'); check('big', await ev(() => !document.body.classList.contains('sc-focus')), 'Esc did not leave Big');

// ---------- phone width: no sideways scroll ----------
await pg.setViewportSize({ width: 360, height: 760 }); await pg.waitForTimeout(200);
const sw = await ev(() => document.documentElement.scrollWidth);
check('360px', sw <= 360, `page is ${sw}px wide`);
if (sw > 360) console.log(await ev(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > 361 && e.offsetParent).slice(0, 8).map(e => e.tagName + '#' + e.id + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().left) + '-' + Math.round(e.getBoundingClientRect().right) + ' ' + e.textContent.slice(0, 40) + ' in ' + e.parentElement.id + '.' + e.parentElement.className)));
await pg.screenshot({ path: path.join(os.tmpdir(), 'babble-script-360.png'), fullPage: true });
await pg.setViewportSize({ width: 1366, height: 900 });
await pg.screenshot({ path: path.join(os.tmpdir(), 'babble-script-desktop.png'), fullPage: true });

errs.forEach(e => fail('page error', e));
await browser.close(); server.close();
if (problems) { console.log(`\n${problems} problem(s)`); process.exit(1) }
console.log(`script browser ok: upgrade keeps voices, example script, flow 1 (2 takes: ${durs.map(d => d.dur.toFixed(2)).join(', ')} s), another take, choose none, reload, flow 3, keyboard move, flow 4 with cue, mixed line, audio file as take, scene merge, duplicate, sound per character, export/import/backup, Big, 360px. Screenshots in ${os.tmpdir()}`);
