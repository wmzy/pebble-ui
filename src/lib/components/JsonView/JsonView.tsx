import type { ComponentPropsWithoutRef } from 'react';

import { css } from '@linaria/core';
import { useCallback, useId, useState } from 'react';

import { useClipboard } from '../../hooks/useClipboard';

import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';

import {
  JSON_VIEW_MAX_ENTRIES,
  formatJsonLeaf,
  getJsonValueKind,
  jsonEntries,
  sliceEntries,
} from './json-view-utils';

/** Feedback window for the copy success glyph (ChatMessage precedent). */
const COPIED_FEEDBACK_MS = 1500;

type MoreLabelFn = (count: number) => string;

type JsonViewProps = {
  /** The value to render — any JSON shape (or plain JS value). */
  data: unknown;
  /**
   * Nodes at `depth >= defaultExpandedDepth` start collapsed (the root
   * is depth 0). Default `Infinity` — everything expanded. Collapsed
   * state is internal UI state; toggling a node never needs a parent.
   */
  defaultExpandedDepth?: number;
  /** Opt in to the corner copy button (pretty-printed `data`). */
  copyable?: boolean;
  /**
   * Accessible label for the copy button. Default from
   * `jsonView.copy` in the locale packs.
   */
  copyLabel?: string;
  /**
   * Formats the "+N more" hint on truncated collections. Default
   * derives from `jsonView.more` in the locale packs.
   */
  moreLabel?: MoreLabelFn;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const wrapper = css`
  position: relative;
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-relaxed);
  color: var(--haze-color-text);
  background: var(--haze-color-bg);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-3);
  overflow-x: auto;
`;

const line = css`
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  min-width: 0;
`;

const keyStyle = css`
  color: var(--haze-color-text-secondary);
`;

const punct = css`
  color: var(--haze-color-text-muted);
`;

/* Leaf colors by value kind — every branch of JSON data lands on a
 * semantic token, so theming re-tints the whole tree. */
const leafString = css`
  color: var(--haze-color-success);
`;

const leafNumber = css`
  color: var(--haze-color-primary);
`;

const leafBoolean = css`
  color: var(--haze-color-warning);
`;

const leafNullish = css`
  color: var(--haze-color-text-muted);
`;

type LeafKind = 'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'other';

const leafColors: Record<LeafKind, string> = {
  string: leafString,
  number: leafNumber,
  boolean: leafBoolean,
  null: leafNullish,
  undefined: leafNullish,
  other: leafNullish,
};

const toggle = css`
  display: inline-flex;
  align-items: baseline;
  gap: var(--haze-space-1);
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  text-align: start;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--haze-color-focus-ring);
    outline-offset: 2px;
    border-radius: var(--haze-radius-sm);
  }
`;

const chevron = css`
  flex-shrink: 0;
  align-self: center;
  transition: transform var(--haze-duration-fast) var(--haze-ease);
`;

const chevronCollapsed = css`
  transform: rotate(0deg);
`;

const chevronExpanded = css`
  transform: rotate(90deg);
`;

const childrenBlock = css`
  padding-inline-start: var(--haze-space-4);
  border-inline-start: 1px solid var(--haze-color-border);
`;

const moreRow = css`
  color: var(--haze-color-text-muted);
  user-select: none;
`;

const copyBtn = css`
  position: absolute;
  top: var(--haze-space-2);
  inset-inline-end: var(--haze-space-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-sm);
  background: var(--haze-color-bg);
  color: var(--haze-color-text-muted);
  cursor: pointer;

  &:hover {
    color: var(--haze-color-text);
    border-color: var(--haze-color-border-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--haze-color-focus-ring);
    outline-offset: 1px;
  }
`;

const copyBtnCopied = css`
  color: var(--haze-color-success);
  border-color: var(--haze-color-success);
`;

const ChevronGlyph = () => (
  <svg
    width='12'
    height='12'
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M6 4l4 4-4 4' />
  </svg>
);

const CopyGlyph = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
    <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
  </svg>
);

const CheckGlyph = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M20 6 9 17l-5-5' />
  </svg>
);

type JsonNodeProps = {
  /** Entry key; `null` for the root node. */
  name: string | null;
  value: unknown;
  depth: number;
  /** Stable identity of this node in the tree (root is `$`), used to key
   * per-node collapse overrides. */
  path: string;
  defaultExpandedDepth: number;
  moreLabel: MoreLabelFn;
  /** User toggles: path → collapsed. Absent = follow the depth default. */
  overrides: Map<string, boolean>;
  onToggle: (path: string, defaultCollapsed: boolean) => void;
  /** Ancestor branch values, for cycle detection. */
  ancestors: readonly unknown[];
};

function JsonNode({
  name,
  value,
  depth,
  path,
  defaultExpandedDepth,
  moreLabel,
  overrides,
  onToggle,
  ancestors,
}: JsonNodeProps) {
  const childrenId = useId();
  const kind = getJsonValueKind(value);
  const isBranch = kind === 'array' || kind === 'object';

  const keyPrefix =
    name === null ? null : (
      <>
        <span x-class={[keyStyle]}>{name}</span>
        <span x-class={[punct]}>: </span>
      </>
    );

  // Leaf: `key: value` on a single line, colored by kind.
  if (!isBranch) {
    const leafKind = kind;
    return (
      <div x-class={[line]}>
        {keyPrefix}
        <span x-class={[leafColors[leafKind]]}>{formatJsonLeaf(value, leafKind)}</span>
      </div>
    );
  }

  // A cycle renders as an ellipsis instead of recursing forever.
  if (ancestors.includes(value)) {
    return (
      <div x-class={[line]}>
        {keyPrefix}
        <span x-class={[leafNullish]}>…</span>
      </div>
    );
  }

  const entries = jsonEntries(value);
  const open = kind === 'array' ? '[' : '{';
  const close = kind === 'array' ? ']' : '}';

  // Empty branches have nothing to disclose — plain `key: {}`.
  if (entries.length === 0) {
    return (
      <div x-class={[line]}>
        {keyPrefix}
        <span x-class={[punct]}>
          {open}
          {close}
        </span>
      </div>
    );
  }

  const defaultCollapsed = depth >= defaultExpandedDepth;
  const collapsed = overrides.get(path) ?? defaultCollapsed;

  if (collapsed) {
    return (
      <div x-class={[line]}>
        <button
          type='button'
          x-class={[toggle]}
          aria-expanded={false}
          onClick={() => onToggle(path, defaultCollapsed)}
        >
          <span x-class={[chevron, chevronCollapsed]}>
            <ChevronGlyph />
          </span>
          {keyPrefix}
          <span x-class={[punct]}>
            {open} … {close}
          </span>
        </button>
      </div>
    );
  }

  const { visible, hiddenCount } = sliceEntries(entries, JSON_VIEW_MAX_ENTRIES);
  const childAncestors = [...ancestors, value];

  return (
    <div>
      <div x-class={[line]}>
        <button
          type='button'
          x-class={[toggle]}
          aria-expanded={true}
          aria-controls={childrenId}
          onClick={() => onToggle(path, defaultCollapsed)}
        >
          <span x-class={[chevron, chevronExpanded]}>
            <ChevronGlyph />
          </span>
          {keyPrefix}
          <span x-class={[punct]}>{open}</span>
        </button>
      </div>
      <div id={childrenId} x-class={[childrenBlock]}>
        {visible.map(([childKey, childValue]) => (
          <JsonNode
            key={childKey}
            name={childKey}
            value={childValue}
            depth={depth + 1}
            path={`${path}${JSON.stringify(childKey)}`}
            defaultExpandedDepth={defaultExpandedDepth}
            moreLabel={moreLabel}
            overrides={overrides}
            onToggle={onToggle}
            ancestors={childAncestors}
          />
        ))}
        {hiddenCount > 0 && (
          <div x-class={[line, moreRow]}>… {moreLabel(hiddenCount)}</div>
        )}
      </div>
      <div x-class={[line]}>
        <span x-class={[punct]}>{close}</span>
      </div>
    </div>
  );
}

export default function JsonView({
  data,
  defaultExpandedDepth = Infinity,
  copyable = false,
  copyLabel,
  moreLabel,
  className,
  ...rest
}: JsonViewProps) {
  const strings = useStrings('jsonView');
  // Prop wins; otherwise the locale pack template renders the hint.
  const resolvedMoreLabel: MoreLabelFn =
    moreLabel ?? ((count) => formatString(strings.more, { count }));

  const [overrides, setOverrides] = useState<Map<string, boolean>>(() => new Map());

  const onToggle = useCallback((path: string, defaultCollapsed: boolean) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      const effective = next.get(path) ?? defaultCollapsed;
      next.set(path, !effective);
      return next;
    });
  }, []);

  const { copied, copy } = useClipboard(COPIED_FEEDBACK_MS);

  const handleCopy = () => {
    // Circular or non-JSON values make stringify throw — degrade to
    // String(data) so the button never explodes on exotic input.
    let text: string;
    try {
      text = JSON.stringify(data, null, 2);
    } catch {
      text = String(data);
    }
    void copy(text);
  };

  return (
    <div x-class={[wrapper, className]} {...rest}>
      {copyable && (
        <button
          type='button'
          x-class={[copyBtn, copied && copyBtnCopied]}
          aria-label={copyLabel ?? strings.copy}
          onClick={handleCopy}
        >
          {copied ? <CheckGlyph /> : <CopyGlyph />}
        </button>
      )}
      <JsonNode
        name={null}
        value={data}
        depth={0}
        path='$'
        defaultExpandedDepth={defaultExpandedDepth}
        moreLabel={resolvedMoreLabel}
        overrides={overrides}
        onToggle={onToggle}
        ancestors={[]}
      />
    </div>
  );
}

export type { JsonViewProps, MoreLabelFn };
