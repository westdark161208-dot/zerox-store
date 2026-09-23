/* =========================================================
   ZERO'X STORE - APP.JS
   Versión compatible con GitHub Pages
   ========================================================= */

const PRODUCTS = [
  {
    id: "d110-1",
    category: "Diamantes 1 vez",
    name: "110 Diamantes",
    description: "Promoción de 1 vez por ID. Se revisa el ID antes de procesar.",
    price: 13,
    active: true,
    featured: false,
    requiresEligibility: true,
    badge: "1 VEZ POR ID"
  },
  {
    id: "d340-1",
    category: "Diamantes 1 vez",
    name: "340 Diamantes",
    description: "Promoción de 1 vez por ID. Se revisa el ID antes de procesar.",
    price: 40,
    active: true,
    featured: false,
    requiresEligibility: true,
    badge: "1 VEZ POR ID"
  },
  {
    id: "d572-1",
    category: "Diamantes 1 vez",
    name: "572 Diamantes",
    description: "Promoción de 1 vez por ID. Se revisa el ID antes de procesar.",
    price: 75,
    active: true,
    featured: true,
    requiresEligibility: true,
    badge: "MÁS VENDIDO"
  },
  {
    id: "d1166-1",
    category: "Diamantes 1 vez",
    name: "1,166 Diamantes",
    description: "Promoción de 1 vez por ID. Se revisa el ID antes de procesar.",
    price: 135,
    active: true,
    featured: false,
    requiresEligibility: true,
    badge: "1 VEZ POR ID"
  },
  {
    id: "d2398-1",
    category: "Diamantes 1 vez",
    name: "2,398 Diamantes",
    description: "Promoción de 1 vez por ID. Se revisa el ID antes de procesar.",
    price: 260,
    active: true,
    featured: false,
    requiresEligibility: true,
    badge: "1 VEZ POR ID"
  },
  {
    id: "d6160-1",
    category: "Diamantes 1 vez",
    name: "6,160 Diamantes",
    description: "Promoción de 1 vez por ID. Se revisa el ID antes de procesar.",
    price: 600,
    active: true,
    featured: false,
    requiresEligibility: true,
    badge: "1 VEZ POR ID"
  },

  {
    id: "d110-u",
    category: "Diamantes ilimitados",
    name: "110 Diamantes",
    description: "Cantidad ilimitada. Puedes comprarla varias veces para el mismo ID.",
    price: 17,
    active: true,
    featured: false,
    requiresEligibility: false,
    badge: "ILIMITADO"
  },
  {
    id: "d340-u",
    category: "Diamantes ilimitados",
    name: "340 Diamantes",
    description: "Cantidad ilimitada. Puedes comprarla varias veces para el mismo ID.",
    price: 56,
    active: true,
    featured: false,
    requiresEligibility: false,
    badge: "ILIMITADO"
  },
  {
    id: "d572-u",
    category: "Diamantes ilimitados",
    name: "572 Diamantes",
    description: "Cantidad ilimitada. Puedes comprarla varias veces para el mismo ID.",
    price: 87,
    active: true,
    featured: true,
    requiresEligibility: false,
    badge: "MÁS VENDIDO"
  },
  {
    id: "d1166-u",
    category: "Diamantes ilimitados",
    name: "1,166 Diamantes",
    description: "Cantidad ilimitada. Puedes comprarla varias veces para el mismo ID.",
    price: 170,
    active: true,
    featured: false,
    requiresEligibility: false,
    badge: "ILIMITADO"
  },
  {
    id: "d2398-u",
    category: "Diamantes ilimitados",
    name: "2,398 Diamantes",
    description: "Cantidad ilimitada. Puedes comprarla varias veces para el mismo ID.",
    price: 310,
    active: true,
    featured: false,
    requiresEligibility: false,
    badge: "ILIMITADO"
  },
  {
    id: "d6160-u",
    category: "Diamantes ilimitados",
    name: "6,160 Diamantes",
    description: "Cantidad ilimitada. Puedes comprarla varias veces para el mismo ID.",
    price: 720,
    active: true,
    featured: false,
    requiresEligibility: false,
    badge: "ILIMITADO"
  },

  {
    id: "booyah-demo",
    category: "Pases Booyah",
    name: "Pase Booyah",
    description: "Próximamente más opciones y promociones.",
    price: 0,
    active: true,
    featured: false,
    requiresEligibility: false,
    badge: "PRÓXIMAMENTE"
  },
  {
    id: "frag-demo",
    category: "Fragmentos",
    name: "Fragmentos",
    description: "Consigue tus fragmentos favoritos.",
    price: 0,
    active: true,
    featured: false,
    requiresEligibility: false,
    badge: "PRÓXIMAMENTE"
  },
  {
    id: "cajas-demo",
    category: "Cajas",
    name: "Cajas de fragmentos",
    description: "Variedad y stock próximamente.",
    price: 0,
    active: true,
    featured: false,
    requiresEligibility: false,
    badge: "PRÓXIMAMENTE"
  },
  {
  id: "likes-demo",
  category: "Likes",
  name: "Likes Free Fire",
  description: "Aumenta la popularidad de tu perfil.",
  price: 0,
  active: true,
  featured: false,
  requiresEligibility: false,
  badge: "PRÓXIMAMENTE"
},
   // =====================================================
// STREAMING
// =====================================================

// NETFLIX
{ id:"netflix-perfil", category:"Streaming", name:"Netflix - Perfil", description:"Perfil Netflix", price:70, active:true, featured:false, requiresEligibility:false, badge:"NETFLIX" },
{ id:"netflix-privado", category:"Streaming", name:"Netflix - Perfil Privado", description:"Perfil privado", price:75, active:true, featured:false, requiresEligibility:false, badge:"NETFLIX" },
{ id:"netflix-privado-renovable", category:"Streaming", name:"Netflix - Perfil Privado Renovable", description:"Perfil privado renovable", price:85, active:true, featured:false, requiresEligibility:false, badge:"RENOVABLE" },
{ id:"netflix-extra", category:"Streaming", name:"Netflix - Perfil Extra", description:"Perfil extra", price:90, active:true, featured:false, requiresEligibility:false, badge:"NETFLIX" },
{ id:"netflix-completa", category:"Streaming", name:"Netflix - Completa", description:"Cuenta completa", price:220, active:true, featured:false, requiresEligibility:false, badge:"COMPLETA" },

// DISNEY+
{ id:"disney-perfil", category:"Streaming", name:"Disney+ - Perfil", description:"Perfil Disney+", price:31, active:true, featured:false, requiresEligibility:false, badge:"DISNEY+" },
{ id:"disney-perfil-renovable", category:"Streaming", name:"Disney+ - Perfil Renovable", description:"Perfil renovable", price:35, active:true, featured:false, requiresEligibility:false, badge:"RENOVABLE" },
{ id:"disney-completa", category:"Streaming", name:"Disney+ - Completa", description:"Cuenta completa", price:85, active:true, featured:false, requiresEligibility:false, badge:"DISNEY+" },
{ id:"disney-completa-renovable", category:"Streaming", name:"Disney+ - Completa Renovable", description:"Cuenta completa renovable", price:95, active:true, featured:false, requiresEligibility:false, badge:"RENOVABLE" },

// HBO MAX
{ id:"max-perfil", category:"Streaming", name:"Max - Perfil", description:"Perfil HBO Max", price:29, active:true, featured:false, requiresEligibility:false, badge:"MAX" },
{ id:"max-perfil-renovable", category:"Streaming", name:"Max - Perfil Renovable", description:"Perfil renovable", price:34, active:true, featured:false, requiresEligibility:false, badge:"RENOVABLE" },
{ id:"max-platino", category:"Streaming", name:"Max - Completa Platino", description:"Cuenta completa Platino", price:68, active:true, featured:false, requiresEligibility:false, badge:"PLATINO" },
{ id:"max-completa-renovable", category:"Streaming", name:"Max - Completa Renovable", description:"Cuenta completa renovable", price:85, active:true, featured:false, requiresEligibility:false, badge:"RENOVABLE" },

// PRIME VIDEO
{ id:"prime-1m-perfil", category:"Streaming", name:"Prime Video - 1 Mes Perfil", description:"Perfil por 1 mes", price:27, active:true, featured:false, requiresEligibility:false, badge:"PRIME" },
{ id:"prime-1m-completa", category:"Streaming", name:"Prime Video - 1 Mes Completa", description:"Cuenta completa por 1 mes", price:60, active:true, featured:false, requiresEligibility:false, badge:"PRIME" },
{ id:"prime-6m-perfil", category:"Streaming", name:"Prime Video - 6 Meses Perfil", description:"Perfil por 6 meses", price:58, active:true, featured:false, requiresEligibility:false, badge:"6 MESES" },
{ id:"prime-6m-completa", category:"Streaming", name:"Prime Video - 6 Meses Completa", description:"Cuenta completa por 6 meses", price:110, active:true, featured:false, requiresEligibility:false, badge:"6 MESES" },

// VIX
{ id:"vix-1m-completa", category:"Streaming", name:"VIX - 1 Mes Completa", description:"Cuenta completa 1 mes", price:27, active:true, featured:false, requiresEligibility:false, badge:"VIX" },
{ id:"vix-1m-completa-renovable", category:"Streaming", name:"VIX - 1 Mes Completa Renovable", description:"Cuenta completa renovable", price:33, active:true, featured:false, requiresEligibility:false, badge:"RENOVABLE" },
{ id:"vix-2m-completa", category:"Streaming", name:"VIX - 2 Meses Completa", description:"Cuenta completa 2 meses", price:33, active:true, featured:false, requiresEligibility:false, badge:"2 MESES" },
{ id:"vix-anual-completa", category:"Streaming", name:"VIX - Anual Completa", description:"Cuenta completa anual", price:90, active:true, featured:false, requiresEligibility:false, badge:"ANUAL" },
{ id:"vix-perfil-1m", category:"Streaming", name:"VIX - Perfil 1 Mes", description:"Perfil por 1 mes", price:19, active:true, featured:false, requiresEligibility:false, badge:"VIX" },
{ id:"vix-perfil-1m-renovable", category:"Streaming", name:"VIX - Perfil 1 Mes Renovable", description:"Perfil renovable", price:22, active:true, featured:false, requiresEligibility:false, badge:"RENOVABLE" },
{ id:"vix-perfil-2m", category:"Streaming", name:"VIX - Perfil 2 Meses", description:"Perfil por 2 meses", price:21, active:true, featured:false, requiresEligibility:false, badge:"2 MESES" },
{ id:"vix-perfil-anual", category:"Streaming", name:"VIX - Perfil Anual", description:"Perfil anual", price:40, active:true, featured:false, requiresEligibility:false, badge:"ANUAL" },

// FOX ONE
{ id:"fox-perfil", category:"Streaming", name:"Fox One - Perfil", description:"Perfil Fox One", price:28, active:true, featured:false, requiresEligibility:false, badge:"FOX ONE" },
{ id:"fox-completa", category:"Streaming", name:"Fox One - Completa", description:"Cuenta completa", price:65, active:true, featured:false, requiresEligibility:false, badge:"COMPLETA" },

// CRUNCHYROLL
{ id:"crunchyroll-1m-completa", category:"Streaming", name:"Crunchyroll - 1 Mes Completa", description:"Cuenta completa 1 mes", price:60, active:true, featured:false, requiresEligibility:false, badge:"CRUNCHYROLL" },
{ id:"crunchyroll-anual-completa", category:"Streaming", name:"Crunchyroll - Anual Completa", description:"Cuenta completa anual", price:200, active:true, featured:false, requiresEligibility:false, badge:"ANUAL" },
{ id:"crunchyroll-perfil-1m", category:"Streaming", name:"Crunchyroll - Perfil 1 Mes", description:"Perfil por 1 mes", price:27, active:true, featured:false, requiresEligibility:false, badge:"CRUNCHYROLL" },
{ id:"crunchyroll-perfil-anual", category:"Streaming", name:"Crunchyroll - Perfil Anual", description:"Perfil anual", price:85, active:true, featured:false, requiresEligibility:false, badge:"ANUAL" },

// PARAMOUNT+
{ id:"paramount-completa", category:"Streaming", name:"Paramount+ - Mensual Completa", description:"Cuenta completa mensual", price:70, active:true, featured:false, requiresEligibility:false, badge:"PARAMOUNT+" },
{ id:"paramount-perfil", category:"Streaming", name:"Paramount+ - Perfil Mensual", description:"Perfil mensual", price:28, active:true, featured:false, requiresEligibility:false, badge:"PARAMOUNT+" },

// DAZN
{ id:"dazn-perfil", category:"Streaming", name:"DAZN - Perfil Mensual", description:"Perfil mensual", price:60, active:true, featured:false, requiresEligibility:false, badge:"DAZN" },
{ id:"dazn-completa", category:"Streaming", name:"DAZN - Completa Mensual", description:"Cuenta completa mensual", price:140, active:true, featured:false, requiresEligibility:false, badge:"DAZN" },

// MUBI
{ id:"mubi-completa", category:"Streaming", name:"MUBI - Completa", description:"Cuenta completa", price:35, active:true, featured:false, requiresEligibility:false, badge:"MUBI" },
{ id:"mubi-perfil", category:"Streaming", name:"MUBI - Perfil", description:"Perfil", price:23, active:true, featured:false, requiresEligibility:false, badge:"MUBI" },

// VIKI
{ id:"viki-completa", category:"Streaming", name:"VIKI - Completa", description:"Cuenta completa", price:50, active:true, featured:false, requiresEligibility:false, badge:"VIKI" },
{ id:"viki-perfil", category:"Streaming", name:"VIKI - Perfil", description:"Perfil", price:25, active:true, featured:false, requiresEligibility:false, badge:"VIKI" },

// CHATGPT
{ id:"chatgpt-go", category:"Streaming", name:"ChatGPT - Go Compartido", description:"Acceso compartido", price:75, active:true, featured:false, requiresEligibility:false, badge:"CHATGPT" },
{ id:"chatgpt-plus", category:"Streaming", name:"ChatGPT - Plus Compartido", description:"Acceso compartido", price:110, active:true, featured:false, requiresEligibility:false, badge:"PLUS" },

// CAPCUT
{ id:"capcut-perfil", category:"Streaming", name:"CapCut - Perfil", description:"Perfil", price:63, active:true, featured:false, requiresEligibility:false, badge:"CAPCUT" },
{ id:"capcut-completa", category:"Streaming", name:"CapCut - Completa", description:"Cuenta completa", price:110, active:true, featured:false, requiresEligibility:false, badge:"CAPCUT" },

// DUOLINGO
{ id:"duolingo-individual", category:"Streaming", name:"Duolingo - 1 Mes Individual", description:"Activación a tus datos", price:25, active:true, featured:false, requiresEligibility:false, badge:"1 MES" },

// YOUTUBE PREMIUM
{ id:"youtube-familiar", category:"Streaming", name:"YouTube Premium - Familiar", description:"Plan familiar", price:60, active:true, featured:false, requiresEligibility:false, badge:"YOUTUBE" },
{ id:"youtube-individual", category:"Streaming", name:"YouTube Premium - Individual", description:"Plan individual", price:35, active:true, featured:false, requiresEligibility:false, badge:"YOUTUBE" },
{ id:"youtube-invitacion", category:"Streaming", name:"YouTube Premium - Invitación", description:"Activación mediante invitación", price:28, active:true, featured:false, requiresEligibility:false, badge:"INVITACIÓN" },

// SPOTIFY
{ id:"spotify-familiar", category:"Streaming", name:"Spotify - Familiar", description:"Plan familiar", price:185, active:true, featured:false, requiresEligibility:false, badge:"SPOTIFY" },
{ id:"spotify-1m", category:"Streaming", name:"Spotify - Individual 1 Mes", description:"Individual / invitación", price:65, active:true, featured:false, requiresEligibility:false, badge:"1 MES" },
{ id:"spotify-3m", category:"Streaming", name:"Spotify - Individual 3 Meses", description:"Plan individual", price:105, active:true, featured:false, requiresEligibility:false, badge:"3 MESES" },
{ id:"spotify-6m", category:"Streaming", name:"Spotify - Individual 6 Meses", description:"Plan individual", price:140, active:true, featured:false, requiresEligibility:false, badge:"6 MESES" },
{ id:"spotify-anual", category:"Streaming", name:"Spotify - Individual Anual", description:"Plan individual anual", price:175, active:true, featured:false, requiresEligibility:false, badge:"ANUAL" },

// CANVA EDU
{ id:"canva-edu-1m", category:"Streaming", name:"Canva EDU - 1 Mes", description:"Canva EDU", price:21, active:true, featured:false, requiresEligibility:false, badge:"CANVA EDU" },
{ id:"canva-edu-2m", category:"Streaming", name:"Canva EDU - 2 Meses", description:"Canva EDU", price:25, active:true, featured:false, requiresEligibility:false, badge:"CANVA EDU" },
{ id:"canva-edu-3m", category:"Streaming", name:"Canva EDU - 3 Meses", description:"Canva EDU", price:29, active:true, featured:false, requiresEligibility:false, badge:"CANVA EDU" },
{ id:"canva-edu-6m", category:"Streaming", name:"Canva EDU - 6 Meses", description:"Canva EDU", price:33, active:true, featured:false, requiresEligibility:false, badge:"CANVA EDU" },
{ id:"canva-edu-anual", category:"Streaming", name:"Canva EDU - Anual", description:"Canva EDU", price:40, active:true, featured:false, requiresEligibility:false, badge:"ANUAL" },
{ id:"canva-edu-2anos", category:"Streaming", name:"Canva EDU - 2 Años", description:"Canva EDU", price:58, active:true, featured:false, requiresEligibility:false, badge:"2 AÑOS" },
{ id:"canva-edu-perma", category:"Streaming", name:"Canva EDU - Perma", description:"Acceso permanente", price:70, active:true, featured:false, requiresEligibility:false, badge:"PERMA" },

// CANVA PRO
{ id:"canva-pro-1m", category:"Streaming", name:"Canva Pro - 1 Mes", description:"Canva Pro por 1 mes", price:35, active:true, featured:false, requiresEligibility:false, badge:"CANVA PRO" },

// APPLE TV
{ id:"appletv-1m-perfil", category:"Streaming", name:"Apple TV - 1 Mes Perfil", description:"Perfil por 1 mes", price:38, active:true, featured:false, requiresEligibility:false, badge:"APPLE TV" },
{ id:"appletv-1m-completa", category:"Streaming", name:"Apple TV - 1 Mes Completa", description:"Cuenta completa 1 mes", price:80, active:true, featured:false, requiresEligibility:false, badge:"APPLE TV" },
{ id:"appletv-3m-perfil", category:"Streaming", name:"Apple TV - 3 Meses Perfil", description:"Perfil por 3 meses", price:60, active:true, featured:false, requiresEligibility:false, badge:"3 MESES" },
{ id:"appletv-3m-completa", category:"Streaming", name:"Apple TV - 3 Meses Completa", description:"Cuenta completa 3 meses", price:100, active:true, featured:false, requiresEligibility:false, badge:"3 MESES" },

// APPLE MUSIC
{ id:"applemusic-invitacion", category:"Streaming", name:"Apple Music - Invitación", description:"Acceso mediante invitación", price:68, active:true, featured:false, requiresEligibility:false, badge:"APPLE MUSIC" },

// GEMINI PRO
{ id:"gemini-pro-18m", category:"Streaming", name:"Gemini Pro - 18 Meses", description:"Activación mediante link", price:110, active:true, featured:false, requiresEligibility:false, badge:"18 MESES" },

// MICROSOFT OFFICE
{ id:"office-anual", category:"Streaming", name:"Microsoft Office - Anual", description:"Paquetería Office. Se solicita correo y contraseña.", price:290, active:true, featured:false, requiresEligibility:false, badge:"ANUAL" },

];

// =========================================================
// CONEXIÓN ZERO'X → CLOUDFLARE / SIXOFIRE
// SOLO DIAMANTES ILIMITADOS
// =========================================================

const ZEROX_API = "https://zerox-sixofire-api.westdark161208.workers.dev";

/* ZERO'X ADS · editable carousel
   Para cambiar anuncios edita SOLO este arreglo. */
const ZEROX_ADS = [
  { kicker:"OFERTA ZERO'X", title:"BONO DE FRAGMENTOS", text:"Promociones especiales: compra paquetes seleccionados y recibe beneficios extra cuando la oferta esté activa.", image:"./assets/categories/fragmentos.png.png", category:"Fragmentos" },
  { kicker:"PROMOCIÓN FREE FIRE", title:"RECARGA Y GANA MÁS", text:"Aquí publicaremos bonos, regalos y promociones temporales de Zero'X Store.", image:"./assets/categories/diamantes-ilimitados.png.png", category:"Diamantes ilimitados" },
  { kicker:"ZERO'X PREMIUM", title:"OFERTAS DE CUENTAS", text:"Nuevas cuentas y oportunidades destacadas aparecerán aquí.", image:"./assets/categories/cuentas.png.png", category:"Cuentas" },
  { kicker:"ENTRETENIMIENTO", title:"STREAMING EN OFERTA", text:"Promociones destacadas de tus plataformas favoritas.", image:"./assets/categories/streaming.png.png", category:"Streaming" }
];
let zeroxAdIndex=0, zeroxAdTimer=null;
function renderZeroXAd(index){
  if(!ZEROX_ADS.length) return;
  zeroxAdIndex=(index+ZEROX_ADS.length)%ZEROX_ADS.length;
  const ad=ZEROX_ADS[zeroxAdIndex], stage=document.querySelector(".ad-stage");
  if(!stage) return;
  stage.classList.add("is-changing");
  setTimeout(()=>{
    document.querySelector("#ad-image").src=ad.image;
    document.querySelector("#ad-image").alt=ad.title;
    document.querySelector("#ad-kicker").textContent=ad.kicker;
    document.querySelector("#ad-title").textContent=ad.title;
    document.querySelector("#ad-text").textContent=ad.text;
    document.querySelectorAll("#ad-dots button").forEach((b,i)=>b.classList.toggle("active",i===zeroxAdIndex));
    stage.classList.remove("is-changing");
  },150);
}
function startZeroXAds(){clearInterval(zeroxAdTimer);zeroxAdTimer=setInterval(()=>renderZeroXAd(zeroxAdIndex+1),6000)}
function initZeroXAds(){
  const dots=document.querySelector("#ad-dots"); if(!dots) return;
  dots.innerHTML=ZEROX_ADS.map((_,i)=>`<button type="button" aria-label="Anuncio ${i+1}"></button>`).join("");
  dots.querySelectorAll("button").forEach((b,i)=>b.addEventListener("click",()=>{renderZeroXAd(i);startZeroXAds()}));
  document.querySelector("#ad-prev")?.addEventListener("click",()=>{renderZeroXAd(zeroxAdIndex-1);startZeroXAds()});
  document.querySelector("#ad-next")?.addEventListener("click",()=>{renderZeroXAd(zeroxAdIndex+1);startZeroXAds()});
  document.querySelector("#ad-action")?.addEventListener("click",()=>{const ad=ZEROX_ADS[zeroxAdIndex];if(typeof zxOpenCatalog==="function") zxOpenCatalog(ad.category);});
  renderZeroXAd(0); startZeroXAds();
}



const SIXOFIRE_PRODUCT_MAP = {
  "d110-u": "ff-110",
  "d340-u": "ff-340",
  "d572-u": "ff-572",
  "d1166-u": "ff-1166",
  "d2398-u": "ff-2398",
  "d6160-u": "ff-6160"
};

let filter = "Diamantes 1 vez";
let current = null;
let currentCurrency = "MXN";
let searchTerm = "";

const RATES = {
  MXN: 1,
  USD: 0.055,
  COP: 215,
  ARS: 78,
  BRL: 0.29
};

const LOCALES = {
  MXN: "es-MX",
  USD: "en-US",
  COP: "es-CO",
  ARS: "es-AR",
  BRL: "pt-BR"
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function money(value, currency = currentCurrency) {
  const converted = Number(value) * (RATES[currency] || 1);

  return new Intl.NumberFormat(
    LOCALES[currency] || "es-MX",
    {
      style: "currency",
      currency,
      maximumFractionDigits: ["COP", "ARS"].includes(currency) ? 0 : 2
    }
  ).format(converted);
}

initZeroXAds();

/* =========================================================
   ZERO'X ID · CUENTAS
   ========================================================= */
const ZEROX_SESSION_KEY = "zerox-session";
let zeroxUser = null;

function getZeroXSession() {
  try { return JSON.parse(localStorage.getItem(ZEROX_SESSION_KEY) || "null"); }
  catch { return null; }
}

function saveZeroXSession(session) {
  if (session) localStorage.setItem(ZEROX_SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(ZEROX_SESSION_KEY);
}

async function zeroxAuthRequest(path, options = {}) {
  const session = getZeroXSession();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  const response = await fetch(`${ZEROX_API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({ ok:false, error:"INVALID_RESPONSE" }));
  if (!response.ok) {
    const error = new Error(data.error || "REQUEST_FAILED");
    error.data = data;
    error.status = response.status;
    throw error;
  }
  return data;
}

function authMessage(error) {
  const code = error?.data?.error || error?.message;
  return ({
    INVALID_CREDENTIALS: "Correo, usuario o contraseña incorrectos.",
    ACCOUNT_EXISTS: "Ese correo o nombre de usuario ya está registrado.",
    INVALID_EMAIL: "Escribe un correo válido.",
    INVALID_USERNAME: "El usuario debe tener entre 3 y 24 caracteres y usar letras, números, punto, guion o guion bajo.",
    INVALID_PASSWORD: "La contraseña debe tener entre 8 y 128 caracteres.",
    ACCOUNT_DISABLED: "Esta cuenta está deshabilitada.",
    MISSING_CREDENTIALS: "Completa tus datos para continuar."
  })[code] || `No pudimos completar la operación. Código: ${code || "ERROR_DESCONOCIDO"}`;
}

function renderZeroXAccount() {
  const guest = $("#account-guest"), user = $("#account-user"), profile = $("#open-account");
  if (!guest || !user) return;
  guest.hidden = !!zeroxUser;
  user.hidden = !zeroxUser;
  if (profile) profile.classList.toggle("signed-in", !!zeroxUser);
  if (!zeroxUser) return;
  const name = zeroxUser.display_name || zeroxUser.displayName || zeroxUser.username || "Jugador";
  $("#account-name").textContent = name;
  $("#account-username").textContent = "@" + (zeroxUser.username || "zerox");
  $("#account-level").textContent = zeroxUser.level ?? 1;
  $("#account-xp").textContent = zeroxUser.xp ?? 0;
  $("#account-avatar").textContent = name.trim().slice(0,2).toUpperCase() || "ZX";
}

async function restoreZeroXSession() {
  if (!getZeroXSession()?.token) return renderZeroXAccount();
  try {
    const data = await zeroxAuthRequest("/api/auth/me");
    zeroxUser = data.user;
  } catch (error) {
    if (error.status === 401) saveZeroXSession(null);
  }
  renderZeroXAccount();
}

function showAuthMode(mode) {
  const login = mode === "login";
  $("#login-form").hidden = !login;
  $("#register-form").hidden = login;
  $("#auth-login-tab").classList.toggle("active", login);
  $("#auth-register-tab").classList.toggle("active", !login);
  $("#auth-result").innerHTML = "";
}

$("#open-account")?.addEventListener("click", () => $("#account-modal")?.showModal());
$("#close-account")?.addEventListener("click", () => $("#account-modal")?.close());
$("#auth-login-tab")?.addEventListener("click", () => showAuthMode("login"));
$("#auth-register-tab")?.addEventListener("click", () => showAuthMode("register"));

document.querySelectorAll(".password-toggle").forEach(button => {
  button.addEventListener("click", () => {
    const input = button.parentElement.querySelector('input[name="password"]');
    if (!input) return;
    const showing = input.type === "password";
    input.type = showing ? "text" : "password";
    button.textContent = showing ? "Ocultar" : "Ver";
    button.setAttribute("aria-label", showing ? "Ocultar contraseña" : "Mostrar contraseña");
    button.setAttribute("aria-pressed", String(showing));
  });
});

$("#register-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget, button = form.querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = "CREANDO...";
  try {
    const body = Object.fromEntries(new FormData(form).entries());
    const data = await zeroxAuthRequest("/api/auth/register", { method:"POST", body:JSON.stringify(body) });
    saveZeroXSession(data.session);
    zeroxUser = data.user;
    form.reset();
    renderZeroXAccount();
  } catch (error) {
    $("#auth-result").innerHTML = `<div class="error">${esc(authMessage(error))}</div>`;
  } finally {
    button.disabled = false; button.textContent = "CREAR MI CUENTA";
  }
});

$("#login-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget, button = form.querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = "ENTRANDO...";
  try {
    const body = Object.fromEntries(new FormData(form).entries());
    const data = await zeroxAuthRequest("/api/auth/login", { method:"POST", body:JSON.stringify(body) });
    saveZeroXSession(data.session);
    zeroxUser = data.user;
    form.reset();
    renderZeroXAccount();
  } catch (error) {
    $("#auth-result").innerHTML = `<div class="error">${esc(authMessage(error))}</div>`;
  } finally {
    button.disabled = false; button.textContent = "ENTRAR A ZERO'X";
  }
});

$("#logout-account")?.addEventListener("click", async () => {
  try { await zeroxAuthRequest("/api/auth/logout", { method:"POST" }); } catch {}
  saveZeroXSession(null); zeroxUser = null; renderZeroXAccount(); showAuthMode("login");
});

$("#account-orders")?.addEventListener("click", () => {
  $("#account-modal")?.close();
  openStatus();
});

restoreZeroXSession();



/* =========================================================
   CARRITO
   ========================================================= */

function cart() {
  return JSON.parse(localStorage.getItem("zerox-cart") || "[]");
}

function saveCart(value) {
  localStorage.setItem("zerox-cart", JSON.stringify(value));
  updateCartUI();
}

function addToCart(id) {
  const items = cart();

  if (!items.includes(id)) {
    items.push(id);
  }

  saveCart(items);

  const button = document.querySelector(
    `[data-add="${CSS.escape(id)}"]`
  );

  if (button) {
    button.textContent = "✓";

    setTimeout(() => {
      button.textContent = "＋";
    }, 700);
  }
}

function removeFromCart(id) {
  saveCart(cart().filter(item => item !== id));
  renderCart();
}

function updateCartUI() {
  const items = cart();

  const cartCount = $("#cart-count");
  const bottomCartCount = $("#bottom-cart-count");

  if (cartCount) cartCount.textContent = items.length;
  if (bottomCartCount) bottomCartCount.textContent = items.length;

  const total = items
    .map(id => PRODUCTS.find(product => product.id === id))
    .filter(Boolean)
    .reduce((sum, product) => sum + product.price, 0);

  if ($("#cart-total")) {
    $("#cart-total").textContent = money(total);
  }
}

/* =========================================================
   PRODUCTOS
   ========================================================= */

function artFor(product) {
  const name = product.name || "";
  const category = product.category || "";

   /* =========================================
   STREAMING
   ========================================= */

if (category === "Streaming") {

  let image = "";

  if (name.includes("Netflix")) {
    image = "./assets/streaming/netflix.png.png";
  }

  else if (name.includes("Spotify")) {
    image = "./assets/streaming/spotify.png.png";
  }

  else if (name.includes("Max")) {
    image = "./assets/streaming/max.png.png";
  }

  else if (name.includes("Disney")) {
    image = "./assets/streaming/disney.png.png";
  }

  else if (name.includes("Prime")) {
    image = "./assets/streaming/prime.png.png";
  }

  else if (name.includes("Crunchyroll")) {
    image = "./assets/streaming/crunchyroll.png.png";
  }

  if (image) {
    return `
      <div class="streaming-product-art">
        <img
          src="${image}"
          alt="${name}"
          class="streaming-product-img"
        >
      </div>
    `;
  }

  return "";
}
  if (!category.includes("Diamantes")) {
    return "";
  }

  let character = "";
  let characterName = "";

  if (name.includes("110")) {
    character = "file_00000000561081f592ab7a6e14562570.png";
    characterName = "EREN";
  } 
  else if (name.includes("340")) {
    character = "file_000000004e4081f5b42e4462cb0ae3df.png";
    characterName = "SUKUNA";
}
  else if (name.includes("572")) {
    character = "file_00000000469c81f596dc0e8f49ca0040.png";
    characterName = "NAMI";
  } 
  else if (name.includes("1,166") || name.includes("1166")) {
    character = "file_000000000f1482309faad42cecb306fe.png";
    characterName = "ZORO";
}
  else if (name.includes("2,398") || name.includes("2398")) {
    character = "file_000000009bac81f5847f448fd3b24e3a.png";
    characterName = "GOJO";
}
  else if (name.includes("6,160") || name.includes("6160")) {
    character = "file_000000005b2081fd8514a17c052ac79f.png";
    characterName = "LUFFY";
  }

  if (character) {
    return `
      <div class="product-art character-art">
        <div class="character-glow"></div>
        <img
          src="${character}"
          alt="${characterName}"
          class="character-img"
        >
        <div class="character-name">${characterName}</div>
      </div>
    `;
  }

  return "";
}

function render() {
  const container = document.getElementById("products");
  if (!container) return;
  const q = String(searchTerm || "").toLowerCase();
  const rows = PRODUCTS.filter(product => {
    if (!product.active) return false;
    const categoryMatch = filter === "Todos" || product.category === filter || (filter === "Cajas y Fragmentos" && ["Cajas","Fragmentos"].includes(product.category));
    const searchMatch = !q || (product.name + " " + (product.description || "") + " " + product.category).toLowerCase().includes(q);
    return categoryMatch && searchMatch;
  });
  container.innerHTML = rows.length ? rows.map(product => `
    <article class="product-card">
      ${artFor(product)}
      <div class="product-copy">
        ${product.badge ? `<span class="badge">${esc(product.badge)}</span>` : ""}
        <h3>${esc(product.name)}</h3>
        <p>${esc(product.description || "")}</p>
        <div class="product-bottom">
          <strong>${money(product.price)}</strong>
          <button type="button" data-add="${esc(product.id)}" aria-label="Agregar ${esc(product.name)} al carrito">＋</button>
          <button type="button" data-buy-now="${esc(product.id)}">COMPRAR</button>
        </div>
      </div>
    </article>`).join("") : '<div class="zx-empty"><b>SIN PRODUCTOS</b><span>No hay productos disponibles en esta sección por el momento.</span></div>';
  container.querySelectorAll("[data-add]").forEach(button => button.onclick = () => addToCart(button.dataset.add));
  container.querySelectorAll("[data-buy-now]").forEach(button => button.onclick = () => openCheckout(button.dataset.buyNow));
}

function setFilter(category, scroll = true) {
  filter = category;
  render();
  $$(".category-cards [data-cat], .category-strip [data-cat]").forEach(button => {
    button.classList.toggle("active", button.dataset.cat === category);
  });
  if ($("#catalog-title")) $("#catalog-title").textContent = category;
  if (scroll) $("#catalogo")?.scrollIntoView({ behavior:"smooth", block:"start" });
}

/* ZERO'X · navegación por secciones · delegated/mobile-safe */
function zxShow(el,show){if(!el)return;el.hidden=!show;el.style.display=show?"":"none"}
function zxScroll(el){requestAnimationFrame(()=>el?.scrollIntoView({behavior:"smooth",block:"start"}))}
function zxCloseViews(){["#freefire-menu","#zx-id-gate","#zx-managed","#zx-reseller-panel"].forEach(id=>zxShow($(id),false));$("#catalogo")?.classList.add("zx-catalog-hidden")}
function zxOpenCatalog(category){zxCloseViews();zxShow($("#secciones"),false);$("#catalogo")?.classList.remove("zx-catalog-hidden");setFilter(category,false);zxScroll($("#catalogo"))}
const ZX_MANAGED={
 accounts:{title:"CUENTAS",note:"Catálogo preparado para productos con imágenes, video, descripción y precio editables.",category:"Cuentas"},
 clans:{title:"VENTA DE CLANES",note:"Catálogo multimedia de clanes disponibles.",category:"Venta Clanes"},
 honor:{title:"HONOR DE CLANES",note:"Servicios de honor de clanes disponibles.",category:"Honor de Clanes"}
};
function zxOpenManaged(type){
 const cfg=ZX_MANAGED[type];if(!cfg)return;zxCloseViews();zxShow($("#secciones"),false);zxShow($("#zx-managed"),true);
 $("#zx-managed-title").textContent=cfg.title;$("#zx-managed-note").textContent=cfg.note;
 const rows=PRODUCTS.filter(p=>p.active&&p.category===cfg.category);
 $("#zx-managed-grid").innerHTML=rows.length?rows.map(p=>`<article class="zx-media-product"><div class="zx-media-art">${artFor(p)||'<div class="zx-media-placeholder">ZERO’X</div>'}</div><div><small>${esc(p.category)}</small><h3>${esc(p.name)}</h3><p>${esc(p.description||"Producto disponible en Zero’X Store.")}</p><strong>${money(p.price)}</strong><button type="button" data-buy="${esc(p.id)}">VER PRODUCTO</button></div></article>`).join(""):'<div class="zx-empty"><b>PRÓXIMAMENTE</b><span>Esta sección ya está preparada para recibir productos con fotos, videos, descripción y precio.</span></div>';
 $("#zx-managed-grid").querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>openCheckout(b.dataset.buy));zxScroll($("#zx-managed"));
}
function zxRenderResellerPreview(){
  const target=$("#zx-reseller-catalog");
  if(!target)return;
  const groups=new Map();
  PRODUCTS.filter(p=>p.active).forEach(p=>{
    const section=p.category==="Streaming"?"Streaming":p.category.startsWith("Diamantes")||["Pases Booyah","Fragmentos","Cajas","Likes"].includes(p.category)?"Free Fire":p.category;
    if(!groups.has(section))groups.set(section,[]);
    groups.get(section).push(p);
  });
  target.innerHTML=[...groups].map(([section,items])=>`<article class="zx-reseller-group"><h4>${esc(section)} <small>${items.length} productos</small></h4><ul>${items.map(p=>`<li><span>${esc(p.name)}</span><small>Precio por nivel pendiente</small></li>`).join("")}</ul></article>`).join("");
}
document.addEventListener("click",event=>{
 const zone=event.target.closest("[data-zone]");if(zone){event.preventDefault();const z=zone.dataset.zone;if(z==="freefire"){zxCloseViews();zxShow($("#secciones"),false);zxShow($("#freefire-menu"),true);zxScroll($("#freefire-menu"))}else if(z==="streaming")zxOpenCatalog("Streaming");else if(z==="resellers"){zxCloseViews();zxShow($("#secciones"),false);zxShow($("#zx-reseller-panel"),true);zxRenderResellerPreview();zxScroll($("#zx-reseller-panel"))}else zxOpenManaged(z);return}
 if(event.target.closest("[data-back-zones]")){zxCloseViews();zxShow($("#secciones"),true);zxScroll($("#secciones"));return}
 if(event.target.closest("[data-back-freefire]")){zxCloseViews();zxShow($("#secciones"),false);zxShow($("#freefire-menu"),true);zxScroll($("#freefire-menu"));return}
 if(event.target.closest("[data-zx-sub='first']")){zxCloseViews();zxShow($("#secciones"),false);zxShow($("#zx-id-gate"),true);zxScroll($("#zx-id-gate"));return}
 if(event.target.closest("[data-zx-sub='unlimited']")){zxOpenCatalog("Diamantes ilimitados");return}
 const cat=event.target.closest("[data-open-cat]");if(cat){zxOpenCatalog(cat.dataset.openCat);return}
});
$("#zx-id-form")?.addEventListener("submit",async e=>{e.preventDefault();const id=$("#zx-player-id").value.trim(),out=$("#zx-id-result");out.innerHTML='<div class="zx-checking">VERIFICANDO JUGADOR...</div>';try{const r=await fetch(`${ZEROX_API}/api/player?uid=${encodeURIComponent(id)}&region=br`);const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||"PLAYER_LOOKUP_FAILED");sessionStorage.setItem("zerox-verified-player",id);out.innerHTML='<div class="zx-verified">✓ ID VERIFICADO · Mostrando promociones disponibles.</div>';setTimeout(()=>zxOpenCatalog("Diamantes 1 vez"),450)}catch(err){out.innerHTML=`<div class="error">No pudimos verificar este ID. Código: ${esc(err.message)}</div>`}});

$$("[data-cat]").forEach(button => {
  button.onclick = () => {
    $("#catalogo")?.classList.remove("zx-catalog-hidden");
    setFilter(button.dataset.cat);
  };
});

if ($("#currency")) {
  $("#currency").onchange = event => {
    currentCurrency = event.target.value;

    if ($("#rate-note")) {
      $("#rate-note").textContent =
        currentCurrency === "MXN"
          ? "Precios base en pesos mexicanos (MXN)."
          : "Conversión informativa desde MXN. El cobro final puede variar según el tipo de cambio.";
    }

    render();
    updateCartUI();
  };
}

if ($("#search")) {
  $("#search").addEventListener(
    "input",
    event => {
      searchTerm =
        event.target.value
          .trim()
          .toLowerCase();

      render();
    }
  );
}

/* =========================================================
   MODAL DE CARRITO
   ========================================================= */

function renderCart() {
  const items = cart()
    .map(id =>
      PRODUCTS.find(product => product.id === id)
    )
    .filter(Boolean);

  const container = $("#cart-items");

  if (!container) return;

  container.innerHTML =
    items.length
      ? items.map(product => `
          <div class="cart-row">

            <div>
              <b>${esc(product.name)}</b>
              <small>${esc(product.category)}</small>
            </div>

            <strong>
              ${money(product.price)}
            </strong>

            <button
              class="remove-cart"
              data-remove="${esc(product.id)}">
              ×
            </button>

          </div>
        `).join("")
      : `<p class="fine">
          Tu carrito está vacío.
        </p>`;

  $$("[data-remove]").forEach(button => {
    button.onclick = () => {
      removeFromCart(
        button.dataset.remove
      );
    };
  });

  updateCartUI();

  if ($("#checkout-cart-first")) {
    $("#checkout-cart-first").disabled =
      !items.length;
  }
}

function openCart() {
  renderCart();

  if ($("#cart")) {
    $("#cart").showModal();
  }
}

if ($("#open-cart")) {
  $("#open-cart").onclick =
    openCart;
}

if ($("#bottom-cart")) {
  $("#bottom-cart").onclick =
    openCart;
}

if ($("#close-cart")) {
  $("#close-cart").onclick = () => {
    $("#cart").close();
  };
}

if ($("#checkout-cart-first")) {
  $("#checkout-cart-first").onclick =
    () => {
      const id = cart()[0];

      if (id) {
        $("#cart").close();
        openCheckout(id);
      }
    };
}

/* =========================================================
   CHECKOUT
   ========================================================= */

function openCheckout(id) {
  current = PRODUCTS.find(
    product => product.id === id
  );

  if (!current) return;

  if ($("#modal-product")) {
    $("#modal-product").textContent =
      current.name;
  }

  if ($("#product-id")) {
    $("#product-id").value =
      id;
  }

  if ($("#coupon")) {
    $("#coupon").value = "";
  }

  if ($("#eligibility-note")) {
    $("#eligibility-note").hidden =
      !current.requiresEligibility;
  }

  renderSummary({
    subtotal: current.price,
    discount: 0,
    total: current.price
  });

  if ($("#checkout-result")) {
    $("#checkout-result").innerHTML = "";
  }

  if ($("#checkout")) {
    $("#checkout").showModal();
  }
}

function renderSummary(data) {
  if (!$("#price-summary")) return;

  $("#price-summary").innerHTML = `
    <span>Producto</span>
    <b>${money(data.subtotal)}</b>

    ${
      data.discount
        ? `
          <span>Descuento</span>
          <b>−${money(data.discount)}</b>
        `
        : ""
    }

    <span>Total</span>
    <strong>
      ${money(data.total)}
    </strong>
  `;
}

/* Cupón demo */
if ($("#apply-coupon")) {
  $("#apply-coupon").onclick = () => {
    if (!current) return;

    const code =
      ($("#coupon")?.value || "")
        .trim()
        .toUpperCase();

    let discount = 0;

    if (code === "ZEROX5") {
      discount =
        current.price * 0.05;
    }

    renderSummary({
      subtotal: current.price,
      discount,
      total:
        current.price - discount
    });

    $("#apply-coupon").textContent =
      discount
        ? "Aplicado ✓"
        : "No válido";

    setTimeout(() => {
      $("#apply-coupon").textContent =
        "Aplicar";
    }, 1400);
  };
}

/* =========================================================
   PEDIDOS LOCALES
   ========================================================= */

function getOrders() {
  return JSON.parse(
    localStorage.getItem(
      "zerox-orders"
    ) || "[]"
  );
}

function saveOrders(orders) {
  localStorage.setItem(
    "zerox-orders",
    JSON.stringify(orders)
  );
}

function createOrderId() {
  return (
    "ZX-" +
    Date.now()
      .toString()
      .slice(-8)
  );
}
// =====================================================
// COMPROBAR CUENTA FREE FIRE
// =====================================================

async function checkFreeFirePlayer() {
  const playerInput = document.querySelector(
    '[name="playerId"]'
  );

  const checkButton = document.querySelector(
    ".check-player-btn"
  );

  const profileCard = document.querySelector(
    "#player-profile-card"
  );

  if (!playerInput || !checkButton || !profileCard) {
    return;
  }

  const uid = playerInput.value.trim();

  if (!uid || !/^\d{5,15}$/.test(uid)) {
    alert("Ingresa un ID de jugador válido.");
    return;
  }

  checkButton.disabled = true;
  checkButton.textContent = "COMPROBANDO...";

  profileCard.innerHTML = `
    <div class="player-loading">
      Buscando cuenta...
    </div>
  `;

  profileCard.style.display = "block";

  try {
    const response = await fetch(
      `${ZEROX_API}/api/player?uid=${encodeURIComponent(uid)}&region=br`
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(
        result?.error || "No se pudo consultar la cuenta."
      );
    }

    const data = result.player;

    const basicInfo = data.basicInfo || {};
    const profileInfo = data.profileInfo || {};
    const clanInfo = data.clanBasicInfo || {};

    const avatarId = profileInfo.avatarId || "";
    const bannerId = basicInfo.bannerId || profileInfo.bannerId || "";

    const clothes = Array.isArray(profileInfo.clothes)
      ? profileInfo.clothes
      : [];

    const avatarUrl = avatarId
      ? `${ZEROX_API}/api/item-image?itemID=${encodeURIComponent(avatarId)}`
      : "";

    const bannerUrl = bannerId
      ? `${ZEROX_API}/api/item-image?itemID=${encodeURIComponent(bannerId)}`
      : "";

    const clothesHtml = clothes
      .map(
        itemID => `
          <img
            src="${ZEROX_API}/api/item-image?itemID=${encodeURIComponent(itemID)}"
            alt="Equipamiento"
            loading="lazy"
            onerror="this.style.display='none'"
          >
        `
      )
      .join("");

    const nickname =
      basicInfo.nickname ||
      data.nickname ||
      "Jugador";

    const level =
      basicInfo.level ??
      "—";

    const region =
      basicInfo.region ||
      "—";

    const rank =
      basicInfo.rank ??
      "—";

    const likes =
      basicInfo.liked ??
      basicInfo.likes ??
      "—";

    const clanName =
      clanInfo.clanName ||
      "Sin clan";

    profileCard.innerHTML = `
  <div class="player-profile-card">

    <div
      class="player-profile-banner"
      ${
        bannerUrl
          ? `style="background-image:url('${bannerUrl}')"`
          : ""
      }
    ></div>

    <div class="player-profile-content">

      ${
        avatarUrl
          ? `
            <img
              class="player-avatar"
              src="${avatarUrl}"
              alt="Avatar de ${esc(nickname)}"
            >
          `
          : `
            <div class="player-avatar"></div>
          `
      }

      <div class="player-profile-info">
        <strong>${esc(nickname)}</strong>
        <span>UID: ${esc(uid)}</span>
      </div>

    </div>

    <div class="player-profile-status">

      <div>
  <strong><img src="nivel.png" class="ff-stat-icon" alt="Nivel"> ${esc(String(level))}</strong>
  <small>Nivel</small>
</div>

<div>
  <strong><img src="region.png" class="ff-stat-icon" alt="Región"> ${esc(String(region))}</strong>
  <small>Región</small>
</div>

<div>
  <img src="./rango.png?v=2" class="ff-stat-icon" alt="Rango"> ${esc(String(rank))}</strong>
  <small>Rango</small>
</div>

<div>
  <strong><img src="likes.png" class="ff-stat-icon" alt="Likes"> ${esc(String(likes))}</strong>
  <small>Likes</small>
</div>

    </div>

    <div class="player-clan">
  <img src="clan.png" class="ff-clan-icon" alt="Clan">
  <span>${esc(clanName)}</span>
</div>

    ${
      clothes.length
        ? `
          <div class="player-equipment">

            <div class="player-equipment-title">
              <span>👕 Equipamiento actual</span>
            </div>

            <div class="player-equipment-grid">
              ${clothesHtml}
            </div>

          </div>
        `
        : ""
    }

    <div class="player-confirm-box">

      <h4>¿Esta es tu cuenta?</h4>

      <p>
        Verifica que la información sea correcta antes de continuar.
      </p>

      <div class="player-confirm-actions">

        <button
          type="button"
          class="confirm-player-btn ff-confirm-account"
          data-player-verified="true"
        >
          ✓ SÍ, ES MI CUENTA
        </button>

        <button
          type="button"
          class="change-player-btn ff-change-account"
        >
          ↻ CAMBIAR ID
        </button>

      </div>

    </div>

  </div>
`;

    profileCard.dataset.playerVerified = "false";
    profileCard.dataset.playerUid = uid;

    const confirmButton = profileCard.querySelector(
      ".ff-confirm-account"
    );

    const changeButton = profileCard.querySelector(
      ".ff-change-account"
    );

    if (confirmButton) {
      confirmButton.addEventListener("click", () => {
        profileCard.dataset.playerVerified = "true";

        confirmButton.textContent = "✓ CUENTA CONFIRMADA";
        confirmButton.disabled = true;
      });
    }

    if (changeButton) {
      changeButton.addEventListener("click", () => {
        profileCard.innerHTML = "";
        profileCard.style.display = "none";
        profileCard.dataset.playerVerified = "false";
        playerInput.focus();
      });
    }

  } catch (error) {
    console.error(
      "Error comprobando jugador:",
      error
    );

    profileCard.innerHTML = `
      <div class="player-error">
        No pudimos encontrar esa cuenta.
        Verifica el ID e inténtalo nuevamente.
      </div>
    `;
  } finally {
    checkButton.disabled = false;
    checkButton.textContent = "COMPROBAR CUENTA";
  }
}

document.addEventListener("click", event => {

  const button = event.target.closest(
    ".check-player-btn"
  );

  if (!button) return;

  checkFreeFirePlayer();

});
// ======================================================
// INVALIDAR CONFIRMACION SI CAMBIA EL UID
// ======================================================

const playerIdInput =
  document.querySelector('[name="playerId"]');

if (playerIdInput) {
  playerIdInput.addEventListener("input", () => {

    const profileCard =
      document.querySelector("#player-profile-card");

    if (!profileCard) return;

    profileCard.dataset.playerVerified = "false";
    profileCard.dataset.playerUid = "";

    profileCard.innerHTML = "";
    profileCard.style.display = "none";
  });
}
if ($("#checkout-form")) {
  $("#checkout-form").addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const form = event.currentTarget;

      const button =
        form.querySelector(
          '[type="submit"]'
        );

      if (button) {
        button.disabled = true;
        button.textContent =
          "PROCESANDO…";
      }

      const payload =
        Object.fromEntries(
          new FormData(form)
            .entries()
        );

      const product =
        PRODUCTS.find(
          item =>
            item.id ===
            payload.productId
        );

      if (!product) {
        if ($("#checkout-result")) {
          $("#checkout-result").innerHTML =
            `<div class="error">
              Producto no encontrado.
            </div>`;
        }

        return;
      }
       // ======================================================
// VALIDAR QUE LA CUENTA FREE FIRE FUE CONFIRMADA
// ======================================================

const profileCard =
  document.querySelector("#player-profile-card");

const currentPlayerId = String(
  payload.playerId ||
  payload.uid ||
  ""
).trim();

if (product.requiresEligibility) {

  const playerVerified =
    profileCard?.dataset.playerVerified === "true";

  const verifiedUid =
    String(
      profileCard?.dataset.playerUid || ""
    ).trim();

  if (
    !playerVerified ||
    !currentPlayerId ||
    verifiedUid !== currentPlayerId
  ) {

    if ($("#checkout-result")) {
      $("#checkout-result").innerHTML = `
        <div class="error">
          Primero comprueba y confirma tu cuenta de Free Fire.
        </div>
      `;
    }

    if (button) {
      button.disabled = false;
      button.textContent = "CREAR PEDIDO";
    }

    return;
  }
}
// =========================================================
// VALIDACIÓN SIXOFIRE - SOLO DIAMANTES ILIMITADOS
// NO REALIZA COMPRAS
// =========================================================

const sixofireProduct = SIXOFIRE_PRODUCT_MAP[product.id];

if (sixofireProduct) {
  const playerId = String(
    payload.playerId ||
    payload.uid ||
    ""
  ).trim();

  if (!playerId) {
    if ($("#checkout-result")) {
      $("#checkout-result").innerHTML = `
        <div class="error">
          Ingresa el ID del jugador.
        </div>
      `;
    }

    if (button) {
      button.disabled = false;
      button.textContent = "CREAR PEDIDO";
    }

    return;
  }

  try {
    const response = await fetch(
      `${ZEROX_API}/api/order/preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId: sixofireProduct,
          playerId: playerId
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(
        result.message ||
        "No fue posible validar el pedido."
      );
    }

    console.log(
      "SixOfFire preview OK:",
      result
    );

  } catch (error) {
    if ($("#checkout-result")) {
      $("#checkout-result").innerHTML = `
        <div class="error">
          Error al validar con SixOfFire:
          ${esc(error.message)}
        </div>
      `;
    }

    if (button) {
      button.disabled = false;
      button.textContent = "CREAR PEDIDO";
    }

    return;
  }
}
      const coupon =
        (payload.coupon || "")
          .trim()
          .toUpperCase();

      const discount =
        coupon === "ZEROX5"
          ? product.price * 0.05
          : 0;

      const order = {
        id: createOrderId(),
        productId: product.id,
        productName: product.name,
        category: product.category,
        price: product.price,
        discount,
        total:
          product.price -
          discount,
        playerId:
          payload.playerId ||
          payload.uid ||
          "",
        nickname:
          payload.nickname ||
          "",
        payment:
          payload.payment ||
          "",
        contact:
          payload.contact ||
          payload.email ||
          "",
        status: "PENDIENTE DE PAGO",
paymentStatus: "PENDIENTE",
paymentConfirmed: false,
paidAt: null,
fulfillmentStatus: "NO ENVIADO",
         
        createdAt:
          new Date().toISOString()
      };

      const orders =
        getOrders();

      orders.unshift(order);

      saveOrders(orders);

      if ($("#checkout-result")) {
        $("#checkout-result").innerHTML = `
          <div class="success">

            <b>Pedido recibido ✓</b>

<br><br>

<span>
  Folio: ${esc(order.id)}
</span>

<br><br>

<small>
  Estado: ${esc(order.status)}
</small>

<br>

<small>
  Método de pago: ${esc(order.payment)}
</small>

<br>

<small>
  Total: $${Number(order.total).toFixed(2)} MXN
</small>

<br><br>

<small>
  Tu pedido aún no ha sido pagado ni enviado.
  Conserva este folio para darle seguimiento.
</small>

          </div>
        `;
      }

      saveCart(
        cart().filter(
          id =>
            id !==
            product.id
        )
      );

      if (button) {
        button.textContent =
          "PEDIDO CREADO";
      }
    }
  );
}

/* =========================================================
   SEGUIMIENTO DE PEDIDOS
   ========================================================= */

function openStatus() {
  if ($("#status")) {
    $("#status").showModal();
  }
}

if ($("#open-status")) {
  $("#open-status").onclick =
    openStatus;
}

if ($("#bottom-status")) {
  $("#bottom-status").onclick =
    openStatus;
}

if ($("#drawer-orders")) {
  $("#drawer-orders").onclick =
    () => {
      closeDrawer();
      openStatus();
    };
}

if ($("#status-form")) {
  $("#status-form").addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const id =
        new FormData(
          event.currentTarget
        )
          .get("orderId")
          ?.trim();

      const order =
        getOrders().find(
          item =>
            item.id === id
        );

      if (!order) {
        $("#status-result").innerHTML = `
          <div class="error">
            Pedido no encontrado
          </div>
        `;

        return;
      }

      $("#status-result").innerHTML = `
        <div class="success">

          <b>
            ${esc(order.status)}
          </b>

          <br>

          <small>
            ${esc(order.id)}
          </small>

          <br><br>

          ${esc(order.productName)}

          —

          ${new Intl.NumberFormat(
            "es-MX",
            {
              style: "currency",
              currency: "MXN"
            }
          ).format(order.total)}
          MXN

        </div>
      `;
    }
  );
}

/* =========================================================
   REVENDEDORES
   ========================================================= */

function getResellers() {
  return JSON.parse(
    localStorage.getItem(
      "zerox-resellers"
    ) || "[]"
  );
}

if ($("#reseller-form")) {
  $("#reseller-form").addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const form =
        event.currentTarget;

      const payload =
        Object.fromEntries(
          new FormData(form)
            .entries()
        );

      const application = {
        id:
          "RS-" +
          Date.now()
            .toString()
            .slice(-7),
        ...payload,
        createdAt:
          new Date()
            .toISOString()
      };

      const applications =
        getResellers();

      applications.unshift(
        application
      );

      localStorage.setItem(
        "zerox-resellers",
        JSON.stringify(
          applications
        )
      );

      if ($("#reseller-result")) {
        $("#reseller-result").innerHTML = `
          <div class="success">

            Solicitud recibida ✓

            <br>

            <small>
              Folio:
              ${esc(application.id)}
            </small>

          </div>
        `;
      }

      form.reset();
    }
  );
}

/* =========================================================
   MENÚ LATERAL
   ========================================================= */

const drawer =
  $("#drawer");

const backdrop =
  $("#drawer-backdrop");

function openDrawer() {
  if (!drawer) return;

  drawer.classList.add("open");

  if (backdrop) {
    backdrop.classList.add("show");
  }

  drawer.setAttribute(
    "aria-hidden",
    "false"
  );
}

function closeDrawer() {
  if (!drawer) return;

  drawer.classList.remove("open");

  if (backdrop) {
    backdrop.classList.remove("show");
  }

  drawer.setAttribute(
    "aria-hidden",
    "true"
  );
}

if ($("#menu-btn")) {
  $("#menu-btn").onclick =
    openDrawer;
}

if ($("#close-drawer")) {
  $("#close-drawer").onclick =
    closeDrawer;
}

if (backdrop) {
  backdrop.onclick =
    closeDrawer;
}

$$('#drawer a').forEach(
  link => {
    link.addEventListener(
      "click",
      closeDrawer
    );
  }
);

/* =========================================================
   PWA / INSTALAR APP
   ========================================================= */

let deferredInstallPrompt =
  null;

const installBtn =
  $("#install-app");

const installToast =
  $("#install-toast");

const installToastBtn =
  $("#install-toast-btn");

const dismissInstall =
  $("#dismiss-install");

function isStandalone() {
  return (
    matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    navigator.standalone === true
  );
}

async function triggerInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();

    await deferredInstallPrompt
      .userChoice;

    deferredInstallPrompt = null;

    if (installBtn) {
      installBtn.hidden = true;
    }

    if (installToast) {
      installToast.hidden = true;
    }

    return;
  }

  const isiOS =
    /iphone|ipad|ipod/i
      .test(
        navigator.userAgent
      );

  alert(
    isiOS
      ? 'En iPhone: toca Compartir y después "Agregar a pantalla de inicio".'
      : 'En Chrome: abre el menú ⋮ y toca "Instalar aplicación" o "Agregar a pantalla principal".'
  );
}

window.addEventListener(
  "beforeinstallprompt",
  event => {
    event.preventDefault();

    deferredInstallPrompt =
      event;

    if (installBtn) {
      installBtn.hidden =
        false;
    }

    if (
      installToast &&
      !isStandalone() &&
      localStorage.getItem("zerox-install-installed") !== "1" &&
      localStorage.getItem(
        "zerox-install-dismissed"
      ) !== "1"
    ) {
      installToast.hidden =
        false;
    }
  }
);

if (installBtn) {
  installBtn.addEventListener(
    "click",
    triggerInstall
  );
}

if (installToastBtn) {
  installToastBtn.addEventListener(
    "click",
    triggerInstall
  );
}

if (dismissInstall) {
  dismissInstall.addEventListener(
    "click",
    () => {
      if (installToast) {
        installToast.hidden =
          true;
      }

      localStorage.setItem(
        "zerox-install-dismissed",
        "1"
      );
    }
  );
}

window.addEventListener(
  "appinstalled",
  () => {
    localStorage.setItem("zerox-install-installed", "1");
    if (installBtn) {
      installBtn.hidden =
        true;
    }

    if (installToast) {
      installToast.hidden =
        true;
    }
  }
);

if (isStandalone() || localStorage.getItem("zerox-install-installed") === "1" || localStorage.getItem("zerox-install-dismissed") === "1") {
  if (installToast) installToast.hidden = true;
}

/* Service Worker temporarily disabled during storefront stabilization */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister())).catch(() => {});
}

/* =========================================================
   INICIO
   ========================================================= */

render();
updateCartUI();
/* =========================================
   ZERO'X - SELECCIÓN NEÓN DE TARJETAS
   ========================================= */

document.querySelectorAll('.feature-row > button').forEach(card => {

    card.addEventListener('click', function () {

        // Apagar todas
        document.querySelectorAll('.feature-row > button')
            .forEach(item => item.classList.remove('active'));

        // Encender solamente la seleccionada
        this.classList.add('active');

    });

});

/* =========================================================
   ZERO'X STORE · SPLASH SCREEN / LOADING · FAIL-SAFE
   ========================================================= */
(() => {
  const splash = document.getElementById("zerox-splash");
  const bar = document.getElementById("zerox-loading-bar");
  const percent = document.getElementById("zerox-loading-percent");
  if (!splash) return;

  let progress = 0;
  let finished = false;

  const closeSplash = () => {
    if (finished) return;
    finished = true;
    splash.classList.add("zerox-splash-out");
    setTimeout(() => { splash.style.display = "none"; }, 450);
  };

  const loading = setInterval(() => {
    progress = Math.min(progress + 5, 100);
    if (bar) bar.style.width = progress + "%";
    if (percent) percent.textContent = progress + "%";
    if (progress >= 100) {
      clearInterval(loading);
      setTimeout(closeSplash, 180);
    }
  }, 45);

  // Never let a cosmetic loader block access to the store.
  window.addEventListener("load", () => setTimeout(closeSplash, 350), { once:true });
  setTimeout(closeSplash, 3500);
})();
