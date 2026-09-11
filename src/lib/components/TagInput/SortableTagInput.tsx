import type { Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import SortableTagInputCore from './SortableTagInputCore';

type SortableTagInputProps = {
  value?: ControlOrValue<string[]>;
  onChange?: (value: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
  /**
   * 字段 id（FormItem 桥生成）：必须挂到内部可聚焦的 input 上而非根
   * div，<label htmlFor> 与错误 span 的 aria 链路才能接到焦点元素——
   * 根 div 不聚焦，挂那里等于断链。
   */
  id?: string;
  /** 由 FormItem 桥传入，随字段错误态变化，透传给内部 input。 */
  'aria-invalid'?: boolean;
  /** 指向 FormItem 渲染的错误 span（id={errorId}），透传给内部 input。 */
  'aria-describedby'?: string;
  /** Forwarded to the inner text `<input>` (not the root div) — the
   * element form bridges and `ref.current.focus()` reach. */
  ref?: Ref<HTMLInputElement>;
};

/**
 * Controllable-state sugar over `SortableTagInputCore`: drag-and-drop tag
 * reordering built on the @dnd-kit optional peers — install
 * `@dnd-kit/core`, `@dnd-kit/sortable` and `@dnd-kit/utilities` to use
 * it (the plain `TagInput` never touches them). Reorders leave through
 * `onChange` with the new array — the same single exit as add/remove.
 * Keyboard: focus a tag's label, Space lifts, arrows move, Space drops,
 * Escape cancels.
 */
export default function SortableTagInput({
  value: valueControl,
  onChange,
  placeholder,
  maxTags,
  disabled,
  className,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  ref,
}: SortableTagInputProps) {
  const [tags, setTags] = useControl(valueControl, []);

  return (
    <SortableTagInputCore
      ref={ref}
      value={tags}
      onChange={(next) => {
        setTags(next);
        onChange?.(next);
      }}
      placeholder={placeholder}
      maxTags={maxTags}
      disabled={disabled}
      className={className}
      id={id}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedby}
    />
  );
}

export type { SortableTagInputProps };
