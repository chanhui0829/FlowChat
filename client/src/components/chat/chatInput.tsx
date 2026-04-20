import { FiSend, FiSquare } from 'react-icons/fi';
import { useRef, useEffect, useCallback } from 'react';

type Props = {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  loading?: boolean;
  typing?: string;
};

/**
 * 메시지 입력 컴포넌트
 * 자동 높이 조절(Auto-growing) 및 Composition 상태를 고려한 엔터 키 이벤트를 처리합니다.
 */
export default function ChatInput({ input, setInput, onSend, onStop, loading, typing }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 현재 스트리밍 중인지 여부 판단
  const isStreaming = loading || (typing && typing.length > 0);

  /**
   * [UX 최적화] 입력 내용에 따라 텍스트 영역의 높이를 동적으로 조절합니다.
   * 최대 높이(100px)를 초과하면 스크롤이 발생하도록 설계되었습니다.
   */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }, [input]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    onSend();
    // 전송 후 높이 초기화
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, onSend]);

  return (
    <div className="p-4 border-t bg-white">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center bg-gray-100 rounded-full focus-within:rounded-2xl px-5 py-2 min-h-[44px] shadow-sm transition-all duration-200 sidebar-scroll ">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="w-full resize-none bg-transparent outline-none text-sm leading-6 max-h-[100px] overflow-y-auto py-1"
            onKeyDown={(e) => {
              // 한글 조합 중 엔터 키 중복 전송 방지
              if (e.nativeEvent.isComposing) return;

              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        {/* 전송/중단 버튼 - 상태에 따라 UI 유동적 변경 */}
        <button
          onClick={isStreaming ? onStop : handleSend}
          disabled={!isStreaming && !input.trim()}
          className={`
            flex items-center justify-center w-11 h-11 rounded-full text-white shadow-md transition-all shrink-0
            ${
              isStreaming
                ? 'bg-red-500 hover:bg-red-600 active:scale-95'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-gray-300 disabled:shadow-none'
            }
          `}
        >
          {isStreaming ? <FiSquare size={18} fill="white" /> : <FiSend size={18} />}
        </button>
      </div>
    </div>
  );
}
