/**
 * @description 채팅 레이아웃 컴포넌트 (재사용 가능)
 * [Architecture]:
 * - 비즈니스 로직은 useChat 훅으로 캡슐화하여 UI 컴포넌트의 복잡도를 낮춤.
 * - 도메인 기반 설계를 통해 각 부품(Window, Input)의 관심사를 분리함.
 */

'use client';

import { useState, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/lib/store';
import Logo from '@/assets/Logo';

/**
 * @description 채팅 레이아웃 컴포넌트 (재사용 가능)
 * [Architecture]:
 * - 비즈니스 로직은 useChat 훅으로 캡슐화하여 UI 컴포넌트의 복잡도를 낮춤.
 * - 도메인 기반 설계를 통해 각 부품(Window, Input)의 관심사를 분리함.
 */ export default function ChatLayout({ initialChatId }: { initialChatId?: string }) {
  const router = useRouter();
  const { deleteChat, loadChats, setCurrentChat } = useChatStore();

  const { input, setInput, typing, isSending, handleSend, handleStop, handleQuickSend } = useChat();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      await deleteChat(deleteTargetId);
      setDeleteTargetId(null);
      router.push('/');
    }
  };
  // 초기 데이터 로딩
  useEffect(() => {
    loadChats();
  }, [loadChats]);
  //초기 채팅 ID 설정
  useEffect(() => {
    if (initialChatId) {
      setCurrentChat(initialChatId);
    }
  }, [initialChatId, setCurrentChat]);

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden font-sans text-slate-900">
      {/* 모바일 사이드바 활성화 시 배경 처리 */}{' '}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <ChatList
        setDeleteTargetId={setDeleteTargetId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-5 py-3 border-b bg-white/80 backdrop-blur-md">
          <div
            className="flex items-center gap-2 shrink-0 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <Logo className="w-8 h-8 animate-pulse text-zinc-900" />
            <span className="text-xl font-extrabold tracking-tighter text-zinc-900">FlowChat</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
            aria-label="메뉴 열기"
          >
            <span className="text-2xl">☰</span>
          </button>
        </header>

        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <ChatWindow typing={typing} isSending={isSending} onQuickSend={handleQuickSend} />
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onStop={handleStop}
            typing={typing}
          />
        </div>
      </main>
      {deleteTargetId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setDeleteTargetId(null)}
          />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[360px] p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <FiTrash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">채팅을 삭제할까요?</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                삭제된 채팅은 복구할 수 없습니다.
                <br />
                정말 삭제하시겠습니까?
              </p>
              <div className="flex flex-col w-full gap-2">
                <button
                  onClick={handleDeleteConfirm}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all active:scale-[0.98] shadow-lg shadow-red-200"
                >
                  네, 삭제할게요
                </button>
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="w-full py-4 bg-zinc-100 text-slate-500 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-[0.98]"
                >
                  아니요, 취소할게요
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
