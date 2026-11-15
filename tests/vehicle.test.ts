import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formatVehicleNumber, isValidVehicleNumber, normalizeVehicleNumber, parseVehicleNumber, validateVehicleNumber } from "../src/vehicle";
import { validStatePlate } from "./arbitraries";

// Demo registration numbers only.
describe("parseVehicleNumber", () => {
  it("parses a state plate", () => {
    expect(parseVehicleNumber("ka-01-ab-1234")).toEqual({
      ok: true,
      value: {
        kind: "state",
        registration: "KA01AB1234",
        stateCode: "KA",
        stateName: "Karnataka",
        legacyStateCode: false,
        rtoCode: "01",
        series: "AB",
        number: "1234",
      },
    });
  });

  it("parses a Bharat series plate", () => {
    expect(parseVehicleNumber("22 BH 1234 AA")).toEqual({
      ok: true,
      value: { kind: "bharat", registration: "22BH1234AA", year: "22", number: "1234", series: "AA" },
    });
  });

  it.each(["DL 1C AB 1234", "MH 12 1234", "TS 09 E 9", "UP 32 ABC 0001"])("accepts %j", (input) => {
    expect(isValidVehicleNumber(input)).toBe(true);
  });

  it("flags legacy state codes", () => {
    const result = parseVehicleNumber("OR 02 AB 1234");
    expect(result.ok && result.value.kind === "state" && result.value.legacyStateCode).toBe(true);
  });

  it.each([
    ["", "EMPTY"],
    ["KA 01 AB 12345", "INVALID_FORMAT"],
    ["K 01 AB 1234", "INVALID_FORMAT"],
    ["XX 01 AB 1234", "UNKNOWN_STATE_CODE"],
    ["KA 00 AB 1234", "INVALID_RTO_CODE"],
    ["KA 01 AB 0000", "INVALID_NUMBER"],
    ["22 BH 0000 AA", "INVALID_NUMBER"],
    ["22 BH 1234 A", "INVALID_FORMAT"],
  ])("rejects %j with %s", (input, reason) => {
    expect(parseVehicleNumber(input)).toMatchObject({ ok: false, reason });
  });
});

describe("format and validate", () => {
  it("formats with conventional spacing", () => {
    expect(formatVehicleNumber("ka01ab1234")).toEqual({ ok: true, value: "KA 01 AB 1234" });
    expect(formatVehicleNumber("mh121234")).toEqual({ ok: true, value: "MH 12 1234" });
    expect(formatVehicleNumber("22bh1234aa")).toEqual({ ok: true, value: "22 BH 1234 AA" });
    expect(formatVehicleNumber("nope").ok).toBe(false);
  });

  it("validates to the compact form", () => {
    expect(validateVehicleNumber("KA 01 AB 1234")).toEqual({ ok: true, value: "KA01AB1234" });
    expect(validateVehicleNumber("??").ok).toBe(false);
    expect(normalizeVehicleNumber("ka.01")).toBe("KA01");
  });

  it("format(parse(x)) round-trips", () => {
    fc.assert(
      fc.property(validStatePlate, (plate) => {
        const parsed = parseVehicleNumber(plate);
        if (!parsed.ok) return false;
        const formatted = formatVehicleNumber(parsed.value);
        const reparsed = formatted.ok && parseVehicleNumber(formatted.value);
        return formatted.ok && reparsed !== false && reparsed.ok && reparsed.value.registration === parsed.value.registration;
      }),
    );
  });
});
