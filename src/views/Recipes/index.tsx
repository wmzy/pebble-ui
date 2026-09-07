import type { FieldValidator } from '@/lib';

import { useState } from 'react';
import { css } from '@linaria/core';
import { z } from 'zod';
import { Form, reset, useForm } from 'react-f0rm';


import { Button, CodeBlock, FormItem, InputCore } from '@/lib';
import {
  fieldRow,
  intro,
  page,
  row,
  section,
} from '@/views/ComponentDetail/styles';

import { zodValidator } from './zod-validator';

// 展示的是真实适配器源码（?raw 导入），文档与实现永不漂移——同
// ComponentDetail/DemoSource 的源码映射机制。
const rawSources = import.meta.glob<string>('./zod-validator.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const adapterSource = rawSources['./zod-validator.ts'] ?? '';

const paragraph = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
  margin: 0 0 var(--haze-space-4);
`;

const inlineCode = css`
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-sm);
  padding: 0.15em 0.4em;
  font-family: var(--haze-font-mono);
  font-size: 0.9em;
`;

const hint = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
`;

const demoPanel = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-4) var(--haze-space-4) var(--haze-space-2);
  margin: var(--haze-space-4) 0 var(--haze-space-6);
  max-width: 420px;
`;

const codeMargin = css`
  margin: var(--haze-space-2) 0 var(--haze-space-4);
`;

type SignupValues = {
  username: string;
  password: string;
  email: string;
};

const INITIAL_VALUES: SignupValues = {
  username: '',
  password: '',
  email: '',
};

const TAKEN_USERNAMES = new Set(['admin', 'haze', 'root']);

const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .min(3, 'Username must be at least 3 characters');

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

const emailSchema = z.email('Enter a valid email address');

// Schemas are stateless values — one adapter instance can back any number
// of fields and calls.
const validateUsernameShape = zodValidator(usernameSchema);
const validatePassword: FieldValidator<SignupValues, 'password'> =
  zodValidator(passwordSchema);
const validateEmail: FieldValidator<SignupValues, 'email'> =
  zodValidator(emailSchema);

/**
 * Simulated availability round-trip: resolves an error message when the
 * username is taken, `undefined` when free — and settles `undefined` the
 * moment `signal` aborts, clearing the pending timeout so a superseded
 * check never answers.
 */
function checkAvailability(
  username: string,
  signal: AbortSignal,
  onCancelled: () => void
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(
        TAKEN_USERNAMES.has(username.toLowerCase())
          ? `"${username}" is already taken`
          : undefined
      );
    }, 600);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        onCancelled();
        resolve(undefined);
      },
      { once: true }
    );
  });
}

/** Live demo: zod shape rules + async availability with visible cancels. */
function ZodSignupDemo() {
  const form = useForm<SignupValues>({ initialValues: INITIAL_VALUES });
  const [submitted, setSubmitted] = useState<SignupValues | null>(null);
  const [checks, setChecks] = useState({ issued: 0, cancelled: 0 });

  // Shape first (zod via the adapter), availability second — plain
  // validators compose with `await`. meta.signal cancels the check when
  // the round is superseded; the counters make that visible.
  const validateUsername: FieldValidator<SignupValues, 'username'> = async (
    value,
    meta
  ) => {
    const shapeError = await validateUsernameShape(value, meta);
    if (shapeError) return shapeError;
    setChecks((prev) => ({ ...prev, issued: prev.issued + 1 }));
    return checkAvailability(value, meta.signal, () =>
      setChecks((prev) => ({ ...prev, cancelled: prev.cancelled + 1 }))
    );
  };

  return (
    <div>
      <Form
        form={form}
        onValidSubmit={(values: SignupValues) => setSubmitted(values)}
        onInvalidSubmit={() => setSubmitted(null)}
      >
        <div className={fieldRow}>
          <FormItem
            form={form}
            name='username'
            label='Username'
            validate={validateUsername}
            mode='onChange'
            validateDebounce={400}
            input={InputCore}
            placeholder='ada — try "admin", it is taken'
          />
        </div>
        <div className={fieldRow}>
          <FormItem
            form={form}
            name='password'
            label='Password'
            validate={validatePassword}
            mode='onBlur'
            input={InputCore}
            type='password'
            placeholder='At least 8 characters'
          />
        </div>
        <div className={fieldRow}>
          <FormItem
            form={form}
            name='email'
            label='Email'
            validate={validateEmail}
            mode='onBlur'
          >
            {({ id, errorId, invalid, onBlur, value, onChange }) => (
              <InputCore
                id={id}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder='ada@example.com'
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
              />
            )}
          </FormItem>
        </div>
        <div className={row}>
          {/* haze-ui Button renders type="button" — drive the form's
              submit flow explicitly, as the Form docs do. */}
          <Button
            onClick={(e) => {
              e.currentTarget.form?.requestSubmit();
            }}
          >
            Create account
          </Button>
          <Button
            variant='ghost'
            onClick={() => {
              reset(form, INITIAL_VALUES);
              setSubmitted(null);
            }}
          >
            Reset
          </Button>
        </div>
      </Form>
      <p className={hint}>
        availability checks: {checks.issued} issued · {checks.cancelled}{' '}
        cancelled — keep typing in Username and watch stale rounds drop.
      </p>
      {submitted ? (
        <CodeBlock language='json'>{JSON.stringify(submitted, null, 2)}</CodeBlock>
      ) : null}
    </div>
  );
}

export default function Recipes() {
  return (
    <div className={page}>
      <h1>Recipes</h1>
      <p className={intro}>
        Integration recipes for pairing haze-ui with the ecosystem. Each
        recipe is a live demo plus the exact code behind it — start typing in
        the form below and watch schema errors, async checks and cancellation
        all fire in real time.
      </p>

      <div className={section}>
        <h2>zod × react-f0rm — schema-driven form validation</h2>
        <p className={paragraph}>
          haze-ui&apos;s <code className={inlineCode}>FormItem</code> takes any{' '}
          <code className={inlineCode}>FieldValidator</code>:{' '}
          <code className={inlineCode}>(value, meta) =&gt; error | undefined</code>
          , sync or async, where <code className={inlineCode}>meta.signal</code>{' '}
          aborts as soon as the validation round is superseded. That shape is
          all an adapter needs: map <code className={inlineCode}>zod</code>&apos;s{' '}
          <code className={inlineCode}>safeParseAsync</code> result onto it and
          every schema you already have becomes form validation.
        </p>

        <h3>Live demo</h3>
        <div className={demoPanel}>
          <ZodSignupDemo />
        </div>

        <h3>The adapter</h3>
        <p className={paragraph}>
          The whole integration is one function — shown here as the real
          source that powers the demo above:
        </p>
        <CodeBlock language='ts' className={codeMargin}>
          {adapterSource}
        </CodeBlock>
        <p className={paragraph}>
          Three details carry the contract:
        </p>
        <ol className={paragraph}>
          <li>
            <code className={inlineCode}>safeParseAsync</code> never throws on
            validation failures — <code className={inlineCode}>success: false</code>{' '}
            carries <code className={inlineCode}>error.issues</code>, each
            mapped to a{' '}
            <code className={inlineCode}>FieldError</code> with{' '}
            <code className={inlineCode}>type: issue.code</code> and the
            message passed through (custom messages from{' '}
            <code className={inlineCode}>.min(3, &apos;…&apos;)</code> or zod&apos;s
            built-ins). FormItem displays the first error of the field.
          </li>
          <li>
            zod v4&apos;s parse params (
            <code className={inlineCode}>ParseContext</code>) have no{' '}
            <code className={inlineCode}>AbortSignal</code> slot, so
            cancellation races the parse: on abort the validator resolves{' '}
            <code className={inlineCode}>undefined</code> — the safe
            non-answer, because react-f0rm discards superseded rounds on its
            own side too. A cancelled parse that later fails is still handled
            and never surfaces as an unhandled rejection.
          </li>
          <li>
            A passing parse resolves <code className={inlineCode}>undefined</code>{' '}
            — the no-error value f0rm expects.
          </li>
        </ol>

        <h3>Wiring it into FormItem</h3>
        <p className={paragraph}>
          Schemas are stateless values, so build the adapters once at module
          scope and reuse them across fields. The{' '}
          <code className={inlineCode}>input</code> channel binds a core
          component declaratively — FormItem wires id, aria attributes,{' '}
          <code className={inlineCode}>onBlur</code>,{' '}
          <code className={inlineCode}>onChange</code> and{' '}
          <code className={inlineCode}>value</code> itself:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`const usernameSchema = z.string()
  .min(1, 'Username is required')
  .min(3, 'Username must be at least 3 characters');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const emailSchema = z.email('Enter a valid email address');

// one adapter per schema, reused by any number of fields
const validatePassword = zodValidator(passwordSchema);

<FormItem
  form={form}
  name='password'
  label='Password'
  validate={validatePassword}
  mode='onBlur'
  input={InputCore}        // FormItem wires id/aria/onBlur/onChange/value
  type='password'
  placeholder='At least 8 characters'
/>`}
        </CodeBlock>

        <h3>Async checks + AbortSignal cancellation</h3>
        <p className={paragraph}>
          react-f0rm aborts the previous round&apos;s signal the moment a newer
          validation kick runs — each debounced round owns its own{' '}
          <code className={inlineCode}>AbortController</code>. Plain
          validators compose with <code className={inlineCode}>await</code>:
          run the zod shape first, then the network check, reading{' '}
          <code className={inlineCode}>meta.signal</code> to cancel real work
          (here a <code className={inlineCode}>setTimeout</code> standing in
          for a fetch — wire it to{' '}
          <code className={inlineCode}>fetch(url, {'{ signal }'})</code> the
          same way):
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`const validateUsername: FieldValidator<SignupValues, 'username'> = async (
  value,
  meta
) => {
  const shapeError = await validateUsernameShape(value, meta);
  if (shapeError) return shapeError;          // shape errors never hit the network

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(
        TAKEN_USERNAMES.has(value.toLowerCase())
          ? \`"\${value}" is already taken\`
          : undefined
      );
    }, 600);
    meta.signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);                  // the round is dead — stop its work
        resolve(undefined);                   // and never answer it
      },
      { once: true }
    );
  });
};

<FormItem
  form={form}
  name='username'
  label='Username'
  validate={validateUsername}
  mode='onChange'
  validateDebounce={400}   // debounce < check duration → typing cancels stale checks
  input={InputCore}
/>`}
        </CodeBlock>
        <p className={paragraph}>
          Keep typing in the demo&apos;s Username field: each debounced round
          issues a check, and the next keystroke aborts the previous one —
          the issued/cancelled counters below the form count exactly that.
          Because superseded validators resolve{' '}
          <code className={inlineCode}>undefined</code> instead of rejecting,
          cancelled checks stay invisible to both the form state and the
          console.
        </p>
      </div>
    </div>
  );
}
