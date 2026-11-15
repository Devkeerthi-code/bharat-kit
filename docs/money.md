---
module: money
title: Money
lede: Indian grouping (12,50,000), lakh and crore short forms (12.5 L), amounts in words in English and Hindi, and arithmetic on whole paise so totals never drift.
---

## Try it {#try}

<Playground module="money" />

## Validate {#validate}

`parseAmount` reads amounts the way people write them and tells you exactly what's wrong:

```ts
import { parseAmount } from "bharat-kit/money";

parseAmount("3.4 Cr");     // { ok: true, value: { paise: 3400000000, rupees: 34000000 } }
parseAmount("Rs. 2 lakh"); // 20000000 paise
parseAmount("5 bn");       // { ok: false, reason: "UNKNOWN_UNIT", … }
parseAmount("12.345");     // { ok: false, reason: "TOO_MANY_DECIMALS", … }
```

## Format {#format}

```ts
import { formatInr, toShortForm, toWords, rupeesInWords } from "bharat-kit/money";

formatInr(1250000);                      // "₹12,50,000"
formatInr(1250000.5);                    // "₹12,50,000.50"
toShortForm(34000000);                   // "3.4 Cr"
toShortForm(125000, { units: "long" });  // "1.25 lakh"
toWords(1250000);                        // "twelve lakh fifty thousand"
toWords(1250000, "hi");                  // "बारह लाख पचास हज़ार"
rupeesInWords(125050);                   // "One thousand two hundred fifty rupees and fifty paise only"
rupeesInWords(125050, { locale: "hi" }); // "एक हज़ार दो सौ पचास रुपये और पचास पैसे मात्र"
```

## Parse {#parse}

Do arithmetic on integer paise and format only when you display:

```ts
import { toPaise, addPaise, percentOfPaise, splitPaise, fromPaise } from "bharat-kit/money";

const price = 99900;                       // ₹999.00
const gst = percentOfPaise(price, 18);     // 17982, exact (BigInt inside)
const total = addPaise(price, gst);        // 117882
splitPaise(total, 3);                      // [39294, 39294, 39294]: always sums to total
fromPaise(total);                          // "1178.82"
toPaise("0.1");                            // { ok: true, value: 10 }
```

### Why paise

In JavaScript, `0.1 + 0.2` is `0.30000000000000004`. Across an invoice with many lines, those errors add up to visible paise. Integers are exact up to about ₹90 lakh crore, so bharat-kit keeps money in paise and throws a `RangeError` if a calculation would leave that range.

## Functions {#functions}

<SpecTables module="money" part="functions" />

## Errors {#errors}

`parseAmount` and `toPaise` return these reasons. The arithmetic helpers throw `RangeError` instead, because passing them a fractional paisa is a bug in the calling code, not bad input from a user.

<SpecTables module="money" part="errors" />

## Limits {#limits}

- Words stop at "crore". Above 99 crore, the crore count is itself spelled out ("one hundred crore"), as is usual on Indian cheques. Arab and kharab aren't used.
- English words don't include "and" ("one hundred one"). That matches most cheque-writing guides, but it is a style choice.

## Sources {#sources}

<SpecTables module="money" part="sources" />
