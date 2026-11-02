export function categoryName(value){
 const normalized=String(value||'').trim().toLocaleLowerCase('es');
 return ['diamantes','diamantes ilimitados'].includes(normalized)?'Diamantes Ilimitados':value;
}
const crops={
 'ff-cajas-8816':['0 36%','180%'],
 'ff-runas-4815':['100% 36%','210%'],
 'ff-galaxia-5657':['0 78%','180%'],
 'ff-revolucion-7649':['100% 78%','180%']
};
export function productArtwork(p,imageURL,esc){
 const image=imageURL(p.image),crop=crops[p.id];
 const amount=/^([\d.,]+)\s+Diamantes$/i.exec(p.name||'');
 const art=image?`<img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy">`:crop?`<div class="rp-provider-art" role="img" aria-label="${esc(p.name)}" style="background-position:${crop[0]};background-size:${crop[1]} auto"></div>`:p.id==='ff-frag-17729'?'<img src="./assets/products/fragmento-universal-token-transparent.png" alt="Fragmentos universales" loading="lazy">':'<div class="rp-placeholder" aria-hidden="true">◇</div>';
 return `<div class="rp-product-art">${art}${amount?`<span class="rp-art-amount">${esc(amount[1])} ◇</span>`:''}</div>`;
}
