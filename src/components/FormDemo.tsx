import type {FormInstance} from '@/lib';

import {useState} from 'react';
import {css} from '@linaria/core';
import {Form, getValues, reset, setValue, useForm, useValue} from 'react-f0rm';
import {z} from 'zod';

import {
  Alert,
  Button,
  CodeBlock,
  FormItem,
  InputCore,
  NumberInputCore,
  Option,
  SelectCore,
  SwitchCore,
} from '@/lib';
import {
  FormList,
  standardSchemaFormValidator,
  zodResolver,
} from '@/lib/form';
import A11yNote from '@/views/ComponentDetail/A11yNote';
import PropsTable from '@/views/ComponentDetail/PropsTable';
import {
  fieldRow,
  intro,
  page,
  row,
  section,
} from '@/views/ComponentDetail/styles';

type ProfileValues = {
  name: string;
  email: string;
  role: string;
  newsletter: boolean;
  seats: number;
  tags: {label: string}[];
};

const INITIAL_VALUES: ProfileValues = {
  name: '',
  email: '',
  role: 'viewer',
  newsletter: true,
  seats: 5,
  tags: [{label: 'design'}, {label: 'frontend'}],
};

const RANDOM_NAMES = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Barbara Liskov',
];

const RANDOM_ROLES = ['admin', 'maintainer', 'viewer'];

function pick(list: readonly string[]): string {
  return list[Math.floor(Math.random() * list.length)]!;
}

function emailOf(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`;
}

const validateName = (value: string) =>
  value.trim() ? undefined : 'Name is required';

const validateEmail = (value: string) => {
  if (!value.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Enter a valid email address';
  }
  return undefined;
};

const validateSeats = (value: number) =>
  Number.isFinite(value) && value >= 1 && value <= 100
    ? undefined
    : 'Seats must be between 1 and 100';

const hint = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
  margin: 0;
`;

const tagRow = css`
  display: flex;
  align-items: flex-end;
  gap: var(--haze-space-2);
`;

/** Schema-driven signup demo: one zod schema backs the whole form —
 * `standardSchemaFormValidator` for the form level, `zodResolver` for a
 * single field (both re-exported from `@/lib/form`). */
type SignupValues = {title: string; email: string; code: string};

const signupSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  email: z.email('Enter a valid email address'),
  code: z.string().min(3, 'Code must be at least 3 characters'),
});

const signupValidator = standardSchemaFormValidator<SignupValues>(signupSchema);

/**
 * Field-level subscription demo: reads the live `name`/`seats` values
 * through react-f0rm's own useValue hook — haze no longer ships a form
 * binding hook, react-f0rm's Field/useValue is the single source.
 */
function LiveValues({form}: {form: FormInstance<ProfileValues>}) {
  const name = useValue(form, 'name');
  const seats = useValue(form, 'seats');

  return (
    <span className={hint}>
      Live subscription · name = {JSON.stringify(name)} · seats = {String(
        seats
      )}
    </span>
  );
}

/**
 * Schema-driven form demo: one zod schema drives everything — the form
 * level through `standardSchemaFormValidator` (issues land per field),
 * one field additionally through `zodResolver`. `validateDeps` lists the
 * schema's fields so a user change re-runs the schema and clears the
 * stale errors of the previous round (react-f0rm's cross-field list).
 * Field-level validators short-circuit a submit before the form-level
 * round, so the schema form keeps every field schema-driven.
 */
function SchemaForm() {
  const form = useForm<SignupValues>({
    initialValues: {title: '', email: '', code: ''},
    validate: signupValidator,
    validateDeps: ['title', 'email', 'code'],
  });
  const [submitted, setSubmitted] = useState<SignupValues | null>(null);

  return (
    <>
      <Form
        form={form}
        onValidSubmit={(values) => setSubmitted(values)}
        onInvalidSubmit={() => setSubmitted(null)}
      >
        <div className={fieldRow}>
          {/* 表单级 schema：错误由 standardSchemaFormValidator 按路径落位，
              FormItem 无需自己的 validate */}
          <FormItem
            form={form}
            name='title'
            label='Title'
            input={InputCore}
            placeholder='Schema-validated title'
          />
        </div>
        <div className={fieldRow}>
          <FormItem
            form={form}
            name='email'
            label='Email'
            input={InputCore}
            placeholder='schema@example.com'
          />
        </div>
        <div className={fieldRow}>
          <FormItem
            form={form}
            name='code'
            label='Code'
            input={InputCore}
            placeholder='abc'
          />
        </div>
        <div className={row}>
          <Button
            onClick={(e) => {
              e.currentTarget.form?.requestSubmit();
            }}
          >
            Submit
          </Button>
        </div>
      </Form>
      {submitted ? (
        <>
          <Alert variant='success'>
            Schema passed — parsed values (zod transforms applied) below.
          </Alert>
          <CodeBlock language='json'>
            {JSON.stringify(submitted, null, 2)}
          </CodeBlock>
        </>
      ) : (
        <p className={hint}>
          Submit with empty fields to see the schema errors land per FormItem.
        </p>
      )}
    </>
  );
}

type CodeValues = {code: string};

/** Field-level resolver demo: `zodResolver` slots straight into
 * `FormItem`'s `validate` — no form-level validator involved. */
function ResolverFieldForm() {
  const form = useForm<CodeValues>({initialValues: {code: ''}});
  return (
    <Form form={form} onValidSubmit={() => undefined}>
      <div className={fieldRow}>
        <FormItem
          form={form}
          name='code'
          label='Invite code (zodResolver)'
          validate={zodResolver(z.string().min(3, 'Code must be at least 3 characters'))}
          input={InputCore}
          placeholder='abc'
        />
      </div>
      <div className={row}>
        <Button
          onClick={(e) => {
            e.currentTarget.form?.requestSubmit();
          }}
        >
          Submit
        </Button>
      </div>
    </Form>
  );
}

export default function FormDemo() {
  const form = useForm<ProfileValues>({
    initialValues: INITIAL_VALUES,
  });
  const [submitted, setSubmitted] = useState<ProfileValues | null>(null);

  const randomFill = () => {
    const name = pick(RANDOM_NAMES);
    setValue(form, 'name', name);
    setValue(form, 'email', emailOf(name));
    setValue(form, 'role', pick(RANDOM_ROLES));
    setValue(form, 'seats', 1 + Math.floor(Math.random() * 100));
    setSubmitted(null);
  };

  const resetForm = () => {
    reset(form, INITIAL_VALUES);
    setSubmitted(null);
  };

  return (
    <div className={page}>
      <h1>Form</h1>
      <p className={intro}>
        Bind react-f0rm form state to haze-ui controlled cores through{' '}
        react-f0rm&apos;s own headless <code>useField</code> hook — the same
        binding layer its built-in <code>Field</code>/<code>Checkbox</code>/
        <code>Select</code> use — with haze-ui&apos;s <code>FormItem</code>{' '}
        as the view: <code>FormItem</code> wraps the hook&apos;s state in
        label, error and aria wiring, and any <code>XxxCore</code> receives
        the plain <code>{'{value, onChange}'}</code> pair.
      </p>

      <div className={section}>
        <h2>Controlled form</h2>
        <div className={row}>
          <Button variant='outline' onClick={randomFill}>
            Random fill (setValue)
          </Button>
          <Button variant='ghost' onClick={resetForm}>
            Reset
          </Button>
          <LiveValues form={form} />
        </div>
        <Form
          form={form}
          onValidSubmit={(values: ProfileValues) => setSubmitted(values)}
          onInvalidSubmit={() => setSubmitted(null)}
        >
          <div className={fieldRow}>
            {/* `input` 声明式桥（haze-ui ≥1.13）：组件引用直传，其余
                props 原样透传并按 InputCore 自己的 props 做类型校验，
                id/aria/onBlur/onChange/value 由 FormItem 接线 */}
            <FormItem
              form={form}
              name='name'
              label='Name'
              validate={validateName}
              input={InputCore}
              placeholder='Ada Lovelace'
            />
          </div>
          <div className={fieldRow}>
            <FormItem
              form={form}
              name='email'
              label='Email'
              validate={validateEmail}
            >
              {({id, errorId, invalid, value, onChange}) => (
                <InputCore
                  id={id}
                  value={value}
                  onChange={onChange}
                  placeholder='ada@example.com'
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errorId : undefined}
                />
              )}
            </FormItem>
          </div>
          <div className={fieldRow}>
            {/* JSX children 同样透传——SelectCore 的选项直接写在
                FormItem 里 */}
            <FormItem form={form} name='role' label='Role' input={SelectCore}>
              <Option value='admin'>Admin</Option>
              <Option value='maintainer'>Maintainer</Option>
              <Option value='viewer'>Viewer</Option>
            </FormItem>
          </div>
          <div className={fieldRow}>
            <FormItem form={form} name='seats' label='Seats' validate={validateSeats}>
              {({id, errorId, invalid, value, onChange}) => (
                <NumberInputCore
                  id={id}
                  value={value}
                  onChange={onChange}
                  min={1}
                  max={100}
                  step={1}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errorId : undefined}
                />
              )}
            </FormItem>
          </div>
          <div className={fieldRow}>
            <FormItem form={form} name='newsletter' label='Subscribe to newsletter'>
              {({id, value, onChange}) => (
                <SwitchCore id={id} checked={value} onChange={onChange} />
              )}
            </FormItem>
          </div>
          <div className={fieldRow}>
            {/* 数组字段：FormList 包 react-f0rm 的 useFieldArray，行内
                FormItem 以 ['tags', i, 'label'] 段数组路径绑定；行 key 用
                field.id（稳定），数组操作前 FormList 会物化行内编辑 */}
            <FormList form={form} name='tags'>
              {({fields, append, remove}) => (
                <>
                  {fields.map((field) => (
                    <div key={field.id} className={tagRow}>
                      <FormItem
                        form={form}
                        name={['tags', field.index, 'label']}
                        label={`Tag ${field.index + 1}`}
                        input={InputCore}
                        placeholder='tag'
                      />
                      <Button
                        variant='ghost'
                        onClick={() => remove(field.index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button variant='outline' onClick={() => append({label: ''})}>
                    Add tag
                  </Button>
                </>
              )}
            </FormList>
          </div>
          <div className={row}>
            {/* haze-ui Button renders type="button", so trigger the form
                element's submit flow explicitly. */}
            <Button
              onClick={(e) => {
                e.currentTarget.form?.requestSubmit();
              }}
            >
              Submit
            </Button>
            <Button variant='ghost' onClick={() => setSubmitted(getValues(form))}>
              Read values (getValues)
            </Button>
          </div>
        </Form>
        {submitted ? (
          <>
            <Alert variant='success'>
              Submitted — getValues() returned the values below.
            </Alert>
            <CodeBlock language='json'>
              {JSON.stringify(submitted, null, 2)}
            </CodeBlock>
          </>
        ) : (
          <p className={hint}>
            Fill the form and submit (or press &quot;Read values&quot;) to see
            the current form values.
          </p>
        )}
      </div>

      <div className={section}>
        <h2>Schema validation — zod × react-f0rm resolvers</h2>
        <p className={intro}>
          haze-ui re-exports react-f0rm&apos;s Standard Schema adapters from{' '}
          <code>@/lib/form</code>: <code>standardSchemaFormValidator</code>{' '}
          validates the whole values object (zod v3.24+/v4, valibot, arktype —
          anything implementing <code>~standard</code>), landing each issue on
          its field&apos;s FormItem; <code>zodResolver</code> adapts a single
          schema to FormItem&apos;s <code>validate</code>. Pair the form-level
          validator with <code>validateDeps</code> so edits re-run the schema
          and clear the previous round&apos;s errors.
        </p>
        <SchemaForm />
        <h3>Field-level — zodResolver</h3>
        <p className={intro}>
          A single schema, no form-level validator: submit shows the issue,
          typing a valid value clears it (reValidateMode{' '}
          <code>onChange</code> after a failed submit).
        </p>
        <ResolverFieldForm />
      </div>

      <div className={section}>
        <h2>API</h2>
        <h3>useField (react-f0rm) — the binding layer</h3>
        <PropsTable
          props={[
            {
              name: 'form',
              type: 'Form<TValues>',
              description: 'Form instance from useForm()/createForm()',
            },
            {
              name: 'name',
              type: 'FieldPath<TValues> | (string | number)[]',
              description: 'Field path; value type is inferred from it',
            },
            {
              name: 'returns',
              type: '{value, onChange, onBlur, error, errors, invalid, ...}',
              description:
                'Headless binding — the same channel react-f0rm\'s Field/Checkbox/Select use; pass value/onChange to any haze-ui core',
            },
          ]}
        />
        <h3>FormItem props</h3>
        <PropsTable
          props={[
            { name: 'form', type: 'Form<TValues>', description: 'Form instance' },
            {
              name: 'name',
              type: 'FieldPath<TValues> | (string | number)[]',
              description: 'Field path to bind',
            },
            {
              name: 'label',
              type: 'ReactNode',
              description: 'Label rendered with htmlFor pointing at the field id',
            },
            {
              name: 'validate',
              type: '(value, meta) => string | FieldError | (string | FieldError)[] | undefined | Promise<...>',
              description:
                'Field-level validator (sync or async); runs per mode/on submit, meta carries {form, path, signal}',
            },
            {
              name: 'children',
              type: '(binding: {id, errorId, invalid, errors, value, onChange}) => ReactNode',
              description:
                'Render any haze-ui core; spread id/aria attributes and pass value/onChange to the core',
            },
          ]}
        />
        <h3>FormList props</h3>
        <PropsTable
          props={[
            {
              name: 'form',
              type: 'Form<TValues> (optional)',
              description:
                'Form instance; omitted, falls back to the nearest <FormProvider value={form}>',
            },
            {
              name: 'name',
              type: "FieldPath<TValues> | (string | number)[]",
              description: 'Array field path, e.g. tags',
            },
            {
              name: 'keyName',
              type: "string (default 'id')",
              description:
                'Property the stable row key is exposed under on each fields entry',
            },
            {
              name: 'rules',
              type: '{required, minLength, maxLength}',
              description:
                'Rules validated against the whole array (required fails on empty)',
            },
            {
              name: 'shouldUnregister',
              type: 'boolean',
              description:
                'Drop the array branch on unmount; defaults to the form-level flag',
            },
            {
              name: 'children',
              type: '(binding: {fields, append, prepend, insert, remove, swap, move, replace, update}) => ReactNode',
              description:
                'Render-prop rows — key each row by field.id; array ops materialize in-row edits first',
            },
          ]}
        />
        <h3>Resolvers (re-exported from react-f0rm/resolvers)</h3>
        <PropsTable
          props={[
            {
              name: 'standardSchemaFormValidator',
              type: '(schema) => FormValidateFn',
              description:
                'Form-level Standard Schema adapter for useForm({validate}); pair with validateDeps',
            },
            {
              name: 'standardSchemaResolver / zodResolver',
              type: '(schema) => Validator',
              description:
                "Field-level adapters — slot straight into FormItem's validate",
            },
            {
              name: 'hasStandardProps',
              type: '(schema) => boolean',
              description: 'Runtime probe for the ~standard props',
            },
          ]}
        />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              FormItem renders a <strong>&lt;label htmlFor&gt;</strong> bound
              to the field id
            </li>
            <li>
              <strong>aria-invalid</strong> is set while the field has errors;
              <strong> aria-describedby</strong> points at the error message
            </li>
            <li>
              Errors render in a <strong>role=&quot;alert&quot;</strong>{' '}
              element announced by screen readers
            </li>
            <li>
              Validation is submit-driven in this integration — field
              validators run on submit (react-f0rm <strong>mode</strong>)
            </li>
          </ul>
        </A11yNote>
      </div>
    </div>
  );
}
