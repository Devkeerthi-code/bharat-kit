---
module: mobile
title: Mobile
lede: People type mobile numbers as +91 98765 43210, 098765-43210 or 9876543210. bharat-kit accepts all of them, stores the ten digits, and formats them for display, for SMS gateways and for WhatsApp.
---

## Try it {#try}

<Playground module="mobile" />

## Validate {#validate}

```ts
import { validateMobile } from "bharat-kit/mobile";

const result = validateMobile(form.phone);
if (!result.ok) return showFieldError("phone", result.message);
save(result.value); // "9876543210"
```

## Format {#format}

```ts
import { formatMobile } from "bharat-kit/mobile";

formatMobile("09876543210");             // "+91 98765 43210" (default)
formatMobile("9876543210", "national");  // "98765 43210"
formatMobile("9876543210", "e164");      // "+919876543210", for SMS and OTP APIs
```

## Parse {#parse}

```ts
import { toWhatsAppLink } from "bharat-kit/mobile";

toWhatsAppLink("98765 43210", "Is my order ready?");
// "https://wa.me/919876543210?text=Is%20my%20order%20ready%3F"
```

## Functions {#functions}

<SpecTables module="mobile" part="functions" />

## Errors {#errors}

<SpecTables module="mobile" part="errors" />

## Limits {#limits}

- Landlines are rejected. But a landline written with its STD code, such as `080 2345 6789`, looks exactly like a mobile number once the leading 0 is removed. No offline check can tell them apart.
- Starting with 6–9 doesn't mean the number is in service. Send an OTP to confirm a number.

## Sources {#sources}

<SpecTables module="mobile" part="sources" />
