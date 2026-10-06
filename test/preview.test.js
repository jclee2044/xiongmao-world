import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.js";
import { Store } from "../server/store.js";
import { request } from "node:http";

test("local preview ports load and save while foreign hosts and origins stay blocked", async (t) => {
  const previousOrigin = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = "https://private.example.test";
  const server = createApp({ store: new Store(":memory:") });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (previousOrigin === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previousOrigin;
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  // Node fetch ignores a custom Host; use HTTP directly to emulate the proxy.
  const fetchWithHost = (url, options = {}) =>
    new Promise((resolve, reject) => {
      const req = request(url, options, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: new Headers(
              Object.entries(res.headers).map(([key, value]) => [
                key,
                Array.isArray(value) ? value.join(", ") : value,
              ]),
            ),
            text: async () => body,
            json: async () => JSON.parse(body),
          }),
        );
        res.on("error", reject);
      });
      req.on("error", reject);
      req.end(options.body);
    });
  for (const host of [
    "localhost:60424",
    "127.0.0.1:60425",
    "[::1]:60426",
    "private.example.test",
  ]) {
    const origin =
      host === "private.example.test" ? `https://${host}` : `http://${host}`;
    const page = await fetchWithHost(base, { headers: { Host: host } });
    assert.equal(page.status, 200);
    assert.match(await page.text(), /和熊猫一起走走/);
    const response = await fetchWithHost(`${base}/api/state`, {
      headers: { Host: host },
    });
    assert.equal(response.status, 200);
    const session = response.headers.get("set-cookie");
    assert.equal(session.includes("; Secure"), host === "private.example.test");
    const { state, revision } = await response.json();
    const post = (requestOrigin) =>
      fetchWithHost(`${base}/api/state`, {
        method: "POST",
        headers: {
          Host: host,
          Cookie: session.split(";")[0],
          Origin: requestOrigin,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state, revision }),
      });
    for (const foreignOrigin of [
      "https://evil.example",
      "http://localhost:60427",
      "null",
    ])
      assert.equal((await post(foreignOrigin)).status, 403);
    assert.equal((await post(origin)).status, 200);
  }
  for (const host of [
    "evil.example",
    "localhost.evil.example:60424",
    "localhost:65536",
    "localhost@evil.example:60424",
  ])
    assert.equal(
      (
        await fetchWithHost(base, {
          headers: { Host: host, "X-Forwarded-Host": "localhost:60424" },
        })
      ).status,
      403,
    );
});
