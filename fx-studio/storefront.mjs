import {resolved,configOf} from './model.mjs';
let renderer;
let rendererReady;

let state=null;
const mounted=new Map();
const grids=['products','zx-managed-grid'].map(id=>document.getElementById(id)).filter(Boolean);
function clean(card,art) {
  renderer?.detach(art);if(art.dataset.fxPlaceholder!==undefined)art.remove();mounted.delete(card);
}
export function syncCards() {
  for(const [card,art] of mounted)if(!card.isConnected||!card.contains(art))clean(card,art);
  if(!state || !renderer || (!mounted.size && !Object.keys(state.items).length))return;
  for(const grid of grids)for(const card of grid.querySelectorAll('article[data-product]')) {
    const id=card.dataset.product;
    const config=Object.hasOwn(state.items,id)?resolved(state,id):null;
    let art=mounted.get(card);
    if(!config?.enabled || !config.layers.some(l=>l.enabled&&config[l.plane])){if(art)clean(card,art);continue;}
    if(!art) {
      art=card.firstElementChild;
      if(!art || art.matches('.product-copy') || art.querySelector('button,a,input,select,textarea')) {
        art=document.createElement('div');art.dataset.fxPlaceholder='';art.className='zx-fx-placeholder';
        card.prepend(art);
      }
      mounted.set(card,art);
    }
    renderer.mount(art,config);
  }
}
export function useState(data) {
  if(data?.version!==1||!data.items||!data.designs)return;
  // Unknown or malformed future entries fall back to original artwork individually.
  const clean={version:1,items:{},designs:{}};
  for(const id of Object.keys(data.items)) {
    try {const config=configOf(resolved(data,id));clean.items[id]={config};}catch{}
  }
  state=clean;
  if(!renderer&&Object.keys(clean.items).length) {
    rendererReady ||= import('./renderer.mjs').then(module=>{renderer=module;syncCards();});
  } else syncCards();
}
for(const grid of grids)new MutationObserver(syncCards).observe(grid,{childList:true});
if(grids.length&&!document.documentElement.hasAttribute('data-fx-review'))fetch('/api/fx-studio').then(r=>r.ok?r.json():null).then(useState).catch(()=>{});
