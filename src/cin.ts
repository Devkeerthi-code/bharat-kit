import { compact, err, ok, type Result } from "./result";

/**
 * Corporate Identity Number, issued by the Registrar of Companies: 21 characters.
 *   1      L (listed) or U (unlisted)
 *   2–6    industry code from the National Industrial Classification
 *   7–8    state of the Registrar of Companies
 *   9–12   year of incorporation
 *   13–15  ownership type
 *   16–21  registration number
 * Source: Ministry of Corporate Affairs, CIN structure.
 */
export const CIN_OWNERSHIP_TYPES = {
  FLC: "Financial Lease Company",
  FTC: "Subsidiary of a Foreign Company",
  GAP: "General Association Public",
  GAT: "General Association Private",
  GOI: "Company owned by the Government of India",
  NPL: "Not-for-profit Licensed Company",
  OPC: "One Person Company",
  PLC: "Public Limited Company",
  PTC: "Private Limited Company",
  SGC: "Company owned by a State Government",
  ULL: "Public Limited Company with Unlimited Liability",
  ULT: "Private Limited Company with Unlimited Liability",
} as const;

export type CinOwnershipType = keyof typeof CIN_OWNERSHIP_TYPES;

export type CinError =
  | "EMPTY"
  | "INVALID_LENGTH"
  | "INVALID_LISTING"
  | "INVALID_FORMAT"
  | "INVALID_YEAR"
  | "INVALID_OWNERSHIP_TYPE";

export interface CinParts {
  readonly cin: string;
  readonly listed: boolean;
  /** Five-digit National Industrial Classification code, e.g. "72200". */
  readonly industryCode: string;
  /** Two-letter state of the Registrar of Companies, e.g. "KA". */
  readonly stateCode: string;
  readonly yearOfIncorporation: number;
  readonly ownershipType: CinOwnershipType;
  readonly ownershipName: string;
  /** Six-digit registration number from the Registrar. */
  readonly registrationNumber: string;
}

/** Character classes for positions 2–21: D for a digit, L for a letter. */
const LAYOUT = "DDDDDLLDDDDLLLDDDDDD";
const FIRST_YEAR = 1850;

function isOwnershipType(code: string): code is CinOwnershipType {
  return Object.prototype.hasOwnProperty.call(CIN_OWNERSHIP_TYPES, code);
}

function firstLayoutError(cin: string): number {
  return [...LAYOUT].findIndex((kind, i) => !(kind === "D" ? /[0-9]/ : /[A-Z]/).test(cin.charAt(i + 1))) + 1;
}

export function normalizeCin(input: string): string {
  return compact(input);
}

/**
 * Checks a CIN's structure, the year of incorporation and the ownership type.
 * `now` is only for tests; the latest valid year is the current year.
 */
export function validateCin(input: string, now: Date = new Date()): Result<string, CinError> {
  const cin = normalizeCin(input);
  if (cin === "") return err("EMPTY", "Enter a CIN.");
  if (cin.length !== 21) return err("INVALID_LENGTH", `A CIN has 21 characters; this has ${cin.length}.`);
  if (cin[0] !== "L" && cin[0] !== "U") {
    return err("INVALID_LISTING", "A CIN starts with L for a listed company or U for an unlisted one.", 0);
  }
  const index = firstLayoutError(cin);
  if (index > 0) {
    const kind = LAYOUT.charAt(index - 1) === "D" ? "a digit" : "a letter";
    return err("INVALID_FORMAT", `Character ${index + 1} must be ${kind}. A CIN looks like U72200KA2010PTC012345.`, index);
  }
  const year = Number(cin.slice(8, 12));
  if (year < FIRST_YEAR || year > now.getFullYear()) {
    return err("INVALID_YEAR", `${year} is not a possible year of incorporation.`, 8);
  }
  const ownership = cin.slice(12, 15);
  if (!isOwnershipType(ownership)) {
    return err("INVALID_OWNERSHIP_TYPE", `"${ownership}" is not a CIN ownership type, such as PTC for a private limited company.`, 12);
  }
  return ok(cin);
}

export function isValidCin(input: string): boolean {
  return validateCin(input).ok;
}

/** Validates a CIN and splits it into its parts. */
export function parseCin(input: string, now: Date = new Date()): Result<CinParts, CinError> {
  const result = validateCin(input, now);
  if (!result.ok) return result;
  const cin = result.value;
  const ownershipType = cin.slice(12, 15) as CinOwnershipType;
  return ok({
    cin,
    listed: cin[0] === "L",
    industryCode: cin.slice(1, 6),
    stateCode: cin.slice(6, 8),
    yearOfIncorporation: Number(cin.slice(8, 12)),
    ownershipType,
    ownershipName: CIN_OWNERSHIP_TYPES[ownershipType],
    registrationNumber: cin.slice(15),
  });
}
