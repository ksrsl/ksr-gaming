# KSR Gaming — Second Life Hosted v0.2

KSR Gaming is an independent Media-on-a-Prim launcher for Second Life. It includes a cinematic blue-and-white startup, a searchable catalog, favorites, recent games, and a focused full-screen player.

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

## Viewer use

- Shared Media / Media-on-a-Prim must be enabled in the viewer.
- Click the display once so keyboard, mouse, and gamepad input are focused inside the game.
- Use a widescreen 16:9 screen face. The launcher and controller are configured for a native 2048 × 1152 Media-on-a-Prim profile so games keep their natural proportions.
- The controller permits anyone to interact with the media while keeping media-bar controls owner-only.
- Set `OWNER_ONLY_POWER = TRUE` if only the owner should control power.
- Controller v0.3 creates a private screen-share room for each rezzed console. The first connected media surface becomes host; other viewers follow its dashboard navigation, selected game, launch, and exit state through the isolated KSR Gaming relay.
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

GitHub Pages publishes the generated `docs/` folder. Cloudflare is intentionally not required for this version because KSR Gaming has no shared sessions, leaderboard, accounts, or relay service yet.

No sales system, customer accounts, or purchases are included in this prototype.

## Required in-world checks

Before release:

1. Compile the LSL controller in Mono with no errors.
2. Test power, home, and screen interaction in the official Second Life Viewer.
3. Repeat the same checks in Firestorm.
4. Launch every game and confirm the approved page allows embedding from the final hosted domain.
5. Confirm keyboard/mouse focus, audio, gamepad input, and performance on the intended screen mesh.

Source and build checks cannot replace viewer and in-world testing.
