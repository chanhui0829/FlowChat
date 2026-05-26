import axios from 'axios';

const MCP_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:4000/mcp'
    : `${process.env.NEXT_PUBLIC_API_URL}/mcp`;

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
 * TextDecoder { stream: true } 대신 버퍼 누적 방식 사용:
 *   - TypeScript lib 설정에 따라 해당 옵션 타입이 없는 경우가 있음
 *   - 대신 불완전 청크를 leftover 버퍼에 쌓아서 동일하게 처리
 */
export const sendMessageStream = (
  prompt: string,
  onChunk: (data: { chunk: string; full: string }) => void,
  onDone: (full: string) => void,
  history: Message[] = []
): (() => void) => {
  const controller = new AbortController();
  let fullText = '';

  (async () => {
    try {
      const res = await fetch(MCP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        console.error('[SSE] 응답 오류:', res.status);
        return;
      }

      const reader = res.body.getReader();
      // TextDecoder를 옵션 없이 생성 후 leftover 버퍼로 멀티바이트 경계 처리
      const decoder = new TextDecoder('utf-8');
      let leftover = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // 이전 청크에서 잘린 데이터 + 새 데이터를 합쳐서 파싱
        const text = leftover + decoder.decode(value, { stream: false });
        const lines = text.split('\n');

        // 마지막 라인이 '\n'으로 끝나지 않으면 잘린 것 → 다음 청크에 이어붙임
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

      // res.body가 [DONE] 없이 닫힌 경우 fallback
      if (fullText) onDone(fullText);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('[SSE Error]:', err);
      }
    }
  })();

  // 외부에서 스트림 중단 시 호출할 cleanup 함수
  return () => controller.abort();
};

export const getChatSummary = async (prompt: string): Promise<string> => {
  try {
    const { data } = await axios.post<SummaryResponse>(`${MCP_URL}/Tsummarize`, { prompt });
    return data.title;
  } catch (error) {
    console.error('[Summary API Error]:', error);
    return '새로운 대화';
  }
};
