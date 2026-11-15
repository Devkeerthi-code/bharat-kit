---
module: upi
title: UPI
lede: Check a UPI ID before you save it, then build a upi://pay link that any UPI app opens with the payee, amount and note filled in.
---

## Try it {#try}

<Playground module="upi" />

## Build a payment link {#link}

On a phone, "Open in a UPI app" hands the link to the installed UPI apps. On a desktop, nothing may happen, so show the link as a QR code there.

<UpiLinkBuilder />

## Validate {#validate}

```ts
import { validateVpa } from "bharat-kit/upi";

const result = validateVpa(input);
if (!result.ok) showFieldError("upi", result.message);
// "name@ok@bank" → MULTIPLE_AT
```

## Format {#format}

```ts
import { buildUpiLink } from "bharat-kit/upi";

const link = buildUpiLink({
  payeeVpa: "demo.shop@okbank",
  payeeName: "Demo Shop",
  amountPaise: 12550, // ₹125.50, as integer paise
  note: "Invoice 1042",
  transactionRef: "ORD-1042",
});
// upi://pay?pa=demo.shop@okbank&pn=Demo%20Shop&am=125.50&cu=INR&tn=Invoice%201042&tr=ORD-1042
```

Every value is percent-encoded. Spaces become `%20`, never `+`, because some apps show a literal `+`. The `@` in the payee address is left as it is, because some apps don't decode `%40`.

## Parse {#parse}

```ts
import { parseVpa } from "bharat-kit/upi";

parseVpa("Name@OKBank");
// { ok: true, value: { vpa: "name@okbank", handle: "name", provider: "okbank" } }
```

## Functions {#functions}

<SpecTables module="upi" part="functions" />

## Errors {#errors}

<SpecTables module="upi" part="errors" />

## Limits {#limits}

- A valid shape doesn't mean the UPI ID is registered. UPI apps show the payee's registered name before the payer confirms, and that is the real check.
- The provider is not checked against a list of handles. New handles appear often, and a stale list would reject real IDs.

## Sources {#sources}

<SpecTables module="upi" part="sources" />
