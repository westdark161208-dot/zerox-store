(()=>{
 const q=id=>document.getElementById(id);
 window.addEventListener('zx-control-clear',()=>{q('operations-chart').replaceChildren();q('lunes-summary').textContent='Esperando los datos del panel.';});
 window.addEventListener('zx-control-data',({detail:d})=>{
  const m=d.metrics,rows=[['Diamantes',m.diamonds],['Revendedores',m.resellers]],max=Math.max(1,...rows.filter(([,v])=>v.available).map(([,v])=>v.total||0));
  q('operations-chart').replaceChildren();
  for(const [label,v] of rows){const row=document.createElement('div');row.className='chart-row';const name=document.createElement('span'),value=document.createElement('strong'),track=document.createElement('div'),fill=document.createElement('i');name.textContent=label;value.textContent=v.available?String(v.total||0):'Sin datos';track.className='chart-track';fill.style.width=(v.available?(v.total||0)/max*100:0)+'%';track.append(fill);row.append(name,value,track);q('operations-chart').append(row);}
  const note=document.createElement('p');note.className='console-note';note.textContent='Total de pedidos por canal. Escala relativa al canal mayor; sin ingresos ni pagos de prueba.';q('operations-chart').append(note);
  const users=m.users.available?`${m.users.total||0} usuarios registrados`:'registro de usuarios sin datos',pending=m.resellers.available?`${m.resellers.pending||0} pedidos pendientes de revendedores`:'pedidos de revendedores sin datos';
  q('lunes-summary').textContent=`En esta consulta: ${users}; ${pending}. Las consultas de proveedores se ejecutan cuando las solicitas. Compras con Wallet y entrega automática pendientes de activación.`;
 });
})();
