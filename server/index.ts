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
    const response = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        {
          role: 'system',
          content: `
너는 똑똑한 AI야.

- 일반 질문 → 직접 답변
- 최신 정보 필요 → search tool 사용
`,
        },
        { role: 'user', content: prompt },
      ],
      tools: tools as any,
    });

    const message = response.choices[0].message;

    if ((message as any).tool_calls) {
      const toolCall = (message as any).tool_calls[0];

      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      const toolFn = toolMap[toolName];

      const toolResult = await toolFn(args);

      return res.json(toolResult); // 🔥 result 그대로 내려줌
    }

    return res.json({
      result: message.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

app.listen(4000, () => {
  console.log('🚀 MCP Server running FINAL');
});
