import { GST_STATE_CODES, LEGACY_GST_STATE_CODES, type GstStateCode } from "./data/gst-states";
import { PAN_HOLDER_TYPES, type PanHolderType } from "./pan";
import { compact, err, ok, type Result } from "./result";

export { GST_STATE_CODES, LEGACY_GST_STATE_CODES, type GstStateCode };

export type GstinError =
  | "EMPTY"
  | "INVALID_LENGTH"
  | "INVALID_CHARACTERS"
  | "INVALID_STATE_CODE"
  | "INVALID_PAN"
  | "INVALID_ENTITY_NUMBER"
  | "INVALID_DEFAULT_CHARACTER"
  | "INVALID_CHECK_DIGIT";

export interface GstinParts {
  readonly gstin: string;
  readonly stateCode: GstStateCode;
  readonly stateName: string;
  /** True for codes 25 and 28, which are no longer issued. */
  readonly legacyStateCode: boolean;
  /** Characters 3–12: the holder's PAN. */
  readonly pan: string;
  readonly panHolderType: PanHolderType;
  /** Character 13: registrations under the same PAN in the same state, 1–9 then A–Z. */
  readonly entityNumber: string;
  /** Character 14: "Z" by default for regular taxpayers. */
  readonly defaultCharacter: "Z";
  /** Character 15: mod-36 check character over the first 14. */
  readonly checkDigit: string;
}

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * GSTN's check-character algorithm (a Luhn mod 36 variant).
 * Each of the first 14 characters is mapped to 0–35 and multiplied by 1 or 2 alternately,
 * starting with 1. The quotient and remainder of each product by 36 are added up; the check
 * character is (36 − sum mod 36) mod 36.
 * Returns null if `first14` is not 14 characters from 0–9 and A–Z.
 */
export function gstinCheckDigit(first14: string): string | null {
  const value = first14.toUpperCase();
  if (!/^[0-9A-Z]{14}$/.test(value)) return null;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = ALPHABET.indexOf(value.charAt(i)) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return ALPHABET.charAt((36 - (sum % 36)) % 36);
}

export function isGstStateCode(code: string): code is GstStateCode {
  return Object.prototype.hasOwnProperty.call(GST_STATE_CODES, code);
}

/** Upper-cases and removes spaces, hyphens and dots. */
export function normalizeGstin(input: string): string {
  return compact(input);
}

function checkPan(pan: string, offset: number): Result<string, GstinError> | null {
  for (let i = 0; i < 10; i++) {
    const wantsDigit = i >= 5 && i <= 8;
    if (!(wantsDigit ? /[0-9]/ : /[A-Z]/).test(pan.charAt(i))) {
      const kind = wantsDigit ? "a digit" : "a letter";
      return err("INVALID_PAN", `Character ${i + offset + 1} must be ${kind} (PAN part).`, i + offset);
    }
  }
  if (!Object.prototype.hasOwnProperty.call(PAN_HOLDER_TYPES, pan.charAt(3))) {
    return err("INVALID_PAN", `Character ${offset + 4} is the PAN holder type and "${pan.charAt(3)}" is not one.`, offset + 3);
  }
  return null;
}

/**
 * Checks a regular taxpayer's GSTIN: length, characters, state code, embedded PAN,
 * entity number, the default "Z", and the check digit.
 */
export function validateGstin(input: string): Result<string, GstinError> {
  const gstin = normalizeGstin(input);
  if (gstin === "") return err("EMPTY", "Enter a GSTIN.");
  if (gstin.length !== 15) return err("INVALID_LENGTH", `A GSTIN has 15 characters; this has ${gstin.length}.`);
  const badChar = gstin.search(/[^0-9A-Z]/);
  if (badChar !== -1) return err("INVALID_CHARACTERS", "Only the letters A–Z and digits 0–9 are allowed.", badChar);

  const state = gstin.slice(0, 2);
  if (!isGstStateCode(state)) return err("INVALID_STATE_CODE", `${state} is not a GST state code. Use 01–38, 97 or 99.`, 0);

  const panError = checkPan(gstin.slice(2, 12), 2);
  if (panError) return panError;

  if (!/[1-9A-Z]/.test(gstin.charAt(12))) {
    return err("INVALID_ENTITY_NUMBER", "Character 13 is the entity number and must be 1–9 or A–Z.", 12);
  }
  if (gstin.charAt(13) !== "Z") return err("INVALID_DEFAULT_CHARACTER", "Character 14 must be Z.", 13);

  const expected = gstinCheckDigit(gstin.slice(0, 14));
  if (expected !== gstin.charAt(14)) {
    return err("INVALID_CHECK_DIGIT", `The check digit should be ${String(expected)}, not ${gstin.charAt(14)}.`, 14);
  }
  return ok(gstin);
}

export function isValidGstin(input: string): boolean {
  return validateGstin(input).ok;
}

/** Validates a GSTIN and splits it into state code, PAN, entity number and check digit. */
export function parseGstin(input: string): Result<GstinParts, GstinError> {
  const result = validateGstin(input);
  if (!result.ok) return result;
  const gstin = result.value;
  const stateCode = gstin.slice(0, 2) as GstStateCode;
  return ok({
    gstin,
    stateCode,
    stateName: GST_STATE_CODES[stateCode],
    legacyStateCode: LEGACY_GST_STATE_CODES.includes(stateCode),
    pan: gstin.slice(2, 12),
    panHolderType: gstin.charAt(5) as PanHolderType,
    entityNumber: gstin.charAt(12),
    defaultCharacter: "Z",
    checkDigit: gstin.charAt(14),
  });
}

/** Builds a GSTIN from its parts. Returns null if the parts don't make a valid GSTIN. */
export function formatGstin(parts: Pick<GstinParts, "stateCode" | "pan" | "entityNumber">): string | null {
  const first14 = `${parts.stateCode}${parts.pan}${parts.entityNumber}Z`.toUpperCase();
  const check = gstinCheckDigit(first14);
  if (check === null) return null;
  const gstin = first14 + check;
  return isValidGstin(gstin) ? gstin : null;
}
