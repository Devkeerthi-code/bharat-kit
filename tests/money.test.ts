import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  addPaise,
  allocatePaise,
  formatInr,
  fromPaise,
  groupIndian,
  multiplyPaise,
  parseAmount,
  percentOfPaise,
  rupeesInWords,
  splitPaise,
  subtractPaise,
  toPaise,
  toShortForm,
  toWords,
} from "../src/money";

describe("groupIndian", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1000, "1,000"],
    [125000, "1,25,000"],
    [1250000, "12,50,000"],
    [123456789, "12,34,56,789"],
    [-1234567, "-12,34,567"],
    [10n ** 20n, "10,00,00,00,00,00,00,00,00,000"],
    ["1234567.891", "12,34,567.891"],
    ["0001234", "1,234"],
  ])("%s → %s", (input, expected) => {
    expect(groupIndian(input)).toBe(expected);
  });

  it("rejects things that are not plain numbers", () => {
    expect(() => groupIndian("12abc")).toThrow(RangeError);
    expect(() => groupIndian(Number.NaN)).toThrow(RangeError);
    expect(() => groupIndian(1e21)).toThrow(RangeError);
  });

  it("removing the commas gives back the digits", () => {
    fc.assert(fc.property(fc.bigInt({ min: 0n, max: 10n ** 30n }), (n) => groupIndian(n).replace(/,/g, "") === String(n)));
  });
});

describe("formatInr", () => {
  it.each<[number, Parameters<typeof formatInr>[1], string]>([
    [1250000, undefined, "₹12,50,000"],
    [1250000.5, undefined, "₹12,50,000.50"],
    [1250000, { decimals: 2 }, "₹12,50,000.00"],
    [1250000.75, { decimals: 0 }, "₹12,50,001"],
    [1250000, { symbol: false }, "12,50,000"],
    [-500, undefined, "-₹500"],
    [-0.001, undefined, "₹0"],
    [1250000, { short: true }, "₹12.5 L"],
    [1250000, { short: true, symbol: false }, "12.5 L"],
  ])("formatInr(%s, %j) → %s", (n, options, expected) => {
    expect(formatInr(n, options)).toBe(expected);
  });

  it("rejects infinity", () => {
    expect(() => formatInr(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("toShortForm", () => {
  it.each<[number, Parameters<typeof toShortForm>[1], string]>([
    [125000, undefined, "1.25 L"],
    [34000000, undefined, "3.4 Cr"],
    [45000, undefined, "45 K"],
    [999, undefined, "999"],
    [999.456, undefined, "999.46"],
    [9999999, undefined, "1 Cr"],
    [99999.6, undefined, "1 L"],
    [12500000000, { symbol: true }, "₹1,250 Cr"],
    [125000, { units: "long" }, "1.25 lakh"],
    [123456789, { maxDecimals: 1 }, "12.3 Cr"],
    [-2500000, { symbol: true }, "-₹25 L"],
  ])("toShortForm(%s, %j) → %s", (n, options, expected) => {
    expect(toShortForm(n, options)).toBe(expected);
  });

  it("rejects NaN", () => {
    expect(() => toShortForm(Number.NaN)).toThrow(RangeError);
  });
});

describe("toWords", () => {
  it.each<[number, string, string]>([
    [0, "zero", "शून्य"],
    [7, "seven", "सात"],
    [21, "twenty-one", "इक्कीस"],
    [59, "fifty-nine", "उनसठ"],
    [99, "ninety-nine", "निन्यानवे"],
    [101, "one hundred one", "एक सौ एक"],
    [1000, "one thousand", "एक हज़ार"],
    [1250000, "twelve lakh fifty thousand", "बारह लाख पचास हज़ार"],
    [34000000, "three crore forty lakh", "तीन करोड़ चालीस लाख"],
    [12345678, "one crore twenty-three lakh forty-five thousand six hundred seventy-eight", "एक करोड़ तेईस लाख पैंतालीस हज़ार छह सौ अठहत्तर"],
    [1000000000, "one hundred crore", "एक सौ करोड़"],
  ])("%s", (n, en, hi) => {
    expect(toWords(n)).toBe(en);
    expect(toWords(n, "hi")).toBe(hi);
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])("rejects %s", (n) => {
    expect(() => toWords(n)).toThrow(RangeError);
  });

  it("has a distinct Hindi word for each of 1–99", () => {
    const words = Array.from({ length: 99 }, (_, i) => toWords(i + 1, "hi"));
    expect(new Set(words).size).toBe(99);
    expect(words.every((w) => !w.includes(" ") && w !== "undefined")).toBe(true);
  });

  it("always produces words, never digits or blanks", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), fc.constantFrom("en" as const, "hi" as const), (n, locale) => {
        const words = toWords(n, locale);
        return words.length > 0 && !/\d|undefined|\s{2}/.test(words) && words === words.trim();
      }),
    );
  });
});

describe("rupeesInWords", () => {
  it.each<[number, Parameters<typeof rupeesInWords>[1], string]>([
    [125050, undefined, "One thousand two hundred fifty rupees and fifty paise only"],
    [100, undefined, "One rupee only"],
    [1, undefined, "One paisa only"],
    [0, undefined, "Zero rupees only"],
    [125000000, { only: false }, "Twelve lakh fifty thousand rupees"],
    [101, { locale: "hi" }, "एक रुपया और एक पैसा मात्र"],
    [125000000, { locale: "hi" }, "बारह लाख पचास हज़ार रुपये मात्र"],
  ])("rupeesInWords(%s, %j)", (paise, options, expected) => {
    expect(rupeesInWords(paise, options)).toBe(expected);
  });

  it("rejects fractional paise", () => {
    expect(() => rupeesInWords(1.5)).toThrow(RangeError);
  });
});

describe("parseAmount", () => {
  it.each([
    ["1250000", 125000000],
    ["12,50,000", 125000000],
    ["₹12.5 L", 125000000],
    ["3.4 Cr", 3400000000],
    ["50k", 5000000],
    ["Rs. 2 crore", 2000000000],
    ["INR 1,250.50", 125050],
    ["1.2345678 cr", 1234567800],
    ["2 lakhs", 20000000],
  ])("%j → %s paise", (input, paise) => {
    expect(parseAmount(input)).toEqual({ ok: true, value: { paise, rupees: paise / 100 } });
  });

  it.each([
    ["", "EMPTY"],
    ["  ₹ ", "EMPTY"],
    ["twelve", "NOT_A_NUMBER"],
    ["1.2.3", "NOT_A_NUMBER"],
    ["5 bn", "UNKNOWN_UNIT"],
    ["12.345", "TOO_MANY_DECIMALS"],
    ["99999999999999 cr", "TOO_LARGE"],
  ])("rejects %j with %s", (input, reason) => {
    expect(parseAmount(input)).toMatchObject({ ok: false, reason });
  });

  it("parses back what formatInr and toShortForm print", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10 ** 12 }), (rupees) => {
        const grouped = parseAmount(formatInr(rupees));
        const short = parseAmount(toShortForm(rupees, { maxDecimals: 7 }));
        return grouped.ok && grouped.value.rupees === rupees && short.ok && short.value.rupees === rupees;
      }),
    );
  });
});

describe("paise arithmetic", () => {
  it("toPaise is exact", () => {
    expect(toPaise("12.5")).toEqual({ ok: true, value: 1250 });
    expect(toPaise(0.1)).toEqual({ ok: true, value: 10 });
    expect(toPaise(0.1 + 0.2)).toEqual({ ok: true, value: 30 });
    expect(toPaise(0.125)).toMatchObject({ ok: false, reason: "TOO_MANY_DECIMALS" });
    expect(toPaise("1,250.05")).toEqual({ ok: true, value: 125005 });
    expect(toPaise("-3.07")).toEqual({ ok: true, value: -307 });
    expect(toPaise("-0")).toEqual({ ok: true, value: 0 });
    expect(toPaise(".5")).toEqual({ ok: true, value: 50 });
    expect(toPaise("5.")).toEqual({ ok: true, value: 500 });
  });

  it.each([
    ["", "EMPTY"],
    [".", "NOT_A_NUMBER"],
    ["abc", "NOT_A_NUMBER"],
    [Number.NaN, "NOT_A_NUMBER"],
    ["1.005", "TOO_MANY_DECIMALS"],
    ["999999999999999999", "TOO_LARGE"],
  ])("toPaise(%j) fails with %s", (input, reason) => {
    expect(toPaise(input)).toMatchObject({ ok: false, reason });
  });

  it("fromPaise prints two decimals", () => {
    expect(fromPaise(125050)).toBe("1250.50");
    expect(fromPaise(5)).toBe("0.05");
    expect(fromPaise(-125)).toBe("-1.25");
    expect(() => fromPaise(1.5)).toThrow(RangeError);
  });

  it("toPaise(fromPaise(x)) round-trips", () => {
    fc.assert(fc.property(fc.integer({ min: -(10 ** 15), max: 10 ** 15 }), (p) => {
      const back = toPaise(fromPaise(p));
      return back.ok && back.value === p;
    }));
  });

  it("adds, subtracts and multiplies whole paise", () => {
    expect(addPaise(10, 20, 30)).toBe(60);
    expect(addPaise()).toBe(0);
    expect(subtractPaise(100, 250)).toBe(-150);
    expect(multiplyPaise(19999, 3)).toBe(59997);
    expect(() => addPaise(0.1)).toThrow(RangeError);
    expect(() => subtractPaise(1, 0.5)).toThrow(RangeError);
    expect(() => multiplyPaise(100, 1.5)).toThrow(RangeError);
    expect(() => addPaise(Number.MAX_SAFE_INTEGER, 1)).toThrow(RangeError);
  });

  it("percentOfPaise rounds as asked", () => {
    expect(percentOfPaise(99900, 18)).toBe(17982);
    expect(percentOfPaise(1, 50)).toBe(1);
    expect(percentOfPaise(1, 50, "half-even")).toBe(0);
    expect(percentOfPaise(3, 50, "half-even")).toBe(2);
    expect(percentOfPaise(7, 30, "half-even")).toBe(2);
    expect(percentOfPaise(19, 10, "half-even")).toBe(2);
    expect(percentOfPaise(19, 10, "down")).toBe(1);
    expect(percentOfPaise(11, 10, "up")).toBe(2);
    expect(percentOfPaise(10, 10, "up")).toBe(1);
    expect(percentOfPaise(-1, 50)).toBe(-1);
    expect(percentOfPaise(10000, 2.5)).toBe(250);
    expect(() => percentOfPaise(100, 2.555)).toThrow(RangeError);
    expect(() => percentOfPaise(100, Number.NaN)).toThrow(RangeError);
  });

  it("allocatePaise and splitPaise always add back up", () => {
    expect(splitPaise(1000, 3)).toEqual([334, 333, 333]);
    expect(allocatePaise(100, [1, 3])).toEqual([25, 75]);
    expect(allocatePaise(-1000, [1, 1, 0])).toEqual([-500, -500, 0]);
    expect(() => splitPaise(100, 0)).toThrow(RangeError);
    expect(() => allocatePaise(100, [])).toThrow(RangeError);
    expect(() => allocatePaise(100, [1, -1])).toThrow(RangeError);
    expect(() => allocatePaise(100, [0, 0])).toThrow(RangeError);
    fc.assert(
      fc.property(
        fc.integer({ min: -(10 ** 12), max: 10 ** 12 }),
        fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 12 }).filter((w) => w.some((x) => x > 0)),
        (total, weights) => {
          const parts = allocatePaise(total, weights);
          return parts.reduce((a, b) => a + b, 0) === total && parts.every(Number.isSafeInteger) && parts.length === weights.length;
        },
      ),
    );
  });
});
