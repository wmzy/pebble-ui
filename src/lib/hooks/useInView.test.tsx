import { act, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';

import { useInView } from './useInView';

// jsdom 30 没有 IntersectionObserver——按真实回调形态自 stub：
// 构造器记录实例，trigger 同步派发 entries（浏览器回调是异步微任务，
// 这里在 act 内同步触发等价驱动 setState）。
type MockEntry = { isIntersecting: boolean; target: Element };

type MockObserver = {
  observed: Element[];
  disconnected: boolean;
  trigger: (isIntersecting: boolean) => void;
};

function installIntersectionObserver() {
  const observers: MockObserver[] = [];

  class FakeIntersectionObserver {
    readonly observed: Element[] = [];
    disconnected = false;
    constructor(
      private readonly callback: (entries: MockEntry[], observer: unknown) => void
    ) {
      observers.push(this);
    }
    observe(el: Element): void {
      this.observed.push(el);
    }
    unobserve(): void {
      // 测试不需要
    }
    disconnect(): void {
      this.disconnected = true;
    }
    trigger(isIntersecting: boolean): void {
      for (const target of this.observed) {
        this.callback(
          [{ isIntersecting, target }],
          this
        );
      }
    }
  }

  vi.stubGlobal(
    'IntersectionObserver',
    FakeIntersectionObserver
  );
  return {
    observers,
    restore: () => vi.unstubAllGlobals(),
  };
}

function Probe({ once = false }: { once?: boolean }) {
  const [ref, inView] = useInView<HTMLDivElement>({ once });
  return <div ref={ref} data-testid='probe' data-in-view={inView ? 'yes' : 'no'} />;
}

const viewOf = (container: HTMLElement): string =>
  container.querySelector('[data-testid="probe"]')?.getAttribute('data-in-view') ?? '';

describe('useInView', () => {
  it('starts false and follows intersection transitions', () => {
    const io = installIntersectionObserver();
    try {
      const { container } = render(<Probe />);
      expect(viewOf(container)).toBe('no');

      act(() => {
        io.observers[0]!.trigger(true);
      });
      expect(viewOf(container)).toBe('yes');

      act(() => {
        io.observers[0]!.trigger(false);
      });
      expect(viewOf(container)).toBe('no');
    } finally {
      io.restore();
    }
  });

  it('observes the element the ref is attached to', () => {
    const io = installIntersectionObserver();
    try {
      const { container } = render(<Probe />);
      expect(io.observers).toHaveLength(1);
      expect(io.observers[0]!.observed).toEqual([container.querySelector('div')]);
    } finally {
      io.restore();
    }
  });

  it('freezes true and disconnects after first hit when once is set', () => {
    const io = installIntersectionObserver();
    try {
      const { container } = render(<Probe once />);
      act(() => {
        io.observers[0]!.trigger(true);
      });
      expect(viewOf(container)).toBe('yes');
      expect(io.observers[0]!.disconnected).toBe(true);

      // 命中后离开视口不再翻转
      act(() => {
        io.observers[0]!.trigger(false);
      });
      expect(viewOf(container)).toBe('yes');
    } finally {
      io.restore();
    }
  });

  it('disconnects on unmount', () => {
    const io = installIntersectionObserver();
    try {
      const { unmount } = render(<Probe />);
      unmount();
      expect(io.observers[0]!.disconnected).toBe(true);
    } finally {
      io.restore();
    }
  });

  it('stays false without throwing when IntersectionObserver is missing', () => {
    // jsdom 默认无 IntersectionObserver（未 stub），SSR 服务端渲染同理：
    // effect 不跑、快照恒 false
    expect(() => renderToString(<Probe />)).not.toThrow();
    expect(renderToString(<Probe />)).toContain('data-in-view="no"');

    const { container } = render(<Probe />);
    expect(viewOf(container)).toBe('no');
  });
});
