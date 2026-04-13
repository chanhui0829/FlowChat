import { useChatStore } from '../store/chat.store';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useEffect, useRef } from 'react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { Components } from 'react-markdown';

/**
 * 🔥 Markdown
 */
const markdownComponents: Components = {
  code(props) {
    const { className, children } = props;

    const match = /language-(\w+)/.exec(className || '');
    const isInline = !String(children).includes('\n');

    if (!isInline && match) {
      return (
        <SyntaxHighlighter style={oneLight} language={match[1]} PreTag="div">
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }

    return <code className="bg-gray-200 px-1 rounded">{children}</code>;
  },
};

type ChatWindowProps = {
  typing: string;
  loading: boolean;
};

export default function ChatWindow({ typing, loading }: ChatWindowProps) {
  const { chats, currentChatId } = useChatStore();
  const currentChat = chats.find((c) => c.id === currentChatId);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages, typing, loading]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      {currentChat?.messages.map((msg, i) => (
        <div
          key={i}
          className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
        >
          {/* 말풍선 */}
          <div
            className={`relative group max-w-[80%] px-4 py-2 rounded-2xl ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            <button
              onClick={() => copyToClipboard(msg.content, i)}
              className="absolute top-1 right-2 text-xs opacity-0 group-hover:opacity-100"
            >
              {copiedIndex === i ? '✅' : '📋'}
            </button>

            <div className="prose prose-sm max-w-none">
              <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* 🔥 말풍선 밖 시간 */}
          <div className="text-[10px] text-gray-400 mt-1 px-1">
            {msg.time &&
              new Date(msg.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
          </div>
        </div>
      ))}

      {/* 타이핑 */}
      {typing && (
        <div className="flex flex-col items-start">
          <div className="bg-gray-100 px-4 py-2 rounded-xl w-fit">
            <ReactMarkdown>{typing}</ReactMarkdown>
          </div>

          <div className="text-[10px] text-gray-400 mt-1 px-1">
            {new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
