import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { decrypt, encrypt } from "./crypto";

beforeAll(() => {
  process.env.CPR_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("CPR-kryptering", () => {
  it("krypterer og dekrypterer", () => {
    const c = encrypt("030185-1234");
    expect(c).not.toContain("030185");
    expect(decrypt(c)).toBe("030185-1234");
  });

  it("giver forskellig chiffertekst hver gang", () => {
    expect(encrypt("030185-1234")).not.toBe(encrypt("030185-1234"));
  });

  it("afviser manipulerede data", () => {
    const [v, iv, tag, ct] = encrypt("030185-1234").split(":");
    const tampered = [v, iv, tag, Buffer.from("x" + ct).toString("base64")].join(":");
    expect(() => decrypt(tampered)).toThrow();
  });
});
