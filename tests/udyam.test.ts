import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { isValidUdyam, normalizeUdyam, parseUdyam, validateUdyam } from "../src/udyam";

// Demo Udyam numbers: made-up values that follow the published structure.
const digits = (n: number) => fc.array(fc.constantFrom(..."0123456789".split("")), { minLength: n, maxLength: n }).map((d) => d.join(""));
const letters = fc.array(fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")), { minLength: 2, maxLength: 2 }).map((d) => d.join(""));
const validUdyam = fc.tuple(letters, digits(2), digits(7)).map(([s, d, n]) => `UDYAM-${s}-${d}-${n}`);

describe("validateUdyam", () => {
  it.each([
    ["UDYAM-KA-03-0012345", "UDYAM-KA-03-0012345"],
    ["udyam-ka-03-0012345", "UDYAM-KA-03-0012345"],
    ["UDYAM KA 03 0012345", "UDYAM-KA-03-0012345"],
    ["UDYAMKA030012345", "UDYAM-KA-03-0012345"],
  ])("accepts %j as %s", (input, value) => {
    expect(validateUdyam(input)).toEqual({ ok: true, value });
    expect(isValidUdyam(input)).toBe(true);
  });

  it.each([
    ["", "EMPTY", undefined],
    ["UAM-KA-03-0012345", "MISSING_PREFIX", 0],
    ["UDYAM-KA-03-001234", "INVALID_LENGTH", undefined],
    ["UDYAM-K1-03-0012345", "INVALID_STATE", 5],
    ["UDYAM-KA-0A-0012345", "INVALID_DISTRICT", 7],
    ["UDYAM-KA-03-00123X5", "INVALID_SERIAL", 9],
  ])("rejects %j with %s", (input, reason, index) => {
    const result = validateUdyam(input);
    expect(result).toMatchObject({ ok: false, reason });
    expect(result.ok ? "ok" : result.index).toBe(index);
  });
});

describe("parseUdyam", () => {
  it("splits state, district and serial", () => {
    expect(parseUdyam("udyam ka 03 0012345")).toEqual({
      ok: true,
      value: { udyam: "UDYAM-KA-03-0012345", stateCode: "KA", districtCode: "03", serial: "0012345" },
    });
    expect(parseUdyam("UDYAM").ok).toBe(false);
    expect(normalizeUdyam("udyam-ka")).toBe("UDYAMKA");
  });

  it("formatting is stable: any valid number, however typed, validates to the same hyphenated form", () => {
    fc.assert(fc.property(validUdyam, (u) => {
      const messy = u.toLowerCase().replace(/-/g, " ");
      const a = validateUdyam(messy);
      return a.ok && a.value === u && validateUdyam(a.value).ok;
    }));
  });
});
