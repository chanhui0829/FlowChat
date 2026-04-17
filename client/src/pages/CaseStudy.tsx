import type { ReactNode } from 'react';

/* ---------------- 타입 ---------------- */

type SectionProps = {
  title: string;
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

/* ---------------- 페이지 ---------------- */

export default function CaseStudy() {
  return (
    <div className="flex-1 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* 🔥 HERO */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
          <h1 className="flex items-center text-3xl font-bold mb-2 gap-2 leading-none">
            <span className="text-3xl">💬</span>
            <span>FlowChat</span>
          </h1>
          <p className="opacity-90">Streaming 기반 AI 채팅 애플리케이션</p>

          <div className="flex gap-2 mt-4 flex-wrap">
            {['React', 'Zustand', 'Streaming', 'UX'].map((tag) => (
              <span key={tag} className="text-xs bg-white/20 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <Section title="📌 프로젝트 개요">
          Streaming 기반 AI 채팅 애플리케이션으로, 실시간 응답 처리 과정에서 발생하는 비동기 흐름
          문제와 데이터 정합성 문제를 해결하는 데 집중했습니다. 특히 요청 간 충돌(Race Condition),
          응답 순서 역전, chunk 단위 데이터 처리 문제를 해결하며 자연스럽고 신뢰도 높은 대화 UX를
          구현했습니다.
        </Section>

        <div>
          <h2 className="text-xl font-semibold mb-4">🛠 기술 스택</h2>

          <div className="flex flex-wrap gap-3">
            {['React', 'TypeScript', 'Zustand', 'React Query', 'Tailwind', 'Node.js'].map(
              (tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full shadow-sm hover:bg-gray-200 transition"
                >
                  {tech}
                </span>
              )
            )}
          </div>
        </div>

        {/* 🔥 트러블슈팅 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">🔥 트러블슈팅</h2>

          <div className="space-y-6">
            <Trouble
              title="Streaming 응답 충돌 및 텍스트 깨짐 문제"
              problem={`연속 요청 시 최신 질문과 무관한 응답이 출력되는 치명적인 UX 문제가 발생했습니다.
이후 이전 스트리밍 응답이 뒤늦게 도착하거나, chunk 단위 데이터로 인해 텍스트가 중간에 깨지는 현상도 함께 발생했습니다.`}
              cause={`스트리밍 환경에서는 응답이 chunk 단위로 전달되며 요청 간 완료 순서가 보장되지 않습니다.`}
              solution={`requestId와 AbortController를 조합하여 요청을 제어하고 buffer 기반 파싱을 적용했습니다.`}
              decision={`requestId는 UI 정합성 보장, AbortController는 네트워크 제어, buffer는 안정적 렌더링을 위해 선택했습니다.`}
              before={`응답 순서가 뒤섞이고 텍스트가 깨져 대화 신뢰도가 크게 저하되었습니다.`}
              after={`최신 요청 기준으로만 렌더링되며 텍스트와 코드블럭이 안정적으로 출력되어 UX가 크게 개선되었습니다.`}
            />

            <Trouble
              title="요청 취소 미지원으로 인한 UX 저하"
              problem={`사용자가 요청 흐름을 제어할 수 없어 UX가 단절되는 문제가 발생했습니다.
이후 이전 요청이 계속 진행되며 중복 응답과 불필요한 API 호출이 발생했습니다.`}
              cause={`비동기 요청과 사용자 인터랙션 간 제어 흐름이 분리되어 있었습니다.`}
              solution={`AbortController를 도입해 진행 중 요청을 취소하고 버튼 상태를 동적으로 변경했습니다.`}
              decision={`사용자 제어권 확보와 네트워크 낭비 최소화를 위해 선택했습니다.`}
              before={`여러 응답이 동시에 출력되며 UI 혼란과 리소스 낭비가 발생했습니다.`}
              after={`요청 흐름이 즉시 제어되며 인터랙션 반응성과 UX가 크게 향상되었습니다.`}
            />

            <Trouble
              title="상태와 라우팅 불일치 문제"
              problem={`상태와 라우팅이 분리되어 UI 일관성이 깨지는 문제가 발생했습니다.
이후 채팅 전환 시 2번 클릭해야 반영되거나 상태가 유지되지 않는 문제가 발생했습니다.`}
              cause={`state와 URL이 분리되어 source of truth가 불명확했습니다.`}
              solution={`URL 기반 상태 관리 구조로 통합했습니다.`}
              decision={`라우팅 기반 상태 관리가 확장성과 유지보수에 유리하다고 판단했습니다.`}
              before={`상태 불일치로 인해 UX 흐름이 끊기고 사용자 혼란이 발생했습니다.`}
              after={`단일 source of truth 확보로 상태 일관성과 UX 안정성이 확보되었습니다.`}
            />
          </div>
        </div>

        {/* 🔥 설계 결정 (줄바꿈 + bullet) */}
        <Section title="🧠 설계 결정 (Tech Decisions)">
          {`- Zustand를 선택하여 간결한 전역 상태 관리 구조 구성
- Streaming 기반 응답 처리로 자연스러운 UX 제공
- requestId + AbortController 조합으로 UI/네트워크 동시 제어
- URL을 상태 기준으로 사용하여 일관성 확보`}
        </Section>

        {/* 🔥 결과 */}
        <Section title="📈 결과 및 배운 점">
          스트리밍 기반 환경에서는 단순히 데이터를 받아 렌더링하는 것보다, 요청의 흐름과 상태를
          어떻게 제어하느냐가 훨씬 중요하다는 것을 경험했습니다. 초기에는 응답을 그대로 출력하는
          방식으로 구현했지만, 연속 요청 상황에서 응답 순서가 뒤섞이고 잘못된 데이터가 노출되는
          문제를 겪었습니다. 이를 해결하는 과정에서 requestId를 통한 UI 정합성 제어와
          AbortController를 통한 네트워크 레벨 요청 관리가 각각 다른 역할을 가진다는 것을 이해하게
          되었고, 클라이언트에서도 “요청 제어”가 중요한 설계 요소라는 것을 배웠습니다. 이 경험을
          통해 단순 기능 구현을 넘어서, 사용자 경험을 보장하기 위한 비동기 흐름 설계의 중요성을
          체감할 수 있었습니다.
        </Section>
      </div>
    </div>
  );
}

/* ---------------- 컴포넌트 ---------------- */

function Section({ title, children }: SectionProps) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <p className="text-gray-700 leading-7 whitespace-pre-line">{children}</p>
    </div>
  );
}

function Trouble({ title, problem, cause, solution, decision, before, after }: TroubleProps) {
  return (
    <div className="p-5 border rounded-2xl bg-white shadow-sm hover:shadow-md transition space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>

      <Block label="문제" color="text-red-500" text={problem} />
      <Block label="원인" color="text-orange-500" text={cause} />
      <Block label="해결" color="text-blue-500" text={solution} />
      <Block label="왜 이 방법?" color="text-purple-500" text={decision} />

      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
          <div className="font-semibold text-red-600 mb-1">Before</div>
          {before}
        </div>

        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
          <div className="font-semibold text-green-600 mb-1">After</div>
          {after}
        </div>
      </div>
    </div>
  );
}

function Block({ label, color, text }: BlockProps) {
  return (
    <div>
      <span className={`text-xs font-semibold ${color}`}>{label}</span>
      <p className="text-sm text-gray-700 mt-1 leading-6 whitespace-pre-line">{text}</p>
    </div>
  );
}
