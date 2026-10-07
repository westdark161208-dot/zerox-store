/* Visual metadata only. Product IDs, quantities, prices and orders live elsewhere. */
(() => {
  const universes={rz:'RE:ZERO',bl:'BLUE LOCK',cm:'CHAINSAW MAN',dd:'DANDADAN',jjk:'JUJUTSU KAISEN',aot:'ATTACK ON TITAN',sl:'SOLO LEVELING',op:'ONE PIECE',spy:'SPY × FAMILY',agk:'AKAME GA KILL!',zx:'ZERO’X STORE'};
  const ranks=['','ESENCIAL','PREMIUM','ÉPICA','MÍTICA','LEGENDARIA','SUPREME'];
  const tierFor=amount=>ZXDiamondCatalog.find(p=>p.diamonds===amount)?.tier||1;
  const entries=ZXDiamondCatalog.map(p=>Object.freeze({amount:p.diamonds,character:p.character,universe:p.universe,accent:p.accent||'104,168,255',tier:p.tier,image:p.image,imageSmall:p.image.replace('.webp','-320.webp'),ready:p.imageReady,edition:p.diamonds===50446||p.diamonds===100892}));
  const byAmount = new Map(entries.map(item => [item.amount,item]));
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function forProduct(product) {
    if (!product || product.category !== 'Diamantes ilimitados') return null;
    // Match the exact amount, never a substring or the nearest package.
    const amount = Number(product.diamonds || (/^zx-diamonds-(\d+)$/.exec(product.id || '') || [])[1] || (product.name.match(/^[\d,]+/) || [''])[0].replaceAll(',',''));
    if (!Number.isSafeInteger(amount) || amount < 1) return null;
    const original=byAmount.get(amount);
    if(original&&product.collectionOverride){const o=product.collectionOverride;return {...original,character:o.character,image:o.image,imageSmall:o.image,ready:true};}
    return original || {amount,character:'Colección Zero’X',universe:'zx',accent:'125,150,255',tier:tierFor(amount),ready:false,edition:false};
  }
  function attributes(product) {
    const visual = forProduct(product);
    return visual ? `data-zx-collection="${visual.tier}" data-zx-universe="${visual.universe}" style="--zx-neon:${visual.accent}"` : '';
  }
  function art(product) {
    const visual = forProduct(product);
    if (!visual) return '';
    const {amount,character,universe,tier,edition} = visual;
    const image = visual.ready ? `<img class="zx-collection-portrait" src="${visual.image}" srcset="${visual.imageSmall} 320w, ${visual.image} 640w" sizes="(max-width:600px) 46vw, 280px" width="640" height="800" loading="lazy" decoding="async" alt="${escape(character)}" data-zx-portrait>` : '';
    return `<div class="zx-collection-art${edition?' zx-collection-edition':''}">
      <span class="zx-collection-aura" aria-hidden="true"></span>
      <div class="zx-collection-window" aria-hidden="true"></div>
      <div class="zx-collection-placeholder" ${visual.ready?'hidden':''} aria-hidden="true"><img src="assets/diamonds/zerox-crystal.svg" width="180" height="220" loading="lazy" alt=""><span>ZERO’X</span></div>
      ${image}
      <span class="zx-collection-particles" aria-hidden="true"></span>
      <div class="zx-collection-top"><span>ZX / ${String(tier).padStart(2,'0')}</span><span>${ranks[tier]}</span></div>
      <div class="zx-collection-amount" aria-hidden="true"><img class="zx-collection-gem" src="assets/diamonds/zerox-crystal.svg" width="48" height="48" alt=""> <span class="zx-collection-value">${amount.toLocaleString('en-US')}</span><small>DIAMANTES</small></div>
      ${edition?`<span class="zx-collection-signature">${amount===100892?'ZERO’X SUPREME EDITION':'ZERO’X EDITION'}</span>`:''}
    </div><div class="zx-collection-caption"><small>${universes[universe]}</small><span>${escape(character)}</span></div>`;
  }
  // Capture native image errors. A missing replacement can never hide quantity or checkout.
  document.addEventListener('error', event => {
    const image = event.target;
    if (!image?.matches?.('[data-zx-portrait]')) return;
    image.hidden = true;
    const fallback = image.parentElement.querySelector('.zx-collection-placeholder');
    if (fallback) fallback.hidden = false;
  }, true);
  globalThis.ZXCollection = Object.freeze({entries,forProduct,attributes,art,tierFor});
})();
