// ===================================================================
// Babble Engine UI. Three parts kept apart:
//   1. i18n + static data      2. make screen (generation, playback)
//   3. voices storage           4. studio (mic, prompter, recording, check)
// Synthesis lives in the core above and is not changed here.
// ===================================================================
const $=id=>document.getElementById(id);

// ---------- 1. i18n ----------
const STR={en:{
'nav.make':'Make babble','nav.voices':'Voices & characters','make.title':'Make babble',
'make.style':'Style','make.who':'Who speaks','aria.main':'Main','aria.lang':'Language','aria.settings':'Settings','make.say':'What does {name} say?','make.sayV':'What does {name} want to say?','make.tune':'Tune {name}','make.gVoice':'Voice styles','make.gSound':'Sound styles','make.examples':'Choose example text','make.result':'Result',
'make.speak':'▶ Speak','make.bubbleHint':'Click a voice, an emotion or press Speak.','side.record':'Record your voice','make.stale':'Changed since this result.',
'make.takes':'Variants','make.saveChar':'Save as character','char.name':'Name of the character','char.save':'Save','char.cancel':'Cancel',
'char.saved':'“{name}” saved.','char.title':'Characters',
'char.empty':'No characters yet.','char.use':'Use','make.takeN':'Variant {i}','make.takeOld':'earlier settings','make.addTake':'+ Save variant','make.delTake':'Remove variant {i}','make.saveHelp':'Save a variant to keep your settings and quickly compare variants. Save your variant as a character once you are happy with the result.','make.helpAria':'About variants and characters','make.download':'Download WAV','make.downloadZip':'Download WAV (.zip)','make.busy':'Generating…',
'make.stopPlay':'■ Stop','make.ready':'Result ready, {s} seconds.',
'make.dlErr':'The download didn’t work ({m}). Try again, or generate the line again.','make.dlDeclined':'Download cancelled.','make.dlDone':'Saved as {f}.',
'foot.audio':'Audio you make with Babble Engine is yours to use, also commercially.','foot.privacy':'Privacy','foot.code':'GitHub (MIT)','make.code':'Use in your game','code.title':'Use in your game','code.copy':'Copy code','code.copied':'Copied','code.own':'First export your voice under My voices.','code.note':'Same voice and settings. Each take varies a little.','code.more':'How it works','foot.game':'Use in your game','aria.gh':'Babble Engine on GitHub',
'side.voice':'Voice','side.sound':'Sound','side.instrument':'Instrument','side.add':'Record your voice',
'side.name':'Name it says','side.intent':'Intent','side.emotion':'Emotion','side.length':'Length','side.short':'Short','side.medium':'Medium',
'side.anchors':'Fixed phrases','side.ancUse':'Use in the clip',
'side.ancAuto':'Sometimes','side.ancAlways':'Always','side.ancNever':'Never','side.ancHint':'Click a phrase to hear it with the selected voice.',
'side.own':'Own recordings','side.ownLabel':'Own recording · {n} sounds','side.ownPartial':'Own recording · incomplete ({d} of {t} lines)',
'side.saved':'“{name}” is saved. It works with voice styles only.','side.savedSel':'“{name}” is saved and selected. Generate to hear it.',
'adv.pitch':'Pitch','adv.pitchH':'Higher or lower voice.','adv.note':'Base note','adv.noteH':'The note the melody starts from.',
'adv.speed':'Tempo','adv.speedH':'How fast the line is spoken.','adv.expr':'Expression','adv.exprH':'How much the melody moves up and down.',
'adv.range':'Melody range','adv.rangeH':'How far the notes move from the base note.','adv.form':'Throat size','adv.formH':'Larger sounds deeper and fuller, smaller sounds brighter.',
'adv.breath':'Breath','adv.breathH':'More breath sounds hoarser and softer.','adv.tilt':'Brightness','adv.tiltH':'Duller or brighter sound.','adv.steady':'Pitch steadiness','adv.steadyH':'Own voice: keeps each syllable on the melody.','adv.hiss':'Consonant hiss','adv.hissH':'The sss and kh of consonants, and the radio crackle. Lower it for a cleaner voice.',
'adv.ambOff':'Off','adv.ambRain':'Rain','adv.ambBreeze':'Breeze','adv.ambWaves':'Waves','adv.ambLvl':'Background level',
'adv.ambH':'Not in the download.','adv.allTitle':'All styles','adv.listen':'While listening','adv.lang':'Language','adv.newLang':'New language',

'voices.title':'Voices & characters','voices.own':'Recorded voices','voices.lead':'Recorded voices and characters. They stay in this browser only.',
'voices.empty':'You don’t have any voices of your own yet. Add one to hear your text in your own voice.',
'voices.session':'This browser doesn’t allow saving, so voices only last for this session.','voices.use':'Use','voices.export':'Export','voices.exported':'Saved as {name}.','voices.exportFail':'Export didn’t work. Try again.','voices.rename':'Rename','voices.delete':'Delete',
'voices.save':'Save','voices.cancel':'Cancel','voices.info':'{n} sounds · {when}','voices.partial':'Incomplete','voices.basis':'Basic round','voices.deep':'Basic + depth round','voices.old':'Older script',
'voices.deepen':'Add depth round ({t})','voices.addBloopa':'Add Bloopa & names ({t})','voices.addBarks':'Add barks ({t})','voices.addEnds':'Add endings ({t})','voices.redoBasis':'Redo basic round ({t})',
'voices.sessionTag':'This session','voices.delTitle':'Delete “{name}”?','voices.delText':'The recording is removed from this browser. This can’t be undone.',
'voices.inUseIncompat':'“{name}” works with voice styles only.',
'st.title':'Add your own voice','st.private':'Your recording stays in this browser. Nothing is uploaded.','st.s1':'Prepare','st.s2':'Record','st.s3':'Check','st.back':'Back to babble','st.close':'Close recording',
'prep.mic':'Microphone','prep.micLabel':'Microphone','prep.micAsk':'Allow microphone',
'prep.micRetry':'Try again','prep.micAsking':'Waiting for permission…',
'prep.micSignal':'Microphone is receiving sound','prep.micQuiet':'No sound measured yet. Say something.',
'prep.micDenied':'Microphone access was denied. Allow it in your browser’s site settings, or upload a recording below.',
'prep.micNone':'No microphone was found. Connect one and try again, or upload a recording below.',
'prep.micBusy':'The microphone can’t be used right now, possibly because another app is using it. Close that app and try again, or upload a recording below.',
'prep.micUnsupported':'This browser or environment doesn’t offer microphone access. Upload a recording below instead.',
'prep.how':'Listen','prep.h1':'Practice','prep.h2':'Say all four in one breath. Wear headphones.','prep.h3':'optional',
'prep.listen':'Play example','prep.settings':'Settings',
'prep.tempo':'Tempo','prep.slow':'Slow','prep.relaxed':'Relaxed','prep.normal':'Normal','prep.note':'Your note',
'prep.low':'Low','prep.mid':'Medium','prep.high':'High','prep.playNote':'Play this note','prep.guide':'Guide tone','prep.on':'On','prep.off':'Off',
'prep.showScript':'Show full script','prep.hideScript':'Hide script','prep.sum':'{tempo} tempo · note {note} · guide tone {guide}',
'prep.calc':'{n} lines · about {t}','prep.practice':'Practice two lines','prep.toRecord':'Start recording','prep.s4':'Record',
'prep.needMic':'Allow the microphone first.','prep.altTitle':'No microphone?',

'prep.upload':'Upload a recording','prep.guideOnly':'Reading guide',

'rec.notStarted':'Not started','rec.recording':'Recording','rec.paused':'Paused','rec.practice':'Practising · nothing is recorded','rec.guide':'Reading guide only · nothing is recorded',
'rec.line':'Line {i} of {n}','rec.readyRec':'When you start, a count-in of three beats plays. Then line 1 begins. Rest during each pause.',
'rec.readyPractice':'Two lines to get the feel for the pace. Nothing is recorded.','rec.readyGuide':'Start your own recorder first. Then start the guide and read along. Nothing is recorded here.',
'rec.readyRedo':'You will record {what}. A count-in plays first.','rec.oneLine':'line {i}','rec.someLines':'{n} lines',
'rec.start':'● Start recording','rec.startPractice':'Start practice','rec.startGuide':'Start reading guide','rec.listen':'Listen','rec.speak':'Speak now',
'rec.wait':'Wait a moment','rec.left':'{t} to go','rec.lastLeft':'Last line · {t} to go','rec.pause':'❚❚ Pause','rec.resume':'▶ Resume','rec.redo':'Redo line','rec.stop':'Stop',
'rec.hintRest':'The next line starts after the rest.','rec.hintPaused':'Paused. The current line starts over when you resume.',
'rec.micLost':'The microphone stopped. What was recorded so far is kept.','rec.started':'Recording started.','rec.pausedSr':'Recording paused.',
'chk.title':'Listen to your voice','chk.lead':'Check your recording and try the result as babble.','chk.upLabel':'Choose a recording',
'chk.upHint':'Works best with the script from this studio. mp3, m4a, wav or ogg.','chk.proc':'Processing your recording…',
'chk.a':'1. Your recording','chk.aHint':'The sounds you recorded.','chk.lines':'View recorded lines','chk.missing':'Record missing lines',
'chk.b':'2. As babble','chk.bHint':'An example made with your recording. Nothing is saved yet.','chk.name':'Name of your voice','chk.again':'Record again',
'chk.save':'Save and use','chk.session':'Use for this session only','chk.saveHint':'You return to your text with this voice selected.',
'chk.saveHintIncompat':'You return to your text. Choose a voice style to use this voice.',
'chk.play':'▶ Play','chk.pause':'❚❚ Pause','chk.prevPlay':'▶ Play example','chk.lineOk':'Recorded','chk.lineMiss':'Missing','chk.lineRedo':'Redo','chk.lineRec':'Record',
'chk.linePlay':'Play','chk.partial':'Incomplete: {d} of {t} lines. Missing sounds borrow the closest one.',
'chk.unlabeled':'This recording doesn’t follow the script, so sounds are picked at random. Read the script from this studio for the best result.',
'chk.tooLittle':'Too little clear speech was found. Record again a bit closer to the microphone, or choose another file.','chk.badFile':'Your browser can’t read this file. Try mp3, m4a, wav or ogg.','chk.tooBig':'This file is too long. Use a recording of up to 15 minutes.',
'chk.saveFail':'Saving in this browser failed ({m}). Your recording is still here: try again, or use it for this session only.',
'chk.nameDefault':'My voice','chk.noLines':'No lines were recorded.',
'cf.leaveTitle':'Leave without saving?','cf.leaveText':'Your recording hasn’t been saved yet and will be lost.','cf.leaveYes':'Discard recording','cf.leaveNo':'Keep working',
'cf.del':'Delete','ex.title':'Choose example text','ex.close':'Close','ex.general':'General','ex.vemmo':'Bloopa Doopa · De Workshopbende',

'prep.roundB':'Basic round: every consonant with every vowel.','prep.roundX':'Depth round for “{name}”: double vowels (ai, ow, ay).','prep.roundBloopa':'Bloopa & names for “{name}”: double consonants (blah, kroo).','prep.roundEnds':'Endings for “{name}”: vowel plus end sound (ahp, ohm).','prep.roundRedo':'Basic round again for “{name}”: replaces the sounds you record.','prep.roundBarks':'Barks for “{name}”: say each sound the way it’s written.',
'chk.saveX':'Add to “{name}”','side.savedX':'Depth round added to “{name}”.','side.depthTip':'Tip: add the depth round in Voices & characters ({t}).','nav.script':'Script','sc.h1':'Script','sc.private':'Scripts and recordings stay in this browser. Nothing is uploaded.','sc.pick':'Open script','sc.titleLbl':'Title','sc.untitled':'Untitled script',
'sc.lang':'Language of the lines','sc.new':'New script','sc.chars':'Characters','sc.delTitle':'Delete “{name}”?','sc.delText':'All its lines and takes will be deleted.',
'sc.doc':'Lines','sc.empty':'Write the spoken lines of your game, one per line.','sc.addLine':'Line','sc.addScene':'Scene','sc.sceneName':'Scene name','sc.sceneN':'Scene {n}',
'sc.who':'Character','sc.nobody':'No character','sc.newChar':'New character…','sc.dir':'(direction)','sc.dirLbl':'Direction','sc.txtLbl':'Text of the line','sc.move':'Move line (arrow keys)',
'sc.delLine':'Delete line','sc.delLineTitle':'Delete this line?','sc.delLineText':'Its takes will be deleted too.',
'sc.stTodo':'To record','sc.stDone':'Recorded','sc.stRedo':'Redo',
'sc.charName':'Name','sc.addChar':'Character','sc.charN':'Character {n}','sc.noChars':'No characters yet.','sc.delChar':'Delete {name}','sc.delCharTitle':'Delete “{name}”?','sc.delCharText':'{n} line(s) lose their character. Their takes stay.',
'sc.prompter':'Prompter','sc.ready':'Ready','sc.listening':'Listening','sc.followVoice':'Follows your voice','sc.followTempo':'Follows your tempo',
'sc.record':'Record','sc.stop':'Stop','sc.done':'Done','sc.prev':'Back','sc.skip':'Skip',
'sc.wait':'Start when you’re ready. Recording begins at your first word.','sc.noText':'This line has no text yet.','sc.pickLine':'Add a line to record it.','sc.nextLbl':'Next',
'sc.noSound':'No sound in that take. It was not kept.','sc.short':'Shorter than the line needs. Listen back.','sc.missing':'Words may be missing: {words}','sc.saved':'Take {n} kept.',
'sc.allDone':'Every line of {name} is recorded.','sc.takes':'Takes','sc.take':'Take {n}','sc.playTake':'Play take {n}','sc.delTake':'Delete take {n}','sc.oldText':'earlier text',
'sc.install':'Follow my voice: get the speech pack (once)','sc.installing':'Getting the speech pack…','sc.installFail':'The speech pack did not install. The prompter follows your tempo.',
'sc.storeFull':'This browser has no room left. Delete takes or scripts you no longer need.','sc.noStore':'This browser can’t save. Your script stays until you close the page.','sc.saveFail':'Could not save: {m}',
'sc.tkShort':'Shorter than the line','sc.tkMissing':'Words may be missing',
'sc.kind':'How this character speaks','sc.kRecord':'Real voice','sc.kBabble':'Babble','sc.stBabble':'Babble','sc.playLine':'Play line','sc.play':'Play','sc.otherTake':'Other take',
'sc.speaking':'Speaking','sc.again':'Another take','sc.savedChosen':'Take {n} saved and chosen. Tap ✓ to choose another.','sc.unchoose':'Take {n} is chosen. Click to use none','sc.noneChosen':'No take chosen: this line is left out of the export. Choose one with ✓, or record another.',
'sc.smaller':'Smaller text','sc.bigger':'Bigger text','sc.chosen':'Chosen','sc.choose':'Use take {n}','sc.dlTake':'Download take {n} as WAV','sc.dlLine':'Download this line as WAV',
'io.import':'Import','io.export':'Export','io.importDots':'Import…','io.exportDots':'Export…','io.importHint':'A script file (.json), a backup (.zip), or text below: “Name: text” per line, “# Scene” for a scene.','io.chooseScript':'Script or backup…','io.chooseAudio':'Audio files…','io.audioHint':'Audio files named by line id, as the game export names them, become takes.','io.pasteLbl':'Text of the script','io.pastePh':'# Arrival\nGuide: Hello there!\nShopkeeper (happy): Welcome.','io.read':'Read text','io.back':'Back','io.apply':'Apply','io.plan':'{a} new line(s), {c} changed, {s} unchanged.','io.newChars':'{n} new character(s).','io.gone':'Delete the {n} line(s) that are not in the file, with their takes','io.noLines':'No lines found. Use “Name: text”, one per line.','io.badFile':'{name} is not a script file or backup.','io.restore':'Restores “{name}” with {n} take(s) as a new script.','io.restored':'Backup restored with {n} take(s).','io.applied':'Import applied.','io.audioOk':'{n} file(s) added as takes.','io.audioNo':'No line with that id: {names}.','io.audioBad':'Not readable or silent: {names}.','io.game':'For your game (.zip)','io.gameHint':'One WAV per line with its sound and room, plus script.json.','io.script':'Script file (.json)','io.scriptHint':'Text, characters and scenes, without audio. Edit it, or let an AI assistant write one.','io.backup':'Backup with takes (.zip)','io.backupHint':'Your takes live only in this browser. Clearing site data deletes them.','io.working':'Working…','io.gameDone':'{name}: {n} WAV file(s).','io.missing':'{n} line(s) without a take are left out.','io.saved':'{name} saved.','io.backupDone':'{name}: {n} take(s).',
'sc.sound':'Sound','sc.fxOwnPart':'Sound of your own part','sc.pitch':'Pitch','sc.pitchTip':'Higher also plays faster, lower slower.','sc.faster':'also faster','sc.slower':'also slower','sc.effect':'Effect','sc.room':'Room','sc.fxTest':'Play a line with this sound','fx.none':'Plain','fx.radio':'Radio','fx.robot':'Robot','fx.fairy':'Fairy','fx.troll':'Troll','fx.giant':'Giant','fx.tiny':'Tiny','fx.hall':'Hall','fx.custom':'Own settings','fx.eNone':'No effect','fx.rNone':'No room','fx.rSmall':'Small room','fx.rBig':'Big room',
'sc.scriptMenu':'Script options','sc.rename':'Rename','sc.dup':'Duplicate','sc.deleteDots':'Delete script…','sc.scripts':'Scripts ({n})','sc.overview':'Overview','sc.scenes':'Scenes','sc.addSceneLbl':'Add scene','sc.addCharLbl':'Add character','sc.onlyTodo':'Only to record','sc.widthOv':'Width of the overview','sc.widthPm':'Width of the prompter','sc.space':'Space','sc.big':'Big','sc.small':'Small','sc.ofRec':'of {m} recorded','sc.allRec':'All recorded','sc.babOnly':'Babble only','sc.sceneMenu':'Options for {name}','sc.up':'Move up','sc.down':'Move down','sc.sceneBelow':'+ Scene below','sc.delSceneDots':'Delete scene…','sc.delSceneTitle':'Delete scene “{name}”?','sc.delSceneText':'It has {n} line(s), {k} with a take. Merge moves them into “{to}”, so nothing is lost.','sc.delSceneOnly':'It has {n} line(s), {k} with a take.','sc.mergeWith':'Merge with “{name}”','sc.delAll':'Delete everything','sc.copyOf':'{name} (copy)','sc.dupDone':'Copy made.','sc.editLine':'Edit line','sc.emptyLine':'Empty line','sc.enterHint':'Enter: new line','sc.fileBtn':'Choose file…','sc.noTakes':'No takes yet. Record, or drop an audio file here.','sc.fileTag':'file','sc.fileBad':'This file can’t be read. Use WAV, MP3 or OGG.','sc.fileSilent':'No sound in this file.','sc.fileOk':'File added as take {n}.','sc.redoTip':'The text changed after this take.','sc.charSettings':'Settings for {name}',
'sc.markRec':'Speak myself','sc.unmark':'All babble','sc.markHint':'Select the words you speak yourself. The rest babbles.','sc.profiles':'Saved characters','sc.phones':'Babble lines play before yours. Use headphones.',
'min':'{m} min',},
nl:{
'nav.make':'Gebrabbel maken','nav.voices':'Stemmen en personages','make.title':'Gebrabbel maken',
'make.style':'Stijl','make.who':'Wie spreekt','aria.main':'Hoofdmenu','aria.lang':'Taal','aria.settings':'Instellingen','make.say':'Wat zegt {name}?','make.sayV':'Wat wil {name} zeggen?','make.tune':'{name} bijstellen','make.gVoice':'Stemstijlen','make.gSound':'Klankstijlen','make.examples':'Voorbeeldtekst kiezen','make.result':'Resultaat',
'make.speak':'▶ Spreek','make.bubbleHint':'Klik op een stem, een emotie of druk op Spreek.','side.record':'Neem je stem op','make.stale':'Gewijzigd sinds dit resultaat.',
'make.takes':'Varianten','make.saveChar':'Opslaan als personage','char.name':'Naam van het personage','char.save':'Opslaan','char.cancel':'Annuleren',
'char.saved':'“{name}” opgeslagen.','char.title':'Personages',
'char.empty':'Nog geen personages.','char.use':'Gebruiken','make.takeN':'Variant {i}','make.takeOld':'eerdere instellingen','make.addTake':'+ Variant opslaan','make.delTake':'Variant {i} weggooien','make.saveHelp':'Sla een variant op om je instellingen te bewaren en snel varianten te kunnen vergelijken. Sla je variant definitief op als personage als je tevreden bent met het resultaat.','make.helpAria':'Over varianten en personages','make.download':'Download WAV','make.downloadZip':'Download WAV (.zip)','make.busy':'Bezig met genereren…',
'make.stopPlay':'■ Stoppen','make.ready':'Resultaat klaar, {s} seconden.',
'make.dlErr':'Downloaden lukte niet ({m}). Probeer het opnieuw, of genereer de regel opnieuw.','make.dlDeclined':'Download geannuleerd.','make.dlDone':'Opgeslagen als {f}.',
'foot.audio':'Geluid dat je met Babble Engine maakt, mag je vrij gebruiken, ook commercieel.','foot.privacy':'Privacy','foot.code':'GitHub (MIT)','make.code':'In je game gebruiken','code.title':'In je game gebruiken','code.copy':'Code kopiëren','code.copied':'Gekopieerd','code.own':'Exporteer eerst je stem bij Mijn stemmen.','code.note':'Zelfde stem en instellingen. Elke versie klinkt net iets anders.','code.more':'Hoe het werkt','foot.game':'In je game gebruiken','aria.gh':'Babble Engine op GitHub',
'side.voice':'Stem','side.sound':'Geluid','side.instrument':'Instrument','side.add':'Neem je stem op',
'side.name':'Naam die het zegt','side.intent':'Bedoeling','side.emotion':'Emotie','side.length':'Lengte','side.short':'Kort','side.medium':'Middellang',
'side.anchors':'Vaste uitdrukkingen','side.ancUse':'Gebruik in de clip',
'side.ancAuto':'Soms','side.ancAlways':'Altijd','side.ancNever':'Nooit','side.ancHint':'Klik op een uitdrukking om hem met de gekozen stem te horen.',
'side.own':'Eigen opnames','side.ownLabel':'Eigen opname · {n} klanken','side.ownPartial':'Eigen opname · onvolledig ({d} van {t} regels)',
'side.saved':'“{name}” is opgeslagen. Hij werkt alleen met stemstijlen.','side.savedSel':'“{name}” is opgeslagen en gekozen. Genereer om hem te horen.',
'adv.pitch':'Toonhoogte','adv.pitchH':'Hogere of lagere stem.','adv.note':'Grondtoon','adv.noteH':'De noot waar de melodie vanuit gaat.',
'adv.speed':'Tempo','adv.speedH':'Hoe snel de regel wordt uitgesproken.','adv.expr':'Expressie','adv.exprH':'Hoeveel de melodie op en neer gaat.',
'adv.range':'Melodiebereik','adv.rangeH':'Hoe ver de noten van de grondtoon af gaan.','adv.form':'Keelgrootte','adv.formH':'Groter klinkt dieper en voller, kleiner klinkt helderder.',
'adv.breath':'Adem','adv.breathH':'Meer adem klinkt heser en zachter.','adv.tilt':'Helderheid','adv.tiltH':'Doffere of helderdere klank.','adv.steady':'Toonvastheid','adv.steadyH':'Eigen stem: houdt elke lettergreep op de melodie.','adv.hiss':'Medeklinkerruis','adv.hissH':'De sss en kh van medeklinkers, en het geknetter van de radio. Lager geeft een schonere stem.',
'adv.ambOff':'Uit','adv.ambRain':'Regen','adv.ambBreeze':'Wind','adv.ambWaves':'Golven','adv.ambLvl':'Niveau achtergrond',
'adv.ambH':'Niet in de download.','adv.allTitle':'Alle stijlen','adv.listen':'Tijdens het luisteren','adv.lang':'Taal','adv.newLang':'Nieuwe taal',

'voices.title':'Stemmen en personages','voices.own':'Opgenomen stemmen','voices.lead':'Opgenomen stemmen en personages. Ze staan alleen in deze browser.',
'voices.empty':'Je hebt nog geen eigen stemmen. Voeg er een toe om je tekst in je eigen stem te horen.',
'voices.session':'Deze browser staat bewaren niet toe, dus stemmen blijven alleen deze sessie bestaan.','voices.use':'Gebruiken','voices.export':'Exporteren','voices.exported':'Opgeslagen als {name}.','voices.exportFail':'Exporteren is niet gelukt. Probeer het opnieuw.','voices.rename':'Hernoemen','voices.delete':'Verwijderen',
'voices.save':'Opslaan','voices.cancel':'Annuleren','voices.info':'{n} klanken · {when}','voices.partial':'Onvolledig','voices.basis':'Basisronde','voices.deep':'Basis + verdieping','voices.old':'Ouder script',
'voices.deepen':'Verdieping opnemen ({t})','voices.addBloopa':'Bloopa & namen opnemen ({t})','voices.addBarks':'Barks opnemen ({t})','voices.addEnds':'Uitgangen opnemen ({t})','voices.redoBasis':'Basisronde opnieuw ({t})',
'voices.sessionTag':'Deze sessie','voices.delTitle':'“{name}” verwijderen?','voices.delText':'De opname wordt uit deze browser verwijderd. Dit kan niet ongedaan worden gemaakt.',
'voices.inUseIncompat':'“{name}” werkt alleen met stemstijlen.',
'st.title':'Eigen stem toevoegen','st.private':'Je opname blijft in deze browser. Er wordt niets geüpload.','st.s1':'Voorbereiden','st.s2':'Opnemen','st.s3':'Controleren','st.back':'Terug naar gebrabbel','st.close':'Opname afsluiten',
'prep.mic':'Microfoon','prep.micLabel':'Microfoon','prep.micAsk':'Microfoon toestaan',
'prep.micRetry':'Opnieuw proberen','prep.micAsking':'Wachten op toestemming…',
'prep.micSignal':'Microfoon ontvangt geluid','prep.micQuiet':'Nog geen geluid gemeten. Zeg iets.',
'prep.micDenied':'Toegang tot de microfoon is geweigerd. Sta hem toe in de site-instellingen van je browser, of upload hieronder een opname.',
'prep.micNone':'Er is geen microfoon gevonden. Sluit er een aan en probeer het opnieuw, of upload hieronder een opname.',
'prep.micBusy':'De microfoon is nu niet te gebruiken, mogelijk omdat een ander programma hem gebruikt. Sluit dat programma en probeer het opnieuw, of upload hieronder een opname.',
'prep.micUnsupported':'Deze browser of omgeving biedt geen toegang tot een microfoon. Upload hieronder een opname.',
'prep.how':'Luister','prep.h1':'Oefenen','prep.h2':'Zeg alle vier in één adem. Draag een koptelefoon.','prep.h3':'optioneel',
'prep.listen':'Speel voorbeeld','prep.settings':'Instellingen',
'prep.tempo':'Tempo','prep.slow':'Langzaam','prep.relaxed':'Rustig','prep.normal':'Normaal','prep.note':'Jouw toon',
'prep.low':'Laag','prep.mid':'Midden','prep.high':'Hoog','prep.playNote':'Speel deze toon','prep.guide':'Voorbeeldtoon','prep.on':'Aan','prep.off':'Uit',
'prep.showScript':'Volledig script tonen','prep.hideScript':'Script verbergen','prep.sum':'Tempo {tempo} · toon {note} · voorbeeldtoon {guide}',
'prep.calc':'{n} regels · ongeveer {t}','prep.practice':'Oefen twee regels','prep.toRecord':'Opname starten','prep.s4':'Opnemen',
'prep.needMic':'Sta eerst de microfoon toe.','prep.altTitle':'Geen microfoon?',

'prep.upload':'Opname uploaden','prep.guideOnly':'Voorleeshulp',

'rec.notStarted':'Nog niet gestart','rec.recording':'Opname loopt','rec.paused':'Gepauzeerd','rec.practice':'Oefenen · er wordt niet opgenomen','rec.guide':'Alleen voorleeshulp · er wordt niet opgenomen',
'rec.line':'Regel {i} van {n}','rec.readyRec':'Na het starten klinkt een aftelling van drie tellen. Daarna begint regel 1. Rust tijdens elke pauze.',
'rec.readyPractice':'Twee regels om het tempo te voelen. Er wordt niets opgenomen.','rec.readyGuide':'Start eerst je eigen recorder. Start daarna de voorleeshulp en lees mee. Hier wordt niets opgenomen.',
'rec.readyRedo':'Je neemt {what} op. Eerst klinkt een aftelling.','rec.oneLine':'regel {i}','rec.someLines':'{n} regels',
'rec.start':'● Start opname','rec.startPractice':'Start oefening','rec.startGuide':'Start voorleeshulp','rec.listen':'Luister','rec.speak':'Spreek nu',
'rec.wait':'Even wachten','rec.left':'Nog {t}','rec.lastLeft':'Laatste regel · nog {t}','rec.pause':'❚❚ Pauzeren','rec.resume':'▶ Hervatten','rec.redo':'Regel opnieuw','rec.stop':'Stoppen',
'rec.hintRest':'De volgende regel begint na de rustpauze.','rec.hintPaused':'Gepauzeerd. De huidige regel begint opnieuw als je hervat.',
'rec.micLost':'De microfoon is gestopt. Wat al is opgenomen, blijft bewaard.','rec.started':'Opname gestart.','rec.pausedSr':'Opname gepauzeerd.',
'chk.title':'Beluister je stem','chk.lead':'Controleer je opname en probeer het resultaat als gebrabbel.','chk.upLabel':'Kies een opname',
'chk.upHint':'Werkt het best met het script uit deze studio. mp3, m4a, wav of ogg.','chk.proc':'Bezig met verwerken van je opname…',
'chk.a':'1. Je opname','chk.aHint':'De klanken die je hebt ingesproken.','chk.lines':'Opgenomen regels bekijken','chk.missing':'Ontbrekende regels opnemen',
'chk.b':'2. Als gebrabbel','chk.bHint':'Een voorbeeld gemaakt met jouw opname. Er wordt nog niets opgeslagen.','chk.name':'Naam van je stem','chk.again':'Opnieuw opnemen',
'chk.save':'Opslaan en gebruiken','chk.session':'Alleen voor deze sessie gebruiken','chk.saveHint':'Je keert terug naar je tekst met deze stem gekozen.',
'chk.saveHintIncompat':'Je keert terug naar je tekst. Kies een stemstijl om deze stem te gebruiken.',
'chk.play':'▶ Afspelen','chk.pause':'❚❚ Pauzeren','chk.prevPlay':'▶ Voorbeeld afspelen','chk.lineOk':'Opgenomen','chk.lineMiss':'Ontbreekt','chk.lineRedo':'Opnieuw','chk.lineRec':'Opnemen',
'chk.linePlay':'Afspelen','chk.partial':'Onvolledig: {d} van {t} regels. Ontbrekende klanken lenen de dichtstbijzijnde.',
'chk.unlabeled':'Deze opname volgt het script niet, dus klanken worden willekeurig gekozen. Lees voor het beste resultaat het script uit deze studio voor.',
'chk.tooLittle':'Er is te weinig duidelijke spraak gevonden. Neem opnieuw op, iets dichter bij de microfoon, of kies een ander bestand.','chk.badFile':'Je browser kan dit bestand niet lezen. Probeer mp3, m4a, wav of ogg.','chk.tooBig':'Dit bestand is te lang. Gebruik een opname van hoogstens 15 minuten.',
'chk.saveFail':'Opslaan in deze browser is mislukt ({m}). Je opname staat er nog: probeer het opnieuw, of gebruik hem alleen voor deze sessie.',
'chk.nameDefault':'Mijn stem','chk.noLines':'Er zijn geen regels opgenomen.',
'cf.leaveTitle':'Weggaan zonder op te slaan?','cf.leaveText':'Je opname is nog niet opgeslagen en gaat verloren.','cf.leaveYes':'Opname weggooien','cf.leaveNo':'Verder werken',
'cf.del':'Verwijderen','ex.title':'Voorbeeldtekst kiezen','ex.close':'Sluiten','ex.general':'Algemeen','ex.vemmo':'Bloopa Doopa · De Workshopbende',

'prep.roundB':'Basisronde: elke medeklinker met elke klinker.','prep.roundX':'Verdieping voor “{name}”: tweeklanken (ai, ow, ay).','prep.roundBloopa':'Bloopa & namen voor “{name}”: dubbele medeklinkers (blah, kroo).','prep.roundEnds':'Uitgangen voor “{name}”: klinker plus eindklank (ahp, ohm).','prep.roundRedo':'Basisronde opnieuw voor “{name}”: vervangt de klanken die je opneemt.','prep.roundBarks':'Barks voor “{name}”: zeg elk geluid zoals het er staat.',
'chk.saveX':'Toevoegen aan “{name}”','side.savedX':'Verdieping toegevoegd aan “{name}”.','side.depthTip':'Tip: voeg de verdieping toe in Stemmen en personages ({t}).','nav.script':'Script','sc.h1':'Script','sc.private':'Scripts en opnames blijven in deze browser. Er wordt niets geüpload.','sc.pick':'Script openen','sc.titleLbl':'Titel','sc.untitled':'Naamloos script',
'sc.lang':'Taal van de regels','sc.new':'Nieuw script','sc.chars':'Personages','sc.delTitle':'“{name}” verwijderen?','sc.delText':'Alle regels en takes ervan worden verwijderd.',
'sc.doc':'Regels','sc.empty':'Schrijf de gesproken regels van je game, één per regel.','sc.addLine':'Regel','sc.addScene':'Scène','sc.sceneName':'Naam van de scène','sc.sceneN':'Scène {n}',
'sc.who':'Personage','sc.nobody':'Geen personage','sc.newChar':'Nieuw personage…','sc.dir':'(regie)','sc.dirLbl':'Regieaanwijzing','sc.txtLbl':'Tekst van de regel','sc.move':'Regel verplaatsen (pijltjestoetsen)',
'sc.delLine':'Regel verwijderen','sc.delLineTitle':'Deze regel verwijderen?','sc.delLineText':'De takes ervan gaan ook weg.',
'sc.stTodo':'Op te nemen','sc.stDone':'Opgenomen','sc.stRedo':'Opnieuw',
'sc.charName':'Naam','sc.addChar':'Personage','sc.charN':'Personage {n}','sc.noChars':'Nog geen personages.','sc.delChar':'{name} verwijderen','sc.delCharTitle':'“{name}” verwijderen?','sc.delCharText':'{n} regel(s) verliezen hun personage. Hun takes blijven.',
'sc.prompter':'Prompter','sc.ready':'Gereed','sc.listening':'Luistert','sc.followVoice':'Volgt je stem','sc.followTempo':'Volgt je tempo',
'sc.record':'Opnemen','sc.stop':'Stoppen','sc.done':'Klaar','sc.prev':'Terug','sc.skip':'Overslaan',
'sc.wait':'Begin als je klaar bent. De opname start bij je eerste woord.','sc.noText':'Deze regel heeft nog geen tekst.','sc.pickLine':'Voeg een regel toe om hem op te nemen.','sc.nextLbl':'Hierna',
'sc.noSound':'Geen geluid in die take. Hij is niet bewaard.','sc.short':'Korter dan de regel nodig heeft. Luister even terug.','sc.missing':'Mogelijk ontbreken woorden: {words}','sc.saved':'Take {n} bewaard.',
'sc.allDone':'Alle regels van {name} zijn opgenomen.','sc.takes':'Takes','sc.take':'Take {n}','sc.playTake':'Take {n} afspelen','sc.delTake':'Take {n} verwijderen','sc.oldText':'eerdere tekst',
'sc.install':'Volg mijn stem: spraakpakket ophalen (eenmalig)','sc.installing':'Spraakpakket ophalen…','sc.installFail':'Het spraakpakket is niet geïnstalleerd. De prompter volgt je tempo.',
'sc.storeFull':'Deze browser heeft geen ruimte meer. Verwijder takes of scripts die je niet meer nodig hebt.','sc.noStore':'Deze browser kan niet opslaan. Je script blijft tot je de pagina sluit.','sc.saveFail':'Opslaan lukte niet: {m}',
'sc.tkShort':'Korter dan de regel','sc.tkMissing':'Mogelijk ontbreken woorden',
'sc.kind':'Hoe dit personage spreekt','sc.kRecord':'Echte stem','sc.kBabble':'Babbel','sc.stBabble':'Babbel','sc.playLine':'Regel afspelen','sc.play':'Afspelen','sc.otherTake':'Andere take',
'sc.scriptMenu':'Script-opties','sc.rename':'Naam wijzigen','sc.dup':'Dupliceren','sc.deleteDots':'Script verwijderen…','sc.scripts':'Scripts ({n})','sc.overview':'Overzicht','sc.scenes':'Scènes','sc.addSceneLbl':'Scène toevoegen','sc.addCharLbl':'Personage toevoegen','sc.onlyTodo':'Alleen op te nemen','sc.widthOv':'Breedte van het overzicht','sc.widthPm':'Breedte van de prompter','sc.space':'Spatie','sc.big':'Groot','sc.small':'Klein','sc.ofRec':'van {m} opgenomen','sc.allRec':'Alles opgenomen','sc.babOnly':'Alleen babbel','sc.sceneMenu':'Opties voor {name}','sc.up':'Omhoog','sc.down':'Omlaag','sc.sceneBelow':'+ Scène hieronder','sc.delSceneDots':'Scène verwijderen…','sc.delSceneTitle':'Scène “{name}” verwijderen?','sc.delSceneText':'Er staan {n} regel(s) in, {k} met een take. Samenvoegen zet ze in “{to}”, dan gaat er niets verloren.','sc.delSceneOnly':'Er staan {n} regel(s) in, {k} met een take.','sc.mergeWith':'Samenvoegen met “{name}”','sc.delAll':'Alles verwijderen','sc.copyOf':'{name} (kopie)','sc.dupDone':'Kopie gemaakt.','sc.editLine':'Regel bewerken','sc.emptyLine':'Lege regel','sc.enterHint':'Enter: nieuwe regel','sc.fileBtn':'Bestand kiezen…','sc.noTakes':'Nog geen takes. Neem op, of sleep hier een audiobestand heen.','sc.fileTag':'bestand','sc.fileBad':'Dit bestand is niet te lezen. Gebruik WAV, MP3 of OGG.','sc.fileSilent':'Geen geluid in dit bestand.','sc.fileOk':'Bestand toegevoegd als take {n}.','sc.redoTip':'De tekst is veranderd na deze take.','sc.charSettings':'Instellingen van {name}',
'sc.sound':'Klank','sc.fxOwnPart':'Klank van je eigen deel','sc.pitch':'Toonhoogte','sc.pitchTip':'Hoger speelt ook sneller, lager langzamer.','sc.faster':'ook sneller','sc.slower':'ook langzamer','sc.effect':'Effect','sc.room':'Ruimte','sc.fxTest':'Speel een regel met deze klank','fx.none':'Puur','fx.radio':'Radio','fx.robot':'Robot','fx.fairy':'Fee','fx.troll':'Trol','fx.giant':'Reus','fx.tiny':'Klein','fx.hall':'Zaal','fx.custom':'Eigen instelling','fx.eNone':'Geen effect','fx.rNone':'Geen ruimte','fx.rSmall':'Kleine ruimte','fx.rBig':'Grote ruimte',
'io.import':'Importeren','io.export':'Exporteren','io.importDots':'Importeren…','io.exportDots':'Exporteren…','io.importHint':'Een scriptbestand (.json), een back-up (.zip), of tekst hieronder: per regel “Naam: tekst”, “# Scène” voor een scène.','io.chooseScript':'Script of back-up…','io.chooseAudio':'Audiobestanden…','io.audioHint':'Audiobestanden met de regel-id als naam, zoals de game-export ze noemt, worden takes.','io.pasteLbl':'Tekst van het script','io.pastePh':'# Aankomst\nGids: Hallo daar!\nWinkelier (blij): Welkom.','io.read':'Tekst lezen','io.back':'Terug','io.apply':'Toepassen','io.plan':'{a} nieuwe regel(s), {c} gewijzigd, {s} ongewijzigd.','io.newChars':'{n} nieuw(e) personage(s).','io.gone':'De {n} regel(s) die niet in het bestand staan verwijderen, met hun takes','io.noLines':'Geen regels gevonden. Gebruik “Naam: tekst”, één per regel.','io.badFile':'{name} is geen scriptbestand of back-up.','io.restore':'Zet “{name}” met {n} take(s) terug als nieuw script.','io.restored':'Back-up teruggezet met {n} take(s).','io.applied':'Import toegepast.','io.audioOk':'{n} bestand(en) toegevoegd als take.','io.audioNo':'Geen regel met die id: {names}.','io.audioBad':'Niet te lezen of stil: {names}.','io.game':'Voor je game (.zip)','io.gameHint':'Eén WAV per regel met klank en ruimte, plus script.json.','io.script':'Scriptbestand (.json)','io.scriptHint':'Tekst, personages en scènes, zonder audio. Pas het aan, of laat een AI-assistent er een schrijven.','io.backup':'Back-up met takes (.zip)','io.backupHint':'Je takes staan alleen in deze browser. Websitegegevens wissen haalt ze weg.','io.working':'Bezig…','io.gameDone':'{name}: {n} WAV-bestand(en).','io.missing':'{n} regel(s) zonder take zijn weggelaten.','io.saved':'{name} opgeslagen.','io.backupDone':'{name}: {n} take(s).',
'sc.smaller':'Kleinere tekst','sc.bigger':'Grotere tekst','sc.chosen':'Gekozen','sc.choose':'Take {n} gebruiken','sc.dlTake':'Take {n} downloaden als WAV','sc.dlLine':'Deze regel downloaden als WAV',
'sc.again':'Nog een take','sc.savedChosen':'Take {n} opgeslagen en gekozen. Klik op ✓ om een andere te kiezen.','sc.unchoose':'Take {n} is gekozen. Klik om geen take te gebruiken','sc.noneChosen':'Geen take gekozen: deze regel gaat niet mee in de export. Kies er een met ✓, of neem er nog een op.',
'sc.speaking':'Spreekt','sc.markRec':'Zelf inspreken','sc.unmark':'Alles babbel','sc.markHint':'Selecteer de woorden die je zelf inspreekt. De rest babbelt.','sc.profiles':'Bewaarde personages','sc.phones':'Babbelregels spelen vóór die van jou. Gebruik een koptelefoon.',
'min':'{m} min',}};
let LANGUI='en';try{const l=localStorage.getItem('bm.lang');if(l==='nl'||l==='en')LANGUI=l}catch(e){}
function t(k,v){let s=(STR[LANGUI]&&STR[LANGUI][k])||STR.en[k]||k;if(v)for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s}
const say=msg=>{const r=$('sr');r.textContent='';setTimeout(()=>r.textContent=msg,30)};

const MOODNAME={neutraal:['Neutral','Neutraal'],blij:['Happy','Blij'],boos:['Angry','Boos'],verdrietig:['Sad','Verdrietig'],flirterig:['Flirty','Flirterig'],verbaasd:['Surprised','Verbaasd']};
const INTENTNAME={greet:['Greet','Begroeten','Happily surprised.','Blij verrast.'],bye:['Goodbye','Afscheid','Hopping off.','Weghuppelend.'],
  tell:['Tell','Vertellen','Cosy chatting.','Gezellig kletsen.'],explain:['Explain','Uitleggen','Look, this is how.','Kijk, zo gaat het.'],
  ask:['Ask','Vragen','Curious, head tilted.','Nieuwsgierig, hoofd scheef.'],curious:['Curious','Nieuwsgierig','Ooh, what’s that?','Oeh, wat is dat?'],
  joy:['Joy','Blij','Party!','Feest!'],cheer:['Cheer','Aanmoedigen','You can do it!','Jij kan het!'],think:['Think','Nadenken','Hmm.','Hmm.'],
  letdown:['Letdown','Teleurgesteld','Oops, just missed.','Oeps, net mis.'],agree:['Agree','Instemmen','Yes, great.','Ja, top.'],
  warn:['Warn','Waarschuwen','Careful, never scary.','Pas op, niet eng.']};
const ANCNAME={bloopa:['hello','hallo'],zipzap:['here we go','daar gaan we'],badabing:['nailed it, well done','gelukt, goed zo'],wibby:['what do you think?','wat denk jij?'],
  hoppa:['once more, you can do it','nog een keer, je kan het'],plimplom:['thanks, together','dank je, samen'],flibberty:['oops, never mind','oeps, geeft niks']};
const ANC_INT={bloopa:'greet',zipzap:'greet',badabing:'joy',wibby:'ask',hoppa:'cheer',plimplom:'agree',flibberty:'letdown'};
const LI=()=>LANGUI==='nl'?1:0;
const EXAMPLES=[
  {g:'general',text:{en:'Hi! I found three apples behind the bakery. Do you want one? Hahaha, thank you!',nl:'Hoi! Ik heb drie appels gevonden achter de bakkerij. Wil jij er eentje? Hahaha, dank je!'}},
  {g:'general',text:{en:'Oh no, the bridge is gone. What do we do now?',nl:'O nee, de brug is weg. Wat doen we nu?'}},
  {g:'vemmo',v:'jesse',i:'greet',text:{en:'Hi! I’m Jesse. Welcome to the workshop.',nl:'Hoi! Ik ben Jesse. Welkom in de werkplaats.'}},
  {g:'vemmo',v:'jesse',i:'explain',text:{en:'Grab the hammer and tap the nail into the plank.',nl:'Pak de hamer en tik de spijker in de plank.'}},
  {g:'vemmo',v:'jesse',i:'ask',text:{en:'Which color do you want for the roof?',nl:'Welke kleur wil jij voor het dak?'}},
  {g:'vemmo',v:'jesse',i:'tell',text:{en:'The wood is behind the barn.',nl:'Het hout ligt achter de schuur.'}},
  {g:'vemmo',v:'jesse',i:'joy',text:{en:'Done! Your first chapter is complete.',nl:'Gelukt! Je eerste hoofdstuk is klaar.'}},
  {g:'vemmo',v:'jesse',i:'bye',text:{en:'See you next time, builder!',nl:'Tot de volgende keer, bouwer!'}},
  {g:'vemmo',v:'bram',i:'greet',text:{en:'Good afternoon. Come to see the fort?',nl:'Goedemiddag. Kom je het fort bekijken?'}},
  {g:'vemmo',v:'bram',i:'ask',text:{en:'Where shall we put the gate?',nl:'Waar zullen we de poort zetten?'}},
  {g:'vemmo',v:'mila',i:'cheer',text:{en:'One more tower and it stands! Try again.',nl:'Nog één toren, dan staat hij! Probeer het nog eens.'}},
  {g:'vemmo',v:'mila',i:'joy',text:{en:'Look at that! The fort is standing!',nl:'Kijk nou! Het fort staat!'}}];
const SLIDERS=['pitch','speed','expr','form','breath','tilt'];

// ---------- 2. shared audio graph ----------
let ctx,out,wet,an,irData=null;
function init(){
  if(ctx)return;
  ctx=new (window.AudioContext||window.webkitAudioContext)();
  out=ctx.createGain();an=ctx.createAnalyser();an.fftSize=1024;out.connect(an);
  const len=Math.floor(ctx.sampleRate*.5),ir=ctx.createBuffer(2,len,ctx.sampleRate);irData=[];
  roomIR(ctx.sampleRate).forEach((d,c)=>{ir.getChannelData(c).set(d);irData.push(d)});
  const conv=ctx.createConvolver();conv.buffer=ir;wet=ctx.createGain();wet.gain.value=wetFor(st.engine);
  const shelf=ctx.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=6000;shelf.gain.value=-3;
  out.connect(shelf);shelf.connect(ctx.destination);shelf.connect(conv);conv.connect(wet);wet.connect(ctx.destination);
}
async function ready(){init();if(ctx.state==='suspended'){try{await ctx.resume()}catch(e){}}}
// one player at a time across the whole app: no overlapping audio
const P={src:null,owner:null,startAt:0,offset:0,buf:null,onend:null,raf:0};
function pStop(keepOffset){if(P.src){const s=P.src;P.src=null;s.onended=null;try{s.stop()}catch(e){}}
  cancelAnimationFrame(P.raf);const ow=P.owner,cb=P.onend;if(!keepOffset){P.offset=0}P.owner=null;P.onend=null;if(cb)cb(ow);ambDown(.25)}
function pPlay(buf,owner,{from=0,onTick,onend,dest}={}){
  pStop();const s=ctx.createBufferSource();s.buffer=buf;s.connect(dest||out);
  P.src=s;P.owner=owner;P.buf=buf;P.offset=from;P.startAt=ctx.currentTime+.03;P.onend=onend;s.start(P.startAt,from);
  s.onended=()=>{if(P.src===s){P.src=null;cancelAnimationFrame(P.raf);const cb=P.onend,ow=P.owner;P.owner=null;P.onend=null;P.offset=0;if(cb)cb(ow,true)}};
  const tick=()=>{if(P.src!==s)return;const pos=Math.min(buf.duration,from+Math.max(0,ctx.currentTime-P.startAt));onTick&&onTick(pos);P.raf=requestAnimationFrame(tick)};P.raf=requestAnimationFrame(tick);
}
function pPos(){return P.src?P.offset+Math.max(0,ctx.currentTime-P.startAt):P.offset}
function bufFrom(pcm,sr){for(let i=0;i<pcm.length;i++)if(!isFinite(pcm[i]))pcm[i]=0;const b=ctx.createBuffer(1,pcm.length,sr);b.getChannelData(0).set(pcm);return b}
// waveform drawn from the real samples
function drawWave(cv,pcm,progress){
  const w=cv.clientWidth,h=cv.clientHeight,dpr=devicePixelRatio||1;if(!w||!pcm)return;
  if(cv.width!==Math.round(w*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);cv._peaks=null}
  const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
  const bars=Math.max(20,Math.floor(w/5));
  if(!cv._peaks||cv._peaks.src!==pcm){const pk=new Float32Array(bars),step=pcm.length/bars;let mx=0;for(let b=0;b<bars;b++){let m=0;const a=Math.floor(b*step),e=Math.floor((b+1)*step);for(let i=a;i<e;i+=2)m=Math.max(m,Math.abs(pcm[i]));pk[b]=m;mx=Math.max(mx,m)}for(let b=0;b<bars;b++)pk[b]/=mx||1;pk.src=pcm;cv._peaks=pk}
  const pk=cv._peaks,css=getComputedStyle(document.documentElement),c1=getComputedStyle(document.body).getPropertyValue('--acc')||css.getPropertyValue('--coral'),c2=css.getPropertyValue('--line2');
  for(let b=0;b<bars;b++){const x=b*5+1,bh=Math.max(2,pk[b]*(h-4));g.fillStyle=(b/bars)<progress?c1:c2;g.fillRect(x,(h-bh)/2,3,bh)}
}
const fmtDur=s=>{s=Math.max(0,s);const m=Math.floor(s/60),r=Math.round(s-m*60);return m+':'+String(r===60?59:r).padStart(2,'0')};

// ---------- 2b. make screen state ----------
const st={engine:'animal',view:'make',cfg:{},langSeed:Math.floor(Math.random()*1e6),resBy:{},savedBy:{},busy:false,voices:[],storeOK:null};
let LANG=makeLang(st.langSeed);
// consonant hiss: one setting for all styles and voices (1 = the original sound)
let HISS=1;try{const h=parseFloat(localStorage.getItem('bm.hiss'));if(h>=0&&h<=1)HISS=h}catch(e){}
// pitch steadiness for own voices: follows each syllable's own pitch so it lands on the melody (0 = per-syllable correction only)
let STEADY=1;try{const h=parseFloat(localStorage.getItem('bm.steady'));if(h>=0&&h<=1)STEADY=h}catch(e){}
function defCfg(e){const k=Object.keys(ENGINES[e].voices)[0],v=ENGINES[e].voices[k];const s={};SLIDERS.forEach(x=>s[x]=v[x]);
  return {voice:k,mood:'neutraal',intent:'greet',len:'auto',anc:'auto',name:'',sl:s,take:Math.floor(Math.random()*1e6)}}
const own=(o,k)=>o!=null&&typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
const num=(v,d)=>typeof v==='number'&&isFinite(v)?v:d;
// Saved settings come from localStorage: keep only known values, so an old or edited entry can't stop the app from starting.
function cleanCfg(e,x){const d=defCfg(e),v=ENGINES[e].voices;if(!x||typeof x!=='object')return d;
  if(typeof x.voice==='string'&&(x.voice.startsWith('own:')?EMETA[e].rec:own(v,x.voice)))d.voice=x.voice;
  const pv=v[d.voice.startsWith('own:')?Object.keys(v)[0]:d.voice];SLIDERS.forEach(k=>d.sl[k]=pv[k]);
  if(own(MOODS,x.mood))d.mood=x.mood;if(own(INTENTS,x.intent))d.intent=x.intent;
  if(['auto','short','medium'].includes(x.len))d.len=x.len;if(x.anc==='auto'||own(ANCHORS,x.anc))d.anc=x.anc;
  if(x.sl&&typeof x.sl==='object')SLIDERS.forEach(k=>{const n=num(x.sl[k]);if(n!==undefined)d.sl[k]=Math.min(+$(k).max,Math.max(+$(k).min,n))});
  if(typeof x.name==='string')d.name=x.name.slice(0,24);d.take=num(x.take,d.take);if('salt' in x)d.salt=num(x.salt,0);return d}
ENGINE_ORDER.forEach(e=>st.cfg[e]=defCfg(e));
try{const saved=JSON.parse(localStorage.getItem('bm.cfg')||'null');if(saved&&saved.cfg){for(const e of ENGINE_ORDER)if(own(saved.cfg,e))st.cfg[e]=cleanCfg(e,saved.cfg[e]);if(own(ENGINES,saved.engine))st.engine=saved.engine}}catch(e){}
const C=()=>st.cfg[st.engine];
function saveCfg(){try{localStorage.setItem('bm.cfg',JSON.stringify({engine:st.engine,cfg:st.cfg}))}catch(e){}}
const ownVoice=id=>st.voices.find(v=>v.id===id);
function voiceObj(){const c=C();if(c.voice.startsWith('own:')){const ov=ownVoice(c.voice.slice(4));if(ov)return {own:ov,preset:ENGINES[st.engine].voices[Object.keys(ENGINES[st.engine].voices)[0]]};c.voice=Object.keys(ENGINES[st.engine].voices)[0]}
  return {preset:ENGINES[st.engine].voices[c.voice]}}
function settingsKey(){const c=C();return JSON.stringify([st.engine,c.voice,st.engine==='vemmo'?c.intent:c.mood,st.engine==='vemmo'?[c.len,c.anc]:st.engine==='name'?c.name:0,c.sl,$('txt').value,st.engine==='sim'?st.langSeed:0,HISS,STEADY])}
function lenFor(){const c=C();return c.len!=='auto'?c.len:($('txt').value.trim().length<=45?'short':'medium')}
function opts(){const c=C(),vo=voiceObj();return styleOpts(st.engine,vo.preset,{mood:st.engine==='vemmo'?c.intent:c.mood,sl:c.sl,hiss:HISS,own:vo.own,steady:STEADY})}
// ---------- generation ----------
function buildTokens(variant){
  const c=C();
  if(st.engine==='vemmo'){
    let clip,guard=0;const prev=cur()?cur().text:'';
    do{clip=vemmoClip(c.intent,lenFor(),c.take+guard*7919,c.anc);guard++}while(variant&&clip.map(x=>x.text).join('')===prev&&guard<8);
    return clip;
  }
  const c2=C();if(variant)c2.salt=Math.random(); // a new take on the same syllables; it stays when you change a setting
  const toks=textToks(st.engine,$('txt').value,st.langSeed,paletteLang(st.engine)||LANG,{name:nameFor(),mood:c2.mood,vary:Math.floor((c2.salt||0)*1e6)});
  if(c2.salt)toks.forEach(k=>{if(k.jit!==undefined)k.jit=(k.jit+c2.salt)%1});
  return toks;
}
function nameFor(){const c=C(),vo=voiceObj();return (c.name||'').trim()||(vo.own?vo.own.name:vo.preset.name)} // Name Talk: typed name, else the voice's own name
function render(toks){const vo=voiceObj();return renderStyle(st.engine,toks,opts(),ctx.sampleRate,vo.own&&vo.own.grains)}
async function generate(variant){
  if(st.busy)return;await ready();pStop();
  if(variant&&st.engine==='vemmo')C().take=Math.floor(Math.random()*1e6);saveCfg();
  setBusy(true);
  setTimeout(()=>{ // let the busy state paint before the synchronous render
    try{
      const toks=buildTokens(variant),r=render(toks),buf=bufFrom(r.pcm,ctx.sampleRate);
      const vo=voiceObj(),c=C();
      const meta=[EMETA[st.engine].name,vo.own?vo.own.name:vo.preset.name,st.engine==='vemmo'?INTENTNAME[c.intent][LI()]:MOODNAME[c.mood][LI()]].join(' · ');
      st.resBy[st.engine]={toks,pcm:r.pcm,buf,marks:r.marks,key:settingsKey(),engine:st.engine,meta,salt:c.salt||0,take:c.take,cfg:JSON.parse(JSON.stringify(c)),langSeed:st.langSeed,wet:wetFor(st.engine),text:toks.map(x=>x.text).join('')};
      setBusy(false);showResult();say(t('make.ready',{s:buf.duration.toFixed(1)}));playCur();
    }catch(err){setBusy(false);console.error(err)}
  },30);
}
function setBusy(b){st.busy=b;$('busy').hidden=!b;$('pResult').setAttribute('aria-busy',b?'true':'false');['genBtn','playBtn','dlBtn'].forEach(id=>{const el=$(id);if(el)el.disabled=b});$('takeChips').querySelectorAll('button').forEach(x=>x.disabled=b);const r=cur();$('stale').hidden=b||!r||r.key===settingsKey()}
// results and saved variants are kept per style
function cur(){return st.resBy[st.engine]}
const SV=()=>st.savedBy[st.engine]||(st.savedBy[st.engine]=[]);
function showResult(){
  const r=cur();$('playerRow').hidden=!r;$('takes').hidden=!r;renderTakes();$('dlBtn').hidden=!r;$('codeBtn').hidden=!r;$('dlOk').hidden=true;$('bubbleHint').hidden=!!r;
  const el=$('sounds');el.innerHTML='';if(!r){setPlayLabel(false);return}
  const n=r.toks.reduce((a,k)=>a+k.text.length,0);el.dataset.len=n>220?'l':n>120?'m':'s';
  r.toks.forEach(k=>{const s=document.createElement('span');s.className='s'+(k.lex?' lex':'');s.textContent=k.text;k.el=s;el.appendChild(s)});
  $('dur').textContent=fmtDur(r.buf.duration);$('resMeta').textContent=r.meta;
  setPlayLabel(false);drawWave($('wave'),r.pcm,0);checkStale();
}
// variants: results you saved on purpose; clicking one plays it and brings its settings back, × removes it
function useTake(h){if(h.engine!==st.engine)setEngine(h.engine);Object.assign(C(),JSON.parse(JSON.stringify(h.cfg)));
  if(h.langSeed!==st.langSeed){st.langSeed=h.langSeed;LANG=makeLang(st.langSeed)}st.resBy[st.engine]=h;refreshSide();saveCfg();showResult()}
function renderTakes(){const box=$('takeChips');box.innerHTML='';if(!cur())return;const key=settingsKey();
  SV().forEach((h,i)=>{const w=document.createElement('span');w.className='take';const b=document.createElement('button');b.type='button';b.textContent=i+1;b.setAttribute('aria-pressed',String(h===cur()));
    const old=h.key!==key&&h!==cur();if(old)w.classList.add('old');b.title=h.meta+(old?' · '+t('make.takeOld'):'');b.setAttribute('aria-label',t('make.takeN',{i:i+1})+' · '+b.title);
    b.onclick=async()=>{if(st.busy)return;await ready();useTake(h);playCur()};
    const x=document.createElement('button');x.type='button';x.className='del';x.textContent='×';x.setAttribute('aria-label',t('make.delTake',{i:i+1}));x.title=x.getAttribute('aria-label');
    x.onclick=()=>{st.savedBy[st.engine]=SV().filter(y=>y!==h);renderTakes()};w.appendChild(b);w.appendChild(x);box.appendChild(w)});
  const add=document.createElement('button');add.type='button';add.className='add';add.textContent=t('make.addTake');add.hidden=SV().includes(cur());add.onclick=()=>{if(!st.busy&&cur()&&!SV().includes(cur())){SV().push(cur());if(SV().length>12)SV().shift();renderTakes()}};box.appendChild(add);
  const sv=document.createElement('button');sv.type='button';sv.className='savechar';sv.textContent=t('make.saveChar');sv.onclick=openCharForm;sv.hidden=!$('charForm').hidden;box.appendChild(sv);
  const tip=document.createElement('button');tip.type='button';tip.className='tipbtn';tip.textContent='i';tip.setAttribute('aria-label',t('make.helpAria'));tip.setAttribute('aria-expanded',String(!$('takeHelp').hidden));tip.setAttribute('aria-controls','takeHelp');tip.title=t('make.saveHelp');
  tip.onclick=()=>{$('takeHelp').hidden=!$('takeHelp').hidden;tip.setAttribute('aria-expanded',String(!$('takeHelp').hidden))};box.appendChild(tip)}
// ---------- characters: a saved variant ----------
let CHARS=[];try{const a=JSON.parse(localStorage.getItem('bm.chars')||'[]');if(Array.isArray(a))CHARS=a.filter(x=>x&&own(ENGINES,x.engine)).map(x=>({...x,...cleanCfg(x.engine,x),engine:x.engine,id:String(x.id||'c'+Math.random().toString(36).slice(2)),name:String(x.name||'?').slice(0,60),langSeed:num(x.langSeed,0),salt:num(x.salt,0)}))}catch(e){}
function saveChars(){try{localStorage.setItem('bm.chars',JSON.stringify(CHARS))}catch(e){}}
function charNow(){const c=C(),h=cur();return {engine:st.engine,voice:c.voice,mood:c.mood,intent:c.intent,len:c.len,anc:c.anc,name:c.name||'',sl:{...c.sl},salt:h?h.salt:(c.salt||0),take:h&&h.take!==undefined?h.take:c.take,langSeed:st.langSeed}}
const charKey=x=>JSON.stringify([x.engine,x.voice,x.engine==='vemmo'?[x.intent,x.len,x.anc,x.take]:[x.mood,x.salt,x.engine==='name'?x.name||'':0],x.sl,LANGSTYLE[x.engine]?x.langSeed:0]);
const LANGSTYLE={sim:1,echo:1,radio:1}; // styles that speak the made-up language
function charActive(x){const c=C();return x.engine===st.engine&&charKey(x)===charKey({engine:st.engine,voice:c.voice,mood:c.mood,intent:c.intent,len:c.len,anc:c.anc,name:c.name||'',sl:c.sl,salt:c.salt||0,take:c.take,langSeed:st.langSeed})}
function charInfo(x){const vn=x.voice.startsWith('own:')?(ownVoice(x.voice.slice(4))||{name:'?'}).name:ENGINES[x.engine].voices[x.voice].name;
  return [EMETA[x.engine].name,vn,x.engine==='vemmo'?INTENTNAME[x.intent][LI()]:MOODNAME[x.mood][LI()]].join(' · ')}
function useChar(x){showView('make');if(x.engine!==st.engine)setEngine(x.engine);const c=C();
  Object.assign(c,{voice:x.voice,mood:x.mood,intent:x.intent,len:x.len,anc:x.anc,name:typeof x.name==='string'?x.name:'',sl:{...x.sl},salt:x.salt,take:x.take});
  if(x.langSeed!==st.langSeed){st.langSeed=x.langSeed;LANG=makeLang(st.langSeed)}
  $('voiceMsg').hidden=true;refreshSide();saveCfg();generate(false)}
function openCharForm(){$('charForm').hidden=false;$('charName').value='';renderTakes();$('charName').focus()}
function closeCharForm(){$('charForm').hidden=true;renderTakes()}
$('charCancel').onclick=closeCharForm;
$('charForm').addEventListener('submit',e=>{e.preventDefault();const name=$('charName').value.trim()||EMETA[st.engine].name+' '+(CHARS.length+1);
  const x={id:'c'+Date.now().toString(36),name,created:Date.now(),...charNow()};CHARS.push(x);saveChars();
  const c=C();c.salt=x.salt;if(x.take!==undefined)c.take=x.take;saveCfg(); // the saved variant is now the current one
  closeCharForm();refreshSide();renderChars();$('voiceMsg').textContent=t('char.saved',{name});$('voiceMsg').hidden=false;say($('voiceMsg').textContent)});
function renderChars(){const l=$('clist');l.innerHTML='';$('cEmpty').hidden=CHARS.length>0;
  CHARS.forEach(x=>{const row=document.createElement('div');row.className='ccard s-'+x.engine;row.insertAdjacentHTML('beforeend','<svg viewBox="0 0 40 40" aria-hidden="true">'+MINI[x.engine]+'</svg>');const info=document.createElement('div');info.className='vinfo';
    const b=document.createElement('b');b.textContent=x.name;const p=document.createElement('span');p.className='hint';p.textContent=charInfo(x);info.appendChild(b);info.appendChild(p);row.appendChild(info);
    const act=document.createElement('div');act.className='vact';const mk=(lab,fn,cls)=>{const y=document.createElement('button');y.type='button';y.className='btn'+(cls?' '+cls:'');y.textContent=lab;y.onclick=fn;act.appendChild(y)};
    mk(t('char.use'),()=>useChar(x),'primary');
    mk(t('voices.rename'),()=>{info.innerHTML='';const inp=document.createElement('input');inp.type='text';inp.value=x.name;inp.setAttribute('aria-label',t('char.name'));info.appendChild(inp);act.innerHTML='';
      mk(t('voices.save'),()=>{x.name=inp.value.trim()||x.name;saveChars();renderChars();refreshSide()},'primary');mk(t('voices.cancel'),renderChars);inp.focus()});
    mk(t('voices.delete'),()=>confirmDlg(t('voices.delTitle',{name:x.name}),'',t('cf.del'),t('voices.cancel')).then(ok=>{if(!ok)return;CHARS=CHARS.filter(y=>y!==x);saveChars();renderChars();refreshSide()}));
    row.appendChild(act);l.appendChild(row)})}
function setPlayLabel(playing){$('genBtn').textContent=playing?t('make.stopPlay'):t('make.speak')}
function playCur(){
  const r=cur();if(!r)return;if(wet)wet.gain.value=r.wet;
  setPlayLabel(true);
  pPlay(r.buf,'result',{onTick:pos=>{drawWave($('wave'),r.pcm,pos/r.buf.duration);
      let on=-1;for(const [tt,i] of r.marks){if(tt<=pos)on=i;else break}
      r.toks.forEach((k,i)=>k.el&&k.el.classList.toggle('on',i===on&&pos<r.buf.duration-.05))},
    onend:()=>{setPlayLabel(false);r.toks.forEach(k=>k.el&&k.el.classList.remove('on'));drawWave($('wave'),r.pcm,0)}});
  ambUp(r.buf.duration); // after pPlay: pPlay stops the previous player first, which also fades the background out
}
function checkStale(){const r=cur();$('stale').hidden=!r||st.busy||r.key===settingsKey();renderTakes()}
// ---------- WAV export: a plain .wav download; inside a claude.ai artifact via the downloads capability, zipped (its allowlist has zip, not wav) ----------
let DL=null;
(async()=>{try{if(window.claude&&window.claude.use){DL=await window.claude.use('downloads')}}catch(e){DL=null}if(DL){$('dlBtn').dataset.t='make.downloadZip';$('dlBtn').textContent=t('make.downloadZip')}})();
function saveBlob(blob,filename){
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),10000);
}
async function exportWav(){
  const r=cur();if(!r)return;$('dlErr').hidden=true;$('dlOk').hidden=true;
  try{
  const sr=ctx.sampleRate,tail=Math.floor(sr*.6),oc=new OfflineAudioContext(2,r.pcm.length+tail,sr);
  const b=oc.createBuffer(1,r.pcm.length,sr);b.getChannelData(0).set(r.pcm);const s=oc.createBufferSource();s.buffer=b;
  const shelf=oc.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=6000;shelf.gain.value=-3;
  const ir=oc.createBuffer(2,irData[0].length,sr);ir.getChannelData(0).set(irData[0]);ir.getChannelData(1).set(irData[1]);
  const cv=oc.createConvolver();cv.buffer=ir;const w=oc.createGain();w.gain.value=r.wet;
  s.connect(shelf);shelf.connect(oc.destination);shelf.connect(cv);cv.connect(w);w.connect(oc.destination);s.start();
  const rendered=await oc.startRendering();
  const wav=encodeWav(rendered),name=('babble-'+r.engine+'-'+(r.text.replace(/[^a-z0-9]+/gi,'-').slice(0,24)||'clip')).replace(/-+$/,'').toLowerCase();
  let file;
  if(DL){file=name+'.zip';await DL.save({filename:file,data:new Blob([makeZip(name+'.wav',wav)])})}
  else{file=name+'.wav';saveBlob(new Blob([wav],{type:'audio/wav'}),file)}
  $('dlOk').textContent=t('make.dlDone',{f:file});$('dlOk').hidden=false;
  }catch(e){if(e&&e.code==='declined'){$('dlErr').textContent=t('make.dlDeclined')}else{$('dlErr').textContent=t('make.dlErr',{m:(e&&e.message)||'unknown'})}$('dlErr').hidden=false}
}
function encodeWav(ab){
  const ch=ab.numberOfChannels,n=ab.length,sr=ab.sampleRate,buf=new ArrayBuffer(44+n*ch*2),v=new DataView(buf);
  const ws=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  ws(0,'RIFF');v.setUint32(4,36+n*ch*2,true);ws(8,'WAVE');ws(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);
  v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);ws(36,'data');v.setUint32(40,n*ch*2,true);
  const d=[];for(let c=0;c<ch;c++)d.push(ab.getChannelData(c));let mx=0;for(const a of d)for(const x of a)mx=Math.max(mx,Math.abs(x));const g=mx>.99?.99/mx:1;
  let o=44;for(let i=0;i<n;i++)for(let c=0;c<ch;c++){v.setInt16(o,Math.max(-1,Math.min(1,d[c][i]*g))*32767,true);o+=2}
  return new Uint8Array(buf);
}
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRCT[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function makeZip(name,data){ // single file, stored (no compression)
  const nm=new TextEncoder().encode(name),crc=crc32(data),lh=new Uint8Array(30+nm.length),cd=new Uint8Array(46+nm.length),end=new Uint8Array(22);
  const L=new DataView(lh.buffer),Cd=new DataView(cd.buffer),E=new DataView(end.buffer);
  L.setUint32(0,0x04034b50,true);L.setUint16(4,20,true);L.setUint32(14,crc,true);L.setUint32(18,data.length,true);L.setUint32(22,data.length,true);L.setUint16(26,nm.length,true);lh.set(nm,30);
  Cd.setUint32(0,0x02014b50,true);Cd.setUint16(4,20,true);Cd.setUint16(6,20,true);Cd.setUint32(16,crc,true);Cd.setUint32(20,data.length,true);Cd.setUint32(24,data.length,true);Cd.setUint16(28,nm.length,true);cd.set(nm,46);
  E.setUint32(0,0x06054b50,true);E.setUint16(8,1,true);E.setUint16(10,1,true);E.setUint32(12,cd.length,true);E.setUint32(16,lh.length+data.length,true);
  const z=new Uint8Array(lh.length+data.length+cd.length+end.length);z.set(lh,0);z.set(data,lh.length);z.set(cd,lh.length+data.length);z.set(end,lh.length+data.length+cd.length);return z;
}
// ---------- ambience (playback only) ----------
const AMB={type:'off',lvl:.5,src:null,gain:null,cache:{},tmr:0,playing:null};
function ambUp(dur){
  if(AMB.type==='off'||!ctx)return;clearTimeout(AMB.tmr);
  if(!AMB.gain){AMB.gain=ctx.createGain();AMB.gain.gain.value=0;AMB.gain.connect(ctx.destination)}
  if(AMB.playing!==AMB.type){if(AMB.src){try{AMB.src.stop()}catch(e){}}const key=AMB.type+ctx.sampleRate;
    if(!AMB.cache[key]){const d=makeAmbient(AMB.type,ctx.sampleRate),b=ctx.createBuffer(1,d.length,ctx.sampleRate);b.getChannelData(0).set(d);AMB.cache[key]=b}
    AMB.src=ctx.createBufferSource();AMB.src.buffer=AMB.cache[key];AMB.src.loop=true;AMB.src.connect(AMB.gain);AMB.src.start(ctx.currentTime,Math.random()*6);AMB.playing=AMB.type}
  const g=AMB.gain.gain,now=ctx.currentTime;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(AMB.lvl*.55,now+.35);
  AMB.tmr=setTimeout(()=>ambDown(1.2),(dur+.9)*1000);
}
function ambDown(fade){
  if(!AMB.gain||!ctx)return;clearTimeout(AMB.tmr);const g=AMB.gain.gain,now=ctx.currentTime,f=fade||.25;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0,now+f);
  const s=AMB.src;AMB.tmr=setTimeout(()=>{if(AMB.src===s&&s){try{s.stop()}catch(e){}AMB.src=null;AMB.playing=null}},f*1000+60);
}

// ---------- make screen UI ----------
// one small critter per style on the style cards (static markup, no user data)
const MINI={animal:'<ellipse class="b" cx="11" cy="9" rx="4" ry="7"/><ellipse class="b" cx="29" cy="9" rx="4" ry="7"/><circle class="b" cx="20" cy="23" r="15"/><circle class="e" cx="15" cy="21" r="2"/><circle class="e" cx="25" cy="21" r="2"/>',
  sim:'<circle class="b" cx="20" cy="22" r="16"/><circle class="e" cx="15" cy="20" r="2"/><circle class="e" cx="25" cy="20" r="2"/>',
  vemmo:'<circle class="b" cx="20" cy="22" r="16"/><path class="h" d="M5 19 C5 3 35 3 35 19 Z"/><circle class="e" cx="15" cy="23" r="2"/><circle class="e" cx="25" cy="23" r="2"/>',
  grumble:'<ellipse class="b" cx="9" cy="12" rx="4" ry="6"/><ellipse class="b" cx="31" cy="12" rx="4" ry="6"/><circle class="b" cx="20" cy="23" r="15"/><path class="e" d="M12 19h6M22 19h6" stroke-width="2.5"/>',
  gizmo:'<line class="a" x1="20" y1="8" x2="20" y2="2"/><circle class="h" cx="20" cy="3" r="2.5"/><rect class="b" x="5" y="8" width="30" height="28" rx="8"/><circle class="e" cx="14" cy="21" r="2.5"/><circle class="e" cx="26" cy="21" r="2.5"/>',
  sprite:'<ellipse class="b" cx="10" cy="10" rx="3" ry="8"/><ellipse class="b" cx="30" cy="10" rx="3" ry="8"/><circle class="b" cx="20" cy="24" r="13"/><circle class="e" cx="15" cy="23" r="2"/><circle class="e" cx="25" cy="23" r="2"/>',
  echo:'<circle class="b" cx="12" cy="24" r="9"/><circle class="b" cx="28" cy="24" r="9"/><circle class="b" cx="20" cy="17" r="10"/><circle class="e" cx="16" cy="16" r="1.8"/><circle class="e" cx="24" cy="16" r="1.8"/>',
  radio:'<circle class="b" cx="20" cy="23" r="14"/><path class="a" d="M6 22 C6 6 34 6 34 22"/><rect class="h" x="2" y="19" width="6" height="10" rx="2"/><rect class="h" x="32" y="19" width="6" height="10" rx="2"/><circle class="e" cx="15" cy="22" r="2"/><circle class="e" cx="25" cy="22" r="2"/>',
  baby:'<circle class="b" cx="20" cy="22" r="16"/><circle class="e" cx="14" cy="21" r="2.6"/><circle class="e" cx="26" cy="21" r="2.6"/><circle class="h" cx="20" cy="6" r="2.5"/>',
  name:'<ellipse class="b" cx="9" cy="14" rx="5" ry="8"/><ellipse class="b" cx="31" cy="14" rx="5" ry="8"/><circle class="b" cx="20" cy="23" r="14"/><circle class="e" cx="15" cy="22" r="2.4"/><circle class="e" cx="25" cy="22" r="2.4"/><ellipse class="h" cx="20" cy="29" rx="3" ry="2"/>',
  bark:'<circle class="b" cx="20" cy="22" r="15"/><path class="h" d="M5 18 Q20 4 35 18 L35 21 L5 21 Z"/><path class="e" d="M13 26h5M22 26h5" stroke-width="2.5"/>',
  ghost:'<path class="b" d="M8 36 V18 a12 12 0 0 1 24 0 V36 l-4-3 -4 3 -4-3 -4 3 -4-3 z"/><ellipse class="e" cx="15" cy="19" rx="2" ry="3"/><ellipse class="e" cx="25" cy="19" rx="2" ry="3"/><ellipse class="e" cx="20" cy="27" rx="2" ry="2.6"/>',
  blip:'<rect class="b" x="4" y="8" width="32" height="22" rx="4"/><path class="b" d="M10 29 l0 7 7-7z"/><rect class="h" x="10" y="17" width="4" height="4"/><rect class="h" x="18" y="17" width="4" height="4"/><rect class="h" x="26" y="17" width="4" height="4"/>',
  droid:'<line class="a" x1="20" y1="9" x2="20" y2="3"/><circle class="h" cx="20" cy="3" r="2.5"/><path class="b" d="M6 24 a14 14 0 0 1 28 0 V34 H6 Z"/><circle class="h" cx="20" cy="21" r="5"/><circle class="e" cx="20" cy="21" r="2"/><rect class="h" x="10" y="28" width="20" height="3" rx="1.5"/>',
  tone:'<circle class="b" cx="20" cy="20" r="11"/><circle class="a" cx="20" cy="20" r="16"/>',
  instr:'<rect class="b" x="9" y="6" width="22" height="28" rx="11"/><line class="a" x1="20" y1="12" x2="20" y2="28"/>'};
function buildEngines(){const box=$('engines');box.innerHTML='';
  [['voice',ENGINE_ORDER.filter(e=>EMETA[e].rec)],['sound',ENGINE_ORDER.filter(e=>!EMETA[e].rec)]].forEach(([g,list],gi)=>{
    const grp=document.createElement('div');grp.className='sgroup g'+gi;grp.setAttribute('role','group');grp.setAttribute('aria-label',t(g==='voice'?'make.gVoice':'make.gSound'));
    list.forEach(e=>{const b=document.createElement('button');b.type='button';b.dataset.e=e;b.className='s-'+e;b.setAttribute('aria-pressed',String(e===st.engine));
      b.innerHTML='<svg viewBox="0 0 40 40" aria-hidden="true">'+MINI[e]+'</svg>';b.append(EMETA[e].name);
      b.tabIndex=e===st.engine?0:-1;b.onclick=()=>{setEngine(e);generate(false)};grp.appendChild(b)});
    box.appendChild(grp)})}
$('engines').addEventListener('keydown',ev=>{const all=[...$('engines').querySelectorAll('button')],i=all.indexOf(document.activeElement);if(i<0)return;
  const j={ArrowRight:i+1,ArrowDown:i+1,ArrowLeft:i-1,ArrowUp:i-1,Home:0,End:all.length-1}[ev.key];if(j===undefined)return;ev.preventDefault();
  const k=(j+all.length)%all.length;all.forEach(b=>b.tabIndex=-1);all[k].tabIndex=0;all[k].focus()});
function setBodyEngine(){ENGINE_ORDER.forEach(x=>document.body.classList.toggle('e-'+x,x===st.engine))}
function setEngine(e){
  if(e===st.engine)return;pStop();st.engine=e;saveCfg();setBodyEngine();
  document.querySelectorAll('#engines button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.e===e));b.tabIndex=b.dataset.e===e?0:-1});
  if(wet)wet.gain.value=wetFor(e);
  $('voiceMsg').hidden=true;refreshSide();showResult();
}
function refreshSide(){
  const e=st.engine,c=C(),m=EMETA[e],nv=!m.rec;
  $('engineDesc').textContent=m.d[LANGUI];
  $('voiceLbl').textContent=e==='instr'?t('side.instrument'):nv?t('side.sound'):t('side.voice');
  if(c.voice.startsWith('own:')&&!ownVoice(c.voice.slice(4)))c.voice=Object.keys(ENGINES[e].voices)[0];
  if(!c.voice.startsWith('own:')&&!ENGINES[e].voices[c.voice])c.voice=Object.keys(ENGINES[e].voices)[0];
  const vc=$('voiceChips');vc.innerHTML='';
  const chip=(box,label,pressed,fn,cls,title)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(pressed));if(cls)b.className=cls;if(title)b.title=title;b.onclick=fn;box.appendChild(b);return b};
  Object.entries(ENGINES[e].voices).forEach(([k,v])=>chip(vc,v.name,c.voice===k,()=>pickVoice(k)));
  if(m.rec&&st.voices.length){st.voices.forEach(v=>chip(vc,v.name,c.voice==='own:'+v.id,()=>pickVoice('own:'+v.id),'own',t('side.own')))}
  const cc=$('charChips');cc.innerHTML='';$('charRow').hidden=!CHARS.length;CHARS.forEach(x=>chip(cc,x.name,charActive(x),()=>useChar(x),'char',charInfo(x)));
  const vo=voiceObj();$('voiceDesc').textContent=vo.own?t('side.own'):'';$('voiceNote').hidden=!vo.own;
  if(vo.own)$('voiceNote').textContent=vo.own.complete?t('side.ownLabel',{n:vo.own.grains.length}):t('side.ownPartial',{d:vo.own.linesDone,t:vo.own.linesTotal});
  const who=vo.own?vo.own.name:vo.preset.name;$('speaker').textContent=who;
  $('sayLbl').textContent=t(e==='vemmo'?'make.sayV':'make.say',{name:who});$('tuneLbl').textContent=t('make.tune',{name:who});
  if(e==='vemmo'&&c.len==='auto')c.len='short';$('fTxt').hidden=e==='vemmo';
  $('fName').hidden=e!=='name';$('nameIn').value=c.name||'';$('nameIn').placeholder=vo.own?vo.own.name:vo.preset.name;$('fIntent').hidden=e!=='vemmo';$('fMood').hidden=e==='vemmo';$('fLen').hidden=e!=='vemmo';$('dAnchors').hidden=e!=='vemmo';
  const ic=$('intentChips');ic.innerHTML='';Object.keys(INTENTS).forEach(k=>chip(ic,INTENTNAME[k][LI()],c.intent===k,()=>{c.intent=k;c.take=Math.floor(Math.random()*1e6);refreshSide();onSetting();generate(false)}));
  $('intentDesc').textContent=INTENTNAME[c.intent][2+LI()];
  const mc=$('moodChips');mc.innerHTML='';Object.keys(MOODS).forEach(k=>chip(mc,MOODNAME[k][LI()],c.mood===k,()=>{c.mood=k;refreshSide();onSetting();generate(false)}));
  document.querySelectorAll('[data-len]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.len===c.len)));$('ancSel').value=c.anc;
  const an=$('anchors');an.innerHTML='';Object.entries(ANCHORS).forEach(([k,A])=>{const b=document.createElement('button');b.type='button';b.innerHTML='<b></b><span></span>';b.querySelector('b').textContent=A.text;b.querySelector('span').textContent=A.pron+' · '+ANCNAME[k][LI()];b.onclick=()=>playAnchor(k);an.appendChild(b)});
  SLIDERS.forEach(x=>$(x).value=c.sl[x]);$('hiss').value=HISS;$('steady').value=STEADY;
  $('lPitch').textContent=nv?t('adv.note'):t('adv.pitch');$('hPitch').textContent=nv?t('adv.noteH'):t('adv.pitchH');
  $('lExpr').textContent=nv?t('adv.range'):t('adv.expr');$('hExpr').textContent=nv?t('adv.rangeH'):t('adv.exprH');
  $('fForm').hidden=nv||!!vo.own;$('fBreath').hidden=nv||!!vo.own;$('fHiss').hidden=nv||(!!vo.own&&e!=='radio');$('fSteady').hidden=nv||!vo.own;$('fLang').hidden=e!=='sim'&&e!=='echo'&&e!=='radio';$('langName').textContent=LANG.name+' · '+LANG.cons.join(' ')+' / '+LANG.vow.join(' ');
  outs();
}
function outs(){const c=C();$('oPitch').textContent=Math.round(c.sl.pitch)+' Hz';$('oSpeed').textContent='×'+(+c.sl.speed).toFixed(2);$('oExpr').textContent=Math.round(c.sl.expr*100)+'%';
  $('oForm').textContent='×'+(+c.sl.form).toFixed(2);$('oBreath').textContent=Math.round(c.sl.breath*100)+'%';$('oTilt').textContent=Math.round((c.sl.tilt-.15)/.75*100)+'%';$('oHiss').textContent=Math.round(HISS*100)+'%';$('oSteady').textContent=Math.round(STEADY*100)+'%';$('oAmb').textContent=Math.round(AMB.lvl*100)+'%'}
async function playAnchor(k){await ready();const t2=anchorToks(k,rng(7)),o=opts();o.mood=ANC_INT[k];const vo=voiceObj(),tk=t2.map(x=>({...x}));
  const r=vo.own?renderSample(tk,vo.own.grains,o,ctx.sampleRate):renderSynth(tk,o,ctx.sampleRate);pPlay(bufFrom(r.pcm,ctx.sampleRate),'anchor')}
function onSetting(){saveCfg();checkStale()}
function pickVoice(v){const c=C();c.voice=v;c.salt=0;
  const p=v.startsWith('own:')?ENGINES[st.engine].voices[Object.keys(ENGINES[st.engine].voices)[0]]:ENGINES[st.engine].voices[v];SLIDERS.forEach(x=>c.sl[x]=p[x]);
  $('voiceMsg').hidden=true;refreshSide();onSetting();generate(false)}
document.querySelectorAll('[data-len]').forEach(b=>b.addEventListener('click',()=>{C().len=b.dataset.len;document.querySelectorAll('[data-len]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));onSetting()}));
$('ancSel').addEventListener('change',e=>{C().anc=e.target.value;onSetting()});
$('nameIn').addEventListener('input',e=>{C().name=e.target.value.slice(0,24);onSetting()});
SLIDERS.forEach(x=>$(x).addEventListener('input',e=>{C().sl[x]=+e.target.value;outs();onSetting()}));
$('steady').addEventListener('input',e=>{STEADY=+e.target.value;try{localStorage.setItem('bm.steady',String(STEADY))}catch(er){}outs();onSetting()});
$('hiss').addEventListener('input',e=>{HISS=+e.target.value;try{localStorage.setItem('bm.hiss',String(HISS))}catch(er){}outs();onSetting()});
$('ambSel').addEventListener('change',e=>{AMB.type=e.target.value;if(AMB.type==='off')ambDown(.4);else if(P.owner==='result'&&P.buf)ambUp(Math.max(0,P.buf.duration-pPos()))}); // join a line that is already playing
$('ambLvl').addEventListener('input',e=>{AMB.lvl=+e.target.value;outs();if(AMB.gain&&AMB.src)AMB.gain.gain.setTargetAtTime(AMB.lvl*.55,ctx.currentTime,.05)});
$('dice').addEventListener('click',()=>{st.langSeed=Math.floor(Math.random()*1e6);LANG=makeLang(st.langSeed);refreshSide();checkStale()});
$('txt').addEventListener('input',checkStale);
$('txt').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();$('genBtn').click()}});
$('genBtn').onclick=async()=>{if(st.busy)return;if(P.owner==='result'){pStop();return}if(cur()&&cur().key===settingsKey()){await ready();playCur()}else generate(false)};
$('playBtn').onclick=async()=>{await ready();if(P.owner==='result'){pStop()}else playCur()};

$('dlBtn').onclick=()=>exportWav();
// examples dialog
function openExamples(){const l=$('exList');l.innerHTML='';[['general',t('ex.general')],['vemmo',t('ex.vemmo')]].forEach(([g,label])=>{const h=document.createElement('h3');h.textContent=label;l.appendChild(h);
  EXAMPLES.filter(x=>x.g===g).forEach(x=>{const b=document.createElement('button');b.type='button';const s=document.createElement('span');s.textContent=x.text[LANGUI];b.appendChild(s);
    if(x.v){const sm=document.createElement('small');sm.textContent=ENGINES.vemmo.voices[x.v].name+' · '+INTENTNAME[x.i][LI()];b.appendChild(sm)}
    b.onclick=()=>{$('txt').value=x.text[LANGUI];if(x.v&&st.engine==='vemmo'){const c=C();c.voice=x.v;c.intent=x.i;const p=ENGINES.vemmo.voices[x.v];SLIDERS.forEach(k=>c.sl[k]=p[k]);refreshSide();saveCfg()}$('exDlg').close();checkStale();$('txt').focus()};l.appendChild(b)})});
  $('exDlg').showModal()}
// "Use in your game": the web module call for what you hear now (module option names, only what differs from the voice)
const MOD_SLIDERS={pitch:'pitch',speed:'speed',expression:'expr',throat:'form',breath:'breath',brightness:'tilt'};
// (the fetch line below is text for the user's game, split so it is not mistaken for a request from this site)
function gameCode(){const c=C(),vo=voiceObj(),e=st.engine,o=[],q=x=>"'"+String(x).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";
  o.push('style: '+q(e));if(!vo.own)o.push('voice: '+q(c.voice));else o.push('ownVoice: me');
  if(e==='vemmo'){o.push('intent: '+q(c.intent));if(c.len==='medium')o.push("length: 'medium'")}
  else{const m=Object.keys(MOOD_ALIAS).find(k=>MOOD_ALIAS[k]===c.mood);if(m&&m!=='neutral')o.push('mood: '+q(m))}
  if(e==='name')o.push('name: '+q(nameFor()));
  if(e==='sim'||e==='echo'||e==='radio')o.push('seed: '+st.langSeed); // the same made-up language as here
  for(const [k,ik] of Object.entries(MOD_SLIDERS)){const v=+c.sl[ik];if(Math.abs(v-vo.preset[ik])>1e-6)o.push(k+': '+(+v.toFixed(2)))}
  if(HISS!==1)o.push('hiss: '+(+HISS.toFixed(2)));if(vo.own&&STEADY!==1)o.push('steady: '+(+STEADY.toFixed(2)));
  const url="'https://cdn.jsdelivr.net/gh/wrongfloor-dev/babble-engine@1/site/src/babble.mjs'",file=vo.own?(vo.own.name.replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase()||'voice')+'.babble-voice.json':''; // the name Export gives the file
  const line='play(render('+q(e==='vemmo'?'':$('txt').value.trim())+', { '+o.join(', ')+' }));';
  return vo.own?'import { render, play, loadVoice } from '+url+';\n\nconst me = loadVoice(await (await fetch'+'('+q(file)+')).text());\n'+line:'import { render, play } from '+url+';\n\n'+line}
$('codeBtn').onclick=()=>{$('codeTxt').textContent=gameCode();$('codeOwn').hidden=!voiceObj().own;$('codeOk').textContent='';$('codeDlg').showModal()};
$('codeClose').onclick=()=>$('codeDlg').close();
$('codeCopy').onclick=async()=>{const txt=$('codeTxt').textContent;let ok=false;try{await navigator.clipboard.writeText(txt);ok=true}catch(e){}
  if(!ok){const r=document.createRange();r.selectNodeContents($('codeTxt'));const sel=getSelection();sel.removeAllRanges();sel.addRange(r)} // no clipboard: select it for Ctrl+C
  $('codeOk').textContent=ok?t('code.copied'):''};
$('exBtn').onclick=openExamples;$('exClose').onclick=()=>$('exDlg').close();

// ---------- 3. voices storage (IndexedDB, this browser only) ----------
const DB={db:null};
// version 2 (2026-10-27) adds `scripts` and `takes` for the Script studio; `voices` stays as it was
function dbOpen(){return new Promise((res,rej)=>{try{const r=indexedDB.open('babble-machine',2);
  r.onupgradeneeded=()=>{const db=r.result,has=n=>db.objectStoreNames.contains(n);if(!has('voices'))db.createObjectStore('voices',{keyPath:'id'});
    if(!has('scripts'))db.createObjectStore('scripts',{keyPath:'id'});if(!has('takes'))db.createObjectStore('takes',{keyPath:'id'}).createIndex('script','script')};
  r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>db.close();res(db)};r.onerror=()=>rej(r.error)}catch(e){rej(e)}})}
async function dbAll(){const db=DB.db;return new Promise((res,rej)=>{const q=db.transaction('voices').objectStore('voices').getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function dbPut(v){const db=DB.db;if(!db)throw new Error('no storage');return new Promise((res,rej)=>{const tx=db.transaction('voices','readwrite');tx.objectStore('voices').put(v);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('aborted'))})}
async function dbDel(id){const db=DB.db;if(!db)return;return new Promise((res,rej)=>{const tx=db.transaction('voices','readwrite');tx.objectStore('voices').delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
const toStore=v=>({id:v.id,name:v.name,created:v.created,script:v.script,median:v.median,labeled:v.labeled,complete:v.complete,linesDone:v.linesDone,linesTotal:v.linesTotal,extra:!!v.extra,bloopa:!!v.bloopa,ends:!!v.ends,barks:!!v.barks,
  grains:v.grains.map(g=>{const x={d:g,c:g.c,v:g.v,pos:g.pos,f0:g.f0};if(g.k!==undefined)x.k=g.k;if(g.bark!==undefined)x.bark=g.bark;if(g.tail)x.tail=true;return x})});
const fromStore=r=>({...r,grains:r.grains.map(x=>{const g=x.d instanceof Float32Array?x.d:new Float32Array(x.d);g.c=x.c;g.v=x.v;g.pos=x.pos;g.f0=x.f0;if(x.k!==undefined)g.k=x.k;if(x.bark!==undefined)g.bark=x.bark;if(x.tail)g.tail=true;return g})});
DB.wait=(async()=>{try{DB.db=await dbOpen();const all=await dbAll();st.voices=all.map(fromStore).sort((a,b)=>a.created-b.created);st.storeOK=true}catch(e){st.storeOK=false}refreshSide();renderVoices();renderChars()})();
function renderVoices(){
  $('storeNote').textContent=st.storeOK===false?t('voices.session'):'';
  const l=$('vlist');l.innerHTML='';$('vEmpty').hidden=st.voices.length>0;
  st.voices.forEach(v=>{const row=document.createElement('div');row.className='vrow';
    const info=document.createElement('div');info.className='vinfo';const b=document.createElement('b');b.textContent=v.name;
    const tag=x=>{const s=document.createElement('span');s.className='tag';s.textContent=x;b.appendChild(s)};
    tag(v.script==='basis'?(v.extra?t('voices.deep'):t('voices.basis')):t('voices.old'));if(!v.complete)tag(t('voices.partial'));
    if(v.session){const t2=document.createElement('span');t2.className='tag';t2.textContent=t('voices.sessionTag');b.appendChild(t2)}
    const p=document.createElement('span');p.className='hint';p.textContent=t('voices.info',{n:v.grains.length,when:new Date(v.created).toLocaleDateString(LANGUI==='nl'?'nl-NL':'en-GB',{day:'numeric',month:'short',year:'numeric'})});
    info.appendChild(b);info.appendChild(p);row.appendChild(info);
    const act=document.createElement('div');act.className='vact';
    const mk=(lab,fn,cls)=>{const x=document.createElement('button');x.type='button';x.className='btn'+(cls?' '+cls:'');x.textContent=lab;x.onclick=fn;act.appendChild(x);return x};
    mk(t('voices.use'),()=>useVoice(v));mk(t('voices.export'),()=>exportVoice(v));
    if(v.script==='basis')mk(t('voices.redoBasis',{t:roundTime('basis')}),()=>openStudio(v.id,'basis'));
    if(v.script==='basis'&&!v.extra)mk(t('voices.deepen',{t:roundTime('extra')}),()=>openStudio(v.id,'extra'),'primary');
    if(v.script==='basis'&&!v.bloopa)mk(t('voices.addBloopa',{t:roundTime('bloopa')}),()=>openStudio(v.id,'bloopa'));
    if(v.script==='basis'&&!v.ends)mk(t('voices.addEnds',{t:roundTime('ends')}),()=>openStudio(v.id,'ends'));
    if(v.script==='basis'&&!v.barks)mk(t('voices.addBarks',{t:roundTime('barks')}),()=>openStudio(v.id,'barks'));
    mk(t('voices.rename'),()=>{info.innerHTML='';const inp=document.createElement('input');inp.type='text';inp.value=v.name;inp.setAttribute('aria-label',t('chk.name'));info.appendChild(inp);act.innerHTML='';
      mk(t('voices.save'),async()=>{const nm=inp.value.trim()||v.name;v.name=nm;try{if(!v.session)await dbPut(toStore(v))}catch(e){}renderVoices();refreshSide()},'primary');mk(t('voices.cancel'),()=>renderVoices());inp.focus()});
    mk(t('voices.delete'),()=>confirmDlg(t('voices.delTitle',{name:v.name}),t('voices.delText'),t('cf.del'),t('voices.cancel')).then(async ok=>{if(!ok)return;try{await dbDel(v.id)}catch(e){}st.voices=st.voices.filter(x=>x!==v);
      ENGINE_ORDER.forEach(e=>{if(st.cfg[e].voice==='own:'+v.id)st.cfg[e].voice=Object.keys(ENGINES[e].voices)[0]});saveCfg();renderVoices();refreshSide();checkStale()}));
    row.appendChild(act);l.appendChild(row)});
}
// a round recorded into a saved voice replaces the sounds it brings again (same labels) and keeps all others
const grainKey=g=>[g.bark,g.tail?1:0,g.c,g.v,g.k].join('|');
function mergeRound(old,add){const fresh=new Set(add.map(grainKey));return old.filter(g=>!fresh.has(grainKey(g))).concat(add)}
// the voice as a file for the web module (Babble.loadVoice) and later the Godot addon
async function exportVoice(v){await ready();const name=(v.name.replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase()||'voice')+'.babble-voice.json';
  const data=new TextEncoder().encode(JSON.stringify(voiceToFile(v,ctx.sampleRate)));
  try{if(DL)await DL.save({filename:name.replace(/\.json$/,'.zip'),data:new Blob([makeZip(name,data)])});else saveBlob(new Blob([data],{type:'application/json'}),name);say(t('voices.exported',{name}))}
  catch(e){say(t('voices.exportFail'))}}
function useVoice(v){showView('make');if(EMETA[st.engine].rec){C().voice='own:'+v.id;refreshSide();saveCfg();checkStale();$('voiceMsg').hidden=true}else{$('voiceMsg').textContent=t('voices.inUseIncompat',{name:v.name});$('voiceMsg').hidden=false}}
function confirmDlg(title,text,yes,no){return new Promise(res=>{$('cfTitle').textContent=title;$('cfText').textContent=text;$('cfYes').textContent=yes;$('cfNo').textContent=no;const d=$('cfDlg');
  const done=v=>{d.close();$('cfYes').onclick=$('cfNo').onclick=null;d.onclose=null;res(v)};$('cfYes').onclick=()=>done(true);$('cfNo').onclick=()=>done(false);d.onclose=()=>res(false);d.showModal();$('cfNo').focus()})}

// ---------- views ----------
function showView(v){
  pStop();if(v!=='script'&&typeof scStop==='function')scStop();st.view=v;$('viewMake').hidden=v!=='make';$('viewVoices').hidden=v!=='voices';$('viewStudio').hidden=v!=='studio';$('viewScript').hidden=v!=='script';
  $('mainTop').hidden=v==='studio';$('studioTop').hidden=v!=='studio';
  $('navMake').setAttribute('aria-current',v==='make'?'page':'false');$('navVoices').setAttribute('aria-current',v==='voices'?'page':'false');$('navScript').setAttribute('aria-current',v==='script'?'page':'false');
  document.body.classList.toggle('wide',v==='script');if(v!=='script')document.body.classList.remove('sc-focus');
  if(v==='voices')renderVoices();window.scrollTo(0,0);
}
$('navMake').onclick=()=>showView('make');$('navVoices').onclick=()=>showView('voices');$('navScript').onclick=()=>openScript();$('logoMain').onclick=()=>showView('make');
$('addVoice2').onclick=()=>openStudio();

// ---------- 4. studio ----------
const NOTES={low:130.8,mid:196,high:261.6};
const SS={step:1,script:'basis',target:null,tempo:'slow',note:'mid',guide:true,
  mic:{status:'idle',stream:null,deviceId:'',src:null,an:null,raf:0},
  rec:null,       // {sr, chunks:[], n, lines:[{a,b}|null], script}
  run:null,       // active prompter/recorder run
  result:null,    // analysis for the check screen
  upload:null,    // {pcm,sr} from a file
  dirty:false,saveMode:null};
function sc(){return buildScript(SS.script)}
// basic round for a new voice; the depth round (target = a saved voice) is added to that voice
function openStudio(target,kind){showView('studio');const tg=target&&st.voices.find(v=>v.id===target)?target:null,sk=tg?kind||'extra':'basis';if(tg!==SS.target||SS.script!==sk){SS.rec=null;SS.result=null}
  SS.target=tg;SS.script=sk;stStep(1);refreshPrep();$('stBack').focus()}
const roundTime=kind=>{const s=buildScript(kind),sch=studioSchedule(1,SS.tempo,kind),e0=sch.events[0];return fmtDur(sch.count*sch.beat+s.length*((e0.read-e0.guide)+sch.per*sch.I+sch.rest))};
function stStep(n){SS.step=n;$('spPrep').hidden=n!==1;$('spRec').hidden=n!==2;$('spCheck').hidden=n!==3;
  document.querySelectorAll('#stepper li').forEach(li=>{const s=+li.dataset.s;li.classList.toggle('cur',s===n);li.classList.toggle('done',s<n);if(s===n)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});
  $('stBack').innerHTML='';const sp=document.createElement('span');const recording=n===2&&SS.run&&!SS.run.done;sp.textContent=recording?'× '+t('st.close'):'‹ '+t('st.back');$('stBack').appendChild(sp)}
function refreshPrep(){
  const s=sc(),sch=studioSchedule(s.length,SS.tempo,SS.script);
  $('exChunk').textContent=s[0].map(x=>x.show).join(' · ');
  const tn={slow:t('prep.slow'),relaxed:t('prep.relaxed'),normal:t('prep.normal')}[SS.tempo],nn={low:t('prep.low'),mid:t('prep.mid'),high:t('prep.high')}[SS.note];
  const tv=SS.target&&st.voices.find(v=>v.id===SS.target);$('stRound').textContent=tv?t({basis:'prep.roundRedo',extra:'prep.roundX',bloopa:'prep.roundBloopa',ends:'prep.roundEnds',barks:'prep.roundBarks'}[SS.script],{name:tv.name}):t('prep.roundB');
  $('setTempo').value=SS.tempo;$('setNote').value=SS.note;$('setGuide').value=SS.guide?'on':'off';
  $('recSum').textContent=t('prep.sum',{tempo:tn.toLowerCase(),note:nn.toLowerCase(),guide:(SS.guide?t('prep.on'):t('prep.off')).toLowerCase()});
  const e0=sch.events[0],per=(SS.guide?e0.read-e0.guide:.5)+sch.per*sch.I+sch.rest; // same sum as lineDur() during the run
  $('recCalc').textContent=t('prep.calc',{n:s.length,k:s.flat().length,t:fmtDur(sch.count*sch.beat+s.length*per)});
  const sl=$('scriptList');sl.innerHTML='';s.forEach((ch,i)=>{const sp=document.createElement('span');sp.innerHTML='<i></i>';sp.querySelector('i').textContent=i+1;sp.appendChild(document.createTextNode(ch.map(x=>x.show).join('-')));sl.appendChild(sp)});
  micUI();
}
// --- microphone ---
function micUI(){
  const m=SS.mic,s=m.status;$('micAsk').hidden=s==='granted'||s==='asking';$('micAsk').textContent=(s==='idle')?t('prep.micAsk'):t('prep.micRetry');
  $('micMeterRow').hidden=s!=='granted';$('fMicSel').hidden=s!=='granted'||$('micSel').options.length<2;
  const msg={asking:t('prep.micAsking'),denied:t('prep.micDenied'),nodevice:t('prep.micNone'),busy:t('prep.micBusy'),unsupported:t('prep.micUnsupported')}[s]||'';
  $('micState').textContent=msg;$('micState').className=(s==='denied'||s==='nodevice'||s==='busy'||s==='unsupported')?'err':'hint';
  $('toRecord').disabled=s!=='granted';$('toRecHint').textContent=s==='granted'?'':t('prep.needMic');
  prepSteps();
}
// the four prepare steps: done ones get a tick, the first open one is highlighted (practice may be skipped)
function prepSteps(){const done={psMic:SS.mic.status==='granted',psListen:!!SS.heard,psPractice:!!SS.practiced,psRec:false};let cur=null;
  for(const id of ['psMic','psListen','psPractice','psRec']){const el=$(id);el.classList.toggle('done',done[id]);const c=!cur&&!done[id];if(c)cur=id;el.classList.toggle('cur',c);el.classList.toggle('todo',!done[id]&&!c)}}
function mkMeter(el){if(el.children.length)return;for(let i=0;i<30;i++)el.appendChild(document.createElement('i'))}
mkMeter($('meter1'));mkMeter($('meter2'));
async function micStart(){
  await ready();const m=SS.mic;micRelease();
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){m.status='unsupported';micUI();return false}
  m.status='asking';micUI();
  try{
    m.stream=await navigator.mediaDevices.getUserMedia({audio:{deviceId:m.deviceId?{exact:m.deviceId}:undefined,echoCancellation:false,noiseSuppression:false,autoGainControl:false}}); // the plain mic signal, like a sound recorder: no browser processing (headphones keep the guide tone out)
    m.status='granted';
    m.src=ctx.createMediaStreamSource(m.stream);m.an=ctx.createAnalyser();m.an.fftSize=1024;m.src.connect(m.an);m.sink=ctx.createGain();m.sink.gain.value=0;m.an.connect(m.sink);m.sink.connect(ctx.destination); // keep the meter pulled
    m.stream.getAudioTracks().forEach(tr=>tr.onended=()=>{if(SS.run&&SS.run.mode==='record'&&!SS.run.done){finishRun('miclost')}m.status='busy';micUI()});
    try{const devs=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audioinput');const sel=$('micSel');sel.innerHTML='';
      devs.forEach((d,i)=>{const o=document.createElement('option');o.value=d.deviceId;o.textContent=d.label||(t('prep.micLabel')+' '+(i+1));sel.appendChild(o)});
      const cur=m.stream.getAudioTracks()[0].getSettings().deviceId;if(cur)sel.value=cur}catch(e){}
    meterLoop();micUI();return true;
  }catch(e){
    const n=e&&e.name;m.status=(n==='NotAllowedError'||n==='SecurityError'||n==='PermissionDeniedError')?'denied':(n==='NotFoundError'||n==='OverconstrainedError'||n==='DevicesNotFoundError')?'nodevice':(n==='NotReadableError'||n==='AbortError'||n==='TrackStartError')?'busy':'denied';
    micUI();return false;
  }
}
function micRelease(){const m=SS.mic;cancelAnimationFrame(m.raf);if(m.src){try{m.src.disconnect()}catch(e){}}if(m.sink){try{m.sink.disconnect()}catch(e){}m.sink=null}if(m.stream)m.stream.getTracks().forEach(tr=>{tr.onended=null;tr.stop()});m.stream=null;m.src=null;m.an=null;if(m.status==='granted')m.status='idle'}
function meterLoop(){const m=SS.mic;if(!m.an)return;const d=new Float32Array(m.an.fftSize);
  const f=()=>{if(!m.an)return;m.an.getFloatTimeDomainData(d);let s=0;for(const v of d)s+=v*v;const rms=Math.sqrt(s/d.length),db=20*Math.log10(rms+1e-9),lvl=Math.max(0,Math.min(1,(db+60)/54)),n=Math.round(lvl*30);
    [$('meter1'),$('meter2')].forEach(el=>{for(let i=0;i<30;i++)el.children[i].classList.toggle('on',i<n)});
    $('micLevelTxt').textContent=rms>.01?t('prep.micSignal'):t('prep.micQuiet');m.raf=requestAnimationFrame(f)};f()}
$('micAsk').onclick=()=>micStart();
$('micSel').addEventListener('change',e=>{SS.mic.deviceId=e.target.value;micStart()});
// --- settings ---
$('setTempo').addEventListener('change',e=>{SS.tempo=e.target.value;refreshPrep()});
$('setNote').addEventListener('change',e=>{SS.note=e.target.value;refreshPrep()});
$('setGuide').addEventListener('change',e=>{SS.guide=e.target.value==='on';refreshPrep()});
$('showScript').onclick=()=>{const h=$('scriptList').hidden;$('scriptList').hidden=!h;$('showScript').setAttribute('aria-expanded',String(h));$('showScript').textContent=h?t('prep.hideScript'):t('prep.showScript')};
function hum(when,f,d,vol=.12,dest){const o=ctx.createOscillator(),g=ctx.createGain(),o2=ctx.createOscillator(),g2=ctx.createGain();o.frequency.value=f;o2.frequency.value=f*2;g2.gain.value=.15;
  g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vol,when+.06);g.gain.setValueAtTime(vol,when+d-.12);g.gain.linearRampToValueAtTime(0,when+d);
  o.connect(g);o2.connect(g2);g2.connect(g);g.connect(dest||ctx.destination);o.start(when);o2.start(when);o.stop(when+d+.02);o2.stop(when+d+.02);return [o,o2]}
function tick(when,hi){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=hi?1320:880;g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(.08,when+.005);g.gain.exponentialRampToValueAtTime(.0001,when+.08);o.connect(g);g.connect(ctx.destination);o.start(when);o.stop(when+.1);return o}
$('playNote').onclick=async()=>{await ready();hum(ctx.currentTime+.05,NOTES[SS.note],.8)};
// example: guide tone, then the four sounds at the real tempo, rendered by the synth
$('exPlay').onclick=async()=>{
  await ready();const sr=ctx.sampleRate,s=sc()[0],sch=studioSchedule(1,SS.tempo,SS.script),ev=sch.events[0],t0=ev.guide;
  const N=Math.ceil((ev.end-t0+.8)*sr),pcm=new Float32Array(N),f=NOTES[SS.note];
  if(SS.guide){const L=Math.floor(sch.guide*sr);for(let i=0;i<L;i++){const tt=i/sr,env=Math.min(1,tt/.06,(sch.guide-tt)/.12);pcm[i]+=(Math.sin(2*Math.PI*f*tt)+.15*Math.sin(4*Math.PI*f*tt))*.18*Math.max(0,env)}}
  const p=ENGINES.sim.voices.lottie;
  s.forEach((x,i)=>{const tk=(x.syls?x.syls.map(([c,v,k,a,b,h],j)=>({type:'syl',text:x.show,c,v,k,mel:[a,b],hold:h,stress:j===0,jit:.5})):[{type:'syl',text:x.show,c:x.c,v:x.v,k:x.k||'',jit:.5,stress:i===0}]).concat([{type:'punct',text:'.',mark:'.'}]);
    const r=renderSynth(tk,{engine:'sim',mood:'neutraal',P:f,S:1.15,E:.15,F:f<160?.92:1.08,breath:.12,tilt:.45,oq:p.oq,jit:1},sr).pcm;
    const o=Math.floor((ev.syl[i]-t0)*sr);for(let j=0;j<r.length&&o+j<N;j++)pcm[o+j]+=r[j]*.5});
  pPlay(bufFrom(pcm,sr),'example');SS.heard=true;prepSteps();
};
// --- record screen ---
function enterRec(mode,queue){
  SS.pending={mode,queue};stStep(2);$('recReady').hidden=false;$('recLive').hidden=true;$('recErr').hidden=true;
  const st0={record:t('rec.notStarted'),redo:t('rec.notStarted'),practice:t('rec.practice'),guide:t('rec.guide')}[mode];
  setRecStat(mode==='practice'||mode==='guide'?'':'idle',st0);$('recLine').textContent='';
  $('recReadyTxt').textContent=mode==='record'?t('rec.readyRec'):mode==='practice'?t('rec.readyPractice'):mode==='guide'?t('rec.readyGuide'):t('rec.readyRedo',{what:queue.length===1?t('rec.oneLine',{i:queue[0]+1}):t('rec.someLines',{n:queue.length})});
  $('recStart').textContent=mode==='practice'?t('rec.startPractice'):mode==='guide'?t('rec.startGuide'):t('rec.start');
  $('recStart').focus();
}
function setRecStat(kind,txt){$('recStat').className='stat'+(kind?' '+kind:'');$('recStatTxt').textContent=txt}
$('practice').onclick=()=>enterRec('practice',[0,1]);
$('toRecord').onclick=()=>enterRec('record',sc().map((_,i)=>i));
$('prompterOnly').onclick=()=>enterRec('guide',sc().map((_,i)=>i));
$('toUpload').onclick=()=>{stStep(3);showUpload()};
$('recStart').onclick=()=>startRun();
// recorder on the audio thread (AudioWorklet); ScriptProcessorNode only where worklets are missing, it can drop samples on a busy page
let recWorklet=null;
function loadRecWorklet(){if(!recWorklet&&ctx.audioWorklet)recWorklet=ctx.audioWorklet.addModule('src/rec-worklet.js').then(()=>true,()=>false);return recWorklet||Promise.resolve(false)}
async function startRun(){
  await ready();pStop();const {mode,queue}=SS.pending,recording=mode==='record'||mode==='redo';
  if(recording&&SS.mic.status!=='granted'){const ok=await micStart();if(!ok){$('recErr').textContent=$('micState').textContent;$('recErr').hidden=false;return}}
  const useWorklet=recording&&await loadRecWorklet();
  const sr=ctx.sampleRate;
  if(recording&&(!SS.rec||SS.rec.script!==SS.script||SS.rec.sr!==sr||mode==='record'&&SS.rec)){if(mode==='record'||!SS.rec)SS.rec={sr,chunks:[],n:0,lines:new Array(sc().length).fill(null),script:SS.script,tempo:SS.tempo}}
  const sch=studioSchedule(1,SS.tempo,SS.script);
  const run={mode,queue:queue.slice(),qi:0,I:sch.I,per:sch.per,guideDur:sch.guide,gap:sch.events[0].read-sch.events[0].guide,rest:sch.rest,done:false,paused:false,cur:null,osc:[],raf:0,proc:null,sessStart:0,sessBase:0,linesDone:0};
  SS.run=run;stStep(2);$('recReady').hidden=true;$('recLive').hidden=false;$('recMeterWrap').hidden=!recording;
  $('pauseBtn').textContent=t('rec.pause');$('redoBtn').hidden=false;
  if(recording){
    // capture raw samples; timeline = context time, which also freezes while paused (context suspended)
    const mute=ctx.createGain();mute.gain.value=0;mute.connect(ctx.destination);let p;
    run.sessBase=SS.rec.n;run.sessStart=-1;
    const take=(d,t0)=>{if(run.sessStart<0)run.sessStart=t0;SS.rec.chunks.push(d);SS.rec.n+=d.length};
    if(useWorklet){p=new AudioWorkletNode(ctx,'babble-recorder',{numberOfInputs:1,numberOfOutputs:1,channelCount:1,channelCountMode:'explicit'});
      p.port.onmessage=e=>{if(!run.done)take(e.data.d,e.data.t)}}
    else{p=ctx.createScriptProcessor(4096,1,1);p.onaudioprocess=ev=>{if(run.done)return;take(new Float32Array(ev.inputBuffer.getChannelData(0)),ctx.currentTime-ev.inputBuffer.duration)}}
    SS.mic.src.connect(p);p.connect(mute);
    run.proc=p;run.mute=mute;SS.dirty=true;setRecStat('rec',t('rec.recording'));say(t('rec.started'));
  }else setRecStat('',mode==='practice'?t('rec.practice'):t('rec.guide'));
  // count-in
  const now=ctx.currentTime+.25;for(let i=0;i<3;i++)run.osc.push(tick(now+i*.6,i===2));
  run.countEnd=now+1.8;scheduleLine(run.queue[0],run.countEnd);
  loop();stStep(2);
}
function scheduleLine(idx,at){
  const run=SS.run,f=NOTES[SS.note];run.osc.forEach(o=>{try{o.stop()}catch(e){}});run.osc=[];
  const g=at,r=g+(SS.guide?run.guideDur+run.gap:.5);
  run.cur={idx,guide:g,read:r,syl:Array.from({length:run.per},(_,i)=>r+i*run.I),end:r+run.per*run.I};
  if(SS.guide)run.osc.push(...hum(g,f,run.guideDur));
  drawLine(idx);
}
function ctxToSample(tt){const run=SS.run;return run.sessBase+Math.round((tt-run.sessStart)*SS.rec.sr)}
function drawLine(idx){const s=sc(),q=SS.run.queue,box=$('sylls');box.innerHTML='';s[idx].forEach(x=>{const sp=document.createElement('span');sp.textContent=x.show;box.appendChild(sp)});
  $('sylSr').textContent=s[idx].map(x=>x.show).join(' ');

  $('recLine').textContent=t('rec.line',{i:idx+1,n:s.length});say(t('rec.line',{i:idx+1,n:s.length}))}
function lineDur(){const r=SS.run;return (SS.guide?r.guideDur+r.gap:.5)+r.per*r.I+r.rest}
function loop(){
  const run=SS.run;if(!run||run.done)return;
  if(!run.paused){
    const tt=ctx.currentTime,ev=run.cur,els=$('sylls').children;
    if(tt<run.countEnd){$('countIn').hidden=false;$('countIn').textContent=String(Math.max(1,3-Math.floor((tt-(run.countEnd-1.8))/.6)));$('cue').textContent=t('rec.listen')}
    else{$('countIn').hidden=true;
      if(tt<ev.read){$('cue').textContent=SS.guide?t('rec.listen'):t('rec.wait')}
      else if(tt<ev.end+.15){$('cue').textContent=t('rec.speak')}
      else{$('cue').textContent=t('rec.wait')}
      for(let i=0;i<els.length;i++){const on=tt>=ev.syl[i]&&tt<ev.syl[i]+run.I*.92;els[i].classList.toggle('on',on);els[i].classList.toggle('done',tt>=ev.syl[i]+run.I*.92)}
      $('recHint').textContent=tt>ev.end+.15?t('rec.hintRest'):'';
      if(tt>=ev.end+run.rest){ // line complete
        if((run.mode==='record'||run.mode==='redo')&&run.sessStart>=0){SS.rec.lines[ev.idx]={a:Math.max(0,ctxToSample(ev.read-.25)),b:ctxToSample(ev.end+.55)}}
        run.linesDone++;run.qi++;
        if(run.qi>=run.queue.length){finishRun('end');return}
        scheduleLine(run.queue[run.qi],tt);
      }
    }
    const remainLines=run.queue.length-run.qi-1,inLine=Math.max(0,(run.cur.end+run.rest)-tt),remain=remainLines*lineDur()+inLine+(tt<run.countEnd?run.countEnd-tt:0);
    const total=run.queue.length*lineDur();$('pfill').style.width=Math.min(100,Math.max(0,(1-remain/total)*100))+'%';
    $('nextLine').textContent=t(remainLines?'rec.left':'rec.lastLeft',{t:fmtDur(remain)});
  }
  run.raf=requestAnimationFrame(loop);
}
$('pauseBtn').onclick=async()=>{
  const run=SS.run;if(!run||run.done)return;
  if(!run.paused){run.paused=true;run.osc.forEach(o=>{try{o.stop()}catch(e){}});run.osc=[];await ctx.suspend();
    $('pauseBtn').textContent=t('rec.resume');$('recHint').textContent=t('rec.hintPaused');if(run.mode==='record'||run.mode==='redo'){setRecStat('paused',t('rec.paused'));say(t('rec.pausedSr'))}
    [...$('sylls').children].forEach(e=>e.classList.remove('on'));}
  else{await ctx.resume();run.paused=false;$('pauseBtn').textContent=t('rec.pause');if(run.mode==='record'||run.mode==='redo')setRecStat('rec',t('rec.recording'));
    if(ctx.currentTime<run.countEnd)run.countEnd=ctx.currentTime+.6;scheduleLine(run.cur.idx,Math.max(ctx.currentTime+.5,run.countEnd))} // current line starts over: prompter, tone and recorder stay in step
};
$('redoBtn').onclick=()=>{const run=SS.run;if(!run||run.done||run.paused)return;if(ctx.currentTime<run.countEnd)return;scheduleLine(run.cur.idx,ctx.currentTime+.4)};
$('stopBtn').onclick=()=>finishRun('stop');
function teardownRun(){const run=SS.run;if(!run)return;run.done=true;cancelAnimationFrame(run.raf);run.osc.forEach(o=>{try{o.stop()}catch(e){}});
  if(run.proc){try{SS.mic.src&&SS.mic.src.disconnect(run.proc)}catch(e){}try{run.proc.disconnect();run.mute.disconnect()}catch(e){}
    if(run.proc.port){run.proc.port.onmessage=null;run.proc.port.postMessage('stop')}else run.proc.onaudioprocess=null}
  if(ctx&&ctx.state==='suspended')ctx.resume()}
function finishRun(why){
  const run=SS.run;if(!run||run.done)return;teardownRun();const mode=run.mode;SS.run=null;
  if(mode==='practice'){SS.practiced=true;stStep(1);refreshPrep();return}
  if(mode==='guide'){stStep(3);showUpload();return}
  micRelease();stStep(3);
  if(why==='miclost'){$('procErr').textContent=t('rec.micLost');$('procErr').hidden=false}
  analyzeRecording();
}
// --- analysis of in-app recordings (per line, using the windows the prompter recorded) ---
function recPcm(){const R=SS.rec,pcm=new Float32Array(R.n);let o=0;R.chunks.forEach(c=>{pcm.set(c,o);o+=c.length});return pcm}
function analyzeLines(pcm,sr,script,lines){
  const grains=[],chunkF0=[];let done=0;
  lines.forEach((w,ci)=>{
    if(!w){chunkF0.push(null);return}
    const A=Math.max(0,Math.min(pcm.length,w.a)),B=Math.max(A,Math.min(pcm.length,w.b));if(B-A<sr*.2){chunkF0.push(null);return}
    const seg=pcm.subarray(A,B),{e,hop}=envOf(seg,sr,5);let mx=0;for(const v of e)mx=Math.max(mx,v);if(mx<1e-3){chunkF0.push(null);return}
    const [a,b]=soundSpan(e);
    const parts=splitChunk(pcm,sr,A+a*hop,A+(b+1)*hop,script[ci].length,!!script[ci][0].vc),fs=[];
    parts.forEach(([x,y],pi)=>{const g=pcm.slice(x,y);let m=0;for(const v of g)m=Math.max(m,Math.abs(v));if(m<1e-4)return;for(let i=0;i<g.length;i++)g[i]/=m;
      const it=script[ci][pi];if(it.bark!==undefined)g.bark=it.bark;else{g.c=it.c;g.v=it.v;if(it.k!==undefined)g.k=it.k;if(it.vc)g.tail=true}g.pos=pi;g.f0=estimateF0(g,sr);if(g.f0)fs.push(g.f0);grains.push(g)});
    fs.sort((p,q)=>p-q);chunkF0.push(fs.length?fs[fs.length>>1]:0);done++;
  });
  const all=grains.filter(g=>!g.bark).map(g=>g.f0).filter(Boolean).sort((p,q)=>p-q),median=all.length?all[all.length>>1]:180;
  grains.forEach(g=>{if(!g.bark&&(!g.f0||Math.abs(12*Math.log2(g.f0/median))>9))g.f0=median});
  return {ok:done>0,grains,chunkF0,median,linesDone:done,linesTotal:lines.length,labeled:true};
}
function analyzeRecording(){
  $('upBox').hidden=true;$('checkBody').hidden=true;$('procBox').hidden=false;
  setTimeout(()=>{
    const R=SS.rec,pcm=recPcm(),script=buildScript(R.script),res=analyzeLines(pcm,R.sr,script,R.lines);
    SS.result={...res,pcm,sr:R.sr,script:R.script,source:'mic',lines:R.lines.map(w=>!!w)};
    $('procBox').hidden=true;
    if(!res.ok){$('procErr').textContent=R.lines.some(Boolean)?t('chk.tooLittle'):t('chk.noLines');$('procErr').hidden=false;$('checkBody').hidden=true;$('upBox').hidden=false;return}
    showCheck();
  },30);
}
// --- upload route ---
function showUpload(){$('upBox').hidden=false;$('checkBody').hidden=true;$('procErr').hidden=true;$('procBox').hidden=true;$('file').value='';$('file').focus()}
$('file').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;await ready();$('procErr').hidden=true;$('procBox').hidden=false;$('checkBody').hidden=true;
  const tooLong=()=>{$('procBox').hidden=true;$('procErr').textContent=t('chk.tooBig');$('procErr').hidden=false};
  if(f.size>200*1024*1024)return tooLong();
  const dur=await new Promise(res=>{const u=URL.createObjectURL(f),a=new Audio();const done=d=>{URL.revokeObjectURL(u);res(d)};
    a.preload='metadata';a.onloadedmetadata=()=>done(a.duration);a.onerror=()=>done(NaN);setTimeout(()=>done(NaN),5000);a.src=u});
  if(isFinite(dur)&&dur>15*60)return tooLong();
  try{
    const b=await ctx.decodeAudioData(await f.arrayBuffer()),n=b.length,mono=new Float32Array(n);for(let c=0;c<b.numberOfChannels;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)mono[i]+=d[i]/b.numberOfChannels}
    setTimeout(()=>{
      let script=SS.script,res=analyzeScriptRecording(mono,b.sampleRate,script,null);
      if(!res.ok&&!SS.target)for(const other of ['algemeen','vemmo']){const r2=analyzeScriptRecording(mono,b.sampleRate,other,null);if(r2.ok){res=r2;script=other;break}}
      $('procBox').hidden=true;
      if(res.ok){SS.result={ok:true,grains:res.grains,chunkF0:res.chunkF0,median:res.median,linesDone:res.expected,linesTotal:res.expected,labeled:true,pcm:mono,sr:b.sampleRate,script,source:'file',lines:new Array(res.expected).fill(true)}}
      else{const g=analyzeGrains(mono,b.sampleRate);
        if(g.length<4){$('procErr').textContent=t('chk.tooLittle');$('procErr').hidden=false;return}
        const fs=[];g.forEach(x=>{x.f0=estimateF0(x,b.sampleRate);if(x.f0)fs.push(x.f0)});fs.sort((p,q)=>p-q);const med=fs.length?fs[fs.length>>1]:180;g.forEach(x=>{if(!x.f0)x.f0=med});
        SS.result={ok:true,grains:g,chunkF0:[],median:med,linesDone:0,linesTotal:0,labeled:false,pcm:mono,sr:b.sampleRate,script,source:'file',lines:[]}}
      SS.dirty=true;showCheck();
    },30);
  }catch(err){$('procBox').hidden=true;$('procErr').textContent=t('chk.badFile');$('procErr').hidden=false}
});
// --- check screen ---
function showCheck(){
  const R=SS.result;$('checkBody').hidden=false;const tv=SS.target&&st.voices.find(v=>v.id===SS.target);
  $('fVoiceName').hidden=!!tv;$('saveVoice').textContent=tv?t('chk.saveX',{name:tv.name}):t('chk.save');if(tv)$('sessionOnly').hidden=true;$('upBox').hidden=R.source!=='file'?true:false;
  const partial=R.labeled&&R.linesDone<R.linesTotal;
  $('partialNote').hidden=!(partial||!R.labeled);$('partialNote').textContent=!R.labeled?t('chk.unlabeled'):t('chk.partial',{d:R.linesDone,t:R.linesTotal});
  $('recDur').textContent=fmtDur(R.pcm.length/R.sr);$('recPlay').textContent=t('chk.play');drawWave($('recWave'),R.pcm,0);
  // lines
  const ul=$('lineList');ul.innerHTML='';const script=buildScript(R.script),canRec=R.source==='mic';$('dLines').hidden=!R.labeled;
  script.forEach((ch,i)=>{const li=document.createElement('li');const ok=R.lines[i];
    li.innerHTML='<span class="ln"></span><span class="lt"></span><span class="ls"></span>';li.querySelector('.ln').textContent=i+1;li.querySelector('.lt').textContent=ch.map(x=>x.show).join('-');
    const ls=li.querySelector('.ls');ls.textContent=ok?'✓ '+t('chk.lineOk'):'– '+t('chk.lineMiss');ls.classList.add(ok?'ok':'miss');
    if(ok&&canRec){const w=SS.rec.lines[i],pb=document.createElement('button');pb.className='btn';pb.textContent=t('chk.linePlay');pb.onclick=async()=>{await ready();pPlay(bufFrom(R.pcm.slice(w.a,Math.min(R.pcm.length,w.b)),R.sr),'line')};li.appendChild(pb)}
    if(canRec){const rb=document.createElement('button');rb.className='btn';rb.textContent=ok?t('chk.lineRedo'):t('chk.lineRec');rb.onclick=()=>{pStop();enterRec('redo',[i])};li.appendChild(rb)}
    ul.appendChild(li)});
  $('recMissing').hidden=!(canRec&&partial);
  // preview
  const pe=$('prevEngine');if(pe.options.length!==ENGINE_ORDER.filter(x=>EMETA[x].rec).length){pe.innerHTML='';ENGINE_ORDER.filter(x=>EMETA[x].rec).forEach(x=>{const o=document.createElement('option');o.value=x;o.textContent=EMETA[x].name;pe.appendChild(o)})}pe.value=EMETA[st.engine].rec?st.engine:'sim';SS.preview=null;$('prevText').textContent='';$('prevDur').textContent='';$('prevPlay').textContent=t('chk.prevPlay');const pc=$('prevWave');pc.getContext('2d').clearRect(0,0,pc.width,pc.height);
  if(!$('voiceName').value)$('voiceName').value=uniqueName();
  $('saveErr').hidden=true;$('sessionOnly').hidden=true;$('saveHint').textContent=EMETA[st.engine].rec?t('chk.saveHint'):t('chk.saveHintIncompat');
  $('checkBody').querySelector('h3').focus&&0;
}
function uniqueName(){const base=t('chk.nameDefault');let n=base,i=2;while(st.voices.some(v=>v.name===n))n=base+' '+(i++);return n}
$('recMissing').onclick=()=>{const R=SS.result;enterRec('redo',R.lines.map((ok,i)=>ok?-1:i).filter(i=>i>=0))};
$('recPlay').onclick=async()=>{await ready();const R=SS.result;if(P.owner==='recording'){const pos=pPos();pStop(true);P.offset=pos;$('recPlay').textContent=t('chk.play');return}
  const buf=SS._recBuf&&SS._recBuf.src===R.pcm?SS._recBuf.b:(SS._recBuf={src:R.pcm,b:bufFrom(R.pcm,R.sr)}).b;
  const from=P.offset&&P.offset<buf.duration-.05?P.offset:0;$('recPlay').textContent=t('chk.pause');
  pPlay(buf,'recording',{dest:ctx.destination,from,onTick:pos=>drawWave($('recWave'),R.pcm,pos/buf.duration),onend:(o,natural)=>{$('recPlay').textContent=t('chk.play');if(natural){P.offset=0;drawWave($('recWave'),R.pcm,0)}}})};
$('prevEngine').addEventListener('change',()=>{SS.preview=null;pStop()});
$('prevPlay').onclick=async()=>{
  if(P.owner==='preview'){pStop();return}
  await ready();const R=SS.result,e=$('prevEngine').value,sr=ctx.sampleRate,base=ENGINES[e].voices[Object.keys(ENGINES[e].voices)[0]];
  let toks;if(e==='vemmo')toks=vemmoClip(st.cfg.vemmo.intent,'medium',Math.floor(Math.random()*1e6),'auto');
  else toks=textToks(e,$('txt').value||EXAMPLES[0].text[LANGUI],st.langSeed,paletteLang(e)||LANG,{name:$('voiceName').value.trim()||base.name,mood:'neutraal'});
  const o={engine:e,mood:e==='vemmo'?st.cfg.vemmo.intent:'neutraal',P:base.pitch,S:base.speed,E:base.expr,F:1,breath:0,tilt:base.tilt,oq:base.oq,jit:base.jit,rate:base.rate||1,base:base.pitch,recF0:R.median,steady:STEADY};
  const tv=SS.target&&st.voices.find(v=>v.id===SS.target),gr=tv?mergeRound(tv.grains,R.grains):R.grains;if(tv)o.recF0=tv.median; // depth round: hear the whole voice
  let r=renderSample(toks.map(x=>({...x})),gr,o,sr);if(e==='ghost')r=ghostFX(r,sr);if(FX[e]){const f=postFX(FX[e],r.pcm,sr,HISS);let m=0;for(const v of f.pcm)m=Math.max(m,Math.abs(v));if(m>0)for(let i=0;i<f.pcm.length;i++)f.pcm[i]*=.85/m;r={pcm:f.pcm,marks:r.marks}}
  const buf=bufFrom(r.pcm,sr);
  $('prevText').textContent=toks.map(x=>x.text).join('');$('prevDur').textContent=fmtDur(buf.duration);if(wet)wet.gain.value=wetFor(e);
  $('prevPlay').textContent=t('make.stopPlay');pPlay(buf,'preview',{onTick:pos=>drawWave($('prevWave'),r.pcm,pos/buf.duration),onend:()=>{$('prevPlay').textContent=t('chk.prevPlay');drawWave($('prevWave'),r.pcm,0)}});
};
$('again').onclick=()=>{pStop();SS.result=null;SS.rec=null;stStep(1);refreshPrep()};
async function saveVoice(sessionOnly){
  const R=SS.result;if(!R)return;
  const tv=SS.target&&st.voices.find(v=>v.id===SS.target);
  if(tv){ // depth round: add the new sounds to the existing voice
    const all=mergeRound(tv.grains,R.grains),fs=all.filter(g=>!g.bark).map(g=>g.f0).filter(Boolean).sort((a,b)=>a-b);
    const nv={...tv,grains:all,median:fs.length?fs[fs.length>>1]:tv.median};if(SS.script!=='basis')nv[SS.script]=true;
    if(!tv.session){try{if(!DB.db)throw new Error(LANGUI==='nl'?'geen opslag beschikbaar':'no storage available');await dbPut(toStore(nv))}catch(e){$('saveErr').textContent=t('chk.saveFail',{m:(e&&e.message)||'?'});$('saveErr').hidden=false;return}}
    Object.assign(tv,nv);SS.dirty=false;SS.result=null;SS.rec=null;SS.target=null;SS.script='basis';showView('make');refreshSide();renderVoices();
    $('voiceMsg').textContent=t('side.savedX',{name:tv.name});$('voiceMsg').hidden=false;checkStale();say($('voiceMsg').textContent);return}const name=$('voiceName').value.trim()||uniqueName();
  const v={id:'v'+Date.now().toString(36)+Math.floor(Math.random()*1e4),name,created:Date.now(),script:R.script,median:R.median,labeled:R.labeled,
    complete:!R.labeled||R.linesDone>=R.linesTotal,linesDone:R.linesDone,linesTotal:R.linesTotal,grains:R.grains};
  if(!R.labeled)v.complete=true;
  if(!sessionOnly){try{if(!DB.db)throw new Error(LANGUI==='nl'?'geen opslag beschikbaar':'no storage available');await dbPut(toStore(v))}catch(e){$('saveErr').textContent=t('chk.saveFail',{m:(e&&e.message)||'?'});$('saveErr').hidden=false;$('sessionOnly').hidden=false;return}}
  else v.session=true;
  st.voices.push(v);SS.dirty=false;SS.result=null;SS.rec=null;$('voiceName').value='';
  showView('make');
  if(EMETA[st.engine].rec){const c=C();c.voice='own:'+v.id;const p=ENGINES[st.engine].voices[Object.keys(ENGINES[st.engine].voices)[0]];SLIDERS.forEach(x=>c.sl[x]=p[x]);saveCfg();refreshSide();
    $('voiceMsg').textContent=t('side.savedSel',{name});}else{refreshSide();$('voiceMsg').textContent=t('side.saved',{name})}
  if(v.script==='basis')$('voiceMsg').textContent+=' '+t('side.depthTip',{t:roundTime('extra')});renderVoices();
  $('voiceMsg').hidden=false;checkStale();say($('voiceMsg').textContent);
}
$('saveVoice').onclick=()=>saveVoice(false);$('sessionOnly').onclick=()=>saveVoice(true);
// leaving the studio
async function leaveStudio(){
  const recordingNow=SS.run&&!SS.run.done&&(SS.run.mode==='record'||SS.run.mode==='redo');
  if(SS.dirty||recordingNow){const wasPaused=SS.run&&SS.run.paused;if(recordingNow&&!wasPaused)$('pauseBtn').click();
    const ok=await confirmDlg(t('cf.leaveTitle'),t('cf.leaveText'),t('cf.leaveYes'),t('cf.leaveNo'));if(!ok)return}
  if(SS.run){teardownRun();SS.run=null}micRelease();SS.dirty=false;SS.result=null;SS.rec=null;showView('make');
}
$('stBack').onclick=leaveStudio;$('logoStudio').onclick=leaveStudio;
window.addEventListener('beforeunload',e=>{if(SS.dirty){e.preventDefault();e.returnValue=''}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&P.src)pStop()});

// ---------- 5. script (Studio): lines per scene, a prompter that follows you, takes per line ----------
// The model and the audio steps live in script.js (BabbleScript); this part is the screen and the recorder.
const SCR=BabbleScript;
const SC={list:[],doc:null,takes:{},cur:null,edit:null,fileFor:null,sess:null,sps:{},speech:{},saveT:0,mem:false,loaded:null,drag:null};
const norm=x=>String(x||'').replace(/\s+/g,' ').trim();
// storage: the whole script in `scripts`, every take (audio as Float32Array) in `takes`
function dbReq(store,mode,fn){const db=DB.db;if(!db)return Promise.reject(new Error('no storage'));
  return new Promise((res,rej)=>{const tx=db.transaction(store,mode);let out;const r=fn(tx.objectStore(store));if(r)r.onsuccess=()=>{out=r.result};tx.oncomplete=()=>res(out);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('aborted'))})}
function storeErr(e){const full=e&&(e.name==='QuotaExceededError'||/quota/i.test(e.message||''));$('scStoreErr').textContent=full?t('sc.storeFull'):t('sc.saveFail',{m:(e&&e.message)||'?'});$('scStoreErr').hidden=false}
function storeOk(){if(!SC.mem)$('scStoreErr').hidden=true}
function saveDoc(now){const s=SC.doc;if(!s)return;s.updated=Date.now();clearTimeout(SC.saveT);if(!DB.db)return;
  const go=()=>dbReq('scripts','readwrite',o=>o.put(JSON.parse(JSON.stringify(s)))).then(storeOk,storeErr);if(now)go();else SC.saveT=setTimeout(go,400)}
const delTakes=ids=>DB.db&&ids.length?dbReq('takes','readwrite',o=>{ids.forEach(id=>o.delete(id))}).catch(storeErr):Promise.resolve();
function scLoad(){return SC.loaded||(SC.loaded=(async()=>{await DB.wait;
  if(DB.db){try{SC.list=(await dbReq('scripts','readonly',o=>o.getAll()))||[]}catch(e){SC.list=[]}}else SC.mem=true;
  SC.list.sort((a,b)=>a.created-b.created);let id=null;try{id=localStorage.getItem('bm.script')}catch(e){}
  const s=SC.list.find(x=>x.id===id)||SC.list[SC.list.length-1];if(s)await scOpenDoc(s);else await scNewDoc()})())}
async function scOpenDoc(s){scStop();SCR.tidy(s);SC.doc=s;SC.takes={};try{localStorage.setItem('bm.script',s.id)}catch(e){}
  if(DB.db){try{((await dbReq('takes','readonly',o=>o.index('script').getAll(s.id)))||[]).forEach(x=>SC.takes[x.id]=x)}catch(e){}}
  const L=SCR.ordered(s);SC.cur=(L.find(l=>SCR.needsTake(l,SC.takes,s))||L[0]||{}).id||null}
async function scNewDoc(){const s=SCR.newScript('',LANGUI,t('sc.sceneN',{n:1}));SC.list.push(s);await scOpenDoc(s);scAddChar();saveDoc(true)}
async function openScript(){showView('script');await scLoad();scRender();scWidths();scSpeechCheck()}
// characters keep one colour (cc0–cc7), also after others are deleted
function scAddChar(){const s=SC.doc,used=new Set(s.characters.map(c=>c.color));let k=0;while(used.has(k)&&k<8)k++;
  const c=SCR.newCharacter(t('sc.charN',{n:s.characters.length+1}));c.color=k<8?k:s.characters.length%8;s.characters.push(c);saveDoc();return c}
const charOf=id=>SC.doc.characters.find(c=>c.id===id);
const ccOf=c=>c?'cc'+(c.color%8):'';
const charName=c=>c?(c.name.trim()||t('sc.charN',{n:SC.doc.characters.indexOf(c)+1})):t('sc.nobody');
const scLine=()=>SC.doc&&SC.doc.lines.find(l=>l.id===SC.cur);
const scTakesOf=l=>Object.values(SC.takes).filter(x=>x.line===l.id).sort((a,b)=>a.created-b.created);
function mkBtn(cls,txt,label){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=txt;if(label){b.setAttribute('aria-label',label);b.title=label}return b}
const tkId=()=>'t'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);
const elx=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
// recorded / to record, for the whole script or some of its lines (only lines with words to speak count)
function scCounts(f){const s=SC.doc,o={rec:0,done:0,redo:0};s.lines.forEach(l=>{if((f&&!f(l))||!norm(SCR.recText(s,l)))return;o.rec++;const k=SCR.lineStatus(l,SC.takes,s);if(k==='done')o.done++;else if(k==='redo')o.redo++});return o}
function scBar(c){const b=elx('span','sc-bar');b.setAttribute('aria-hidden','true');const d=elx('i','d'),r=elx('i','r');d.style.width=c.done/(c.rec||1)*100+'%';r.style.width=c.redo/(c.rec||1)*100+'%';b.append(d,r);return b}
const SVG={done:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>',redo:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.5 8a4.5 4.5 0 1 1-1.4-3.3M12 2v3h-3"/></svg>',todo:''};
function scBadge(k){const b=elx('span','badge '+k);b.setAttribute('aria-hidden','true');b.innerHTML=SVG[k]||'';return b}
// the other scripts: a list under "Scripts (n)", the open one marked
function scSelUI(){const s=SC.doc,sel=$('scSel');sel.innerHTML='';
  const head=elx('option','',t('sc.scripts',{n:SC.list.length}));head.value='';head.disabled=true;sel.appendChild(head);
  SC.list.forEach(x=>{const o=elx('option','',(x===s?'• ':'')+(x.title.trim()||t('sc.untitled')));o.value=x.id;sel.appendChild(o)});sel.value=''}
function scRender(){const s=SC.doc;if(!s)return;scSelUI();if(!SC.sess)scNote('');
  $('scTitle').value=s.title;$('scTitle').placeholder=t('sc.untitled');
  document.querySelectorAll('[data-sclang]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.sclang===s.lang)));
  document.querySelectorAll('#viewScript .sc-plus').forEach(b=>b.title=b.getAttribute('aria-label'));
  if(SC.mem){$('scStoreErr').textContent=t('sc.noStore');$('scStoreErr').hidden=false}
  scRenderDoc();scPrompt()}
// progress in the header, scenes and characters on the left, the summary per scene: all from the same counts
function scCountsUI(){const s=SC.doc;if(!s)return;const a=scCounts(),pg=$('scProg');pg.innerHTML='';
  if(a.rec){const sp=elx('span');sp.append(elx('b','',String(a.done)),' '+t('sc.ofRec',{m:a.rec}));pg.append(sp,scBar(a))}
  const groups=SCR.scenesOf(s),cl=scLine(),ul=$('scScenes');ul.innerHTML='';
  groups.forEach((g,gi)=>{const li=elx('li'),a2=elx('a',cl&&cl.scene===g.name?'on':'');a2.href='#scS'+gi;const c=scCounts(l=>l.scene===g.name);
    a2.append(elx('span','',g.name||t('sc.sceneN',{n:gi+1})),elx('span','n',c.rec?c.done+'/'+c.rec:''));
    a2.onclick=e=>{e.preventDefault();const sec=$('scS'+gi);if(sec)sec.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})};
    li.append(a2,scMenu('scMS'+gi,t('sc.sceneMenu',{name:g.name||t('sc.sceneN',{n:gi+1})}),[
      [t('sc.rename'),()=>{const n=document.querySelector('#scS'+gi+' .sc-sname');if(n){n.focus();n.select()}}],
      gi>0&&[t('sc.up'),()=>scMoveScene(g.name,-1)],gi<groups.length-1&&[t('sc.down'),()=>scMoveScene(g.name,1)],'-',
      [t('sc.delSceneDots'),()=>scDelScene(g.name),'danger']]));ul.appendChild(li)});
  const wb=$('scWho');wb.innerHTML='';
  s.characters.forEach(ch=>{const c=scCounts(l=>l.character===ch.id),b=elx('button','sc-who '+ccOf(ch));b.type='button';b.title=t('sc.charSettings',{name:charName(ch)});
    const top=elx('div','wt');top.append(elx('b','',charName(ch)));if(c.rec)top.append(elx('span','n',c.done+'/'+c.rec));
    const fx=SCR.fxOf(ch),fp=SCR.fxPreset(fx);b.append(top,elx('small','',(ch.kind==='babble'?'♪ '+EMETA[ch.style].name:t('sc.kRecord'))+(SCR.fxOn(fx)?' · '+t(fp?'fx.'+fp:'fx.custom'):'')));if(c.rec)b.append(scBar(c));b.onclick=()=>openChars(ch.id);wb.appendChild(b)});
  document.querySelectorAll('#scDoc .sc-scene').forEach(sec=>{const g=groups[+sec.dataset.i];if(!g)return;const c=scCounts(l=>l.scene===g.name),sm=sec.querySelector('.sum');sm.innerHTML='';
    sm.className='sum'+(c.rec&&c.done===c.rec?' all':'');if(!c.rec)sm.textContent=g.lines.length?'♪ '+t('sc.babOnly'):'';else if(c.done===c.rec)sm.append(scBadge('done'),t('sc.allRec'));else sm.textContent=c.done+' '+t('sc.ofRec',{m:c.rec})})}
// a ⋯ button with its menu; items are [label, action, class] or '-' for a line
function scMenu(id,label,items){const w=elx('span','mwrap'),b=elx('button','more','⋯');b.type='button';b.dataset.menu=id;b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label',label);b.title=label;
  const m=elx('div','menu');m.id=id;m.setAttribute('role','menu');
  items.filter(Boolean).forEach(x=>{if(x==='-'){m.appendChild(elx('hr'));return}const i=elx('button',x[2]||'',x[0]);i.type='button';i.setAttribute('role','menuitem');i.onclick=()=>{menuClose();x[1]()};m.appendChild(i)});
  w.append(b,m);return w}
function menuClose(keep){document.querySelectorAll('#viewScript .menu.open').forEach(m=>{if(m.id===keep)return;m.classList.remove('open');const b=document.querySelector('[data-menu="'+m.id+'"]');if(b)b.setAttribute('aria-expanded','false')})}
document.addEventListener('click',e=>{if(st.view!=='script')return;const b=e.target.closest('[data-menu]');menuClose(b&&b.dataset.menu);
  if(b){const m=$(b.dataset.menu),o=m.classList.toggle('open');b.setAttribute('aria-expanded',String(o));if(o&&e.detail===0){const f=m.querySelector('button');if(f)f.focus()}}});
// --- the script as a document: scenes as headings; each line reads as text, the one you work on opens with its controls ---
function scRenderDoc(focus){const s=SC.doc,box=$('scDoc'),groups=SCR.scenesOf(s);box.innerHTML='';const empty=!s.lines.length&&groups.length<2;$('scEmpty').hidden=!empty;$('scAddScene').hidden=empty;
  box.classList.toggle('only',$('scOnly').checked);let n=0;
  if(!empty)groups.forEach((g,gi)=>{const sec=elx('section','sc-scene');sec.id='scS'+gi;sec.dataset.i=gi;const h=elx('h3');
    const nm=elx('input','sc-sname');nm.type='text';nm.value=g.name;nm.placeholder=t('sc.sceneN',{n:gi+1});nm.setAttribute('aria-label',t('sc.sceneName'));
    nm.onchange=()=>{if(SCR.renameScene(s,g.name,nm.value.trim())){saveDoc();scRenderDoc()}else nm.value=g.name};
    nm.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();nm.blur()}};
    h.append(nm,scMenu('scMH'+gi,t('sc.sceneMenu',{name:g.name||nm.placeholder}),[[t('sc.rename'),()=>{nm.focus();nm.select()}],[t('sc.sceneBelow'),()=>scNewScene(gi+1)],'-',[t('sc.delSceneDots'),()=>scDelScene(g.name),'danger']]),elx('span','sum'));
    const ol=elx('ol','sc-lines');g.lines.forEach(l=>ol.appendChild(scRow(l,++n)));
    const add=elx('button','sc-pill','+ '+t('sc.addLine'));add.type='button';add.onclick=()=>scAddLine(g.name,g.lines[g.lines.length-1]);
    add.addEventListener('dragover',e=>{if(SC.drag){e.preventDefault();clearDrop();sec.classList.add('drop-end')}});add.addEventListener('drop',e=>{if(!SC.drag)return;e.preventDefault();clearDrop();scDrop(null,g.name)});
    sec.append(h,ol,add);box.appendChild(sec)});
  scCountsUI();fitAll();
  if(focus){const el=box.querySelector('[data-id="'+focus.id+'"] '+(focus.el||'.sc-txt'));if(el){el.focus();if(el.setSelectionRange&&focus.end!=null){const p=focus.end===true?el.value.length:focus.end;el.setSelectionRange(p,p)}}}}
const fit=tx=>{tx.style.height='auto';tx.style.height=tx.scrollHeight+'px'};
function fitAll(){requestAnimationFrame(()=>document.querySelectorAll('#scDoc .sc-txt').forEach(fit))}
function fillWho(sel,l){sel.innerHTML='';const add=(v,txt)=>{const o=elx('option','',txt);o.value=v;sel.appendChild(o)};
  SC.doc.characters.forEach(c=>add(c.id,charName(c)));add('',t('sc.nobody'));add('+new',t('sc.newChar'));sel.value=charOf(l.character)?l.character:''}
// status: badge and word (✓ recorded, ↻ redo, ○ to record, ♪ babble), and ▶ for a line that has sound
function scStatusEl(el,l){const s=SC.doc,k=SCR.lineStatus(l,SC.takes,s);el.className='ln-st '+k;el.innerHTML='';el.title=k==='redo'?t('sc.redoTip'):'';
  const stl=elx('span','stl');if(k==='babble')stl.append(elx('span','badge','♪'));else stl.append(scBadge(k));
  stl.append({todo:t('sc.stTodo'),done:t('sc.stDone'),redo:t('sc.stRedo'),babble:t('sc.stBabble')}[k]);el.appendChild(stl);
  const bab=SCR.kindOf(s,l)==='babble',tk=l.take&&SC.takes[l.take];
  if(bab&&(norm(SCR.plain(l.text))||babbleStyle(l)==='vemmo')||(!bab&&tk)){const lab=tk&&!bab?'▶ '+tk.dur.toFixed(1)+' s':'▶',pb=elx('button','ln-play',P.owner===(bab?'bab:'+l.id:'take:'+(tk&&tk.id))?'■':lab);
    pb.type='button';pb.setAttribute('aria-label',t('sc.playLine'));pb.onclick=e=>{e.stopPropagation();scPlayLine(l,on=>{pb.textContent=on?'■':lab})};el.appendChild(pb)}
  const li=el.closest('.ln');if(li)li.classList.toggle('need',SCR.needsTake(l,SC.takes,s))}
const babbleStyle=l=>{const c=charOf(l.character);return c&&c.style};
function scLineStatus(l){const el=document.querySelector('#scDoc [data-id="'+l.id+'"] .ln-st');if(el)scStatusEl(el,l);scCountsUI()}
// ▶ in the document: a babble or mixed line plays with its babble, a recorded line plays its chosen take with the character's sound
async function scPlayLine(l,on){if(SCR.kindOf(SC.doc,l)==='babble')return scPlayBabble(l,on);const tk=l.take&&SC.takes[l.take];if(!tk)return;
  if(P.owner==='take:'+tk.id){pStop();return}await ready();const buf=await scTakeBuf(tk);pPlay(buf,'take:'+tk.id,{dest:ctx.destination,onend:()=>on(false)});on(true)}
// a take with its character's sound: pitch and effect (script.js), then the room mixed in offline (same room as the make screen)
const FXB=new Map();
async function scTakeBuf(tk){const l=SC.doc.lines.find(x=>x.id===tk.line),fx=SCR.fxOf(l&&charOf(l.character)),key=JSON.stringify(fx),had=FXB.get(tk.id);if(had&&had.key===key)return had.buf;
  init();const sr=tk.sr,pcm=SCR.applyFx(tk.pcm,sr,fx),w=SCR.ROOM_WET[fx.room];let buf;
  if(!w)buf=bufFrom(pcm===tk.pcm?pcm.slice():pcm,sr);
  else{const irs=sr===ctx.sampleRate?irData:roomIR(sr),oc=new OfflineAudioContext(1,pcm.length+irs[0].length,sr),src=oc.createBufferSource(),b=oc.createBuffer(1,pcm.length,sr);b.getChannelData(0).set(pcm);src.buffer=b;
    const ir=oc.createBuffer(2,irs[0].length,sr);irs.forEach((d,c)=>ir.getChannelData(c).set(d));const cv=oc.createConvolver();cv.buffer=ir;const g=oc.createGain();g.gain.value=w;
    src.connect(oc.destination);src.connect(cv);cv.connect(g);g.connect(oc.destination);src.start();buf=await oc.startRendering()}
  FXB.set(tk.id,{key,buf});return buf}
// the text as it reads: the part you speak yourself (mixed line) marked
function scTextEl(l){const s=SC.doc,sp=elx('span','tx'),txt=l.text;if(!norm(SCR.plain(txt))){sp.append(elx('span','ph',t('sc.emptyLine')));return sp}
  const m=SCR.kindOf(s,l)==='babble'&&/\[[^\]]*\]/.exec(txt);if(!m){sp.textContent=SCR.plain(txt);return sp}
  sp.append(SCR.plain(txt.slice(0,m.index)),elx('mark','',m[0].slice(1,-1)),SCR.plain(txt.slice(m.index+m[0].length)));return sp}
function scRow(l,n){const s=SC.doc,c=charOf(l.character),edit=SC.edit===l.id,li=elx('li','ln '+ccOf(c)+(l.id===SC.cur?' cur':'')+(edit?' edit':''));li.dataset.id=l.id;
  const grip=elx('button','ln-grip');grip.type='button';grip.append(elx('span','n',String(n)),elx('span','g','⋮⋮'));grip.setAttribute('aria-label',t('sc.move'));grip.title=t('sc.move');
  grip.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();scMove(l,e.key==='ArrowUp'?-1:1,'.ln-grip')}});
  grip.addEventListener('pointerdown',()=>{li.draggable=true});
  li.addEventListener('dragstart',e=>{SC.drag=l.id;li.classList.add('dragging');e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',SCR.plain(l.text))}catch(x){}});
  li.addEventListener('dragend',()=>{SC.drag=null;li.draggable=false;li.classList.remove('dragging');clearDrop()});
  li.addEventListener('dragover',e=>{if(!SC.drag||SC.drag===l.id)return;e.preventDefault();const r=li.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;clearDrop();li.classList.add(after?'drop-after':'drop-before')});
  li.addEventListener('drop',e=>{if(!SC.drag)return;e.preventDefault();const after=li.classList.contains('drop-after');clearDrop();
    if(!after)return scDrop(l.id);const L=SCR.ordered(s),nx=L[L.indexOf(l)+1];if(nx&&nx.scene===l.scene&&nx.id!==SC.drag)scDrop(nx.id);else scDrop(null,l.scene)});
  const stt=elx('div');
  if(!edit){const tb=elx('button','ln-t'+(SCR.kindOf(s,l)==='babble'?' bab':''));tb.type='button';tb.title=t('sc.editLine');
    if(norm(l.dir))tb.append(elx('span','ln-dir','('+norm(l.dir).replace(/^\(+|\)+$/g,'')+')'));tb.append(scTextEl(l));tb.onclick=()=>scEdit(l.id,{end:true});
    li.append(grip,elx('span','ln-who',c?charName(c):t('sc.nobody')),tb,stt);scStatusEl(stt,l);li.addEventListener('click',e=>{if(!e.target.closest('button'))scEdit(l.id,{end:true})});return li}
  const ww=elx('div','ln-whow'),who=elx('select','sc-whosel '+ccOf(c));who.setAttribute('aria-label',t('sc.who'));fillWho(who,l);ww.appendChild(who);
  who.onchange=()=>{if(who.value==='+new'){const nc=scAddChar();l.character=nc.id;saveDoc();scRenderDoc();scPrompt();openChars(nc.id);return}l.character=who.value;saveDoc();scSwap(l.id);scPrompt();const w=document.querySelector('#scDoc [data-id="'+l.id+'"] .sc-whosel');if(w)w.focus()};
  const ed=elx('div','ln-ed'),dir=elx('input','sc-dir');dir.type='text';dir.value=l.dir||'';dir.placeholder=t('sc.dir');dir.setAttribute('aria-label',t('sc.dirLbl'));
  dir.oninput=()=>{l.dir=dir.value;saveDoc();if(l.id===SC.cur)scPrompt()};
  const hl=elx('div','sc-hl');hl.setAttribute('aria-hidden','true');const tx=elx('textarea','sc-txt');tx.rows=1;tx.value=l.text;tx.setAttribute('aria-label',t('sc.txtLbl'));tx.lang=s.lang;
  const tw=elx('div','sc-tw');tw.append(hl,tx);
  // a babble line: one part you speak yourself, marked with [ ] (select words, or put the cursor in a word)
  const tools=elx('div','ln-tools'),mk=elx('button','sc-mark');mk.type='button';mk.addEventListener('mousedown',e=>e.preventDefault());
  mk.onclick=()=>{if(SCR.partsOf(l.text).has)l.text=SCR.plain(l.text);else{const nt=SCR.markPart(l.text,tx.selectionStart,tx.selectionEnd);if(nt===SCR.plain(l.text)){say(t('sc.markHint'));scNote(t('sc.markHint'));return}l.text=nt}
    tx.value=l.text;fit(tx);saveDoc();upd();if(l.id===SC.cur)scLiveText();tx.focus()};
  const fb=elx('button','sc-file',t('sc.fileBtn'));fb.type='button';fb.onclick=()=>scPickFile(l);
  const del=elx('button','ln-del','×');del.type='button';del.setAttribute('aria-label',t('sc.delLine'));del.title=t('sc.delLine');del.onclick=()=>scDelLine(l);
  tools.append(mk,fb,elx('span','',t('sc.enterHint')),elx('span','sp'),del);
  const upd=()=>{const bab=SCR.kindOf(s,l)==='babble',has=bab&&SCR.partsOf(l.text).has;mk.hidden=!bab;fb.hidden=!norm(SCR.plain(l.text));
    mk.textContent=has?'♪ '+t('sc.unmark'):'● '+t('sc.markRec');mk.title=has?t('sc.unmark'):t('sc.markHint');scStatusEl(stt,l);scHighlight(hl,l)};
  tx.oninput=()=>{if(/\n/.test(tx.value)){const p=tx.selectionStart;tx.value=tx.value.replace(/\s*\n\s*/g,' ');tx.setSelectionRange(p,p)}l.text=tx.value;fit(tx);saveDoc();upd();scCountsUI();if(l.id===SC.cur)scLiveText()};
  tx.addEventListener('keydown',e=>{const L=SCR.ordered(s),i=L.indexOf(l);
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();scAddLine(l.scene,l)}
    else if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();scMove(l,e.key==='ArrowUp'?-1:1,'.sc-txt')}
    else if(e.key==='ArrowUp'&&!e.shiftKey&&tx.selectionStart===0&&tx.selectionEnd===0&&L[i-1]){e.preventDefault();scEdit(L[i-1].id,{end:true})}
    else if(e.key==='ArrowDown'&&!e.shiftKey&&tx.selectionStart===tx.value.length&&L[i+1]){e.preventDefault();scEdit(L[i+1].id,{end:0})}
    else if(e.key==='Escape'&&!SC.sess){e.preventDefault();e.stopPropagation();scEdit(null);const b=document.querySelector('#scDoc [data-id="'+l.id+'"] .ln-t');if(b)b.focus()}
    else if(e.key==='Backspace'&&!tx.value&&!l.dir&&!scTakesOf(l).length&&s.lines.length>1){e.preventDefault();const pv=L[i-1]||L[1];SCR.removeLine(s,l.id);if(SC.cur===l.id)SC.cur=pv.id;SC.edit=pv.id;saveDoc();scRenderDoc({id:pv.id,end:true});scPrompt()}});
  ed.append(dir,tw,tools);li.append(grip,ww,ed,stt);upd();
  li.addEventListener('focusin',()=>scSetCur(l.id));return li}
// open a line for editing (null closes it); only the two rows involved are rebuilt
function scEdit(id,focus){const was=SC.edit;if(was!==id){SC.edit=id;if(was)scSwap(was);if(id)scSwap(id)}
  if(id){scSetCur(id);const el=document.querySelector('#scDoc [data-id="'+id+'"] .sc-txt');if(el){el.focus();if(focus&&focus.end!=null){const p=focus.end===true?el.value.length:focus.end;el.setSelectionRange(p,p)}el.scrollIntoView({block:'nearest'})}}}
function scSwap(id){const old=document.querySelector('#scDoc [data-id="'+id+'"]'),l=SC.doc.lines.find(x=>x.id===id);if(!old||!l)return;const n=+old.querySelector('.ln-grip .n').textContent;
  const nu=scRow(l,n);old.replaceWith(nu);const tx=nu.querySelector('.sc-txt');if(tx)fit(tx)}
function clearDrop(){document.querySelectorAll('.drop-before,.drop-after,.drop-end').forEach(x=>x.classList.remove('drop-before','drop-after','drop-end'))}
function scDrop(beforeId,scene){const id=SC.drag;SC.drag=null;if(id&&SCR.placeLine(SC.doc,id,beforeId,scene)){saveDoc();scRenderDoc();scPrompt()}}
function scMove(l,d,el){if(!SCR.moveLine(SC.doc,l.id,d))return;saveDoc();scRenderDoc({id:l.id,el});scPrompt();say(t('sc.move'))}
function scAddLine(scene,after){const s=SC.doc,l=SCR.addLine(s,scene,after);
  if(!after){const L=SCR.ordered(s).filter(x=>x!==l&&x.character),last=L[L.length-1];l.character=last?last.character:(s.characters[0]||{}).id||''}
  SC.cur=l.id;SC.edit=l.id;scDiscard();saveDoc();scRenderDoc({id:l.id});scPrompt();return l}
async function scDelLine(l){const s=SC.doc,tks=scTakesOf(l);if(tks.length&&!await confirmDlg(t('sc.delLineTitle'),t('sc.delLineText'),t('cf.del'),t('voices.cancel')))return;
  const L=SCR.ordered(s),nx=L[L.indexOf(l)+1]||L[L.indexOf(l)-1];SCR.removeLine(s,l.id);tks.forEach(k=>delete SC.takes[k.id]);await delTakes(tks.map(k=>k.id));
  if(SC.cur===l.id){scDiscard();SC.cur=nx?nx.id:null}if(SC.edit===l.id)SC.edit=null;saveDoc();scRenderDoc();scPrompt()}
function scSetCur(id){if(SC.cur===id)return;SC.cur=id;if(!SC.sess)scNote('');scDiscard();scMarkCur(id);scPrompt();scCountsUI()}
// scenes: add (at the end or below one), move, delete (merge the lines into a neighbour, or delete them with their takes)
function scNewScene(at){const s=SC.doc,name=SCR.freeScene(s,n=>t('sc.sceneN',{n}));SCR.syncOrder(s);s.scenes.splice(at==null?s.scenes.length:at,0,name);scAddLine(name);
  const sec=document.querySelector('#scDoc [data-id="'+SC.edit+'"]');if(sec)sec.scrollIntoView({block:'center'})}
function scMoveScene(name,d){if(!SCR.moveScene(SC.doc,name,d))return;saveDoc();scRenderDoc();scPrompt();say(t(d<0?'sc.up':'sc.down'))}
async function scDelScene(name){const s=SC.doc;SCR.syncOrder(s);const i=s.scenes.indexOf(name),lines=s.lines.filter(l=>l.scene===name),to=s.scenes[i>0?i-1:i+1];let how='all';
  if(lines.length){const k=lines.filter(l=>scTakesOf(l).length).length;$('sdTitle').textContent=t('sc.delSceneTitle',{name:name||t('sc.sceneN',{n:i+1})});
    $('sdText').textContent=to!==undefined?t('sc.delSceneText',{n:lines.length,k,to}):t('sc.delSceneOnly',{n:lines.length,k});$('sdMerge').hidden=to===undefined;$('sdMerge').textContent=t('sc.mergeWith',{name:to});
    how=await new Promise(res=>{const d=$('scDelDlg'),done=v=>{d.onclose=null;d.close();res(v)};$('sdNo').onclick=()=>done(null);$('sdMerge').onclick=()=>done('merge');$('sdAll').onclick=()=>done('all');d.onclose=()=>res(null);d.showModal();$('sdNo').focus()});
    if(!how)return}
  const gone=SCR.removeScene(s,name,how==='merge')||[];const tks=Object.values(SC.takes).filter(k=>gone.includes(k.line));tks.forEach(k=>delete SC.takes[k.id]);await delTakes(tks.map(k=>k.id));
  if(gone.includes(SC.cur)){scDiscard();SC.cur=(SCR.ordered(s)[0]||{}).id||null}if(gone.includes(SC.edit))SC.edit=null;saveDoc();scRenderDoc();scPrompt()}
$('scFirst').onclick=()=>scAddLine(SC.doc.scenes[0]||t('sc.sceneN',{n:1}));
$('scAddScene').onclick=$('scAddScene2').onclick=()=>scNewScene();
$('scOnly').onchange=()=>{$('scDoc').classList.toggle('only',$('scOnly').checked);try{localStorage.setItem('bm.scOnly',$('scOnly').checked?'1':'')}catch(e){}};
try{$('scOnly').checked=localStorage.getItem('bm.scOnly')==='1'}catch(e){}
$('scTitle').addEventListener('input',()=>{SC.doc.title=$('scTitle').value;saveDoc()});
$('scTitle').addEventListener('change',()=>scSelUI());
$('scTitle').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('scTitle').blur()}});
$('scRename').onclick=()=>{menuClose();$('scTitle').focus();$('scTitle').select()};
document.querySelectorAll('[data-sclang]').forEach(b=>b.onclick=()=>{menuClose();SC.doc.lang=b.dataset.sclang;saveDoc();scSpeechCheck();scRender()});
$('scSel').addEventListener('change',async()=>{const s=SC.list.find(x=>x.id===$('scSel').value);$('scSel').value='';if(s&&s!==SC.doc){SC.edit=null;await scOpenDoc(s);scRender();scSpeechCheck()}});
$('scNew').onclick=async()=>{menuClose();SC.edit=null;await scNewDoc();scRender();scSpeechCheck();$('scTitle').focus()};
// a copy with its own takes (new ids), so either can change without the other
$('scDup').onclick=async()=>{menuClose();const s=SC.doc,c=JSON.parse(JSON.stringify(s)),map={};c.id=SCR.newScript().id;c.created=Date.now();c.title=t('sc.copyOf',{name:s.title.trim()||t('sc.untitled')});
  const tks=Object.values(SC.takes).map(k=>{const n={...k,id:tkId()+Object.keys(map).length,script:c.id};map[k.id]=n.id;return n});c.lines.forEach(l=>{if(l.take)l.take=map[l.take]||null});
  if(DB.db){try{await dbReq('takes','readwrite',o=>{tks.forEach(k=>o.put(k))})}catch(e){storeErr(e)}}
  SC.list.push(c);SC.edit=null;await scOpenDoc(c);if(!DB.db)tks.forEach(k=>SC.takes[k.id]=k);saveDoc(true);scRender();scSpeechCheck();say(t('sc.dupDone'));$('scTitle').focus();$('scTitle').select()};
$('scDelete').onclick=async()=>{menuClose();const s=SC.doc;if(!await confirmDlg(t('sc.delTitle',{name:s.title.trim()||t('sc.untitled')}),t('sc.delText'),t('cf.del'),t('voices.cancel')))return;scStop();
  if(DB.db){try{await dbReq('takes','readwrite',o=>{const r=o.index('script').openCursor(IDBKeyRange.only(s.id));r.onsuccess=()=>{const c=r.result;if(c){c.delete();c.continue()}}});await dbReq('scripts','readwrite',o=>{o.delete(s.id)})}catch(e){storeErr(e)}}
  SC.list=SC.list.filter(x=>x!==s);SC.edit=null;const nx=SC.list[SC.list.length-1];if(nx)await scOpenDoc(nx);else await scNewDoc();scRender();scSpeechCheck()};
// an audio file (an AI voice, a line recorded elsewhere) as a take: decoded, trimmed and levelled like a recording
function scPickFile(l){SC.fileFor=l.id;$('scFile').value='';$('scFile').click()}
$('scFile').onchange=()=>{const f=$('scFile').files[0],l=SC.doc&&SC.doc.lines.find(x=>x.id===SC.fileFor);if(f&&l)scImport(l,f)};
// 'ok', or why not: 'notext' (nothing to speak), 'bad' (not audio), 'silent'
async function scTakeFromFile(l,file){const s=SC.doc;
  if(SCR.kindOf(s,l)==='babble'&&!SCR.partsOf(l.text).has){const p=SCR.plain(l.text);l.text=SCR.markPart(p,0,p.length)} // a babble line without a part: the file is the whole line
  const said=SCR.recText(s,l);if(!norm(said))return 'notext';
  await ready();let buf;try{buf=await ctx.decodeAudioData(await file.arrayBuffer())}catch(e){return 'bad'}
  const nch=buf.numberOfChannels,pcm=new Float32Array(buf.length);for(let c=0;c<nch;c++){const d=buf.getChannelData(c);for(let i=0;i<d.length;i++)pcm[i]+=d[i]/nch}
  const res=SCR.finishTake(pcm,buf.sampleRate);if(!res)return 'silent';
  const tk={id:tkId(),script:s.id,line:l.id,text:said,sr:res.sr,pcm:res.pcm,dur:res.dur,created:Date.now(),warn:'',file:String(file.name||'').slice(0,120)};
  SC.takes[tk.id]=tk;l.take=tk.id;try{if(DB.db)await dbReq('takes','readwrite',o=>{o.put(tk)});storeOk()}catch(e){storeErr(e)}return 'ok'}
const FILEWHY={notext:'sc.noText',bad:'sc.fileBad',silent:'sc.fileSilent'};
async function scImport(l,file){if(SC.sess)return;const r=await scTakeFromFile(l,file);
  if(r!=='ok'){scNote(t(FILEWHY[r]),true);say(t(FILEWHY[r]));return}
  saveDoc(true);if(SC.cur!==l.id)scSetCur(l.id);scSwap(l.id);scCountsUI();scPrompt();const msg=t('sc.fileOk',{n:scTakesOf(l).length});scNote(msg);say(msg)}
// ---------- import and export (step 4) ----------
// zip: stored (no compression), many files; the reader reads what makeZipN writes (our backups)
function makeZipN(files){const enc=new TextEncoder(),parts=[],cds=[];let off=0;
  files.forEach(f=>{const nm=enc.encode(f.name),d=f.data,crc=crc32(d),lh=new Uint8Array(30+nm.length),cd=new Uint8Array(46+nm.length),L=new DataView(lh.buffer),C=new DataView(cd.buffer);
    L.setUint32(0,0x04034b50,true);L.setUint16(4,20,true);L.setUint16(6,0x800,true);L.setUint32(14,crc,true);L.setUint32(18,d.length,true);L.setUint32(22,d.length,true);L.setUint16(26,nm.length,true);lh.set(nm,30);
    C.setUint32(0,0x02014b50,true);C.setUint16(4,20,true);C.setUint16(6,20,true);C.setUint16(8,0x800,true);C.setUint32(16,crc,true);C.setUint32(20,d.length,true);C.setUint32(24,d.length,true);C.setUint16(28,nm.length,true);C.setUint32(42,off,true);cd.set(nm,46);
    parts.push(lh,d);cds.push(cd);off+=lh.length+d.length});
  const cdl=cds.reduce((n,x)=>n+x.length,0),end=new Uint8Array(22),E=new DataView(end.buffer);
  E.setUint32(0,0x06054b50,true);E.setUint16(8,files.length,true);E.setUint16(10,files.length,true);E.setUint32(12,cdl,true);E.setUint32(16,off,true);
  return new Blob([...parts,...cds,end],{type:'application/zip'})}
function readZip(u8){const v=new DataView(u8.buffer,u8.byteOffset,u8.byteLength),dec=new TextDecoder(),out={};let p=0;
  while(p+30<=u8.length&&v.getUint32(p,true)===0x04034b50){const m=v.getUint16(p+8,true),n=v.getUint32(p+18,true),nl=v.getUint16(p+26,true),xl=v.getUint16(p+28,true);
    const name=dec.decode(u8.subarray(p+30,p+30+nl)),at=p+30+nl+xl;if(m!==0)return null;out[name]=u8.subarray(at,at+n);p=at+n}return out}
// a 16-bit WAV (what encodeWav writes) back to samples, mono
function wavPcm(u8){const v=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);if(u8.length<44||v.getUint32(0,false)!==0x52494646)return null;
  let p=12,sr=0,ch=1,bits=16,data=null;while(p+8<=u8.length){const id=v.getUint32(p,false),n=v.getUint32(p+4,true);
    if(id===0x666d7420){ch=v.getUint16(p+10,true);sr=v.getUint32(p+12,true);bits=v.getUint16(p+22,true)}else if(id===0x64617461){data=[p+8,Math.min(n,u8.length-p-8)];break}p+=8+n+(n&1)}
  if(!data||bits!==16||!sr)return null;const len=Math.floor(data[1]/2/ch),pcm=new Float32Array(len);
  for(let i=0;i<len;i++){let x=0;for(let c=0;c<ch;c++)x+=v.getInt16(data[0]+(i*ch+c)*2,true);pcm[i]=x/ch/32768}return {pcm,sr}}
const fileName=s=>(norm(s.title)||t('sc.untitled')).replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,' ').trim().slice(0,60)||'script';
async function scSave(blob,name){if(DL){await DL.save({filename:/\.zip$/.test(name)?name:name+'.zip',data:/\.zip$/.test(name)?blob:makeZipN([{name,data:new Uint8Array(await blob.arrayBuffer())}])})}else saveBlob(blob,name)}
// babble as heard in the tool: the high shelf and the room of its style, rendered in
async function scBake(buf,w){const sr=buf.sampleRate,oc=new OfflineAudioContext(1,buf.length+(w?irData[0].length:0),sr),s=oc.createBufferSource();s.buffer=buf;
  const shelf=oc.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=6000;shelf.gain.value=-3;s.connect(shelf);shelf.connect(oc.destination);
  if(w){const ir=oc.createBuffer(2,irData[0].length,sr);irData.forEach((d,c)=>ir.getChannelData(c).set(d));const cv=oc.createConvolver();cv.buffer=ir;const g=oc.createGain();g.gain.value=w;shelf.connect(cv);cv.connect(g);g.connect(oc.destination)}
  s.start();return oc.startRendering()}
function xpNote(msg,err){const n=$('xpNote');n.textContent=msg;n.classList.toggle('err',!!err)}
// for the game: one WAV per line (sound and room in it) and script.json; a line without a take is left out and listed
async function scExportGame(){const s=SC.doc;await ready();xpNote(t('io.working'));const files=[],rows=[],miss=[],sr=ctx.sampleRate;
  try{for(const l of SCR.ordered(s)){const c=charOf(l.character),bab=SCR.kindOf(s,l)==='babble',row={id:l.id,scene:l.scene,character:c?charName(c):'',characterId:l.character||'',text:norm(SCR.plain(l.text)),file:null,duration:0};
    if(norm(l.dir))row.dir=norm(l.dir);let buf=null;
    if(bab){const has=SCR.partsOf(l.text).has,tk=l.take&&SC.takes[l.take];row.babble=SCR.babbleOpts(c,l);
      if(has){row.mixed=true;row.spoken=norm(SCR.partsOf(l.text).rec)}
      if(!has||tk){const r=scBabble(l);if(r){buf=await scBake(r.buf,r.wet);if(!has){const b=scBabbleText(l,SCR.plain(l.text),0);if(b&&b.syl)row.syllables=b.syl.map(x=>({time:+x.time.toFixed(3),text:x.text}))}}}}
    else{const tk=l.take&&SC.takes[l.take];if(tk)buf=await scTakeBuf(tk)}
    if(buf){row.file=l.id+'.wav';row.duration=+buf.duration.toFixed(3);files.push({name:row.file,data:encodeWav(buf)})}else if(norm(row.text))miss.push(l);
    rows.push(row)}
    const json={format:'babble-script-export',version:1,title:s.title||'',lang:s.lang,sampleRate:sr,lines:rows};
    files.unshift({name:'script.json',data:new TextEncoder().encode(JSON.stringify(json,null,2))});
    const name=fileName(s)+'.zip';await scSave(makeZipN(files),name);
    xpNote(t('io.gameDone',{name,n:files.length-1})+(miss.length?' '+t('io.missing',{n:miss.length}):''))}
  catch(e){xpNote(e&&e.code==='declined'?t('make.dlDeclined'):t('make.dlErr',{m:(e&&e.message)||'?'}),true)}}
async function scExportScript(){const s=SC.doc,name=fileName(s)+'.babble-script.json';
  try{await scSave(new Blob([JSON.stringify(SCR.toFile(s),null,2)],{type:'application/json'}),name);xpNote(t('io.saved',{name}))}catch(e){xpNote(t('make.dlErr',{m:(e&&e.message)||'?'}),true)}}
// backup: the script file plus every original take, so a browser that loses its data loses nothing
async function scBackup(){const s=SC.doc;xpNote(t('io.working'));
  try{const tks=Object.values(SC.takes).sort((a,b)=>a.created-b.created),files=[{name:'script.babble-script.json',data:new TextEncoder().encode(JSON.stringify(SCR.toFile(s),null,2))},
      {name:'takes.json',data:new TextEncoder().encode(JSON.stringify(tks.map(k=>({id:k.id,line:k.line,text:k.text,created:k.created,warn:k.warn||'',file:k.file||'',chosen:SC.doc.lines.some(l=>l.take===k.id)}))))}];
    await ready();tks.forEach(k=>files.push({name:'takes/'+k.id+'.wav',data:encodeWav(bufFrom(k.pcm.slice(),k.sr))}));
    const name=fileName(s)+'.babble-backup.zip';await scSave(makeZipN(files),name);xpNote(t('io.backupDone',{name,n:tks.length}))}
  catch(e){xpNote(t('make.dlErr',{m:(e&&e.message)||'?'}),true)}}
function openExport(){menuClose();xpNote('');$('xpDlg').showModal();$('xpGame').focus()}
$('scExport').onclick=$('scExport2').onclick=openExport;$('xpClose').onclick=()=>$('xpDlg').close();
$('xpGame').onclick=scExportGame;$('xpScript').onclick=scExportScript;$('xpBackup').onclick=scBackup;
// import: a script file or text (synced into this script on line id, with a summary first), a backup (as a new script), or audio files named by line id
const IO={inc:null,backup:null};
function ioShow(plan){$('ioPick').hidden=!!plan;$('ioPlan').hidden=!plan;$('ioErr').hidden=true}
function ioErr(msg){$('ioErr').textContent=msg;$('ioErr').hidden=false}
function openImport(){menuClose();IO.inc=IO.backup=null;ioShow(false);$('ioText').value='';$('ioText').placeholder=t('io.pastePh');$('ioDlg').showModal();$('ioFile').focus()}
$('scImportBtn').onclick=openImport;$('ioClose').onclick=()=>$('ioDlg').close();$('ioBack').onclick=()=>ioShow(false);
function ioPlan(inc){const p=SCR.planImport(SC.doc,inc);IO.inc=inc;IO.backup=null;
  $('ioSum').textContent=t('io.plan',{a:p.add,c:p.change,s:p.same})+(p.newChars?' '+t('io.newChars',{n:p.newChars}):'');
  $('ioGoneRow').hidden=!p.gone.length;$('ioGone').checked=false;$('ioGoneTxt').textContent=t('io.gone',{n:p.gone.length});ioShow(true);$('ioApply').focus()}
$('ioRead').onclick=()=>{const inc=SCR.parseFile($('ioText').value);if(!inc)return ioErr(t('io.noLines'));ioPlan(inc)};
$('ioFile').onclick=()=>{$('ioPick1').value='';$('ioPick1').click()};
$('ioPick1').onchange=async()=>{const f=$('ioPick1').files[0];if(!f)return;const u8=new Uint8Array(await f.arrayBuffer());
  if(u8[0]===0x50&&u8[1]===0x4b){const z=readZip(u8),js=z&&z['script.babble-script.json'],inc=js&&SCR.parseFile(new TextDecoder().decode(js));if(!inc)return ioErr(t('io.badFile',{name:f.name}));
    IO.backup={z,inc};IO.inc=null;const n=Object.keys(z).filter(k=>k.startsWith('takes/')).length;$('ioSum').textContent=t('io.restore',{name:inc.title||t('sc.untitled'),n});$('ioGoneRow').hidden=true;ioShow(true);$('ioApply').focus();return}
  const inc=SCR.parseFile(new TextDecoder().decode(u8));if(!inc)return ioErr(t('io.badFile',{name:f.name}));ioPlan(inc)};
// characters from a file: only styles, voices and moods the tool knows
function scCleanChars(){SC.doc.characters.forEach(c=>{if(c.kind!=='babble')return;if(!own(ENGINES,c.style))c.style='animal';scFixVoice(c);if(own(MOOD_ALIAS,c.mood))c.mood=MOOD_ALIAS[c.mood];if(!own(MOODS,c.mood))c.mood='neutraal';if(!own(INTENTS,c.intent))c.intent='tell';
  if(c.fx)c.fx=SCR.fxOf(c);if(c.sl&&typeof c.sl!=='object')c.sl=null})}
$('ioApply').onclick=async()=>{const s=SC.doc;
  if(IO.backup){const {z,inc}=IO.backup,ns=SCR.newScript('',inc.lang||s.lang,'');ns.scenes=[];SCR.applyImport(ns,inc,true);ns.title=inc.title||'';
    let meta=[];try{meta=JSON.parse(new TextDecoder().decode(z['takes.json']||new Uint8Array()))}catch(e){}const tks=[];
    meta.forEach(m=>{const w=z['takes/'+m.id+'.wav'],a=w&&wavPcm(w),l=ns.lines.find(x=>x.id===m.line);if(!a||!l)return;
      const tk={id:tkId()+tks.length,script:ns.id,line:l.id,text:String(m.text||''),sr:a.sr,pcm:a.pcm,dur:a.pcm.length/a.sr,created:m.created||Date.now(),warn:m.warn||'',file:m.file||''};if(m.chosen)l.take=tk.id;tks.push(tk)});
    if(DB.db){try{await dbReq('takes','readwrite',o=>{tks.forEach(k=>o.put(k))})}catch(e){storeErr(e)}}
    SC.list.push(ns);SC.edit=null;await scOpenDoc(ns);if(!DB.db)tks.forEach(k=>SC.takes[k.id]=k);scCleanChars();saveDoc(true);scRender();scSpeechCheck();$('ioDlg').close();say(t('io.restored',{n:tks.length}));return}
  if(!IO.inc)return;scStop();const gone=SCR.applyImport(s,IO.inc,$('ioGone').checked);scCleanChars();
  const tks=Object.values(SC.takes).filter(k=>gone.includes(k.line));tks.forEach(k=>delete SC.takes[k.id]);await delTakes(tks.map(k=>k.id));
  if(!s.lines.some(l=>l.id===SC.cur))SC.cur=(s.lines[0]||{}).id||null;SC.edit=null;BAB.clear();FXB.clear();saveDoc(true);scRender();$('ioDlg').close();say(t('io.applied'))};
// audio files named by line id (as the game export names them): each becomes a take of that line
$('ioAudio').onclick=()=>{$('ioPick2').value='';$('ioPick2').click()};
$('ioPick2').onchange=async()=>{const fs=[...$('ioPick2').files];if(!fs.length)return;const s=SC.doc,ok=[],no=[],bad=[];
  for(const f of fs){const id=f.name.replace(/\.[^.]+$/,''),l=s.lines.find(x=>x.id===id);if(!l){no.push(f.name);continue}const r=await scTakeFromFile(l,f);(r==='ok'?ok:bad).push(f.name)}
  if(ok.length){saveDoc(true);scRenderDoc();scPrompt()}
  ioErr([t('io.audioOk',{n:ok.length}),no.length?t('io.audioNo',{names:no.join(', ')}):'',bad.length?t('io.audioBad',{names:bad.join(', ')}):''].filter(Boolean).join(' '));
  $('ioErr').classList.toggle('ok',!no.length&&!bad.length)};
// widths of the overview and the prompter: drag a divider, arrows when it has focus, double-click resets; kept in this browser
const SCW={ovw:['bm.scOv',160,380,230],pmw:['bm.scPm',340,720,420]};
function scGetW(k){return parseFloat(getComputedStyle($('scWs')).getPropertyValue('--'+k))}
function scSetW(k,v,keep){const ws=$('scWs'),L=SCW[k],other=k==='ovw'?scGetW('pmw'):(getComputedStyle($('scSplitOv')).display==='none'?0:scGetW('ovw')),room=ws.clientWidth-other-18-440;
  v=Math.round(Math.max(L[1],Math.min(L[2],room>0?room:L[2],v)));ws.style.setProperty('--'+k,v+'px');$(k==='ovw'?'scSplitOv':'scSplitPm').setAttribute('aria-valuenow',v);if(keep!==false)try{localStorage.setItem(L[0],v)}catch(e){}}
[['scSplitOv','ovw',1],['scSplitPm','pmw',-1]].forEach(([id,k,dir])=>{const el=$(id);el.setAttribute('aria-valuemin',SCW[k][1]);el.setAttribute('aria-valuemax',SCW[k][2]);
  el.onpointerdown=e=>{const x0=e.clientX,w0=scGetW(k);el.setPointerCapture(e.pointerId);el.classList.add('drag');document.body.classList.add('resizing');
    el.onpointermove=m=>scSetW(k,w0+dir*(m.clientX-x0));el.onpointerup=el.onpointercancel=()=>{el.onpointermove=null;el.classList.remove('drag');document.body.classList.remove('resizing')}};
  el.onkeydown=e=>{const d=e.key==='ArrowLeft'?-16:e.key==='ArrowRight'?16:0;if(d){e.preventDefault();scSetW(k,scGetW(k)+dir*d)}};
  el.ondblclick=()=>scSetW(k,SCW[k][3])});
function scWidths(){for(const k in SCW){let v=null;try{v=localStorage.getItem(SCW[k][0])}catch(e){}scSetW(k,v?+v:SCW[k][3],false)}}
// --- characters ---
function openChars(focusId){scCharList(focusId);$('chDlg').showModal();if(!focusId)$('chAdd').focus()}
function scCharList(focusId){const s=SC.doc,ul=$('chList');ul.innerHTML='';$('chEmpty').hidden=s.characters.length>0;
  s.characters.forEach(c=>{const li=document.createElement('li');li.className=ccOf(c);const sw=document.createElement('span');sw.className='sw';sw.setAttribute('aria-hidden','true');
    const inp=document.createElement('input');inp.type='text';inp.value=c.name;inp.setAttribute('aria-label',t('sc.charName'));inp.oninput=()=>{c.name=inp.value;saveDoc()};
    const kind=scSelect(t('sc.kind'),[['record',t('sc.kRecord')],['babble',t('sc.kBabble')]],c.kind,v=>{scSetKind(c,v);scCharList(c.id)});kind.classList.add('ch-kind');
    const del=mkBtn('btn','×',t('sc.delChar',{name:charName(c)}));
    del.onclick=async()=>{const n=s.lines.filter(l=>l.character===c.id).length;if(n&&!await confirmDlg(t('sc.delCharTitle',{name:charName(c)}),t('sc.delCharText',{n}),t('cf.del'),t('voices.cancel')))return;
      s.characters=s.characters.filter(x=>x!==c);s.lines.forEach(l=>{if(l.character===c.id)l.character=''});saveDoc();scCharList()};
    const row=document.createElement('div');row.className='ch-row';row.append(sw,inp,kind,del);li.appendChild(row);if(c.kind==='babble')li.appendChild(scBabbleRow(c));
    if(c.kind!=='babble'||s.lines.some(l=>l.character===c.id&&SCR.partsOf(l.text).has))li.appendChild(scFxRow(c));
    ul.appendChild(li);if(focusId===c.id)setTimeout(()=>{inp.focus();inp.select()},0)})}
// sound per character: a preset, or pitch, effect and room by hand; for a babble character it is the sound of your own [part]
const FXNAME={'':'fx.eNone',radio:'fx.radio',gizmo:'fx.robot',sprite:'fx.fairy',grumble:'fx.troll'};
function scFxRow(c,refocus){const box=elx('div','ch-fx'),fx=SCR.fxOf(c),bab=c.kind==='babble',pre=SCR.fxPreset(fx);
  const set=(nf,cls)=>{c.fx={...SCR.fxOf({fx:nf})};FXB.clear();saveDoc();const nb=scFxRow(c,cls);box.replaceWith(nb)};
  const ps=scSelect(t(bab?'sc.fxOwnPart':'sc.sound'),Object.keys(SCR.FX_PRESETS).map(k=>[k,t('fx.'+k)]).concat(pre?[]:[['',t('fx.custom')]]),pre,v=>{if(v)set(SCR.FX_PRESETS[v],'.fx-pre')});ps.classList.add('fx-pre');
  const pl=elx('label','fx-pitch'),pn=elx('span','',t('sc.pitch')),rg=elx('input'),ov=elx('output');rg.type='range';rg.min=-12;rg.max=12;rg.step=1;rg.value=fx.pitch;pl.title=t('sc.pitchTip');
  const note=elx('span','fx-note'),sign=v=>{ov.textContent=(v>0?'+':'')+v;note.textContent=v>0?t('sc.faster'):v<0?t('sc.slower'):''};sign(fx.pitch);rg.oninput=()=>sign(+rg.value);rg.onchange=()=>set({...fx,pitch:+rg.value},'.fx-pitch input');pl.append(pn,rg,ov,note);
  const ef=scSelect(t('sc.effect'),SCR.FX_EFFECTS.map(k=>[k,t(FXNAME[k])]),fx.effect,v=>set({...fx,effect:v},'.fx-eff'));ef.classList.add('fx-eff');
  const rm=scSelect(t('sc.room'),Object.keys(SCR.ROOM_WET).map(k=>[k,t('fx.r'+k[0].toUpperCase()+k.slice(1))]),fx.room,v=>set({...fx,room:v},'.fx-room'));rm.classList.add('fx-room');rm.hidden=bab;
  const first=SCR.ordered(SC.doc).find(l=>l.character===c.id&&l.take&&SC.takes[l.take]),pb=mkBtn('btn','▶',t('sc.fxTest'));pb.disabled=!first;
  if(first)pb.onclick=()=>scPlayLine(first,on=>{pb.textContent=on?'■':'▶'});
  const h=elx('span','fx-h',t(bab?'sc.fxOwnPart':'sc.sound'));h.setAttribute('aria-hidden','true');
  box.append(h,ps,pl,ef,rm,pb);if(refocus)setTimeout(()=>{const el=box.querySelector(refocus);if(el)el.focus()},0);return box}
function scSelect(label,opts,val,fn){const sel=document.createElement('select');sel.setAttribute('aria-label',label);sel.title=label;
  opts.forEach(([v,txt])=>{const o=document.createElement('option');o.value=v;o.textContent=txt;sel.appendChild(o)});sel.value=val;sel.onchange=()=>fn(sel.value);return sel}
// a babble character: style, voice (own voices too, for voice styles), mood (Bloopa Doopa: intent)
function scSetKind(c,k){c.kind=k;if(k==='babble'){if(!own(ENGINES,c.style))c.style='animal';scFixVoice(c);if(!own(MOODS,c.mood))c.mood='neutraal';if(!own(INTENTS,c.intent))c.intent='tell'}saveDoc()}
function scFixVoice(c){const v=String(c.voice||'');if(v.startsWith('own:')?!(EMETA[c.style].rec&&ownVoice(v.slice(4))):!own(ENGINES[c.style].voices,v))c.voice=Object.keys(ENGINES[c.style].voices)[0]}
function scBabbleRow(c){const box=document.createElement('div');box.className='ch-bab';scFixVoice(c);
  const style=scSelect(t('make.style'),ENGINE_ORDER.map(e=>[e,EMETA[e].name]),c.style,v=>{c.style=v;c.profile=null;c.sl=null;scFixVoice(c);saveDoc();scCharList()});
  const vs=Object.entries(ENGINES[c.style].voices).map(([k,v])=>[k,v.name]);if(EMETA[c.style].rec)st.voices.forEach(v=>vs.push(['own:'+v.id,v.name+' · '+t('side.own')]));
  const prof=c.profile&&CHARS.find(x=>x.id===c.profile);
  const voice=scSelect(t('side.voice'),vs,c.voice,v=>{if(v.startsWith('char:'))return scUseProfile(c,v.slice(5));c.voice=v;c.profile=null;c.sl=null;saveDoc();scCharList()});
  if(CHARS.length){const g=document.createElement('optgroup');g.label=t('sc.profiles');CHARS.forEach(x=>{const o=document.createElement('option');o.value='char:'+x.id;o.textContent=x.name+' · '+EMETA[x.engine].name;g.appendChild(o)});voice.appendChild(g);if(prof)voice.value='char:'+prof.id}
  const vem=c.style==='vemmo',mood=vem?scSelect(t('side.intent'),Object.keys(INTENTS).map(k=>[k,INTENTNAME[k][LI()]]),c.intent,v=>{c.intent=v;saveDoc()})
    :scSelect(t('side.emotion'),Object.keys(MOODS).map(k=>[k,MOODNAME[k][LI()]]),c.mood,v=>{c.mood=v;saveDoc()});
  const first=SCR.ordered(SC.doc).find(l=>l.character===c.id&&(norm(l.text)||vem));
  const pb=mkBtn('btn','▶',t('sc.playLine'));pb.disabled=!first;if(first)pb.onclick=()=>scPlayBabble(first,on=>{pb.textContent=on?'■':'▶'});
  box.append(style,voice,mood,pb);return box}
// a saved character (made on the make screen) as a profile: its style, voice, mood and sliders (pitch, speed...) are copied in,
// so the script keeps working when that character changes or is deleted
function scUseProfile(c,id){const x=CHARS.find(y=>y.id===id);if(!x)return;c.style=x.engine;c.voice=x.voice;if(own(MOODS,x.mood))c.mood=x.mood;if(own(INTENTS,x.intent))c.intent=x.intent;
  c.sl={...x.sl};c.profile=x.id;scFixVoice(c);saveDoc();scCharList()}
// the spoken part of a babble line, framed behind the text field
function scHighlight(hl,l){hl.textContent='';const m=SCR.kindOf(SC.doc,l)==='babble'&&/\[[^\]]*\]/.exec(l.text);if(!m)return;
  const mk=document.createElement('mark');mk.textContent=m[0];hl.append(document.createTextNode(l.text.slice(0,m.index)),mk,document.createTextNode(l.text.slice(m.index+m[0].length)))}
$('scAddChar').onclick=()=>{const c=scAddChar();openChars(c.id)};
$('chAdd').onclick=()=>{const c=scAddChar();scCharList(c.id)};
$('chClose').onclick=()=>$('chDlg').close();
$('chDlg').addEventListener('close',()=>{scRenderDoc();scPrompt()});
// --- babble lines: rendered with the web module (what a game gets from the same options), kept per line until text or settings change ---
const BAB=new Map();
function ownFor(id){const v=ownVoice(id);if(!v)return null;return v._mod||(v._mod={name:v.name,sampleRate:ctx.sampleRate,median:v.median,grains:v.grains,_at:{}})}
function scBabbleText(l,text,piece){const c=charOf(l.character);if(!c||c.kind!=='babble')return null;const o=SCR.babbleOpts(c,l);o.seed+=piece||0;
  if(!norm(text)&&(o.style!=='vemmo'||piece))return null;init();
  const id=l.id+':'+(piece||0),key=JSON.stringify([norm(text),o,c.voice,HISS,STEADY,ctx.sampleRate]),had=BAB.get(id);if(had&&had.key===key)return had;
  const ov=String(c.voice||'').startsWith('own:')&&EMETA[o.style].rec?ownFor(c.voice.slice(4)):null;
  try{const r=Babble.render(text,{...o,sampleRate:ctx.sampleRate,hiss:HISS,steady:STEADY,ownVoice:ov||undefined});if(!r.pcm.length)return null;
    const out={key,pcm:r.pcm,buf:bufFrom(r.pcm,r.sampleRate),wet:wetFor(o.style),syl:r.syllables};BAB.set(id,out);return out}catch(e){console.error(e);return null}}
// the whole line: all babble, or (mixed) babble before + the chosen take + babble after; without a take the spoken part babbles too
function scBabble(l){const p=SCR.partsOf(l.text),tk=p.has&&l.take&&SC.takes[l.take];if(!tk)return scBabbleText(l,SCR.plain(l.text),0);
  const a=scBabbleText(l,p.before,1),b=scBabbleText(l,p.after,2),sr=ctx.sampleRate,gap=new Float32Array(Math.round(sr*.06));
  let take=tk.pcm;if(tk.sr!==sr){const k=tk.sr/sr,n=Math.floor(take.length/k),o=new Float32Array(n);for(let i=0;i<n;i++){const q=i*k,j=Math.floor(q),f=q-j;o[i]=(take[j]||0)*(1-f)+(take[j+1]||0)*f}take=o}
  take=SCR.applyFx(take,sr,SCR.fxOf(charOf(l.character)));
  const parts=[a&&a.pcm,a&&gap,take,b&&gap,b&&b.pcm].filter(Boolean),out=new Float32Array(parts.reduce((n,x)=>n+x.length,0));let at=0;parts.forEach(x=>{out.set(x,at);at+=x.length});
  return {buf:bufFrom(out,sr),wet:(a||b||{wet:0}).wet}}
async function scPlayBabble(l,on){const who='bab:'+l.id;if(P.owner===who){pStop();return}await ready();const r=scBabble(l);if(!r)return;
  if(wet)wet.gain.value=r.wet;pPlay(r.buf,who,{onend:()=>{if(on)on(false)}});if(on)on(true)}
// --- prompter: the line before (small), the current line big, the next one of this character small; words said / now / to come ---
function scPrompt(){const s=SC.doc,ss=SC.sess,l=(ss&&ss.cueLine)||scLine();if(!s)return;const c=l&&charOf(l.character);
  const who=$('pmWho');who.textContent=l?charName(c):'';who.className='pm-who '+ccOf(c);
  if(l&&norm(l.dir))who.appendChild(elx('em','','('+norm(l.dir).replace(/^\(+|\)+$/g,'')+')'));
  const L=SCR.ordered(s),pv=l&&L[L.indexOf(l)-1],cue=$('pmCue');cue.textContent='';
  if(pv&&pv.scene===l.scene&&norm(SCR.plain(pv.text)))cue.append(elx('b','',charName(charOf(pv.character))),norm(SCR.plain(pv.text)));
  const box=$('pmLine');box.innerHTML='';const p=l&&SCR.kindOf(s,l)==='babble'?SCR.partsOf(l.text):{before:l?SCR.plain(l.text):'',rec:'',after:'',has:false};
  const put=(txt,cls)=>SCR.wordsOf(txt,s.lang).forEach(w=>box.appendChild(elx('span',cls,w.w)));
  if(p.has){put(p.before,'wb');put(p.rec,'w');put(p.after,'wb')}else put(p.before,'w');
  if(!box.children.length)box.appendChild(elx('span','empty',l?t('sc.noText'):t('sc.pickLine')));
  scWords();
  const nx=ss&&ss.cueLine?scLine():l&&SCR.nextFor(s,l.id,SC.takes),nb=$('pmNext');nb.innerHTML='';
  $('pmPhones').hidden=!(s.characters.some(x=>x.kind==='babble')&&s.characters.some(x=>x.kind!=='babble'));
  if(nx)nb.append(elx('b','',t('sc.nextLbl')),norm(SCR.plain(nx.text)));
  scCtl();scTakesUI()}
function scWords(){const ss=SC.sess,box=$('pmLine'),k=ss&&ss.state==='talk'?ss.word:-1;box.classList.toggle('idle',k<0);
  [...box.querySelectorAll('.w')].forEach((sp,i)=>{sp.classList.toggle('said',k>=0&&i<k);sp.classList.toggle('now',i===k)})}
function scLiveText(){const ss=SC.sess,l=scLine();if(ss&&ss.f&&l)ss.f.syl=Math.max(1,SCR.sylTotal(SCR.wordsOf(SCR.recText(SC.doc,l),SC.doc.lang)));scPrompt()}
// a line that already has its take: Record makes another take of it (and stays there), instead of moving on
const scAgain=l=>!!(l&&SC.doc&&SCR.lineStatus(l,SC.takes,SC.doc)==='done');
function scCtl(){const ss=SC.sess,l=scLine(),st0=ss?ss.state:'idle',b=$('pmRec');
  $('pmRecTxt').textContent=st0==='talk'||st0==='saving'?'✓ '+t('sc.done'):st0==='wait'||st0==='cue'?'■ '+t('sc.stop'):'● '+t(scAgain(l)?'sc.again':'sc.record');
  b.disabled=st0==='saving'||(!ss&&!(l&&(scAgain(l)||SCR.nextRecord(SC.doc,l.id,SC.takes))));$('pmStop').hidden=!ss;
  $('pmStat').className='pm-state'+(ss?' rec':'')+(st0==='cue'?' cue':'');$('pmStatTxt').textContent=st0==='cue'?t('sc.speaking'):ss?t('sc.listening'):t('sc.ready');$('pmMeterRow').hidden=!ss;
  const L=SC.doc?SCR.ordered(SC.doc):[],i=L.indexOf(l);$('pmPrev').disabled=i<=0;$('pmSkip').disabled=i<0||i>=L.length-1&&!(l&&SCR.nextFor(SC.doc,l.id,SC.takes));
  $('pmMode').textContent=SC.speech[SC.doc&&SC.doc.lang]==='available'?t('sc.followVoice'):t('sc.followTempo');
  const big=document.body.classList.contains('sc-focus');$('pmBigTxt').textContent=big?'⤡ '+t('sc.small'):'⤢ '+t('sc.big');$('pmBig').setAttribute('aria-pressed',String(big))}
function scNote(msg,warn){const n=$('pmNote');n.className='pm-note'+(warn?' warn':'');n.textContent=msg}
// big: the prompter takes the whole window (F, or the button); Esc or F again returns
function scFocus(on){document.body.classList.toggle('sc-focus',on);scCtl()}
$('pmBig').onclick=()=>scFocus(!document.body.classList.contains('sc-focus'));
$('pmStop').onclick=()=>{const ss=SC.sess;if(!ss)return;if(ss.state==='talk'){ss.stopAfter=true;scEndTake()}else if(ss.state!=='saving')scStop()};
// --- takes of the current line: one is chosen; playback is dry; an audio file can be dropped here ---
function scTakesUI(){const box=$('pmTakes');box.innerHTML='';const l=scLine();if(!l)return;
  const bab=SCR.kindOf(SC.doc,l)==='babble',mixed=bab&&SCR.partsOf(l.text).has;
  if(bab){const row=elx('div','pm-tkrow'),lab=()=>'▶ '+t('sc.play');
    const pb=elx('button','pm-tkbtn',P.owner==='bab:'+l.id?'■':lab());pb.type='button';pb.setAttribute('aria-label',t('sc.playLine'));pb.disabled=!!SC.sess;pb.onclick=()=>scPlayBabble(l,on=>{pb.textContent=on?'■':lab()});
    const nb=elx('button','pm-tkbtn','↻ '+t('sc.otherTake'));nb.type='button';nb.disabled=!!SC.sess;nb.onclick=()=>{l.seed=SCR.newSeed();saveDoc();BAB.delete(l.id+':0');scPlayBabble(l,on=>{pb.textContent=on?'■':lab()})};
    const wb=elx('button','pm-tkbtn','⤓ WAV');wb.type='button';wb.title=t('sc.dlLine');wb.setAttribute('aria-label',t('sc.dlLine'));wb.disabled=!!SC.sess;wb.onclick=()=>scDlLine(l);
    row.append(pb,nb,wb);
    if(!mixed){const mb=elx('button','pm-tkbtn','● '+t('sc.markRec'));mb.type='button';mb.title=t('sc.markHint');mb.disabled=!!SC.sess;mb.onclick=()=>scEdit(l.id,{end:true});row.appendChild(mb)}
    box.appendChild(row);if(!mixed)return}
  if(!norm(SCR.recText(SC.doc,l)))return;
  const tks=scTakesOf(l);box.appendChild(elx('h3','',t('sc.takes')));
  if(!tks.length)box.appendChild(elx('p','none',t('sc.noTakes')));
  else if(!(l.take&&SC.takes[l.take]))box.appendChild(elx('p','none',t('sc.noneChosen')));
  tks.forEach((k,i)=>{const row=elx('div','tk'+(l.take===k.id?' on':'')),lab=elx('div','tk-lab');
    const on=l.take===k.id,r=elx('button','tk-pick');r.type='button';r.setAttribute('aria-pressed',String(on));r.setAttribute('aria-label',t('sc.choose',{n:i+1}));r.title=t(on?'sc.unchoose':'sc.choose',{n:i+1});
    r.onclick=()=>{l.take=on?null:k.id;saveDoc();scLineStatus(l);scCountsUI();scPrompt();const f=document.querySelectorAll('#pmTakes .tk-pick')[i];if(f)f.focus()};
    lab.append(r,elx('span','',t('sc.take',{n:i+1})+' · '+k.dur.toFixed(1)+' s'));if(l.take===k.id)lab.appendChild(elx('span','tag pick',t('sc.chosen')));
    if(k.file){const g=elx('span','tag',t('sc.fileTag'));g.title=k.file;lab.appendChild(g)}
    if(norm(SCR.plain(k.text))!==norm(SCR.recText(SC.doc,l))){const g=elx('span','tag',t('sc.oldText'));g.title=k.text;lab.appendChild(g)}
    const pb=elx('button','',P.owner==='take:'+k.id?'■':'▶');pb.type='button';pb.setAttribute('aria-label',t('sc.playTake',{n:i+1}));pb.title=t('sc.playTake',{n:i+1});
    pb.onclick=async()=>{if(P.owner==='take:'+k.id){pStop();return}await ready();pPlay(await scTakeBuf(k),'take:'+k.id,{dest:ctx.destination,onend:()=>{pb.textContent='▶'}});pb.textContent='■'};
    const db=elx('button','','×');db.type='button';db.setAttribute('aria-label',t('sc.delTake',{n:i+1}));db.title=t('sc.delTake',{n:i+1});
    db.onclick=async()=>{if(!await confirmDlg(t('sc.delTake',{n:i+1})+'?','',t('cf.del'),t('voices.cancel')))return;if(P.owner==='take:'+k.id)pStop();delete SC.takes[k.id];await delTakes([k.id]);
      if(l.take===k.id){const rest=scTakesOf(l);l.take=rest.length?rest[rest.length-1].id:null}saveDoc();scLineStatus(l);scPrompt()};
    const wb=elx('button','','⤓');wb.type='button';wb.setAttribute('aria-label',t('sc.dlTake',{n:i+1}));wb.title=t('sc.dlTake',{n:i+1});wb.onclick=()=>bab?scDlLine(l):scDlTake(l,k,i);
    row.append(lab,pb,wb,db);
    if(k.warn){const w=elx('p','warnnote',k.warn==='short'?t('sc.tkShort'):t('sc.tkMissing')+': '+k.warn.slice(8));row.appendChild(w)}
    box.appendChild(row)});
  const fr=elx('div','pm-tkrow'),fb=elx('button','pm-tkbtn',t('sc.fileBtn'));fb.type='button';fb.disabled=!!SC.sess;fb.onclick=()=>scPickFile(l);fr.appendChild(fb);box.appendChild(fr)}
// one line as a WAV, as it goes into the game zip: named by line id, so it can replace that file in the game
async function scDlLine(l){await ready();let buf=null;
  if(SCR.kindOf(SC.doc,l)==='babble'){const r=scBabble(l);if(r)buf=await scBake(r.buf,r.wet)}else{const tk=l.take&&SC.takes[l.take];if(tk)buf=await scTakeBuf(tk)}
  if(!buf)return;try{await scSave(new Blob([encodeWav(buf)],{type:'audio/wav'}),l.id+'.wav')}catch(e){scNote(t('make.dlErr',{m:(e&&e.message)||'?'}),true)}}
async function scDlTake(l,k,i){await ready();const buf=await scTakeBuf(k);try{await scSave(new Blob([encodeWav(buf)],{type:'audio/wav'}),l.id+(l.take===k.id?'':'-take'+(i+1))+'.wav')}catch(e){scNote(t('make.dlErr',{m:(e&&e.message)||'?'}),true)}}
// prompter text size: personal, kept in this browser
const PMZ=[.6,.7,.8,.9,1,1.15,1.3,1.5];let pmz=4;try{const v=+localStorage.getItem('bm.pmSize');if(PMZ.includes(v))pmz=PMZ.indexOf(v)}catch(e){}
function pmSize(d){pmz=Math.max(0,Math.min(PMZ.length-1,pmz+d));$('scPm').style.setProperty('--pmz',PMZ[pmz]);$('pmSmaller').disabled=pmz===0;$('pmBigger').disabled=pmz===PMZ.length-1;
  if(d)try{localStorage.setItem('bm.pmSize',String(PMZ[pmz]))}catch(e){}}
$('pmSmaller').onclick=()=>pmSize(-1);$('pmBigger').onclick=()=>pmSize(1);pmSize(0);
{const box=$('pmTakes'),ok=e=>!SC.sess&&scLine()&&[...(e.dataTransfer&&e.dataTransfer.types||[])].includes('Files');
  box.addEventListener('dragover',e=>{if(!ok(e))return;e.preventDefault();box.classList.add('drop')});
  box.addEventListener('dragleave',()=>box.classList.remove('drop'));
  box.addEventListener('drop',e=>{box.classList.remove('drop');if(!ok(e))return;e.preventDefault();const f=e.dataTransfer.files[0];if(f)scImport(scLine(),f)})}
// --- following the voice: on-device speech recognition only (never the server version: sound would leave the browser) ---
const SRC=window.SpeechRecognition,SPLANG={en:'en-US',nl:'nl-NL'};
async function speechState(lang){if(!SRC||typeof SRC.available!=='function'||!('processLocally' in SRC.prototype))return 'unavailable';
  try{return await SRC.available({langs:[SPLANG[lang]],processLocally:true})}catch(e){return 'unavailable'}}
async function scSpeechCheck(){if(!SC.doc)return;const lang=SC.doc.lang,v=await speechState(lang);SC.speech[lang]=v;if(!SC.doc||SC.doc.lang!==lang)return;
  const ib=$('pmInstall');ib.hidden=!(v==='downloadable'||v==='downloading');ib.disabled=v==='downloading';ib.textContent=v==='downloading'?t('sc.installing'):t('sc.install');scCtl()}
$('pmInstall').onclick=async()=>{const lang=SC.doc.lang,ib=$('pmInstall');ib.textContent=t('sc.installing');ib.disabled=true;let ok=false;
  try{ok=await SRC.install({langs:[SPLANG[lang]],processLocally:true})}catch(e){}if(!ok)scNote(t('sc.installFail'),true);await scSpeechCheck();ib.disabled=false};
function scSpeechStart(ss){let r;try{r=new SRC();r.processLocally=true}catch(e){ss.voice=false;return}
  if(r.processLocally!==true){ss.voice=false;return}
  r.lang=SPLANG[SC.doc.lang];r.continuous=true;r.interimResults=true;
  r.onresult=e=>{if(SC.sess!==ss)return;ss.nRes=e.results.length;let txt='';for(let i=ss.resFrom;i<e.results.length;i++)txt+=' '+e.results[i][0].transcript;ss.heard=txt};
  r.onerror=e=>{if(/not-allowed|language|service|network/.test(e.error||'')){ss.voice=false;ss.rec=null;scCtl()}};
  r.onend=()=>{if(SC.sess===ss&&ss.voice&&ss.rec===r){ss.nRes=0;ss.resFrom=0;try{r.start()}catch(e){ss.voice=false;scCtl()}}};
  try{r.start();ss.rec=r}catch(e){ss.voice=false}}
// --- a recording session: listens, starts a take at the first sound, ends it on the pause after the line, moves on ---
async function scStart(){const l=scLine(),again=scAgain(l);if(!l||!again&&!SCR.nextRecord(SC.doc,l.id,SC.takes))return;await ready();pStop();$('pmErr').hidden=true;
  if(SS.mic.status!=='granted'){const ok=await micStart();if(!ok){$('pmErr').textContent=$('micState').textContent;$('pmErr').hidden=false;return}}
  const useWorklet=await loadRecWorklet(),sr=ctx.sampleRate;await scSpeechCheck();if(SC.sess)return;
  const ss={state:'wait',sr,chunks:[],n:0,startN:0,f:null,word:-1,voice:SC.speech[SC.doc.lang]==='available',rec:null,heard:'',resFrom:0,nRes:0,last:performance.now(),raf:0,buf:new Float32Array(SS.mic.an.fftSize),floor:0};
  ss.stopAfter=again;SC.sess=ss;
  const mute=ctx.createGain();mute.gain.value=0;mute.connect(ctx.destination);let p;
  const take=d=>{if(SC.sess!==ss)return;ss.chunks.push({at:ss.n,d});ss.n+=d.length;if(ss.state==='wait'){const keep=ss.n-sr*2;while(ss.chunks.length&&ss.chunks[0].at+ss.chunks[0].d.length<keep)ss.chunks.shift()}};
  if(useWorklet){p=new AudioWorkletNode(ctx,'babble-recorder',{numberOfInputs:1,numberOfOutputs:1,channelCount:1,channelCountMode:'explicit'});p.port.onmessage=e=>take(e.data.d)}
  else{p=ctx.createScriptProcessor(4096,1,1);p.onaudioprocess=ev=>take(new Float32Array(ev.inputBuffer.getChannelData(0)))}
  SS.mic.src.connect(p);p.connect(mute);ss.proc=p;ss.mute=mute;
  if(ss.voice)scSpeechStart(ss);
  scArm();ss.raf=requestAnimationFrame(scLoop);say(t('sc.listening'));
  if(matchMedia('(max-width:1000px)').matches)$('pmWho').scrollIntoView({block:'start'})}
function scArm(){const ss=SC.sess;let l=scLine();if(!ss)return;if(P.owner==='cue')pStop();ss.cueLine=null;
  if(l&&!norm(SCR.recText(SC.doc,l))){l=SCR.nextRecord(SC.doc,l.id,SC.takes);if(l)scMarkCur(l.id)} // a babble line is a cue, not a take
  if(!l||!norm(SCR.recText(SC.doc,l))){scStop();return}
  ss.state='wait';ss.word=-1;ss.al=null;ss.resFrom=ss.nRes;ss.heard='';
  const ws=SCR.wordsOf(SCR.recText(SC.doc,l),SC.doc.lang);ss.f=SCR.makeFollower(Math.max(1,SCR.sylTotal(ws)),SC.sps[l.character],SCR.stopsOf(ws));if(ss.floor)ss.f.floor=ss.floor;
  const cue=SCR.cueBefore(SC.doc,l.id).map(x=>({l:x,a:scBabble(x)})),p=SCR.partsOf(l.text); // then the babble before your part of a mixed line
  if(p.has&&SCR.kindOf(SC.doc,l)==='babble')cue.push({l,own:true,a:scBabbleText(l,p.before,1)});
  cue.splice(0,cue.length,...cue.filter(x=>x.a));
  if(cue.length){ss.state='cue';scNote('');scCue(ss,cue,0);return}
  scListen(ss)}
// the babble lines before yours play first; listening starts when they end (the take never contains them)
function scCue(ss,cue,i){if(SC.sess!==ss||ss.state!=='cue')return;const q=cue[i];if(!q)return scListen(ss,true);ss.cueLine=q.own?null:q.l;scPrompt();
  const r=q.a;if(wet)wet.gain.value=r.wet;pPlay(r.buf,'cue',{onend:(ow,ended)=>{if(ended)scCue(ss,cue,i+1)}})}
function scListen(ss,afterCue){if(SC.sess!==ss)return;ss.cueLine=null;ss.state='wait';ss.armN=ss.n;
  ss.hush=afterCue?performance.now()+400:0; // the room still rings for a moment after a cue from speakers
  scNote(t('sc.wait'));scPrompt()}
function scMarkCur(id){SC.cur=id;document.querySelectorAll('#scDoc .ln').forEach(x=>x.classList.toggle('cur',x.dataset.id===id))}
function scLoop(){const ss=SC.sess;if(!ss)return;const m=SS.mic;
  if(!m.an||m.status!=='granted'){scStop();$('pmErr').textContent=t('rec.micLost');$('pmErr').hidden=false;return}
  const now=performance.now(),dt=Math.min(.1,(now-ss.last)/1000);ss.last=now;
  (ss.state==='cue'&&an?an:m.an).getFloatTimeDomainData(ss.buf);let q=0;for(const v of ss.buf)q+=v*v;const rms=Math.sqrt(q/ss.buf.length),lvl=Math.max(0,Math.min(1,(20*Math.log10(rms+1e-9)+60)/54)),nOn=Math.round(lvl*30);
  const mt=$('meter3').children;for(let i=0;i<mt.length;i++)mt[i].classList.toggle('on',i<nOn);
  if((ss.state==='wait'&&now>=(ss.hush||0))||ss.state==='talk'){const f=ss.f,was=f.state;SCR.follow(f,rms,dt);
    if(was==='wait'&&f.state==='talk'){ss.state='talk';ss.startN=Math.max(ss.armN||0,ss.n-Math.round(ss.sr*(.35+f.hold)));scNote('');scCtl()}
    if(ss.state==='talk'){const l=scLine(),ws=SCR.wordsOf(SCR.recText(SC.doc,l),SC.doc.lang);let k;
      if(ss.voice){const al=SCR.alignWords(ws,ss.heard);ss.al=al;k=al.pos;if(al.pos>=ws.length&&f.silent>=.35)f.state='done'}else k=SCR.wordAt(ws,f.pos);
      if(k!==ss.word){ss.word=k;scWords()}
      if(f.state==='done')scEndTake()}}
  ss.raf=requestAnimationFrame(scLoop)}
function scSlice(ss,a,b){const out=new Float32Array(Math.max(0,b-a));ss.chunks.forEach(c=>{const s0=Math.max(a,c.at),e0=Math.min(b,c.at+c.d.length);if(e0>s0)out.set(c.d.subarray(s0-c.at,e0-c.at),s0-a)});return out}
function scEndTake(){const ss=SC.sess;if(!ss||ss.state!=='talk')return;ss.state='saving';scCtl();const l=scLine(),f=ss.f,al=ss.al,voice=ss.voice;
  setTimeout(async()=>{if(SC.sess!==ss)return; // the last batch from the recorder has arrived
    const res=SCR.finishTake(scSlice(ss,ss.startN,ss.n),ss.sr);ss.floor=f.floor;ss.chunks=ss.chunks.slice(-2);
    if(!res||!SC.doc.lines.includes(l)){if(ss.stopAfter)return scStop();scArm();scNote(t('sc.noSound'),true);return}
    const said=SCR.recText(SC.doc,l),ws=SCR.wordsOf(said,SC.doc.lang),syl=SCR.sylTotal(ws);let warn='';
    if(voice&&al){const miss=al.missing.concat(ws.map((_,i)=>i).slice(al.pos));if(miss.length)warn='missing:'+miss.map(i=>ws[i].w).join(' ')}
    else if(SCR.tooShort(f.voiced,syl,f.base))warn='short';
    if(!warn)SC.sps[l.character]=SCR.learnTempo(f.base,f.voiced,syl);
    const tk={id:'t'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36),script:SC.doc.id,line:l.id,text:said,sr:res.sr,pcm:res.pcm,dur:res.dur,created:Date.now(),warn};
    SC.takes[tk.id]=tk;l.take=tk.id;try{if(DB.db)await dbReq('takes','readwrite',o=>{o.put(tk)});storeOk()}catch(e){storeErr(e)}
    saveDoc(true);scLineStatus(l);if(SC.sess!==ss)return scPrompt();
    const n=scTakesOf(l).length,msg=warn==='short'?t('sc.short'):warn?t('sc.missing',{words:warn.slice(8)}):t(n>1?'sc.savedChosen':'sc.saved',{n}),nx=SCR.nextFor(SC.doc,l.id,SC.takes);
    if(ss.stopAfter||!nx){scStop();scNote(nx?msg:msg+' '+t('sc.allDone',{name:charName(charOf(l.character))}),!!warn);say($('pmNote').textContent);return}
    scSetCur(nx.id);scArm();scNote(msg,!!warn);say(msg)},150)}
// leaving a take without keeping it (another line chosen while speaking)
function scDiscard(){const ss=SC.sess;if(ss&&(ss.state==='talk'||ss.state==='wait'||ss.state==='cue'))scArm()}
function scStop(){const ss=SC.sess;if(!ss)return;SC.sess=null;cancelAnimationFrame(ss.raf);if(P.owner==='cue')pStop();
  try{SS.mic.src&&SS.mic.src.disconnect(ss.proc)}catch(e){}try{ss.proc.disconnect();ss.mute.disconnect()}catch(e){}
  if(ss.proc.port){ss.proc.port.onmessage=null;ss.proc.port.postMessage('stop')}else ss.proc.onaudioprocess=null;
  if(ss.rec){const r=ss.rec;ss.rec=null;try{r.abort()}catch(e){}}
  micRelease();scNote('');scPrompt()}
function scRecBtn(){const ss=SC.sess;if(!ss)scStart();else if(ss.state==='talk')scEndTake();else if(ss.state==='wait'||ss.state==='cue')scStop()}
$('pmRec').onclick=scRecBtn;
function scGo(d){const L=SCR.ordered(SC.doc),l=scLine(),i=L.indexOf(l);let nx=null;
  if(d>0)nx=(l&&SCR.nextFor(SC.doc,l.id,SC.takes))||L[i+1];else nx=L[i-1];if(!nx)return;
  scSetCur(nx.id);const el=document.querySelector('#scDoc [data-id="'+nx.id+'"]');if(el)el.scrollIntoView({block:'nearest'})}
$('pmPrev').onclick=()=>scGo(-1);$('pmSkip').onclick=()=>{const ss=SC.sess;if(ss&&ss.state==='cue'){if(P.owner==='cue')pStop();scListen(ss,true)}else scGo(1)};
mkMeter($('meter3'));
// Space starts and stops (not while typing or on another button), Esc stops and keeps a take in progress (then leaves Big),
// F switches Big on and off; in a ⋯ menu the arrows move and Esc closes it
document.addEventListener('keydown',e=>{if(st.view!=='script'||document.querySelector('dialog[open]'))return;const tg=e.target||{},tag=tg.tagName,typing=['TEXTAREA','INPUT','SELECT'].includes(tag)||tg.isContentEditable;
  const m=tg.closest&&tg.closest('.menu.open');
  if(m&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();const b=[...m.querySelectorAll('button')],i=b.indexOf(tg);b[(i+(e.key==='ArrowDown'?1:-1)+b.length)%b.length].focus();return}
  if(e.key==='Escape'&&document.querySelector('#viewScript .menu.open')){e.preventDefault();const o=document.querySelector('#viewScript .menu.open'),b=document.querySelector('[data-menu="'+o.id+'"]');menuClose();if(b)b.focus();return}
  if(e.key==='Escape'&&SC.sess){e.preventDefault();const ss=SC.sess;if(ss.state==='talk'){ss.stopAfter=true;scEndTake()}else if(ss.state!=='saving')scStop();return}
  if(e.key==='Escape'&&document.body.classList.contains('sc-focus')){e.preventDefault();scFocus(false);return}
  if((e.key==='f'||e.key==='F')&&!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();scFocus(!document.body.classList.contains('sc-focus'));return}
  if(e.key===' '&&!e.repeat&&!typing&&!['BUTTON','A','SUMMARY'].includes(tag)){e.preventDefault();scRecBtn()}});
window.addEventListener('resize',()=>{if(st.view==='script'){fitAll();scWidths()}});

// ---------- language switch ----------
function applyLang(){
  document.documentElement.lang=LANGUI;
  document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
  document.querySelectorAll('[data-t-aria]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.tAria));if(el.classList.contains('iconbtn'))el.title=t(el.dataset.tAria)}); // an icon-only button also gets its name on hover
  document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===LANGUI)));
  buildEngines();refreshSide();renderVoices();renderChars();if(cur())showResult();refreshPrep();stStep(SS.step);
  if(SS.result&&!$('checkBody').hidden)showCheck();
  if(st.view==='script'&&SC.doc)scRender();
  if(!$('txt').value||EXAMPLES.some(x=>x.text.en===$('txt').value||x.text.nl===$('txt').value)){const ex=EXAMPLES.find(x=>x.text.en===$('txt').value||x.text.nl===$('txt').value)||EXAMPLES[0];$('txt').value=ex.text[LANGUI];checkStale()}
}
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{LANGUI=b.dataset.lang;try{localStorage.setItem('bm.lang',LANGUI)}catch(e){}applyLang()});
window.addEventListener('resize',()=>{const r=cur();if(r&&!$('playerRow').hidden)drawWave($('wave'),r.pcm,0)});

// ---------- boot ----------
buildEngines();$('txt').value=EXAMPLES[0].text[LANGUI];applyLang();setPlayLabel(false);
if(location.hash==='#my-voices')showView('voices');else if(location.hash==='#script')openScript();

// ---------- character: mouth follows the sound, blinks now and then ----------
(function face(){const d=new Float32Array(1024);
  const f=()=>{let rms=0;if(an&&P.src&&st.view==='make'){an.getFloatTimeDomainData(d);for(const v of d)rms+=v*v;rms=Math.sqrt(rms/d.length)}
    $('mouth').setAttribute('ry',(1.5+Math.min(11,rms*45)).toFixed(1));$('orbRing').style.transform='scale('+(1+Math.min(.35,rms*2.2)).toFixed(3)+')';$('orb').setAttribute('r',(32+Math.min(6,rms*40)).toFixed(1));requestAnimationFrame(f)};f()})();
setInterval(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;['eyeL','eyeR'].forEach(id=>$(id).setAttribute('r','0.8'));setTimeout(()=>['eyeL','eyeR'].forEach(id=>$(id).setAttribute('r','5.5')),130)},3800);
$('addVoiceTop').onclick=()=>openStudio();
setBodyEngine();
