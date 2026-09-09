import type { BottomSheetHandle } from './BottomSheet';

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { useControl } from 'react-use-control';

import BottomSheet from './BottomSheet';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * jsdom 30 没有 matchMedia；viewTransition 的 reduced-motion 守卫在组件
 * 顶层订阅 prefers-reduced-motion（useViewTransitionFlip）。安装可翻转的
 * 完整 stub（默认不匹配），afterEach 卸载——真实 MQL 语义：matches 在
 * 调用时读当前值，change 同步派发 listener。
 */
function installReducedMotionMedia() {
  const listeners = new Set<() => void>();
  let matches = false;

  window.matchMedia = ((query: string) => {
    if (query !== REDUCED_MOTION_QUERY) throw new Error(`unexpected query: ${query}`);
    return {
      matches, // matchMedia 每次被调用时读取闭包当前值，语义同真实 MQL
      media: query,
      onchange: null,
      addEventListener: (type: string, listener: () => void) => {
        if (type === 'change') listeners.add(listener);
      },
      removeEventListener: (type: string, listener: () => void) => {
        if (type === 'change') listeners.delete(listener);
      },
      addListener: (listener: () => void) => listeners.add(listener),
      removeListener: (listener: () => void) => listeners.delete(listener),
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  });

  return {
    setMatches(next: boolean) {
      matches = next;
      for (const listener of [...listeners]) listener();
    },
    uninstall() {
      Reflect.deleteProperty(window, 'matchMedia');
    },
  };
}

beforeEach(() => {
  installReducedMotionMedia();
});

afterEach(() => {
  Reflect.deleteProperty(window, 'matchMedia');
  // view-transition 用例在 document 上挂的 stub 清理回「引擎不支持」态
  Reflect.deleteProperty(document, 'startViewTransition');
  // 键盘用例挂的 visualViewport stub 同样清回「引擎不支持」态
  Reflect.deleteProperty(window, 'visualViewport');
});

describe('BottomSheet', () => {
  it('renders when open', () => {
    render(<BottomSheet open>Content</BottomSheet>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<BottomSheet>Content</BottomSheet>);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<BottomSheet open className="custom">Content</BottomSheet>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('has dialog role with aria-modal', () => {
    render(<BottomSheet open aria-label="Actions">Content</BottomSheet>);
    expect(screen.getByRole('dialog', { name: 'Actions' })).toHaveAttribute(
      'aria-modal',
      'true'
    );
  });

  it('closes on overlay click after the exit settles', async () => {
    const user = userEvent.setup();
    render(<BottomSheet open>Content</BottomSheet>);
    const overlay = screen.getByText('Content').closest('[class]')?.parentElement;
    if (overlay) await user.click(overlay);
    // Presence 退场跨 rAF，jsdom 无 CSS 时长也需异步等待卸载
    await waitFor(() =>
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    );
  });

  it('does not close on content click', async () => {
    const user = userEvent.setup();
    render(<BottomSheet open>Content</BottomSheet>);
    await user.click(screen.getByText('Content'));
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose}>
        <p>Content</p>
      </BottomSheet>
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    );
  });

  it('moves initial focus into the sheet when opened', () => {
    render(
      <BottomSheet open>
        <button type="button">Sheet action</button>
      </BottomSheet>
    );
    expect(screen.getByText('Sheet action')).toHaveFocus();
  });

  it('restores focus to the opener when closed', async () => {
    function Harness() {
      const [, setOpen, openCtrl] = useControl(undefined, false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open sheet</button>
          <BottomSheet open={openCtrl} onClose={() => setOpen(false)}>
            <button type="button">Sheet action</button>
          </BottomSheet>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByText('Open sheet');
    await user.click(opener);
    expect(screen.getByText('Sheet action')).toHaveFocus();
    await user.click(screen.getByRole('dialog').parentElement!);
    expect(opener).toHaveFocus();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('traps Tab focus within the sheet', () => {
    render(
      <BottomSheet open>
        <button type="button">First</button>
        <button type="button">Last</button>
      </BottomSheet>
    );
    const first = screen.getByText('First');
    const last = screen.getByText('Last');
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('has no axe violations when open', async () => {
    const { axe } = await import('jest-axe');
    render(
      <BottomSheet open aria-label="Actions">
        <h2>Sheet title</h2>
        <p>Sheet content</p>
      </BottomSheet>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('BottomSheet imperative handle', () => {
  it('opens and closes through the handle', async () => {
    const ref = createRef<BottomSheetHandle>();
    render(
      <BottomSheet ref={ref}>
        <p>Sheet content</p>
      </BottomSheet>
    );
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();

    act(() => ref.current!.open());
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    act(() => ref.current!.close());
    // Presence 退场跨 rAF，jsdom 无 CSS 时长也需异步等待卸载
    await waitFor(() =>
      expect(screen.queryByText('Sheet content')).not.toBeInTheDocument()
    );
  });

  it('fires onClose exactly once when closed through the handle', async () => {
    const onClose = vi.fn();
    const ref = createRef<BottomSheetHandle>();
    render(
      <BottomSheet ref={ref} open onClose={onClose}>
        <p>Sheet content</p>
      </BottomSheet>
    );
    act(() => ref.current!.close());
    // BottomSheet 没有原生 close 事件可等：所有关闭路径（遮罩点击、
    // Escape、handle）都走同一个 handleClose，onClose 同步发出一次。
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByText('Sheet content')).not.toBeInTheDocument()
    );
  });

  it('drives a controlled open control through the handle', async () => {
    function Harness() {
      const [, setOpen, openCtrl] = useControl(undefined, false);
      const ref = createRef<BottomSheetHandle>();
      return (
        <>
          <button onClick={() => setOpen(true)}>Open via control</button>
          <BottomSheet ref={ref} open={openCtrl}>
            <button type="button" onClick={() => ref.current!.close()}>
              Close via handle
            </button>
          </BottomSheet>
        </>
      );
    }
    render(<Harness />);

    act(() => {
      fireEvent.click(screen.getByText('Open via control'));
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Close via handle'));
    });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('focuses the opener through focusTrigger() while open', async () => {
    const ref = createRef<BottomSheetHandle>();
    const user = userEvent.setup();
    render(
      <>
        <button onClick={() => ref.current!.open()}>Open sheet</button>
        <BottomSheet ref={ref}>
          <button type="button">Sheet action</button>
        </BottomSheet>
      </>
    );
    const opener = screen.getByText('Open sheet');
    // user.click 会把焦点移到按钮上，handle.open 后它就是被记录的 opener
    await user.click(opener);
    // autoFocus 把焦点移进了 sheet
    expect(screen.getByText('Sheet action')).toHaveFocus();
    act(() => ref.current!.focusTrigger());
    expect(opener).toHaveFocus();
  });

  it('does not crash when handle methods run after unmount', () => {
    const ref = createRef<BottomSheetHandle>();
    const { unmount } = render(
      <BottomSheet ref={ref} open>
        <p>Sheet content</p>
      </BottomSheet>
    );
    // React nulls ref.current on unmount — the guard under test is a
    // consumer holding the handle object itself.
    const handle = ref.current!;
    unmount();
    expect(() => {
      handle.open();
      handle.close();
      handle.focusTrigger();
    }).not.toThrow();
  });
});

/**
 * jsdom 没有 startViewTransition——按组件的真实消费面 stub：捕获旧快照
 * 后同步调用 update callback（真实浏览器是异步调用；这里同步即可验证
 * 「callback 内 flushSync 同步 setState」的契约）。返回带
 * ready/finished 的假 ViewTransition 供组件挂 no-op catch。
 * mountedAfterUpdate 记录 update 返回那一刻 sheet 是否已在 DOM——
 * BottomSheet 的关闭态本就不在文档里，探针用存在性而非 data-state。
 */
function stubStartViewTransition(mountedAfterUpdate: boolean[]) {
  const spy = vi.fn((update: () => void) => {
    update();
    // flushSync 的效果就体现在这里：update 返回时新状态已同步提交进
    // DOM（没有 flushSync 的话此刻还是旧值）
    mountedAfterUpdate.push(screen.queryByRole('dialog') !== null);
    return {
      ready: Promise.resolve(),
      finished: Promise.resolve(),
    } as unknown as ViewTransition;
  });
  document.startViewTransition = spy;
  return spy;
}

describe('BottomSheet view transitions', () => {
  it('wraps the open flip in startViewTransition and commits it synchronously', () => {
    const mountedAfterUpdate: boolean[] = [];
    const spy = stubStartViewTransition(mountedAfterUpdate);
    const ref = createRef<BottomSheetHandle>();
    render(
      <BottomSheet ref={ref} viewTransition>
        <p>Sheet content</p>
      </BottomSheet>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => ref.current!.open());

    expect(spy).toHaveBeenCalledTimes(1);
    // update callback 返回时 sheet 已挂载——flushSync 的同步提交语义
    expect(mountedAfterUpdate).toEqual([true]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('wraps the close flip (overlay click) and fires onClose exactly once', async () => {
    const onClose = vi.fn();
    const spy = stubStartViewTransition([]);
    render(
      <BottomSheet open viewTransition onClose={onClose}>
        <p>Sheet content</p>
      </BottomSheet>
    );
    act(() => {
      fireEvent.click(screen.getByRole('dialog').parentElement!);
    });
    expect(spy).toHaveBeenCalledTimes(1);
    // handleClose：VT 包翻转，onClose 仍同步恰好一次
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('wraps Escape and the imperative handle close the same way', async () => {
    const spy = stubStartViewTransition([]);
    const ref = createRef<BottomSheetHandle>();
    render(
      <BottomSheet ref={ref} viewTransition>
        <p>Sheet content</p>
      </BottomSheet>
    );

    act(() => ref.current!.open());
    expect(spy).toHaveBeenCalledTimes(1);

    // Esc：翻转走 VT（第 2 次）
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(spy).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );

    // 重开（第 3 次）、handle.close（第 4 次）——同一出口
    act(() => ref.current!.open());
    expect(spy).toHaveBeenCalledTimes(3);
    act(() => ref.current!.close());
    expect(spy).toHaveBeenCalledTimes(4);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('does not start a view transition by default', () => {
    const mountedAfterUpdate: boolean[] = [];
    const spy = stubStartViewTransition(mountedAfterUpdate);
    render(<BottomSheet open>Content</BottomSheet>);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(spy).not.toHaveBeenCalled();
    // 无 VT：状态直接落地，不经 update callback
    expect(mountedAfterUpdate).toEqual([]);
  });

  it('skips startViewTransition under prefers-reduced-motion', async () => {
    const reducedMotion = installReducedMotionMedia();
    try {
      const spy = stubStartViewTransition([]);
      const ref = createRef<BottomSheetHandle>();
      render(
        <BottomSheet ref={ref} viewTransition>
          <p>Sheet content</p>
        </BottomSheet>
      );

      act(() => reducedMotion.setMatches(true));
      act(() => ref.current!.open());
      expect(spy).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      act(() => ref.current!.close());
      expect(spy).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
    } finally {
      reducedMotion.uninstall();
    }
  });

  it('falls back to direct flips when the engine lacks startViewTransition', async () => {
    // 无 stub（afterEach 也保证清理）：jsdom 原生没有该 API
    expect(typeof document.startViewTransition).not.toBe('function');
    const ref = createRef<BottomSheetHandle>();
    render(
      <BottomSheet ref={ref} viewTransition>
        <p>Sheet content</p>
      </BottomSheet>
    );
    act(() => ref.current!.open());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => ref.current!.close());
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });
});

// ─── swipe-to-dismiss 手势 ─────────────────────────────────────────
// jsdom 无布局：阈值依赖的 sheet 高度用 rect mock 给出真实值（dnd-kit
// 键盘排序测试同型），否则 getBoundingClientRect 恒 0、阈值塌缩到 1px。
function mockSheetHeight(sheet: HTMLElement, height: number) {
  sheet.getBoundingClientRect = () =>
    ({ width: 320, height, top: 0, left: 0, right: 320, bottom: height, x: 0, y: 0, toJSON: () => ({}) });
}

describe('BottomSheet swipe-to-dismiss', () => {
  it('follows the drag and closes through the shared exit past the threshold', async () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open swipeToDismiss onClose={onClose}>
        <p>Sheet content</p>
      </BottomSheet>
    );
    const sheet = screen.getByRole('dialog');
    mockSheetHeight(sheet, 400); // 阈值 = min(88, 400/4) = 88

    fireEvent.pointerDown(sheet, { pointerId: 1, clientY: 100, button: 0 });
    fireEvent.pointerMove(sheet, { pointerId: 1, clientY: 150 });
    // 拖拽实时跟随（位移 = clientY 差值）
    expect(sheet.style.transform).toBe('translateY(50px)');
    fireEvent.pointerUp(sheet, { pointerId: 1, clientY: 300 }); // 200 ≥ 88

    // 与遮罩点击/Escape/handle.close 同一个 handleClose：恰好一次
    expect(onClose).toHaveBeenCalledTimes(1);
    // 走既有 Presence 退场：sheet 最终卸载
    await waitFor(() =>
      expect(screen.queryByText('Sheet content')).not.toBeInTheDocument()
    );
  });

  it('springs back below the threshold instead of closing', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open swipeToDismiss onClose={onClose}>
        <p>Sheet content</p>
      </BottomSheet>
    );
    const sheet = screen.getByRole('dialog');
    mockSheetHeight(sheet, 400);

    fireEvent.pointerDown(sheet, { pointerId: 1, clientY: 100, button: 0 });
    fireEvent.pointerMove(sheet, { pointerId: 1, clientY: 140 }); // 40 < 88
    expect(sheet.style.transform).toBe('translateY(40px)');
    fireEvent.pointerUp(sheet, { pointerId: 1, clientY: 140 });

    // 回弹：translate 归零，动画时长走 motion token（reduce 下自动归零）
    expect(sheet.style.transform).toBe('');
    expect(sheet.style.transition).toBe(
      'transform var(--haze-duration-fast) var(--haze-ease)'
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('lets native scrolling win until every scroller is back at the top', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open swipeToDismiss onClose={onClose}>
        <div data-testid="scroller" style={{ overflowY: 'auto' }}>
          <p style={{ height: 600 }}>Tall content</p>
        </div>
      </BottomSheet>
    );
    const sheet = screen.getByRole('dialog');
    const scroller = screen.getByTestId('scroller');
    mockSheetHeight(sheet, 400);

    // 嵌套滚动容器未滚到顶：同样的下拉不接管（touch 惯例）
    scroller.scrollTop = 60;
    fireEvent.pointerDown(scroller, { pointerId: 1, clientY: 100, button: 0 });
    fireEvent.pointerMove(scroller, { pointerId: 1, clientY: 300 });
    expect(sheet.style.transform).toBe('');
    fireEvent.pointerUp(scroller, { pointerId: 1, clientY: 300 });
    expect(onClose).not.toHaveBeenCalled();

    // sheet 自身滚动容器同理
    fireEvent.pointerDown(sheet, { pointerId: 2, clientY: 100, button: 0 });
    sheet.scrollTop = 40;
    fireEvent.pointerMove(sheet, { pointerId: 2, clientY: 300 });
    fireEvent.pointerUp(sheet, { pointerId: 2, clientY: 300 });
    expect(sheet.style.transform).toBe('');
    expect(onClose).not.toHaveBeenCalled();

    // 滚回顶部后，同样的手势恢复接管并关闭
    sheet.scrollTop = 0;
    fireEvent.pointerDown(sheet, { pointerId: 3, clientY: 100, button: 0 });
    fireEvent.pointerMove(sheet, { pointerId: 3, clientY: 300 });
    fireEvent.pointerUp(sheet, { pointerId: 3, clientY: 300 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores upward drags', () => {
    render(
      <BottomSheet open swipeToDismiss>
        <p>Sheet content</p>
      </BottomSheet>
    );
    const sheet = screen.getByRole('dialog');
    mockSheetHeight(sheet, 400);
    fireEvent.pointerDown(sheet, { pointerId: 1, clientY: 300, button: 0 });
    fireEvent.pointerMove(sheet, { pointerId: 1, clientY: 100 }); // 向上
    fireEvent.pointerUp(sheet, { pointerId: 1, clientY: 100 });
    expect(sheet.style.transform).toBe('');
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('springs back on pointercancel without closing', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open swipeToDismiss onClose={onClose}>
        <p>Sheet content</p>
      </BottomSheet>
    );
    const sheet = screen.getByRole('dialog');
    mockSheetHeight(sheet, 400);
    fireEvent.pointerDown(sheet, { pointerId: 1, clientY: 100, button: 0 });
    fireEvent.pointerMove(sheet, { pointerId: 1, clientY: 400 }); // 已在拖拽中
    expect(sheet.style.transform).toBe('translateY(300px)');
    // 引擎抢走手势（原生滚动/多指）：不关闭，回弹。
    // RTL 的 fireEvent 事件表没有 pointercancel，直接派发原生事件
    fireEvent(
      sheet,
      new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 })
    );
    expect(sheet.style.transform).toBe('');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('stays inert without swipeToDismiss (no listeners, no behavior)', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose}>
        <p>Sheet content</p>
      </BottomSheet>
    );
    const sheet = screen.getByRole('dialog');
    mockSheetHeight(sheet, 400);
    // 超阈值的完整拖拽序列：无位移、无关闭——pointer 监听根本未挂
    fireEvent.pointerDown(sheet, { pointerId: 1, clientY: 100, button: 0 });
    fireEvent.pointerMove(sheet, { pointerId: 1, clientY: 400 });
    fireEvent.pointerUp(sheet, { pointerId: 1, clientY: 400 });
    expect(sheet.style.transform).toBe('');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });
});

// ─── 虚拟键盘避让 ──────────────────────────────────────────────────
/**
 * jsdom 没有 visualViewport——按组件的真实消费面 stub：可变
 * height/offsetTop + resize/scroll 监听（dispatch 同步派发）。
 * 键盘弹出 = 视口高度收缩；键盘上推 = offsetTop 增加。
 */
function installVisualViewport(initial: { height: number; offsetTop?: number }) {
  const listeners = {
    resize: new Set<() => void>(),
    scroll: new Set<() => void>(),
  };
  const base = {
    width: 1024,
    height: initial.height,
    offsetLeft: 0,
    offsetTop: initial.offsetTop ?? 0,
    scale: 1,
    pageTop: 0,
    pageLeft: 0,
    onresize: null,
    onscroll: null,
    addEventListener: (type: string, listener: () => void) => {
      if (type === 'resize' || type === 'scroll') listeners[type].add(listener);
    },
    removeEventListener: (type: string, listener: () => void) => {
      if (type === 'resize' || type === 'scroll') listeners[type].delete(listener);
    },
  };
  Object.defineProperty(window, 'visualViewport', {
    value: base,
    configurable: true,
  });
  return {
    /** 模拟键盘弹出/收起：视口高度变化并派发 resize。 */
    resize(nextHeight: number) {
      base.height = nextHeight;
      for (const listener of [...listeners.resize]) listener();
    },
    /** 模拟键盘上推视口：offsetTop 变化并派发 scroll。 */
    pushBy(nextOffsetTop: number) {
      base.offsetTop = nextOffsetTop;
      for (const listener of [...listeners.scroll]) listener();
    },
    listenerCount: () => listeners.resize.size + listeners.scroll.size,
  };
}

describe('BottomSheet virtual keyboard', () => {
  it('lifts the sheet above the keyboard when an input gets focus', () => {
    const keyboard = installVisualViewport({ height: window.innerHeight });
    render(
      <BottomSheet open virtualKeyboard>
        <input aria-label="Name" />
      </BottomSheet>
    );
    const sheet = screen.getByRole('dialog');

    // 键盘未弹出：inset 0，仅 dvh 基线（无 transform 写入）。
    // jsdom 的 cssstyle 会把 calc(100dvh - 0px) 归一化去掉 calc 壳，
    // 断言取语义片段而非整个序列化串
    expect(sheet.style.maxHeight).toContain('80dvh');
    expect(sheet.style.maxHeight).toContain('100dvh - 0px');
    expect(sheet.style.transform).toBe('');

    // 聚焦 input + 键盘弹出（视口收缩 400 → inset = innerHeight - 400）
    fireEvent.focus(screen.getByLabelText('Name'));
    const inset = window.innerHeight - 400;
    act(() => keyboard.resize(400));

    // inset 以自定义属性暴露，同时驱动上移与最大高度钳制
    expect(sheet.style.getPropertyValue('--haze-sheet-kb-inset')).toBe(
      `${inset}px`
    );
    expect(sheet.style.maxHeight).toContain(`100dvh - ${inset}px`);
    expect(sheet.style.transform).toBe(`translateY(-${inset}px)`);

    // 键盘收起：回到基线
    act(() => keyboard.resize(window.innerHeight));
    expect(sheet.style.getPropertyValue('--haze-sheet-kb-inset')).toBe('0px');
    expect(sheet.style.transform).toBe('');
  });

  it('accounts for visualViewport.offsetTop when the keyboard pushes the viewport', () => {
    const keyboard = installVisualViewport({ height: window.innerHeight });
    render(
      <BottomSheet open virtualKeyboard>
        <p>Sheet content</p>
      </BottomSheet>
    );
    const sheet = screen.getByRole('dialog');
    act(() => keyboard.resize(500));
    act(() => keyboard.pushBy(100));
    // inset = innerHeight - 500 - 100（上推的偏移同样算键盘占用）
    expect(sheet.style.transform).toBe(
      `translateY(-${window.innerHeight - 500 - 100}px)`
    );
  });

  it('degrades to the dvh baseline when visualViewport is missing', () => {
    // 无 stub：SSR/jsdom 环境静默降级，不抛错
    render(
      <BottomSheet open virtualKeyboard>
        <p>Sheet content</p>
      </BottomSheet>
    );
    const sheet = screen.getByRole('dialog');
    expect(sheet.style.maxHeight).toContain('80dvh');
    expect(sheet.style.maxHeight).toContain('100dvh - 0px');
    expect(sheet.style.transform).toBe('');
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('stops listening once the sheet is dismissed', async () => {
    const keyboard = installVisualViewport({ height: window.innerHeight });
    const onClose = vi.fn();
    render(
      <BottomSheet open virtualKeyboard swipeToDismiss onClose={onClose}>
        <p>Sheet content</p>
      </BottomSheet>
    );
    const sheet = screen.getByRole('dialog');
    expect(keyboard.listenerCount()).toBe(2); // resize + scroll

    fireEvent.keyDown(sheet, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(keyboard.listenerCount()).toBe(0);

    // 卸载后的视口变化不再触达组件（无监听可派发）
    expect(() => act(() => keyboard.resize(300))).not.toThrow();
  });

  it('composes the drag offset with the keyboard inset', () => {
    const keyboard = installVisualViewport({ height: window.innerHeight });
    const onClose = vi.fn();
    render(
      <BottomSheet open virtualKeyboard swipeToDismiss onClose={onClose}>
        <p>Sheet content</p>
      </BottomSheet>
    );
    const sheet = screen.getByRole('dialog');
    const inset = window.innerHeight - 400;
    act(() => keyboard.resize(400));
    mockSheetHeight(sheet, 400);

    fireEvent.pointerDown(sheet, { pointerId: 1, clientY: 100, button: 0 });
    fireEvent.pointerMove(sheet, { pointerId: 1, clientY: 140 }); // 40 < 88
    // 拖拽位移叠加在键盘上移之上：40 - inset
    expect(sheet.style.transform).toBe(`translateY(${40 - inset}px)`);
    fireEvent.pointerUp(sheet, { pointerId: 1, clientY: 140 });
    // 回弹落点是键盘上方的 resting 位，而不是 0
    expect(sheet.style.transform).toBe(`translateY(-${inset}px)`);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('has no axe violations with gestures and keyboard awareness enabled', async () => {
    const { axe } = await import('jest-axe');
    render(
      <BottomSheet open swipeToDismiss virtualKeyboard aria-label="Actions">
        <h2>Sheet title</h2>
        <input aria-label="Name" />
        <button type="button">Sheet action</button>
      </BottomSheet>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
