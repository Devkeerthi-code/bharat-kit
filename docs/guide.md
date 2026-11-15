---
title: Guide
lede: Install, import only what you use, and handle every failure by its reason code. Five minutes, start to finish.
---

## Install {#install}

```sh
npm i bharat-kit
```

No dependencies. It runs in browsers, Node 18+, Deno, Bun and edge runtimes. Types are included, and it ships both ESM and CommonJS builds.

## Import what you use {#import}

Every module has its own entry point, and the package is marked `sideEffects: false`. A bundler keeps only the functions you import.

```ts
import { validateGstin } from "bharat-kit/gstin";
import { formatInr, toWords } from "bharat-kit/money";

// Or everything from the root. Tree-shaking still drops what you don't call.
import { validatePan, validateMobile } from "bharat-kit";
```

## Results, not booleans {#results}

Every `validate…` and `parse…` function returns a `Result`. On success it holds the normalised value. On failure it holds a stable `reason` you can switch on, a `message` you can show, and sometimes the `index` of the bad character.

```ts
import { validateIfsc } from "bharat-kit/ifsc";

const result = validateIfsc(input);

if (result.ok) {
  save(result.value); // "SBIN0001234"
} else {
  switch (result.reason) {
    case "INVALID_FIFTH_CHARACTER":
      highlightCharacter(result.index); // 4
      break;
    default:
      showError(result.message);
  }
}
```

When you only need yes or no, every module also has an `isValid…` function that returns a boolean.

## Check on the server too {#server}

Browser checks are for fast feedback. A request can skip your form entirely, so run the same function in your API handler before you save or charge anything. bharat-kit has no browser-only code, so the same import works in both places.

```ts
// app/api/invoice/route.ts
import { validateGstin } from "bharat-kit/gstin";

export async function POST(request: Request) {
  const body = await request.json();
  const gstin = validateGstin(String(body.gstin ?? ""));
  if (!gstin.ok) return Response.json({ field: "gstin", reason: gstin.reason, message: gstin.message }, { status: 422 });
  // …
}
```

## What bharat-kit does not do {#limits}

- It doesn't check that a GSTIN, PAN, IFSC, UPI ID or pincode is registered or in use. It checks the format and the check digits. Use the issuing authority's lookup for registration.
- It makes no network calls. `lookupIfsc` calls the fetcher you pass in.
- It doesn't store or log anything. That matters most for Aadhaar: read the [Aadhaar page](./aadhaar#privacy).

## Modules {#modules}

| Module | Import | Main functions |
| --- | --- | --- |
| [GSTIN](./gstin) | `bharat-kit/gstin` | `validateGstin`, `parseGstin`, `gstinCheckDigit` |
| [PAN](./pan) | `bharat-kit/pan` | `validatePan`, `parsePan` |
| [IFSC](./ifsc) | `bharat-kit/ifsc` | `validateIfsc`, `parseIfsc`, `lookupIfsc` |
| [UPI](./upi) | `bharat-kit/upi` | `validateVpa`, `buildUpiLink` |
| [Mobile](./mobile) | `bharat-kit/mobile` | `validateMobile`, `formatMobile`, `toWhatsAppLink` |
| [Pincode](./pincode) | `bharat-kit/pincode` | `validatePincode`, `parsePincode` |
| [Aadhaar](./aadhaar) | `bharat-kit/aadhaar` | `validateAadhaar`, `maskAadhaar` |
| [Money](./money) | `bharat-kit/money` | `formatInr`, `toShortForm`, `toWords`, `parseAmount`, `percentOfPaise` |
| [Vehicle](./vehicle) | `bharat-kit/vehicle` | `parseVehicleNumber`, `formatVehicleNumber` |
