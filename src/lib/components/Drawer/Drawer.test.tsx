import type { DrawerHandle } from './Drawer';

import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { useControl } from 'react-use-control';

import Drawer from './Drawer';

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement
  ) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (
    this: HTMLDialogElement
  ) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
});

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

describe('Drawer', () => {
  it('renders a dialog element', () => {
    render(<Drawer>Content</Drawer>);
    expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Drawer open>Drawer body</Drawer>);
    expect(screen.getByText('Drawer body')).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<Drawer className="custom">Content</Drawer>);
    expect(screen.getByRole('dialog', { hidden: true })).toHaveClass('custom');
  });

  it('reflects open state via data-state', () => {
    render(<Drawer open>Drawer body</Drawer>);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'open');
  });

  it('calls onClose when dialog fires close event', () => {
    const onClose = vi.fn();
    render(<Drawer open onClose={onClose}>Content</Drawer>);
    const dialog = screen.getByRole('dialog');
    act(() => {
      dialog.dispatchEvent(new Event('close', { bubbles: false }));
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when clicking backdrop', async () => {
    const onClose = vi.fn();
    render(<Drawer open onClose={onClose}>Content</Drawer>);
    const dialog = screen.getByRole('dialog');
    act(() => {
      dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    // backdrop 点击只 setOpen(false)；onClose 由 effect 中 el.close() 触发
    // 的原生 close 事件统一发出——退场跨 rAF，异步等待。
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('prevents native cancel and closes through the animated path on Esc', async () => {
    const onClose = vi.fn();
    render(<Drawer open onClose={onClose}>Content</Drawer>);
    const drawer = screen.getByRole<HTMLDialogElement>('dialog');
    const cancel = new Event('cancel', { cancelable: true });
    act(() => {
      drawer.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('keeps the drawer open during the exit and closes it after it settles', async () => {
    const onClose = vi.fn();
    render(<Drawer open onClose={onClose}>Content</Drawer>);
    const drawer = screen.getByRole<HTMLDialogElement>('dialog');
    expect(drawer).toHaveAttribute('open');
    act(() => {
      fireEvent.click(drawer);
    });
    expect(drawer).toHaveAttribute('data-state', 'closed');
    expect(drawer).toHaveAttribute('open');
    await waitFor(() => expect(drawer).not.toHaveAttribute('open'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('moves initial focus into the drawer when opened', () => {
    function Harness() {
      const [, setOpen, openCtrl] = useControl(undefined, false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open drawer</button>
          <Drawer open={openCtrl}>
            <button type="button">Inner</button>
          </Drawer>
        </>
      );
    }
    render(<Harness />);
    act(() => {
      fireEvent.click(screen.getByText('Open drawer'));
    });
    expect(screen.getByText('Inner')).toHaveFocus();
  });

  it('restores focus to the opener when the drawer closes', () => {
    function Harness() {
      const [, setOpen, openCtrl] = useControl(undefined, false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open drawer</button>
          <Drawer open={openCtrl} onClose={() => setOpen(false)}>
            <button type="button">Inner</button>
          </Drawer>
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByText('Open drawer');
    opener.focus();
    act(() => {
      fireEvent.click(opener);
    });
    act(() => {
      screen.getByText('Inner').focus();
    });
    expect(screen.getByText('Inner')).toHaveFocus();
    const drawer = screen.getByRole('dialog');
    act(() => {
      drawer.dispatchEvent(new Event('close'));
    });
    expect(opener).toHaveFocus();
  });

  it('has no axe violations when open', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Drawer open>
        <p>Drawer body</p>
      </Drawer>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Drawer imperative handle', () => {
  it('opens and closes through the handle', async () => {
    const ref = createRef<DrawerHandle>();
    render(
      <Drawer ref={ref}>
        <p>Drawer body</p>
      </Drawer>
    );
    const drawer = screen.getByRole('dialog', { hidden: true });
    expect(drawer).not.toHaveAttribute('open');

    act(() => ref.current!.open());
    expect(drawer).toHaveAttribute('open');
    expect(drawer).toHaveAttribute('data-state', 'open');

    act(() => ref.current!.close());
    expect(drawer).toHaveAttribute('data-state', 'closed');
    await waitFor(() => expect(drawer).not.toHaveAttribute('open'));
  });

  it('fires onClose exactly once when closed through the handle', async () => {
    const onClose = vi.fn();
    const ref = createRef<DrawerHandle>();
    render(
      <Drawer ref={ref} open onClose={onClose}>
        <p>Drawer body</p>
      </Drawer>
    );
    act(() => ref.current!.close());
    // handle.close 只写状态；onClose 由退场后 el.close() 触发的原生
    // close 事件单出口发出——不会双发。
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('drives a controlled open control through the handle', async () => {
    function Harness() {
      const [, setOpen, openCtrl] = useControl(undefined, false);
      const ref = createRef<DrawerHandle>();
      return (
        <>
          <button onClick={() => setOpen(true)}>Open via control</button>
          <Drawer ref={ref} open={openCtrl}>
            <button type="button" onClick={() => ref.current!.close()}>
              Close via handle
            </button>
          </Drawer>
        </>
      );
    }
    render(<Harness />);
    const drawer = screen.getByRole('dialog', { hidden: true });

    act(() => {
      fireEvent.click(screen.getByText('Open via control'));
    });
    expect(drawer).toHaveAttribute('open');

    act(() => {
      fireEvent.click(screen.getByText('Close via handle'));
    });
    await waitFor(() => expect(drawer).not.toHaveAttribute('open'));
  });

  it('focuses the opener through focusTrigger() while open', () => {
    const ref = createRef<DrawerHandle>();
    render(
      <>
        <button onClick={() => ref.current!.open()}>Open drawer</button>
        <Drawer ref={ref}>
          <button type="button">Inner</button>
        </Drawer>
      </>
    );
    const opener = screen.getByText('Open drawer');
    opener.focus();
    act(() => {
      fireEvent.click(opener);
    });
    // scope 的 autoFocus 把焦点移进 drawer；focusTrigger 从内部带回 opener
    expect(screen.getByText('Inner')).toHaveFocus();
    act(() => ref.current!.focusTrigger());
    expect(opener).toHaveFocus();
  });

  it('does not crash when handle methods run after unmount', () => {
    const ref = createRef<DrawerHandle>();
    const { unmount } = render(
      <Drawer ref={ref} open>
        <p>Drawer body</p>
      </Drawer>
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
 */
function stubStartViewTransition(statesAfterUpdate: (string | undefined)[]) {
  const spy = vi.fn((update: () => void) => {
    update();
    // flushSync 的效果就体现在这里：update 返回时新状态已同步提交进
    // DOM（没有 flushSync 的话此刻还是旧值）
    statesAfterUpdate.push(
      screen.getByRole('dialog', { hidden: true }).dataset.state
    );
    return {
      ready: Promise.resolve(),
      finished: Promise.resolve(),
    } as unknown as ViewTransition;
  });
  document.startViewTransition = spy;
  return spy;
}

describe('Drawer view transitions', () => {
  it('wraps the open flip in startViewTransition and commits it synchronously', () => {
    const statesAfterUpdate: (string | undefined)[] = [];
    const spy = stubStartViewTransition(statesAfterUpdate);
    const ref = createRef<DrawerHandle>();
    render(
      <Drawer ref={ref} viewTransition>
        <p>Drawer body</p>
      </Drawer>
    );
    const drawer = screen.getByRole('dialog', { hidden: true });
    expect(drawer).toHaveAttribute('data-state', 'closed');

    act(() => ref.current!.open());

    expect(spy).toHaveBeenCalledTimes(1);
    // update callback 返回时 DOM 已是新状态——flushSync 的同步提交语义
    expect(statesAfterUpdate).toEqual(['open']);
    expect(drawer).toHaveAttribute('data-state', 'open');
  });

  it('wraps the close flip (backdrop click) without double transitions', async () => {
    const onClose = vi.fn();
    const spy = stubStartViewTransition([]);
    render(
      <Drawer open viewTransition onClose={onClose}>
        <p>Drawer body</p>
      </Drawer>
    );
    const drawer = screen.getByRole('dialog');
    act(() => {
      fireEvent.click(drawer);
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(drawer).toHaveAttribute('data-state', 'closed');
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(drawer).not.toHaveAttribute('open'));
    // 退场后的原生 close 事件只做状态同步，不再包第二次 VT（DOM 已
    // 关闭，两张快照相同）
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('wraps Esc and the imperative handle close the same way', async () => {
    const spy = stubStartViewTransition([]);
    const ref = createRef<DrawerHandle>();
    render(
      <Drawer ref={ref} viewTransition>
        <p>Drawer body</p>
      </Drawer>
    );
    const drawer = screen.getByRole('dialog', { hidden: true });

    act(() => ref.current!.open());
    expect(spy).toHaveBeenCalledTimes(1);

    // Esc：cancel 被拦下，翻转走 VT（第 2 次）
    const cancel = new Event('cancel', { cancelable: true });
    act(() => {
      drawer.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(drawer).not.toHaveAttribute('open'));

    // 退场 settle 后重开（第 3 次）、handle.close（第 4 次）
    act(() => ref.current!.open());
    expect(spy).toHaveBeenCalledTimes(3);
    act(() => ref.current!.close());
    expect(spy).toHaveBeenCalledTimes(4);
    await waitFor(() => expect(drawer).not.toHaveAttribute('open'));
  });

  it('does not start a view transition by default', () => {
    const statesAfterUpdate: (string | undefined)[] = [];
    const spy = stubStartViewTransition(statesAfterUpdate);
    render(<Drawer open>Content</Drawer>);
    const drawer = screen.getByRole('dialog');
    act(() => {
      fireEvent.click(drawer);
    });
    expect(spy).not.toHaveBeenCalled();
    // 无 VT：状态直接落地，不经 update callback
    expect(statesAfterUpdate).toEqual([]);
    expect(drawer).toHaveAttribute('data-state', 'closed');
  });

  it('skips startViewTransition under prefers-reduced-motion', async () => {
    const reducedMotion = installReducedMotionMedia();
    try {
      const spy = stubStartViewTransition([]);
      const ref = createRef<DrawerHandle>();
      render(
        <Drawer ref={ref} viewTransition>
          <p>Drawer body</p>
        </Drawer>
      );
      const drawer = screen.getByRole('dialog', { hidden: true });

      act(() => reducedMotion.setMatches(true));
      act(() => ref.current!.open());
      expect(spy).not.toHaveBeenCalled();
      expect(drawer).toHaveAttribute('data-state', 'open');

      act(() => ref.current!.close());
      expect(spy).not.toHaveBeenCalled();
      await waitFor(() => expect(drawer).not.toHaveAttribute('open'));
    } finally {
      reducedMotion.uninstall();
    }
  });

  it('falls back to direct flips when the engine lacks startViewTransition', async () => {
    // 无 stub（afterEach 也保证清理）：jsdom 原生没有该 API
    expect(typeof document.startViewTransition).not.toBe('function');
    const ref = createRef<DrawerHandle>();
    render(
      <Drawer ref={ref} viewTransition>
        <p>Drawer body</p>
      </Drawer>
    );
    const drawer = screen.getByRole('dialog', { hidden: true });
    act(() => ref.current!.open());
    expect(drawer).toHaveAttribute('data-state', 'open');
    act(() => ref.current!.close());
    expect(drawer).toHaveAttribute('data-state', 'closed');
    await waitFor(() => expect(drawer).not.toHaveAttribute('open'));
  });
});
