import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.js";
import { Store } from "../server/store.js";

test("localhost startup, assets, health and static-root isolation", async (t) => {
  const server = createApp({ store: new Store(":memory:") });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal(
    (await fetch(base + "/api/health").then((r) => r.json())).ok,
    true,
  );
  const welcome = await fetch(base);
  assert.equal(welcome.status, 200);
  assert.match(await welcome.text(), /熊猫世界/);
  const png = await fetch(base + "/assets/panda.png");
  assert.equal(png.headers.get("content-type"), "image/png");
  assert.ok((await png.arrayBuffer()).byteLength > 10000);
  assert.equal((await fetch(base + "/.env")).status, 404);
  assert.equal((await fetch(base + "/%2e%2e%2fserver/index.js")).status, 403);
});
