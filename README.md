# 💬 FlowChat

**Supabase와 OpenRouter API를 활용한 실시간 스트리밍 AI 채팅 플랫폼**입니다.  
단순한 기능 구현을 넘어, 대규모 데이터 스트리밍 처리와 사용자 중심의 세밀한 UI/UX 설계에 집중했습니다.

---

## 🚀 주요 기능 & 구현 포인트

### ⚡ 실시간 스트리밍 및 고도화된 UI 엔진
* **Full Stream Rendering:** OpenRouter API를 활용해 응답을 실시간으로 출력하며, 사용자 대기 시간을 최소화했습니다.
* **Custom Markdown Renderer:** 외부 라이브러리 의존성을 줄이기 위해 직접 커스텀 컴포넌트를 설계하여 **타입 안정성**과 **모바일 자동 줄바꿈(Word-wrap)** 기능을 확보했습니다.
* **Smart UI Interaction:** 텍스트 양에 따라 높이가 조절되는 인풋창과 컨텐츠 크기에 반응하는 가변 너비 말풍선(`w-fit`)으로 자연스러운 채팅 경험을 제공합니다.

### 📚 데이터 관리 및 반응형 설계
* **Database (Supabase):** Supabase DB를 연동하여 채팅 세션과 메시지 이력을 안정적으로 저장하고 관리합니다.
* **Adaptive Interface:** 모바일에서 헤더 레이아웃이 깨지지 않도록 최적화하였으며, 사이드바를 통한 직관적인 채팅 전환을 지원합니다.
* **Visual Clarity:** 파란 배경 말풍선에서도 가독성이 유지되도록 텍스트 렌더링 로직을 분리하고 시각적 명확성을 높였습니다.

---

## 🛠 Case-Study (핵심 트러블슈팅)
> 프로젝트 내 **Case-Study** 섹션에서 상세한 기술적 해결 과정을 확인하실 수 있습니다.

1. **실시간 스트리밍 데이터 핸들링**: 수신되는 Chunk 데이터를 유실 없이 상태에 반영하고 가공하는 과정에서의 성능 최적화 경험.
2. **채팅 컨텍스트 및 세션 유지**: 새로고침이나 페이지 이동 시에도 끊김 없는 대화 흐름을 보존하기 위한 라우팅 및 상태 설계.
3. **효율적 상태 관리 아키텍처**: Zustand와 React Query를 활용해 클라이언트 상태와 서버 데이터의 역할을 명확히 정의한 사례.

---

## 🧠 기술 스택

### Frontend
* **Core:** React, TypeScript, Vite
* **State Management:** Zustand, React Query
* **Styling:** Tailwind CSS
* **Infrastructure:** Supabase

### Backend
* **Runtime:** Node.js (Express)
* **API:** OpenRouter API (LLM Integration)

---

## 🏗 프로젝트 구조

### 📁 Client (src/)
* **api/**: OpenRouter 스트리밍 및 외부 API 통신 로직 관리
* **components/**: ChatInput, ChatWindow, ChatList 기능별 분리된 UI 컴포넌트
* **hooks/**: 채팅 비즈니스 로직 및 상태 제어를 위한 커스텀 훅 모음
* **lib/**: 외부 라이브러리(Supabase) 설정 및 공통 인터페이스
* **pages/**: 메인 채팅 화면 및 Case-Study 등 주요 페이지 구성
* **store/**: useChatStore(Zustand 상태) 및 supabase.ts(DB 클라이언트 초기화)
* **types/**: 데이터 모델 및 컴포넌트 Props를 위한 TypeScript 타입 정의

### 📁 Server
* **index.js**: Express 기반 Proxy 서버. API 키 보안 및 스트리밍 데이터 중계 수행

---

## ⚙️ 실행 방법

**1. 서버 실행 (API Proxy)**
- cd server
- npm install
- npm run dev

**2. 클라이언트 실행**
- ../client
- npm install
- npm run dev

---

## 🔐 환경 변수 설정

**Client (.env)**
- VITE_API_URL=http://localhost:4000
- VITE_SUPABASE_URL=your_supabase_url
- VITE_SUPABASE_ANON_KEY=your_supabase_key

**Server (server/.env)**
- OPENROUTER_API_KEY=your_openrouter_key

---

## 🧑‍💻 느낀 점

> "도구에 의존하기보다, 문제의 본질을 파악하고 직접 해결책을 설계하는 즐거움을 알게 되었습니다."

단순히 AI 채팅 기능을 만드는 것을 넘어, 사용자가 느끼는 작은 불편함까지 엔지니어링으로 해결하며 서비스의 완성도를 높이는 경험을 했습니다. 특히 Supabase를 활용한 데이터 설계와 프론트엔드 성능 최적화 사이의 균형을 고민하며 실무에 필요한 역량을 쌓았습니다.

---

## 🧑‍💻 Author

* **윤찬희** (Frontend Developer)
* **GitHub:** [https://github.com/chanhui0829](https://github.com/chanhui0829)
