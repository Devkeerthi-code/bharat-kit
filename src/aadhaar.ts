import { err, ok, type Result } from "./result";

/*
 * Privacy: these functions are pure. They never store, log or send a number, and no
 * error message repeats the input, so results are safe to log or show.
 */

export type AadhaarError = "EMPTY" | "INVALID_CHARACTERS" | "INVALID_LENGTH" | "INVALID_FIRST_DIGIT" | "INVALID_CHECKSUM";

/*
 * Verhoeff tables: multiplication in the dihedral group D5, the permutation applied per
 * position, and the inverse. Source: J. Verhoeff, "Error Detecting Decimal Codes" (1969),
 * as tabulated in the Wikipedia article "Verhoeff algorithm". UIDAI uses Verhoeff for the
 * 12th digit of an Aadhaar number.
 */
// Each table is written row by row, 10 digits per row, so a cell is one character.
const D = "0123456789123406789523401789563401289567401239567859876043216598710432765982104387659321049876543210";
const P = "01234567891576283094580379614289160435279453126870428657390127938064157046913258";
const INV = "0432156789";

function cell(table: string, row: number, column: number): number {
  return table.charCodeAt(row * 10 + column) - 48;
}

function digitsFromRight(digits: string): number[] {
  return [...digits].reverse().map(Number);
}

function verhoeffSum(digits: string, offset: number): number {
  return digitsFromRight(digits).reduce((check, digit, i) => cell(D, check, cell(P, (i + offset) % 8, digit)), 0);
}

/** True when the last digit of `digits` is a correct Verhoeff check digit for the rest. */
export function verhoeffValidate(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  return verhoeffSum(digits, 0) === 0;
}

/** The Verhoeff check digit to append to `digits`, or null if it is not all digits. */
export function verhoeffCheckDigit(digits: string): number | null {
  if (!/^\d+$/.test(digits)) return null;
  return cell(INV, 0, verhoeffSum(digits, 1));
}

/** Removes spaces and hyphens. */
export function normalizeAadhaar(input: string): string {
  return input.replace(/[\s-]+/g, "");
}

/**
 * Checks the format and Verhoeff checksum of an Aadhaar number.
 * Source: UIDAI: 12 digits, not starting with 0 or 1, the last digit a Verhoeff checksum.
 * A passing checksum does not mean the number was issued. Only UIDAI can confirm that.
 */
export function validateAadhaar(input: string): Result<string, AadhaarError> {
  const digits = normalizeAadhaar(input);
  if (digits === "") return err("EMPTY", "Enter an Aadhaar number.");
  if (/\D/.test(digits)) return err("INVALID_CHARACTERS", "An Aadhaar number has digits only.");
  if (digits.length !== 12) return err("INVALID_LENGTH", "An Aadhaar number has 12 digits.");
  if (digits.startsWith("0") || digits.startsWith("1")) {
    return err("INVALID_FIRST_DIGIT", "An Aadhaar number does not start with 0 or 1.", 0);
  }
  if (!verhoeffValidate(digits)) return err("INVALID_CHECKSUM", "This is not a valid Aadhaar number. Check for a mistyped digit.");
  return ok(digits);
}

export function isValidAadhaar(input: string): boolean {
  return validateAadhaar(input).ok;
}

export interface MaskOptions {
  /** Character used for hidden digits. Default "X". */
  readonly maskChar?: string;
}

/**
 * Masks all but the last four digits, as UIDAI's masked Aadhaar does: "XXXX XXXX 1234".
 * Works on any 12-digit input, valid or not, so you can mask before you validate.
 */
export function maskAadhaar(input: string, options: MaskOptions = {}): Result<string, "INVALID_LENGTH"> {
  const digits = normalizeAadhaar(input);
  if (!/^\d{12}$/.test(digits)) return err("INVALID_LENGTH", "Masking needs a 12-digit Aadhaar number.");
  const mask = (options.maskChar ?? "X").repeat(4);
  return ok(`${mask} ${mask} ${digits.slice(8)}`);
}
