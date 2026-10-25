# Make screen: engines, examples, generate/play/variant, stale, language, stop on switch. Logs every audio start/stop.
import asyncio,os,json
from playwright.async_api import async_playwright
HOOK=open('pw.py').read().split('HOOK="""')[1].split('"""')[0]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=await b.new_page(viewport={'width':1366,'height':800});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' else None)
    await pg.add_init_script(HOOK);await pg.goto('file://'+os.path.abspath('t2.html'));await pg.wait_for_timeout(500)
    R={}
    R['emptyVisible']=await pg.is_visible('#genBtn')
    await pg.click('#genBtn');await pg.wait_for_timeout(1500)
    R['afterGen']=await pg.evaluate("({sounds:document.getElementById('sounds').textContent.slice(0,40),dur:document.getElementById('dur').textContent,play:document.getElementById('playBtn').textContent,stale:!document.getElementById('stale').hidden})")
    await pg.fill('#txt','Hallo daar, hoe gaat het?');await pg.wait_for_timeout(200)
    R['staleAfterEdit']=await pg.evaluate("!document.getElementById('stale').hidden")
    await pg.click('#varBtn');await pg.wait_for_timeout(1500)
    R['variant']=await pg.evaluate("({label:document.getElementById('vLabel').textContent,navHidden:document.getElementById('vnav').hidden,stale:!document.getElementById('stale').hidden})")
    await pg.click('#vPrev');await pg.wait_for_timeout(200)
    R['prevStale']=await pg.evaluate("({label:document.getElementById('vLabel').textContent,stale:!document.getElementById('stale').hidden})")
    eng={}
    for e in ['sim','vemmo','tone','instr','animal']:
      await pg.click(f'#engines [data-e={e}]');await pg.wait_for_timeout(150)
      info=await pg.evaluate("""({desc:document.getElementById('engineDesc').textContent.slice(0,30),voiceLbl:document.getElementById('voiceLbl').textContent,
        voices:[...document.querySelectorAll('#voiceSel option')].length,intent:!document.getElementById('fIntent').hidden,mood:!document.getElementById('fMood').hidden,
        len:!document.getElementById('fLen').hidden,anchors:!document.getElementById('dAnchors').hidden,add:!document.getElementById('addVoice').hidden,
        form:!document.getElementById('fForm').hidden,lang:!document.getElementById('fLang').hidden})""")
      await pg.click('#genBtn' if await pg.is_visible('#genBtn') else '#varBtn');await pg.wait_for_timeout(2200)
      info['sounds']=await pg.evaluate("document.getElementById('sounds').textContent.slice(0,30)")
      eng[e]=info
    R['engines']=eng
    # per-engine memory: change sim mood, switch away and back
    await pg.click('#engines [data-e=sim]');await pg.select_option('#moodSel','boos');await pg.click('#engines [data-e=tone]');await pg.click('#engines [data-e=sim]')
    R['simMoodRemembered']=await pg.evaluate("document.getElementById('moodSel').value")
    R['textKept']=await pg.evaluate("document.getElementById('txt').value")
    # examples
    await pg.click('#engines [data-e=vemmo]');await pg.click('#exBtn');await pg.wait_for_timeout(200)
    R['exCount']=await pg.locator('#exList button').count()
    await pg.locator('#exList button').nth(4).click();await pg.wait_for_timeout(200)
    R['exApplied']=await pg.evaluate("({txt:document.getElementById('txt').value,voice:document.getElementById('voiceSel').value,intent:document.getElementById('intentSel').value,dlgOpen:document.getElementById('exDlg').open})")
    # language
    await pg.click('[data-lang=nl] >> nth=0');await pg.wait_for_timeout(200)
    R['nl']=await pg.evaluate("({h1:document.querySelector('#viewMake h1').textContent,gen:document.getElementById('varBtn').textContent,side:document.getElementById('hVoice').textContent,txt:document.getElementById('txt').value})")
    await pg.click('[data-lang=en] >> nth=0')
    # stop on navigation: play then go to voices
    await pg.click('#varBtn');await pg.wait_for_timeout(1200);await pg.click('#navVoices');await pg.wait_for_timeout(300)
    log=await pg.evaluate('window.__log')
    R['lastAudio']=log[-1][0]
    starts=[l for l in log if l[0]=='start' and not l[3]];R['plays']=len(starts);R['nanPlays']=sum(1 for l in starts if l[7]>0)
    # overlapping check: every start (non-loop) preceded by stop of previous
    R['errors']=errs
    print(json.dumps(R,indent=1,ensure_ascii=False))
    await pg.click('#navMake');await pg.screenshot(path='shot_make.png',full_page=True)
    await b.close()
asyncio.run(main())
