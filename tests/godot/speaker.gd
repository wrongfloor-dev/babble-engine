# Checks BabbleSpeaker in a running scene: a replaced line never plays, every syllable is signalled in order and near its time,
# the line finishes. Started by tests/godot.mjs inside a temporary Godot project; writes out/speaker.json.
extends SceneTree

func _init() -> void:
	var sp := BabbleSpeaker.new()
	sp.style = "sim"; sp.voice = "hank"; sp.mood = "happy"; sp.babble_seed = 4
	root.add_child(sp)
	var text := "Hi there! Wait, wrong line."
	var expected: Array = BabbleEngine.render(text, {"style": "sim", "voice": "hank", "mood": "happy", "seed": 4, "sample_rate": int(AudioServer.get_mix_rate())}).syllables
	var got := {"started": [], "syllables": [], "finished": false, "expected": expected}
	var t_start := [0]
	sp.line_started.connect(func(t): got.started.append(t); t_start[0] = Time.get_ticks_msec())
	sp.syllable.connect(func(i, t): got.syllables.append([i, t, (Time.get_ticks_msec() - t_start[0]) / 1000.0]))
	sp.line_finished.connect(func(): got.finished = true)
	sp.speak("This line is replaced before it plays.")
	sp.speak(text)
	var t0 := Time.get_ticks_msec()
	while not got.finished and Time.get_ticks_msec() - t0 < 20000: await process_frame
	var f := FileAccess.open("res://out/speaker.json", FileAccess.WRITE); f.store_string(JSON.stringify(got)); f.close()
	quit()
