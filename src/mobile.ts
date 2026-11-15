import { err, ok, type Result } from "./result";

export type MobileError = "EMPTY" | "INVALID_CHARACTERS" | "INVALID_LENGTH" | "INVALID_START_DIGIT";

export type MobileFormat = "national" | "international" | "e164";

/**
 * Strips the separators people type (spaces, hyphens, dots, brackets) and the
 * prefixes they use for India: +91, 0091, 91 (on 12 digits) and a trunk 0 (on 11 digits).
 * Returns the remaining digits; it does not check them.
 */
export function normalizeMobile(input: string): string {
  let digits = input.trim().replace(/[\s().-]+/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.startsWith("0091")) digits = digits.slice(4);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

/**
 * Validates an Indian mobile number and returns its 10 digits.
 * Source: TRAI / DoT National Numbering Plan: mobile numbers are 10 digits
 * and the series in use start with 6, 7, 8 or 9.
 */
export function validateMobile(input: string): Result<string, MobileError> {
  if (input.trim() === "") return err("EMPTY", "Enter a mobile number.");
  const digits = normalizeMobile(input);
  const bad = digits.search(/\D/);
  if (bad !== -1) return err("INVALID_CHARACTERS", "Use digits only. Spaces, hyphens and a leading +91 or 0 are fine.");
  if (digits.length !== 10) return err("INVALID_LENGTH", `An Indian mobile number has 10 digits after +91; this has ${digits.length}.`);
  if (!/^[6-9]/.test(digits)) {
    return err("INVALID_START_DIGIT", "Indian mobile numbers start with 6, 7, 8 or 9. Landlines are not supported.", 0);
  }
  return ok(digits);
}

export function isValidMobile(input: string): boolean {
  return validateMobile(input).ok;
}

/**
 * Formats a valid mobile number for display or storage:
 * national "98765 43210", international "+91 98765 43210", e164 "+919876543210".
 */
export function formatMobile(input: string, format: MobileFormat = "international"): Result<string, MobileError> {
  const result = validateMobile(input);
  if (!result.ok) return result;
  const n = result.value;
  if (format === "e164") return ok(`+91${n}`);
  const spaced = `${n.slice(0, 5)} ${n.slice(5)}`;
  return ok(format === "national" ? spaced : `+91 ${spaced}`);
}

/**
 * Builds a WhatsApp click-to-chat link.
 * Source: WhatsApp Help Center, "How to use click to chat": https://wa.me/<number>
 * with the full number in international format, no +, spaces or leading zeros.
 */
export function toWhatsAppLink(input: string, message?: string): Result<string, MobileError> {
  const result = validateMobile(input);
  if (!result.ok) return result;
  const text = message?.trim();
  return ok(`https://wa.me/91${result.value}${text ? `?text=${encodeURIComponent(text)}` : ""}`);
}
