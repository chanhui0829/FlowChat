import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';

/* Components & API */
import ChatWindow from '../components/chat/chatWindow';
import ChatInput from '../components/chat/chatInput';
import { useChatStore } from '../store/chat.store';
import { sendMessageStream } from '../api/mcp';

/**
 * @description 채팅의 메인 비즈니스 로직을 담당하는 페이지 컴포넌트입니다.
 * 스트리밍 통제 및 스토어 데이터 연동을 총괄합니다.
 */
function ChatPage() {
  const { id } = useParams();
  const { addMessage, loadChats, createChat, currentChatId, chats, setCurrentChat } =
    useChatStore();

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const stopStreamRef = useRef<(() => void) | null>(null);

  // 채팅 내역 로드 및 현재 채팅 세션 설정
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (id && chats.length > 0) {
      setCurrentChat(id);
    }
  }, [id, chats, setCurrentChat]);

  /**
   * [Core Logic] 메시지 전송 및 실시간 스트리밍 핸들러
   */
  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    let targetChatId = currentChatId;
    const isNewChat = !targetChatId;

    // 새 채팅방 생성 로직
    if (isNewChat) {
      targetChatId = await createChat();
      if (!targetChatId) return;
    }

    const currentInput = input;
    setInput('');
    setLoading(true);
    setActiveChatId(targetChatId);

    // 사용자의 메시지를 스토어 및 DB에 즉시 반영
    await addMessage({
      role: 'user',
      content: currentInput,
      time: new Date().toISOString(),
    });

    // SSE 스트리밍 요청
    stopStreamRef.current = sendMessageStream(
      currentInput,
      ({ full }) => {
        setTyping(full); // 실시간 렌더링용 상태 업데이트
      },
      async (finalContent) => {
        // [Finalization] 스트리밍 종료 시 최종 메시지 저장
        await addMessage({
          role: 'ai',
          content: finalContent,
          time: new Date().toISOString(),
        });

        // 제목이 없는 새 채팅일 경우 AI가 요약한 제목으로 업데이트
        const target = chats.find((c) => c.id === targetChatId);
        if (target && (target.title === '새로운 채팅' || !target.title)) {
          // 여기에 제목 요약 로직 추가 가능
        }

        setTyping('');
        setLoading(false);
        setActiveChatId(null);
        stopStreamRef.current = null;
      }
    );
  }, [input, loading, currentChatId, createChat, addMessage, chats]);

  /**
   * [UX] 스트리밍 중단 기능
   */
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
