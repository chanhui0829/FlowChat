// useChat.ts 전체
'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useChatStore } from '../lib/store';
import { sendMessageStream, getChatSummary } from '../lib/api/chatApi';

export const useChat = () => {
  const { addMessage, createChat, updateChatTitle, setIsStreaming } = useChatStore();

  const getState = useChatStore.getState;

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');

  // input을 ref로도 추적 → handleSend deps에서 input 제거 가능
  const inputRef = useRef('');
  const typingRef = useRef('');
  const stopStreamRef = useRef<(() => void) | null>(null);

  // setInput을 감싸서 ref도 동기 업데이트
  const handleSetInput = useCallback((value: string) => {
    inputRef.current = value;
    setInput(value);
  }, []);

  const handleSend = useCallback(
    async (overrideInput?: string) => {
      const textToSend = overrideInput ?? inputRef.current; // ref에서 읽음

      const { isStreaming, isCreatingChat, isSavingMessage } = getState();
      const isSending = isCreatingChat || isSavingMessage;

      if (!textToSend.trim() || isSending || isStreaming) return;

      let targetChatId = getState().currentChatId;

      if (!targetChatId) {
        targetChatId = await createChat();
        if (!targetChatId) return;
      }

      // input 초기화
      inputRef.current = '';
      setInput('');

      await addMessage(targetChatId, {
        id: crypto.randomUUID(),
        role: 'user',
        content: textToSend,
        time: new Date().toISOString(),
      });

      const freshChats = getState().chats;
      const history =
        freshChats
          .find((c) => c.id === targetChatId)
          ?.messages.map(({ role, content }) => ({ role, content })) ?? [];

      stopStreamRef.current = sendMessageStream(
        textToSend,
        ({ full }) => {
          if (!getState().isStreaming) setIsStreaming(true);
          typingRef.current = full;
          setTyping(full);
        },
        async (finalContent) => {
          setIsStreaming(false);
          stopStreamRef.current = null;
          typingRef.current = '';

          await addMessage(targetChatId!, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: finalContent,
            time: new Date().toISOString(),
          });

          const latestChat = getState().chats.find((c) => c.id === targetChatId);
          const isDefaultTitle =
            !latestChat?.title ||
            latestChat.title === '새로운 채팅' ||
            latestChat.title === '새로운 대화';

          if (isDefaultTitle) {
            try {
              const newTitle = await getChatSummary(textToSend);
              if (newTitle) await updateChatTitle(targetChatId!, newTitle);
            } catch (e) {
              console.error('제목 생성 실패', e);
            }
          }

          setTyping('');
        },
        history
      );
      // input, isSending, isStreaming 전부 getState()나 ref로 읽으므로 deps 불필요
    },
    [createChat, addMessage, getState, updateChatTitle, setIsStreaming]
  );

  const handleStop = useCallback(async () => {
    if (!stopStreamRef.current) return;

    stopStreamRef.current();
    stopStreamRef.current = null;
    setIsStreaming(false); // handleStop에서도 명시적으로 false

    const currentTyping = typingRef.current;
    const targetChatId = getState().currentChatId;

    if (targetChatId) {
      await addMessage(targetChatId, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: currentTyping ? `${currentTyping}\n\n> 중단됨` : '> 중단됨',
        time: new Date().toISOString(),
      });
    }

    typingRef.current = '';
    setTyping('');
  }, [addMessage, getState, setIsStreaming]);

  const handleQuickSend = useCallback(
    (text: string) => {
      inputRef.current = text;
      setInput(text);
      handleSend(text);
    },
    [handleSend]
  );

  // isSending, isStreaming은 UI 표시용으로만 구독
  const isSending = useChatStore((s) => s.isCreatingChat || s.isSavingMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);

  return useMemo(
    () => ({
      input,
      setInput: handleSetInput,
      typing,
      isSending,
      isStreaming,
      handleSend,
      handleStop,
      handleQuickSend,
    }),
    [input, typing, isSending, isStreaming, handleSend, handleStop, handleQuickSend, handleSetInput]
  );
};
