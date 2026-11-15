---
module: vehicle
title: Vehicle
lede: Number plates come in two shapes, state plates (KA 01 AB 1234) and Bharat series plates (22 BH 1234 AA). bharat-kit reads both and tells you which state issued a state plate.
---

## Try it {#try}

<Playground module="vehicle" />

## Validate {#validate}

```ts
import { validateVehicleNumber } from "bharat-kit/vehicle";

validateVehicleNumber("ka-01-ab-1234"); // { ok: true, value: "KA01AB1234" }
validateVehicleNumber("XX 01 AB 1234"); // { ok: false, reason: "UNKNOWN_STATE_CODE", … }
```

## Format {#format}

```ts
import { formatVehicleNumber } from "bharat-kit/vehicle";

formatVehicleNumber("ka01ab1234"); // { ok: true, value: "KA 01 AB 1234" }
formatVehicleNumber("22bh1234aa"); // { ok: true, value: "22 BH 1234 AA" }
```

## Parse {#parse}

```ts
import { parseVehicleNumber } from "bharat-kit/vehicle";

const plate = parseVehicleNumber("KA 01 AB 1234");
if (plate.ok && plate.value.kind === "state") {
  plate.value.stateName; // "Karnataka"
  plate.value.rtoCode;   // "01"
}
```

## Functions {#functions}

<SpecTables module="vehicle" part="functions" />

## Errors {#errors}

<SpecTables module="vehicle" part="errors" />

## Limits {#limits}

- Legacy codes are accepted and flagged: `OR` (now `OD`), `UA` (now `UK`), `DN` (merged into `DD`) and `TS` (now `TG`). Many vehicles still carry them.
- RTO codes aren't checked against each state's list of offices. Without a separator, an input like `KA1234` is ambiguous between RTO 1 and RTO 12. The parser takes the longest RTO code.
- Temporary registrations, diplomatic plates and defence plates use other formats and are rejected.

## Sources {#sources}

<SpecTables module="vehicle" part="sources" />
