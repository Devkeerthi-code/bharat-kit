import { describe, expect, it } from "vitest";
import { parseUpiLink } from "../src/upi";

// Demo UPI IDs and links only.
describe("parseUpiLink", () => {
  it("reads every supported parameter", () => {
    expect(parseUpiLink("upi://pay?pa=shop@okbank&pn=Demo%20Shop&am=125.50&cu=INR&tn=Invoice%201042&tr=ORD-7&mc=5411")).toEqual({
      ok: true,
      value: { payeeVpa: "shop@okbank", payeeName: "Demo Shop", amountPaise: 12550, note: "Invoice 1042", transactionRef: "ORD-7", merchantCode: "5411" },
    });
  });

  it("accepts the loose forms QR generators produce", () => {
    expect(parseUpiLink("  UPI://PAY?PA=Shop%40OKBank&pn=Demo+Shop&am=99&extra=1#x ")).toEqual({
      ok: true,
      value: { payeeVpa: "shop@okbank", payeeName: "Demo Shop", amountPaise: 9900 },
    });
    expect(parseUpiLink("upi://pay?pa=shop@okbank&&am=0.5&tn=%20")).toEqual({ ok: true, value: { payeeVpa: "shop@okbank", amountPaise: 50 } });
    expect(parseUpiLink("upi://pay?pa=shop@okbank&am=&flag")).toEqual({ ok: true, value: { payeeVpa: "shop@okbank" } });
  });

  it.each([
    ["", "EMPTY"],
    ["https://example.com/pay?pa=shop@okbank", "NOT_UPI_LINK"],
    ["upi://pay?pa=shop@okbank&pn=%E0%A4", "MALFORMED_ENCODING"],
    ["upi://pay?pa=shop@okbank&pa=other@okbank", "DUPLICATE_PARAMETER"],
    ["upi://pay?pa=shop@okbank&am=10&AM=1000", "DUPLICATE_PARAMETER"],
    ["upi://pay?pn=Demo", "MISSING_PAYEE"],
    ["upi://pay?pa=shop", "MISSING_AT"],
    ["upi://pay?pa=shop@okbank&cu=USD", "INVALID_CURRENCY"],
    ["upi://pay?pa=shop@okbank&mc=54", "INVALID_MERCHANT_CODE"],
    ["upi://pay?pa=shop@okbank&am=0", "INVALID_AMOUNT"],
    ["upi://pay?pa=shop@okbank&am=12.345", "INVALID_AMOUNT"],
    ["upi://pay?pa=shop@okbank&am=-5", "INVALID_AMOUNT"],
    ["upi://pay?pa=shop@okbank&am=99999999999999999", "INVALID_AMOUNT"],
  ])("rejects %j with %s", (link, reason) => {
    expect(parseUpiLink(link)).toMatchObject({ ok: false, reason });
  });
});
