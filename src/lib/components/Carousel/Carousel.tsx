import type {
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  ReactNode,
} from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useControl } from 'react-use-control';

import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';
import { getDirection } from '../../utils/direction';

type CarouselProps = {
  value?: ControlOrValue<number>;
  autoPlay?: boolean;
  interval?: number;
  /** 切换动画形态：slide（默认，scroll-snap 轨道）/ fade（堆叠淡入淡出）。 */
  effect?: 'slide' | 'fade';
  /** 悬停或焦点在轮播内时暂停 autoPlay，离开后按剩余时间恢复（WCAG 2.2.1）。 */
  pauseOnHover?: boolean;
  className?: string;
  children: ReactNode;
};

/** 拖拽接管前的位移容差（px）：更小的移动按普通点击对待。 */
const DRAG_SLOP = 4;
/** 释放翻页阈值：轨道可见宽度的 25%。 */
const DRAG_PAGE_RATIO = 0.25;
/** 空操作占位（暂停/恢复入口在引擎停用时的哨兵值）。 */
const noop = (): void => undefined;

type DragState = {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  /** 已越过容差、手势被拖拽接管。 */
  moved: boolean;
};

const wrapper = css`
  position: relative;
  overflow: hidden;
  border-radius: var(--haze-radius-lg);
`;

const track = css`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

/**
 * Fade 轨道：全部幻灯片叠进同一个 grid 单元（轨道高度 = 最高幻灯片），
 * 激活项由 data-active 标记。visibility 的离散插值规则保证淡出过程保持
 * 可见、过渡结束时才隐藏。与 track 没有共同声明——slide 形态的类与 DOM
 * 完全保持原样，两种形态互斥地二选一挂载。
 */
const fadeTrack = css`
  display: grid;
  overflow: hidden;

  & > * {
    grid-area: 1 / 1;
    opacity: 0;
    visibility: hidden;
    transition:
      opacity var(--haze-duration-normal) var(--haze-ease),
      visibility var(--haze-duration-normal) var(--haze-ease);
  }

  & > *:where([data-active]) {
    opacity: 1;
    visibility: visible;
  }
`;

const navBtn = css`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  appearance: none;
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-size: var(--haze-text-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--haze-shadow-md);
  transition: background var(--haze-duration-fast);

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      var(--haze-shadow-md),
      0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const prevBtn = css`
  inset-inline-start: var(--haze-space-2);

  /* 位置随行进侧镜像；‹/› 字形靠元素镜像翻转（scale 与 navBtn 的
     transform 独立组合，不覆盖 translateY）。 */
  [dir='rtl'] & {
    scale: -1 1;
  }
`;

const nextBtn = css`
  inset-inline-end: var(--haze-space-2);

  [dir='rtl'] & {
    scale: -1 1;
  }
`;

const indicators = css`
  display: flex;
  justify-content: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-2) 0;
`;

const dot = css`
  width: 0.625rem;
  height: 0.625rem;
  border-radius: var(--haze-radius-full);
  border: none;
  background: var(--haze-color-bg-muted);
  cursor: pointer;
  padding: 0.375rem;
  transition: background var(--haze-duration-fast);
`;

const dotActive = css`
  background: var(--haze-color-primary);
`;

export default function Carousel({
  value: valueControl,
  autoPlay = false,
  interval = 5000,
  effect = 'slide',
  pauseOnHover = false,
  className,
  children,
}: CarouselProps) {
  const [current, setCurrent] = useControl(valueControl, 0);
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const count = Children.count(children);
  const strings = useStrings('carousel');
  const fade = effect === 'fade';

  useEffect(() => {
    if (fade) return; // 值切换即完成过渡，fade 不经过滚动 API
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[current] as HTMLElement | undefined;
    if (child)
      child.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
  }, [current, fade]);

  const goPrev = () => setCurrent((prev) => (prev - 1 + count) % count);
  const goNext = () => setCurrent((prev) => (prev + 1) % count);

  // ── autoPlay 引擎（Toast 的剩余预算模式）────────────────────
  // 暂停源：拖拽/按压会话恒暂停（手势优先于放映）；悬停与焦点仅在
  // pauseOnHover 时暂停。未传 pauseOnHover 且无拖拽时引擎退化为普通
  // 定时推进，与旧的 setInterval 行为一致。
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const remainingRef = useRef(0);
  const pausedRef = useRef(false);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const draggingRef = useRef(false);
  const pauseRef = useRef<() => void>(noop);
  const resumeRef = useRef<() => void>(noop);

  useEffect(() => {
    if (!autoPlay || count <= 1) {
      // 引擎停用：清空入口，避免旧闭包用旧配置重启定时器
      pauseRef.current = noop;
      resumeRef.current = noop;
      return;
    }

    const advance = () => setCurrent((prev) => (prev + 1) % count);

    const arm = () => {
      startedAtRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        advance();
        remainingRef.current = interval; // 下一张的完整预算
        if (!pausedRef.current) arm();
      }, remainingRef.current);
    };

    const pause = () => {
      if (timerRef.current === null) return; // 已暂停时幂等
      clearTimeout(timerRef.current);
      timerRef.current = null;
      // 把已流逝的切片入账：恢复时用剩余预算，而非完整间隔重计。
      // 下限 1ms——预算恰好耗尽的边界上不让恢复变成永久停摆。
      remainingRef.current = Math.max(
        1,
        remainingRef.current - (Date.now() - startedAtRef.current)
      );
    };

    pauseRef.current = pause;
    resumeRef.current = () => {
      if (timerRef.current === null && remainingRef.current > 0) arm();
    };

    remainingRef.current = interval;
    if (!pausedRef.current) arm();
    // 配置变化/卸载时入账已流逝时间，预算保持准确
    return pause;
  }, [autoPlay, interval, count, setCurrent]);

  const syncPlay = useCallback(() => {
    pausedRef.current =
      draggingRef.current ||
      (pauseOnHover && (hoveredRef.current || focusedRef.current));
    if (pausedRef.current) pauseRef.current();
    else resumeRef.current();
  }, [pauseOnHover]);

  // ── 指针拖拽翻页 ────────────────────────────────────────────
  // slide 形态：触摸已有原生 scroll-snap，不接管、不 preventDefault；
  // 仅鼠标拖拽。fade 形态无原生滚动语义，触摸也可按阈值翻页。
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  const takeDragGesture = (el: HTMLDivElement, pointerId: number) => {
    try {
      el.setPointerCapture(pointerId);
    } catch {
      // jsdom/无指针捕获的引擎：事件继续以冒泡形式送达轨道
    }
    el.style.userSelect = 'none'; // 拖拽期间不选中文本
    if (!fade) {
      el.style.scrollBehavior = 'auto'; // 跟手位移，禁用平滑滚动
      // 必须同时关掉 snap：程序化瞬时滚动会触发隐式重吸附，
      // 轨道会被钳回吸附点，跟手位移就废了
      el.style.scrollSnapType = 'none';
    }
  };

  const releaseDragGesture = (el: HTMLDivElement | null) => {
    if (!el) return;
    el.style.userSelect = '';
    el.style.scrollBehavior = '';
    el.style.scrollSnapType = '';
  };

  /** 平滑滚回当前页（回弹/取消路径；reduced-motion 下时长为 0）。 */
  const snapBack = () => {
    if (fade) return;
    const el = trackRef.current;
    const child = el?.children[current] as HTMLElement | undefined;
    child?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  };

  const handleTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (count <= 1 || e.button !== 0) return;
    if (!fade && e.pointerType !== 'mouse') return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: trackRef.current?.scrollLeft ?? 0,
      moved: false,
    };
    draggingRef.current = true; // 整个按压会话暂停 autoPlay
    syncPlay();
  };

  const handleTrackPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = trackRef.current;
    if (!drag || !el || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_SLOP) return;
      drag.moved = true;
      takeDragGesture(el, e.pointerId);
    }
    if (fade) return; // fade 无跟手位移，释放时按阈值翻页
    // 内容跟随指针。位移→滚动位置的换算在 LTR 与 RTL 一致：
    // 内容右移（dx>0）都是 scrollLeft 减小。
    el.scrollLeft = drag.startScrollLeft - dx;
  };

  const handleTrackPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.pointerId !== e.pointerId) return;
    const el = trackRef.current;
    dragRef.current = null;
    releaseDragGesture(el);
    draggingRef.current = false;
    // 指针捕获会吞掉 wrapper 的 pointerleave：释放点已在轮播外时
    // 同步清掉悬停态，否则 pauseOnHover 会被永久卡在暂停。对任何
    // 被跟踪的指针类型都成立（fade 形态触摸拖拽也走捕获）。
    const wrap = wrapperRef.current;
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      const outside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;
      if (outside) hoveredRef.current = false;
    }
    syncPlay();
    if (!drag.moved) return; // 普通点击：从未接管，零副作用
    suppressClickRef.current = true; // 拖拽后的 click 不落到幻灯片内容上
    const width = el?.getBoundingClientRect().width ?? 0;
    const threshold = Math.max(1, width * DRAG_PAGE_RATIO);
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) < threshold) {
      snapBack();
      return;
    }
    // 拖拽方向语义随行进侧镜像：内容右移（dx>0）在 LTR 是上一页，
    // RTL 是下一页——与按钮/方向键的镜像一致。
    const rtl = getDirection(wrapperRef.current) === 'rtl';
    if (dx > 0) {
      if (rtl) goNext();
      else goPrev();
    } else {
      if (rtl) goPrev();
      else goNext();
    }
  };

  const handleTrackPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    releaseDragGesture(trackRef.current);
    draggingRef.current = false;
    syncPlay();
    if (!drag.moved) return; // 取消即回弹：不翻页
    suppressClickRef.current = true;
    snapBack();
  };

  const handleTrackClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTrackDragStart = (e: ReactDragEvent<HTMLDivElement>) => {
    // 拖拽会话中吞掉原生 HTML5 拖拽（幻灯片内的图片/链接）
    if (dragRef.current) e.preventDefault();
  };

  /**
   * Keyboard contract (WAI-ARIA carousel): the region is a tab stop and
   * its arrows step the slides (Home/End jump to the ends). Under
   * `dir="rtl"` the arrows mirror (← advances), read from the DOM at
   * event time so the keys follow the mirrored slide order.
   */
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (count <= 1) return;
    const nextKey =
      getDirection(wrapperRef.current) === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = nextKey === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    switch (event.key) {
      case nextKey:
        event.preventDefault();
        goNext();
        return;
      case prevKey:
        event.preventDefault();
        goPrev();
        return;
      case 'Home':
        event.preventDefault();
        setCurrent(0);
        return;
      case 'End':
        event.preventDefault();
        setCurrent(count - 1);
        return;
    }
  };

  // fade 形态：克隆注入 data-active / inert（非激活页对 AT 隐藏且不可聚焦）。
  // slide 形态保持 children 原样——默认 DOM 零变化。
  const slides =
    !fade || count === 0
      ? children
      : Children.map(children, (child, i) =>
          isValidElement(child)
            ? cloneElement(
                child as ReactElement<{
                  'data-active'?: boolean;
                  inert?: boolean;
                }>,
                {
                  'data-active': i === current ? true : undefined,
                  inert: i !== current || undefined,
                }
              )
            : child
        );

  return (
    <div
      ref={wrapperRef}
      data-slot='carousel'
      x-class={[wrapper, className]}
      role='region'
      aria-roledescription='carousel'
      aria-label={strings.label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => {
        hoveredRef.current = true;
        syncPlay();
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
        syncPlay();
      }}
      onFocus={() => {
        focusedRef.current = true;
        syncPlay();
      }}
      onBlur={(e) => {
        // 焦点在轮播内部移动（圆点↔按钮）不算离开
        const next = e.relatedTarget;
        if (next instanceof Node && e.currentTarget.contains(next)) return;
        focusedRef.current = false;
        syncPlay();
      }}
    >
      <div
        ref={trackRef}
        data-slot='track'
        x-class={[fade ? fadeTrack : track]}
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        onPointerCancel={handleTrackPointerCancel}
        onClickCapture={handleTrackClickCapture}
        onDragStart={handleTrackDragStart}
      >
        {slides}
      </div>
      {count > 1 && (
        <>
          <button
            type='button'
            data-slot='prev'
            x-class={[navBtn, prevBtn]}
            onClick={goPrev}
            aria-label={strings.previousSlide}
          >
            ‹
          </button>
          <button
            type='button'
            data-slot='next'
            x-class={[navBtn, nextBtn]}
            onClick={goNext}
            aria-label={strings.nextSlide}
          >
            ›
          </button>
          <div data-slot='dots' className={indicators}>
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type='button'
                data-slot='dot'
                x-class={[dot, i === current && dotActive]}
                onClick={() => setCurrent(i)}
                aria-label={formatString(strings.goToSlide, { index: i + 1 })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export type { CarouselProps };
