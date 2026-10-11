import { seatMessage } from "@bump/shared";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import { sameSessionKey, verifySeatProof } from "../src/chain/seatProof";

const message = seatMessage({
  matchId: `0x${"ab".repeat(32)}`,
  wallet: "0x1111111111111111111111111111111111111111",
  roomId: "room",
  issuedAt: 1_790_000_000_000,
});

describe("seat proof", () => {
  it("verifies an evm session key signature", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const signature = await account.signMessage({ message });
    expect(
      await verifySeatProof("evm", {
        message,
        signature,
        sessionKey: account.address,
      }),
    ).toBe(true);
    expect(
      await verifySeatProof("evm", {
        message: `${message}x`,
        signature,
        sessionKey: account.address,
      }),
    ).toBe(false);
  });

  it("compares session keys case-insensitively", () => {
    expect(sameSessionKey("evm", "0xAB", "0xab")).toBe(true);
    expect(sameSessionKey("evm", "0xAB", "0xac")).toBe(false);
  });
});
