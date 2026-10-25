// ===================================================================
// Babble Engine UI. Three parts kept apart:
//   1. i18n + static data      2. make screen (generation, playback)
//   3. voices storage           4. studio (mic, prompter, recording, check)
// Synthesis lives in the core above and is not changed here.
// ===================================================================
const $=id=>document.getElementById(id);

// ---------- 1. i18n ----------
const STR={en:{
'nav.make':'Make babble','nav.voices':'Voices & characters','make.title':'Make babble','make.lead':'Choose a sound style and voice. Then enter your text.',
'make.style':'Sound style','make.who':'Who speaks','make.say':'What does {name} say?','make.sayV':'What does {name} want to say?','make.tune':'Tune {name}','make.gVoice':'Voice styles','make.gSound':'Sound styles','make.text':'Text','make.examples':'Choose example text','make.result':'Result','make.emptyHint':'Nothing generated yet.',
'make.generate':'Generate','make.speak':'▶ Speak','make.bubbleHint':'Click a voice, an emotion or press Speak.','side.record':'Record your voice','make.stale':'Text or settings changed. This result belongs to the previous settings.','make.regen':'Generate again',
'make.takes':'Variants','make.saveChar':'Save as character','char.name':'Name of the character','char.save':'Save','char.cancel':'Cancel',
'char.saved':'“{name}” saved.','char.title':'Characters',
'char.empty':'No characters yet.','char.use':'Use','char.tag':'Character','make.takeN':'Variant {i}','make.takeOld':'earlier settings','make.addTake':'+ Save variant','make.delTake':'Remove variant {i}','make.saveHelp':'Save a variant to keep your settings and quickly compare variants. Save your variant as a character once you are happy with the result.','make.helpAria':'About variants and characters','make.download':'Download WAV','make.downloadZip':'Download WAV (.zip)','make.busy':'Generating…',
'make.play':'▶ Play','make.stopPlay':'■ Stop','make.ready':'Result ready, {s} seconds.',
'make.dlErr':'The download didn’t work ({m}). Try again, or generate the line again.','make.dlDeclined':'Download cancelled.','make.dlDone':'Saved as {f}.',
'foot.audio':'Audio you make with Babble Engine is yours to use, also commercially.','foot.code':'Source code (MIT)',
'side.title':'Voice and delivery','side.voice':'Voice','side.sound':'Sound','side.instrument':'Instrument','side.add':'Add your own voice',
'side.intent':'Intent','side.emotion':'Emotion','side.length':'Length','side.auto':'Auto','side.short':'Short','side.medium':'Medium',
'side.lenHint':'Auto picks short or medium based on the length of your text.','side.anchors':'Fixed phrases','side.ancUse':'Use in the clip',
'side.ancAuto':'Sometimes','side.ancAlways':'Always','side.ancNever':'Never','side.ancHint':'Click a phrase to hear it with the selected voice.',
'side.adv':'Advanced','side.presets':'Voices','side.own':'Own recordings','side.ownLabel':'Own recording · {n} sounds','side.ownPartial':'Own recording · incomplete ({d} of {t} lines)',
'side.saved':'“{name}” is saved. Choose a voice style (not Soft Tones or Talking Instruments) to use it.','side.savedSel':'“{name}” is saved and selected. Generate to hear it.',
'adv.pitch':'Pitch','adv.pitchH':'Higher or lower voice.','adv.note':'Base note','adv.noteH':'The note the melody starts from.',
'adv.speed':'Tempo','adv.speedH':'How fast the line is spoken.','adv.expr':'Expression','adv.exprH':'How much the melody moves up and down.',
'adv.range':'Melody range','adv.rangeH':'How far the notes move from the base note.','adv.form':'Throat size','adv.formH':'Larger sounds deeper and fuller, smaller sounds brighter.',
'adv.breath':'Breath','adv.breathH':'More breath sounds hoarser and softer.','adv.tilt':'Brightness','adv.tiltH':'Duller or brighter sound.','adv.steady':'Pitch steadiness','adv.steadyH':'For your own voice: holds every syllable on the melody. Lower it to keep more of how you read it.','adv.hiss':'Consonant hiss','adv.hissH':'The sss and kh of consonants, and the radio crackle. Lower it for a cleaner voice.',
'adv.amb':'Background sound','adv.ambOff':'Off','adv.ambRain':'Rain','adv.ambBreeze':'Breeze','adv.ambWaves':'Waves','adv.ambLvl':'Background level',
'adv.ambH':'Not in the download.','adv.allTitle':'All styles','adv.listen':'While listening','adv.lang':'Language','adv.newLang':'New language',
'adv.langH':'Babblish turns every word into fixed made-up syllables. A new language changes which syllables it uses.',
'voices.title':'Voices & characters','voices.own':'Recorded voices','voices.lead':'Recorded voices and characters. They stay in this browser only.',
'voices.empty':'You don’t have any voices of your own yet. Add one to hear your text in your own voice.','voices.stored':'Saved in this browser only.',
'voices.session':'This browser doesn’t allow saving, so voices only last for this session.','voices.use':'Use','voices.rename':'Rename','voices.delete':'Delete',
'voices.save':'Save','voices.cancel':'Cancel','voices.info':'{n} sounds · {when}','voices.complete':'Complete','voices.partial':'Incomplete','voices.basis':'Basic round','voices.deep':'Basic + depth round','voices.old':'Older script',
'voices.deepen':'Add depth round ({t})',
'voices.sessionTag':'This session','voices.delTitle':'Delete “{name}”?','voices.delText':'The recording is removed from this browser. This can’t be undone.',
'voices.inUseIncompat':'“{name}” works with voice styles only. Switch away from Soft Tones or Talking Instruments to use it.',
'st.title':'Add your own voice','st.private':'Your recording stays in this browser. Nothing is uploaded.','st.s1':'Prepare','st.s2':'Record','st.s3':'Check','st.back':'Back to babble','st.close':'Close recording',
'prep.mic':'Check your microphone','prep.micHint':'Speak at a normal volume and watch the level.','prep.micLabel':'Microphone','prep.micAsk':'Allow microphone',
'prep.micRetry':'Try again','prep.micIdle':'Your browser asks for permission when you click the button.','prep.micAsking':'Waiting for permission…',
'prep.micOn':'Microphone access is on.','prep.micSignal':'Microphone is receiving sound','prep.micQuiet':'No sound measured yet. Say something.',
'prep.micDenied':'Microphone access was denied. In this Claude preview the microphone is blocked; when you host the page yourself you can allow it in your browser’s site settings. You can also upload a recording below.',
'prep.micNone':'No microphone was found. Connect one and try again, or upload a recording below.',
'prep.micBusy':'The microphone can’t be used right now, possibly because another app is using it. Close that app and try again, or upload a recording below.',
'prep.micUnsupported':'This browser or environment doesn’t offer microphone access. Upload a recording below instead.',
'prep.how':'How it works','prep.h1':'Listen to the example.','prep.h2':'Say the four sounds in one breath.','prep.h3':'During the recording, follow the highlighted sounds.',
'prep.listen':'Listen to an example','prep.headphones':'Use headphones so the guide tone isn’t recorded.','prep.settings':'Recording settings',
'prep.tempo':'Tempo','prep.relaxed':'Relaxed','prep.normal':'Normal','prep.note':'Your note',
'prep.low':'Low','prep.mid':'Medium','prep.high':'High','prep.playNote':'Play this note','prep.guide':'Guide tone','prep.on':'On','prep.off':'Off',
'prep.showScript':'Show full script','prep.hideScript':'Hide script','prep.sum':'{tempo} tempo · note {note} · guide tone {guide}',
'prep.calc':'{n} lines, {k} sounds · about {t} in total','prep.practice':'Practice two lines','prep.toRecord':'Go to recording',
'prep.needMic':'Allow the microphone first to record here.','prep.altTitle':'No microphone here?',
'prep.altText':'Record with your phone or another app, then upload the file. The reading guide shows the script at the right pace while you record elsewhere.',
'prep.upload':'Upload a recording','prep.guideOnly':'Start reading guide','prep.guideNote':'Reading guide only. Nothing is recorded.',
'prep.practiceDone':'Practice finished. Nothing was recorded.',
'rec.notStarted':'Not started','rec.recording':'Recording','rec.paused':'Paused','rec.practice':'Practising · nothing is recorded','rec.guide':'Reading guide only · nothing is recorded',
'rec.line':'Line {i} of {n}','rec.readyRec':'When you start, a count-in of three beats plays. Then line 1 begins. Rest during each pause.',
'rec.readyPractice':'Two lines to get the feel for the pace. Nothing is recorded.','rec.readyGuide':'Start your own recorder first. Then start the guide and read along. Nothing is recorded here.',
'rec.readyRedo':'You will record {what}. A count-in plays first.','rec.oneLine':'line {i}','rec.someLines':'{n} lines',
'rec.start':'● Start recording','rec.startPractice':'Start practice','rec.startGuide':'Start reading guide','rec.listen':'Listen','rec.speak':'Speak now',
'rec.wait':'Wait a moment','rec.left':'{t} to go','rec.lastLeft':'Last line · {t} to go','rec.pause':'❚❚ Pause','rec.resume':'▶ Resume','rec.redo':'Redo line','rec.stop':'Stop',
'rec.hintRest':'The next line starts after the rest.','rec.hintPaused':'Paused. The current line starts over when you resume.',
'rec.micLost':'The microphone stopped. What was recorded so far is kept.','rec.started':'Recording started.','rec.pausedSr':'Recording paused.',
'chk.title':'Listen to your voice','chk.lead':'Check your recording and try the result as babble.','chk.upLabel':'Choose a recording',
'chk.upHint':'Ideally you read the script from this studio. Any audio format your browser plays works (mp3, m4a, wav, ogg).','chk.proc':'Processing your recording…',
'chk.a':'1. Your recording','chk.aHint':'The sounds you recorded.','chk.lines':'View recorded lines','chk.missing':'Record missing lines',
'chk.b':'2. As babble','chk.bHint':'An example made with your recording. Nothing is saved yet.','chk.name':'Name of your voice','chk.again':'Record again',
'chk.save':'Save and use','chk.session':'Use for this session only','chk.saveHint':'You return to your text with this voice selected.',
'chk.saveHintIncompat':'You return to your text. Choose a voice style to use this voice.',
'chk.play':'▶ Play','chk.pause':'❚❚ Pause','chk.prevPlay':'▶ Play example','chk.lineOk':'Recorded','chk.lineMiss':'Missing','chk.lineRedo':'Redo','chk.lineRec':'Record',
'chk.linePlay':'Play','chk.partial':'This recording is incomplete: {d} of {t} lines. Missing sounds are replaced with the closest recorded sound. Record the missing lines for the best result.',
'chk.unlabeled':'This recording doesn’t match the script, so sounds are picked at random instead of by script position. For the best result, read the script from this studio.',
'chk.tooLittle':'Too little clear speech was found. Record again a bit closer to the microphone, or choose another file.','chk.badFile':'Your browser can’t read this file. Try mp3, m4a, wav or ogg.',
'chk.saveFail':'Saving in this browser failed ({m}). Your recording is still here: try again, or use it for this session only.',
'chk.nameDefault':'My voice','chk.noLines':'No lines were recorded.',
'cf.leaveTitle':'Leave without saving?','cf.leaveText':'Your recording hasn’t been saved yet and will be lost.','cf.leaveYes':'Discard recording','cf.leaveNo':'Keep working',
'cf.del':'Delete','ex.title':'Choose example text','ex.close':'Close','ex.general':'General','ex.vemmo':'Vemmo · De Workshopbende',
'scriptG':'General','scriptV':'Vemmo',
'prep.roundB':'Basic round: every consonant with every vowel.','prep.roundX':'Depth round for “{name}”: double vowels (ai, ow, ay).',
'chk.saveX':'Add to “{name}”','side.savedX':'Depth round added to “{name}”.','side.depthTip':'Tip: add the depth round in My voices ({t}).','min':'{m} min','sec':'{s} s'},
nl:{
'nav.make':'Gebrabbel maken','nav.voices':'Stemmen en personages','make.title':'Gebrabbel maken','make.lead':'Kies een klankstijl en stem. Voer daarna je tekst in.',
'make.style':'Klankstijl','make.who':'Wie spreekt','make.say':'Wat zegt {name}?','make.sayV':'Wat wil {name} zeggen?','make.tune':'{name} bijstellen','make.gVoice':'Stemstijlen','make.gSound':'Klankstijlen','make.text':'Tekst','make.examples':'Voorbeeldtekst kiezen','make.result':'Resultaat','make.emptyHint':'Nog niets gegenereerd.',
'make.generate':'Genereer','make.speak':'▶ Spreek','make.bubbleHint':'Klik op een stem, een emotie of druk op Spreek.','side.record':'Neem je stem op','make.stale':'Tekst of instellingen zijn gewijzigd. Dit resultaat hoort bij de vorige instellingen.','make.regen':'Opnieuw genereren',
'make.takes':'Varianten','make.saveChar':'Bewaar als personage','char.name':'Naam van het personage','char.save':'Bewaren','char.cancel':'Annuleren',
'char.saved':'“{name}” bewaard.','char.title':'Personages',
'char.empty':'Nog geen personages.','char.use':'Gebruiken','char.tag':'Personage','make.takeN':'Variant {i}','make.takeOld':'eerdere instellingen','make.addTake':'+ Variant opslaan','make.delTake':'Variant {i} weggooien','make.saveHelp':'Sla een variant op om je instellingen te bewaren en snel varianten te kunnen vergelijken. Sla je variant definitief op als personage als je tevreden bent met het resultaat.','make.helpAria':'Over varianten en personages','make.download':'Download WAV','make.downloadZip':'Download WAV (.zip)','make.busy':'Bezig met genereren…',
'make.play':'▶ Afspelen','make.stopPlay':'■ Stoppen','make.ready':'Resultaat klaar, {s} seconden.',
'make.dlErr':'Downloaden lukte niet ({m}). Probeer het opnieuw, of genereer de regel opnieuw.','make.dlDeclined':'Download geannuleerd.','make.dlDone':'Opgeslagen als {f}.',
'foot.audio':'Geluid dat je met Babble Engine maakt, mag je vrij gebruiken, ook commercieel.','foot.code':'Broncode (MIT)',
'side.title':'Stem en uitspraak','side.voice':'Stem','side.sound':'Geluid','side.instrument':'Instrument','side.add':'Eigen stem toevoegen',
'side.intent':'Bedoeling','side.emotion':'Emotie','side.length':'Lengte','side.auto':'Auto','side.short':'Kort','side.medium':'Middel',
'side.lenHint':'Auto kiest kort of middel op basis van de lengte van je tekst.','side.anchors':'Vaste uitdrukkingen','side.ancUse':'Gebruik in de clip',
'side.ancAuto':'Soms','side.ancAlways':'Altijd','side.ancNever':'Nooit','side.ancHint':'Klik op een uitdrukking om hem met de gekozen stem te horen.',
'side.adv':'Geavanceerd','side.presets':'Stemmen','side.own':'Eigen opnames','side.ownLabel':'Eigen opname · {n} klanken','side.ownPartial':'Eigen opname · onvolledig ({d} van {t} regels)',
'side.saved':'“{name}” is opgeslagen. Kies een stemstijl (niet Soft Tones of Talking Instruments) om hem te gebruiken.','side.savedSel':'“{name}” is opgeslagen en gekozen. Genereer om hem te horen.',
'adv.pitch':'Toonhoogte','adv.pitchH':'Hogere of lagere stem.','adv.note':'Grondtoon','adv.noteH':'De noot waar de melodie vanuit gaat.',
'adv.speed':'Tempo','adv.speedH':'Hoe snel de regel wordt uitgesproken.','adv.expr':'Expressie','adv.exprH':'Hoeveel de melodie op en neer gaat.',
'adv.range':'Melodiebereik','adv.rangeH':'Hoe ver de noten van de grondtoon af gaan.','adv.form':'Keelgrootte','adv.formH':'Groter klinkt dieper en voller, kleiner klinkt helderder.',
'adv.breath':'Adem','adv.breathH':'Meer adem klinkt heser en zachter.','adv.tilt':'Helderheid','adv.tiltH':'Doffere of helderdere klank.','adv.steady':'Toonvastheid','adv.steadyH':'Voor je eigen stem: houdt elke lettergreep op de melodie. Lager laat meer horen van hoe je het insprak.','adv.hiss':'Medeklinkerruis','adv.hissH':'De sss en kh van medeklinkers, en het geknetter van de radio. Lager geeft een schonere stem.',
'adv.amb':'Achtergrondgeluid','adv.ambOff':'Uit','adv.ambRain':'Regen','adv.ambBreeze':'Wind','adv.ambWaves':'Golven','adv.ambLvl':'Niveau achtergrond',
'adv.ambH':'Niet in de download.','adv.allTitle':'Alle stijlen','adv.listen':'Tijdens het luisteren','adv.lang':'Taal','adv.newLang':'Nieuwe taal',
'adv.langH':'Babblish maakt van elk woord vaste verzonnen lettergrepen. Een nieuwe taal verandert welke lettergrepen dat zijn.',
'voices.title':'Stemmen en personages','voices.own':'Opgenomen stemmen','voices.lead':'Opgenomen stemmen en personages. Ze staan alleen in deze browser.',
'voices.empty':'Je hebt nog geen eigen stemmen. Voeg er een toe om je tekst in je eigen stem te horen.','voices.stored':'Alleen bewaard in deze browser.',
'voices.session':'Deze browser staat bewaren niet toe, dus stemmen blijven alleen deze sessie bestaan.','voices.use':'Gebruiken','voices.rename':'Hernoemen','voices.delete':'Verwijderen',
'voices.save':'Opslaan','voices.cancel':'Annuleren','voices.info':'{n} klanken · {when}','voices.complete':'Volledig','voices.partial':'Onvolledig','voices.basis':'Basisronde','voices.deep':'Basis + verdieping','voices.old':'Ouder script',
'voices.deepen':'Verdieping opnemen ({t})',
'voices.sessionTag':'Deze sessie','voices.delTitle':'“{name}” verwijderen?','voices.delText':'De opname wordt uit deze browser verwijderd. Dit kan niet ongedaan worden gemaakt.',
'voices.inUseIncompat':'“{name}” werkt alleen met stemstijlen. Kies een andere stijl dan Soft Tones of Talking Instruments om hem te gebruiken.',
'st.title':'Eigen stem toevoegen','st.private':'Je opname blijft in deze browser. Er wordt niets geüpload.','st.s1':'Voorbereiden','st.s2':'Opnemen','st.s3':'Controleren','st.back':'Terug naar gebrabbel','st.close':'Opname afsluiten',
'prep.mic':'Controleer je microfoon','prep.micHint':'Spreek op normaal volume en bekijk het niveau.','prep.micLabel':'Microfoon','prep.micAsk':'Microfoon toestaan',
'prep.micRetry':'Opnieuw proberen','prep.micIdle':'Je browser vraagt om toestemming als je op de knop klikt.','prep.micAsking':'Wachten op toestemming…',
'prep.micOn':'Microfoontoegang staat aan.','prep.micSignal':'Microfoon ontvangt geluid','prep.micQuiet':'Nog geen geluid gemeten. Zeg iets.',
'prep.micDenied':'Toegang tot de microfoon is geweigerd. In deze Claude-voorvertoning is de microfoon geblokkeerd; als je de pagina zelf host, kun je toegang toestaan in de site-instellingen van je browser. Je kunt hieronder ook een opname uploaden.',
'prep.micNone':'Er is geen microfoon gevonden. Sluit er een aan en probeer het opnieuw, of upload hieronder een opname.',
'prep.micBusy':'De microfoon is nu niet te gebruiken, mogelijk omdat een ander programma hem gebruikt. Sluit dat programma en probeer het opnieuw, of upload hieronder een opname.',
'prep.micUnsupported':'Deze browser of omgeving biedt geen toegang tot een microfoon. Upload hieronder een opname.',
'prep.how':'Zo werkt het','prep.h1':'Luister naar het voorbeeld.','prep.h2':'Spreek de vier klanken in één adem uit.','prep.h3':'Volg tijdens de opname de gemarkeerde klanken.',
'prep.listen':'Luister naar een voorbeeld','prep.headphones':'Gebruik een koptelefoon zodat de voorbeeldtoon niet wordt mee opgenomen.','prep.settings':'Opname-instellingen',
'prep.tempo':'Tempo','prep.relaxed':'Rustig','prep.normal':'Normaal','prep.note':'Jouw toon',
'prep.low':'Laag','prep.mid':'Midden','prep.high':'Hoog','prep.playNote':'Speel deze toon','prep.guide':'Voorbeeldtoon','prep.on':'Aan','prep.off':'Uit',
'prep.showScript':'Volledig script tonen','prep.hideScript':'Script verbergen','prep.sum':'Tempo {tempo} · toon {note} · voorbeeldtoon {guide}',
'prep.calc':'{n} regels, {k} klanken · ongeveer {t} in totaal','prep.practice':'Oefen twee regels','prep.toRecord':'Naar opname',
'prep.needMic':'Sta eerst de microfoon toe om hier op te nemen.','prep.altTitle':'Geen microfoon hier?',
'prep.altText':'Neem op met je telefoon of een andere app en upload daarna het bestand. De voorleeshulp toont het script in het juiste tempo terwijl je elders opneemt.',
'prep.upload':'Opname uploaden','prep.guideOnly':'Voorleeshulp starten','prep.guideNote':'Alleen voorleeshulp. Er wordt niet opgenomen.',
'prep.practiceDone':'Oefening klaar. Er is niets opgenomen.',
'rec.notStarted':'Nog niet gestart','rec.recording':'Opname loopt','rec.paused':'Gepauzeerd','rec.practice':'Oefenen · er wordt niet opgenomen','rec.guide':'Alleen voorleeshulp · er wordt niet opgenomen',
'rec.line':'Regel {i} van {n}','rec.readyRec':'Na het starten tel ik drie tellen af. Daarna begint regel 1. Rust tijdens elke pauze.',
'rec.readyPractice':'Twee regels om het tempo te voelen. Er wordt niets opgenomen.','rec.readyGuide':'Start eerst je eigen recorder. Start daarna de voorleeshulp en lees mee. Hier wordt niets opgenomen.',
'rec.readyRedo':'Je neemt {what} op. Eerst klinkt een aftelling.','rec.oneLine':'regel {i}','rec.someLines':'{n} regels',
'rec.start':'● Start opname','rec.startPractice':'Start oefening','rec.startGuide':'Start voorleeshulp','rec.listen':'Luister','rec.speak':'Spreek nu',
'rec.wait':'Even wachten','rec.left':'Nog {t}','rec.lastLeft':'Laatste regel · nog {t}','rec.pause':'❚❚ Pauzeren','rec.resume':'▶ Hervatten','rec.redo':'Regel opnieuw','rec.stop':'Stoppen',
'rec.hintRest':'De volgende regel begint na de rustpauze.','rec.hintPaused':'Gepauzeerd. De huidige regel begint opnieuw als je hervat.',
'rec.micLost':'De microfoon is gestopt. Wat al is opgenomen, blijft bewaard.','rec.started':'Opname gestart.','rec.pausedSr':'Opname gepauzeerd.',
'chk.title':'Beluister je stem','chk.lead':'Controleer je opname en probeer het resultaat als gebrabbel.','chk.upLabel':'Kies een opname',
'chk.upHint':'Het beste is als je het script uit deze studio hebt voorgelezen. Elk audioformaat dat je browser afspeelt werkt (mp3, m4a, wav, ogg).','chk.proc':'Bezig met verwerken van je opname…',
'chk.a':'1. Je opname','chk.aHint':'De klanken die je hebt ingesproken.','chk.lines':'Opgenomen regels bekijken','chk.missing':'Ontbrekende regels opnemen',
'chk.b':'2. Als gebrabbel','chk.bHint':'Een voorbeeld gemaakt met jouw opname. Er wordt nog niets opgeslagen.','chk.name':'Naam van je stem','chk.again':'Opnieuw opnemen',
'chk.save':'Opslaan en gebruiken','chk.session':'Alleen voor deze sessie gebruiken','chk.saveHint':'Je keert terug naar je tekst met deze stem gekozen.',
'chk.saveHintIncompat':'Je keert terug naar je tekst. Kies een stemstijl om deze stem te gebruiken.',
'chk.play':'▶ Afspelen','chk.pause':'❚❚ Pauzeren','chk.prevPlay':'▶ Voorbeeld afspelen','chk.lineOk':'Opgenomen','chk.lineMiss':'Ontbreekt','chk.lineRedo':'Opnieuw','chk.lineRec':'Opnemen',
'chk.linePlay':'Afspelen','chk.partial':'Deze opname is onvolledig: {d} van {t} regels. Ontbrekende klanken worden vervangen door de dichtstbijzijnde opgenomen klank. Neem de ontbrekende regels op voor het beste resultaat.',
'chk.unlabeled':'Deze opname past niet op het script, dus klanken worden willekeurig gekozen in plaats van op scriptpositie. Lees voor het beste resultaat het script uit deze studio voor.',
'chk.tooLittle':'Er is te weinig duidelijke spraak gevonden. Neem opnieuw op, iets dichter bij de microfoon, of kies een ander bestand.','chk.badFile':'Je browser kan dit bestand niet lezen. Probeer mp3, m4a, wav of ogg.',
'chk.saveFail':'Opslaan in deze browser is mislukt ({m}). Je opname staat er nog: probeer het opnieuw, of gebruik hem alleen voor deze sessie.',
'chk.nameDefault':'Mijn stem','chk.noLines':'Er zijn geen regels opgenomen.',
'cf.leaveTitle':'Weggaan zonder op te slaan?','cf.leaveText':'Je opname is nog niet opgeslagen en gaat verloren.','cf.leaveYes':'Opname weggooien','cf.leaveNo':'Verder werken',
'cf.del':'Verwijderen','ex.title':'Voorbeeldtekst kiezen','ex.close':'Sluiten','ex.general':'Algemeen','ex.vemmo':'Vemmo · De Workshopbende',
'scriptG':'Algemeen','scriptV':'Vemmo',
'prep.roundB':'Basisronde: elke medeklinker met elke klinker.','prep.roundX':'Verdieping voor “{name}”: tweeklanken (ai, ow, ay).',
'chk.saveX':'Toevoegen aan “{name}”','side.savedX':'Verdieping toegevoegd aan “{name}”.','side.depthTip':'Tip: voeg de verdieping toe in Mijn stemmen ({t}).','min':'{m} min','sec':'{s} s'}};
let LANGUI='en';try{const l=localStorage.getItem('bm.lang');if(l==='nl'||l==='en')LANGUI=l}catch(e){}
function t(k,v){let s=(STR[LANGUI]&&STR[LANGUI][k])||STR.en[k]||k;if(v)for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s}
const say=msg=>{const r=$('sr');r.textContent='';setTimeout(()=>r.textContent=msg,30)};

const EMETA={
  animal:{name:'Critter Chatter',rec:true,d:{en:'A sped-up voice: one quick blip per letter.',nl:'Een versnelde stem: één snelle klank per letter.'}},
  sim:{name:'Babblish',rec:true,d:{en:'Made-up syllables carried by emotion, in a language that doesn’t exist.',nl:'Verzonnen lettergrepen gedragen door emotie, in een taal die niet bestaat.'}},
  vemmo:{name:'Vemmo',rec:true,d:{en:'The language of De Workshopbende: fixed phrases plus improvisation per intent.',nl:'De taal van De Workshopbende: vaste uitdrukkingen plus improvisatie per bedoeling.'}},
  grumble:{name:'Grumble',rec:true,d:{en:'Low mumbling on m, b and g. For monsters, trolls and grumpy farmers.',nl:'Laag gemompel op m, b en g. Voor monsters, trollen en chagrijnige boeren.'}},
  gizmo:{name:'Gizmo',rec:true,d:{en:'Short, stepped robot syllables with a bit-crushed edge. For machines and drones.',nl:'Korte, getrapte robotlettergrepen met een bitcrush-randje. Voor machines en drones.'}},
  sprite:{name:'Sprite',rec:true,d:{en:'High, quick whisper-talk: half breath, half voice. For fairies and tiny creatures.',nl:'Hoog en vlug fluisterpraten: half adem, half stem. Voor feeën en kleine wezentjes.'}},
  echo:{name:'Echo Folk',rec:true,d:{en:'Every line sounds like a small group talking at once. For villages and crowds.',nl:'Elke regel klinkt als een groepje dat door elkaar praat. Voor dorpen en menigtes.'}},
  radio:{name:'Mumble Radio',rec:true,d:{en:'Babble through a walkie-talkie, with hiss and squelch. For missions and dispatch.',nl:'Gebrabbel door een walkietalkie, met ruis en piepjes. Voor missies en meldkamers.'}},
  baby:{name:'Babytalk',rec:true,d:{en:'Toddler babble with doubled syllables (ba-ba, da-da) on the melody of your line.',nl:'Peutergebrabbel met verdubbelde lettergrepen (ba-ba, da-da) op de melodie van je zin.'}},
  tone:{name:'Soft Tones',rec:false,d:{en:'No voice: gentle tones that follow the melody of your text.',nl:'Geen stem: zachte tonen die de melodie van je tekst volgen.'}},
  instr:{name:'Talking Instruments',rec:false,d:{en:'A muted horn or a soft choir speaks your text.',nl:'Een gedempte hoorn of een zacht koor spreekt je tekst uit.'}}
};
const SHORT={animal:['one blip per letter','één klank per letter'],sim:['made-up syllables','verzonnen lettergrepen'],vemmo:['De Workshopbende','De Workshopbende'],grumble:['low mumbling','laag gemompel'],gizmo:['robot syllables','robotlettergrepen'],sprite:['whisper-talk','fluisterpraten'],echo:['a small group','een groepje'],radio:['walkie-talkie','walkietalkie'],baby:['ba-ba, da-da','ba-ba, da-da'],tone:['gentle tones','zachte tonen'],instr:['horn and choir','hoorn en koor']};
const ENGINE_ORDER=['animal','sim','vemmo','grumble','gizmo','sprite','echo','radio','baby','tone','instr'];
const FX={grumble:'grumble',gizmo:'gizmo',sprite:'sprite',radio:'radio'};
const V=(name,en,nl,p)=>Object.assign({name,d:{en,nl}},p);
const ENGINES={
  animal:{voices:{
    fern:V('Fern','cheerful, high','vrolijk, hoog',{pitch:360,speed:1.6,expr:.45,form:1,breath:.06,tilt:.55,oq:.56,jit:1,rate:2}),
    burt:V('Burt','grumpy, low','chagrijnig, laag',{pitch:150,speed:1.25,expr:.25,form:.92,breath:.08,tilt:.4,oq:.5,jit:1.3,rate:1.5}),
    pip:V('Pip','tiny, super fast','piepklein, razendsnel',{pitch:620,speed:2,expr:.55,form:1.05,breath:.04,tilt:.6,oq:.55,jit:1,rate:2.6}),
    lowell:V('Lowell','posh, measured','deftig, afgemeten',{pitch:230,speed:1.15,expr:.3,form:1,breath:.06,tilt:.45,oq:.58,jit:1,rate:1.7}),
    bleep:V('Bleep','little robot, stepped','robotje, gestapt',{pitch:260,speed:1.5,expr:.3,form:1,breath:0,tilt:.7,oq:.5,jit:0,rate:2,quant:true})}},
  sim:{voices:{
    lottie:V('Lottie','young woman','jonge vrouw',{pitch:215,speed:1,expr:.7,form:1.12,breath:.2,tilt:.45,oq:.65,jit:1}),
    ben:V('Ben','young man','jonge man',{pitch:112,speed:.95,expr:.65,form:.92,breath:.14,tilt:.38,oq:.58,jit:1}),
    kiki:V('Kiki','child, bouncy','kind, stuiterend',{pitch:320,speed:1.12,expr:.85,form:1.3,breath:.12,tilt:.5,oq:.62,jit:1}),
    hank:V('Grandpa Hank','older, shaky','ouder, beverig',{pitch:135,speed:.82,expr:.5,form:.95,breath:.32,tilt:.3,oq:.68,jit:2.2,vib:true}),
    whisper:V('Whisper','breathy, no voice','alleen adem, geen stem',{pitch:180,speed:.9,expr:.6,form:1.05,breath:.3,tilt:.35,oq:.65,jit:1,whisper:true}),
    bubs:V('Bubs','baby, babbling','baby, brabbelend',{pitch:420,speed:.9,expr:.95,form:1.55,breath:.1,tilt:.5,oq:.62,jit:1})}},
  vemmo:{voices:{
    jesse:V('Jesse','tutorial · warm, lively','tutorial · warm, levendig',{pitch:225,speed:1.05,expr:.7,form:1.12,breath:.16,tilt:.45,oq:.62,jit:1}),
    bram:V('Farmer Bram','fort · calm, low','fort · rustig, laag',{pitch:105,speed:.86,expr:.45,form:.9,breath:.18,tilt:.35,oq:.58,jit:1.1}),
    mila:V('Mila','fort · bright, quick','fort · helder, vlot',{pitch:250,speed:1.15,expr:.7,form:1.16,breath:.12,tilt:.55,oq:.6,jit:1})}},
  grumble:{voices:{
    grok:V('Grok','troll, very low','trol, heel laag',{pitch:78,speed:.85,expr:.45,form:.78,breath:.22,tilt:.3,oq:.55,jit:1.4}),
    moss:V('Mossbeard','old swamp creature, shaky','oud moeraswezen, beverig',{pitch:96,speed:.75,expr:.4,form:.82,breath:.3,tilt:.28,oq:.62,jit:2.2,vib:true}),
    burly:V('Burly','gruff farmer','norse boer',{pitch:112,speed:1,expr:.5,form:.86,breath:.18,tilt:.35,oq:.56,jit:1.2})}},
  gizmo:{voices:{
    bolt:V('Bolt','helpful bot','behulpzame robot',{pitch:220,speed:1.25,expr:.5,form:1,breath:0,tilt:.65,oq:.5,jit:0,quant:true}),
    cog:V('Cog','tiny drone, fast','klein droontje, snel',{pitch:420,speed:1.6,expr:.55,form:1.2,breath:0,tilt:.7,oq:.5,jit:0,quant:true}),
    unit9:V('Unit 9','deep, serious machine','diepe, serieuze machine',{pitch:118,speed:.95,expr:.35,form:.9,breath:0,tilt:.55,oq:.5,jit:0,quant:true})}},
  sprite:{voices:{
    fae:V('Fae','light and playful','licht en speels',{pitch:310,speed:1.45,expr:.75,form:1.38,breath:.45,tilt:.6,oq:.66,jit:1}),
    wisp:V('Wisp','tiny, almost only breath','piepklein, bijna alleen adem',{pitch:470,speed:1.75,expr:.7,form:1.5,breath:.58,tilt:.65,oq:.7,jit:1}),
    glimmer:V('Glimmer','warm forest spirit','warme bosgeest',{pitch:260,speed:1.25,expr:.65,form:1.25,breath:.38,tilt:.5,oq:.66,jit:1})}},
  echo:{voices:{
    village:V('Village','mixed group, chatty','gemengd groepje, kletsend',{pitch:190,speed:1,expr:.7,form:1.05,breath:.16,tilt:.42,oq:.62,jit:1}),
    crowd:V('Crowd','deeper voices, busy','lagere stemmen, druk',{pitch:140,speed:.95,expr:.6,form:.95,breath:.18,tilt:.38,oq:.6,jit:1.2}),
    kids:V('Kids','a group of children','een groepje kinderen',{pitch:300,speed:1.1,expr:.85,form:1.3,breath:.12,tilt:.5,oq:.62,jit:1})}},
  radio:{voices:{
    dispatch:V('Dispatch','calm and clipped','rustig en kortaf',{pitch:175,speed:1.1,expr:.45,form:1.02,breath:.1,tilt:.5,oq:.58,jit:1}),
    pilot:V('Pilot','low and steady','laag en stabiel',{pitch:118,speed:1,expr:.4,form:.92,breath:.12,tilt:.45,oq:.56,jit:1}),
    scout:V('Scout','excited, a bit fast','opgewonden, wat snel',{pitch:240,speed:1.3,expr:.75,form:1.1,breath:.14,tilt:.55,oq:.6,jit:1})}},
  baby:{voices:{
    tot:V('Tot','toddler, curious','peuter, nieuwsgierig',{pitch:380,speed:.95,expr:.95,form:1.52,breath:.1,tilt:.5,oq:.64,jit:1}),
    bubba:V('Bubba','chubby baby, giggly','mollige baby, giechelig',{pitch:330,speed:.85,expr:1,form:1.48,breath:.12,tilt:.45,oq:.66,jit:1.2}),
    mini:V('Mini','tiny and high','heel klein en hoog',{pitch:460,speed:1.05,expr:.9,form:1.58,breath:.08,tilt:.55,oq:.62,jit:1})}},
  tone:{voices:{
    clouds:V('Clouds','slow, airy pad that drifts','trage, luchtige klankwolk',{pitch:330,speed:.85,expr:.45,form:1,breath:0,tilt:.3,tone:'clouds'}),
    softbubble:V('Soft Bubbles','round bubbles in pairs','ronde bubbels in paartjes',{pitch:480,speed:.95,expr:.55,form:1,breath:0,tilt:.35,tone:'softbubble'}),
    rain:V('Raindrops','tiny drops, a few at a time','kleine druppels, een paar tegelijk',{pitch:420,speed:1,expr:.5,form:1,breath:0,tilt:.45,tone:'rain'}),
    breeze:V('Breeze','soft pitched wind','zacht windje op toon',{pitch:300,speed:.9,expr:.5,form:1,breath:0,tilt:.4,tone:'breeze'}),
    hum:V('Hum','closed-mouth mmm','neuriën met gesloten mond',{pitch:200,speed:.95,expr:.5,form:1,breath:0,tilt:.3,tone:'hum'}),
    purr:V('Purr','gentle, warm purring','zacht, warm spinnen',{pitch:180,speed:.9,expr:.35,form:1,breath:0,tilt:.3,tone:'purr'}),
    wood:V('Wood','soft wooden taps','zachte houten tikjes',{pitch:400,speed:1,expr:.55,form:1,breath:0,tilt:.45,tone:'wood'}),
    droplet:V('Droplet','round water bloops','ronde waterdruppels',{pitch:520,speed:1,expr:.6,form:1,breath:0,tilt:.5,tone:'droplet'}),
    kalimba:V('Kalimba','warm plucked tines','warme getokkelde tongetjes',{pitch:440,speed:1,expr:.55,form:1,breath:0,tilt:.55,tone:'kalimba'}),
    felt:V('Felt Keys','soft and round','zacht en rond',{pitch:330,speed:.95,expr:.5,form:1,breath:0,tilt:.35,tone:'felt'}),
    bubble:V('Pops','tiny rising pops','kleine stijgende popjes',{pitch:600,speed:1.1,expr:.6,form:1,breath:0,tilt:.5,tone:'bubble'}),
    glass:V('Glass','airy chimes','luchtige klokjes',{pitch:660,speed:.9,expr:.5,form:1,breath:0,tilt:.6,tone:'glass'})}},
  instr:{voices:{
    horn:V('Muted Horn','trumpet with a wah mute','trompet met wah-demper',{pitch:330,speed:1,expr:.7,form:1,breath:0,tilt:.55,tone:'horn'}),
    trombone:V('Trombone','low, wobbly wah','laag, wiebelende wah',{pitch:140,speed:.9,expr:.7,form:1,breath:0,tilt:.45,tone:'trombone'}),
    choir:V('Ooh Choir','three soft voices','drie zachte stemmen',{pitch:262,speed:.9,expr:.5,form:1,breath:0,tilt:.45,tone:'choir'})}}
};
const MOODNAME={neutraal:['Neutral','Neutraal'],blij:['Happy','Blij'],boos:['Angry','Boos'],verdrietig:['Sad','Verdrietig'],flirterig:['Flirty','Flirterig'],verbaasd:['Surprised','Verbaasd']};
const INTENTNAME={greet:['Greet','Begroeten','Warm and open. The melody rises and falls.','Warm en open. De melodie gaat omhoog en weer omlaag.'],
  bye:['Goodbye','Afscheid','Soft and content, slowly falling.','Zacht en tevreden, langzaam dalend.'],tell:['Tell','Vertellen','Neutral, a flat melody with a slight fall.','Neutraal, een vlakke melodie met een lichte daling.'],
  explain:['Explain','Uitleggen','Calm and clear, a little stress on every word.','Rustig en duidelijk, met een tikje nadruk per woordje.'],ask:['Ask','Vragen','Open, clearly up at the end.','Open, eindigt duidelijk omhoog.'],
  curious:['Curious','Nieuwsgierig','Surprised, rising across the whole line.','Verrast, stijgt over de hele zin.'],joy:['Joy','Blij','Exuberant and bouncy.','Uitbundig en huppelend.'],
  cheer:['Cheer','Aanmoedigen','Energetic, building toward the end.','Energiek, bouwt op naar het eind.'],think:['Think','Nadenken','Hesitant and slow, the end hangs.','Twijfelend en traag, het eind blijft hangen.'],
  letdown:['Letdown','Teleurgesteld','Mildly disappointed, fading down.','Licht teleurgesteld, zakt weg.'],agree:['Agree','Instemmen','Warm and agreeing, slightly falling.','Warm en instemmend, licht dalend.'],
  warn:['Warn','Waarschuwen','Firm without panic, low and flat.','Stevig zonder paniek, laag en vlak.']};
const ANCNAME={dovvi:['friendly hello','vriendelijk hallo'],shikka:['excited start','enthousiast beginnen'],shevay:['nailed it, well done','gelukt, goed zo'],navoo:['what do you think?','wat denk jij?'],takka:['once more, you can do it','nog een keer, je kan het'],vemmo:['together, join in, thanks','samen, doe mee, dank je']};
const ANC_INT={dovvi:'greet',shikka:'greet',shevay:'joy',navoo:'ask',takka:'cheer',vemmo:'agree'};
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
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++){const tt=i/len;d[i]=(Math.random()*2-1)*Math.pow(1-tt,3.2)*(i<ctx.sampleRate*.008?.2:1)}irData.push(d.slice())}
  const conv=ctx.createConvolver();conv.buffer=ir;wet=ctx.createGain();wet.gain.value=wetFor(st.engine);
  const shelf=ctx.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=6000;shelf.gain.value=-3;
  out.connect(shelf);shelf.connect(ctx.destination);shelf.connect(conv);conv.connect(wet);wet.connect(ctx.destination);
}
const wetFor=e=>({tone:.34,instr:.24,echo:.3,sprite:.28,radio:.03,gizmo:.08}[e]??.16);
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
  return {voice:k,mood:'neutraal',intent:'greet',len:'auto',anc:'auto',sl:s,take:Math.floor(Math.random()*1e6)}}
ENGINE_ORDER.forEach(e=>st.cfg[e]=defCfg(e));
try{const saved=JSON.parse(localStorage.getItem('bm.cfg')||'null');if(saved&&saved.cfg){for(const e of ENGINE_ORDER)if(saved.cfg[e])Object.assign(st.cfg[e],saved.cfg[e]);if(ENGINES[saved.engine])st.engine=saved.engine}}catch(e){}
const C=()=>st.cfg[st.engine];
function saveCfg(){try{localStorage.setItem('bm.cfg',JSON.stringify({engine:st.engine,cfg:st.cfg}))}catch(e){}}
const ownVoice=id=>st.voices.find(v=>v.id===id);
function voiceObj(){const c=C();if(c.voice.startsWith('own:')){const ov=ownVoice(c.voice.slice(4));if(ov)return {own:ov,preset:ENGINES[st.engine].voices[Object.keys(ENGINES[st.engine].voices)[0]]};c.voice=Object.keys(ENGINES[st.engine].voices)[0]}
  return {preset:ENGINES[st.engine].voices[c.voice]}}
function settingsKey(){const c=C();return JSON.stringify([st.engine,c.voice,st.engine==='vemmo'?c.intent:c.mood,st.engine==='vemmo'?[c.len,c.anc]:0,c.sl,$('txt').value,st.engine==='sim'?st.langSeed:0,HISS,STEADY])}
function lenFor(){const c=C();return c.len!=='auto'?c.len:($('txt').value.trim().length<=45?'short':'medium')}
function opts(){
  const c=C(),vo=voiceObj(),pv=vo.preset;
  const o={engine:st.engine,mood:st.engine==='vemmo'?c.intent:c.mood,P:c.sl.pitch,S:c.sl.speed,E:c.sl.expr,F:c.sl.form,breath:c.sl.breath,tilt:c.sl.tilt,
    hiss:HISS,oq:pv.oq,jit:pv.jit,rate:pv.rate||1,vib:!!pv.vib,quant:!!pv.quant,whisper:!!pv.whisper,tone:pv.tone,base:pv.pitch};
  if(vo.own){o.recF0=vo.own.median;o.steady=STEADY;o.base=ENGINES[st.engine].voices[Object.keys(ENGINES[st.engine].voices)[0]].pitch}
  return o;
}
// ---------- generation ----------
function buildTokens(variant){
  const c=C();
  if(st.engine==='vemmo'){
    let clip,guard=0;const prev=cur()?cur().text:'';
    do{clip=vemmoClip(c.intent,lenFor(),c.take+guard*7919,c.anc);guard++}while(variant&&clip.map(x=>x.text).join('')===prev&&guard<8);
    return clip;
  }
  let toks=tokenize($('txt').value,st.engine,st.langSeed,paletteLang(st.engine)||LANG);
  if(st.engine==='baby')toks=babyfy(toks);
  const c2=C();if(variant)c2.salt=Math.random(); // a new take on the same syllables; it stays when you change a setting
  if(c2.salt)toks.forEach(k=>{if(k.jit!==undefined)k.jit=(k.jit+c2.salt)%1});
  return toks;
}
function render(toks){
  const o=opts(),vo=voiceObj(),sr=ctx.sampleRate,tk=toks.map(x=>({...x}));
  const one=(tk2,o2)=>vo.own?renderSample(tk2,vo.own.grains,o2,sr):renderSynth(tk2,o2,sr);
  let r;if(st.engine==='tone'||st.engine==='instr')return renderTone(tk,o,sr);
  if(st.engine==='echo'){ // the same line by four voices, slightly apart in pitch, speed and timing
    const L=[[1,1,0,1],[.84,.97,.021,.7],[1.19,1.03,.037,.62],[.71,.95,.011,.5]],parts=L.map(([pm,sm,off,a],n)=>{const t2=toks.map(x=>({...x,jit:x.jit===undefined?x.jit:(x.jit+n*.29)%1}));return {r:one(t2,{...o,P:o.P*pm,S:o.S*sm}),off,a}});
    const N=Math.max(...parts.map(p=>p.r.pcm.length+Math.ceil(p.off*sr))),mix=new Float32Array(N);
    parts.forEach(p=>{const s0=Math.ceil(p.off*sr);for(let i=0;i<p.r.pcm.length;i++)mix[s0+i]+=p.r.pcm[i]*p.a});
    let m=0;for(const v of mix)m=Math.max(m,Math.abs(v));for(let i=0;i<N;i++)mix[i]*=.85/(m||1);return {pcm:mix,marks:parts[0].r.marks}}
  r=one(tk,o);
  if(FX[st.engine]){const f=postFX(FX[st.engine],r.pcm,sr,HISS);let m=0;for(const v of f.pcm)m=Math.max(m,Math.abs(v));if(m>0)for(let i=0;i<f.pcm.length;i++)f.pcm[i]*=.85/m;r={pcm:f.pcm,marks:r.marks.map(([tt,i])=>[tt+f.shift,i])}}
  return r;
}
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
function setBusy(b){st.busy=b;$('busy').hidden=!b;$('pResult').setAttribute('aria-busy',b?'true':'false');['genBtn','playBtn','regen','dlBtn'].forEach(id=>{const el=$(id);if(el)el.disabled=b});$('takeChips').querySelectorAll('button').forEach(x=>x.disabled=b)}
// results and saved variants are kept per style
function cur(){return st.resBy[st.engine]}
const SV=()=>st.savedBy[st.engine]||(st.savedBy[st.engine]=[]);
function showResult(){
  const r=cur();$('playerRow').hidden=!r;$('takes').hidden=!r;renderTakes();$('dlBtn').hidden=!r;$('dlOk').hidden=true;$('bubbleHint').hidden=!!r;
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
let CHARS=[];try{const a=JSON.parse(localStorage.getItem('bm.chars')||'[]');if(Array.isArray(a))CHARS=a.filter(x=>x&&ENGINES[x.engine])}catch(e){}
function saveChars(){try{localStorage.setItem('bm.chars',JSON.stringify(CHARS))}catch(e){}}
function charNow(){const c=C(),h=cur();return {engine:st.engine,voice:c.voice,mood:c.mood,intent:c.intent,len:c.len,anc:c.anc,sl:{...c.sl},salt:h?h.salt:(c.salt||0),take:h&&h.take!==undefined?h.take:c.take,langSeed:st.langSeed}}
const charKey=x=>JSON.stringify([x.engine,x.voice,x.engine==='vemmo'?[x.intent,x.len,x.anc,x.take]:[x.mood,x.salt],x.sl,LANGSTYLE[x.engine]?x.langSeed:0]);
const LANGSTYLE={sim:1,echo:1,radio:1}; // styles that speak the made-up language
function charActive(x){const c=C();return x.engine===st.engine&&charKey(x)===charKey({engine:st.engine,voice:c.voice,mood:c.mood,intent:c.intent,len:c.len,anc:c.anc,sl:c.sl,salt:c.salt||0,take:c.take,langSeed:st.langSeed})}
function charInfo(x){const vn=x.voice.startsWith('own:')?(ownVoice(x.voice.slice(4))||{name:'?'}).name:ENGINES[x.engine].voices[x.voice].name;
  return [EMETA[x.engine].name,vn,x.engine==='vemmo'?INTENTNAME[x.intent][LI()]:MOODNAME[x.mood][LI()]].join(' · ')}
function useChar(x){showView('make');if(x.engine!==st.engine)setEngine(x.engine);const c=C();
  Object.assign(c,{voice:x.voice,mood:x.mood,intent:x.intent,len:x.len,anc:x.anc,sl:{...x.sl},salt:x.salt,take:x.take});
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
function checkStale(){const r=cur();$('stale').hidden=!r||r.key===settingsKey();renderTakes()}
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
  tone:'<circle class="b" cx="20" cy="20" r="11"/><circle class="a" cx="20" cy="20" r="16"/>',
  instr:'<rect class="b" x="9" y="6" width="22" height="28" rx="11"/><line class="a" x1="20" y1="12" x2="20" y2="28"/>'};
function buildEngines(){const box=$('engines');box.innerHTML='';
  [['voice',ENGINE_ORDER.filter(e=>EMETA[e].rec)],['sound',ENGINE_ORDER.filter(e=>!EMETA[e].rec)]].forEach(([g,list],gi)=>{
    const grp=document.createElement('div');grp.className='sgroup g'+gi;grp.setAttribute('role','group');grp.setAttribute('aria-label',t(g==='voice'?'make.gVoice':'make.gSound'));
    list.forEach(e=>{const b=document.createElement('button');b.type='button';b.dataset.e=e;b.className='s-'+e;b.setAttribute('aria-pressed',String(e===st.engine));b.title=SHORT[e][LI()];
      b.innerHTML='<svg viewBox="0 0 40 40" aria-hidden="true">'+MINI[e]+'</svg>';b.append(EMETA[e].name);
      b.onclick=()=>{setEngine(e);generate(false)};grp.appendChild(b)});
    box.appendChild(grp)})}
function setBodyEngine(){ENGINE_ORDER.forEach(x=>document.body.classList.toggle('e-'+x,x===st.engine))}
function setEngine(e){
  if(e===st.engine)return;pStop();st.engine=e;saveCfg();setBodyEngine();
  document.querySelectorAll('#engines button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.e===e)));
  if(wet)wet.gain.value=wetFor(e);
  $('voiceMsg').hidden=true;refreshSide();showResult();
}
function refreshSide(){
  const e=st.engine,c=C(),m=EMETA[e],nv=e==='tone'||e==='instr';
  $('engineDesc').textContent=m.d[LANGUI];
  $('voiceLbl').textContent=e==='tone'?t('side.sound'):e==='instr'?t('side.instrument'):t('side.voice');
  if(c.voice.startsWith('own:')&&!ownVoice(c.voice.slice(4)))c.voice=Object.keys(ENGINES[e].voices)[0];
  if(!c.voice.startsWith('own:')&&!ENGINES[e].voices[c.voice])c.voice=Object.keys(ENGINES[e].voices)[0];
  const vc=$('voiceChips');vc.innerHTML='';
  const chip=(box,label,pressed,fn,cls,title)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(pressed));if(cls)b.className=cls;if(title)b.title=title;b.onclick=fn;box.appendChild(b);return b};
  Object.entries(ENGINES[e].voices).forEach(([k,v])=>chip(vc,v.name,c.voice===k,()=>pickVoice(k),'',v.d[LANGUI]));
  if(m.rec&&st.voices.length){st.voices.forEach(v=>chip(vc,v.name,c.voice==='own:'+v.id,()=>pickVoice('own:'+v.id),'own',t('side.own')))}
  const cc=$('charChips');cc.innerHTML='';$('charRow').hidden=!CHARS.length;CHARS.forEach(x=>chip(cc,x.name,charActive(x),()=>useChar(x),'char',charInfo(x)));
  const vo=voiceObj();$('voiceDesc').textContent=vo.own?t('side.own'):vo.preset.d[LANGUI];$('voiceNote').hidden=!vo.own;
  if(vo.own)$('voiceNote').textContent=vo.own.complete?t('side.ownLabel',{n:vo.own.grains.length}):t('side.ownPartial',{d:vo.own.linesDone,t:vo.own.linesTotal});
  const who=vo.own?vo.own.name:vo.preset.name;$('speaker').textContent=who;
  $('sayLbl').textContent=t(e==='vemmo'?'make.sayV':'make.say',{name:who});$('tuneLbl').textContent=t('make.tune',{name:who});
  if(e==='vemmo'&&c.len==='auto')c.len='short';$('fTxt').hidden=e==='vemmo';
  $('fIntent').hidden=e!=='vemmo';$('fMood').hidden=e==='vemmo';$('fLen').hidden=e!=='vemmo';$('dAnchors').hidden=e!=='vemmo';
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
SLIDERS.forEach(x=>$(x).addEventListener('input',e=>{C().sl[x]=+e.target.value;outs();onSetting()}));
$('steady').addEventListener('input',e=>{STEADY=+e.target.value;try{localStorage.setItem('bm.steady',String(STEADY))}catch(er){}outs();onSetting()});
$('hiss').addEventListener('input',e=>{HISS=+e.target.value;try{localStorage.setItem('bm.hiss',String(HISS))}catch(er){}outs();onSetting()});
$('ambSel').addEventListener('change',e=>{AMB.type=e.target.value;if(AMB.type==='off')ambDown(.4);else if(P.owner==='result'&&P.buf)ambUp(Math.max(0,P.buf.duration-pPos()))}); // join a line that is already playing
$('ambLvl').addEventListener('input',e=>{AMB.lvl=+e.target.value;outs();if(AMB.gain&&AMB.src)AMB.gain.gain.setTargetAtTime(AMB.lvl*.55,ctx.currentTime,.05)});
$('dice').addEventListener('click',()=>{st.langSeed=Math.floor(Math.random()*1e6);LANG=makeLang(st.langSeed);refreshSide();checkStale()});
$('txt').addEventListener('input',checkStale);
$('txt').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();$('genBtn').click()}});
$('genBtn').onclick=async()=>{if(st.busy)return;if(P.owner==='result'){pStop();return}if(cur()&&cur().key===settingsKey()){await ready();playCur()}else generate(false)};$('regen').onclick=()=>generate(false);
$('playBtn').onclick=async()=>{await ready();if(P.owner==='result'){pStop()}else playCur()};

$('dlBtn').onclick=()=>exportWav();
// examples dialog
function openExamples(){const l=$('exList');l.innerHTML='';[['general',t('ex.general')],['vemmo',t('ex.vemmo')]].forEach(([g,label])=>{const h=document.createElement('h3');h.textContent=label;l.appendChild(h);
  EXAMPLES.filter(x=>x.g===g).forEach(x=>{const b=document.createElement('button');b.type='button';const s=document.createElement('span');s.textContent=x.text[LANGUI];b.appendChild(s);
    if(x.v){const sm=document.createElement('small');sm.textContent=ENGINES.vemmo.voices[x.v].name+' · '+INTENTNAME[x.i][LI()];b.appendChild(sm)}
    b.onclick=()=>{$('txt').value=x.text[LANGUI];if(x.v&&st.engine==='vemmo'){const c=C();c.voice=x.v;c.intent=x.i;const p=ENGINES.vemmo.voices[x.v];SLIDERS.forEach(k=>c.sl[k]=p[k]);refreshSide();saveCfg()}$('exDlg').close();checkStale();$('txt').focus()};l.appendChild(b)})});
  $('exDlg').showModal()}
$('exBtn').onclick=openExamples;$('exClose').onclick=()=>$('exDlg').close();

// ---------- 3. voices storage (IndexedDB, this browser only) ----------
const DB={db:null};
function dbOpen(){return new Promise((res,rej)=>{try{const r=indexedDB.open('babble-machine',1);r.onupgradeneeded=()=>r.result.createObjectStore('voices',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})}
async function dbAll(){const db=DB.db;return new Promise((res,rej)=>{const q=db.transaction('voices').objectStore('voices').getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function dbPut(v){const db=DB.db;if(!db)throw new Error('no storage');return new Promise((res,rej)=>{const tx=db.transaction('voices','readwrite');tx.objectStore('voices').put(v);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('aborted'))})}
async function dbDel(id){const db=DB.db;if(!db)return;return new Promise((res,rej)=>{const tx=db.transaction('voices','readwrite');tx.objectStore('voices').delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
const toStore=v=>({id:v.id,name:v.name,created:v.created,script:v.script,median:v.median,labeled:v.labeled,complete:v.complete,linesDone:v.linesDone,linesTotal:v.linesTotal,extra:!!v.extra,
  grains:v.grains.map(g=>({d:g,c:g.c,v:g.v,pos:g.pos,f0:g.f0}))});
const fromStore=r=>({...r,grains:r.grains.map(x=>{const g=x.d instanceof Float32Array?x.d:new Float32Array(x.d);g.c=x.c;g.v=x.v;g.pos=x.pos;g.f0=x.f0;return g})});
(async()=>{try{DB.db=await dbOpen();const all=await dbAll();st.voices=all.map(fromStore).sort((a,b)=>a.created-b.created);st.storeOK=true}catch(e){st.storeOK=false}refreshSide();renderVoices();renderChars()})();
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
    mk(t('voices.use'),()=>useVoice(v));
    if(v.script==='basis'&&!v.extra)mk(t('voices.deepen',{t:roundTime('extra')}),()=>openStudio(v.id),'primary');
    mk(t('voices.rename'),()=>{info.innerHTML='';const inp=document.createElement('input');inp.type='text';inp.value=v.name;inp.setAttribute('aria-label',t('chk.name'));info.appendChild(inp);act.innerHTML='';
      mk(t('voices.save'),async()=>{const nm=inp.value.trim()||v.name;v.name=nm;try{if(!v.session)await dbPut(toStore(v))}catch(e){}renderVoices();refreshSide()},'primary');mk(t('voices.cancel'),()=>renderVoices());inp.focus()});
    mk(t('voices.delete'),()=>confirmDlg(t('voices.delTitle',{name:v.name}),t('voices.delText'),t('cf.del'),t('voices.cancel')).then(async ok=>{if(!ok)return;try{await dbDel(v.id)}catch(e){}st.voices=st.voices.filter(x=>x!==v);
      ENGINE_ORDER.forEach(e=>{if(st.cfg[e].voice==='own:'+v.id)st.cfg[e].voice=Object.keys(ENGINES[e].voices)[0]});saveCfg();renderVoices();refreshSide();checkStale()}));
    row.appendChild(act);l.appendChild(row)});
}
function useVoice(v){showView('make');if(EMETA[st.engine].rec){C().voice='own:'+v.id;refreshSide();saveCfg();checkStale();$('voiceMsg').hidden=true}else{$('voiceMsg').textContent=t('voices.inUseIncompat',{name:v.name});$('voiceMsg').hidden=false}}
function confirmDlg(title,text,yes,no){return new Promise(res=>{$('cfTitle').textContent=title;$('cfText').textContent=text;$('cfYes').textContent=yes;$('cfNo').textContent=no;const d=$('cfDlg');
  const done=v=>{d.close();$('cfYes').onclick=$('cfNo').onclick=null;d.onclose=null;res(v)};$('cfYes').onclick=()=>done(true);$('cfNo').onclick=()=>done(false);d.onclose=()=>res(false);d.showModal();$('cfNo').focus()})}

// ---------- views ----------
function showView(v){
  pStop();st.view=v;$('viewMake').hidden=v!=='make';$('viewVoices').hidden=v!=='voices';$('viewStudio').hidden=v!=='studio';
  $('mainTop').hidden=v==='studio';$('studioTop').hidden=v!=='studio';
  $('navMake').setAttribute('aria-current',v==='make'?'page':'false');$('navVoices').setAttribute('aria-current',v==='voices'?'page':'false');
  if(v==='voices')renderVoices();window.scrollTo(0,0);
}
$('navMake').onclick=()=>showView('make');$('navVoices').onclick=()=>showView('voices');$('logoMain').onclick=()=>showView('make');
$('addVoice2').onclick=()=>openStudio();

// ---------- 4. studio ----------
const NOTES={low:130.8,mid:196,high:261.6};
const SS={step:1,script:'basis',target:null,tempo:'relaxed',note:'mid',guide:true,
  mic:{status:'idle',stream:null,deviceId:'',src:null,an:null,raf:0},
  rec:null,       // {sr, chunks:[], n, lines:[{a,b}|null], script}
  run:null,       // active prompter/recorder run
  result:null,    // analysis for the check screen
  upload:null,    // {pcm,sr} from a file
  dirty:false,saveMode:null};
function sc(){return buildScript(SS.script)}
// basic round for a new voice; the depth round (target = a saved voice) is added to that voice
function openStudio(target){showView('studio');const tg=target&&st.voices.find(v=>v.id===target)?target:null;if(tg!==SS.target||SS.script!==(tg?'extra':'basis')){SS.rec=null;SS.result=null}
  SS.target=tg;SS.script=tg?'extra':'basis';stStep(1);refreshPrep();$('stBack').focus()}
const roundTime=kind=>{const s=buildScript(kind),sch=studioSchedule(1,'relaxed'),e0=sch.events[0];return fmtDur(sch.count*sch.beat+s.length*((e0.read-e0.guide+sch.guide)+4*sch.I+1))};
function stStep(n){SS.step=n;$('spPrep').hidden=n!==1;$('spRec').hidden=n!==2;$('spCheck').hidden=n!==3;
  document.querySelectorAll('#stepper li').forEach(li=>{const s=+li.dataset.s;li.classList.toggle('cur',s===n);li.classList.toggle('done',s<n);if(s===n)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});
  $('stBack').innerHTML='';const sp=document.createElement('span');const recording=n===2&&SS.run&&!SS.run.done;sp.textContent=recording?'× '+t('st.close'):'‹ '+t('st.back');$('stBack').appendChild(sp)}
function refreshPrep(){
  const s=sc(),sch=studioSchedule(s.length,SS.tempo);
  $('exChunk').textContent=s[0].map(x=>x.show).join(' · ');
  const tn={relaxed:t('prep.relaxed'),normal:t('prep.normal')}[SS.tempo],nn={low:t('prep.low'),mid:t('prep.mid'),high:t('prep.high')}[SS.note];
  const tv=SS.target&&st.voices.find(v=>v.id===SS.target);$('stRound').textContent=tv?t('prep.roundX',{name:tv.name}):t('prep.roundB');
  $('recSum').textContent=t('prep.sum',{tempo:tn.toLowerCase(),note:nn.toLowerCase(),guide:(SS.guide?t('prep.on'):t('prep.off')).toLowerCase()});
  const e0=sch.events[0],per=(SS.guide?e0.read-e0.guide+sch.guide:.5)+4*sch.I+1; // same sum as lineDur() during the run
  $('recCalc').textContent=t('prep.calc',{n:s.length,k:s.flat().length,t:fmtDur(sch.count*sch.beat+s.length*per)});
  const sl=$('scriptList');sl.innerHTML='';s.forEach((ch,i)=>{const sp=document.createElement('span');sp.innerHTML='<i></i>';sp.querySelector('i').textContent=i+1;sp.appendChild(document.createTextNode(ch.map(x=>x.show).join('-')));sl.appendChild(sp)});
  micUI();
}
// --- microphone ---
function micUI(){
  const m=SS.mic,s=m.status;$('micAsk').hidden=s==='granted'||s==='asking';$('micAsk').textContent=(s==='idle')?t('prep.micAsk'):t('prep.micRetry');
  $('micMeterRow').hidden=s!=='granted';$('fMicSel').hidden=s!=='granted'||$('micSel').options.length<2;
  const msg={idle:t('prep.micIdle'),asking:t('prep.micAsking'),granted:t('prep.micOn'),denied:t('prep.micDenied'),nodevice:t('prep.micNone'),busy:t('prep.micBusy'),unsupported:t('prep.micUnsupported')}[s]||'';
  $('micState').textContent=msg;$('micState').className=(s==='denied'||s==='nodevice'||s==='busy'||s==='unsupported')?'err':'hint';
  $('toRecord').disabled=s!=='granted';$('toRecHint').textContent=s==='granted'?'':t('prep.needMic');
}
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
  await ready();const sr=ctx.sampleRate,s=sc()[0],sch=studioSchedule(1,SS.tempo),ev=sch.events[0],t0=ev.guide;
  const N=Math.ceil((ev.end-t0+.8)*sr),pcm=new Float32Array(N),f=NOTES[SS.note];
  if(SS.guide){const L=Math.floor(sch.guide*sr);for(let i=0;i<L;i++){const tt=i/sr,env=Math.min(1,tt/.06,(sch.guide-tt)/.12);pcm[i]+=(Math.sin(2*Math.PI*f*tt)+.15*Math.sin(4*Math.PI*f*tt))*.18*Math.max(0,env)}}
  const p=ENGINES.sim.voices.lottie;
  s.forEach((x,i)=>{const r=renderSynth([{type:'syl',text:x.show,c:x.c,v:x.v,k:'',jit:.5,stress:i===0},{type:'punct',text:'.',mark:'.'}],{engine:'sim',mood:'neutraal',P:f,S:1.15,E:.15,F:f<160?.92:1.08,breath:.12,tilt:.45,oq:p.oq,jit:1},sr).pcm;
    const o=Math.floor((ev.syl[i]-t0)*sr);for(let j=0;j<r.length&&o+j<N;j++)pcm[o+j]+=r[j]*.5});
  pPlay(bufFrom(pcm,sr),'example');
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
  const sch=studioSchedule(1,SS.tempo);
  const run={mode,queue:queue.slice(),qi:0,I:sch.I,guideDur:sch.guide,gap:sch.events[0].read-sch.events[0].guide,rest:1,done:false,paused:false,cur:null,osc:[],raf:0,proc:null,sessStart:0,sessBase:0,linesDone:0};
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
  run.cur={idx,guide:g,read:r,syl:[0,1,2,3].map(i=>r+i*run.I),end:r+4*run.I};
  if(SS.guide)run.osc.push(...hum(g,f,run.guideDur));
  drawLine(idx);
}
function ctxToSample(tt){const run=SS.run;return run.sessBase+Math.round((tt-run.sessStart)*SS.rec.sr)}
function drawLine(idx){const s=sc(),q=SS.run.queue,box=$('sylls');box.innerHTML='';s[idx].forEach(x=>{const sp=document.createElement('span');sp.textContent=x.show;box.appendChild(sp)});
  $('sylSr').textContent=s[idx].map(x=>x.show).join(' ');

  $('recLine').textContent=t('rec.line',{i:idx+1,n:s.length});say(t('rec.line',{i:idx+1,n:s.length}))}
function lineDur(){const r=SS.run;return (SS.guide?r.guideDur+r.gap:.5)+4*r.I+r.rest}
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
  if(mode==='practice'){stStep(1);refreshPrep();$('micState').textContent=t('prep.practiceDone');$('micState').className='hint';return}
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
    const th=mx*.08;let a=0,b=e.length-1;while(a<b&&e[a]<th)a++;while(b>a&&e[b]<th)b--;
    const parts=splitChunk(pcm,sr,A+a*hop,A+(b+1)*hop,4),fs=[];
    parts.forEach(([x,y],pi)=>{const g=pcm.slice(x,y);let m=0;for(const v of g)m=Math.max(m,Math.abs(v));if(m<1e-4)return;for(let i=0;i<g.length;i++)g[i]/=m;
      g.c=script[ci][pi].c;g.v=script[ci][pi].v;g.pos=pi;g.f0=estimateF0(g,sr);if(g.f0)fs.push(g.f0);grains.push(g)});
    fs.sort((p,q)=>p-q);chunkF0.push(fs.length?fs[fs.length>>1]:0);done++;
  });
  const all=grains.map(g=>g.f0).filter(Boolean).sort((p,q)=>p-q),median=all.length?all[all.length>>1]:180;
  grains.forEach(g=>{if(!g.f0||Math.abs(12*Math.log2(g.f0/median))>9)g.f0=median});
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
  else{toks=tokenize($('txt').value||EXAMPLES[0].text[LANGUI],e,st.langSeed,paletteLang(e)||LANG);if(e==='baby')toks=babyfy(toks)}
  const o={engine:e,mood:e==='vemmo'?st.cfg.vemmo.intent:'neutraal',P:base.pitch,S:base.speed,E:base.expr,F:1,breath:0,tilt:base.tilt,oq:base.oq,jit:base.jit,rate:base.rate||1,base:base.pitch,recF0:R.median,steady:STEADY};
  const tv=SS.target&&st.voices.find(v=>v.id===SS.target),gr=tv?tv.grains.concat(R.grains):R.grains;if(tv)o.recF0=tv.median; // depth round: hear the whole voice
  let r=renderSample(toks.map(x=>({...x})),gr,o,sr);if(FX[e]){const f=postFX(FX[e],r.pcm,sr,HISS);let m=0;for(const v of f.pcm)m=Math.max(m,Math.abs(v));if(m>0)for(let i=0;i<f.pcm.length;i++)f.pcm[i]*=.85/m;r={pcm:f.pcm,marks:r.marks}}
  const buf=bufFrom(r.pcm,sr);
  $('prevText').textContent=toks.map(x=>x.text).join('');$('prevDur').textContent=fmtDur(buf.duration);if(wet)wet.gain.value=wetFor(e);
  $('prevPlay').textContent=t('make.stopPlay');pPlay(buf,'preview',{onTick:pos=>drawWave($('prevWave'),r.pcm,pos/buf.duration),onend:()=>{$('prevPlay').textContent=t('chk.prevPlay');drawWave($('prevWave'),r.pcm,0)}});
};
$('again').onclick=()=>{pStop();SS.result=null;SS.rec=null;stStep(1);refreshPrep()};
async function saveVoice(sessionOnly){
  const R=SS.result;if(!R)return;
  const tv=SS.target&&st.voices.find(v=>v.id===SS.target);
  if(tv){ // depth round: add the new sounds to the existing voice
    const all=tv.grains.concat(R.grains),fs=all.map(g=>g.f0).filter(Boolean).sort((a,b)=>a-b);
    const nv={...tv,grains:all,extra:true,median:fs.length?fs[fs.length>>1]:tv.median};
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

// ---------- language switch ----------
function applyLang(){
  document.documentElement.lang=LANGUI;
  document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
  document.querySelectorAll('[data-t-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.tAria)));
  document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===LANGUI)));
  buildEngines();refreshSide();renderVoices();renderChars();if(cur())showResult();refreshPrep();stStep(SS.step);
  if(SS.result&&!$('checkBody').hidden)showCheck();
  if(!$('txt').value||EXAMPLES.some(x=>x.text.en===$('txt').value||x.text.nl===$('txt').value)){const ex=EXAMPLES.find(x=>x.text.en===$('txt').value||x.text.nl===$('txt').value)||EXAMPLES[0];$('txt').value=ex.text[LANGUI];checkStale()}
}
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{LANGUI=b.dataset.lang;try{localStorage.setItem('bm.lang',LANGUI)}catch(e){}applyLang()});
window.addEventListener('resize',()=>{const r=cur();if(r&&!$('playerRow').hidden)drawWave($('wave'),r.pcm,0)});

// ---------- boot ----------
buildEngines();$('txt').value=EXAMPLES[0].text[LANGUI];applyLang();setPlayLabel(false);
if(location.hash==='#my-voices')showView('voices');

// ---------- character: mouth follows the sound, blinks now and then ----------
(function face(){const d=new Float32Array(1024);
  const f=()=>{let rms=0;if(an&&P.src&&st.view==='make'){an.getFloatTimeDomainData(d);for(const v of d)rms+=v*v;rms=Math.sqrt(rms/d.length)}
    $('mouth').setAttribute('ry',(1.5+Math.min(11,rms*45)).toFixed(1));$('orbRing').style.transform='scale('+(1+Math.min(.35,rms*2.2)).toFixed(3)+')';$('orb').setAttribute('r',(32+Math.min(6,rms*40)).toFixed(1));requestAnimationFrame(f)};f()})();
setInterval(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;['eyeL','eyeR'].forEach(id=>$(id).setAttribute('r','0.8'));setTimeout(()=>['eyeL','eyeR'].forEach(id=>$(id).setAttribute('r','5.5')),130)},3800);
$('addVoiceTop').onclick=()=>openStudio();
setBodyEngine();
