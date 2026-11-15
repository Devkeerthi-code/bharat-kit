/** A successful check: `value` is the normalised input or the parsed parts. */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/**
 * A failed check. `reason` is a stable code you can switch on;
 * `message` is a plain-English explanation you can show to a user.
 * `index` is the zero-based position of the offending character, when there is one.
 */
export interface Err<R extends string> {
  readonly ok: false;
  readonly reason: R;
  readonly message: string;
  readonly index?: number;
}

export type Result<T, R extends string> = Ok<T> | Err<R>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<R extends string>(reason: R, message: string, index?: number): Err<R> {
  return index === undefined ? { ok: false, reason, message } : { ok: false, reason, message, index };
}

/** Removes spaces, hyphens and dots that people type between groups, and upper-cases. */
export function compact(input: string): string {
  return input.replace(/[\s.-]+/g, "").toUpperCase();
}
