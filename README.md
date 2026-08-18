# KSR Gaming — Second Life Hosted v0.6.3

KSR Gaming is an independent Media-on-a-Prim console for Second Life. It includes a cinematic blue-and-white startup, sliding console tabs, a game carousel, favorites, recent games, a focused full-screen player, and silent room synchronization.

Version 0.6.3 removes PolyTrack and every right-click-dependent title. The seven-game catalog now uses only left-click, WASD, arrow keys, space, and simple letter-key controls suitable for Second Life media interaction.

Live Media URL: `https://ksrsl.github.io/ksr-gaming/`

This is a separate project. It does not modify, replace, or share files with KSR GameBoi.

## Included catalog

- Super Star Car
- Highway Racer
- Space Waves
- Basket Random
- NOOB: Zombie Shooting
- Brawl Hero
- Moto X3M: Spooky Land

The KSR interface contains no third-party promotional labels, buttons, or tags. The launcher opens authorized external game pages in an iframe; content rendered inside those cross-origin pages remains controlled by the game provider. Removing provider branding inside a game requires its approved white-label build or no-brand embed URL.

## Included

- `app/` — complete KSR Gaming interface
- `public/games/` — catalog cover and background artwork
- `second-life/KSR Gaming Controller.lsl` — power, home, and media-face controller
- `package.json` — local preview and production build commands

## Second Life setup

1. Name the console display prim `SCREEN`.
2. Name the power button prim `POWER`.
3. Name the home button prim `HOME`.
4. Set `SCREEN_FACE` to the display face number. It is `0` by default.
5. Put `KSR Gaming Controller.lsl` in the root prim and save it with the Mono runtime. The display starts automatically; `POWER` toggles it afterward.

If the model uses different link names, change the three link-name settings at the top of the controller instead of renaming the prims.

The controller automatically reads the physical `SCREEN` prim proportions and updates its Media-on-a-Prim resolution at power-on, whenever the linkset or screen scale changes, and every two seconds while running. It identifies the two largest prim dimensions as the visible screen and ignores the thin depth axis. A 16:9 display uses the premium balanced 1600×900 profile—31% fewer rendered pixels than 1920×1080 while remaining sharp on an in-world television. Set `AUTO_DETECT_SCREEN_AXES = FALSE` only when manual axis selection is required.

The console powers on automatically after the script is saved, reset, or rezzed. If the display is off, touching the `SCREEN` face also wakes it. Set `AUTO_POWER_ON = FALSE` only when a black/off state on reset is intentional.

## Viewer use

- Shared Media / Media-on-a-Prim must be enabled in the viewer.
- Touch the display once to focus keyboard, mouse, and gamepad input. The media face uses direct first-click interaction, keeps viewer controls in minimal mode, and the launcher re-focuses the active game frame after launch, reload, pointer entry, and pointer press.
- The screen can use any landscape or portrait proportion. The automatic adapter keeps the page native to the physical face instead of stretching a fixed 16:9 render.
- The controller permits anyone to interact with the media and uses Second Life's minimal media controls.
- Set `OWNER_ONLY_POWER = TRUE` if only the owner should control power.
- Controller v0.5 creates a private synchronization room for each rezzed console. The first connected media surface becomes host; other viewers silently follow its dashboard navigation, selected game, launch, and exit state. No synchronization labels or counts are shown on the console.
- Third-party game code runs inside a protected iframe, so KSR can synchronize the console session around it but cannot read or duplicate the game's private internal save/state.

## Local preview

Use Node.js 22.13 or newer:

```text
npm install
npm run dev
```

Then open `http://localhost:3000`. Add `?skipBoot=1` while working on the catalog to bypass the startup animation.

## Production build

```text
npm run build
```

For the independent GitHub Pages build:

```text
npm run build:pages
```

GitHub Pages publishes the generated `docs/` folder. The separate Cloudflare Durable Object relay handles the console's silent room synchronization.

No sales system, customer accounts, or purchases are included in this prototype.

## Required in-world checks

Before release:

1. Compile the LSL controller in Mono with no errors.
2. Test power, home, and screen interaction in the official Second Life Viewer.
3. Repeat the same checks in Firestorm.
4. Launch every game and confirm the approved page allows embedding from the final hosted domain.
5. Confirm keyboard/mouse focus, audio, gamepad input, and performance on the intended screen mesh.

Source and build checks cannot replace viewer and in-world testing.
