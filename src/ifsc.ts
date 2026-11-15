import { compact, err, ok, type Result } from "./result";

export type IfscError = "EMPTY" | "INVALID_LENGTH" | "INVALID_BANK_CODE" | "INVALID_FIFTH_CHARACTER" | "INVALID_BRANCH_CODE";

export interface IfscParts {
  readonly ifsc: string;
  /** First four letters, assigned to the bank by RBI, e.g. "SBIN". */
  readonly bankCode: string;
  /** Last six characters, chosen by the bank for the branch. */
  readonly branchCode: string;
}

/** Upper-cases and removes spaces, hyphens and dots. */
export function normalizeIfsc(input: string): string {
  return compact(input);
}

/**
 * Offline check of an IFSC's shape.
 * Source: RBI, "NEFT FAQs": 11 characters, the first four alphabetic (bank),
 * the fifth always 0 (reserved), the last six alphanumeric (branch).
 * A valid shape does not mean the branch exists: use `lookupIfsc` for that.
 */
export function validateIfsc(input: string): Result<string, IfscError> {
  const ifsc = normalizeIfsc(input);
  if (ifsc === "") return err("EMPTY", "Enter an IFSC.");
  if (ifsc.length !== 11) return err("INVALID_LENGTH", `An IFSC has 11 characters; this has ${ifsc.length}.`);
  const badBank = ifsc.slice(0, 4).search(/[^A-Z]/);
  if (badBank !== -1) return err("INVALID_BANK_CODE", "The first four characters are the bank code and must be letters.", badBank);
  if (ifsc.charAt(4) !== "0") return err("INVALID_FIFTH_CHARACTER", "The fifth character of an IFSC is always 0 (zero).", 4);
  const badBranch = ifsc.slice(5).search(/[^0-9A-Z]/);
  if (badBranch !== -1) {
    return err("INVALID_BRANCH_CODE", "The last six characters are the branch code and must be letters or digits.", badBranch + 5);
  }
  return ok(ifsc);
}

export function isValidIfsc(input: string): boolean {
  return validateIfsc(input).ok;
}

export function parseIfsc(input: string): Result<IfscParts, IfscError> {
  const result = validateIfsc(input);
  if (!result.ok) return result;
  return ok({ ifsc: result.value, bankCode: result.value.slice(0, 4), branchCode: result.value.slice(5) });
}

/**
 * Your function that asks an IFSC directory about a code. Return the details,
 * or null when the directory says the code does not exist. Throw on network errors.
 */
export type IfscFetcher<T> = (ifsc: string, signal: AbortSignal) => Promise<T | null>;

export interface IfscLookupOptions {
  /** Give up after this many milliseconds. Default 8000. */
  readonly timeoutMs?: number;
  /** Cancel from outside, e.g. when a component unmounts. */
  readonly signal?: AbortSignal;
}

export type IfscLookupError = IfscError | "NOT_FOUND" | "TIMEOUT" | "ABORTED" | "LOOKUP_FAILED";

/**
 * Checks the shape offline first (no request is made for a malformed code),
 * then calls the fetcher you provide. bharat-kit never makes network calls by itself.
 */
export async function lookupIfsc<T>(
  input: string,
  fetcher: IfscFetcher<T>,
  options: IfscLookupOptions = {},
): Promise<Result<T, IfscLookupError>> {
  const valid = validateIfsc(input);
  if (!valid.ok) return valid;
  if (options.signal?.aborted) return err("ABORTED", "The lookup was cancelled.");

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? 8000);
  const onAbort = (): void => controller.abort();
  options.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const details = await raceAbort(fetcher(valid.value, controller.signal), controller.signal);
    if (details === null) return err("NOT_FOUND", `No branch found for ${valid.value}.`);
    return ok(details);
  } catch (error) {
    if (timedOut) return err("TIMEOUT", "The IFSC lookup took too long. Try again.");
    if (options.signal?.aborted) return err("ABORTED", "The lookup was cancelled.");
    const detail = error instanceof Error ? ` (${error.message})` : "";
    return err("LOOKUP_FAILED", `The IFSC lookup failed${detail}.`);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

/** Rejects as soon as the signal aborts, even if the fetcher ignores the signal. */
function raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    promise.then(resolve, reject);
  });
}
