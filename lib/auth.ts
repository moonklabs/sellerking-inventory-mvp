import crypto from "crypto";

export function verifySessionToken(token: string): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return expected === sig;
}

export function createSessionToken(): string {
  const secret = process.env.SESSION_SECRET!;
  const payload = Buffer.from(
    JSON.stringify({ iat: Date.now(), nonce: crypto.randomBytes(16).toString("hex") })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}
