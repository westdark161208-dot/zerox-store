// Position and stacking order are independent: array order is back-to-front within each plane.
export const VERSION = 1;
export const MAX_LAYERS = 4;
export const types = {
  smoke:'Humo neón', fire:'Llamas de fuego', cloud:'Nubes', storm:'Nubes con rayos',
  aura:'Aura energética', sparks:'Chispas', frost:'Hielo y escarcha', galaxy:'Galaxia',
  glow:'Resplandor pulsante', hologram:'Holograma', waves:'Ondas de energía', meteors:'Meteoritos'
};
export const sliders = {
  opacity:['Opacidad',0,100,65], intensity:['Intensidad',0,100,65], brightness:['Brillo',0,100,55],
  speed:['Velocidad',0,200,70], size:['Tamaño',20,200,100], density:['Densidad',1,100,60],
  direction:['Dirección (°)',0,360,0], blur:['Desenfoque',0,20,0], spread:['Expansión',20,160,85],
  x:['Posición horizontal',0,100,50], y:['Posición vertical',0,100,50]
};
export const neutral = () => ({version:VERSION, enabled:false, back:true, front:true, layers:[]});
const parameters = Object.fromEntries(Object.entries(sliders).map(([k,v]) => [k,v[3]]));
export function layer(type='smoke', plane='back', id=crypto.randomUUID()) {
  return {id,type,plane,enabled:true,color:'#ba55ff',secondary:'#ffd9ff',...parameters};
}
function preset(id,name,category,description,recipes) {
  const layers=recipes.map(([type,plane,overrides],i)=>({...layer(type,plane,'layer-'+i),...overrides}));
  return {id,name,category,description,config:{...neutral(),enabled:true,layers}};
}
export const presets = [
  preset('violet','Humo Zero’X Violeta','Atmósfera','Humo violeta con nubes suaves, chispas doradas y destellos al frente.',[
    ['smoke','back',{size:110}],['cloud','front',{opacity:30,y:67,secondary:'#ddd1ff'}],
    ['sparks','back',{color:'#ffc053',secondary:'#fff8cc',density:35}],['glow','front',{opacity:20,density:12,speed:40}]]),
  preset('inferno','Fuego Infernal','Fuego','Lenguas de fuego y brasas.',[['fire','back',{color:'#ff3919',secondary:'#ffbb49'}],['sparks','front',{color:'#ff922d',opacity:52}]]),
  preset('cosmos','Diamantes Galácticos','Espacio','Una espiral de polvo estelar.',[['galaxy','back',{color:'#805dff',secondary:'#4cdaff'}],['meteors','front',{density:30,opacity:45}]]),
  preset('storm','Tormenta Eléctrica','Energía','Nubes de tormenta y filamentos azules.',[['storm','back',{color:'#49547d',secondary:'#72dfff'}]]),
  preset('gold','Aura Dorada Premium','Energía','Anillos de luz y un halo dorado.',[['aura','back',{color:'#ffae32',secondary:'#fff8ac'}],['waves','front',{color:'#ffd567',opacity:30}]]),
  preset('ice','Niebla Congelada','Atmósfera','Escarcha azul con niebla fría.',[['frost','front',{color:'#92edff',secondary:'#e8ffff'}],['cloud','back',{color:'#8bb8df',secondary:'#dffaff'}]])
];
export const blank = () => ({version:1,items:{},designs:{},collections:{}});
const error = message => {throw new Error(message);};
const idOK = s => typeof s==='string' && /^[a-zA-Z0-9][\w:.-]{0,149}$/.test(s) && !(s in Object.prototype);
const hex = s => typeof s==='string' && /^#[a-f\d]{6}$/i.test(s);
function identifier(s) { if (!idOK(s)) error('INVALID_ID'); return s; }
function title(s,max,empty=false) {
  if(typeof s!=='string'||s.length>max||(!empty&&!s.trim())) error('INVALID_TEXT');
  return s.trim();
}
export function configOf(c) {
  if(c?.version!==VERSION || !Array.isArray(c.layers) || c.layers.length>MAX_LAYERS ||
    ['enabled','back','front'].some(k=>typeof c[k]!=='boolean')) error('INVALID_CONFIG');
  const ids=new Set();
  const layers=c.layers.map(l=>{
    if(!l || !idOK(l.id)||ids.has(l.id)||!Object.hasOwn(types,l.type)||!['front','back'].includes(l.plane)||
      typeof l.enabled!=='boolean'||!hex(l.color)||!hex(l.secondary)) error('INVALID_LAYER');
    ids.add(l.id);
    const result={id:l.id,type:l.type,plane:l.plane,enabled:l.enabled,color:l.color,secondary:l.secondary};
    for(const [k,[,min,max]] of Object.entries(sliders)) {
      if(!Number.isInteger(l[k])||l[k]<min||l[k]>max) error('INVALID_PARAMETER');
      result[k]=l[k];
    }
    return result;
  });
  return {version:1, enabled:c.enabled, back:c.back, front:c.front,layers};
}
export function designOf(s,id) {return s.designs[id] || presets.find(p=>p.id===id);}
export function resolved(s,id) {
  const record=s.items[id];
  return record?.link ? designOf(s,record.link)?.config : record?.config;
}
export function references(s,id) {return Object.keys(s.items).filter(k=>s.items[k].link===id);}
export function publicView(s) {
  const items={}, designs={};
  for(const [id,record] of Object.entries(s.items)) {
    const c=resolved(s,id);
    if(!c?.enabled||!c.layers.some(l=>l.enabled&&c[l.plane])) continue;
    if(record.link) {items[id]={link:record.link};designs[record.link]={config:c};}
    else items[id]=record;
  }
  return {version:1,items,designs};
}
// Each command targets one item, one design, or one favorites collection.
export function change(state,cmd) {
  if(state.version!==VERSION) error('UNSUPPORTED_VERSION');
  const s=structuredClone(state);
  const id=identifier(cmd.id);
  switch(cmd.action) {
    case 'item':
      if(cmd.link) {
        if(!designOf(s,identifier(cmd.link))) error('MISSING_DESIGN');
        s.items[id]={link:cmd.link};
      } else s.items[id]={config:configOf(cmd.config)};
      break;
    case 'restore': delete s.items[id]; break;
    case 'design':
    case 'deleteDesign': {
      if(presets.some(p=>p.id===id)) error('BUILTIN');
      const linked=references(s,id);
      if(linked.length && cmd.confirmLinked!==linked.length) error('CONFIRM_LINKED');
      if(cmd.action==='deleteDesign') {
        if(!s.designs[id] || cmd.confirmDelete!==true) error('CONFIRM_DELETE');
        for(const product of linked) s.items[product]={config:s.designs[id].config};
        for(const c of Object.values(s.collections)) c.ids=c.ids.filter(k=>k!==id);
        delete s.designs[id];
      } else s.designs[id]={id,name:title(cmd.name,80),category:title(cmd.category,50),description:title(cmd.description,350,true),config:configOf(cmd.config)};
      break;
    }
    case 'collection':
      if(!Array.isArray(cmd.ids)||cmd.ids.length>250||cmd.ids.some(k=>!idOK(k)||!designOf(s,k))) error('INVALID_COLLECTION');
      s.collections[id]={id,name:title(cmd.name,80),ids:[...new Set(cmd.ids)]};
      break;
    case 'deleteCollection': delete s.collections[id]; break;
    default: error('UNKNOWN_ACTION');
  }
  return s;
}
