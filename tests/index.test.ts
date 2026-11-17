import { describe, expect, it } from "vitest";
import * as kit from "../src/index";

describe("package entry", () => {
  it("exposes every module from the root import", () => {
    for (const name of [
      "validateGstin",
      "validatePan",
      "validateTan",
      "parseCin",
      "lookupIfsc",
      "buildUpiLink",
      "toWhatsAppLink",
      "parsePincode",
      "maskAadhaar",
      "toWords",
      "percentOfPaise",
      "parseVehicleNumber",
    ]) {
      expect(typeof (kit as Record<string, unknown>)[name]).toBe("function");
    }
  });
});
