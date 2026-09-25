const API = "https://zerox-sixofire-api.westdark161208.workers.dev";
const $ = selector => document.querySelector(selector);
let token = null;
let products = [];
let selected = null;
const message = text => { $("#message").textContent = text; };

async function api(path, options = {}) {
  const response = await fetch(API + path, {
    ...options,
    headers: { ...(token ? { Authorization: "Bearer " + token } : {}), ...options.headers }
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || "SERVICE_UNAVAILABLE");
  return data;
}
function resetForm() {
  $("#product-form").reset();
  $("#product-form").elements.id.value = "";
  $("#form-title").textContent = "Agregar producto";
  selected = null;
}
function render() {
  const list = $("#product-list");
  list.replaceChildren();
  if (!products.length) {
    list.textContent = "Aún no hay productos en estas secciones.";
    return;
  }
  const labels = { accounts:"Cuentas", clans:"Venta de clanes", honor:"Honor de clanes" };
  for (const product of products) {
    const card = document.createElement("article");
    const media = product.imageUrl ? document.createElement("img") :
      product.videoUrl ? document.createElement("video") : document.createElement("div");
    if (product.imageUrl) { media.src = product.imageUrl; media.alt = product.name; }
    if (product.videoUrl && !product.imageUrl) { media.src = product.videoUrl; media.muted = true; }
    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = product.name;
    const info = document.createElement("p");
    info.textContent = `${labels[product.section]} · $${Number(product.price).toFixed(2)} MXN · ${product.active ? "Publicado" : "Borrador"}`;
    const desc = document.createElement("small");
    desc.textContent = product.description;
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Editar";
    edit.addEventListener("click", () => {
      selected = product;
      const f = $("#product-form").elements;
      for (const key of ["id","section","name","description","price"]) f[key].value = product[key] ?? "";
      f.active.checked = product.active;
      $("#form-title").textContent = "Editar producto";
      $("#product-form").scrollIntoView({ behavior:"smooth" });
    });
    content.append(title,info,desc,document.createElement("br"),edit);
    card.append(media,content);
    list.append(card);
  }
}
async function refresh() {
  products = (await api("/api/admin/catalog/products")).products;
  const status = await api("/api/admin/catalog/status");
  for(const file of ["image","video"])$("#product-form").elements[file].disabled = !status.mediaAvailable;
  $("#media-status").textContent=status.mediaAvailable ? "Fotos y videos disponibles." : "Fotos y videos pendientes: falta conectar el bucket R2. Ya puedes guardar nombres, precios y descripciones.";
  render();
  await refreshContent();
  await window.zxResellerAdminRefresh?.();
}
async function upload(file, maxSize) {
  if (file.size > maxSize) throw new Error("FILE_TOO_LARGE");
  const form = new FormData();
  form.append("file",file);
  return (await api("/api/admin/catalog/media",{method:"POST",body:form})).key;
}
$("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = event.target.querySelector("button");
  button.disabled = true;
  try {
    const f = new FormData(event.target);
    const login = await api("/api/auth/login",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({login:f.get("login"),password:f.get("password")})
    });
    token = login.session.token;
    const me = await api("/api/auth/me");
    if (me.user.isFounder !== true) throw new Error("NO_ADMIN_ACCESS");
    await refresh();
    $("#login-form").hidden = true;
    $("#workspace").hidden = false;
    $("#logout").hidden = false;
    event.target.reset();
    message("Catálogo listo. Los productos nuevos comienzan como borrador.");
  } catch (error) {
    token = null;
    message("No se pudo entrar: " + error.message);
  } finally { button.disabled = false; }
});
$("#product-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  try {
    const f = event.target.elements;
    const image = f.image.files[0], video = f.video.files[0];
    const imageKey = image ? await upload(image,8000000) : selected?.imageKey || null;
    const videoKey = video ? await upload(video,25000000) : selected?.videoKey || null;
    const product = {
      section:f.section.value,name:f.name.value,description:f.description.value,
      price:Number(f.price.value),imageKey,videoKey,active:f.active.checked
    };
    const id = f.id.value;
    await api("/api/admin/catalog/products" + (id ? "/" + encodeURIComponent(id) : ""),{
      method:id ? "PATCH" : "POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify(product)
    });
    await refresh();
    resetForm();
    message("Producto guardado.");
  } catch (error) {
    message("No se guardó: " + error.message);
  } finally { button.disabled = false; }
});
$("#reset-form").addEventListener("click",resetForm);
$("#logout").addEventListener("click", async () => {
  try { await api("/api/auth/logout",{method:"POST"}); } catch {}
  token = null;
  window.zxResellerAdminClear?.();
  products = [];
  $("#product-list").replaceChildren();
  $("#workspace").hidden = true;
  $("#login-form").hidden = false;
  $("#logout").hidden = true;
  resetForm();
  message("Sesión cerrada.");
});

// Reutiliza la sesión de Zero'X Store cuando el fundador abre el panel desde su perfil.
(async()=>{
  try{
    const saved=JSON.parse(localStorage.getItem("zerox-session")||"null");
    if(!saved?.token)return;
    token=saved.token;
    const me=await api("/api/auth/me");
    if(me.user.isFounder!==true){token=null;return;}
    await refresh();
    $("#login-form").hidden=true;$("#workspace").hidden=false;$("#logout").hidden=false;
    message("Panel creador listo. Los productos nuevos comienzan como borrador.");
  }catch{token=null;}
})();

let streamProducts=[],adProducts=[];
const contentMessage=text=>{$('#content-status').textContent=text};
const fieldsToObject=form=>Object.fromEntries(new FormData(form));
function fillContent(form,row){form.reset();form.dataset.expectedStock=row.stock??"";for(const [key,value] of Object.entries(row)){const input=form.elements.namedItem(key);if(!input||input.type==='file')continue;if(input.type==='checkbox')input.checked=!!value;else if(input.type==='datetime-local')input.value=value?new Date(new Date(value).getTime()-new Date(value).getTimezoneOffset()*60000).toISOString().slice(0,16):'';else input.value=value??''}form.scrollIntoView({behavior:'smooth'})}
async function refreshContent(){
 try{const [streams,ads]=await Promise.all([api('/api/admin/content/streaming'),api('/api/admin/content/ads')]);streamProducts=streams.products;adProducts=ads.ads;
 for(const [selector,rows,form,isAd] of [['#stream-list',streamProducts,$('#stream-form'),false],['#ad-list',adProducts,$('#ad-form'),true]]){
 const list=$(selector);list.replaceChildren();for(const row of rows){const article=document.createElement('article'),text=document.createElement('p'),edit=document.createElement('button');text.textContent=isAd?`${row.position} · ${row.title} · ${row.active?'Activado':'Oculto'}`:`${row.name} · ${row.kind} · ${row.duration} días · $${row.price} MXN · Stock: ${row.stock}${row.stock<=row.threshold?' · STOCK BAJO':''} · ${row.active?'Publicado':'Borrador'}`;edit.textContent='Editar';edit.type='button';edit.onclick=()=>fillContent(form,row);article.append(text,edit);list.append(article)}}
 const select=$('#stream-sale').elements.productId;select.replaceChildren();for(const p of streamProducts){const option=document.createElement('option');option.value=p.id;option.textContent=`${p.name} (${p.stock} disponibles)`;option.disabled=p.stock<1;select.append(option)}
 contentMessage('Inventario y anuncios sincronizados.');
 }catch(error){contentMessage('Inventario y anuncios no disponibles: '+error.message)}
}
for(const [selector,path] of [['#stream-form','streaming'],['#ad-form','ads']]){
 $(selector).addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,button=event.submitter;button.disabled=true;
 try{const b=fieldsToObject(form),previous=(path==='streaming'?streamProducts:adProducts).find(p=>p.id===b.id);const file=form.elements.image.files[0];b.imageKey=file?await upload(file,8000000):(previous?.imageKey||previous?.image_key||null);delete b.image;b.active=form.elements.active.checked;if(!b.id)delete b.id;
 if(path==='streaming'){for(const key of ['duration','price','stock','threshold'])b[key]=Number(b[key]);if(b.id)b.expectedStock=Number(form.dataset.expectedStock);for(const key of ['offerStarts','offerEnds'])b[key]=b[key]?new Date(b[key]).toISOString():null}else{b.position=Number(b.position);for(const key of ['starts','ends'])b[key]=b[key]?new Date(b[key]).toISOString():null}
 await api('/api/admin/content/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});form.reset();form.elements.id.value='';await refreshContent();contentMessage('Cambios guardados.');
 }catch(error){contentMessage('No se guardó: '+error.message)}finally{button.disabled=false}});
}
$('#stream-new').onclick=()=>{$('#stream-form').reset();$('#stream-form').elements.id.value=''};
$('#ad-new').onclick=()=>{$('#ad-form').reset();$('#ad-form').elements.id.value=''};
$('#stream-sale').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,button=event.submitter;button.disabled=true;try{const b=fieldsToObject(form);b.quantity=Number(b.quantity);b.paymentConfirmed=form.elements.paymentConfirmed.checked;await api('/api/admin/content/sale',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});form.reset();await refreshContent();contentMessage('Entrega registrada y stock descontado.')}catch(error){contentMessage('No se registró: '+error.message)}finally{button.disabled=false}};
