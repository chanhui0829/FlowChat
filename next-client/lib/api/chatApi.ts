import axios from 'axios';

const MCP_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:4000/mcp'
    : `${process.env.NEXT_PUBLIC_API_URL}/mcp`;

// [Fix 2] 토큰 한도 관리 — 최근 N턴만 API에 전달
// openrouter/auto 기준 컨텍스트 윈도우를 고려해 20턴으로 제한
// 대화가 길어질수록 오래된 메시지는 자동으로 슬라이딩 아웃됨
const MAX_HISTORY_TURNS = 20;

interface ChatResponse {
  result: string;
}

interface StreamChunk {
  content: string;
}

interface SummaryResponse {
  title: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const sendMessage = async (prompt: string): Promise<string> => {
  const { data } = await axios.post<ChatResponse>(MCP_URL, { prompt });
  return data.result;
};

/**
 * [핵심 로직] fetch + ReadableStream 기반 SSE 처리
 *
 * EventSource → fetch로 교체한 이유:
 *   - EventSource는 GET 전용 → history를 URL에 담으면 길이 제한(~2KB)에 걸림
 *   - fetch POST로 body에 담으면 길이 제한 없음
 *
 * TextDecoder는 { stream: true }로 호출해 청크 경계에서 잘린 멀티바이트 문자를
 * 디코더 내부 상태에 보관하게 한다 — leftover 버퍼는 "완성된 문자열을 줄 단위로
 * 잘라 붙이는" 역할만 하고, "원시 바이트가 문자 중간에서 잘리는" 문제는 방어하지
 * 못하므로 반드시 둘 다 필요하다. (과거엔 { stream: false }를 썼는데, 한글처럼
 * 3바이트로 인코딩되는 문자가 두 번의 read() 사이에서 정확히 잘리면 U+FFFD로
 * 깨지는 잠재 버그가 있었음 — 재현: 멀티바이트 문자를 바이트 중간에서 나눠
 * decode(part, {stream:false})를 두 번 호출하면 각각 깨진 문자가 나오지만,
 * {stream:true}로 호출하면 올바르게 이어붙는다.)
 *
 * [Fix 2] 슬라이딩 윈도우:
 *   - 전체 history를 그대로 넘기면 대화가 길어질수록 토큰 한도 초과 에러 발생
 *   - MAX_HISTORY_TURNS(20)개만 슬라이싱해서 전달
 */
export const sendMessageStream = (
  prompt: string,
  onChunk: (data: { chunk: string; full: string }) => void,
  onDone: (full: string) => void,
  // [Fix] 기존엔 응답이 !res.ok거나 fetch 자체가 throw하면(네트워크 오류, Render
  // 콜드스타트 중 프록시 타임아웃으로 인한 502/504 등) 그냥 console.error만 찍고
  // 아무 콜백도 호출하지 않았음. 호출부(useChat.ts)는 onDone이 호출될 때만 전역
  // 로딩 상태(isAwaitingResponse 등)를 해제하므로, 이 경로를 타면 그 상태가 영원히
  // true로 남아 "..." 로딩 표시가 안 사라지고 새 채팅 생성/전환도 계속 막히는
  // 문제가 있었음. onError를 추가해 실패 경로에서도 반드시 콜백이 호출되게 한다.
  onError: (error: Error) => void,
  history: Message[] = []
): (() => void) => {
  const controller = new AbortController();
  let fullText = '';

  (async () => {
    try {
      const res = await fetch(MCP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history: history.slice(-MAX_HISTORY_TURNS), // [Fix 2] 최근 N턴만 전달
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        console.error('[SSE] 응답 오류:', res.status);
        onError(new Error(`SSE response error: ${res.status}`));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let leftover = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // 스트림 종료 — 디코더 내부에 남아있을 수 있는 바이트를 마저 flush
          const tail = leftover + decoder.decode();
          if (tail.trim().length > 0) {
            for (const line of tail.split('\n')) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                const raw = trimmed.slice(5).trim();
                if (raw && raw !== '[DONE]') {
                  try {
                    const parsed: StreamChunk = JSON.parse(raw);
                    if (parsed.content) {
                      fullText += parsed.content;
                      onChunk({ chunk: parsed.content, full: fullText });
                    }
                  } catch {
                    // 비정형 청크는 무시
                  }
                }
              }
            }
          }
          break;
        }

        // { stream: true }: 청크 경계에서 잘린 멀티바이트 문자를 디코더가
        // 내부적으로 들고 있다가 다음 read()의 바이트와 이어붙여 처리한다.
        const text = leftover + decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        leftover = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const raw = trimmed.slice(5).trim();

          if (raw === '[DONE]') {
            onDone(fullText);
            return;
          }

          try {
            const parsed: StreamChunk = JSON.parse(raw);
            const content = parsed.content || '';
            if (!content) continue;

            fullText += content;
            onChunk({ chunk: content, full: fullText });
          } catch {
            // 비정형 청크는 무시
          }
        }
      }

      if (fullText) onDone(fullText);
    } catch (err) {
      // AbortError는 사용자가 직접 중지(handleStop)했거나 컴포넌트 언마운트로
      // 의도적으로 취소한 경우라 handleStop 쪽에서 이미 상태를 정리하므로 제외.
      // 그 외(네트워크 끊김, 콜드스타트 중 타임아웃 등)는 반드시 onError를 호출해
      // 호출부가 로딩 상태를 해제할 기회를 준다.
      if ((err as Error).name !== 'AbortError') {
        console.error('[SSE Error]:', err);
        onError(err as Error);
      }
    }
  })();

  return () => controller.abort();
};

export const getChatSummary = async (prompt: string): Promise<string> => {
  // [Fix] 서버 요약 API가 실패/빈 응답을 줄 경우 항상 고정 문구('새로운 대화')로 폴백하면
  // 실제로 무슨 대화였는지 전혀 알아볼 수 없음 — 원문을 짧게 잘라 대신 사용
  const fallbackFromPrompt = () => {
    const trimmed = prompt.trim();
    return trimmed.length > 20 ? `${trimmed.slice(0, 20)}…` : trimmed || '새로운 대화';
  };

  try {
    const { data } = await axios.post<SummaryResponse>(`${MCP_URL}/Tsummarize`, { prompt });
    const title = (data.title || '').trim();

    // [Fix] 요약 모델이 지시를 무시하고 답변 전체를 제목으로 반환하는 경우가 있어
    // (예: "동기부여 명언 알려줘" → 명언 목록 전체가 제목이 되어버림), 서버 수정과는
    // 별개로 클라이언트에서도 방어적으로 길이를 제한함
    if (!title) return fallbackFromPrompt();
    return title.length > 20 ? `${title.slice(0, 20)}…` : title;
  } catch (error) {
    console.error('[Summary API Error]:', error);
    return fallbackFromPrompt();
  }
};
