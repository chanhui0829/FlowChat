import axios from 'axios';

const MCP_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:4000/mcp'
    : `${process.env.NEXT_PUBLIC_API_URL}/mcp`;

// [Fix 2] 토큰 한도 관리 — 최근 N턴만 API에 전달
// openrouter/auto 기준 컨텍스트 윈도우를 고려해 20턴으로 제한
// 대화가 길어질수록 오래된 메시지는 자동으로 슬라이딩 아웃됨
const MAX_HISTORY_TURNS = 20;

// [Fix 3] 서버가 응답 없이 매달려도 클라이언트가 스스로 포기하지 못하던 "무한 로딩" 버그.
// 실제 운영 로그에서 확인된 원인: OPENROUTER_MODEL로 지정한 무료 모델(예: nemotron-3.5
// -lightning:free)의 실제 제공자 쪽이 응답을 만들다 멈춰버리면, OpenRouter가 결국
// "Upstream idle timeout exceeded"로 끊는다. 이때 서버(mcp.ts)가 이미 res.write를 한
// 번이라도 호출해 headersSent가 true인 상태로 이 에러를 만나면, catch 블록은 그냥
// res.end()만 하고 끝난다 — [DONE] 센티널도 없이 연결만 닫힌다. 문제는 이런 경로들
// 전부와 별개로, 애초에 네트워크 자체가 응답을 전혀 안 주고 소켓만 열어둔 채 멈추는
// 경우(콜드스타트 도중 중간 프록시가 응답을 그냥 계속 기다리기만 하는 경우 등)에는
// reader.read()가 영원히 resolve되지 않는다 — fetch/ReadableStream에는 자체 타임아웃이
// 없기 때문이다. 그 결과 onDone도 onError도 전혀 호출되지 않고, "..." 로딩만 화면에
// 무한정 남는다. 진행(응답 시작 또는 각 청크 수신)이 일정 시간 동안 전혀 없으면
// 클라이언트가 스스로 포기하고 onError로 안내하도록 타이머를 둔다. Render 무료
// 인스턴스의 콜드스타트가 "50초 이상 걸릴 수 있다"고 공식적으로 안내되므로, 그보다
// 넉넉한 90초로 잡아 정상적인 콜드스타트를 타임아웃으로 오인하지 않게 한다.
const STREAM_TIMEOUT_MS = 90000;

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

  // [Fix 3] 진행(첫 응답 또는 각 청크)이 STREAM_TIMEOUT_MS 동안 전혀 없으면 스스로
  // abort한다. 이 abort는 사용자가 "정지"를 누른 것과 신호(controller.abort())상으로는
  // 구분이 안 되므로, catch 블록에서 AbortError를 다르게 처리할 수 있도록 별도
  // 플래그로 "타임아웃이 원인이었는지"를 기록해둔다.
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const resetStreamTimeout = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, STREAM_TIMEOUT_MS);
  };

  const clearStreamTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  resetStreamTimeout();

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

      // 헤더 응답을 받았다는 건 서버가 최소한 살아있다는 뜻 — 다음 read()까지 다시
      // 타이머를 건다 (콜드스타트로 여기까지 오는 데 이미 오래 걸렸을 수 있으므로).
      resetStreamTimeout();

      if (!res.ok || !res.body) {
        clearStreamTimeout();
        console.error('[SSE] 응답 오류:', res.status);
        onError(new Error(`SSE response error: ${res.status}`));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let leftover = '';

      while (true) {
        const { done, value } = await reader.read();
        resetStreamTimeout(); // 데이터든 종료든 진행이 있었으니 타이머 리셋

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
            clearStreamTimeout();
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

      // [Fix] 서버가 200으로 스트림을 시작해놓고 '[DONE]' 센티널도, 콘텐츠도
      // 하나도 못 보낸 채 연결만 끊기는 경우가 실제로 있었다(예: server/mcp.ts의
      // streamChat이 res.setHeader(...)까지 실행해 헤더를 이미 보낸 뒤, 그 다음
      // OpenRouter 호출(openai.chat.completions.create)이 던지면 catch 블록이
      // `res.headersSent`이므로 별도 에러 응답 없이 그냥 res.end()만 함 — 클라이언트
      // 입장에서는 reader.read()가 아무 데이터 없이 done:true로 끝남).
      // 이전 코드는 `if (fullText) onDone(fullText)`였는데, 이 경우 fullText가
      // 빈 문자열이라 onDone도 onError도 전혀 호출되지 않았음 — 위의 res.ok/catch
      // 수정으로도 못 잡히는 세 번째 경로였고, 결과적으로 로딩 락이 똑같이 영원히
      // 풀리지 않는 버그가 재현됐다(주입 테스트로 확인). 스트림이 자연 종료됐다면
      // 콘텐츠가 있든 없든 반드시 무언가는 호출되게 해서 호출부가 항상 락을
      // 해제할 수 있게 한다 — 내용이 있으면 onDone, 완전히 비어있으면(=서버가
      // 사실상 실패한 것) onError로 처리한다.
      clearStreamTimeout();
      if (fullText) {
        onDone(fullText);
      } else {
        onError(new Error('스트림이 콘텐츠 없이 종료되었습니다.'));
      }
    } catch (err) {
      clearStreamTimeout();
      // AbortError는 두 가지 경우에서 발생한다:
      //   (1) 사용자가 직접 "정지"를 눌렀거나(handleStop) — 그쪽에서 이미 상태 정리를
      //       하므로 여기서는 무시한다.
      //   (2) 위 STREAM_TIMEOUT_MS 타이머가 발동해 스스로 abort한 경우(timedOut) —
      //       이건 사용자가 취소한 게 아니라 "서버가 응답 없이 매달린 채 시간 초과된"
      //       실질적인 실패이므로, 반드시 onError를 호출해 로딩 락을 풀고 재시도
      //       안내를 해야 한다. signal 자체는 두 경우 모두 동일하게 AbortError로
      //       뜨기 때문에, 원인 구분은 timedOut 플래그로 한다.
      if ((err as Error).name === 'AbortError') {
        if (timedOut) {
          onError(new Error('응답 시간이 너무 오래 걸려 요청을 중단했습니다.'));
        }
        return;
      }

      // 그 외(네트워크 끊김, 콜드스타트 중 타임아웃 등)는 반드시 onError를 호출해
      // 호출부가 로딩 상태를 해제할 기회를 준다.
      console.error('[SSE Error]:', err);
      onError(err as Error);
    }
  })();

  return () => {
    clearStreamTimeout();
    controller.abort();
  };
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
