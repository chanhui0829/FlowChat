import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

import ChatWindow from '../components/chat/chatWindow';
import ChatInput from '../components/chat/chatInput';
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

  const currentRequestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * 🔥 초기 로드
   */
  useEffect(() => {
    loadChats();
    subscribeChatStorage();
  }, []);

  /**
   * 🔥 채팅 선택
   */
  useEffect(() => {
    if (id && chats.length > 0) {
      setCurrentChat(id);
    }
  }, [id, chats]);

  /**
   * 🔥 응답 포맷
   */
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

    if ('result' in res && typeof res.result === 'string') return res.result;
    if ('translated' in res && res.translated) return res.translated as string;
    if ('summary' in res && res.summary) return res.summary as string;
    if ('todo' in res && res.todo) return res.todo as string;

    if ('temperature' in res && res.temperature)
      return `🌤️ ${res.city} 날씨: ${res.temperature}, ${res.condition}`;

    if ('time' in res && res.time) return `⏰ 현재 시간: ${res.time}`;

    return JSON.stringify(res);
  };

  /**
   * 🔥 메시지 전송
   */
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!currentChatId) createChat();

    const requestId = ++currentRequestId.current;

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    const userInput = input;

    setInput('');
    setLoading(true);

    addMessage({
      role: 'user',
      content: userInput,
      time: new Date().toISOString(),
    });

    let fullText = '';

    try {
      await sendMessageStream(
        userInput,
        (chunk) => {
          if (requestId !== currentRequestId.current) return;

          fullText += chunk;
          setTyping(fullText);
        },
        controller.signal
      );

      if (requestId !== currentRequestId.current) return;

      addMessage({
        role: 'ai',
        content: formatResponse(fullText),
        time: new Date().toISOString(),
      });

      setTyping('');
    } catch (err) {
      if (err.name === 'AbortError') {
        addMessage({
          role: 'ai',
          content: fullText
            ? fullText + '\n\n> ⛔ 응답이 중단되었습니다'
            : '⛔ 응답이 중단되었습니다',
          time: new Date().toISOString(),
        });

        setTyping('');
        setLoading(false);
        return;
      }

      if (requestId !== currentRequestId.current) return;
      addMessage({
        role: 'ai',
        content: '❌ 오류가 발생했습니다. 다시 시도해주세요.',
        time: new Date().toISOString(),
      });

      setTyping('');
    } finally {
      if (requestId === currentRequestId.current) {
        setLoading(false);
      }
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

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onStop={() => abortRef.current?.abort()}
        loading={loading}
        typing={typing}
      />
    </div>
  );
}

export default ChatPage;
