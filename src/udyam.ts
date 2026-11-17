import { compact, err, ok, type Result } from "./result";

/**
 * Udyam Registration Number for micro, small and medium enterprises: UDYAM-XX-00-0000000.
 * Two letters for the state, two digits for the district, seven digits for the serial.
 * Source: Ministry of MSME, Udyam Registration portal.
 */
export type UdyamError = "EMPTY" | "MISSING_PREFIX" | "INVALID_LENGTH" | "INVALID_STATE" | "INVALID_DISTRICT" | "INVALID_SERIAL";

export interface UdyamParts {
  /** Formatted with hyphens, e.g. "UDYAM-KA-03-0012345". */
  readonly udyam: string;
  readonly stateCode: string;
  readonly districtCode: string;
  readonly serial: string;
}

const PREFIX = "UDYAM";
const SHAPE_LENGTH = PREFIX.length + 11;

/** Upper-cases and removes spaces, hyphens and dots: "udyam-ka-03-0012345" becomes "UDYAMKA030012345". */
export function normalizeUdyam(input: string): string {
  return compact(input);
}

function split(compacted: string): { stateCode: string; districtCode: string; serial: string } {
  return { stateCode: compacted.slice(5, 7), districtCode: compacted.slice(7, 9), serial: compacted.slice(9) };
}

function checkParts(compacted: string): Result<string, UdyamError> {
  const { stateCode, districtCode, serial } = split(compacted);
  if (!/^[A-Z]{2}$/.test(stateCode)) return err("INVALID_STATE", "After UDYAM comes a two-letter state code, such as KA.", 5);
  if (!/^[0-9]{2}$/.test(districtCode)) return err("INVALID_DISTRICT", "After the state comes a two-digit district code.", 7);
  if (!/^[0-9]{7}$/.test(serial)) return err("INVALID_SERIAL", "The number ends with seven digits.", 9);
  return ok(`${PREFIX}-${stateCode}-${districtCode}-${serial}`);
}

/** Checks a Udyam Registration Number. The value is the hyphenated form. */
export function validateUdyam(input: string): Result<string, UdyamError> {
  const compacted = normalizeUdyam(input);
  if (compacted === "") return err("EMPTY", "Enter a Udyam Registration Number.");
  if (!compacted.startsWith(PREFIX)) return err("MISSING_PREFIX", "A Udyam Registration Number starts with UDYAM.", 0);
  if (compacted.length !== SHAPE_LENGTH) {
    return err("INVALID_LENGTH", "A Udyam Registration Number looks like UDYAM-KA-03-0012345.");
  }
  return checkParts(compacted);
}

export function isValidUdyam(input: string): boolean {
  return validateUdyam(input).ok;
}

/** Validates and splits a Udyam Registration Number into state, district and serial. */
export function parseUdyam(input: string): Result<UdyamParts, UdyamError> {
  const result = validateUdyam(input);
  if (!result.ok) return result;
  return ok({ udyam: result.value, ...split(normalizeUdyam(input)) });
}
