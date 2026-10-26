## Babble Engine demo: type a line, pick a style, voice and mood, press Speak.
## Fern's mouth opens on every syllable and the text appears in time with it.
extends Control

const SKIN := Color("#F2B705")
const INK := Color("#231B12")
const MOUTH := Color("#C23B26")

var speaker := BabbleSpeaker.new()
var line := LineEdit.new()
var styles := OptionButton.new()
var voices := OptionButton.new()
var moods := OptionButton.new()
var face := Control.new()
var said := Label.new()
var mood_ids := ["neutral", "happy", "angry", "sad", "flirty", "surprised"]
var open := 0.0:  # 0 closed, 1 wide open
	set(v): open = v; face.queue_redraw()

func _ready() -> void:
	add_child(speaker)
	var box := VBoxContainer.new(); box.set_anchors_and_offsets_preset(PRESET_FULL_RECT, PRESET_MODE_MINSIZE, 24); add_child(box)
	box.add_theme_constant_override("separation", 12)
	line.text = "Hi! I found three apples. Do you want one?"; line.text_submitted.connect(func(_t): _speak())
	box.add_child(line)
	var row := HBoxContainer.new(); box.add_child(row)
	for s in BabbleEngine.styles(): styles.add_item(s.name)
	styles.item_selected.connect(func(_i): _fill_voices())
	for m in mood_ids: moods.add_item(m.capitalize())
	var go := Button.new(); go.text = "Speak"; go.pressed.connect(_speak)
	for c in [styles, voices, moods, go]: row.add_child(c)
	face.custom_minimum_size = Vector2(220, 220); face.size_flags_horizontal = SIZE_SHRINK_CENTER
	face.draw.connect(_draw_face); box.add_child(face)
	said.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART; said.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; box.add_child(said)
	speaker.line_started.connect(func(_t): said.text = "")
	speaker.syllable.connect(_on_syllable)
	speaker.line_finished.connect(func(): open = 0.0)
	_fill_voices()

func _fill_voices() -> void:
	voices.clear()
	for v in BabbleEngine.styles()[styles.selected].voices: voices.add_item(v.name)

func _speak() -> void:
	var s: Dictionary = BabbleEngine.styles()[styles.selected]
	speaker.style = s.id; speaker.voice = s.voices[voices.selected].id; speaker.mood = mood_ids[moods.selected]
	speaker.speak(line.text)

func _on_syllable(_index: int, text: String) -> void:
	said.text += ("" if said.text == "" else " ") + text
	open = 1.0  # open on the syllable, then close again over a tenth of a second
	create_tween().tween_property(self, "open", 0.0, 0.1)

func _draw_face() -> void:
	var c := face.size / 2 + Vector2(0, 14)
	for x in [-45.0, 45.0]: _blob(c + Vector2(x, -88), Vector2(17, 30), SKIN)  # ears
	_blob(c, Vector2(78, 78), SKIN)
	for x in [-26.0, 26.0]: face.draw_circle(c + Vector2(x, -10), 9, INK)
	if open < 0.05: face.draw_arc(c + Vector2(0, 14), 22, 0.35, PI - 0.35, 16, INK, 5, true)  # closed: a smile
	else: _blob(c + Vector2(0, 30), Vector2(20 + 6 * open, 4 + 15 * open), MOUTH)

## A filled ellipse with an ink outline
func _blob(at: Vector2, r: Vector2, fill: Color) -> void:
	var pts := PackedVector2Array()
	for i in 48: pts.append(at + Vector2(cos(TAU * i / 48) * r.x, sin(TAU * i / 48) * r.y))
	face.draw_colored_polygon(pts, fill)
	pts.append(pts[0]); face.draw_polyline(pts, INK, 4, true)
