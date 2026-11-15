import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formatGstin, gstinCheckDigit, isGstStateCode, isValidGstin, normalizeGstin, parseGstin, validateGstin } from "../src/gstin";
import { validGstin } from "./arbitraries";

// Demo values only. 27AAPFU0939F1ZV is the sample GSTIN widely used in GST documentation.
const PUBLISHED_SAMPLE = "27AAPFU0939F1ZV";
const DEMO = "29ABCPE1234F1Z7";

describe("gstinCheckDigit", () => {
  it("reproduces the published sample's check digit", () => {
    expect(gstinCheckDigit(PUBLISHED_SAMPLE.slice(0, 14))).toBe("V");
  });

  it("accepts lower case and rejects malformed prefixes", () => {
    expect(gstinCheckDigit("29abcpe1234f1z")).toBe("7");
    expect(gstinCheckDigit("29ABCPE1234F1")).toBeNull();
    expect(gstinCheckDigit("29ABCPE1234F1#")).toBeNull();
  });
});

describe("validateGstin", () => {
  it.each([PUBLISHED_SAMPLE, DEMO, " 29abcpe1234f1z7 ", "29-ABCPE-1234F-1Z7"])("accepts %s", (input) => {
    expect(validateGstin(input).ok).toBe(true);
  });

  it.each([
    ["", "EMPTY", undefined],
    ["29ABCPE1234F1Z", "INVALID_LENGTH", undefined],
    ["29ABCPE1234F1Z#", "INVALID_CHARACTERS", 14],
    ["49ABCPE1234F1Z7", "INVALID_STATE_CODE", 0],
    ["291BCPE1234F1Z7", "INVALID_PAN", 2],
    ["29ABCPEX234F1Z7", "INVALID_PAN", 7],
    ["29ABCDE1234F1Z7", "INVALID_PAN", 5],
    ["29ABCPE1234F0Z7", "INVALID_ENTITY_NUMBER", 12],
    ["29ABCPE1234F1Y7", "INVALID_DEFAULT_CHARACTER", 13],
    ["29ABCPE1234F1Z8", "INVALID_CHECK_DIGIT", 14],
  ])("rejects %j with %s", (input, reason, index) => {
    const result = validateGstin(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe(reason);
    expect(result.index).toBe(index);
    expect(result.message.length).toBeGreaterThan(10);
  });

  it("names the expected check digit", () => {
    const result = validateGstin("29ABCPE1234F1Z8");
    expect(!result.ok && result.message).toContain("should be 7");
  });
});

describe("parseGstin", () => {
  it("splits a GSTIN into its parts", () => {
    expect(parseGstin(DEMO)).toEqual({
      ok: true,
      value: {
        gstin: DEMO,
        stateCode: "29",
        stateName: "Karnataka",
        legacyStateCode: false,
        pan: "ABCPE1234F",
        panHolderType: "P",
        entityNumber: "1",
        defaultCharacter: "Z",
        checkDigit: "7",
      },
    });
  });

  it("flags legacy state codes", () => {
    const first14 = "28ABCPE1234F1Z";
    const result = parseGstin(first14 + String(gstinCheckDigit(first14)));
    expect(result.ok && result.value.legacyStateCode).toBe(true);
  });

  it("passes errors through", () => {
    expect(parseGstin("nope").ok).toBe(false);
  });
});

describe("helpers", () => {
  it("normalises and type-guards", () => {
    expect(normalizeGstin(" 29 abc ")).toBe("29ABC");
    expect(isGstStateCode("29")).toBe(true);
    expect(isGstStateCode("40")).toBe(false);
    expect(isValidGstin(DEMO)).toBe(true);
  });

  it("formatGstin builds a GSTIN from parts", () => {
    expect(formatGstin({ stateCode: "29", pan: "abcpe1234f", entityNumber: "1" })).toBe(DEMO);
    expect(formatGstin({ stateCode: "29", pan: "ABC#E1234F", entityNumber: "1" })).toBeNull();
    expect(formatGstin({ stateCode: "40" as "29", pan: "ABCPE1234F", entityNumber: "1" })).toBeNull();
  });
});

describe("properties", () => {
  it("every generated GSTIN validates", () => {
    fc.assert(fc.property(validGstin, (gstin) => isValidGstin(gstin)));
  });

  it("formatGstin(parseGstin(x)) round-trips", () => {
    fc.assert(
      fc.property(validGstin, (gstin) => {
        const parsed = parseGstin(gstin);
        return parsed.ok && formatGstin(parsed.value) === gstin;
      }),
    );
  });

  it("any single-character change in the first 14 is caught", () => {
    fc.assert(
      fc.property(validGstin, fc.integer({ min: 0, max: 13 }), fc.constantFrom(..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")), (gstin, i, char) => {
        if (gstin.charAt(i) === char) return true;
        const changed = gstin.slice(0, i) + char + gstin.slice(i + 1);
        return !isValidGstin(changed);
      }),
    );
  });
});
