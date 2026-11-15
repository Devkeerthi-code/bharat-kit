export type WordsLocale = "en" | "hi";

interface Scale {
  readonly below100: (n: number) => string;
  readonly hundred: string;
  readonly thousand: string;
  readonly lakh: string;
  readonly crore: string;
  readonly zero: string;
}

const EN_ONES = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function englishBelow100(n: number): string {
  if (n < 20) return String(EN_ONES[n]);
  const ones = n % 10;
  return `${String(EN_TENS[Math.floor(n / 10)])}${ones ? `-${String(EN_ONES[ones])}` : ""}`;
}

/*
 * Hindi number names from 1 to 99 don't follow a rule (२१ is इक्कीस, ५९ is उनसठ),
 * so they are a table. Source: standard Hindi numerals as listed in the Wikipedia
 * article "Hindustani numerals" and the Central Hindi Directorate's spellings.
 */
const HI_1_TO_99 = (
  "एक दो तीन चार पाँच छह सात आठ नौ दस " +
  "ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस बीस " +
  "इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस तीस " +
  "इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस चालीस " +
  "इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास " +
  "इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ साठ " +
  "इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर " +
  "इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उनासी अस्सी " +
  "इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे " +
  "इक्यानवे बानवे तिरानवे चौरानवे पचानवे छियानवे सत्तानवे अट्ठानवे निन्यानवे"
).split(" ");

const SCALES: Record<WordsLocale, Scale> = {
  en: { below100: englishBelow100, hundred: "hundred", thousand: "thousand", lakh: "lakh", crore: "crore", zero: "zero" },
  hi: { below100: (n) => String(HI_1_TO_99[n - 1]), hundred: "सौ", thousand: "हज़ार", lakh: "लाख", crore: "करोड़", zero: "शून्य" },
};

function wordsFor(n: number, scale: Scale): string {
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor((n % 1e7) / 1e5);
  const thousand = Math.floor((n % 1e5) / 1e3);
  const hundred = Math.floor((n % 1e3) / 100);
  const rest = n % 100;
  if (crore) parts.push(`${wordsFor(crore, scale)} ${scale.crore}`);
  if (lakh) parts.push(`${scale.below100(lakh)} ${scale.lakh}`);
  if (thousand) parts.push(`${scale.below100(thousand)} ${scale.thousand}`);
  if (hundred) parts.push(`${scale.below100(hundred)} ${scale.hundred}`);
  if (rest) parts.push(scale.below100(rest));
  return parts.join(" ");
}

/**
 * A whole number in words, using the Indian system (thousand, lakh, crore):
 * toWords(1250000) → "twelve lakh fifty thousand"; toWords(1250000, "hi") → "बारह लाख पचास हज़ार".
 * Above 99 crore the crore count is itself spelled out ("one hundred crore").
 * Throws a RangeError for negative, fractional or unsafe integers.
 */
export function toWords(n: number, locale: WordsLocale = "en"): string {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError("toWords expects a whole number from 0 up to Number.MAX_SAFE_INTEGER.");
  const scale = SCALES[locale];
  return n === 0 ? scale.zero : wordsFor(n, scale);
}

export interface RupeesInWordsOptions {
  readonly locale?: WordsLocale;
  /** Append "only" / "मात्र", as written on cheques and invoices. Default true. */
  readonly only?: boolean;
}

const CURRENCY = {
  en: { rupee: "rupee", rupees: "rupees", paisa: "paisa", paise: "paise", and: "and", only: "only" },
  hi: { rupee: "रुपया", rupees: "रुपये", paisa: "पैसा", paise: "पैसे", and: "और", only: "मात्र" },
} as const;

/**
 * An amount in paise, written out for an invoice or cheque:
 * rupeesInWords(125050) → "One thousand two hundred fifty rupees and fifty paise only".
 */
export function rupeesInWords(paise: number, options: RupeesInWordsOptions = {}): string {
  if (!Number.isSafeInteger(paise) || paise < 0) throw new RangeError("rupeesInWords expects a whole, non-negative number of paise.");
  const locale = options.locale ?? "en";
  const unit = CURRENCY[locale];
  const rupees = Math.floor(paise / 100);
  const rest = paise % 100;

  const parts: string[] = [];
  if (rupees || !rest) parts.push(`${toWords(rupees, locale)} ${rupees === 1 ? unit.rupee : unit.rupees}`);
  if (rest) {
    if (parts.length) parts.push(unit.and);
    parts.push(`${toWords(rest, locale)} ${rest === 1 ? unit.paisa : unit.paise}`);
  }
  if (options.only ?? true) parts.push(unit.only);
  const text = parts.join(" ");
  return locale === "en" ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
