import type { SeatScheme } from "@bump/shared";
import { recoverMessageAddress } from "viem";

export const sameSessionKey = (
  _scheme: SeatScheme,
  a: string,
  b: string,
): boolean => a.toLowerCase() === b.toLowerCase();

export const verifySeatProof = async (
  _scheme: SeatScheme,
  input: { message: string; signature: string; sessionKey: string },
): Promise<boolean> => {
  const recovered = await recoverMessageAddress({
    message: input.message,
    signature: input.signature as `0x${string}`,
  });
  return recovered.toLowerCase() === input.sessionKey.toLowerCase();
};
