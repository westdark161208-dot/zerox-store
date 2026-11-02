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
   const editor=q('reward-form'), rules=q('member-rules');
   let awards=[];
   function openLevel(level){
     editor.hidden=false;editor.elements.level.value=level;
     editor.querySelector('h3').textContent='Premios del nivel '+level;
     editor.elements.title.value=awards.find(a=>a.level===Number(level))?.title||'';
     for(const button of q('level-buttons').children)button.setAttribute('aria-pressed',String(button.dataset.level===String(level)));
   }
   q('level-buttons').onclick=e=>{if(e.target.dataset.level)openLevel(e.target.dataset.level)};
   async function load(){try{awards=(await api('admin/benefits')).awards;if(!editor.hidden)openLevel(editor.elements.level.value)}catch{q('reward-result').textContent='Servicio de experiencia no disponible.'}}
   q('add-rule').onclick=()=>{
     const row=document.createElement('div');row.className='member-rule';
     row.innerHTML='<label>Sección o producto<select></select></label><label>Nombre de categoría o ID de producto<input maxlength="100" placeholder="Ej. PUBG Mobile"></label><label>Descuento (%)<input type="number" min="1" max="99" required></label><button type="button">Quitar</button>';
     const select=row.querySelector('select'),detail=row.querySelector('input');
     for(const [key,label] of Object.entries({freefire:'Free Fire completo',diamonds:'Diamantes',passes:'Pases y membresías',fragments:'Fragmentos',boxes:'Cajas',category:'Otra categoría o juego',product:'Producto específico'}))select.add(new Option(label,key));
     select.onchange=()=>{detail.required=['product','category'].includes(select.value);detail.parentElement.hidden=!detail.required};
     select.onchange();row.querySelector('button').onclick=()=>row.remove();rules.append(row);
   };
   for(const [id,action] of [['reward-form','reward'],['benefit-form','create']]){
     const form=q(id);form.onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(form));
       const out=action==='reward'?q('reward-result'):result;
       if(action==='reward')b.level=Number(b.level);
       else b.rules=[...rules.children].map(row=>{const [key,pct]=row.querySelectorAll('input');return {scope:row.querySelector('select').value,key:key.required?key.value.trim():'',percent:Number(pct.value)}});
       e.submitter.disabled=true;
       try{await api('admin/benefits',{...b,action});out.textContent='Guardado.';if(action==='reward')await load();else{form.reset();rules.replaceChildren()}}catch{out.textContent='No se pudo guardar. Comprueba los datos y la disponibilidad del servicio.'}finally{e.submitter.disabled=false}};
   }
   window.addEventListener('zx-control-ready',load);
   window.addEventListener('zx-control-clear',()=>{awards=[];editor.reset();editor.hidden=true;q('benefit-form').reset();rules.replaceChildren();result.textContent='';q('reward-result').textContent=''});
 }else{
   const sync=async()=>{
     if(!session())return;
     try{const d=await api('benefits/me');q('account-xp').textContent=d.xp;q('account-level').textContent=d.level;
       document.querySelector('.level-help p:last-child').textContent='10 XP por compra completada. Cada 100 XP subes de nivel. '+d.awards.map(a=>a.title).join(' · ');
       for(const id of ['account-name','account-username','drawer-profile-name','drawer-profile-handle']){q(id).style.color=d.style?.color||'';q(id).style.fontFamily=d.style?.font||''}
       let badge=q('account-benefit-badge');if(!badge){badge=document.createElement('small');badge.id='account-benefit-badge';q('account-username').after(badge)}badge.textContent=d.badge?' ✦ '+d.badge:'';
       q('account-avatar').style.outline=d.style?'2px solid '+({aqua:'#55ffda',gold:'#ffcb62',violet:'#bb82ff',ruby:'#ff365e',silver:'#c5ccdb',emerald:'#36d596'}[d.style.frame]):'';
     }catch{}
   };
   q('account-modal').addEventListener('toggle',()=>{if(q('account-modal').open)sync()});
   window.addEventListener('zx-account-ready',()=>setTimeout(sync,0));
 }
})();
