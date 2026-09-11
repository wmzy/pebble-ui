import { act, render, screen } from '@testing-library/react';

import CountUp from './CountUp';

// jsdom 没有 matchMedia——装一个恒定 matches 的 stub 驱动
// usePrefersReducedMotion（useMediaQuery 已有缺失守卫，这里只为给它
// 一个可控的查询结果）。
function installReducedMotion(matches: boolean) {
  window.matchMedia = (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => true,
  });
  return () => {
    Reflect.deleteProperty(window, 'matchMedia');
  };
}

// 假 rAF：只排队回调，测试用显式时间戳逐帧驱动。
type FrameCallback = (now: number) => void;

function installFakeRaf() {
  const frames: FrameCallback[] = [];
  const raf = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
  const cancel = vi
    .spyOn(window, 'cancelAnimationFrame')
    .mockImplementation(() => undefined);
  return {
    raf,
    cancel,
    /** 跑掉当前排队的帧（新调度的帧留给下一次调用）。 */
    flush(now: number) {
      for (const frame of frames.splice(0)) {
        act(() => frame(now));
      }
    },
    pending: () => frames.length,
  };
}

describe('CountUp', () => {
  it('animates from `from` to `to` across frames and lands exactly on the target', () => {
    const raf = installFakeRaf();
    try {
      render(<CountUp to={100} duration={1200} />);
      // 挂载帧：初始值 from=0
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(raf.pending()).toBe(1);

      const t0 = performance.now();
      // 半程：ease-out 下应已越过中点
      raf.flush(t0 + 600);
      const mid = Number(screen.getByText(/^\d+$/).textContent);
      expect(mid).toBeGreaterThan(50);
      expect(mid).toBeLessThan(100);

      // 终点：钳位到 t=1，精确落点
      raf.flush(t0 + 5000);
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(raf.pending()).toBe(0);
    } finally {
      raf.raf.mockRestore();
      raf.cancel.mockRestore();
    }
  });

  it('jumps straight to `to` under prefers-reduced-motion', () => {
    const raf = installFakeRaf();
    const uninstall = installReducedMotion(true);
    try {
      render(<CountUp to={1234} />);
      expect(screen.getByText('1,234')).toBeInTheDocument();
      expect(raf.raf).not.toHaveBeenCalled();
    } finally {
      uninstall();
      raf.raf.mockRestore();
      raf.cancel.mockRestore();
    }
  });

  it('formats decimals with the default grouping formatter', () => {
    const uninstall = installReducedMotion(true);
    try {
      render(<CountUp to={1234.5678} decimals={2} />);
      expect(screen.getByText('1,234.57')).toBeInTheDocument();
    } finally {
      uninstall();
    }
  });

  it('applies a custom format', () => {
    const uninstall = installReducedMotion(true);
    try {
      render(<CountUp to={250} format={(n) => `$${n.toFixed(0)}`} />);
      expect(screen.getByText('$250')).toBeInTheDocument();
    } finally {
      uninstall();
    }
  });

  it('re-animates from the currently shown value when `to` changes', () => {
    const raf = installFakeRaf();
    try {
      const { rerender } = render(<CountUp to={100} duration={1200} />);
      const t0 = performance.now();
      raf.flush(t0 + 5000);
      expect(screen.getByText('100')).toBeInTheDocument();

      rerender(<CountUp to={300} duration={1200} />);
      raf.flush(t0 + 10000 + 600);
      // 半程值 ≈ 100 + 200×0.875 = 275（若错误地从 0 重来则是 262）
      const mid = Number(screen.getByText(/^\d+$/).textContent);
      expect(mid).toBeGreaterThan(270);
      raf.flush(t0 + 10000 + 5000);
      expect(screen.getByText('300')).toBeInTheDocument();
    } finally {
      raf.raf.mockRestore();
      raf.cancel.mockRestore();
    }
  });

  it('autostart=false renders `from` until `to` changes', () => {
    const raf = installFakeRaf();
    try {
      const { rerender } = render(<CountUp to={50} from={7} autostart={false} />);
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(raf.raf).not.toHaveBeenCalled();

      rerender(<CountUp to={50} from={7} autostart={false} duration={800} />);
      const t0 = performance.now();
      raf.flush(t0 + 5000);
      expect(screen.getByText('50')).toBeInTheDocument();
    } finally {
      raf.raf.mockRestore();
      raf.cancel.mockRestore();
    }
  });

  it('cancels the pending frame on unmount', () => {
    const raf = installFakeRaf();
    try {
      const { unmount } = render(<CountUp to={100} />);
      expect(raf.pending()).toBe(1);
      unmount();
      expect(raf.cancel).toHaveBeenCalledWith(1);
    } finally {
      raf.raf.mockRestore();
      raf.cancel.mockRestore();
    }
  });

  it('merges className and forwards native props', () => {
    render(<CountUp to={5} duration={0} className='custom' data-testid='n' />);
    const el = screen.getByTestId('n');
    expect(el).toHaveClass('custom');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveTextContent('5');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const uninstall = installReducedMotion(true);
    try {
      const { container } = render(
        <>
          <CountUp to={9821} />
          <CountUp to={98.7} decimals={1} />
        </>,
      );
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    } finally {
      uninstall();
    }
  });
});
