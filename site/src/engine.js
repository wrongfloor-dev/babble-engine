// ===== Brabbel-kern: tokens, prosodie, formantsynthese, sample-modus (geen DOM) =====
const VF={a:[780,1250,2550,3500],e:[460,1950,2650,3600],i:[290,2280,3050,3700],o:[500,880,2450,3400],u:[330,720,2350,3300],y:[300,1750,2250,3400]};
const VSPEC={a:['a','a'],e:['e','e'],i:['i','i'],o:['o','o'],u:['u','u'],y:['y','y'],ai:['a','i'],ou:['o','u'],ei:['e','i'],oo:['u','u'],ee:['i','i'],ah:['a','a'],ua:['u','a'],ay:['e','i']};
const CT={ // klasse, ruisfrequentie, ruisbandbreedte, stem, F2-locus
  p:['plo',1000,900,0,850],t:['plo',4000,2500,0,1750],k:['plo',2100,1200,0,2100],b:['plo',900,800,1,850],d:['plo',3500,2500,1,1750],g:['plo',1900,1100,1,2100],
  s:['fri',6200,2200,0,1700],sh:['fri',2900,1500,0,2000],f:['fri',5000,4000,0,1100],z:['fri',6000,2200,1,1700],v:['fri',4500,4000,1,1100],h:['h',0,0,0,0],
  m:['nas',0,0,1,900],n:['nas',0,0,1,1650],l:['liq',0,0,1,1250],r:['liq',0,0,1,1300],w:['liq',0,0,1,750],j:['liq',0,0,1,2200]
};
const LIQ={l:[360,1150,2650,3400],r:[430,1300,1700,3200],w:[300,650,2250,3300],j:[280,2200,3000,3600]};
const MOODS={
  neutraal:{n:'Neutral',p:0,s:1,e:0,a:1,c:p=>0,tilt:0,oq:0},
  blij:{n:'Happy',p:3,s:1.08,e:.15,a:1.05,c:p=>2.5*Math.sin(p*Math.PI),tilt:.08,oq:0},
  boos:{n:'Angry',p:-1,s:1.15,e:.1,a:1.25,c:p=>-5*p,tilt:.3,oq:-.12},
  verdrietig:{n:'Sad',p:-3,s:.75,e:-.15,a:.8,c:p=>-3.5*p,tilt:-.15,oq:.08,b:.15,vib:true},
  flirterig:{n:'Flirty',p:1,s:.85,e:.2,a:.9,c:p=>3.5*Math.sin(p*Math.PI*2),tilt:-.05,oq:.1,b:.2},
  verbaasd:{n:'Surprised',p:4,s:1,e:.2,a:1.1,c:p=>6*p,tilt:.05,oq:0}
};
const LEX={};
const LAUGH=/^(ha){2,}h?$|^(hi){2,}$|^(he){2,}$|^lol$|^haha\w*$/i;
// letter sound in critter style: [consonant, vowel]
const LETTER={b:['b','i'],c:['k','i'],d:['d','i'],f:['f','e'],g:['g','e'],h:['h','a'],j:['j','e'],k:['k','a'],l:['l','e'],m:['m','e'],n:['n','e'],p:['p','i'],q:['k','u'],r:['r','a'],s:['s','e'],t:['t','i'],v:['v','i'],w:['w','e'],x:['k','i'],y:['j','ai'],z:['z','e']};

function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let x=(seed>>>0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)%100000)/100000}}
function makeLang(seed){
  const r=rng(seed*7919+13),pick=(a,n)=>{const c=a.slice(),o=[];while(o.length<n&&c.length)o.push(c.splice(Math.floor(r()*c.length),1)[0]);return o};
  const cons=pick(['b','d','f','g','l','m','n','p','r','s','sh','w','z','v','k'],8+Math.floor(r()*4));
  const vow=pick(['a','e','i','o','u','oo','ee','ai','ou','ah'],5+Math.floor(r()*2));
  const codas=pick(['n','b','s','sh','l','m','sh','b'],3).concat(['','','']);
  const name=(cons[0]+vow[0]+cons[1]+vow[1]+(codas[0]||'')+'ish').replace(/^./,c=>c.toUpperCase());
  return {cons,vow,codas,name};
}
function sylFromText(t){
  const m=t.toLowerCase().match(/^(sh|[bcdfghjklmnpqrstvwxz]?)([aeiouy]+)(sh|[bcdfghjklmnpqrstvwxz]*)$/);
  if(!m)return {c:'',v:'a',k:''};
  let v=m[2];if(!VSPEC[v])v=v[0];return {c:m[1]==='c'?'k':m[1],v,k:m[3].slice(0,2)==='sh'?'sh':m[3].slice(0,1)};
}
function tokenize(text,engine,seed,LANG){
  const toks=[],parts=text.match(/[A-Za-zÀ-ÿ0-9']+|[.,!?;:…]+|\s+|./g)||[];
  parts.forEach(p=>{
    if(/^\s+$/.test(p)){toks.push({type:'gap',text:' '});return}
    if(/^[.,!?;:…]+$/.test(p)){toks.push({type:'punct',text:p,mark:p.slice(-1)});return}
    if(!/[A-Za-zÀ-ÿ0-9]/.test(p)){toks.push({type:'punct',text:p,mark:''});return}
    if(engine==='tone'||engine==='instr'){const n=Math.max(1,Math.round(p.length/3));toks.push({type:'syl',text:p,n,c:'',v:'a',k:'',jit:(hash(p.toLowerCase())%1000)/1000,stress:true});return}
    if(engine==='animal'){
      [...p].forEach((ch,ci)=>{
        const l=ch.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
        let c='',v='a';
        if(VF[l]&&l!=='y')v=l;else if(LETTER[l])[c,v]=LETTER[l];else v='aeiou'[l.charCodeAt(0)%5];
        toks.push({type:'syl',text:ch,c,v,k:'',jit:((l.charCodeAt(0)*37)%100)/100,stress:ci===0});
      });
      return;
    }
    const low=p.toLowerCase(),cap=/^[A-ZÀ-Ý]/.test(p);
    if(LAUGH.test(low)){toks.push({type:'laugh',text:cap?'Hoohoo':'hoohoo',n:Math.min(6,Math.max(3,Math.round(p.length/2)))});return}
    if(LEX[low]){
      const words=LEX[low].split(' ');
      words.forEach((w,wi)=>{
        const sy=w.match(/(sh|[^aeiou])?[aeiou]+(sh|[^aeiou](?![aeiou]))?/gi)||[w];
        sy.forEach((s,i)=>{let t=(cap&&wi===0&&i===0)?s:s.toLowerCase();toks.push({type:'syl',text:t,...sylFromText(s),jit:(hash(s+i+wi)%1000)/1000,lex:true,stress:i===0})});
        if(wi<words.length-1)toks.push({type:'gap',text:' '});
      });
      return;
    }
    const n=Math.max(1,Math.round(p.length/2.6)),r=rng(hash(low+'|'+seed));
    for(let i=0;i<n;i++){
      const c=r()<.12?'':LANG.cons[Math.floor(r()*LANG.cons.length)];
      const v=LANG.vow[Math.floor(r()*LANG.vow.length)];
      const k=(i===n-1&&r()<.55)?LANG.codas[Math.floor(r()*LANG.codas.length)]:'';
      let t=c+v+k;if(i===0&&cap)t=t.charAt(0).toUpperCase()+t.slice(1);
      toks.push({type:'syl',text:t,c,v,k,jit:(hash(t+i+low)%1000)/1000,stress:i===0});
    }
  });
  return toks;
}


// ===== Vemmo (De Workshopbende) =====
const INTENTS={
  greet:{n:'Greet',p:2,s:1.05,e:.1,a:1.05,c:p=>3*Math.sin(p*Math.PI),end:-2,tilt:.05,oq:0,w:{v:3,d:3,n:1.5,sh:1,t:1,k:1},endV:{ay:3,i:2,o:1.5},anc:['dovvi','shikka'],at:'start',mark:'!',d:'Warm and open. Melody rises and falls. Lots of v, d and -ay.'},
  bye:{n:'Goodbye',p:-1,s:.9,e:-.05,a:.9,c:p=>-2*p,end:-3,tilt:-.05,oq:.04,b:.08,w:{v:3,n:3,m:2,d:1,sh:1},endV:{oo:3,o:2,i:1},anc:['vemmo'],at:'end',mark:'.',d:'Soft and content. Slowly falling. Soft v, n, m.'},
  tell:{n:'Tell',p:0,s:1,e:-.1,a:1,c:p=>-1.2*p,end:-2,tilt:0,oq:0,w:{v:2,sh:2,d:2,t:2,k:2,n:2},endV:{a:2,i:2,o:2,oo:1,ay:1},anc:[],mark:'.',d:'Neutral. Flat melody with a slight fall. Mixed palette.'},
  explain:{n:'Explain',p:0,s:.95,e:0,a:1,c:p=>1.5*Math.sin(p*Math.PI*3),end:-1.5,tilt:.05,oq:0,w:{t:3,k:3,d:2,v:1,n:1},endV:{a:3,o:2,i:1},anc:[],mark:'.',d:'Calm and clear. Wavy, a little stress on every word. Lots of t, k, d.'},
  ask:{n:'Ask',p:1,s:1,e:.05,a:1,c:p=>0,end:7,tilt:0,oq:0,w:{n:3,v:3,sh:1,d:1},endV:{oo:4,a:1,i:1},anc:['navoo'],at:'end',mark:'?',d:'Open. Clearly up at the end. Lots of n, v and -oo.'},
  curious:{n:'Curious',p:3,s:1.05,e:.2,a:1.05,c:p=>4*p,end:6,tilt:.05,oq:.02,w:{sh:3,v:2,n:2,d:1},endV:{oo:3,i:2,ay:1},interj:['oh'],anc:[],mark:'?',d:'Surprised. Rises across the whole line. sh, v and -oo, sometimes an “oh”.'},
  joy:{n:'Joy',p:4,s:1.12,e:.25,a:1.15,c:p=>2.5*Math.sin(p*Math.PI*2),end:2,tilt:.1,oq:0,w:{sh:3,v:2,t:2,k:1},endV:{ay:4,i:2},interj:['ha'],anc:['shevay'],at:'any',mark:'!',d:'Exuberant. Bouncy, high melody. Lots of sh and -ay, sometimes “ha”.'},
  cheer:{n:'Cheer',p:3,s:1.1,e:.2,a:1.2,c:p=>2*p,end:3,tilt:.12,oq:-.03,w:{t:3,k:3,n:2,v:1},endV:{ay:4,a:1},anc:['takka'],at:'start',mark:'!',d:'Energetic. Builds toward the end. Bright t, k and -ay.'},
  think:{n:'Think',p:-1,s:.8,e:-.05,a:.85,c:p=>1.5*Math.sin(p*Math.PI),end:1,tilt:-.05,oq:.05,b:.1,w:{m:3,n:3,v:2,d:1},endV:{o:3,oo:2,a:1},interj:['hm'],anc:[],mark:'…',d:'Hesitant. Slow, the end hangs. Lots of m, n, o and an “hm”.'},
  letdown:{n:'Letdown',p:-2,s:.82,e:-.1,a:.85,c:p=>-3.5*p,end:-4,tilt:-.1,oq:.06,b:.15,w:{n:3,v:2,m:2,d:1},endV:{o:3,oo:2,a:1},interj:['aah','oh'],anc:[],mark:'.',d:'Mildly disappointed, never pitiful. Fades down. Soft sounds, “aah”.'},
  agree:{n:'Agree',p:1,s:1,e:.05,a:1,c:p=>-1.5*p,end:-2,tilt:.02,oq:0,w:{v:3,m:3,n:1,d:1},endV:{o:3,i:1,a:1},anc:['vemmo'],at:'any',mark:'!',d:'Warm and agreeing. Slightly falling. v, m and -o.'},
  warn:{n:'Warn',p:-1,s:1.05,e:0,a:1.15,c:p=>-.5*p,end:-3,tilt:.15,oq:-.05,w:{t:3,k:3,d:3,sh:1},endV:{a:3,o:2},anc:[],mark:'!',d:'Firm, without panic. Low and flat. Hard t, k, d.'}
};
const ANCHORS={
  dovvi:{text:'Eh, dovvi!',pron:'eh, DOV-vi',n:'hello'},shikka:{text:'Shikka navay!',pron:'SHIK-ka na-VAY',n:'let’s start!'},
  shevay:{text:'Shevay!',pron:'she-VAY',n:'nailed it'},navoo:{text:'Navoo?',pron:'na-VOO',n:'what do you think?'},
  takka:{text:'Takka navay!',pron:'TAK-ka na-VAY',n:'once more, you can do it'},vemmo:{text:'Vemmo!',pron:'VEM-mo',n:'together, thanks'}
};
const VFAM={v:['e','a','o'],sh:['i','a','e'],d:['o','i'],t:['a'],k:['a','e'],n:['u','a'],m:['a','o']};
const SOFT=new Set(['v','sh','n','m']);
const VBLOCK=new Set('dan van man kan ken dik dat dit net nat kat tak vak vet vis ten toe doe die do day no na nee nu ma mama papa dada kaka vader moeder sha she shi tea tie ta ti to tam tim tom mo moo dom dommi doom dove dive kook kom kam kim ken kan kat vla sul dag nooboo vadish nana nono momo dodo toto kiki tata navay vemmo dovvi shevay navoo takka shikka'.split(' '));
function wpick(r,w){let tot=0;for(const k in w)tot+=w[k];let x=r()*tot;for(const k in w){x-=w[k];if(x<=0)return k}return Object.keys(w)[0]}
function anchorToks(key,r){
  const A=ANCHORS[key],tw=A.text.split(' '),pw=A.pron.replace(/,/g,'').split(' '),out=[];
  pw.forEach((w,wi)=>{
    const sy=w.split('-');
    sy.forEach((s,i)=>{const x=sylFromText(s);if(x.k==='h')x.k='';let t=s.toLowerCase();if(wi===0&&i===0)t=t.charAt(0).toUpperCase()+t.slice(1);
      out.push({type:'syl',text:t,...x,stress:s===s.toUpperCase()&&s!==s.toLowerCase(),jit:r(),lex:true,anchor:key})});
    const pm=(tw[wi].match(/[.,!?…]+$/)||[''])[0];
    if(pm)out.push({type:'punct',text:pm,mark:pm.slice(-1)});
    if(wi<pw.length-1)out.push({type:'gap',text:' '});
  });
  return out;
}
function vemmoWord(r,I,n){
  for(let tries=0;tries<40;tries++){
    const syl=[];let lastSoft=r()<.5,carry='';
    for(let i=0;i<n;i++){
      const w={};for(const k in I.w)w[k]=I.w[k]*(SOFT.has(k)===lastSoft?.45:1.6);
      if(syl.length&&syl[syl.length-1].k&&!carry)w[syl[syl.length-1].k]=0;
      let c=carry&&VFAM[carry]?carry:wpick(r,w);carry='';
      const last=i===n-1;
      let v=last?wpick(r,I.endV):VFAM[c][Math.floor(r()*VFAM[c].length)];
      let k='';
      if(!last&&r()<.45){const cand=['k','sh','v','n','m','d','t'].filter(x=>SOFT.has(x)!==SOFT.has(c));k=cand[Math.floor(r()*cand.length)];if('ktvm'.includes(k)&&r()<.55)carry=k}
      else if(n===1&&r()<.4){v=VFAM[c][Math.floor(r()*VFAM[c].length)];k=['k','sh','v','n'][Math.floor(r()*4)]}
      syl.push({c,v,k});lastSoft=SOFT.has(c);
    }
    const txt=syl.map(s=>s.c+s.v+s.k).join('');
    let rep=false;for(let i=1;i<syl.length;i++)if(syl[i].c+syl[i].v===syl[i-1].c+syl[i-1].v)rep=true;
    if(rep||VBLOCK.has(txt))continue;
    const endStress=n>1&&/ay|oo/.test(syl[n-1].v)&&r()<.65;
    return syl.map((s,i)=>({type:'syl',text:s.c+s.v+s.k,...s,stress:endStress?i===n-1:i===0,jit:r()}));
  }
  return [{type:'syl',text:'vo',c:'v',v:'o',k:'',stress:true,jit:.5}];
}
const INTERJ={oh:{c:'',v:'o',k:'',hold:.08},ha:{c:'h',v:'a',k:'',hold:0},hm:{c:'h',v:'u',k:'m',hold:.06},aah:{c:'',v:'a',k:'h',hold:.14}};
function vemmoClip(intent,len,seed,anchorMode){
  const I=INTENTS[intent]||INTENTS.tell,r=rng(hash(intent+len+'|'+seed));
  const target=len==='short'?2+Math.floor(r()*3):5+Math.floor(r()*4);
  const toks=[];let count=0;
  const useA=I.anc.length&&(anchorMode==='always'||(anchorMode==='auto'&&r()<.4));
  const akey=useA?I.anc[Math.floor(r()*I.anc.length)]:null;
  const aT=akey?anchorToks(akey,r):[],aN=aT.filter(t=>t.type==='syl').length;
  const atStart=akey&&(I.at==='start'||(I.at==='any'&&r()<.5));
  if(akey&&len==='short')return aT; // short clip with an anchor: just the anchor
  if(akey&&atStart){toks.push(...aT,{type:'gap',text:' '});count+=aN}
  if(I.interj&&r()<.35&&!(akey&&atStart)){const key=I.interj[Math.floor(r()*I.interj.length)];const x=INTERJ[key];
    toks.push({type:'syl',text:key.charAt(0).toUpperCase()+key.slice(1),c:x.c,v:x.v,k:x.k==='h'?'':x.k,hold:x.hold,stress:true,jit:r()},{type:'punct',text:key==='hm'||key==='aah'?'…':',',mark:key==='hm'||key==='aah'?',':','},{type:'gap',text:' '});count+=1}
  const room=Math.max(len==='medium'?2:1,target-count-(akey&&!atStart?aN:0));
  let left=room,first=toks.length===0,words=[];
  while(left>0){const n=Math.min(left,left>=4?2+Math.floor(r()*2):left);words.push(n);left-=n}
  words.forEach((n,wi)=>{
    const w=vemmoWord(r,I,n);if(first){w[0].text=w[0].text.charAt(0).toUpperCase()+w[0].text.slice(1);first=false}
    toks.push(...w);
    if(wi<words.length-1){if(len==='medium'&&wi===0&&words.length>2&&r()<.5)toks.push({type:'punct',text:',',mark:','});toks.push({type:'gap',text:' '})}
  });
  if(akey&&!atStart){toks.push({type:'punct',text:',',mark:','},{type:'gap',text:' '});const t=aT.slice();toks.push(...t)}
  else toks.push({type:'punct',text:I.mark,mark:I.mark});
  return toks;
}

// ---- prosodie: toonhoogte, duur en luidheid per lettergreep ----
const PENTA=[0,2,4,7,9,12,14,16];
function prosody(toks,o){
  const M=MOODS[o.mood]||INTENTS[o.mood]||MOODS.neutraal,E=Math.min(1,Math.max(0,o.E+M.e)),animal=o.engine==='animal';
  const pos=[],markOf=[],lastOf=new Set();let arr=[];
  toks.forEach((k,i)=>{if(k.type==='syl'||k.type==='laugh')arr.push(i);
    if((k.type==='punct'&&/[.!?…]/.test(k.mark))||i===toks.length-1){arr.forEach((ix,n)=>pos[ix]=arr.length>1?n/(arr.length-1):0);if(arr.length)lastOf.add(arr[arr.length-1]);arr=[]}});
  let cur='';for(let i=toks.length-1;i>=0;i--){const k=toks[i];if(k.type==='punct'&&/[.!?…]/.test(k.mark))cur=k.mark;markOf[i]=cur}
  toks.forEach((k,i)=>{
    if(k.type!=='syl')return;
    const m=markOf[i],p=pos[i]||0,last=lastOf.has(i);
    if(o.engine==='vemmo'){
      let semi=(k.jit-.5)*2*E*3+M.c(p)+(k.stress?E*2.5+1:0)+(1-p)*E*1.2;
      if(m==='!')semi+=1.5;
      let b=semi-.8;if(last)b=semi+(M.end??-2);
      k.semiA=semi;k.semiB=b;k.last=last;k.amp=(m==='!'?1.12:1)*M.a*(k.stress?1.08:.92);return;
    }
    let semi=animal?(k.jit-.5)*E*7+M.c(p)*.6:(k.jit-.5)*2*E*5+(1-p)*E*2.5-p*E*2+M.c(p)+(k.stress?E*2.2:0);
    if(m==='!')semi+=animal?2:3;
    if(o.quant)semi=Math.round(PENTA[Math.floor(k.jit*PENTA.length)]*Math.max(.3,E*1.4)-3);
    let b=o.quant?semi:semi+(animal?-.4:(-1-(k.jit-.5)*E*3));
    if(last&&m==='?')b=semi+(animal?4:5+E*5);
    if(last&&(m==='.'||m==='…')&&!o.quant&&!animal)b=semi-4;
    if(last&&m==='!'&&!animal)b=semi-2;
    k.semiA=semi;k.semiB=b;k.last=last;k.amp=(m==='!'?1.25:1)*M.a*(k.stress&&!animal?1.08:.94);
  });
  return {M,E};
}

// ---- formantsynthese ----
const FR=.0025;
function vowelT(v,F,amp){return {F:VF[v].slice(),B:[70,100,160,250],av:amp,ah:0,af:0}}
function buildPhones(toks,o,sr){
  const animal=o.engine==='animal',R=animal?o.rate:1,ts=animal?R/o.S:1/o.S;
  const ph=[],f0pts=[],marks=[];let t=0;
  const add=(d,tg,tr=.03,atr=.01)=>{ph.push({d,tg,tr:Math.min(tr,d*.9),atr:Math.min(atr,d*.6)});t+=d};
  const P=o.P/R;
  const nextVowelF=(v)=>VF[(VSPEC[v]||[v])[0]]||VF.a;
  const cons=(c,vF,amp,coda)=>{
    const C=CT[c];if(!C)return;const [cl,ff,fb,voiced,loc]=C;const s=animal?.45:1,nk=animal?(cl==='fri'?.28:cl==='h'?.32:.38):1;
    const locF=[voiced?260:320,loc,vF[2],vF[3]];
    if(cl==='plo'){
      add(.045*s*ts,{F:locF,B:[90,110,170,250],av:voiced?.12:0,ah:0,af:0},.02,.008);
      add(.012*s*ts+.004,{F:locF,av:voiced?.25:0,ah:.12*nk,af:.42*nk,ff,fb},.004,.006);
      if(!voiced)add((coda?.02:.038)*s*ts,{F:[vF[0]*.8,(loc+vF[1])/2,vF[2],vF[3]],av:0,ah:.5*nk,af:.03,ff,fb},.02,.008);
    }else if(cl==='fri'){
      add(.075*s*ts,{F:locF,B:[90,110,170,250],av:voiced?.35:0,ah:0,af:(voiced?.5:.68)*nk,ff,fb},.025,animal?.03:.02);
    }else if(cl==='h'){
      add(.06*s*ts,{F:vF.slice(),av:0,ah:.6*nk,af:0},.02,.015);
    }else if(cl==='nas'){
      add(.06*s*ts,{F:[250,loc,2300,3300],B:[90,280,320,300],av:.55*amp,ah:0,af:0},.02,.012);
    }else{
      add(.045*s*ts,{F:LIQ[c].slice(),B:[80,120,180,250],av:.75*amp,ah:0,af:0},.025,.012);
    }
  };
  let prevV='a';
  toks.forEach((k,i)=>{
    const t0=t;
    if(k.type==='gap'){if(animal)add(.03*R/o.S*.9,{av:0,ah:0,af:0},.01,.008);}
    else if(k.type==='punct'){const d=(/[.!?…]/.test(k.mark)?(animal?.28:.38):(k.mark?.16:0))*(animal?R:1)/o.S;if(d)add(d,{av:0,ah:0,af:0},.02,.02)}
    else if(k.type==='laugh'){
      let f=P*1.35;for(let n=0;n<k.n;n++){const v=n%2?'e':'a';cons('h',VF[v],1);const d=.08/o.S;f0pts.push([t,f]);add(d,{F:VF[v].slice(),B:[90,120,180,260],av:.55,ah:.12,af:0},.02,.008);f0pts.push([t,f*.9]);add(.03/o.S,{av:0,ah:.15,af:0},.01,.01);f*=.92}
    }else{
      const spec=VSPEC[k.v]||[k.v,k.v],vF=VF[spec[0]]||VF.a,amp=k.amp||1;
      const fa=P*Math.pow(2,k.semiA/12),fb=P*Math.pow(2,k.semiB/12);
      if(k.c)cons(k.c,vF,amp,false);
      let vd;
      if(animal)vd=.05*R/o.S*(.85+k.jit*.3)*(k.last?1.5:1);
      else if(o.engine==='vemmo')vd=((k.stress?.135:.095)+(spec[0]!==spec[1]||k.v.length>1?.04:0)+(k.hold||0))/o.S*(k.last?1.5:1)*(.9+k.jit*.2);
      else vd=((k.stress?.15:.115)+(spec[0]!==spec[1]||k.v.length>1?.05:0))/o.S*(k.last?1.85:1)*(.88+k.jit*.24);
      f0pts.push([t,fa]);
      if(spec[0]!==spec[1]){add(vd*.45,{F:VF[spec[0]].slice(),B:[70,100,160,250],av:amp,ah:0,af:0},.04,.012);add(vd*.55,{F:VF[spec[1]].slice(),B:[70,100,160,250],av:amp*.9,ah:0,af:0},vd*.5,.02)}
      else add(vd,{F:vF.slice(),B:[70,100,160,250],av:amp,ah:0,af:0},animal?.02:.045,.012);
      f0pts.push([t,fb]);
      if(k.k)cons(k.k,vF,amp,true);
      if(animal)add(.012*R/o.S,{av:0,ah:0,af:0},.006,.006);
      prevV=spec[1];
    }
    if(k.type==='syl'||k.type==='laugh')marks.push([t0/R,i]);
  });
  add(.08,{av:0,ah:0,af:0},.03,.03);
  return {ph,f0pts,marks,dur:t};
}
function synthPhones(B,o,sr){
  const {ph,f0pts}=B,M=MOODS[o.mood]||INTENTS[o.mood]||MOODS.neutraal;
  // frames
  const st={F:[500,1500,2500,3500],B:[70,100,160,250],av:0,ah:0,af:0,ff:3000,fb:2000};
  const fr=[];
  ph.forEach(p=>{
    const s0=JSON.parse(JSON.stringify(st)),tg=p.tg,n=Math.max(1,Math.round(p.d/FR));
    for(let i=0;i<n;i++){
      const tt=i*FR,a=sm(tt/p.tr),aa=sm(tt/p.atr),f={};
      f.F=s0.F.map((v,j)=>tg.F?v+(tg.F[j]-v)*a:v);
      f.B=s0.B.map((v,j)=>tg.B?v+(tg.B[j]-v)*a:v+([70,100,160,250][j]-v)*a);
      f.av=s0.av+((tg.av??0)-s0.av)*aa;f.ah=s0.ah+((tg.ah??0)-s0.ah)*aa;f.af=s0.af+((tg.af??0)-s0.af)*aa;
      f.ff=tg.ff?s0.ff+(tg.ff-s0.ff)*Math.min(1,a*3):s0.ff;f.fb=tg.fb?s0.fb+(tg.fb-s0.fb)*Math.min(1,a*3):s0.fb;
      fr.push(f);
    }
    if(tg.F)st.F=tg.F.slice();st.B=(tg.B||[70,100,160,250]).slice();st.av=tg.av??0;st.ah=tg.ah??0;st.af=tg.af??0;if(tg.ff){st.ff=tg.ff;st.fb=tg.fb}
  });
  // f0 per frame (zachte interpolatie)
  const f0=new Float32Array(fr.length);
  const pts=f0pts.length?f0pts:[[0,o.P]];let j=0;
  for(let i=0;i<fr.length;i++){const t=i*FR;while(j<pts.length-1&&pts[j+1][0]<=t)j++;
    const a=pts[j],b=pts[Math.min(j+1,pts.length-1)];
    if(t<=a[0]||a===b)f0[i]=a[1];else f0[i]=a[1]+(b[1]-a[1])*sm((t-a[0])/(b[0]-a[0]));}
  const spf=Math.round(FR*sr),N=fr.length*spf,out=new Float32Array(N);
  const Fs=o.F,breath=Math.min(.9,o.breath+(M.b||0)),oq=Math.min(.85,Math.max(.3,o.oq+M.oq)),tiltA=Math.min(.95,Math.max(.12,o.tilt+M.tilt));
  const vib=o.vib||M.vib,T=1/sr,TP=2*Math.PI;
  let ph0=0,prevG=0,shimT=1,shim=1,tl=0,jw=0,fy1=0,fy2=0,dcx=0,dcy=0,nzl=0;
  const y1=[0,0,0,0],y2=[0,0,0,0],A=[0,0,0,0],Bc=[0,0,0,0],C=[0,0,0,0];
  // vloeiend gevolgde parameters (geen sprongen per frame -> geen tikjes)
  const sF=fr[0].F.slice(),sB=fr[0].B.slice();let sAv=0,sAh=0,sAf=0,sFf=fr[0].ff,sFb=fr[0].fb,sf0=f0[0];
  const kP=1-Math.exp(-1/(sr*.004)),kA=1-Math.exp(-1/(sr*.003));
  let FA=0,FB=0,FC=0;
  const l1=Math.random()*6,l2=Math.random()*6,l3=Math.random()*6;
  const te=oq,tp=te*.62;
  for(let k=0;k<fr.length;k++){
    const f=fr[k],tf0=f0[k];
    for(let s=0;s<spf;s++){
      const n=k*spf+s,t=n*T;
      for(let q=0;q<4;q++){sF[q]+=(f.F[q]-sF[q])*kP;sB[q]+=(f.B[q]-sB[q])*kP}
      sAv+=(f.av-sAv)*kA;sAh+=(f.ah-sAh)*kA;sAf+=(f.af-sAf)*kA;sFf+=(f.ff-sFf)*kP;sFb+=(f.fb-sFb)*kP;sf0+=(tf0-sf0)*kP;
      if((n&3)===0){
        for(let q=0;q<4;q++){
          const Fq=Math.min(sr*.45,sF[q]*Fs),Bq=sB[q]*(1+(q===0?breath*.8:breath*.3))+(q===0?sf0*.08:0);
          C[q]=-Math.exp(-TP*Bq*T);Bc[q]=2*Math.exp(-Math.PI*Bq*T)*Math.cos(TP*Fq*T);A[q]=1-Bc[q]-C[q];
        }
        const ff=Math.min(sr*.42,sFf*Math.sqrt(Fs));
        FC=-Math.exp(-TP*sFb*T);FB=2*Math.exp(-Math.PI*sFb*T)*Math.cos(TP*ff*T);FA=1-FB-FC;
      }
      jw+=((Math.random()*2-1)-jw)*.0015;
      const fv=sf0*(1+.011*Math.sin(TP*.7*t+l1)+.006*Math.sin(TP*1.9*t+l2)+.003*Math.sin(TP*3.3*t+l3)+.05*jw*o.jit+(vib?.03*Math.sin(TP*5.7*t):0));
      ph0+=fv*T;if(ph0>=1){ph0-=1;shimT=1+(Math.random()-.5)*.12*o.jit}
      shim+=(shimT-shim)*.002;
      let g=0;if(ph0<tp)g=.5*(1-Math.cos(Math.PI*ph0/tp));else if(ph0<te)g=Math.cos(Math.PI*(ph0-tp)/(2*(te-tp)));
      if(o.quant)g=ph0<.5?.5*(1-Math.cos(Math.PI*ph0/.5)):.5*(1+Math.cos(Math.PI*(ph0-.5)/.5));
      const dg=(g-prevG)*sr/fv;prevG=g;
      tl+=tiltA*(dg-tl);
      const nzr=Math.random()*2-1;nzl+=(nzr-nzl)*.55; // ruis iets afgerond, minder schel
      let x=o.whisper?nzl*(sAh*.6+sAv*.75):tl*.35*sAv*shim+nzl*(sAh*.6+breath*sAv*(.08+.25*g));
      for(let q=0;q<4;q++){const y=A[q]*x+Bc[q]*y1[q]+C[q]*y2[q];y2[q]=y1[q];y1[q]=y;x=y}
      const fz=FA*nzl*1.3*sAf+FB*fy1+FC*fy2;fy2=fy1;fy1=fz;
      const v=x+fz*.8;
      const yv=v-dcx+.995*dcy;dcx=v;dcy=yv;
      out[n]=yv;
    }
  }
  return out;
}
const sm=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
function lowpass(src,fc){const H=24,w=[];let ws=0;for(let i=-H;i<=H;i++){const x=i===0?2*fc:Math.sin(2*Math.PI*fc*i)/(Math.PI*i);const bw=.42+.5*Math.cos(Math.PI*i/H)+.08*Math.cos(2*Math.PI*i/H);w.push(x*bw);ws+=x*bw}
  const o=new Float32Array(src.length);for(let i=0;i<src.length;i++){let a=0;for(let j=-H;j<=H;j++){const k=i+j;if(k>=0&&k<src.length)a+=src[k]*w[j+H]}o[i]=a/ws}return o}
function resample(src,rate){ // versnellen = hoger + sneller (dorpsstijl), eerst laagdoorlaat tegen aliasing
  if(Math.abs(rate-1)<1e-3)return src;
  const fc=.45/rate,H=24,w=[];let ws=0;
  for(let i=-H;i<=H;i++){const x=i===0?2*fc:Math.sin(2*Math.PI*fc*i)/(Math.PI*i);const bw=.42+.5*Math.cos(Math.PI*i/H)+.08*Math.cos(2*Math.PI*i/H);w.push(x*bw);ws+=x*bw}
  for(let i=0;i<w.length;i++)w[i]/=ws;
  const n=Math.floor(src.length/rate),o=new Float32Array(n);
  for(let i=0;i<n;i++){const x=i*rate,a=Math.floor(x),f=x-a;let s0=0,s1=0;
    for(let j=-H;j<=H;j++){const ia=a+j,ib=ia+1,wj=w[j+H];if(ia>=0&&ia<src.length)s0+=src[ia]*wj;if(ib>=0&&ib<src.length)s1+=src[ib]*wj}
    o[i]=s0*(1-f)+s1*f}
  return o;
}

function normalize(pcm){
  for(let i=0;i<pcm.length;i++)if(!isFinite(pcm[i]))pcm[i]=0; // luidheid op RMS van de stem, zachte knie alleen boven de top
  let sum=0,cnt=0,bs=0,bn=0;
  for(let i=0;i<pcm.length;i++){bs+=pcm[i]*pcm[i];bn++;if(bn===512){const r=bs/bn;if(r>1e-7){sum+=r;cnt++}bs=0;bn=0}}
  const rms=cnt?Math.sqrt(sum/cnt):0;if(!rms)return pcm;
  let peak=0;for(const v of pcm)peak=Math.max(peak,Math.abs(v));
  const g=Math.min(.15/rms,.98/peak*1.6);
  for(let i=0;i<pcm.length;i++){const x=pcm[i]*g,a=Math.abs(x);pcm[i]=a<.7?x:Math.sign(x)*(.7+.28*Math.tanh((a-.7)/.28))}
  const fd=Math.min(256,pcm.length>>3);for(let i=0;i<fd;i++){const w=i/fd;pcm[i]*=w;pcm[pcm.length-1-i]*=w}
  return pcm}
function renderSynth(toks,o,sr){
  prosody(toks,o);
  const B=buildPhones(toks,o,sr);
  let pcm=synthPhones(B,o,sr);
  if(o.engine==='animal')pcm=resample(pcm,o.rate);
  return {pcm:normalize(pcm),marks:B.marks};
}

// ---- eigen opname: lettergrepen uit een stemopname knippen ----
function analyzeGrains(pcm,sr){
  const hop=Math.round(sr*.01),n=Math.floor(pcm.length/hop),env=new Float32Array(n);
  for(let i=0;i<n;i++){let s=0;for(let j=0;j<hop;j++){const v=pcm[i*hop+j];s+=v*v}env[i]=Math.sqrt(s/hop)}
  const smv=new Float32Array(n);for(let i=0;i<n;i++){let s=0,c=0;for(let j=-3;j<=3;j++){if(env[i+j]!==undefined){s+=env[i+j];c++}}smv[i]=s/c}
  let mx=0;for(const v of smv)mx=Math.max(mx,v);const th=mx*.22;
  const peaks=[];for(let i=1;i<n-1;i++){if(smv[i]>th&&smv[i]>=smv[i-1]&&smv[i]>=smv[i+1]){if(peaks.length&&i-peaks[peaks.length-1]<9){if(smv[i]>smv[peaks[peaks.length-1]])peaks[peaks.length-1]=i}else peaks.push(i)}}
  const grains=[];
  peaks.forEach(pk=>{
    let l=pk,r=pk;const lim=smv[pk]*.35;
    while(l>0&&pk-l<14&&smv[l]>lim)l--;while(r<n-1&&r-pk<14&&smv[r]>lim)r++;
    if(r-l<5)return;
    const a=l*hop,b=Math.min(pcm.length,r*hop),g=pcm.slice(a,b);
    let m=0;for(const v of g)m=Math.max(m,Math.abs(v));if(m<1e-4)return;for(let i=0;i<g.length;i++)g[i]/=m;
    grains.push(g);
  });
  return grains;
}

function segmentBySilence(pcm,sr,target){ // for the script: each sound between two silences is one syllable
  const hop=Math.round(sr*.005),n=Math.floor(pcm.length/hop),env=new Float32Array(n);
  for(let i=0;i<n;i++){let s=0;for(let j=0;j<hop;j++){const v=pcm[i*hop+j];s+=v*v}env[i]=Math.sqrt(s/hop)}
  const sorted=Array.from(env).sort((a,b)=>a-b),floor=sorted[Math.floor(n*.1)]||0,top=sorted[Math.floor(n*.98)]||1;
  const th=Math.max(floor*4,top*.06);
  let segs=[];let st=-1,lastOn=-1;
  for(let i=0;i<n;i++){if(env[i]>th){if(st<0)st=i;lastOn=i}else if(st>=0&&i-lastOn>24){segs.push([st,lastOn]);st=-1}}
  if(st>=0)segs.push([st,lastOn]);
  segs=segs.filter(([a,b])=>b-a>=10);
  let fixed=0;
  // small mismatch with the script: split the longest (two merged sounds) or merge the closest pair
  if(target&&Math.abs(segs.length-target)<=Math.max(4,Math.round(target*.12))){
    while(segs.length<target){
      let li=0;segs.forEach((s,i)=>{if(s[1]-s[0]>segs[li][1]-segs[li][0])li=i});
      const [a,b]=segs[li],lo=a+Math.floor((b-a)*.25),hi=a+Math.ceil((b-a)*.75);if(hi-lo<4)break;
      let m=lo;for(let i=lo;i<=hi;i++)if(env[i]<env[m])m=i;
      segs.splice(li,1,[a,m-1],[m+1,b]);fixed++;
    }
    while(segs.length>target){
      let gi=0,gb=1e9;for(let i=0;i<segs.length-1;i++){const g=segs[i+1][0]-segs[i][1];if(g<gb){gb=g;gi=i}}
      segs.splice(gi,2,[segs[gi][0],segs[gi+1][1]]);fixed++;
    }
  }
  const out=segs.map(([a,b])=>{const A=Math.max(0,(a-3)*hop),B=Math.min(pcm.length,(b+4)*hop);const g=pcm.slice(A,B);let m=0;for(const v of g)m=Math.max(m,Math.abs(v));for(let i=0;i<g.length;i++)g[i]/=m||1;return g});
  out.fixed=fixed;return out;
}
function renderSample(toks,grains,o,sr){
  prosody(toks,o);
  const animal=o.engine==='animal',base=(o.P/(o.base||200))*(animal?o.rate:1);
  const items=[],marks=[];let t=0;
  toks.forEach((k,i)=>{
    if(k.type==='gap'){t+=(animal?.035:.04)/o.S;return}
    if(k.type==='punct'){t+=(/[.!?…]/.test(k.mark)?.34:(k.mark?.16:0))/o.S;return}
    marks.push([t,i]);
    const reps=k.type==='laugh'?k.n:1;
    for(let r=0;r<reps;r++){
      const g=k.type==='laugh'?grains[hash('l'+i+r)%grains.length]:pickGrain(grains,k,(k.text||'')+i+r);
      const semi=k.type==='laugh'?4-r:(k.semiA||0);
      let rate;
      if(g.f0&&o.recF0){const target=(animal?o.P:o.recF0*(o.P/(o.base||200)))*Math.pow(2,semi/12);rate=Math.min(3.2,Math.max(.45,target/g.f0))} // every syllable lands on the intended pitch, whatever pitch it was read at
      else rate=base*Math.pow(2,semi/12);
      const end=Math.pow(2,((k.semiB??k.semiA??0)-(k.semiA||0))/12);
      let len=g.length/sr/rate;
      if(animal)len=Math.min(len,.075/o.S*(k.last?1.5:1));
      else len=Math.min(len,(k.last?.42:.26)/o.S);
      if(k.type==='laugh')len=Math.min(len,.1);
      const top=rate*Math.max(1,end);const gg=top>1.12?(g._lp&&g._lp[0]===Math.round(top*10)?g._lp[1]:(g._lp=[Math.round(top*10),lowpass(g,.46/top)])[1]):g;
      items.push({g:gg,t,rate,end,len,amp:k.amp||1});
      t+=animal?len*.92:len*.82;
    }
  });
  const N=Math.ceil((t+.3)*sr),out=new Float32Array(N);
  items.forEach(it=>{
    const n=Math.floor(it.len*sr),s0=Math.floor(it.t*sr),fade=Math.min(Math.floor(sr*.012),n>>2);
    let x=0;
    for(let i=0;i<n&&s0+i<N;i++){
      const r=it.rate*(1+(it.end-1)*(i/n));x+=r;const a=Math.floor(x);if(a+1>=it.g.length)break;
      const v=it.g[a]*(1-(x-a))+it.g[a+1]*(x-a);
      const w=i<fade?i/fade:(i>n-fade?(n-i)/fade:1);
      out[s0+i]+=v*w*it.amp;
    }
  });
  return {pcm:normalize(out),marks};
}

// ===== recording studio: chunks of 4 syllables in one breath, fixed order -> every syllable gets a label =====
function buildScript(kind){
  const mk=list=>list.map(ch=>ch.split('-').map(t=>{const x=sylFromText(t.replace(/^y/,'j').replace(/^eye$/,'ai').replace(/^ow$/,'ou'));return {show:t,c:x.c,v:x.v}}));
  if(kind==='vemmo')return mk(['ve-sha-do-ka','va-shi-di-ta','vo-she-ke-nu','na-ma-mo-vay','shay-tay-kay-nay','voo-noo-doo-shoo','vi-ni-mi-ki','da-ko-to-sho','a-o-i-oo','ay-e-ve-di']);
  const pairs=[['p','t'],['k','b'],['d','g'],['f','v'],['s','z'],['sh','h'],['m','n'],['l','r'],['w','j']];
  const sp={a:'ah',e:'eh',i:'ee',o:'oh',u:'oo'},cs=c=>c==='j'?'y':c;
  const out=[];
  pairs.forEach(([a,b])=>{
    out.push([[a,'a'],[b,'e'],[a,'i'],[b,'o']].map(([c,v])=>({show:cs(c)+sp[v],c,v})));
    out.push([[b,'u'],[a,'e'],[b,'i'],[a,'o']].map(([c,v])=>({show:cs(c)+sp[v],c,v})));
  });
  out.push(['a','e','i','o'].map(v=>({show:sp[v],c:'',v})));
  out.push([{show:'oo',c:'',v:'u'},{show:'eye',c:'',v:'ai'},{show:'ow',c:'',v:'ou'},{show:'ay',c:'',v:'ay'}]);
  return out;
}
// studio timing: the prompter and the analysis share it
function studioSchedule(nChunks,tempo){
  const I=tempo==='relaxed'?.46:.36,count=3,beat=.6,guide=.45,gap=.3,rest=1;
  const ev=[];let t=count*beat;
  for(let c=0;c<nChunks;c++){const g=t;const r=g+guide+gap;ev.push({chunk:c,guide:g,read:r,syl:[0,1,2,3].map(i=>r+i*I),end:r+4*I});t=r+4*I+rest}
  return {I,beat,count,guide,events:ev,total:t+.5};
}
function envOf(pcm,sr,ms){const hop=Math.max(1,Math.round(sr*ms/1000)),n=Math.floor(pcm.length/hop),e=new Float32Array(n);
  for(let i=0;i<n;i++){let s=0;for(let j=0;j<hop;j++){const v=pcm[i*hop+j];s+=v*v}e[i]=Math.sqrt(s/hop)}return {e,hop}}
function estimateF0(g,sr){ // autocorrelation on the loudest stretch, 70–600 Hz
  const L=Math.min(g.length,Math.round(sr*.06));if(L<sr*.02)return 0;
  let best=0,bi=0;const step=Math.round(sr*.01);for(let i=0;i+L<=g.length;i+=step){let s=0;for(let j=i;j<i+L;j+=4)s+=g[j]*g[j];if(s>best){best=s;bi=i}}
  const x=g.subarray(bi,bi+L),minL=Math.floor(sr/600),maxL=Math.floor(sr/70);
  let e0=0;for(let i=0;i<L;i++)e0+=x[i]*x[i];if(!e0)return 0;
  let bl=0,bv=0;for(let lag=minL;lag<=maxL&&lag<L/2;lag++){let s=0;for(let i=0;i+lag<L;i++)s+=x[i]*x[i+lag];const r=s/e0;if(r>bv){bv=r;bl=lag}}
  return bv>.45?sr/bl:0;
}
function isPureTone(seg,sr){ // the guide tone leaking into a phone recording: very periodic, short
  if(seg.length>sr*.75)return false;const f=estimateF0(seg,sr);if(!f)return false;
  const lag=Math.round(sr/f),L=Math.min(seg.length-lag,Math.round(sr*.2));let s=0,e=0;const o=Math.floor((seg.length-L-lag)/2);
  for(let i=o;i<o+L;i++){s+=seg[i]*seg[i+lag];e+=seg[i]*seg[i]}return e>0&&s/e>.97;
}
function chunkRangesBySilence(pcm,sr,target){
  const {e,hop}=envOf(pcm,sr,5),n=e.length;
  const sorted=Array.from(e).sort((a,b)=>a-b),floor=sorted[Math.floor(n*.1)]||0,top=sorted[Math.floor(n*.98)]||1;
  const th=Math.max(floor*4,top*.06);let segs=[],st=-1,last=-1;
  for(let i=0;i<n;i++){if(e[i]>th){if(st<0)st=i;last=i}else if(st>=0&&i-last>60){segs.push([st,last]);st=-1}} // 300 ms of quiet separates chunks
  if(st>=0)segs.push([st,last]);
  segs=segs.filter(([a,b])=>b-a>=16&&!isPureTone(pcm.subarray(a*hop,b*hop),sr));
  let fixed=0;
  if(Math.abs(segs.length-target)<=Math.max(2,Math.round(target*.15))){
    while(segs.length>target){let gi=0,gb=1e9;for(let i=0;i<segs.length-1;i++){const g=segs[i+1][0]-segs[i][1];if(g<gb){gb=g;gi=i}}segs.splice(gi,2,[segs[gi][0],segs[gi+1][1]]);fixed++}
    while(segs.length<target){let li=0;segs.forEach((s,i)=>{if(s[1]-s[0]>segs[li][1]-segs[li][0])li=i});const [a,b]=segs[li],lo=a+Math.floor((b-a)*.35),hi=a+Math.ceil((b-a)*.65);let m=lo;for(let i=lo;i<=hi;i++)if(e[i]<e[m])m=i;segs.splice(li,1,[a,m-1],[m+1,b]);fixed++}
  }
  const r=segs.map(([a,b])=>[a*hop,(b+1)*hop]);r.fixed=fixed;return r;
}
function chunkRangesFromSchedule(pcm,sr,sched){ // in-app recording: we know when each chunk was read
  return sched.events.map(ev=>{
    const A=Math.max(0,Math.floor((ev.read-.25)*sr)),B=Math.min(pcm.length,Math.floor((ev.end+.55)*sr));
    const seg=pcm.subarray(A,B),{e,hop}=envOf(seg,sr,5);let mx=0;for(const v of e)mx=Math.max(mx,v);const th=mx*.08;
    let a=0,b=e.length-1;while(a<b&&e[a]<th)a++;while(b>a&&e[b]<th)b--;
    return [A+a*hop,A+(b+1)*hop];
  });
}
function splitChunk(pcm,sr,A,B,n){ // cut one breath into n syllables at the quietest points near the expected borders
  const seg=pcm.subarray(A,B),{e,hop}=envOf(seg,sr,4),L=e.length;const sm2=new Float32Array(L);
  for(let i=0;i<L;i++){let s=0,c=0;for(let j=-2;j<=2;j++)if(e[i+j]!==undefined){s+=e[i+j];c++}sm2[i]=s/c}
  const cuts=[0];for(let k=1;k<n;k++){const x=Math.round(L*k/n),w=Math.round(L/n*.4);let m=Math.max(cuts[k-1]+2,x-w);for(let i=Math.max(cuts[k-1]+2,x-w);i<=Math.min(L-2,x+w);i++)if(sm2[i]<sm2[m])m=i;cuts.push(m)}cuts.push(L);
  return cuts.slice(0,-1).map((c,k)=>[A+Math.max(0,c*hop-Math.round(sr*.008)),Math.min(B,A+cuts[k+1]*hop+Math.round(sr*.008))]);
}
function analyzeScriptRecording(pcm,sr,kind,sched){
  const script=buildScript(kind),n=script.length;
  const ranges=sched?chunkRangesFromSchedule(pcm,sr,sched):chunkRangesBySilence(pcm,sr,n);
  if(ranges.length!==n)return {ok:false,found:ranges.length,expected:n};
  const grains=[],chunkF0=[];
  ranges.forEach(([A,B],ci)=>{
    const parts=splitChunk(pcm,sr,A,B,4),fs=[];
    parts.forEach(([a,b],pi)=>{const g=pcm.slice(a,b);let m=0;for(const v of g)m=Math.max(m,Math.abs(v));if(m<1e-4)return;for(let i=0;i<g.length;i++)g[i]/=m;
      g.c=script[ci][pi].c;g.v=script[ci][pi].v;g.pos=pi;g.loud=m;g.f0=estimateF0(g,sr);if(g.f0)fs.push(g.f0);grains.push(g)});
    fs.sort((a,b)=>a-b);chunkF0.push(fs.length?fs[fs.length>>1]:0);
  });
  const all=grains.map(g=>g.f0).filter(Boolean).sort((a,b)=>a-b),median=all.length?all[all.length>>1]:180;
  grains.forEach(g=>{if(!g.f0||Math.abs(12*Math.log2(g.f0/median))>9)g.f0=median});
  return {ok:true,grains,chunkF0,median,fixed:ranges.fixed||0,expected:n};
}
function labelGrains(grains,script){const flat=script.flat();if(grains.length!==flat.length)return false;grains.forEach((g,i)=>{g.c=flat[i].c;g.v=flat[i].v});return true}
function pickGrain(grains,k,salt){
  const c=k.c||'',v=k.v||'a',vb=(VSPEC[v]||[v])[0];
  let pool=grains.filter(g=>g.v!==undefined&&g.c===c&&g.v===v);
  if(!pool.length)pool=grains.filter(g=>g.v!==undefined&&g.c===c&&(VSPEC[g.v]||[g.v])[0]===vb);
  if(!pool.length&&c)pool=grains.filter(g=>g.c===c);
  if(!pool.length)pool=grains.filter(g=>g.v!==undefined&&(VSPEC[g.v]||[g.v])[0]===vb);
  if(!pool.length)pool=grains;
  const mid=pool.filter(g=>g.pos===1||g.pos===2); // middle of a breath = most natural transitions
  if(mid.length&&hash(salt+'m')%4!==0)pool=mid;
  return pool[hash(salt)%pool.length];
}
function scriptToks(script){const toks=[];script.forEach(row=>{row.forEach(x=>toks.push({type:'syl',text:x.show,c:x.c,v:x.v,k:'',jit:.5,stress:true}));toks.push({type:'punct',text:' · ',mark:'.'})});return toks}

// ===== Soft Tones: no voice, gentle pitched sounds that follow the melody of the line =====
const SCALE=[0,2,4,7,9];
function quant(semi){const o=Math.floor(semi/12),r=semi-o*12;let best=SCALE[0],bd=99;for(const x of SCALE.concat([12])){const d=Math.abs(x-r);if(d<bd){bd=d;best=x}}return o*12+best}
const SUST={horn:.15,trombone:.17,choir:.22,purr:.2};
function renderTone(toks,o,sr){
  prosody(toks,{...o,engine:'sim'});
  const notes=[],marks=[];let t=.02;
  toks.forEach((k,i)=>{
    if(k.type==='gap'){t+=.045/o.S;return}
    if(k.type==='punct'){t+=(/[.!?…]/.test(k.mark)?.34:(k.mark?.16:0))/o.S;return}
    if(k.type==='laugh'){marks.push([t,i]);for(let r=0;r<4;r++){const f=o.P*Math.pow(2,quant(9-r*2)/12),d=.075/o.S;notes.push({t,d,f,f2:f,a:.55});t+=d}return}
    marks.push([t,i]);const n=k.n||1;
    for(let j=0;j<n;j++){
      const x=n>1?j/(n-1):0,step=(j%2?1:-1)*o.E*1.5*(n>1?1:0);
      const raw=(k.semiA||0)*(1-x)+(k.semiB||0)*x+step,glide=o.tone==='horn'||o.tone==='trombone';
      const semi=glide?raw:quant(raw),x2=n>1?Math.min(1,(j+.8)/(n-1)):1,semi2=glide?(k.semiA||0)*(1-x2)+(k.semiB||0)*x2+(j===n-1&&k.last?(k.semiB-k.semiA)*.4:0):semi;
      const base=SUST[o.tone]?SUST[o.tone]:.088,d=(base/o.S)*(j===0&&k.stress?1.12:1)*(k.last&&j===n-1?1.6:1);
      notes.push({t,d,f:o.P*Math.pow(2,semi/12),f2:o.P*Math.pow(2,semi2/12),a:.5*(k.amp||1)*(j===0?1.08:.92)*(.92+((hash(k.text+j)%100)/100)*.16)});
      t+=d;
    }
  });
  const N=Math.ceil((t+1.2)*sr),out=new Float32Array(N),TP=2*Math.PI,kind=o.tone||'droplet';
  notes.forEach(nt=>{
    const sus=SUST[kind]?nt.d*1.08:0;const s0=Math.floor(nt.t*sr),len=Math.min(N-s0,Math.floor(sr*(sus?sus+(kind==='choir'?.25:.08):({glass:1.1,felt:.8,kalimba:.8,clouds:1.8,breeze:.9,hum:.6,rain:.4,softbubble:.4,wood:.5}[kind]||.35))));
    let lo=0,bd=0,lo2=0,bd2=0;const K=Math.max(3,Math.min(14,Math.floor(6000/nt.f)));
    const R=rng(hash(nt.t.toFixed(3)+kind)),extra=[R(),R(),R(),R()];let nz=0,b1=0,b2=0;
    const bf=nt.f*2,bq=8,bw=bf/bq,BC=-Math.exp(-TP*bw/sr),BB=2*Math.exp(-Math.PI*bw/sr)*Math.cos(TP*bf/sr),BA=1-BB-BC;
    let ph=0,ph2=0,ph3=0;
    for(let i=0;i<len;i++){
      const tt=i/sr;let v=0;
      if(kind==='droplet'){const f=nt.f*(1+.9*Math.exp(-tt/.012));ph+=f/sr;v=Math.sin(TP*ph)*(1-Math.exp(-tt/.002))*Math.exp(-tt/.11)}
      else if(kind==='bubble'){const f=nt.f*(.72+.28*(1-Math.exp(-tt/.025)));ph+=f/sr;v=(Math.sin(TP*ph)+.1*Math.sin(2*TP*ph))*(1-Math.exp(-tt/.004))*Math.exp(-tt/.08)}
      else if(kind==='kalimba'){ph+=nt.f/sr;ph2+=nt.f*5.4/sr;v=(Math.sin(TP*ph)*Math.exp(-tt/.32)+.12*Math.sin(TP*ph2)*Math.exp(-tt/.025))*(1-Math.exp(-tt/.0015))}
      else if(kind==='felt'){ph+=nt.f/sr;v=(Math.sin(TP*ph)+.25*Math.sin(2*TP*ph)+.07*Math.sin(3*TP*ph))*(1-Math.exp(-tt/.012))*Math.exp(-tt/.38)}
      else if(kind==='horn'||kind==='trombone'){ // muted brass: bright harmonics through a 'wah' mute that opens and closes per syllable
        const p=Math.min(1,tt/Math.max(.02,sus)),f=nt.f*Math.pow(nt.f2/nt.f,sm(p))*(1+(tt>.08?.006*Math.sin(TP*5.5*tt):0));ph+=f/sr;
        let w=0;for(let h=1;h<=K;h++)w+=Math.sin(TP*h*ph)/h;
        const env=Math.min(1,tt/.025)*(tt>sus?Math.exp(-(tt-sus)/.03):1);
        const [lo0,hi0]=kind==='horn'?[480,1500]:[300,950],open=Math.sin(Math.PI*Math.min(1,p*1.1)),fc=lo0+(hi0-lo0)*open;
        const F=2*Math.sin(Math.PI*Math.min(fc,sr/6)/sr),q=.35;
        lo+=F*bd;const hi=w*.6-lo-q*bd;bd+=F*hi; // state-variable filter: the mute
        lo2+=.08*(lo-lo2);
        v=(bd*.9+lo2*.5)*env*.55}
      else if(kind==='choir'){ // soft 'ooh': three voices (root, a scale step up, octave below) with slow vibrato
        const env=Math.min(1,tt/.09)*(tt>sus?Math.exp(-(tt-sus)/.12):1);let w=0;
        [[1,1,0],[1.122,.55,1.7],[.5,.45,3.1]].forEach(([m,a,phs])=>{const f=nt.f*m*(1+.005*Math.sin(TP*(4.8+phs*.3)*tt+phs));
          for(let h=1;h<=8;h++){const fh=f*h;if(fh>5000)break;const g=Math.exp(-Math.pow((fh-330)/180,2))+.5*Math.exp(-Math.pow((fh-720)/260,2))+.08*Math.exp(-Math.pow((fh-2300)/500,2));w+=a*g*Math.sin(TP*fh*tt+phs*h)}});
        nz+=((Math.random()*2-1)-nz)*.06;v=(w*.5+nz*.05)*env}
      else if(kind==='purr'){ // gentle purr: a low hum with a soft, shallow flutter and a breathing swell
        const env=Math.min(1,tt/.12)*(tt>sus?Math.exp(-(tt-sus)/.1):1),fl=.7+.3*Math.sin(TP*24*tt);ph+=nt.f*.5/sr;
        nz+=((Math.random()*2-1)-nz)*.02;v=(Math.sin(TP*ph)+.4*Math.sin(2*TP*ph)+.15*Math.sin(3*TP*ph)+nz*1.5)*fl*env*.5}
      else if(kind==='clouds'){ // slow, wide pad: root + fifth + octave, a tiny detune gives a slow shimmer (no roughness)
        const env=(1-Math.exp(-tt/.07))*Math.exp(-tt/.75);nz+=((Math.random()*2-1)-nz)*.04;
        v=(Math.sin(TP*nt.f*tt)+Math.sin(TP*(nt.f+.35)*tt)*.6+.45*Math.sin(TP*nt.f*1.5*tt)+.22*Math.sin(TP*nt.f*2*tt+1))*env*.55+nz*env*.35}
      else if(kind==='softbubble'){ // slower, rounder bubble plus a smaller one just after
        const f=nt.f*.85*(.8+.2*(1-Math.exp(-tt/.06)));ph+=f/sr;let w=Math.sin(TP*ph)*(1-Math.exp(-tt/.008))*Math.exp(-tt/.07);
        const t2=tt-.035-extra[0]*.02;if(t2>0){const f2=nt.f*1.27*(.8+.2*(1-Math.exp(-t2/.05)));ph2+=f2/sr;w+=.4*Math.sin(TP*ph2)*(1-Math.exp(-t2/.008))*Math.exp(-t2/.05)}v=w}
      else if(kind==='rain'){ // a soft drop with one or two smaller drops around it
        const drop=(t,f,a)=>t<0?0:Math.sin(TP*f*(t+.006*.6*(1-Math.exp(-t/.006))))*(1-Math.exp(-t/.001))*Math.exp(-t/.045)*a;
        v=drop(tt,nt.f*2,1)+drop(tt-.02-extra[1]*.05,nt.f*2*Math.pow(2,[0,2,4,7,9][Math.floor(extra[2]*5)]/12),.3)+(extra[3]>.5?drop(tt-.07-extra[0]*.04,nt.f*3,.18):0)}
      else if(kind==='breeze'){ // pitched whoosh: soft noise through a narrow resonance at the note
        nz=Math.random()*2-1;const y=BA*nz+BB*b1+BC*b2;b2=b1;b1=y;v=y*6*(1-Math.exp(-tt/.08))*Math.exp(-tt/.22)}
      else if(kind==='hum'){ // closed-mouth "mmm": warm harmonics, gentle vibrato
        const vib=1+.004*Math.sin(TP*5*tt);ph+=nt.f*vib/sr;const env=(1-Math.exp(-tt/.04))*Math.exp(-tt/.2);v=(Math.sin(TP*ph)+.35*Math.sin(2*TP*ph)+.12*Math.sin(3*TP*ph))*env*.7}
      else if(kind==='wood'){ // soft wooden tap
        ph+=nt.f/sr;ph2+=nt.f*2.76/sr;v=(Math.sin(TP*ph)*Math.exp(-tt/.12)+.25*Math.sin(TP*ph2)*Math.exp(-tt/.02))*(1-Math.exp(-tt/.0008))}
      else{ph+=nt.f/sr;ph2+=nt.f*3.5/sr;const I=1.5*Math.exp(-tt/.14);v=Math.sin(TP*ph+I*Math.sin(TP*ph2))*(1-Math.exp(-tt/.003))*Math.exp(-tt/.6)*.7}
      const tail=i>len-200?(len-i)/200:1;
      out[s0+i]+=v*nt.a*tail;
    }
  });
  // brightness: gentle low-pass
  const fc=1500+Math.max(0,Math.min(1,(o.tilt-.15)/.75))*8000,a=1-Math.exp(-TP*fc/sr);let y=0,y2=0;
  for(let i=0;i<N;i++){y+=a*(out[i]-y);y2+=a*(y-y2);out[i]=y2}
  { // RBJ peaking cut, -6 dB around 3 kHz
    const f0=3000,Q=.9,A=Math.pow(10,-6/40),w=TP*f0/sr,al=Math.sin(w)/(2*Q),cw=Math.cos(w);
    const b0=1+al*A,b1=-2*cw,b2=1-al*A,a0=1+al/A,a1=-2*cw,a2=1-al/A;let x1=0,x2=0,y1=0,y2=0;
    for(let i=0;i<N;i++){const x=out[i],y=(b0*x+b1*x1+b2*x2-a1*y1-a2*y2)/a0;x2=x1;x1=x;y2=y1;y1=y;out[i]=y}
  }
  for(let i=0;i<N;i++)if(!isFinite(out[i]))out[i]=0;
  let m=0;for(const v of out)m=Math.max(m,Math.abs(v));if(m>0)for(let i=0;i<N;i++)out[i]*=.8/m;
  return {pcm:out,marks};
}


// ===== ambience: seamless 8 s loops of rain, breeze or waves =====
function makeAmbient(type,sr){
  const L=Math.floor(sr*8),X=Math.floor(sr*.6),N=L+X,o=new Float32Array(N),TP=2*Math.PI;
  let b0=0,b1=0,b2=0,lp=0,lp2=0,bp1=0,bp2=0;const r=rng(type.length*977+3);
  for(let i=0;i<N;i++){
    const w=Math.random()*2-1;b0=.99765*b0+w*.099;b1=.963*b1+w*.2965;b2=.57*b2+w*1.0526;const pink=(b0+b1+b2+w*.1848)*.12;
    const t=i/sr;
    if(type==='rain'){lp+=.35*(pink-lp);o[i]=(pink-lp)*.55+lp*.25}
    else if(type==='breeze'){const sw=.55+.45*Math.sin(TP*t/8+1.3)*Math.sin(TP*t/4+.4);const fc=350+500*(.5+.5*Math.sin(TP*t/8));const F=2*Math.sin(Math.PI*fc/sr);bp1+=F*bp2;const hi=pink-bp1-.6*bp2;bp2+=F*hi;o[i]=bp2*sw*1.6}
    else{const sw=Math.pow(.5+.5*Math.sin(TP*t/8-1.6),1.6)*.9+.1;const a=.02+.1*sw;lp+=a*(pink-lp);lp2+=.3*(lp-lp2);o[i]=lp2*sw*2.2}
  }
  if(type==='rain'){ // a few soft drops
    for(let k=0;k<L/sr*14;k++){const s0=Math.floor(r()*L),f=1800+r()*2200,a=.05+r()*.07;for(let i=0;i<sr*.03&&s0+i<N;i++){const t=i/sr;o[s0+i]+=Math.sin(TP*f*t)*Math.exp(-t/.006)*a}}
  }
  for(let i=0;i<X;i++){const g=i/X;o[i]=o[i]*g+o[L+i]*(1-g)} // crossfade the tail into the head: seamless loop
  const out=o.subarray(0,L);let m=0;for(const v of out)m=Math.max(m,Math.abs(v));for(let i=0;i<L;i++)out[i]*=.5/(m||1);
  return out;
}


// ===== extra voice styles: own sound palette + a post-effect on top of the existing synthesis =====
const PALETTES={
  grumble:{cons:['m','b','g','n','r','d','h'],vow:['o','u','a','oo','ou'],codas:['m','n','r','g','','',''],name:'Grumble'},
  gizmo:{cons:['t','k','b','d','z','p'],vow:['e','i','o','ee'],codas:['k','t','z','','',''],name:'Gizmo'},
  sprite:{cons:['s','sh','f','l','n','v'],vow:['i','e','ee','ai','a'],codas:['s','l','n','','',''],name:'Sprite'},
  baby:{cons:['b','d','m','n','g','w'],vow:['a','u','i','oo','ah'],codas:[''],name:'Babytalk'}
};
function paletteLang(engine){return PALETTES[engine]||null}
function babyfy(toks){ // reduplicate: ba-ba, da-da, mi-mi
  let first=null,idx=0;
  toks.forEach(k=>{if(k.type!=='syl'){first=null;idx=0;return}
    if(idx%2===1&&first){k.c=first.c;k.v=first.v;k.k='';const cap=/^[A-Z]/.test(k.text);k.text=(first.c+first.v);if(cap)k.text=k.text.charAt(0).toUpperCase()+k.text.slice(1)}
    else{k.k='';first={c:k.c,v:k.v};const cap=/^[A-Z]/.test(k.text);k.text=k.c+k.v;if(cap)k.text=k.text.charAt(0).toUpperCase()+k.text.slice(1)}
    idx++});
  return toks;
}
function biquad(pcm,type,f,q,sr){
  const w=2*Math.PI*f/sr,al=Math.sin(w)/(2*q),cw=Math.cos(w);let b0,b1,b2,a0=1+al,a1=-2*cw,a2=1-al;
  if(type==='lp'){b0=(1-cw)/2;b1=1-cw;b2=(1-cw)/2}else if(type==='hp'){b0=(1+cw)/2;b1=-(1+cw);b2=(1+cw)/2}else{b0=al;b1=0;b2=-al}
  let x1=0,x2=0,y1=0,y2=0;for(let i=0;i<pcm.length;i++){const x=pcm[i],y=(b0*x+b1*x1+b2*x2-a1*y1-a2*y2)/a0;x2=x1;x1=x;y2=y1;y1=y;pcm[i]=y}return pcm;
}
function postFX(kind,pcm,sr){
  if(kind==='grumble'){biquad(pcm,'lp',2600,.7,sr);for(let i=0;i<pcm.length;i++)pcm[i]=Math.tanh(pcm[i]*1.6)/1.3;return {pcm,shift:0}}
  if(kind==='gizmo'){ // lower sample rate and bit depth, then take the sharpest edge off
    const hold=Math.max(1,Math.round(sr/9000));let h=0;for(let i=0;i<pcm.length;i++){if(i%hold===0)h=pcm[i];pcm[i]=Math.round(h*24)/24}
    biquad(pcm,'lp',6500,.7,sr);return {pcm,shift:0}}
  if(kind==='sprite'){ // airy: thin out the lows, add a short doubled shimmer
    biquad(pcm,'hp',260,.7,sr);const d=Math.round(sr*.011),o=new Float32Array(pcm.length+d);
    for(let i=0;i<pcm.length;i++){o[i]+=pcm[i];o[i+d]+=pcm[i]*.35}return {pcm:o,shift:0}}
  if(kind==='radio'){ // walkie-talkie: narrow band, a bit of drive, hiss, squelch before and after
    let m=0;for(const v of pcm)m=Math.max(m,Math.abs(v));const g=m>0?1/m:1;
    for(let i=0;i<pcm.length;i++)pcm[i]=Math.tanh(pcm[i]*g*2.2);biquad(pcm,'hp',420,.8,sr);biquad(pcm,'lp',2900,.9,sr);
    const pre=Math.round(sr*.16),post=Math.round(sr*.2),o=new Float32Array(pre+pcm.length+post);let hz=0;
    for(let i=0;i<o.length;i++){hz+=((Math.random()*2-1)-hz)*.5;o[i]=hz*.025}
    const sq=(at,len,amp)=>{let z=0;for(let i=0;i<len;i++){z+=((Math.random()*2-1)-z)*.6;const e=Math.sin(Math.PI*i/len);o[at+i]+=z*amp*e}};
    sq(0,Math.round(sr*.12),.32);sq(pre+pcm.length+Math.round(sr*.03),Math.round(sr*.15),.3);
    for(let i=0;i<pcm.length;i++)o[pre+i]+=pcm[i]*.55;return {pcm:o,shift:pre/sr}}
  return {pcm,shift:0};
}

if(typeof module!=='undefined')module.exports={postFX,paletteLang,babyfy,makeAmbient,analyzeScriptRecording,studioSchedule,estimateF0,renderTone,segmentBySilence,scriptToks,buildScript,labelGrains,vemmoClip,INTENTS,ANCHORS,buildPhones,synthPhones,prosody,tokenize,makeLang,renderSynth,renderSample,analyzeGrains,MOODS};
