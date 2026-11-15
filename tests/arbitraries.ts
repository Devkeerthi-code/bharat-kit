import fc from "fast-check";
import { GST_STATE_CODES, gstinCheckDigit } from "../src/gstin";
import { PAN_HOLDER_TYPES } from "../src/pan";
import { verhoeffCheckDigit } from "../src/aadhaar";
import { VEHICLE_STATE_CODES } from "../src/vehicle";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DIGITS = "0123456789".split("");

const letter = fc.constantFrom(...LETTERS);
const digit = fc.constantFrom(...DIGITS);
const join = (parts: string[]): string => parts.join("");

export const validPan = fc
  .tuple(
    fc.array(letter, { minLength: 3, maxLength: 3 }).map(join),
    fc.constantFrom(...Object.keys(PAN_HOLDER_TYPES)),
    letter,
    fc.array(digit, { minLength: 4, maxLength: 4 }).map(join),
    letter,
  )
  .map(join);

export const validGstin = fc
  .tuple(
    fc.constantFrom(...Object.keys(GST_STATE_CODES)),
    validPan,
    fc.constantFrom(..."123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")),
  )
  .map(([state, pan, entity]) => {
    const first14 = `${state}${pan}${entity}Z`;
    return `${first14}${String(gstinCheckDigit(first14))}`;
  });

export const validAadhaar = fc
  .tuple(fc.constantFrom(..."23456789".split("")), fc.array(digit, { minLength: 10, maxLength: 10 }).map(join))
  .map(([first, rest]) => `${first}${rest}${String(verhoeffCheckDigit(first + rest))}`);

export const validMobile = fc
  .tuple(fc.constantFrom("6", "7", "8", "9"), fc.array(digit, { minLength: 9, maxLength: 9 }).map(join))
  .map(join);

export const validIfsc = fc
  .tuple(
    fc.array(letter, { minLength: 4, maxLength: 4 }).map(join),
    fc.array(fc.constantFrom(...LETTERS, ...DIGITS), { minLength: 6, maxLength: 6 }).map(join),
  )
  .map(([bank, branch]) => `${bank}0${branch}`);

export const validPincode = fc
  .tuple(fc.constantFrom(..."123456789".split("")), fc.array(digit, { minLength: 5, maxLength: 5 }).map(join))
  .map(join);

export const validStatePlate = fc
  .tuple(
    fc.constantFrom(...Object.keys(VEHICLE_STATE_CODES)),
    fc.integer({ min: 1, max: 99 }).map((n) => String(n).padStart(2, "0")),
    fc.array(letter, { minLength: 0, maxLength: 3 }).map(join),
    fc.integer({ min: 1, max: 9999 }).map((n) => String(n).padStart(4, "0")),
  )
  .map(join);
