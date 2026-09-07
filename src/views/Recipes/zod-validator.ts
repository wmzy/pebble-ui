import type { ZodType } from 'zod';

import type { FieldError } from 'react-f0rm';

import type { FieldValidator } from '@/lib';

/**
 * Race `run()` against `signal`: resolve the result when the parse wins,
 * `undefined` the moment the signal aborts. `Promise.race` keeps handlers
 * attached to every input, so a cancelled parse that later fails never
 * surfaces as an unhandled rejection.
 */
function raceAbort<T>(
  run: () => Promise<T>,
  signal: AbortSignal
): Promise<T | undefined> {
  // The round is already superseded — skip the work entirely.
  if (signal.aborted) return Promise.resolve(undefined);
  return Promise.race([
    run(),
    new Promise<undefined>((resolve) => {
      signal.addEventListener('abort', () => resolve(undefined), { once: true });
    }),
  ]);
}

/**
 * Adapt a zod schema to react-f0rm's `FieldValidator` — the `validate`
 * prop haze-ui's `FormItem` accepts. Runs `schema.safeParseAsync` and maps
 * every issue to a `FieldError` (`issue.code` becomes `type`, `message`
 * passes through); a passing parse resolves `undefined` (no error).
 *
 * zod v4's parse params (`ParseContext`) expose no `AbortSignal` slot, so
 * cancellation happens in `raceAbort`: when `meta.signal` aborts — the
 * round was superseded by a newer edit — the validator resolves
 * `undefined` instead of a result. react-f0rm discards superseded rounds
 * on its side too, so `undefined` is the safe non-answer; rejecting would
 * surface as an unhandled rejection in f0rm's pipeline.
 */
export function zodValidator(schema: ZodType): FieldValidator {
  return async (value, { signal }) => {
    const result = await raceAbort(() => schema.safeParseAsync(value), signal);
    if (result === undefined || result.success) return undefined;
    const errors: FieldError[] = result.error.issues.map((issue) => ({
      type: issue.code,
      message: issue.message,
    }));
    return errors;
  };
}
