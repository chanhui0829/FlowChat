import '@testing-library/jest-dom';

// [Fix] lib/supabase.ts는 모듈 로드 시점에 createClient(url, key)를 바로 호출하는데,
// 테스트 환경에는 .env.local이 없어 NEXT_PUBLIC_SUPABASE_URL/ANON_KEY가 비어있는 채로
// createClient(undefined, undefined)가 실행되어 "supabaseUrl is required." 에러로
// 테스트 파일 자체가 로드되지 못하고 0개 실행되는 문제가 있었음(예: ChatInput.test.tsx가
// useChatStore → chatService → supabase 순으로 임포트 체인을 타면서 즉시 크래시).
// 실제 네트워크 호출은 일어나지 않으므로(테스트 대상 컴포넌트들이 supabase 액션을
// 직접 호출하지 않음) 더미 값으로도 충분 — 클라이언트 생성만 통과시키면 됨.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'test-anon-key';