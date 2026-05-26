import { Request, Response } from 'express';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

type ChatRole = 'system' | 'user' | 'assistant';

interface HistoryMessage {
  role: ChatRole;
  content: string;
}

/**
 * [Controller] 실시간 채팅 스트리밍 (GET → POST 변경)
 *
 * 변경 이유:
 *   - 기존 GET + 쿼리스트링 방식은 history가 길어지면 URL 길이 제한에 걸림
 *   - POST body로 전달하면 길이 제한 없음, 한글 인코딩 이슈도 없음
 *   - 클라이언트에서 JSON.parse 없이 배열 그대로 전달하므로 서버에서 파싱 불필요
 */

export const streamChat = async (req: Request, res: Response) => {
  const { prompt, history } = req.body as {
    prompt: string;
    history?: HistoryMessage[];
  };

  // 기본값 처리 및 유효성 검사
  const safeHistory: HistoryMessage[] = Array.isArray(history) ? history : [];

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'prompt가 필요합니다.' });
    return;
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const messages: Array<{ role: ChatRole; content: string }> = [
      {
        role: 'system',
        content: `너는 사용자의 질문에 명확하고 유용한 답변을 제공하는 전문 AI 어시스턴트이다.
- 반드시 한국어로만 답변해라.
- 기술적인 질문에는 구체적인 코드 예시와 설명을 포함해라.
- 복잡한 개념은 쉽게 설명해라.
- 답변은 간결하면서도 충분한 정보를 제공해라.
- 확실하지 않은 정보는 추측하지 말고 모른다고 인정해라.`,
      },
      ...safeHistory,
      { role: 'user', content: prompt },
    ];

    const stream = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages,
      stream: true,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    // 헤더가 이미 전송된 경우 res.status() 호출 불가
    if (!res.headersSent) {
      res.status(500).end();
    } else {
      res.end();
    }
  }
};

/**
 * [Controller] 채팅 제목 요약
 */
export const summarizeTitle = async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'prompt가 필요합니다.' });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        {
          role: 'system',
          content: `너는 대화 내용을 10자 이내의 짧은 한국어 제목으로 요약하는 전문가이다.
- 제목은 반드시 명사형으로만 출력하고 띄어쓰기는 사용해줘
- 다른 설명이나 따옴표는 제거하고 괄호 안의 내용은 절대 포함하지 마라
- 절대로 원문을 그대로 출력하지 말고 반드시 요약해라
- 예: "오늘 점심 메뉴 추천해줘" → "점심 메뉴 추천"
- 예: "주말 여행지 추천해줘" → "주말 여행지"`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    const title = response.choices?.[0]?.message?.content?.trim() || '새로운 대화';
    res.json({ title });
  } catch (error) {
    console.error('[Summary Error]:', error);
    res.status(500).json({ error: '요약 실패' });
  }
};
