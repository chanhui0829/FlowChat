import { create } from 'zustand';
import { supabase } from '../lib/supabase';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
export type Message = {
  role: 'user' | 'ai';
  content: string;
  time: string;
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

type ChatStore = {
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  loadChats: () => Promise<void>;
  createChat: () => Promise<string | null>;
  setCurrentChat: (id: string | null) => void;
  addMessage: (msg: Message) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  updateChatTitle: (id: string, newTitle: string) => Promise<void>;
};

interface DBChatMessage {
  role: 'user' | 'ai';
  content: string;
  created_at: string;
  session_id: string;
}

/**
 * @description Zustand를 활용한 전역 상태 관리 저장소입니다.
 * Supabase DB와의 동기화를 통해 영구적인 채팅 내역 보존을 담당합니다.
 */
export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  currentChatId: null,
  isLoading: false,

  /* DB 데이터 로드 */
  loadChats: async () => {
    set({ isLoading: true });
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*, chat_messages(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('데이터 로드 실패:', error);
      set({ isLoading: false });
      return;
    }

    const formattedChats: Chat[] = sessions.map((s) => ({
      id: s.id,
      title: s.title || '새로운 채팅',
      messages: (s.chat_messages || []).map((m: DBChatMessage) => ({
        role: m.role,
        content: m.content,
        time: m.created_at,
      })),
    }));

    set({ chats: formattedChats, isLoading: false });
  },

  /* 세션 제어 */
  setCurrentChat: (id) => set({ currentChatId: id }),

  createChat: async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ title: '새로운 채팅' }])
      .select()
      .single();

    if (error) return null;
    const newChat: Chat = { id: data.id, title: data.title, messages: [] };
    set((state) => ({ chats: [newChat, ...state.chats], currentChatId: data.id }));
    return data.id;
  },

  /* 메시지 추가 및 영구 저장 */
  addMessage: async (msg) => {
    const { currentChatId } = get();
    if (!currentChatId) return;

    // UI 즉시 업데이트 (Optimistic Update 스타일)
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === currentChatId ? { ...c, messages: [...c.messages, msg] } : c
      ),
    }));

    // DB 저장
    await supabase.from('chat_messages').insert([
      {
        session_id: currentChatId,
        role: msg.role,
        content: msg.content,
      },
    ]);
  },

  deleteChat: async (id) => {
    const { error } = await supabase.from('chat_sessions').delete().eq('id', id);
    if (error) return;

    const filtered = get().chats.filter((c) => c.id !== id);
    set({
      chats: filtered,
      currentChatId: filtered[0]?.id || null,
    });
  },

  updateChatTitle: async (id, newTitle) => {
    await supabase.from('chat_sessions').update({ title: newTitle }).eq('id', id);
    set((state) => ({
      chats: state.chats.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
    }));
  },
}));
