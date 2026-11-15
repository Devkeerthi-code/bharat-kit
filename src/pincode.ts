import { PIN_ZONES, postalCircleFor, type PinZone } from "./data/postal";
import { err, ok, type Result } from "./result";

export { PIN_ZONES, type PinZone };

export type PincodeError = "EMPTY" | "INVALID_CHARACTERS" | "INVALID_LENGTH" | "INVALID_ZONE";

export interface PincodeParts {
  readonly pincode: string;
  /** First digit, 1–9. */
  readonly zone: PinZone;
  readonly zoneRegion: string;
  /** First two digits. */
  readonly subZone: string;
  /** Postal circle for the first two digits, or null where none is allocated. */
  readonly circle: string | null;
  /** First three digits: the sorting district. */
  readonly sortingDistrict: string;
}

/** Removes spaces and hyphens, so "560 001" becomes "560001". */
export function normalizePincode(input: string): string {
  return input.replace(/[\s-]+/g, "");
}

/** Checks the format: six digits, the first 1–9. It does not check that the post office exists. */
export function validatePincode(input: string): Result<string, PincodeError> {
  const pincode = normalizePincode(input);
  if (pincode === "") return err("EMPTY", "Enter a pincode.");
  const bad = pincode.search(/\D/);
  if (bad !== -1) return err("INVALID_CHARACTERS", "A pincode has digits only.", bad);
  if (pincode.length !== 6) return err("INVALID_LENGTH", `A pincode has 6 digits; this has ${pincode.length}.`);
  if (pincode.startsWith("0")) return err("INVALID_ZONE", "A pincode cannot start with 0. The first digit is the postal zone, 1–9.", 0);
  return ok(pincode);
}

export function isValidPincode(input: string): boolean {
  return validatePincode(input).ok;
}

/** Validates a pincode and reads its zone, sub-zone, postal circle and sorting district. */
export function parsePincode(input: string): Result<PincodeParts, PincodeError> {
  const result = validatePincode(input);
  if (!result.ok) return result;
  const pincode = result.value;
  const zone = Number(pincode.charAt(0)) as PinZone;
  return ok({
    pincode,
    zone,
    zoneRegion: PIN_ZONES[zone],
    subZone: pincode.slice(0, 2),
    circle: postalCircleFor(Number(pincode.slice(0, 2))),
    sortingDistrict: pincode.slice(0, 3),
  });
}
