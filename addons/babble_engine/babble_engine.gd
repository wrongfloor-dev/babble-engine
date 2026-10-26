## Babble Engine for Godot: gibberish speech for game characters.
## A port of site/src/engine.js. Same text, options and seed give the same sound as the web module.
##
##   var line := BabbleEngine.render("Hi! Do you want an apple?", {"style": "animal", "mood": "happy"})
##   # line.pcm (PackedFloat32Array), line.sample_rate, line.duration, line.syllables [{time, text}]
##
## For a node that plays lines and signals each syllable, see BabbleSpeaker (babble_speaker.gd).
class_name BabbleEngine
extends RefCounted

const VERSION := "1.3.0"

# ---- tables (engine.js) ----
const VF := {"a": [780.0, 1250.0, 2550.0, 3500.0], "e": [460.0, 1950.0, 2650.0, 3600.0], "i": [290.0, 2280.0, 3050.0, 3700.0],
	"o": [500.0, 880.0, 2450.0, 3400.0], "u": [330.0, 720.0, 2350.0, 3300.0], "y": [300.0, 1750.0, 2250.0, 3400.0]}
const VSPEC := {"a": ["a", "a"], "e": ["e", "e"], "i": ["i", "i"], "o": ["o", "o"], "u": ["u", "u"], "y": ["y", "y"], "ai": ["a", "i"],
	"ou": ["o", "u"], "ei": ["e", "i"], "oo": ["u", "u"], "ee": ["i", "i"], "ah": ["a", "a"], "ua": ["u", "a"], "ay": ["e", "i"]}
# class, noise frequency, noise bandwidth, voiced, F2 locus
const CT := {"p": ["plo", 1000, 900, 0, 850], "t": ["plo", 4000, 2500, 0, 1750], "k": ["plo", 2100, 1200, 0, 2100],
	"b": ["plo", 900, 800, 1, 850], "d": ["plo", 3500, 2500, 1, 1750], "g": ["plo", 1900, 1100, 1, 2100],
	"s": ["fri", 6200, 2200, 0, 1700], "sh": ["fri", 2900, 1500, 0, 2000], "f": ["fri", 5000, 4000, 0, 1100],
	"z": ["fri", 6000, 2200, 1, 1700], "v": ["fri", 4500, 4000, 1, 1100], "h": ["h", 0, 0, 0, 0],
	"m": ["nas", 0, 0, 1, 900], "n": ["nas", 0, 0, 1, 1650], "l": ["liq", 0, 0, 1, 1250], "r": ["liq", 0, 0, 1, 1300],
	"w": ["liq", 0, 0, 1, 750], "j": ["liq", 0, 0, 1, 2200]}
const LIQ := {"l": [360.0, 1150.0, 2650.0, 3400.0], "r": [430.0, 1300.0, 1700.0, 3200.0], "w": [300.0, 650.0, 2250.0, 3300.0], "j": [280.0, 2200.0, 3000.0, 3600.0]}
# e, a, tilt, oq, b, vib; the pitch curve is in _curve()
const MOODS := {"neutraal": {"e": 0.0, "a": 1.0, "tilt": 0.0, "oq": 0.0},
	"blij": {"e": 0.15, "a": 1.05, "tilt": 0.08, "oq": 0.0},
	"boos": {"e": 0.1, "a": 1.25, "tilt": 0.3, "oq": -0.12},
	"verdrietig": {"e": -0.15, "a": 0.8, "tilt": -0.15, "oq": 0.08, "b": 0.15, "vib": true},
	"flirterig": {"e": 0.2, "a": 0.9, "tilt": -0.05, "oq": 0.1, "b": 0.2},
	"verbaasd": {"e": 0.2, "a": 1.1, "tilt": 0.05, "oq": 0.0}}
const MOOD_ALIAS := {"neutral": "neutraal", "happy": "blij", "angry": "boos", "sad": "verdrietig", "flirty": "flirterig", "surprised": "verbaasd"}
const LETTER := {"b": ["b", "i"], "c": ["k", "i"], "d": ["d", "i"], "f": ["f", "e"], "g": ["g", "e"], "h": ["h", "a"], "j": ["j", "e"],
	"k": ["k", "a"], "l": ["l", "e"], "m": ["m", "e"], "n": ["n", "e"], "p": ["p", "i"], "q": ["k", "u"], "r": ["r", "a"],
	"s": ["s", "e"], "t": ["t", "i"], "v": ["v", "i"], "w": ["w", "e"], "x": ["k", "i"], "y": ["j", "ai"], "z": ["z", "e"]}
# lower case without accents, as JS toLowerCase().normalize('NFD') minus combining marks, for U+00C0..U+00FF
const PLAIN := {192: "a", 193: "a", 194: "a", 195: "a", 196: "a", 197: "a", 198: "æ", 199: "c", 200: "e", 201: "e", 202: "e", 203: "e",
	204: "i", 205: "i", 206: "i", 207: "i", 208: "ð", 209: "n", 210: "o", 211: "o", 212: "o", 213: "o", 214: "o", 216: "ø", 217: "u",
	218: "u", 219: "u", 220: "u", 221: "y", 222: "þ", 224: "a", 225: "a", 226: "a", 227: "a", 228: "a", 229: "a", 231: "c", 232: "e",
	233: "e", 234: "e", 235: "e", 236: "i", 237: "i", 238: "i", 239: "i", 241: "n", 242: "o", 243: "o", 244: "o", 245: "o", 246: "o",
	249: "u", 250: "u", 251: "u", 252: "u", 253: "y", 255: "y"}
const PENTA := [0, 2, 4, 7, 9, 12, 14, 16]
const SCALE := [0.0, 2.0, 4.0, 7.0, 9.0]
const SUST := {"horn": 0.15, "trombone": 0.17, "choir": 0.22, "purr": 0.2, "kazoo": 0.15}
const FR := 0.0025
const B_DEF := [70.0, 100.0, 160.0, 250.0]
const M32 := 0xFFFFFFFF
const FX := {"grumble": "grumble", "gizmo": "gizmo", "sprite": "sprite", "radio": "radio"}

# ---- styles, voices, Bloopa Doopa, barks and palettes: generated from engine.js ----
const STYLE_ORDER := ["animal", "sim", "vemmo", "name", "bark", "grumble", "gizmo", "sprite", "ghost", "echo", "radio", "baby", "blip", "droid", "tone", "instr"]
const STYLES := {
	"animal": {"name": "Critter Chatter", "own_voice": true, "voices": {
		"fern": {"name": "Fern", "pitch": 360.0, "speed": 1.6, "expr": 0.45, "form": 1.0, "breath": 0.06, "tilt": 0.55, "oq": 0.56, "jit": 1.0, "rate": 2.0},
		"burt": {"name": "Burt", "pitch": 150.0, "speed": 1.25, "expr": 0.25, "form": 0.92, "breath": 0.08, "tilt": 0.4, "oq": 0.5, "jit": 1.3, "rate": 1.5},
		"pip": {"name": "Pip", "pitch": 620.0, "speed": 2.0, "expr": 0.55, "form": 1.05, "breath": 0.04, "tilt": 0.6, "oq": 0.55, "jit": 1.0, "rate": 2.6},
		"lowell": {"name": "Lowell", "pitch": 230.0, "speed": 1.15, "expr": 0.3, "form": 1.0, "breath": 0.06, "tilt": 0.45, "oq": 0.58, "jit": 1.0, "rate": 1.7},
		"bleep": {"name": "Bleep", "pitch": 260.0, "speed": 1.5, "expr": 0.3, "form": 1.0, "breath": 0.0, "tilt": 0.7, "oq": 0.5, "jit": 0.0, "rate": 2.0, "quant": true},
	}},
	"sim": {"name": "Babblish", "own_voice": true, "voices": {
		"lottie": {"name": "Lottie", "pitch": 215.0, "speed": 1.0, "expr": 0.7, "form": 1.12, "breath": 0.2, "tilt": 0.45, "oq": 0.65, "jit": 1.0},
		"ben": {"name": "Ben", "pitch": 112.0, "speed": 0.95, "expr": 0.65, "form": 0.92, "breath": 0.14, "tilt": 0.38, "oq": 0.58, "jit": 1.0},
		"kiki": {"name": "Kiki", "pitch": 320.0, "speed": 1.12, "expr": 0.85, "form": 1.3, "breath": 0.12, "tilt": 0.5, "oq": 0.62, "jit": 1.0},
		"hank": {"name": "Grandpa Hank", "pitch": 135.0, "speed": 0.82, "expr": 0.5, "form": 0.95, "breath": 0.32, "tilt": 0.3, "oq": 0.68, "jit": 2.2, "vib": true},
		"whisper": {"name": "Whisper", "pitch": 180.0, "speed": 0.9, "expr": 0.6, "form": 1.05, "breath": 0.3, "tilt": 0.35, "oq": 0.65, "jit": 1.0, "whisper": true},
		"bubs": {"name": "Bubs", "pitch": 420.0, "speed": 0.9, "expr": 0.95, "form": 1.55, "breath": 0.1, "tilt": 0.5, "oq": 0.62, "jit": 1.0},
	}},
	"vemmo": {"name": "Bloopa Doopa", "own_voice": true, "voices": {
		"jesse": {"name": "Jesse", "pitch": 255.0, "speed": 1.05, "expr": 0.8, "form": 1.12, "breath": 0.16, "tilt": 0.45, "oq": 0.62, "jit": 1.0},
		"bram": {"name": "Farmer Bram", "pitch": 95.0, "speed": 0.86, "expr": 0.45, "form": 0.9, "breath": 0.18, "tilt": 0.35, "oq": 0.58, "jit": 1.1},
		"mila": {"name": "Mila", "pitch": 275.0, "speed": 1.15, "expr": 0.7, "form": 1.16, "breath": 0.12, "tilt": 0.55, "oq": 0.6, "jit": 1.0},
	}},
	"name": {"name": "Name Talk", "own_voice": true, "voices": {
		"moki": {"name": "Moki", "pitch": 420.0, "speed": 1.15, "expr": 0.8, "form": 1.35, "breath": 0.08, "tilt": 0.55, "oq": 0.6, "jit": 1.0},
		"grumbo": {"name": "Grumbo", "pitch": 95.0, "speed": 0.85, "expr": 0.55, "form": 0.8, "breath": 0.15, "tilt": 0.35, "oq": 0.56, "jit": 1.3},
		"zee": {"name": "Zee", "pitch": 640.0, "speed": 1.5, "expr": 0.8, "form": 1.5, "breath": 0.05, "tilt": 0.6, "oq": 0.58, "jit": 1.0},
		"lulu": {"name": "Lulu", "pitch": 330.0, "speed": 1.0, "expr": 0.95, "form": 1.25, "breath": 0.15, "tilt": 0.5, "oq": 0.64, "jit": 1.0},
		"bonk": {"name": "Bonk", "pitch": 200.0, "speed": 1.2, "expr": 0.9, "form": 1.05, "breath": 0.1, "tilt": 0.5, "oq": 0.58, "jit": 1.0},
	}},
	"bark": {"name": "Grunts & Barks", "own_voice": true, "voices": {
		"hero": {"name": "Hero", "pitch": 125.0, "speed": 1.0, "expr": 0.75, "form": 0.95, "breath": 0.15, "tilt": 0.45, "oq": 0.58, "jit": 1.0},
		"heroine": {"name": "Heroine", "pitch": 230.0, "speed": 1.0, "expr": 0.75, "form": 1.12, "breath": 0.15, "tilt": 0.5, "oq": 0.62, "jit": 1.0},
		"elder": {"name": "Elder", "pitch": 120.0, "speed": 0.85, "expr": 0.6, "form": 0.92, "breath": 0.3, "tilt": 0.3, "oq": 0.66, "jit": 2.0, "vib": true},
		"kid": {"name": "Kid", "pitch": 320.0, "speed": 1.1, "expr": 0.85, "form": 1.3, "breath": 0.12, "tilt": 0.5, "oq": 0.62, "jit": 1.0},
		"brute": {"name": "Brute", "pitch": 85.0, "speed": 0.9, "expr": 0.6, "form": 0.8, "breath": 0.2, "tilt": 0.3, "oq": 0.55, "jit": 1.3},
	}},
	"grumble": {"name": "Grumble", "own_voice": true, "voices": {
		"grok": {"name": "Grok", "pitch": 78.0, "speed": 0.85, "expr": 0.45, "form": 0.78, "breath": 0.22, "tilt": 0.3, "oq": 0.55, "jit": 1.4},
		"moss": {"name": "Mossbeard", "pitch": 96.0, "speed": 0.75, "expr": 0.4, "form": 0.82, "breath": 0.3, "tilt": 0.28, "oq": 0.62, "jit": 2.2, "vib": true},
		"burly": {"name": "Burly", "pitch": 112.0, "speed": 1.0, "expr": 0.5, "form": 0.86, "breath": 0.18, "tilt": 0.35, "oq": 0.56, "jit": 1.2},
	}},
	"gizmo": {"name": "Gizmo", "own_voice": true, "voices": {
		"bolt": {"name": "Bolt", "pitch": 220.0, "speed": 1.25, "expr": 0.5, "form": 1.0, "breath": 0.0, "tilt": 0.65, "oq": 0.5, "jit": 0.0, "quant": true},
		"cog": {"name": "Cog", "pitch": 420.0, "speed": 1.6, "expr": 0.55, "form": 1.2, "breath": 0.0, "tilt": 0.7, "oq": 0.5, "jit": 0.0, "quant": true},
		"unit9": {"name": "Unit 9", "pitch": 118.0, "speed": 0.95, "expr": 0.35, "form": 0.9, "breath": 0.0, "tilt": 0.55, "oq": 0.5, "jit": 0.0, "quant": true},
	}},
	"sprite": {"name": "Sprite", "own_voice": true, "voices": {
		"fae": {"name": "Fae", "pitch": 310.0, "speed": 1.45, "expr": 0.75, "form": 1.38, "breath": 0.45, "tilt": 0.6, "oq": 0.66, "jit": 1.0},
		"wisp": {"name": "Wisp", "pitch": 470.0, "speed": 1.75, "expr": 0.7, "form": 1.5, "breath": 0.58, "tilt": 0.65, "oq": 0.7, "jit": 1.0},
		"glimmer": {"name": "Glimmer", "pitch": 260.0, "speed": 1.25, "expr": 0.65, "form": 1.25, "breath": 0.38, "tilt": 0.5, "oq": 0.66, "jit": 1.0},
	}},
	"ghost": {"name": "Spooky Whisper", "own_voice": true, "voices": {
		"whisper": {"name": "Whisper", "pitch": 170.0, "speed": 1.0, "expr": 0.6, "form": 1.0, "breath": 0.5, "tilt": 0.35, "oq": 0.65, "jit": 1.2, "whisper": true},
		"wail": {"name": "Wail", "pitch": 300.0, "speed": 0.85, "expr": 0.9, "form": 1.1, "breath": 0.55, "tilt": 0.4, "oq": 0.7, "jit": 1.5, "vib": true},
		"hollow": {"name": "Hollow", "pitch": 80.0, "speed": 0.9, "expr": 0.4, "form": 0.8, "breath": 0.45, "tilt": 0.25, "oq": 0.65, "jit": 1.2},
	}},
	"echo": {"name": "Echo Folk", "own_voice": true, "voices": {
		"village": {"name": "Village", "pitch": 190.0, "speed": 1.0, "expr": 0.7, "form": 1.05, "breath": 0.16, "tilt": 0.42, "oq": 0.62, "jit": 1.0},
		"crowd": {"name": "Crowd", "pitch": 140.0, "speed": 0.95, "expr": 0.6, "form": 0.95, "breath": 0.18, "tilt": 0.38, "oq": 0.6, "jit": 1.2},
		"kids": {"name": "Kids", "pitch": 300.0, "speed": 1.1, "expr": 0.85, "form": 1.3, "breath": 0.12, "tilt": 0.5, "oq": 0.62, "jit": 1.0},
	}},
	"radio": {"name": "Mumble Radio", "own_voice": true, "voices": {
		"dispatch": {"name": "Dispatch", "pitch": 175.0, "speed": 1.1, "expr": 0.45, "form": 1.02, "breath": 0.1, "tilt": 0.5, "oq": 0.58, "jit": 1.0},
		"pilot": {"name": "Pilot", "pitch": 118.0, "speed": 1.0, "expr": 0.4, "form": 0.92, "breath": 0.12, "tilt": 0.45, "oq": 0.56, "jit": 1.0},
		"scout": {"name": "Scout", "pitch": 240.0, "speed": 1.3, "expr": 0.75, "form": 1.1, "breath": 0.14, "tilt": 0.55, "oq": 0.6, "jit": 1.0},
	}},
	"baby": {"name": "Babytalk", "own_voice": true, "voices": {
		"tot": {"name": "Tot", "pitch": 380.0, "speed": 0.95, "expr": 0.95, "form": 1.52, "breath": 0.1, "tilt": 0.5, "oq": 0.64, "jit": 1.0},
		"bubba": {"name": "Bubba", "pitch": 330.0, "speed": 0.85, "expr": 1.0, "form": 1.48, "breath": 0.12, "tilt": 0.45, "oq": 0.66, "jit": 1.2},
		"mini": {"name": "Mini", "pitch": 460.0, "speed": 1.05, "expr": 0.9, "form": 1.58, "breath": 0.08, "tilt": 0.55, "oq": 0.62, "jit": 1.0},
	}},
	"blip": {"name": "Text Blips", "own_voice": false, "voices": {
		"pixel": {"name": "Pixel", "pitch": 440.0, "speed": 1.0, "expr": 0.3, "form": 1.0, "breath": 0.0, "tilt": 0.5, "tone": "square"},
		"tiny": {"name": "Tiny", "pitch": 760.0, "speed": 1.3, "expr": 0.4, "form": 1.0, "breath": 0.0, "tilt": 0.6, "tone": "pulse"},
		"boss": {"name": "Boss", "pitch": 110.0, "speed": 0.75, "expr": 0.25, "form": 1.0, "breath": 0.0, "tilt": 0.45, "tone": "saw"},
		"soft": {"name": "Soft", "pitch": 520.0, "speed": 1.0, "expr": 0.35, "form": 1.0, "breath": 0.0, "tilt": 0.4, "tone": "tri"},
		"typewriter": {"name": "Typewriter", "pitch": 300.0, "speed": 1.1, "expr": 0.2, "form": 1.0, "breath": 0.0, "tilt": 0.7, "tone": "click"},
	}},
	"droid": {"name": "Droid Chirps", "own_voice": false, "voices": {
		"beebo": {"name": "Beebo", "pitch": 300.0, "speed": 1.0, "expr": 0.75, "form": 1.0, "breath": 0.0, "tilt": 0.6, "tone": "beebo"},
		"rollo": {"name": "Rollo", "pitch": 190.0, "speed": 0.9, "expr": 0.6, "form": 1.0, "breath": 0.0, "tilt": 0.45, "tone": "rollo"},
		"zapp": {"name": "Zapp", "pitch": 260.0, "speed": 1.15, "expr": 0.7, "form": 1.0, "breath": 0.0, "tilt": 0.65, "tone": "zapp"},
		"mini": {"name": "Mini", "pitch": 480.0, "speed": 1.35, "expr": 0.8, "form": 1.0, "breath": 0.0, "tilt": 0.7, "tone": "mini"},
	}},
	"tone": {"name": "Soft Tones", "own_voice": false, "voices": {
		"clouds": {"name": "Clouds", "pitch": 330.0, "speed": 0.85, "expr": 0.45, "form": 1.0, "breath": 0.0, "tilt": 0.3, "tone": "clouds"},
		"softbubble": {"name": "Soft Bubbles", "pitch": 480.0, "speed": 0.95, "expr": 0.55, "form": 1.0, "breath": 0.0, "tilt": 0.35, "tone": "softbubble"},
		"rain": {"name": "Raindrops", "pitch": 420.0, "speed": 1.0, "expr": 0.5, "form": 1.0, "breath": 0.0, "tilt": 0.45, "tone": "rain"},
		"breeze": {"name": "Breeze", "pitch": 300.0, "speed": 0.9, "expr": 0.5, "form": 1.0, "breath": 0.0, "tilt": 0.4, "tone": "breeze"},
		"hum": {"name": "Hum", "pitch": 200.0, "speed": 0.95, "expr": 0.5, "form": 1.0, "breath": 0.0, "tilt": 0.3, "tone": "hum"},
		"purr": {"name": "Purr", "pitch": 180.0, "speed": 0.9, "expr": 0.35, "form": 1.0, "breath": 0.0, "tilt": 0.3, "tone": "purr"},
		"wood": {"name": "Wood", "pitch": 400.0, "speed": 1.0, "expr": 0.55, "form": 1.0, "breath": 0.0, "tilt": 0.45, "tone": "wood"},
		"droplet": {"name": "Droplet", "pitch": 520.0, "speed": 1.0, "expr": 0.6, "form": 1.0, "breath": 0.0, "tilt": 0.5, "tone": "droplet"},
		"kalimba": {"name": "Kalimba", "pitch": 440.0, "speed": 1.0, "expr": 0.55, "form": 1.0, "breath": 0.0, "tilt": 0.55, "tone": "kalimba"},
		"felt": {"name": "Felt Keys", "pitch": 330.0, "speed": 0.95, "expr": 0.5, "form": 1.0, "breath": 0.0, "tilt": 0.35, "tone": "felt"},
		"bubble": {"name": "Pops", "pitch": 600.0, "speed": 1.1, "expr": 0.6, "form": 1.0, "breath": 0.0, "tilt": 0.5, "tone": "bubble"},
		"glass": {"name": "Glass", "pitch": 660.0, "speed": 0.9, "expr": 0.5, "form": 1.0, "breath": 0.0, "tilt": 0.6, "tone": "glass"},
	}},
	"instr": {"name": "Talking Instruments", "own_voice": false, "voices": {
		"horn": {"name": "Muted Horn", "pitch": 330.0, "speed": 1.0, "expr": 0.7, "form": 1.0, "breath": 0.0, "tilt": 0.55, "tone": "horn"},
		"trombone": {"name": "Trombone", "pitch": 140.0, "speed": 0.9, "expr": 0.7, "form": 1.0, "breath": 0.0, "tilt": 0.45, "tone": "trombone"},
		"choir": {"name": "Ooh Choir", "pitch": 262.0, "speed": 0.9, "expr": 0.5, "form": 1.0, "breath": 0.0, "tilt": 0.45, "tone": "choir"},
		"kazoo": {"name": "Kazoo", "pitch": 300.0, "speed": 1.0, "expr": 0.75, "form": 1.0, "breath": 0.0, "tilt": 0.6, "tone": "kazoo"},
	}},
}
# per intent: how it sounds (as MOODS, plus the end note) and the language (onsets, endings, tricks, closer chance, interjections, anchors)
const INTENTS := {
	"greet": {"p": 2.0, "s": 1.05, "e": 0.15, "a": 1.05, "end": 3.0, "tilt": 0.05, "oq": 0.0, "ons": {"w": 3.0, "z": 2.0, "b": 2.0, "bl": 1.0, "h": 1.0}, "tail": {"a": 3.0, "oo": 2.0, "y": 1.0}, "tricks": {"rhyme": 3.0, "jump": 1.0, "plain": 1.0}, "clos": 0.25, "ij": ["whoa"], "anc": ["bloopa", "zipzap"], "at": "start", "mark": "!"},
	"bye": {"p": 1.0, "s": 1.05, "e": 0.1, "a": 0.95, "end": -1.0, "tilt": 0.0, "oq": 0.02, "ons": {"t": 3.0, "d": 2.0, "n": 1.0, "l": 1.0}, "tail": {"le": 3.0, "oo": 2.0}, "tricks": {"rhyme": 3.0, "plain": 2.0}, "clos": 0.0, "ij": [], "anc": [], "mark": "!"},
	"tell": {"p": 0.0, "s": 1.05, "e": 0.0, "a": 1.0, "end": -2.0, "tilt": 0.0, "oq": 0.0, "ons": {"w": 3.0, "n": 2.0, "z": 2.0, "b": 1.0, "d": 1.0, "m": 1.0}, "tail": {"le": 3.0, "a": 2.0, "y": 1.0}, "tricks": {"jump": 3.0, "rhyme": 2.0, "plain": 1.0}, "clos": 0.1, "ij": [], "anc": [], "mark": "."},
	"explain": {"p": 0.0, "s": 1.05, "e": 0.05, "a": 1.0, "end": -1.5, "tilt": 0.05, "oq": 0.0, "ons": {"t": 3.0, "k": 2.0, "kl": 2.0, "p": 1.0, "pl": 1.0}, "tail": {"a": 3.0, "y": 1.0}, "tricks": {"jump": 3.0, "plain": 1.0}, "clos": 0.6, "ij": [], "anc": [], "mark": "."},
	"ask": {"p": 1.0, "s": 1.0, "e": 0.05, "a": 1.0, "end": 7.0, "tilt": 0.0, "oq": 0.0, "ons": {"b": 3.0, "w": 2.0, "p": 1.0, "z": 1.0}, "tail": {"le": 2.0, "a": 2.0, "y": 1.0}, "tricks": {"plain": 2.0, "rhyme": 1.0, "jump": 1.0}, "clos": 0.0, "ij": [], "anc": ["wibby"], "at": "end", "mark": "?"},
	"curious": {"p": 3.0, "s": 1.0, "e": 0.2, "a": 1.05, "end": 6.0, "tilt": 0.05, "oq": 0.02, "ons": {"w": 3.0, "b": 2.0, "z": 1.0}, "tail": {"y": 3.0, "oo": 2.0}, "tricks": {"jump": 2.0, "plain": 2.0}, "clos": 0.0, "ij": ["ooh", "oh", "whoa"], "anc": [], "mark": "?"},
	"joy": {"p": 4.0, "s": 1.1, "e": 0.25, "a": 1.15, "end": 2.0, "tilt": 0.1, "oq": 0.0, "ons": {"b": 3.0, "d": 2.0, "z": 2.0, "p": 1.0}, "tail": {"a": 3.0, "oo": 1.0}, "tricks": {"sing": 3.0, "rhyme": 1.0, "jump": 1.0}, "clos": 0.6, "ij": ["ha", "whoa"], "anc": ["badabing"], "at": "any", "mark": "!"},
	"cheer": {"p": 3.0, "s": 1.1, "e": 0.2, "a": 1.2, "end": 3.0, "tilt": 0.12, "oq": -0.03, "ons": {"z": 3.0, "d": 2.0, "h": 2.0, "b": 1.0}, "tail": {"a": 3.0, "oo": 2.0}, "tricks": {"rhyme": 3.0, "sing": 1.0}, "clos": 0.3, "ij": [], "anc": ["hoppa"], "at": "start", "mark": "!"},
	"think": {"p": -1.0, "s": 0.85, "e": -0.05, "a": 0.9, "end": 1.0, "tilt": -0.05, "oq": 0.05, "b": 0.1, "ons": {"b": 3.0, "m": 2.0, "w": 2.0}, "tail": {"le": 4.0}, "tricks": {"jump": 3.0, "plain": 1.0}, "clos": 0.0, "ij": ["hm"], "anc": [], "mark": "…"},
	"letdown": {"p": -1.0, "s": 0.95, "e": 0.0, "a": 0.95, "end": -5.0, "tilt": -0.05, "oq": 0.04, "ons": {"w": 3.0, "fl": 2.0, "bl": 2.0}, "tail": {"le": 4.0}, "tricks": {"jump": 3.0, "rhyme": 1.0}, "clos": 0.5, "ij": ["uhoh", "aah"], "anc": ["flibberty"], "at": "end", "mark": "."},
	"agree": {"p": 1.0, "s": 1.05, "e": 0.1, "a": 1.0, "end": -2.0, "tilt": 0.02, "oq": 0.0, "ons": {"b": 3.0, "d": 2.0, "p": 1.0}, "tail": {"y": 3.0, "oo": 1.0}, "tricks": {"rhyme": 2.0, "plain": 2.0}, "clos": 0.3, "ij": [], "anc": ["plimplom"], "at": "any", "mark": "!"},
	"warn": {"p": 0.0, "s": 1.05, "e": 0.05, "a": 1.1, "end": -3.0, "tilt": 0.1, "oq": -0.03, "ons": {"kr": 3.0, "k": 2.0, "t": 1.0, "d": 1.0}, "tail": {"le": 4.0}, "tricks": {"jump": 3.0}, "clos": 0.0, "ij": ["ooh", "uhoh"], "anc": [], "mark": "!"},
}
const ANCHORS := {
	"bloopa": {"s": "bloo|pa-DOO!", "mel": [[0.0, 1.0], [1.0, 1.0], [4.0, 8.0]]},
	"zipzap": {"s": "ZIP zap ZOO!", "mel": [[5.0, 5.0], [2.0, 2.0], [4.0, 1.0]]},
	"badabing": {"s": "ba-da-BING!", "mel": [[0.0, 0.0], [4.0, 4.0], [7.0, 7.0]]},
	"wibby": {"s": "WIB|by-WAH?", "mel": [[3.0, 3.0], [1.0, 1.0], [1.0, 7.0]]},
	"hoppa": {"s": "HOP|pa-DOP|pa!", "mel": [[4.0, 4.0], [1.0, 1.0], [5.0, 5.0], [2.0, 0.0]]},
	"plimplom": {"s": "PLIM PLOM!", "mel": [[6.0, 6.0], [-2.0, -3.0]]},
	"flibberty": {"s": "FLIB|ber|ty-FLOP!", "mel": [[4.0, 4.0], [3.0, 3.0], [2.0, 2.0], [3.0, -7.0]]},
}
# per bark: text, then per syllable [consonant, vowel, coda, start and end semitone, extra length in seconds]
const BARKS := {
	"ask": [["Hm?", [["h", "u", "m", 0.0, 6.0, 0.06]]], ["Huh?", [["h", "a", "", -1.0, 6.0, 0.03]]], ["Eh?", [["", "e", "", 0.0, 7.0, 0.04]]], ["Hmm?", [["h", "u", "m", -1.0, 5.0, 0.12]]]],
	"shout": [["Hah!", [["h", "a", "", 4.0, 0.0, 0.02]]], ["Hey!", [["h", "ay", "", 5.0, 1.0, 0.02]]], ["Hoh!", [["h", "o", "", 3.0, -1.0, 0.02]]], ["Ha!", [["h", "a", "", 5.0, 2.0, 0.0]]]],
	"tell": [["Hm.", [["h", "u", "m", 1.0, -2.0, 0.06]]], ["Mm-hm.", [["", "u", "m", 0.0, 0.0, 0.04], ["h", "u", "m", 2.0, -1.0, 0.04]]], ["Eh.", [["", "e", "", 0.0, -3.0, 0.03]]], ["Hmph.", [["h", "u", "m", 1.0, -3.0, 0.04]]]],
	"blij": [["Heh-heh!", [["h", "e", "", 3.0, 2.0, 0.0], ["h", "e", "", 4.0, 1.0, 0.02]]], ["Ha-ha!", [["h", "a", "", 4.0, 3.0, 0.0], ["h", "a", "", 5.0, 1.0, 0.02]]], ["Oh-ho!", [["", "o", "", 2.0, 1.0, 0.0], ["h", "o", "", 5.0, 2.0, 0.04]]], ["Mm!", [["", "u", "m", 2.0, 5.0, 0.06]]]],
	"boos": [["Hrrgh!", [["h", "a", "r", -1.0, -4.0, 0.06]]], ["Grr!", [["g", "e", "r", -2.0, -3.0, 0.1]]], ["Hmph!", [["h", "u", "m", 0.0, -4.0, 0.04]]], ["Ugh!", [["", "a", "g", 0.0, -4.0, 0.04]]]],
	"verdrietig": [["Haah…", [["h", "a", "", 0.0, -5.0, 0.2]]], ["Oh…", [["", "o", "", 0.0, -4.0, 0.16]]], ["Mm…", [["", "u", "m", -1.0, -4.0, 0.14]]], ["Aww…", [["", "a", "", 1.0, -3.0, 0.18]]]],
	"flirterig": [["Mmm~", [["", "u", "m", 0.0, 4.0, 0.18]]], ["Oh-hoh?", [["", "o", "", 2.0, 0.0, 0.0], ["h", "o", "", 0.0, 5.0, 0.06]]], ["Heh.", [["h", "e", "", 2.0, -1.0, 0.02]]]],
	"verbaasd": [["Whoa!", [["w", "o", "", 2.0, 6.0, 0.08]]], ["Oh!", [["", "o", "", 3.0, 7.0, 0.04]]], ["Huh?!", [["h", "a", "", 0.0, 8.0, 0.04]]], ["Eek!", [["", "i", "k", 6.0, 8.0, 0.02]]]],
}
const PALETTES := {
	"grumble": {"cons": ["m", "b", "g", "n", "r", "d", "h"], "vow": ["o", "u", "a", "oo", "ou"], "codas": ["m", "n", "r", "g", "", "", ""]},
	"gizmo": {"cons": ["t", "k", "b", "d", "z", "p"], "vow": ["e", "i", "o", "ee"], "codas": ["k", "t", "z", "", "", ""]},
	"sprite": {"cons": ["s", "sh", "f", "l", "n", "v"], "vow": ["i", "e", "ee", "ai", "a"], "codas": ["s", "l", "n", "", "", ""]},
	"ghost": {"cons": ["h", "sh", "w", "l", "m", "v", "f", "s"], "vow": ["oo", "o", "a", "ee", "ou"], "codas": ["m", "n", "sh", "", "", ""]},
	"baby": {"cons": ["b", "d", "m", "n", "g", "w"], "vow": ["a", "u", "i", "oo", "ah"], "codas": [""]},
}
# Bloopa Doopa: sounds people make anyway (hold: extra length in seconds), closers, word parts, words it must not say
const INTERJ := {"oh": [["Oh", "", "o", "", {"hold": 0.08}]], "ooh": [["Oooh", "", "oo", "", {"hold": 0.18}]], "aah": [["Aah", "", "a", "", {"hold": 0.14}]],
	"ha": [["Ha", "h", "a", "", {}], ["ha", "h", "a", "", {}]], "hm": [["Hmmm", "h", "u", "m", {"hold": 0.1}]], "whoa": [["Whoa", "w", "o", "", {"hold": 0.1}]],
	"uhoh": [["Uh", "", "a", "", {"mel": [3.0, 3.0]}], "-", ["oh", "", "o", "", {"mel": [-1.0, -3.0], "hold": 0.06}]]}
const KNAL := [["blup", "bl", "o", "p"], ["bing", "b", "i", "n"], ["boop", "b", "oo", "p"], ["flop", "fl", "o", "p"], ["plop", "pl", "o", "p"],
	["zoo", "z", "oo", ""], ["bop", "b", "o", "p"], ["zap", "z", "a", "p"], ["plink", "pl", "i", "k"]]
const MIDS := ["b", "d", "p", "t", "z", "g", "l", "m", "n", "k"]
const SPELL := {"a": "a", "y": "y", "oo": "oo", "le": "le"}
const LEMID := ["b", "d", "g", "p", "t", "z", "k"]
const NOWORD := ["ja", "nee", "hup", "plof", "kijk", "pas", "op", "hoi", "doei", "top", "yes", "no", "hello", "hi", "go", "stop", "ok", "okay", "bye",
	"wow", "kak", "kut", "pik", "lul", "dik", "dom", "poep", "pies", "tiet", "pis", "kont", "poop", "poopy", "pee", "wee", "butt", "boob", "booby",
	"booty", "wokka", "zoinks", "yabba", "dabba"]
const SLIDERS := {"pitch": "pitch", "speed": "speed", "expression": "expr", "throat": "form", "breath": "breath", "brightness": "tilt"}

var _seed_state := 0

## Render one line. Options: style, voice, mood, seed (default 1), sample_rate (default 48000), hiss,
## pitch, speed, expression, throat, breath, brightness, name (Name Talk), intent and length (Bloopa Doopa),
## own_voice (from load_voice) and steady. Renders on the calling thread; BabbleSpeaker renders in the background.
## Returns {pcm, sample_rate, duration, style, voice, syllables}, or {} after push_error for a bad option.
static func render(text: String, options: Dictionary = {}) -> Dictionary:
	return BabbleEngine.new()._render(text, options)

## Every style with its voices, moods and (Bloopa Doopa) intents.
static func styles() -> Array:
	var out := []
	for id in STYLE_ORDER:
		var voices := []
		for v in STYLES[id].voices: voices.append({"id": v, "name": STYLES[id].voices[v].name})
		out.append({"id": id, "name": STYLES[id].name, "own_voice": STYLES[id].own_voice, "voices": voices,
			"moods": [] if id == "vemmo" else MOOD_ALIAS.keys(), "intents": INTENTS.keys() if id == "vemmo" else []})
	return out

func _render(text: String, opt: Dictionary) -> Dictionary:
	var style: String = opt.get("style", "animal")
	if not STYLES.has(style):
		return _fail("unknown style \"%s\". Styles: %s" % [style, ", ".join(STYLE_ORDER)])
	var voices: Dictionary = STYLES[style].voices
	var voice: String = opt.get("voice", voices.keys()[0])
	if not voices.has(voice):
		return _fail("style \"%s\" has no voice \"%s\". Voices: %s" % [style, voice, ", ".join(voices.keys())])
	var mood: String = opt.get("mood", "neutraal")
	mood = MOOD_ALIAS.get(mood, mood)
	if not MOODS.has(mood):
		return _fail("unknown mood \"%s\". Moods: %s" % [mood, ", ".join(MOOD_ALIAS.keys())])
	var intent: String = opt.get("intent", "tell")
	if style == "vemmo" and not INTENTS.has(intent):
		return _fail("unknown intent \"%s\". Intents: %s" % [intent, ", ".join(INTENTS.keys())])
	var sd: int = int(floor(float(opt.get("seed", 1))))
	var sr: int = int(opt.get("sample_rate", 48000))
	var preset: Dictionary = voices[voice]
	var sl := {}
	for k in SLIDERS: sl[SLIDERS[k]] = float(opt[k]) if opt.has(k) else float(preset[SLIDERS[k]])
	var toks: Array
	if style == "vemmo":
		toks = vemmo_clip(intent, "medium" if opt.get("length", "short") == "medium" else "short", sd)
	else:
		var name: String = str(opt.name).strip_edges().left(40) if opt.has("name") else preset.name
		if style == "name" and name_syls(name).is_empty():
			return _fail("name needs at least one vowel (a, e, i, o, u or y)")
		toks = text_toks(style, text, sd, PALETTES[style] if PALETTES.has(style) else make_lang(sd), name, mood)
	var own = opt.get("own_voice", null)
	if own != null and not (own is Dictionary and own.get("grains", []).size() > 0):
		return _fail("own_voice must come from BabbleEngine.load_voice()")
	if own != null and not STYLES[style].own_voice:
		var rec := []
		for id in STYLE_ORDER:
			if STYLES[id].own_voice: rec.append(id)
		return _fail("style \"%s\" has no voice to replace; own voices work with %s" % [style, ", ".join(rec)])
	var o := {"engine": style, "mood": intent if style == "vemmo" else mood, "P": sl.pitch, "S": sl.speed * (1.25 if style == "vemmo" else 1.0),
		"E": sl.expr, "F": sl.form, "breath": sl.breath, "tilt": sl.tilt, "hiss": float(opt.get("hiss", 1.0)),
		"oq": preset.get("oq", 0.0), "jit": preset.get("jit", 0.0), "rate": preset.get("rate", 1.0), "vib": preset.get("vib", false),
		"quant": preset.get("quant", false), "whisper": preset.get("whisper", false), "tone": preset.get("tone", ""), "base": preset.pitch}
	if own != null:
		o.recF0 = float(own.median); o.steady = float(opt.get("steady", 1.0)); o.base = STYLES[style].voices.values()[0].pitch
	_seed_state = sd & M32
	var r := render_style(style, toks, o, sr, grains_at(own, sr) if own != null else [])
	var pcm: PackedFloat32Array = r.pcm
	for i in pcm.size():
		if not is_finite(pcm[i]): pcm[i] = 0.0
	var syl := []
	for m in r.marks: syl.append({"time": m[0], "text": toks[m[1]].get("text", "")})
	return {"pcm": pcm, "sample_rate": sr, "duration": pcm.size() / float(sr), "style": style, "voice": voice, "syllables": syl}

## Godot has no exceptions: a bad option prints an error and render() returns {} (check with is_empty()).
static func _fail(msg: String) -> Dictionary:
	push_error("Babble: " + msg)
	return {}

# ---- numbers exactly as JS does them ----
static func imul(a: int, b: int) -> int:
	a &= M32; b &= M32
	var lo := (a & 0xFFFF) * (b & 0xFFFF)
	var mid := ((a >> 16) * (b & 0xFFFF) + (a & 0xFFFF) * (b >> 16)) & 0xFFFF
	return (lo + (mid << 16)) & M32

static func js_round(x: float) -> float:
	return floor(x + 0.5)

static func js_hash(s: String) -> int:
	var h := 2166136261
	for i in s.length():
		h = (h ^ s.unicode_at(i)) & M32
		h = imul(h, 16777619)
	return h

## Number.prototype.toFixed(3) for a number >= 0: a tie rounds up
static func js_fixed3(x: float) -> String:
	var n := int(floor(x * 1000.0))
	if x * 1000.0 - n >= 0.5: n += 1
	return "%d.%03d" % [n / 1000, n % 1000]

static func cap_first(s: String) -> String:
	return s.left(1).to_upper() + s.substr(1)

## xorshift32 like engine.js rng(): returns a Callable giving 0..1 in steps of 1/100000
static func rng(sd: int) -> Callable:
	var st := [sd & M32]
	if st[0] == 0: st[0] = 1
	return func() -> float:
		var x: int = st[0]
		x = (x ^ (x << 13)) & M32
		x = x ^ (x >> 17)
		x = (x ^ (x << 5)) & M32
		st[0] = x
		return (x % 100000) / 100000.0

## mulberry32, the seeded noise generator of Babble.render
func _rnd() -> float:
	_seed_state = (_seed_state + 0x6D2B79F5) & M32
	var t := _seed_state
	t = imul(t ^ (t >> 15), t | 1)
	t = (t ^ ((t + imul(t ^ (t >> 7), t | 61)) & M32)) & M32
	return float((t ^ (t >> 14)) & M32) / 4294967296.0

static func smooth(x: float) -> float:
	if x <= 0.0: return 0.0
	if x >= 1.0: return 1.0
	return x * x * (3.0 - 2.0 * x)

static func is_end_mark(m: String) -> bool:
	return m != "" and ".!?…".contains(m)

static func _has_end_mark(s: String) -> bool:
	for c in ".!?…":
		if s.contains(c): return true
	return false

static func _peak(pcm: PackedFloat32Array) -> float:
	var m := 0.0
	for v in pcm: m = max(m, abs(v))
	return m

# ---- text to syllables ----
static func make_lang(sd: int) -> Dictionary:
	var r := rng(sd * 7919 + 13)
	var pick := func(a: Array, n: int) -> Array:
		var c := a.duplicate(); var o := []
		while o.size() < n and c.size() > 0:
			o.append(c.pop_at(int(floor(r.call() * c.size()))))
		return o
	var cons: Array = pick.call(["b", "d", "f", "g", "l", "m", "n", "p", "r", "s", "sh", "w", "z", "v", "k"], 8 + int(floor(r.call() * 4)))
	var vow: Array = pick.call(["a", "e", "i", "o", "u", "oo", "ee", "ai", "ou", "ah"], 5 + int(floor(r.call() * 2)))
	var codas: Array = pick.call(["n", "b", "s", "sh", "l", "m", "sh", "b"], 3) + ["", "", ""]
	return {"cons": cons, "vow": vow, "codas": codas}

static var _re: Dictionary = {}

static func _rx(key: String) -> RegEx:
	if _re.is_empty():
		var src := {"parts": "[A-Za-z\\x{C0}-\\x{FF}0-9']+|[.,!?;:\\x{2026}]+|[\\s\\x{A0}]+|.",
			"laugh": "(?i)^(ha){2,}h?$|^(hi){2,}$|^(he){2,}$|^lol$|^haha\\w*$",
			"syl": "^(sh|[bcdfgkp][lr]|[bcdfghjklmnpqrstvwxz]?)([aeiouy]+)(sh|[bcdfghjklmnpqrstvwxz]*)$",
			"nameparts": "[^aeiouy]*[aeiouy]+(?:[^aeiouy]+$)?", "lead": "^[^aeiouy]*", "onset2": "^(sh|ch|ph|th|qu|[bcdfgkpt][lr])$",
			"sents": "[^.!?\\x{2026}]*[A-Za-z\\x{C0}-\\x{FF}0-9][^.!?\\x{2026}]*[.!?\\x{2026}]*", "sentend": "[.!?\\x{2026}]+\\s*$",
			"barktrail": "[.!?\\x{2026}~]+$", "endpunct": "[.,!?\\x{2026}]+$",
			"badpart": "wokka|zoink|yabba|dabba|nig|tit|kak|dik|pik|poo|pip+[iy]|nipp|dogg|bood|diddl"}
		var built := {}  # built whole, then swapped in: speakers may render on several threads at once
		for k in src: built[k] = RegEx.create_from_string(src[k])
		_re = built
	return _re[key]

static func _plain_lower(ch: String) -> String:
	var c := ch.unicode_at(0)
	if PLAIN.has(c): return PLAIN[c]
	return ch.to_lower()

## sylFromText: 'blo' -> {c: 'bl', v: 'o', k: ''}
static func syl_from_text(t: String) -> Dictionary:
	var m := _rx("syl").search(t.to_lower())
	if m == null: return {"c": "", "v": "a", "k": ""}
	var v := m.get_string(2)
	if not VSPEC.has(v): v = v.left(1)
	var k := m.get_string(3)
	return {"c": "k" if m.get_string(1) == "c" else m.get_string(1), "v": v, "k": "sh" if k.left(2) == "sh" else k.left(1)}

static func _parts(text: String) -> Array:
	var out := []
	for m in _rx("parts").search_all(text): out.append(m.get_string())
	return out

static func tokenize(text: String, engine: String, sd: int, lang: Dictionary) -> Array:
	var toks := []
	for p in _parts(text):
		var c0: int = p.unicode_at(0)
		if _all_space(p):
			toks.append({"type": "gap", "text": " "}); continue
		if _all_punct(p):
			toks.append({"type": "punct", "text": p, "mark": p.right(1)}); continue
		if not _has_wordchar(p):
			toks.append({"type": "punct", "text": p, "mark": ""}); continue
		if engine == "tone" or engine == "instr":
			toks.append({"type": "syl", "text": p, "n": int(max(1, js_round(p.length() / 3.0))), "c": "", "v": "a", "k": "", "jit": (js_hash(p.to_lower()) % 1000) / 1000.0, "stress": true}); continue
		if engine == "animal" or engine == "blip":
			for ci in p.length():
				var ch: String = p.substr(ci, 1); var l := _plain_lower(ch)
				var c := ""; var v := "a"
				if VF.has(l) and l != "y": v = l
				elif LETTER.has(l):
					c = LETTER[l][0]; v = LETTER[l][1]
				else: v = "aeiou"[l.unicode_at(0) % 5]
				toks.append({"type": "syl", "text": ch, "c": c, "v": v, "k": "", "jit": ((l.unicode_at(0) * 37) % 100) / 100.0, "stress": ci == 0})
			continue
		var low: String = p.to_lower()
		var cap: bool = (c0 >= 65 and c0 <= 90) or (c0 >= 0xC0 and c0 <= 0xDD)
		if _rx("laugh").search(low) != null:
			toks.append({"type": "laugh", "text": "Hoohoo" if cap else "hoohoo", "n": int(min(6, max(3, js_round(p.length() / 2.0))))}); continue
		var n := int(max(1, js_round(p.length() / 2.6)))
		var r := rng(js_hash(low + "|" + str(sd)))
		for i in n:
			var c: String = "" if r.call() < 0.12 else lang.cons[int(floor(r.call() * lang.cons.size()))]
			var v: String = lang.vow[int(floor(r.call() * lang.vow.size()))]
			var k: String = lang.codas[int(floor(r.call() * lang.codas.size()))] if (i == n - 1 and r.call() < 0.55) else ""
			var t := c + v + k
			if i == 0 and cap: t = cap_first(t)
			toks.append({"type": "syl", "text": t, "c": c, "v": v, "k": k, "jit": (js_hash(t + str(i) + low) % 1000) / 1000.0, "stress": i == 0})
	return toks

static func _all_space(p: String) -> bool:
	for i in p.length():
		var c := p.unicode_at(i)
		if not ((c >= 9 and c <= 13) or c == 32 or c == 0xA0): return false
	return true

static func _all_punct(p: String) -> bool:
	for i in p.length():
		if not ".,!?;:…".contains(p.substr(i, 1)): return false
	return true

static func _has_wordchar(p: String) -> bool:
	for i in p.length():
		var c := p.unicode_at(i)
		if (c >= 65 and c <= 90) or (c >= 97 and c <= 122) or (c >= 48 and c <= 57) or (c >= 0xC0 and c <= 0xFF): return true
	return false

## text to syllables for every style except Bloopa Doopa (which speaks by intent)
static func text_toks(engine: String, text: String, sd: int, lang: Dictionary, name: String, mood: String) -> Array:
	if engine == "name": return name_talk(text, name, sd)
	if engine == "bark": return bark_toks(text, mood, sd)
	var toks := tokenize(text, engine, sd, lang)
	return babyfy(toks) if engine == "baby" else toks

## Babytalk: reduplicate, ba-ba, da-da, mi-mi
static func babyfy(toks: Array) -> Array:
	var first := {}; var idx := 0
	for k in toks:
		if k.type != "syl":
			first = {}; idx = 0; continue
		var c0: int = k.text.unicode_at(0) if k.text != "" else 0
		var cap := c0 >= 65 and c0 <= 90
		if idx % 2 == 1 and not first.is_empty():
			k.c = first.c; k.v = first.v; k.k = ""; k.text = first.c + first.v
		else:
			k.k = ""; first = {"c": k.c, "v": k.v}; k.text = k.c + k.v
		if cap: k.text = cap_first(k.text)
		idx += 1
	return toks

# ---- Name Talk: a creature that only says its own name, in pieces ----
static func name_syls(name: String) -> Array:
	var low := ""
	for ch in name: low += _plain_lower(ch)
	var clean := ""
	for ch in low:
		if ch >= "a" and ch <= "z" and ch.length() == 1: clean += ch
	var parts := []
	for m in _rx("nameparts").search_all(clean): parts.append(m.get_string())
	for i in parts.size():  # a consonant group that can't start a syllable: bul|ba, not bu|lba
		while true:
			var on := _rx("lead").search(parts[i]).get_string()
			if on.length() <= 1 or _rx("onset2").search(on) != null: break
			if i > 0: parts[i - 1] += on.left(1)
			parts[i] = parts[i].substr(1)
	var out := []
	for p in parts:
		var s: String = p
		for rule in [["^s?ch", "sh", false], ["^ph", "f", false], ["^th", "t", false], ["^qu", "k", false], ["ck", "k", true], ["c(?=[eiy])", "s", true],
				["[cq]", "k", true], ["^x", "z", false], ["x", "ks", true], ["^y(?=[aeiou])", "j", false]]:
			s = RegEx.create_from_string(rule[0]).sub(s, rule[1], rule[2])
		var x := syl_from_text(s)
		if x.v == "y": x.v = "i"
		out.append({"text": p, "c": x.c, "v": x.v, "k": x.k})
	return out

static func name_talk(text: String, name: String, sd: int) -> Array:
	var S := name_syls(name); var r := rng(js_hash(name + "|" + str(sd))); var toks := []; var parts := _parts(text)
	if S.is_empty(): return toks
	var is_word := func(p: String) -> bool: return _has_wordchar(p) and not _all_punct(p)
	var start := true
	for pi in parts.size():
		var p: String = parts[pi]
		if _all_space(p):
			toks.append({"type": "gap", "text": " "}); continue
		if not is_word.call(p):
			var pm := _all_punct(p)
			toks.append({"type": "punct", "text": p, "mark": p.right(1) if pm else ""})
			if pm and _has_end_mark(p): start = true
			continue
		var want := int(max(1, js_round(p.length() / 3.0)))
		var ends := true
		for j in range(pi + 1, parts.size()):
			if _all_space(parts[j]): continue
			ends = _has_end_mark(parts[j]) and not is_word.call(parts[j]); break
		var pick: Array
		if S.size() == 1: pick = [S[0]]
		elif ends or want >= S.size(): pick = S
		elif want == 1 and r.call() < 0.35: pick = [S[0], "-", S[0]]  # pi-pi, pika, Pikachu!
		else: pick = S.slice(0, want)
		var j := 0
		for s in pick:
			if s is String:
				toks.append({"type": "punct", "text": "-", "mark": ""}); continue
			var tx: String = cap_first(s.text) if j == 0 and start else s.text
			toks.append({"type": "syl", "text": tx, "c": s.c, "v": s.v, "k": s.k, "jit": (js_hash(s.text + str(j) + p.to_lower()) % 1000) / 1000.0, "stress": j == 0})
			j += 1
		start = false
	return toks

# ---- Grunts & Barks: one sound per sentence that says how it is meant ----
static func bark_toks(text: String, mood: String, sd: int) -> Array:
	var sents := []
	for m in _rx("sents").search_all(text): sents.append(m.get_string())
	if sents.is_empty(): sents = ["."]
	var r := rng(js_hash(mood + "|" + str(sd))); var toks := []
	for si in sents.size():
		var s: String = sents[si]
		var mm := _rx("sentend").search(s)
		var mk := (mm.get_string() if mm != null else ".").strip_edges().right(1)
		var bset: Array
		if mk == "?": bset = BARKS[mood if (mood == "verbaasd" or mood == "flirterig") else "ask"]
		elif mood != "neutraal" and BARKS.has(mood): bset = BARKS[mood]
		else: bset = BARKS.shout if mk == "!" else BARKS.tell
		var pick: Array = bset[int(floor(r.call() * bset.size()))]
		var txt: String = pick[0]; var syls: Array = pick[1]
		var pieces := _rx("barktrail").sub(txt, "").split("-")
		var end := txt.substr("-".join(pieces).length())
		if si > 0: toks.append({"type": "gap", "text": " "})
		for j in syls.size():
			var y: Array = syls[j]
			if j > 0: toks.append({"type": "punct", "text": "-", "mark": ""})
			var x := {"type": "syl", "text": pieces[j] if j < pieces.size() else "", "c": y[0], "v": y[1], "k": y[2], "mel": [y[3], y[4]], "hold": y[5], "stress": j == 0, "jit": r.call()}
			if j > 0: x.barkPart = true
			else: x.bark = txt
			toks.append(x)
		if end != "": toks.append({"type": "punct", "text": end, "mark": end.replace("~", "").right(1)})
	return toks

# ---- Bloopa Doopa (De Workshopbende): cartoon sound jokes, picked by intent ----
static func _syl(text: String, c: String, v: String, k: String, x: Dictionary = {}) -> Dictionary:
	var t := {"type": "syl", "text": text, "c": c, "v": v, "k": k}
	t.merge(x.duplicate(true), true)
	return t

static func _hyphen() -> Dictionary:
	return {"type": "punct", "text": "-", "mark": ""}

static func _gap() -> Dictionary:
	return {"type": "gap", "text": " "}

static func _wpick(r: Callable, w: Dictionary) -> String:
	var tot := 0.0
	for k in w: tot += w[k]
	var x: float = r.call() * tot
	for k in w:
		x -= w[k]
		if x <= 0.0: return k
	return w.keys()[0]

## 'bloo|pa-DOO!' -> tokens
static func bloopa_syls(s: String, r: Callable) -> Array:
	var out := []
	var tail := ""; var m := _rx("endpunct").search(s)
	if m != null:
		tail = m.get_string(); s = s.left(m.get_start())
	var word := ""
	var flush := func(word: String) -> void:
		if word == "": return
		for p in word.split("|"):
			var x := syl_from_text(p)
			if x.k == "h": x.k = ""
			if x.v == "y": x.v = "i"
			out.append(_syl(p.to_lower(), x.c, x.v, x.k, {"stress": p == p.to_upper(), "jit": r.call()}))
	for ch in s:
		if ch == " " or ch == "-":
			flush.call(word); word = ""
			out.append(_gap() if ch == " " else _hyphen())
		else: word += ch
	flush.call(word)
	if tail != "": out.append({"type": "punct", "text": tail, "mark": tail.right(1)})
	for t in out:
		if t.type == "syl":
			t.text = cap_first(t.text); break
	return out

static func anchor_toks(key: String, r: Callable) -> Array:
	var A: Dictionary = ANCHORS[key]; var out := bloopa_syls(A.s, r); var i := 0
	for t in out:
		if t.type == "syl":
			t.mel = A.mel[i]; t.lex = true; t.anchor = key; i += 1
	return out

static func _tail_syls(m: String, tail: String) -> Array:
	if tail == "le": return [_syl(m + "le", m, "e", "l")]
	if tail == "y": return [_syl(m + "y", m, "i", "")]
	return [_syl(m + SPELL[tail], m, tail, "")]

## bloo|pa, wiz|zle, hop|pa: the middle consonant is written double after a short vowel (k as ck before -le, -y)
static func _base_word(on: String, v: String, m: String, tail: String) -> Array:
	if tail == "le" and (v == "oo" or not LEMID.has(m)): tail = "y"
	var mid := "" if v == "oo" else ("c" if m == "k" and tail != "a" and tail != "oo" else m)
	return [_syl(on + v + mid, on, v, "")] + _tail_syls(m, tail)

static func _cvc(on: String, v: String, cd: String = "") -> Dictionary:
	return _syl(on + v + cd, on, v, cd)

static func bloopa_word(r: Callable, I: Dictionary, plain: bool) -> Array:
	var trick := "plain" if plain else _wpick(r, I.tricks)
	var on := _wpick(r, I.ons); var m: String = MIDS[int(floor(r.call() * MIDS.size()))]; var tail := _wpick(r, I.tail)
	var V := ["i", "a", "o", "oo"]; var v: String = V[int(floor(r.call() * V.size()))]
	if trick == "jump":  # the vowel jumps: zip zap zoo, wizzle-wazzle, klik-klak
		var three: bool = r.call() < 0.35
		var vs: Array = ["i", "a", "o"] if three else (["i", "a"] if r.call() < 0.5 else ["i", "o"])
		var out := []
		if r.call() < 0.5:
			var cd: String = ["p", "k", "m", "b", "n"][int(floor(r.call() * 5))]
			for i in vs.size():
				if i > 0: out.append(_gap() if (three and i == 2 and r.call() < 0.5) else _hyphen())
				out.append(_cvc(on, "oo") if (three and i == 2 and r.call() < 0.5) else _cvc(on, vs[i], cd))
			return out
		for i in 2:
			if i > 0: out.append(_hyphen())
			out += _base_word(on, vs[i], m, tail)
		return out
	if trick == "rhyme":  # the same word with another first sound: hoppa-doppa, bloopa-doopa
		var pool := []
		for x in ["d", "b", "h", "w", "z", "p", "t"]:
			if x != on: pool.append(x)
		var on2: String = pool[int(floor(r.call() * pool.size()))]
		return _base_word(on, v, m, tail) + [_hyphen()] + _base_word(on2, v, m, tail)
	if trick == "sing":  # ba-da-bing: two quick notes and a closer, on rising notes
		var k: Array = KNAL[int(floor(r.call() * KNAL.size()))]
		var m2s := []
		for x in ["d", "b", "p"]:
			if x != on: m2s.append(x)
		var m2: String = m2s[int(floor(r.call() * 2))]
		return [_syl(on + "a", on, "a", "", {"note": 0.0}), _hyphen(), _syl(m2 + "a", m2, "a", "", {"note": 4.0}), _hyphen(),
			_syl(k[0], k[1], k[2], k[3], {"note": 7.0, "hold": 0.04, "stress": true})]
	return _base_word(on, v, m, tail)  # plain: boopy, bibble

static func _is_word(toks: Array) -> bool:
	var w := ""
	for t in toks: w += t.text if t.type == "syl" else ("-" if t.text == "-" else " ")
	w = w.to_lower()
	if _rx("badpart").search(w) != null or NOWORD.has(w.replace("-", "")): return true
	for p in w.replace(" ", "-").split("-"):
		if NOWORD.has(p): return true
	return false

static func vemmo_clip(intent: String, span: String, sd: int, anchor_mode: String = "auto") -> Array:
	var I: Dictionary = INTENTS.get(intent, INTENTS.tell); var r := rng(js_hash(intent + span + "|" + str(sd)))
	var toks := []
	var sep := func() -> void: toks.append({"type": "punct", "text": ",", "mark": ","}); toks.append(_gap())
	var use_a: bool = I.anc.size() > 0 and (anchor_mode == "always" or (anchor_mode == "auto" and r.call() < 0.4))
	var akey: String = I.anc[int(floor(r.call() * I.anc.size()))] if use_a else ""
	var aT: Array = anchor_toks(akey, r) if akey != "" else []
	if akey != "" and span == "short": return aT  # short clip with an anchor: just the anchor
	var at_start: bool = akey != "" and (I.get("at", "") == "start" or (I.get("at", "") == "any" and r.call() < 0.5))
	if akey != "" and at_start:
		toks.append_array(aT); toks.append(_gap())
	elif I.ij.size() > 0 and r.call() < 0.4:
		for y in INTERJ[I.ij[int(floor(r.call() * I.ij.size()))]]:
			var t: Dictionary = _hyphen() if y is String else _syl(y[0], y[1], y[2], y[3], y[4])
			t.jit = r.call(); t.stress = true; toks.append(t)
		sep.call()
	var n := 1 if (span == "short" or akey != "") else 2; var extra := toks.size() > 0
	var duet: bool = span == "medium" and n > 1 and r.call() < 0.5; var high: bool = r.call() < 0.5
	for i in n:
		var w: Array
		for tries in 20:
			w = bloopa_word(r, I, extra and span == "short")
			if not _is_word(w): break
		var first := {}; var any_stress := false
		for t in w:
			if t.type != "syl": continue
			t.jit = r.call()
			if not t.has("stress"): t.stress = false
			if duet: t.reg = 5.0 if high else -6.0
			if first.is_empty(): first = t
		for t in w:
			if t.get("stress", false): any_stress = true
		first.stress = first.stress or not any_stress
		if i == 0 and akey != "" and at_start: first.text = cap_first(first.text)
		if i > 0: sep.call()
		toks.append_array(w); high = not high
	if toks.size() > 0 and toks[0].type == "syl": toks[0].text = cap_first(toks[0].text)
	if akey != "" and not at_start:
		sep.call(); toks.append_array(aT); return toks
	var nsyl := 0
	for t in toks:
		if t.type == "syl": nsyl += 1
	if not (span == "short" and (extra or nsyl > 2)) and r.call() < I.clos:
		var k: Array = KNAL[int(floor(r.call() * KNAL.size()))]
		sep.call(); toks.append(_syl(k[0], k[1], k[2], k[3], {"stress": true, "jit": r.call(), "hold": 0.03}))
	toks.append({"type": "punct", "text": I.mark, "mark": I.mark})
	return toks

# ---- prosody: pitch, length and loudness per syllable ----
static func _mood(m: String) -> Dictionary:
	if MOODS.has(m): return MOODS[m]
	if INTENTS.has(m): return INTENTS[m]
	return MOODS.neutraal

static func _curve(mood: String, p: float) -> float:
	match mood:
		"blij": return 2.5 * sin(p * PI)
		"boos": return -5.0 * p
		"verdrietig": return -3.5 * p
		"flirterig": return 3.5 * sin(p * PI * 2.0)
		"verbaasd": return 6.0 * p
		"greet": return 3.0 * sin(p * PI)
		"bye": return -2.0 * p
		"tell": return -1.2 * p
		"explain": return 1.5 * sin(p * PI * 3.0)
		"curious": return 4.0 * p
		"joy": return 2.5 * sin(p * PI * 2.0)
		"cheer": return 2.0 * p
		"think": return 1.5 * sin(p * PI)
		"letdown": return -3.0 * p
		"agree": return -1.5 * p
		"warn": return -0.5 * p
	return 0.0

static func prosody(toks: Array, o: Dictionary) -> void:
	var M := _mood(o.mood)
	var E: float = min(1.0, max(0.0, o.E + M.e))
	var animal: bool = o.engine == "animal"; var vemmo: bool = o.engine == "vemmo"
	var pos := {}; var mark_of := []; mark_of.resize(toks.size()); var last_of := {}; var arr := []
	for i in toks.size():
		var k: Dictionary = toks[i]
		if k.type == "syl" or k.type == "laugh": arr.append(i)
		if (k.type == "punct" and is_end_mark(k.mark)) or i == toks.size() - 1:
			for n in arr.size(): pos[arr[n]] = n / float(arr.size() - 1) if arr.size() > 1 else 0.0
			if arr.size() > 0: last_of[arr[-1]] = true
			arr = []
	var cur := ""
	for i in range(toks.size() - 1, -1, -1):
		var k: Dictionary = toks[i]
		if k.type == "punct" and is_end_mark(k.mark): cur = k.mark
		mark_of[i] = cur
	for i in toks.size():
		var k: Dictionary = toks[i]
		if k.type != "syl": continue
		var m: String = mark_of[i]; var p: float = pos.get(i, 0.0); var last: bool = last_of.has(i)
		var stress: bool = k.get("stress", false)
		if k.has("mel") and not vemmo:  # barks carry their own melody
			k.semiA = k.mel[0]; k.semiB = k.mel[1]; k.last = last
			k.amp = (1.12 if m == "!" else 1.0) * M.a * (1.08 if stress else 0.92); continue
		if vemmo:  # Bloopa Doopa: anchors carry their own melody (mel), sung clips notes, a duet a high or low register (reg)
			var rg: float = k.get("reg", 0.0)
			if k.has("mel") or k.has("note"):
				var ab: Array = k.mel if k.has("mel") else [k.note, k.note]
				k.semiA = ab[0] + rg; k.semiB = ab[1] + rg; k.last = last
				k.amp = (1.12 if m == "!" else 1.0) * M.a * (1.08 if stress else 0.92); continue
			var vs: float = (k.jit - 0.5) * 2.0 * E * 3.0 + _curve(o.mood, p) + ((E * 2.5 + 1.0) if stress else 0.0) + (1.0 - p) * E * 1.2
			if m == "!": vs += 1.5
			var vb := vs - 0.8
			if last: vb = vs + M.get("end", -2.0)
			k.semiA = vs + rg; k.semiB = vb + rg; k.last = last
			k.amp = (1.12 if m == "!" else 1.0) * M.a * (1.08 if stress else 0.92); continue
		var jit: float = k.jit
		var semi: float
		if animal: semi = (jit - 0.5) * E * 7.0 + _curve(o.mood, p) * 0.6
		else: semi = (jit - 0.5) * 2.0 * E * 5.0 + (1.0 - p) * E * 2.5 - p * E * 2.0 + _curve(o.mood, p) + (E * 2.2 if stress else 0.0)
		if m == "!": semi += 2.0 if animal else 3.0
		if o.quant: semi = js_round(PENTA[int(floor(jit * PENTA.size()))] * max(0.3, E * 1.4) - 3.0)
		var b: float = semi if o.quant else semi + (-0.4 if animal else (-1.0 - (jit - 0.5) * E * 3.0))
		if last and m == "?": b = semi + (4.0 if animal else 5.0 + E * 5.0)
		if last and (m == "." or m == "…") and not o.quant and not animal: b = semi - 4.0
		if last and m == "!" and not animal: b = semi - 2.0
		k.semiA = semi; k.semiB = b; k.last = last
		k.amp = (1.25 if m == "!" else 1.0) * M.a * (1.08 if (stress and not animal) else 0.94)

# ---- formant synthesis ----
static func build_phones(toks: Array, o: Dictionary) -> Dictionary:
	var animal: bool = o.engine == "animal"; var vemmo: bool = o.engine == "vemmo"
	var R: float = o.rate if animal else 1.0
	var S: float = o.S
	var ts: float = R / S if animal else 1.0 / S
	var ph := []; var f0pts := []; var marks := []; var t := [0.0]
	var add := func(d: float, tg: Dictionary, tr: float, atr: float) -> void:
		ph.append({"d": d, "tg": tg, "tr": min(tr, d * 0.9), "atr": min(atr, d * 0.6)}); t[0] += d
	var P: float = o.P / R
	var cons := func(c: String, vF: Array, amp: float, coda: bool) -> void:
		if not CT.has(c): return
		var C: Array = CT[c]; var cl: String = C[0]; var ff: float = C[1]; var fb: float = C[2]; var voiced: bool = C[3] == 1; var loc: float = C[4]
		var s := 0.45 if animal else 1.0
		var hz: float = o.hiss
		var nk: float = ((0.28 if cl == "fri" else (0.32 if cl == "h" else 0.38)) if animal else 1.0) * hz
		var locF := [260.0 if voiced else 320.0, loc, vF[2], vF[3]]
		if cl == "plo":
			add.call(0.045 * s * ts, {"F": locF, "B": [90.0, 110.0, 170.0, 250.0], "av": 0.12 if voiced else 0.0, "ah": 0.0, "af": 0.0}, 0.02, 0.008)
			add.call(0.012 * s * ts + 0.004, {"F": locF, "av": 0.25 if voiced else 0.0, "ah": 0.12 * nk, "af": 0.42 * nk, "ff": ff, "fb": fb}, 0.004, 0.006)
			if not voiced: add.call((0.02 if coda else 0.038) * s * ts, {"F": [vF[0] * 0.8, (loc + vF[1]) / 2.0, vF[2], vF[3]], "av": 0.0, "ah": 0.5 * nk, "af": 0.03 * hz, "ff": ff, "fb": fb}, 0.02, 0.008)
		elif cl == "fri":
			add.call(0.075 * s * ts, {"F": locF, "B": [90.0, 110.0, 170.0, 250.0], "av": 0.35 if voiced else 0.0, "ah": 0.0, "af": (0.5 if voiced else 0.68) * nk, "ff": ff, "fb": fb}, 0.025, 0.03 if animal else 0.02)
		elif cl == "h":
			add.call(0.06 * s * ts, {"F": vF.duplicate(), "av": 0.0, "ah": 0.6 * nk, "af": 0.0}, 0.02, 0.015)
		elif cl == "nas":
			add.call(0.06 * s * ts, {"F": [250.0, loc, 2300.0, 3300.0], "B": [90.0, 280.0, 320.0, 300.0], "av": 0.55 * amp, "ah": 0.0, "af": 0.0}, 0.02, 0.012)
		else:
			add.call(0.045 * s * ts, {"F": LIQ[c].duplicate(), "B": [80.0, 120.0, 180.0, 250.0], "av": 0.75 * amp, "ah": 0.0, "af": 0.0}, 0.025, 0.012)
	for i in toks.size():
		var k: Dictionary = toks[i]
		var t0: float = t[0]
		if k.type == "gap":
			if animal: add.call(0.03 * R / S * 0.9, {"av": 0.0, "ah": 0.0, "af": 0.0}, 0.01, 0.008)
		elif k.type == "punct":
			var d: float = (((0.28 if animal else 0.38) if is_end_mark(k.mark) else (0.16 if k.mark != "" else 0.0)) * (R if animal else 1.0)) / S
			if d != 0.0: add.call(d, {"av": 0.0, "ah": 0.0, "af": 0.0}, 0.02, 0.02)
		elif k.type == "laugh":
			var f := P * 1.35
			for n in k.n:
				var v := "e" if n % 2 == 1 else "a"
				cons.call("h", VF[v], 1.0, false)
				var d := 0.08 / S
				f0pts.append([t[0], f]); add.call(d, {"F": VF[v].duplicate(), "B": [90.0, 120.0, 180.0, 260.0], "av": 0.55, "ah": 0.12, "af": 0.0}, 0.02, 0.008)
				f0pts.append([t[0], f * 0.9]); add.call(0.03 / S, {"av": 0.0, "ah": 0.15, "af": 0.0}, 0.01, 0.01); f *= 0.92
		else:
			var spec: Array = VSPEC.get(k.v, [k.v, k.v])
			var vF: Array = VF.get(spec[0], VF.a)
			var amp: float = k.get("amp", 1.0)
			if amp == 0.0: amp = 1.0
			var fa: float = P * pow(2.0, k.semiA / 12.0); var fb: float = P * pow(2.0, k.semiB / 12.0)
			if k.c != "":
				if CT.has(k.c): cons.call(k.c, vF, amp, false)
				else:
					for ch in k.c: cons.call(ch, vF, amp, false)  # bl, pl, kr: two consonants
			var jit: float = k.jit; var last: bool = k.get("last", false); var stress: bool = k.get("stress", false)
			var diph: bool = spec[0] != spec[1] or k.v.length() > 1; var hold: float = k.get("hold", 0.0)
			var vd: float
			if animal: vd = 0.05 * R / S * (0.85 + jit * 0.3) * (1.5 if last else 1.0)
			elif vemmo: vd = ((0.135 if stress else 0.095) + (0.04 if diph else 0.0) + hold) / S * (1.5 if last else 1.0) * (0.9 + jit * 0.2)
			else: vd = ((0.15 if stress else 0.115) + (0.05 if diph else 0.0) + hold) / S * (1.85 if last else 1.0) * (0.88 + jit * 0.24)
			f0pts.append([t[0], fa])
			if spec[0] != spec[1]:
				add.call(vd * 0.45, {"F": VF[spec[0]].duplicate(), "B": B_DEF.duplicate(), "av": amp, "ah": 0.0, "af": 0.0}, 0.04, 0.012)
				add.call(vd * 0.55, {"F": VF[spec[1]].duplicate(), "B": B_DEF.duplicate(), "av": amp * 0.9, "ah": 0.0, "af": 0.0}, vd * 0.5, 0.02)
			else:
				add.call(vd, {"F": vF.duplicate(), "B": B_DEF.duplicate(), "av": amp, "ah": 0.0, "af": 0.0}, 0.02 if animal else 0.045, 0.012)
			f0pts.append([t[0], fb])
			if k.k != "": cons.call(k.k, vF, amp, true)
			if animal: add.call(0.012 * R / S, {"av": 0.0, "ah": 0.0, "af": 0.0}, 0.006, 0.006)
		if k.type == "syl" or k.type == "laugh": marks.append([t0 / R, i])
	add.call(0.08, {"av": 0.0, "ah": 0.0, "af": 0.0}, 0.03, 0.03)
	return {"ph": ph, "f0pts": f0pts, "marks": marks, "dur": t[0]}

func synth_phones(B: Dictionary, o: Dictionary, sr: int) -> PackedFloat32Array:
	var M := _mood(o.mood)
	# frames
	var stF := [500.0, 1500.0, 2500.0, 3500.0]; var stB := B_DEF.duplicate()
	var st_av := 0.0; var st_ah := 0.0; var st_af := 0.0; var st_ff := 3000.0; var st_fb := 2000.0
	var fF := PackedFloat64Array(); var fB := PackedFloat64Array(); var fav := PackedFloat64Array(); var fah := PackedFloat64Array()
	var faf := PackedFloat64Array(); var fff := PackedFloat64Array(); var ffb := PackedFloat64Array()
	for p in B.ph:
		var tg: Dictionary = p.tg
		var s0F := stF.duplicate(); var s0B := stB.duplicate()
		var n := int(max(1, js_round(p.d / FR)))
		var tgF = tg.get("F"); var tgB = tg.get("B")
		var tav: float = tg.get("av", 0.0); var tah: float = tg.get("ah", 0.0); var taf: float = tg.get("af", 0.0)
		var tff: float = tg.get("ff", 0.0); var tfb: float = tg.get("fb", 0.0)
		for i in n:
			var tt := i * FR; var a := smooth(tt / p.tr); var aa := smooth(tt / p.atr)
			for j in 4:
				var v: float = s0F[j]
				fF.append(v + (tgF[j] - v) * a if tgF != null else v)
				var w: float = s0B[j]
				fB.append(w + (tgB[j] - w) * a if tgB != null else w + (B_DEF[j] - w) * a)
			fav.append(st_av + (tav - st_av) * aa); fah.append(st_ah + (tah - st_ah) * aa); faf.append(st_af + (taf - st_af) * aa)
			fff.append(st_ff + (tff - st_ff) * min(1.0, a * 3.0) if tff != 0.0 else st_ff)
			ffb.append(st_fb + (tfb - st_fb) * min(1.0, a * 3.0) if tff != 0.0 else st_fb)
		if tgF != null: stF = tgF.duplicate()
		stB = tgB.duplicate() if tgB != null else B_DEF.duplicate()
		st_av = tav; st_ah = tah; st_af = taf
		if tff != 0.0:
			st_ff = tff; st_fb = tfb
	var nfr := fav.size()
	# f0 per frame, smooth between the points; stored as float32 like the JS Float32Array
	var f0 := PackedFloat32Array(); f0.resize(nfr)
	var pts: Array = B.f0pts if B.f0pts.size() > 0 else [[0.0, o.P]]
	var j := 0
	for i in nfr:
		var t := i * FR
		while j < pts.size() - 1 and pts[j + 1][0] <= t: j += 1
		var pa: Array = pts[j]; var jb: int = min(j + 1, pts.size() - 1); var pb: Array = pts[jb]
		if t <= pa[0] or jb == j: f0[i] = pa[1]
		else: f0[i] = pa[1] + (pb[1] - pa[1]) * smooth((t - pa[0]) / (pb[0] - pa[0]))
	var srf := float(sr)
	var spf := int(js_round(FR * srf)); var N := nfr * spf
	var out := PackedFloat32Array(); out.resize(N)
	var Fs: float = o.F
	var breath: float = min(0.9, o.breath + M.get("b", 0.0))
	var oq: float = min(0.85, max(0.3, o.oq + M.get("oq", 0.0)))
	var tiltA: float = min(0.95, max(0.12, o.tilt + M.get("tilt", 0.0)))
	var vib: bool = o.vib or M.get("vib", false)
	var quant: bool = o.quant; var whisper: bool = o.whisper; var jit: float = o.jit
	var T := 1.0 / srf; var TP := TAU
	var ph0 := 0.0; var prevG := 0.0; var shimT := 1.0; var shim := 1.0; var tl := 0.0; var jw := 0.0
	var fy1 := 0.0; var fy2 := 0.0; var dcx := 0.0; var dcy := 0.0; var nzl := 0.0
	var y1 := PackedFloat64Array([0, 0, 0, 0]); var y2 := PackedFloat64Array([0, 0, 0, 0])
	var A := PackedFloat64Array([0, 0, 0, 0]); var Bc := PackedFloat64Array([0, 0, 0, 0]); var C := PackedFloat64Array([0, 0, 0, 0])
	var sF := PackedFloat64Array([fF[0], fF[1], fF[2], fF[3]]); var sB := PackedFloat64Array([fB[0], fB[1], fB[2], fB[3]])
	var sAv := 0.0; var sAh := 0.0; var sAf := 0.0; var sFf: float = fff[0]; var sFb: float = ffb[0]; var sf0: float = f0[0]
	var kP := 1.0 - exp(-1.0 / (srf * 0.004)); var kA := 1.0 - exp(-1.0 / (srf * 0.003))
	var FA := 0.0; var FBc := 0.0; var FC := 0.0
	var l1 := _rnd() * 6.0; var l2 := _rnd() * 6.0; var l3 := _rnd() * 6.0
	var te := oq; var tp := te * 0.62
	for k in nfr:
		var tf0: float = f0[k]; var k4 := k * 4
		for s in spf:
			var n := k * spf + s; var t := n * T
			for q in 4:
				sF[q] += (fF[k4 + q] - sF[q]) * kP; sB[q] += (fB[k4 + q] - sB[q]) * kP
			sAv += (fav[k] - sAv) * kA; sAh += (fah[k] - sAh) * kA; sAf += (faf[k] - sAf) * kA
			sFf += (fff[k] - sFf) * kP; sFb += (ffb[k] - sFb) * kP; sf0 += (tf0 - sf0) * kP
			if (n & 3) == 0:
				for q in 4:
					var Fq: float = min(srf * 0.45, sF[q] * Fs)
					var Bq: float = sB[q] * (1.0 + (breath * 0.8 if q == 0 else breath * 0.3)) + (sf0 * 0.08 if q == 0 else 0.0)
					C[q] = -exp(-TP * Bq * T); Bc[q] = 2.0 * exp(-PI * Bq * T) * cos(TP * Fq * T); A[q] = 1.0 - Bc[q] - C[q]
				var ffq: float = min(srf * 0.42, sFf * sqrt(Fs))
				FC = -exp(-TP * sFb * T); FBc = 2.0 * exp(-PI * sFb * T) * cos(TP * ffq * T); FA = 1.0 - FBc - FC
			jw += ((_rnd() * 2.0 - 1.0) - jw) * 0.0015
			var fv := sf0 * (1.0 + 0.011 * sin(TP * 0.7 * t + l1) + 0.006 * sin(TP * 1.9 * t + l2) + 0.003 * sin(TP * 3.3 * t + l3) + 0.05 * jw * jit + (0.03 * sin(TP * 5.7 * t) if vib else 0.0))
			ph0 += fv * T
			if ph0 >= 1.0:
				ph0 -= 1.0; shimT = 1.0 + (_rnd() - 0.5) * 0.12 * jit
			shim += (shimT - shim) * 0.002
			var g := 0.0
			if ph0 < tp: g = 0.5 * (1.0 - cos(PI * ph0 / tp))
			elif ph0 < te: g = cos(PI * (ph0 - tp) / (2.0 * (te - tp)))
			if quant: g = 0.5 * (1.0 - cos(PI * ph0 / 0.5)) if ph0 < 0.5 else 0.5 * (1.0 + cos(PI * (ph0 - 0.5) / 0.5))
			var dg := (g - prevG) * srf / fv; prevG = g
			tl += tiltA * (dg - tl)
			var nzr := _rnd() * 2.0 - 1.0; nzl += (nzr - nzl) * 0.55
			var x: float
			if whisper: x = nzl * (sAh * 0.6 + sAv * 0.75)
			else: x = tl * 0.35 * sAv * shim + nzl * (sAh * 0.6 + breath * sAv * (0.08 + 0.25 * g))
			for q in 4:
				var y := A[q] * x + Bc[q] * y1[q] + C[q] * y2[q]; y2[q] = y1[q]; y1[q] = y; x = y
			var fz := FA * nzl * 1.3 * sAf + FBc * fy1 + FC * fy2; fy2 = fy1; fy1 = fz
			var v := x + fz * 0.8
			var yv := v - dcx + 0.995 * dcy; dcx = v; dcy = yv
			out[n] = yv
	return out

## speeding up = higher and faster (critter style), with a low-pass filter against aliasing first
static func resample(src: PackedFloat32Array, rate: float) -> PackedFloat32Array:
	if abs(rate - 1.0) < 1e-3: return src
	var fc := 0.45 / rate; var H := 24; var w := PackedFloat64Array(); var ws := 0.0
	for i in range(-H, H + 1):
		var x: float = 2.0 * fc if i == 0 else sin(2.0 * PI * fc * i) / (PI * i)
		var bw := 0.42 + 0.5 * cos(PI * i / H) + 0.08 * cos(2.0 * PI * i / H)
		w.append(x * bw); ws += x * bw
	for i in w.size(): w[i] /= ws
	var n := int(floor(src.size() / rate)); var o := PackedFloat32Array(); o.resize(n); var L := src.size()
	var whole: bool = rate == floor(rate)  # whole-number rate: the second branch always has weight 0
	for i in n:
		var x := i * rate; var a := int(floor(x)); var f := x - a; var s0 := 0.0; var s1 := 0.0
		if a - H >= 0 and a + H + 1 < L:
			for jj in 2 * H + 1:
				var wj: float = w[jj]
				s0 += src[a - H + jj] * wj
				if not whole: s1 += src[a - H + jj + 1] * wj
		else:
			for j in range(-H, H + 1):
				var ia := a + j; var ib := ia + 1; var wj: float = w[j + H]
				if ia >= 0 and ia < L: s0 += src[ia] * wj
				if not whole and ib >= 0 and ib < L: s1 += src[ib] * wj
		o[i] = s0 * (1.0 - f) + s1 * f
	return o

## loudness on the RMS of the voice, soft knee only above the top
static func normalize(pcm: PackedFloat32Array) -> PackedFloat32Array:
	for i in pcm.size():
		if not is_finite(pcm[i]): pcm[i] = 0.0
	var sum := 0.0; var cnt := 0; var bs := 0.0; var bn := 0
	for i in pcm.size():
		bs += pcm[i] * pcm[i]; bn += 1
		if bn == 512:
			var r := bs / bn
			if r > 1e-7:
				sum += r; cnt += 1
			bs = 0.0; bn = 0
	var rms := sqrt(sum / cnt) if cnt > 0 else 0.0
	if rms == 0.0: return pcm
	var peak := _peak(pcm)
	var g: float = min(0.15 / rms, 0.98 / peak * 1.6)
	for i in pcm.size():
		var x := pcm[i] * g; var a: float = abs(x)
		pcm[i] = x if a < 0.7 else sign(x) * (0.7 + 0.28 * tanh((a - 0.7) / 0.28))
	var fd: int = min(256, pcm.size() >> 3)
	for i in fd:
		var w := float(i) / fd
		pcm[i] *= w; pcm[pcm.size() - 1 - i] *= w
	return pcm

func render_synth(toks: Array, o: Dictionary, sr: int) -> Dictionary:
	prosody(toks, o)
	var B := build_phones(toks, o)
	var pcm := synth_phones(B, o, sr)
	if o.engine == "animal": pcm = resample(pcm, o.rate)
	return {"pcm": normalize(pcm), "marks": B.marks}

static func _copy(toks: Array) -> Array:
	var out := []
	for t in toks: out.append(t.duplicate())
	return out

## one line in a style: the synth or the own voice, Echo Folk's four voices, then the style's effect
func render_style(engine: String, toks: Array, o: Dictionary, sr: int, grains: Array = []) -> Dictionary:
	var one := func(t: Array, oo: Dictionary) -> Dictionary: return render_sample(t, grains, oo, sr) if grains.size() > 0 else render_synth(t, oo, sr)
	var tk := _copy(toks)
	if engine == "tone" or engine == "instr": return render_tone(tk, o, sr)
	if engine == "blip": return render_blips(tk, o, sr)
	if engine == "droid": return render_droid(tk, o, sr)
	if engine == "echo":  # the same line by four voices, slightly apart in pitch, speed and timing
		var parts := []
		var L := [[1.0, 1.0, 0.0, 1.0], [0.84, 0.97, 0.021, 0.7], [1.19, 1.03, 0.037, 0.62], [0.71, 0.95, 0.011, 0.5]]
		for n in L.size():
			var t2 := _copy(toks)
			for x in t2:
				if x.has("jit"): x.jit = fmod(x.jit + n * 0.29, 1.0)
			var o2 := o.duplicate(); o2.P = o.P * L[n][0]; o2.S = o.S * L[n][1]
			parts.append({"r": one.call(t2, o2), "off": L[n][2], "a": L[n][3]})
		var N := 0
		for p in parts: N = max(N, p.r.pcm.size() + int(ceil(p.off * sr)))
		var mix := PackedFloat32Array(); mix.resize(N)
		for p in parts:
			var s0 := int(ceil(p.off * sr)); var pcm: PackedFloat32Array = p.r.pcm; var a: float = p.a
			for i in pcm.size(): mix[s0 + i] += pcm[i] * a
		var m := _peak(mix); var g := 0.85 / (m if m != 0.0 else 1.0)
		for i in N: mix[i] *= g
		return {"pcm": mix, "marks": parts[0].r.marks}
	var r: Dictionary = one.call(tk, o)
	if engine == "ghost": r = ghost_fx(r, sr)
	if FX.has(engine):
		var f := post_fx(FX[engine], r.pcm, sr, o.hiss)
		var pcm: PackedFloat32Array = f.pcm; var m := _peak(pcm)
		if m > 0.0:
			var g := 0.85 / m
			for i in pcm.size(): pcm[i] *= g
		var marks := []
		for mk in r.marks: marks.append([mk[0] + f.shift, mk[1]])
		r = {"pcm": pcm, "marks": marks}
	return r

# ---- effects on top of the synthesis ----
static func biquad(pcm: PackedFloat32Array, type: String, f: float, q: float, sr: int) -> PackedFloat32Array:
	var w := 2.0 * PI * f / sr; var al := sin(w) / (2.0 * q); var cw := cos(w)
	var b0: float; var b1: float; var b2: float; var a0 := 1.0 + al; var a1 := -2.0 * cw; var a2 := 1.0 - al
	if type == "lp":
		b0 = (1.0 - cw) / 2.0; b1 = 1.0 - cw; b2 = (1.0 - cw) / 2.0
	elif type == "hp":
		b0 = (1.0 + cw) / 2.0; b1 = -(1.0 + cw); b2 = (1.0 + cw) / 2.0
	else:
		b0 = al; b1 = 0.0; b2 = -al
	var x1 := 0.0; var x2 := 0.0; var y1 := 0.0; var y2 := 0.0
	for i in pcm.size():
		var x: float = pcm[i]; var y := (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
		x2 = x1; x1 = x; y2 = y1; y1 = y; pcm[i] = y
	return pcm

## hiss scales the radio hiss and squelch (default 1 = unchanged)
func post_fx(kind: String, pcm: PackedFloat32Array, sr: int, hiss: float) -> Dictionary:
	if kind == "grumble":
		pcm = biquad(pcm, "lp", 2600.0, 0.7, sr)
		for i in pcm.size(): pcm[i] = tanh(pcm[i] * 1.6) / 1.3
		return {"pcm": pcm, "shift": 0.0}
	if kind == "gizmo":  # lower sample rate and bit depth, then take the sharpest edge off
		var hold := int(max(1, js_round(sr / 9000.0))); var h := 0.0
		for i in pcm.size():
			if i % hold == 0: h = pcm[i]
			pcm[i] = js_round(h * 24.0) / 24.0
		pcm = biquad(pcm, "lp", 6500.0, 0.7, sr)
		return {"pcm": pcm, "shift": 0.0}
	if kind == "sprite":  # airy: thin out the lows, add a short doubled shimmer
		pcm = biquad(pcm, "hp", 260.0, 0.7, sr)
		var d := int(js_round(sr * 0.011)); var o := PackedFloat32Array(); o.resize(pcm.size() + d)
		for i in pcm.size():
			o[i] += pcm[i]; o[i + d] += pcm[i] * 0.35
		return {"pcm": o, "shift": 0.0}
	if kind == "radio":  # walkie-talkie: narrow band, a bit of drive, hiss, squelch before and after
		var m := _peak(pcm); var g := 1.0 / m if m > 0.0 else 1.0
		for i in pcm.size(): pcm[i] = tanh(pcm[i] * g * 2.2)
		pcm = biquad(pcm, "hp", 420.0, 0.8, sr); pcm = biquad(pcm, "lp", 2900.0, 0.9, sr)
		var pre := int(js_round(sr * 0.16)); var post := int(js_round(sr * 0.2)); var o := PackedFloat32Array(); o.resize(pre + pcm.size() + post)
		var hz := 0.0
		for i in o.size():
			hz += ((_rnd() * 2.0 - 1.0) - hz) * 0.5; o[i] = hz * 0.025 * hiss
		for sq in [[0, int(js_round(sr * 0.12)), 0.32 * hiss], [pre + pcm.size() + int(js_round(sr * 0.03)), int(js_round(sr * 0.15)), 0.3 * hiss]]:
			var z := 0.0; var at: int = sq[0]; var span: int = sq[1]; var amp: float = sq[2]
			for i in span:
				z += ((_rnd() * 2.0 - 1.0) - z) * 0.6; o[at + i] += z * amp * sin(PI * i / span)
		for i in pcm.size(): o[pre + i] += pcm[i] * 0.55
		return {"pcm": o, "shift": float(pre) / sr}
	return {"pcm": pcm, "shift": 0.0}

## Spooky Whisper: every syllable played backwards, then a long, dark echo
static func ghost_fx(r: Dictionary, sr: int) -> Dictionary:
	var pcm: PackedFloat32Array = r.pcm
	var cut := []
	for m in r.marks: cut.append(int(max(0, floor(m[0] * sr))))
	cut.append(pcm.size())
	var peak := _peak(pcm)
	for i in cut.size() - 1:  # reverse only the sound, not the pause after it
		var a: int = cut[i]; var e: int = min(cut[i + 1], pcm.size())
		while e > a and abs(pcm[e - 1]) < peak * 0.02: e -= 1
		var x := a; var y := e - 1
		while x < y:
			var s := pcm[x]; pcm[x] = pcm[y]; pcm[y] = s; x += 1; y -= 1
	var N := pcm.size() + int(floor(sr * 1.6)); var out := PackedFloat32Array(); out.resize(N)
	var combs := []
	for s in [0.0297, 0.0371, 0.0411, 0.0437]:
		var b := PackedFloat32Array(); b.resize(int(floor(s * sr * 1.5))); combs.append({"b": b, "i": 0, "lp": 0.0})
	var aps := []
	for s in [0.005, 0.0017]:
		var b := PackedFloat32Array(); b.resize(int(max(1, floor(s * sr)))); aps.append({"b": b, "i": 0})
	for n in N:
		var x: float = pcm[n] if n < pcm.size() else 0.0; var y := 0.0
		for c in combs:
			var o: float = c.b[c.i]; c.lp += 0.3 * (o - c.lp); c.b[c.i] = x + c.lp * 0.86; c.i = (c.i + 1) % c.b.size(); y += o
		y *= 0.25
		for a in aps:
			var bo: float = a.b[a.i]; var o2 := -0.5 * y + bo; a.b[a.i] = y + 0.5 * o2; a.i = (a.i + 1) % a.b.size(); y = o2
		out[n] = x * 0.55 + y * 0.75
	out = biquad(out, "lp", 4500.0, 0.7, sr)
	var m := _peak(out)
	if m > 0.0:
		var g := 0.85 / m
		for i in N: out[i] *= g
	return {"pcm": out, "marks": r.marks}

# ---- Soft Tones and Talking Instruments: no voice, pitched sounds that follow the melody of the line ----
static func quant(semi: float) -> float:
	var o: float = floor(semi / 12.0); var r: float = semi - o * 12.0; var best: float = SCALE[0]; var bd := 99.0
	for x in SCALE + [12.0]:
		var d: float = abs(x - r)
		if d < bd:
			bd = d; best = x
	return o * 12.0 + best

func render_tone(toks: Array, o: Dictionary, sr: int) -> Dictionary:
	var po := o.duplicate(); po.engine = "sim"; prosody(toks, po)
	var notes := []; var marks := []; var t := 0.02; var S: float = o.S; var P: float = o.P; var kind: String = o.tone if o.tone != "" else "droplet"
	for i in toks.size():
		var k: Dictionary = toks[i]
		if k.type == "gap":
			t += 0.045 / S; continue
		if k.type == "punct":
			t += (0.34 if is_end_mark(k.mark) else (0.16 if k.mark != "" else 0.0)) / S; continue
		if k.type == "laugh":
			marks.append([t, i])
			for r in 4:
				var f := P * pow(2.0, quant(9.0 - r * 2) / 12.0); var d := 0.075 / S
				notes.append({"t": t, "d": d, "f": f, "f2": f, "a": 0.55}); t += d
			continue
		marks.append([t, i]); var n: int = k.get("n", 1)
		var sA: float = k.get("semiA", 0.0); var sB: float = k.get("semiB", 0.0); var last: bool = k.get("last", false)
		for j in n:
			var x := j / float(n - 1) if n > 1 else 0.0; var step: float = (1.0 if j % 2 == 1 else -1.0) * o.E * 1.5 * (1.0 if n > 1 else 0.0)
			var raw: float = sA * (1.0 - x) + sB * x + step; var glide := kind == "horn" or kind == "trombone" or kind == "kazoo"
			var semi := raw if glide else quant(raw); var x2: float = min(1.0, (j + 0.8) / (n - 1)) if n > 1 else 1.0
			var semi2 := sA * (1.0 - x2) + sB * x2 + ((sB - sA) * 0.4 if (j == n - 1 and last) else 0.0) if glide else semi
			var base: float = SUST.get(o.tone, 0.088)
			var d := (base / S) * (1.12 if (j == 0 and k.stress) else 1.0) * (1.6 if (last and j == n - 1) else 1.0)
			notes.append({"t": t, "d": d, "f": P * pow(2.0, semi / 12.0), "f2": P * pow(2.0, semi2 / 12.0),
				"a": 0.5 * k.get("amp", 1.0) * (1.08 if j == 0 else 0.92) * (0.92 + ((js_hash(k.text + str(j)) % 100) / 100.0) * 0.16)})
			t += d
	var N := int(ceil((t + 1.2) * sr)); var out := PackedFloat32Array(); out.resize(N); var TP := TAU; var srf := float(sr)
	var ring := {"glass": 1.1, "felt": 0.8, "kalimba": 0.8, "clouds": 1.8, "breeze": 0.9, "hum": 0.6, "rain": 0.4, "softbubble": 0.4, "wood": 0.5}
	for nt in notes:
		var ntf: float = nt.f; var ntd: float = nt.d; var nta: float = nt.a; var ntf2: float = nt.f2
		var sus: float = ntd * 1.08 if SUST.has(kind) else 0.0
		var s0 := int(floor(nt.t * sr))
		var span: int = min(N - s0, int(floor(sr * ((sus + (0.25 if kind == "choir" else 0.08)) if sus != 0.0 else ring.get(kind, 0.35)))))
		var lo := 0.0; var bd := 0.0; var lo2 := 0.0
		var K := int(max(3, min(14, floor(6000.0 / ntf))))
		var R := rng(js_hash(js_fixed3(nt.t) + kind)); var extra := [R.call(), R.call(), R.call(), R.call()]
		var nz := 0.0; var b1 := 0.0; var b2 := 0.0
		var bf := ntf * 2.0; var bw := bf / 8.0; var BC := -exp(-TP * bw / srf); var BB := 2.0 * exp(-PI * bw / srf) * cos(TP * bf / srf); var BA := 1.0 - BB - BC
		var ph := 0.0; var ph2 := 0.0
		for i in span:
			var tt := i / srf; var v := 0.0
			if kind == "droplet":
				var f := ntf * (1.0 + 0.9 * exp(-tt / 0.012)); ph += f / srf; v = sin(TP * ph) * (1.0 - exp(-tt / 0.002)) * exp(-tt / 0.11)
			elif kind == "bubble":
				var f := ntf * (0.72 + 0.28 * (1.0 - exp(-tt / 0.025))); ph += f / srf; v = (sin(TP * ph) + 0.1 * sin(2.0 * TP * ph)) * (1.0 - exp(-tt / 0.004)) * exp(-tt / 0.08)
			elif kind == "kalimba":
				ph += ntf / srf; ph2 += ntf * 5.4 / srf; v = (sin(TP * ph) * exp(-tt / 0.32) + 0.12 * sin(TP * ph2) * exp(-tt / 0.025)) * (1.0 - exp(-tt / 0.0015))
			elif kind == "felt":
				ph += ntf / srf; v = (sin(TP * ph) + 0.25 * sin(2.0 * TP * ph) + 0.07 * sin(3.0 * TP * ph)) * (1.0 - exp(-tt / 0.012)) * exp(-tt / 0.38)
			elif kind == "horn" or kind == "trombone":  # muted brass: bright harmonics through a 'wah' mute that opens and closes per syllable
				var p: float = min(1.0, tt / max(0.02, sus)); var f := ntf * pow(ntf2 / ntf, smooth(p)) * (1.0 + (0.006 * sin(TP * 5.5 * tt) if tt > 0.08 else 0.0)); ph += f / srf
				var w := 0.0
				for h in range(1, K + 1): w += sin(TP * h * ph) / h
				var env: float = min(1.0, tt / 0.025) * (exp(-(tt - sus) / 0.03) if tt > sus else 1.0)
				var lo0 := 480.0 if kind == "horn" else 300.0; var hi0 := 1500.0 if kind == "horn" else 950.0
				var open := sin(PI * min(1.0, p * 1.1)); var fc := lo0 + (hi0 - lo0) * open
				var F := 2.0 * sin(PI * min(fc, srf / 6.0) / srf)
				lo += F * bd; var hi := w * 0.6 - lo - 0.35 * bd; bd += F * hi  # state-variable filter: the mute
				lo2 += 0.08 * (lo - lo2)
				v = (bd * 0.9 + lo2 * 0.5) * env * 0.55
			elif kind == "kazoo":  # a hummed tune through a buzzing paper membrane: rich harmonics, clipped, with a nasal resonance
				var p: float = min(1.0, tt / max(0.02, sus)); var f := ntf * pow(ntf2 / ntf, smooth(p)) * (1.0 + (0.012 * sin(TP * 6.0 * tt) if tt > 0.06 else 0.0)); ph += f / srf
				var w := 0.0
				for h in range(1, K + 1): w += sin(TP * h * ph) / h
				var env: float = min(1.0, tt / 0.02) * (exp(-(tt - sus) / 0.03) if tt > sus else 1.0); var bz := tanh(w * 3.2); var F := 2.0 * sin(PI * min(1150.0, srf / 6.0) / srf)
				lo += F * bd; var hi := bz - lo - 0.5 * bd; bd += F * hi
				v = (bz * 0.35 + bd * 0.8) * env * 0.5
			elif kind == "choir":  # soft 'ooh': three voices (root, a scale step up, octave below) with slow vibrato
				var env: float = min(1.0, tt / 0.09) * (exp(-(tt - sus) / 0.12) if tt > sus else 1.0); var w := 0.0
				for vc in [[1.0, 1.0, 0.0], [1.122, 0.55, 1.7], [0.5, 0.45, 3.1]]:
					var phs: float = vc[2]; var f: float = ntf * vc[0] * (1.0 + 0.005 * sin(TP * (4.8 + phs * 0.3) * tt + phs))
					for h in range(1, 9):
						var fh := f * h
						if fh > 5000.0: break
						var g := exp(-pow((fh - 330.0) / 180.0, 2.0)) + 0.5 * exp(-pow((fh - 720.0) / 260.0, 2.0)) + 0.08 * exp(-pow((fh - 2300.0) / 500.0, 2.0))
						w += vc[1] * g * sin(TP * fh * tt + phs * h)
				nz += ((_rnd() * 2.0 - 1.0) - nz) * 0.06; v = (w * 0.5 + nz * 0.05) * env
			elif kind == "purr":  # gentle purr: a low hum with a soft, shallow flutter and a breathing swell
				var env: float = min(1.0, tt / 0.12) * (exp(-(tt - sus) / 0.1) if tt > sus else 1.0); var fl := 0.7 + 0.3 * sin(TP * 24.0 * tt); ph += ntf * 0.5 / srf
				nz += ((_rnd() * 2.0 - 1.0) - nz) * 0.02; v = (sin(TP * ph) + 0.4 * sin(2.0 * TP * ph) + 0.15 * sin(3.0 * TP * ph) + nz * 1.5) * fl * env * 0.5
			elif kind == "clouds":  # slow, wide pad: root + fifth + octave, a tiny detune gives a slow shimmer
				var env := (1.0 - exp(-tt / 0.07)) * exp(-tt / 0.75); nz += ((_rnd() * 2.0 - 1.0) - nz) * 0.04
				v = (sin(TP * ntf * tt) + sin(TP * (ntf + 0.35) * tt) * 0.6 + 0.45 * sin(TP * ntf * 1.5 * tt) + 0.22 * sin(TP * ntf * 2.0 * tt + 1.0)) * env * 0.55 + nz * env * 0.35
			elif kind == "softbubble":  # slower, rounder bubble plus a smaller one just after
				var f := ntf * 0.85 * (0.8 + 0.2 * (1.0 - exp(-tt / 0.06))); ph += f / srf; var w := sin(TP * ph) * (1.0 - exp(-tt / 0.008)) * exp(-tt / 0.07)
				var t2: float = tt - 0.035 - extra[0] * 0.02
				if t2 > 0.0:
					var f2 := ntf * 1.27 * (0.8 + 0.2 * (1.0 - exp(-t2 / 0.05))); ph2 += f2 / srf; w += 0.4 * sin(TP * ph2) * (1.0 - exp(-t2 / 0.008)) * exp(-t2 / 0.05)
				v = w
			elif kind == "rain":  # a soft drop with one or two smaller drops around it
				v = _drop(tt, ntf * 2.0, 1.0) + _drop(tt - 0.02 - extra[1] * 0.05, ntf * 2.0 * pow(2.0, [0.0, 2.0, 4.0, 7.0, 9.0][int(floor(extra[2] * 5))] / 12.0), 0.3) \
					+ (_drop(tt - 0.07 - extra[0] * 0.04, ntf * 3.0, 0.18) if extra[3] > 0.5 else 0.0)
			elif kind == "breeze":  # pitched whoosh: soft noise through a narrow resonance at the note
				nz = _rnd() * 2.0 - 1.0; var y := BA * nz + BB * b1 + BC * b2; b2 = b1; b1 = y; v = y * 6.0 * (1.0 - exp(-tt / 0.08)) * exp(-tt / 0.22)
			elif kind == "hum":  # closed-mouth "mmm": warm harmonics, gentle vibrato
				var vib := 1.0 + 0.004 * sin(TP * 5.0 * tt); ph += ntf * vib / srf; var env := (1.0 - exp(-tt / 0.04)) * exp(-tt / 0.2)
				v = (sin(TP * ph) + 0.35 * sin(2.0 * TP * ph) + 0.12 * sin(3.0 * TP * ph)) * env * 0.7
			elif kind == "wood":  # soft wooden tap
				ph += ntf / srf; ph2 += ntf * 2.76 / srf; v = (sin(TP * ph) * exp(-tt / 0.12) + 0.25 * sin(TP * ph2) * exp(-tt / 0.02)) * (1.0 - exp(-tt / 0.0008))
			else:
				ph += ntf / srf; ph2 += ntf * 3.5 / srf; var I := 1.5 * exp(-tt / 0.14)
				v = sin(TP * ph + I * sin(TP * ph2)) * (1.0 - exp(-tt / 0.003)) * exp(-tt / 0.6) * 0.7
			var tail := (span - i) / 200.0 if i > span - 200 else 1.0
			out[s0 + i] += v * nta * tail
	# brightness: gentle low-pass
	var fc: float = 1500.0 + max(0.0, min(1.0, (o.tilt - 0.15) / 0.75)) * 8000.0; var a := 1.0 - exp(-TP * fc / srf); var y := 0.0; var yy := 0.0
	for i in N:
		y += a * (out[i] - y); yy += a * (y - yy); out[i] = yy
	# RBJ peaking cut, -6 dB around 3 kHz
	var A := pow(10.0, -6.0 / 40.0); var w0 := TP * 3000.0 / srf; var al := sin(w0) / (2.0 * 0.9); var cw := cos(w0)
	var b0 := 1.0 + al * A; var pb1 := -2.0 * cw; var pb2 := 1.0 - al * A; var a0 := 1.0 + al / A; var a1 := -2.0 * cw; var a2 := 1.0 - al / A
	var x1 := 0.0; var x2 := 0.0; var y1 := 0.0; var y2 := 0.0
	for i in N:
		var x: float = out[i]; var yv := (b0 * x + pb1 * x1 + pb2 * x2 - a1 * y1 - a2 * y2) / a0
		x2 = x1; x1 = x; y2 = y1; y1 = yv; out[i] = yv
	for i in N:
		if not is_finite(out[i]): out[i] = 0.0
	var m := _peak(out)
	if m > 0.0:
		var g := 0.8 / m
		for i in N: out[i] *= g
	return {"pcm": out, "marks": marks}

static func _drop(t: float, f: float, a: float) -> float:
	if t < 0.0: return 0.0
	return sin(TAU * f * (t + 0.006 * 0.6 * (1.0 - exp(-t / 0.006)))) * (1.0 - exp(-t / 0.001)) * exp(-t / 0.045) * a

## brightness as a gentle low-pass, then a fixed peak
static func tone_finish(out: PackedFloat32Array, o: Dictionary, sr: int) -> PackedFloat32Array:
	var fc: float = 1500.0 + max(0.0, min(1.0, (o.tilt - 0.15) / 0.75)) * 8000.0; var a := 1.0 - exp(-2.0 * PI * fc / sr); var y := 0.0; var y2 := 0.0
	for i in out.size():
		y += a * (out[i] - y); y2 += a * (y - y2); out[i] = y2 if is_finite(y2) else 0.0
	var m := _peak(out)
	if m > 0.0:
		var g := 0.8 / m
		for i in out.size(): out[i] *= g
	return out

# ---- Text Blips: one short retro beep per letter, like the text box of a pixel-art game ----
static func _blep(t: float, dt: float) -> float:  # PolyBLEP: rounds off the jumps
	if t < dt:
		t /= dt; return t + t - t * t - 1.0
	if t > 1.0 - dt:
		t = (t - 1.0) / dt; return t * t + t + t + 1.0
	return 0.0

static func _blip_wave(kind: String, ph: float, dt: float) -> float:
	if kind == "saw": return 2.0 * ph - 1.0 - _blep(ph, dt)
	if kind == "tri": return 1.0 - 4.0 * abs(ph - 0.5)
	var duty := 0.25 if kind == "pulse" else 0.5
	return (1.0 if ph < duty else -1.0) + _blep(ph, dt) - _blep(fmod(ph - duty + 1.0, 1.0), dt)

func render_blips(toks: Array, o: Dictionary, sr: int) -> Dictionary:
	var po := o.duplicate(); po.engine = "animal"; prosody(toks, po)  # a melody per letter, as in Critter Chatter
	var S: float = o.S; var slot := 0.052 / S; var kind: String = o.tone if o.tone != "" else "square"; var notes := []; var marks := []; var t := 0.02
	for i in toks.size():
		var k: Dictionary = toks[i]
		if k.type == "gap":
			t += slot; continue
		if k.type == "punct":
			t += (0.3 if is_end_mark(k.mark) else (0.14 if k.mark != "" else 0.0)) / S; continue
		if k.type != "syl": continue
		marks.append([t, i]); var semi := quant((k.semiB if k.last else k.semiA) * 0.7)
		notes.append({"t": t, "f": o.P * pow(2.0, semi / 12.0), "a": k.get("amp", 1.0), "d": 0.012 if kind == "click" else slot * 0.62}); t += slot
	var N := int(ceil((t + 0.2) * sr)); var out := PackedFloat32Array(); out.resize(N); var srf := float(sr)
	for nt in notes:
		var s0 := int(floor(nt.t * sr)); var span: int = min(N - s0, int(floor((nt.d + 0.006) * sr))); var dt: float = nt.f / srf; var ph := 0.0; var d: float = nt.d; var na: float = nt.a
		for i in span:
			var tt := i / srf; var env: float = min(1.0, tt / 0.0015) * (max(0.0, 1.0 - (tt - d) / 0.006) if tt > d else 1.0)
			var v: float
			if kind == "click": v = (_rnd() * 2.0 - 1.0) * exp(-tt / 0.002) * 0.8 + _blip_wave("square", ph, dt) * exp(-tt / 0.004) * 0.5
			else: v = _blip_wave(kind, ph, dt) * (1.0 if kind == "tri" else 0.6)
			ph += dt
			if ph >= 1.0: ph -= 1.0
			out[s0 + i] += v * env * na * 0.5
	return {"pcm": tone_finish(out, o, sr), "marks": marks}

# ---- Droid Chirps: whistles, beeps and warbles that carry the emotion, no syllables ----
func render_droid(toks: Array, o: Dictionary, sr: int) -> Dictionary:
	var po := o.duplicate(); po.engine = "sim"; prosody(toks, po)
	var S: float = o.S; var ev := []; var marks := []; var P: float = o.P * 4.0; var X := 1.6; var t := 0.03  # whistles two octaves above the voice, with a wider melody
	var kinds := {"plo": "blip", "fri": "warble", "nas": "boop", "liq": "trill", "h": "sweep"}
	var lens := {"blip": 0.07, "warble": 0.13, "boop": 0.1, "trill": 0.12, "sweep": 0.14, "whistle": 0.11}
	for i in toks.size():
		var k: Dictionary = toks[i]
		if k.type == "gap":
			t += 0.05 / S; continue
		if k.type == "punct":
			t += (0.3 if is_end_mark(k.mark) else (0.12 if k.mark != "" else 0.0)) / S; continue
		if k.type == "laugh":
			marks.append([t, i])
			for n in 5:
				ev.append({"t": t, "d": 0.05 / S, "kind": "whistle", "f": P * pow(2.0, (4 + n * 2) / 12.0), "f2": P * pow(2.0, (7 + n * 2) / 12.0), "a": 0.8}); t += 0.06 / S
			continue
		if k.type != "syl": continue
		marks.append([t, i])
		var cl: String = (CT[k.c][0] if CT.has(k.c) else "plo") if k.c != "" else ""
		var kind: String = kinds.get(cl, "whistle")  # the consonant picks the kind of chirp
		var d: float = lens[kind] * (1.15 if k.get("stress", false) else 1.0) * (1.5 if k.get("last", false) else 1.0) * (0.85 + k.jit * 0.3) / S
		ev.append({"t": t, "d": d, "kind": kind, "f": P * pow(2.0, k.semiA * X / 12.0), "f2": P * pow(2.0, k.semiB * X / 12.0), "a": k.get("amp", 1.0)}); t += d + 0.025 / S
	var N := int(ceil((t + 0.25) * sr)); var out := PackedFloat32Array(); out.resize(N); var TP := TAU; var srf := float(sr)
	var buzz := (0.35 if o.tone == "zapp" else 0.0) + (0.45 if o.mood == "boos" else 0.0)
	for e in ev:
		var s0 := int(floor(e.t * sr)); var span: int = min(N - s0, int(floor((e.d + 0.015) * sr))); var ph := 0.0; var bph := 0.0
		var ed: float = e.d; var ef: float = e.f; var ef2: float = e.f2; var ea: float = e.a; var ek: String = e.kind
		for i in span:
			var tt := i / srf; var p: float = min(1.0, tt / ed); var env: float = min(1.0, tt / 0.004) * (max(0.0, 1.0 - (tt - ed) / 0.015) if tt > ed else 1.0)
			var f: float
			if ek == "blip": f = ef if p < 0.5 else ef * 1.26  # two quick steps
			elif ek == "warble": f = (ef + (ef2 - ef) * p) * (1.0 + 0.12 * sin(TP * 32.0 * tt))
			elif ek == "boop": f = ef * 0.5 * (1.0 + 0.3 * (1.0 - p))
			elif ek == "trill": f = (ef + (ef2 - ef) * p) * (1.33 if sin(TP * 19.0 * tt) > 0.0 else 1.0)
			elif ek == "sweep": f = ef * 0.8 * pow(2.2 if ef2 > ef else 0.45, smooth(p))
			else: f = ef * pow(ef2 / ef, smooth(p))
			ph += f / srf; bph += f * 0.25 / srf
			var v: float = sin(TP * ph) * 0.9 + 0.3 * sin(TP * ph * 0.5) if o.tone == "rollo" else sin(TP * ph) + 0.18 * sin(2.0 * TP * ph)
			if buzz != 0.0: v += buzz * (0.5 if fmod(bph, 1.0) < 0.5 else -0.5)  # angry or glitchy: a low buzz under the whistle
			if o.tone == "zapp" and _rnd() < 0.004: v += _rnd() * 2.0 - 1.0
			out[s0 + i] += v * env * ea * 0.45
	return {"pcm": tone_finish(out, o, sr), "marks": marks}

# ---- own voice: a .babble-voice.json from the tool's Export button ----
const GRAIN_KEYS := ["c", "v", "k", "bark", "tail", "pos", "f0", "loud"]

## Read a voice exported in the tool (Voices & characters, Export), as JSON text or a parsed Dictionary.
## Pass the result as option own_voice. Returns {} after push_error when it is not a voice file.
static func load_voice(file) -> Dictionary:
	var f = JSON.parse_string(file) if file is String else file
	if not (f is Dictionary and f.get("format") == "babble-voice" and f.get("version") == 1.0 and f.get("sounds") is Array and f.sounds.size() > 0
			and (f.get("sampleRate") is float or f.get("sampleRate") is int) and f.sampleRate > 0):
		return _fail("not a Babble voice file (export one from Voices & characters on babble.wrongfloor.studio)")
	var grains := []
	for s in f.sounds:
		var bytes := Marshalls.base64_to_raw(s.pcm); var n := bytes.size() >> 1; var g := PackedFloat32Array(); g.resize(n)
		for i in n: g[i] = bytes.decode_s16(2 * i) / 32768.0
		var grain := {"pcm": g}
		for k in GRAIN_KEYS:
			if s.has(k): grain[k] = s[k]
		grains.append(grain)
	var median = f.get("median")
	return {"name": str(f.get("name", "Voice")) if f.get("name", "") != "" else "Voice", "sample_rate": float(f.sampleRate),
		"median": median if (median is float and is_finite(median)) else 180.0, "grains": grains, "_at": {}}

## the recorded sounds at the render's sample rate (linear, cached per rate)
static func grains_at(voice: Dictionary, sr: int) -> Array:
	if voice.sample_rate == sr: return voice.grains
	if voice._at.has(sr): return voice._at[sr]
	var k: float = voice.sample_rate / sr; var out := []
	for g in voice.grains:
		var src: PackedFloat32Array = g.pcm; var L := src.size(); var n := int(max(1, floor(L / k))); var o := PackedFloat32Array(); o.resize(n)
		for i in n:
			var p := i * k; var j := int(floor(p)); var f := p - j
			o[i] = (src[j] if j < L else 0.0) * (1.0 - f) + (src[j + 1] if j + 1 < L else 0.0) * f
		var grain := {"pcm": o}
		for key in GRAIN_KEYS:
			if g.has(key): grain[key] = g[key]
		out.append(grain)
	voice._at[sr] = out
	return out

static func lowpass(src: PackedFloat32Array, fc: float) -> PackedFloat32Array:
	var H := 24; var w := PackedFloat64Array(); var ws := 0.0
	for i in range(-H, H + 1):
		var x: float = 2.0 * fc if i == 0 else sin(2.0 * PI * fc * i) / (PI * i)
		var bw := 0.42 + 0.5 * cos(PI * i / H) + 0.08 * cos(2.0 * PI * i / H)
		w.append(x * bw); ws += x * bw
	var L := src.size(); var o := PackedFloat32Array(); o.resize(L)
	for i in L:
		var a := 0.0
		for j in range(max(-H, -i), min(H, L - 1 - i) + 1): a += src[i + j] * w[j + H]
		o[i] = a / ws
	return o

static func env_of(pcm: PackedFloat32Array, sr: int, ms: float) -> Dictionary:
	var hop := int(max(1, js_round(sr * ms / 1000.0))); var n := pcm.size() / hop; var e := PackedFloat32Array(); e.resize(n)
	for i in n:
		var s := 0.0
		for j in hop:
			var v := pcm[i * hop + j]; s += v * v
		e[i] = sqrt(s / hop)
	return {"e": e, "hop": hop}

## own voice: pitch every 10 ms, so a syllable that glides can be held on the intended note (option steady).
## Analysed at ~12 kHz, searched within an octave of the voice's median (ref) to avoid octave and noise errors.
static func pitch_track(g: PackedFloat32Array, sr: int, ref: float):
	var D := int(max(1, floor(sr / 12000.0))); var fs := float(sr) / D; var n := g.size() / D; var x := PackedFloat32Array(); x.resize(n)
	for i in n:
		var s := 0.0
		for j in D: s += g[i * D + j]
		x[i] = s / D
	var hop := int(js_round(fs * 0.01)); var W := int(js_round(fs * 0.04)); var lo := int(max(2, floor(fs / min(700.0, ref * 2.0)))); var hi := int(ceil(fs / max(55.0, ref / 2.0)))
	var F := int(floor(float(n - W - hi) / hop)) + 1
	if F < 1: return null
	var f := PackedFloat32Array(); f.resize(F); var en := PackedFloat32Array(); en.resize(F); var emax := 0.0
	for k in F:
		var o := k * hop; var e0 := 0.0
		for i in W: e0 += x[o + i] * x[o + i]
		en[k] = e0; emax = max(emax, e0)
		if e0 == 0.0: continue
		var el := 0.0
		for i in W: el += x[o + lo + i] * x[o + lo + i]
		var r := PackedFloat32Array(); r.resize(hi + 2); var bl := 0; var bv := 0.0
		for lag in range(lo, hi + 1):
			var s := 0.0
			for i in W: s += x[o + i] * x[o + i + lag]
			r[lag] = s / sqrt(e0 * el) if el > 0.0 else 0.0
			if r[lag] > bv:
				bv = r[lag]; bl = lag
			el += x[o + lag + W] * x[o + lag + W] - x[o + lag] * x[o + lag]
		if bv < 0.6 or bl <= lo or bl >= hi: continue
		var a: float = r[bl - 1]; var b: float = r[bl]; var d: float = r[bl + 1]; var den := a - 2.0 * b + d; var p := 0.5 * (a - d) / den if den != 0.0 else 0.0
		var hz := fs / (bl + p)
		var st := 12.0 * log(hz / ref) / log(2.0)
		if abs(st) > 7.0:
			var h2 := 12.0 * log(hz * 2.0 / ref) / log(2.0); var h1 := 12.0 * log(hz / 2.0 / ref) / log(2.0)
			hz = hz * 2.0 if abs(h2) <= 7.0 else (hz / 2.0 if abs(h1) <= 7.0 else 0.0)
		f[k] = hz
	for k in F:
		if en[k] < emax * 0.05: f[k] = 0.0  # too soft: consonant or silence
	var voiced := []
	for k in F:
		if f[k] != 0.0: voiced.append(k)
	if voiced.is_empty(): return null
	var lf := PackedFloat32Array(); lf.resize(F)
	for k in F: lf[k] = log(f[k]) if f[k] != 0.0 else 0.0
	var med := PackedFloat32Array(); med.resize(F)
	for k in F:
		if f[k] == 0.0: continue
		var w := []
		for j in range(k - 2, k + 3):
			if j >= 0 and j < F and f[j] != 0.0: w.append(lf[j])
		w.sort(); med[k] = w[w.size() >> 1]
	var last: float = med[voiced[0]]
	for k in F:  # hold through unvoiced frames
		if med[k] != 0.0: last = med[k]
		else: med[k] = last
	var out := PackedFloat32Array(); out.resize(F)
	for k in F:
		var s := 0.0; var m := 0
		for j in range(k - 1, k + 2):
			if j >= 0 and j < F:
				s += med[j]; m += 1
		out[k] = exp(s / m)
	return {"hop": hop * D, "off": (W >> 1) * D, "f": out}

static func _vkey(v) -> String:  # (VSPEC[v] || [v]).join()
	if v == null: return ""
	return ",".join(VSPEC[v]) if VSPEC.has(v) else str(v)

static func _vfirst(v) -> String:  # (VSPEC[v] || [v])[0]
	if v == null: return ""
	return VSPEC[v][0] if VSPEC.has(v) else str(v)

static func coda_class(k) -> String:
	if k == "m" or k == "n" or k == "ng": return "nas"
	if k == "l" or k == "r": return "liq"
	return "plo"

## the plain consonant + vowel sounds: no ending, no bark, no cluster
static func plain_grains(grains: Array) -> Array:
	var out := []
	for g in grains:
		var c = g.get("c", "")
		if g.get("k", "") == "" and g.get("bark", "") == "" and not (c != "" and c != null and not CT.has(c)): out.append(g)
	return out

static func _score(gk: String, kk: String) -> int:
	if gk == kk: return 3
	if kk == "" or gk == "": return 1 if (kk != "" and gk == "") else 0
	return 2 if coda_class(gk) == coda_class(kk) else 0

## Sounds from the optional rounds (clusters, endings, barks) are only used when they match;
## everything else picks from the plain sounds, so a voice without those rounds sounds as before.
static func pick_grain(grains: Array, k: Dictionary, salt: String) -> Dictionary:
	var kv: String = k.get("v", "") if k.get("v", "") != "" else "a"
	var kc: String = k.get("c", "")
	var with_k := false
	for g in grains:
		if g.has("k"):
			with_k = true; break
	if with_k:  # same start and vowel; the exact ending, else one that sounds alike (bib -> bip), else none (krik -> kri)
		var sp := _vkey(kv); var kk: String = k.get("k", ""); var cand := []
		for g in grains:
			if g.has("k") and g.get("c") == kc and _vkey(g.get("v")) == sp: cand.append(g)
		var best := 0
		for g in cand: best = max(best, _score(g.k, kk))
		if best > 0:
			var hit := []
			for g in cand:
				if _score(g.k, kk) == best: hit.append(g)
			return hit[js_hash(salt) % hit.size()]
	var plain := plain_grains(grains)
	var c := kc if (CT.has(kc) or kc == "") else kc.left(1)  # a cluster (bl) uses its first consonant
	var vb := _vfirst(kv); var sp := _vkey(kv); var pool := []
	for g in plain:
		if g.has("v") and g.get("c") == c and g.v == kv: pool.append(g)
	if pool.is_empty():  # same pronunciation: a = ah, i = ee, u = oo, ay = ei
		for g in plain:
			if g.has("v") and g.get("c") == c and _vkey(g.v) == sp: pool.append(g)
	if pool.is_empty():
		for g in plain:
			if g.has("v") and g.get("c") == c and _vfirst(g.v) == vb: pool.append(g)
	if pool.is_empty() and c != "":
		for g in plain:
			if g.get("c") == c: pool.append(g)
	if pool.is_empty():
		for g in plain:
			if g.has("v") and _vfirst(g.v) == vb: pool.append(g)
	if pool.is_empty(): pool = plain
	var mid := []  # middle of a breath = most natural transitions
	for g in pool:
		if g.get("pos", -1) == 1 or g.get("pos", -1) == 2: mid.append(g)
	if mid.size() > 0 and js_hash(salt + "m") % 4 != 0: pool = mid
	return pool[js_hash(salt) % pool.size()]

## an ending from the endings round for a syllable that has none recorded: same vowel and end sound, else same end sound, else one of the same kind
static func tail_for(grains: Array, k: Dictionary, salt: String):
	var kv: String = k.get("v", "") if k.get("v", "") != "" else "a"
	var sp: Array = VSPEC[kv] if VSPEC.has(kv) else [kv]; var vb: String = sp[-1]; var pool := []
	for g in grains:
		if g.get("tail", false) and g.get("k") == k.k and _vfirst(g.get("v")) == vb: pool.append(g)
	if pool.is_empty():
		for g in grains:
			if g.get("tail", false) and g.get("k") == k.k: pool.append(g)
	if pool.is_empty():
		for g in grains:
			if g.get("tail", false) and coda_class(g.get("k")) == coda_class(k.k) and _vfirst(g.get("v")) == vb: pool.append(g)
	return pool[js_hash(salt + "t") % pool.size()] if pool.size() > 0 else null

static func tail_start(g: Dictionary, sr: int) -> int:  # ~90 ms of vowel, then the end sound
	if not g.has("_ts"):
		var E := env_of(g.pcm, sr, 5.0); var e: PackedFloat32Array = E.e; var pk := 0.0; var ve := 0
		for v in e: pk = max(pk, v)
		for i in e.size():
			if e[i] > pk * 0.5: ve = i
		g._ts = int(max(0, ve * E.hop - js_round(sr * 0.09)))
	return g._ts

static func vowel_level(g: Dictionary, sr: int) -> float:
	if not g.has("_lv"):
		var e: PackedFloat32Array = env_of(g.pcm, sr, 40.0).e; var pk := 0.0
		for v in e: pk = max(pk, v)
		g._lv = pk if pk != 0.0 else 1.0
	return g._lv

## own voice: every syllable is a recorded sound, retuned to the melody of the line
func render_sample(toks: Array, grains: Array, o: Dictionary, sr: int) -> Dictionary:
	prosody(toks, o)
	var animal: bool = o.engine == "animal"; var S: float = o.S; var basep: float = o.base if o.base != 0.0 else 200.0
	var base: float = (o.P / basep) * (o.rate if animal else 1.0); var sd: float = min(1.0, max(0.0, o.get("steady", 0.0)))
	var recF0: float = o.get("recF0", 0.0); var srf := float(sr)
	var items := []; var marks := []; var plain := plain_grains(grains); var tails := false; var t := 0.0; var in_bark := false
	for g in grains:
		if g.get("tail", false):
			tails = true; break
	for i in toks.size():
		var k: Dictionary = toks[i]
		if k.type == "syl":
			if k.get("barkPart", false) and in_bark: continue
			in_bark = false
		if k.type == "gap":
			t += (0.035 if animal else 0.04) / S; continue
		if k.type == "punct":
			t += (0.34 if is_end_mark(k.mark) else (0.16 if k.mark != "" else 0.0)) / S; continue
		marks.append([t, i])
		var amp: float = k.get("amp", 1.0)
		if k.has("bark"):  # a recorded bark plays whole, at its own melody; the pitch slider moves it
			var bg := []
			for g in grains:
				if g.get("bark") == k.bark: bg.append(g)
			if bg.size() > 0:
				var g: Dictionary = bg[js_hash(k.bark + str(i)) % bg.size()]
				var rate: float = min(2.0, max(0.5, o.P / basep)); var span: float = g.pcm.size() / srf / rate
				items.append({"g": lowpass(g.pcm, 0.46 / rate) if rate > 1.12 else g.pcm, "off": 0, "t": t, "rate": rate, "end": 1.0, "span": span, "amp": amp, "pc": null, "g0": g.get("f0", 0.0)})
				t += span * 0.95; in_bark = true; continue
		var laugh: bool = k.type == "laugh"; var reps: int = k.n if laugh else 1; var txt: String = k.get("text", "")
		for r in reps:
			var g: Dictionary = plain[js_hash("l" + str(i) + str(r)) % plain.size()] if laugh else pick_grain(grains, k, txt + str(i) + str(r))
			var tg = null
			if tails and not laugh and k.k != "" and g.get("k") != k.k:
				tg = tail_for(grains, k, txt + str(i))
				if tg != null:  # no recorded ending: the syllable without it, plus a recorded ending
					var k2 := k.duplicate(); k2.k = ""; g = pick_grain(grains, k2, txt + str(i) + str(r))
			var semi: float = 4.0 - r if laugh else k.get("semiA", 0.0)
			var rate: float; var pc = null; var gf0: float = g.get("f0", 0.0)
			if gf0 != 0.0 and recF0 != 0.0 and sd != 0.0:
				if not g.has("_pt") or g._ptr != recF0:
					g._pt = pitch_track(g.pcm, sr, recF0); g._ptr = recF0
				pc = g._pt
			if gf0 != 0.0 and recF0 != 0.0:  # every syllable lands on the intended pitch, whatever pitch it was read at
				var target: float = (o.P if animal else recF0 * (o.P / basep)) * pow(2.0, semi / 12.0); rate = min(3.2, max(0.45, target / gf0))
			else: rate = base * pow(2.0, semi / 12.0)
			var sb: float = k.semiB if k.has("semiB") else k.get("semiA", 0.0)
			var end := pow(2.0, (sb - k.get("semiA", 0.0)) / 12.0)
			var span: float = g.pcm.size() / srf / rate; var last: bool = k.get("last", false)
			if animal: span = min(span, 0.075 / S * (1.5 if last else 1.0))
			else: span = min(span, (0.42 if last else 0.26) / S)
			if laugh: span = min(span, 0.1)
			var top: float = rate * max(1.0, end)
			if pc != null:
				var mn := INF
				for v in pc.f: mn = min(mn, v)
				top *= max(1.0, pow(gf0 / mn, sd))
			var gg: PackedFloat32Array = g.pcm
			if top > 1.12:  # one low-passed copy per sound, kept for the next syllable with about the same speed
				var key := js_round(top * 10.0)
				if not (g.has("_lp") and g._lp[0] == key): g._lp = [key, lowpass(g.pcm, 0.46 / top)]
				gg = g._lp[1]
			if tg != null:  # syllable for 60% of its time, then the ending, cross-faded inside the vowel, on the end note and at the syllable's loudness
				var cv := span * 0.6; var off := tail_start(tg, sr); var tgf0: float = tg.get("f0", 0.0)
				var tr: float = min(3.2, max(0.45, recF0 * (o.P / basep) * pow(2.0, k.semiB / 12.0) / tgf0)) if (tgf0 != 0.0 and recF0 != 0.0) else rate * end
				var tl: float = min((tg.pcm.size() - off) / srf / tr, 0.32 / S)
				var ta: float = min(2.0, max(0.5, vowel_level(g, sr) / vowel_level(tg, sr)))
				items.append({"g": gg, "off": 0, "t": t, "rate": rate, "end": sqrt(end), "span": cv + 0.015, "amp": amp, "pc": pc, "g0": gf0})
				items.append({"g": lowpass(tg.pcm, 0.46 / tr) if tr > 1.12 else tg.pcm, "off": off, "t": t + cv - 0.015, "rate": tr, "end": 1.0, "span": tl, "amp": amp * ta, "pc": null, "g0": tgf0})
				t += (cv + tl) * 0.82; continue
			items.append({"g": gg, "off": 0, "t": t, "rate": rate, "end": end, "span": span, "amp": amp, "pc": pc, "g0": gf0})
			t += span * 0.92 if animal else span * 0.82
	var N := int(ceil((t + 0.3) * sr)); var out := PackedFloat32Array(); out.resize(N)
	for it in items:
		var n := int(floor(it.span * sr)); var s0 := int(floor(it.t * sr)); var fade: int = min(int(floor(sr * 0.012)), n >> 2)
		var x: float = it.off; var g: PackedFloat32Array = it.g; var L := g.size(); var rate: float = it.rate; var e1: float = it.end - 1.0; var amp: float = it.amp
		var pc = it.pc; var g0: float = it.g0
		for i in n:
			if s0 + i >= N: break
			var r := rate * (1.0 + e1 * (float(i) / n))
			if pc != null:  # follow the syllable's own pitch, so every moment lands on the note
				var pf: PackedFloat32Array = pc.f; var PL := pf.size() - 1; var fi: float = min(PL, max(0.0, (x - pc.off) / pc.hop))
				var a := int(floor(fi)); var b: int = min(PL, a + 1); var src: float = pf[a] + (pf[b] - pf[a]) * (fi - a)
				r = min(3.2, max(0.45, r * pow(g0 / src, sd)))
			x += r; var ai := int(floor(x))
			if ai + 1 >= L: break
			var v := g[ai] * (1.0 - (x - ai)) + g[ai + 1] * (x - ai)
			var w := float(i) / fade if i < fade else (float(n - i) / fade if i > n - fade else 1.0)
			out[s0 + i] += v * w * amp
	return {"pcm": normalize(out), "marks": marks}
