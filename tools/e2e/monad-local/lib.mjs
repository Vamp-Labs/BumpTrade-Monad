import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function newKey() {
  const pk = generatePrivateKey();
  const account = privateKeyToAccount(pk);
  return { pk, account, address: account.address };
}
export async function rpc(url, method, params = []) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(`${method}: ${JSON.stringify(j.error)}`);
  return j.result;
}
export async function tokenBalance(url, token, owner) {
  const data = "0x70a08231" + owner.toLowerCase().replace("0x", "").padStart(64, "0");
  return BigInt(await rpc(url, "eth_call", [{ to: token, data }, "latest"]));
}
export async function nativeBalance(url, addr) { return BigInt(await rpc(url, "eth_getBalance", [addr, "latest"])); }
