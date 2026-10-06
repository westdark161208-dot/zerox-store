(()=>{
 const regions=globalThis.ZXCountryRegions||{},labels={north:'Norteamérica',central:'Centroamérica y Caribe',south:'Sudamérica'},names=new Intl.DisplayNames(['es'],{type:'region'}),api='https://zerox-sixofire-api.westdark161208.workers.dev/api/auth/location';
 const form=document.createElement('form');form.className='profile-card zx-account-panel auth-form';
 form.innerHTML='<h2>País y región de compra</h2><p>Selecciona el país desde el que compras. La región se asigna automáticamente. Estos datos solo los ven tu cuenta y la administración.</p><label>País de compra<select name="country" autocomplete="country" required><option value="">Selecciona tu país</option></select></label><p data-region></p><label>Estado o provincia (opcional)<input name="state" maxlength="100" autocomplete="address-level1"></label><button type="submit">Guardar país de compra</button><p role="status"></p>';
 for(const code of Object.keys(regions).sort((a,b)=>names.of(a).localeCompare(names.of(b))))form.elements.country.add(new Option(names.of(code),code));
 (document.querySelector('#account-user')||document.querySelector('main'))?.append(form);
 const out=form.querySelector('[role=status]'),region=form.querySelector('[data-region]');
 function update(){region.textContent=form.elements.country.value?'Región: '+labels[regions[form.elements.country.value]]:'Selecciona tu país para registrar la región de compra.';}
 form.elements.country.onchange=update;
 function token(){try{return JSON.parse(localStorage.getItem('zerox-session')||'null')?.token;}catch{return null;}}
 let version=0;
 async function request(options={}){const v=version,t=token();if(!t)throw Error('Inicia sesión para guardar tu país.');const r=await fetch(api,{...options,cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t}});if(v!==version||t!==token())throw Error('STALE');const b=await r.json();if(!r.ok)throw Error('No fue posible guardar el país.');return b;}
 form.onsubmit=async e=>{e.preventDefault();const v=version,button=form.querySelector('button');button.disabled=true;try{await request({method:'POST',body:JSON.stringify({country:form.elements.country.value,state:form.elements.state.value})});out.textContent='País y región guardados.';}catch(err){if(err.message!=='STALE')out.textContent=err.message;}finally{if(v===version)button.disabled=false;}};
 async function load(){version++;form.reset();out.textContent='';update();form.querySelector('button').disabled=false;if(!token())return;try{const b=await request();if(b.location){form.elements.country.value=b.location.country;form.elements.state.value=b.location.state;update();}}catch{}}
 window.addEventListener('zx-session-change',load);window.addEventListener('zx-account-ready',load);load();
})();
