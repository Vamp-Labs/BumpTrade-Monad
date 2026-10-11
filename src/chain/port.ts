import type { ChainId } from '@bump/shared';
import type { NetClient } from '../net/NetClient';
import { evmChain } from './evm';
import { CHAIN_IDS, CHAIN_META } from './meta';

export type { ChainId };
export { CHAIN_IDS, CHAIN_META };

export type MatchStatus = 'none' | 'open' | 'started' | 'settled' | 'cancelled' | 'refunding';

export interface MatchSnapshot {
  stake: bigint;
  startBalance: number;
  maxPlayers: number;
  playerCount: number;
  status: MatchStatus;
  joinDeadline: number;
  settleDeadline: number;
  pot: bigint;
}

export type WalletStatus = 'disconnected' | 'connecting' | 'connected';

export interface ChainWalletOption {
  id: string;
  name: string;
  icon: string;
}

export interface ChainWalletState {
  status: WalletStatus;
  options: ChainWalletOption[];
  selectedId: string | null;
  address: string | null;
  networkOk: boolean;
  bumpBalance: bigint | null;
  error: string | null;
}

export interface ChainWallet {
  discover(): void;
  list(): ChainWalletOption[];
  connect(id: string, silent?: boolean): Promise<void>;
  disconnect(forget?: boolean): void;
  subscribe(listener: (state: ChainWalletState) => void): () => void;
  getState(): ChainWalletState;
  isReady(): boolean;
  refreshBalance(): Promise<void>;
  switchNetwork?(): Promise<void>;
}

export interface SessionKeyHandle {
  publicId: string;
  scheme: 'evm';
  signSeat(text: string): Promise<string>;
}

export interface JoinContext {
  net: NetClient;
  matchId: string;
  vehicleId: number;
  joinDeadline: number;
  onSigned?: () => void;
}

export interface ChainErrorInfo {
  kind: 'rejected' | 'revert' | 'network' | 'other';
  message: string;
  code?: string;
}

export interface ClientChain {
  readonly id: ChainId;
  readonly label: string;
  readonly decimals: number;
  readonly gameServerUrl: string;
  readonly gameServerHttpUrl: string;
  readonly leaderboardUrl: string;
  readonly defaultStake: bigint;
  readonly claimAmount: bigint;
  wallet: ChainWallet;
  isConfigured(): boolean;
  isTokenConfigured(): boolean;
  join(ctx: JoinContext): Promise<void>;
  readMatch(matchId: string): Promise<MatchSnapshot>;
  readSessionKeyOf(matchId: string, wallet: string): Promise<string | null>;
  tokenBalance(wallet: string): Promise<bigint>;
  nextClaimAtFallback(wallet: string): Promise<number>;
  createSessionKey(matchId: string): SessionKeyHandle;
  loadSessionKey(matchId: string): SessionKeyHandle | null;
  clearSessionKey(matchId: string): void;
  describeError(error: unknown): ChainErrorInfo;
  formatAmount(amount: bigint, digits?: number): string;
  explorerTx(tx: string): string;
  explorerAddress(addr: string): string;
}

export function getActiveChain(): ClientChain {
  return evmChain;
}

document.body.dataset.chain = evmChain.id;
