(() => {
  const {colors,ranges,resolve}=ZXCardSettings;
  const palettes=['#ab84ff','#ffc951','#48e883','#ef4159','#47d8ff'];
  function section(form) {
    const panel=document.createElement('fieldset');
    panel.hidden=true;panel.className='dc-settings';
    form.querySelector('[data-fx-item]').after(panel);
    const groups=[
      ['Personaje',['scale','x','y']],
      ['Recuadro y dimensiones',['width','height','padding','main','border','neon','background','shadow','glow']],
      ['Tipografía',['metal','light','shine','font']],
      ['Insignia',['badgeOn','badgeText','badgeColor','badgeBorder','badgeGlow']],
      ['Botones',['buy','plus']]
    ];
    function control(key) {
      if(key==='badgeOn')return '<label><input type="checkbox" data-setting="badgeOn"> Mostrar insignia</label>';
      if(key==='badgeText')return '<label>Texto de insignia<input maxlength="32" data-setting="badgeText"></label>';
      if(Object.hasOwn(ranges,key)){
        const [label,min,max]=ranges[key];
        return `<label>${label}<input type="number" inputmode="numeric" step="1" min="${min}" max="${max}" data-setting="${key}"></label>`;
      }
      return `<label>${colors[key]}<span class="dc-color"><input type="color" aria-label="Selector de ${colors[key]}" data-picker="${key}" list="dc-palette"><input data-setting="${key}" aria-label="${colors[key]} HEX" pattern="#[0-9A-Fa-f]{6}" maxlength="7"></span></label>`;
    }
    panel.innerHTML=`<legend>Personalización visual del paquete</legend>
      <div class="dc-preview-tools"><label>Vista previa<select data-size><option value="mobile">Móvil</option><option value="desktop">Escritorio</option></select></label>
      <label>Insignia en la vista previa<select data-badge><option value="saved">Según el ajuste</option><option value="on">Con insignia</option><option value="off">Sin insignia</option></select></label></div>
      <div class="dc-preview" inert></div><datalist id="dc-palette">${palettes.map(p=>'<option value="'+p+'">').join('')}</datalist>
      ${groups.map(([name,keys])=>'<details'+(name.startsWith('Recuadro')?' open':'')+'><summary>'+name+'</summary><div class="dc-options">'+keys.map(control).join('')+'</div></details>').join('')}
      <button type="button" data-reset>Restablecer ajustes visuales</button>`;
    let product=null, overrides={};
    const preview=panel.querySelector('.dc-preview');
    const elems=Array.from(panel.querySelectorAll('[data-setting]'));
    function update(except) {
      if (!product) return;
      const settings=resolve(overrides,ZXDiamondCard.artwork(product).accent);
      for(const el of elems){
        const k=el.dataset.setting;
        if(el!==except){if(k==='badgeOn')el.checked=settings[k];else el.value=settings[k];}
        if(Object.hasOwn(colors,k))panel.querySelector('[data-picker="'+k+'"]').value=settings[k];
      }
      const badge=panel.querySelector('[data-badge]').value;
      const cardVisual={...overrides,...(badge==='saved'?{}:{badgeOn:badge==='on'})};
      const f=form.elements;
      const p={...product,name:f.name.value||product.name,price:f.price.valueAsNumber>=0?f.price.valueAsNumber:product.price};
      preview.dataset.size=panel.querySelector('[data-size]').value;
      preview.innerHTML=ZXDiamondCard.renderCard(p,{cardVisual,character:f.character.value,image:f.image.value},true);
    }
    panel.oninput=event=>{
      const el=event.target,k=el.dataset.setting||el.dataset.picker;
      if(k){
        const v=el.type==='checkbox'?el.checked:el.type==='number'?el.valueAsNumber:el.value;
        if(!ZXCardSettings.valid({[k]:v})){
          el.setCustomValidity('Introduce un valor dentro del intervalo indicado.');return;
        }
        el.setCustomValidity('');overrides[k]=v;
      }
      update(el);
    };
    panel.querySelector('[data-reset]').onclick=()=>{overrides={};elems.forEach(el=>el.setCustomValidity(''));update();};
    for(const key of ['name','price','character','image'])form.elements[key].addEventListener('input',()=>update());
    return {
      open(p,saved){
        product=ZXDiamondCard.supports(p)?p:null;overrides={...saved};
        panel.hidden=panel.disabled=!product;elems.forEach(el=>el.setCustomValidity(''));
        panel.querySelector('[data-badge]').value='saved';update();
      },
      refresh:()=>update(),
      data:()=>product?{cardVisual:{...overrides}}:{}
    };
  }
  globalThis.ZXDiamondCardEditor={section};
})();
