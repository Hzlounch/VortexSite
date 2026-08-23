window.VORTEX_BOT_URL = window.VORTEX_BOT_URL || '';
window.VORTEX_API_SECRET = window.VORTEX_API_SECRET || '';

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

function toast(message, type){
  const el = document.createElement('div');
  el.className = 'credit-toast' + (type && type !== 'ok' ? ' ' + type : '');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(-8px)';el.style.transition='.2s';},3300);
  setTimeout(()=>{el.remove();},3700);
}
function fmtDate(ts){const d=new Date(ts);return d.toISOString().slice(0,10);}
function copyText(text){return navigator.clipboard.writeText(text).then(()=>true).catch(()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ta.remove();return true;}catch(e){ta.remove();return false;}});}

function buildWalletModal(){
  if(document.getElementById('walletModal')) return document.getElementById('walletModal');
  const m = document.createElement('div');
  m.className = 'modal';
  m.id = 'walletModal';
  m.innerHTML = '<div class="modal-card" style="width:min(620px,100%);text-align:left"><div class="modal-symbol">★</div><h2 style="text-align:center">Vortex Wallet</h2><div id="walletBody"></div><button class="close" type="button" id="walletClose">Close</button></div>';
  document.body.appendChild(m);
  m.addEventListener('click', e=>{if(e.target===m) closeWallet();});
  document.getElementById('walletClose').addEventListener('click', closeWallet);
  document.addEventListener('keydown', e=>{if(e.key==='Escape') closeWallet();});
  return m;
}
function openWallet(){
  const m = buildWalletModal();
  paintWallet();
  m.classList.add('show');
  document.body.style.overflow='hidden';
}
function closeWallet(){
  const m = document.getElementById('walletModal');
  if(m) m.classList.remove('show');
  document.body.style.overflow='';
}
function paintWallet(){
  const VC = window.VortexCredits;
  if(!VC) return;
  const body = document.getElementById('walletBody');
  if(!body) return;
  const wallet = VC.load();
  const labels = VC.ITEM_LABELS || {};
  const costs = VC.ITEM_COSTS || {};
  const ownedList = Object.keys(labels).filter(k => wallet.owned.includes(k));
  const notOwned = Object.keys(labels).filter(k => !wallet.owned.includes(k));
  const tx = VC.recentHistory(10);
  const thumbClass = k => k;
  const thumbIcon = k => k==='cape' ? '<div class="cape" style="transform:scale(.62)"></div>' :
                        k==='wings' ? '<div class="wings" style="transform:scale(.58)"></div>' :
                        k==='plus' ? '<div class="plus" style="transform:scale(.52)">+</div>' : '★';
  let html = '<div class="wallet-card" style="padding:20px 18px;margin-bottom:16px">';
  html += '<div class="wallet-head"><div class="wallet-balance"><span>VORTEX CREDITS</span><b>'+wallet.credits+'</b></div>';
  html += '<div style="text-align:right;color:#7fe7e2;font-size:12px"><div>Owned: <b style="color:#efffff">'+ownedList.length+' / '+Object.keys(labels).length+'</b></div>';
  if(wallet.linkedMc) html += '<div style="margin-top:6px">Linked: <b style="color:#fde68a">'+wallet.linkedMc+'</b></div>';
  html += '</div></div></div>';
  html += '<h3 style="font-size:15px;color:#a8e8e4;margin:10px 0 12px">My Cosmetics</h3>';
  html += '<div class="wallet-owned">';
  ownedList.forEach(k => {
    html += '<div class="wallet-item"><div class="thumb">'+thumbIcon(k)+'</div><div><h4 style="margin:0">'+(labels[k]||k)+'</h4><span style="color:#86ffc1">OWNED</span></div></div>';
  });
  notOwned.forEach(k => {
    html += '<div class="wallet-item" style="opacity:.55"><div class="thumb" style="filter:grayscale(.4)">'+thumbIcon(k)+'</div><div><h4 style="margin:0">'+(labels[k]||k)+'</h4><span>Locked · '+(costs[k]||0)+' CR → <a href="store.html" style="color:#70ece7">Buy</a></span></div></div>';
  });
  html += '</div>';
  html += '<div class="wallet-history"><h3>Recent Activity</h3><ul>';
  if(tx.length){
    tx.forEach(t => {
      const sign = t.amount >= 0 ? '+' : '';
      html += '<li><small>'+fmtDate(t.ts)+'</small><span>'+t.label+'</span><b class="'+(t.amount>=0?'pos':'neg')+'">'+sign+t.amount+'</b></li>';
    });
  } else {
    html += '<li><small>—</small><span style="color:#92b4b8">No activity yet. Claim a daily drop or grab a cosmetic to get started.</span><b></b></li>';
  }
  html += '</ul></div>';
  body.innerHTML = html;
}

const creditsScript=document.createElement('script');creditsScript.src='vortex-credits.js';creditsScript.onload=()=>{
  if(!window.VortexCredits)return;
  const VC = window.VortexCredits;
  const wallet=VC.welcome();
  const bar=document.createElement('div');
  bar.className='credit-bar';
  bar.innerHTML='<button type="button" class="wallet-btn" id="siteWalletBtn" title="Open wallet">◆ <b id="siteCreditBalance">'+wallet.credits+'</b> CREDITS · <span id="siteOwnedCount">0</span> Owned</button><div class="credit-bar-actions"><button type="button" id="siteDaily">Daily +75</button><button type="button" id="siteSend">Send to launcher</button></div><input id="siteRedeem" placeholder="Paste VX1 or VX2 code…" autocomplete="off"><button type="button" id="siteRedeemBtn">Redeem</button><small id="siteCreditNote"></small>';
  document.body.appendChild(bar);
  const paint=()=>{
    const el=document.getElementById('siteCreditBalance'); if(el) el.textContent=VC.load().credits;
    const oc=document.getElementById('siteOwnedCount'); if(oc) oc.textContent = VC.load().owned.filter(k => VC.ITEM_LABELS && VC.ITEM_LABELS[k]).length;
    document.querySelectorAll('[data-credit-item]').forEach(btn => {
      const id = btn.getAttribute('data-credit-item');
      if(VC.owned(id)){
        btn.textContent = '✅ OWNED';
        btn.style.background = 'linear-gradient(105deg,#16a34a,#22c55e)';
        btn.style.color = '#03230a';
        btn.style.cursor = 'default';
        btn.disabled = true;
      }
    });
  };
  const note=message=>{const el=document.getElementById('siteCreditNote'); if(el) el.textContent=message||'';};
  document.getElementById('siteDaily').onclick=()=>{const r=VC.daily(); toast(r.message, r.ok?'ok':'warn'); note(r.message); paint();};
  document.getElementById('siteWalletBtn').onclick = openWallet;
  document.getElementById('siteSend').onclick=async ()=>{
    const result=VC.exportCode();
    if(result.ok){
      note('Launcher code: '+result.code);
      const copied = await copyText(result.code);
      toast(copied ? ('Launcher code copied to clipboard: '+result.code) : ('Launcher code: '+result.code), 'ok');
    } else {
      toast(result.message, 'warn');
      note(result.message);
    }
    paint();
  };
  document.getElementById('siteRedeemBtn').onclick=()=>{
    const r = VC.redeem(document.getElementById('siteRedeem').value);
    toast(r.message, r.ok?'ok':'error'); note(r.message); paint();
    if(r.ok) document.getElementById('siteRedeem').value='';
  };
  window.addEventListener('vortex-credits',paint);
  window.addEventListener('vortex-credits-tx', paintWallet);
  document.querySelectorAll('[data-credit-item]').forEach(button=>button.addEventListener('click',event=>{
    event.preventDefault();
    if(button.disabled) return;
    const result=VC.spend(button.getAttribute('data-credit-item'), Number(button.getAttribute('data-cost')||0));
    toast(result.message, result.ok?'ok':'warn'); note(result.message); paint();
  }));
  paint();
};
document.body.appendChild(creditsScript);
const experienceScript=document.createElement('script');experienceScript.src='vortex-experience.js';document.body.appendChild(experienceScript);
