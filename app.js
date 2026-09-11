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

function setFilter(category, scroll = true) {
  filter = category;

  $$("[data-cat]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.cat === category
    );
  });

  const title = $("#catalog-title");
  const note = $("#catalog-note");

  if (category === "Diamantes 1 vez") {
    if (title) {
      title.innerHTML =
        "DIAMANTES <em>1 VEZ POR ID</em>";
    }

    if (note) {
      note.textContent =
        "Se revisa primero que el ID sea válido para la promoción. Cada paquete promocional puede usarse una sola vez por ID.";
    }
  } else if (category === "Diamantes ilimitados") {
    if (title) {
      title.innerHTML =
        "CANTIDADES <em>ILIMITADAS</em>";
    }

    if (note) {
      note.textContent =
        "Estas cantidades pueden comprarse varias veces para el mismo ID.";
    }
     } else if (category === "Streaming") {

  if (title) {
    title.innerHTML =
      'STREAMING <em>PREMIUM</em>';
  }

  if (note) {
    note.textContent =
      "Elige tu plataforma favorita y selecciona el plan disponible.";
  }
  } else {
    if (title) {
      title.innerHTML =
        category === "Todos"
          ? "CATÁLOGO <em>ZERO'X</em>"
          : esc(category).toUpperCase();
    }

    if (note) {
      note.textContent =
        "Elige el producto que necesitas y crea tu pedido.";
    }
  }

  render();

  if (scroll && $("#catalogo")) {
    $("#catalogo").scrollIntoView({
      behavior: "smooth"
    });
  }
}

function render() {
  const container = $("#products");

  if (!container) return;

  const rows = PRODUCTS.filter(product => {
    const matchesCategory =
      filter === "Todos" ||
      product.category === filter;

    const text =
      `${product.name} ${product.description} ${product.category}`
        .toLowerCase();

    const matchesSearch =
      !searchTerm ||
      text.includes(searchTerm);

    return (
      product.active &&
      matchesCategory &&
      matchesSearch
    );
  });
// =====================================================
// STREAMING AGRUPADO POR PLATAFORMA
// =====================================================

if (filter === "Streaming") {

    const platforms = {};

    rows.forEach(product => {

        // Obtiene Netflix, Disney+, Max, Prime Video, etc.
        const platform = product.name.split(" - ")[0];

        if (!platforms[platform]) {
            platforms[platform] = [];
        }

        platforms[platform].push(product);
    });

    container.innerHTML = Object.entries(platforms)
        .map(([platform, plans]) => {

            const cheapest = Math.min(
                ...plans.map(plan => Number(plan.price) || 0)
            );

            return `
                <article class="streaming-platform-card">

                    <div class="streaming-platform-image">
                        ${artFor(plans[0])}
                    </div>

                    <h3 class="streaming-platform-title">
                        ${esc(platform)}
                    </h3>

                    <div class="streaming-from">
                        Desde <b>${money(cheapest)}</b>
                    </div>

                    <details class="streaming-plans">

                        <summary>
                            VER PLANES
                        </summary>

                        <div class="streaming-plan-list">

                            ${plans.map(plan => {

                                const planName =
                                    plan.name.includes(" - ")
                                    ? plan.name.split(" - ").slice(1).join(" - ")
                                    : plan.name;

                                return `
                                    <div class="streaming-plan">

                                        <div class="streaming-plan-info">
                                            <strong>
                                                ${esc(planName)}
                                            </strong>

                                            <span>
                                                ${money(plan.price)}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            class="streaming-buy"
                                            onclick="event.stopPropagation(); addToCart('${plan.id}')"
                                        >
                                            🛒
                                        </button>

                                    </div>
                                `;
                            }).join("")}

                        </div>

                    </details>

                </article>
            `;
        })
        .join("");

    return;
}
  container.innerHTML =
    rows.map(product => `
      <article class="product-card ${product.featured ? "featured" : ""}">
        <div class="product-top">
          <span class="tag">
            ${esc(product.badge || "Disponible")}
          </span>

          <span class="type">
            ${esc(product.category)}
          </span>
        </div>

        <div class="diamond-icon">
          ${artFor(product)}
        </div>

        <h3>
          ${esc(product.name)}
        </h3>

        <p>
          ${esc(product.description || "")}
        </p>

        <div class="pricing">
          ${
            product.price > 0
              ? `<b>${money(product.price)}</b>`
              : `<b>PRÓXIMAMENTE</b>`
          }

          ${
            currentCurrency !== "MXN" &&
            product.price > 0
              ? `
                <small>
                  Base:
                  ${new Intl.NumberFormat(
                    "es-MX",
                    {
                      style: "currency",
                      currency: "MXN"
                    }
                  ).format(product.price)}
                  MXN
                </small>
              `
              : ""
          }
        </div>

        <div class="product-actions">

          ${
            product.price > 0
              ? `
                <button
                  class="add-cart"
                  data-add="${esc(product.id)}"
                  title="Agregar al carrito">
                  ＋
                </button>

                <button
  class="buy"
  data-buy="${esc(product.id)}">
  <span class="buy-cart-icon" aria-hidden="true"></span>
  <span>COMPRAR</span>
</button>
              `
              : `
                <button
                  class="buy"
                  disabled>
                  PRÓXIMAMENTE
                </button>
              `
          }

        </div>
      </article>
    `).join("") ||
    "<p>No encontramos productos con esos filtros.</p>";

  $$("[data-buy]").forEach(button => {
    button.onclick = () => {
      openCheckout(button.dataset.buy);
    };
  });

  $$("[data-add]").forEach(button => {
    button.onclick = () => {
      addToCart(button.dataset.add);
    };
  });
}

/* =========================================================
   CATEGORÍAS / BÚSQUEDA / MONEDA
   ========================================================= */

$$("[data-cat]").forEach(button => {
  button.onclick = () => {
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
  <strong><img src="rango.png" class="ff-stat-icon" alt="Rango"> ${esc(String(rank))}</strong>
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
        status:
          product.requiresEligibility
            ? "PENDIENTE DE VALIDACIÓN"
            : "PEDIDO RECIBIDO",
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

            <b>Pedido creado ✓</b>

            <br>

            <span>
              ${esc(order.id)}
            </span>

            <br>

            <small>
              Estado:
              ${esc(order.status)}
            </small>

            <br>

            <small>
              Guarda este folio para rastrearlo.
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

/* Service Worker */
if ("serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register(
          "./service-worker.js"
        )
        .catch(error => {
          console.log(
            "Service Worker:",
            error
          );
        });
    }
  );
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
