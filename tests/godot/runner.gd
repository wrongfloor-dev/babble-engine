# Renders every case in cases.json with the Godot addon and writes the samples next to it.
# Started by tests/godot.mjs inside a temporary Godot project.
extends SceneTree

const Babble := preload("res://addons/babble_engine/babble_engine.gd")

func _init() -> void:
	var cases: Array = JSON.parse_string(FileAccess.get_file_as_string("res://cases.json"))
	var summary := []
	for i in cases.size():
		var c: Dictionary = cases[i]
		var t0 := Time.get_ticks_usec()
		var r: Dictionary = Babble.render(c.text, c.options)
		var ms := (Time.get_ticks_usec() - t0) / 1000.0
		if r.is_empty():
			summary.append({"error": true, "ms": ms}); continue
		var f := FileAccess.open("res://out/%d.f32" % i, FileAccess.WRITE)
		f.store_buffer(r.pcm.to_byte_array()); f.close()
		summary.append({"sample_rate": r.sample_rate, "duration": r.duration, "syllables": r.syllables, "ms": ms})
	var f := FileAccess.open("res://out/summary.json", FileAccess.WRITE)
	f.store_string(JSON.stringify(summary)); f.close()
	quit()
