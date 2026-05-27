'use client';

import { memo, useMemo } from 'react';
import Logo from '@/assets/Logo';

interface WelcomeScreenProps {
  onQuickSend: (text: string) => void;
}

const WelcomeScreen = memo(({ onQuickSend }: WelcomeScreenProps) => {
  /**
   * [Optimization] useMemo로 suggestions 메모이제이션
   * 매번 렌더링 시 배열 재생성 방지
   */
  const suggestions = useMemo(
    () => [
      { q: '오늘 점심 메뉴 추천해줘', d: '든든하고 맛있는 한 끼' },
      { q: '주말 여행지 추천해줘', d: '이번 주말 떠나기 좋은 곳' },
      { q: '간단한 스트레칭 방법', d: '집에서 따라하기 쉬운 루틴' },
      { q: '동기부여 명언 알려줘', d: '힘찬 하루를 위한 메시지' },
    ],
    []
  );

  return (
    <div className="flex flex-col w-full h-full items-center justify-center animate-in fade-in duration-700 px-4">
      <div className="flex flex-col items-center max-w-lg w-full text-center">
        <div className="flex flex-row md:flex-col items-center justify-center gap-4 md:gap-0 mb-6 md:mb-10 w-full">
          <div className="w-14 h-14 md:w-24 md:h-24 bg-zinc-100 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center shadow-sm shrink-0 ring-1 ring-zinc-200/50">
            <Logo className="w-7 h-7 md:w-12 md:h-12 animate-pulse text-zinc-900" />
          </div>
          <div className="flex flex-col items-start md:items-center text-left md:text-center mt-0 md:mt-8">
            <h1
              className="font-black text-zinc-900 tracking-tight leading-tight"
              style={{ fontSize: 'clamp(1.15rem, 5vw, 1.875rem)', margin: 0 }}
            >
              무엇을 도와드릴까요?
            </h1>
            <p className="hidden md:block text-zinc-500 text-sm mt-3 leading-relaxed">
              Flow AI와 함께 더 스마트하고 명쾌한 대화를 시작해보세요.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
          {suggestions.map((item) => (
            <button
              key={item.q}
              onClick={() => onQuickSend(item.q)}
              className="p-3.5 md:p-5 bg-zinc-50 border border-zinc-100 rounded-xl md:rounded-2xl hover:bg-white hover:border-zinc-300 hover:shadow-xl transition-all text-left group active:scale-[0.98]"
            >
              <div className="text-[12.5px] md:text-[13.5px] font-bold text-zinc-800 group-hover:text-zinc-950 mb-0.5 transition-colors line-clamp-1">
                {item.q}
              </div>
              <div className="text-[10px] md:text-[11px] text-zinc-400 font-medium">{item.d}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';
export default WelcomeScreen;
