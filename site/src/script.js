// ===================================================================
// Babble Studio Script: the script model and the take audio steps, no DOM.
// Loads as a plain script in the tool (after engine.js) and as CommonJS for tests/script.mjs.
// Lines are grouped in scenes; each line has a character and keeps its takes elsewhere
// (IndexedDB store `takes`); a take remembers the text it was recorded with.
// A character is recorded (`kind:'record'`) or babbles (`kind:'babble'`: style, voice, mood or Bloopa intent);
// a babble line renders with Babble.render and the line's own `seed`, so it sounds the same every time.
// A babble line can have one part in [square brackets] that you speak yourself (a mixed line): that part gets
// takes like a recorded line, the rest babbles around it.
// ===================================================================
(function(root){
const span=typeof soundSpan==='function'?soundSpan:require('./engine.js').soundSpan;
const postfx=typeof postFX==='function'?postFX:require('./engine.js').postFX;
const envOf=(pcm,sr,ms)=>{const hop=Math.max(1,Math.round(sr*ms/1000)),n=Math.floor(pcm.length/hop),e=new Float32Array(n); // same envelope as the voice studio
  for(let i=0;i<n;i++){let q=0;for(let j=0;j<hop;j++){const v=pcm[i*hop+j];q+=v*v}e[i]=Math.sqrt(q/hop)}return {e,hop}};

// ---------- model ----------
const uid=p=>p+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);
function newScript(title,lang,scene){return {id:uid('s'),title:title||'',lang:lang==='nl'?'nl':'en',created:Date.now(),scenes:[scene||''],characters:[],lines:[]}}
function newCharacter(name){return {id:uid('c'),name:name||'',kind:'record'}}
const newSeed=()=>1+Math.floor(Math.random()*1e9);
function newLine(scene,character,text){return {id:uid('l'),scene:scene||'',character:character||'',dir:'',text:text||'',take:null,seed:newSeed()}}
// scripts saved before step 2: every character records, every line gets a seed
function tidy(s){s.characters.forEach(c=>{if(c.kind!=='babble')c.kind='record'});s.lines.forEach(l=>{if(!(l.seed>0))l.seed=newSeed()});return s}
// scenes in their own order; a line whose scene is not listed gets its scene added at the end
function scenesOf(s){const names=s.scenes.slice();s.lines.forEach(l=>{if(!names.includes(l.scene))names.push(l.scene)});
  return names.map(name=>({name,lines:s.lines.filter(l=>l.scene===name)}))}
// lines in reading order (scene by scene)
const ordered=s=>scenesOf(s).flatMap(g=>g.lines);
function syncOrder(s){const o=ordered(s);s.scenes=scenesOf(s).map(g=>g.name);s.lines=o;return s}
function addLine(s,scene,after){const l=newLine(scene,after?after.character:'');syncOrder(s);
  const i=after?s.lines.indexOf(after):-1;if(i>=0)s.lines.splice(i+1,0,l);else{const g=s.lines.filter(x=>x.scene===scene);const last=g[g.length-1];s.lines.splice(last?s.lines.indexOf(last)+1:s.lines.length,0,l)}
  if(!s.scenes.includes(scene))s.scenes.push(scene);return l}
function removeLine(s,id){s.lines=s.lines.filter(l=>l.id!==id)}
// one step up or down in reading order; at a scene edge the line first moves into the next scene
function moveLine(s,id,delta){syncOrder(s);const L=s.lines,i=L.findIndex(l=>l.id===id);if(i<0)return false;const l=L[i];
  const names=s.scenes,si=names.indexOf(l.scene),nb=L[i+delta];
  if(nb&&nb.scene===l.scene){L[i]=nb;L[i+delta]=l;return true}
  const ns=names[si+delta];if(ns===undefined)return false;l.scene=ns; // into the neighbouring scene, at its near end
  L.splice(i,1);const g=L.filter(x=>x.scene===ns);
  if(delta<0){const last=g[g.length-1];L.splice(last?L.indexOf(last)+1:insertAt(L,names,ns),0,l)}else{const first=g[0];L.splice(first?L.indexOf(first):insertAt(L,names,ns),0,l)}
  return true}
const insertAt=(L,names,ns)=>{const after=names.slice(names.indexOf(ns)+1);const k=L.findIndex(x=>after.includes(x.scene));return k<0?L.length:k};
// drag and drop: put a line before another one (or at the end of a scene)
function placeLine(s,id,beforeId,scene){const L=s.lines,i=L.findIndex(l=>l.id===id);if(i<0||id===beforeId)return false;const [l]=L.splice(i,1);
  if(beforeId){const j=L.findIndex(x=>x.id===beforeId);if(j<0){L.splice(i,0,l);return false}l.scene=L[j].scene;L.splice(j,0,l)}
  else{l.scene=scene;const g=L.filter(x=>x.scene===scene),last=g[g.length-1];L.splice(last?L.indexOf(last)+1:L.length,0,l)}
  syncOrder(s);return true}
function renameScene(s,from,to){if(!to||from===to||s.scenes.includes(to))return false;s.scenes=s.scenes.map(n=>n===from?to:n);s.lines.forEach(l=>{if(l.scene===from)l.scene=to});return true}
// a scene one place up or down (its lines go with it)
function moveScene(s,name,delta){syncOrder(s);const N=s.scenes,i=N.indexOf(name),j=i+delta;if(i<0||j<0||j>=N.length)return false;N[i]=N[j];N[j]=name;syncOrder(s);return true}
// delete a scene: `merge` moves its lines to the end of the scene before it (the start of the next one for the first scene),
// otherwise its lines go too; returns the ids of the lines that were removed
function removeScene(s,name,merge){syncOrder(s);const N=s.scenes,i=N.indexOf(name);if(i<0)return null;const to=N[i>0?i-1:i+1],mine=s.lines.filter(l=>l.scene===name);
  if(merge&&to!==undefined){mine.forEach(l=>{l.scene=to});s.scenes=N.filter(n=>n!==name);const rest=s.lines.filter(l=>!mine.includes(l)),g=rest.filter(l=>l.scene===to);
    const at=i>0?rest.indexOf(g[g.length-1])+1:(g.length?rest.indexOf(g[0]):rest.length);rest.splice(at,0,...mine);s.lines=rest;syncOrder(s);return []}
  s.scenes=N.filter(n=>n!==name);s.lines=s.lines.filter(l=>l.scene!==name);return mine.map(l=>l.id)}
// a free scene name: Scene 1, Scene 2... (`fmt` makes the name from a number)
function freeScene(s,fmt){let n=s.scenes.length+1;while(s.scenes.includes(fmt(n)))n++;return fmt(n)}

// ---------- status ----------
const norm=x=>String(x||'').replace(/\s+/g,' ').trim();
// one recorded part per line: the first [ ... ]; `plain` is the text without brackets
function partsOf(text){const t=String(text||''),m=/\[([^\]]*)\]/.exec(t);if(!m)return {before:plain(t),rec:'',after:'',has:false};
  return {before:t.slice(0,m.index),rec:m[1],after:plain(t.slice(m.index+m[0].length)),has:!!norm(m[1])}}
const plain=t=>String(t||'').replace(/[[\]]/g,'');
// put brackets around [a,b) (widened to whole words); any earlier brackets go
function markPart(text,a,b){text=String(text||'');const t=plain(text),off=k=>{let n=0;for(let i=0;i<k&&i<text.length;i++)if(text[i]!=='['&&text[i]!==']')n++;return n};
  let x=off(Math.min(a,b)),y=off(Math.max(a,b));while(x>0&&/\S/.test(t[x-1]))x--;while(y<t.length&&/\S/.test(t[y]))y++;
  while(x<y&&/\s/.test(t[x]))x++;while(y>x&&/\s/.test(t[y-1]))y--;if(x>=y)return t;return t.slice(0,x)+'['+t.slice(x,y)+']'+t.slice(y)}
const kindOf=(s,l)=>{const c=s&&s.characters.find(x=>x.id===l.character);return c&&c.kind==='babble'?'babble':'record'};
// todo: no take chosen; done: the chosen take was recorded with this text; redo: the text changed since; babble: rendered, no take
// the words you speak: the whole line, or for a babble line its bracketed part ('' = nothing to record)
const recText=(s,l)=>s&&kindOf(s,l)==='babble'?partsOf(l.text).rec:plain(l.text);
function lineStatus(line,takes,s){const said=s?recText(s,line):plain(line.text);if(s&&kindOf(s,line)==='babble'&&!norm(said))return 'babble';
  const tk=line.take&&takes&&takes[line.take];if(!tk)return 'todo';return norm(plain(tk.text))===norm(said)?'done':'redo'}
const needsTake=(l,takes,s)=>{if(!norm(s?recText(s,l):plain(l.text)))return false;const k=lineStatus(l,takes,s);return k==='todo'||k==='redo'};
// the next line of the same character that still needs a take, after this one (then from the top)
function nextFor(s,fromId,takes){const L=ordered(s),i=L.findIndex(l=>l.id===fromId),me=L[i];if(!me)return null;
  for(let k=1;k<=L.length;k++){const l=L[(i+k)%L.length];if(l!==me&&l.character===me.character&&needsTake(l,takes,s))return l}return null}
// from a babble line (or any line): this one or the first line after it that still needs a take
function nextRecord(s,fromId,takes){const L=ordered(s),i=Math.max(0,L.findIndex(l=>l.id===fromId));
  for(let k=0;k<L.length;k++){const l=L[(i+k)%L.length];if(needsTake(l,takes,s))return l}return null}
// the cue: babble lines right before this line in its scene, played before you speak (like a reader)
function cueBefore(s,id){const L=ordered(s),i=L.findIndex(l=>l.id===id),out=[];if(i<0)return out;
  for(let k=i-1;k>=0;k--){const l=L[k];if(l.scene!==L[i].scene||kindOf(s,l)!=='babble'||partsOf(l.text).has)break;if(norm(l.text)||babbleStyle(s,l)==='vemmo')out.unshift(l)}return out}
const babbleStyle=(s,l)=>{const c=s.characters.find(x=>x.id===l.character);return c&&c.style};
// options for Babble.render (the web module), so a game can render the same line live; Bloopa Doopa takes an intent
function babbleOpts(c,l){const o={style:c.style||'animal',seed:l.seed};if(c.voice&&!String(c.voice).startsWith('own:'))o.voice=c.voice;
  if(o.style==='vemmo'){o.intent=c.intent||'tell';o.length=norm(plain(l.text)).length<=45?'short':'medium'}else o.mood=c.mood||'neutraal';
  if(c.sl)for(const [k,ik] of Object.entries(SLIDER_OPT))if(Number.isFinite(c.sl[ik]))o[k]=c.sl[ik]; // a saved character's pitch, speed...
  return o}
const SLIDER_OPT={pitch:'pitch',speed:'speed',expression:'expr',throat:'form',breath:'breath',brightness:'tilt'};

// ---------- words and syllables (prompter) ----------
const VOW=/[aeiouyàáâäèéêëìíîïòóôöùúûüæø]+/gi;
// rough count: vowel groups (Dutch ij, ei, oe, ui, aa... are one group); English drops a silent final e
function sylCount(w,lang){const x=w.toLowerCase().replace(/[^a-zà-ÿ']/g,'');if(!x)return 0;let n=(x.match(VOW)||[]).length;
  if(lang!=='nl'&&n>1&&/[^aeiouy]e$/.test(x)&&!/[^aeiouy]le$/.test(x))n--;return Math.max(1,n)}
// the words of a line as the prompter shows them; `at` = syllables before this word
function wordsOf(text,lang){let at=0;return norm(text).split(' ').filter(Boolean).map(w=>{const syl=sylCount(w,lang);const o={w,syl,at};at+=syl;return o})}
const sylTotal=ws=>ws.reduce((a,w)=>a+w.syl,0);
// which word holds syllable position `pos` (a fraction while it is being spoken)
function wordAt(ws,pos){for(let i=0;i<ws.length;i++)if(pos<ws[i].at+ws[i].syl)return i;return ws.length}
// speech recognition: how far the heard words got through the line; looks a few words ahead, so a skipped word is noted as missing
const bare=w=>w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'');
function lev(a,b){if(Math.abs(a.length-b.length)>1)return 2;const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]}
const like=(a,b)=>a===b||(a.length>3&&b.length>3&&lev(a,b)<=1);
function alignWords(ws,heard,ahead=3){const want=ws.map(x=>bare(x.w)),got=String(heard||'').split(/\s+/).map(bare).filter(Boolean);let p=0;const missing=[];
  for(const g of got){for(let j=p;j<Math.min(want.length,p+ahead+1);j++){if(want[j]&&like(want[j],g)){for(let k=p;k<j;k++)if(want[k])missing.push(k);p=j+1;break}}}
  for(let k=0;k<ws.length;k++)if(!want[k]&&k===p)p++; // words without letters (a dash) count as read
  return {pos:p,missing}}

// ---------- take audio ----------
// keep what was said: cut the silence before and after the way the voice studio does (soundSpan keeps
// soft consonants before the first vowel and the fade after the last), with a short margin and fades
function trimTake(pcm,sr){const {e,hop}=envOf(pcm,sr,5);if(!e.length)return null;const [a,b,mx]=span(e);if(mx<1e-4)return null;
  const A=Math.max(0,a*hop-Math.round(sr*.05)),B=Math.min(pcm.length,(b+1)*hop+Math.round(sr*.1)),out=pcm.slice(A,B),f=Math.min(Math.round(sr*.01),out.length>>2);
  for(let i=0;i<f;i++){const g=i/f;out[i]*=g;out[out.length-1-i]*=g}return {pcm:out,start:A/sr,end:B/sr}}
// integrated loudness (ITU-R BS.1770: K-weighting, 400 ms blocks, absolute and relative gate), in LUFS
function kFilter(sr){ // the two K-weighting stages for any sample rate (same formulas as libebur128)
  let K=Math.tan(Math.PI*1681.974450955533/sr),Q=.7071752369554196;const Vh=Math.pow(10,3.999843853973347/20),Vb=Math.pow(Vh,.4996667741545416);let a0=1+K/Q+K*K;
  const s1={b:[(Vh+Vb*K/Q+K*K)/a0,2*(K*K-Vh)/a0,(Vh-Vb*K/Q+K*K)/a0],a:[1,2*(K*K-1)/a0,(1-K/Q+K*K)/a0]};
  K=Math.tan(Math.PI*38.13547087602444/sr);Q=.5003270373238773;a0=1+K/Q+K*K;
  const s2={b:[1,-2,1],a:[1,2*(K*K-1)/a0,(1-K/Q+K*K)/a0]};return [s1,s2]}
function loudness(pcm,sr){let x=Float64Array.from(pcm);for(const f of kFilter(sr)){const y=new Float64Array(x.length);let x1=0,x2=0,y1=0,y2=0;
    for(let i=0;i<x.length;i++){const v=f.b[0]*x[i]+f.b[1]*x1+f.b[2]*x2-f.a[1]*y1-f.a[2]*y2;x2=x1;x1=x[i];y2=y1;y1=v;y[i]=v}x=y}
  const N=Math.min(x.length,Math.round(sr*.4)),step=Math.max(1,Math.round(sr*.1)),z=[];if(!N)return -Infinity;
  for(let s=0;s+N<=x.length;s+=step){let m=0;for(let i=s;i<s+N;i++)m+=x[i]*x[i];z.push(m/N)}
  const L=m=>-.691+10*Math.log10(m),mean=a=>a.reduce((p,q)=>p+q,0)/a.length;
  let g=z.filter(m=>L(m)>-70);if(!g.length)return -Infinity;const rel=L(mean(g))-10;g=g.filter(m=>L(m)>rel);return g.length?L(mean(g)):-Infinity}
// takes play at the loudness of the babble renders: median of 280 renders (every style and voice, 4 lines) is -16.1 LUFS
// (measured 2026-10-27, see CLAUDE.md); the peak stays at or below -1 dBFS, so a very peaky take can end up softer
const TAKE_LUFS=-16.1;
function levelTake(pcm,sr,target=TAKE_LUFS){const l=loudness(pcm,sr);if(!isFinite(l))return {pcm,gain:1,lufs:l};let pk=0;for(const v of pcm)pk=Math.max(pk,Math.abs(v));
  const gain=Math.min(Math.pow(10,(target-l)/20),pk>0?.891/pk:1),out=new Float32Array(pcm.length);for(let i=0;i<pcm.length;i++)out[i]=pcm[i]*gain;return {pcm:out,gain,lufs:l}}
// one step for a finished recording: null when there was no sound to keep
function finishTake(pcm,sr){let pk=0;for(const v of pcm)pk=Math.max(pk,Math.abs(v));if(pk<.003)return null;const tr=trimTake(pcm,sr);if(!tr||tr.pcm.length<sr*.12)return null;
  const lv=levelTake(tr.pcm,sr);return {pcm:lv.pcm,sr,dur:lv.pcm.length/sr,trim:[tr.start,tr.end],gain:lv.gain}}

// ---------- sound per character (step 3): one chain on the takes, the take itself stays as recorded ----------
// pitch in semitones by resampling (higher is also shorter: a PSOLA shift was tried and rejected, see CLAUDE.md),
// one of the existing effects as they are (postFX), and a room (the app mixes in roomIR at ROOM_WET)
const FX_EFFECTS=['','radio','gizmo','sprite','grumble'];
const ROOM_WET={none:0,small:.12,big:.3};
const FX_PRESETS={none:{pitch:0,effect:'',room:'none'},radio:{pitch:0,effect:'radio',room:'none'},robot:{pitch:0,effect:'gizmo',room:'small'},
  fairy:{pitch:4,effect:'sprite',room:'small'},troll:{pitch:-4,effect:'grumble',room:'small'},giant:{pitch:-6,effect:'',room:'big'},tiny:{pitch:6,effect:'',room:'none'},hall:{pitch:0,effect:'',room:'big'}};
function fxOf(c){const f=(c&&c.fx)||{},p=Math.round(Number(f.pitch)||0);return {pitch:Math.max(-12,Math.min(12,p)),effect:FX_EFFECTS.includes(f.effect)?f.effect:'',room:own(ROOM_WET,f.room)?f.room:'none'}}
const own=(o,k)=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
const fxOn=fx=>!!(fx.pitch||fx.effect||fx.room!=='none');
// the preset these settings match ('' = own settings)
const fxPreset=fx=>Object.keys(FX_PRESETS).find(k=>{const p=FX_PRESETS[k];return p.pitch===fx.pitch&&p.effect===fx.effect&&p.room===fx.room})||'';
function pitchShift(pcm,semis){if(!semis)return pcm.slice();const k=Math.pow(2,semis/12),n=Math.max(1,Math.floor((pcm.length-1)/k)+1),o=new Float32Array(n);
  for(let i=0;i<n;i++){const q=i*k,j=Math.floor(q),f=q-j;o[i]=(pcm[j]||0)*(1-f)+(pcm[j+1]||0)*f}return o}
// pitch and effect (the room is added on playback); levelled again so every character sits at the same loudness
function applyFx(pcm,sr,fx){if(!fx.pitch&&!fx.effect)return pcm;let p=pitchShift(pcm,fx.pitch);if(fx.effect)p=postfx(fx.effect,p,sr,1).pcm;return levelTake(p,sr).pcm}
// ---------- script file (step 4): export, import from JSON or plain text, sync on line id ----------
// {format:'babble-script', version:1, title, lang, scenes, characters:[{id,name,kind,style,voice,mood,intent,fx}], lines:[{id,scene,character,dir,text,seed}]}
// `character` in a line is a character id; a name works too (files written by hand or by an AI assistant)
const FILE_FORMAT='babble-script';
function toFile(s){const keep=(o,ks)=>{const r={};ks.forEach(k=>{if(o[k]!=null&&o[k]!=='')r[k]=o[k]});return r};
  return {format:FILE_FORMAT,version:1,title:s.title||'',lang:s.lang,scenes:scenesOf(s).map(g=>g.name),
    characters:s.characters.map(c=>keep(c,['id','name','kind'].concat(c.kind==='babble'?['style','voice','mood','intent','sl']:[]).concat(fxOn(fxOf(c))?['fx']:[]))),
    lines:ordered(s).map(l=>keep(l,['id','scene','character','dir','text','seed']))}}
// plain text: "# Scene" starts a scene, "Name: text" a line ("Name (direction): text" also works); a line without a name continues with the last one
function parseText(text){const out={title:'',characters:[],lines:[]};let scene='',who='';const names=new Set();
  String(text||'').split(/\r?\n/).forEach(raw=>{const r=raw.trim();if(!r)return;
    const h=/^#+\s*(.+)$/.exec(r);if(h){scene=h[1].trim();return}
    const m=/^([^:\[\]]{1,40}?)\s*(?:\(([^)]*)\))?\s*:\s*(.+)$/.exec(r);let dir='',txt=r;
    if(m&&!/^https?$/i.test(m[1])){who=m[1].trim();dir=(m[2]||'').trim();txt=m[3].trim()}
    if(who&&!names.has(who.toLowerCase())){names.add(who.toLowerCase());out.characters.push({name:who})}
    out.lines.push({scene,character:who,dir,text:txt})});
  return out}
// JSON (a script file) or plain text; null when there is nothing to read
function parseFile(text){const t=String(text||'').trim();if(!t)return null;
  if(t[0]==='{'){let j;try{j=JSON.parse(t)}catch(e){return null}if(!j||j.format!==FILE_FORMAT||!Array.isArray(j.lines))return null;
    return {title:String(j.title||''),lang:j.lang==='nl'?'nl':j.lang==='en'?'en':'',scenes:Array.isArray(j.scenes)?j.scenes.map(String):[],
      characters:(Array.isArray(j.characters)?j.characters:[]).filter(c=>c&&(c.id||c.name)).map(c=>({...c,id:c.id?String(c.id):'',name:String(c.name||'')})),
      lines:j.lines.filter(l=>l&&l.text!=null).map(l=>({id:l.id?String(l.id):'',scene:String(l.scene||''),character:String(l.character||''),dir:String(l.dir||''),text:String(l.text),seed:l.seed>0?Math.floor(l.seed):0}))}}
  const p=parseText(t);return p.lines.length?p:null}
// match the incoming file to the script: characters by id, then by name; lines by id, then (no id) by character and text
function matchImport(s,inc){const lc=x=>norm(x).toLowerCase(),cmap={},chars=[];
  inc.characters.forEach(c=>{const ex=s.characters.find(x=>c.id&&x.id===c.id)||s.characters.find(x=>lc(x.name)&&lc(x.name)===lc(c.name));
    const id=ex?ex.id:(c.id&&!s.characters.some(x=>x.id===c.id)?c.id:uid('c'));[c.id,lc(c.name)].filter(Boolean).forEach(k=>cmap[k]=id);chars.push({...c,id,isNew:!ex})});
  const used=new Set(),lines=inc.lines.map(l=>{const character=cmap[l.character]||cmap[lc(l.character)]||(s.characters.some(x=>x.id===l.character)?l.character:'');
    let ex=l.id&&s.lines.find(x=>x.id===l.id&&!used.has(x.id));
    if(!ex&&!l.id)ex=s.lines.find(x=>!used.has(x.id)&&x.character===character&&norm(plain(x.text))===norm(plain(l.text)));
    if(ex)used.add(ex.id);return {...l,character,ex}});
  return {chars,lines,gone:s.lines.filter(l=>!used.has(l.id))}}
// what an import would do: new, changed, unchanged and gone lines, new characters
function planImport(s,inc){const m=matchImport(s,inc),o={add:0,change:0,same:0,gone:m.gone.map(l=>l.id),newChars:m.chars.filter(c=>c.isNew).length};
  m.lines.forEach(l=>{if(!l.ex)o.add++;else if(norm(l.ex.text)!==norm(l.text)||norm(l.ex.dir)!==norm(l.dir)||l.ex.character!==l.character||(l.scene&&l.ex.scene!==l.scene))o.change++;else o.same++});return o}
// apply it: the file's order wins; lines that are not in the file go when `dropGone`, else they stay at the end of their scene;
// returns the ids of the lines removed (their takes go too). A changed text puts the line on "redo" by itself (the take keeps its text).
function applyImport(s,inc,dropGone){const m=matchImport(s,inc),FIELDS=['name','kind','style','voice','mood','intent','fx','sl'];
  m.chars.forEach(c=>{let x=s.characters.find(y=>y.id===c.id);
    if(!x){const usedC=new Set(s.characters.map(y=>y.color));let k=0;while(usedC.has(k)&&k<8)k++;x={id:c.id,name:'',kind:'record',color:k<8?k:s.characters.length%8};s.characters.push(x)}
    FIELDS.forEach(f=>{if(c[f]!=null&&c[f]!=='')x[f]=c[f]});if(x.kind!=='babble')x.kind='record'});
  if(inc.title&&!norm(s.title))s.title=inc.title;if(inc.lang)s.lang=inc.lang;
  const first=s.scenes[0]||'',out=m.lines.map(l=>{const x=l.ex||newLine('',l.character,'');if(!l.ex&&l.id&&!s.lines.some(y=>y.id===l.id))x.id=l.id;
    x.scene=l.scene||(l.ex?l.ex.scene:first);x.character=l.character;x.dir=l.dir||'';x.text=l.text;if(!l.ex&&l.seed)x.seed=l.seed;return x});
  const scenes=[];inc.scenes.concat(out.map(l=>l.scene)).forEach(n=>{if(!scenes.includes(n))scenes.push(n)});
  const gone=dropGone?m.gone.map(l=>l.id):[];
  if(!dropGone)m.gone.forEach(l=>{if(!scenes.includes(l.scene))scenes.push(l.scene);const g=out.filter(x=>x.scene===l.scene),last=g[g.length-1];out.splice(last?out.indexOf(last)+1:out.length,0,l)});
  s.scenes=scenes.length?scenes:[first];s.lines=out;syncOrder(s);return gone}
// ---------- following the voice by tempo (no speech recognition) ----------
// Fed with the mic level every frame: starts at the first sound, counts voiced time and turns it into a
// syllable position (secPerSyl, learned per character from earlier takes), and says when the line is over
// (a pause once most of the line is spoken). Thresholds are relative to the noise floor measured before speaking.
// People pause at punctuation and at the end: a pause near a comma, full stop or the last word puts the marking there and re-estimates the tempo
// for the rest of the line (without it the marking drifted a word or more behind by the end, 2026-10-27).
const FOLLOW={startOver:4,startMin:.006,voiceOver:2.5,voiceMin:.004,startHold:.06,endPause:.8,giveUp:3,enough:.6,short:.5,snapPause:.3};
// syllable positions right after a word that ends in punctuation (not the end of the line)
const stopsOf=ws=>ws.slice(0,-1).filter(w=>/[,.;:!?…]["'”’)]*$/.test(w.w)).map(w=>w.at+w.syl);
function makeFollower(syl,secPerSyl,stops){return {syl,sps:secPerSyl||.3,base:secPerSyl||.3,stops:(stops||[]).concat(syl),snapped:false,floor:.002,state:'wait',hold:0,voiced:0,silent:0,pos:0,t:0,startT:0}}
function follow(f,rms,dt){f.t+=dt;const F=FOLLOW;
  if(f.state==='wait'){if(rms>Math.max(f.floor*F.startOver,F.startMin)){f.hold+=dt;if(f.hold>=F.startHold){f.state='talk';f.startT=f.t-f.hold;f.voiced=f.hold}}
    else{f.hold=0;f.floor=f.floor*.98+Math.min(rms,.05)*.02}return f}
  if(f.state!=='talk')return f;
  if(rms>Math.max(f.floor*F.voiceOver,F.voiceMin)){f.voiced+=dt;f.silent=0;f.snapped=false;f.end=false}else f.silent+=dt;
  if(f.silent>=F.snapPause&&!f.snapped&&f.voiced>0){f.snapped=true;const p=f.voiced/f.sps;let best=-1;
    for(const s of f.stops)if(Math.abs(s-p)<=Math.max(1.5,p*.3)&&(best<0||Math.abs(s-p)<Math.abs(best-p)))best=s;
    if(best>0){f.sps=Math.max(f.base*.6,Math.min(f.base*1.5,f.voiced/best));f.stops=f.stops.filter(s=>s>best);if(best>=f.syl)f.end=true}}
  f.pos=f.end?f.syl-.01:Math.min(f.syl-.01,f.voiced/f.sps);
  const need=f.syl*f.base;if((f.silent>=F.endPause&&f.voiced>=need*F.enough)||f.silent>=F.giveUp)f.state='done';return f}
// a take that is much shorter than the line needs gets a note
const tooShort=(voiced,syl,sps)=>voiced<syl*sps*FOLLOW.short;
// after a take: learn this speaker's tempo (voiced seconds per syllable), slowly
const learnTempo=(sps,voiced,syl)=>syl>=3&&voiced>0?Math.max(.12,Math.min(.6,sps*.5+(voiced/syl)*.5)):sps;

const API={newScript,newCharacter,newLine,newSeed,tidy,kindOf,partsOf,plain,markPart,recText,nextRecord,cueBefore,babbleOpts,scenesOf,ordered,syncOrder,addLine,removeLine,moveLine,placeLine,renameScene,moveScene,removeScene,freeScene,lineStatus,needsTake,nextFor,
  sylCount,wordsOf,sylTotal,wordAt,alignWords,trimTake,loudness,levelTake,finishTake,TAKE_LUFS,FX_EFFECTS,FX_PRESETS,ROOM_WET,fxOf,fxOn,fxPreset,pitchShift,applyFx,FILE_FORMAT,toFile,parseText,parseFile,planImport,applyImport,FOLLOW,stopsOf,makeFollower,follow,tooShort,learnTempo};
root.BabbleScript=API;if(typeof module!=='undefined')module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:this);
