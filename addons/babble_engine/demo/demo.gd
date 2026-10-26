## Babble Engine demo: type a line, pick a style, voice and mood, press Speak.
## The mouth opens on every syllable and the text appears in time with it.
extends Control

var speaker := BabbleSpeaker.new()
var line := LineEdit.new()
var styles := OptionButton.new()
var voices := OptionButton.new()
var moods := OptionButton.new()
var mouth := ColorRect.new()
var said := Label.new()
var mood_ids := ["neutral", "happy", "angry", "sad", "flirty", "surprised"]

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
	mouth.color = Color(0.85, 0.3, 0.3); mouth.custom_minimum_size = Vector2(120, 8); box.add_child(mouth)
	said.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART; box.add_child(said)
	speaker.line_started.connect(func(_t): said.text = "")
	speaker.syllable.connect(_on_syllable)
	speaker.line_finished.connect(func(): mouth.custom_minimum_size.y = 8)
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
	mouth.custom_minimum_size.y = 40  # open, then close again over a tenth of a second
	create_tween().tween_property(mouth, "custom_minimum_size:y", 8.0, 0.1)
