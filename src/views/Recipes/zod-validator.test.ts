import type { FieldError } from 'react-f0rm';

import type { FieldValidator } from '@/lib';

import { z } from 'zod';


import { zodValidator } from './zod-validator';

/** Minimal validation `meta` — the adapter only consumes `signal`. */
const meta = (signal?: AbortSignal) => ({
  form: undefined as never,
  signal: signal ?? new AbortController().signal,
});

// Compile-time + runtime: the adapter slots directly into `FormItem`'s
// `validate` prop — both permissively and against a typed field slot.
describe('zodValidator', () => {
  it('slots into a typed FieldValidator position as a callable', () => {
    const typedSlot: FieldValidator<{ username: string }, 'username'> =
      zodValidator(z.string().min(3));
    expect(typeof typedSlot).toBe('function');
  });

  it('resolves undefined for input satisfying the schema', async () => {
    const validate = zodValidator(z.string().min(3));
    await expect(validate('haze', meta())).resolves.toBeUndefined();
  });

  it('maps issues to FieldError entries — code becomes type, message passes through', async () => {
    const validate = zodValidator(
      z
        .string()
        .min(1, 'Username is required')
        .min(3, 'Username must be at least 3 characters')
    );
    await expect(validate('ab', meta())).resolves.toEqual([
      { type: 'too_small', message: 'Username must be at least 3 characters' },
    ]);
    // every failing check reports, in schema order
    await expect(validate('', meta())).resolves.toEqual([
      { type: 'too_small', message: 'Username is required' },
      {
        type: 'too_small',
        message: 'Username must be at least 3 characters',
      },
    ]);
  });

  it('maps format issues and custom messages', async () => {
    const validate = zodValidator(z.email('Enter a valid email address'));
    await expect(validate('nope', meta())).resolves.toEqual([
      { type: 'invalid_format', message: 'Enter a valid email address' },
    ]);
  });

  it('keeps zod’s built-in message when none is customized', async () => {
    const validate = zodValidator(z.string().min(3));
    const errors = (await validate('ab', meta())) as FieldError[] | undefined;
    expect(errors).toHaveLength(1);
    expect(errors?.[0]?.type).toBe('too_small');
    expect(typeof errors?.[0]?.message).toBe('string');
  });

  it('awaits async refinements', async () => {
    const validate = zodValidator(
      z.string().refine(async (value) => {
        await Promise.resolve();
        return value !== 'bad';
      }, 'Value is bad')
    );
    await expect(validate('good', meta())).resolves.toBeUndefined();
    await expect(validate('bad', meta())).resolves.toEqual([
      { type: 'custom', message: 'Value is bad' },
    ]);
  });

  it('reuses one adapter and schema across calls and fields', async () => {
    const validate = zodValidator(z.string().min(3, 'Too short'));
    await expect(validate('abc', meta())).resolves.toBeUndefined();
    await expect(validate('abcd', meta())).resolves.toBeUndefined();
    await expect(validate('ab', meta())).resolves.toEqual([
      { type: 'too_small', message: 'Too short' },
    ]);
  });

  it('skips parsing entirely when the round is already aborted', async () => {
    let refinements = 0;
    const validate = zodValidator(
      z.string().refine(() => {
        refinements += 1;
        return true;
      })
    );
    const controller = new AbortController();
    controller.abort();
    await expect(
      validate('x', meta(controller.signal))
    ).resolves.toBeUndefined();
    expect(refinements).toBe(0);
  });

  it('resolves undefined when aborted mid-parse', async () => {
    let release: ((ok: boolean) => void) | undefined;
    const validate = zodValidator(
      z.string().refine(
        () =>
          new Promise<boolean>((resolve) => {
            release = resolve;
          })
      )
    );
    const controller = new AbortController();
    const pending = validate('x', meta(controller.signal));
    controller.abort();
    await expect(pending).resolves.toBeUndefined();
    release?.(true);
  });

  it('does not leak an unhandled rejection when a cancelled parse fails', async () => {
    let failParse: ((error: Error) => void) | undefined;
    const validate = zodValidator(
      z.string().refine(
        () =>
          new Promise<boolean>((_resolve, reject) => {
            failParse = reject;
          })
      )
    );
    const controller = new AbortController();
    const pending = validate('x', meta(controller.signal));
    controller.abort();
    await expect(pending).resolves.toBeUndefined();
    failParse?.(new Error('network died'));
    // let the microtask queue settle — an unhandled rejection fails the file
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
