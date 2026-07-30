import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders LinguaDay with honest zero-value learning data", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /LinguaDay/);
  assert.match(html, /今日学习/);
  assert.match(html, /近 7 天学习/);
  assert.match(html, /<strong>0<\/strong> 天/);
  assert.doesNotMatch(html, /284|126|连续学习 7 天/);
});

test("ships the BBC feed, interactive settings, and install files", async () => {
  const [page, serviceWorker, feed, manifest] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../docs/bbc-news.json", import.meta.url), "utf8"),
    readFile(new URL("../docs/manifest.webmanifest", import.meta.url), "utf8"),
  ]);
  assert.match(page, /BBC News/);
  assert.match(page, /setPanel\("reminder"\)/);
  assert.match(page, /setPanel\("difficulty"\)/);
  assert.match(page, /setPanel\("accent"\)/);
  assert.match(page, /setPanel\("reader"\)/);
  assert.match(page, /api\.dictionaryapi\.dev/);
  assert.match(serviceWorker, /linguaday-v3/);
  assert.match(feed, /feeds\.bbci\.co\.uk/);
  assert.match(manifest, /LinguaDay/);
});
