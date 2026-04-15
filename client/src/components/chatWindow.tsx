import { useChatStore } from '../store/chat.store';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useRef } from 'react';

import type { Components } from 'react-markdown';

type ChatWindowProps = {
  typing: string;
  loading: boolean;
  onQuickSend: (text: string) => void;
};

/**
 * 🔥 Markdown 설정 (가독성 개선)
 */
const markdownComponents: Components = {
  p({ children }) {
    return <p className="leading-7 text-gray-800">{children}</p>;
  },

  strong({ children }) {
    return <strong className="font-semibold text-gray-900">{children}</strong>;
  },

  code({ children }) {
    return (
      <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">
        {children}
      </code>
    );
  },

  pre({ children }) {
    const child = children as React.ReactElement<{ children: React.ReactNode }>;
    const code = child?.props?.children ?? '';

    const text = Array.isArray(code) ? code.join('') : String(code);

    const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
      navigator.clipboard.writeText(text);

      e.currentTarget.innerText = '✅';

      setTimeout(() => {
        e.currentTarget.innerText = '📋';
      }, 1500);
    };

    return (
      <div className="relative group">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-white border text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition"
        >
          📋 복사
        </button>

        <pre className="bg-gray-100 text-gray-800 p-4 rounded-xl overflow-x-auto text-sm leading-6 border">
          {children}
        </pre>
      </div>
    );
  },
};

export default function ChatWindow({ typing, loading, onQuickSend }: ChatWindowProps) {
  const { chats, currentChatId } = useChatStore();
  const currentChat = chats.find((c) => c.id === currentChatId);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  /**
   * 🔥 자동 스크롤
   */
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
    <div className="flex-1 min-h-0 px-4 md:px-8 py-6 overflow-y-auto bg-gray-50">
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

      {currentChat?.messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
        >
          {/* USER */}
          {msg.role === 'user' ? (
            <div className="relative group w-fit max-w-[80%] px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 shadow-md flex items-center leading-6 mb-6">
              <div className="whitespace-pre-wrap break-words leading-7 text-sm ">
                <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            /* AI */
            <div className="flex gap-3 w-full max-w-[85%]">
              {/* 프로필 */}
              <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-sm shadow">
                🤖
              </div>

              {/* 메시지 카드 */}
              <div className="relative group px-5 py-4 rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-lg transition">
                <button
                  onClick={() => copyToClipboard(msg.content, i)}
                  className="absolute top-2 right-3 text-xs opacity-40 hover:opacity-100 transition"
                >
                  {copiedIndex === i ? '✅' : '📋'}
                </button>

                <div className="text-xs text-gray-400 mb-2">AI 답변</div>

                <div className="whitespace-pre-wrap break-words leading-7 text-sm text-gray-800">
                  <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 로딩 */}
      {loading && !typing && (
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-300">
            🤖
          </div>

          <div className="bg-white shadow-md px-4 py-2 rounded-xl flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
          </div>
        </div>
      )}

      {/* 타이핑 */}
      {typing && (
        <div className="flex gap-3 w-full max-w-[85%]">
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-300">
            🤖
          </div>

          <div className="px-5 py-4 rounded-2xl bg-white border border-gray-200 shadow-md">
            <div className="text-xs text-gray-400 mb-2">AI 답변</div>

            <div className="whitespace-pre-wrap break-words leading-7 text-sm text-gray-800">
              <ReactMarkdown components={markdownComponents}>{typing}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
