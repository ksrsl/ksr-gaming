import { DurableObject } from "cloudflare:workers";
/* global WebSocketPair, WebSocketRequestResponsePair */

const ALLOWED_ORIGINS = new Set([
  "https://ksrsl.github.io",
  "https://ksr-gaming.felix-bruno-c.chatgpt.site",
  "http://127.0.0.1:3000",
  "http://localhost:3000"
]);
const ROOM_PATTERN = /^[a-z0-9][a-z0-9_-]{7,79}$/i;
const TOKEN_PATTERN = /^[a-f0-9]{20,64}$/i;
const VIEWS = new Set(["home", "library", "favorites", "share", "system"]);
const GAME_IDS = new Set(["soccar", "prison-escape-lnj", "super-star-car", "riders-downhill-racing", "skillwarz", "buildnow-gg", "nzp"]);
const MAX_VIEWERS = 32;
const MAX_MESSAGE_BYTES = 4096;

function requestOrigin(request) {
  return request.headers.get("Origin") || "";
}

function json(value, status = 200, origin = "https://ksrsl.github.io") {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      Vary: "Origin"
    }
  });
}

function openSockets(ctx) {
  return ctx.getWebSockets().filter((socket) => socket.readyState === WebSocket.OPEN);
}

function attachment(socket) {
  return socket.deserializeAttachment() || {};
}

function validState(value) {
  if (!value || typeof value !== "object") return null;
  const view = String(value.view || "");
  const selectedId = String(value.selectedId || "");
  const playingId = value.playingId === null ? null : String(value.playingId || "");
  const sourceId = String(value._sourceId || "").slice(0, 96);
  if (!VIEWS.has(view) || !GAME_IDS.has(selectedId) || (playingId !== null && !GAME_IDS.has(playingId))) return null;
  return { view, selectedId, playingId, _sourceId: sourceId };
}

export class ConsoleRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.lastState = null;
    this.ctx.blockConcurrencyWhile(async () => {
      this.lastState = await this.ctx.storage.get("lastState") || null;
    });
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  hostSocket() {
    return openSockets(this.ctx).sort((left, right) => {
      const a = attachment(left);
      const b = attachment(right);
      if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
      return String(a.id).localeCompare(String(b.id));
    })[0] || null;
  }

  safeSend(socket, value) {
    try {
      if (socket.readyState === WebSocket.OPEN) socket.send(typeof value === "string" ? value : JSON.stringify(value));
    } catch {
      // A disconnected viewer is removed by the close/error handler.
    }
  }

  broadcast(value) {
    const message = JSON.stringify(value);
    openSockets(this.ctx).forEach((socket) => this.safeSend(socket, message));
  }

  refreshPresence() {
    const sockets = openSockets(this.ctx);
    const host = this.hostSocket();
    sockets.forEach((socket) => {
      this.safeSend(socket, { type: "viewers", count: sockets.length });
      this.safeSend(socket, { type: "role", host: socket === host, state: this.lastState });
    });
  }

  async fetch(request) {
    if ((request.headers.get("Upgrade") || "").toLowerCase() !== "websocket") return json({ ok: false, error: "EXPECTED_WEBSOCKET" }, 426, requestOrigin(request) || undefined);
    if (openSockets(this.ctx).length >= MAX_VIEWERS) return json({ ok: false, error: "ROOM_FULL" }, 503, requestOrigin(request) || undefined);

    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id: crypto.randomUUID(), joinedAt: Date.now(), windowStartedAt: Date.now(), messagesInWindow: 0 });
    this.safeSend(server, { type: "welcome", host: server === this.hostSocket(), state: this.lastState });
    this.refreshPresence();
    return new Response(null, { status: 101, webSocket: client });
  }

  rateAllowed(socket) {
    const state = attachment(socket);
    const now = Date.now();
    if (!state.windowStartedAt || now - state.windowStartedAt >= 1000) {
      state.windowStartedAt = now;
      state.messagesInWindow = 0;
    }
    state.messagesInWindow += 1;
    socket.serializeAttachment(state);
    return state.messagesInWindow <= 24;
  }

  async webSocketMessage(socket, rawMessage) {
    if (typeof rawMessage !== "string" || rawMessage.length > MAX_MESSAGE_BYTES) {
      socket.close(1009, "Message too large");
      return;
    }
    if (!this.rateAllowed(socket)) {
      socket.close(1008, "Rate limit exceeded");
      return;
    }
    if (socket !== this.hostSocket()) return;

    let message;
    try { message = JSON.parse(rawMessage); } catch { return; }
    if (message?.type !== "state") return;
    const state = validState(message.state);
    if (!state) return;
    await this.ctx.storage.put("lastState", state);
    this.lastState = state;
    this.broadcast({ type: "state", state });
  }

  async webSocketClose(socket, code, reason) {
    try { socket.close(code, reason); } catch {
      // The connection may already be closed.
    }
    this.refreshPresence();
  }

  async webSocketError(socket) {
    try { socket.close(1011, "Connection error"); } catch {
      // The connection may already be closed.
    }
    this.refreshPresence();
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = requestOrigin(request);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ ok: false, error: "ORIGIN_NOT_ALLOWED" }, 403);
    if (request.method === "GET" && url.pathname === "/v1/health") return json({ ok: true, service: "ksr-gaming-sync", protocol: 1 }, 200, origin || undefined);
    if (request.method !== "GET" || !url.pathname.startsWith("/room/")) return json({ ok: false, error: "NOT_FOUND" }, 404, origin || undefined);
    if ((request.headers.get("Upgrade") || "").toLowerCase() !== "websocket") return json({ ok: false, error: "EXPECTED_WEBSOCKET" }, 426, origin || undefined);

    const room = decodeURIComponent(url.pathname.slice("/room/".length));
    const token = url.searchParams.get("token") || "";
    if (!ROOM_PATTERN.test(room) || !TOKEN_PATTERN.test(token)) return json({ ok: false, error: "INVALID_ROOM" }, 400, origin || undefined);
    return env.ROOMS.getByName(`${room}:${token}`).fetch(request);
  }
};
