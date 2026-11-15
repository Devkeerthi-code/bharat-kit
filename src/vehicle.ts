import { LEGACY_VEHICLE_STATE_CODES, VEHICLE_STATE_CODES, type VehicleStateCode } from "./data/rto-states";
import { compact, err, ok, type Result } from "./result";

export { LEGACY_VEHICLE_STATE_CODES, VEHICLE_STATE_CODES, type VehicleStateCode };

export type VehicleNumberError = "EMPTY" | "INVALID_FORMAT" | "UNKNOWN_STATE_CODE" | "INVALID_RTO_CODE" | "INVALID_NUMBER";

export interface StateVehicleNumber {
  readonly kind: "state";
  readonly registration: string;
  readonly stateCode: VehicleStateCode;
  readonly stateName: string;
  readonly legacyStateCode: boolean;
  /** District RTO code, e.g. "01". */
  readonly rtoCode: string;
  /** Letter series, 0–3 letters, e.g. "AB". */
  readonly series: string;
  /** The number, 1–4 digits, e.g. "1234". */
  readonly number: string;
}

export interface BharatVehicleNumber {
  readonly kind: "bharat";
  readonly registration: string;
  /** Last two digits of the year of registration. */
  readonly year: string;
  readonly number: string;
  readonly series: string;
}

export type VehicleNumberParts = StateVehicleNumber | BharatVehicleNumber;

const STATE_PLATE = /^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/;
/** Bharat (BH) series: YY BH #### XX, XX being two letters. Source: MoRTH notification G.S.R. 594(E), 26 August 2021. */
const BHARAT_PLATE = /^(\d{2})BH(\d{4})([A-Z]{2})$/;

/** Upper-cases and removes spaces, hyphens and dots: "ka-01-ab-1234" → "KA01AB1234". */
export function normalizeVehicleNumber(input: string): string {
  return compact(input);
}

function isStateCode(code: string): code is VehicleStateCode {
  return Object.prototype.hasOwnProperty.call(VEHICLE_STATE_CODES, code);
}

/**
 * Validates and splits a registration number: state plates ("KA 01 AB 1234") and
 * Bharat series plates ("22 BH 1234 AA"). Checks the state code against the published
 * list; it cannot check whether a specific RTO code exists in that state.
 */
export function parseVehicleNumber(input: string): Result<VehicleNumberParts, VehicleNumberError> {
  const registration = normalizeVehicleNumber(input);
  if (registration === "") return err("EMPTY", "Enter a vehicle registration number.");

  const bharat = BHARAT_PLATE.exec(registration);
  if (bharat) {
    const [, year = "", number = "", series = ""] = bharat;
    if (/^0+$/.test(number)) return err("INVALID_NUMBER", "The number part cannot be all zeros.");
    return ok({ kind: "bharat", registration, year, number, series });
  }

  const plate = STATE_PLATE.exec(registration);
  if (!plate) return err("INVALID_FORMAT", "A registration number looks like KA 01 AB 1234 (state, RTO, series, number) or 22 BH 1234 AA.");
  const [, state = "", rtoCode = "", series = "", number = ""] = plate;
  if (!isStateCode(state)) return err("UNKNOWN_STATE_CODE", `${state} is not an Indian state or UT code for vehicles.`, 0);
  if (/^0+$/.test(rtoCode)) return err("INVALID_RTO_CODE", "The RTO code cannot be 0 or 00.", 2);
  if (/^0+$/.test(number)) return err("INVALID_NUMBER", "The number part cannot be all zeros.");
  return ok({
    kind: "state",
    registration,
    stateCode: state,
    stateName: VEHICLE_STATE_CODES[state],
    legacyStateCode: LEGACY_VEHICLE_STATE_CODES.includes(state),
    rtoCode,
    series,
    number,
  });
}

export function validateVehicleNumber(input: string): Result<string, VehicleNumberError> {
  const result = parseVehicleNumber(input);
  return result.ok ? ok(result.value.registration) : result;
}

export function isValidVehicleNumber(input: string): boolean {
  return parseVehicleNumber(input).ok;
}

/** Formats with the conventional spacing: "KA 01 AB 1234", "22 BH 1234 AA". */
export function formatVehicleNumber(input: string | VehicleNumberParts): Result<string, VehicleNumberError> {
  const result = typeof input === "string" ? parseVehicleNumber(input) : ok(input);
  if (!result.ok) return result;
  const p = result.value;
  const groups = p.kind === "bharat" ? [p.year, "BH", p.number, p.series] : [p.stateCode, p.rtoCode, p.series, p.number];
  return ok(groups.filter(Boolean).join(" "));
}
