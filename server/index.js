import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
import { Store } from "./store.js";
import { reply } from "./dialogue.js";
import { speechAvailable, synthesize } from "./speech.js";

const root = resolve(fileURLToPath(new URL("../public/", import.meta.url)));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};
export function createApp({
  store = new Store(process.env.DATA_DIR || resolve("data")),
  providerConfig = {},
} = {}) {
  let modelBusy = false,
    speechBusy = false;
  const rates = new Map();
  const server = createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    const json = (status, value) => {
      res.setHeader("Cache-Control", "no-store");
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify(value));
    };
    const cookie = (token) =>
      res.setHeader(
        "Set-Cookie",
        `panda_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${req.headers["x-forwarded-proto"] === "https" || (process.env.APP_ORIGIN?.startsWith("https:") && req.headers.host === new URL(process.env.APP_ORIGIN).host) ? "; Secure" : ""}`,
      );
    try {
      // Local preview proxies can forward their own ephemeral port in Host.
      const host = req.headers.host || "";
      const loopback =
        /^(localhost|127\.0\.0\.1|\[::1\])(?::([0-9]{1,5}))?$/i.exec(host);
      const localHost =
        !!loopback && (!loopback[2] || Number(loopback[2]) <= 65535);
      const configuredOrigin = process.env.APP_ORIGIN
        ? new URL(process.env.APP_ORIGIN)
        : null;
      if (!localHost && host !== configuredOrigin?.host)
        return json(403, { error: "Unrecognized host." });
      const ownOrigin = localHost
        ? new URL(`http://${host}`).origin
        : configuredOrigin.origin;
      const pathname = decodeURIComponent(
        new URL(req.url, "http://local").pathname,
      );
      if (pathname === "/api/health") {
        return json(200, {
          ok: true,
          version: "0.5.0",
          provider: providerConfig.provider || process.env.PROVIDER || "story",
          speech: speechAvailable() ? "espeak-cmn" : "unavailable",
        });
      }
      if (pathname.startsWith("/api/")) {
        const token = req.headers.cookie?.match(
          /(?:^|;\s*)panda_session=([a-f0-9]{64})(?:;|$)/,
        )?.[1];
        let identity = store.session(token);
        if (pathname === "/api/state" && req.method === "GET") {
          if (!identity) {
            const created = store.create();
            identity = created.id;
            cookie(created.token);
          }
          return json(200, { ...store.read(identity), identity });
        }
        if (!identity)
          return json(401, { error: "Open your world to start a session." });
        if (req.method !== "POST")
          return json(405, { error: "Method not supported." });
        if (req.headers.origin !== ownOrigin)
          return json(403, { error: "Use the game on its own origin." });
        if (!req.headers["content-type"]?.startsWith("application/json"))
          return json(415, { error: "JSON required." });
        const key = `${identity}:${pathname}`,
          now = Date.now(),
          old = rates.get(key) || { count: 0, since: now };
        if (now - old.since > 60000) {
          old.count = 0;
          old.since = now;
        }
        old.count++;
        rates.set(key, old);
        if (rates.size > 2000)
          for (const [k, v] of rates)
            if (now - v.since > 60000) rates.delete(k);
        if (
          old.count >
          (pathname === "/api/pair"
            ? 8
            : pathname === "/api/dialogue"
              ? 16
              : 80)
        )
          return json(429, { error: "Take a short pause, then try again." });
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 64000) return json(413, { error: "Request too large." });
          chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (pathname === "/api/state") {
          if (!Number.isSafeInteger(body.revision) || body.revision < 0)
            return json(400, { error: "Invalid save version." });
          const saved = store.save(identity, body.revision, body.state);
          return saved
            ? json(200, saved)
            : json(409, {
                error: "Another device has newer progress.",
                ...store.read(identity),
              });
        }
        if (pathname === "/api/pair-code")
          return json(200, { code: store.pairCode(identity), expiresIn: 300 });
        if (pathname === "/api/pair") {
          const next = store.redeem(body.code);
          if (!next)
            return json(400, {
              error: "Code expired, already used, or incorrect.",
            });
          cookie(next);
          return json(200, { ok: true });
        }
        if (pathname === "/api/dialogue") {
          if (modelBusy)
            return json(429, {
              error:
                "Panda is listening to another conversation. Please try again shortly.",
            });
          modelBusy = true;
          const controller = new AbortController();
          res.on("close", () => {
            if (!res.writableEnded) controller.abort();
          });
          try {
            return json(
              200,
              await reply(
                body.npcId,
                body.text,
                body.history || [],
                store.read(identity).state,
                {
                  ...providerConfig,
                  signal: AbortSignal.any([
                    controller.signal,
                    AbortSignal.timeout(60000),
                  ]),
                },
              ),
            );
          } finally {
            modelBusy = false;
          }
        }
        if (pathname === "/api/speech") {
          if (speechBusy)
            return json(429, { error: "Speech is busy. Please try again." });
          speechBusy = true;
          try {
            const wav = await synthesize(body.text, body.slow === true);
            res.writeHead(200, {
              "Content-Type": "audio/wav",
              "Cache-Control": "no-store",
            });
            return res.end(wav);
          } finally {
            speechBusy = false;
          }
        }
        return json(404, { error: "Not available." });
      }
      if (req.method !== "GET") {
        res.writeHead(405);
        return res.end();
      }
      const path = resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!path.startsWith(root + sep)) {
        res.writeHead(403);
        return res.end();
      }
      const body = await readFile(path);
      res.setHeader(
        "Content-Type",
        types[extname(path)] || "application/octet-stream",
      );
      res.setHeader("Cache-Control", "no-cache");
      res.end(body);
    } catch (e) {
      if (!res.headersSent)
        json(e.code === "ENOENT" ? 404 : 400, {
          error: "That request could not be completed. Please try again.",
        });
      else res.end();
    }
  });
  server.on("close", () => store.close());
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createApp();
  server.on("error", (e) => {
    console.error(
      e.code === "EADDRINUSE"
        ? "Port is already in use. Choose PORT in .env."
        : `Server could not start: ${e.code}`,
    );
    process.exitCode = 1;
  });
  server.listen(
    Number(process.env.PORT || 3210),
    process.env.HOST || "127.0.0.1",
    () =>
      console.log(
        `Panda’s Little World: http://${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 3210}`,
      ),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => server.close(() => process.exit(0)));
}
