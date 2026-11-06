'use strict';
const el=id=>document.getElementById(id);
const creators=new URLSearchParams(location.search).get('modo')==='creadores';
document.body.classList.toggle('creators',creators);
el('creator').hidden=!creators;
el('ref').hidden=creators;
document.querySelectorAll('nav a')[Number(creators)].setAttribute('aria-current','page');
const token=()=>JSON.parse(localStorage.getItem('zerox-session')||'null')?.token;
async function api(body){
  const response=await fetch('https://zerox-sixofire-api.westdark161208.workers.dev/api/programs/'+(creators?'creators':'referrals'),{
    method:body?'POST':'GET',cache:'no-store',headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:body&&JSON.stringify(body)
  });
  if(response.status===401)el('login').hidden=false;
  const data=await response.json();
  if(!response.ok||!data.ok)throw Error(data.error||'Servicio temporalmente no disponible.');
  return data;
}
function entries(id,items,admin){
  const box=el(id);
  box.hidden=false;
  const list=box.querySelector('div');
  list.replaceChildren();
  if(!items.length)list.textContent=admin?'Sin solicitudes pendientes.':'Todavía no has enviado videos.';
  for(const item of items){
    const row=document.createElement('p');
    const link=document.createElement('a');
    link.href='https://www.tiktok.com/@'+item.handle+'/video/'+item.video;
    link.textContent='@'+item.handle+' ↗';
    link.target='_blank';link.rel='noopener';
    row.append(link,' · '+item.status+' · ID '+item.uid+' · '+item.views+' vistas declaradas'+(item.diamonds?' · '+item.diamonds+' diamantes':''));
    if(admin){
      const views=document.createElement('input');
      if(item.status==='pendiente'){views.type='number';views.placeholder='Vistas verificadas';views.setAttribute('aria-label',views.placeholder);row.append(views)}
      for(const action of item.status==='pendiente'?['aprobado','rechazado']:['entregado']){
        const button=document.createElement('button');
        button.textContent={aprobado:'Aprobar',rechazado:'Rechazar',entregado:'Confirmar entrega manual'}[action];
        button.onclick=async()=>{button.disabled=true;try{await api({action,video:item.video,verified:Number(views.value)});await load()}catch(e){el('status').textContent=e.message}finally{button.disabled=false}};
        row.append(button);
      }
    }
    list.append(row);
  }
}
async function load(){
  if(!token()){el('status').textContent='Inicia sesión para participar.';el('login').hidden=false;return}
  const data=await api();
  if(creators){
    el('claim').querySelector('button').disabled=false;
    entries('history',data.entries,false);
    if(data.queue)entries('review',data.queue,true);
  }else{
    el('code').textContent=data.code;el('share').hidden=false;
    el('stats').textContent=data.invited+' invitados · '+data.rewarded+' con bono · $'+(data.cents/100).toFixed(2)+' MXN de saldo ganado';
    el('wa').href='https://wa.me/?text='+encodeURIComponent('Regístrate en https://zeroxstore.com con mi código '+data.code+' y completa tu primera compra para ganar saldo.');
    el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(data.code);el('status').textContent='Código copiado.'}catch{el('status').textContent='Selecciona el código para copiarlo.'}};
  }
}
el('claim').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget,button=form.querySelector('button');
  button.disabled=true;
  try{const claim=Object.fromEntries(new FormData(form));claim.views=Number(claim.views);await api(claim);form.reset();el('status').textContent='Video enviado a revisión.';await load()}
  catch(e){el('status').textContent=e.message}finally{button.disabled=false}
};
load().catch(e=>{el('status').textContent=e.message});
