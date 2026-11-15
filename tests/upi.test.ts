import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { buildUpiLink, isValidVpa, normalizeVpa, parseVpa, validateVpa } from "../src/upi";

// Demo UPI IDs only.
describe("validateVpa", () => {
  it.each(["name@okbank", "Name.Surname@OKBank", "9876543210@ybl", "shop_42-in@upi", " a1@paytm "])("accepts %j", (input) => {
    expect(isValidVpa(input)).toBe(true);
  });

  it.each([
    ["", "EMPTY"],
    ["name", "MISSING_AT"],
    ["name@ok@bank", "MULTIPLE_AT"],
    ["@okbank", "INVALID_HANDLE"],
    ["a@okbank", "INVALID_HANDLE"],
    [".name@okbank", "INVALID_HANDLE"],
    ["na me@okbank", "INVALID_HANDLE"],
    ["name@", "INVALID_PROVIDER"],
    ["name@1bank", "INVALID_PROVIDER"],
    ["name@ok.bank", "INVALID_PROVIDER"],
    [`${"a".repeat(250)}@okbank`, "TOO_LONG"],
  ])("rejects %j with %s", (input, reason) => {
    expect(validateVpa(input)).toMatchObject({ ok: false, reason });
  });

  it("parses handle and provider", () => {
    expect(parseVpa("Name@OKBank")).toEqual({ ok: true, value: { vpa: "name@okbank", handle: "name", provider: "okbank" } });
    expect(parseVpa("bad").ok).toBe(false);
    expect(normalizeVpa(" A@B ")).toBe("a@b");
  });
});

describe("buildUpiLink", () => {
  const base = { payeeVpa: "shop@okbank", payeeName: "Demo Shop" };

  it("builds a minimal link", () => {
    expect(buildUpiLink(base)).toEqual({ ok: true, value: "upi://pay?pa=shop@okbank&pn=Demo%20Shop&cu=INR" });
  });

  it("encodes every value and formats paise as rupees", () => {
    const result = buildUpiLink({
      ...base,
      payeeName: "Sharma & Sons (demo)",
      amountPaise: 12505,
      note: "Invoice #1042! 50% paid",
      transactionRef: "ORD/2026/7",
      merchantCode: "5411",
    });
    expect(result).toEqual({
      ok: true,
      value: "upi://pay?pa=shop@okbank&pn=Sharma%20%26%20Sons%20%28demo%29&am=125.05&cu=INR&tn=Invoice%20%231042%21%2050%25%20paid&tr=ORD%2F2026%2F7&mc=5411",
    });
  });

  it.each([
    [{ payeeVpa: "nope" }, "MISSING_AT"],
    [{ payeeName: "  " }, "MISSING_NAME"],
    [{ amountPaise: 0 }, "INVALID_AMOUNT"],
    [{ amountPaise: 12.5 }, "INVALID_AMOUNT"],
    [{ merchantCode: "54" }, "INVALID_MERCHANT_CODE"],
  ])("rejects %j", (override, reason) => {
    expect(buildUpiLink({ ...base, ...override })).toMatchObject({ ok: false, reason });
  });

  it("leaves out blank notes and references", () => {
    expect(buildUpiLink({ ...base, note: "   ", transactionRef: " " })).toEqual({ ok: true, value: "upi://pay?pa=shop@okbank&pn=Demo%20Shop&cu=INR" });
  });

  it("round-trips every parameter through URLSearchParams", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }).filter((s) => s.trim() !== ""), fc.string(), fc.integer({ min: 1, max: 10_000_000 }), (name, note, paise) => {
        const result = buildUpiLink({ ...base, payeeName: name, note, amountPaise: paise });
        if (!result.ok) return false;
        const params = new URLSearchParams(result.value.replace("upi://pay?", ""));
        return (
          params.get("pa") === "shop@okbank" &&
          params.get("pn") === name.trim() &&
          (note.trim() === "" ? !params.has("tn") : params.get("tn") === note.trim()) &&
          Math.round(Number(params.get("am")) * 100) === paise &&
          !result.value.includes(" ")
        );
      }),
      { numRuns: 2000 },
    );
  });
});
