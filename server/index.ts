/* index.ts: Express API Server */
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import 'dotenv/config';

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * [Server-Side] SSE 스트리밍 엔드포인트
 * AI의 응답을 실시간으로 클라이언트에 전달합니다.
 */
app.get('/mcp', async (req, res) => {
  const prompt = req.query.prompt as string;

  try {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        {
          role: 'system',
          content: `너는 개발자를 돕는 전문 AI 어시스턴트이다. 
        [규칙]
        1. 모든 답변은 반드시 '한국어(Korean)'로만 작성하라. 
        2. 다른 언어(일본어, 중국어 등)를 절대 섞어서 사용하지 마라.
        3. 기술 용어는 영어로 쓰되, 설명은 한국어로 하라.
        4. 답변은 마크다운 형식을 엄격히 지켜라.`,
        },
        { role: 'user', content: prompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).end();
  }
});

app.listen(4000, () => {
  console.log('-----------------------------------------');
  console.log('🚀 MCP Server (SSE) is running on port 4000');
  console.log('🔗 URL: http://localhost:4000');
  console.log('-----------------------------------------');
});
