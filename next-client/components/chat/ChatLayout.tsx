/**
 * @description 채팅 레이아웃 컴포넌트 (재사용 가능)
 * [Architecture]:
 * - 비즈니스 로직은 useChat 훅으로 캡슐화하여 UI 컴포넌트의 복잡도를 낮춤.
 * - 도메인 기반 설계를 통해 각 부품(Window, Input)의 관심사를 분리함.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiTrash2, FiMenu, FiPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';
import AuthModal from '@/components/auth/AuthModal';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/lib/store';
import { useAuthStore } from '@/lib/authStore';

/**
 * @description 채팅 레이아웃 컴포넌트 (재사용 가능)
 * [Architecture]:
 * - 비즈니스 로직은 useChat 훅으로 캡슐화하여 UI 컴포넌트의 복잡도를 낮춤.
 * - 도메인 기반 설계를 통해 각 부품(Window, Input)의 관심사를 분리함.
 */ export default function ChatLayout({ initialChatId }: { initialChatId?: string }) {
  const router = useRouter();
  const { deleteChat, loadChats, setCurrentChat, createChat, chats, currentChatId } =
    useChatStore();
  const isAwaitingResponse = useChatStore((state) => state.isAwaitingResponse);
  const { user, initAuth } = useAuthStore();

  const { input, setInput, typing, isSending, handleSend, handleStop, handleQuickSend } = useChat();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  // [모바일 헤더 무경계화]
  // 스크롤하는 동안에는 헤더(햄버거/제목/새 채팅 버튼 전체)를 보여주고, 스크롤이
  // "멈추고" 2초가 지나면 헤더 전체가 사라지면서 채팅 내용만 보이게 함 — 제목
  // 텍스트만 숨기는 게 아니라 헤더 바 자체가 접히면서(높이까지) 사라짐.
  // [Fix] 이 자동 숨김은 "스크롤해서 내려간 상태"에서만 적용해야 함. 맨 위(새 채팅 화면
  // 포함)에서는 가만히 있어도 헤더가 계속 보여야 새 채팅/사이드바 버튼에 접근할 수 있음 —
  // 그렇지 않으면 처음 진입해서 스크롤 한 번도 안 한 상태로 2초가 지나는 순간 헤더에 닿을
  // 방법이 아예 없어짐. 그래서 "맨 위(atTop)"일 때는 예전처럼 배경과 자연스럽게 섞인(그림자
  // 없는) 헤더를 고정으로 계속 보여주고, 맨 위에서 벗어나 실제로 스크롤된 상태일 때만
  // "스크롤 중엔 보이고 2초 idle 후 사라짐 + 그림자로 분리" 동작을 적용함.
  // [Fix] 스크롤 이벤트가 올 때마다 setTimeout을 새로 걸고(clearTimeout+setTimeout) 지우는
  // debounce 방식은 스크롤이 초당 수십 번씩 발생할 수 있어서 타이머를 그만큼 자주 만들고
  // 지우게 되는데, "스크롤 후 가만히 있어도 반영이 안 되다가 탭을 전환했다 돌아와야만
  // 반영된다"는 증상이 있었음(모바일 브라우저가 백그라운드/전환 시점에야 밀린 타이머를
  // 몰아서 처리하는 것으로 보임). 이를 피하기 위해 타이머를 매번 새로 만들지 않고,
  // "마지막 스크롤 시각"만 기록해두고 가벼운 interval 하나가 주기적으로 "그 이후
  // 경과 시간"을 검사하는 방식으로 처리함.
  const [headerVisible, setHeaderVisible] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const atTopRef = useRef(true);
  const lastScrollAtRef = useRef(Date.now());

  const currentChatTitle = chats.find((c) => c.id === currentChatId)?.title;

  // [Fix] atTop(맨 위 여부)은 항상 실제 스크롤 위치를 그대로 반영해야 정확함 — 이걸
  // "사용자 스크롤인지 자동 스크롤인지"에 따라 다르게 처리하려다 레이스 컨디션이 생겼었어서,
  // 이 함수는 순수하게 스크롤 위치만 반영하고 idle 타이머(헤더 노출 유지)는 완전히 분리함
  const handleScrollTopChange = useCallback((scrollTop: number) => {
    const isTop = scrollTop <= 4;
    atTopRef.current = isTop;
    setAtTop(isTop);
  }, []);

  // [Fix] "스크롤 중엔 헤더를 보여준다"는 사용자 의도를 스크롤 이벤트가 아니라 실제
  // touch/wheel 입력 이벤트로 직접 판단함 — streaming 중 자동으로 하단에 붙는 스크롤은
  // 이 함수를 타지 않으므로, 답변이 생성되는 동안에도 사용자가 손을 안 대고 있으면 정확히
  // 2초 뒤 헤더가 사라짐
  const handleUserActivity = useCallback(() => {
    lastScrollAtRef.current = Date.now();
    setHeaderVisible(true);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!atTopRef.current && Date.now() - lastScrollAtRef.current >= 2000) {
        setHeaderVisible((prev) => (prev ? false : prev));
      }
    }, 300);

    return () => clearInterval(intervalId);
  }, []);

  const handleNewChat = async () => {
    if (isAwaitingResponse) return;
    const newId = await createChat();
    if (newId) {
      router.push(`/chat/${newId}`);
      setSidebarOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      await deleteChat(deleteTargetId);
      setDeleteTargetId(null);
      router.push('/');
    }
  };

  // 인증 상태 초기화 (세션 복구 + onAuthStateChange 구독)
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // 로그인 상태면 서버에서 채팅 목록 로드
  // [Fix] 예전엔 여기서 "!user → resetChats()"도 함께 처리했으나, ChatLayout은
  //       '/' <-> '/chat/[id]' 이동마다 재마운트되는 컴포넌트라 비로그인 상태에서
  //       새 채팅을 만들자마자(라우팅으로 인한 재마운트 시) 방금 만든 로컬 채팅까지
  //       지워지는 문제가 있었음. 실제 로그아웃 시의 정리는 authStore의
  //       onAuthStateChange(SIGNED_OUT) 쪽에서 처리함.
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  //초기 채팅 ID 설정
  useEffect(() => {
    if (initialChatId) {
      setCurrentChat(initialChatId);
    }
  }, [initialChatId, setCurrentChat]);

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden font-sans text-slate-900">
      {/* 모바일 사이드바 활성화 시 배경 처리 */}
      {/* [Fix] 예전엔 bg-black/30(짙은 검정 딤)이라 데스크탑의 밝은 사이드바 톤과
          너무 이질감이 있었음 — 데스크탑에서 사이드바 옆 본문이 그냥 밝은 배경인 것처럼,
          모바일도 어둡게 가리기보다는 사이드바와 같은 계열의 밝은 톤으로 살짝만 흐리게 처리 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-zinc-100/70 z-30 md:hidden backdrop-blur-md transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <ChatList
        setDeleteTargetId={setDeleteTargetId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onRequireAuth={() => setAuthModalOpen(true)}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* [Fix] 예전엔 헤더는 항상 그 자리에 있고 제목 텍스트만 opacity/translate로
            나타났다 사라졌었음 — 사용자가 원한 건 "헤더 바 자체"가 스크롤 중엔 보이고,
            멈춘 뒤 2초 뒤엔 높이까지 접히면서 사라져 채팅 영역이 그 공간을 그대로
            넘겨받는 것이었음. overflow-hidden + max-height/opacity/padding을 함께
            트랜지션시켜서 "접히는" 느낌을 냄.
            [Fix] 맨 위(atTop)에서는 항상 보이되, 배경과 섞이도록 그림자는 빼고 — 스크롤로
            맨 위에서 벗어났을 때만 그림자가 붙은 "떠 있는" 헤더로 보이다가 idle 시 사라짐 */}
        <header
          className={`
            md:hidden relative z-10 flex items-center justify-between px-4 bg-white shrink-0
            overflow-hidden transition-[max-height,opacity,padding,box-shadow] duration-300 ease-out
            ${
              atTop || headerVisible
                ? `max-h-16 py-3 opacity-100 ${
                    !atTop ? 'shadow-[0_10px_18px_-14px_rgba(24,24,27,0.18)]' : ''
                  }`
                : 'max-h-0 py-0 opacity-0 pointer-events-none'
            }
          `}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -m-2 text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors"
            aria-label="메뉴 열기"
          >
            <FiMenu size={19} />
          </button>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[14.5px] font-semibold text-zinc-900 whitespace-nowrap max-w-[55%] truncate">
            {currentChatTitle}
          </span>
          <button
            onClick={handleNewChat}
            className="p-2 -m-2 text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors"
            aria-label="새 채팅"
          >
            <FiPlus size={19} />
          </button>
        </header>

        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <ChatWindow
            typing={typing}
            isSending={isSending}
            onQuickSend={handleQuickSend}
            onScrollTopChange={handleScrollTopChange}
            onUserActivity={handleUserActivity}
          />
          {/* 비로그인 상태 안내: ChatGPT처럼 대화 자체는 막지 않고, 저장되지 않는다는 점만 살짝 안내 */}
          {!user && (
            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-zinc-400">
              <span>대화 내용이 저장되지 않아요</span>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="font-bold text-zinc-900 hover:underline"
              >
                로그인하고 저장하기
              </button>
            </div>
          )}
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
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
