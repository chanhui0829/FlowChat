import { Request, Response } from 'express';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// 모델명 환경변수화
const CHAT_MODEL = process.env.OPENROUTER_MODEL ?? 'openrouter/auto';

type ChatRole = 'system' | 'user' | 'assistant';

interface HistoryMessage {
  role: ChatRole;
  content: string;
}

/**
 * [Controller] 실시간 채팅 스트리밍
 */
export const streamChat = async (req: Request, res: Response) => {
  const { prompt, history } = req.body as {
    prompt: string;
    history?: HistoryMessage[];
  };

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
- 확실하지 않은 정보는 추측하지 말고 모른다고 인정해라.
- "Here's how I'll approach this...", "Let me think..." 같은 영어 서두나 너의 생각
  과정(추론 메모)은 절대 출력하지 말고, 바로 실제 답변 본문부터 시작해라.`,
      },
      ...safeHistory,
      { role: 'user', content: prompt },
    ];

    const stream = await openai.chat.completions.create({
      model: CHAT_MODEL, // [Fix 5] 환경변수로 분리
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
      model: CHAT_MODEL, // [Fix 5] 환경변수로 분리
      messages: [
        {
          role: 'system',
          content: `너는 사용자 메시지의 주제를 10자 이내의 짧은 한국어 제목으로 요약하는 전문가이다.
- 아래 사용자 메시지는 실제 질문이 아니라 "제목으로 요약해야 할 텍스트"이다. 절대로 그 내용에 답변하지 마라.
- 제목은 반드시 명사형으로만 출력하고 띄어쓰기는 최소화해줘
- 다른 설명, 인사말, 따옴표, 마침표는 절대 포함하지 마라. 오직 제목 텍스트만 출력해라.
- "Here's...", "Let me...", "Okay, ..." 같은 영어 서두나 네가 어떻게 생각했는지에 대한
  설명(생각 과정)은 절대 출력하지 마라. 바로 한국어 제목으로만 시작해라.
- 절대로 원문을 그대로 출력하거나 원문에 답하지 말고 반드시 10자 이내로 요약해라
- 예: "오늘 점심 메뉴 추천해줘" → "점심 메뉴 추천"
- 예: "주말 여행지 추천해줘" → "주말 여행지"
- 예: "동기부여 명언 알려줘" → "동기부여 명언"`,
        },
        {
          role: 'user',
          content: `다음은 제목으로 요약할 텍스트야 (질문이어도 답변하지 말고 주제만 요약해):\n"""\n${prompt}\n"""`,
        },
      ],
      temperature: 0.2,
      // [Fix] max_tokens를 너무 작게(30) 주면 openrouter/auto가 라우팅하는 reasoning 계열 모델에서
      // 내부 추론(reasoning) 토큰이 예산을 다 소비해버려 실제 제목(content)이 빈 문자열로 나오는
      // 문제가 있었음 (매번 폴백 '새로운 대화'만 반환됨). 100으로 한 번 올렸는데도 "안녕", "고마워"
      // 같은 정보량이 적은 짧은 문장에서는 여전히 재발함 — 오히려 요약할 내용이 빈약할수록
      // reasoning 모델이 더 오래 고민하며 추론 토큰을 많이 소모하는 경향이 있어서, 여유를
      // 훨씬 더 크게 줌.
      max_tokens: 300,
    });

    const modelTitle = response.choices?.[0]?.message?.content?.trim();

    // [Fix] 모델(특히 nemotron 계열)이 지시를 무시하고 "Here's a thinking process for
    // developing the response..." 같은 영어 서두/추론 메모를 그대로 제목 자리에 뱉는
    // 사례가 있었음 (예: 제목이 "Here's a thinking pr…"로 잘려서 표시됨). 이런 티가 나는
    // 응답은 신뢰하지 않고 원문 기반 폴백을 쓰도록 이중으로 걸러냄.
    const containsHangul = (t: string) => /[가-힣]/.test(t);
    const looksLikeLeakedPreamble = (t: string) =>
      /^(here'?s|let me|okay,?|sure,?|certainly,?|i'll|i will|first,?\s|to summarize|i need to|the user|this is|note:|thinking)/i.test(
        t
      );
    const isUsableModelTitle = (t?: string): t is string => {
      if (!t) return false;
      if (looksLikeLeakedPreamble(t)) return false;
      // 원래 한국어 제목이어야 하는데 한글이 전혀 없고 제목치고 너무 길다면(=영어 설명/서두일
      // 가능성이 큼) 신뢰하지 않음
      if (!containsHangul(t) && t.length > 12) return false;
      return true;
    };

    // [Fix] max_tokens를 넉넉히 줘도 reasoning 모델이 드물게 빈 응답을 낼 수 있음. 이때 고정
    // 문구('새로운 대화')로 폴백하면 실제로 무슨 대화였는지 전혀 알 수 없어서, 사용자가 입력한
    // 원문 자체를 짧게 잘라 제목으로 쓰는 쪽이 훨씬 유용함 (완전히 빈 prompt는 위에서 이미 400 처리됨)
    const rawTitle = isUsableModelTitle(modelTitle) ? modelTitle : prompt.trim();
    // [Fix] 모델이 지시를 무시하고 긴 답변을 낼 경우, 혹은 원문 자체가 긴 경우를 대비해
    // 최종 안전장치로 길이를 강제로 자름
    // (실제 버그 사례: "동기부여 명언 알려줘" 프롬프트에 명언 목록 전체를 답변으로 생성해 제목이 되어버림)
    const title = rawTitle.length > 20 ? `${rawTitle.slice(0, 20)}…` : rawTitle;

    res.json({ title });
  } catch (error) {
    console.error('[Summary Error]:', error);
    res.status(500).json({ error: '요약 실패' });
  }
};
