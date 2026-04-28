# 💬 FlowChat 

**Supabase와 OpenRouter API를 활용한 실시간 스트리밍 AI 채팅 플랫폼**입니다.  
단순한 기능 구현을 넘어, **도메인 기반 설계(Feature-based Architecture)** 와 **실시간 데이터 스트리밍 처리**를 통해 확장성 있는 프론트엔드 아키텍처를 구축하는 데 집중했습니다.

---

## 🚀 주요 기능 & 구현 포인트

### ⚡ 고도화된 실시간 스트리밍 엔진
* **Full Stream Rendering:** OpenRouter API와 SSE(Server-Sent Events)를 결합하여 AI 응답을 실시간으로 출력, 사용자 체감 대기 시간을 **80% 이상 단축**했습니다.
* **Real-time UI Sync:** Zustand 기반의 상태 관리로 스트리밍 중인 데이터와 UI를 유연하게 동기화했습니다.

### 🏗️ 도메인 기반 아키텍처 (Feature-based)
* **관심사 분리(SoC):** 비즈니스 로직(Hooks), UI(Components), 데이터 통신(API/Services)을 도메인 단위(`features/chat`)로 응집시켜 유지보수성을 극대화했습니다.
* **Custom Hooks Abstraction:** `useChat`, `useChatListLogic` 등 커스텀 훅을 통해 컴포넌트 내 복잡한 로직을 추상화했습니다.

### 📚 데이터 관리 및 반응형 UX/UI
* **Database (Supabase):** 세션별 대화 이력을 영구 저장하고, 실시간 제목 생성 API(`Tsummarize`)를 연동하여 채팅 목록을 자동 관리합니다.
* **Adaptive Interface:** 모바일 전용 사이드바와 헤더 레이아웃을 최적화하여 데스크탑과 모바일 모두에서 최적의 채팅 경험을 제공합니다.
* **Technical Case Study:** 프로젝트 내 **Case-Study** 페이지를 통해 기술적 트러블슈팅 과정을 시각화하여 기록했습니다.

---

## 🛠 Case-Study (핵심 트러블슈팅)
> 프로젝트 내 **Case-Study** 메뉴에서 상세한 기술적 해결 과정을 확인하실 수 있습니다.

1. **계층화된 아키텍처 도입**: 단일 파일에 비대해진 로직을 도메인별 Feature 구조와 Server Layered 구조로 리팩토링하여 결합도를 낮춘 사례.
2. **실시간 스트리밍 데이터 핸들링**: 수신되는 Chunk 데이터를 유실 없이 상태에 반영하고 가공하는 과정에서의 성능 최적화 경험.
3. **타입 안정성 확보**: API 응답부터 클라이언트 상태까지 TypeScript 인터페이스를 엄격히 적용하여 런타임 에러 최소화.

---

## 🧠 기술 스택

### Frontend
* **Core:** React 18, TypeScript, Vite
* **State Management:** Zustand, TanStack Query (React Query)
* **Styling:** Tailwind CSS, Lucide React (Icons)
* **Communication:** SSE (Server-Sent Events), Axios

### Backend (Proxy)
* **Runtime:** Node.js, Express
* **AI Integration:** OpenRouter API (LLM Integration)

---

## 🏗 프로젝트 구조

### 📁 Client (`src/`)
* **assets/**: 로고 및 정적 이미지 자산 관리
* **components/common/**: Markdown 렌더러 등 전역 재사용 UI 컴포넌트
* **features/chat/**: 채팅 도메인 핵심 로직 응집
    * **api/**: 채팅 관련 API 호출 함수 정의
    * **services/**: 외부 라이브러리(OpenAI 등) 연동 비즈니스 로직
    * **types/**: 채팅 도메인 전용 TypeScript 타입 정의
    * **components/**: ChatWindow, ChatList, MessageItem 등 기능별 UI
    * **hooks/**: `useChat`, `useChatListLogic` 등 도메인 비즈니스 로직
    * **utils/**: 날짜 헬퍼 및 채팅 관련 유틸리티
* **lib/**: Supabase Client 초기화 및 외부 라이브러리 설정
* **pages/**: `ChatPage`, `CaseStudy` 등 주요 라우트 페이지
* **store/**: `chat.store.ts` (Zustand 전역 상태 관리)

### 📁 Server (`server/src/`)
* **routes/**: API 엔드포인트 분리 관리 (`/mcp`)
* **controllers/**: 스트리밍 및 요약 로직 처리부
* **index.ts**: Express 서버 설정 및 미들웨어 통합

---

## ⚙️ 실행 방법

**1. 서버 실행 (API Proxy)** 
```bash
cd server  
npm install  
npm run dev  
```

**2. 클라이언트 실행** 
```bash
cd client  
npm install  
npm run dev
```

---

## 🔐 환경 변수 설정

**Client (.env)** 
```bash
VITE_API_URL=http://localhost:4000  
VITE_SUPABASE_URL=your_supabase_url  
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

**Server (server/.env)** 
```bash
OPENROUTER_API_KEY=your_openrouter_key
```

---

## 🧑‍💻 느낀 점

> "도구의 사용법보다, 문제의 본질을 파악하고 최적의 구조를 설계하는 엔지니어링 과정에 집중했습니다."

단순히 AI 채팅 기능을 구현하는 것을 넘어, 대규모 데이터를 처리할 때 발생하는 UI 병목 현상을 해결하고 컴포넌트 간의 결합도를 낮추기 위한 아키텍처 고민에 많은 시간을 투자했습니다. 이러한 고민의 흔적은 프로젝트 내 **Case-Study** 페이지에 상세히 기록되어 있습니다.

---

## 🧑‍💻 Author

* **윤찬희** (Frontend Developer)
* **GitHub:** [https://github.com/chanhui0829](https://github.com/chanhui0829)
