import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formatPan, isValidPan, normalizePan, parsePan, validatePan } from "../src/pan";
import { validPan } from "./arbitraries";

// Demo PANs: made-up values that follow the published structure.
describe("validatePan", () => {
  it.each(["ABCPE1234F", "abcpe1234f", " ABCPE 1234 F ", "AAPFU0939F"])("accepts %j", (input) => {
    expect(isValidPan(input)).toBe(true);
  });

  it.each([
    ["", "EMPTY", undefined],
    ["ABCPE1234", "INVALID_LENGTH", undefined],
    ["1BCPE1234F", "INVALID_FORMAT", 0],
    ["ABCPEX234F", "INVALID_FORMAT", 5],
    ["ABCPE12345", "INVALID_FORMAT", 9],
    ["ABCDE1234F", "INVALID_HOLDER_TYPE", 3],
  ])("rejects %j with %s", (input, reason, index) => {
    const result = validatePan(input);
    expect(result).toMatchObject({ ok: false, reason });
    expect(result.ok ? "ok" : result.index).toBe(index);
  });
});

describe("parsePan", () => {
  it("reads the holder type and parts", () => {
    expect(parsePan("ABCPE1234F")).toEqual({
      ok: true,
      value: { pan: "ABCPE1234F", holderType: "P", holderTypeName: "Individual", nameInitial: "E", sequence: "1234", checkCharacter: "F" },
    });
    expect(parsePan("AAACB1234C").ok && parsePan("AAACB1234C")).toMatchObject({ value: { holderTypeName: "Company" } });
    expect(parsePan("bad").ok).toBe(false);
  });

  it("formats or returns null", () => {
    expect(formatPan(" abcpe1234f ")).toBe("ABCPE1234F");
    expect(formatPan("abc")).toBeNull();
    expect(normalizePan("ab cp")).toBe("ABCP");
  });

  it("every generated PAN validates and parses back to itself", () => {
    fc.assert(fc.property(validPan, (pan) => {
      const parsed = parsePan(pan.toLowerCase());
      return parsed.ok && parsed.value.pan === pan;
    }));
  });
});
