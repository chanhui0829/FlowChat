import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import ChatWindow from '../components/chatWindow';
import ChatInput from '../components/chatInput';
import { useChatStore, subscribeChatStorage } from '../store/chat.store';
import { sendMessageStream } from '../api/mcp';

type MCPResponse =
  | string
  | { result?: string }
  | { translated?: string }
  | { summary?: string }
  | { todo?: string }
  | { city?: string; temperature?: string; condition?: string }
  | { time?: string }
  | Record<string, unknown>;

function ChatPage() {
  const { addMessage, loadChats, createChat, currentChatId, chats, setCurrentChat } =
    useChatStore();

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');
  const [loading, setLoading] = useState(false);

  const { id } = useParams();

  /**
   * 🔥 1. 먼저 chats 로드
   */
  useEffect(() => {
    loadChats();
    subscribeChatStorage();
  }, []);

  /**
   * 🔥 2. chats 준비된 후 id 적용
   */
  useEffect(() => {
    if (id && chats.length > 0) {
      setCurrentChat(id);
    }
  }, [id, chats]);

  const formatResponse = (res: MCPResponse): string => {
    if (typeof res === 'string') {
      try {
        const parsed = JSON.parse(res);

        if (parsed.result) return parsed.result;
        if (parsed.translated) return parsed.translated;
        if (parsed.summary) return parsed.summary;

        return res;
      } catch {
        return res;
      }
    }

    if ('result' in res && typeof res.result === 'string') {
      return res.result;
    }

    if ('translated' in res && res.translated) return res.translated as string;
    if ('summary' in res && res.summary) return res.summary as string;
    if ('todo' in res && res.todo) return res.todo as string;

    if ('temperature' in res && res.temperature)
      return `🌤️ ${res.city} 날씨: ${res.temperature}, ${res.condition}`;

    if ('time' in res && res.time) return `⏰ 현재 시간: ${res.time}`;

    return JSON.stringify(res);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!currentChatId) createChat();
    const userInput = input;

    setInput('');
    addMessage({
      role: 'user',
      content: userInput,
      time: new Date().toISOString(),
    });
    setLoading(true);

    try {
      let fullText = '';

      await sendMessageStream(userInput, (chunk) => {
        fullText += chunk;
        setTyping(fullText);
      });
      const formatted = formatResponse(fullText);

      addMessage({
        role: 'ai',
        content: formatted,
        time: '',
      });
      setTyping('');
    } catch {
      addMessage({
        role: 'ai',
        content: '❌ 오류가 발생했습니다. 다시 시도해주세요.',
        time: '',
      });
      setTyping('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatWindow
        typing={typing}
        loading={loading}
        onQuickSend={(q) => {
          setInput(q);
          setTimeout(() => handleSend(), 0);
        }}
      />
      <ChatInput input={input} setInput={setInput} onSend={handleSend} />
    </div>
  );
}

export default ChatPage;
