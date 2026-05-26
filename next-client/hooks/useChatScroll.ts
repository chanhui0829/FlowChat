'use client';

import { useEffect, useState, RefObject } from 'react';

/**
 * @description 스마트 스크롤 제어를 위한 커스텀 훅
 * [Optimization]: 사용자의 스크롤 의도를 감지하여 하단 고정 여부를 결정합니다.
 */
export const useChatScroll = (
  scrollRef: React.RefObject<HTMLDivElement | null>,
  dependencies: unknown[]
) => {
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);

  useEffect(() => {
    if (!isAutoScrollActive || !scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
  }, [...dependencies, isAutoScrollActive]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setIsAutoScrollActive(scrollHeight - scrollTop - clientHeight < 150);
  };

  return { handleScroll };
};
