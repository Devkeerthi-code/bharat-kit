---
module: udyam
title: Udyam
lede: Since July 2020 every micro, small or medium enterprise registers on the Udyam portal and gets a number like UDYAM-KA-03-0012345. Banks, buyers and tender forms ask for it, and people type it every way but the right one.
---

## Try it {#try}

<Playground module="udyam" />

## Anatomy {#anatomy}

| Part | Example | Rule |
| --- | --- | --- |
| Prefix | `UDYAM` | Always the word UDYAM |
| State | `KA` | Two letters |
| District | `03` | Two digits |
| Serial | `0012345` | Seven digits |

## Validate {#validate}

```ts
import { validateUdyam } from "bharat-kit/udyam";

const result = validateUdyam("udyam ka 03 0012345");
if (result.ok) save(result.value); // "UDYAM-KA-03-0012345"
```

Spaces, missing hyphens and lower case are all accepted, and the value always comes back in the hyphenated form printed on the certificate.

## Parse {#parse}

```ts
import { parseUdyam } from "bharat-kit/udyam";

const parsed = parseUdyam("UDYAM-KA-03-0012345");
if (parsed.ok) parsed.value.stateCode; // "KA"
```

## Functions {#functions}

<SpecTables module="udyam" part="functions" />

## Errors {#errors}

<SpecTables module="udyam" part="errors" />

## Limits {#limits}

- Older Udyog Aadhaar numbers (`KR03D0012345`) are a different, retired format. `validateUdyam` rejects them with `MISSING_PREFIX`; the enterprise has to re-register on the Udyam portal.
- The state and district codes are checked for shape, not against the portal's list.
- A well-formed number may not be registered. The Udyam portal's verification page can confirm it.

## Sources {#sources}

<SpecTables module="udyam" part="sources" />
