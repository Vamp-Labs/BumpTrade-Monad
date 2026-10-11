import { createPublicClient, defineChain, fallback, http, type Chain, type PublicClient } from 'viem';
import { monadTestnet } from 'viem/chains';
import { env } from '../../config/env';

function buildChain(): Chain {
  if (env.chainId === monadTestnet.id) return monadTestnet;
  return defineChain({
    id: env.chainId,
    name: `Chain ${env.chainId}`,
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: { default: { http: [env.rpcUrl] } },
  });
}

export const chain: Chain = buildChain();

function rpcUrls(): string[] {
  const urls = [env.rpcUrl];
  if (env.chainId === monadTestnet.id && env.rpcUrl !== env.publicRpcUrl) {
    urls.push(env.publicRpcUrl);
  }
  return urls;
}

export const publicClient: PublicClient = createPublicClient({
  chain,
  transport: fallback(rpcUrls().map((url) => http(url))),
});
