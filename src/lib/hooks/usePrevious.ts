import { useEffect, useRef } from 'react';

/**
 * 上一次渲染时的值。首次渲染返回 `undefined`。
 *
 * ```tsx
 * const [count, setCount] = useState(0);
 * const prev = usePrevious(count);
 * // count 从 0 变 1 后：count === 1, prev === 0
 * ```
 *
 * - 值比较按渲染（identity），不做深比较——对象/数组每次新引用都会
 *   视为变化，需要浅比较时先用 `useMemo` 稳定引用。
 * - 写入发生在 effect：与 `useEffect`/`useLayoutEffect` 内读到的前一值
 *   一致；并发渲染下同一轮重试不会污染 prev。
 *
 * @param value 需要追踪前值的任意值。
 * @returns 上一轮渲染的同一值；首轮为 `undefined`。
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const prev = ref.current;
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return prev;
}
