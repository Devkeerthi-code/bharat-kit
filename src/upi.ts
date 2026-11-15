import { err, ok, type Result } from "./result";

export type VpaError = "EMPTY" | "MISSING_AT" | "MULTIPLE_AT" | "INVALID_HANDLE" | "INVALID_PROVIDER" | "TOO_LONG";

export interface VpaParts {
  readonly vpa: string;
  /** The part before "@", e.g. "name" or a mobile number. */
  readonly handle: string;
  /** The part after "@", the PSP's handle, e.g. "okbank". */
  readonly provider: string;
}

const MAX_VPA_LENGTH = 255;
const HANDLE = /^[a-z0-9][a-z0-9._-]{1,254}$/;
const PROVIDER = /^[a-z][a-z0-9]{1,63}$/;

/** Trims and lower-cases. UPI addresses are not case-sensitive. */
export function normalizeVpa(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Checks the shape of a UPI virtual payment address (handle@provider).
 * Source: NPCI UPI Procedural Guidelines: a VPA is "account@psp", up to 255 characters.
 * The handle allows letters, digits, dots, hyphens and underscores; the provider is the
 * PSP's alphanumeric handle. This cannot tell whether the address is registered.
 */
export function validateVpa(input: string): Result<string, VpaError> {
  const vpa = normalizeVpa(input);
  if (vpa === "") return err("EMPTY", "Enter a UPI ID.");
  if (vpa.length > MAX_VPA_LENGTH) return err("TOO_LONG", `A UPI ID can be at most ${MAX_VPA_LENGTH} characters.`);
  const at = vpa.indexOf("@");
  if (at === -1) return err("MISSING_AT", "A UPI ID looks like name@bank. The @ is missing.");
  if (vpa.indexOf("@", at + 1) !== -1) return err("MULTIPLE_AT", "A UPI ID has exactly one @.", vpa.indexOf("@", at + 1));
  const handle = vpa.slice(0, at);
  const provider = vpa.slice(at + 1);
  if (!HANDLE.test(handle)) {
    return err("INVALID_HANDLE", "The part before @ needs at least 2 characters: letters, digits, dots, hyphens or underscores, starting with a letter or digit.", 0);
  }
  if (!PROVIDER.test(provider)) {
    return err("INVALID_PROVIDER", "The part after @ is the app or bank handle, like okbank or ybl: letters and digits only.", at + 1);
  }
  return ok(vpa);
}

export function isValidVpa(input: string): boolean {
  return validateVpa(input).ok;
}

export function parseVpa(input: string): Result<VpaParts, VpaError> {
  const result = validateVpa(input);
  if (!result.ok) return result;
  const [handle = "", provider = ""] = result.value.split("@");
  return ok({ vpa: result.value, handle, provider });
}

export interface UpiPaymentOptions {
  /** Payee UPI ID (pa). Required. */
  readonly payeeVpa: string;
  /** Payee name shown in the app (pn). Required by most apps. */
  readonly payeeName: string;
  /** Amount in paise, an integer. Leave out to let the payer type the amount. */
  readonly amountPaise?: number;
  /** Short note shown to the payer (tn), e.g. "Invoice 1042". */
  readonly note?: string;
  /** Your reference for reconciliation (tr), e.g. an order ID. */
  readonly transactionRef?: string;
  /** Merchant category code (mc), for registered merchants. */
  readonly merchantCode?: string;
}

export type UpiLinkError = VpaError | "MISSING_NAME" | "INVALID_AMOUNT" | "INVALID_MERCHANT_CODE";

/** Percent-encodes a query value. Spaces become %20, never "+", which some UPI apps show literally. */
function encodeValue(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function paiseToRupees(paise: number): string {
  return `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, "0")}`;
}

/**
 * Builds a upi://pay deep link that UPI apps open with the details filled in.
 * Source: NPCI "UPI Linking Specification" (parameters pa, pn, am, cu, tn, tr, mc).
 * Every value is percent-encoded; the @ in the payee address is kept as-is because
 * some apps do not decode %40 in pa.
 */
export function buildUpiLink(options: UpiPaymentOptions): Result<string, UpiLinkError> {
  const payee = validateVpa(options.payeeVpa);
  if (!payee.ok) return payee;
  const name = options.payeeName.trim();
  if (name === "") return err("MISSING_NAME", "Add the payee name. UPI apps show it to the payer.");

  const [handle, provider] = payee.value.split("@") as [string, string];
  const params: string[] = [`pa=${encodeValue(handle)}@${encodeValue(provider)}`, `pn=${encodeValue(name)}`];

  if (options.amountPaise !== undefined) {
    if (!Number.isSafeInteger(options.amountPaise) || options.amountPaise <= 0) {
      return err("INVALID_AMOUNT", "The amount must be a whole number of paise above zero, e.g. 12550 for ₹125.50.");
    }
    params.push(`am=${paiseToRupees(options.amountPaise)}`);
  }
  params.push("cu=INR");
  const note = options.note?.trim();
  if (note) params.push(`tn=${encodeValue(note)}`);
  const transactionRef = options.transactionRef?.trim();
  if (transactionRef) params.push(`tr=${encodeValue(transactionRef)}`);
  if (options.merchantCode !== undefined) {
    if (!/^\d{4}$/.test(options.merchantCode)) return err("INVALID_MERCHANT_CODE", "A merchant category code is 4 digits.");
    params.push(`mc=${options.merchantCode}`);
  }
  return ok(`upi://pay?${params.join("&")}`);
}
