(()=>{
 const q=id=>document.getElementById(id);
 const session=()=>JSON.parse(localStorage.getItem('zerox-session')||'null')?.token;
 const base='https://zerox-sixofire-api.westdark161208.workers.dev/api/';
 async function api(path,body){
   const token=session();
   const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
   const d=await r.json();if(!r.ok||!d.ok||token!==session())throw Error();
   return d;
 }
 if(q('benefits')){
   const result=q('benefit-result');
   async function load(){try{const d=await api('admin/benefits');q('award-list').replaceChildren(...d.awards.map(a=>{let li=document.createElement('li');li.textContent='Nivel '+a.level+' · '+a.title;return li}));}catch{result.textContent='Servicio de beneficios no disponible.'}}
   for(const [id,action] of [['reward-form','reward'],['benefit-form','create']]){
     const form=q(id);form.onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(form));if(action==='reward')b.level=Number(b.level);e.submitter.disabled=true;
       try{await api('admin/benefits',{...b,action});form.reset();result.textContent='Guardado.';await load()}catch{result.textContent='No se pudo guardar. Comprueba los datos y la disponibilidad del servicio.'}finally{e.submitter.disabled=false}};
   }
   window.addEventListener('zx-control-ready',load);
   window.addEventListener('zx-control-clear',()=>{q('benefit-form').reset();q('award-list').replaceChildren();result.textContent=''});
 }else{
   const sync=async()=>{
     if(!session())return;
     try{const d=await api('benefits/me');q('account-xp').textContent=d.xp;q('account-level').textContent=d.level;
       document.querySelector('.level-help p:last-child').textContent='10 XP por compra completada. Cada 100 XP subes de nivel. '+d.awards.map(a=>a.title).join(' · ');
       for(const id of ['account-name','account-username','drawer-profile-name','drawer-profile-handle']){q(id).style.color=d.style?.color||'';q(id).style.fontFamily=d.style?.font||''}
       q('account-avatar').style.outline=d.style?'2px solid '+({aqua:'#55ffda',gold:'#ffcb62',violet:'#bb82ff'}[d.style.frame]):'';
     }catch{}
   };
   q('account-modal').addEventListener('toggle',()=>{if(q('account-modal').open)sync()});
   window.addEventListener('zx-account-ready',()=>setTimeout(sync,0));
 }
})();
