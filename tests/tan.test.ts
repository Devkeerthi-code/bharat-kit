import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { isValidTan, normalizeTan, parseTan, validateTan } from "../src/tan";

// Demo TANs: made-up values that follow the published structure.
const letters = fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
const digits = fc.constantFrom(..."0123456789".split(""));
const validTan = fc
  .tuple(fc.array(letters, { minLength: 4, maxLength: 4 }), fc.array(digits, { minLength: 5, maxLength: 5 }), letters)
  .map(([a, b, c]) => `${a.join("")}${b.join("")}${c}`);

describe("validateTan", () => {
  it.each(["BLRA12345B", "blra12345b", " BLRA 12345 B ", "MUMS-98765-K"])("accepts %j", (input) => {
    expect(isValidTan(input)).toBe(true);
  });

  it.each([
    ["", "EMPTY", undefined],
    ["BLRA1234B", "INVALID_LENGTH", undefined],
    ["1LRA12345B", "INVALID_FORMAT", 0],
    ["BLR012345B", "INVALID_FORMAT", 3],
    ["BLRA1X345B", "INVALID_FORMAT", 5],
    ["BLRA123456", "INVALID_FORMAT", 9],
  ])("rejects %j with %s", (input, reason, index) => {
    const result = validateTan(input);
    expect(result).toMatchObject({ ok: false, reason });
    expect(result.ok ? "ok" : result.index).toBe(index);
  });

  it("explains the expected shape", () => {
    const result = validateTan("BLRA1X345B");
    expect(!result.ok && result.message).toBe("Character 6 must be a digit. A TAN looks like BLRA12345B.");
  });
});

describe("parseTan", () => {
  it("splits jurisdiction, initial, sequence and check character", () => {
    expect(parseTan("blra12345b")).toEqual({
      ok: true,
      value: { tan: "BLRA12345B", jurisdiction: "BLR", nameInitial: "A", sequence: "12345", checkCharacter: "B" },
    });
    expect(parseTan("BLRA").ok).toBe(false);
    expect(normalizeTan("bl ra")).toBe("BLRA");
  });

  it("every generated TAN validates and parses back to itself", () => {
    fc.assert(fc.property(validTan, (tan) => {
      const parsed = parseTan(tan.toLowerCase());
      return parsed.ok && parsed.value.tan === tan && parsed.value.jurisdiction + parsed.value.nameInitial + parsed.value.sequence + parsed.value.checkCharacter === tan;
    }));
  });

  it("a single wrong-kind character is always reported at its position", () => {
    fc.assert(fc.property(validTan, fc.integer({ min: 0, max: 9 }), (tan, i) => {
      const swapped = tan.slice(0, i) + (i >= 4 && i <= 8 ? "X" : "7") + tan.slice(i + 1);
      const result = validateTan(swapped);
      return !result.ok && result.reason === "INVALID_FORMAT" && result.index === i;
    }));
  });
});
