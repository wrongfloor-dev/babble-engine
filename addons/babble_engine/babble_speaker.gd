## A node that speaks lines in gibberish with Babble Engine and signals every syllable, for mouth flaps or text reveals.
##
##   $Speaker.speak("Hi! Do you want an apple?")
##   $Speaker.syllable.connect(func(index, text): $Mouth.flap())
##
## It renders on a background thread, so a long line does not stall the game; the line starts when it is ready.
## For the room the web tool adds, put a Reverb effect on the speaker's audio bus.
class_name BabbleSpeaker
extends AudioStreamPlayer

## The line has been rendered and starts playing now.
signal line_started(text: String)
## A syllable starts being heard (corrected for audio latency).
signal syllable(index: int, text: String)
## The line has played to the end. Not sent after stop_line() or a new speak().
signal line_finished

@export_enum("animal", "sim", "vemmo", "name", "bark", "grumble", "gizmo", "sprite", "ghost", "echo", "radio", "baby", "blip", "droid", "tone", "instr")
var style: String = "animal"
## Voice id of the style (see BabbleEngine.styles()); empty uses the style's first voice.
@export var voice := ""
@export_enum("neutral", "happy", "angry", "sad", "flirty", "surprised") var mood: String = "neutral"
## Same seed, same made-up language and sound. Give each character its own.
@export var babble_seed := 1
## Any other render option: pitch, speed, expression, throat, breath, brightness, hiss, name, intent, length, steady.
@export var options := {}
## A .babble-voice.json from the tool's Export button (Voices & characters). Voice styles only.
@export_file("*.json") var own_voice_file := ""

var _job := 0
var _task := -1
var _pending = null
var _syllables := []
var _next := 0
var _text := ""
var _voice := {}
var _voice_path := ""

func _ready() -> void:
	finished.connect(_on_finished)

## Speak a line. A line that is still playing stops; a call while one is rendering replaces the one waiting.
func speak(text: String) -> void:
	stop_line()
	if _task != -1:
		_pending = text; return
	var opt := options.duplicate()
	opt.style = style; opt.mood = mood; opt.seed = babble_seed
	opt.sample_rate = int(AudioServer.get_mix_rate())
	if voice != "": opt.voice = voice
	if own_voice_file != "":
		if _voice_path != own_voice_file:
			_voice = BabbleEngine.load_voice(FileAccess.get_file_as_string(own_voice_file)); _voice_path = own_voice_file
		if not _voice.is_empty(): opt.own_voice = _voice
	var job := _job
	_task = WorkerThreadPool.add_task(func() -> void:
		var r := BabbleEngine.render(text, opt)
		var wav = _to_wav(r) if not r.is_empty() else null
		_done.call_deferred(job, text, r, wav))

## Stop the current line; a line still rendering will not start.
func stop_line() -> void:
	_job += 1; _syllables = []; _pending = null
	stop()

func _done(job: int, text: String, r: Dictionary, wav) -> void:
	WorkerThreadPool.wait_for_task_completion(_task); _task = -1
	if _pending != null:
		var next: String = _pending; _pending = null; speak(next); return
	if job != _job or wav == null: return
	stream = wav; _text = text; _syllables = r.syllables; _next = 0
	play()
	line_started.emit(text)

func _process(_delta: float) -> void:
	if _syllables.is_empty() or not playing: return
	var t := get_playback_position() + AudioServer.get_time_since_last_mix() - AudioServer.get_output_latency()
	while _next < _syllables.size() and _syllables[_next].time <= t:
		syllable.emit(_next, _syllables[_next].text); _next += 1

func _on_finished() -> void:
	while _next < _syllables.size():
		syllable.emit(_next, _syllables[_next].text); _next += 1
	_syllables = []
	line_finished.emit()

## 16-bit mono, like the web module's toWav
static func _to_wav(r: Dictionary) -> AudioStreamWAV:
	var pcm: PackedFloat32Array = r.pcm; var data := PackedByteArray(); data.resize(pcm.size() * 2)
	for i in pcm.size():
		var x: float = clamp(pcm[i], -1.0, 1.0)
		data.encode_s16(i * 2, int(x * 32768.0) if x < 0.0 else int(x * 32767.0))
	var w := AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS; w.mix_rate = r.sample_rate; w.stereo = false; w.data = data
	return w
