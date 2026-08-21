const stats=document.querySelector('.stats');
if(stats){
  const links=[
    ['01','Features','Discover what powers your game.','features.html'],
    ['02','Download','Get ready for the first launch.','download.html'],
    ['03','News','Read build updates and guides.','news.html'],
    ['04','Shop','Preview upcoming cosmetics.','store.html'],
    ['05','Support','Meet the Vortex community.','support.html']
  ];
  const section=document.createElement('section');
  section.className='launchpad';
  section.innerHTML='<div class="wrap"><div class="launchpad-top"><div><div class="eyebrow">Explore Vortex</div><h2>Every part has a place.</h2></div><p>One clear starting point for every side of Vortex. Choose where you want to go next.</p></div><div class="launchpad-grid">'+links.map(([num,title,copy,href])=>'<a class="launch-card" href="'+href+'"><span>'+num+'</span><i>&nearr;</i><b>'+title+'</b><small>'+copy+'</small></a>').join('')+'</div></div>';
  stats.insertAdjacentElement('afterend',section);
}
