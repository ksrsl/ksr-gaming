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

test("server-renders the KSR Gaming launcher", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>KSR Gaming<\/title>/i);
  assert.match(html, /KSR GAMING/);
  assert.match(html, /AUTHORIZED CATALOG/);
  assert.match(html, /SocCar/);
  assert.match(html, /Zombie Ops/);
  assert.doesNotMatch(html, /GameStation/i);
  assert.doesNotMatch(html, /CrazyGames/i);
});

test("ships the seven approved catalog entries", async () => {
  const source = await readFile(new URL("../app/KSRGaming.tsx", import.meta.url), "utf8");
  const iframeEntries = [...source.matchAll(/iframe:\s*"https:\/\//g)];

  assert.equal(iframeEntries.length, 7);
  for (const title of [
    "SocCar",
    "Prison Escape",
    "Super Star Car",
    "Riders: Downhill",
    "SkillWarz",
    "BuildNow GG",
    "Zombie Ops",
  ]) {
    assert.match(source, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("requires a player identity and presents games as a dedicated console session", async () => {
  const source = await readFile(new URL("../app/KSRGaming.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /CHOOSE YOUR/);
  assert.match(source, /ksr-gaming-username/);
  assert.match(source, /EXIT TO CONSOLE/);
  assert.match(source, /Screen Share/);
  assert.match(source, /SHARED CONSOLE SESSION/);
  assert.match(styles, /\.frame-stage\s*\{[^}]*inset:64px 0 0;/);
  assert.match(styles, /\.game-hud\s*\{[^}]*top:0;/);
  assert.match(styles, /border-radius:34px/);
});

test("ships isolated shared-console infrastructure", async () => {
  const controller = await readFile(new URL("../second-life/KSR Gaming Controller.lsl", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/console-sync.ts", import.meta.url), "utf8");
  const relay = await readFile(new URL("../sync-worker/src/index.js", import.meta.url), "utf8");

  assert.match(controller, /SYNC_URL/);
  assert.match(controller, /room=/);
  assert.match(controller, /token=/);
  assert.match(client, /class ConsoleSync/);
  assert.match(relay, /class ConsoleRoom extends DurableObject/);
  assert.match(relay, /ksr-gaming-sync/);
  assert.doesNotMatch(relay, /gameboi/i);
});
