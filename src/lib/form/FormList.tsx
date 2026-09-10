import type {ReactNode} from 'react';

import type {
  FieldPath,
  FieldRules,
  FormInstance,
  Name,
  PathValueOf
} from 'react-f0rm';

import {useCallback, useContext, useMemo} from 'react';
import {
  FormContext,
  getValue,
  getValues,
  setValue,
  useFieldArray
} from 'react-f0rm';

/**
 * `fields` 数组的元素 —— react-f0rm `useFieldArray` 的行描述透传：
 * 稳定行 key、当前索引，以及 `keyName` 指定属性名下的同值别名
 * （默认 `id`，自定义名如 `'key'` 用于避开行数据自带的同名字段）。
 */
export type FormListField<K extends string = 'id'> = {
  /** 行的稳定 id：跨 append/remove/swap/move 跟随数据行本身，
   * 渲染列表时直接作 React key（绝不要用 index 当 key）。 */
  id: string;
  /** 行的当前位置：remove/move/swap/insert 之后随数据迁移。 */
  index: number;
} & Record<K, string>;

/**
 * FormList 的 render-prop 入参 —— react-f0rm `useFieldArray` 返回值
 * （`UseFieldArrayResult`）的结构透传。f0rm 主入口不导出该类型，这里按
 * 其形状镜像声明；`useFieldArray` 的真实返回值直接满足本类型。
 */
export type FormListBinding<K extends string = 'id'> = {
  /** 行列表：每行带稳定 key（`id` 或 `keyName` 指定的属性）与当前索引。 */
  fields: FormListField<K>[];
  /** 在数组末尾追加一行。 */
  append: (value: any) => void;
  /** 在数组头部插入一行。 */
  prepend: (value: any) => void;
  /** 在 `index` 处插入一行，其后各行顺移。 */
  insert: (index: number, value: any) => void;
  /** 删除 `index` 处的行，其后各行前移（行 key 随数据行消失）。 */
  remove: (index: number) => void;
  /** 交换两行位置：只动这两行，中间行不动。 */
  swap: (from: number, to: number) => void;
  /** 把 `from` 行移动到 `to` 位置，中间行整体顺移。 */
  move: (from: number, to: number) => void;
  /** 整表替换：清空后按 `values` 重建全部行。 */
  replace: (values: any[]) => void;
  /** 原位覆写 `index` 行的值：行 key 与位置保持不变。 */
  update: (index: number, value: any) => void;
};

/** FormList 自身的 props —— `useFieldArray` 选项的组件化外壳。 */
export type FormListProps<
  TValues extends Record<string, any> = any,
  P extends FieldPath<TValues> | Name = Name,
  K extends string = 'id'
> = {
  /**
   * 表单实例（`useForm()`/`createForm()` 的返回值）。可省略：省略时从
   * 最近的 `<FormProvider value={form}>` 读取（react-f0rm 的 form
   * context）；显式传入的 `form` 总是优先。
   */
  form?: FormInstance<TValues>;
  /** 数组字段的路径，如 `'tags'`。 */
  name: P;
  /**
   * 稳定行 key 在每个 `fields` 条目上暴露的属性名（默认 `'id'`）；
   * 行数据自带同名字段时换一个（如 `'key'`）避免覆盖，底层 id 不变。
   */
  keyName?: K;
  /**
   * 声明式规则，对整个数组值校验（react-hook-form `useFieldArray` 的
   * `rules`）：`required` 空数组失败，`minLength`/`maxLength` 读行数。
   * 与字段级规则一样在 submit 与 `trigger` 时运行。
   */
  rules?: FieldRules;
  /**
   * 卸载本组件时是否移除整个数组分支（含各行数据）。默认跟随表单级
   * `shouldUnregister`；传 `false` 保留数据。
   */
  shouldUnregister?: boolean;
  className?: string;
  /** render-prop：收到数组操作句柄，渲染整张行列表。 */
  children: (binding: FormListBinding<K>) => ReactNode;
};

const numericSegment = /^-?\d+$/;

/**
 * 把 `Name`（`'user.tags'` / `'items[0].name'` / 段数组）解析为段数组，
 * 语法镜像 react-f0rm 的路径解析器（数组段只能方括号：`items[0]`；
 * 点分数字段抛 TypeError；带引号段 `items["0"]` 表示字符串键）。
 * f0rm 未导出它的解析器，这里为「操作前物化」提供一致的段视图。
 */
function toSegments(name: Name): (string | number)[] {
  if (Array.isArray(name)) return name;
  const segments: (string | number)[] = [];
  let current = '';
  const flush = () => {
    if (numericSegment.test(current)) {
      throw new TypeError(
        `Numeric path segment must use bracket notation (path: ${name})`
      );
    }
    segments.push(current);
    current = '';
  };
  for (let i = 0; i < name.length; i++) {
    const char = name[i]!;
    if (char === '.') {
      if (current !== '') flush();
    } else if (char === '[') {
      if (current !== '') flush();
      const quote = name[i + 1];
      if (quote === '"' || quote === "'") {
        const close = name.indexOf(quote, i + 2);
        if (close === -1) {
          throw new TypeError(`Unterminated quote in path: ${name}`);
        }
        if (name[close + 1] !== ']') {
          throw new TypeError(`Expected "]" after quoted segment in path: ${name}`);
        }
        segments.push(name.slice(i + 2, close));
        i = close + 1;
      } else {
        const close = name.indexOf(']', i + 1);
        if (close === -1) {
          throw new TypeError(`Unterminated bracket in path: ${name}`);
        }
        const raw = name.slice(i + 1, close);
        segments.push(numericSegment.test(raw) ? Number(raw) : raw);
        i = close;
      }
    } else {
      current += char;
    }
  }
  if (current !== '' || segments.length === 0) flush();
  return segments;
}

/**
 * 数组字段的组件外壳：包住 react-f0rm 1.3 的 `useFieldArray`，把行
 * 列表与增删换位操作以 render-prop 交给消费者。headless —— 不带任何
 * 内置布局，只渲染一个可挂 `className` 的壳 `<div>`；行怎么排、按钮
 * 怎么放完全由 children 决定。
 *
 * `form` 可省略：省略时从最近的 `<FormProvider value={form}>` 回退读取；
 * 两者都没有时 throw。`keyName`/`rules`/`shouldUnregister` 原样透传给
 * `useFieldArray`。
 *
 * **行内编辑的保留（物化时机）**：react-f0rm 的数组操作从「数组层的
 * 上一次物化」读取整表，行内控件（如 `name={['tags', i, 'label']}` 的
 * FormItem）的编辑先是挂在更深层的待合并写入——直接 append/remove 会
 * 让它们被下一代覆盖丢失。FormList 在每个读旧值的操作（append/
 * prepend/insert/remove/swap/move/update）前，先用 `getValues()` 的
 * 合并视图把数组分支物化一次，行内编辑因此跨操作保留——与
 * react-hook-form / TanStack Form 的行为一致。`replace` 不读旧值，
 * 原样透传；`update`/`replace` 的显式值仍然覆盖对应行的行内编辑。
 *
 * ```tsx
 * <FormList form={form} name='tags'>
 *   {({fields, append, remove}) => (
 *     <>
 *       {fields.map((field) => (
 *         <div key={field.id}>
 *           <FormItem
 *             form={form}
 *             name={['tags', field.index, 'label']}
 *             input={InputCore}
 *           />
 *           <Button onClick={() => remove(field.index)}>Remove</Button>
 *         </div>
 *       ))}
 *       <Button onClick={() => append({label: ''})}>Add tag</Button>
 *     </>
 *   )}
 * </FormList>
 * ```
 *
 * 行 key 用 `field.id`（或 `keyName` 指定的属性）——不要用 index：
 * remove/swap/move 之后 index 会迁移，index key 会让 React 把行状态
 * 错配到别的数据行上。
 */
export default function FormList<
  TValues extends Record<string, any> = any,
  P extends FieldPath<TValues> | Name = Name,
  K extends string = 'id'
>({
  form,
  name,
  keyName,
  rules,
  shouldUnregister,
  className,
  children
}: FormListProps<TValues, P, K>) {
  // 与 FormItem 同一套解析顺序：显式 form 优先，其次 form context；
  // 都没有时给出指出两条出路的错误，而不是让 f0rm 内部的
  // "no form provided" 裸抛。
  const formFromContext = useContext(FormContext);
  const resolvedForm = form ?? formFromContext;
  if (!resolvedForm) {
    throw new Error(
      'FormList: no form provided — pass `form={form}` or render inside a <FormProvider value={form}>.'
    );
  }

  const raw = useFieldArray({
    form: resolvedForm,
    name,
    keyName,
    rules,
    shouldUnregister
  });

  // 物化：把行内待合并的深层写入收进数组层。引用相等说明没有
  // pending 的行内编辑（getValues 的合并保留结构共享），跳过写入。
  const materialize = useCallback(() => {
    const merged = getValues(resolvedForm) as TValues;
    const branch: unknown = toSegments(name).reduce<unknown>(
      (node, segment) =>
        node == null || typeof node !== 'object'
          ? undefined
          : (node as Record<string, unknown>)[segment],
      merged
    );
    if (!Array.isArray(branch)) return;
    if (branch === getValue(resolvedForm, name)) return;
    setValue(resolvedForm, name, branch as PathValueOf<TValues, P>);
  }, [resolvedForm, name]);

  // 读旧值的操作前物化一次（f0rm 的操作句柄自身引用稳定；包装产物经
  // useMemo 保持稳定，可安全喂给 memo 化的行组件）。replace 不读旧值，
  // 原样透传；fields 变化（增删行）时 binding 自然重建。
  const binding = useMemo<FormListBinding<K>>(() => {
    const wrapped = <A extends unknown[]>(op: (...args: A) => void) =>
      (...args: A) => {
        materialize();
        op(...args);
      };
    return {
      ...raw,
      append: wrapped(raw.append),
      prepend: wrapped(raw.prepend),
      insert: wrapped(raw.insert),
      remove: wrapped(raw.remove),
      swap: wrapped(raw.swap),
      move: wrapped(raw.move),
      update: wrapped(raw.update)
    };
  }, [
    materialize,
    raw.fields,
    raw.replace,
    raw.append,
    raw.prepend,
    raw.insert,
    raw.remove,
    raw.swap,
    raw.move,
    raw.update
  ]);

  return <div x-class={className}>{children(binding)}</div>;
}
