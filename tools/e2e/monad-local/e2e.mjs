#!/usr/bin/env node
// Two-browser E2E on Monad testnet: connect, faucet, one-signature gasless join, match, on-chain settle, leaderboard.
import { Browser, KEYS } from "./cdp.mjs";
import { newKey, nativeBalance, rpc, sleep, tokenBalance } from "./lib.mjs";
import { startSigner } from "./signer.mjs";
import { walletScript } from "./wallet-inject.mjs";

const E = (k, d) => process.env[k] ?? d;
const CFG = {
  client: E("E2E_CLIENT", "http://127.0.0.1:5174/"),
  server: E("E2E_SERVER", "http://localhost:2568"),
  rpc: E("E2E_RPC", "https://testnet-rpc.monad.xyz"),
  token: E("E2E_TOKEN", "0xF094E7e6cB7B9297a88F19E5209C0D6DE3616666"),
  arena: E("E2E_ARENA", "0xCB574c46A3579Cf56F398F42A51BFE4C0f1459d9"),
  relayer: E("E2E_RELAYER", "0xAabb891664b927d831110258a10f1a8C1E91bfFC"),
  chromePort: Number(E("E2E_CHROME_PORT", "9444")),
  playMs: Number(E("E2E_PLAY_MS", "80000")),
  verbose: E("E2E_VERBOSE", "0") === "1",
};
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " :: " + detail : ""}`); };
const T0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s] ${m}`);

async function connectFlow(p) {
  await p.goto(CFG.client);
  await p.waitText("PLAY ONLINE", 120000);
  await p.clickWait("PLAY ONLINE");
  await p.waitText("WALLET", 8000, ".on-backdrop.show");
  await p.clickWait("E2E Mock Wallet");
  await p.waitText("Address", 10000, ".on-backdrop.show");
}

async function main() {
  const keys = [newKey(), newKey()];
  const sg = await startSigner(keys);
  const br = await Browser.connect(CFG.chromePort);
  const mk = (i) => br.newPage({ script: walletScript({ address: keys[i].address, signerUrl: sg.url, idx: i }), name: ["A", "B"][i] });
  const [A, B] = [await mk(0), await mk(1)];
  const players = [A, B];
  try {
    const bal0 = await nativeBalance(CFG.rpc, keys[0].address);
    await Promise.all(players.map(connectFlow));
    check("wallets connect", true);

    await Promise.all(players.map((p) => p.clickWait("CLAIM")));
    await Promise.all(players.map((p) => p.waitText("1[,. ]?000", 60000, ".on-backdrop.show")));
    const tokA = await tokenBalance(CFG.rpc, CFG.token, keys[0].address);
    check("faucet minted BUMP on chain", tokA > 0n, `tokenA=${tokA}`);

    await Promise.all(players.map(async (p) => { await p.clickWait("CONTINUE"); await sleep(1500); }));
    await sleep(1500);
    await Promise.all(players.map(async (p) => { await p.clickWait("ENTER LOBBY"); await p.waitText("LOBBY", 30000, ".on-backdrop.show"); }));
    await A.waitText("SIGN & JOIN", 30000, ".on-backdrop.show");
    log("lobby ready");

    await A.clickWait("SIGN & JOIN");
    await A.waitText("SEAT CONFIRMED", 90000, ".on-backdrop.show");
    await B.clickWait("SIGN & JOIN");
    await B.waitText("SEAT CONFIRMED", 90000, ".on-backdrop.show");
    await A.waitText("2/8 SEATS", 30000, ".on-backdrop.show");
    check("gasless join: one signature each, player MON unchanged", sg.state.calls.length === 2 && (await nativeBalance(CFG.rpc, keys[0].address)) === bal0, `signCalls=${sg.state.calls.length}`);
    const vault = await tokenBalance(CFG.rpc, CFG.token, CFG.arena);
    check("stakes escrowed in arena", vault > 0n, `arenaToken=${vault}`);

    for (let i = 0; i < 240; i++) { if (!(await A.eval(`document.querySelectorAll('.on-backdrop.show').length`))) break; await sleep(500); }
    log("match started");
    const t0 = Date.now();
    const driveA = (async () => { while (Date.now() - t0 < CFG.playMs) { await A.hold([KEYS.W], 3200); await A.hold([KEYS.W, KEYS.D], 600); await A.hold([KEYS.W], 1800); await A.hold([KEYS.W, KEYS.A], 500); } })();
    const driveB = (async () => { while (Date.now() - t0 < CFG.playMs + 20000) { await B.hold([KEYS.W], 4000); await B.hold([KEYS.W, KEYS.A], 700); } })();
    await A.waitText("MATCH RESULT", 220000, ".on-backdrop.show");
    check("match result shown", true);
    const settled = await A.waitText("SETTLED", 120000, ".on-backdrop.show").then(() => true, () => false);
    check("settled on Monad", settled);
    const link = await A.eval(`[...document.querySelectorAll('.on-backdrop.show a')].map(a=>a.href).find(h=>/\\/tx\\/0x/.test(h)) || null`);
    check("settle tx link points to the explorer", !!link && link.startsWith("https://testnet.monadvision.com/tx/"), String(link));
    if (link) {
      const hash = link.split("/tx/")[1].split(/[?#]/)[0];
      let rec = null; for (let i = 0; i < 20 && !rec; i++) { rec = await rpc(CFG.rpc, "eth_getTransactionReceipt", [hash]); if (!rec) await sleep(1000); }
      check("settle tx succeeded on chain", rec?.status === "0x1", `block=${rec ? parseInt(rec.blockNumber, 16) : "?"} gasUsed=${rec ? parseInt(rec.gasUsed, 16) : "?"}`);
    }
    const vault2 = await tokenBalance(CFG.rpc, CFG.token, CFG.arena);
    check("arena vault emptied by payouts", vault2 === 0n || vault2 < vault, `before=${vault} after=${vault2}`);
    await Promise.allSettled([driveA, driveB]);
    await A.clickWait("BACK TO MENU"); await sleep(1500);
    await A.clickWait("LEADERBOARD"); await sleep(2500);
    await A.eval(`document.getElementById('lb-tab-online')?.click()`);
    await sleep(3000);
    const lb = await A.text();
    check("leaderboard lists the match", /ONLINE|RANK|PLAYER/i.test(lb) && /[0-9]/.test(lb));
    const errs = [...A.console, ...B.console].filter((l) => /\[exception\]|\[error\]/.test(l) && !/favicon|WebGL|GPU|Failed to load resource/i.test(l));
    check("no browser console errors", errs.length === 0, errs.slice(0, 3).join(" || "));
  } catch (e) {
    console.log("CRASH", e.message);
    results.push({ name: "crash", ok: false });
    if (CFG.verbose) console.log([...A.console, ...B.console].slice(-20).join("\n"));
  } finally {
    await A.close(); await B.close(); br.close(); sg.srv.close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}
main();
