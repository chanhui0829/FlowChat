'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useChatStore } from '../lib/store';
import { sendMessageStream, getChatSummary } from '../lib/api/chatApi';

export const useChat = () => {
  const {
    addMessage,
    createChat,
    updateChatTitle,
    setIsStreaming,
    setIsAwaitingResponse,
    setHasReceivedFirstChunk,
  } = useChatStore();

  const getState = useChatStore.getState;

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');

  const inputRef = useRef('');
  const typingRef = useRef('');
  const stopStreamRef = useRef<(() => void) | null>(null);

  const handleSetInput = useCallback((value: string) => {
    inputRef.current = value;
    setInput(value);
  }, []);

  const handleSend = useCallback(
    async (overrideInput?: string) => {
      const textToSend = overrideInput ?? inputRef.current;

      const { isStreaming, isCreatingChat, isSavingMessage } = getState();
      const isSending = isCreatingChat || isSavingMessage;

      if (!textToSend.trim() || isSending || isStreaming) return;

      setIsAwaitingResponse(true);
      setHasReceivedFirstChunk(false);

      let targetChatId = getState().currentChatId;

      if (!targetChatId) {
        targetChatId = await createChat();
        if (!targetChatId) {
          setIsAwaitingResponse(false);
          return;
        }
      }

      inputRef.current = '';
      setInput('');

      const prevMessages = getState().chats.find((c) => c.id === targetChatId)?.messages ?? [];
      const history = [...prevMessages, { role: 'user' as const, content: textToSend }].map(
        ({ role, content }) => ({ role, content })
      );

      await addMessage(targetChatId, {
        id: crypto.randomUUID(),
        role: 'user',
        content: textToSend,
        time: new Date().toISOString(),
      });

      stopStreamRef.current = sendMessageStream(
        textToSend,
        ({ full }) => {
          const state = getState();

          if (!state.isStreaming) setIsStreaming(true);

          if (!state.hasReceivedFirstChunk) {
            setHasReceivedFirstChunk(true);
          }

          typingRef.current = full;
          setTyping(full);
        },
        async (finalContent) => {
          setIsStreaming(false);
          setIsAwaitingResponse(false);
          setHasReceivedFirstChunk(false);

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
    },
    [
      createChat,
      addMessage,
      getState,
      updateChatTitle,
      setIsStreaming,
      setIsAwaitingResponse,
      setHasReceivedFirstChunk,
    ]
  );

  const handleStop = useCallback(async () => {
    if (!stopStreamRef.current) return;

    stopStreamRef.current();
    stopStreamRef.current = null;

    setIsStreaming(false);
    setIsAwaitingResponse(false);
    setHasReceivedFirstChunk(false);

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
  }, [addMessage, getState, setIsStreaming, setIsAwaitingResponse, setHasReceivedFirstChunk]);

  const handleQuickSend = useCallback(
    (text: string) => {
      inputRef.current = text;
      setInput(text);
      handleSend(text);
    },
    [handleSend]
  );

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
