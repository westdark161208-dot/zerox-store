/* Visual metadata only. Product IDs, quantities, prices and orders live elsewhere. */
(() => {
  const rows = [
    [220,'Bachira Meguru','bl','211,240,72'],[680,'Chigiri Hyoma','bl','245,76,133'],
    [912,'Reo Mikage','bl','174,110,255'],[1506,'Nagi Seishiro','bl','168,219,234'],
    [1738,'Isagi Yoichi','bl','92,230,146'],[2398,'Megumi Fushiguro','jjk','125,104,255'],
    [2970,'Nobara Kugisaki','jjk','228,93,117'],[3564,'Maki Zenin','jjk','98,215,168'],
    [4796,'Mikasa Ackerman','aot','235,87,92'],[6160,'Levi Ackerman','aot','226,81,87'],
    [6732,'Barou Shoei','bl','242,67,78'],[7326,'Rin Itoshi','bl','64,216,192'],
    [8558,'Shidou Ryusei','bl','248,102,203'],[9724,'Sanji','op','247,187,78'],
    [10956,'Trafalgar Law','op','239,198,86'],[12320,'Roronoa Zoro','op','113,231,112'],
    [12892,'Toji Fushiguro','jjk','151,103,231'],[14058,'Yuta Okkotsu','jjk','102,152,255'],
    [14718,'Eren Yeager','aot','224,93,79'],[15884,'Reiner · Titán Acorazado','aot','209,166,115'],
    [17116,'Portgas D. Ace','op','255,123,52'],[18480,'Sabo','op','253,161,70'],
    [19052,'Kenjaku','jjk','168,91,215'],[20878,'Doflamingo','op','246,119,187'],
    [22044,'Mahito','jjk','105,154,233'],[23276,'Katakuri','op','219,88,124'],
    [24640,'Suguru Geto','jjk','175,112,233'],[25806,'Eren · Titán de Ataque','aot','240,85,62'],
    [27038,'Zoro · King of Hell','op','128,238,86'],[28204,'Sanji · Ifrit Jambe','op','87,171,255'],
    [30008,'Yuta + Rika','jjk','183,120,255'],[30800,'Gojo Satoru','jjk','104,168,255'],
    [31966,'Luffy Gear 4','op','247,103,82'],[33198,'Ryomen Sukuna','jjk','244,79,109'],
    [34936,'Eren · Titán Fundador','aot','233,99,83'],[36960,'Shanks','op','251,171,85'],
    [38126,'Gojo · Unlimited Void','jjk','117,141,255'],[39358,'Sukuna · Malevolent Shrine','jjk','248,74,108'],
    [40524,'Luffy Gear 5','op','223,207,255'],[43120,'Zoro · King of Hell avanzado','op','158,239,100'],
    [44286,'Gojo vs. Sukuna','jjk','179,128,255'],[45518,'Eren Fundador + Rumbling','aot','247,113,81'],
    [46684,'Shanks · Haki','op','245,174,91'],[49280,'Sukuna · Edición especial','jjk','252,94,122'],
    [50446,'Luffy Gear 5','op','235,214,255']
  ];
  const universes = {bl:'BLUE LOCK',jjk:'JUJUTSU KAISEN',aot:'ATTACK ON TITAN',op:'ONE PIECE',zx:'ZERO’X STORE'};
  const ranks = ['','ESENCIAL','PREMIUM','ÉPICA','MÍTICA','LEGENDARIA'];
  const ready = new Set([2398,6160,17116,30008,43120,50446]);
  const tierFor = amount => amount >= 43120 ? 5 : amount >= 30008 ? 4 : amount >= 15884 ? 3 : amount >= 6160 ? 2 : 1;
  const entries = rows.map(([amount,character,universe,accent]) => Object.freeze({
    amount,character,universe,accent,tier:tierFor(amount),
    image:`assets/diamonds/unlimited/${amount}.webp`,
    imageSmall:`assets/diamonds/unlimited/${amount}-320.webp`,
    ready:ready.has(amount),edition:amount===50446
  }));
  const byAmount = new Map(entries.map(item => [item.amount,item]));
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function forProduct(product) {
    if (!product || product.category !== 'Diamantes ilimitados') return null;
    // Match the exact amount, never a substring or the nearest package.
    const amount = Number((product.name.match(/^[\d,]+/) || [''])[0].replaceAll(',',''));
    if (!Number.isSafeInteger(amount) || amount < 1) return null;
    return byAmount.get(amount) || {amount,character:'Colección Zero’X',universe:'zx',accent:'125,150,255',tier:tierFor(amount),ready:false,edition:false};
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
      <div class="zx-collection-amount" aria-hidden="true"><span class="zx-collection-gem">◆</span> ${amount.toLocaleString('en-US')}<small>DIAMANTES</small></div>
      ${edition?'<span class="zx-collection-signature">ZERO’X EDITION</span>':''}
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
