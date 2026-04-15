# 💬 MCP Chat

실시간 스트리밍 기반 AI 채팅 웹 애플리케이션입니다.
간단한 UI와 빠른 응답 흐름에 집중하여 구현했습니다.

---

## 🚀 주요 기능

### 💬 실시간 채팅

* OpenRouter API 기반 AI 응답
* 사용자 / AI 메시지 구분 UI

### ⚡ 스트리밍 응답

* 서버에서 chunk 단위로 응답 수신
* 실시간으로 텍스트 렌더링

### 📚 채팅 관리

* 채팅 생성 / 삭제
* 최근 채팅 목록 관리
* localStorage 기반 데이터 유지

### 🔍 검색 기능

* 채팅 리스트 필터링 (실시간 검색)

### 📋 복사 기능

* AI 응답 복사 버튼 지원

---

## 🧠 기술 스택

### Frontend

* React + TypeScript
* Zustand (상태 관리)
* React Query (서버 상태 관리)
* Tailwind CSS

### Backend

* Node.js (Express)
* OpenRouter API

---

## 🏗️ 프로젝트 구조

```bash
src/
 ├── api/           # API 통신 (stream 포함)
 ├── components/    # UI 컴포넌트
 │    ├── ChatInput
 │    ├── ChatList
 │    └── ChatWindow
 ├── store/         # Zustand 상태관리
 ├── App.tsx
 └── main.tsx
```

---

## ⚙️ 실행 방법

```bash
# 설치
npm install

# 개발 서버 실행
npm run dev
```

---

## 🔐 환경 변수 설정

`.env.local` 파일 생성

```bash
VITE_API_URL=http://localhost:4000
OPENROUTER_API_KEY=your_api_key
NAVER_CLIENT_ID=your_id
NAVER_CLIENT_SECRET=your_secret
```

> ⚠️ `.env.local`은 GitHub에 업로드하지 않습니다.

---

## ✨ 구현 포인트

* 스트리밍 기반 UI 설계 (실시간 UX 개선)
* 상태 관리 분리 (Zustand vs Server State)
* 컴포넌트 구조 분리 (UI / 로직)
* 반응형 UI (모바일 사이드바 지원)
* 사용자 경험 중심 인터페이스 설계

---

## 📌 향후 개선 예정

* 코드 하이라이팅 지원
* 메시지 포맷 자동 정리
* 채팅 검색 고도화
* 사용자 인증 기능 추가

---

## 🙌 느낀 점

단순한 채팅 UI 구현을 넘어서
실시간 스트리밍 처리와 상태 관리 구조를 설계하면서
프론트엔드 아키텍처에 대한 이해도를 높일 수 있었습니다.

---

## 🧑‍💻 Author

* 윤찬희
