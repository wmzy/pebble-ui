import { useMediaQuery } from './useMediaQuery';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * 用户是否开启了系统级「减少动态效果」偏好（`prefers-reduced-motion`）。
 *
 * 与 tokens 的 `@media (prefers-reduced-motion: reduce)` 全局 CSS 降级
 * （duration → 0ms）呼应：CSS 侧管组件自身的过渡/动画，本 hook 供
 * JS 侧编排决策——跳过视差、自动轮播、滚动驱动动画等 CSS 覆盖不到
 * 的动效。
 *
 * - SSR：继承 useMediaQuery 语义——服务端渲染与 hydration 首帧恒
 *   `false`，水合后以一次额外渲染收敛，无 hydration mismatch。
 *
 * @returns 用户偏好减少动态效果时为 `true`。
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}
