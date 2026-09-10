import type { DialogHandle } from './Dialog';

import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { useControl } from 'react-use-control';

import Dialog from './Dialog';

beforeEach(() => {
  // jsdom does not implement showModal/close for HTMLDialogElement
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

describe('Dialog', () => {
  it('renders a dialog element', () => {
    render(<Dialog>Content</Dialog>);
    expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Dialog open>Dialog body</Dialog>);
    expect(screen.getByText('Dialog body')).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<Dialog className="custom">Content</Dialog>);
    expect(screen.getByRole('dialog', { hidden: true })).toHaveClass('custom');
  });

  it('reflects open state via data-state', () => {
    render(<Dialog open>Dialog body</Dialog>);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'open');
  });

  it('calls onClose when dialog fires close event', () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose}>Content</Dialog>);
    const dialog = screen.getByRole('dialog');
    act(() => {
      dialog.dispatchEvent(new Event('close', { bubbles: false }));
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('fires onClose exactly once when clicking the backdrop', async () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose}>Content</Dialog>);
    const dialog = screen.getByRole('dialog');
    act(() => {
      dialog.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      );
    });
    // backdrop 点击只 setOpen(false)；onClose 由 effect 中 el.close() 触发
    // 的原生 close 事件统一发出——退场跨 rAF，异步等待。
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('prevents native cancel and closes through the animated path on Esc', async () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose}>Content</Dialog>);
    const dialog = screen.getByRole<HTMLDialogElement>('dialog');
    const cancel = new Event('cancel', { cancelable: true });
    act(() => {
      // 模拟浏览器 Esc 行为：先发 cancel 请求关闭
      dialog.dispatchEvent(cancel);
    });
    // 原生立即关闭被拦截，统一改走 React 状态 → 退场动画 → el.close()
    expect(cancel.defaultPrevented).toBe(true);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('fires onClose exactly once on programmatic close()', () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose}>Content</Dialog>);
    const dialog = screen.getByRole<HTMLDialogElement>('dialog');
    act(() => {
      dialog.close();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open during the exit and closes it after it settles', async () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose}>Content</Dialog>);
    const dialog = screen.getByRole<HTMLDialogElement>('dialog');
    expect(dialog).toHaveAttribute('open');
    act(() => {
      fireEvent.click(dialog);
    });
    // 状态已翻 closed，但退场期间 open 属性保留（等待 whenExitSettles）
    expect(dialog).toHaveAttribute('data-state', 'closed');
    expect(dialog).toHaveAttribute('open');
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('labels the dialog via aria-labelledby when title is set', () => {
    render(
      <Dialog open title="Confirm action">
        Content
      </Dialog>
    );
    const heading = screen.getByRole('heading', { name: 'Confirm action' });
    expect(heading.tagName).toBe('H2');
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-labelledby',
      heading.id
    );
  });

  it('does not set aria-labelledby without a title', () => {
    render(<Dialog open>Content</Dialog>);
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
  });

  it('moves initial focus into the dialog when opened', () => {
    function Harness() {
      const [, setOpen, openCtrl] = useControl(undefined, false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open dialog</button>
          <Dialog open={openCtrl}>
            <button type="button">Inner</button>
          </Dialog>
        </>
      );
    }
    render(<Harness />);
    act(() => {
      fireEvent.click(screen.getByText('Open dialog'));
    });
    expect(screen.getByText('Inner')).toHaveFocus();
  });

  it('restores focus to the opener when the dialog closes', () => {
    function Harness() {
      // Dialog 的 open 传 Control 才是受控语义（普通 boolean 只是初值）
      const [, setOpen, openCtrl] = useControl(undefined, false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open dialog</button>
          <Dialog open={openCtrl} onClose={() => setOpen(false)}>
            <button type="button">Inner</button>
          </Dialog>
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByText('Open dialog');
    opener.focus();
    act(() => {
      fireEvent.click(opener);
    });
    // showModal 在真实浏览器会把焦点移进 dialog；jsdom 不会，手动模拟，
    // 这样下面的断言才真正验证“归还”而不是焦点从未离开。
    act(() => {
      screen.getByText('Inner').focus();
    });
    expect(screen.getByText('Inner')).toHaveFocus();
    // Esc/cancel、backdrop 点击、close() 都以原生 close 事件收口
    // （先取引用：关闭后 dialog 隐藏，getByRole 查不到了）
    const dialog = screen.getByRole('dialog');
    act(() => {
      dialog.dispatchEvent(new Event('close'));
    });
    expect(opener).toHaveFocus();
  });

  it('has no axe violations when open', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Dialog open title="Confirm action">
        <p>Dialog body</p>
      </Dialog>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Dialog imperative handle', () => {
  it('opens and closes through the handle', async () => {
    const ref = createRef<DialogHandle>();
    render(
      <Dialog ref={ref}>
        <p>Dialog body</p>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).not.toHaveAttribute('open');

    act(() => ref.current!.open());
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('data-state', 'open');

    act(() => ref.current!.close());
    // 状态先翻 closed；open 属性等退场 settle 后由 el.close() 移除
    expect(dialog).toHaveAttribute('data-state', 'closed');
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('fires onClose exactly once when closed through the handle', async () => {
    const onClose = vi.fn();
    const ref = createRef<DialogHandle>();
    render(
      <Dialog ref={ref} open onClose={onClose}>
        <p>Dialog body</p>
      </Dialog>
    );
    act(() => ref.current!.close());
    // handle.close 只写状态；onClose 由退场后 el.close() 触发的原生
    // close 事件单出口发出——不会双发。
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('drives a controlled open control through the handle', async () => {
    function Harness() {
      const [, setOpen, openCtrl] = useControl(undefined, false);
      const ref = createRef<DialogHandle>();
      return (
        <>
          <button onClick={() => setOpen(true)}>Open via control</button>
          <Dialog ref={ref} open={openCtrl}>
            <button type="button" onClick={() => ref.current!.close()}>
              Close via handle
            </button>
          </Dialog>
        </>
      );
    }
    render(<Harness />);
    const dialog = screen.getByRole('dialog', { hidden: true });

    act(() => {
      fireEvent.click(screen.getByText('Open via control'));
    });
    expect(dialog).toHaveAttribute('open');

    act(() => {
      fireEvent.click(screen.getByText('Close via handle'));
    });
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('focuses the opener through focusTrigger() while open', () => {
    const ref = createRef<DialogHandle>();
    render(
      <>
        <button onClick={() => ref.current!.open()}>Open dialog</button>
        <Dialog ref={ref}>
          <button type="button">Inner</button>
        </Dialog>
      </>
    );
    const opener = screen.getByText('Open dialog');
    opener.focus();
    act(() => {
      fireEvent.click(opener);
    });
    // autoFocus 把焦点移进了 dialog（jsdom 的 showModal 不动焦点，
    // scope 的 focusFirst 会）——focusTrigger 应能从内部把焦点带回 opener
    expect(screen.getByText('Inner')).toHaveFocus();
    act(() => ref.current!.focusTrigger());
    expect(opener).toHaveFocus();
  });

  it('does not crash when handle methods run after unmount', () => {
    const ref = createRef<DialogHandle>();
    const { unmount } = render(
      <Dialog ref={ref} open>
        <p>Dialog body</p>
      </Dialog>
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

describe('Dialog view transitions', () => {
  it('wraps the open flip in startViewTransition and commits it synchronously', () => {
    const statesAfterUpdate: (string | undefined)[] = [];
    const spy = stubStartViewTransition(statesAfterUpdate);
    const ref = createRef<DialogHandle>();
    render(
      <Dialog ref={ref} viewTransition>
        <p>Dialog body</p>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('data-state', 'closed');

    act(() => ref.current!.open());

    expect(spy).toHaveBeenCalledTimes(1);
    // update callback 返回时 DOM 已是新状态——flushSync 的同步提交语义
    expect(statesAfterUpdate).toEqual(['open']);
    expect(dialog).toHaveAttribute('data-state', 'open');
  });

  it('wraps the close flip (backdrop click) without double transitions', async () => {
    const onClose = vi.fn();
    const spy = stubStartViewTransition([]);
    render(
      <Dialog open viewTransition onClose={onClose}>
        <p>Dialog body</p>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog');
    act(() => {
      fireEvent.click(dialog);
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(dialog).toHaveAttribute('data-state', 'closed');
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    // 退场后的原生 close 事件只做状态同步，不再包第二次 VT（DOM 已
    // 关闭，两张快照相同）
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('wraps Esc and the imperative handle close the same way', async () => {
    const spy = stubStartViewTransition([]);
    const ref = createRef<DialogHandle>();
    render(
      <Dialog ref={ref} viewTransition>
        <p>Dialog body</p>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { hidden: true });

    act(() => ref.current!.open());
    expect(spy).toHaveBeenCalledTimes(1);

    // Esc：cancel 被拦下，翻转走 VT（第 2 次）
    const cancel = new Event('cancel', { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));

    // 退场 settle 后重开（第 3 次）、handle.close（第 4 次）
    act(() => ref.current!.open());
    expect(spy).toHaveBeenCalledTimes(3);
    act(() => ref.current!.close());
    expect(spy).toHaveBeenCalledTimes(4);
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('does not start a view transition by default', () => {
    const statesAfterUpdate: (string | undefined)[] = [];
    const spy = stubStartViewTransition(statesAfterUpdate);
    render(<Dialog open>Content</Dialog>);
    const dialog = screen.getByRole('dialog');
    act(() => {
      fireEvent.click(dialog);
    });
    expect(spy).not.toHaveBeenCalled();
    // 无 VT：状态直接落地，不经 update callback
    expect(statesAfterUpdate).toEqual([]);
    expect(dialog).toHaveAttribute('data-state', 'closed');
  });

  it('skips startViewTransition under prefers-reduced-motion', async () => {
    const reducedMotion = installReducedMotionMedia();
    try {
      const spy = stubStartViewTransition([]);
      const ref = createRef<DialogHandle>();
      render(
        <Dialog ref={ref} viewTransition>
          <p>Dialog body</p>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog', { hidden: true });

      act(() => reducedMotion.setMatches(true));
      act(() => ref.current!.open());
      expect(spy).not.toHaveBeenCalled();
      expect(dialog).toHaveAttribute('data-state', 'open');

      act(() => ref.current!.close());
      expect(spy).not.toHaveBeenCalled();
      await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    } finally {
      reducedMotion.uninstall();
    }
  });

  it('falls back to direct flips when the engine lacks startViewTransition', async () => {
    // 无 stub（afterEach 也保证清理）：jsdom 原生没有该 API
    expect(typeof document.startViewTransition).not.toBe('function');
    const ref = createRef<DialogHandle>();
    render(
      <Dialog ref={ref} viewTransition>
        <p>Dialog body</p>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    act(() => ref.current!.open());
    expect(dialog).toHaveAttribute('data-state', 'open');
    act(() => ref.current!.close());
    expect(dialog).toHaveAttribute('data-state', 'closed');
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });
});

describe('Dialog classNames slots', () => {
  it('applies root to the dialog element and header to the title', () => {
    render(
      <Dialog
        title="Slot title"
        classNames={{ root: 'custom-root', header: 'custom-header' }}
      >
        Body
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveClass('custom-root');
    expect(dialog.querySelector('h2')).toHaveClass('custom-header');
  });

  it('keeps the class lists untouched when classNames is omitted', () => {
    render(<Dialog title="Slot title">Body</Dialog>);
    const dialog = screen.getByRole('dialog', { hidden: true });
    const header = dialog.querySelector('h2')!;
    // classnames() drops the absent slots before joining: no stray
    // whitespace segments may appear on either part.
    for (const el of [dialog, header]) {
      expect(el.className).toBe(el.className.trim());
      expect(el.className).not.toContain('  ');
    }
  });
});
