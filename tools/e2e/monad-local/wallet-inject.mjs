// Returns JS source for a mock EIP-1193 wallet announced through EIP-6963. Signing is delegated to the node signer over HTTP.
export function walletScript({ address, signerUrl, idx, chainId = 10143 }) {
  return `(() => {
  const ADDR = ${JSON.stringify(address)};
  const SIGNER = ${JSON.stringify(signerUrl)};
  const IDX = ${idx};
  const CHAIN = "0x" + (${chainId}).toString(16);
  const AUTH = "e2e.mock.authorized";
  const authorized = () => { try { return localStorage.getItem(AUTH) === "1"; } catch { return false; } };
  const listeners = {};
  window.__mockWallet = { signCalls: 0, connectCalls: 0 };
  const post = async (path, body) => {
    const r = await fetch(SIGNER + path + "?w=" + IDX, { method: "POST", body: JSON.stringify(body) });
    if (!r.ok) throw new Error("signer " + r.status + " " + (await r.text()));
    return r.text();
  };
  const provider = {
    isMetaMask: false,
    on: (ev, l) => { (listeners[ev] ||= []).push(l); },
    removeListener: (ev, l) => { listeners[ev] = (listeners[ev] || []).filter((x) => x !== l); },
    request: async ({ method, params }) => {
      switch (method) {
        case "eth_requestAccounts": window.__mockWallet.connectCalls++; try { localStorage.setItem(AUTH, "1"); } catch {} return [ADDR];
        case "eth_accounts": return authorized() ? [ADDR] : [];
        case "eth_chainId": return CHAIN;
        case "net_version": return String(parseInt(CHAIN, 16));
        case "wallet_switchEthereumChain": case "wallet_addEthereumChain": return null;
        case "wallet_revokePermissions": try { localStorage.removeItem(AUTH); } catch {} return null;
        case "eth_signTypedData_v4": {
          window.__mockWallet.signCalls++;
          const typed = typeof params[1] === "string" ? JSON.parse(params[1]) : params[1];
          return post("/typed", typed);
        }
        case "personal_sign": {
          window.__mockWallet.signCalls++;
          const hex = params[0];
          const text = decodeURIComponent(hex.slice(2).replace(/../g, "%$&"));
          return post("/message", { message: text });
        }
        default: throw Object.assign(new Error("mock wallet: unsupported " + method), { code: 4200 });
      }
    },
  };
  const detail = Object.freeze({
    info: { uuid: "e2e-mock-wallet", name: "E2E Mock Wallet", icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjODM2ZWZiIi8+PC9zdmc+", rdns: "test.e2e.mock" },
    provider,
  });
  const announce = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail }));
  window.addEventListener("eip6963:requestProvider", announce);
  announce();
})();`;
}
