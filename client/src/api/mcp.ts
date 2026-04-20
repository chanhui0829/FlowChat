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
 * AI 응답 스트리밍 요청 함수
 * SSE(Server-Sent Events)를 통해 실시간 데이터를 수신합니다.
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

  // 요청 중단을 위해 close 함수 반환
  return () => {
    eventSource.close();
  };
};
