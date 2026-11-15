---
module: ifsc
title: IFSC
lede: An IFSC names one bank branch in 11 characters. bharat-kit checks the shape offline. If you need the branch's name and address, it calls a directory you choose. It never makes a network call by itself.
---

## Try it {#try}

<Playground module="ifsc" />

## Anatomy {#anatomy}

| Characters | Part | Rule |
| --- | --- | --- |
| 1–4 | Bank code | Letters, assigned by RBI |
| 5 | Reserved | Always `0` (zero) |
| 6–11 | Branch code | Letters or digits, chosen by the bank |

## Validate {#validate}

```ts
import { validateIfsc } from "bharat-kit/ifsc";

const result = validateIfsc(input);
if (!result.ok) showFieldError("ifsc", result.message);
// "SBIN1001234" → INVALID_FIFTH_CHARACTER
```

## Format {#format}

```ts
const result = validateIfsc(" sbin 0001234 ");
if (result.ok) save(result.value); // "SBIN0001234"
```

## Parse {#parse}

```ts
import { parseIfsc, lookupIfsc } from "bharat-kit/ifsc";

parseIfsc("SBIN0001234");
// { ok: true, value: { ifsc: "SBIN0001234", bankCode: "SBIN", branchCode: "001234" } }
```

### Optional lookup

`lookupIfsc` checks the code offline first, so a malformed code never causes a request. Then it calls your fetcher with an `AbortSignal`, and it handles timeouts and cancellation for you. Return `null` from the fetcher for "no such branch".

```ts
const result = await lookupIfsc(
  "SBIN0001234",
  async (code, signal) => {
    // Example: Razorpay's public IFSC API. Any directory works.
    const response = await fetch(`https://ifsc.razorpay.com/${code}`, { signal });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as { BANK: string; BRANCH: string };
  },
  { timeoutMs: 5000 },
);

if (!result.ok) {
  // NOT_FOUND, TIMEOUT, ABORTED, LOOKUP_FAILED or a shape error
}
```

## Functions {#functions}

<SpecTables module="ifsc" part="functions" />

## Errors {#errors}

<SpecTables module="ifsc" part="errors" />

## Limits {#limits}

- The offline check confirms the shape, not that the branch exists. Branches merge and close, so use a lookup when it matters.
- bharat-kit does not ship a bank-code table. It would go stale and add kilobytes. Use the lookup for bank names.

## Sources {#sources}

<SpecTables module="ifsc" part="sources" />
