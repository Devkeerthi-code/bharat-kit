import { err, ok, type Result } from "../result";

/*
 * Money as integer paise. Floating-point rupees drift (0.1 + 0.2 !== 0.3), so do
 * arithmetic on paise and format only at the edges. These helpers throw a RangeError
 * when given something that is not a safe integer number of paise: that is a bug in the
 * calling code, not bad user input.
 */

export type Rounding = "half-up" | "half-even" | "down" | "up";

function assertPaise(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be a whole number of paise (a safe integer), got ${value}.`);
}

function checked(value: number): number {
  if (!Number.isSafeInteger(value)) throw new RangeError("The result is too large to hold exactly in paise.");
  return value;
}

export type ToPaiseError = "EMPTY" | "NOT_A_NUMBER" | "TOO_MANY_DECIMALS" | "TOO_LARGE";

/**
 * Converts a rupee amount to paise without floating-point error:
 * toPaise("12.5") → 1250, toPaise(0.1) → 10. Accepts at most two decimal places.
 */
export function toPaise(rupees: number | string): Result<number, ToPaiseError> {
  const text = typeof rupees === "number" ? numberToText(rupees) : rupees.trim().replace(/,/g, "");
  if (text === "") return err("EMPTY", "Enter an amount.");
  const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(text);
  if (!match || (match[2] === "" && !match[3])) return err("NOT_A_NUMBER", "Use digits, with up to two decimal places, like 1250.50.");
  const [, sign, whole = "", fraction = ""] = match;
  if (fraction.length > 2) return err("TOO_MANY_DECIMALS", "Amounts have at most two decimal places (paise).");
  const paise = Number(`${whole || "0"}${fraction.padEnd(2, "0")}`);
  if (!Number.isSafeInteger(paise)) return err("TOO_LARGE", "This amount is too large to hold exactly.");
  return ok(sign === "-" && paise !== 0 ? -paise : paise);
}

function numberToText(value: number): string {
  if (!Number.isFinite(value)) return "NaN";
  // Up to 2 decimals survive rounding to 10 significant places; more are reported as such.
  return value.toFixed(10).replace(/0+$/, "").replace(/\.$/, "");
}

/** Paise to a plain rupee string with two decimals: 125050 → "1250.50". */
export function fromPaise(paise: number): string {
  assertPaise(paise, "fromPaise");
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function addPaise(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => {
    assertPaise(amount, "addPaise");
    return checked(sum + amount);
  }, 0);
}

export function subtractPaise(from: number, amount: number): number {
  assertPaise(from, "subtractPaise");
  assertPaise(amount, "subtractPaise");
  return checked(from - amount);
}

/** Multiplies by a whole quantity, e.g. a unit price by the number of items. */
export function multiplyPaise(paise: number, quantity: number): number {
  assertPaise(paise, "multiplyPaise");
  if (!Number.isSafeInteger(quantity)) throw new RangeError("multiplyPaise quantity must be a whole number. Use percentOfPaise for rates.");
  return checked(paise * quantity);
}

function divideRounded(numerator: bigint, denominator: bigint, rounding: Rounding): bigint {
  const negative = numerator < 0n;
  const abs = negative ? -numerator : numerator;
  const quotient = abs / denominator;
  const remainder = abs % denominator;
  const twice = remainder * 2n;
  let roundUp: boolean;
  if (rounding === "down") roundUp = false;
  else if (rounding === "up") roundUp = remainder > 0n;
  else if (rounding === "half-up") roundUp = twice >= denominator;
  else roundUp = twice > denominator || (twice === denominator && quotient % 2n === 1n);
  const magnitude = roundUp ? quotient + 1n : quotient;
  return negative ? -magnitude : magnitude;
}

/**
 * A percentage of an amount, rounded to whole paise: percentOfPaise(99900, 18) → 17982
 * (18% GST on ₹999). `percent` may have up to two decimals (e.g. 2.5 or 0.25).
 * Rounding is half-up by default; "half-even" is banker's rounding. "down" and "up"
 * round towards and away from zero.
 */
export function percentOfPaise(paise: number, percent: number, rounding: Rounding = "half-up"): number {
  assertPaise(paise, "percentOfPaise");
  const basisPoints = Math.round(percent * 100);
  if (!Number.isFinite(percent) || Math.abs(percent * 100 - basisPoints) > 1e-9) {
    throw new RangeError("percentOfPaise percent must have at most two decimal places.");
  }
  return checked(Number(divideRounded(BigInt(paise) * BigInt(basisPoints), 10000n, rounding)));
}

/**
 * Splits an amount into parts in proportion to `weights`, so that the parts always add
 * back up to the total. Leftover paise go to the largest remainders first.
 * allocatePaise(1000, [1, 1, 1]) → [334, 333, 333].
 */
export function allocatePaise(total: number, weights: readonly number[]): number[] {
  assertPaise(total, "allocatePaise");
  if (weights.length === 0 || weights.some((w) => !Number.isFinite(w) || w < 0)) {
    throw new RangeError("allocatePaise needs at least one weight, all finite and non-negative.");
  }
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum === 0) throw new RangeError("allocatePaise weights must not all be zero.");

  const sign = total < 0 ? -1 : 1;
  const abs = Math.abs(total);
  const exact = weights.map((w) => (abs * w) / weightSum);
  const parts = exact.map((value) => Math.floor(value));
  const left = abs - parts.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((value, i) => ({ i, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.i - b.i);
  const bumped = new Set(byRemainder.slice(0, left).map(({ i }) => i));
  // "+ 0" turns -0 into 0 for zero-weight parts of a negative total.
  return parts.map((part, i) => (part + (bumped.has(i) ? 1 : 0)) * sign + 0);
}

/** Splits an amount into `count` near-equal parts: splitPaise(1000, 3) → [334, 333, 333]. */
export function splitPaise(total: number, count: number): number[] {
  if (!Number.isSafeInteger(count) || count < 1) throw new RangeError("splitPaise count must be a whole number of at least 1.");
  return allocatePaise(total, Array.from({ length: count }, () => 1));
}
