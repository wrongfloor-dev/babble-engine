# Babble Engine for Godot 4

Gibberish speech for game characters: critter chatter, made-up languages, robot beeps and soft tones. By [Wrong Floor](https://wrongfloor.studio), MIT license (see `LICENSE`). Audio you make with it is yours to use, also commercially.

No plugin to enable: once this folder is in `addons/`, you get the `BabbleSpeaker` node and `BabbleEngine`.

```gdscript
# BabbleSpeaker is an AudioStreamPlayer: pick style, voice and mood in the Inspector
$Speaker.speak("Hi! Do you want an apple?")
$Speaker.syllable.connect(func(index, text): $Mouth.flap())
```

- Typing text box: set *Type Label* to a Label or RichTextLabel and the line types itself into it, in step with the voice
- Signals: `line_started(text)`, `syllable(index, text)`, `revealed(count)`, `line_finished`
- Renders on a background thread, so long lines don't stall the game
- Your own voice: record it at [babble.wrongfloor.studio](https://babble.wrongfloor.studio), click Export, and set *Own Voice File* to the `.babble-voice.json`
- Without the node: `BabbleEngine.render(text, options)` returns `{ pcm, sample_rate, duration, syllables, reveal }`
- Demo: open `demo/demo.tscn` and press F6

Styles, voices and every option: https://github.com/wrongfloor-dev/babble-engine#-godot-4
