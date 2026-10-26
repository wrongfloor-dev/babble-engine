## Babble Engine for Godot: gibberish speech for game characters.
## A port of site/src/engine.js. Same text, options and seed give the same sound as the web module.
##
##   var line := BabbleEngine.render("Hi! Do you want an apple?", {"style": "animal", "mood": "happy"})
##   # line.pcm (PackedFloat32Array), line.sample_rate, line.duration, line.syllables [{time, text}]
class_name BabbleEngine
extends RefCounted

const VERSION := "1.1.0"

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
const FR := 0.0025
const B_DEF := [70.0, 100.0, 160.0, 250.0]
const M32 := 0xFFFFFFFF

# ---- styles and voices (engine.js ENGINES), step 1: Critter Chatter and Babblish ----
const STYLES := {
	"animal": {"name": "Critter Chatter", "voices": {
		"fern": {"name": "Fern", "pitch": 360.0, "speed": 1.6, "expr": 0.45, "form": 1.0, "breath": 0.06, "tilt": 0.55, "oq": 0.56, "jit": 1.0, "rate": 2.0},
		"burt": {"name": "Burt", "pitch": 150.0, "speed": 1.25, "expr": 0.25, "form": 0.92, "breath": 0.08, "tilt": 0.4, "oq": 0.5, "jit": 1.3, "rate": 1.5},
		"pip": {"name": "Pip", "pitch": 620.0, "speed": 2.0, "expr": 0.55, "form": 1.05, "breath": 0.04, "tilt": 0.6, "oq": 0.55, "jit": 1.0, "rate": 2.6},
		"lowell": {"name": "Lowell", "pitch": 230.0, "speed": 1.15, "expr": 0.3, "form": 1.0, "breath": 0.06, "tilt": 0.45, "oq": 0.58, "jit": 1.0, "rate": 1.7},
		"bleep": {"name": "Bleep", "pitch": 260.0, "speed": 1.5, "expr": 0.3, "form": 1.0, "breath": 0.0, "tilt": 0.7, "oq": 0.5, "jit": 0.0, "rate": 2.0, "quant": true}}},
	"sim": {"name": "Babblish", "voices": {
		"lottie": {"name": "Lottie", "pitch": 215.0, "speed": 1.0, "expr": 0.7, "form": 1.12, "breath": 0.2, "tilt": 0.45, "oq": 0.65, "jit": 1.0},
		"ben": {"name": "Ben", "pitch": 112.0, "speed": 0.95, "expr": 0.65, "form": 0.92, "breath": 0.14, "tilt": 0.38, "oq": 0.58, "jit": 1.0},
		"kiki": {"name": "Kiki", "pitch": 320.0, "speed": 1.12, "expr": 0.85, "form": 1.3, "breath": 0.12, "tilt": 0.5, "oq": 0.62, "jit": 1.0},
		"hank": {"name": "Grandpa Hank", "pitch": 135.0, "speed": 0.82, "expr": 0.5, "form": 0.95, "breath": 0.32, "tilt": 0.3, "oq": 0.68, "jit": 2.2, "vib": true},
		"whisper": {"name": "Whisper", "pitch": 180.0, "speed": 0.9, "expr": 0.6, "form": 1.05, "breath": 0.3, "tilt": 0.35, "oq": 0.65, "jit": 1.0, "whisper": true},
		"bubs": {"name": "Bubs", "pitch": 420.0, "speed": 0.9, "expr": 0.95, "form": 1.55, "breath": 0.1, "tilt": 0.5, "oq": 0.62, "jit": 1.0}}},
}
const SLIDERS := {"pitch": "pitch", "speed": "speed", "expression": "expr", "throat": "form", "breath": "breath", "brightness": "tilt"}

var _seed_state := 0

## Render one line. Options: style, voice, mood, seed (default 1), sample_rate (default 48000), hiss,
## pitch, speed, expression, throat, breath, brightness. Returns {pcm, sample_rate, duration, style, voice, syllables}.
static func render(text: String, options: Dictionary = {}) -> Dictionary:
	return BabbleEngine.new()._render(text, options)

static func styles() -> Array:
	var out := []
	for id in STYLES:
		var voices := []
		for v in STYLES[id].voices: voices.append({"id": v, "name": STYLES[id].voices[v].name})
		out.append({"id": id, "name": STYLES[id].name, "voices": voices, "moods": MOOD_ALIAS.keys()})
	return out

func _render(text: String, opt: Dictionary) -> Dictionary:
	var style: String = opt.get("style", "animal")
	if not STYLES.has(style):
		return _fail("unknown style \"%s\". Styles: %s" % [style, ", ".join(STYLES.keys())])
	var voices: Dictionary = STYLES[style].voices
	var voice: String = opt.get("voice", voices.keys()[0])
	if not voices.has(voice):
		return _fail("style \"%s\" has no voice \"%s\". Voices: %s" % [style, voice, ", ".join(voices.keys())])
	var mood: String = opt.get("mood", "neutraal")
	mood = MOOD_ALIAS.get(mood, mood)
	if not MOODS.has(mood):
		return _fail("unknown mood \"%s\". Moods: %s" % [mood, ", ".join(MOOD_ALIAS.keys())])
	var sd: int = int(floor(float(opt.get("seed", 1))))
	var sr: int = int(opt.get("sample_rate", 48000))
	var preset: Dictionary = voices[voice]
	var sl := {}
	for k in SLIDERS: sl[SLIDERS[k]] = float(opt[k]) if opt.has(k) else float(preset[SLIDERS[k]])
	var toks := tokenize(text, style, sd, make_lang(sd))
	var o := {"engine": style, "mood": mood, "P": sl.pitch, "S": sl.speed, "E": sl.expr, "F": sl.form, "breath": sl.breath, "tilt": sl.tilt,
		"hiss": float(opt.get("hiss", 1.0)), "oq": preset.oq, "jit": preset.jit, "rate": preset.get("rate", 1.0), "vib": preset.get("vib", false),
		"quant": preset.get("quant", false), "whisper": preset.get("whisper", false), "base": preset.pitch}
	_seed_state = sd & M32
	var r := render_synth(toks, o, sr)
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

static var _re_parts: RegEx
static var _re_laugh: RegEx

static func _plain_lower(ch: String) -> String:
	var c := ch.unicode_at(0)
	if PLAIN.has(c): return PLAIN[c]
	return ch.to_lower()

static func tokenize(text: String, engine: String, sd: int, lang: Dictionary) -> Array:
	if _re_parts == null:
		_re_parts = RegEx.create_from_string("[A-Za-z\\x{C0}-\\x{FF}0-9']+|[.,!?;:\\x{2026}]+|[\\s\\x{A0}]+|.")
		_re_laugh = RegEx.create_from_string("(?i)^(ha){2,}h?$|^(hi){2,}$|^(he){2,}$|^lol$|^haha\\w*$")
	var toks := []
	for m in _re_parts.search_all(text):
		var p := m.get_string()
		var c0 := p.unicode_at(0)
		if _all_space(p):
			toks.append({"type": "gap", "text": " "}); continue
		if _all_punct(p):
			toks.append({"type": "punct", "text": p, "mark": p.right(1)}); continue
		if not _has_wordchar(p):
			toks.append({"type": "punct", "text": p, "mark": ""}); continue
		if engine == "animal":
			for ci in p.length():
				var ch := p.substr(ci, 1); var l := _plain_lower(ch)
				var c := ""; var v := "a"
				if VF.has(l) and l != "y": v = l
				elif LETTER.has(l):
					c = LETTER[l][0]; v = LETTER[l][1]
				else: v = "aeiou"[l.unicode_at(0) % 5]
				toks.append({"type": "syl", "text": ch, "c": c, "v": v, "k": "", "jit": ((l.unicode_at(0) * 37) % 100) / 100.0, "stress": ci == 0})
			continue
		var low := p.to_lower()
		var cap := (c0 >= 65 and c0 <= 90) or (c0 >= 0xC0 and c0 <= 0xDD)
		if _re_laugh.search(low) != null:
			toks.append({"type": "laugh", "text": "Hoohoo" if cap else "hoohoo", "n": int(min(6, max(3, js_round(p.length() / 2.0))))}); continue
		var n := int(max(1, js_round(p.length() / 2.6)))
		var r := rng(js_hash(low + "|" + str(sd)))
		for i in n:
			var c: String = "" if r.call() < 0.12 else lang.cons[int(floor(r.call() * lang.cons.size()))]
			var v: String = lang.vow[int(floor(r.call() * lang.vow.size()))]
			var k: String = lang.codas[int(floor(r.call() * lang.codas.size()))] if (i == n - 1 and r.call() < 0.55) else ""
			var t := c + v + k
			if i == 0 and cap: t = t.left(1).to_upper() + t.substr(1)
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

# ---- prosody: pitch, length and loudness per syllable ----
static func _curve(mood: String, p: float) -> float:
	match mood:
		"blij": return 2.5 * sin(p * PI)
		"boos": return -5.0 * p
		"verdrietig": return -3.5 * p
		"flirterig": return 3.5 * sin(p * PI * 2.0)
		"verbaasd": return 6.0 * p
	return 0.0

static func prosody(toks: Array, o: Dictionary) -> void:
	var M: Dictionary = MOODS[o.mood]
	var E: float = min(1.0, max(0.0, o.E + M.e))
	var animal: bool = o.engine == "animal"
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
		var jit: float = k.jit
		var semi: float
		if animal: semi = (jit - 0.5) * E * 7.0 + _curve(o.mood, p) * 0.6
		else: semi = (jit - 0.5) * 2.0 * E * 5.0 + (1.0 - p) * E * 2.5 - p * E * 2.0 + _curve(o.mood, p) + (E * 2.2 if k.stress else 0.0)
		if m == "!": semi += 2.0 if animal else 3.0
		if o.quant: semi = js_round(PENTA[int(floor(jit * PENTA.size()))] * max(0.3, E * 1.4) - 3.0)
		var b: float = semi if o.quant else semi + (-0.4 if animal else (-1.0 - (jit - 0.5) * E * 3.0))
		if last and m == "?": b = semi + (4.0 if animal else 5.0 + E * 5.0)
		if last and (m == "." or m == "…") and not o.quant and not animal: b = semi - 4.0
		if last and m == "!" and not animal: b = semi - 2.0
		k.semiA = semi; k.semiB = b; k.last = last
		k.amp = (1.25 if m == "!" else 1.0) * M.a * (1.08 if (k.stress and not animal) else 0.94)

# ---- formant synthesis ----
static func build_phones(toks: Array, o: Dictionary) -> Dictionary:
	var animal: bool = o.engine == "animal"
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
			if k.c != "": cons.call(k.c, vF, amp, false)
			var jit: float = k.jit; var last: bool = k.get("last", false)
			var vd: float
			if animal: vd = 0.05 * R / S * (0.85 + jit * 0.3) * (1.5 if last else 1.0)
			else: vd = ((0.15 if k.stress else 0.115) + (0.05 if (spec[0] != spec[1] or k.v.length() > 1) else 0.0)) / S * (1.85 if last else 1.0) * (0.88 + jit * 0.24)
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
	var M: Dictionary = MOODS[o.mood]
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
	var oq: float = min(0.85, max(0.3, o.oq + M.oq))
	var tiltA: float = min(0.95, max(0.12, o.tilt + M.tilt))
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
	var peak := 0.0
	for v in pcm: peak = max(peak, abs(v))
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
