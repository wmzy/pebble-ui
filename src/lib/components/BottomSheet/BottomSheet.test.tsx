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
