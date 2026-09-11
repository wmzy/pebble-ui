import type {FormInstance, FormListBinding} from './index';

import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {z} from 'zod';

import {Form, createForm, getError} from 'react-f0rm';

import {InputCore} from '../components/Input';

import {
  FormItem,
  FormList,
  FormProvider,
  getValue,
  getValues,
  setValue,
  standardSchemaFormValidator,
  zodResolver
} from './index';


type Tags = {title: string; tags: {label: string}[]};

/** Capture the render-prop binding without rendering anything — the
 * direct-operation tests (append/insert/remove/…) drive the real
 * useFieldArray handles and assert against the form store. */
function captureBinding(form: FormInstance<Tags>) {
  const captured: {binding?: FormListBinding} = {};
  render(
    <FormList form={form} name='tags'>
      {(binding) => {
        captured.binding = binding;
        return null;
      }}
    </FormList>
  );
  return captured;
}

/** Interactive row view: rows carry an inline FormItem bound by array
 * index path, plus remove/append buttons — the canonical FormList shape. */
function TagRows({form, binding}: {form?: FormInstance<Tags>; binding: FormListBinding}) {
  const {fields, append, remove} = binding;
  return (
    <>
      {fields.map((field) => (
        <div key={field.id}>
          <FormItem
            form={form}
            name={['tags', field.index, 'label']}
            label={`Tag ${field.index + 1}`}
            input={InputCore}
            placeholder='tag label'
          />
          <button type='button' onClick={() => remove(field.index)}>
            {`remove-${field.index}`}
          </button>
        </div>
      ))}
      <button type='button' onClick={() => append({label: ''})}>
        append
      </button>
    </>
  );
}

describe('FormList', () => {
  it('exposes initial rows; append/insert/remove write through and keep surviving row keys stable', () => {
    const form = createForm({
      initialValues: {title: 't', tags: [{label: 'a'}, {label: 'b'}]}
    });
    const captured = captureBinding(form);
    const binding = captured.binding!;

    expect(binding.fields.map((field) => field.index)).toEqual([0, 1]);
    const idA = binding.fields[0]!.id;
    const idB = binding.fields[1]!.id;

    // append → one more row at the end, prior keys untouched
    act(() => binding.append({label: 'c'}));
    expect(getValue(form, 'tags')).toEqual([
      {label: 'a'},
      {label: 'b'},
      {label: 'c'}
    ]);
    expect(captured.binding!.fields.map((field) => field.id)).toEqual([
      idA,
      idB,
      expect.any(String)
    ]);

    // insert in the middle → rows below shift down, keys follow the data
    act(() => captured.binding!.insert(1, {label: 'mid'}));
    expect(getValue(form, 'tags')).toEqual([
      {label: 'a'},
      {label: 'mid'},
      {label: 'b'},
      {label: 'c'}
    ]);
    expect(captured.binding!.fields[0]!.id).toBe(idA);
    expect(captured.binding!.fields[2]!.id).toBe(idB);

    // remove the first row → the surviving rows keep their keys
    act(() => captured.binding!.remove(0));
    expect(getValue(form, 'tags')).toEqual([
      {label: 'mid'},
      {label: 'b'},
      {label: 'c'}
    ]);
    expect(captured.binding!.fields[1]!.id).toBe(idB);
  });

  it('swap and move reorder values and carry the row keys with the data', () => {
    const form = createForm({
      initialValues: {title: '', tags: [{label: 'a'}, {label: 'b'}, {label: 'c'}]}
    });
    const captured = captureBinding(form);
    const binding = captured.binding!;
    const [idA, idB, idC] = binding.fields.map((field) => field.id);

    // swap only exchanges the two rows
    act(() => binding.swap(0, 2));
    expect(getValue(form, 'tags')).toEqual([
      {label: 'c'},
      {label: 'b'},
      {label: 'a'}
    ]);
    expect(captured.binding!.fields.map((field) => field.id)).toEqual([
      idC,
      idB,
      idA
    ]);

    // move(2, 0) carries the last row to the front, others shift once
    act(() => captured.binding!.move(2, 0));
    expect(getValue(form, 'tags')).toEqual([
      {label: 'a'},
      {label: 'c'},
      {label: 'b'}
    ]);
    expect(captured.binding!.fields.map((field) => field.id)).toEqual([
      idA,
      idC,
      idB
    ]);
  });

  it('update overwrites a row in place; replace rebuilds the whole list', () => {
    const form = createForm({
      initialValues: {title: '', tags: [{label: 'a'}, {label: 'b'}]}
    });
    const captured = captureBinding(form);
    const binding = captured.binding!;
    const idA = binding.fields[0]!.id;

    // update keeps the row's key and position
    act(() => binding.update(0, {label: 'rewritten'}));
    expect(getValue(form, 'tags')).toEqual([{label: 'rewritten'}, {label: 'b'}]);
    expect(captured.binding!.fields[0]!.id).toBe(idA);

    // out-of-range update is a no-op
    act(() => captured.binding!.update(9, {label: 'nope'}));
    expect(getValue(form, 'tags')).toEqual([{label: 'rewritten'}, {label: 'b'}]);

    // replace rebuilds every row with fresh keys
    act(() =>
      captured.binding!.replace([
        {label: 'p'},
        {label: 'q'},
        {label: 'r'}
      ])
    );
    expect(getValue(form, 'tags')).toEqual([
      {label: 'p'},
      {label: 'q'},
      {label: 'r'}
    ]);
    expect(captured.binding!.fields).toHaveLength(3);
    expect(new Set(captured.binding!.fields.map((field) => field.id)).size).toBe(
      3
    );
  });

  it('exposes the keyName alias on fields (default id)', () => {
    const form = createForm({initialValues: {title: '', tags: [{label: 'a'}]}});
    const captured: {binding?: FormListBinding<'key'>} = {};
    render(
      <FormList form={form} name='tags' keyName='key'>
        {(binding) => {
          captured.binding = binding;
          return null;
        }}
      </FormList>
    );
    const field = captured.binding!.fields[0]!;
    expect(field.key).toBe(field.id);
    expect(field.index).toBe(0);
  });

  it('passes rules through: an empty array fails required on submit', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {title: '', tags: []}});
    const onValid = vi.fn();

    render(
      <Form form={form} onValidSubmit={onValid}>
        <FormList
          form={form}
          name='tags'
          rules={{required: 'At least one tag is required'}}
        >
          {(binding) =>
            binding.fields.map((field) => (
              <div key={field.id}>{`row ${field.index}`}</div>
            ))
          }
        </FormList>
        <button type='submit'>Submit</button>
      </Form>
    );

    await user.click(screen.getByRole('button', {name: 'Submit'}));
    await act(async () => {
      await Promise.resolve();
    });
    expect(onValid).not.toHaveBeenCalled();
    expect(getError(form, 'tags')?.message).toBe(
      'At least one tag is required'
    );
  });

  it('keeps inline FormItem rows two-way bound by array index path; removing a row re-points the survivor', async () => {
    const user = userEvent.setup();
    const form = createForm({
      initialValues: {title: '', tags: [{label: 'a'}, {label: 'b'}]}
    });

    render(
      <FormList form={form} name='tags'>
        {(binding) => <TagRows form={form} binding={binding} />}
      </FormList>
    );

    // initial values flow into the row inputs
    expect(screen.getByLabelText('Tag 1')).toHaveValue('a');
    expect(screen.getByLabelText('Tag 2')).toHaveValue('b');

    // typing in a row writes through the ['tags', i, 'label'] path
    await user.type(screen.getByLabelText('Tag 1'), '!');
    expect(getValue(form, ['tags', 0, 'label'])).toBe('a!');

    // imperative writes flow back into the row input
    act(() => setValue(form, ['tags', 1, 'label'], 'set'));
    expect(screen.getByLabelText('Tag 2')).toHaveValue('set');

    // removing the first row moves the survivor's data up to row 1
    await user.click(screen.getByRole('button', {name: 'remove-0'}));
    expect(getValue(form, 'tags')).toEqual([{label: 'set'}]);
    expect(screen.getByLabelText('Tag 1')).toHaveValue('set');
    expect(screen.queryByLabelText('Tag 2')).not.toBeInTheDocument();

    // append brings an empty row back, bound and editable
    await user.click(screen.getByRole('button', {name: 'append'}));
    expect(screen.getByLabelText('Tag 2')).toHaveValue('');
    await user.type(screen.getByLabelText('Tag 2'), 'new');
    expect(getValue(form, ['tags', 1, 'label'])).toBe('new');
  });

  it('preserves in-row edits across array operations (materialize-before-op)', async () => {
    const user = userEvent.setup();
    const form = createForm({
      initialValues: {title: '', tags: [{label: 'a'}, {label: 'b'}]}
    });

    render(
      <FormList form={form} name='tags'>
        {(binding) => <TagRows form={form} binding={binding} />}
      </FormList>
    );

    // type into row 1, then append — react-f0rm's raw ops read the last
    // array materialization and would drop the pending row edit; FormList
    // materializes the merged branch first, so the edit survives
    await user.type(screen.getByLabelText('Tag 1'), 'A');
    await user.click(screen.getByRole('button', {name: 'append'}));
    expect(getValues(form).tags).toEqual([
      {label: 'aA'},
      {label: 'b'},
      {label: ''}
    ]);
    expect(screen.getByLabelText('Tag 1')).toHaveValue('aA');

    // removing an untouched row keeps the edited row intact
    await user.click(screen.getByRole('button', {name: 'remove-1'}));
    expect(getValues(form).tags).toEqual([{label: 'aA'}, {label: ''}]);
    expect(screen.getByLabelText('Tag 1')).toHaveValue('aA');
  });
});

describe('form context fallback (FormProvider)', () => {
  it('FormItem and FormList resolve the form from context when the prop is omitted', async () => {
    const user = userEvent.setup();
    const form = createForm({
      initialValues: {title: '', tags: [{label: 'a'}]}
    });

    render(
      <FormProvider value={form}>
        <FormItem name='title' label='Title' input={InputCore} />
        <FormList name='tags'>
          {(binding) => <TagRows binding={binding} />}
        </FormList>
      </FormProvider>
    );

    // FormItem binds through context
    await user.type(screen.getByLabelText('Title'), 'hello');
    expect(getValue(form, 'title')).toBe('hello');

    // FormList binds through context — initial row + append + row edit
    expect(screen.getByLabelText('Tag 1')).toHaveValue('a');
    await user.click(screen.getByRole('button', {name: 'append'}));
    await user.type(screen.getByLabelText('Tag 2'), 'ctx');
    // merged view (what a submit reads) carries the row edit
    expect(getValues(form).tags).toEqual([{label: 'a'}, {label: 'ctx'}]);
  });

  it('an explicit form prop wins over the context form', () => {
    const outer = createForm({
      initialValues: {title: '', tags: [{label: 'outer'}]}
    });
    const inner = createForm({
      initialValues: {title: '', tags: [{label: 'inner'}]}
    });
    const captured: {binding?: FormListBinding} = {};

    render(
      <FormProvider value={outer}>
        <FormList form={inner} name='tags'>
          {(binding) => {
            captured.binding = binding;
            return null;
          }}
        </FormList>
      </FormProvider>
    );

    act(() => captured.binding!.append({label: 'x'}));
    expect(getValue(inner, 'tags')).toEqual([{label: 'inner'}, {label: 'x'}]);
    expect(getValue(outer, 'tags')).toEqual([{label: 'outer'}]);
  });

  it('throws a descriptive error with neither a form prop nor a provider', () => {
    expect(() =>
      render(<FormList name='tags'>{() => null}</FormList>)
    ).toThrow(/FormList: no form provided/);
    expect(() =>
      render(<FormItem name='title' label='Title' input={InputCore} />)
    ).toThrow(/FormItem: no form provided/);
  });
});

describe('schema resolvers (react-f0rm/resolvers re-exports)', () => {
  it('zodResolver slots into FormItem validate; submit surfaces the issue and typing clears it', async () => {
    const user = userEvent.setup();
    const codeSchema = z.string().min(3, 'Code must be at least 3 characters');
    const form = createForm({initialValues: {title: '', tags: []}});

    render(
      <Form form={form} onSubmit={() => undefined}>
        <FormItem
          form={form}
          name='title'
          label='Title'
          validate={zodResolver(codeSchema)}
          input={InputCore}
        />
        <button type='submit'>Submit</button>
      </Form>
    );

    await user.click(screen.getByRole('button', {name: 'Submit'}));
    // the resolver is async — let the round land
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Code must be at least 3 characters'
    );

    // reValidateMode 'onChange' after a failed submit: a valid value clears
    await user.type(screen.getByLabelText('Title'), 'abc');
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(getValue(form, 'title')).toBe('abc');
  });

  it('standardSchemaFormValidator drives form-level validation across FormItems', async () => {
    const user = userEvent.setup();
    const schema = z.object({
      title: z.string().min(2, 'Title must be at least 2 characters'),
      email: z.email('Enter a valid email address')
    });
    const form = createForm({
      initialValues: {title: '', email: ''},
      validate: standardSchemaFormValidator(schema),
      // form-level rounds are set-only per field; validateDeps lists the
      // fields whose changes re-run the schema and whose stale errors
      // clear between rounds (react-f0rm's cross-field dependency list)
      validateDeps: ['title', 'email']
    });
    const onValid = vi.fn();

    render(
      <Form form={form} onValidSubmit={onValid}>
        <FormItem form={form} name='title' label='Title' input={InputCore} />
        <FormItem form={form} name='email' label='Email' input={InputCore} />
        <button type='submit'>Submit</button>
      </Form>
    );

    await user.click(screen.getByRole('button', {name: 'Submit'}));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getAllByRole('alert').map((el) => el.textContent)).toEqual([
      'Title must be at least 2 characters',
      'Enter a valid email address'
    ]);

    // fix one field: its error is gone, the other survives a resubmit
    await user.type(screen.getByLabelText('Title'), 'ok');
    await user.click(screen.getByRole('button', {name: 'Submit'}));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getAllByRole('alert').map((el) => el.textContent)).toEqual([
      'Enter a valid email address'
    ]);
    expect(onValid).not.toHaveBeenCalled();

    // all valid: the valid-submit channel fires
    await user.type(screen.getByLabelText('Email'), 'a@b.dev');
    await user.click(screen.getByRole('button', {name: 'Submit'}));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onValid).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async () => {
    const {axe} = await import('jest-axe');
    const form = createForm({
      initialValues: {title: '', tags: [{label: 'a'}, {label: 'b'}]}
    });

    render(
      <Form form={form} onSubmit={() => undefined}>
        <FormItem form={form} name='title' label='Title' input={InputCore} />
        <FormList form={form} name='tags'>
          {({fields, append, remove}) => (
            <>
              {fields.map((field) => (
                <div key={field.id}>
                  <FormItem
                    name={['tags', field.index, 'label']}
                    label={`Tag ${field.index + 1}`}
                    input={InputCore}
                  />
                  <button type='button' onClick={() => remove(field.index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type='button' onClick={() => append({label: ''})}>
                Add tag
              </button>
            </>
          )}
        </FormList>
        <button type='submit'>Submit</button>
      </Form>
    );

    const results = await axe(document.body, {
      rules: {region: {enabled: false}},
    });
    expect(results.violations).toEqual([]);
  });
});
