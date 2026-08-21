const menu=document.getElementById('menu');
const mobile=document.getElementById('mobile');
if(menu){menu.addEventListener('click',()=>{mobile.classList.toggle('open');menu.textContent=mobile.classList.contains('open')?'x':'☰';});}
