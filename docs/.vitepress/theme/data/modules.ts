// One entry per module. Drives the tile grid, the sentence search and the spec tables,
// so the three can never disagree. All sample values are made up.

export type Verb = "validate" | "format" | "parse";
export type Usage = "forms" | "invoices" | "payments";

export interface FunctionSpec {
  readonly name: string;
  readonly signature: string;
  readonly returns: string;
  readonly errors?: string;
  readonly note?: string;
}

export interface Source {
  readonly label: string;
  readonly url: string;
}

export interface ModuleInfo {
  readonly slug: string;
  readonly name: string;
  /** Noun used in the sentence search: "I want to validate a …". */
  readonly noun: string;
  readonly article: "a" | "an";
  readonly sample: string;
  readonly purpose: string;
  readonly imports: string;
  readonly snippets: Readonly<Record<Verb, string>>;
  readonly functions: readonly FunctionSpec[];
  readonly errors: readonly (readonly [code: string, meaning: string])[];
  readonly sources: readonly Source[];
}

export const USAGE_NOTES: Readonly<Record<Usage, string>> = {
  forms: "// In a form: check on blur and show result.message next to the field.",
  invoices: "// On an invoice: normalise once when saving, print the formatted value.",
  payments: "// Before a payment: run the same check on the server. Never trust the browser.",
};

export const MODULES: readonly ModuleInfo[] = [
  {
    slug: "gstin",
    name: "GSTIN",
    noun: "GSTIN",
    article: "a",
    sample: "29ABCPE1234F1Z7",
    purpose: "Check, split and explain a GST registration number.",
    imports: "validateGstin, parseGstin",
    snippets: {
      validate: `const result = validateGstin(input)\nif (!result.ok) showError(result.message)\n// result.reason: "INVALID_CHECK_DIGIT", "INVALID_STATE_CODE", …`,
      format: `formatGstin({ stateCode: "29", pan: "ABCPE1234F", entityNumber: "1" })\n// "29ABCPE1234F1Z7", with the check digit computed`,
      parse: `parseGstin("29abcpe1234f1z7")\n// { ok: true, value: { stateCode: "29", stateName: "Karnataka",\n//   pan: "ABCPE1234F", entityNumber: "1", checkDigit: "7", … } }`,
    },
    functions: [
      { name: "validateGstin", signature: "validateGstin(input: string)", returns: "Result<string, GstinError>", errors: "All codes below", note: "Normalises spaces, hyphens and case first." },
      { name: "isValidGstin", signature: "isValidGstin(input: string)", returns: "boolean" },
      { name: "parseGstin", signature: "parseGstin(input: string)", returns: "Result<GstinParts, GstinError>", note: "State name, embedded PAN and holder type, entity number, check digit." },
      { name: "gstinCheckDigit", signature: "gstinCheckDigit(first14: string)", returns: "string | null", note: "null unless given 14 letters or digits." },
      { name: "formatGstin", signature: "formatGstin(parts: { stateCode, pan, entityNumber })", returns: "string | null", note: "Builds a GSTIN and its check digit from parts." },
      { name: "normalizeGstin", signature: "normalizeGstin(input: string)", returns: "string" },
      { name: "isGstStateCode", signature: "isGstStateCode(code: string)", returns: "code is GstStateCode" },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["INVALID_LENGTH", "Not 15 characters."],
      ["INVALID_CHARACTERS", "Something other than A–Z and 0–9."],
      ["INVALID_STATE_CODE", "First two digits are not on the GST state list."],
      ["INVALID_PAN", "Characters 3–12 are not a well-formed PAN."],
      ["INVALID_ENTITY_NUMBER", "Character 13 is not 1–9 or A–Z."],
      ["INVALID_DEFAULT_CHARACTER", "Character 14 is not Z."],
      ["INVALID_CHECK_DIGIT", "Character 15 does not match the computed check digit."],
    ],
    sources: [
      { label: "GST portal: state code list and GSTIN format", url: "https://www.gst.gov.in/" },
      { label: "Luhn mod N algorithm (the check-digit method)", url: "https://en.wikipedia.org/wiki/Luhn_mod_N_algorithm" },
    ],
  },
  {
    slug: "pan",
    name: "PAN",
    noun: "PAN",
    article: "a",
    sample: "ABCPE1234F",
    purpose: "Validate a PAN and read who holds it from the 4th letter.",
    imports: "validatePan, parsePan",
    snippets: {
      validate: `validatePan("ABCDE1234F")\n// { ok: false, reason: "INVALID_HOLDER_TYPE", index: 3, … }`,
      format: `formatPan(" abcpe 1234 f ")\n// "ABCPE1234F" (or null when invalid)`,
      parse: `parsePan("ABCPE1234F")\n// { ok: true, value: { holderType: "P", holderTypeName: "Individual", … } }`,
    },
    functions: [
      { name: "validatePan", signature: "validatePan(input: string)", returns: "Result<string, PanError>", errors: "EMPTY, INVALID_LENGTH, INVALID_FORMAT, INVALID_HOLDER_TYPE" },
      { name: "isValidPan", signature: "isValidPan(input: string)", returns: "boolean" },
      { name: "parsePan", signature: "parsePan(input: string)", returns: "Result<PanParts, PanError>" },
      { name: "formatPan", signature: "formatPan(input: string)", returns: "string | null" },
      { name: "maskPan", signature: "maskPan(input: string, { maskChar? })", returns: "Result<string, PanError>", note: 'Keeps the last four: "XXXXXX234F".' },
      { name: "normalizePan", signature: "normalizePan(input: string)", returns: "string" },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["INVALID_LENGTH", "Not 10 characters."],
      ["INVALID_FORMAT", "Not 5 letters, 4 digits, 1 letter."],
      ["INVALID_HOLDER_TYPE", "4th letter is not one of A B C F G H J L P T."],
    ],
    sources: [
      { label: "Income Tax Department: Permanent Account Number (PAN)", url: "https://www.incometaxindia.gov.in/documents/d/guest/1-permanent-account-number-pan-pdf" },
    ],
  },
  {
    slug: "tan",
    name: "TAN",
    noun: "TAN",
    article: "a",
    sample: "BLRA12345B",
    purpose: "The number on every TDS certificate: city code, name initial, sequence.",
    imports: "validateTan, parseTan",
    snippets: {
      validate: `validateTan("BLR012345B")\n// { ok: false, reason: "INVALID_FORMAT", index: 3,\n//   message: "Character 4 must be a letter. …" }`,
      format: `const r = validateTan(" blra-12345-b ")\nif (r.ok) save(r.value) // "BLRA12345B"`,
      parse: `parseTan("BLRA12345B")\n// { ok: true, value: { jurisdiction: "BLR", nameInitial: "A",\n//   sequence: "12345", checkCharacter: "B" } }`,
    },
    functions: [
      { name: "validateTan", signature: "validateTan(input: string)", returns: "Result<string, TanError>", errors: "EMPTY, INVALID_LENGTH, INVALID_FORMAT" },
      { name: "isValidTan", signature: "isValidTan(input: string)", returns: "boolean" },
      { name: "parseTan", signature: "parseTan(input: string)", returns: "Result<TanParts, TanError>" },
      { name: "normalizeTan", signature: "normalizeTan(input: string)", returns: "string" },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["INVALID_LENGTH", "Not 10 characters."],
      ["INVALID_FORMAT", "Not 4 letters, 5 digits, 1 letter."],
    ],
    sources: [
      { label: "Income Tax Department: Tax Deduction and Collection Account Number (TAN)", url: "https://www.incometaxindia.gov.in/Pages/tax-services/apply-for-tan.aspx" },
      { label: "Protean (NSDL): TAN, structure and allotment", url: "https://www.protean-tinpan.com/services/tan/tan-introduction.html" },
    ],
  },
  {
    slug: "cin",
    name: "CIN",
    noun: "CIN",
    article: "a",
    sample: "U72200KA2010PTC012345",
    purpose: "A company's identity number: listed or not, industry, state, year, ownership.",
    imports: "validateCin, parseCin",
    snippets: {
      validate: `validateCin("U72200KA2010XYZ012345")\n// { ok: false, reason: "INVALID_OWNERSHIP_TYPE", index: 12, … }`,
      format: `const r = validateCin("u 72200 ka 2010 ptc 012345")\nif (r.ok) save(r.value) // "U72200KA2010PTC012345"`,
      parse: `parseCin("U72200KA2010PTC012345")\n// { ok: true, value: { listed: false, industryCode: "72200", stateCode: "KA",\n//   yearOfIncorporation: 2010, ownershipName: "Private Limited Company", … } }`,
    },
    functions: [
      { name: "validateCin", signature: "validateCin(input: string)", returns: "Result<string, CinError>", errors: "All codes below", note: "The year must be between 1850 and this year." },
      { name: "isValidCin", signature: "isValidCin(input: string)", returns: "boolean" },
      { name: "parseCin", signature: "parseCin(input: string)", returns: "Result<CinParts, CinError>" },
      { name: "normalizeCin", signature: "normalizeCin(input: string)", returns: "string" },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["INVALID_LENGTH", "Not 21 characters."],
      ["INVALID_LISTING", "Does not start with L or U."],
      ["INVALID_FORMAT", "A letter where a digit belongs, or the other way round."],
      ["INVALID_YEAR", "Year of incorporation before 1850 or in the future."],
      ["INVALID_OWNERSHIP_TYPE", "Characters 13–15 are not a known ownership code."],
    ],
    sources: [
      { label: "Ministry of Corporate Affairs", url: "https://www.mca.gov.in/" },
      { label: "MoSPI: National Industrial Classification 2008", url: "https://www.mospi.gov.in/classification/national-industrial-classification" },
    ],
  },
  {
    slug: "udyam",
    name: "Udyam",
    noun: "Udyam number",
    article: "a",
    sample: "UDYAM-KA-03-0012345",
    purpose: "The MSME registration small businesses quote to get priority lending and tenders.",
    imports: "validateUdyam, parseUdyam",
    snippets: {
      validate: `validateUdyam("UDYAM-KA-0A-0012345")\n// { ok: false, reason: "INVALID_DISTRICT", index: 7, … }`,
      format: `validateUdyam("udyam ka 03 0012345")\n// { ok: true, value: "UDYAM-KA-03-0012345" }, hyphens put back`,
      parse: `parseUdyam("UDYAM-KA-03-0012345")\n// { ok: true, value: { stateCode: "KA", districtCode: "03", serial: "0012345", … } }`,
    },
    functions: [
      { name: "validateUdyam", signature: "validateUdyam(input: string)", returns: "Result<string, UdyamError>", note: "The value is always the hyphenated form." },
      { name: "isValidUdyam", signature: "isValidUdyam(input: string)", returns: "boolean" },
      { name: "parseUdyam", signature: "parseUdyam(input: string)", returns: "Result<UdyamParts, UdyamError>" },
      { name: "normalizeUdyam", signature: "normalizeUdyam(input: string)", returns: "string", note: "Compact form without hyphens, for storage keys." },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["MISSING_PREFIX", "Does not start with UDYAM."],
      ["INVALID_LENGTH", "Not UDYAM plus 11 characters."],
      ["INVALID_STATE", "The two characters after UDYAM are not letters."],
      ["INVALID_DISTRICT", "The district code is not two digits."],
      ["INVALID_SERIAL", "The last part is not seven digits."],
    ],
    sources: [
      { label: "Ministry of MSME: Udyam Registration", url: "https://udyamregistration.gov.in/" },
      { label: "Gazette notification S.O. 2119(E), 26 June 2020", url: "https://msme.gov.in/sites/default/files/MSME_gazette_of_india.pdf" },
    ],
  },
  {
    slug: "ifsc",
    name: "IFSC",
    noun: "IFSC",
    article: "an",
    sample: "SBIN0001234",
    purpose: "Split a branch code into bank and branch; look it up if you want.",
    imports: "validateIfsc, parseIfsc, lookupIfsc",
    snippets: {
      validate: `validateIfsc("SBIN1001234")\n// { ok: false, reason: "INVALID_FIFTH_CHARACTER", index: 4, … }`,
      format: `const r = validateIfsc(" sbin 0001234 ")\nif (r.ok) save(r.value) // "SBIN0001234"`,
      parse: `parseIfsc("SBIN0001234")\n// { ok: true, value: { bankCode: "SBIN", branchCode: "001234" } }\n\n// Optional: ask a directory you choose. bharat-kit never calls the network itself.\nawait lookupIfsc("SBIN0001234", async (code, signal) => {\n  const res = await fetch(\`https://ifsc.razorpay.com/\${code}\`, { signal })\n  return res.status === 404 ? null : res.json()\n})`,
    },
    functions: [
      { name: "validateIfsc", signature: "validateIfsc(input: string)", returns: "Result<string, IfscError>" },
      { name: "isValidIfsc", signature: "isValidIfsc(input: string)", returns: "boolean" },
      { name: "parseIfsc", signature: "parseIfsc(input: string)", returns: "Result<IfscParts, IfscError>" },
      { name: "lookupIfsc", signature: "lookupIfsc<T>(input, fetcher, { timeoutMs?, signal? })", returns: "Promise<Result<T, IfscLookupError>>", errors: "Shape errors, NOT_FOUND, TIMEOUT, ABORTED, LOOKUP_FAILED", note: "Validates first; no request for a malformed code. Default timeout 8 s." },
      { name: "normalizeIfsc", signature: "normalizeIfsc(input: string)", returns: "string" },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["INVALID_LENGTH", "Not 11 characters."],
      ["INVALID_BANK_CODE", "First four are not letters."],
      ["INVALID_FIFTH_CHARACTER", "Fifth is not 0."],
      ["INVALID_BRANCH_CODE", "Last six are not letters or digits."],
      ["NOT_FOUND", "lookupIfsc: your directory has no such branch."],
      ["TIMEOUT · ABORTED · LOOKUP_FAILED", "lookupIfsc: the request did not complete."],
    ],
    sources: [{ label: "RBI: NEFT FAQs, “What is IFSC?”", url: "https://www.rbi.org.in/commonman/english/scripts/FAQs.aspx?Id=274" }],
  },
  {
    slug: "upi",
    name: "UPI",
    noun: "UPI ID",
    article: "a",
    sample: "name@okbank",
    purpose: "Check a UPI ID and build a payment link apps can open.",
    imports: "validateVpa, buildUpiLink",
    snippets: {
      validate: `validateVpa("name@ok@bank")\n// { ok: false, reason: "MULTIPLE_AT", … }`,
      format: `buildUpiLink({ payeeVpa: "shop@okbank", payeeName: "Demo Shop", amountPaise: 12550, note: "Invoice 1042" })\n// "upi://pay?pa=shop@okbank&pn=Demo%20Shop&am=125.50&cu=INR&tn=Invoice%201042"`,
      parse: `parseVpa("Name@OKBank")\n// { ok: true, value: { vpa: "name@okbank", handle: "name", provider: "okbank" } }`,
    },
    functions: [
      { name: "validateVpa", signature: "validateVpa(input: string)", returns: "Result<string, VpaError>" },
      { name: "isValidVpa", signature: "isValidVpa(input: string)", returns: "boolean" },
      { name: "parseVpa", signature: "parseVpa(input: string)", returns: "Result<VpaParts, VpaError>" },
      { name: "buildUpiLink", signature: "buildUpiLink({ payeeVpa, payeeName, amountPaise?, note?, transactionRef?, merchantCode? })", returns: "Result<string, UpiLinkError>", note: "Values percent-encoded; spaces are %20, never +." },
      { name: "normalizeVpa", signature: "normalizeVpa(input: string)", returns: "string" },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["MISSING_AT · MULTIPLE_AT", "Needs exactly one @."],
      ["INVALID_HANDLE", "Part before @ is too short or has other characters."],
      ["INVALID_PROVIDER", "Part after @ is not a letters-and-digits handle."],
      ["TOO_LONG", "Over 255 characters."],
      ["MISSING_NAME · INVALID_AMOUNT · INVALID_MERCHANT_CODE", "buildUpiLink: payee name missing, amount not whole positive paise, or code not 4 digits."],
    ],
    sources: [
      { label: "NPCI: UPI Linking Specifications 1.6 (upi://pay parameters)", url: "https://www.labnol.org/files/linking.pdf" },
      { label: "NPCI: Unified Payments Interface", url: "https://www.npci.org.in/product/upi" },
    ],
  },
  {
    slug: "mobile",
    name: "Mobile",
    noun: "mobile number",
    article: "a",
    sample: "+91 98765 43210",
    purpose: "Accept +91, 0 and spaces; store ten digits; link to WhatsApp.",
    imports: "validateMobile, formatMobile, toWhatsAppLink",
    snippets: {
      validate: `validateMobile("+91 98765-43210")\n// { ok: true, value: "9876543210" }`,
      format: `formatMobile("09876543210")            // "+91 98765 43210"\nformatMobile("9876543210", "national") // "98765 43210"\nformatMobile("9876543210", "e164")     // "+919876543210"`,
      parse: `toWhatsAppLink("98765 43210", "Is my order ready?")\n// "https://wa.me/919876543210?text=Is%20my%20order%20ready%3F"`,
    },
    functions: [
      { name: "validateMobile", signature: "validateMobile(input: string)", returns: "Result<string, MobileError>", note: "Value is the 10 digits." },
      { name: "isValidMobile", signature: "isValidMobile(input: string)", returns: "boolean" },
      { name: "formatMobile", signature: 'formatMobile(input, format?: "international" | "national" | "e164")', returns: "Result<string, MobileError>" },
      { name: "toWhatsAppLink", signature: "toWhatsAppLink(input: string, message?: string)", returns: "Result<string, MobileError>" },
      { name: "maskMobile", signature: 'maskMobile(input, format?: "international" | "national")', returns: "Result<string, MobileError>", note: '"+91 XXXXX X3210", for "code sent to" screens.' },
      { name: "normalizeMobile", signature: "normalizeMobile(input: string)", returns: "string" },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["INVALID_CHARACTERS", "Letters or symbols other than spaces, hyphens, dots, brackets and +91."],
      ["INVALID_LENGTH", "Not 10 digits after removing +91 or 0."],
      ["INVALID_START_DIGIT", "Does not start with 6, 7, 8 or 9."],
    ],
    sources: [
      { label: "DoT: National Numbering Plan", url: "https://dot.gov.in/national-numbering-plan" },
      { label: "WhatsApp Help Center: How to use click to chat", url: "https://faq.whatsapp.com/5913398998672934" },
    ],
  },
  {
    slug: "pincode",
    name: "Pincode",
    noun: "pincode",
    article: "a",
    sample: "560001",
    purpose: "Six digits; the first is the postal zone, the first three the sorting district.",
    imports: "validatePincode, parsePincode",
    snippets: {
      validate: `validatePincode("012345")\n// { ok: false, reason: "INVALID_ZONE", index: 0, … }`,
      format: `const r = validatePincode("560 001")\nif (r.ok) save(r.value) // "560001"`,
      parse: `parsePincode("560001")\n// { ok: true, value: { zone: 5, circle: "Karnataka", sortingDistrict: "560", … } }`,
    },
    functions: [
      { name: "validatePincode", signature: "validatePincode(input: string)", returns: "Result<string, PincodeError>" },
      { name: "isValidPincode", signature: "isValidPincode(input: string)", returns: "boolean" },
      { name: "parsePincode", signature: "parsePincode(input: string)", returns: "Result<PincodeParts, PincodeError>", note: "circle is a region hint, not an address check." },
      { name: "normalizePincode", signature: "normalizePincode(input: string)", returns: "string" },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["INVALID_CHARACTERS", "Something other than digits."],
      ["INVALID_LENGTH", "Not 6 digits."],
      ["INVALID_ZONE", "Starts with 0; zones are 1–9."],
    ],
    sources: [
      { label: "India Post: PIN code system", url: "https://www.indiapost.gov.in/" },
      { label: "Postal Index Number: zones and sub-zone allocation", url: "https://en.wikipedia.org/wiki/Postal_Index_Number" },
    ],
  },
  {
    slug: "aadhaar",
    name: "Aadhaar",
    noun: "Aadhaar",
    article: "an",
    sample: "XXXX XXXX 0124",
    purpose: "Checksum and masking only. Nothing is stored, logged or sent.",
    imports: "isValidAadhaar, maskAadhaar",
    snippets: {
      validate: `validateAadhaar(input)\n// { ok: false, reason: "INVALID_CHECKSUM", … }. Messages never repeat the number.`,
      format: `maskAadhaar("2345 6789 0124")\n// { ok: true, value: "XXXX XXXX 0124" }`,
      parse: `// An Aadhaar number has no public structure to parse.\n// Check it, mask it straight away, and keep only the masked form.\nconst masked = maskAadhaar(input)`,
    },
    functions: [
      { name: "validateAadhaar", signature: "validateAadhaar(input: string)", returns: "Result<string, AadhaarError>" },
      { name: "isValidAadhaar", signature: "isValidAadhaar(input: string)", returns: "boolean" },
      { name: "maskAadhaar", signature: "maskAadhaar(input: string, { maskChar? })", returns: 'Result<string, "INVALID_LENGTH">', note: "Masks before validating, so you can mask anything 12 digits long." },
      { name: "verhoeffValidate", signature: "verhoeffValidate(digits: string)", returns: "boolean" },
      { name: "verhoeffCheckDigit", signature: "verhoeffCheckDigit(digits: string)", returns: "number | null" },
      { name: "normalizeAadhaar", signature: "normalizeAadhaar(input: string)", returns: "string" },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["INVALID_CHARACTERS", "Something other than digits, spaces and hyphens."],
      ["INVALID_LENGTH", "Not 12 digits."],
      ["INVALID_FIRST_DIGIT", "Starts with 0 or 1."],
      ["INVALID_CHECKSUM", "Last digit is not the Verhoeff check digit. Usually a typo."],
    ],
    sources: [
      { label: "Verhoeff algorithm (tables and worked example)", url: "https://en.wikipedia.org/wiki/Verhoeff_algorithm" },
      { label: "Aadhaar: number format", url: "https://en.wikipedia.org/wiki/Aadhaar" },
      { label: "UIDAI", url: "https://uidai.gov.in/" },
    ],
  },
  {
    slug: "money",
    name: "Money",
    noun: "amount",
    article: "an",
    sample: "₹12,50,000",
    purpose: "Lakhs, crores, words in English and Hindi, and exact paise arithmetic.",
    imports: "formatInr, toWords, parseAmount",
    snippets: {
      validate: `parseAmount("3.4 Cr")\n// { ok: true, value: { paise: 3400000000, rupees: 34000000 } }\nparseAmount("5 bn")\n// { ok: false, reason: "UNKNOWN_UNIT", … }`,
      format: `formatInr(1250000)                  // "₹12,50,000"\nformatInr(1250000, { short: true })   // "₹12.5 L"\ntoWords(1250000, "hi")              // "बारह लाख पचास हज़ार"\nrupeesInWords(125050)               // "One thousand two hundred fifty rupees and fifty paise only"`,
      parse: `parseAmount("₹12,50,000")   // 125000000 paise\npercentOfPaise(99900, 18)  // 17982: 18% GST on ₹999, in paise\nsplitPaise(1000, 3)         // [334, 333, 333]`,
    },
    functions: [
      { name: "groupIndian", signature: "groupIndian(value: number | bigint | string)", returns: "string", errors: "RangeError if not a plain number" },
      { name: "formatInr", signature: 'formatInr(rupees, { symbol?, decimals?: 0 | 2 | "auto", short? })', returns: "string" },
      { name: "toShortForm", signature: 'toShortForm(rupees, { symbol?, units?: "short" | "long", maxDecimals? })', returns: "string", note: "K below a lakh, L, Cr. 99,99,999 becomes 1 Cr, not 100 L." },
      { name: "toWords", signature: 'toWords(n: number, locale?: "en" | "hi")', returns: "string", errors: "RangeError for negative or fractional n" },
      { name: "rupeesInWords", signature: "rupeesInWords(paise, { locale?, only? })", returns: "string" },
      { name: "parseAmount", signature: "parseAmount(input: string)", returns: "Result<{ paise, rupees }, ParseAmountError>" },
      { name: "toPaise", signature: "toPaise(rupees: number | string)", returns: "Result<number, ToPaiseError>" },
      { name: "fromPaise", signature: "fromPaise(paise: number)", returns: "string" },
      { name: "addPaise", signature: "addPaise(...amounts: number[])", returns: "number", errors: "RangeError on non-integers or overflow" },
      { name: "subtractPaise", signature: "subtractPaise(from: number, amount: number)", returns: "number" },
      { name: "multiplyPaise", signature: "multiplyPaise(paise: number, quantity: number)", returns: "number" },
      { name: "percentOfPaise", signature: 'percentOfPaise(paise, percent, rounding?: "half-up" | "half-even" | "down" | "up")', returns: "number", note: "Exact: uses BigInt internally." },
      { name: "allocatePaise", signature: "allocatePaise(total: number, weights: number[])", returns: "number[]", note: "Parts always add up to the total." },
      { name: "splitPaise", signature: "splitPaise(total: number, count: number)", returns: "number[]" },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["NOT_A_NUMBER", "Not digits with an optional unit."],
      ["UNKNOWN_UNIT", "A unit other than K, L, lakh, Cr, crore."],
      ["TOO_MANY_DECIMALS", "Finer than one paisa."],
      ["TOO_LARGE", "Beyond what a JavaScript number holds exactly."],
    ],
    sources: [
      { label: "Indian numbering system (lakh, crore, digit grouping)", url: "https://en.wikipedia.org/wiki/Indian_numbering_system" },
      { label: "Hindustani numerals (Hindi number names 1–99)", url: "https://en.wikipedia.org/wiki/Hindustani_numerals" },
    ],
  },
  {
    slug: "vehicle",
    name: "Vehicle",
    noun: "vehicle number",
    article: "a",
    sample: "KA 01 AB 1234",
    purpose: "State, RTO, series and number from a plate, including BH series.",
    imports: "parseVehicleNumber, formatVehicleNumber",
    snippets: {
      validate: `validateVehicleNumber("XX 01 AB 1234")\n// { ok: false, reason: "UNKNOWN_STATE_CODE", … }`,
      format: `formatVehicleNumber("ka01ab1234")  // "KA 01 AB 1234"\nformatVehicleNumber("22bh1234aa")  // "22 BH 1234 AA"`,
      parse: `parseVehicleNumber("KA 01 AB 1234")\n// { ok: true, value: { kind: "state", stateCode: "KA", stateName: "Karnataka",\n//   rtoCode: "01", series: "AB", number: "1234", … } }`,
    },
    functions: [
      { name: "parseVehicleNumber", signature: "parseVehicleNumber(input: string)", returns: "Result<VehicleNumberParts, VehicleNumberError>", note: 'kind is "state" or "bharat".' },
      { name: "validateVehicleNumber", signature: "validateVehicleNumber(input: string)", returns: "Result<string, VehicleNumberError>" },
      { name: "isValidVehicleNumber", signature: "isValidVehicleNumber(input: string)", returns: "boolean" },
      { name: "formatVehicleNumber", signature: "formatVehicleNumber(input: string | VehicleNumberParts)", returns: "Result<string, VehicleNumberError>" },
      { name: "normalizeVehicleNumber", signature: "normalizeVehicleNumber(input: string)", returns: "string" },
    ],
    errors: [
      ["EMPTY", "Nothing was entered."],
      ["INVALID_FORMAT", "Not state–RTO–series–number or YY BH #### XX."],
      ["UNKNOWN_STATE_CODE", "Two letters that are not a state or UT code."],
      ["INVALID_RTO_CODE", "RTO code 0 or 00."],
      ["INVALID_NUMBER", "Number part all zeros."],
    ],
    sources: [
      { label: "Vehicle registration plates of India (state codes)", url: "https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_India" },
      { label: "PIB: Bharat (BH) series registration mark, G.S.R. 594(E)", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1883991" },
    ],
  },
];

export function moduleBySlug(slug: string): ModuleInfo | undefined {
  return MODULES.find((m) => m.slug === slug);
}
