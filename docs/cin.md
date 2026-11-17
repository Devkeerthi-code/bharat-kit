---
module: cin
title: CIN
lede: Every company registered in India gets a 21-character Corporate Identity Number. It is printed on letterheads and invoices, and it already tells you whether the company is listed, where it was registered and when.
---

## Try it {#try}

<Playground module="cin" />

## Anatomy {#anatomy}

| Characters | Part | Rule |
| --- | --- | --- |
| 1 | Listing | `L` listed on a stock exchange, `U` unlisted |
| 2–6 | Industry | Five-digit National Industrial Classification code |
| 7–8 | State | Two letters for the Registrar of Companies' state, e.g. `KA`, `MH` |
| 9–12 | Year | Year of incorporation |
| 13–15 | Ownership | Three letters (table below) |
| 16–21 | Registration | Six digits from the Registrar |

## Validate {#validate}

```ts
import { validateCin } from "bharat-kit/cin";

const result = validateCin(input);
if (!result.ok) showFieldError("cin", result.message);
// "U72200KA2010XYZ012345" → INVALID_OWNERSHIP_TYPE
```

## Parse {#parse}

```ts
import { parseCin } from "bharat-kit/cin";

const parsed = parseCin("U72200KA2010PTC012345");
if (parsed.ok) {
  parsed.value.listed;              // false
  parsed.value.yearOfIncorporation; // 2010
  parsed.value.ownershipName;       // "Private Limited Company"
}
```

### Ownership types

| Code | Meaning |
| --- | --- |
| PTC | Private Limited Company |
| PLC | Public Limited Company |
| OPC | One Person Company |
| GOI | Company owned by the Government of India |
| SGC | Company owned by a State Government |
| NPL | Not-for-profit Licensed Company |
| FTC | Subsidiary of a Foreign Company |
| FLC | Financial Lease Company |
| GAP · GAT | General Association, public or private |
| ULL · ULT | Unlimited liability, public or private |

## Functions {#functions}

<SpecTables module="cin" part="functions" />

## Errors {#errors}

<SpecTables module="cin" part="errors" />

## Limits {#limits}

- The state letters and industry code are checked for shape only. bharat-kit does not ship the full NIC list.
- A company's CIN changes when it lists, delists or converts (a private company becoming public, for example). An old CIN on an old invoice is still well-formed.
- LLPs have an LLPIN (`AAA-1234`), not a CIN. `validateCin` rejects it on length.
- A well-formed CIN may not be registered. The MCA portal's company search can confirm it.

## Sources {#sources}

<SpecTables module="cin" part="sources" />
