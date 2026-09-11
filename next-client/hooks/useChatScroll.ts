'use client';

import { useEffect, useState } from 'react';

/**
 * @description 스마트 스크롤 제어를 위한 커스텀 훅
 * [Optimization]: 사용자의 스크롤 의도를 감지하여 하단 고정 여부를 결정합니다.
 * [Fix] 이 훅이 발생시키는 자동 스크롤(streaming 중 하단 고정)과 실제 사용자 스크롤을
 * 'scroll' 이벤트 자체로 구분하려던 시도(ref 플래그 방식)는 두 번이나 레이스 컨디션으로
 * 실패함 — scrollTo가 실제로 위치를 바꾸지 않는 호출(이미 그 위치인 경우)에서는 'scroll'
 * 이벤트가 아예 발생하지 않아 플래그가 계속 "자동 스크롤" 상태로 남아있다가, 그 다음에 오는
 * 진짜 사용자 스크롤까지 "자동"으로 오인해버리는 문제가 실사용 환경에서 재현됨. 그래서
 * 이 훅은 더 이상 그 구분을 시도하지 않음 — 대신 호출 측(ChatWindow)에서 touch/wheel 같은
 * "진짜 입력 이벤트" 자체를 직접 감지해서 헤더의 사용자-활동 여부를 판단함(더 확실한 신호).
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
