import type { RefObject } from 'react';

import { useEffect, useRef } from 'react';

/** 快捷键命中时收到原始 KeyboardEvent。 */
export type HotkeyHandler = (event: KeyboardEvent) => void;

type UseHotkeysOptions = {
  /** `false` 时不挂载任何监听（默认 `true`）。 */
  enabled?: boolean;
  /** 监听目标：元素 ref 或 `window`（默认 `window`，随冒泡捕获全局按键）。 */
  target?: RefObject<HTMLElement | null> | Window;
  /** 监听的键盘事件类型（默认 `'keydown'`）。 */
  eventName?: 'keydown' | 'keyup';
  /** 焦点在 input/textarea/select/contenteditable 内时是否仍触发（默认 `false`）。 */
  allowInInput?: boolean;
};

type ModifierName = 'ctrl' | 'shift' | 'alt' | 'meta';

type ParsedHotkey = {
  modifiers: Set<ModifierName>;
  key: string;
};

// 'mod' 在匹配时按平台归一：macOS 为 ⌘(meta)，其余为 ctrl。
const MODIFIER_ALIASES: Readonly<Record<string, ModifierName | 'mod'>> = {
  mod: 'mod',
  ctrl: 'ctrl',
  control: 'ctrl',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  '⌘': 'meta',
  shift: 'shift',
  alt: 'alt',
  option: 'alt',
  '⌥': 'alt',
};

// navigator.platform 已废弃，但仍是唯一跨引擎的 Mac 判定
// （userAgentData 仅 Chromium 实现）；SSR 下 navigator 不存在。
function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
   
  return /mac|iphone|ipad|ipod/i.test(navigator.platform);
}

// 规格以 '+' 逐段连接：最后一段是键（保留大小写），其余是修饰键别名。
// 无法识别的修饰键 / 空键使规格永不命中（静默）。
function parseHotkey(spec: string): ParsedHotkey | null {
  const parts = spec.split('+').map((part) => part.trim());
  const key = parts.pop() ?? '';
  if (key === '') return null;
  const modifiers = new Set<ModifierName>();
  for (const part of parts) {
    const name = MODIFIER_ALIASES[part.toLowerCase()];
    if (name === undefined) return null;
    modifiers.add(name === 'mod' ? (isMacPlatform() ? 'meta' : 'ctrl') : name);
  }
  return { modifiers, key };
}

function matchesSpec(spec: string, event: KeyboardEvent): boolean {
  const parsed = parseHotkey(spec);
  if (parsed === null) return false;
  const { modifiers, key } = parsed;
  // 声明的修饰键必须全部按下
  if (modifiers.has('ctrl') && !event.ctrlKey) return false;
  if (modifiers.has('shift') && !event.shiftKey) return false;
  if (modifiers.has('alt') && !event.altKey) return false;
  if (modifiers.has('meta') && !event.metaKey) return false;
  // 未声明的 ctrl/alt/meta 必须抬起（否则 'mod+k' 会被 'mod+shift+k' 顺带命中）
  if (!modifiers.has('ctrl') && event.ctrlKey) return false;
  if (!modifiers.has('alt') && event.altKey) return false;
  if (!modifiers.has('meta') && event.metaKey) return false;
  // shift 不强校验：'?'、大写字母等符号键天然携带 shift，声明了才要求按下
  // 单字符键大小写不敏感（'p' 命中 'P'），命名键（'ArrowUp'）精确比较
  return key.length === 1
    ? event.key.toLowerCase() === key.toLowerCase()
    : event.key === key;
}

function isTargetEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * 组合多个快捷键规格为一条别名绑定（逗号连接），任一命中即触发同一
 * handler——对象字面量的键只能是字符串，数组规格经由本函数进入。
 *
 * ```tsx
 * useHotkeys({ [hotkey('mod+k', 'mod+j')]: cyclePalette });
 * ```
 *
 * @param specs 至少一个规格，如 `'mod+k'`、`'ctrl+shift+p'`。
 */
export function hotkey(...specs: [string, ...string[]]): string {
  return specs.join(',');
}

/**
 * 声明式键盘快捷键。映射的键为规格字符串，值为处理器；命中时默认
 * `preventDefault + stopPropagation`，处理器收到原始事件可追加处理。
 *
 * ```tsx
 * useHotkeys({
 *   'mod+k': openCommandPalette,          // macOS ⌘K / 其它 Ctrl+K
 *   'ctrl+shift+p': openCommandPalette,
 *   '?': showHelp,                        // 符号键天然携带 shift，无需声明
 *   ArrowUp: selectPrev,                  // 命名键精确匹配
 *   [hotkey('mod+k', 'mod+j')]: cycle,     // 多规格别名：任一命中
 * }, { allowInInput: false });
 * ```
 *
 * - 规格语法：`[修饰键+]*键`；修饰键别名 mod/ctrl/control/meta/cmd/⌘/
 *   shift/alt/option/⌥；`mod` 按平台归一（macOS ⌘，否则 ctrl，
 *   `navigator.platform` 判定，SSR 安全）。
 * - 默认焦点在 input/textarea/select/contenteditable 时忽略全部快捷键，
 *   `allowInInput: true` 打开。
 * - 一个事件只触发第一个命中的绑定；`hotkeys` 映射每次渲染变化不重挂
 *   监听（latest-ref），`enabled/target/eventName/allowInInput` 变化才
 *   重新绑定。
 * - `enabled: false` 等价于不挂载监听。
 *
 * @param hotkeys 规格（或逗号连接的规格列表）到处理器的映射。
 * @param options 监听行为配置。
 */
export function useHotkeys(
  hotkeys: Record<string, HotkeyHandler>,
  options: UseHotkeysOptions = {}
): void {
  const { enabled = true, target, eventName = 'keydown', allowInInput = false } = options;

  // latest-ref：hotkeys 通常是渲染期新建的对象字面量，经 ref 取最新值，
  // 避免每次渲染解绑/重挂监听
  const hotkeysRef = useRef(hotkeys);
  useEffect(() => {
    hotkeysRef.current = hotkeys;
  });

  useEffect(() => {
    if (!enabled) return;
    const node: Window | HTMLElement | null =
      target === undefined ? window : 'current' in target ? target.current : target;
    if (node === null) return;
    const listener = (event: Event): void => {
      // 只注册在 eventName（keydown/keyup）上，收到的必是 KeyboardEvent
      const keyboardEvent = event as KeyboardEvent;
      if (!allowInInput && isTargetEditable(keyboardEvent.target)) return;
      const map = hotkeysRef.current;
      for (const recordKey of Object.keys(map)) {
        // 键可以是逗号连接的别名列表（hotkey(...) 的产物）
        const matched = recordKey
          .split(',')
          .some((spec) => matchesSpec(spec.trim(), keyboardEvent));
        if (matched) {
          const handler = map[recordKey];
          if (!handler) continue;
          keyboardEvent.preventDefault();
          keyboardEvent.stopPropagation();
          handler(keyboardEvent);
          return;
        }
      }
    };
    node.addEventListener(eventName, listener);
    return () => node.removeEventListener(eventName, listener);
  }, [enabled, target, eventName, allowInInput]);
}

export type { UseHotkeysOptions };
