const API="https://zerox-sixofire-api.westdark161208.workers.dev";
const $=selector=>document.querySelector(selector);
const handle=new URL(location.href).searchParams.get("u")||"";
const allowed=/^[A-Za-z0-9_.-]{3,24}$/;
const bannerColors=["violet","crimson","electric","custom"];
function showState(message){$("#public-state").textContent=message;$("#public-state").hidden=false;$("#public-card").hidden=true}
function safeImage(data){return /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data||"") && data.length<=160000 ? data : ""}
async function loadProfile(name){
  if(!allowed.test(name)){showState("Escribe un nombre de usuario válido.");return}
  $("#search-handle").value=name;showState("Buscando perfil...");
  try{
    const response=await fetch(`${API}/api/public-profile/${encodeURIComponent(name)}`);
    if(!response.ok)throw Error(response.status===404?"Este perfil no está disponible o es privado.":"No pudimos cargar el perfil. Inténtalo de nuevo.");
    const data=await response.json(),p=data.profile;
    if(!data.ok||!p)throw Error("No pudimos cargar el perfil.");
    document.title=`${p.displayName} · Zero’X Store`;
    $("#public-name").textContent=p.displayName||p.username;
    $("#public-handle").textContent="@"+p.username;
    $("#public-bio").textContent=p.bio||"Este miembro todavía no ha escrito su presentación.";
    $("#public-level").textContent=p.level||1;
    $("#public-xp").textContent=p.xp||0;
    const date=p.createdAt?new Date(p.createdAt.replace(" ","T")+(/[Z+-]/.test(p.createdAt.slice(-6))?"":"Z")):null;
    $("#public-since").textContent=date&&!isNaN(date)?new Intl.DateTimeFormat("es-MX",{month:"short",year:"numeric"}).format(date):"Miembro Zero’X";
    const banner=$("#public-cover");banner.className="cover banner-"+(bannerColors.includes(p.banner)?p.banner:"violet");
    banner.style.backgroundImage=p.banner==="custom"&&safeImage(p.bannerImage)?`linear-gradient(0deg,#090b16aa,#090b1622),url("${p.bannerImage}")`:"";
    const avatar=$("#public-avatar"),picture=safeImage(p.avatar);
    avatar.style.backgroundImage=picture?`url("${picture}")`:"";avatar.textContent=picture?"":(p.displayName||p.username).slice(0,2).toUpperCase();
    avatar.className="avatar frame-"+(["steel","chrome","cobalt","titan","aurora","prism","sovereign"].includes(p.frame)?p.frame:"steel");
    $("#public-founder").hidden=!p.isFounder;
    const favorites=Array.isArray(p.favorites)?p.favorites.filter(x=>typeof x==="string").slice(0,6):[];
    $("#public-favorites-panel").hidden=!favorites.length;
    $("#public-favorites").replaceChildren(...favorites.map(label=>{const span=document.createElement("span");span.textContent=label;return span}));
    $("#public-state").hidden=true;$("#public-card").hidden=false;
  }catch(error){showState(error.message)}
}
$("#search-profile").addEventListener("submit",event=>{event.preventDefault();const name=$("#search-handle").value.trim().replace(/^@/,"");history.replaceState(null,"",`?u=${encodeURIComponent(name)}`);loadProfile(name)});
if(handle)loadProfile(handle);
