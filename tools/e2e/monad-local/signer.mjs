import { createServer } from "node:http";

// HTTP signer standing in for the wallet. keys[idx] = { account } from newKey(). Only typed data and messages are signed:
// joins are gasless, so the player never sends a transaction.
export function startSigner(keys, port = 0) {
  const state = { calls: [] };
  const srv = createServer(async (req, res) => {
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-private-network", "true");
    if (req.method === "OPTIONS") { res.setHeader("access-control-allow-headers", "*"); res.writeHead(204); return res.end(); }
    const url = new URL(req.url, "http://x");
    const key = keys[Number(url.searchParams.get("w"))];
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    try {
      if (url.pathname === "/typed") {
        state.calls.push({ at: Date.now(), primaryType: body.primaryType });
        const { domain, types, primaryType, message } = body;
        const { EIP712Domain, ...rest } = types;
        const sig = await key.account.signTypedData({ domain, types: rest, primaryType, message });
        res.writeHead(200, { "content-type": "text/plain" });
        return res.end(sig);
      }
      if (url.pathname === "/message") {
        const sig = await key.account.signMessage({ message: body.message });
        res.writeHead(200); return res.end(sig);
      }
      res.writeHead(404); res.end("nope");
    } catch (e) { res.writeHead(500); res.end(String(e.message)); }
  });
  return new Promise((r) => srv.listen(port, "127.0.0.1", () => r({ srv, state, url: `http://127.0.0.1:${srv.address().port}` })));
}
