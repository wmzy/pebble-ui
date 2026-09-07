import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { focusFirst, getTabbables } from './focus';

/**
 * 焦点域 hook（Radix FocusScope 的简化版，headless：返回 ref 回调，
 * 由消费方挂到容器元素上）。负责弹层的初始聚焦 / 焦点归还 / 可选困焦，
 * 无 CSS 依赖，不进 src/lib/index.ts barrel——公共面由 haze-ui/headless
 * 子路径策展导出。
 */
export type FocusScopeOptions = {
  /**
   * true=激活（挂载语义：记录归还目标、派发 hazefocusmount、自动聚焦、
   * 可选困焦）；false=停用（卸载语义：派发 hazefocusunmount、归还焦点）。
   * effect 依赖只有 enabled —— 其余选项经 optionsRef 读取最新值，
   * 内联箭头函数 props 不会触发重新激活。
   */
  enabled: boolean;
  /** Tab 循环锁定在容器内（document 级 Tab 拦截 + focusout 拉回），默认 false */
  trapped?: boolean;
  /** enabled 翻 true 时聚焦首个 tabbable（无则容器自身），默认 true */
  autoFocus?: boolean;
  /** enabled 翻 false 时归还焦点到激活前的元素，默认 true */
  returnFocus?: boolean;
  /** 挂载事件回调；在事件上 preventDefault 可阻止默认聚焦 */
  onMountAutoFocus?: (event: Event) => void;
  /** 卸载事件回调；在事件上 preventDefault 可阻止默认归还 */
  onUnmountAutoFocus?: (event: Event) => void;
};

const MOUNT_EVENT = 'hazefocusmount';
const UNMOUNT_EVENT = 'hazefocusunmount';

/**
 * 归还 body。jsdom 与部分引擎对 body.focus() 是 no-op，
 * 此时对当前焦点元素 blur 同样会把 activeElement 归位到 body。
 */
function focusBody(): void {
  document.body.focus();
  if (
    document.activeElement !== document.body &&
    document.activeElement instanceof HTMLElement
  ) {
    document.activeElement.blur();
  }
}

export function useFocusScope(
  options: FocusScopeOptions
): (node: HTMLElement | null) => void {
  const optionsRef = useRef(options);
  // layout 阶段刷新：保证同一次 commit 中 enabled effect（passive）
  // 及其 cleanup 读到的都是最新已提交的选项
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  const nodeRef = useRef<HTMLElement | null>(null);
  // 归还目标：enabled 翻 true 瞬间的 document.activeElement
  const returnFocusRef = useRef<HTMLElement | null>(null);

  /**
   * ref 回调换节点时只更新引用：困焦监听在事件触发时读 nodeRef.current，
   * 不持有旧节点闭包，因此换节点无需重新布防、也不会残留旧引用。
   */
  const setScope = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  useEffect(() => {
    if (!options.enabled) return;
    // 布防/撤防用同一份快照，保证 add/remove 严格配对
    const armed = optionsRef.current;
    // cleanup 后不再产生任何困焦副作用（含已挂起的 recapture microtask）
    let disposed = false;

    // 激活瞬间记录归还目标（之后的焦点都属于 scope 生命周期）
    const activeElement = document.activeElement;
    returnFocusRef.current =
      activeElement instanceof HTMLElement ? activeElement : null;

    // hazefocusmount：可取消；取消（preventDefault）后跳过默认聚焦
    const mountEvent = new Event(MOUNT_EVENT, { bubbles: false, cancelable: true });
    nodeRef.current?.dispatchEvent(mountEvent);
    armed.onMountAutoFocus?.(mountEvent);
    if (
      !mountEvent.defaultPrevented &&
      armed.autoFocus !== false &&
      nodeRef.current
    ) {
      focusFirst(nodeRef.current);
    }

    /** Tab 循环：首尾包裹；焦点已脱出容器时拉回首个。 */
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;
      const scope = nodeRef.current;
      if (!scope) return;
      const tabbables = getTabbables(scope);
      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      if (!first || !last) {
        // 容器内无处可去：阻止默认，保持焦点现状
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      const inScope = active !== null && scope.contains(active);
      if (event.shiftKey) {
        if (active === first || !inScope) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !inScope) {
        event.preventDefault();
        first.focus();
      }
    };

    /** focusout 困焦：焦点从容器内漏到容器外时拉回首个 tabbable。 */
    const onFocusOut = (event: FocusEvent): void => {
      const scope = nodeRef.current;
      // 只处理从容器内漏出的焦点；容器外元素之间的焦点流转不干预
      if (
        !scope ||
        !(event.target instanceof Node) ||
        !scope.contains(event.target)
      ) {
        return;
      }
      const related = event.relatedTarget;
      const leaked =
        related instanceof Node
          ? !scope.contains(related)
          : // relatedTarget 为 null：仅当焦点确实落回 body
            // （点击空白 / 元素被移除）时才拉回
            document.activeElement === document.body;
      if (!leaked) return;
      // 拉回推迟到当前 focus 流程之后：focusout 在 activeElement 更新前
      // 派发，同步 focusFirst 会与进行中的 focus() 重入互相覆盖
      queueMicrotask(() => {
        if (disposed) return;
        const currentScope = nodeRef.current;
        if (!currentScope) return;
        const active = document.activeElement;
        // 焦点已被（Tab 拦截等）拉回容器内则不再重复处理
        if (active !== null && currentScope.contains(active)) return;
        focusFirst(currentScope);
      });
    };

    if (armed.trapped) {
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('focusout', onFocusOut);
    }

    return () => {
      // 先撤防再归还，避免归还动作自身触发困焦拉回
      disposed = true;
      if (armed.trapped) {
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('focusout', onFocusOut);
      }

      const latest = optionsRef.current;
      const unmountEvent = new Event(UNMOUNT_EVENT, {
        bubbles: false,
        cancelable: true,
      });
      nodeRef.current?.dispatchEvent(unmountEvent);
      latest.onUnmountAutoFocus?.(unmountEvent);
      if (unmountEvent.defaultPrevented || latest.returnFocus === false) return;

      // 用户已主动聚焦别处（activeElement 既非 body 也不在容器内）时不抢占
      const scope = nodeRef.current;
      const active = document.activeElement;
      const inside = scope !== null && active !== null && scope.contains(active);
      if (active !== document.body && active !== null && !inside) return;

      const target = returnFocusRef.current;
      if (target?.isConnected) {
        target.focus();
      }
      // 归还未生效（目标已卸载，或目标是 body 且引擎对其 focus 为 no-op）
      // 时回落 body
      if (document.activeElement !== target) {
        focusBody();
      }
    };
  }, [options.enabled]);

  return setScope;
}
