import { FiSend, FiSquare } from 'react-icons/fi';
import { useRef, useEffect } from 'react';

type Props = {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  loading?: boolean;
  typing?: string;
};

export default function ChatInput({ input, setInput, onSend, onStop, loading, typing }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isStreaming = loading || (typing && typing.length > 0);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }, [input]);

  const handleSend = () => {
    onSend();
    const el = textareaRef.current;
    if (el) el.style.height = 'auto';
  };

  return (
    <div className="p-4 border-t bg-white">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center bg-gray-100 rounded-full focus-within:rounded-2xl px-5 py-2 min-h-[44px] shadow-sm transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="
              w-full
              resize-none
              bg-transparent
              outline-none
              text-sm
              leading-6
              max-h-[100px]
              overflow-y-auto
            "
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;

              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        <button
          onClick={isStreaming ? onStop : onSend}
          className={`
    flex items-center justify-center
    w-11 h-11
    rounded-full
    text-white
    shadow-md
    transition
    shrink-0
    ${loading ? 'bg-red-500 hover:bg-red-400' : 'bg-blue-500 hover:bg-blue-600'}
  `}
        >
          {isStreaming ? <FiSquare /> : <FiSend />}
        </button>
      </div>
    </div>
  );
}
