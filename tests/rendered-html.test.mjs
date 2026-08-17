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
  assert.match(html, /SELECT A TITLE/);
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

  assert.match(source, /Choose the username/);
  assert.match(source, /ksr-gaming-username/);
  assert.match(source, /console-tabs/);
  assert.match(source, /game-strip/);
  assert.match(source, /slide-/);
  assert.match(source, /addEventListener\("pointerdown", focusMediaWindow, true\)/);
  assert.match(source, /iframeRef\.current\?\.focus/);
  assert.doesNotMatch(source, /Screen Share|SHARED CONSOLE SESSION|CONNECTED DISPLAY/i);
  assert.match(styles, /\.frame-stage\s*\{[^}]*position:absolute;[^}]*inset:0;/);
  assert.match(styles, /\.game-hud\s*\{[^}]*top:16px;/);
  assert.match(styles, /@media \(min-width:1400px\) and \(min-height:800px\)/);
});

test("ships isolated shared-console infrastructure", async () => {
  const controller = await readFile(new URL("../second-life/KSR Gaming Controller.lsl", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/console-sync.ts", import.meta.url), "utf8");
  const relay = await readFile(new URL("../sync-worker/src/index.js", import.meta.url), "utf8");

  assert.match(controller, /SYNC_URL/);
  assert.match(controller, /room=/);
  assert.match(controller, /token=/);
  assert.match(controller, /AUTO_RESOLUTION = TRUE/);
  assert.match(controller, /MAX_MEDIA_PIXELS = 2048/);
  assert.match(controller, /PRIM_MEDIA_CONTROLS_NONE/);
  assert.match(controller, /PRIM_MEDIA_FIRST_CLICK_INTERACT, TRUE/);
  assert.match(controller, /llSetTimerEvent\(2\.0\)/);
  assert.match(client, /class ConsoleSync/);
  assert.doesNotMatch(client, /viewers/);
  assert.match(relay, /class ConsoleRoom extends DurableObject/);
  assert.match(relay, /ksr-gaming-sync/);
  assert.doesNotMatch(relay, /type: "viewers"/);
  assert.doesNotMatch(relay, /gameboi/i);
});
