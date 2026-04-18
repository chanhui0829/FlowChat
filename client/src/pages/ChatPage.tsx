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

  useEffect(() => {
    loadChats();
    subscribeChatStorage();
  }, []);

  useEffect(() => {
    if (id && chats.length > 0) {
      setCurrentChat(id);
    }
  }, [id, chats]);

  const formatResponse = (res: MCPResponse): string => {
    if (typeof res === 'string') return res;
    return JSON.stringify(res);
  };

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
        ({ chunk, full }) => {
          if (requestId !== currentRequestId.current) return;

          if (loading) setLoading(false);

          fullText = full;

          setTyping((prev) => prev + chunk);
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
      if (err instanceof Error && err.name === 'AbortError') {
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
      />
    </div>
  );
}

export default ChatPage;
