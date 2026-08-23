const menu=document.getElementById('menu');
const mobile=document.getElementById('mobile');
if(menu){menu.addEventListener('click',()=>{mobile.classList.toggle('open');menu.setAttribute('aria-expanded',mobile.classList.contains('open'));menu.textContent=mobile.classList.contains('open')?'x':'☰';});mobile.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{mobile.classList.remove('open');menu.textContent='☰';}));}
document.body.classList.add('enhanced');
const progress=document.createElement('div');progress.className='scroll-progress';document.body.appendChild(progress);
function updateProgress(){const height=document.documentElement.scrollHeight-innerHeight;progress.style.setProperty('--progress',(height?scrollY/height*100:0)+'%');}addEventListener('scroll',updateProgress,{passive:true});updateProgress();
document.querySelectorAll('section,.card,.product,.list-item,.release-block,.requirements').forEach(item=>item.setAttribute('data-reveal',''));
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.1});
document.querySelectorAll('[data-reveal]').forEach(item=>observer.observe(item));
document.querySelectorAll('.page-hero').forEach(hero=>{const layer=document.createElement('div');layer.className='hero-particles';layer.setAttribute('aria-hidden','true');for(let i=0;i<20;i++){const dot=document.createElement('i');dot.style.left=(5+(i*37)%90)+'%';dot.style.top=(8+(i*19)%76)+'%';dot.style.setProperty('--duration',(4+(i%6))+'s');dot.style.setProperty('--delay','-'+(i%5)+'s');layer.appendChild(dot);}hero.prepend(layer);});
const icon=document.createElement('link');icon.rel='icon';icon.type='image/jpeg';icon.href='vortex_logo_1787259818226 - Kopya - Kopya.jpg';document.head.appendChild(icon);
const touchIcon=document.createElement('link');touchIcon.rel='apple-touch-icon';touchIcon.href='vortex_logo_1787259818226 - Kopya - Kopya.jpg';document.head.appendChild(touchIcon);
const manifest=document.createElement('link');manifest.rel='manifest';manifest.href='site.webmanifest';document.head.appendChild(manifest);
const contentScript=document.createElement('script');contentScript.src='site-content.js';document.body.appendChild(contentScript);
const creditsScript=document.createElement('script');creditsScript.src='vortex-credits.js';creditsScript.onload=()=>{
  if(!window.VortexCredits)return;
  const wallet=VortexCredits.welcome();
  const bar=document.createElement('div');
  bar.className='credit-bar';
  bar.innerHTML='<span>◆ <b id="siteCreditBalance">'+wallet.credits+'</b> CREDITS</span><div class="credit-bar-actions"><button type="button" id="siteDaily">Daily +75</button><button type="button" id="siteSend">Send to launcher</button></div><input id="siteRedeem" placeholder="Launcher code VX1-..."><button type="button" id="siteRedeemBtn">Redeem</button><small id="siteCreditNote"></small>';
  document.body.appendChild(bar);
  const paint=()=>{const el=document.getElementById('siteCreditBalance'); if(el) el.textContent=VortexCredits.load().credits;};
  const note=message=>{const el=document.getElementById('siteCreditNote'); if(el) el.textContent=message||'';};
  document.getElementById('siteDaily').onclick=()=>{note(VortexCredits.daily().message);paint();};
  document.getElementById('siteSend').onclick=()=>{const result=VortexCredits.exportCode(); note(result.ok?('Launcher code: '+result.code):result.message); paint();};
  document.getElementById('siteRedeemBtn').onclick=()=>{note(VortexCredits.redeem(document.getElementById('siteRedeem').value).message);paint();};
  window.addEventListener('vortex-credits',paint);
  document.querySelectorAll('[data-credit-item]').forEach(button=>button.addEventListener('click',event=>{
    event.preventDefault();
    const result=VortexCredits.spend(button.getAttribute('data-credit-item'), Number(button.getAttribute('data-cost')||0));
    note(result.message); paint();
    if(result.ok) button.textContent='OWNED';
  }));
};
document.body.appendChild(creditsScript);
const experienceScript=document.createElement('script');experienceScript.src='vortex-experience.js';document.body.appendChild(experienceScript);
