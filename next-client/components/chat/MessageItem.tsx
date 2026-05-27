'use client';

import { memo } from 'react';
import { FiCopy, FiCheck, FiUser } from 'react-icons/fi';
import Logo from '@/assets/Logo';
import MarkdownRenderer from '@/components/common/markdown/MarkdownRenderer';
import { formatDate, formatTime } from '@/lib/utils/dateHelpers';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

interface MessageItemProps {
  msg: Message;
  showDate: boolean;
  isUser: boolean;
  onCopy: (text: string, i: number) => void;
  copiedIndex: number | null;
  index: number;
}

const MessageItem = memo(
  ({ msg, showDate, isUser, onCopy, copiedIndex, index }: MessageItemProps) => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
        {showDate && (
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="px-4 py-1.5 bg-zinc-50 text-zinc-500 text-[10px] font-bold rounded-full tracking-widest uppercase">
              {formatDate(msg.time)}
            </span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>
        )}

        <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && (
            <div className="shrink-0 w-10 h-10 flex ml-2 items-center justify-center rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-900 ">
              <Logo className="w-5 h-5" />
            </div>
          )}
          <div
            className={`flex flex-col min-w-0 max-w-[calc(100%-5.5rem)] md:max-w-[calc(100%-7rem)] ${
              isUser ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`relative px-5 py-3 rounded-2xl text-[14.5px] leading-7 shadow-sm transition-all [will-change:transform] group min-w-0 w-full ${
                isUser
                  ? 'bg-zinc-900 text-white rounded-tr-none'
                  : 'bg-white text-zinc-800 border border-zinc-100 rounded-tl-none'
              }`}
            >
              {!isUser && (
                <button
                  onClick={() => onCopy(msg.content, index)}
                  className="absolute -top-1 -right-10 p-2 text-zinc-400 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copiedIndex === index ? (
                    <FiCheck size={16} className="text-emerald-500" />
                  ) : (
                    <FiCopy size={16} />
                  )}
                </button>
              )}
              {isUser ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}
            </div>
            <span className="text-[10px] font-bold mt-2 text-zinc-400 uppercase tracking-tighter">
              {formatTime(msg.time)}
            </span>
          </div>
          {isUser && (
            <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-900 shadow-lg text-white">
              <FiUser size={20} />
            </div>
          )}
        </div>
      </div>
    );
  }
);

MessageItem.displayName = 'MessageItem';
export default MessageItem;
