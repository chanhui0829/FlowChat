'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../lib/store';
import { sendMessageStream, getChatSummary } from '../lib/api/chatApi';

export const useChat = () => {
  const router = useRouter();
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

      // [Fix] currentChatId가 있어도 실제 chats 배열에 존재하는지 함께 확인
      // 이유: 게스트 채팅은 서버/로컬스토리지에 영속화되지 않으므로, 새로고침이나
      //       예기치 못한 재마운트 이후엔 currentChatId(URL 기반)만 남고 실제 chats
      //       엔트리는 사라진 "유령 ID" 상태가 될 수 있음. 이 경우 addMessage가
      //       매칭되는 채팅을 못 찾아 조용히 무시되어 채팅 자체가 먹통이 되는
      //       문제가 있었음 → 존재하지 않으면 새 채팅을 만들어 자연 복구시킴
      const chatExists =
        !!targetChatId && getState().chats.some((c) => c.id === targetChatId);

      if (!chatExists) {
        targetChatId = await createChat();
        if (targetChatId) {
          router.replace(`/chat/${targetChatId}`);
        }
      }

      if (!targetChatId) {
        setIsAwaitingResponse(false);
        return;
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
          // [Fix] isStreaming/typing은 전역 상태라, 사이드바 가드를 우회해
          // (뒤로가기·URL 직접 이동 등) 다른 채팅방으로 넘어간 사이에도 이
          // 콜백은 계속 불린다 — 지금 보고 있는 채팅방이 targetChatId와
          // 다르면 화면(typing 텍스트·스트리밍 표시)은 갱신하지 않고,
          // 백그라운드 완료 처리(메시지 저장 등)만 정상 진행한다.
          const isViewingThisChat = state.currentChatId === targetChatId;

          typingRef.current = full;

          if (!isViewingThisChat) return;

          if (!state.isStreaming) setIsStreaming(true);

          if (!state.hasReceivedFirstChunk) {
            setHasReceivedFirstChunk(true);
          }

          setTyping(full);
        },
        async (finalContent) => {
          // [Fix] "채팅이 아예 안 먹는다" 버그의 핵심 원인.
          // isStreaming/isAwaitingResponse/hasReceivedFirstChunk는 "지금 보고 있는
          // 채팅방"과 무관하게 전역적으로 전송 가능 여부·사이드바 채팅 전환 가능
          // 여부를 잠그는 락(lock)이다 (handleSend 상단의 `isSending || isStreaming`
          // 가드, useChatListLogic의 `isAwaitingResponse` 가드, ChatWindow의
          // `shouldShowStreamingBubble = isAwaitingResponse` 모두 이 값을 그대로 씀).
          // 이걸 onChunk와 동일하게 isViewingThisChat으로 가드해버리면, 스트림이
          // 실제로 끝난 시점에 사용자가 마침 다른 채팅방을 보고 있었다는 이유만으로
          // 이 락이 영원히 풀리지 않는다 — "..." 로딩 표시가 사라지지 않고, "새
          // 채팅"과 채팅방 전환이 전부 막힌 채로 고정되는 버그가 됨(리로드 전까지
          // 복구 불가). 화면에 무얼 "보여줄지"는 onChunk에서 이미 isViewingThisChat
          // 으로 안전하게 가드하고 있으므로, 여기서는 락 해제를 절대 조건부로 하지
          // 않고 스트림이 끝나는 즉시 무조건 해제한다.
          setIsStreaming(false);
          setIsAwaitingResponse(false);
          setHasReceivedFirstChunk(false);
          setTyping('');

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
        },
        async (error) => {
          // [Fix] 이전에는 fetch 실패(네트워크 오류, Render 콜드스타트 중 프록시
          // 타임아웃으로 인한 502/504 등)가 나면 아무 콜백도 호출되지 않아 위와
          // 완전히 같은 방식으로 로딩 락이 영원히 풀리지 않았다 — 사용자 입장에서는
          // "..."만 뜬 채 응답도, 에러 메시지도, 재시도 방법도 없이 채팅 자체가
          // 먹통이 된 것처럼 보였음(리로드 전까지). 에러 시에도 반드시 락을 풀고,
          // 사용자가 실패를 인지하고 재시도할 수 있도록 메시지를 남긴다.
          console.error('[useChat] 스트리밍 실패:', error);

          setIsStreaming(false);
          setIsAwaitingResponse(false);
          setHasReceivedFirstChunk(false);
          setTyping('');

          stopStreamRef.current = null;
          typingRef.current = '';

          await addMessage(targetChatId!, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              '> ⚠️ 응답을 가져오지 못했습니다. 서버가 깨어나는 중일 수 있어요 — 잠시 후 다시 시도해주세요.',
            time: new Date().toISOString(),
          });
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

  // [Fix] 언마운트 시 진행 중이던 스트림을 그대로 abort — 이전에는 정지 버튼을
  // 누를 때만 abort()가 호출되고, 다른 채팅방으로 이동하는 가드를 우회하는
  // 경로(브라우저 뒤로가기, URL 직접 이동 등)에서는 fetch가 백그라운드에
  // 남아 전역 스트리밍 상태를 계속 건드릴 수 있었음. 메시지 저장 같은 부수
  // 효과는 없이 요청만 끊는다 — handleStop과 달리 "중단됨" 메시지는 남기지
  // 않음(사용자가 명시적으로 멈춘 게 아니라 화면을 떠난 것이므로).
  useEffect(() => {
    return () => {
      stopStreamRef.current?.();
      stopStreamRef.current = null;
    };
  }, []);

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
