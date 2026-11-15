/**
 * India Post's nine PIN zones, keyed by the first digit of a pincode.
 * Source: India Post, "Postal Index Number (PIN)" (indiapost.gov.in); zone 9 is the
 * Army Postal Service.
 */
export const PIN_ZONES = {
  1: "Delhi, Haryana, Punjab, Himachal Pradesh, Jammu and Kashmir, Ladakh, Chandigarh",
  2: "Uttar Pradesh, Uttarakhand",
  3: "Rajasthan, Gujarat, Dadra and Nagar Haveli and Daman and Diu",
  4: "Maharashtra, Goa, Madhya Pradesh, Chhattisgarh",
  5: "Andhra Pradesh, Telangana, Karnataka",
  6: "Tamil Nadu, Kerala, Puducherry, Lakshadweep",
  7: "West Bengal, Odisha, North East, Sikkim, Andaman and Nicobar Islands",
  8: "Bihar, Jharkhand",
  9: "Army Postal Service",
} as const;

export type PinZone = keyof typeof PIN_ZONES;

/**
 * Postal circle by the first two digits. Source: India Post PIN sub-zone allocation, as
 * tabulated in the Wikipedia article "Postal Index Number". Circles are administrative:
 * a few border pincodes are served by the neighbouring state's circle (for example 403xxx
 * is Goa inside the Maharashtra circle), so this is a region hint, not an address check.
 */
const CIRCLE_RANGES: readonly (readonly [from: number, to: number, circle: string])[] = [
  [11, 11, "Delhi"],
  [12, 13, "Haryana"],
  [14, 16, "Punjab"],
  [17, 17, "Himachal Pradesh"],
  [18, 19, "Jammu and Kashmir"],
  [20, 28, "Uttar Pradesh and Uttarakhand"],
  [30, 34, "Rajasthan"],
  [36, 39, "Gujarat"],
  [40, 44, "Maharashtra"],
  [45, 48, "Madhya Pradesh"],
  [49, 49, "Chhattisgarh"],
  [50, 50, "Telangana"],
  [51, 53, "Andhra Pradesh"],
  [56, 59, "Karnataka"],
  [60, 64, "Tamil Nadu"],
  [67, 69, "Kerala"],
  [70, 74, "West Bengal"],
  [75, 77, "Odisha"],
  [78, 78, "Assam"],
  [79, 79, "North East"],
  [80, 85, "Bihar and Jharkhand"],
  [90, 99, "Army Postal Service"],
];

export function postalCircleFor(prefix: number): string | null {
  const match = CIRCLE_RANGES.find(([from, to]) => prefix >= from && prefix <= to);
  return match ? match[2] : null;
}
