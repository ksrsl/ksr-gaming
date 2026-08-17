export type ConsoleView = "home" | "library" | "favorites" | "share" | "system";

export type SharedConsoleState = {
  view: ConsoleView;
  selectedId: string;
  playingId: string | null;
};

type SyncEvent = "status" | "role" | "viewers" | "state";
type SyncListener = (payload: unknown) => void;

const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export class ConsoleSync {
  endpoint: string;
  room: string;
  token: string;
  enabled: boolean;
  connected = false;
  isHost = false;
  clientId = makeId();
  socket: WebSocket | null = null;
  closed = false;
  retry = 0;
  queue: string[] = [];
  listeners = new Map<SyncEvent, Set<SyncListener>>();

  constructor(endpoint: string, room: string, token: string) {
    this.endpoint = endpoint.replace(/\/$/, "");
    this.room = room;
    this.token = token;
    this.enabled = Boolean(this.endpoint && this.room && this.token);
  }

  static fromLocation(locationObject: Location) {
    const params = new URLSearchParams(locationObject.search);
    return new ConsoleSync(params.get("sync") ?? "", params.get("room") ?? "", params.get("token") ?? "");
  }

  on(event: SyncEvent, listener: SyncListener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)?.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  emit(event: SyncEvent, payload: unknown) {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }

  connect() {
    if (!this.enabled || this.closed || this.socket) return;
    const target = new URL(this.endpoint);
    target.protocol = target.protocol === "https:" ? "wss:" : "ws:";
    target.pathname = `${target.pathname.replace(/\/$/, "")}/room/${encodeURIComponent(this.room)}`;
    target.search = new URLSearchParams({ token: this.token }).toString();

    const socket = new WebSocket(target);
    this.socket = socket;
    this.emit("status", { connected: false, label: "CONNECTING" });

    socket.addEventListener("open", () => {
      this.connected = true;
      this.retry = 0;
      this.emit("status", { connected: true, label: "LIVE" });
      this.queue.splice(0).forEach((message) => socket.send(message));
    });

    socket.addEventListener("message", (event) => {
      let message: { type?: string; host?: boolean; count?: number; state?: SharedConsoleState & { _sourceId?: string } };
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (message.type === "welcome" || message.type === "role") {
        this.isHost = Boolean(message.host);
        this.emit("role", { host: this.isHost });
        if (message.state?._sourceId !== this.clientId) this.emit("state", message.state);
      } else if (message.type === "viewers") {
        this.emit("viewers", Math.max(1, Number(message.count) || 1));
      } else if (message.type === "state" && message.state?._sourceId !== this.clientId) {
        this.emit("state", message.state);
      }
    });

    const reconnect = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.connected = false;
      this.isHost = false;
      this.emit("role", { host: false });
      this.emit("status", { connected: false, label: "RECONNECTING" });
      if (!this.closed) window.setTimeout(() => this.connect(), Math.min(10000, 500 * (2 ** this.retry++)));
    };
    socket.addEventListener("close", reconnect);
    socket.addEventListener("error", () => socket.close());
  }

  publish(state: SharedConsoleState) {
    if (!this.enabled || !this.isHost) return;
    const message = JSON.stringify({ type: "state", state: { ...state, _sourceId: this.clientId } });
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      if (this.queue.length < 8) this.queue.push(message);
      return;
    }
    this.socket.send(message);
  }

  close() {
    this.closed = true;
    this.socket?.close(1000, "Console closed");
    this.socket = null;
  }
}
