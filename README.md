# 🤖 AI Chat System (MCP + Naver Search)
---

## 📝 프로젝트 설명
AI 기반 채팅 시스템으로  
LLM(OpenRouter) + 외부 API(Naver)를 결합하여  
실시간 정보 검색과 자연어 응답을 제공하는 서비스입니다.

---

## 🚀 주요 기능

### 🧠 AI 응답 시스템
- OpenRouter 기반 LLM 사용
- 일반 질문에 대해 자연어 응답 생성

---

### 🔍 실시간 검색 기능 (Tool System)
- 특정 조건에서 자동으로 Naver API 호출
- 최신 정보 / 출시일 / 뉴스 검색 지원
- LLM + 외부 API 결합 구조

---

## 💬 채팅 UI (UX 중심 설계)

### ✨ Markdown 렌더링
- 코드 블럭 지원
- 강조 / 리스트 / 제목 표시
- 가독성 향상

---

### ✨ 섹션 자동 분리
- `##`, `###` 기준으로 응답 자동 분리
- 긴 AI 응답을 카드 단위로 구조화
- 가독성 대폭 개선

---

### ✨ 코드 블럭 복사 기능
- 각 코드 블럭별 Copy 버튼 제공
- 개발자 사용성 개선

---

### ✨ 전체 메시지 복사
- AI 답변 전체 복사 기능 제공

---

### ✨ 자동 스크롤
- 새 메시지 생성 시 자동 하단 이동

---

### ✨ 타이핑 애니메이션
- AI 응답 생성 중 typing 효과 적용

---

### ✨ 로딩 애니메이션
- 점 3개 bounce UI

---

### ✨ 반응형 UI (Responsive)
- 모바일: max-width 95%
- PC: max-width 80%
- 모든 디바이스에서 가독성 유지

---

### ✨ 가로 스크롤 UX 개선
- 텍스트: 자동 줄바꿈 처리
- 코드 블럭: 내부 스크롤 적용
- 테이블: 내부 스크롤 적용
- 전체 화면 가로 스크롤 제거

---

### ✨ 커스텀 삭제 모달 (UX 개선)
- 채팅 삭제 시 confirm 모달 적용
- 사용자 실수 방지
- 기본 alert 대신 UI 일관성 유지

---

## 🧩 상태 관리
- Zustand 기반 채팅 상태 관리
- Chat 단위 저장 및 전환

---

## 🏗️ 아키텍처

```
Frontend (React + Vite)
        │
        ▼
Backend (Express)
        │
   ┌───────────────┐
   │ OpenRouter LLM │
   └───────────────┘
        │
        ▼
   ┌───────────────┐
   │  Naver API     │
   └───────────────┘
```

---

## 🛠️ 기술 스택
### Frontend
- React + TypeScript
- Zustand
- Tailwind CSS
- React Markdown
- React Syntax Highlighter

### Backend
- Node.js + Express
- Axios
- OpenRouter API
- Naver Open API

---

## ⚙️ 환경 변수
### Frontend (.env)
VITE_API_URL=https://your-render-url

### Backend (.env)
OPENROUTER_API_KEY=your_key
NAVER_CLIENT_ID=your_id
NAVER_CLIENT_SECRET=your_secret

---

## 📦 실행 방법
### Frontend
cd client
npm run dev
rontend

### Backend
cd server
npm install
npm run dev

---

## 🌐 배포

- Frontend: Vercel
- Backend: Render

---

## 🧪 테스트 예시
### 🔹 AI 응답
React의 주요 개념을 설명해줘

### 🔹 Markdown + 코드
자바스크립트 클로저를 코드 포함 설명해줘

### 🔹 검색 기능
아이폰16 출시일 검색해줘


---

## 💡 구현 포인트
- LLM + Tool 기반 구조 설계
- Markdown 기반 UI 설계
- 긴 응답을 구조화하여 UX 개선
- 외부 API 연동을 통한 실시간 데이터 처리
- 사용자 경험을 고려한 인터랙션 설계 (모달, 복사 기능 등)

---

## 🎯 프로젝트 목적

단순한 채팅 UI가 아닌,  
AI 응답을 "구조화된 콘텐츠"로 제공하는 UX 중심 시스템 구현

---
## 👨‍💻 개발자

**Name**: 윤찬희
**GitHub**: https://github.com/chanhui0829
**Email**: cskgml762@naver.com  

