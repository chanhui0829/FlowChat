import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  currentChatId: null,
  isLoading: false,

  loadChats: async () => {
    set({ isLoading: true });

    const { data: sessions, error: sError } = await supabase
      .from('chat_sessions')
      .select('*, chat_messages(*)')
      .order('created_at', { ascending: false });

    if (sError) {
      console.error('데이터 로드 실패:', sError);
      set({ isLoading: false });
      return;
    }

    // DB 데이터를 스토어 형식에 맞게 변환
    // loadChats 내 데이터 변환 로직 부분
    const formattedChats: Chat[] = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      messages: (s.chat_messages || []).map(
        (m: { role: string; content: string; created_at: string }) => {
          const date = m.created_at ? new Date(m.created_at) : new Date();

          return {
            role: m.role === 'assistant' ? 'ai' : 'user',
            content: m.content,
            time: isNaN(date.getTime())
              ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
      ),
    }));

    set({
      chats: formattedChats,
      currentChatId: formattedChats[0]?.id || null,
      isLoading: false,
    });
  },

  // 2. 채팅방 생성: DB에 새로운 세션 추가
  createChat: async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ title: '새 채팅' }])
      .select()
      .single();

    if (error) {
      console.error('채팅 생성 실패:', error);
      return null;
    }

    const newChat: Chat = { id: data.id, title: data.title, messages: [] };

    set((state) => ({
      chats: [newChat, ...state.chats],
      currentChatId: data.id,
    }));

    return data.id;
  },

  setCurrentChat: (id) => set({ currentChatId: id }),

  // 3. 메시지 추가 및 제목 자동 업데이트
  addMessage: async (msg) => {
    const { currentChatId, chats } = get();
    if (!currentChatId) return;

    const targetChat = chats.find((c) => c.id === currentChatId);
    const isFirstMessage = targetChat ? targetChat.messages.length === 0 : false;

    const tempTitle = isFirstMessage ? msg.content.slice(0, 10) : targetChat?.title || '새 채팅';

    const updated = chats.map((chat) =>
      chat.id === currentChatId
        ? { ...chat, messages: [...chat.messages, msg], title: tempTitle }
        : chat
    );
    set({ chats: updated });

    supabase
      .from('chat_messages')
      .insert([
        {
          session_id: currentChatId,
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content,
        },
      ])
      .then(({ error }) => {
        if (error) console.error(error);
      });

    // AI 제목 업데이트
    if (isFirstMessage && msg.role === 'user') {
      fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `
              사용자의 질문: "${msg.content}"
              
              위 내용을 바탕으로 사이드바에 표시할 짧은 제목을 만들어줘.
              안내사항:
              1. 조사(은/는/이/가)를 생략한 '명사형'으로 작성할 것 (예: "React 훅 비교", "useEffect 가이드")
              2. 반드시 5~8자 사이로 작성하고, 절대 따옴표나 마침표를 넣지 마.
              3. 질문 내용을 그대로 복사하지 말고 핵심 키워드로 요약해.
              제목:`,
            },
          ],
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const aiTitle = data.full.trim();

          set((state) => ({
            chats: state.chats.map((c) => (c.id === currentChatId ? { ...c, title: aiTitle } : c)),
          }));

          supabase.from('chat_sessions').update({ title: aiTitle }).eq('id', currentChatId).then();
        });
    }
  },

  deleteChat: async (id) => {
    const { error } = await supabase.from('chat_sessions').delete().eq('id', id);

    if (error) {
      console.error('삭제 실패:', error);
      return;
    }

    const filtered = get().chats.filter((c) => c.id !== id);
    set({
      chats: filtered,
      currentChatId: filtered[0]?.id || null,
    });
  },
  // 4. 제목 업데이트
  updateChatTitle: async (id: string, newTitle: string) => {
    const { error } = await supabase.from('chat_sessions').update({ title: newTitle }).eq('id', id);

    if (!error) {
      set((state) => ({
        chats: state.chats.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
      }));
    }
  },
}));
