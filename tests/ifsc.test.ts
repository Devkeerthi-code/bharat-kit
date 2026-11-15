import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import { isValidIfsc, lookupIfsc, normalizeIfsc, parseIfsc, validateIfsc } from "../src/ifsc";
import { validIfsc } from "./arbitraries";

// SBIN0001234 is a demo code: real bank prefix, made-up branch.
describe("validateIfsc", () => {
  it.each(["SBIN0001234", "sbin0001234", "HDFC0ABC123", "SBIN 0001 234"])("accepts %j", (input) => {
    expect(isValidIfsc(input)).toBe(true);
  });

  it.each([
    ["", "EMPTY", undefined],
    ["SBIN000123", "INVALID_LENGTH", undefined],
    ["SB1N0001234", "INVALID_BANK_CODE", 2],
    ["SBIN1001234", "INVALID_FIFTH_CHARACTER", 4],
    ["SBIN00012#4", "INVALID_BRANCH_CODE", 9],
  ])("rejects %j with %s", (input, reason, index) => {
    const result = validateIfsc(input);
    expect(result).toMatchObject({ ok: false, reason });
    expect(result.ok ? "ok" : result.index).toBe(index);
  });

  it("parses bank and branch", () => {
    expect(parseIfsc("sbin0001234")).toEqual({ ok: true, value: { ifsc: "SBIN0001234", bankCode: "SBIN", branchCode: "001234" } });
    expect(parseIfsc("x").ok).toBe(false);
    expect(normalizeIfsc("sbin-0001")).toBe("SBIN0001");
  });

  it("every generated IFSC validates", () => {
    fc.assert(fc.property(validIfsc, (code) => isValidIfsc(code)));
  });
});

describe("lookupIfsc", () => {
  const details = { bank: "Demo Bank", branch: "Demo Branch" };

  it("does not call the fetcher for a malformed code", async () => {
    const fetcher = vi.fn();
    const result = await lookupIfsc("SBIN1001234", fetcher);
    expect(result).toMatchObject({ ok: false, reason: "INVALID_FIFTH_CHARACTER" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns the fetcher's details with the normalised code", async () => {
    const fetcher = vi.fn().mockResolvedValue(details);
    expect(await lookupIfsc("sbin0001234", fetcher)).toEqual({ ok: true, value: details });
    expect(fetcher).toHaveBeenCalledWith("SBIN0001234", expect.any(AbortSignal));
  });

  it("maps null to NOT_FOUND", async () => {
    expect(await lookupIfsc("SBIN0001234", async () => null)).toMatchObject({ ok: false, reason: "NOT_FOUND" });
  });

  it("reports fetcher errors", async () => {
    const failing = async (): Promise<never> => {
      throw new Error("HTTP 503");
    };
    expect(await lookupIfsc("SBIN0001234", failing)).toMatchObject({ ok: false, reason: "LOOKUP_FAILED", message: "The IFSC lookup failed (HTTP 503)." });
    const throwsString = async (): Promise<never> => Promise.reject(new Error("x")).catch(() => Promise.reject("plain"));
    expect(await lookupIfsc("SBIN0001234", throwsString)).toMatchObject({ reason: "LOOKUP_FAILED", message: "The IFSC lookup failed." });
  });

  it("times out even when the fetcher ignores the signal", async () => {
    vi.useFakeTimers();
    const pending = lookupIfsc("SBIN0001234", () => new Promise(() => undefined), { timeoutMs: 50 });
    await vi.advanceTimersByTimeAsync(60);
    expect(await pending).toMatchObject({ ok: false, reason: "TIMEOUT" });
    vi.useRealTimers();
  });

  it("can be cancelled before or during the request", async () => {
    const early = new AbortController();
    early.abort();
    expect(await lookupIfsc("SBIN0001234", async () => details, { signal: early.signal })).toMatchObject({ reason: "ABORTED" });

    const late = new AbortController();
    const pending = lookupIfsc("SBIN0001234", () => new Promise(() => undefined), { signal: late.signal });
    late.abort();
    expect(await pending).toMatchObject({ ok: false, reason: "ABORTED" });
  });
});
