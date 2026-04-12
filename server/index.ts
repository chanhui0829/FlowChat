import express from 'express';
import cors from 'cors';
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
 * 🔥 toolMap (타입 안정화)
 */
const toolMap: Record<string, (args: any) => Promise<any>> = {
  get_weather: async ({ city }: { city: string }) => ({
    city,
    temperature: '22°C',
    condition: 'Sunny',
  }),

  calculate_sum: async ({ a, b }: { a: number; b: number }) => ({
    result: a + b,
  }),

  get_current_time: async () => ({
    time: new Date().toLocaleString(),
  }),

  search: async ({ query }: { query: string }) => ({
    results: [`🔎 ${query} 검색 결과`],
  }),

  summarize_text: async ({ text }: { text: string }) => ({
    summary: text.slice(0, 80) + '...',
  }),

  // 🔥 진짜 번역
  translate_text: async ({ text }: { text: string }) => {
    const res = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        {
          role: 'system',
          content: 'Translate to English. Only output result.',
        },
        { role: 'user', content: text },
      ],
    });

    return {
      translated: res.choices[0].message.content,
    };
  },

  create_todo: async ({ task }: { task: string }) => ({
    todo: `✅ ${task}`,
  }),
};

/**
 * 🔥 GPT에게 tool 설명
 */
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather information',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_sum',
      description: 'Add two numbers',
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number' },
          b: { type: 'number' },
        },
        required: ['a', 'b'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get current time',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search',
      description: 'Search something',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },

  // 🔥 기존 것 유지
  {
    type: 'function',
    function: {
      name: 'translate_text',
      description: 'Translate text to English',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'summarize_text',
      description: 'Summarize text',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_todo',
      description: 'Create todo',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string' },
        },
        required: ['task'],
      },
    },
  },
];

/**
 * 🔥 MCP endpoint (function calling)
 */
app.post('/mcp', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: 'You are a smart AI assistant.' },
        { role: 'user', content: prompt },
      ],
      tools: tools as any,
    });

    const message = response.choices[0].message;

    // 🔥 tool 호출 처리
    if ((message as any).tool_calls) {
      const toolCall = (message as any).tool_calls[0];

      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      const toolFn = toolMap[toolName];

      if (!toolFn) {
        return res.json({ result: '❌ tool not found' });
      }

      const result = await toolFn(args);

      return res.json({ result });
    }

    // 🔥 일반 응답
    return res.json({ result: message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

app.listen(4000, () => {
  console.log('🚀 MCP Function Calling Server running');
});
