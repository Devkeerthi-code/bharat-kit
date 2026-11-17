import { compact, err, ok, type Result } from "./result";

/**
 * TAN (Tax Deduction and Collection Account Number): 4 letters, 5 digits, 1 letter.
 * The first three letters are the jurisdiction code of the assessing officer's city,
 * the fourth is the initial of the deductor's name.
 * Source: Income Tax Department, "Tax Deduction and Collection Account Number (TAN)".
 */
export type TanError = "EMPTY" | "INVALID_LENGTH" | "INVALID_FORMAT";

export interface TanParts {
  readonly tan: string;
  /** Characters 1–3, the city jurisdiction code, e.g. "BLR". */
  readonly jurisdiction: string;
  /** Character 4, the first letter of the deductor's name. */
  readonly nameInitial: string;
  /** Characters 5–9, a running number. */
  readonly sequence: string;
  /** Character 10, an alphabetic check character (algorithm not published). */
  readonly checkCharacter: string;
}

const TAN_SHAPE = /^[A-Z]{4}[0-9]{5}[A-Z]$/;

function wantsDigit(index: number): boolean {
  return index >= 4 && index <= 8;
}

/** Only called once TAN_SHAPE has failed, so some position always mismatches. */
function firstShapeError(tan: string): number {
  return [...tan].findIndex((char, i) => !(wantsDigit(i) ? /[0-9]/ : /[A-Z]/).test(char));
}

/** Upper-cases and removes spaces, hyphens and dots. */
export function normalizeTan(input: string): string {
  return compact(input);
}

/** Checks a TAN's format. Does not contact the Income Tax Department. */
export function validateTan(input: string): Result<string, TanError> {
  const tan = normalizeTan(input);
  if (tan === "") return err("EMPTY", "Enter a TAN.");
  if (tan.length !== 10) return err("INVALID_LENGTH", `A TAN has 10 characters; this has ${tan.length}.`);
  if (!TAN_SHAPE.test(tan)) {
    const index = firstShapeError(tan);
    const kind = wantsDigit(index) ? "a digit" : "a letter";
    return err("INVALID_FORMAT", `Character ${index + 1} must be ${kind}. A TAN looks like BLRA12345B.`, index);
  }
  return ok(tan);
}

export function isValidTan(input: string): boolean {
  return validateTan(input).ok;
}

/** Validates a TAN and splits it into its documented parts. */
export function parseTan(input: string): Result<TanParts, TanError> {
  const result = validateTan(input);
  if (!result.ok) return result;
  const tan = result.value;
  return ok({
    tan,
    jurisdiction: tan.slice(0, 3),
    nameInitial: tan.charAt(3),
    sequence: tan.slice(4, 9),
    checkCharacter: tan.charAt(9),
  });
}
