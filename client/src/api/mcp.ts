import axios from 'axios';

const MCP_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:4000/mcp'
    : `${import.meta.env.VITE_API_URL}/mcp`;

export const sendMessage = async (prompt: string) => {
  const { data } = await axios.post(MCP_URL, { prompt });
  return data.result;
};

export const sendMessageStream = async (
  prompt: string,
  onChunk: (data: { chunk: string; full: string }) => void,
  signal?: AbortSignal
) => {
  try {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal,
    });

    if (!res.ok) throw new Error('서버 응답 오류');

    const reader = res.body?.getReader();
    if (!reader) throw new Error('스트림 없음');

    const decoder = new TextDecoder('utf-8');

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      if (chunk) {
        buffer += chunk;

        onChunk({
          chunk,
          full: buffer,
        });
      }
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};
