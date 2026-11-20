import {types,sliders,neutral,layer,MAX_LAYERS,presets,designOf,references,resolved,change} from './model.mjs';
import {mount,detach} from './renderer.mjs';
import {useState} from './storefront.mjs';

const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n;};
const clone=structuredClone;
function button(text,fn,props={}) {
  const b=el('button',text);b.type='button';b.onclick=fn;Object.assign(b,props);return b;
}
function choice(entries,current,onChange,label) {
  const sel=el('select');sel.setAttribute('aria-label',label);
  for(const [id,name] of entries)sel.add(new Option(name,id));
  sel.value=current;sel.onchange=()=>onChange(sel.value);return sel;
}
function toggle(label,value,fn) {
  const wrap=el('label'),c=el('input');c.type='checkbox';c.checked=value;
  c.onchange=()=>fn(c.checked);wrap.append(c,' '+label);return wrap;
}
function field(name,control) {
  const label=el('label',name);label.className='fx-control';label.append(control);return label;
}
function group(cls,...nodes){const div=el('div');div.className=cls;div.append(...nodes);return div;}
function textField(value,limit,multiline=false) {
  const n=el(multiline?'textarea':'input');n.value=value;n.maxLength=limit;return n;
}
const auth=()=>typeof getZeroXSession==='function'?getZeroXSession()?.token:null;
export function remoteStore() {
  const token=auth();
  async function request(options) {
    if(!token||token!==auth())throw Error('Sesión finalizada.');
    const r=await fetch('/api/fx-studio?editor=1',{...options,cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}});
    const d=await r.json();
    if(token!==auth())throw Error('Sesión finalizada.');
    if(!r.ok)throw Error(d.error||'FX_UNAVAILABLE');
    return d;
  }
  return {load:()=>request(),save:(revision,command)=>request({method:'POST',body:JSON.stringify({revision,command})})};
}

export async function openStudio({id=null,name='',image='',library=false,store=remoteStore(),onChange=useState}) {
  if(document.querySelector('#zx-fx'))return;
  const dialog=el('dialog');dialog.id='zx-fx';dialog.setAttribute('aria-label','FX Studio');
  dialog.innerHTML=`<header><div><h2>FX Studio</h2><p data-item></p></div><button type="button" data-close>Cerrar ×</button></header>
  <div class="fx-grid"><section><h3>Vista previa</h3><div class="fx-stage" data-device="desktop"></div><div class="fx-tools" data-device></div><p data-hint></p></section>
  <section><nav class="fx-tools" aria-label="Herramientas FX"></nav><div data-panel></div></section></div>
  <footer><div data-actions class="fx-tools"></div><p class="fx-status" role="status" aria-live="polite">Cargando diseños…</p></footer>`;
  const q=sel=>dialog.querySelector(sel), stage=q('.fx-stage'),panel=q('[data-panel]'),actions=q('[data-actions]'),status=q('[role=status]');
  q('[data-item]').textContent=name||'Biblioteca FX';
  if(image){const img=el('img');img.src=image;img.alt=name;img.onerror=()=>{img.remove();};stage.append(img);}
  document.body.append(dialog);dialog.showModal();
  let state,revision,draft=neutral(),selected=null,tab=library?'library':'layers',dirty=false,busy=false;
  let editDesign=null,productDraft=null,sourceLink=null,search='',filter='',collection='',picked=null;
  const thumbs=new Set();
  function clearThumbs(){for(const t of thumbs)detach(t);thumbs.clear();}
  function canLeave(){return !busy&&(!dirty||confirm('¿Descartar los cambios FX sin guardar?'));}
  q('[data-close]').onclick=()=>{if(canLeave())dialog.close();};
  dialog.oncancel=e=>{if(!canLeave())e.preventDefault();};
  dialog.onclose=()=>{clearThumbs();detach(stage);dialog.remove();};
  const tools=q('div[data-device]:not(.fx-stage)');
  for(const [v,title] of [['mobile','Móvil'],['desktop','Escritorio']])tools.append(button(title,()=>{
    stage.dataset.device=v;for(const b of tools.children)b.setAttribute('aria-pressed',String(b.textContent===title));
  }));
  tools.lastChild.setAttribute('aria-pressed','true');
  function preview(){mount(stage,draft,10);}
  function touch(){dirty=true;status.textContent='Cambios sin guardar.';preview();}
  function update(command,done) {
    if(busy)return;
    busy=true;
    const original=dialog.querySelector('.fx-grid');original.inert=true;actions.inert=true;
    status.textContent='Guardando…';
    (async()=>{
      const next=change(state,command),saved=await store.save(revision,command);
      state=next;revision=saved.revision;onChange(state);
      done?.();render();status.textContent='Cambios FX guardados.';
    })().catch(e=>{
      status.textContent=({
        CONFLICT:'Otra sesión guardó cambios. Cierra y vuelve a abrir FX Studio para cargar esa versión.',
        FORBIDDEN:'Solo la cuenta fundadora puede guardar diseños.',
        UNAUTHORIZED:'Tu sesión venció. Inicia sesión de nuevo.',
        INVALID_TEXT:'Escribe un nombre y una categoría dentro del límite indicado.',
        FX_STORAGE_UNAVAILABLE:'Almacenamiento FX no disponible en este entorno.',
        CONFIRM_LINKED:'Confirma los artículos vinculados antes de guardar.'
      })[e.message]||'No se pudo guardar: '+e.message;
    }).finally(()=>{busy=false;original.inert=false;actions.inert=false;});
  }
  function loadProduct(){
    sourceLink=state.items[id]?.link||null;draft=clone(resolved(state,id)||neutral());selected=draft.layers[0]?.id;dirty=false;
  }
  function switchTo(target){tab=target;render();}
  function render() {
    clearThumbs();panel.replaceChildren();actions.replaceChildren();
    const nav=q('nav');nav.replaceChildren();
    const navButton=(text,target)=>{
      const b=button(text,()=>switchTo(target));b.setAttribute('aria-pressed',String(tab===target));nav.append(b);
    };
    if(id||editDesign)navButton('Efectos visuales FX','layers');
    if(!editDesign)navButton('Biblioteca FX','library');
    q('[data-item]').textContent=editDesign?'Diseño · '+(editDesign.name||'Nuevo diseño'):name||'Biblioteca FX';
    q('[data-hint]').textContent=tab==='layers'&&selected?'Arrastra sobre la vista previa para mover la capa seleccionada.':'';
    if(tab==='layers')layersUI();else libraryUI();
    preview();
  }
  function editLayer(fn){fn();touch();render();}
  function layersUI() {
    panel.append(group('fx-tools',toggle('Activar FX',draft.enabled,v=>{draft.enabled=v;touch();}),
      toggle('Traseras',draft.back,v=>{draft.back=v;touch();}),toggle('Delanteras',draft.front,v=>{draft.front=v;touch();})));
    if(sourceLink&&!editDesign)panel.append(el('p','Diseño vinculado · '+designOf(state,sourceLink).name));
    const list=el('ol');list.className='fx-layers';
    draft.layers.forEach((l,i)=>{
      const row=el('li'),select=button(types[l.type]+' · '+(l.plane==='back'?'Trasera':'Delantera'),()=>{selected=l.id;render();});
      select.setAttribute('aria-pressed',String(selected===l.id));
      const move=delta=>editLayer(()=>{draft.layers.splice(i,1);draft.layers.splice(i+delta,0,l);});
      const copy=button('Duplicar',()=>editLayer(()=>{const c={...l,id:crypto.randomUUID()};draft.layers.splice(i+1,0,c);selected=c.id;}),{disabled:draft.layers.length>=MAX_LAYERS});
      const up=button('↑',()=>move(-1),{disabled:i===0});up.setAttribute('aria-label','Subir capa');
      const down=button('↓',()=>move(1),{disabled:i===draft.layers.length-1});down.setAttribute('aria-label','Bajar capa');
      row.append(toggle('Activa',l.enabled,v=>{l.enabled=v;touch();}),select,up,down,copy,
        button('Eliminar',()=>editLayer(()=>{draft.layers.splice(i,1);selected=draft.layers[Math.min(i,draft.layers.length-1)]?.id;})));
      list.append(row);
    });panel.append(list);
    panel.append(button('Añadir efecto',()=>editLayer(()=>{
      const l=layer('smoke',draft.layers.length?'front':'back');
      if(!draft.layers.length)draft.enabled=true;
      draft.layers.push(l);selected=l.id;
    }),{disabled:draft.layers.length>=MAX_LAYERS}));
    const current=draft.layers.find(l=>l.id===selected);if(current)parametersUI(current);
    if(editDesign) {
      const d=editDesign;
      for(const [k,label,max] of [['name','Nombre del diseño',80],['category','Categoría',50],['description','Descripción',350]]){
        const input=textField(d[k],max,k==='description');input.oninput=()=>{d[k]=input.value;dirty=true;};panel.append(field(label,input));
      }
      actions.append(button('Guardar diseño',()=>saveDesign()),button('Volver',()=>{if(canLeave())finishDesign();}));
    }else{
      actions.append(button('Guardar cambios',()=>{
        if(!dirty&&sourceLink){status.textContent='El artículo ya usa este diseño vinculado.';return;}
        if(sourceLink&&!confirm('¿Guardar una copia independiente para este artículo y desvincularlo?'))return;
        update({action:'item',id,config:draft},loadProduct);
      }),button('Guardar en biblioteca',()=>startDesign(null,draft)),
      button('Restaurar configuración',()=>{
        if(confirm('¿Restaurar la apariencia original de este artículo y quitar sus FX?'))update({action:'restore',id},loadProduct);
      }));
    }
    actions.firstChild?.classList.add('fx-primary');
  }
  function parametersUI(l) {
    const box=el('fieldset');box.append(el('legend','Parámetros de la capa'));
    box.append(group('fx-tools',choice(Object.entries(types),l.type,v=>editLayer(()=>l.type=v),'Tipo de efecto'),
      choice([['back','Trasera'],['front','Delantera']],l.plane,v=>editLayer(()=>l.plane=v),'Plano de la capa')));
    for(const [key,label] of [['color','Color principal'],['secondary','Color secundario']]){
      const palette=el('input'),hex=textField(l[key],7);palette.type='color';palette.value=l[key];hex.type='text';
      palette.setAttribute('aria-label',label);hex.setAttribute('aria-label',label+' hexadecimal');
      palette.oninput=()=>{hex.value=l[key]=palette.value;touch();};
      hex.oninput=()=>{if(/^#[0-9a-f]{6}$/i.test(hex.value)){palette.value=l[key]=hex.value;hex.setCustomValidity('');touch();}
        else hex.setCustomValidity('Usa seis dígitos hexadecimales.');};
      hex.onchange=()=>{if(!hex.checkValidity()){hex.value=l[key];hex.setCustomValidity('');}};
      box.append(el('span',label),group('fx-colors',palette,hex));
    }
    const grid=group('fx-sliders');
    for(const [key,[label,min,max]] of Object.entries(sliders)){
      const input=el('input');input.type='range';input.min=min;input.max=max;input.value=l[key];input.dataset.param=key;
      input.setAttribute('aria-label',label);
      const out=el('output',String(l[key]));input.oninput=()=>{out.value=input.value;l[key]=Number(input.value);touch();};
      const wrap=field(label,input);wrap.append(out);grid.append(wrap);
    }
    box.append(grid,button('Restablecer capa',()=>editLayer(()=>Object.assign(l,layer(l.type,l.plane,l.id)))));
    panel.append(box);
  }
  function drag(e){
    const l=draft.layers.find(l=>l.id===selected);if(!l||tab!=='layers')return;
    const r=stage.getBoundingClientRect();
    for(const [k,v] of [['x',(e.clientX-r.left)/r.width],['y',(e.clientY-r.top)/r.height]]){
      l[k]=Math.round(Math.max(0,Math.min(1,v))*100);
      const input=panel.querySelector('[data-param='+k+']');if(input){input.value=l[k];input.nextSibling.value=l[k];}
    }
    touch();
  }
  stage.onpointerdown=e=>{if(tab==='layers'&&selected){stage.setPointerCapture(e.pointerId);drag(e);}};
  stage.onpointermove=e=>{if(stage.hasPointerCapture(e.pointerId))drag(e);};
  function startDesign(original,config,duplicate=false){
    productDraft={draft,selected,dirty,sourceLink};
    editDesign={id:original&&!duplicate?original.id:crypto.randomUUID(),name:original?(duplicate?original.name+' · copia':original.name):'',
      category:original?.category||'Personalizados',description:original?.description||''};
    draft=clone(config);dirty=false;sourceLink=null;selected=draft.layers[0]?.id;switchTo('layers');
  }
  function finishDesign(){
    ({draft,selected,dirty,sourceLink}=productDraft);editDesign=null;productDraft=null;switchTo('library');
  }
  function saveDesign(){
    const linked=references(state,editDesign.id).length;
    if(linked&&!confirm('¿Actualizar este diseño en '+linked+' artículo(s) vinculado(s)?'))return;
    update({action:'design',...editDesign,config:draft,confirmLinked:linked},()=>{
      picked=editDesign.id;finishDesign();
      if(sourceLink===picked&&!dirty)loadProduct();
    });
  }
  function applyDesign(d,link) {
    if(!id || (dirty&&!confirm('¿Reemplazar los cambios FX de este artículo?')))return;
    if(!confirm('¿Aplicar '+d.name+' a '+name+(link?' como diseño vinculado?':' como copia independiente?')))return;
    update(link?{action:'item',id,link:d.id}:{action:'item',id,config:d.config},()=>{loadProduct();tab='layers';});
  }
  function libraryUI(){
    const all=[...presets,...Object.values(state.designs)];
    const groups=Object.values(state.collections);
    const find=textField(search,80);find.type='search';find.placeholder='Buscar por nombre';find.setAttribute('aria-label','Buscar por nombre');
    const cats=[...new Set(all.map(d=>d.category))];
    const filterMenu=choice([['','Todos los efectos'],...cats.map(k=>['c:'+k,k]),...Object.entries(types).map(([k,v])=>['t:'+k,v])],
      filter,v=>{filter=v;cards();},'Categoría o tipo');
    const fav=choice([['','Todas las colecciones'],...groups.map(g=>[g.id,g.name])],collection,v=>{collection=v;picked=null;render();},'Colección de favoritos');
    panel.append(group('fx-tools',find,filterMenu,fav));
    panel.append(group('fx-tools',button('Crear diseño',()=>startDesign(null,neutral())),
      button('Nueva colección',()=>{const n=prompt('Nombre de la colección de favoritos');if(n?.trim()){
        const key=crypto.randomUUID();update({action:'collection',id:key,name:n,ids:[]},()=>collection=key);
      }})));
    if(collection)panel.append(button('Eliminar colección',()=>{if(confirm('¿Eliminar esta colección de favoritos? Los diseños se conservarán.'))
      update({action:'deleteCollection',id:collection},()=>{collection='';});}));
    const grid=group('fx-library'),detail=el('div');panel.append(grid,detail);
    function cards() {
      clearThumbs();grid.replaceChildren();detail.replaceChildren();
      for(const d of all){
        if(!d.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())||(collection&&!state.collections[collection]?.ids.includes(d.id)))continue;
        if(filter.startsWith('c:')&&filter.slice(2)!==d.category)continue;
        if(filter.startsWith('t:')&&!d.config.layers.some(l=>l.type===filter.slice(2)))continue;
        const card=group('fx-card'),thumb=group('fx-thumb');
        const choose=button(d.name,()=>{picked=d.id;cards();});
        choose.setAttribute('aria-pressed',String(picked===d.id));
        card.append(thumb,choose,el('small',(state.designs[d.id]?'Personalizado':'Predeterminado')+' · '+d.category));grid.append(card);
        mount(thumb,d.config,1);thumbs.add(thumb);
        if(picked===d.id)details(d);
      }
      if(!grid.children.length)grid.append(el('p','Sin diseños para esta selección.'));
    }
    function details(d){
      detail.append(el('h3',d.name),el('p',d.description));
      const buttons=group('fx-tools');detail.append(buttons);
      if(id)buttons.append(button('Aplicar una copia',()=>applyDesign(d,false)),button('Aplicar vinculado',()=>applyDesign(d,true)));
      buttons.append(button('Duplicar diseño',()=>startDesign(d,d.config,true)));
      if(state.designs[d.id])buttons.append(button('Editar diseño',()=>startDesign(d,d.config)),button('Eliminar diseño',()=>{
        const linked=references(state,d.id).length;
        if(confirm('¿Eliminar '+d.name+'? Los '+linked+' artículos vinculados conservarán una copia.'))
          update({action:'deleteDesign',id:d.id,confirmLinked:linked,confirmDelete:true},()=>{picked=null;if(sourceLink===d.id)loadProduct();});
      }));
      for(const c of groups){
        const included=c.ids.includes(d.id);
        buttons.append(button((included?'Quitar de ':'Añadir a ')+c.name,()=>update({action:'collection',id:c.id,name:c.name,ids:included?c.ids.filter(k=>k!==d.id):[...c.ids,d.id]})));
      }
    }
    find.oninput=()=>{search=find.value;cards();};cards();
  }
  try {
    const data=await store.load();if(!dialog.isConnected)return;
    state=data.state;revision=data.revision;if(id)loadProduct();render();status.textContent='';
  } catch {status.textContent='No se pudo abrir la biblioteca FX. Comprueba el acceso al entorno de edición.';}
}
