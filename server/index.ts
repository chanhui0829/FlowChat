import express from 'express';
import cors from 'cors';
import axios from 'axios';
import OpenAI from 'openai';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * 🔥 toolMap
 */
const toolMap: Record<string, (args: any) => Promise<any>> = {
  search: async ({ query }: { query: string }) => {
    try {
      console.log('🔥 네이버 API 호출:', query);

      const res = await axios.get('https://openapi.naver.com/v1/search/webkr.json', {
        params: { query, display: 5 },
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
        },
      });

      const items = res.data.items;

      return {
        result: items
          .map(
            (item: any, i: number) => `
### ${i + 1}. ${item.title.replace(/<[^>]+>/g, '')}

${item.description.replace(/<[^>]+>/g, '')}

🔗 ${item.link}
`
          )
          .join('\n\n'),
      };
    } catch (err: any) {
      console.error('❌ 네이버 API 에러:', err.response?.data || err.message);

      return {
        result: '❌ 네이버 검색 실패',
      };
    }
  },
};

/**
 * 🔥 tool 정의
 */
const tools = [
  {
    type: 'function',
    function: {
      name: 'search',
      description: 'Search latest information from the internet',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
];

/**
 * 🔥 MCP endpoint
 */
app.post('/mcp', async (req, res) => {
  const { prompt } = req.body;

  try {
    const stream = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        {
          role: 'system',
          content: `
너는 개발자를 돕는 AI다.

[중요 규칙]

1. 코드에는 반드시 줄바꿈(\n)을 포함한다.
2. 한 줄로 코드를 출력하지 않는다.
3. 코드와 설명은 반드시 분리한다.
          `,
        },
        { role: 'user', content: prompt },
      ],
      stream: true,
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (res.flushHeaders) res.flushHeaders();

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';

      if (content) {
        res.write(content);
      }
    }

    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

app.listen(4000, () => {
  console.log('🚀 MCP Server running FINAL');
});
