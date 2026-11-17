import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CIN_OWNERSHIP_TYPES, isValidCin, normalizeCin, parseCin, validateCin } from "../src/cin";

// Demo CINs: made-up values that follow the published structure.
const NOW = new Date("2026-06-01T00:00:00Z");
const digits = (n: number) => fc.array(fc.constantFrom(..."0123456789".split("")), { minLength: n, maxLength: n }).map((d) => d.join(""));
const letters = (n: number) => fc.array(fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")), { minLength: n, maxLength: n }).map((d) => d.join(""));
const validCin = fc
  .tuple(fc.constantFrom("L", "U"), digits(5), letters(2), fc.integer({ min: 1850, max: 2026 }), fc.constantFrom(...Object.keys(CIN_OWNERSHIP_TYPES)), digits(6))
  .map(([l, nic, st, year, own, reg]) => `${l}${nic}${st}${year}${own}${reg}`);

describe("validateCin", () => {
  it.each(["U72200KA2010PTC012345", "l65910mh1995plc123456", "U 72200 KA 2010 PTC 012345"])("accepts %j", (input) => {
    expect(validateCin(input, NOW).ok).toBe(true);
  });

  it.each([
    ["", "EMPTY", undefined],
    ["U72200KA2010PTC01234", "INVALID_LENGTH", undefined],
    ["X72200KA2010PTC012345", "INVALID_LISTING", 0],
    ["U7220AKA2010PTC012345", "INVALID_FORMAT", 5],
    ["U722001A2010PTC012345", "INVALID_FORMAT", 6],
    ["U72200KA20X0PTC012345", "INVALID_FORMAT", 10],
    ["U72200KA2010P1C012345", "INVALID_FORMAT", 13],
    ["U72200KA2010PTC01234X", "INVALID_FORMAT", 20],
    ["U72200KA1849PTC012345", "INVALID_YEAR", 8],
    ["U72200KA2027PTC012345", "INVALID_YEAR", 8],
    ["U72200KA2010XYZ012345", "INVALID_OWNERSHIP_TYPE", 12],
  ])("rejects %j with %s", (input, reason, index) => {
    const result = validateCin(input, NOW);
    expect(result).toMatchObject({ ok: false, reason });
    expect(result.ok ? "ok" : result.index).toBe(index);
  });

  it("uses the current year by default", () => {
    expect(isValidCin("U72200KA2010PTC012345")).toBe(true);
    expect(isValidCin(`U72200KA${new Date().getFullYear() + 1}PTC012345`)).toBe(false);
  });

  it("messages say what to fix", () => {
    const result = validateCin("U72200KA2010P1C012345", NOW);
    expect(!result.ok && result.message).toBe("Character 14 must be a letter. A CIN looks like U72200KA2010PTC012345.");
  });
});

describe("parseCin", () => {
  it("splits listing, industry, state, year, ownership and number", () => {
    expect(parseCin("u72200ka2010ptc012345", NOW)).toEqual({
      ok: true,
      value: {
        cin: "U72200KA2010PTC012345",
        listed: false,
        industryCode: "72200",
        stateCode: "KA",
        yearOfIncorporation: 2010,
        ownershipType: "PTC",
        ownershipName: "Private Limited Company",
        registrationNumber: "012345",
      },
    });
    expect(parseCin("L65910MH1995PLC123456").ok && parseCin("L65910MH1995PLC123456")).toMatchObject({ value: { listed: true, ownershipName: "Public Limited Company" } });
    expect(parseCin("bad").ok).toBe(false);
    expect(normalizeCin("u 7220-0")).toBe("U72200");
  });

  it("every generated CIN parses back to its parts", () => {
    fc.assert(fc.property(validCin, (cin) => {
      const parsed = parseCin(cin.toLowerCase(), NOW);
      if (!parsed.ok) return false;
      const v = parsed.value;
      return `${v.listed ? "L" : "U"}${v.industryCode}${v.stateCode}${v.yearOfIncorporation}${v.ownershipType}${v.registrationNumber}` === cin;
    }));
  });
});
