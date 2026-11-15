import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { isValidPincode, normalizePincode, parsePincode, validatePincode } from "../src/pincode";
import { validPincode } from "./arbitraries";

describe("validatePincode", () => {
  it.each(["560001", "110 001", "400-001"])("accepts %j", (input) => {
    expect(isValidPincode(input)).toBe(true);
  });

  it.each([
    ["", "EMPTY"],
    ["56000A", "INVALID_CHARACTERS"],
    ["56001", "INVALID_LENGTH"],
    ["5600011", "INVALID_LENGTH"],
    ["012345", "INVALID_ZONE"],
  ])("rejects %j with %s", (input, reason) => {
    expect(validatePincode(input)).toMatchObject({ ok: false, reason });
  });
});

describe("parsePincode", () => {
  it("reads zone, circle and sorting district", () => {
    expect(parsePincode("560 001")).toEqual({
      ok: true,
      value: {
        pincode: "560001",
        zone: 5,
        zoneRegion: "Andhra Pradesh, Telangana, Karnataka",
        subZone: "56",
        circle: "Karnataka",
        sortingDistrict: "560",
      },
    });
  });

  it.each([
    ["110001", "Delhi"],
    ["500001", "Telangana"],
    ["682001", "Kerala"],
    ["781001", "Assam"],
    ["800001", "Bihar and Jharkhand"],
    ["999999", "Army Postal Service"],
    ["350001", null],
  ])("%s is in %s", (pin, circle) => {
    const result = parsePincode(pin);
    expect(result.ok && result.value.circle).toBe(circle);
  });

  it("passes errors through and normalises", () => {
    expect(parsePincode("0").ok).toBe(false);
    expect(normalizePincode(" 56 00-01 ")).toBe("560001");
  });

  it("every generated pincode parses with a zone matching its first digit", () => {
    fc.assert(fc.property(validPincode, (pin) => {
      const result = parsePincode(pin);
      return result.ok && String(result.value.zone) === pin.charAt(0) && result.value.zoneRegion.length > 0;
    }));
  });
});
