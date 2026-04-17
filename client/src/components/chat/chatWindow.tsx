import { useChatStore } from '../../store/chat.store';
import { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from '../markdown/MarkdownRenderer';

type ChatWindowProps = {
  typing: string;
  loading: boolean;
  onQuickSend: (text: string) => void;
};

const formatTime = (time: string) => {
  if (!time) return '';

  const date = new Date(time);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isSameDay = (a: string, b: string) => {
  const d1 = new Date(a);
  const d2 = new Date(b);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSame(date, today)) return '오늘';
  if (isSame(date, yesterday)) return '어제';

  return date.toLocaleDateString();
};

export default function ChatWindow({ typing, loading, onQuickSend }: ChatWindowProps) {
  const { chats, currentChatId } = useChatStore();
  const currentChat = chats.find((c) => c.id === currentChatId);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: typing ? 'auto' : 'smooth',
    });
  }, [currentChat?.messages, typing, loading]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex-1 min-h-0 w-full px-4 md:px-8 py-6 overflow-y-auto bg-gray-50">
      {/* 초기 화면 */}
      {!currentChat?.messages.length && !typing && !loading && (
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-4">🤖</div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">무엇이든 물어보세요</h1>
            <p className="text-gray-500 text-sm mb-6">AI와 실시간으로 대화해보세요 🚀</p>

            <div className="flex flex-wrap justify-center gap-2">
              {['React 설명해줘', 'useEffect 쉽게 설명', '면접 질문 추천해줘'].map((q) => (
                <button
                  key={q}
                  onClick={() => onQuickSend(q)}
                  className="px-4 py-2 text-sm bg-white border rounded-xl hover:bg-gray-100 transition shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 기존 메시지 */}
      {currentChat?.messages.map((msg, i) => {
        const prev = currentChat.messages[i - 1];
        const showDate = !prev || !isSameDay(prev.time, msg.time);

        return (
          <div key={i}>
            {showDate && (
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <div className="text-xs text-gray-400">{formatDate(msg.time)}</div>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="flex flex-col items-end mb-4 max-w-[80%]">
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-2xl shadow-md">
                    <div className="whitespace-pre-wrap text-sm leading-6">
                      <MarkdownRenderer content={msg.content} />
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 pr-2">{formatTime(msg.time)}</div>
                </div>
              ) : (
                <div className="flex gap-3 mb-6">
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-300">
                    🤖
                  </div>
                  <div className="w-full max-w-[65%] sm:max-w-[75%] relative px-5 py-4 rounded-2xl bg-white border shadow-md">
                    <button
                      onClick={() => copyToClipboard(msg.content, i)}
                      className="absolute top-2 right-3 text-xs opacity-40 hover:opacity-100"
                    >
                      {copiedIndex === i ? '✅' : '📋'}
                    </button>

                    <div className="text-xs text-gray-400 mb-2">AI 답변</div>

                    <MarkdownRenderer content={msg.content} />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 🔥 1. 로딩  */}
      {loading && typing.length === 0 && (
        <div className="flex gap-3 mb-6">
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-300">
            🤖
          </div>

          <div className="px-5 py-4 rounded-2xl bg-white border shadow-md">
            <div className="text-xs text-gray-400 mb-2">AI 답변</div>

            <div className="flex gap-1 text-gray-400 text-lg">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce [animation-delay:0.2s]">.</span>
              <span className="animate-bounce [animation-delay:0.4s]">.</span>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 2. 타이핑 */}
      {typing && (
        <div className="flex gap-3 mb-6">
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-300">
            🤖
          </div>

          <div className="w-full max-w-[70%] px-5 py-4 rounded-2xl bg-white border shadow-md">
            <div className="text-xs text-gray-400 mb-2">AI 답변</div>

            <div className="whitespace-pre-wrap break-words leading-7 text-sm text-gray-800">
              <MarkdownRenderer content={typing} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
