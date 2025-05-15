import { createContext, useContext } from 'react';

export type IStickyMode = 'replace' | 'stack' | 'none';

export interface IStickyItemHandle {
  /**
   * 包裹sticky 内容容器的 DOM 元素
   */
  el: HTMLElement;
  /**
   * 元素注册的更新函数
   * @param canSticky 容器是否与顶部交叉, sticky 元素是否可以 sticky, 近当该值 为 true 时, sticky 元素才可以 sticky
   * @param currentOffsetTop 当前元素容器距离视口顶部的距离
   * @param offsetTop 当前元素之前的sticky 元素的偏移量
   * @param nextOffsetTop 下一个元素的 sticky 元素容器距离顶部的距离, undefined 表示没有下一个元素
   * @param index sticky 元素在容器中的索引(顺序), 可以用于控制元素的 z-index
   * @returns 返回当前元素的高度, 若果该元素不需要 sticky, 则返回 0
   */
  update: (canSticky: boolean, currentOffsetTop: number, offsetTop: number, nextOffsetTop: number | undefined, index: number) => number;
}

export interface IStickyGroupContextValue {
  /**
   * 注册需要 sticky 的元素
   */
  register: (handle: IStickyItemHandle) => () => void;

  /**
   * 更新 sticky 元素的高度
   * @param height 当前新增sticky的元素的高度
   * @returns 清理函数, 元素卸载时调用, 用于清理高度
   */
  updateStickyItemsHeight: (height: number) => () => void;
  /**
   * 整个 StickyGroup 在sticky时固定的偏移量
   */
  fixedOffsetTop: number;
  /**
   * 整个 StickyGroup 的当前正在 sticky 元素的高度
   */
  stickyItemsHeight: number;

  /**
   * 整个 StickyGroup 的默认 sticky 模式
   */
  mode?: IStickyMode;
}

export const StickyGroupContext = createContext<IStickyGroupContextValue | null>(null);

export function useStickyContext() {
  return useContext(StickyGroupContext);
}
