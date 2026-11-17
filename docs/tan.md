---
module: tan
title: TAN
lede: Anyone who deducts tax at source quotes a TAN on every TDS return and certificate. It is ten characters, and the first three say which city's tax office it belongs to.
---

## Try it {#try}

<Playground module="tan" />

## Anatomy {#anatomy}

| Characters | Part | Rule |
| --- | --- | --- |
| 1–3 | Jurisdiction | Letters, the city code of the assessing officer, e.g. `BLR`, `MUM`, `DEL` |
| 4 | Name initial | First letter of the deductor's name |
| 5–9 | Sequence | Five digits |
| 10 | Check character | A letter; the algorithm is not published, so it is not verified |

## Validate {#validate}

```ts
import { validateTan } from "bharat-kit/tan";

const result = validateTan(input);
if (!result.ok) showFieldError("tan", result.message);
// "BLR012345B" → INVALID_FORMAT: Character 4 must be a letter.
```

## Parse {#parse}

```ts
import { parseTan } from "bharat-kit/tan";

const parsed = parseTan("blra 12345 b");
if (parsed.ok) parsed.value.jurisdiction; // "BLR"
```

## TAN or PAN? {#tan-or-pan}

Both are ten characters and both end in a letter, so they are easy to mix up on a form. A PAN has five letters before its digits; a TAN has four. If a user types a PAN into a TAN field, `validateTan` reports character 5 as the problem, which is where the two formats differ.

## Functions {#functions}

<SpecTables module="tan" part="functions" />

## Errors {#errors}

<SpecTables module="tan" part="errors" />

## Limits {#limits}

- The 10th character is a check character, but its algorithm is not published. bharat-kit checks that it is a letter and nothing more.
- bharat-kit does not check the jurisdiction code against a list. The list of city codes is not published in one place, and it grows.
- A well-formed TAN may not be allotted. The TRACES portal and the e-filing portal can confirm a deductor.

## Sources {#sources}

<SpecTables module="tan" part="sources" />
