import { useState, useRef, useCallback } from 'react';
import { useChatStore } from '../../../store/chat.store';
import { sendMessageStream, getChatSummary } from '../api/chatApi';

export const useChat = () => {
  const { addMessage, createChat, currentChatId, chats, updateChatTitle } = useChatStore();

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const stopStreamRef = useRef<(() => void) | null>(null);

  // 메시지 전송 로직
  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    let targetChatId = currentChatId;

    if (!targetChatId) {
      targetChatId = await createChat();
      if (!targetChatId) return;
    }

    const currentInput = input;
    setInput('');
    setLoading(true);
    setActiveChatId(targetChatId);

    await addMessage(targetChatId, {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentInput,
      time: new Date().toISOString(),
    });

    stopStreamRef.current = sendMessageStream(
      currentInput,
      ({ full }) => setTyping(full),
      async (finalContent) => {
        await addMessage(targetChatId!, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: finalContent,
          time: new Date().toISOString(),
        });

        // 자동 제목 생성 로직
        const currentChat = chats.find((c) => c.id === targetChatId);
        const currentTitle = currentChat?.title || '새로운 채팅';
        const isDefaultTitle = currentTitle === '새로운 채팅' || currentTitle === '새로운 대화';

        if (targetChatId && isDefaultTitle) {
          try {
            const newTitle = await getChatSummary(currentInput);
            if (newTitle) await updateChatTitle(targetChatId, newTitle);
          } catch (e) {
            console.error('제목 생성 실패', e);
          }
        }

        setTyping('');
        setLoading(false);
        setActiveChatId(null);
      }
    );
  }, [input, loading, currentChatId, createChat, addMessage, chats, updateChatTitle]);

  // 중단 로직
  const handleStop = useCallback(async () => {
    if (stopStreamRef.current && activeChatId) {
      stopStreamRef.current();
      stopStreamRef.current = null;

      await addMessage(activeChatId, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: typing ? `${typing}\n\n> 중단됨` : '> 중단됨',
        time: new Date().toISOString(),
      });

      setLoading(false);
      setTyping('');
      setActiveChatId(null);
    }
  }, [typing, addMessage, activeChatId]);

  // 퀵 센드 (추천 질문 등)
  const handleQuickSend = useCallback(
    (text: string) => {
      setInput(text);
      setTimeout(() => handleSend(), 0);
    },
    [handleSend]
  );

  return {
    input,
    setInput,
    typing,
    loading,
    activeChatId,
    handleSend,
    handleStop,
    handleQuickSend,
  };
};
