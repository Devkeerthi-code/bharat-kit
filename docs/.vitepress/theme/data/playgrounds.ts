// What each module page's playground runs. Every call goes to the real library source.
import {
  formatInr,
  formatMobile,
  formatVehicleNumber,
  maskAadhaar,
  parseAmount,
  parseGstin,
  parseIfsc,
  parsePan,
  parsePincode,
  parseTan,
  parseVehicleNumber,
  parseVpa,
  rupeesInWords,
  toShortForm,
  toWhatsAppLink,
  toWords,
  validateAadhaar,
  validateMobile,
  type Result,
} from "bharat-kit";

export interface PlaygroundOutcome {
  readonly ok: boolean;
  readonly reason?: string;
  readonly message: string;
  /** Shown as JSON under the verdict. */
  readonly output: unknown;
  /** Character to highlight in the cell strip, when the module has fixed positions. */
  readonly index?: number;
}

export interface PlaygroundSpec {
  readonly label: string;
  readonly placeholder: string;
  readonly initial: string;
  readonly samples: readonly (readonly [label: string, value: string])[];
  /** Fixed-width formats show a cell strip; the numbers are positions where a new part starts. */
  readonly cells?: { readonly length: number; readonly boundaries: readonly number[] };
  readonly inputMode?: "text" | "numeric" | "tel" | "email";
  readonly run: (input: string) => PlaygroundOutcome;
}

function fromResult<T>(result: Result<T, string>, describe: (value: T) => string): PlaygroundOutcome {
  if (result.ok) return { ok: true, message: describe(result.value), output: result };
  const output = { ok: false, reason: result.reason, message: result.message, ...(result.index === undefined ? {} : { index: result.index }) };
  return { ok: false, reason: result.reason, message: result.message, output, ...(result.index === undefined ? {} : { index: result.index }) };
}

function valueOf(result: Result<string, string>): string {
  return result.ok ? result.value : "";
}

export const PLAYGROUNDS: Readonly<Record<string, PlaygroundSpec>> = {
  gstin: {
    label: "GSTIN",
    placeholder: "29ABCPE1234F1Z7",
    initial: "29ABCPE1234F1Z7",
    samples: [["Valid demo", "29ABCPE1234F1Z7"], ["Wrong check digit", "29ABCPE1234F1Z8"], ["Unknown state", "49ABCPE1234F1Z7"], ["Bad PAN type", "29ABCDE1234F1Z7"], ["Lower case, spaced", "29 abcpe 1234f 1z7"]],
    cells: { length: 15, boundaries: [2, 12, 13, 14] },
    run: (input) => fromResult(parseGstin(input), (v) => `Registered in ${v.stateName}${v.legacyStateCode ? " (legacy code)" : ""}. PAN ${v.pan}.`),
  },
  pan: {
    label: "PAN",
    placeholder: "ABCPE1234F",
    initial: "ABCPE1234F",
    samples: [["Individual", "ABCPE1234F"], ["Company", "AAACB1234C"], ["Bad holder type", "ABCDE1234F"], ["Digit in the wrong place", "ABCPEX234F"]],
    cells: { length: 10, boundaries: [3, 4, 5, 9] },
    run: (input) => fromResult(parsePan(input), (v) => `Holder type ${v.holderType}: ${v.holderTypeName}.`),
  },
  tan: {
    label: "TAN",
    placeholder: "BLRA12345B",
    initial: "BLRA12345B",
    samples: [["Valid demo", "BLRA12345B"], ["Spaced, lower case", "blra 12345 b"], ["Digit as 4th", "BLR012345B"], ["Too short", "BLRA1234B"]],
    cells: { length: 10, boundaries: [3, 4, 9] },
    run: (input) => fromResult(parseTan(input), (v) => `Jurisdiction ${v.jurisdiction}, deductor's name starts with ${v.nameInitial}. Shape only: TRACES confirms the deductor.`),
  },
  ifsc: {
    label: "IFSC",
    placeholder: "SBIN0001234",
    initial: "SBIN0001234",
    samples: [["Valid shape", "SBIN0001234"], ["Fifth is not 0", "SBIN1001234"], ["Too short", "SBIN000123"]],
    cells: { length: 11, boundaries: [4, 5] },
    run: (input) => fromResult(parseIfsc(input), (v) => `Bank code ${v.bankCode}, branch ${v.branchCode}. Shape only: use lookupIfsc to confirm the branch exists.`),
  },
  upi: {
    label: "UPI ID",
    placeholder: "name@okbank",
    initial: "Name@OKBank",
    inputMode: "email",
    samples: [["Mixed case", "Name@OKBank"], ["Mobile number", "9876543210@ybl"], ["Two @", "name@ok@bank"], ["No provider", "name@"]],
    run: (input) => fromResult(parseVpa(input), (v) => `Handle ${v.handle} at ${v.provider}. Shape only: UPI apps confirm the payee.`),
  },
  mobile: {
    label: "Mobile number",
    placeholder: "+91 98765 43210",
    initial: "098765-43210",
    inputMode: "tel",
    samples: [["With 0", "098765-43210"], ["With +91", "+91 98765 43210"], ["Landline", "044 2345 6789"], ["Too short", "98765 4321"]],
    run: (input) => {
      const result = validateMobile(input);
      if (!result.ok) return fromResult(result, () => "");
      const output = {
        ok: true,
        value: result.value,
        international: valueOf(formatMobile(input)),
        national: valueOf(formatMobile(input, "national")),
        e164: valueOf(formatMobile(input, "e164")),
        whatsApp: valueOf(toWhatsAppLink(input)),
      };
      return { ok: true, message: `Stored as ${result.value}. Shown as ${output.international}.`, output };
    },
  },
  pincode: {
    label: "Pincode",
    placeholder: "560001",
    initial: "560001",
    inputMode: "numeric",
    samples: [["Bengaluru GPO area", "560001"], ["New Delhi", "110001"], ["Army Postal Service", "999999"], ["Starts with 0", "012345"]],
    cells: { length: 6, boundaries: [1, 2, 3] },
    run: (input) => fromResult(parsePincode(input), (v) => `Zone ${v.zone} (${v.zoneRegion}). Circle: ${v.circle ?? "none allocated"}. Sorting district ${v.sortingDistrict}.`),
  },
  aadhaar: {
    label: "Aadhaar number",
    placeholder: "2345 6789 0124",
    initial: "2345 6789 0124",
    inputMode: "numeric",
    samples: [["Demo, passes checksum", "2345 6789 0124"], ["One digit changed", "2345 6789 0125"], ["Starts with 1", "1345 6789 0124"]],
    run: (input) => {
      const masked = maskAadhaar(input);
      const shown = masked.ok ? masked.value : "Not 12 digits yet";
      const result = validateAadhaar(input);
      // The output never contains the full number, only the masked form.
      if (result.ok) return { ok: true, message: `Checksum passes. Keep only ${shown}.`, output: { ok: true, masked: shown } };
      return { ok: false, reason: result.reason, message: result.message, output: { ok: false, reason: result.reason, masked: shown } };
    },
  },
  money: {
    label: "Amount",
    placeholder: "3.4 Cr",
    initial: "₹12.5 L",
    samples: [["Short form", "₹12.5 L"], ["Crore", "3.4 Cr"], ["With paise", "1,250.50"], ["Unknown unit", "5 bn"], ["Too precise", "12.345"]],
    run: (input) => {
      const result = parseAmount(input);
      if (!result.ok) return fromResult(result, () => "");
      const { paise, rupees } = result.value;
      const whole = Math.floor(rupees);
      const output = {
        paise,
        formatInr: formatInr(rupees),
        short: toShortForm(rupees, { symbol: true }),
        toWords: toWords(whole),
        toWordsHindi: toWords(whole, "hi"),
        rupeesInWords: rupeesInWords(paise),
      };
      return { ok: true, message: `${formatInr(rupees)}, held exactly as ${paise} paise.`, output };
    },
  },
  vehicle: {
    label: "Registration number",
    placeholder: "KA 01 AB 1234",
    initial: "ka-01-ab-1234",
    samples: [["State plate", "ka-01-ab-1234"], ["BH series", "22 BH 1234 AA"], ["Legacy code", "OR 02 C 4567"], ["Unknown state", "XX 01 AB 1234"]],
    run: (input) => {
      const result = parseVehicleNumber(input);
      if (!result.ok) return fromResult(result, () => "");
      const formatted = formatVehicleNumber(result.value);
      const v = result.value;
      const where = v.kind === "bharat" ? `Bharat series, registered in 20${v.year}` : `${v.stateName}${v.legacyStateCode ? " (legacy code)" : ""}, RTO ${v.rtoCode}`;
      return { ok: true, message: `${formatted.ok ? formatted.value : ""}: ${where}.`, output: result };
    },
  },
};
