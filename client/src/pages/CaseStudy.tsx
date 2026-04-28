import type { ReactNode } from 'react';
import { FiAlertCircle, FiArrowRight, FiTarget, FiShield, FiTrendingUp } from 'react-icons/fi';

/* ---------------- 타입 정의 ---------------- */

type SectionProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
};

type TroubleProps = {
  title: string;
  problem: string;
  cause: string;
  solution: string;
  decision: string;
  before: string;
  after: string;
};

type BlockProps = {
  label: string;
  color: string;
  text: string;
};

/* ---------------- 페이지 컴포넌트 ---------------- */

export default function CaseStudy() {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#f8f9fc] sidebar-scroll">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-24">
        {/* 🚀 히어로 섹션 */}
        <div className="relative overflow-hidden bg-white p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-blue-50">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-6 tracking-tight">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              프론트엔드 기술 사례 연구
            </div>
            <h1 className="flex items-center text-5xl font-black mb-4 gap-4 tracking-tight text-gray-900">
              <span className="drop-shadow-sm text-5xl">💬</span>
              <span>플로우챗 (FlowChat)</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-2xl">
              실시간 스트리밍 최적화 기술을 통해 <br />
              <span className="text-blue-600 font-bold underline decoration-blue-100 decoration-4 underline-offset-8">
                데이터 무결성 100%
              </span>
              를 구현한 AI 채팅 플랫폼입니다.
            </p>

            <div className="flex gap-2 mt-10 flex-wrap">
              {['React 18', 'TypeScript', 'Zustand', 'Supabase', 'SSE', 'Tailwind'].map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-bold uppercase tracking-wider bg-gray-50 text-gray-400 border border-gray-100 px-4 py-1.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-100/40 rounded-full blur-[100px]" />
          <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-indigo-50/50 rounded-full blur-[100px]" />
        </div>

        {/* 📌 프로젝트 개요 및 지표 성과 */}
        <Section
          title="프로젝트 핵심 요약 및 성과"
          icon={<FiTarget className="text-blue-500 size-6" />}
        >
          <div className="space-y-10 text-gray-600">
            <div className="space-y-5">
              <p className="text-xl leading-relaxed font-bold text-gray-800">
                "단순한 기능 구현을 넘어,{' '}
                <span className="text-blue-600">데이터 무결성 에러 0%</span>를 향한 기술적 검증을
                마쳤습니다."
              </p>
              <p className="text-base leading-8 font-medium text-gray-500">
                AI 응답 스트리밍 시 발생하는 데이터 깨짐 현상과 다중 요청에 의한 상태 오염 문제를
                해결하는 데 집중했습니다. 브라우저 표준 API인 **TextDecoder**와
                **AbortController**를 활용하여 네트워크 레이어에서의 안정성을 확보했습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-blue-50/40 rounded-2xl border border-blue-100 text-center transition-transform hover:scale-105">
                <div className="text-3xl font-black text-blue-600 mb-1">0%</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  데이터 파싱 에러
                </div>
              </div>
              <div className="p-6 bg-indigo-50/40 rounded-2xl border border-indigo-100 text-center transition-transform hover:scale-105">
                <div className="text-3xl font-black text-indigo-600 mb-1">100%</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  응답 스트림 안정성
                </div>
              </div>
              <div className="p-6 bg-emerald-50/40 rounded-2xl border border-emerald-100 text-center transition-transform hover:scale-105">
                <div className="text-3xl font-black text-emerald-600 mb-1">Race-Free</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  다중 요청 제어
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 🔥 핵심 트러블슈팅 */}

        <div className="space-y-10">
          <div className="flex items-center gap-3 px-2">
            <div className="p-3 bg-red-50 rounded-2xl text-red-500 shadow-sm">
              <FiAlertCircle size={28} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              기술적 난제 해결 (Troubleshooting)
            </h2>
          </div>

          <Trouble
            title="한글 깨짐 현상 및 JSON 파싱 에러 0% 달성"
            problem="SSE 스트리밍 중 한글(3byte) 데이터가 패킷 단위로 잘려 들어올 때 JSON.parse가 실패했습니다."
            cause="멀티바이트 문자가 불완전한 상태에서 인코딩을 시도하여 발생하는 구조적 문제였습니다."
            solution="TextDecoderStream과 커스텀 버퍼 큐를 도입하여 데이터 완전성을 검증 후 렌더링하는 로직을 구현했습니다."
            decision="가시성보다 데이터 무결성을 우선시하여 100% 정확한 응답 전달 시스템을 구축했습니다."
            before="긴 답변 출력 중 간헐적인 에러 발생 및 스트리밍 중단."
            after="에러 발생률 0%. 어떤 상황에서도 깨짐 없는 자연스러운 답변 출력."
          />

          <Trouble
            title="AbortController를 통한 동시 요청 경쟁 상태 방어"
            problem="사용자가 답변 도중 '재생성'을 연타할 경우, 이전 스트림과 신규 스트림이 섞여 UI가 오염되었습니다."
            cause="비동기 fetch 요청이 취소되지 않은 채 전역 상태를 업데이트하며 발생하는 Race Condition이었습니다."
            solution="AbortController를 활용하여 신규 요청 시 이전 네트워크 연결을 강제 종료하는 제어 로직을 구축했습니다."
            decision="불필요한 서버 리소스 점유를 막고, 사용자에게 항상 최신 응답만을 보장하도록 설계했습니다."
            before="질문 A와 B의 답변이 섞여서 출력되어 마크다운 형식이 파괴됨."
            after="이전 응답 즉시 차단 및 최신 데이터로의 깨끗한 UI 전환 성공."
          />

          <Trouble
            title="확장성 확보를 위한 도메인 기반 아키텍처 리팩토링"
            problem="프로젝트 규모가 커짐에 따라 단일 폴더 내 파일 비대화 및 관심사 분리(SoC)의 어려움이 발생했습니다."
            cause="기능 중심이 아닌 파일 타입 중심(components, hooks 등)의 구조로 인해 특정 기능을 수정할 때 여러 폴더를 오가야 하는 비효율이 있었습니다."
            solution="Feature-based 구조를 도입하여 도메인(Chat)별로 API, Hooks, Components, Types를 응집시켰습니다."
            decision="단기적인 개발 속도보다 장기적인 유지보수와 협업 효율을 위해 아키텍처 전면 재설계를 단행했습니다."
            before="코드 수정 시 관련 로직을 찾기 위해 프로젝트 전반을 탐색해야 함. 결합도가 높음."
            after="관심사 분리 성공. 새로운 기능 추가 시 해당 도메인 폴더 내에서만 작업 가능하여 생산성 증대."
          />
        </div>

        {/* 🧠 주요 설계 결정 (진한 효과 적용) */}
        <Section
          title="설계 의도 및 기술 선택 (Tech Decisions)"
          icon={<FiShield className="text-purple-500 size-6" />}
        >
          <div className="grid gap-6">
            <div className="group p-8 rounded-3xl bg-white border border-gray-100 hover:border-purple-200 transition-all shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <h4 className="font-bold text-gray-900 text-xl">
                  <span className="text-purple-600 font-black">Zustand</span>
                  <span className="text-gray-300 font-medium px-3">vs</span>
                  <span className="text-gray-400 opacity-50">Redux</span>
                </h4>
                <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black rounded-lg uppercase">
                  State Management
                </span>
              </div>
              <p className="text-[15px] text-gray-600 leading-relaxed font-medium">
                채팅 서비스의 특성상 실시간 데이터 업데이트가 잦습니다. Redux의 복잡한
                보일러플레이트 대신 **가볍고(Small size)**, **클로저 기반으로 불필요한 리렌더링을
                차단**할 수 있는 Zustand를 선택하여 성능과 생산성을 극대화했습니다.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-white border border-gray-100 hover:border-blue-200 transition-all shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <h4 className="font-bold text-gray-900 text-xl">
                  <span className="text-blue-600 font-black">SSE (Stream)</span>
                  <span className="text-gray-300 font-medium px-3">vs</span>
                  <span className="text-gray-400 opacity-50">Polling</span>
                </h4>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase">
                  Real-time Data
                </span>
              </div>
              <p className="text-[15px] text-gray-600 leading-relaxed font-medium">
                서버 리소스를 과도하게 사용하는 Polling 대신 **단방향 스트리밍에 최적화된 SSE**를
                도입했습니다. 이를 통해 AI 특유의 '타이핑 애니메이션'을 부드럽게 구현했으며,
                WebSocket 대비 가벼운 프로토콜로 실시간 통신 효율을 높였습니다.
              </p>
            </div>
          </div>
        </Section>

        {/* 📈 성과 및 회고 */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-white border border-blue-50 p-12 rounded-[3rem] space-y-10 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <FiTrendingUp className="text-green-500 size-7" />
              성과 및 회고
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              <div className="space-y-3">
                <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-md">
                  UX 개선
                </div>
                <p className="text-sm font-bold text-gray-700 leading-relaxed">
                  끊김 없는 스트리밍 처리로 <br />
                  사용자 이탈 방지 및 만족도 향상
                </p>
              </div>
              <div className="space-y-3">
                <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-md">
                  오류 감소
                </div>
                <p className="text-sm font-bold text-gray-700 leading-relaxed">
                  네트워크 레이어 예외 처리로 <br />
                  비정형 데이터 에러 0% 달성
                </p>
              </div>
              <div className="space-y-3">
                <div className="inline-block px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black rounded-md">
                  구조 개선
                </div>
                <p className="text-sm font-bold text-gray-700 leading-relaxed">
                  Zustand 전역 상태 관리를 통한 <br />
                  유지보수 용이한 아키텍처 구축
                </p>
              </div>
            </div>
            <p className="text-lg text-gray-500 leading-relaxed font-medium italic border-l-4 border-blue-100 pl-6 py-2">
              "단순한 기능 구현을 넘어, 네트워크 레벨의 흐름 제어가 사용자 경험에 얼마나 결정적인
              역할을 하는지 깊이 체감했습니다. 기술적 원리를 파고들어 문제를 해결하는 프론트엔드
              개발자의 가치를 증명할 수 있었습니다."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 서브 컴포넌트 ---------------- */

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 px-2 tracking-tight">
        {icon}
        {title}
      </h2>
      <div className="bg-white p-12 rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-50">
        {children}
      </div>
    </div>
  );
}

function Trouble({ title, problem, cause, solution, decision, before, after }: TroubleProps) {
  return (
    <div className="p-12 border border-gray-100 rounded-[3.5rem] bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 space-y-12 group/trouble">
      <div className="space-y-4">
        <span className="inline-block px-4 py-1.5 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl">
          ISSUE CASE
        </span>
        <h3 className="font-black text-3xl text-gray-900 tracking-tighter">{title}</h3>
      </div>

      <div className="grid gap-10">
        <Block label="문제 상황 (PROBLEM)" color="text-red-500 bg-red-50" text={problem} />
        <Block label="발생 원인 (CAUSE)" color="text-orange-500 bg-orange-50" text={cause} />
        <Block label="해결 방안 (SOLUTION)" color="text-blue-600 bg-blue-50" text={solution} />
        <Block label="의사 결정 (DECISION)" color="text-purple-600 bg-purple-50" text={decision} />
      </div>

      <div className="grid md:grid-cols-2 gap-8 pt-6">
        <div className="p-8 bg-[#fffcfc] border border-red-50 rounded-3xl relative overflow-hidden group/box">
          <div className="font-black text-red-400 text-[10px] mb-4 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" /> BEFORE
          </div>
          <p className="text-base text-gray-400 leading-8 font-medium  decoration-red-100">
            {before}
          </p>
        </div>

        <div className="p-8 bg-[#fcfdff] border border-blue-50 rounded-3xl relative overflow-hidden group/box shadow-sm ring-2 ring-blue-50/50">
          <div className="font-black text-blue-500 text-[10px] mb-4 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" /> AFTER
          </div>
          <p className="text-base text-gray-800 leading-8 font-bold">{after}</p>
          <div className="absolute right-6 bottom-6 text-blue-100 transition-transform group-hover/trouble:translate-x-2">
            <FiArrowRight size={32} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({ label, color, text }: BlockProps) {
  return (
    <div className="space-y-3">
      <span
        className={`text-[10px] tracking-tighter font-black px-3 py-1 rounded-md shadow-sm ${color}`}
      >
        {label}
      </span>
      <p className="text-base text-gray-800 leading-relaxed font-bold">{text}</p>
    </div>
  );
}
