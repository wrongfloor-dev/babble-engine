// Types for the Babble Engine web module (engine.js, babble.mjs).

export type StyleId =
  | 'animal' | 'sim' | 'vemmo' | 'grumble' | 'gizmo' | 'sprite'
  | 'echo' | 'radio' | 'baby' | 'tone' | 'instr';

export type Mood = 'neutral' | 'happy' | 'angry' | 'sad' | 'flirty' | 'surprised';

export type Intent =
  | 'greet' | 'bye' | 'tell' | 'explain' | 'ask' | 'curious'
  | 'joy' | 'cheer' | 'think' | 'letdown' | 'agree' | 'warn';

export interface RenderOptions {
  /** Style id, default 'animal'. See styles(). */
  style?: StyleId;
  /** Voice id within the style, default the style's first voice. */
  voice?: string;
  /** Emotion, default 'neutral'. Not used by 'vemmo'. */
  mood?: Mood;
  /** Vemmo only: what the line means, default 'tell'. Vemmo ignores the text. */
  intent?: Intent;
  /** Vemmo only: 'short' (default) or 'medium'. */
  length?: 'short' | 'medium';
  /** Same seed, same text, same options: the same sound. Default 1. */
  seed?: number;
  /** Default 48000. */
  sampleRate?: number;
  /** Override the voice: base pitch in Hz. */
  pitch?: number;
  /** Override the voice: tempo, 1 is normal. */
  speed?: number;
  /** Override the voice: 0 to 1. */
  expression?: number;
  /** Override the voice: throat size, around 0.7 to 1.6. */
  throat?: number;
  /** Override the voice: 0 to 1. */
  breath?: number;
  /** Override the voice: around 0.15 to 0.9. */
  brightness?: number;
  /** Consonant hiss and radio noise, 0 to 1, default 1. */
  hiss?: number;
  /** A voice recorded in the tool, from loadVoice(). Voice styles only (not 'tone' or 'instr'). */
  ownVoice?: OwnVoice;
  /** Own voice only: 0 follows the recorded pitch, 1 (default) holds each syllable on the melody. */
  steady?: number;
}

/** A recorded voice, loaded from a .babble-voice.json file. */
export interface OwnVoice {
  name: string;
  sampleRate: number;
  median: number;
  grains: Float32Array[];
}

export interface Syllable {
  /** Start time in seconds, for mouth animation or subtitles. */
  time: number;
  text: string;
}

export interface RenderResult {
  /** Mono samples, -1 to 1, dry (no room). */
  pcm: Float32Array;
  sampleRate: number;
  /** Seconds. */
  duration: number;
  style: StyleId;
  voice: string;
  syllables: Syllable[];
}

export interface StyleInfo {
  id: StyleId;
  name: string;
  description: string;
  /** Whether the site's own-voice recordings work with this style. */
  ownVoice: boolean;
  voices: { id: string; name: string; description: string }[];
  moods: Mood[];
  intents: Intent[];
}

export interface Playback {
  stop(): void;
  ended: Promise<void>;
  context: AudioContext;
}

export const version: string;
/** Render one line. Works in the browser and in Node. */
export function render(text: string, options?: RenderOptions): RenderResult;
/** 16-bit mono WAV of a render, dry. */
export function toWav(result: RenderResult | Float32Array, sampleRate?: number): ArrayBuffer;
/** Browser only. Plays a render like the site does, with the style's room unless room is false. */
export function play(result: RenderResult, options?: { context?: AudioContext; room?: boolean }): Playback;
export function styles(): StyleInfo[];
/** Load a .babble-voice.json file (exported from Voices & characters in the tool), as text or parsed JSON. */
export function loadVoice(file: string | object): OwnVoice;

declare const Babble: {
  version: typeof version;
  render: typeof render;
  toWav: typeof toWav;
  play: typeof play;
  styles: typeof styles;
  loadVoice: typeof loadVoice;
};
export default Babble;

declare global {
  /** Set when engine.js is loaded with a plain script tag. */
  var Babble: typeof import('./engine').default;
}
