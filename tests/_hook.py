import asyncio,os
from playwright.async_api import async_playwright
HOOK="""
window.__log=[];
const C=window.AudioContext;
const origCBS=C.prototype.createBufferSource;
C.prototype.createBufferSource=function(){const s=origCBS.call(this);const st=s.start.bind(s),sp=s.stop.bind(s);
 s.start=(...a)=>{let nan=0,len=0,mx=0;if(s.buffer){const d=s.buffer.getChannelData(0);len=d.length/s.buffer.sampleRate;for(const v of d){if(!isFinite(v))nan++;else mx=Math.max(mx,Math.abs(v))}}window.__log.push(['start',this.currentTime.toFixed(2),'loop',s.loop,'len',len.toFixed(2),'nan',nan,'peak',mx.toFixed(2)]);return st(...a)};
 s.stop=(...a)=>{window.__log.push(['STOP',this.currentTime.toFixed(2),new Error().stack.split('\\n').slice(2,5).join(' | ')]);return sp(...a)};return s};
"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=await b.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' else None)
    await pg.add_init_script(HOOK)
    open('t.html','w').write('<!doctype html><html><head><meta charset=utf-8></head><body>'+open('brabbel.html').read().replace('<link rel="stylesheet" href="https://fonts','<link rel="x" href="https://fonts')+'</body></html>')
    await pg.goto('file://'+os.path.abspath('t.html'))
    await pg.click('[data-e=instr]')
    await pg.wait_for_timeout(9000)
    for v in ['Trombone','Ooh Choir']:
      await pg.click(f'#voices button:has-text("{v}")');await pg.wait_for_timeout(9000)
    await pg.click('[data-amb=rain]');await pg.wait_for_timeout(9000)
    log=await pg.evaluate('window.__log')
    for l in log:print(l)
    print('ERRORS',errs)
    await b.close()
asyncio.run(main())
