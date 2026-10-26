// /game: a small Copy button inside every code block (the AI prompt included)
document.querySelectorAll('pre.code').forEach(pre=>{
  const wrap=document.createElement('div'),b=document.createElement('button');
  wrap.className='codewrap';pre.before(wrap);wrap.append(pre,b);
  b.type='button';b.className='copybtn';b.textContent='Copy';
  b.addEventListener('click',async()=>{
    let done=false;try{await navigator.clipboard.writeText(pre.textContent);done=true}catch(e){}
    if(!done){const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r)} // no clipboard: select it for Ctrl+C
    b.textContent=done?'Copied':'Copy';setTimeout(()=>{b.textContent='Copy'},2000);
  });
});
