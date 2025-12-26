import { randomInt, timingSafeEqual } from "crypto";

const generateCodeAndHash = () => {
  const code = randomInt(1000000000, 9999999999).toString();
  const hmacSecret = Bun.env.HMAC_SECRET;
  const hash = new Bun.CryptoHasher(
    "sha256",
    hmacSecret || "change-me-in-production"
  )
    .update(code)
    .digest("hex");
  return { code, hash };
};

const verifyCodeAndHash = (code: string, hash: string) => {
  const hmacSecret = Bun.env.HMAC_SECRET;
  const calculatedHash = new Bun.CryptoHasher(
    "sha256",
    hmacSecret || "change-me-in-production"
  )
    .update(code)
    .digest("hex");
  return timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(hash));
};

export { generateCodeAndHash, verifyCodeAndHash };
