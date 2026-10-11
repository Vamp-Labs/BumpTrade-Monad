import { createConfig } from "ponder";
import type { Address } from "viem";
import { bumpArenaAbi, deployments } from "@bump/contracts";

const arenaAddress = (process.env.ARENA_ADDRESS ||
  deployments.BumpArena.address) as Address;

const startBlock = process.env.ARENA_START_BLOCK
  ? Number(process.env.ARENA_START_BLOCK)
  : deployments.BumpArena.blockNumber;

const wsUrl = process.env.PONDER_WS_URL_10143;

export default createConfig({
  chains: {
    monadTestnet: {
      id: 10143,
      rpc:
        process.env.PONDER_RPC_URL_10143 ??
        "https://testnet-rpc.monad.xyz",
      ...(wsUrl ? { ws: wsUrl } : {}),
    },
  },
  contracts: {
    BumpArena: {
      abi: bumpArenaAbi,
      chain: "monadTestnet",
      address: arenaAddress,
      startBlock,
    },
  },
});
