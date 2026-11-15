/**
 * State and union territory codes used on registration plates.
 * Source: Ministry of Road Transport and Highways, Central Motor Vehicles Rules 1989
 * (Rule 50) and state notifications. Legacy codes are still on older vehicles:
 * OR (now OD, 2012), UA (now UK, 2007), DN (merged into DD, 2020), TS (now TG, 2024).
 */
export const VEHICLE_STATE_CODES = {
  AN: "Andaman and Nicobar Islands",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CG: "Chhattisgarh",
  CH: "Chandigarh",
  DD: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi",
  DN: "Dadra and Nagar Haveli",
  GA: "Goa",
  GJ: "Gujarat",
  HP: "Himachal Pradesh",
  HR: "Haryana",
  JH: "Jharkhand",
  JK: "Jammu and Kashmir",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  LD: "Lakshadweep",
  MH: "Maharashtra",
  ML: "Meghalaya",
  MN: "Manipur",
  MP: "Madhya Pradesh",
  MZ: "Mizoram",
  NL: "Nagaland",
  OD: "Odisha",
  OR: "Odisha",
  PB: "Punjab",
  PY: "Puducherry",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TG: "Telangana",
  TN: "Tamil Nadu",
  TR: "Tripura",
  TS: "Telangana",
  UA: "Uttarakhand",
  UK: "Uttarakhand",
  UP: "Uttar Pradesh",
  WB: "West Bengal",
} as const;

export type VehicleStateCode = keyof typeof VEHICLE_STATE_CODES;

export const LEGACY_VEHICLE_STATE_CODES: readonly VehicleStateCode[] = ["DN", "OR", "TS", "UA"];
