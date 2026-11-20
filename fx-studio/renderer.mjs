import {paint} from './effects.mjs';

const slots=new Map(), visible=new Set();
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const small=matchMedia('(max-width: 700px)');
let raf=0,last=0,elapsed=0,slow=0,adaptive=false;
const limited=()=>small.matches || (navigator.hardwareConcurrency||8)<=4 || (navigator.deviceMemory||8)<=4;
export const budget=()=>limited()||adaptive?{layers:8,side:240,hz:20,quality:.58}:{layers:20,side:400,hz:30,quality:1};
function wake() {if(!raf && !document.hidden && visible.size) raf=requestAnimationFrame(frame);}
function clear(s) {
  for(const c of s.planes.values()) {c.width=1;c.height=1;c.remove();}
  s.planes.clear();s.dirty=true;
}
const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const e of entries) {
    const s=slots.get(e.target);if(!s)continue;
    if(e.isIntersecting)visible.add(s);
    else {visible.delete(s);clear(s);}
  }
  wake();
}):null;
const resize=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{
  for(const e of entries) {const s=slots.get(e.target);if(s){s.width=e.contentRect.width;s.height=e.contentRect.height;s.dirty=true;}}
  wake();
}):null;
function frame(now) {
  raf=0;if(document.hidden||!visible.size)return;
  const b=budget(), reduced=motion.matches||!observer;
  if(last && now-last<1000/b.hz-1){wake();return;}
  elapsed+=last?Math.min(now-last,90)/1000:0;last=now;
  let remaining=b.layers, moving=false;
  const start=performance.now();
  for(const s of [...visible].sort((a,b)=>b.priority-a.priority)) {
    const live=s.config.layers.filter(l=>l.enabled&&s.config[l.plane]);
    const animate=!reduced && remaining>=live.length && live.some(l=>l.speed>0);
    if(animate){remaining-=live.length;moving=true;}
    if(!animate&&!s.dirty) continue;
    const factor=Math.min(b.side/Math.max(s.width,s.height,1),devicePixelRatio||1);
    const w=Math.max(1,Math.round(s.width*factor)),h=Math.max(1,Math.round(s.height*factor));
    for(const plane of ['back','front']) {
      const layers=live.filter(l=>l.plane===plane);
      let c=s.planes.get(plane);
      if(!layers.length){if(c){c.remove();s.planes.delete(plane);}continue;}
      if(!c){c=document.createElement('canvas');c.className='zx-fx-plane zx-fx-'+plane;c.setAttribute('aria-hidden','true');s.planes.set(plane,c);s.host.append(c);}
      if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
      const g=c.getContext('2d');
      if(!g)continue;
      g.clearRect(0,0,w,h);
      for(const l of layers)paint(g,l,animate?elapsed:1.6,w,h,b.quality);
    }
    s.dirty=false;
  }
  if(!adaptive && performance.now()-start>22 && ++slow>=4) {
    adaptive=true;for(const s of visible)s.dirty=true;
  }
  if(moving)wake();
}
function invalidate() {last=0;for(const s of visible)s.dirty=true;wake();}
motion.addEventListener('change',invalidate);small.addEventListener('change',invalidate);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else invalidate();
});
export function detach(host) {
  const s=slots.get(host);if(!s)return;
  observer?.unobserve(host);resize?.unobserve(host);visible.delete(s);slots.delete(host);clear(s);
  host.classList.remove('zx-fx-art');if(s.positioned)host.classList.remove('zx-fx-relative');
}
export function mount(host,config,priority=0) {
  if(!host)return;
  if(!config?.enabled||!config.layers.some(l=>l.enabled&&config[l.plane])){detach(host);return;}
  let s=slots.get(host);
  if(!s) {
    const positioned=getComputedStyle(host).position==='static';
    s={host,positioned,planes:new Map(),width:host.clientWidth,height:host.clientHeight};
    host.classList.add('zx-fx-art');if(positioned)host.classList.add('zx-fx-relative');
    slots.set(host,s);resize?.observe(host);
    if(observer)observer.observe(host);else visible.add(s);
  }
  Object.assign(s,{config,priority,dirty:true});wake();
}
