import type { Dispatch, RefObject, SetStateAction } from 'react';

import { useCallback, useEffect } from 'react';

import { darkTheme, lightTheme } from '@/lib/tokens';

import { useLocalStorage } from './useLocalStorage';
import { useMediaQuery } from './useMediaQuery';

/**
 * useDarkMode：零成本暗色切换。
 *
 * - 状态源是 `useLocalStorage`（`useControl` 内核）：`mode` 持久化到
 *   localStorage（默认 key `haze-ui-color-mode`），跨标签页经 storage
 *   事件同步；`isDark` 由 `mode` 派生——`'system'` 时跟随
 *   `prefers-color-scheme`（复用 useMediaQuery 的无 matchMedia 守卫）。
 * - 副作用是在目标元素（默认 `document.documentElement`）上切换
 *   `lightTheme` / `darkTheme` 两个 token 类——始终恰好挂其一，其余
 *   className 不受影响。卸载不摘类：主题是页面级事实，摘类只会闪白。
 * - SSR：渲染期不碰 `document`；effect 不执行，无 DOM 也可安全渲染。
 *   storage / matchMedia 缺失时静默降级为纯内存状态（内核既有行为）。
 *
 * ```tsx
 * const [isDark, setIsDark, mode, setMode] = useDarkMode();
 * setIsDark(true);   // 等价 setMode('dark')，写入 localStorage
 * setMode('system'); // 重新跟随系统偏好
 * ```
 */

type ColorMode = 'light' | 'dark' | 'system';

type UseDarkModeOptions = {
  /** localStorage 持久化键，默认 `'haze-ui-color-mode'`。 */
  storageKey?: string;
  /**
   * 挂主题类的目标元素，接受元素本身或 ref（ref 在 effect 期读取，
   * 同组件渲染的元素此时已挂载）。默认 `document.documentElement`。
   */
  target?: RefObject<HTMLElement | null> | HTMLElement;
  /** 无持久化值时的兜底模式，默认 `'system'`。 */
  defaultMode?: ColorMode;
};

type UseDarkModeResult = [
  isDark: boolean,
  setIsDark: Dispatch<SetStateAction<boolean>>,
  mode: ColorMode,
  setMode: Dispatch<SetStateAction<ColorMode>>,
];

const DEFAULT_STORAGE_KEY = 'haze-ui-color-mode';
const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';

// 存量存储里可能落着非法值（手写 / 旧版本）：不进公共返回值，回落 defaultMode，
// 下一次 setMode 写入即自愈。
const isColorMode = (value: unknown): value is ColorMode =>
  value === 'light' || value === 'dark' || value === 'system';

function resolveTarget(
  target: RefObject<HTMLElement | null> | HTMLElement | undefined
): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (target === undefined) return document.documentElement;
  // RefObject 有 current；DOM 元素没有——不需要品牌判断
  if (typeof target === 'object' && 'current' in target) return target.current;
  return target;
}

export function useDarkMode(options?: UseDarkModeOptions): UseDarkModeResult {
  const { storageKey = DEFAULT_STORAGE_KEY, target, defaultMode = 'system' } =
    options ?? {};

  const [storedMode, setMode] = useLocalStorage<ColorMode>(
    storageKey,
    undefined,
    defaultMode
  );
  const mode: ColorMode = isColorMode(storedMode) ? storedMode : defaultMode;

  const systemDark = useMediaQuery(PREFERS_DARK_QUERY);
  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  const setIsDark = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) => {
      // 函数式更新以当前 isDark 为 prev；显式赋值脱离 'system' 跟随，
      // 与 setMode('dark' | 'light') 等价
      const next = typeof value === 'function' ? value(isDark) : value;
      setMode(next ? 'dark' : 'light');
    },
    [isDark, setMode]
  );

  // 恰好挂一个主题类：toggle(token, force) 幂等，重复执行无副作用
  useEffect(() => {
    const element = resolveTarget(target);
    if (element === null) return;
    element.classList.toggle(lightTheme, !isDark);
    element.classList.toggle(darkTheme, isDark);
  }, [isDark, target]);

  return [isDark, setIsDark, mode, setMode];
}

export type { ColorMode, UseDarkModeOptions, UseDarkModeResult };
