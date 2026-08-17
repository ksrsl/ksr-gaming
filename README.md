# KSR Gaming — Second Life Hosted v0.4

KSR Gaming is an independent Media-on-a-Prim console for Second Life. It includes a cinematic blue-and-white startup, sliding console tabs, a game carousel, favorites, recent games, a focused full-screen player, and silent room synchronization.

Live Media URL: `https://ksrsl.github.io/ksr-gaming/`

This is a separate project. It does not modify, replace, or share files with KSR GameBoi.

## Included catalog

- SocCar
- Prison Escape
- Super Star Car
- Riders: Downhill
- SkillWarz
- BuildNow GG
- Zombie Ops

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
5. Put `KSR Gaming Controller.lsl` in the root prim, save it with the Mono runtime, and touch `POWER`.

If the model uses different link names, change the three link-name settings at the top of the controller instead of renaming the prims.

The controller automatically reads the physical `SCREEN` prim proportions and updates its Media-on-a-Prim resolution at power-on, whenever the linkset or screen scale changes, and every two seconds while running. It uses up to 2048 pixels on the longest axis. The default flat-screen mapping is X for width and Z for height; change `SCREEN_WIDTH_AXIS` or `SCREEN_HEIGHT_AXIS` only if the screen mesh is oriented differently.

## Viewer use

- Shared Media / Media-on-a-Prim must be enabled in the viewer.
- Touch the display once to focus keyboard, mouse, and gamepad input. The media face uses direct first-click interaction, hides the viewer media bar, and the launcher re-focuses the active game frame after launch, reload, pointer entry, and pointer press.
- The screen can use any landscape or portrait proportion. The automatic adapter keeps the page native to the physical face instead of stretching a fixed 16:9 render.
- The controller permits anyone to interact with the media. Viewer media-bar controls are hidden so they do not steal the first game click.
- Set `OWNER_ONLY_POWER = TRUE` if only the owner should control power.
- Controller v0.4 creates a private synchronization room for each rezzed console. The first connected media surface becomes host; other viewers silently follow its dashboard navigation, selected game, launch, and exit state. No synchronization labels or counts are shown on the console.
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
