import type { ReactNode } from 'react';

import type { TreeNodeData } from './types';

import { css } from '@linaria/core';
import { useId } from 'react';

import { useStrings } from '../LocaleProvider';

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
  titleRender?: (node: TreeNodeData) => ReactNode;
  iconRender?: (node: TreeNodeData) => ReactNode;
  isLast: boolean[];
  onToggle: () => void;
  onSelect: () => void;
  onCheck: () => void;
};

const indentSize = 24;

const item = css`
  display: flex;
  align-items: center;
  min-height: 2rem;
  padding: 2px 0;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
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
  transition: transform 0.2s;

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
  transition: all 0.15s;

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

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
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
  titleRender,
  iconRender,
  isLast,
  onToggle,
  onSelect,
  onCheck,
}: TreeItemProps) {
  const hasChildren = !!node.children?.length;
  const isLeaf = node.isLeaf ?? !hasChildren;
  const strings = useStrings('tree');
  // 与 Dialog 的 haze-dialog-title-${useId()} 同一套生成模式：给节点标题
  // 一个稳定 id，供复选框 aria-labelledby 引用（ReactNode 标题也能命名）。
  const titleId = `haze-tree-title-${useId()}`;

  const indentLevels = Array.from({ length: level }, (_, i) => ({
    showLine: showLine && !isLast[i],
  }));

  const titleContent = titleRender ? titleRender(node) : node.title;
  const iconContent = iconRender ? iconRender(node) : node.icon;

  return (
    <div>
      <div
        role='treeitem'
        aria-selected={selected}
        aria-expanded={isLeaf ? undefined : expanded}
        aria-level={level + 1}
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
            x-class={[indentLine, indentItem.showLine && indentLineWithBorder]}
          />
        ))}

        {!isLeaf && (
          <span
            role='button'
            aria-label={expanded ? strings.collapse : strings.expand}
            x-class={[switcher, expanded && switcherExpanded]}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {loading ? (
              <span className={loadingIcon}>
                {loadingIconProp ?? <SpinnerIcon />}
              </span>
            ) : switcherIcon ? (
              switcherIcon
            ) : (
              <ChevronRight />
            )}
          </span>
        )}

        {isLeaf && <span x-class={indentLine} />}

        {checkable && (
          <span
            role='checkbox'
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
          <span className={nodeIcon}>
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

        <span className={title} id={titleId}>{titleContent}</span>
      </div>
    </div>
  );
}
