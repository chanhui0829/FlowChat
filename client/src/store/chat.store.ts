import { create } from 'zustand';

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

  createChat: () => void;
  setCurrentChat: (id: string) => void;
  addMessage: (msg: Message) => void;
  deleteChat: (id: string) => void;
  loadChats: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  currentChatId: null,

  createChat: () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: '새 채팅',
      messages: [],
    };

    set((state) => ({
      chats: [newChat, ...state.chats],
      currentChatId: newChat.id,
    }));
  },

  setCurrentChat: (id) => set({ currentChatId: id }),

  addMessage: (msg) => {
    const { chats, currentChatId } = get();

    const updated = chats.map((chat) =>
      chat.id === currentChatId
        ? {
            ...chat,
            messages: [...chat.messages, msg],
            title: chat.messages.length === 0 ? msg.content.slice(0, 10) : chat.title,
          }
        : chat
    );

    set({ chats: updated });
  },

  deleteChat: (id) => {
    const filtered = get().chats.filter((c) => c.id !== id);
    set({
      chats: filtered,
      currentChatId: filtered[0]?.id || null,
    });
  },

  // 🔥 localStorage 불러오기
  loadChats: () => {
    const saved = localStorage.getItem('mcp-chats');
    if (saved) {
      const parsed = JSON.parse(saved);
      set({
        chats: parsed,
        currentChatId: parsed[0]?.id || null,
      });
    }
  },
}));

/**
 * 🔥 자동 저장 (persist)
 */
export const subscribeChatStorage = () => {
  useChatStore.subscribe((state) => {
    localStorage.setItem('mcp-chats', JSON.stringify(state.chats));
  });
};
