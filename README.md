# wc3lobbylist

A Discord bot and backend for the **Warcraft III "Sheep Tag: Revolution"** community. It ingests game replays, maintains an ELO ranking system, answers stats queries over Discord DMs, and exposes a small HTTP API.

> **Name vs. current function.** This project began life as a bot that posted **live WC3 game lobbies** to Discord — hence the name. That lobby-listing function has since been retired (see the `kill v3 lobby list` commit) and rewritten as a separate Deno service, [`voces/w3xio`](https://github.com/voces/w3xio). The live-lobby feed, lobby alerts, and the status page now live there. What remains in *this* repo is the **replay processing / ELO pipeline** and the **Discord stats bot**.

## What it does

### 1. Replay processing pipeline (the main job)
Every minute ([`src/w3xio/replays/index.ts`](src/w3xio/replays/index.ts)) the bot polls the [wc3stats](https://wc3stats.com) API for new "Sheep Tag" replays since the last one it stored:

- **Revolution** replays are parsed into rounds, run through the ELO engine, and written to the MySQL `elo.*` tables ([`src/w3xio/replays/revo/`](src/w3xio/replays/revo/)).
- Non-Revolution or voided replays are recorded as voided so they aren't re-fetched.
- Players who have opted in (`alert = 1` in `elo.discordBattleNetMap`) get a **DM with their rating changes** and a link to the game ([`src/w3xio/replays/revo/sql.ts`](src/w3xio/replays/revo/sql.ts)).

Two side-effects fire on every new replay ([`onNewReplay`](src/w3xio/replays/common.ts) hooks):
- **fixusBias** — tracks each player's team-preference bias ([`fixusBias.ts`](src/w3xio/replays/fixusBias.ts)).
- **todo / log / report** — in-game `-todo`/`-log`/`-report` messages are turned into GitHub issues ([`todo.ts`](src/w3xio/replays/todo.ts)).

### 2. Discord stats bot (DM-only)
Users **direct-message** the bot to query stats. Since the lobby feed moved to `w3xio`, the bot only requests the `DirectMessages` intent and ignores server-channel messages entirely ([`src/discord.ts`](src/discord.ts), [`src/commands/index.ts`](src/commands/index.ts)).

**Public commands:**

| Command | Description |
| --- | --- |
| `elo [mode] [season]` | Your rating (requires a Battle.net tag mapped to your Discord id). Mode defaults to `2v4`, season to the current one. |
| `top [mode] [season]` | Top-10 leaderboard for a mode/season. |
| `last` | Players and modes of the most recent game. |
| `matchup <players> vs <players>` | Expected score for a proposed matchup, e.g. `matchup nmcdo raffish vs eenz verit skiddo ferfykins`. Supports 2v4, 3v5, 4v6, 5v5. |
| `rounds [replayId]` | Per-round breakdown of a replay (defaults to the latest). |
| `summary [replayId] [mode]` | Rating-change summary for a replay. |

**Admin-only commands** (restricted to the Discord id in [`config.ts`](config.ts)):

| Command | Description |
| --- | --- |
| `restart` | Gracefully restart the process. |
| `sql <query>` | Run a SQL query, replies with a formatted table. |
| `js <expr>` | `eval` an expression and reply with the result. |

### 3. HTTP API (Express)
[`src/w3xio/api/index.ts`](src/w3xio/api/index.ts) serves:
- `GET /preferences?map=&players=` — fixus team-preference bias per player.
- `POST /sql` — a query proxy ([`sqlProxy.ts`](src/w3xio/api/sqlProxy.ts)).
- static files from `src/w3xio/public`.

## Architecture

```
src/
  index.ts              entrypoint — wires up commands, replays, API, crash handler
  discord.ts            discord.js v14 client (DM intent) + messageAdmin()
  config.ts             admin id, ports, channel — switched by NODE_ENV
  commands/             DM command handlers + dispatcher
  w3xio/
    index.ts            starts the replay poller and the HTTP API
    replays/            replay ingestion; revo/ holds the ELO engine
    api/                Express server
  shared/               sql pool, wc3stats/github fetch clients, logging, utils
```

## Requirements

- **Node.js ≥ 18** (see [`.node-version`](.node-version))
- **MySQL** reachable on `localhost` as user `w3xio`, database `w3xio` (schema `elo.*`). Port is `3307` in development and `3306` in production ([`config.ts`](config.ts), [`src/shared/sql.ts`](src/shared/sql.ts)).
- A Discord bot token.

### Environment
| Variable | Purpose |
| --- | --- |
| `DISCORD_TOKEN` | **Required.** Bot token; the process exits on startup if unset. |
| `NODE_ENV` | Set to `production` to use production ports and the production Discord channel. |

## Development

```bash
npm install
npm run build     # tsc -> dist/
npm start         # node dist/src/index.js
npm run dev       # tsc --watch
npm test          # jest
npm run lint      # eslint --fix
```

## License

MIT
