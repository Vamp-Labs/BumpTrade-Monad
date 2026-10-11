import type { ChainId } from '@bump/shared';
import { env } from '../config/env';
import { formatTokenAmount } from './format';

export interface ChainMeta {
  id: ChainId;
  label: string;
  pill: string;
  decimals: number;
  gameServerUrl: string;
  gameServerHttpUrl: string;
  leaderboardUrl: string;
  explorerTx(tx: string): string;
  explorerAddress(address: string): string;
  formatAmount(amount: bigint, digits?: number): string;
}

export const CHAIN_META: Record<ChainId, ChainMeta> = {
  evm: {
    id: 'evm',
    label: 'Monad Testnet',
    pill: 'Monad Testnet',
    decimals: 18,
    gameServerUrl: env.gameServerUrl,
    gameServerHttpUrl: env.gameServerHttpUrl,
    leaderboardUrl: env.leaderboardUrl,
    explorerTx: (tx) => `${env.explorerUrl}/tx/${tx}`,
    explorerAddress: (address) => `${env.explorerUrl}/address/${address}`,
    formatAmount: (amount, digits) => formatTokenAmount(amount, 18, digits),
  },
};

export const CHAIN_IDS: readonly ChainId[] = ['evm'];
