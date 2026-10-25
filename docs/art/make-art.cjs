// README art for Babble Engine: banner, style grid and a real waveform, as SVG with the site's fonts embedded.
// Usage: node docs/art/make-art.cjs (regenerate after changing styles, voices or the critters in app.js)
const fs=require('fs'),path=require('path'),REPO=process.argv[2]||path.join(__dirname,'../..'),OUT=path.join(REPO,'docs/art');
const B=require(path.join(REPO,'site/src/engine.js'));
fs.mkdirSync(OUT,{recursive:true});
const font=(f)=>fs.readFileSync(path.join(REPO,'site/fonts',f)).toString('base64');
const FONTS=`@font-face{font-family:Bagel;src:url(data:font/woff2;base64,${font('bagel-fat-one-latin.woff2')}) format('woff2')}
@font-face{font-family:Figtree;font-weight:300 900;src:url(data:font/woff2;base64,${font('figtree-latin.woff2')}) format('woff2')}`;
const INK='#231B12',PAPER='#FFF4E2',CORAL='#C23B26',MUTED='#5E5244';
// critter shapes and colours, the same as the style cards in site/src/app.js and styles.css
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
const COL={animal:['#F2B705','#E2553F'],sim:['#E8B98F','#2E9C62'],vemmo:['#D9A47A','#C2601C'],grumble:['#8FA36A','#5E7D2E'],gizmo:['#AFC3DE','#2F6FD6'],
  sprite:['#D9C4F2','#8A57D1'],echo:['#F0C56B','#B7791F'],radio:['#9CC9BF','#2F8C7E'],baby:['#F6C1D4','#D44F87'],tone:['#9ED6D9','#1E8F96'],instr:['#9ED6D9','#1E8F96']};
const CSS=`${FONTS}
.b{stroke:${INK};stroke-width:1.3}.e{fill:${INK};stroke:${INK}}.a{fill:none;stroke-width:3;stroke-linecap:round}
${Object.entries(COL).map(([k,[c,c2]])=>`.s-${k} .b{fill:${c}}.s-${k} .h{fill:${c2};stroke:${INK};stroke-width:1.3}.s-${k} .a{stroke:${c2}}`).join('')}
.logo{font-family:Bagel,'Arial Black',sans-serif}.ui{font-family:Figtree,'Segoe UI',Arial,sans-serif}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}`;
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const critter=(k,x,y,size)=>`<g class="s-${k}" transform="translate(${x-size/2},${y-size/2}) scale(${size/40})">${MINI[k]}</g>`;
const card=(x,y,w,h,r,fill='#fff',sh=6)=>`<rect x="${x+sh}" y="${y+sh}" width="${w}" height="${h}" rx="${r}" fill="${INK}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="3"/>`;
const textW=(s,size)=>s.length*size*.55;
// speech bubble centred above (cx, tipY), tail pointing down
function bubble(cx,tipY,text,size=22,fill='#fff',boxBottom=tipY-16,tipX=cx){
  const w=Math.round(textW(text,size)+40),h=size+28,x=cx-w/2,y=boxBottom-h;
  return `<rect x="${x+4}" y="${y+4}" width="${w}" height="${h}" rx="${h/2}" fill="${INK}"/>
<path d="M${cx-12} ${y+h-2} L${tipX} ${tipY} L${cx+10} ${y+h-2}" fill="${INK}" transform="translate(4,2)"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2}" fill="${fill}" stroke="${INK}" stroke-width="3"/>
<path d="M${cx-12} ${y+h-3} L${tipX} ${tipY} L${cx+10} ${y+h-3}" fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<rect x="${cx-11}" y="${y+h-7}" width="20" height="6" fill="${fill}"/>
<text x="${cx}" y="${y+h/2+size*.35}" text-anchor="middle" class="ui" font-weight="800" font-size="${size}" fill="${INK}">${esc(text)}</text>`;
}
const waves=(x,y,c)=>`<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"><path d="M${x} ${y-10} q8 10 0 20"/><path d="M${x+9} ${y-17} q13 17 0 34"/></g>`;
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><style>${CSS}</style>${body}</svg>`;
const dots=(w,h)=>`<defs><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#E6D3B3"/></pattern></defs><rect width="${w}" height="${h}" rx="28" fill="${PAPER}"/><rect width="${w}" height="${h}" rx="28" fill="url(#dots)"/>`;

// what each style really says for one line (from the engine itself)
const LINE='Hi! Do you want an apple?';
const say=k=>{let t=k==='vemmo'?B.vemmoClip('greet','short',3,'auto'):B.tokenize(LINE,k,3,B.paletteLang(k)||B.makeLang(3));if(k==='baby')t=B.babyfy(t);return t.map(x=>x.text).join('').trim()};

// 1. banner
{
  const W=1400,H=480;let b=dots(W,H);
  b+=`<text x="70" y="168" class="logo" font-size="112" fill="${INK}">Babble</text><text x="70" y="270" class="logo" font-size="112" fill="${CORAL}">Engine</text>`;
  b+=`<text x="74" y="338" class="ui" font-weight="800" font-size="30" fill="${INK}">Gibberish speech for game characters</text>`;
  b+=`<text x="74" y="378" class="ui" font-weight="600" font-size="22" fill="${MUTED}">11 styles · 47 voices · no voice actors needed</text>`;
  b+=`<rect x="74" y="408" width="172" height="40" rx="20" fill="${INK}"/><text x="160" y="435" text-anchor="middle" class="ui" font-weight="800" font-size="18" fill="${PAPER}">by Wrong Floor</text>`;
  const short=k=>say(k).split(' ').slice(0,4).join(' ').replace(/[.,!?…]*$/,'?');
  const cast=[['animal',720,'high','Hi! Do you want an apple?'],['grumble',885,'low',short('grumble')],['gizmo',1050,'high',short('gizmo')],['sprite',1215,'low',short('sprite')]];
  for(const [k,x,row,txt] of cast){
    b+=`<ellipse cx="${x}" cy="440" rx="54" ry="9" fill="${INK}" opacity=".12"/>`+critter(k,x,375,128)+waves(x+60,345,COL[k][1]);
    b+=bubble(row==='high'?x+10:x,300,txt,21,'#fff',row==='high'?196:262,x);
  }
  fs.writeFileSync(path.join(OUT,'banner.svg'),svg(W,H,b));
}
// 2. the eleven styles
{
  const ORDER=['animal','sim','vemmo','grumble','gizmo','sprite','echo','radio','baby','tone','instr'];
  const ICON={tone:'♪ ~ ♫ ~ ♪',instr:'wah-wah wa-wah!',radio:'kshh… '+say('radio').split(' ').slice(0,3).join(' ')+' …kshh',echo:say('echo').split(' ').slice(0,3).join(' ')+' (×4)'};
  const styles=B.styles(),W=1400,cw=200,ch=212,gap=24,cols=6,H=110+2*(ch+gap)+20;let b=dots(W,H);
  b+=`<text x="60" y="78" class="logo" font-size="48" fill="${INK}">11 styles</text><text x="300" y="76" class="ui" font-weight="700" font-size="22" fill="${MUTED}">Each one saying “${LINE}”</text>`;
  ORDER.forEach((k,i)=>{const r=Math.floor(i/cols),c=i%cols,x=60+c*(cw+gap)+(r?(cw+gap)/2:0),y=110+r*(ch+gap),s=styles.find(z=>z.id===k);
    const tint=COL[k][0];b+=card(x,y,cw,ch,22,'#fff',5);
    b+=`<rect x="${x+3}" y="${y+3}" width="${cw-6}" height="98" rx="19" fill="${tint}" opacity=".35"/>`;
    b+=critter(k,x+cw/2,y+56,78);
    b+=`<text x="${x+cw/2}" y="${y+134}" text-anchor="middle" class="ui" font-weight="800" font-size="20" fill="${INK}">${esc(s.name)}</text>`;
    b+=`<text x="${x+cw/2}" y="${y+158}" text-anchor="middle" class="mono" font-size="14" fill="${COL[k][1]}">${k}</text>`;
    let t=ICON[k]||say(k);if(textW(t,15)>cw-24)t=t.split(' ').reduce((a,w)=>textW(a+' '+w,15)<cw-40?a+' '+w:a)+'…';
    b+=`<text x="${x+cw/2}" y="${y+188}" text-anchor="middle" class="ui" font-style="italic" font-weight="600" font-size="15" fill="${MUTED}">${esc(t)}</text>`});
  fs.writeFileSync(path.join(OUT,'styles.svg'),svg(W,H,b));
}
// 3. a real render: waveform with syllable marks
{
  const r=B.render(LINE,{style:'sim',voice:'lottie',mood:'happy',seed:3,sampleRate:24000}),W=1400,H=330,x0=250,x1=1330,mid=180,amp=78;let b=dots(W,H);
  b+=critter('sim',140,200,120)+bubble(150,128,say('sim').split(' ').slice(0,2).join(' ')+'?',22);
  const n=x1-x0,step=r.pcm.length/n;let top='',bot='';
  for(let i=0;i<n;i++){let mn=0,mx=0;for(let j=Math.floor(i*step);j<Math.floor((i+1)*step);j++){const v=r.pcm[j];if(v<mn)mn=v;if(v>mx)mx=v}
    top+=`${i?'L':'M'}${x0+i} ${(mid-mx*amp).toFixed(1)}`;bot=`L${x0+i} ${(mid-mn*amp).toFixed(1)}`+bot}
  b+=`<line x1="${x0}" y1="${mid}" x2="${x1}" y2="${mid}" stroke="#E6D3B3" stroke-width="2"/>`;
  b+=`<path d="${top}${bot}Z" fill="${COL.sim[1]}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  r.syllables.forEach((s,i)=>{const x=x0+s.time/r.duration*n;b+=`<circle cx="${x.toFixed(1)}" cy="${mid+amp+22}" r="5" fill="${INK}"/>`;
    b+=`<text x="${x.toFixed(1)}" y="${mid+amp+48}" text-anchor="middle" class="ui" font-weight="700" font-size="15" fill="${MUTED}">${esc(s.text)}</text>`});
  b+=`<text x="${x0}" y="58" class="mono" font-size="20" fill="${INK}">render('${LINE}', { style: 'sim', mood: 'happy' })</text>`;
  b+=`<text x="${x0}" y="86" class="ui" font-weight="600" font-size="17" fill="${MUTED}">${r.duration.toFixed(2)} s of sound and ${r.syllables.length} syllable times, ready for mouth flaps and subtitles</text>`;
  fs.writeFileSync(path.join(OUT,'waveform.svg'),svg(W,H,b));
}
for(const f of fs.readdirSync(OUT))console.log(f,Math.round(fs.statSync(path.join(OUT,f)).size/1024)+' KB');
