# Babble Engine

Gibberish / fictional speech generator for games. Plain HTML + vanilla JS, no build step, no dependencies.

## Layout
Everything that goes online lives in `site/` (Cloudflare Workers static assets, `wrangler.jsonc`). `dossier/`, `metingen/`, `tests/` and this file stay out.
- `site/index.html` – markup for all views (make, my voices, studio steps 1–3, dialogs)
- `site/src/styles.css` – design tokens and styles. Look (redesign D, 2026-10-25): warm paper and ink outlines with a hard shadow, light by default with a dark variant; per style `body.e-*` sets `--accL/--accD` (accent, 5:1 or more with its text colour) and `--tintL/--tintD` (stage); Figtree UI font, Bagel Fat One for the logo, names and panel headings. Make screen: style cards with a mini critter (`MINI` in app.js), voices, then line and stage side by side at one height, player strip fixed at the bottom of the stage, settings below (this voice / all styles). Fonts are self-hosted in `site/fonts/` (woff2, SIL OFL; license files next to them)
- `site/src/engine.js` – all audio synthesis and analysis, no DOM. One source for the tool and the web module: loads as a plain script (global `Babble`), as CommonJS (`module.exports` at the bottom) and from `babble.mjs`.
  - `tokenize`, `prosody`, `renderSynth` (formant synthesis), `renderSample` (own-voice playback), `renderTone` (Soft Tones + Talking Instruments)
  - Vemmo: `INTENTS`, `ANCHORS`, `vemmoClip`
  - Extra voice styles: `PALETTES` + `paletteLang` (Grumble, Gizmo, Sprite, Babytalk), `babyfy`, `postFX` (grumble, gizmo, sprite, radio)
  - Styles and voices (2026-10-25, moved from app.js): `EMETA`, `ENGINE_ORDER`, `ENGINES`, `FX`, `wetFor`, `roomIR`. `styleOpts` + `renderStyle` are the render path (Echo Folk mixes four renders there); app.js `opts()`/`render()` call them. Moved bit-identical: 94 reference renders matched.
  - Seed: every noise call goes through `RND` (Math.random by default). `Babble.render` swaps in a seeded generator for one call, so the tool's sound is unchanged.
  - Web module API (`Babble`, version `BABBLE_VERSION` = `package.json`): `render(text, options)` → `{pcm, sampleRate, duration, syllables, style, voice}`, `toWav`, `play` (browser, with room), `styles`, `loadVoice`. Own voice (1.1.0, 2026-10-26): the Export button in Voices & characters downloads `<name>.babble-voice.json` (`voiceToFile`: every grain as base64 16-bit PCM plus its labels `c v pos f0 loud`, and the recording sample rate); `loadVoice` reads it, render option `ownVoice` (+ `steady`) uses it, `grainsAt` resamples to the render rate. Checked: module render of an exported voice matches the app within 16-bit rounding. English mood names map to the Dutch keys in `MOODS` (`MOOD_ALIAS`). `site/src/babble.mjs` re-exports it as an ES module, `site/src/engine.d.ts` has the types, `package.json` lets people `npm i github:wrongfloor-dev/babble-engine`. Docs: `README.md`.
  - Studio: `buildScript`, `studioSchedule`, `analyzeScriptRecording`, `splitChunk`, `estimateF0`, `makeAmbient`
  - Recording rounds (2026-10-25): `basis` (every consonant × a/e/i/o/u, 23 lines, 92 sounds, ~1:35) for a new voice, `extra` (diphthongs ai/ou/ay, 10 lines, ~0:42) added later to the same voice from My voices. Together they cover every sound the voice styles ask for. `algemeen`/`vemmo` stay only so older voices and uploads keep working. Vowels with the same `VSPEC` (a=ah, i=ee, u=oo, ay=ei) count as the same sound in `pickGrain`.
  - Own voice pitch: `pitchTrack` follows each syllable's pitch every 10 ms; `renderSample` option `steady` (0–1, slider "Pitch steadiness", `bm.steady`) holds it on the melody. Without it the output is unchanged.
- Variants and characters (2026-10-25): per style, `cur()` is the latest result and `SV()` the variants saved with "+ Save variant" (each keeps its settings; clicking one plays it and restores them, × removes it; session only). "Save as character" stores style, voice, emotion, sliders, variation (`salt`/`take`) and language seed in `localStorage` `bm.chars`; characters show under Voice and in My voices. Keep UI copy short.
- `docs/art/`: the README pictures. SVG with the site fonts embedded, made by `node docs/art/make-art.cjs` (run it again after changing styles, voices or the critters in app.js); `tool.png` is a screenshot of the tool.
- `site/src/app.js` – UI: i18n (EN/NL in `STR`), make screen, voices storage (IndexedDB `babble-machine`/`voices`: the old name is kept on purpose so voices saved earlier stay available), studio (mic, prompter, recorder)

## Rules
- Don't change synthesis algorithms for visual work.
- UI copy goes through `t()` with keys in both `STR.en` and `STR.nl`.
- One audio player at a time: always play through `pPlay()` / stop with `pStop()`.
- Studio capture runs on the audio thread (`site/src/rec-worklet.js`, AudioWorkletNode); `ScriptProcessorNode` is only a fallback. It dropped and repeated samples on a busy page (crackle, measured 2026-10-25). The mic is taken raw: `echoCancellation`, `noiseSuppression` and `autoGainControl` off. "Your recording" plays dry (straight to `ctx.destination`).
- Own voices only work with engines where `EMETA[e].rec` is true (all voice styles; not Soft Tones or Talking Instruments).
- WAV export: a plain `.wav` Blob download. Inside a claude.ai artifact (`window.claude` present) it goes through the `downloads` capability instead, zipped (that allowlist has zip, not wav).
- Strict CSP (`site/_headers`, enforced since 2026-10-25): no inline `style`/`<script>`/`on…=` in HTML, no requests to other hosts. Setting `el.style.x` from JS is fine. JSON-LD (`application/ld+json`) is allowed.
- `site/sitemap.xml` lists every public page; a page goes online only when its integration exists.

## Run / test
- Serve `site/` locally: `npx wrangler dev` (applies `_headers` and the 404 page) or `python3 -m http.server -d site`, then open http://localhost:8787 or :8000 (microphone needs http(s), not file://).
- Build check, no dependencies: `node tests/check.mjs` (STR keys EN = NL, banned writing patterns in STR and in the style and voice descriptions in app.js and engine.js, links, sitemap, strict-CSP readiness, headers).
- Engine check: `node tests/engine.mjs` (every voice renders without NaN, syllable times in order, same seed same sound, clear errors for bad options, valid WAV, `babble.mjs` exports, version = `package.json`). Both: `npm test`.
- Browser tests (Playwright, Chromium with a fake microphone): `tests/make_screen.py`, `tests/studio.py`. **Out of date** (2026-10-25): they target an older UI (`#voiceSel`, `brabbel.html`, `pw.py`) and a single-file `t2.html`; rewrite them against `site/` via a local server.
- The fake microphone is a test tone, not a voice: real voice recording still needs a manual check.

## Wrong Floor project

Project folder following the Wrong Floor method. Research and decisions live in `dossier/`, measurements in `metingen/`. Read `dossier/000-kans.md` before planning work.

| | |
|---|---|
| Working on | tool, public |
| Goal | build further: integrations (web → Godot) as a free Wrong Floor product, distributed from one public GitHub repo, plus one link-only itch.io listing (no npm, no itch.io uploads, no Unity); usage by game developers leads, proof for pitches and later income follow |
| Domain | babble.wrongfloor.studio (Cloudflare custom domain via `wrangler.jsonc`); the first address babbleengine.wrongfloor.studio redirects there (301, Cloudflare Redirect Rule) |
| Ownership confirmed | yes (2026-10-25, Raoul) |
| Code | this folder; public repo https://github.com/wrongfloor-dev/babble-engine (public) |
| Should deliver | usage: web engine use per week (jsDelivr) and Godot Asset Library downloads (`dossier/meting.md`) |
| License | code MIT; generated audio free to use, also commercially |
| Brand | own brand Babble Engine, credited "by Wrong Floor" |

### Keep and may change

| Keep | May change |
|---|---|
| Synthesis algorithms in `src/engine.js`. Approved extensions (2026-10-25), both optional, without them the sound stays bit-identical: a `seed` for the fine variation, and `hiss` (0–1) that scales consonant noise (`buildPhones`) and the radio hiss/squelch (`postFX`), set by the "Consonant hiss" slider (global, `localStorage` `bm.hiss`) | Integrations around the engine (web module, Godot addon) |
| IndexedDB name `babble-machine`/`voices`, so saved voices keep working | Export step: a normal Blob download instead of the claude.ai capability |
| EN/NL copy through `t()` | Font loading (self-host instead of Google Fonts) |
| The 11 voice styles and the studio flow | The new design, only through a design review in step 4 |

### Keuzes

| Date | Scan item | Decision |
|---|---|---|
| 2026-10-25 | ai-training | AI training allowed on purpose: being known to AI assistants helps game makers find the tool; code is MIT anyway (Raoul) |

### Where the project stands

| Step | Status | Where |
|---|---|---|
| 000 Is there something to win? | done (2026-10-25, verdict by Raoul: build pays off) | `dossier/000-kans.md` |
| 0 Measurement | plan written; Search Console verified for babble.wrongfloor.studio (Domain property, 2026-10-25); jsDelivr stats follow with the engine module | `dossier/meting.md` |
| 1 Design and build | tool live (2026-10-25). Phase 1 web module: engine API, ES module, types, package.json, README, tests done (2026-10-25); v1.0.0 released (tag, jsDelivr). Demo web game dropped (Raoul, 2026-10-26: the README example is enough). Own-voice export done (1.1.0, 2026-10-26). Phase 2 Godot next | `dossier/bouwbrief.md`, `dossier/ontwerp.md` |
| 2 Security, SEO, GEO, EU (domain scan; not a security review of the app) | app security review done; live since 2026-10-25 with enforced CSP; domain scan of babble.wrongfloor.studio 2026-10-25: green (https redirect, privacy page, AI training allowed by choice) | `dossier/beveiliging.md`, `scans/2026-10-25.md` |
| 3 Performance | first lab measurement 2026-10-25: green, 1 small point (render-blocking scripts, advised to leave); no real-visitor data yet | `metingen/snelheid-2026-10-25.md` |
| 4 Text and design | done (2026-10-25): redesign D, text check and accessibility check applied | `dossier/ontwerpronde.md`, `dossier/tekstcontrole.md` |
