import { err, ok, type Result } from "../result";

export type ParseAmountError = "EMPTY" | "NOT_A_NUMBER" | "UNKNOWN_UNIT" | "TOO_MANY_DECIMALS" | "TOO_LARGE";

export interface ParsedAmount {
  /** Exact amount in paise. */
  readonly paise: number;
  /** The same amount in rupees, for display. Do arithmetic on `paise`. */
  readonly rupees: number;
}

/** Powers of ten for each unit people type after a number. */
const UNIT_EXPONENTS: Readonly<Record<string, number>> = {
  "": 0,
  k: 3, thousand: 3, hazar: 3,
  l: 5, lac: 5, lacs: 5, lakh: 5, lakhs: 5,
  cr: 7, crs: 7, crore: 7, crores: 7,
};

/**
 * Reads an amount the way people write it in India:
 * "1250000", "12,50,000", "₹12.5 L", "3.4 Cr", "50k", "Rs. 2 crore", "INR 1,250.50".
 * Exact: "3.4 Cr" is shifted by decimal places, never multiplied as a float.
 */
export function parseAmount(input: string): Result<ParsedAmount, ParseAmountError> {
  const cleaned = input.toLowerCase().replace(/₹|\brs\.?|\binr\b|,|\s+/g, "");
  if (cleaned === "") return err("EMPTY", "Enter an amount.");
  const match = /^(\d+)(?:\.(\d+))?([a-z]*)$/.exec(cleaned);
  if (!match) return err("NOT_A_NUMBER", "Use digits, optionally followed by K, L or Cr, like 3.4 Cr.");
  const [, whole = "", fraction = "", unit = ""] = match;
  const exponent = UNIT_EXPONENTS[unit];
  if (exponent === undefined) return err("UNKNOWN_UNIT", `"${unit}" is not a unit. Use K, L (lakh) or Cr (crore).`);

  const shift = exponent + 2; // to paise
  if (fraction.length > shift) {
    return err("TOO_MANY_DECIMALS", "That is more precise than one paisa. Use fewer decimal places.");
  }
  const paise = Number(`${whole}${fraction.padEnd(shift, "0")}`);
  if (!Number.isSafeInteger(paise)) return err("TOO_LARGE", "This amount is too large to hold exactly.");
  return ok({ paise, rupees: paise / 100 });
}
