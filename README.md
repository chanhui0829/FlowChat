# 💬 FlowChat

**Next.js 16과 OpenRouter API를 활용한 실시간 스트리밍 AI 채팅 플랫폼**입니다.  
단순한 기능 구현을 넘어, **CSR에서 SSR로의 아키텍처 마이그레이션**과 **실시간 데이터 스트리밍 최적화**를 통해 성능과 사용자 경험을 극대화하는 데 집중했습니다.

---

## 🚀 주요 기능 & 구현 포인트

### 🔄 아키텍처 마이그레이션 (CSR → SSR)
* **Next.js App Router 도입:** 기존 React SPA(CSR) 구조에서 Next.js 15 App Router로 마이그레이션하여 SSR(Server-Side Rendering)을 구현했고, 이후 Next.js 16으로 업그레이드했습니다.
* **초기 로딩 성능 개선:** 서버 사이드 렌더링으로 첫 페이지 로드 시 즉각적인 콘텐츠 표시를 달성하고 LCP(Largest Contentful Paint) 지표를 개선했습니다.
* **SEO 최적화:** SSR 구조를 통해 검색 엔진 최적화를 달성하고 메타데이터 관리를 체계화했습니다.
* **동적 라우팅 params 처리:** Next.js 15의 변경사항인 params Promise 처리를 적용하여 최신 App Router 패턴을 준수했습니다.

### ⚡ 고도화된 실시간 스트리밍 엔진
* **Full Stream Rendering:** OpenRouter API와 SSE(Server-Sent Events)를 결합하여 AI 응답을 실시간으로 출력, 첫 글자가 화면에 표시되는 속도를 최적화하여 사용자 체감 대기 시간을 최소화했습니다.
* **Real-time UI Sync:** Zustand 기반의 상태 관리로 스트리밍 중인 데이터와 UI를 유연하게 동기화했습니다.
* **안정적인 데이터 파싱 처리:** TextDecoder와 커스텀 버퍼 큐를 도입하여 스트리밍 중 발생하는 한글 멀티바이트 문자 깨짐 현상을 근본적으로 해결하고, 비정형 데이터 파싱 예외 처리의 견고함을 높였습니다.

### 🚀 성능 최적화
* **React Performance Optimization:** React.memo, useCallback을 적용하여 불필요한 리렌더링을 방지하고 렌더링 성능을 최적화했습니다.
* **Virtual Scrolling:** TanStack Virtual 라이브러리를 도입하여 대량의 메시지도 부드럽게 스크롤할 수 있는 가상 스크롤을 구현했습니다.
* **Markdown Rendering:** ReactMarkdown과 remarkGfm을 사용하여 마크다운 형식을 효율적으로 렌더링합니다.

### 🛡️ 안정성 강화
* **Race Condition 방어:** `AbortController`를 활용하여 다중 요청 시 이전 스트림을 강제 종료하고 UI 오염을 방지했습니다.
* **에러 핸들링:** 네트워크 레이어 예외 처리(디코딩 유효성 검증 및 버퍼 제어)를 통해 비정형 데이터 파싱 실패 가능성을 최소화하고 런타임 안정성을 확보했습니다.

### 📱 반응형 UX/UI
* **Adaptive Interface:** 모바일 전용 사이드바와 헤더 레이아웃을 최적화하여 데스크탑과 모바일 모두에서 최적의 채팅 경험을 제공합니다.
* **Custom Scrollbar:** 브라우저 환경을 고려한 세련된 커스텀 스크롤바 구현(`:hover` 최적화)으로 깔끔한 UI를 유지합니다.

---

## 🛠 Case-Study (핵심 트러블슈팅)
> 프로젝트 내 **Case-Study** 메뉴에서 상세한 기술적 해결 과정을 확인하실 수 있습니다.

1. **실시간 스트리밍 한글 깨짐 및 파싱 에러 방지** (TextDecoder 도입)
2. **AbortController를 통한 경쟁 상태(Race Condition) 방어**
3. **CSR에서 Next.js SSR로의 아키텍처 마이그레이션** (초기 로딩 속도 및 SEO 최적화)

---

## 🧠 기술 스택

### Frontend
* **Framework:** Next.js 16 (App Router), React 19
* **Language:** TypeScript
* **State Management:** Zustand
* **Styling:** Tailwind CSS
* **Icons:** React Icons (Feather Icons)
* **Performance:** TanStack Virtual (Virtual Scrolling)
* **Markdown:** ReactMarkdown, remarkGfm
* **Communication:** SSE (Server-Sent Events)

### Backend (Proxy)
* **Runtime:** Node.js, Express
* **AI Integration:** OpenRouter API (LLM Integration)

---

## 🏗 프로젝트 구조

### 📁 Next.js App Router 구조 (`next-client/`)
```
next-client/
├── app/                          # Next.js App Router
│   ├── casestudy/
│   │   └── page.tsx             # 기술 케이스 스터디 페이지
│   ├── chat/
│   │   └── [id]/
│   │       └── page.tsx         # 동적 라우팅 채팅 페이지
│   ├── layout.tsx               # 루트 레이아웃
│   ├── page.tsx                 # 메인 페이지
│   └── globals.css              # 전역 스타일
├── components/
│   ├── chat/                    # 채팅 관련 컴포넌트
│   │   ├── ChatLayout.tsx       # 채팅 레이아웃 (재사용 가능)
│   │   ├── ChatList.tsx         # 채팅 히스토리 사이드바
│   │   ├── ChatWindow.tsx       # 채팅 메시지 창
│   │   ├── ChatInput.tsx        # 메시지 입력 컴포넌트
│   │   ├── MessageItem.tsx      # 개별 메시지 아이템
│   │   └── WelcomeScreen.tsx    # 초기 웰컴 스크린
│   └── common/                  # 공통 컴포넌트
│       └── markdown/            # 마크다운 렌더링 컴포넌트
├── hooks/                       # 커스텀 훅
│   ├── useChat.ts               # 채팅 로직 훅
│   ├── useChatListLogic.ts      # 채팅 리스트 로직 훅
│   ├── useChatScroll.ts         # 스크롤 관리 훅
│   └── useVirtualScroll.ts      # 가상 스크롤 훅
├── lib/
│   ├── api/                     # API 호출 모듈
│   ├── services/                # 외부 서비스 연동
│   ├── store.ts                 # Zustand 전역 상태 관리
│   ├── supabase.ts              # Supabase 클라이언트
│   ├── types/                   # TypeScript 타입 정의
│   └── utils/                   # 유틸리티 함수
├── assets/                      # 정적 자산
└── public/                      # 공개 정적 파일
```

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
cd next-client
npm install
npm run dev
```

---

## 🔐 환경 변수 설정

**Client (next-client/.env)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

**Server (server/.env)**
```bash
OPENROUTER_API_KEY=your_openrouter_key
```

---

## 🧑‍💻 기술적 성과

> "아키텍처 마이그레이션과 네트워크 레벨의 최적화가 사용자 경험에 얼마나 결정적인 역할을 하는지 깊이 체감했습니다."

단순히 AI 채팅 기능을 구현하는 것을 넘어, **CSR에서 SSR로의 전면적인 아키텍처 변경**을 통해 초기 로딩 속도와 SEO 최적화를 달성했습니다.  
또한 실시간 스트리밍 시 발생하는 데이터 깨짐 현상과 Race Condition 문제를 해결하며 스트리밍 안정성을 확보했습니다.

---

## 🧪 Testing & Quality Assurance
프로젝트의 핵심 비즈니스 로직과 사용자 인터랙션의 안정성을 확보하기 위해 **Vitest**와 **React Testing Library**를 도입하여 단위 테스트를 구현했습니다.

### 주요 테스트 전략
* **Unit Testing (Utility Functions):** `dateHelpers.ts` 등 데이터 처리 로직의 경계값과 예외 케이스를 테스트하여 날짜 계산 및 시간 포맷팅의 정확성을 보장합니다.
* **Component Testing (UI Logic):** `ChatInput.tsx` 등 핵심 UI 컴포넌트의 사용자 인터랙션(전송, 중지, 상태 변화)을 시뮬레이션하여 예상치 못한 렌더링 오류를 방지합니다.

## 🧑‍💻 Author

* **윤찬희** (Frontend Developer)
* **GitHub:** [https://github.com/chanhui0829](https://github.com/chanhui0829)