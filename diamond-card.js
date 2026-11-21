// Original Primera Vez portraits keyed by SKU so renaming a package never changes its art.
(() => {
  const first={
    'd110-1':['Eren','#48e883','00561081f592ab7a6e14562570'],
    'd340-1':['Sukuna','#ef4159','004e4081f5b42e4462cb0ae3df'],
    'd572-1':['Nami','#ffa43d','00469c81f596dc0e8f49ca0040'],
    'd1166-1':['Zoro','#49e577','000f1482309faad42cecb306fe'],
    'd2398-1':['Gojo','#6f88ff','009bac81f5847f448fd3b24e3a'],
    'd6160-1':['Luffy','#fd6663','005b2081fd8514a17c052ac79f']
  };
  const collection=new Map(ZXDiamondCatalog.map(p=>[p.id,p]));
  function artwork(p) {
    const entry=collection.get(p.id);
    if(entry) {
      const accent=entry.accent.split(',').map(n=>Number(n).toString(16).padStart(2,'0')).join('');
      return {character:entry.character,accent:'#'+accent,image:entry.imageReady?entry.image:'',small:entry.imageReady?entry.image.replace('.webp','-320.webp'):''};
    }
    const row=first[p.id];
    return row?{character:row[0],accent:row[1],image:'file_000000'+row[2]+'.png'}:null;
  }
  function renderCard(p,override=p.collectionOverride||{},preview=false) {
    const art=artwork(p);
    const s=ZXCardSettings.resolve(override.cardVisual,art.accent);
    const name=override.character||art.character;
    const photo=override.image||art.image||'assets/diamonds/zerox-crystal.svg';
    const style=Object.entries(s).filter(([key])=>Object.hasOwn(ZXCardSettings.ranges,key)||Object.hasOwn(ZXCardSettings.colors,key))
      .map(([key,value])=>'--dc-'+key+':'+value).join(';');
    const id=esc(p.id);
    const label=p.diamonds?`<span class="dc-amount" aria-label="${p.diamonds} diamantes">${p.diamonds.toLocaleString('en-US')}<img src="assets/diamonds/blue-diamond.svg" alt=""></span>`:'';
    const badge=s.badgeOn?`<span class="dc-badge">${esc(s.badgeText)}</span>`:'';
    return `<article class="dc-card" ${preview?'':'data-product="'+id+'"'} data-kind="diamonds" style="${style}">
      <div class="dc-art"><img class="dc-portrait" src="${esc(photo)}" ${art.small && photo===art.image?'srcset="'+esc(art.small)+' 320w, '+esc(photo)+' 640w" sizes="(max-width:600px) 45vw, 280px"':''} alt="${esc(name)}" loading="lazy" decoding="async">${label}</div>
      ${p.diamonds?'':'<span class="dc-ident">'+esc(p.name)+'</span>'}
      <div class="dc-panel"><div class="dc-badge-slot">${badge}</div><h3 class="dc-name">${esc(name)}</h3><strong class="dc-price">${money(ZXRetailPricing.priceMXN(p.price))}</strong></div>
      <div class="dc-actions"><button type="button" ${preview?'disabled':'data-buy-now="'+id+'"'}>COMPRAR <span aria-hidden="true">→</span></button><button type="button" ${preview?'disabled':'data-add="'+id+'"'} aria-label="Agregar ${esc(p.name)} al carrito">＋</button></div>
    </article>`;
  }
  globalThis.ZXDiamondCard=Object.freeze({artwork,renderCard,supports:p=>!!p&&(collection.has(p.id)||Object.hasOwn(first,p.id))});
})();
