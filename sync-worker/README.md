# KSR Gaming Screen Share Relay

This isolated Cloudflare Durable Object relay keeps every viewer of one Second Life KSR Gaming console on the same dashboard screen and game session. The first connected media surface is the host; the remaining surfaces follow the host's navigation, selected game, launch, and exit state.

Endpoints:

- `GET /v1/health`
- `WSS /room/:room?token=:token`

The Second Life controller supplies a private object room and token automatically. No KSR GameBoi files or services are modified.
