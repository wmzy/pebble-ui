/**
 * 纯焦点工具：tabbable 元素查询与首个聚焦目标计算。
 *
 * 无 React、无 CSS 依赖，可在任意 DOM 环境（含 jsdom）直接复用。
 * 与 floating.tsx 一样属于内部原语，不进 src/lib/index.ts barrel——
 * 公共面由 haze-ui/headless 子路径策展导出。
 */

/**
 * Tab 序候选元素选择器。仅做结构性筛选；disabled / hidden /
 * tabindex="-1" / 可见性等运行时状态由 isTabbable 二次过滤
 * （选择器里的 :not([disabled]) 分支只覆盖各自的元素形态）。
 */
export const TABBABLE_SELECTOR = [
  'a[href]:not([disabled])',
  'button:not([disabled])',
  'input:not([disabled]):not([type=hidden])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable=true]',
  'audio[controls]',
  'video[controls]',
  'details > summary:first-of-type',
].join(', ');

/**
 * disabled 属性选择器覆盖不到的组合：如 button[tabindex="0"][disabled]
 * 会命中 [tabindex] 分支，因此 disabled 需读 DOM 属性再判一次。
 */
function isDisabledControl(el: Element): boolean {
  return (
    (el instanceof HTMLButtonElement ||
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLOptionElement) &&
    el.disabled
  );
}

/**
 * 可见性：checkVisibility 同时考虑 visibility / display / content-visibility
 * （checkOpacity 额外捕捉动画退场中的元素）。jsdom 与老 Safari 无该 API
 * 时放行（选择器已过滤 hidden，进一步判定交给真实布局引擎）。
 */
function isVisible(el: Element): boolean {
  return typeof el.checkVisibility === 'function'
    ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
    : true;
}

/** 元素是否在 Tab 序内（选择器命中 + 非 disabled + 非 hidden + 可见）。 */
export function isTabbable(el: Element): el is HTMLElement {
  if (!el.matches(TABBABLE_SELECTOR)) return false;
  // tabindex="-1" 是显式移出 Tab 序，对原生可聚焦元素（button 等）同样生效
  if (el.getAttribute('tabindex') === '-1') return false;
  if (el.hasAttribute('hidden')) return false;
  if (isDisabledControl(el)) return false;
  return isVisible(el);
}

/** 容器内按 DOM 顺序排列的全部 tabbable 元素（不含容器自身）。 */
export function getTabbables(
  container: ParentNode | null | undefined
): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll(TABBABLE_SELECTOR)).filter(
    isTabbable
  );
}

/**
 * 聚焦容器内第一个 tabbable 元素；无 tabbable 时聚焦容器自身
 * （容器需 tabIndex=-1 才可编程聚焦，未显式设置时补设）。
 * 返回是否聚焦成功 —— 以 activeElement 实际转移为准，兜住
 * disabled / 脱离文档等 focus() 静默失效的场景。
 */
export function focusFirst(container: HTMLElement): boolean {
  const tabbables = getTabbables(container);
  const target: HTMLElement = tabbables[0] ?? container;
  if (target === container && container.getAttribute('tabindex') === null) {
    container.tabIndex = -1;
  }
  target.focus();
  return document.activeElement === target;
}
