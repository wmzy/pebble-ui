import { act, renderHook } from '@testing-library/react';

import { useFullscreen } from './useFullscreen';

/**
 * jsdom ships no Fullscreen API: install `fullscreenElement` as a gettable
 * property and put request/exit on the elements under test, mirroring the
 * real event contract (fullscreenchange fires on document).
 */
let fullscreenElement: Element | null = null;

type FullscreenDocument = Document & {
  fullscreenElement?: Element | null;
  exitFullscreen?: () => Promise<void>;
};

function defineFullscreenElement() {
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => fullscreenElement,
  });
}

function installFullscreen(element: HTMLElement) {
  defineFullscreenElement();
  const request = vi.fn(() => {
    fullscreenElement = element;
    document.dispatchEvent(new Event('fullscreenchange'));
    return Promise.resolve();
  });
  element.requestFullscreen =
    request;
  return request;
}

function installExit() {
  const exit = vi.fn(() => {
    fullscreenElement = null;
    document.dispatchEvent(new Event('fullscreenchange'));
    return Promise.resolve();
  });
  (document as FullscreenDocument).exitFullscreen = exit;
  return exit;
}

afterEach(() => {
  fullscreenElement = null;
  const doc = document as FullscreenDocument;
  Reflect.deleteProperty(doc, 'fullscreenElement');
  Reflect.deleteProperty(doc, 'exitFullscreen');
  Reflect.deleteProperty(document.documentElement, 'requestFullscreen');
  document.body.innerHTML = '';
});

describe('useFullscreen', () => {
  it('starts inactive and toggles the document element by default', () => {
    const request = installFullscreen(document.documentElement);
    const exit = installExit();
    const { result } = renderHook(() => useFullscreen());

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1]();
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1]();
    });
    expect(exit).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBe(false);
  });

  it('targets a ref element and only reports its own fullscreen state', () => {
    const ref: { current: HTMLDivElement | null } = { current: null };
    const { result } = renderHook(() => useFullscreen(ref));
    const box = document.createElement('div');
    document.body.appendChild(box);
    ref.current = box;
    const request = installFullscreen(box);

    // some *other* element goes fullscreen — the hook must stay false
    const other = document.createElement('video');
    document.body.appendChild(other);
    installFullscreen(other);
    act(() => {
      void other.requestFullscreen();
    });
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[2].enter();
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBe(true);
  });

  it('exits only when the target is the fullscreen element', () => {
    const own = document.createElement('div');
    const other = document.createElement('div');
    document.body.append(own, other);
    installFullscreen(other);
    const exit = installExit();
    act(() => {
      void other.requestFullscreen();
    });

    const { result } = renderHook(() => useFullscreen({ current: own }));
    act(() => {
      result.current[2].exit();
    });
    // someone else is fullscreen — our exit must not tear it down
    expect(exit).not.toHaveBeenCalled();
    expect(result.current[0]).toBe(false);
  });

  it('survives a rejected request', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    defineFullscreenElement();
    const request = vi.fn(
      () => new Promise<void>((_, reject) => reject(new Error('denied')))
    );
    el.requestFullscreen =
      request;

    const { result } = renderHook(() => useFullscreen(el));
    act(() => {
      result.current[2].enter();
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBe(false);
  });

  it('degrades to a no-op without the Fullscreen API', () => {
    // jsdom default: no requestFullscreen, no fullscreenElement, no events
    const { result } = renderHook(() => useFullscreen());
    expect(result.current[0]).toBe(false);
    expect(() => result.current[2].enter()).not.toThrow();
    expect(() => result.current[2].exit()).not.toThrow();
    expect(() => result.current[2].toggle()).not.toThrow();
    expect(result.current[0]).toBe(false);
  });

  it('unsubscribes from fullscreenchange on unmount', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useFullscreen());
    unmount();
    expect(remove.mock.calls).toContainEqual([
      'fullscreenchange',
      expect.any(Function),
    ]);
    remove.mockRestore();
  });

  it('accepts a raw element target', () => {
    const el = document.createElement('section');
    document.body.appendChild(el);
    const request = installFullscreen(el);
    const { result } = renderHook(() => useFullscreen(el));
    act(() => {
      result.current[2].enter();
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBe(true);
  });
});
