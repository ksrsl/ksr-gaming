"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ConsoleSync, type ConsoleView, type SharedConsoleState } from "./console-sync";

type Game = {
  id: string;
  name: string;
  genre: string;
  engine: string;
  multiplayer: boolean;
  cover: string;
  background: string;
  iframe: string;
  description: string;
  controls: string;
};

const games: Game[] = [
  {
    id: "soccar",
    name: "SocCar",
    genre: "Sports",
    engine: "Unity",
    multiplayer: true,
    cover: "./games/SocCarCoverArt500.webp",
    background: "./games/SocCar.webp",
    iframe: "https://games.crazygames.com/en_US/soccar/index.html",
    description: "High-speed arena football with boost, jumps and mounted weapons.",
    controls: "WASD / ARROWS · MOUSE · SHIFT · SPACE",
  },
  {
    id: "prison-escape-lnj",
    name: "Prison Escape",
    genre: "Adventure",
    engine: "HTML5",
    multiplayer: false,
    cover: "./games/PrisonEscapeCoverArt500.webp",
    background: "./games/PrisonEscape.webp",
    iframe: "https://games.crazygames.com/en_US/prison-escape-lnj/index.html",
    description: "Outsmart the guards, solve challenges and make your way to freedom.",
    controls: "WASD · E · SPACE · MOUSE",
  },
  {
    id: "super-star-car",
    name: "Super Star Car",
    genre: "Racing",
    engine: "Unity",
    multiplayer: false,
    cover: "./games/SuperStarCarCoverArt500.webp",
    background: "./games/SuperStarCar.webp",
    iframe: "https://games.crazygames.com/en_US/super-star-car/index.html",
    description: "Build a racing career across precision circuits and upgrade your machine.",
    controls: "W / UP · A D / ARROWS · C · SPACE",
  },
  {
    id: "riders-downhill-racing",
    name: "Riders: Downhill",
    genre: "Racing",
    engine: "Unity",
    multiplayer: true,
    cover: "./games/RidersDownhillCoverArt500.webp",
    background: "./games/RidersDownhill.webp",
    iframe: "https://games.crazygames.com/en_US/riders-downhill-racing/index.html",
    description: "Race bikes, ATVs and speed boats through downhill stunt courses.",
    controls: "WASD / ARROWS · Q · E · SHIFT",
  },
  {
    id: "skillwarz",
    name: "SkillWarz",
    genre: "Shooter",
    engine: "Unity",
    multiplayer: true,
    cover: "./games/SkillWarzCoverArt500.webp",
    background: "./games/SkillWarz.webp",
    iframe: "https://games.crazygames.com/en_US/skillwarz/index.html",
    description: "A fast arena FPS with advanced movement and multiple competitive modes.",
    controls: "WASD · MOUSE · SPACE · SHIFT · R",
  },
  {
    id: "buildnow-gg",
    name: "BuildNow GG",
    genre: "Shooter",
    engine: "Unity",
    multiplayer: true,
    cover: "./games/BuildNowGGCoverArt500.webp",
    background: "./games/BuildNowGG.webp",
    iframe: "https://games.crazygames.com/en_US/buildnow-gg/index.html",
    description: "Build, aim and battle across competitive arenas and training modes.",
    controls: "WASD · MOUSE · SPACE · Q C V",
  },
  {
    id: "nzp",
    name: "Zombie Ops",
    genre: "Shooter",
    engine: "WebGL",
    multiplayer: true,
    cover: "./games/ZombieOpsCoverArt500.webp",
    background: "./games/ZombieOps.webp",
    iframe: "https://nzp.gay/",
    description: "A portable undead survival shooter built for instant browser play.",
    controls: "WASD · MOUSE · NUMBER KEYS",
  },
];

type View = ConsoleView;

type ShareState = {
  enabled: boolean;
  connected: boolean;
  isHost: boolean;
  viewers: number;
  room: string;
  label: string;
};

const bootMessages = [
  "WAKING DISPLAY CORE",
  "VERIFYING MEDIA CHANNEL",
  "SYNCING GAME CATALOG",
  "SYSTEM READY",
];

function readSavedIds(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string" && games.some((game) => game.id === id)) : [];
  } catch {
    return [];
  }
}

function useClock() {
  const [clock, setClock] = useState("--:--");
  useEffect(() => {
    const update = () => setClock(new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    update();
    const timer = window.setInterval(update, 15000);
    return () => window.clearInterval(timer);
  }, []);
  return clock;
}

export default function KSRGaming() {
  const [booting, setBooting] = useState(true);
  const [bootMessage, setBootMessage] = useState(0);
  const [view, setView] = useState<View>("home");
  const [selectedId, setSelectedId] = useState(games[0].id);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [profileDraft, setProfileDraft] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState("");
  const profileInputRef = useRef<HTMLInputElement>(null);
  const syncRef = useRef<ConsoleSync | null>(null);
  const applyingRemoteRef = useRef(false);
  const [share, setShare] = useState<ShareState>({ enabled: false, connected: false, isHost: true, viewers: 1, room: "LOCAL", label: "LOCAL" });
  const clock = useClock();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const skip = params.get("skipBoot") === "1";
    const savedStateTimer = window.setTimeout(() => {
      setFavorites(readSavedIds("ksr-gaming-favorites"));
      setRecent(readSavedIds("ksr-gaming-recent"));
      const savedUsername = window.localStorage.getItem("ksr-gaming-username")?.trim() ?? "";
      if (/^[A-Za-z0-9_]{3,24}$/.test(savedUsername)) {
        setUsername(savedUsername);
        setProfileDraft(savedUsername);
      }
      setProfileLoaded(true);
    }, 0);
    const timers = skip
      ? [window.setTimeout(() => setBooting(false), 50)]
      : [
          window.setTimeout(() => setBootMessage(1), 1150),
          window.setTimeout(() => setBootMessage(2), 2200),
          window.setTimeout(() => setBootMessage(3), 3300),
          window.setTimeout(() => setBooting(false), 4400),
        ];
    return () => {
      window.clearTimeout(savedStateTimer);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const sync = ConsoleSync.fromLocation(window.location);
    syncRef.current = sync;
    const setupTimer = window.setTimeout(() => {
      setShare((current) => ({ ...current, enabled: sync.enabled, isHost: !sync.enabled, room: sync.room || "LOCAL", label: sync.enabled ? "CONNECTING" : "LOCAL" }));
    }, 0);
    if (!sync.enabled) return () => window.clearTimeout(setupTimer);

    const removeStatus = sync.on("status", (payload) => {
      const status = payload as { connected: boolean; label: string };
      setShare((current) => ({ ...current, connected: status.connected, label: status.label }));
    });
    const removeRole = sync.on("role", (payload) => {
      const role = payload as { host: boolean };
      setShare((current) => ({ ...current, isHost: role.host }));
    });
    const removeViewers = sync.on("viewers", (payload) => {
      setShare((current) => ({ ...current, viewers: Number(payload) || 1 }));
    });
    const removeState = sync.on("state", (payload) => {
      const state = payload as SharedConsoleState | undefined;
      if (!state || !games.some((game) => game.id === state.selectedId)) return;
      applyingRemoteRef.current = true;
      setQuery("");
      setSelectedId(state.selectedId);
      setView(["home", "library", "favorites", "share", "system"].includes(state.view) ? state.view : "home");
      setPlayingId(state.playingId && games.some((game) => game.id === state.playingId) ? state.playingId : null);
      window.setTimeout(() => { applyingRemoteRef.current = false; }, 0);
    });
    sync.connect();
    return () => {
      removeStatus?.();
      removeRole?.();
      removeViewers?.();
      removeState?.();
      window.clearTimeout(setupTimer);
      sync.close();
    };
  }, []);

  useEffect(() => {
    const sync = syncRef.current;
    if (!sync?.enabled || !share.connected || !share.isHost || applyingRemoteRef.current) return;
    sync.publish({ view, selectedId, playingId });
  }, [view, selectedId, playingId, share.connected, share.isHost]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && playingId) {
        event.preventDefault();
        setPlayingId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playingId]);

  useEffect(() => {
    if (!booting && profileLoaded && !username) profileInputRef.current?.focus();
  }, [booting, profileLoaded, username]);

  const selected = games.find((game) => game.id === selectedId) ?? games[0];
  const playing = games.find((game) => game.id === playingId) ?? null;
  const visibleGames = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const base = view === "favorites" ? games.filter((game) => favorites.includes(game.id)) : games;
    if (!normalized) return base;
    return base.filter((game) => `${game.name} ${game.genre} ${game.engine}`.toLowerCase().includes(normalized));
  }, [query, view, favorites]);

  const launch = (game: Game) => {
    if (!username || (share.enabled && !share.isHost)) return;
    setSelectedId(game.id);
    setPlayingId(game.id);
    setFrameKey((value) => value + 1);
    const nextRecent = [game.id, ...recent.filter((id) => id !== game.id)].slice(0, 5);
    setRecent(nextRecent);
    window.localStorage.setItem("ksr-gaming-recent", JSON.stringify(nextRecent));
  };

  const toggleFavorite = (gameId: string) => {
    const next = favorites.includes(gameId) ? favorites.filter((id) => id !== gameId) : [...favorites, gameId];
    setFavorites(next);
    window.localStorage.setItem("ksr-gaming-favorites", JSON.stringify(next));
  };

  const selectGame = (gameId: string) => {
    if (share.enabled && !share.isHost) return;
    setSelectedId(gameId);
  };

  const powerCycle = () => {
    if (share.enabled && !share.isHost) return;
    setPlayingId(null);
    setBootMessage(0);
    setBooting(true);
    window.setTimeout(() => setBootMessage(1), 1150);
    window.setTimeout(() => setBootMessage(2), 2200);
    window.setTimeout(() => setBootMessage(3), 3300);
    window.setTimeout(() => setBooting(false), 4400);
  };

  const changeView = (next: View) => {
    if (share.enabled && !share.isHost) return;
    setView(next);
    setQuery("");
  };

  const exitGame = () => {
    if (share.enabled && !share.isHost) return;
    setPlayingId(null);
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextUsername = profileDraft.trim();
    if (!/^[A-Za-z0-9_]{3,24}$/.test(nextUsername)) {
      setProfileError("USE 3-24 LETTERS, NUMBERS OR UNDERSCORES");
      return;
    }
    window.localStorage.setItem("ksr-gaming-username", nextUsername);
    setUsername(nextUsername);
    setProfileDraft(nextUsername);
    setProfileError("");
  };

  return (
    <main className="station-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {booting && (
        <section className="boot-screen" aria-label="KSR Gaming starting">
          <div className="boot-grid" />
          <div className="boot-noise" />
          <div className="boot-scan" />
          <div className="boot-beam beam-left" />
          <div className="boot-beam beam-right" />
          <div className="boot-orbit orbit-one"><i /><i /><i /></div>
          <div className="boot-orbit orbit-two" />
          <div className="boot-core">
            <span className="boot-kicker">KSR SYSTEMS // ONLINE</span>
            <div className="boot-mark"><span>K</span><i>KG</i></div>
            <h1>KSR GAMING</h1>
            <p>PLAY BEYOND THE GRID</p>
          </div>
          <div className="boot-data boot-data-left"><b>DISPLAY</b><span>2048 × 1152</span><b>MEDIA</b><span>SECURE CHANNEL</span></div>
          <div className="boot-data boot-data-right"><b>CORE</b><span>07 TITLES</span><b>STATUS</b><span>AUTHORIZED</span></div>
          <div className="boot-progress"><span /></div>
          <div className="boot-status" key={bootMessage}>{bootMessages[bootMessage]}</div>
        </section>
      )}

      {!booting && profileLoaded && !username && (
        <section className="profile-screen" aria-label="Create KSR Gaming player profile">
          <div className="profile-grid" />
          <div className="profile-scan" />
          <form className="profile-panel" onSubmit={saveProfile}>
            <span className="profile-kicker">KSR PLAYER NETWORK // FIRST ACCESS</span>
            <div className="profile-badge">01</div>
            <h2>CHOOSE YOUR<br />USERNAME</h2>
            <p>This name identifies your KSR Gaming profile on this console.</p>
            <label className={profileError ? "profile-input error" : "profile-input"}>
              <span>PLAYER_</span>
              <input
                value={profileDraft}
                ref={profileInputRef}
                onChange={(event) => { setProfileDraft(event.target.value); setProfileError(""); }}
                placeholder="USERNAME"
                aria-label="KSR Gaming username"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={24}
              />
              <i>{String(profileDraft.length).padStart(2, "0")}/24</i>
            </label>
            <div className="profile-error">{profileError || "LETTERS // NUMBERS // UNDERSCORES"}</div>
            <button className="profile-confirm" type="submit">INITIALIZE PLAYER <span>→</span></button>
          </form>
        </section>
      )}

      {playing ? (
        <section className="player-shell">
          <div className="game-hud" aria-label="KSR game controls">
            <div className="game-hud-identity">
              <span>KSR // {username.toUpperCase()}</span>
              <strong>{playing.name}</strong>
            </div>
            <div className="game-hud-controls">
              <button onClick={() => setFrameKey((value) => value + 1)}>RELOAD</button>
              <span className={`share-chip ${share.connected ? "live" : ""}`}>{share.enabled ? `${share.viewers} SCREEN${share.viewers === 1 ? "" : "S"} // ${share.isHost ? "HOST" : "VIEW"}` : "LOCAL PLAY"}</span>
              <button className="game-hud-exit" onClick={exitGame} disabled={share.enabled && !share.isHost}>EXIT TO CONSOLE</button>
            </div>
          </div>
          <div className="frame-stage">
            <div className="frame-loader"><span /><p>OPENING {playing.name.toUpperCase()}</p></div>
            <iframe
              key={`${playing.id}-${frameKey}`}
              title={playing.name}
              src={playing.iframe}
              allow="autoplay; fullscreen; gamepad; clipboard-write"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </section>
      ) : (
        <>
          <header className="topbar">
            <button className="brand" onClick={() => changeView("home")} aria-label="KSR Gaming home">
              <span className="brand-box">K</span><span className="brand-type"><strong>KSR GAMING</strong><small>PLAY BEYOND</small></span>
            </button>
            <label className="search-box">
              <span>⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SEARCH CATALOG" aria-label="Search games" disabled={share.enabled && !share.isHost} />
              <kbd>/</kbd>
            </label>
            <div className="top-status"><span className={`status-dot ${share.connected ? "shared" : ""}`} /><span>{share.enabled ? `${share.viewers} CONNECTED` : `PLAYER ${username.toUpperCase()}`}</span><b>{clock}</b><button onClick={powerCycle} title="Replay power-on sequence" disabled={share.enabled && !share.isHost}>⏻</button></div>
          </header>

          <aside className="nav-rail">
            <button className={`nav-item ${view === "home" ? "active" : ""}`} onClick={() => changeView("home")} disabled={share.enabled && !share.isHost}><span className="nav-icon">⌂</span><small>Home</small></button>
            <button className={`nav-item ${view === "library" ? "active" : ""}`} onClick={() => changeView("library")} disabled={share.enabled && !share.isHost}><span className="nav-icon">▦</span><small>Library</small></button>
            <button className={`nav-item ${view === "favorites" ? "active" : ""}`} onClick={() => changeView("favorites")} disabled={share.enabled && !share.isHost}><span className="nav-icon">♡</span><small>Favorites</small><b>{favorites.length}</b></button>
            <button className={`nav-item ${view === "share" ? "active" : ""}`} onClick={() => changeView("share")} disabled={share.enabled && !share.isHost}><span className="nav-icon">◉</span><small>Screen Share</small></button>
            <button className={`nav-item ${view === "system" ? "active" : ""}`} onClick={() => changeView("system")} disabled={share.enabled && !share.isHost}><span className="nav-icon">⚙</span><small>System</small></button>
            <div className="rail-footer"><span>MEDIA CORE</span><strong>v0.3</strong><i /></div>
          </aside>

          <section className="dashboard">
            {view === "home" && !query && (
              <>
                <div className="hero-panel">
                  <img key={selected.background} src={selected.background} alt={selected.name} />
                  <div className="hero-shade" />
                  <div className="hero-copy">
                    <span className="eyebrow">FEATURED{" // "}{selected.multiplayer ? "MULTIPLAYER" : "SOLO"}{" // "}{selected.engine}</span>
                    <h2>{selected.name}</h2>
                    <p>{selected.description}</p>
                    <div className="hero-actions">
                      <button className="play-button" onClick={() => launch(selected)}><span>▶</span> PLAY NOW</button>
                      <button className={`favorite-button ${favorites.includes(selected.id) ? "saved" : ""}`} onClick={() => toggleFavorite(selected.id)} aria-label="Toggle favorite">{favorites.includes(selected.id) ? "★" : "☆"}</button>
                    </div>
                  </div>
                  <div className="hero-index">{String(games.findIndex((game) => game.id === selected.id) + 1).padStart(2, "0")} / {String(games.length).padStart(2, "0")}</div>
                  <div className="hero-pips">{games.map((game) => <button key={game.id} className={game.id === selected.id ? "active" : ""} onClick={() => selectGame(game.id)} aria-label={`Feature ${game.name}`} disabled={share.enabled && !share.isHost} />)}</div>
                </div>

                <div className="section-heading"><div><span>AUTHORIZED CATALOG</span><h3>Ready to play</h3></div><button onClick={() => changeView("library")}>VIEW ALL <b>→</b></button></div>
                <GameGrid entries={games.slice(0, 4)} selectedId={selectedId} favorites={favorites} onSelect={selectGame} onLaunch={launch} onFavorite={toggleFavorite} compact />
              </>
            )}

            {(view === "library" || view === "favorites" || query) && (
              <div className="catalog-view">
                <div className="catalog-heading">
                  <span>{query ? "SEARCH RESULTS" : view === "favorites" ? "PERSONAL COLLECTION" : "AUTHORIZED CATALOG"}</span>
                  <h2>{query ? `Results for “${query}”` : view === "favorites" ? "Favorites" : "Game Library"}</h2>
                  <p>{visibleGames.length} {visibleGames.length === 1 ? "title" : "titles"} available</p>
                </div>
                {visibleGames.length ? (
                  <GameGrid entries={visibleGames} selectedId={selectedId} favorites={favorites} onSelect={selectGame} onLaunch={launch} onFavorite={toggleFavorite} />
                ) : (
                  <div className="empty-state"><b>NO SIGNAL</b><p>No matching games found in this collection.</p><button onClick={() => { setQuery(""); setView("library"); }}>RETURN TO LIBRARY</button></div>
                )}
              </div>
            )}

            {view === "system" && !query && (
              <div className="system-view">
                <div className="catalog-heading"><span>CONSOLE CONTROL</span><h2>System</h2><p>Second Life media runtime</p></div>
                <div className="system-grid">
                  <div className="system-card accent"><small>CORE STATUS</small><strong>ONLINE</strong><p>All {games.length} authorized game channels are loaded into the catalog.</p><i /></div>
                  <div className="system-card"><small>DISPLAY PROFILE</small><strong>2048 × 1152</strong><p>Native 16:9 high-resolution Media-on-a-Prim profile.</p></div>
                  <div className="system-card"><small>PLAYER PROFILE</small><strong>{username.toUpperCase()}</strong><p>Active console identity stored for this viewer.</p></div>
                  <div className="system-card"><small>LOCAL COLLECTION</small><strong>{favorites.length} FAVORITES</strong><p>{recent.length ? `Recently played: ${recent.map((id) => games.find((game) => game.id === id)?.name).filter(Boolean).join(", ")}` : "No recent sessions on this viewer."}</p></div>
                  <div className="system-card power-card"><small>POWER SEQUENCE</small><strong>REPLAY STARTUP</strong><p>Run the complete KSR Gaming boot sequence again.</p><button onClick={powerCycle}>POWER CYCLE <span>⏻</span></button></div>
                </div>
              </div>
            )}

            {view === "share" && !query && (
              <div className="share-view">
                <div className="catalog-heading"><span>KSR LIVE LINK</span><h2>Screen Share</h2><p>One console. Every nearby viewer.</p></div>
                <div className="share-stage">
                  <div className="share-rings"><i /><i /><i /></div>
                  <div className="share-symbol"><span>◉</span><b>{share.connected ? "LIVE" : share.enabled ? share.label : "READY"}</b></div>
                  <div className="share-copy">
                    <span>{share.enabled ? "SHARED CONSOLE SESSION" : "SCREEN LINK STANDBY"}</span>
                    <h3>{share.enabled ? `${share.viewers} DISPLAY${share.viewers === 1 ? "" : "S"} CONNECTED` : "POWER ON FROM SECOND LIFE"}</h3>
                    <p>{share.enabled ? "The host controls the KSR dashboard, selected title, launch and exit state. Every connected media surface follows the same console session." : "The Second Life controller automatically opens a private room when the console powers on."}</p>
                  </div>
                  <div className="share-metrics">
                    <div><small>ROLE</small><strong>{share.enabled ? (share.isHost ? "HOST" : "VIEWER") : "LOCAL"}</strong></div>
                    <div><small>ROOM</small><strong>{share.room === "LOCAL" ? "—" : share.room.slice(-8).toUpperCase()}</strong></div>
                    <div><small>LINK</small><strong>{share.connected ? "SECURE" : "STANDBY"}</strong></div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function GameGrid({ entries, selectedId, favorites, onSelect, onLaunch, onFavorite, compact = false }: {
  entries: Game[];
  selectedId: string;
  favorites: string[];
  onSelect: (id: string) => void;
  onLaunch: (game: Game) => void;
  onFavorite: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`game-grid ${compact ? "compact" : ""}`}>
      {entries.map((game, index) => (
        <article className={`game-card ${selectedId === game.id ? "selected" : ""}`} key={game.id} onMouseEnter={() => onSelect(game.id)}>
          <button className="card-main" onClick={() => onLaunch(game)} aria-label={`Play ${game.name}`}>
            <img src={compact ? game.background : game.cover} alt={game.name} />
            <div className="card-glow" />
            <span className="card-play">▶</span>
            <span className="game-type">{game.multiplayer ? "MULTI" : "SOLO"}</span>
            <span className="card-copy"><small>{String(index + 1).padStart(2, "0")}{" // "}{game.genre}</small><strong>{game.name}</strong><em>{game.engine}</em></span>
          </button>
          <button className={`card-favorite ${favorites.includes(game.id) ? "saved" : ""}`} onClick={() => onFavorite(game.id)} aria-label={`Favorite ${game.name}`}>{favorites.includes(game.id) ? "★" : "☆"}</button>
        </article>
      ))}
    </div>
  );
}
