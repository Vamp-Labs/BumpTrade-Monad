import { deployments } from '@bump/contracts';
import type { Address } from 'viem';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const DEFAULT_RPC_URL = 'https://testnet-rpc.monad.xyz';

function readString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function trimSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function readChainId(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 10143;
}

function resolveAddress(override: string | undefined, fallback: string): Address | null {
  const candidate = override?.trim() || fallback;
  if (!ADDRESS_PATTERN.test(candidate)) return null;
  if (candidate.toLowerCase() === ZERO_ADDRESS) return null;
  return candidate as Address;
}

function httpBase(wsUrl: string): string {
  return trimSlash(wsUrl.replace(/^ws(s?):\/\//i, 'http$1://'));
}

const meta = import.meta.env;
const gameServerUrl = readString(meta.VITE_GAME_SERVER_URL, 'ws://localhost:2567');
const gameServerHttpUrl = httpBase(gameServerUrl);

export const env = {
  chainId: readChainId(meta.VITE_CHAIN_ID),
  rpcUrl: readString(meta.VITE_RPC_URL, DEFAULT_RPC_URL),
  publicRpcUrl: DEFAULT_RPC_URL,
  gameServerUrl,
  gameServerHttpUrl,
  leaderboardUrl: trimSlash(readString(meta.VITE_LEADERBOARD_URL, gameServerHttpUrl)),
  explorerUrl: trimSlash(readString(meta.VITE_EXPLORER_URL, 'https://testnet.monadvision.com')),
  arenaAddress: resolveAddress(meta.VITE_ARENA_ADDRESS, deployments.BumpArena.address),
  tokenAddress: resolveAddress(meta.VITE_TOKEN_ADDRESS, deployments.MockBUMP.address),
} as const;

export function txUrl(hash: string): string {
  return `${env.explorerUrl}/tx/${hash}`;
}

export function addressUrl(address: string): string {
  return `${env.explorerUrl}/address/${address}`;
}
