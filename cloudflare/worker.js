const PRODUCT_MAP = {
  "ff-110": {
    sixofireProductId: "9149",
    amount: 1
  },
  "ff-340": {
    sixofireProductId: "27107",
    amount: 1
  },
  "ff-572": {
    sixofireProductId: "2622",
    amount: 1
  },
  "ff-1166": {
    sixofireProductId: "5352",
    amount: 1
  },
  "ff-2398": {
    sixofireProductId: "9725",
    amount: 1
  },
  "ff-6160": {
    sixofireProductId: "5317",
    amount: 1
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...corsHeaders
    }
  });
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        });
      }

      const url = new URL(request.url);
// Consultar información de jugador de Free Fire
if (url.pathname === "/api/player" && request.method === "GET") {
  if (!env.FF_INFO_API_KEY) {
    return json({
      ok: false,
      error: "FF_INFO_API_KEY_NOT_CONFIGURED"
    }, 500);
  }

  const uid = (url.searchParams.get("uid") || "").trim();
  const region = (url.searchParams.get("region") || "br").trim().toLowerCase();

  if (!/^\d{5,15}$/.test(uid)) {
    return json({
      ok: false,
      error: "INVALID_UID"
    }, 400);
  }

  try {
    const apiUrl =
      `https://developers.freefirecommunity.com/api/v1/info?region=${encodeURIComponent(region)}&uid=${encodeURIComponent(uid)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": env.FF_INFO_API_KEY
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return json({
        ok: false,
        error: "PLAYER_LOOKUP_FAILED",
        status: response.status,
        details: data
      }, response.status);
    }

    return json({
      ok: true,
      player: data
    });
  } catch (error) {
    return json({
      ok: false,
      error: "PLAYER_LOOKUP_ERROR",
      message: error.message
    }, 500);
  }
}
      // Obtener imagen de avatar, banner, ropa u otros items de Free Fire
if (url.pathname === "/api/item-image" && request.method === "GET") {
  if (!env.FF_INFO_API_KEY) {
    return json({
      ok: false,
      error: "FF_INFO_API_KEY_NOT_CONFIGURED"
    }, 500);
  }

  const itemID = (url.searchParams.get("itemID") || "").trim();

  if (!/^\d+$/.test(itemID)) {
    return json({
      ok: false,
      error: "INVALID_ITEM_ID"
    }, 400);
  }

  try {
    const apiUrl =
      `https://developers.freefirecommunity.com/api/v1/image?itemID=${encodeURIComponent(itemID)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": env.FF_INFO_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();

      return json({
        ok: false,
        error: "ITEM_IMAGE_FAILED",
        status: response.status,
        details: errorText
      }, response.status);
    }

    const contentType =
      response.headers.get("content-type") || "image/png";

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        ...corsHeaders
      }
    });
  } catch (error) {
    return json({
      ok: false,
      error: "ITEM_IMAGE_ERROR",
      message: error.message
    }, 500);
  }
}
      // Comprobar que el Worker funciona
      if (url.pathname === "/") {
        return json({
          ok: true,
          service: "ZeroX SixOfFire API",
          status: "online"
        });
      }

      // Catálogo directo de SixOfFire
      if (
        url.pathname === "/api/products" &&
        request.method === "GET"
      ) {
        if (!env.SIXOFIRE_API_KEY) {
          return json({
            ok: false,
            error: "SIXOFIRE_API_KEY_NOT_CONFIGURED"
          }, 500);
        }

        const response = await fetch(
          "https://api.sixofire.net/account/shop/items",
          {
            headers: {
              "X-API-Key": env.SIXOFIRE_API_KEY,
              "Accept": "application/json"
            }
          }
        );

        const data = await response.json();

        return json(data, response.status);
      }

      // Productos configurados en ZeroX
      if (
        url.pathname === "/api/zerox-products" &&
        request.method === "GET"
      ) {
        return json({
          ok: true,
          products: PRODUCT_MAP
        });
      }
// Vista previa segura del pedido - NO compra nada
if (
  url.pathname === "/api/order/preview" &&
  request.method === "POST"
) {
  const body = await request.json();

  const productId = String(body.productId || "").trim();
  const playerId = String(body.playerId || "").trim();

  if (!productId || !playerId) {
    return json({
      ok: false,
      error: "MISSING_DATA",
      message: "Falta seleccionar el producto o ingresar el ID del jugador."
    }, 400);
  }

  const product = PRODUCT_MAP[productId];

  if (!product) {
    return json({
      ok: false,
      error: "INVALID_PRODUCT",
      message: "El producto solicitado no está configurado en ZeroX."
    }, 400);
  }

  if (!/^[0-9]+$/.test(playerId)) {
    return json({
      ok: false,
      error: "INVALID_PLAYER_ID",
      message: "El ID del jugador debe contener únicamente números."
    }, 400);
  }

  return json({
    ok: true,
    status: "PREVIEW_ONLY",
    message: "Pedido validado. No se realizó ninguna compra.",
    order: {
      zeroXProductId: productId,
      sixofireProductId: product.sixofireProductId,
      amount: product.amount,
      playerId: playerId
    }
  });
}
      // Órdenes BLOQUEADAS por seguridad
      if (
        url.pathname === "/api/order" &&
        request.method === "POST"
      ) {
        return json({
          ok: false,
          error: "ORDERS_DISABLED",
          message:
            "Las órdenes automáticas se habilitarán después de validar los pagos."
        }, 403);
      }

      return json({
        ok: false,
        error: "NOT_FOUND"
      }, 404);

    } catch (error) {
      return json({
        ok: false,
        error: "INTERNAL_ERROR",
        message: error.message
      }, 500);
    }
  }
};
// Activar despliegue automático desde GitHub
