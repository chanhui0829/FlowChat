'use client';

import { useState, useCallback, memo } from 'react';
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
}
/**
 * @description 채팅 메시지 목록 및 실시간 스트리밍 응답을 시각화하는 핵심 컴포넌트
 */

const ChatWindow = memo(function ChatWindow({ typing, onQuickSend }: ChatWindowProps) {
  const { chats, currentChatId } = useChatStore();

  // isCreatingChat: 새 채팅방 생성 중인지 (AI 응답과 무관)
  // isStreaming: AI가 실제로 응답 스트리밍 중인지

  const isStreaming = useChatStore((state) => state.isStreaming);

  const currentChat = chats.find((c) => c.id === currentChatId);

  // 새 채팅 생성 중이거나 메시지/typing이 없으면 WelcomeScreen
  const isNewChat = !currentChat?.messages.length && !typing && !isStreaming;

  const lastMessage = currentChat?.messages[currentChat.messages.length - 1];
  const isLastMessageStreaming =
    lastMessage?.role === 'assistant' && lastMessage.content === typing;

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  const displayMessages = currentChat?.messages || [];

  /**
   * 가상 스트리밍 메시지 추가 조건:
   *   - isStreaming: AI가 실제로 응답 중일 때만
   *   - isCreatingChat은 제외 — 채팅방 생성은 AI 응답과 무관, 말풍선 불필요
   *   - isSavingMessage도 제외 — 저장은 백그라운드 작업
   */
  const shouldShowStreamingBubble = isStreaming && !isLastMessageStreaming;

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

  return (
    <div className="flex-1 h-full w-full bg-white relative overflow-hidden">
      {isNewChat ? (
        <WelcomeScreen onQuickSend={onQuickSend} />
      ) : (
        <div className="pt-4 h-full flex flex-col relative">
          <div
            ref={parentRef}
            className="overflow-y-auto sidebar-scroll absolute inset-0"
            onScroll={handleScroll}
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
                      <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-900 shadow-sm">
                          <Logo className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="w-fit max-w-[85%] md:max-w-[75%] px-6 py-5 rounded-2xl bg-white border border-zinc-100 shadow-xl rounded-tl-none">
                          {/* typing이 없을 때만 ... 로딩 점 (첫 청크 수신 대기 중) */}
                          {!typing && (
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
