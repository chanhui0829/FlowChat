import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { FiTrash2 } from 'react-icons/fi';

/* Components & Stores */
import ChatList from './components/chat/chatList';
import ChatPage from './pages/ChatPage';
import CaseStudy from './pages/CaseStudy';
import { useChatStore } from './store/chat.store';
import Logo from './components/common/Logo';

/**
 * 애플리케이션 메인 레이아웃 컴포넌트
 * 사이드바와 대화창 사이의 전역 상태(모달, 사이드바 오픈 여부)를 관리합니다.
 */
function App() {
  const navigate = useNavigate();
  const { deleteChat } = useChatStore();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 사이드바 배경 (모바일 전용) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden pointer-events-auto"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 영역 */}
      <ChatList
        setDeleteTargetId={setDeleteTargetId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 모바일 상단 헤더 */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex flex-row items-center gap-2 shrink-0">
            {/* 💎 핵심: button에 flex와 items-center를 추가해서 한 줄로 만듭니다. */}
            <button
              onClick={() => navigate('/')}
              className="flex flex-row items-center gap-2 outline-none group"
            >
              <Logo className="w-7 h-7 md:w-12 md:h-12 animate-pulse" />
              <span className="text-lg font-bold tracking-tight text-slate-800 whitespace-nowrap pl-1">
                {/* 💎 핵심: 텍스트를 span으로 감싸고 whitespace-nowrap 적용 */}
                FlowChat
              </span>
            </button>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-2xl p-1">
            ☰
          </button>
        </div>

        {/* 라우팅 영역 */}
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/case-study" element={<CaseStudy />} />
        </Routes>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setDeleteTargetId(null)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-[2.5rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] w-full max-w-[360px] p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <FiTrash2 size={28} className="text-red-500" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
                채팅을 삭제할까요?
              </h3>
              <p className="text-[14px] text-slate-500 leading-relaxed mb-8">
                삭제된 채팅은 복구할 수 없습니다.
                <br />
                정말 삭제하시겠습니까?
              </p>

              <div className="flex flex-col w-full gap-2">
                <button
                  onClick={async () => {
                    await deleteChat(deleteTargetId);
                    setDeleteTargetId(null);
                  }}
                  className="w-full py-4 bg-red-500 border hover:bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
                >
                  네, 삭제할게요
                </button>
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="w-full py-4 bg-white border hover:bg-slate-50 text-slate-500 rounded-2xl font-bold transition-all active:scale-[0.98]"
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

export default App;
