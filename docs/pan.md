---
module: pan
title: PAN
lede: A PAN is ten characters. The fourth letter says who holds it, an individual, a company, a trust and so on, which is often the first question a form needs answered.
---

## Try it {#try}

<Playground module="pan" />

## Anatomy {#anatomy}

| Characters | Part | Rule |
| --- | --- | --- |
| 1–3 | Series | Letters `AAA`–`ZZZ` |
| 4 | Holder type | One of `A B C F G H J L P T` (table below) |
| 5 | Name initial | Surname initial for individuals, name initial for others |
| 6–9 | Sequence | Four digits |
| 10 | Check character | A letter; the algorithm is not published, so it is not verified |

## Validate {#validate}

```ts
import { validatePan } from "bharat-kit/pan";

const result = validatePan(input);
if (!result.ok) showFieldError("pan", result.message);
// "ABCDE1234F" → INVALID_HOLDER_TYPE: "D" is not a PAN holder type.
```

## Format {#format}

```ts
import { formatPan } from "bharat-kit/pan";

formatPan(" abcpe 1234 f "); // "ABCPE1234F"
formatPan("abc");            // null
```

## Parse {#parse}

```ts
import { parsePan } from "bharat-kit/pan";

const parsed = parsePan("AAACB1234C");
if (parsed.ok) parsed.value.holderTypeName; // "Company"
```

### Holder types

| Letter | Holder |
| --- | --- |
| A | Association of Persons |
| B | Body of Individuals |
| C | Company |
| F | Firm or LLP |
| G | Government |
| H | Hindu Undivided Family |
| J | Artificial Juridical Person |
| L | Local Authority |
| P | Individual |
| T | Trust |

## Functions {#functions}

<SpecTables module="pan" part="functions" />

## Errors {#errors}

<SpecTables module="pan" part="errors" />

## Limits {#limits}

- The 10th character is a check character, but the Income Tax Department does not publish how it is computed. bharat-kit checks that it is a letter and nothing more.
- A well-formed PAN may not be allotted. Only the Income Tax Department's verification services can confirm that.

## Sources {#sources}

<SpecTables module="pan" part="sources" />
