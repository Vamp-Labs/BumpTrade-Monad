# BUMP.TRADE

Real-time 3D multiplayer bumper-car arena on **Monad testnet** (chain id 10143). Bump other cars, knock them out of the arena, last car standing wins the pot. Stakes are a free mock token (`BUMP`) and play is gasless: a player signs one EIP-712 message, the server relayer pays the gas, and the result settles on Monad in one transaction.

> Testnet demo. Free test tokens, no real funds. Not affiliated with, endorsed by, or connected with any company or ticker shown.

## How it works

- **Client** (`src/`): Vite + three.js + Rapier. Offline mode against AI bots, and an online mode with wallet connect, free `BUMP` faucet and one-signature join.
- **Game server** (`server/`): Colyseus 0.18 over WebSocket. Runs the authoritative Rapier simulation at 60 Hz, streams 30 Hz snapshots, relays gasless joins (`joinWithSig`), signs match results, and serves the leaderboard from Postgres.
- **Contracts** (`contracts/`): Foundry. `BumpArena` escrows `BUMP` stakes, verifies the signed result and pushes payouts; `MockBUMP` is the free ERC20 with a 24 h faucet.
- **Indexer** (`indexer/`, optional): Ponder. Indexes arena events and serves a second leaderboard and match history API.
- **Shared** (`packages/shared/`): protocol schemas, message types and the deterministic game rules used by server and client.

## Deployment

Monad testnet, chain id 10143, native token MON, explorer https://testnet.monadvision.com. Contract addresses are recorded in `contracts/deployments/10143.json` after `contracts/script/Deploy.s.sol` is broadcast.

## Repository layout

```
src/                 3D game client (Vite)
public/models/       vehicle GLBs (textures embedded)
packages/shared/     protocol + shared game rules
server/              Colyseus game server
indexer/             Ponder indexer (optional)
contracts/           Foundry contracts, tests, deploy scripts
Dockerfile.server    image for the game server
Dockerfile.indexer   image for the indexer
```

## Getting started

Requirements: Node >= 22.12, pnpm 11, Foundry.

```bash
git clone --recurse-submodules <repo-url>
cd <repo>
pnpm install
cp .env.example .env        # fill in values, never commit .env

pnpm dev                     # client at http://localhost:5173
pnpm --filter @bump/server start
```

Checks:

```bash
pnpm build && pnpm typecheck:all && pnpm test:all
cd contracts && forge test
```

Environment variable names are listed in `.env.example`; per-package details are in `server/README.md`, `indexer/README.md` and `contracts/README.md`.

## License

MIT, see `LICENSE`. Third-party dependencies keep their own licenses.
