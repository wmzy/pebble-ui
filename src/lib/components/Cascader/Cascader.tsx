import type {
  ComponentPropsWithoutRef,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { Fragment, useCallback, useEffect, useId, useRef, useState } from 'react';
import { isControl, useControl, useThru, watch } from 'react-use-control';

import { FloatingPanel, useFloating } from '../../utils/floating';
import { getDirection } from '../../utils/direction';
import { useFocusScope } from '../../utils/focus-scope';
import { useStrings } from '../LocaleProvider';

export type CascaderOption = {
  label: ReactNode;
  value: string;
  children?: CascaderOption[];
};

type CascaderProps = {
  /** Full option tree; each level becomes one column in the drill-down panel. */
  options: CascaderOption[];
  /** Selected path as an array of option values, one per level. */
  value?: ControlOrValue<string[]>;
  /** Fired with the committed path whenever a selection is made. */
  onChange?: (value: string[]) => void;
  placeholder?: string;
  /**
   * `false` (default): only leaf options commit a value. `true`: every level
   * commits its partial path the moment it is chosen (Ant Design semantics).
   */
  changeOnSelect?: boolean;
  /** Whether hovering a parent option expands its column; defaults to click. */
  expandTrigger?: 'click' | 'hover';
  className?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | 'className'>;

const wrapper = css`
  position: relative;
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
`;

const trigger = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  width: 100%;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  padding: var(--haze-space-2) var(--haze-space-3);
  text-align: start;
  cursor: pointer;
  box-sizing: border-box;
  transition:
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);

  &:focus-visible {
    outline: none;
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

/** Path label row: truncates instead of growing the trigger sideways. */
const triggerValue = css`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: start;
`;

const triggerPlaceholder = css`
  color: var(--haze-color-text-muted);
`;

const triggerCaret = css`
  display: inline-flex;
  flex-shrink: 0;
  color: var(--haze-color-text-muted);
`;

const separator = css`
  color: var(--haze-color-text-muted);
`;

/** Panel skin: a horizontal strip of scrolling columns. */
const panel = css`
  display: flex;
  align-items: stretch;
  padding: var(--haze-space-1);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  box-shadow: var(--haze-shadow-lg);
`;

const column = css`
  display: flex;
  flex-direction: column;
  min-width: 160px;
  max-height: 220px;
  overflow-y: auto;
  padding-block: var(--haze-space-1);

  & + & {
    border-inline-start: 1px solid var(--haze-color-border);
    margin-inline-start: var(--haze-space-1);
    padding-inline-start: var(--haze-space-1);
  }
`;

const item = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-2) var(--haze-space-3);
  border: none;
  background: none;
  border-radius: var(--haze-radius-sm);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  text-align: start;
  cursor: pointer;
  transition: background var(--haze-duration-fast);

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:active {
    background: var(--haze-color-bg-muted);
  }

  &:focus-visible {
    outline: none;
    background: var(--haze-color-bg-subtle);
    box-shadow: inset 0 0 0 2px var(--haze-color-focus-ring);
  }
`;

/** Option on the active drill-down path (parent columns). */
const itemInPath = css`
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-primary);
`;

const itemLabel = css`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const chevron = css`
  display: inline-flex;
  flex-shrink: 0;
  color: var(--haze-color-text-muted);
`;

const ChevronRight = () => (
  <svg
    viewBox='0 0 12 12'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M4 2l4 4-4 4' />
  </svg>
);

const ChevronDown = () => (
  <svg
    viewBox='0 0 12 12'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M2 4l4 4 4-4' />
  </svg>
);

// ---------------------------------------------------------------------------
// Panel DOM helpers. Focus follows the menu items themselves (roving focus,
// every item tabIndex=-1), so navigation resolves items by DOM query — the
// same approach as utils/menuKeyboard.
// ---------------------------------------------------------------------------

const ITEM_SELECTOR = '[role="menuitem"]';

function columnsOf(panel: HTMLElement | null): HTMLElement[] {
  return panel
    ? Array.from(panel.querySelectorAll<HTMLElement>('[data-haze-cascader-column]'))
    : [];
}

function itemsOf(column: HTMLElement | undefined): HTMLElement[] {
  return column
    ? Array.from(column.querySelectorAll<HTMLElement>(ITEM_SELECTOR))
    : [];
}

/** Focus target requested by a keyboard drill step, applied after the
 * matching columns have rendered. */
type PendingFocus = { level: number; index: number; value?: string };

export default function Cascader({
  options,
  value: valueControl,
  onChange,
  placeholder,
  changeOnSelect = false,
  expandTrigger = 'click',
  className,
  ...rest
}: CascaderProps) {
  const strings = useStrings('cascader');
  const [open, setOpen] = useControl(false, false);
  const controlled = isControl(valueControl);
  const [value, setValue] = useControl(
    useThru(
      controlled ? valueControl : undefined,
      watch((next) => onChange?.(next))
    ),
    controlled ? [] : valueControl ?? []
  );
  // Transient drill-down position (which parent option each open column
  // descends from) — internal UI state, resynced from `value` on open.
  const [activePath, setActivePath] = useState<string[]>([]);

  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pendingFocusRef = useRef<PendingFocus | null>(null);
  const focusedOpenRef = useRef(false);

  const floating = useFloating({
    open,
    setOpen,
    triggerRef,
    panelRef,
    animated: true,
  });

  // Focus scope: no auto focus (the initial item is focused below, gated on
  // `shown`) — its job is returning focus to the trigger when the panel
  // closes while an item holds it.
  const setScope = useFocusScope({
    enabled: open,
    autoFocus: false,
    returnFocus: true,
  });

  // Opening the panel resets the drill position to the committed path.
  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (justOpened) setActivePath(value);
  }, [open, value]);

  // Panel focus: one-shot initial focus when the panel opens (deepest
  // selected item when a value exists, else the first option) plus
  // keyboard-requested moves. Gated on `shown` — on the native path the
  // popover is display:none until showPopover() runs, and focus on a
  // hidden element is silently dropped. Depends on `activePath` because
  // opening resyncs activePath from `value` in a separate (earlier)
  // effect: on the just-opened commit the deeper columns are not rendered
  // yet, so the deepest-selected target is absent and the effect must
  // retry on the next commit instead of falling back to the first option.
  useEffect(() => {
    if (!open) {
      focusedOpenRef.current = false;
      pendingFocusRef.current = null;
      return;
    }
    if (!floating.shown) return;

    const pending = pendingFocusRef.current;
    if (pending) {
      pendingFocusRef.current = null;
      const items = itemsOf(columnsOf(panelRef.current)[pending.level]);
      const index =
        pending.value !== undefined
          ? items.findIndex((el) => el.dataset.value === pending.value)
          : pending.index;
      (index >= 0 ? items[index] : items[0])?.focus();
      return;
    }

    if (focusedOpenRef.current) return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
    const level = value.length - 1;
    const last = value[level];
    let target: HTMLElement | undefined;
    if (last !== undefined) {
      // Wait for the committed path's columns to render before focusing;
      // the fallback only applies when there is no value at all.
      target = items.find(
        (el) => el.dataset.level === String(level) && el.dataset.value === last
      );
      if (!target) return;
    } else {
      target = items.find((el) => el.dataset.level === '0');
    }
    if (!target) return;
    focusedOpenRef.current = true;
    target.focus();
  }, [open, floating.shown, activePath, value]);

  const setPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      setScope(node);
    },
    [panelRef, setScope]
  );

  // Visible columns: the root options plus the children of every active
  // path segment, one column per level.
  const columns: CascaderOption[][] = [options];
  for (const segment of activePath) {
    const children = columns
      .at(-1)!
      .find((option) => option.value === segment)?.children;
    if (!children?.length) break;
    columns.push(children);
  }

  // Options along the committed value path, for the trigger label.
  const selectedPath: CascaderOption[] = [];
  let seek = options;
  for (const segment of value) {
    const found = seek.find((option) => option.value === segment);
    if (!found) break;
    selectedPath.push(found);
    seek = found.children ?? [];
  }

  const activate = (option: CascaderOption, level: number) => {
    const path = [...activePath.slice(0, level), option.value];
    if (option.children?.length) {
      setActivePath(path);
      if (changeOnSelect) setValue(path);
    } else {
      setValue(path);
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleItemEnter = (option: CascaderOption, level: number) => {
    if (expandTrigger !== 'hover') return;
    setActivePath([...activePath.slice(0, level), option.value]);
  };

  const handleTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handlePanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    const active =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const itemEl = active?.closest<HTMLElement>(ITEM_SELECTOR) ?? undefined;
    const columnEl = itemEl?.closest<HTMLElement>('[data-haze-cascader-column]');
    const level = itemEl ? Number(itemEl.dataset.level) : 0;

    // Drill/back arrows mirror under RTL (← drills into the submenu that
    // opens on the physical left) — direction read from the panel's DOM
    // subtree at event time.
    const drillKey =
      getDirection(panel) === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backKey = drillKey === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        const items = itemsOf(columnEl ?? columnsOf(panel)[0]);
        if (items.length === 0) return;
        const current = itemEl ? items.indexOf(itemEl) : -1;
        const next =
          current < 0
            ? e.key === 'ArrowDown'
              ? 0
              : items.length - 1
            : (current + (e.key === 'ArrowDown' ? 1 : -1) + items.length) %
              items.length;
        items[next]?.focus();
        return;
      }
      case drillKey: {
        // Drill into the focused parent option (toward the inline-end
        // column the submenu opens on).
        if (itemEl?.getAttribute('aria-haspopup') !== 'true') return;
        e.preventDefault();
        setActivePath([...activePath.slice(0, level), itemEl.dataset.value!]);
        pendingFocusRef.current = { level: level + 1, index: 0 };
        return;
      }
      case backKey: {
        if (!itemEl || activePath.length === 0) return;
        e.preventDefault();
        const removed = activePath[activePath.length - 1]!;
        setActivePath(activePath.slice(0, -1));
        pendingFocusRef.current = {
          level: activePath.length - 1,
          index: 0,
          value: removed,
        };
        return;
      }
      case 'Home':
      case 'End': {
        e.preventDefault();
        const items = itemsOf(columnEl ?? columnsOf(panel)[0]);
        if (items.length === 0) return;
        (e.key === 'Home' ? items[0] : items[items.length - 1])?.focus();
        return;
      }
      case 'Enter': {
        // Keyboard activation: drill with focus following into the first
        // child; leaves commit. preventDefault suppresses the button's
        // synthesized click so activation runs exactly once (mouse clicks
        // keep their activate() path, where focus intentionally stays).
        if (!itemEl) return;
        e.preventDefault();
        const option = columns[level]?.find(
          (candidate) => candidate.value === itemEl.dataset.value
        );
        if (!option) return;
        if (option.children?.length) {
          setActivePath([...activePath.slice(0, level), option.value]);
          pendingFocusRef.current = { level: level + 1, index: 0 };
        } else {
          activate(option, level);
        }
        return;
      }
      case 'Escape':
      case 'Tab': {
        // Tab closes instead of tabbing out of the menu; focus returns to
        // the trigger through the focus scope.
        e.preventDefault();
        setOpen(false);
        return;
      }
    }
  };

  return (
    <div x-class={[wrapper, className]} {...rest}>
      <button
        ref={triggerRef}
        type='button'
        style={floating.triggerStyle}
        aria-haspopup='menu'
        aria-expanded={open}
        aria-controls={id}
        x-class={trigger}
        onPointerDown={floating.onTriggerPointerDown}
        onClick={floating.onTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <span x-class={triggerValue}>
          {selectedPath.length === 0 ? (
            <span x-class={triggerPlaceholder}>{placeholder}</span>
          ) : (
            selectedPath.map((option, i) => (
              <Fragment key={option.value}>
                {i > 0 && (
                  <span x-class={separator}>{' / '}</span>
                )}
                {option.label}
              </Fragment>
            ))
          )}
        </span>
        <span x-class={triggerCaret} aria-hidden='true'>
          <ChevronDown />
        </span>
      </button>
      <FloatingPanel
        ref={setPanelRef}
        behavior={floating}
        placement='bottom'
        id={id}
        role='menu'
        visualClass={panel}
        onKeyDown={handlePanelKeyDown}
      >
        {columns.map((columnOptions, level) => (
          <div
            key={level}
            role='menu'
            data-haze-cascader-column={level}
            x-class={column}
          >
            {columnOptions.map((option) => {
              const hasChildren = !!option.children?.length;
              const inPath = activePath[level] === option.value;
              return (
                <button
                  key={option.value}
                  type='button'
                  role='menuitem'
                  tabIndex={-1}
                  data-level={level}
                  data-value={option.value}
                  aria-haspopup={hasChildren ? 'true' : undefined}
                  aria-expanded={hasChildren ? inPath : undefined}
                  x-class={[item, inPath && itemInPath]}
                  onClick={() => activate(option, level)}
                  onMouseEnter={() => handleItemEnter(option, level)}
                >
                  <span x-class={itemLabel}>{option.label}</span>
                  {hasChildren && (
                    <span x-class={chevron} role='img' aria-label={strings.expand}>
                      <ChevronRight />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </FloatingPanel>
    </div>
  );
}

export type { CascaderProps };
