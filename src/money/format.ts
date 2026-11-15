/**
 * Indian digit grouping: the last three digits, then groups of two.
 * Source: Bureau of Indian Standards / RBI usage of the lakh–crore system
 * (1,00,000 = one lakh; 1,00,00,000 = one crore).
 */
export function groupIndian(value: number | bigint | string): string {
  const text = typeof value === "string" ? value.trim() : toPlainString(value);
  const match = /^(-?)(\d+)(\.\d+)?$/.exec(text);
  if (!match) throw new RangeError(`groupIndian expects a plain decimal number, got "${text}".`);
  const [, sign = "", whole = "", fraction = ""] = match;
  return `${sign}${groupWhole(whole.replace(/^0+(?=\d)/, ""))}${fraction}`;
}

function toPlainString(value: number | bigint): string {
  if (typeof value === "number" && (!Number.isFinite(value) || Math.abs(value) >= 1e21)) {
    throw new RangeError("groupIndian expects a finite number below 1e21.");
  }
  return String(value);
}

function groupWhole(digits: string): string {
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+$)/g, ",");
  return `${head},${digits.slice(-3)}`;
}

export interface FormatInrOptions {
  /** Prefix with ₹. Default true. */
  readonly symbol?: boolean;
  /** "auto" shows paise only when there are any. Default "auto". */
  readonly decimals?: 0 | 2 | "auto";
  /** Use the lakh/crore short form, e.g. ₹12.5 L. Default false. */
  readonly short?: boolean;
}

/** Formats rupees for display: formatInr(1250000) → "₹12,50,000". */
export function formatInr(rupees: number, options: FormatInrOptions = {}): string {
  assertFinite(rupees, "formatInr");
  if (options.short) return toShortForm(rupees, { symbol: options.symbol ?? true });
  const decimals = options.decimals ?? "auto";
  const showPaise = decimals === 2 || (decimals === "auto" && !Number.isInteger(Math.round(rupees * 100) / 100));
  const fixed = Math.abs(rupees).toFixed(showPaise ? 2 : 0);
  const sign = rupees < 0 && Number(fixed) !== 0 ? "-" : "";
  return `${sign}${options.symbol === false ? "" : "₹"}${groupIndian(fixed)}`;
}

export interface ShortFormOptions {
  /** Prefix with ₹. Default false. */
  readonly symbol?: boolean;
  /** "short" gives "L" and "Cr"; "long" gives "lakh" and "crore". Default "short". */
  readonly units?: "short" | "long";
  /** Most decimal places shown, trailing zeros removed. Default 2. */
  readonly maxDecimals?: number;
}

const SHORT_UNITS = [
  { size: 1e7, short: "Cr", long: "crore" },
  { size: 1e5, short: "L", long: "lakh" },
  { size: 1e3, short: "K", long: "thousand" },
] as const;

/**
 * Lakh/crore short form: 125000 → "1.25 L", 34000000 → "3.4 Cr", 45000 → "45 K".
 * Amounts below 1,000 are returned grouped as they are.
 */
export function toShortForm(rupees: number, options: ShortFormOptions = {}): string {
  assertFinite(rupees, "toShortForm");
  const places = options.maxDecimals ?? 2;
  const sign = rupees < 0 ? "-" : "";
  const prefix = `${sign}${options.symbol ? "₹" : ""}`;
  const amount = Math.abs(rupees);
  const factor = 10 ** places;

  for (const [i, unit] of SHORT_UNITS.entries()) {
    if (amount < unit.size) continue;
    const scaled = Math.round((amount / unit.size) * factor) / factor;
    const larger = SHORT_UNITS[i - 1];
    // 99,99,999 rounds to "100 L"; say "1 Cr" instead.
    if (larger && scaled * unit.size >= larger.size) {
      return `${prefix}${trimNumber(Math.round((amount / larger.size) * factor) / factor)} ${larger[options.units ?? "short"]}`;
    }
    return `${prefix}${trimNumber(scaled)} ${unit[options.units ?? "short"]}`;
  }
  return `${prefix}${groupIndian(String(Math.round(amount * factor) / factor))}`;
}

function trimNumber(value: number): string {
  const [whole = "0", fraction] = String(value).split(".");
  return fraction ? `${groupIndian(whole)}.${fraction}` : groupIndian(whole);
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} expects a finite number.`);
}
