import type { ReactNode } from 'react';

import type { TreeNodeData } from './types';

import { css } from '@linaria/core';
import { useId } from 'react';

import { useStrings } from '../LocaleProvider';

import { matchRanges } from './utils';

type TreeItemProps = {
  node: TreeNodeData;
  level: number;
  expanded: boolean;
  selected: boolean;
  checked: 'checked' | 'halfChecked' | 'unchecked';
  disabled: boolean;
  checkable: boolean;
  selectable: boolean;
  blockNode: boolean;
  showLine: boolean;
  showIcon: boolean;
  switcherIcon?: ReactNode;
  loadingIcon?: ReactNode;
  loading: boolean;
  /**
   * Lazy loading is armed (`loadData` provided): a childless node
   * without `isLeaf: true` renders as expandable instead of a leaf.
   */
  loadable?: boolean;
  /** The last lazy load of this node rejected — show the retry note. */
  loadFailed?: boolean;
  /** Active search query — string titles highlight their matches. */
  searchValue?: string;
  titleRender?: (node: TreeNodeData) => ReactNode;
  iconRender?: (node: TreeNodeData) => ReactNode;
  isLast: boolean[];
  /**
   * Roving-tabindex stop (WAI-ARIA tree pattern): `0` on the row that
   * owns the tree's single tab stop, `-1` on every other row.
   */
  tabIndex: 0 | -1;
  onToggle: () => void;
  onSelect: () => void;
  onCheck: () => void;
  onRetry?: () => void;
};

const indentSize = 24;

const item = css`
  display: flex;
  align-items: center;
  min-height: 2rem;
  padding: 2px 0;
  cursor: pointer;
  user-select: none;
  transition: background var(--haze-duration-fast);
  border-radius: var(--haze-radius-sm);

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--haze-color-focus-ring);
  }
`;

const blockItem = css`
  padding: var(--haze-space-1) var(--haze-space-2);
  border-radius: var(--haze-radius-sm);

  &:hover {
    background: var(--haze-color-bg-subtle);
  }
`;

const selectedStyle = css`
  background: var(--haze-color-primary-subtle);
  color: var(--haze-color-primary);
  font-weight: var(--haze-weight-medium);
`;

const disabledStyle = css`
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
`;

const switcher = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  cursor: pointer;
  color: var(--haze-color-text-muted);
  transition: transform var(--haze-duration-normal);

  &:hover {
    color: var(--haze-color-text);
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const switcherExpanded = css`
  transform: rotate(90deg);
`;

const checkbox = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  margin-inline-end: var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-sm);
  background: var(--haze-color-bg);
  cursor: pointer;
  transition: all var(--haze-duration-fast);

  &:hover {
    border-color: var(--haze-color-primary);
  }

  svg {
    width: 12px;
    height: 12px;
    color: white;
  }
`;

const checkboxChecked = css`
  background: var(--haze-color-primary);
  border-color: var(--haze-color-primary);
`;

const checkboxHalfChecked = css`
  background: var(--haze-color-primary);
  border-color: var(--haze-color-primary);
`;

const nodeIcon = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-inline-end: var(--haze-space-2);
  color: var(--haze-color-text-muted);

  svg {
    width: 16px;
    height: 16px;
  }
`;

const title = css`
  flex: 1;
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const loadingIcon = css`
  display: inline-flex;
  animation: spin 1s linear infinite;

  /* WCAG 2.3.3: the loop period is a literal on purpose (the motion
     tokens model transition durations, not multi-second cycles), so
     reduced-motion needs this explicit collapse. A single 0.01ms
     iteration parks the spinner at its rest frame next to the loading
     text — still recognizably a busy node. */
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

/* Search-hit highlight: warning-subtle on warning mirrors the Badge
   warning variant's token pairing. */
const mark = css`
  background: var(--haze-color-warning-subtle);
  color: var(--haze-color-warning);
  border-radius: var(--haze-radius-sm);
  padding: 0 var(--haze-space-1);
`;

/* Inline lazy-load failure note: retry affordance on the node row. */
const loadFailedNote = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  flex-shrink: 0;
  margin-inline-start: var(--haze-space-2);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-danger);
  cursor: pointer;

  &:hover {
    color: var(--haze-color-danger-hover);
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const indentLine = css`
  display: inline-block;
  width: ${indentSize}px;
  flex-shrink: 0;
`;

const indentLineWithBorder = css`
  border-inline-start: 1px solid var(--haze-color-border);
`;

const ChevronRight = () => (
  <svg
    viewBox='0 0 12 12'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M4 2l4 4-4 4' />
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox='0 0 12 12'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M2 6l3 3 5-5' />
  </svg>
);

const MinusIcon = () => (
  <svg
    viewBox='0 0 12 12'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
  >
    <path d='M2 6h8' />
  </svg>
);

const FolderIcon = () => (
  <svg viewBox='0 0 16 16' fill='currentColor'>
    <path d='M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z' />
  </svg>
);

const FolderOpenIcon = () => (
  <svg viewBox='0 0 16 16' fill='currentColor'>
    <path d='M.5 5l.5-.5A.5.5 0 0 1 1.5 4H4l1-1h4.5a1.5 1.5 0 0 1 1.5 1.5v1H14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5.5L.5 5z' />
    <path d='M1 6v6h14V6H1z' opacity='0.5' />
  </svg>
);

const FileIcon = () => (
  <svg viewBox='0 0 16 16' fill='currentColor'>
    <path d='M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.414a2 2 0 0 0-.586-1.414L10.586.172A2 2 0 0 0 9.172 0H4zm1 1a1 1 0 0 1 1-1h3.172a1 1 0 0 1 .707.293l2.121 2.121a1 1 0 0 1 .293.707V13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V1z' />
  </svg>
);

const SpinnerIcon = () => (
  <svg viewBox='0 0 16 16' fill='currentColor'>
    <path
      d='M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1a6 6 0 0 1 0 12V2z'
      opacity='0.3'
    />
    <path d='M8 1a7 7 0 0 1 7 7h-2a5 5 0 0 0-5-5V1z' />
  </svg>
);

const RetryIcon = () => (
  <svg
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M13.5 8a5.5 5.5 0 1 1-1.61-3.89' />
    <path d='M13.5 1.5v3h-3' />
  </svg>
);

/** Wraps every case-insensitive occurrence of `query` inside `text`
 *  with a token-styled `<mark>`; returns `text` when nothing matches. */
function highlightTitle(text: string, query: string): ReactNode {
  const ranges = matchRanges(text, query);
  if (ranges.length === 0) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], index) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={index} className={mark}>
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

export default function TreeItem({
  node,
  level,
  expanded,
  selected,
  checked,
  disabled,
  checkable,
  selectable,
  blockNode,
  showLine,
  showIcon,
  switcherIcon,
  loadingIcon: loadingIconProp,
  loading,
  loadable,
  loadFailed,
  searchValue,
  titleRender,
  iconRender,
  isLast,
  tabIndex,
  onToggle,
  onSelect,
  onCheck,
  onRetry,
}: TreeItemProps) {
  const hasChildren = !!node.children?.length;
  // With lazy loading armed, a childless node without an explicit
  // isLeaf stays expandable — its children arrive from `loadData`.
  const isLeaf = node.isLeaf ?? (!hasChildren && !loadable);
  const strings = useStrings('tree');
  // 与 Dialog 的 haze-dialog-title-${useId()} 同一套生成模式：给节点标题
  // 一个稳定 id，供复选框 aria-labelledby 引用（ReactNode 标题也能命名）。
  const titleId = `haze-tree-title-${useId()}`;

  const indentLevels = Array.from({ length: level }, (_, i) => ({
    showLine: showLine && !isLast[i],
  }));

  const titleContent = titleRender
    ? titleRender(node)
    : typeof node.title === 'string' && searchValue
      ? highlightTitle(node.title, searchValue)
      : node.title;
  const iconContent = iconRender ? iconRender(node) : node.icon;

  return (
    <div>
      <div
        role='treeitem'
        data-slot='item'
        tabIndex={tabIndex}
        data-tree-key={node.key}
        aria-selected={selected}
        aria-expanded={isLeaf ? undefined : expanded}
        aria-level={level + 1}
        aria-busy={loading || undefined}
        x-class={[
          item,
          blockNode && blockItem,
          selected && selectable && selectedStyle,
          (disabled || node.disabled) && disabledStyle,
        ]}
        onClick={() => {
          if (disabled || node.disabled) return;
          if (selectable) onSelect();
          if (!isLeaf) onToggle();
        }}
      >
        {indentLevels.map((indentItem, i) => (
          <span
            key={i}
            data-slot='indent'
            x-class={[indentLine, indentItem.showLine && indentLineWithBorder]}
          />
        ))}

        {!isLeaf && (
          <span
            role='button'
            data-slot='expand-button'
            aria-label={expanded ? strings.collapse : strings.expand}
            x-class={[switcher, expanded && switcherExpanded]}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {loading ? (
              <span data-slot='spinner' className={loadingIcon}>
                {loadingIconProp ?? <SpinnerIcon />}
              </span>
            ) : switcherIcon ? (
              switcherIcon
            ) : (
              <ChevronRight />
            )}
          </span>
        )}

        {isLeaf && <span data-slot='indent' x-class={indentLine} />}

        {checkable && (
          <span
            role='checkbox'
            data-slot='checkbox'
            aria-checked={
              checked === 'halfChecked' ? 'mixed' : checked === 'checked'
            }
            aria-labelledby={titleId}
            x-class={[
              checkbox,
              checked === 'checked' && checkboxChecked,
              checked === 'halfChecked' && checkboxHalfChecked,
              node.disableCheckbox && disabledStyle,
            ]}
            onClick={(e) => {
              e.stopPropagation();
              onCheck();
            }}
          >
            {checked === 'checked' && <CheckIcon />}
            {checked === 'halfChecked' && <MinusIcon />}
          </span>
        )}

        {(showIcon || iconContent) && (
          <span data-slot='icon' className={nodeIcon}>
            {iconContent ??
              (isLeaf ? (
                <FileIcon />
              ) : expanded ? (
                <FolderOpenIcon />
              ) : (
                <FolderIcon />
              ))}
          </span>
        )}

        <span data-slot='title' className={title} id={titleId}>{titleContent}</span>

        {loadFailed && (
          <span
            role='button'
            data-slot='retry-button'
            x-class={loadFailedNote}
            onClick={(e) => {
              e.stopPropagation();
              onRetry?.();
            }}
          >
            <RetryIcon />
            {strings.loadError} · {strings.retry}
          </span>
        )}
      </div>
    </div>
  );
}
