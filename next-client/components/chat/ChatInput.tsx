'use client';

import { FiSend, FiSquare } from 'react-icons/fi';
import { useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '@/lib/store';

/**
 * [Interface 정의]
 * isSending, isStreaming prop 제거 — store에서 직접 구독하여 prop drilling 제거
 */
interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (overrideInput?: string) => void;
  onStop?: () => void;
  typing?: string;
}

/**
 * @description 채팅 입력 영역 컴포넌트
 * 1. IME Composition 대응: 한글 입력 시 엔터 이벤트 중복 발생 문제를 해결하여 전송 오류를 방지함.
 * 2. Dynamic Height: 입력 길이에 따라 높이가 가변적으로 변하는 Textarea를 구현하여 몰입감을 높임.
 * 3. Dynamic Action Button: store의 isStreaming을 직접 구독하여 '전송'과 '중단'으로 버튼 역할을 정확히 전환.
 *    - 기존 isSending prop 방식은 isCreatingChat/isSavingMessage까지 포함되어 오작동 발생
 *    - store.isStreaming은 SSE 첫 청크 수신 시점에만 true → 정확한 AI 응답 구간만 감지
 */
export default function ChatInput({ input, setInput, onSend, onStop, typing }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // prop 대신 store에서 직접 구독 — isCreatingChat/isSavingMessage와 분리된 정확한 스트리밍 상태
  const isStreaming = useChatStore((state) => state.isStreaming);

  // 중지 버튼 표시 조건:
  //   - isStreaming: AI가 실제 SSE 응답 중
  //   - typing: 청크가 이미 화면에 렌더링 중 (isStreaming이 false로 바뀌는 찰나의 타이밍 보정)
  const showStopButton = isStreaming || !!(typing && typing.length > 0);

  /**
   * Auto-growing Textarea Logic
   * 입력된 내용의 scrollHeight를 추적하여 높이를 동적으로 조절합니다.
   * 최대 높이(100px)를 제한하여 과도한 높이 확장을 방지하고 스크롤을 유도합니다.
   */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto'; // 높이 초기화 후 재계산 (필수)
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }, [input]);

  /**
   * [Performance] useCallback을 활용한 메모이제이션
   * 불필요한 함수 재생성을 방지하고, 전송 후 텍스트 영역 높이를 명시적으로 리셋합니다.
   */
  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    onSend();

    // 전송 후 textarea 높이 초기화
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, onSend]);

  return (
    <div className="p-6 bg-transparent">
      <div className="w-full mx-auto flex items-end gap-3.5">
        {/* Input Container */}
        <div
          className="
            flex-1 flex items-center bg-white border border-zinc-200/60 rounded-3xl px-5 py-2.5
            min-h-[56px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300
            focus-within:border-zinc-300 focus-within:shadow-[0_8px_40px_rgba(0,0,0,0.08)]
            focus-within:ring-4 focus-within:ring-zinc-100
          "
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="AI에게 무엇이든 물어보세요..."
            className="
              w-full resize-none bg-transparent outline-none text-[14.5px] leading-relaxed
              max-h-[120px] overflow-y-auto py-2.5 text-zinc-800 placeholder:text-zinc-400
              scrollbar-hide
            "
            onKeyDown={(e) => {
              /**
               * [Troubleshooting] IME(Input Method Editor) 대응
               * 한글/일어 등 조합 문자 입력 시 Enter 키를 누를 때 이벤트가 두 번 발생하는
               * 'isComposing' 현상을 방지하여 중복 전송을 차단합니다.
               */
              if (e.nativeEvent.isComposing) return;

              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        {/* Action Button: store.isStreaming 기준으로 전송/중단 전환 */}
        <button
          onClick={showStopButton ? onStop : handleSend}
          disabled={!showStopButton && !input.trim()}
          className={`
            flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 shrink-0 mb-1
            ${
              showStopButton
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 active:scale-90 shadow-sm'
                : 'bg-zinc-900 hover:bg-black text-white active:scale-95 shadow-xl shadow-zinc-200 disabled:bg-zinc-200 disabled:shadow-none disabled:text-zinc-400'
            }
          `}
          aria-label={showStopButton ? '응답 중지' : '메시지 전송'}
        >
          {showStopButton ? (
            <FiSquare size={18} className="fill-current text-zinc-900" />
          ) : (
            <FiSend size={19} className="relative left-[-1px] top-[1px]" />
          )}
        </button>
      </div>
    </div>
  );
}
