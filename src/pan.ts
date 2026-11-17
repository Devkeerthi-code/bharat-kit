import { compact, err, ok, type Result } from "./result";

/**
 * Holder type encoded in the 4th character of a PAN.
 * Source: Income Tax Department, "Permanent Account Number (PAN)" structure notes.
 */
export const PAN_HOLDER_TYPES = {
  A: "Association of Persons",
  B: "Body of Individuals",
  C: "Company",
  F: "Firm or LLP",
  G: "Government",
  H: "Hindu Undivided Family",
  J: "Artificial Juridical Person",
  L: "Local Authority",
  P: "Individual",
  T: "Trust",
} as const;

export type PanHolderType = keyof typeof PAN_HOLDER_TYPES;

export type PanError = "EMPTY" | "INVALID_LENGTH" | "INVALID_FORMAT" | "INVALID_HOLDER_TYPE";

export interface PanParts {
  readonly pan: string;
  /** The 4th character, e.g. "P". */
  readonly holderType: PanHolderType;
  /** Human name for the holder type, e.g. "Individual". */
  readonly holderTypeName: string;
  /** The 5th character: first letter of the surname (individuals) or of the name (others). */
  readonly nameInitial: string;
  /** Characters 6–9, a running sequence number. */
  readonly sequence: string;
  /** The 10th character, an alphabetic check character (algorithm not published). */
  readonly checkCharacter: string;
}

const PAN_SHAPE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function isHolderType(char: string): char is PanHolderType {
  return Object.prototype.hasOwnProperty.call(PAN_HOLDER_TYPES, char);
}

function wantsDigit(index: number): boolean {
  return index >= 5 && index <= 8;
}

/** Only called once PAN_SHAPE has failed, so some position always mismatches. */
function firstShapeError(pan: string): number {
  return [...pan].findIndex((char, i) => !(wantsDigit(i) ? /[0-9]/ : /[A-Z]/).test(char));
}

/** Upper-cases and removes spaces, so " abcpe 1234 f " becomes "ABCPE1234F". */
export function normalizePan(input: string): string {
  return compact(input);
}

/** Checks a PAN's format and holder type. Does not contact the Income Tax Department. */
export function validatePan(input: string): Result<string, PanError> {
  const pan = normalizePan(input);
  if (pan === "") return err("EMPTY", "Enter a PAN.");
  if (pan.length !== 10) return err("INVALID_LENGTH", `A PAN has 10 characters; this has ${pan.length}.`);
  if (!PAN_SHAPE.test(pan)) {
    const index = firstShapeError(pan);
    const kind = wantsDigit(index) ? "a digit" : "a letter";
    return err("INVALID_FORMAT", `Character ${index + 1} must be ${kind}. A PAN looks like ABCPE1234F.`, index);
  }
  if (!isHolderType(pan.charAt(3))) {
    return err("INVALID_HOLDER_TYPE", `"${pan.charAt(3)}" is not a PAN holder type. The 4th character must be one of ${Object.keys(PAN_HOLDER_TYPES).join(", ")}.`, 3);
  }
  return ok(pan);
}

export function isValidPan(input: string): boolean {
  return validatePan(input).ok;
}

/** Validates a PAN and splits it into its documented parts. */
export function parsePan(input: string): Result<PanParts, PanError> {
  const result = validatePan(input);
  if (!result.ok) return result;
  const pan = result.value;
  const holderType = pan.charAt(3) as PanHolderType;
  return ok({
    pan,
    holderType,
    holderTypeName: PAN_HOLDER_TYPES[holderType],
    nameInitial: pan.charAt(4),
    sequence: pan.slice(5, 9),
    checkCharacter: pan.charAt(9),
  });
}

/** Returns the normalised PAN, or null if it is not valid. Handy for display. */
export function formatPan(input: string): string | null {
  const result = validatePan(input);
  return result.ok ? result.value : null;
}

/**
 * Hides all but the last four characters for display, e.g. on a receipt: "XXXXXX234F".
 * Validates first, so a typo is reported rather than masked.
 */
export function maskPan(input: string, options: { readonly maskChar?: string } = {}): Result<string, PanError> {
  const result = validatePan(input);
  if (!result.ok) return result;
  return ok(`${(options.maskChar ?? "X").repeat(6)}${result.value.slice(6)}`);
}
