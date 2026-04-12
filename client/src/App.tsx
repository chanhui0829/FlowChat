import { useEffect, useState } from 'react';
import ChatList from './components/chatList';
import ChatWindow from './components/chatWindow';
import ChatInput from './components/chatInput';
import { useChatStore, subscribeChatStorage } from './store/chat.store';
import { useSendMessage } from './hooks/useChat';

type MCPResponse =
  | string
  | { translated?: string }
  | { summary?: string }
  | { todo?: string }
  | { city?: string; temperature?: string; condition?: string }
  | { result?: number }
  | { time?: string }
  | { results?: string[] }
  | Record<string, unknown>;

function App() {
  const { addMessage, loadChats, createChat, currentChatId } = useChatStore();

  const { mutateAsync } = useSendMessage();

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChats();
    subscribeChatStorage();
  }, []);

  // 🔥 타이핑 효과
  const typeMessage = async (text: string) => {
    setTyping('');
    for (let i = 0; i < text.length; i++) {
      await new Promise((r) => setTimeout(r, 10));
      setTyping((prev) => prev + text[i]);
    }
  };

  // 🔥 응답 포맷
  const formatResponse = (res: MCPResponse): string => {
    if (typeof res === 'string') return res;

    // 🔥 번역
    if ('translated' in res && res.translated) return `🌐 ${res.translated}`;

    // 🔥 요약
    if ('summary' in res && res.summary) return `📝 ${res.summary}`;

    // 🔥 todo
    if ('todo' in res && res.todo) return `✅ ${res.todo}`;

    // 🔥 날씨
    if ('temperature' in res && res.temperature)
      return `🌤️ ${res.city} 날씨: ${res.temperature}, ${res.condition}`;

    // 🔥 계산
    if ('result' in res && typeof res.result === 'number') return `🧮 결과: ${res.result}`;

    // 🔥 시간
    if ('time' in res && res.time) return `⏰ 현재 시간: ${res.time}`;

    // 🔥 검색
    if ('results' in res && Array.isArray(res.results))
      return `🔎 검색 결과:\n- ${res.results.join('\n- ')}`;

    return JSON.stringify(res);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // 🔥 첫 채팅 없으면 생성
    if (!currentChatId) {
      createChat();
    }

    const userInput = input;
    setInput('');

    addMessage({
      role: 'user',
      content: userInput,
      time: '',
    });

    setLoading(true);

    try {
      const res = await mutateAsync(userInput);

      await new Promise((r) => setTimeout(r, 300));

      const formatted = formatResponse(res);

      await typeMessage(formatted);

      addMessage({
        role: 'ai',
        content: formatted,
        time: '',
      });

      setTyping('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 좌측 리스트 */}
      <ChatList />

      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto">
        <ChatWindow typing={typing} loading={loading} />

        <ChatInput input={input} setInput={setInput} onSend={handleSend} />
      </div>
    </div>
  );
}

export default App;
