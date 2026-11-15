import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formatMobile, isValidMobile, normalizeMobile, toWhatsAppLink, validateMobile } from "../src/mobile";
import { validMobile } from "./arbitraries";

// 98765 43210 is the conventional demo number.
describe("normalizeMobile and validateMobile", () => {
  it.each(["9876543210", "+91 98765 43210", "+91-98765-43210", "0091 9876543210", "919876543210", "09876543210", "(+91) 98765.43210"])(
    "accepts %j",
    (input) => {
      expect(validateMobile(input)).toEqual({ ok: true, value: "9876543210" });
    },
  );

  it.each([
    ["", "EMPTY"],
    ["   ", "EMPTY"],
    ["98765 4321O", "INVALID_CHARACTERS"],
    ["987654321", "INVALID_LENGTH"],
    ["98765432100", "INVALID_LENGTH"],
    ["5876543210", "INVALID_START_DIGIT"],
    ["044 2345 6789", "INVALID_START_DIGIT"],
  ])("rejects %j with %s", (input, reason) => {
    expect(validateMobile(input)).toMatchObject({ ok: false, reason });
  });

  it("leaves unknown prefixes alone", () => {
    expect(normalizeMobile("+1 555 0100")).toBe("+15550100");
  });
});

describe("formatMobile and toWhatsAppLink", () => {
  it("formats for display and storage", () => {
    expect(formatMobile("9876543210")).toEqual({ ok: true, value: "+91 98765 43210" });
    expect(formatMobile("09876543210", "national")).toEqual({ ok: true, value: "98765 43210" });
    expect(formatMobile("+91 98765 43210", "e164")).toEqual({ ok: true, value: "+919876543210" });
    expect(formatMobile("123").ok).toBe(false);
  });

  it("builds wa.me links", () => {
    expect(toWhatsAppLink("+91 98765 43210")).toEqual({ ok: true, value: "https://wa.me/919876543210" });
    expect(toWhatsAppLink("9876543210", " Is the order ready? ")).toEqual({
      ok: true,
      value: "https://wa.me/919876543210?text=Is%20the%20order%20ready%3F",
    });
    expect(toWhatsAppLink("9876543210", "   ")).toEqual({ ok: true, value: "https://wa.me/919876543210" });
    expect(toWhatsAppLink("1").ok).toBe(false);
  });

  it("every way of writing a valid number normalises to the same 10 digits", () => {
    const prefix = fc.constantFrom("", "+91", "+91 ", "0", "91", "0091");
    fc.assert(
      fc.property(validMobile, prefix, (number, pre) => {
        const spaced = `${pre}${number.slice(0, 5)} ${number.slice(5)}`;
        const result = validateMobile(spaced);
        return result.ok && result.value === number && isValidMobile(number);
      }),
    );
  });
});
