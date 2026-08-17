import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const endpoint = process.env.KSR_SYNC_ENDPOINT ?? "https://ksr-gaming-sync.ksr-hstn-ai-9ca1.workers.dev";
const room = `test-${randomBytes(10).toString("hex")}`;
const token = randomBytes(20).toString("hex");
const socketUrl = new URL(`${endpoint.replace(/^http/, "ws")}/room/${room}`);
socketUrl.searchParams.set("token", token);

function connect() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(socketUrl);
    const messages = [];
    const timer = setTimeout(() => reject(new Error("Relay connection timed out")), 10000);
    socket.addEventListener("message", (event) => messages.push(JSON.parse(String(event.data))));
    socket.addEventListener("error", () => reject(new Error("Relay connection failed")));
    socket.addEventListener("open", () => {
      clearTimeout(timer);
      resolve({ socket, messages });
    });
  });
}

function waitFor(messages, predicate) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const found = messages.find(predicate);
      if (found) {
        clearInterval(timer);
        resolve(found);
      } else if (Date.now() - started > 10000) {
        clearInterval(timer);
        reject(new Error("Expected relay message was not received"));
      }
    }, 25);
  });
}

const health = await fetch(`${endpoint}/v1/health`).then((response) => response.json());
assert.equal(health.ok, true);
assert.equal(health.service, "ksr-gaming-sync");

const host = await connect();
await waitFor(host.messages, (message) => message.type === "welcome" && message.host === true);
const viewer = await connect();
await waitFor(viewer.messages, (message) => message.type === "role" && message.host === false);
await waitFor(host.messages, (message) => message.type === "viewers" && message.count === 2);

const state = { view: "home", selectedId: "super-star-car", playingId: "super-star-car", _sourceId: "relay-test" };
host.socket.send(JSON.stringify({ type: "state", state }));
const relayed = await waitFor(viewer.messages, (message) => message.type === "state" && message.state?._sourceId === "relay-test");
assert.deepEqual(relayed.state, state);

host.socket.close(1000, "Test complete");
viewer.socket.close(1000, "Test complete");
console.log("KSR Gaming relay health, presence, host authority, and shared state passed.");
