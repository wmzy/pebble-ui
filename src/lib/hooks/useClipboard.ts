import { useCallback, useEffect, useRef, useState } from 'react';

type UseClipboardResult = {
  /** 最近一次成功复制后的反馈窗口内为 `true`，`resetMs` 后回落 `false`。 */
  copied: boolean;
  /**
   * 复制文本到剪贴板，成功返回 `true`。优先异步剪贴板 API，失败退化
   * `document.execCommand('copy')`；两条路径都失败返回 `false` 且
   * `copied` 不置位。
   */
  copy: (text: string) => Promise<boolean>;
};

// 退化路径：非安全上下文（http / 局域网 IP）没有 navigator.clipboard，
// 而 execCommand 虽已废弃、仍是唯一的同步剪贴板写入回退。隐藏 textarea
// 固定定位 + 透明，避免滚动跳变与视觉闪烁。
function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  try {
    textarea.select();
    // Deliberate fallback: deprecated, but the only synchronous
    // clipboard write for non-secure contexts without navigator.clipboard.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

/**
 * 复制文本到剪贴板并跟踪「已复制」反馈状态。
 *
 * ```tsx
 * const { copied, copy } = useClipboard();
 * <Button onClick={() => copy(shareLink)}>{copied ? '已复制' : '复制链接'}</Button>
 * ```
 *
 * - 优先 `navigator.clipboard.writeText`；不可用（undefined 时访问属性
 *   即抛 TypeError）或被权限拒绝时，退化到隐藏 textarea +
 *   `document.execCommand('copy')`。两条路径都失败返回 `false`。
 * - 复制成功后 `copied` 置 `true`，`resetMs`（默认 2000）后自动回落；
 *   窗口内再次成功复制会重置计时。
 * - SSR：`navigator` / `document` 只在 `copy` 事件回调里触碰，服务端
 *   渲染安全（`copied` 初始 `false`，无 hydration 差异）；reset 计时器
 *   随卸载清理。
 *
 * @param resetMs `copied` 从 `true` 回落的延迟（毫秒），默认 2000。
 */
export function useClipboard(resetMs = 2000): UseClipboardResult {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 卸载：清理挂起的 reset 计时器。
  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    []
  );

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      // Clipboard API first; any failure — absent API (property access
      // throws synchronously, folded into a rejection by the leading
      // Promise.resolve), permission denied — falls back to the legacy
      // synchronous path.
      const ok = await Promise.resolve()
        .then(() => navigator.clipboard.writeText(text))
        .then(
          () => true,
          () => legacyCopy(text)
        );

      if (ok) {
        setCopied(true);
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setCopied(false);
        }, resetMs);
      }
      return ok;
    },
    [resetMs]
  );

  return { copied, copy };
}

export type { UseClipboardResult };
