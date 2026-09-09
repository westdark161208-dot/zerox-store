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

/* =========================================
   STREAMING
   ========================================= */

{
  id: "stream-netflix",
  category: "Streaming",
  name: "Netflix",
  description: "Acceso digital a Netflix.",
  price: 0,
  active: true,
  featured: false,
  requiresEligibility: false,
  badge: "STREAMING"
},
{
  id: "stream-spotify",
  category: "Streaming",
  name: "Spotify Premium",
  description: "Spotify Premium con entrega digital.",
  price: 0,
  active: true,
  featured: false,
  requiresEligibility: false,
  badge: "STREAMING"
},
{
  id: "stream-max",
  category: "Streaming",
  name: "Max",
  description: "Acceso digital a Max.",
  price: 0,
  active: true,
  featured: false,
  requiresEligibility: false,
  badge: "STREAMING"
},
{
  id: "stream-disney",
  category: "Streaming",
  name: "Disney+",
  description: "Acceso digital a Disney+.",
  price: 0,
  active: true,
  featured: false,
  requiresEligibility: false,
  badge: "STREAMING"
},
{
  id: "stream-prime",
  category: "Streaming",
  name: "Prime Video",
  description: "Acceso digital a Prime Video.",
  price: 0,
  active: true,
  featured: false,
  requiresEligibility: false,
  badge: "STREAMING"
},
{
  id: "stream-crunchyroll",
  category: "Streaming",
  name: "Crunchyroll",
  description: "Acceso digital a Crunchyroll.",
  price: 0,
  active: true,
  featured: false,
  requiresEligibility: false,
  badge: "STREAMING"
}

];

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
    image = "./assets/streaming/netflix.png";
  }

  else if (name.includes("Spotify")) {
    image = "./assets/streaming/spotify.png";
  }

  else if (name.includes("Max")) {
    image = "./assets/streaming/max.png";
  }

  else if (name.includes("Disney")) {
    image = "./assets/streaming/disney.png";
  }

  else if (name.includes("Prime")) {
    image = "./assets/streaming/prime.png";
  }

  else if (name.includes("Crunchyroll")) {
    image = "./assets/streaming/crunchyroll.png";
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

if ($("#checkout-form")) {
  $("#checkout-form").addEventListener(
    "submit",
    event => {
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
