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
