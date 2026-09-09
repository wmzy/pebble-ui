import { fireEvent, render, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';

import { hotkey, useHotkeys } from './useHotkeys';

// jsdom 30 的 navigator.platform 是原型上的空串 getter——用自有属性遮蔽后
// 删除还原，与 useClipboard 测试 stub navigator.clipboard 同一模式。
function stubPlatform(value: string) {
  Object.defineProperty(navigator, 'platform', { value, configurable: true });
  return () => {
    Reflect.deleteProperty(navigator, 'platform');
  };
}

describe('useHotkeys', () => {
  it('resolves mod to meta on mac and ctrl elsewhere', async () => {
    const user = userEvent.setup();
    const onMac = vi.fn();
    const restoreMac = stubPlatform('MacIntel');
    try {
      const { unmount } = renderHook(() => useHotkeys({ 'mod+k': onMac }));
      await user.keyboard('{Meta>}k{/Meta}');
      expect(onMac).toHaveBeenCalledTimes(1);
      unmount();
    } finally {
      restoreMac();
    }

    const onOther = vi.fn();
    const restoreWin = stubPlatform('Win32');
    try {
      renderHook(() => useHotkeys({ 'mod+k': onOther }));
      fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
      expect(onOther).toHaveBeenCalledTimes(1);
      // mod 在非 mac 平台是 ctrl：meta+k 不命中
      fireEvent.keyDown(document.body, { key: 'k', metaKey: true });
      expect(onOther).toHaveBeenCalledTimes(1);
    } finally {
      restoreWin();
    }
  });

  it('requires every declared modifier', () => {
    const restore = stubPlatform('Win32');
    try {
      const handler = vi.fn();
      renderHook(() => useHotkeys({ 'ctrl+shift+p': handler }));
      fireEvent.keyDown(document.body, { key: 'p', ctrlKey: true, shiftKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
      // 缺 shift 不命中
      fireEvent.keyDown(document.body, { key: 'p', ctrlKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
      // 多按未声明的 meta 也不命中
      fireEvent.keyDown(document.body, {
        key: 'p',
        ctrlKey: true,
        shiftKey: true,
        metaKey: true,
      });
      expect(handler).toHaveBeenCalledTimes(1);
    } finally {
      restore();
    }
  });

  it('matches bare symbol keys and named keys', () => {
    const help = vi.fn();
    const prev = vi.fn();
    renderHook(() => useHotkeys({ '?': help, ArrowUp: prev }));

    // '?' 由 shift+/ 产生，符号键天然携带 shift，无需声明修饰键
    fireEvent.keyDown(document.body, { key: '?', shiftKey: true });
    expect(help).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document.body, { key: 'ArrowUp' });
    expect(prev).toHaveBeenCalledTimes(1);
    // 命名键精确匹配：大小写不归一
    fireEvent.keyDown(document.body, { key: 'arrowup' });
    expect(prev).toHaveBeenCalledTimes(1);
  });

  it('ignores hotkeys while focus is in an input unless allowInInput', () => {
    const restore = stubPlatform('Win32');
    try {
      const handler = vi.fn();
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      try {
        const { rerender } = renderHook(
          ({ allowInInput }: { allowInInput: boolean }) =>
            useHotkeys({ 'mod+k': handler }, { allowInInput }),
          { initialProps: { allowInInput: false } }
        );
        fireEvent.keyDown(input, { key: 'k', ctrlKey: true });
        expect(handler).not.toHaveBeenCalled();

        rerender({ allowInInput: true });
        fireEvent.keyDown(input, { key: 'k', ctrlKey: true });
        expect(handler).toHaveBeenCalledTimes(1);
      } finally {
        input.remove();
      }
    } finally {
      restore();
    }
  });

  it('binds alias specs (hotkey() / comma-joined) to one handler', () => {
    const restore = stubPlatform('Win32');
    try {
      const cycle = vi.fn();
      const literal = vi.fn();
      renderHook(() =>
        useHotkeys({
          [hotkey('mod+k', 'mod+j')]: cycle,
          'mod+e,mod+f': literal,
        })
      );
      fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
      fireEvent.keyDown(document.body, { key: 'j', ctrlKey: true });
      expect(cycle).toHaveBeenCalledTimes(2);
      fireEvent.keyDown(document.body, { key: 'e', ctrlKey: true });
      fireEvent.keyDown(document.body, { key: 'f', ctrlKey: true });
      expect(literal).toHaveBeenCalledTimes(2);
      // 未声明的别名不命中
      fireEvent.keyDown(document.body, { key: 'p', ctrlKey: true });
      expect(cycle).toHaveBeenCalledTimes(2);
      expect(literal).toHaveBeenCalledTimes(2);
    } finally {
      restore();
    }
  });

  it('attaches no listener when enabled is false', () => {
    const handler = vi.fn();
    const spy = vi.spyOn(window, 'addEventListener');
    try {
      renderHook(() => useHotkeys({ 'mod+k': handler }, { enabled: false }));
      expect(spy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
      fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
      expect(handler).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('listens on keyup when eventName is keyup', () => {
    const restore = stubPlatform('Win32');
    try {
      const handler = vi.fn();
      renderHook(() => useHotkeys({ 'mod+k': handler }, { eventName: 'keyup' }));
      fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
      expect(handler).not.toHaveBeenCalled();
      fireEvent.keyUp(document.body, { key: 'k', ctrlKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
    } finally {
      restore();
    }
  });

  it('prevents default and stops propagation when bound to an element target', () => {
    const restore = stubPlatform('Win32');
    try {
      const handler = vi.fn();

      function Probe() {
        const ref = useRef<HTMLDivElement>(null);
        useHotkeys({ 'mod+k': handler }, { target: ref });
        return (
          <div ref={ref}>
            <span>trigger</span>
          </div>
        );
      }

      const { container } = render(<Probe />);
      const inner = container.querySelector('span') as HTMLElement;

      const reachedDocument = vi.fn();
      document.addEventListener('keydown', reachedDocument);
      // 注册晚于 hook 的监听（同节点顺序执行），可观测 defaultPrevented
      const afterHook = vi.fn((event: Event) => {
        expect((event as KeyboardEvent).defaultPrevented).toBe(true);
      });
      container.firstElementChild?.addEventListener('keydown', afterHook);
      try {
        fireEvent.keyDown(inner, { key: 'k', ctrlKey: true });
        expect(handler).toHaveBeenCalledTimes(1);
        // stopPropagation：冒泡在容器处被截断，未达 document
        expect(reachedDocument).not.toHaveBeenCalled();
        expect(afterHook).toHaveBeenCalledTimes(1);
      } finally {
        document.removeEventListener('keydown', reachedDocument);
        container.firstElementChild?.removeEventListener('keydown', afterHook);
      }
    } finally {
      restore();
    }
  });
});
