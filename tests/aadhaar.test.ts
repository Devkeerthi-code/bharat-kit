import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  isValidAadhaar,
  maskAadhaar,
  normalizeAadhaar,
  validateAadhaar,
  verhoeffCheckDigit,
  verhoeffValidate,
} from "../src/aadhaar";
import { validAadhaar } from "./arbitraries";

// 2345 6789 0124 is a made-up demo number that happens to pass the checksum.
const DEMO = "234567890124";

describe("Verhoeff", () => {
  it("matches the worked example: 236 → check digit 3", () => {
    expect(verhoeffCheckDigit("236")).toBe(3);
    expect(verhoeffValidate("2363")).toBe(true);
    expect(verhoeffValidate("2364")).toBe(false);
  });

  it("rejects non-digits", () => {
    expect(verhoeffCheckDigit("12a")).toBeNull();
    expect(verhoeffValidate("")).toBe(false);
  });

  it("catches every adjacent transposition at every position (exhaustive)", () => {
    for (let i = 0; i < 11; i++) {
      for (let a = 0; a < 10; a++) {
        for (let b = 0; b < 10; b++) {
          if (a === b) continue;
          const digits = Array.from({ length: 11 }, () => "5");
          digits[i] = String(a);
          if (i + 1 < 11) digits[i + 1] = String(b);
          const first11 = digits.join("");
          const valid = first11 + String(verhoeffCheckDigit(first11));
          if (valid.charAt(i) === valid.charAt(i + 1)) continue;
          const swapped = valid.slice(0, i) + valid.charAt(i + 1) + valid.charAt(i) + valid.slice(i + 2);
          expect(verhoeffValidate(swapped), `${valid} → ${swapped}`).toBe(false);
        }
      }
    }
  });

  it("catches every single-digit error and every adjacent transposition", () => {
    fc.assert(
      fc.property(validAadhaar, fc.integer({ min: 0, max: 11 }), fc.integer({ min: 1, max: 9 }), (n, i, delta) => {
        const changed = n.slice(0, i) + String((Number(n.charAt(i)) + delta) % 10) + n.slice(i + 1);
        return !verhoeffValidate(changed);
      }),
    );
    fc.assert(
      fc.property(validAadhaar, fc.integer({ min: 0, max: 10 }), (n, i) => {
        if (n.charAt(i) === n.charAt(i + 1)) return true;
        const swapped = n.slice(0, i) + n.charAt(i + 1) + n.charAt(i) + n.slice(i + 2);
        return !verhoeffValidate(swapped);
      }),
    );
  });
});

describe("validateAadhaar", () => {
  it.each([DEMO, "2345 6789 0124", "2345-6789-0124"])("accepts %j", (input) => {
    expect(isValidAadhaar(input)).toBe(true);
  });

  it.each([
    ["", "EMPTY"],
    ["2345 6789 012A", "INVALID_CHARACTERS"],
    ["23456789012", "INVALID_LENGTH"],
    ["134567890124", "INVALID_FIRST_DIGIT"],
    ["034567890124", "INVALID_FIRST_DIGIT"],
    ["234567890125", "INVALID_CHECKSUM"],
  ])("rejects %j with %s", (input, reason) => {
    expect(validateAadhaar(input)).toMatchObject({ ok: false, reason });
  });

  it("never repeats the number in an error message", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[0-9]{12}$/), (n) => {
        const result = validateAadhaar(n);
        return result.ok || (!result.message.includes(n) && !result.message.includes(n.slice(-4)));
      }),
    );
  });

  it("every generated number validates", () => {
    fc.assert(fc.property(validAadhaar, (n) => isValidAadhaar(n)));
  });
});

describe("maskAadhaar", () => {
  it("shows only the last four digits", () => {
    expect(maskAadhaar(DEMO)).toEqual({ ok: true, value: "XXXX XXXX 0124" });
    expect(maskAadhaar("2345 6789 0124", { maskChar: "•" })).toEqual({ ok: true, value: "•••• •••• 0124" });
    expect(maskAadhaar("1234")).toMatchObject({ ok: false, reason: "INVALID_LENGTH" });
    expect(normalizeAadhaar("2345 6789-0124")).toBe(DEMO);
  });
});
