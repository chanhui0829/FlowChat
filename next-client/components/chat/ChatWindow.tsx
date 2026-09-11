'use client';

import { useState, useCallback, useEffect, useRef, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Logo from '@/assets/Logo';
import { useChatStore } from '@/lib/store';
import { useChatScroll } from '@/hooks/useChatScroll';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import { markdownComponents } from '@/components/common/markdown/markdownComponents';
import { isSameDay } from '@/lib/utils/dateHelpers';
import MessageItem from './MessageItem';
import WelcomeScreen from './WelcomeScreen';

interface ChatWindowProps {
  typing: string;
  isSending: boolean;
  onQuickSend: (text: string) => void;
  // [모바일 헤더 무경계화] 헤더가 메시지 목록의 실제 스크롤 위치(px)를 알아야
  // "맨 위인지" 판단할 수 있음 — streaming 중 자동 스크롤을 포함해 모든 스크롤 이벤트마다
  // 호출되며, 순수하게 위치만 반영함(사용자 활동 여부와는 무관)
  onScrollTopChange?: (scrollTop: number) => void;
  // [Fix] "사용자가 지금 스크롤하고 있다"는 건 scroll 이벤트가 아니라 touch/wheel 같은
  // 실제 입력 이벤트로 직접 판단해야 함 — scroll 이벤트만으로는 streaming 중 자동
  // 하단-고정 스크롤과 구분하려다 레이스 컨디션이 반복적으로 발생했음(자동 스크롤이
  // 위치를 안 바꾸는 경우 'scroll' 이벤트 자체가 안 와서, 그 다음 진짜 사용자 스크롤까지
  // "자동"으로 오인됨). touch/wheel은 항상 사용자가 직접 발생시키는 이벤트라 확실함.
  onUserActivity?: () => void;
}
/**
 * @description 채팅 메시지 목록 및 실시간 스트리밍 응답을 시각화하는 핵심 컴포넌트
 */

const ChatWindow = memo(function ChatWindow({
  typing,
  onQuickSend,
  onScrollTopChange,
  onUserActivity,
}: ChatWindowProps) {
  const { chats, currentChatId } = useChatStore();

  const isStreaming = useChatStore((state) => state.isStreaming);
  const isAwaitingResponse = useChatStore((state) => state.isAwaitingResponse);
  const hasReceivedFirstChunk = useChatStore((state) => state.hasReceivedFirstChunk);

  const currentChat = chats.find((c) => c.id === currentChatId);
  const isNewChat = !currentChat?.messages.length && !typing && !isStreaming;

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  const displayMessages = currentChat?.messages || [];

  // 채팅방을 바꾸거나 빈 채팅(WelcomeScreen)으로 돌아오면 스크롤 컨테이너 자체가
  // 없어지므로, 이전 채팅의 "스크롤됨" 상태가 헤더에 남지 않도록 초기화
  useEffect(() => {
    onScrollTopChange?.(0);
  }, [currentChatId, isNewChat, onScrollTopChange]);

  const shouldShowStreamingBubble = isAwaitingResponse;

  const virtualItems = shouldShowStreamingBubble
    ? [
        ...displayMessages,
        {
          id: 'streaming',
          role: 'assistant' as const,
          content: typing,
          time: new Date().toISOString(),
          isStreaming: true,
        },
      ]
    : displayMessages;

  const { parentRef, getVirtualItems, getTotalSize, measureElement } = useVirtualScroll({
    items: virtualItems,
    estimateSize: 150,
    overscan: 5,
  });

  const { handleScroll } = useChatScroll(parentRef, [displayMessages, typing]);

  // [모바일 스크롤바 자동 숨김] 스크롤 중에만 얇은 스크롤바를 보여주고, 스크롤이
  // 멈춘 뒤 1.5초가 지나면 다시 숨김 — 데스크탑의 :hover 방식은 터치 환경에서
  // 동작하지 않아서, 실제 스크롤 이벤트 기준으로 별도 처리함.
  // [Fix] 스크롤 이벤트마다 setTimeout을 새로 걸고 지우던 debounce 방식은 헤더 제목
  // 등장 로직에서와 같은 문제(타이머가 밀려서 탭 전환 후에야 반영되는 현상)가 재현될
  // 수 있어서, "마지막 스크롤 시각"만 기록하고 가벼운 interval로 경과 시간을 검사하는
  // 방식으로 통일함
  const [scrollActive, setScrollActive] = useState(false);
  const lastScrollAtRef = useRef(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Date.now() - lastScrollAtRef.current >= 1500) {
        setScrollActive((prev) => (prev ? false : prev));
      }
    }, 300);

    return () => clearInterval(intervalId);
  }, []);

  // [Fix] scroll 이벤트만으로는 "streaming 중 자동으로 하단에 붙는 스크롤"과 "사용자가
  // 직접 스크롤한 것"을 구분하려다 레이스 컨디션이 반복 발생했음 — 대신 touch/wheel 같은
  // 실제 입력 이벤트를 직접 감지해서 "사용자 활동"을 판단함(스크롤바 표시 + 헤더 노출 유지
  // 둘 다 이걸로 통일)
  const markUserActivity = useCallback(() => {
    lastScrollAtRef.current = Date.now();
    setScrollActive(true);
    onUserActivity?.();
  }, [onUserActivity]);

  const handleScrollWithHeader = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      handleScroll(e);
      // atTop 판별용 — 순수하게 현재 스크롤 위치만 알려줌 (활동 여부와 무관)
      onScrollTopChange?.(e.currentTarget.scrollTop);
    },
    [handleScroll, onScrollTopChange]
  );

  return (
    <div className="flex-1 h-full w-full bg-white relative overflow-hidden">
      {isNewChat ? (
        <div className="h-full flex flex-col items-center justify-center px-4 animate-in fade-in duration-700">
          <WelcomeScreen onQuickSend={onQuickSend} />
        </div>
      ) : (
        <div className="pt-4 h-full flex flex-col relative">
          <div
            ref={parentRef}
            className={`overflow-y-auto overflow-x-hidden sidebar-scroll absolute inset-0 ${
              scrollActive ? 'scroll-active' : ''
            }`}
            onScroll={handleScrollWithHeader}
            onTouchStart={markUserActivity}
            onTouchMove={markUserActivity}
            onWheel={markUserActivity}
          >
            <div
              style={{
                height: `${getTotalSize()}px`,
                width: '100%',
                position: 'relative',
                paddingBottom: '120px',
              }}
              className="px-4 md:px-12 max-w-5xl mx-auto"
            >
              {getVirtualItems().map((virtualItem) => {
                const msg = virtualItems[virtualItem.index];
                if (!msg) return null;

                if ('isStreaming' in msg && msg.isStreaming) {
                  return (
                    <div
                      key={virtualItem.key}
                      data-index={virtualItem.index}
                      ref={measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      {/* [Fix] 타이핑(스트리밍) 중인 말풍선이 아래 입력창(ChatInput)에 거의
                          붙어서 보인다는 피드백 — 이 말풍선에만 하단 여백을 추가해서
                          입력창과의 간격을 띄움 */}
                      <div className="flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* [Fix] 완료된 메시지(MessageItem)의 AI 아이콘엔 ml-2로 좌측 여백이
                            있는데, 타이핑(스트리밍) 중인 이 아이콘엔 빠져 있어서 응답이
                            완료되는 순간 아이콘이 옆으로 살짝 튀는 것처럼 보였음 — 동일하게
                            ml-2를 줘서 타이핑 중/완료 후 아이콘 위치가 일관되게 함 */}
                        <div className="shrink-0 w-10 h-10 flex ml-2 items-center justify-center rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-900 shadow-sm">
                          <Logo className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="w-fit max-w-[85%] md:max-w-[75%] px-6 py-5 rounded-2xl bg-white border border-zinc-100 shadow-xl rounded-tl-none">
                          {/* typing이 없을 때만 ... 로딩 점 (첫 청크 수신 대기 중) */}
                          {!hasReceivedFirstChunk && (
                            <div className="flex gap-1.5 items-center h-6">
                              {[0, 1, 2].map((d) => (
                                <span
                                  key={d}
                                  className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
                                  style={{ animationDelay: `${d * 0.2}s` }}
                                />
                              ))}
                            </div>
                          )}
                          {typing && (
                            <div className="leading-7 text-[14.5px] text-zinc-800">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {typing}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <MessageItem
                      index={virtualItem.index}
                      msg={msg}
                      isUser={msg.role === 'user'}
                      showDate={
                        !virtualItems[virtualItem.index - 1] ||
                        !isSameDay(
                          (virtualItems[virtualItem.index - 1] as { time: string }).time,
                          msg.time
                        )
                      }
                      onCopy={copyToClipboard}
                      copiedIndex={copiedIndex}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
export default ChatWindow;
