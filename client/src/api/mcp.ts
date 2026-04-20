import axios from 'axios';

const MCP_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:4000/mcp'
    : `${import.meta.env.VITE_API_URL}/mcp`;

export const sendMessage = async (prompt: string) => {
  const { data } = await axios.post(MCP_URL, { prompt });
  return data.result;
};

/**
 * [Troubleshooting] AI 응답 스트리밍 요청 함수
 * SSE(Server-Sent Events)를 통해 데이터를 수신하며,
 * 네트워크 패킷 분절로 인한 파싱 에러를 방지하기 위해 try-catch로 예외 처리를 구현했습니다.
 */
export const sendMessageStream = (
  prompt: string,
  onChunk: (data: { chunk: string; full: string }) => void,
  onDone: (full: string) => void
) => {
  const url = `${MCP_URL}?prompt=${encodeURIComponent(prompt)}`;
  const eventSource = new EventSource(url);
  let fullText = '';

  eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
      onDone(fullText);
      eventSource.close();
      return;
    }

    try {
      /**
       * [기술적 의사결정] 비정형 Chunk 데이터 유실 방지
       * 실시간 응답의 무결성을 보장하기 위해 각 chunk를 개별적으로 파싱하여 누적합니다.
       */
      const parsed = JSON.parse(event.data);
      const content = parsed.content || '';
      fullText += content;

      onChunk({
        chunk: content,
        full: fullText,
      });
    } catch (err) {
      console.error('SSE Parsing error:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.error('SSE connection error:', err);
    eventSource.close();
  };

  // Abort 제어를 위해 close 함수 반환
  return () => {
    eventSource.close();
  };
};
