import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "./worker.js";

const request = (path, method = "GET") =>
  new Request("https://zerox.example" + path, { method });

test("existing order endpoint stays disabled", async () => {
  const response = await worker.fetch(request("/api/order", "POST"), {});
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, "ORDERS_DISABLED");
});

test("catalog cannot publish without storage bindings", async () => {
  const publicResponse = await worker.fetch(request("/api/catalog/products?section=accounts"), {});
  assert.equal(publicResponse.status, 503);
  const adminResponse = await worker.fetch(request("/api/admin/catalog/products"), {});
  assert.equal(adminResponse.status, 503);
  const mediaResponse = await worker.fetch(request("/api/catalog/media/00000000-0000-0000-0000-000000000000.jpg"), {});
  assert.equal(mediaResponse.status, 503);
});
