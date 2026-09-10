(function(){
  function polish(){
    document.querySelectorAll('.legend').forEach(function(legend){
      if(legend.dataset.polished==='1') return;
      legend.dataset.polished='1';
      var children=[].slice.call(legend.children);
      if(!children.length) return;
      var title=children.shift();
      var body=document.createElement('div');body.className='legend-body';
      children.forEach(function(n){body.appendChild(n)});
      var toggle=document.createElement('button');toggle.type='button';toggle.className='legend-toggle';
      toggle.innerHTML='<span>'+(title.textContent||'Was bedeuten die Farben?')+'</span><span class="chev">⌄</span>';
      legend.innerHTML='';legend.appendChild(toggle);legend.appendChild(body);
      toggle.addEventListener('click',function(){legend.classList.toggle('open')});
    });
    document.querySelectorAll('.day').forEach(function(day){
      if(day.classList.contains('green')||day.classList.contains('yellow')||day.classList.contains('red')||day.classList.contains('unrated'))return;
      var mark=(day.lastElementChild&&day.lastElementChild.textContent||'').trim();
      if(mark==='✓') day.classList.add('unrated');
    });
  }
  var mo=new MutationObserver(function(){polish()});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',polish);
  setTimeout(polish,100);
})();
