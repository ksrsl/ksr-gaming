"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ConsoleSync, type ConsoleView, type SharedConsoleState } from "./console-sync";

type Game = {
  id: string;
  name: string;
  genre: string;
  engine: string;
  multiplayer: boolean;
  cover: string;
  thumb: string;
  background: string;
  iframe: string;
  description: string;
  controls: string;
};

const games: Game[] = [
  { id: "soccar", name: "SocCar", genre: "Sports", engine: "Unity", multiplayer: true, cover: "./games/SocCarCoverArt500.webp", thumb: "./games/thumbs/SocCar.webp", background: "./games/SocCar.webp", iframe: "https://games.crazygames.com/en_US/soccar/index.html", description: "High-speed arena football with boost, jumps and mounted weapons.", controls: "WASD / ARROWS · MOUSE · SHIFT · SPACE" },
  { id: "prison-escape-lnj", name: "Prison Escape", genre: "Adventure", engine: "HTML5", multiplayer: false, cover: "./games/PrisonEscapeCoverArt500.webp", thumb: "./games/thumbs/PrisonEscape.webp", background: "./games/PrisonEscape.webp", iframe: "https://games.crazygames.com/en_US/prison-escape-lnj/index.html", description: "Outsmart the guards, solve challenges and make your way to freedom.", controls: "WASD · E · SPACE · MOUSE" },
  { id: "super-star-car", name: "Super Star Car", genre: "Racing", engine: "Unity", multiplayer: false, cover: "./games/SuperStarCarCoverArt500.webp", thumb: "./games/thumbs/SuperStarCar.webp", background: "./games/SuperStarCar.webp", iframe: "https://games.crazygames.com/en_US/super-star-car/index.html", description: "Build a racing career across precision circuits and upgrade your machine.", controls: "W / UP · A D / ARROWS · C · SPACE" },
  { id: "riders-downhill-racing", name: "Riders: Downhill", genre: "Racing", engine: "Unity", multiplayer: true, cover: "./games/RidersDownhillCoverArt500.webp", thumb: "./games/thumbs/RidersDownhill.webp", background: "./games/RidersDownhill.webp", iframe: "https://games.crazygames.com/en_US/riders-downhill-racing/index.html", description: "Race bikes, ATVs and speed boats through downhill stunt courses.", controls: "WASD / ARROWS · Q · E · SHIFT" },
  { id: "skillwarz", name: "SkillWarz", genre: "Shooter", engine: "Unity", multiplayer: true, cover: "./games/SkillWarzCoverArt500.webp", thumb: "./games/thumbs/SkillWarz.webp", background: "./games/SkillWarz.webp", iframe: "https://games.crazygames.com/en_US/skillwarz/index.html", description: "A fast arena FPS with advanced movement and multiple competitive modes.", controls: "WASD · MOUSE · SPACE · SHIFT · R" },
  { id: "buildnow-gg", name: "BuildNow GG", genre: "Shooter", engine: "Unity", multiplayer: true, cover: "./games/BuildNowGGCoverArt500.webp", thumb: "./games/thumbs/BuildNowGG.webp", background: "./games/BuildNowGG.webp", iframe: "https://games.crazygames.com/en_US/buildnow-gg/index.html", description: "Build, aim and battle across competitive arenas and training modes.", controls: "WASD · MOUSE · SPACE · Q C V" },
  { id: "nzp", name: "Zombie Ops", genre: "Shooter", engine: "WebGL", multiplayer: true, cover: "./games/ZombieOpsCoverArt500.webp", thumb: "./games/thumbs/ZombieOps.webp", background: "./games/ZombieOps.webp", iframe: "https://nzp.gay/", description: "A portable undead survival shooter built for instant browser play.", controls: "WASD · MOUSE · NUMBER KEYS" },
];

const tabs: Array<{ id: ConsoleView; icon: string; label: string }> = [
  { id: "home", icon: "◉", label: "Games" },
  { id: "library", icon: "▦", label: "Library" },
  { id: "favorites", icon: "♡", label: "Favorites" },
  { id: "system", icon: "⚙", label: "System" },
];

const bootMessages = ["WAKING DISPLAY CORE", "CALIBRATING SCREEN", "SYNCING GAME CATALOG", "SYSTEM READY"];

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
    const update = () => setClock(new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date()));
    update();
    const timer = window.setInterval(update, 15000);
    return () => window.clearInterval(timer);
  }, []);
  return clock;
}

export default function KSRGaming() {
  const [booting, setBooting] = useState(true);
  const [bootMessage, setBootMessage] = useState(0);
  const [view, setView] = useState<ConsoleView>("home");
  const [slideDirection, setSlideDirection] = useState<"forward" | "back">("forward");
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
  const [mediaMode, setMediaMode] = useState(false);
  const [relay, setRelay] = useState({ enabled: false, connected: false, isHost: true });
  const profileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const syncRef = useRef<ConsoleSync | null>(null);
  const applyingRemoteRef = useRef(false);
  const clock = useClock();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const skip = params.get("skipBoot") === "1";
    const isMediaSurface = params.get("sl") === "1";
    const mediaModeTimer = window.setTimeout(() => setMediaMode(isMediaSurface), 0);
    const savedStateTimer = window.setTimeout(() => {
      setFavorites(readSavedIds("ksr-gaming-favorites"));
      setRecent(readSavedIds("ksr-gaming-recent"));
      const savedUsername = window.localStorage.getItem("ksr-gaming-username")?.trim() ?? "";
      if (/^[A-Za-z0-9_]{3,24}$/.test(savedUsername)) { setUsername(savedUsername); setProfileDraft(savedUsername); }
      setProfileLoaded(true);
    }, 0);
    const bootTiming = isMediaSurface ? [600, 1200, 1800, 2450] : [1150, 2200, 3300, 4400];
    const timers = skip ? [window.setTimeout(() => setBooting(false), 50)] : [window.setTimeout(() => setBootMessage(1), bootTiming[0]), window.setTimeout(() => setBootMessage(2), bootTiming[1]), window.setTimeout(() => setBootMessage(3), bootTiming[2]), window.setTimeout(() => setBooting(false), bootTiming[3])];
    return () => { window.clearTimeout(mediaModeTimer); window.clearTimeout(savedStateTimer); timers.forEach((timer) => window.clearTimeout(timer)); };
  }, []);

  useEffect(() => {
    const sync = ConsoleSync.fromLocation(window.location);
    syncRef.current = sync;
    const setupTimer = window.setTimeout(() => setRelay({ enabled: sync.enabled, connected: false, isHost: !sync.enabled }), 0);
    if (!sync.enabled) return () => window.clearTimeout(setupTimer);
    const removeStatus = sync.on("status", (payload) => { const status = payload as { connected: boolean }; setRelay((current) => ({ ...current, connected: status.connected })); });
    const removeRole = sync.on("role", (payload) => { const role = payload as { host: boolean }; setRelay((current) => ({ ...current, isHost: role.host })); });
    const removeState = sync.on("state", (payload) => {
      const state = payload as SharedConsoleState | undefined;
      if (!state || !games.some((game) => game.id === state.selectedId)) return;
      applyingRemoteRef.current = true;
      setQuery("");
      setSelectedId(state.selectedId);
      setView(["home", "library", "favorites", "system"].includes(state.view) ? state.view : "home");
      setPlayingId(state.playingId && games.some((game) => game.id === state.playingId) ? state.playingId : null);
      window.setTimeout(() => { applyingRemoteRef.current = false; }, 0);
    });
    sync.connect();
    return () => { removeStatus?.(); removeRole?.(); removeState?.(); window.clearTimeout(setupTimer); sync.close(); };
  }, []);

  useEffect(() => {
    const sync = syncRef.current;
    if (!sync?.enabled || !relay.connected || !relay.isHost || applyingRemoteRef.current) return;
    const timer = window.setTimeout(() => sync.publish({ view, selectedId, playingId }), mediaMode ? 80 : 20);
    return () => window.clearTimeout(timer);
  }, [view, selectedId, playingId, relay.connected, relay.isHost, mediaMode]);

  useEffect(() => { if (!booting && profileLoaded && !username) profileInputRef.current?.focus(); }, [booting, profileLoaded, username]);

  useEffect(() => {
    if (!playingId) return;
    const timer = window.setTimeout(() => iframeRef.current?.focus(), 300);
    return () => window.clearTimeout(timer);
  }, [playingId, frameKey]);

  const selected = games.find((game) => game.id === selectedId) ?? games[0];
  const playing = games.find((game) => game.id === playingId) ?? null;
  const visibleGames = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const base = view === "favorites" ? games.filter((game) => favorites.includes(game.id)) : games;
    return normalized ? base.filter((game) => `${game.name} ${game.genre} ${game.engine}`.toLowerCase().includes(normalized)) : base;
  }, [query, view, favorites]);
  const canControl = !relay.enabled || relay.isHost;

  const launch = (game: Game) => {
    if (!username || !canControl) return;
    setSelectedId(game.id); setPlayingId(game.id); setFrameKey((value) => value + 1);
    const nextRecent = [game.id, ...recent.filter((id) => id !== game.id)].slice(0, 5);
    setRecent(nextRecent); window.localStorage.setItem("ksr-gaming-recent", JSON.stringify(nextRecent));
  };

  const selectGame = (gameId: string) => { if (canControl) setSelectedId(gameId); };
  const toggleFavorite = (gameId: string) => { const next = favorites.includes(gameId) ? favorites.filter((id) => id !== gameId) : [...favorites, gameId]; setFavorites(next); window.localStorage.setItem("ksr-gaming-favorites", JSON.stringify(next)); };
  const changeView = (next: ConsoleView) => {
    if (!canControl) return;
    const currentIndex = tabs.findIndex((tab) => tab.id === view); const nextIndex = tabs.findIndex((tab) => tab.id === next);
    setSlideDirection(nextIndex >= currentIndex ? "forward" : "back"); setView(next); setQuery("");
  };
  const handleTabKeys = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    event.stopPropagation();
    const currentIndex = tabs.findIndex((tab) => tab.id === view); const step = event.key === "ArrowRight" ? 1 : -1; const next = tabs[(currentIndex + step + tabs.length) % tabs.length];
    changeView(next.id); window.setTimeout(() => document.getElementById(`tab-${next.id}`)?.focus(), 0);
  };
  const handleConsoleKeys = (event: { key: string; target: EventTarget | null; preventDefault: () => void }) => {
    if (!canControl || event.target instanceof HTMLInputElement || playing) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const entries = view === "favorites" ? games.filter((game) => favorites.includes(game.id)) : visibleGames;
      if (!entries.length) return;
      event.preventDefault();
      const currentIndex = Math.max(0, entries.findIndex((game) => game.id === selectedId));
      const step = event.key === "ArrowRight" ? 1 : -1;
      setSelectedId(entries[(currentIndex + step + entries.length) % entries.length].id);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const currentIndex = tabs.findIndex((tab) => tab.id === view);
      const step = event.key === "ArrowDown" ? 1 : -1;
      changeView(tabs[(currentIndex + step + tabs.length) % tabs.length].id);
    } else if (event.key === "Enter" && (view === "home" || view === "library" || view === "favorites")) {
      event.preventDefault();
      launch(selected);
    }
  };
  useEffect(() => {
    const focusMediaWindow = () => window.focus();
    const routeKeyboard = (event: globalThis.KeyboardEvent) => handleConsoleKeys(event);
    window.addEventListener("pointerdown", focusMediaWindow, true);
    window.addEventListener("keydown", routeKeyboard);
    return () => {
      window.removeEventListener("pointerdown", focusMediaWindow, true);
      window.removeEventListener("keydown", routeKeyboard);
    };
  });
  const powerCycle = () => {
    if (!canControl) return;
    setPlayingId(null); setBootMessage(0); setBooting(true);
    const timing = mediaMode ? [600, 1200, 1800, 2450] : [1150, 2200, 3300, 4400];
    window.setTimeout(() => setBootMessage(1), timing[0]); window.setTimeout(() => setBootMessage(2), timing[1]); window.setTimeout(() => setBootMessage(3), timing[2]); window.setTimeout(() => setBooting(false), timing[3]);
  };
  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const nextUsername = profileDraft.trim();
    if (!/^[A-Za-z0-9_]{3,24}$/.test(nextUsername)) { setProfileError("USE 3-24 LETTERS, NUMBERS OR UNDERSCORES"); return; }
    window.localStorage.setItem("ksr-gaming-username", nextUsername); setUsername(nextUsername); setProfileDraft(nextUsername); setProfileError("");
  };

  return (
    <main className={mediaMode ? "station-shell media-mode" : "station-shell"}>
      {booting && <section className="boot-screen" aria-label="KSR Gaming starting"><div className="boot-glow" /><div className="boot-ring ring-one" /><div className="boot-ring ring-two" /><div className="boot-core"><div className="boot-mark"><img src="./ksr-logo.png" alt="KSR" draggable={false} /></div><span>KSR SYSTEMS</span><h1>GAMING</h1><p>PLAY BEYOND</p></div><div className="boot-progress"><i /></div><div className="boot-status" key={bootMessage}>{bootMessages[bootMessage]}</div></section>}

      {!booting && profileLoaded && !username && <section className="profile-screen" aria-label="Create KSR Gaming player profile"><div className="profile-aura" /><form className="profile-panel" onSubmit={saveProfile}><div className="profile-icon"><img src="./ksr-logo.png" alt="KSR" draggable={false} /></div><span>WELCOME TO</span><h2>KSR GAMING</h2><p>Choose the username that will identify this player profile.</p><label className={profileError ? "profile-input error" : "profile-input"}><input value={profileDraft} ref={profileInputRef} onChange={(event) => { setProfileDraft(event.target.value); setProfileError(""); }} placeholder="Enter username" aria-label="KSR Gaming username" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={24} /></label><div className="profile-error">{profileError || "LETTERS · NUMBERS · UNDERSCORES"}</div><button className="profile-confirm" type="submit">CONTINUE</button></form></section>}

      {playing ? <section className="player-shell"><div className="frame-stage"><div className="frame-loader"><span /><p>OPENING {playing.name.toUpperCase()}</p></div><iframe ref={iframeRef} role="application" key={`${playing.id}-${frameKey}`} title={playing.name} src={playing.iframe} allow="autoplay; fullscreen; gamepad; clipboard-write" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onLoad={() => window.setTimeout(() => iframeRef.current?.focus(), 120)} onMouseEnter={() => iframeRef.current?.focus()} onPointerDown={() => iframeRef.current?.focus()} /></div><div className="game-hud" aria-label="KSR game controls"><div className="game-hud-identity"><span><img src="./ksr-logo.png" alt="" draggable={false} /></span><strong>{playing.name}</strong></div><div className="game-hud-controls"><button onClick={() => setFrameKey((value) => value + 1)}>RELOAD</button><button className="game-hud-exit" onClick={() => canControl && setPlayingId(null)} disabled={!canControl}>EXIT</button></div></div></section> : <>
        <header className="console-header"><button className="console-brand" onClick={() => changeView("home")} aria-label="KSR Gaming home"><span className="brand-logo"><img src="./ksr-logo.png" alt="KSR" draggable={false} /></span><b>GAMING</b></button><nav className="console-tabs" aria-label="Console sections">{tabs.map((tab) => <button id={`tab-${tab.id}`} key={tab.id} className={view === tab.id ? "active" : ""} onClick={() => changeView(tab.id)} onKeyDown={handleTabKeys} disabled={!canControl} aria-current={view === tab.id ? "page" : undefined}><i>{tab.icon}</i><span>{tab.label}</span>{tab.id === "favorites" && favorites.length > 0 ? <em>{favorites.length}</em> : null}</button>)}</nav><label className="console-search"><span>⌕</span><input value={query} onFocus={() => canControl && setView("library")} onChange={(event) => { if (!canControl) return; setQuery(event.target.value); setView("library"); }} placeholder="Search" aria-label="Search games" disabled={!canControl} /></label><div className="console-user"><span>{username.slice(0, 1).toUpperCase()}</span><b>{username}</b><time>{clock}</time><button onClick={powerCycle} disabled={!canControl} aria-label="Power cycle">⏻</button></div></header>
        <section className="console-viewport"><div key={view} className={`console-page slide-${slideDirection}`}>{view === "home" && <HomePage selected={selected} games={games} favorites={favorites} mediaMode={mediaMode} onSelect={selectGame} onLaunch={launch} onFavorite={toggleFavorite} />}{(view === "library" || view === "favorites") && <CollectionPage title={query ? `Results for “${query}”` : view === "favorites" ? "Favorites" : "Game Library"} eyebrow={view === "favorites" ? "YOUR COLLECTION" : "ALL GAMES"} games={visibleGames} selected={selected} favorites={favorites} onSelect={selectGame} onLaunch={launch} onFavorite={toggleFavorite} onClear={() => { setQuery(""); setView("library"); }} />}{view === "system" && <SystemPage username={username} favorites={favorites} recent={recent} onPowerCycle={powerCycle} />}</div></section>
      </>}
    </main>
  );
}

function HomePage({ selected, games: entries, favorites, mediaMode, onSelect, onLaunch, onFavorite }: { selected: Game; games: Game[]; favorites: string[]; mediaMode: boolean; onSelect: (id: string) => void; onLaunch: (game: Game) => void; onFavorite: (id: string) => void }) {
  return <section className="home-page"><img className="home-backdrop" key={selected.background} src={selected.background} alt="" decoding="async" fetchPriority="high" /><div className="home-shade" /><div className="home-copy"><span>{selected.genre} · {selected.multiplayer ? "MULTIPLAYER" : "SOLO"}</span><h1>{selected.name}</h1><p>{selected.description}</p><div><button className="primary-action" onClick={() => onLaunch(selected)}>PLAY</button><button className={`round-action ${favorites.includes(selected.id) ? "saved" : ""}`} onClick={() => onFavorite(selected.id)} aria-label="Toggle favorite">{favorites.includes(selected.id) ? "★" : "☆"}</button></div></div><div className="game-shelf"><div className="shelf-label"><span>Games</span><small>SELECT A TITLE</small></div><GameStrip games={entries} selectedId={selected.id} favorites={favorites} mediaMode={mediaMode} onSelect={onSelect} onLaunch={onLaunch} onFavorite={onFavorite} /></div></section>;
}

function CollectionPage({ title, eyebrow, games: entries, selected, favorites, onSelect, onLaunch, onFavorite, onClear }: { title: string; eyebrow: string; games: Game[]; selected: Game; favorites: string[]; onSelect: (id: string) => void; onLaunch: (game: Game) => void; onFavorite: (id: string) => void; onClear: () => void }) {
  return <section className="collection-page"><img className="collection-backdrop" src={selected.background} alt="" /><div className="collection-shade" /><div className="collection-content"><span className="page-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{entries.length} {entries.length === 1 ? "title" : "titles"}</p>{entries.length ? <GameGrid entries={entries} selectedId={selected.id} favorites={favorites} onSelect={onSelect} onLaunch={onLaunch} onFavorite={onFavorite} /> : <div className="empty-state"><b>Nothing here yet</b><p>Add games to Favorites or try a different search.</p><button onClick={onClear}>RETURN TO LIBRARY</button></div>}</div></section>;
}

function SystemPage({ username, favorites, recent, onPowerCycle }: { username: string; favorites: string[]; recent: string[]; onPowerCycle: () => void }) {
  return <section className="system-page"><div className="system-content"><span className="page-eyebrow">CONSOLE SETTINGS</span><h1>System</h1><p>Manage this KSR Gaming console.</p><div className="settings-grid"><article className="setting-card featured"><i>◈</i><small>DISPLAY</small><strong>AUTO FIT</strong><p>The media resolution follows the physical screen proportions automatically.</p></article><article className="setting-card"><i>●</i><small>PLAYER</small><strong>{username.toUpperCase()}</strong><p>Active profile on this viewer.</p></article><article className="setting-card"><i>♡</i><small>COLLECTION</small><strong>{favorites.length} FAVORITES</strong><p>{recent.length ? `Recently played: ${recent.map((id) => games.find((game) => game.id === id)?.name).filter(Boolean).join(", ")}` : "No recent games yet."}</p></article><article className="setting-card power"><i>⏻</i><small>POWER</small><strong>RESTART</strong><p>Replay the KSR startup sequence.</p><button onClick={onPowerCycle}>POWER CYCLE</button></article></div></div></section>;
}

function GameStrip({ games: entries, selectedId, favorites, mediaMode, onSelect, onLaunch, onFavorite }: { games: Game[]; selectedId: string; favorites: string[]; mediaMode: boolean; onSelect: (id: string) => void; onLaunch: (game: Game) => void; onFavorite: (id: string) => void }) {
  return <div className="game-strip">{entries.map((game) => <GameCard key={game.id} game={game} selected={selectedId === game.id} favorite={favorites.includes(game.id)} mediaMode={mediaMode} onSelect={onSelect} onLaunch={onLaunch} onFavorite={onFavorite} wide />)}</div>;
}

function GameGrid({ entries, selectedId, favorites, onSelect, onLaunch, onFavorite }: { entries: Game[]; selectedId: string; favorites: string[]; onSelect: (id: string) => void; onLaunch: (game: Game) => void; onFavorite: (id: string) => void }) {
  return <div className="game-grid">{entries.map((game) => <GameCard key={game.id} game={game} selected={selectedId === game.id} favorite={favorites.includes(game.id)} onSelect={onSelect} onLaunch={onLaunch} onFavorite={onFavorite} />)}</div>;
}

function GameCard({ game, selected, favorite, mediaMode = false, onSelect, onLaunch, onFavorite, wide = false }: { game: Game; selected: boolean; favorite: boolean; mediaMode?: boolean; onSelect: (id: string) => void; onLaunch: (game: Game) => void; onFavorite: (id: string) => void; wide?: boolean }) {
  const cardRef = useRef<HTMLElement>(null);
  useEffect(() => { if (selected) cardRef.current?.scrollIntoView({ behavior: mediaMode ? "auto" : "smooth", block: "nearest", inline: "center" }); }, [selected, mediaMode]);
  return <article ref={cardRef} className={`game-card ${selected ? "selected" : ""} ${wide ? "wide" : ""}`}><button className="game-card-main" onClick={() => onSelect(game.id)} onFocus={() => onSelect(game.id)} aria-label={`Select ${game.name}`} aria-current={selected ? "true" : undefined}><img src={wide ? game.thumb : game.cover} alt={game.name} loading={selected ? "eager" : "lazy"} decoding="async" /><span className="game-card-shade" /><span className="game-card-copy"><small>{game.genre}</small><strong>{game.name}</strong></span></button>{selected ? <button className="game-card-play" onClick={() => onLaunch(game)} aria-label={`Play ${game.name}`}>▶</button> : null}<button className={`game-card-favorite ${favorite ? "saved" : ""}`} onClick={() => onFavorite(game.id)} aria-label={`Favorite ${game.name}`}>{favorite ? "★" : "☆"}</button></article>;
}
