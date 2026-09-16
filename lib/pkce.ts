import { randomBytes, createHash } from "crypto";

function base64url(input: Buffer) {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCodeVerifier() {
  return base64url(randomBytes(32));
}

export function codeChallengeFromVerifier(verifier: string) {
  return base64url(createHash("sha256").update(verifier).digest());
}
