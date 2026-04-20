import type { Components } from 'react-markdown';
import { CopyButton } from './CopyButton';

/**
 * @description 마크다운 렌더링을 위한 UI 컴포넌트 구성
 * @author 찬희 (REACT-CHANWEB)
 * @features
 * 1. 자동 줄바꿈 (Word Wrap) 및 긴 단어 끊기 적용
 * 2. 코드 블록 내 주석(Comment) 하이라이팅 로직 포함
 * 3. 외부 라이브러리 의존성을 최소화하여 타입 안전성 확보
 */

export const markdownComponents: Components = {
  /**
   * 타이포그래피 설정
   */
  h1: ({ children }) => (
    <h1 className="text-xl md:text-2xl font-black mt-8 mb-4 tracking-tight text-slate-800 opacity-95">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg md:text-xl font-bold mt-6 mb-3 tracking-tight text-slate-800 opacity-90">
      {children}
    </h2>
  ),
  p: ({ children }) => (
    <p className="leading-7 mb-4 last:mb-0 text-slate-700 text-[14.5px]">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 space-y-2 my-4 text-slate-700">{children}</ul>
  ),
  li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-blue-600 px-0.5">{children}</strong>,

  /**
   * 코드 렌더링 컴포넌트
   */
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className || '');
    const codeContent = String(children).replace(/\n$/, '');
    const isInline = !className;

    // 인라인 코드 스타일 (텍스트 중간 강조용)
    if (isInline) {
      return (
        <code className="bg-slate-100 text-rose-500 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono font-medium">
          {children}
        </code>
      );
    }

    // 코드 블록 내 주석 스타일링을 위한 텍스트 처리
    const renderCodeWithComments = (text: string) => {
      // 단일행(//) 및 다중행(/* */) 주석 패턴 매칭
      const parts = text.split(/(\/\/.*|\/\*[\s\S]*?\*\/)/g);
      return parts.map((part, i) => {
        if (part.startsWith('//') || part.startsWith('/*')) {
          return (
            <span key={i} className="text-slate-500 italic opacity-80">
              {part}
            </span>
          );
        }
        return part;
      });
    };

    return (
      <div className="relative group my-7 overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a] shadow-2xl">
        {/* 상단 윈도우 컨트롤 바 */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-white/5 backdrop-blur-sm">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]/80" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]/80" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]/80" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              {match ? match[1] : 'code'}
            </span>
            <CopyButton text={codeContent} />
          </div>
        </div>

        {/* 코드 출력 영역 (줄바꿈 대응 필수 설정) */}
        <pre className="p-5 md:p-6 overflow-x-auto text-[13.5px] leading-6 font-mono text-slate-200">
          <code
            className="block whitespace-pre-wrap break-all"
            style={{
              backgroundColor: 'transparent',
              padding: 0,
              fontFamily: 'inherit',
              color: '#e2e8f0',
            }}
          >
            {renderCodeWithComments(codeContent)}
          </code>
        </pre>
      </div>
    );
  },
};
