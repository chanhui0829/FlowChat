import { create } from 'zustand';
import { chatService } from './services/chatService';
import { useAuthStore } from './authStore';
import type { Chat, Message, DBChatMessage } from './types/chat';

/**
 * [Zustand Store Interface]
 * 상태(State)와 행위(Actions)를 명확히 분리하여 스토어의 역할을 정의합니다.
 */
interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  isLoadingChats: boolean;
  isCreatingChat: boolean;
  isSavingMessage: boolean;
  isStreaming: boolean;
  isAwaitingResponse: boolean;
  hasReceivedFirstChunk: boolean;
  error: string | null;
  getIsSending: () => boolean;
}

interface ChatActions {
  loadChats: () => Promise<void>;
  createChat: () => Promise<string | null>;
  setCurrentChat: (id: string | null) => void;
  addMessage: (sessionId: string, msg: Message) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  updateChatTitle: (id: string, newTitle: string) => Promise<void>;
  setIsStreaming: (status: boolean) => void;
  setIsAwaitingResponse: (status: boolean) => void;
  setHasReceivedFirstChunk: (status: boolean) => void;
  resetChats: () => void;
}

interface ChatSessionResponse {
  id: string;
  title: string | null;
  chat_messages: DBChatMessage[];
}

/**
 * @description 채팅 도메인 전역 상태 관리 스토어
 * [Technical Point]
 * 1. Layered Architecture: DB 통신 로직은 Service 레이어로 위임하여 결합도를 낮춤.
 * 2. Data Transformation: DB의 raw 데이터를 UI 친화적인 도메인 모델로 변환하여 관리.
 * 3. Optimistic Updates + Rollback: 선제적 UI 업데이트 후 서버 실패 시 이전 상태로 복구.
 */
export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  /* --- Initial State --- */
  chats: [],
  currentChatId: null,
  isLoadingChats: false,
  isCreatingChat: false,
  isSavingMessage: false,
  isStreaming: false,
  isAwaitingResponse: false,
  hasReceivedFirstChunk: false,
  setIsStreaming: (status: boolean) => set({ isStreaming: status }),
  setIsAwaitingResponse: (status: boolean) => set({ isAwaitingResponse: status }),
  setHasReceivedFirstChunk: (status: boolean) => set({ hasReceivedFirstChunk: status }),
  getIsSending: () => {
    const state = get();
    return state.isCreatingChat || state.isSavingMessage;
  },
  error: null,

  /* --- Actions --- */

  /**
   * 전체 채팅 세션 로드 및 초기화
   * API 응답 데이터를 Service 레이어의 Mapper를 통해 규격화된 타입으로 정제합니다.
   */
  loadChats: async () => {
    set({ isLoadingChats: true, error: null });
    try {
      const rawSessions = await chatService.fetchSessions();
      const sessions = rawSessions as ChatSessionResponse[];

      const formattedChats: Chat[] = sessions.map((s) => ({
        id: s.id,
        title: s.title || '새로운 채팅',
        messages: chatService.mapMessages(s.chat_messages || []),
      }));

      set({ chats: formattedChats });
    } catch (error) {
      const message = error instanceof Error ? error.message : '채팅 목록을 불러오지 못했습니다.';
      set({ error: message });
      console.error('[Store: loadChats Error]', error);
    } finally {
      set({ isLoadingChats: false });
    }
  },

  /**
   * 현재 활성화된 채팅 세션 설정
   */
  setCurrentChat: (id) => set({ currentChatId: id }),

  /**
   * 새로운 채팅 세션 생성
   * 생성 즉시 로컬 상태에 반영하여 대화 시작 지연 시간을 최소화합니다.
   */
  createChat: async () => {
    set({ isCreatingChat: true });
    try {
      // 비로그인 상태에서도 대화는 가능하되(ChatGPT 방식), 서버 저장은 로그인한 사용자만 가능
      // → user_id가 없으면 DB에 남기지 않는 로컬 전용 채팅으로 생성
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        const localId = crypto.randomUUID();
        const newChat: Chat = { id: localId, title: '새로운 채팅', messages: [] };

        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: localId,
        }));

        return localId;
      }

      const data = await chatService.createSession('새로운 채팅', userId);
      const newChat: Chat = { id: data.id, title: data.title, messages: [] };

      set((state) => ({
        chats: [newChat, ...state.chats],
        currentChatId: data.id,
      }));

      return data.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : '채팅방 생성에 실패했습니다.';
      set({ error: message });
      console.error('[Store: createChat Error]', error);
      return null;
    } finally {
      set({ isCreatingChat: false });
    }
  },

  /**
   * 메시지 추가 및 영구 저장
   *
   * [Fix 3] Optimistic Update + 실패 시 롤백 구현
   *
   * 전략:
   *   1. 업데이트 전 chats를 snapshot으로 저장
   *   2. UI를 먼저 낙관적으로 업데이트 (사용자 체감 속도 향상)
   *   3. Supabase 저장 실패 시 snapshot으로 롤백 + error 상태 세팅
   *
   * 이전 코드에는 롤백 로직이 주석으로만 존재했으나,
   * 실제 네트워크 오류나 Supabase 장애 시 UI와 DB가 불일치하는 문제가 발생할 수 있어 구현함.
   */
  addMessage: async (sessionId: string, msg: Message) => {
    set({ isSavingMessage: true });

    const currentChat = get().chats.find((c) => c.id === sessionId);
    if (!currentChat) {
      set({ isSavingMessage: false });
      return;
    }

    // 1. 롤백용 snapshot 저장
    const snapshot = get().chats;

    // 2. [Optimistic Update] UI 상태를 먼저 업데이트
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === sessionId ? { ...c, messages: [...c.messages, msg] } : c
      ),
    }));

    // 비로그인 상태의 로컬 전용 채팅은 서버에 저장하지 않고 로컬 상태만 유지
    if (!useAuthStore.getState().user) {
      set({ isSavingMessage: false });
      return;
    }

    try {
      // 3. 서버 영구 저장
      await chatService.saveMessage(sessionId, msg);
    } catch (error) {
      // 4. [Rollback] 실패 시 snapshot으로 UI 복구 + 에러 상태 세팅
      set({ chats: snapshot, error: '메시지 저장에 실패했습니다.' });
      console.error('[Store: addMessage Rollback]', error);
    } finally {
      set({ isSavingMessage: false });
    }
  },

  /**
   * 채팅 세션 삭제
   */
  deleteChat: async (id) => {
    // 로컬 전용(비로그인) 채팅은 서버 삭제 없이 로컬 상태에서만 제거
    if (!useAuthStore.getState().user) {
      const filtered = get().chats.filter((c) => c.id !== id);
      set({ chats: filtered, currentChatId: filtered[0]?.id || null });
      return;
    }

    try {
      await chatService.deleteSession(id);

      const filtered = get().chats.filter((c) => c.id !== id);
      set({
        chats: filtered,
        currentChatId: filtered[0]?.id || null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '채팅 삭제에 실패했습니다.';
      set({ error: message });
      console.error('[Store: deleteChat Error]', error);
    }
  },

  /**
   * 채팅 제목 수동/자동 업데이트
   */
  updateChatTitle: async (id, newTitle) => {
    // 로컬 전용(비로그인) 채팅은 서버 업데이트 없이 로컬 상태만 갱신
    if (!useAuthStore.getState().user) {
      set((state) => ({
        chats: state.chats.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
      }));
      return;
    }

    try {
      await chatService.updateSessionTitle(id, newTitle);

      set((state) => ({
        chats: state.chats.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '제목 수정에 실패했습니다.';
      set({ error: message });
      console.error('[Store: updateChatTitle Error]', error);
    }
  },

  /**
   * 로그아웃 시 이전 사용자의 채팅 데이터를 정리
   */
  resetChats: () => set({ chats: [], currentChatId: null }),
}));
