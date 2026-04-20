import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ChatWindow from '../components/chat/chatWindow';
import ChatInput from '../components/chat/chatInput';
import { useChatStore } from '../store/chat.store';
import { sendMessageStream, sendMessage } from '../api/mcp'; // sendMessage 추가

function ChatPage() {
  const { id } = useParams();
  const {
    addMessage,
    loadChats,
    createChat,
    currentChatId,
    chats,
    setCurrentChat,
    updateChatTitle,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const currentRequestId = useRef(0);
  const stopStreamRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (id && chats.length > 0) {
      setCurrentChat(id);
    }
  }, [id, chats, setCurrentChat]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    let targetChatId = currentChatId;
    const isNewChat = !targetChatId;

    if (isNewChat) {
      targetChatId = await createChat();
      if (!targetChatId) return;
    }

    const requestId = ++currentRequestId.current;
    const userInput = input;

    setInput('');
    setLoading(true);
    setTyping('');
    setActiveChatId(targetChatId);

    await addMessage({
      role: 'user',
      content: userInput,
      time: new Date().toISOString(),
    });

    stopStreamRef.current = sendMessageStream(
      userInput,
      ({ full }) => {
        if (requestId !== currentRequestId.current) return;
        setTyping(full);
      },
      async (finalText) => {
        if (requestId !== currentRequestId.current) return;

        await addMessage({
          role: 'ai',
          content: finalText,
          time: new Date().toISOString(),
        });

        // ✨ [제목 생성 로직 추가] ✨
        // 첫 메시지이고, 현재 채팅방의 제목이 아직 "새 채팅"일 때만 실행
        const currentChat = chats.find((c) => c.id === targetChatId);
        if (isNewChat || (currentChat && currentChat.title === '새 채팅')) {
          try {
            // 요약용 프롬프트와 함께 API 호출
            const summaryPrompt = `"${userInput}" 이 내용을 문맥에 맞게 5자 이내의 아주 짧은 한글 제목으로 요약해줘. 인사말이나 따옴표 없이 딱 제목만 보내.`;
            const aiTitle = await sendMessage(summaryPrompt);

            if (aiTitle && targetChatId) {
              // 스토어와 DB의 제목을 업데이트하는 액션 (스토어에 updateChatTitle이 있다고 가정)
              updateChatTitle(targetChatId, aiTitle.trim());
            }
          } catch (error) {
            console.error('Failed to generate title:', error);
          }
        }

        setTyping('');
        setLoading(false);
        setActiveChatId(null);
        stopStreamRef.current = null;
      }
    );
  }, [input, loading, currentChatId, createChat, addMessage, chats, updateChatTitle]);

  const handleStop = useCallback(async () => {
    if (stopStreamRef.current) {
      stopStreamRef.current();
      stopStreamRef.current = null;

      const interruptedContent = typing
        ? `${typing}\n\n> 요청을 중단하였습니다.`
        : '> 요청을 중단하였습니다.';

      await addMessage({
        role: 'ai',
        content: interruptedContent,
        time: new Date().toISOString(),
      });

      setLoading(false);
      setTyping('');
      setActiveChatId(null);
    }
  }, [typing, addMessage]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <ChatWindow
        typing={typing}
        loading={loading}
        activeChatId={activeChatId}
        onQuickSend={(q) => {
          setInput(q);
          setTimeout(() => handleSend(), 0);
        }}
      />

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onStop={handleStop}
        loading={loading}
        typing={typing}
      />
    </div>
  );
}

export default ChatPage;
