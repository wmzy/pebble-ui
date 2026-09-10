import type { FieldValidator, HazeStrings } from '@/lib';

import { useState } from 'react';
import { css } from '@linaria/core';
import { z } from 'zod';
import { Form, reset, useForm } from 'react-f0rm';
import { useControl } from 'react-use-control';


import {
  Button,
  ChatContainer,
  ChatInput,
  CodeBlock,
  Empty,
  FormItem,
  InputCore,
  LocaleProvider,
  Segmented,
  TagInput,
  localeDirection,
  useDirection,zodResolver
} from '@/lib';
import {
  fieldRow,
  intro,
  page,
  row,
  section,
} from '@/views/ComponentDetail/styles';

import { useHazeChat } from './ai-chat-adapter';
import { useMockChat } from './mock-use-chat';
import { arPack, frPack } from './locale-packs';

// 展示的是真实适配器源码（?raw 导入），文档与实现永不漂移——同
// ComponentDetail/DemoSource 的源码映射机制。
const rawSources = import.meta.glob<string>(
  './{locale-packs,ai-chat-adapter,mock-use-chat}.{ts,tsx}',
  {
    query: '?raw',
    import: 'default',
    eager: true,
  }
);
const packsSource = rawSources['./locale-packs.ts'] ?? '';
const aiAdapterSource = rawSources['./ai-chat-adapter.tsx'] ?? '';
const aiMockSource = rawSources['./mock-use-chat.ts'] ?? '';

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

const demoColumn = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-4);
  margin-top: var(--haze-space-4);
  max-width: 360px;
`;

const aiChatFrame = css`
  display: flex;
  flex-direction: column;
  height: 520px;
  max-width: 640px;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  overflow: hidden;
  background: var(--haze-color-bg);
  margin: var(--haze-space-4) 0 var(--haze-space-6);
`;

const aiChatScroll = css`
  flex: 1;
  padding-inline: var(--haze-space-4);
`;

const aiChatComposer = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-2) var(--haze-space-3);
  border-top: 1px solid var(--haze-color-border);
  background: var(--haze-color-bg);
`;

const aiChatInput = css`
  flex: 1;
`;

const aiChatHint = css`
  margin: 0;
  padding: var(--haze-space-2) var(--haze-space-3);
  border-top: 1px solid var(--haze-color-border);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-danger);
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
// of fields and calls. `zodResolver` ships with haze-ui itself.
const validateUsernameShape = zodResolver(usernameSchema);
const validatePassword: FieldValidator<SignupValues, 'password'> =
  zodResolver(passwordSchema);
const validateEmail: FieldValidator<SignupValues, 'email'> =
  zodResolver(emailSchema);

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

// ─── Adding a locale ────────────────────────────────────────────────────

const LANGUAGES = [
  { value: 'en-US', label: 'English' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'zh-CN', label: '中文' },
  { value: 'ar-EG', label: 'العربية' },
] as const;

type DemoLanguage = (typeof LANGUAGES)[number]['value'];

const DEMO_PACKS: Partial<Record<DemoLanguage, HazeStrings>> = {
  'fr-FR': frPack,
  'ar-EG': arPack,
};

/** Mirrors the provider chain's declared direction so the demo shows it live. */
function DirectionProbe() {
  return <output className={hint}>useDirection(): {useDirection()}</output>;
}

/**
 * Live demo: switch the resolved language and watch the pack, the
 * `{count}` placeholder expansion, and the derived direction change —
 * including rtl for the Arabic tag. The `dir` attribute on the column
 * is set by this app, never by the provider.
 */
function LocalePackDemo() {
  const [language, , languageCtrl] = useControl<DemoLanguage>(
    undefined,
    'en-US'
  );
  const [, , tagsCtrl] = useControl(undefined, ['ui']);

  return (
    <div>
      <Segmented options={[...LANGUAGES]} value={languageCtrl} />
      <LocaleProvider locale={language} strings={DEMO_PACKS[language]}>
        <div dir={localeDirection(language) ?? 'ltr'} className={demoColumn}>
          <TagInput value={tagsCtrl} aria-label='Tags' />
          <Empty />
          <DirectionProbe />
        </div>
      </LocaleProvider>
    </div>
  );
}

/**
 * Live demo: a mock, network-free `useChat` (same shape, timers instead
 * of a transport) drives the exact adapter a real `@ai-sdk/react`
 * `useChat` would — the code below the demo is the code running it.
 */
function AIRuntimeDemo() {
  const chat = useMockChat();
  const { messages, busy, error, send, stop } = useHazeChat(chat);

  return (
    <div className={aiChatFrame}>
      <ChatContainer className={aiChatScroll}>{messages}</ChatContainer>
      <div className={aiChatComposer}>
        <ChatInput
          className={aiChatInput}
          placeholder='Ask about haze-ui — try “css”, or “error” to fail'
          generating={busy}
          onSend={send}
          onStop={stop}
        />
      </div>
      {error ? (
        <p className={aiChatHint}>status: error — send another message to retry</p>
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
        all fire in real time, switch languages in the locale recipe to see
        packs, partial overrides and RTL derivation at work, or chat with the
        AI runtime recipe: a Vercel AI SDK useChat shape driving the agent
        components through one small adapter.
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

        <h3>The adapter ships with haze-ui</h3>
        <p className={paragraph}>
          This used to be a hand-written bridge; the resolver now lives in
          the library itself — import it from{' '}
          <code className={inlineCode}>haze-ui</code> and every schema you
          already have becomes form validation:
        </p>
        <CodeBlock language='ts' className={codeMargin}>
          {`import { zodResolver } from 'haze-ui';

const usernameSchema = z.string()
  .min(1, 'Username is required')
  .min(3, 'Username must be at least 3 characters');

const validateUsername = zodResolver(usernameSchema);`}
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
            When a validation round is superseded,{' '}
            <code className={inlineCode}>meta.signal</code> aborts and the
            resolver resolves <code className={inlineCode}>undefined</code> —
            the safe non-answer, because react-f0rm discards superseded
            rounds on its own side too.
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
const validatePassword = zodResolver(passwordSchema);

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

      <div className={section}>
        <h2>Adding a locale — custom copy &amp; RTL</h2>
        <p className={paragraph}>
          Every user-visible literal in haze-ui flows through{' '}
          <code className={inlineCode}>useStrings</code>, so copy lives in
          one place per language:{' '}
          <code className={inlineCode}>HazeStrings</code>, a section-per-component
          map derived from the English{' '}
          <code className={inlineCode}>defaultStrings</code>. You can reword
          individual messages, mount whole packs, and contribute new
          languages back — the demo below switches between all three modes,
          including an RTL tag.
        </p>

        <h3>Live demo</h3>
        <div className={demoPanel}>
          <LocalePackDemo />
        </div>
        <p className={hint}>
          Switch to العربية: the tag <code className={inlineCode}>ar-EG</code>{' '}
          derives direction <code className={inlineCode}>rtl</code> (shown by
          the probe), and the Arabic copy renders mirrored because the demo —
          not the library — set <code className={inlineCode}>dir</code> on the
          column. Remove a tag in any language and watch the{' '}
          <code className={inlineCode}>{'{count}'}</code> placeholder expand.
        </p>

        <h3>The packs</h3>
        <p className={paragraph}>
          The demo is powered by the real module below:{' '}
          <code className={inlineCode}>createStrings</code> merges a partial
          override onto a base pack and returns a complete{' '}
          <code className={inlineCode}>HazeStrings</code>, so a derived pack
          never forks the literals it does not touch. A full pack also
          satisfies the provider&apos;s partial{' '}
          <code className={inlineCode}>strings</code> shape:
        </p>
        <CodeBlock language='ts' className={codeMargin}>
          {packsSource}
        </CodeBlock>

        <h3>Partial overrides without a pack</h3>
        <p className={paragraph}>
          For one-off rewording you do not need{' '}
          <code className={inlineCode}>createStrings</code> at all — the{' '}
          <code className={inlineCode}>strings</code> prop is already a deep
          partial (<code className={inlineCode}>HazeStringsOverrides</code>).
          Use <code className={inlineCode}>createStrings</code> when you need
          the resolved pack as a <em>value</em>: deriving{' '}
          <code className={inlineCode}>zhCN</code> with your terminology,
          sharing one customized pack across providers, or handing it to
          non-React code:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`// one message, everything else keeps the pack copy
<LocaleProvider strings={{ pagination: { previous: '‹ Précédent' } }}>
  <Pagination total={40} />
</LocaleProvider>

// or derive a complete pack once at module scope and reuse it
const branded = createStrings(zhCN, {
  confirmDialog: { confirm: '好的', cancel: '先不了' },
});

<LocaleProvider locale="zh-CN" strings={branded}>…</LocaleProvider>`}
        </CodeBlock>

        <h3>Authoring a complete language pack</h3>
        <p className={paragraph}>
          A full pack is a plain <code className={inlineCode}>const</code>{' '}
          annotated <code className={inlineCode}>HazeStrings</code> — the
          annotation is the contract: TypeScript fails the build the moment
          either side drifts (a missing key, an extra key, a renamed
          section). Start by copying{' '}
          <code className={inlineCode}>defaultStrings</code> from{' '}
          <code className={inlineCode}>src/lib/components/LocaleProvider/locale.ts</code>{' '}
          as the translation baseline, and keep{' '}
          <code className={inlineCode}>{'{name}'}</code> placeholders verbatim
          — they are expanded at runtime and unknown placeholders are left
          as-is, never blanked. This is exactly how the bundled{' '}
          <code className={inlineCode}>zhCN</code> pack is written:
        </p>
        <CodeBlock language='ts' className={codeMargin}>
          {`import type { HazeStrings } from 'haze-ui';

const frFR: HazeStrings = {
  alert: { close: 'Fermer' },
  approvalCard: { title: 'Approbation requise', approve: 'Approuver', deny: 'Refuser' },
  asyncSection: { loading: 'Chargement…', error: 'Une erreur est survenue', retry: 'Réessayer' },
  avatarGroup: { more: '+{count}' },          // placeholders survive translation verbatim
  // …every section of defaultStrings, 1:1 — the type enforces it
};

<LocaleProvider locale="fr-FR" strings={frFR}>…</LocaleProvider>`}
        </CodeBlock>

        <h3>RTL: declared direction vs derived direction</h3>
        <p className={paragraph}>
          <code className={inlineCode}>LocaleProvider</code> accepts an
          explicit <code className={inlineCode}>direction</code> prop, and
          when nobody declares one it derives the direction from the locale:
          the primary subtag is matched against the RTL language list —{' '}
          <code className={inlineCode}>
            ar, he, fa, ur, ps, sd, ug, yi, dv, ckb, ku, iw
          </code>{' '}
          (the last is the legacy Hebrew tag; Latin-script Kurdish stays ltr —
          declare a direction explicitly then). The provider never writes a{' '}
          <code className={inlineCode}>dir</code> attribute: setting the
          document&apos;s direction is the app&apos;s job. The library only
          consumes the value through two exported helpers:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`import { LocaleProvider, useDirection, localeDirection } from 'haze-ui';

// declared intent for render-time decisions (falls back to the document)
useDirection(); // 'rtl' under <LocaleProvider locale="ar-EG">

// pure helper: the direction a BCP 47 tag implies
localeDirection('ar-EG'); // 'rtl'
localeDirection('he-IL'); // 'rtl'
localeDirection('fr-FR'); // 'ltr'

// explicit beats derivation, and survives nested locale-only providers
<LocaleProvider locale="ar-EG" direction="ltr">…</LocaleProvider>`}
        </CodeBlock>
        <p className={paragraph}>
          For interaction-time code (arrow-key mirroring, JS-assisted
          placement) the library reads layout truth from the DOM via{' '}
          <code className={inlineCode}>getDirection(element)</code> — the
          nearest <code className={inlineCode}>[dir]</code> ancestor — so
          mirrored behavior follows what the user actually sees, whatever the
          provider declared.
        </p>

        <h3>Contributing a pack upstream</h3>
        <p className={paragraph}>
          New languages are merged the same way{' '}
          <code className={inlineCode}>zhCN</code> was: copy{' '}
          <code className={inlineCode}>defaultStrings</code> as the baseline,
          translate it (keys 1:1, placeholders verbatim), and open a PR adding{' '}
          <code className={inlineCode}>src/lib/components/LocaleProvider/&lt;tag&gt;.ts</code>{' '}
          following the <code className={inlineCode}>zh-cn.ts</code> file
          layout. The maintainer-side step is registering the tag mapping in{' '}
          <code className={inlineCode}>useStrings&apos;</code> pack
          resolution, after which{' '}
          <code className={inlineCode}>locale=&quot;fr-FR&quot;</code> selects
          the pack automatically for every consumer — no{' '}
          <code className={inlineCode}>strings</code> prop needed.
        </p>
      </div>

      <div className={section}>
        <h2>AI runtime integration — Vercel AI SDK useChat × agent components</h2>
        <p className={paragraph}>
          haze-ui&apos;s agent surface is deliberately presentational:{' '}
          <code className={inlineCode}>ChatContainer</code> owns scrolling,{' '}
          <code className={inlineCode}>ChatMessage</code> the bubbles,{' '}
          <code className={inlineCode}>StreamingText</code> the typewriter
          reveal, <code className={inlineCode}>ToolCallCard</code> tool
          input/output, <code className={inlineCode}>ThinkingIndicator</code>{' '}
          the waiting dots, <code className={inlineCode}>ChatInput</code> the
          composer. The Vercel AI SDK&apos;s{' '}
          <code className={inlineCode}>useChat</code> is the stateful half:
          it owns <code className={inlineCode}>messages</code> (a{' '}
          <code className={inlineCode}>UIMessage[]</code> of typed{' '}
          <code className={inlineCode}>parts</code>),{' '}
          <code className={inlineCode}>status</code> (
          <code className={inlineCode}>submitted | streaming | ready | error</code>)
          and the <code className={inlineCode}>sendMessage</code>/
          <code className={inlineCode}>stop</code> pair. One small adapter
          bridges them — pure functions over duck-typed shapes, so the{' '}
          <code className={inlineCode}>ai</code> package never enters your
          dependency tree through haze-ui.
        </p>

        <h3>Live demo</h3>
        <p className={paragraph}>
          The chat below runs the exact adapter shown further down, fed by a
          mock <code className={inlineCode}>useChat</code> — same return
          shape, timers instead of a transport. Ask about CSS to see
          reasoning → tool call → streamed answer → source link; ask for an
          error to see the failure path; hit Stop mid-run to see the
          finalize-on-abort behavior.
        </p>
        <AIRuntimeDemo />

        <h3>The adapter</h3>
        <p className={paragraph}>
          The whole integration is two exports —{' '}
          <code className={inlineCode}>renderUIMessages</code> (a pure{' '}
          <code className={inlineCode}>parts → ReactNode[]</code> mapping,
          never throws on odd payloads) and{' '}
          <code className={inlineCode}>useHazeChat</code> (the thin hook that
          memoizes it and wires the composer). This is the real source
          powering the demo — swap <code className={inlineCode}>@/lib</code>{' '}
          for <code className={inlineCode}>haze-ui</code> in your app:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {aiAdapterSource}
        </CodeBlock>

        <h3>With a real useChat</h3>
        <p className={paragraph}>
          Drop the adapter next to your chat route and the wiring is four
          lines. Both SDK generations work: the hook prefers v5&apos;s{' '}
          <code className={inlineCode}>sendMessage({'{ text }'})</code> and
          falls back to v4&apos;s{' '}
          <code className={inlineCode}>append({'{ role, content }'})</code>:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ChatContainer, ChatInput } from 'haze-ui';

import { useHazeChat } from './ai-chat-adapter';

function SupportChat() {
  const chat = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const { messages, busy, send, stop } = useHazeChat(chat);

  return (
    <div>
      <ChatContainer>{messages}</ChatContainer>
      <ChatInput generating={busy} onSend={send} onStop={stop} />
    </div>
  );
}`}
        </CodeBlock>

        <h3>Mapping rules</h3>
        <p className={paragraph}>
          The status → presentation contract the adapter implements:
        </p>
        <CodeBlock language='text' className={codeMargin}>
          {`UIMessage                    → ChatMessage bubble (role; user msg 'sending' while submitted)
  text part, done             → plain text block
  text part, streaming        → StreamingText typewriter + cursor
  reasoning part, streaming   → ThinkingIndicator dots
  reasoning part, done        → Disclosure transcript ("Thought process")
  tool-* part (v5 states)     → ToolCallCard: output-error→error, output-available→done,
                               input-*→running, no states→pending
  tool-call + tool-result (v4)→ one ToolCallCard, result folded in by toolCallId
  source part                 → external link
  empty assistant message     → ThinkingIndicator inside the bubble
status submitted             → waiting dots appended after the messages
status error                 → system ChatMessage with the transport error`}
        </CodeBlock>

        <h3>The mock (what the demo runs)</h3>
        <p className={paragraph}>
          The demo&apos;s streaming source — same shape a real{' '}
          <code className={inlineCode}>useChat</code> returns, scripted with{' '}
          <code className={inlineCode}>setTimeout</code>. Useful as a fixture
          for your own tests, too:
        </p>
        <CodeBlock language='ts' className={codeMargin}>
          {aiMockSource}
        </CodeBlock>

        <h3>Known limits</h3>
        <ul className={paragraph}>
          <li>
            <strong>Streaming text cadence.</strong>{' '}
            <code className={inlineCode}>StreamingText</code> reveals its
            whole <code className={inlineCode}>text</code> once and restarts
            the reveal whenever the prop <em>grows</em> — it fits parts that
            arrive whole (batched transports, the demo&apos;s mock) but not
            char-by-char deltas. If your transport grows text parts
            incrementally, render the plain block while{' '}
            <code className={inlineCode}>state === &apos;streaming&apos;</code>{' '}
            instead (one-line change in{' '}
            <code className={inlineCode}>renderPart</code>).
          </li>
          <li>
            <strong>Attachments, files, data parts.</strong>{' '}
            <code className={inlineCode}>file</code>/{' '}
            <code className={inlineCode}>data-*</code> parts are skipped;
            <code className={inlineCode}>ChatInput</code> is text-only in
            this version. Extend <code className={inlineCode}>renderPart</code>{' '}
            with your own branch when you need them.
          </li>
          <li>
            <strong>Branching, regeneration, voice.</strong>{' '}
            <code className={inlineCode}>branchNumber</code>,{' '}
            <code className={inlineCode}>regenerate</code>, and speech parts
            are out of scope here; the adapter renders whichever branch the
            SDK exposes in <code className={inlineCode}>messages</code>.
          </li>
          <li>
            <strong>v4 string content.</strong> Messages that predate the
            parts API (<code className={inlineCode}>content: string</code>)
            render as empty bubbles — convert to parts, or map{' '}
            <code className={inlineCode}>content</code> to a synthetic text
            part first.
          </li>
        </ul>
      </div>
    </div>
  );
}
