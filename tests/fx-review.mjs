import {blank,presets,change} from './fx-studio/model.mjs';
import {openStudio} from './fx-studio/editor.mjs';
import {useState} from './fx-studio/storefront.mjs';
const key='zx-fx-studio-review-v1';
function load(){
  const stored=localStorage.getItem(key);if(stored)return JSON.parse(stored);
  const state=blank();state.items['zx-diamonds-110']={config:structuredClone(presets[0].config)};
  return {revision:'0',state};
}
const store={load,async save(revision,command){
  const current=load();if(current.revision!==revision)throw Error('CONFLICT');
  const next={revision:crypto.randomUUID(),state:change(current.state,command)};
  localStorage.setItem(key,JSON.stringify(next));return {revision:next.revision};
}};
for(const [id,name,image] of [
  ['zx-diamonds-110','110 diamantes · Ilimitados','assets/diamonds/collection-v2/110.webp'],
  ['d110-1','110 diamantes · Primera vez','file_00000000561081f592ab7a6e14562570.png'],
  ['zx-diamonds-341','341 diamantes · Ilimitados','assets/diamonds/collection-v2/341.webp']
]){
  const c=document.createElement('article');c.dataset.product=id;
  c.innerHTML='<div class="art"><img></div><h2></h2><button>Efectos visuales FX</button>';
  c.querySelector('img').src=image;c.querySelector('img').alt=name;c.querySelector('h2').textContent=name;
  c.querySelector('button').onclick=()=>openStudio({id,name,image,store});
  document.getElementById('products').append(c);
}
useState(load().state);
