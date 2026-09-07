import { useState, useCallback, useEffect, useRef } from 'react';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';

type TagInputCoreProps = {
  value: string[];
  onChange: (value: string[]) => void;
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
};

const container = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-1);
  padding: var(--haze-space-2) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  font-family: var(--haze-font-sans);
  min-height: 2.25rem;
  align-items: center;
  transition: border-color var(--haze-duration-fast), box-shadow var(--haze-duration-fast);

  &:focus-within {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

/* Tags flow inline with the input: the list itself wraps while staying a
   flex participant of the container. */
const listWrap = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const tag = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-0) var(--haze-space-2);
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-sm);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
`;

const removeBtn = css`
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  padding: var(--haze-space-1);
  min-width: 1.5rem;
  min-height: 1.5rem;

  &:hover {
    color: var(--haze-color-text);
  }
`;

const inputEl = css`
  flex: 1;
  min-width: 4rem;
  border: none;
  outline: none;
  background: none;
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);
  padding: 0;
`;

export default function TagInputCore({
  value: tags,
  onChange,
  placeholder,
  maxTags,
  disabled,
  className,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
}: TagInputCoreProps) {
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // After a removal re-render, focus the remove button at this index (or
  // the input when no tags remain) so keyboard focus never drops.
  const pendingFocusRef = useRef<number | null>(null);

  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (pending === null) return;
    pendingFocusRef.current = null;
    if (tags.length === 0) {
      inputRef.current?.focus();
      return;
    }
    const index = Math.min(pending, tags.length - 1);
    // The remove button is the only button inside a tag listitem; query
    // structurally so a localized "Remove {tag}" label cannot break it.
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>(
      'li > button'
    );
    buttons?.[index]?.focus();
  }, [tags]);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed || tags.includes(trimmed)) return;
      if (maxTags && tags.length >= maxTags) return;
      const next = [...tags, trimmed];
      onChange(next);
      setInputValue('');
    },
    [tags, maxTags, onChange]
  );

  const removeTag = useCallback(
    (index: number) => {
      const next = tags.filter((_, i) => i !== index);
      onChange(next);
      // Focus the neighbor that takes the removed tag's place (the one
      // before it at the tail); the effect above resolves it after
      // re-render.
      pendingFocusRef.current = next.length === 0 ? 0 : Math.min(index, next.length - 1);
    },
    [tags, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const strings = useStrings('tagInput');
  const baseLabel = placeholder || strings.placeholder;
  const tagCount = formatString(
    tags.length === 1 ? strings.tagCountSingular : strings.tagCount,
    { count: tags.length }
  );

  return (
    <div ref={containerRef} x-class={[container, className]}>
      {/* Tags form the list; the input is a sibling so the list's
          children are only listitems (axe aria-required-children) and
          screen readers hear one listitem per tag. */}
      <ul x-class={[listWrap]}>
        {tags.map((t, i) => (
          <li key={i} x-class={[tag]}>
            {t}
            <button
              x-class={[removeBtn]}
              type="button"
              onClick={() => removeTag(i)}
              onKeyDown={(e) => {
                // Backspace on a tag's remove button removes that tag too,
                // so consecutive Backspace presses walk through the tags
                // with focus following.
                if (e.key === 'Backspace') {
                  e.preventDefault();
                  removeTag(i);
                }
              }}
              aria-label={formatString(strings.removeTag, { tag: t })}
              disabled={disabled}
            >
              x
            </button>
          </li>
        ))}
      </ul>
      <input
        ref={inputRef}
        x-class={[inputEl]}
        id={id}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : undefined}
        aria-label={tags.length > 0 ? `${baseLabel}, ${tagCount}` : baseLabel}
        disabled={disabled}
      />
    </div>
  );
}

export type { TagInputCoreProps };
