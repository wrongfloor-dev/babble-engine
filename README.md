<p align="center">
  <a href="https://babble.wrongfloor.studio/"><img src="docs/art/banner.svg" alt="Babble Engine: gibberish speech for game characters. Four little critters each say a line in their own made-up language." width="100%"></a>
</p>

<p align="center">
  <a href="https://babble.wrongfloor.studio/"><b>🎙️ Try the tool</b></a> &nbsp;·&nbsp;
  <a href="#-web-module"><b>🧩 Web module</b></a> &nbsp;·&nbsp;
  <a href="#-styles-and-voices"><b>🐾 Styles</b></a> &nbsp;·&nbsp;
  <a href="#-license"><b>📜 MIT</b></a>
</p>

Your characters want to talk. Your budget doesn't include voice actors. **Babble Engine** turns any line of text into gibberish speech: critter chatter, made-up languages, grumbling trolls, beeping robots, whispering fairies and soft musical tones.

🚫 No voice actors &nbsp; 🚫 No server &nbsp; 🚫 No dependencies &nbsp; ✅ Free, also for commercial games

## 🎙️ The tool

**[babble.wrongfloor.studio](https://babble.wrongfloor.studio/)** runs in your browser. Type a line, pick a style and a voice, set the mood, and download a WAV.

<p align="center"><img src="docs/art/tool.png" alt="The Babble Engine tool: style cards at the top, a text box on the left and Fern the critter speaking the line in a speech bubble on the right" width="100%"></p>

- 🐹 **11 styles, 47 voices**, from Critter Chatter to a talking trombone
- 😄 **6 moods**: neutral, happy, angry, sad, flirty, surprised
- 🎛️ **Tune every voice**: pitch, tempo, expression, throat size, breath, brightness
- 🎤 **Record your own voice** and your characters babble with it: a sound no other game has. About 1.5 minutes of reading, and it works with all 9 voice styles. Recordings stay in your browser, nothing is uploaded
- 🧑‍🤝‍🧑 **Save characters** so Grandpa Hank sounds like Grandpa Hank every time
- 💾 **Download WAV**, ready for any engine

## 🧩 Web module

Making a web game? Use the same engine straight from your code. One file, no build step.

```html
<script type="module">
  import { render, play } from 'https://cdn.jsdelivr.net/gh/wrongfloor-dev/babble-engine@1/site/src/babble.mjs';

  const line = render('Hi! Do you want an apple?', { style: 'animal', voice: 'fern', mood: 'happy' });
  document.querySelector('button').onclick = () => play(line);
</script>
```

<p align="center"><img src="docs/art/waveform.svg" alt="A real render of the line in the Babblish style: a green waveform with a dot and a made-up syllable under each syllable start" width="100%"></p>

`@1` follows the newest 1.x release. Pin an exact version (`@1.0.0`) for a game you ship.

- 📜 **Plain script tag:** load `site/src/engine.js` and use the global `Babble` (`Babble.render(...)`)
- 📦 **Node or a bundler:** `npm i github:wrongfloor-dev/babble-engine`, then `import { render, toWav } from 'babble-engine'`
- 🔷 **TypeScript:** types ship in `site/src/engine.d.ts`

### `render(text, options)`

Returns `{ pcm, sampleRate, duration, syllables, style, voice }`. `pcm` is a mono `Float32Array`, dry (no room).

| Option | Default | |
|---|---|---|
| `style` | `'animal'` | see the styles below |
| `voice` | the style's first voice | |
| `mood` | `'neutral'` | `neutral`, `happy`, `angry`, `sad`, `flirty`, `surprised` |
| `seed` | `1` | 🎲 same text, options and seed give the same sound. Change it for a different take or another made-up language |
| `sampleRate` | `48000` | |
| `pitch`, `speed`, `expression`, `throat`, `breath`, `brightness` | from the voice | override the voice |
| `hiss` | `1` | consonant noise, 0 to 1 |
| `intent`, `length` | `'tell'`, `'short'` | Vemmo only: it speaks by intent and ignores the text |

👄 `syllables` is a list of `{ time, text }`: the start of every syllable in seconds. Flap a mouth, bounce a sprite or reveal subtitles in sync.

### More

- ▶️ `play(result, { room = true, context })`: browser only. Plays the line with the style's room, like the tool. Returns `{ stop(), ended, context }`
- 💾 `toWav(result)`: a 16-bit mono WAV as an `ArrayBuffer`, dry
- 📋 `styles()`: every style with its voices, moods and intents

## 🐾 Styles and voices

<p align="center"><img src="docs/art/styles.svg" alt="The 11 styles as cards, each with its critter and what it says for 'Hi! Do you want an apple?'" width="100%"></p>

| | Style | Name | Voices |
|---|---|---|---|
| 🐹 | `animal` | Critter Chatter | `fern`, `burt`, `pip`, `lowell`, `bleep` |
| 🗣️ | `sim` | Babblish | `lottie`, `ben`, `kiki`, `hank`, `whisper`, `bubs` |
| 🔨 | `vemmo` | Vemmo | `jesse`, `bram`, `mila` |
| 👹 | `grumble` | Grumble | `grok`, `moss`, `burly` |
| 🤖 | `gizmo` | Gizmo | `bolt`, `cog`, `unit9` |
| 🧚 | `sprite` | Sprite | `fae`, `wisp`, `glimmer` |
| 🏘️ | `echo` | Echo Folk | `village`, `crowd`, `kids` |
| 📻 | `radio` | Mumble Radio | `dispatch`, `pilot`, `scout` |
| 👶 | `baby` | Babytalk | `tot`, `bubba`, `mini` |
| 🎐 | `tone` | Soft Tones | `clouds`, `softbubble`, `rain`, `breeze`, `hum`, `purr`, `wood`, `droplet`, `kalimba`, `felt`, `bubble`, `glass` |
| 🎺 | `instr` | Talking Instruments | `horn`, `trombone`, `choir` |

## 🗺️ What's next

- 🎤 Export your recorded voice for use in your own game
- 🤖 A Godot 4 addon with a `BabbleSpeaker` node and a signal per syllable

## 🛠️ Repository

- `site/`: the tool as published on babble.wrongfloor.studio. Plain HTML and JavaScript, no build step. `site/src/engine.js` is the engine, shared by the tool and the web module
- `tests/`: `node tests/check.mjs` (copy, links, headers) and `node tests/engine.mjs` (every voice renders, seeds repeat, WAV is valid). Or just `npm test`
- `docs/art/`: the pictures in this README

## 📜 License

Code: **MIT**, see [`LICENSE`](LICENSE). Audio you make with Babble Engine is **yours to use, also commercially**.

<p align="center">Made with 🐹 by <a href="https://wrongfloor.studio"><b>Wrong Floor</b></a></p>
