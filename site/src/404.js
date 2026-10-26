// 404 page: Fern asks where the page went, with the real engine. The critter bobs on every syllable.
(function(){
  const btn=document.getElementById('lostHear'),fern=document.getElementById('lostCritter');let cur=null,timers=[];
  const stop=()=>{if(cur)cur.stop();cur=null;timers.forEach(clearTimeout);timers=[];fern.classList.remove('talk','bob')};
  btn.addEventListener('click',()=>{
    stop();
    const line=Babble.render('Where did that page go? Hello?',{style:'animal',voice:'fern',mood:'surprised',seed:Math.floor(Math.random()*1e6)});
    cur=Babble.play(line);fern.classList.add('talk');
    line.syllables.forEach(s=>timers.push(setTimeout(()=>{fern.classList.remove('bob');void fern.getBoundingClientRect();fern.classList.add('bob')},s.time*1000)));
    const me=cur;Promise.resolve(me.ended).then(()=>{if(cur===me)stop()});
  });
})();
