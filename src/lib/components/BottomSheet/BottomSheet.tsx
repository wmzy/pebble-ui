import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  ComponentPropsWithoutRef,
  Ref,
} from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';
import { css } from '@linaria/core';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useFocusScope } from '../../utils/focus-scope';
import { Presence } from '../../utils/presence';
import { useViewTransitionFlip } from '../../utils/view-transition';

/**
 * Imperative handle exposed through the React 19 `ref` prop (same API
 * choice as VirtualList). Unlike Dialog/Drawer there is no native close
 * event to defer to — every exit path (overlay click, Escape, handle)
 * runs through the same `handleClose`, so `onClose` still fires exactly
 * once per close.
 */
type BottomSheetHandle = {
  /** Show the sheet (Presence mounts it, focus moves in). */
  open: () => void;
  /** Close the sheet through the animated exit; `onClose` fires once. */
  close: () => void;
  /** Focus the element that held focus when the sheet last opened. */
  focusTrigger: () => void;
};

type BottomSheetProps = {
  open?: ControlOrValue<boolean>;
  onClose?: () => void;
  /**
   * 开/关状态翻转是否包进 View Transitions API（默认 `false`，行为与
   * 不传完全一致）。开启后每次显隐翻转都运行在
   * `document.startViewTransition(() => flushSync(...))` 里（React 官方
   * 要求的同步 DOM 更新模式），页面获得原生过渡；命令式 handle、
   * Esc、遮罩点击等路径共用同一出口。引擎不支持
   * `startViewTransition` 或用户偏好 `prefers-reduced-motion: reduce`
   * 时自动退化为直接翻转。过渡外观由消费方的 `::view-transition-*`
   * 样式定义，组件自身的进退场动画照常运行在新快照内。
   */
  viewTransition?: boolean;
  /**
   * 开启移动端下滑关闭手势（默认 `false`，不开启时零行为、零 DOM
   * 差异——不挂任何 pointer 监听）。开启后 sheet 可被 pointer 拖拽
   * 向下：拖拽实时跟随（`translateY`），松手时超过阈值（`88px` 与
   * sheet 高度 25% 取小）走既有关闭路径（`onClose` 恰好一次，退场
   * 动画照常从当前位置滑出），不足阈值则以 `--haze-duration-fast`
   * 回弹。与内容滚动的冲突按 touch 惯例处理：仅当拖拽起点到 sheet
   * 之间的滚动容器都已滚到顶部、且方向向下时才接管手势，否则让位给
   * 原生滚动。手势本身不受 `prefers-reduced-motion` 影响（用户驱动），
   * 只有回弹动画时长走 motion token（reduce 偏好下自动归零）。
   */
  swipeToDismiss?: boolean;
  /**
   * 开启虚拟键盘避让（默认 `false`，对标 Base UI Drawer 的
   * VirtualKeyboardProvider）。开启后监听 `window.visualViewport` 的
   * `resize`/`scroll`：键盘弹出（视口高度收缩/被上推）时把 sheet 上移
   * `translateY(-inset)` 并压低最大高度，贴底的 sheet 不被键盘遮住；
   * 当前 inset 同时以 inline 自定义属性 `--haze-sheet-kb-inset` 暴露
   * 给消费方 CSS。环境无 `visualViewport`（SSR/jsdom）时静默降级为
   * `dvh` 基线（`max-height: min(80dvh, 100dvh - inset)`），不抛错。
   */
  virtualKeyboard?: boolean;
  children: ReactNode;
  className?: string;
  ref?: Ref<BottomSheetHandle>;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const overlay = css`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  /* Presence 注入的 data-state 驱动 backdrop 与内容各自的进退场 */
  &[data-state='open'] {
    animation: haze-sheet-backdrop-in var(--haze-duration-normal)
      var(--haze-ease);
  }

  &[data-state='closed'] {
    animation: haze-sheet-backdrop-out var(--haze-duration-fast)
      var(--haze-ease);
  }

  @keyframes haze-sheet-backdrop-in {
    from {
      opacity: 0;
    }
  }

  @keyframes haze-sheet-backdrop-out {
    to {
      opacity: 0;
    }
  }
`;

const sheet = css`
  box-sizing: border-box;
  background: var(--haze-color-bg);
  border-radius: var(--haze-radius-xl) var(--haze-radius-xl) 0 0;
  /* env(safe-area-inset-bottom) 是设备物理几何值（Home Indicator 等
     显示屏事实），不是可主题化的设计决策——token 体系约定允许 env()
     直取物理值，因此不造 --haze token。 */
  padding: var(--haze-space-4) var(--haze-space-6)
    calc(var(--haze-space-4) + env(safe-area-inset-bottom));
  max-width: 640px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);
  box-shadow: var(--haze-shadow-xl);

  /* 退场时长须不大于 overlay 的退场（overlay 卸载即整树消失） */
  [data-state='open'] & {
    animation: haze-sheet-in var(--haze-duration-normal) var(--haze-ease);
  }

  [data-state='closed'] & {
    animation: haze-sheet-out var(--haze-duration-fast) var(--haze-ease);
  }

  @keyframes haze-sheet-in {
    from {
      transform: translateY(100%);
    }
  }

  @keyframes haze-sheet-out {
    to {
      transform: translateY(100%);
    }
  }
`;

const handle = css`
  width: 2rem;
  height: 0.25rem;
  background: var(--haze-color-border);
  border-radius: var(--haze-radius-full);
  margin: 0 auto var(--haze-space-4);
`;

/* swipeToDismiss 开启时叠加在 sheet 上：touch-action 把纵向平移优先
   交给原生内容滚动，只有滚到顶后的下拉才由 JS 手势接管；
   overscroll-behavior-y 阻断顶部橡皮筋与滚动链——否则引擎会把
   边界下拉判归原生滚动（pull-to-refresh/链式滚动），pointer 流被
   pointercancel 掐断，手势收不到后续 move。 */
const swipeable = css`
  touch-action: pan-y;
  overscroll-behavior-y: none;
`;

/** 下滑关闭的默认位移阈值（与 sheet 高度的 25% 取小）。 */
const SWIPE_DISMISS_DISTANCE = 88;
/** 位移超过该值才从「待定」转为拖拽——区分点击与轻微抖动。 */
const SWIPE_SLOP = 8;

type SwipeState = {
  pointerId: number;
  startY: number;
  dragging: boolean;
};

/**
 * 拖拽起点（事件 target）到 sheet 根之间的所有滚动容器是否都已滚到
 * 顶部——touch 惯例：只有滚无可滚时，向下的拖拽才归手势接管，
 * 否则让位给原生滚动（Base UI Drawer 的 scroll-edge 判定同型）。
 */
function isAtScrollTop(target: EventTarget | null, root: HTMLElement): boolean {
  let node: Element | null = target instanceof Element ? target : null;
  while (node) {
    if (node.scrollTop > 0) return false;
    if (node === root) return true;
    node = node.parentElement;
  }
  return true;
}

/**
 * 虚拟键盘 inset：以布局视口为参照度量键盘占用的高度
 * （`innerHeight - visualViewport.height - offsetTop`，向下钳 0——
 * 桌面窗口缩放时 innerHeight 与视口同步变化，inset 恒为 0）。
 * `visualViewport` 不存在（SSR/jsdom）时静默保持 0，调用方的 `dvh`
 * 基线继续生效。`active` 关闭（sheet 收起）时不订阅。
 */
function useKeyboardInset(enabled: boolean, active: boolean): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    if (!enabled || !active) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const measure = () => {
      const next = Math.max(
        0,
        Math.round(window.innerHeight - viewport.height - viewport.offsetTop)
      );
      setInset((prev) => (prev === next ? prev : next));
    };
    measure();
    viewport.addEventListener('resize', measure);
    viewport.addEventListener('scroll', measure);
    return () => {
      viewport.removeEventListener('resize', measure);
      viewport.removeEventListener('scroll', measure);
    };
  }, [enabled, active]);
  return inset;
}

export default function BottomSheet({
  open: openControl,
  onClose,
  viewTransition = false,
  swipeToDismiss = false,
  virtualKeyboard = false,
  children,
  className,
  style,
  ref,
  ...rest
}: BottomSheetProps) {
  const [open, setOpen] = useControl(openControl, false);
  // open/close 翻转的统一出口：viewTransition 开启时每次翻转包在
  // document.startViewTransition(() => flushSync(...)) 里（不支持或
  // reduce 偏好时退化为直接 setOpen）。
  const flipOpen = useViewTransitionFlip(viewTransition, setOpen);
  const openerRef = useRef<HTMLElement | null>(null);
  // Opener capture for the imperative handle's focusTrigger(). Declared
  // BEFORE useFocusScope on purpose: effects run in declaration order,
  // and the scope's effect is what moves focus into the sheet —
  // capturing later would record the sheet itself. This mirrors the
  // element the scope restores focus to on close.
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement ? active : null;
  }, [open]);
  const setScope = useFocusScope({ enabled: open, trapped: true });

  const handleClose = useCallback(() => {
    flipOpen(false);
    onClose?.();
  }, [flipOpen, onClose]);

  // Imperative surface: `ref.current?.open()/close()/focusTrigger()`.
  // close shares handleClose with the overlay-click and Escape paths —
  // the single exit every consumer of onClose sees.
  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        flipOpen(true);
      },
      close: handleClose,
      focusTrigger: () => {
        const target = openerRef.current;
        if (target?.isConnected) target.focus();
      },
    }),
    [flipOpen, handleClose]
  );

  // ── 虚拟键盘避让 ────────────────────────────────────────────────
  const kbInset = useKeyboardInset(virtualKeyboard, open);
  const keyboardStyle = virtualKeyboard
    ? ({
        // inset 同时以自定义属性暴露给消费方 CSS（Base UI Drawer 的
        // --drawer-keyboard-inset 同型）；maxHeight/transform 放 inline
        // 是为了在 jsdom（css 关闭）下也可断言。键序在消费方 style
        // 之后：避让是该 prop 的语义本体，不允许被随手样式静默关掉。
        '--haze-sheet-kb-inset': `${kbInset}px`,
        maxHeight: `min(80dvh, calc(100dvh - ${kbInset}px))`,
        ...(kbInset > 0 ? { transform: `translateY(${-kbInset}px)` } : null),
      } as CSSProperties)
    : undefined;

  // ── 下滑关闭手势（swipeToDismiss，默认零开销）──────────────────
  const sheetRef = useRef<HTMLDivElement | null>(null);
  // 合并 focus scope 的 ref 回调与手势所需的 sheet 引用
  const setSheet = useCallback(
    (node: HTMLDivElement | null) => {
      setScope(node);
      sheetRef.current = node;
    },
    [setScope]
  );
  const swipeRef = useRef<SwipeState | null>(null);

  // vaul/Base UI 式 touchmove 守卫：在「可转换」窗口内阻止原生滚动
  // 接管手势（引擎一旦把触摸判归滚动，pointer 流会被 pointercancel
  // 掐断）。仅当内容已在顶部且向下拖时 preventDefault，正常内容滚动
  // 不受影响。必须恒定引用——addEventListener/removeEventListener 配对。
  const preventNativeScroll = useCallback((event: TouchEvent) => {
    const swipe = swipeRef.current;
    const sheet = sheetRef.current;
    if (!swipe || !sheet || event.touches.length !== 1) return;
    if (event.defaultPrevented) return;
    const [touch] = event.touches;
    if (!touch) return;
    const dy = touch.clientY - swipe.startY;
    if (dy <= 0) return;
    if (!swipe.dragging && !isAtScrollTop(event.target, sheet)) return;
    if (swipe.dragging || dy > SWIPE_SLOP) event.preventDefault();
  }, []);

  const takeGesture = (sheet: HTMLDivElement, pointerId: number) => {
    try {
      sheet.setPointerCapture(pointerId);
    } catch {
      // jsdom/无指针捕获的引擎：事件继续以冒泡形式送达 sheet
    }
    sheet.style.transition = 'none'; // 拖拽跟手，不做过渡
    sheet.style.userSelect = 'none'; // 鼠标拖拽不选中文本
    document.addEventListener('touchmove', preventNativeScroll, {
      passive: false,
    });
  };

  const releaseGesture = (sheet: HTMLDivElement) => {
    sheet.style.userSelect = '';
    document.removeEventListener('touchmove', preventNativeScroll);
  };

  // 回弹到 resting 位（键盘弹出时是 -inset，否则清空回落到类样式）；
  // 时长走 motion token，prefers-reduced-motion 下自动归零。
  const springBack = (sheet: HTMLDivElement) => {
    sheet.style.transition =
      'transform var(--haze-duration-fast) var(--haze-ease)';
    sheet.style.transform = kbInset > 0 ? `translateY(${-kbInset}px)` : '';
    const clear = (event: TransitionEvent) => {
      if (event.target !== sheet) return; // 子元素的过渡不清理
      sheet.style.transition = '';
      sheet.removeEventListener('transitionend', clear);
    };
    sheet.addEventListener('transitionend', clear);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // 只跟踪主键/触摸的首个指针；二次指针不抢已跟踪的手势
    if (e.button !== 0 || swipeRef.current) return;
    swipeRef.current = { pointerId: e.pointerId, startY: e.clientY, dragging: false };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    const sheet = sheetRef.current;
    if (!swipe || !sheet || swipe.pointerId !== e.pointerId) return;
    const dy = e.clientY - swipe.startY;
    if (!swipe.dragging) {
      // touch 惯例：未滚到顶或方向不向下时让位给原生滚动
      if (dy <= SWIPE_SLOP || !isAtScrollTop(e.target, sheet)) return;
      swipe.dragging = true;
      takeGesture(sheet, e.pointerId);
    }
    // 只向下位移，负向钳 0——不把 sheet 拖离贴底 resting 位；
    // 键盘弹出期间与 -inset 复合成一个位移
    sheet.style.transform = `translateY(${Math.max(0, dy) - kbInset}px)`;
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    const sheet = sheetRef.current;
    if (!swipe || !sheet || swipe.pointerId !== e.pointerId) return;
    swipeRef.current = null;
    releaseGesture(sheet);
    if (!swipe.dragging) return; // 普通点击：从未接管，零副作用
    const threshold = Math.max(
      1,
      Math.min(SWIPE_DISMISS_DISTANCE, sheet.getBoundingClientRect().height / 4)
    );
    const offset = Math.max(0, e.clientY - swipe.startY);
    sheet.style.transition = '';
    if (offset >= threshold) {
      // 保留当前位移：退场动画（keyframes 覆盖 inline）以它为起点滑到
      // 100%，无跳变；onClose 经由 handleClose 恰好发出一次
      handleClose();
      return;
    }
    springBack(sheet);
  };

  const handlePointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    const sheet = sheetRef.current;
    if (!swipe || !sheet || swipe.pointerId !== e.pointerId) return;
    swipeRef.current = null;
    releaseGesture(sheet);
    // 引擎接管（多指/原生滚动抢走）：一律不关闭，直接回弹
    if (swipe.dragging) springBack(sheet);
  };

  // 其他关闭路径（Esc/遮罩/handle.close）打断拖拽时复位跟踪态
  useEffect(() => {
    if (open) return;
    swipeRef.current = null;
    const sheet = sheetRef.current;
    if (sheet) {
      sheet.style.userSelect = '';
      sheet.style.transition = '';
    }
    document.removeEventListener('touchmove', preventNativeScroll);
  }, [open, preventNativeScroll]);

  return (
    <Presence present={open}>
      <div
        x-class={[overlay, className]}
        onClick={() => {
          // 退场期间（已 setOpen(false)、Presence 尚未卸载）不再重复关闭
          if (open) handleClose();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && open) handleClose();
        }}
      >
        <div
          ref={setSheet}
          role="dialog"
          aria-modal="true"
          x-class={[sheet, swipeToDismiss && swipeable]}
          style={{ ...style, ...keyboardStyle }}
          {...rest}
          {...(swipeToDismiss && {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerCancel,
          })}
          onClick={(e) => e.stopPropagation()}
        >
          <div x-class={[handle]} />
          {children}
        </div>
      </div>
    </Presence>
  );
}

export type { BottomSheetProps, BottomSheetHandle };
