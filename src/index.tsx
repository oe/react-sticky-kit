import React, { useRef, useEffect, useCallback, useState } from 'react';
import { StickyGroupContext, type IStickyItemHandle } from './context';

import './style.scss';

export * from './sticky-item';

export interface IStickyContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * sticky 元素距离视口顶部的偏移量, 默认 0
   */
  offsetTop?: number;
  /**
   * 分组默认的 sticky 模式, 默认无, 即不使用 sticky
   */
  defaultMode?: 'replace' | 'stack' | 'none';
  /**
   * 容器内部所有当前处于 sticky 状态下的元素的高度总和变化的事件
   * @param height 容器内部所有当前处于 sticky 状态下的元素的高度总和
   */
  onStickyItemsHeightChange?: (height: number) => void;
}

export function StickyContainer(
  { children, offsetTop = 0, onStickyItemsHeightChange,
    defaultMode = 'replace', ...rest }: IStickyContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<IStickyItemHandle[]>([]);
  const [stickyItemsHeight, setStickyItemsHeight] = useState(0);
  
  // 使用 ref 缓存 配置, 避免对hooks 产生太多依赖
  const optionsRef = useRef({
    fixedOffsetTop: offsetTop,
    defaultMode,
    stickyItemsHeight,
    onStickyItemsHeightChange,
  });
  // 实时更新 stickyItemsHeight
  optionsRef.current.stickyItemsHeight = stickyItemsHeight;
  optionsRef.current.onStickyItemsHeightChange = onStickyItemsHeightChange;

  const scheduleUpdate = useCallback(() => {
    const $container = containerRef.current;
      if (!$container) return;
      const rect = $container.getBoundingClientRect();
      const options = optionsRef.current;
      const fixedOffsetTop = options.fixedOffsetTop;
      const stickyItemsHeight = options.stickyItemsHeight;
      // 是否容器是否与视口顶部交叉
      const canSticky = !(rect.top > fixedOffsetTop || rect.bottom < fixedOffsetTop);
      let accHeight = fixedOffsetTop;
      // 计算需要修正的偏移量
      //  容器底部距离视口顶部的距离不够展示已有的sticky元素的时候, 需要整体向上修正
      let correctionOffset = rect.bottom - (fixedOffsetTop + stickyItemsHeight);
      // 修正量大于0 表示剩余空间足够, 无需修正
      if (correctionOffset > 0) correctionOffset = 0;
      const offsetTopOfItems = itemsRef.current.map(item => item.el.getBoundingClientRect().top);
      itemsRef.current.forEach((item, index) => {
        accHeight += item.update(canSticky, offsetTopOfItems[index]!, accHeight + correctionOffset, offsetTopOfItems[index + 1], index);
      });
  }, []);

  // 更新 stickyItemsHeight 的高度
  const updateStickyItemsHeight = useCallback((height: number) => {
    setStickyItemsHeight((prev) => {
      const nextHeight = prev + height;
      // 延迟出发更新事件, 避免导致卡顿
      setTimeout(() => {
        optionsRef.current.onStickyItemsHeightChange?.(nextHeight);
      }, 0);
      return nextHeight;
    });
    return () => {
      setStickyItemsHeight((prev) => {
        const nextHeight = prev - height;
        // 延迟出发更新事件, 避免导致卡顿
        setTimeout(() => {
          optionsRef.current.onStickyItemsHeightChange?.(nextHeight);
        }, 0);
        return nextHeight;
      });
    }
  }, []);
    
  // 更新 optionsRef 的值
  useEffect(() => {
    optionsRef.current.fixedOffsetTop = offsetTop;
    optionsRef.current.defaultMode = defaultMode;
    scheduleUpdate();
  }, [offsetTop, defaultMode, scheduleUpdate]);
  
  // 注册 sticky item
  const register = useCallback((item: IStickyItemHandle) => {
    itemsRef.current.push(item);
    // 对元素进行排序, 保证按元素在视口的顺序先后调用
    itemsRef.current = sortStickyItemsByRect(itemsRef.current);
    scheduleUpdate();

    return () => {
      itemsRef.current = itemsRef.current.filter(i => i !== item);
      scheduleUpdate();
    };
  }, [scheduleUpdate]);
  
  useEffect(() => {
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
  
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    }
  }, [scheduleUpdate]);

  console.log('stickyItemsHeight', stickyItemsHeight);
  

  return (
    <StickyGroupContext.Provider 
      value={{
        register,
        updateStickyItemsHeight,
        stickyItemsHeight,
        fixedOffsetTop: offsetTop, 
        mode: defaultMode, 
      }}
    >
      <div 
        {...rest} 
        ref={containerRef} 
        className="oe-sticky-container"
        data-mode={defaultMode} 
      >
        {children}
      </div>
    </StickyGroupContext.Provider>
  );
}


/**
 * 对元素按照其在视口中的位置进行排序
 */
function sortStickyItemsByRect(items: IStickyItemHandle[]) {
  return items.sort((a, b) => {
    const rectA = a.el.getBoundingClientRect();
    const rectB = b.el.getBoundingClientRect();
    return rectA.top - rectB.top;
  });
}