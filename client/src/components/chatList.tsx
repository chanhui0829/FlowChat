import { FiPlus, FiX } from 'react-icons/fi';
import { useChatStore } from '../store/chat.store';
import { useState } from 'react';

export default function ChatList() {
  const { chats, currentChatId, createChat, setCurrentChat, deleteChat } = useChatStore();

  const [search, setSearch] = useState('');

  // 🔥 모달 상태
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  /**
   * 🔥 삭제 실행
   */
  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    deleteChat(deleteTargetId);
    setDeleteTargetId(null);
  };

  /**
   * 🔥 모달 닫기
   */
  const handleCloseModal = () => {
    setDeleteTargetId(null);
  };

  return (
    <div className="w-64 bg-white border-r p-4 flex flex-col">
      {/* 검색창 */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 검색어를 입력해주세요"
        className="mb-3 pl-3 p-2 border rounded-lg text-sm"
      />

      {/* 새 채팅 버튼 */}
      <button
        onClick={createChat}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 transition text-white py-2 pr-2 rounded-lg mb-4"
      >
        <FiPlus /> 새 채팅
      </button>

      {/* 섹션 텍스트 */}
      <div className="text-xs text-left text-gray-400 mb-2 px-1">최근</div>

      {/* 채팅 리스트 */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border-l-4 transition ${
              chat.id === currentChatId
                ? 'bg-gray-100 border-blue-500'
                : 'border-transparent hover:bg-gray-50'
            }`}
          >
            <div
              onClick={() => setCurrentChat(chat.id)}
              className="flex-1 truncate text-left font-medium"
            >
              {chat.title}
            </div>

            {/* 🔥 삭제 버튼 → 모달 열기 */}
            <FiX
              size={14}
              className="cursor-pointer text-gray-400 hover:text-gray-600"
              onClick={() => setDeleteTargetId(chat.id)}
            />
          </div>
        ))}
      </div>

      {/* 🔥 커스텀 모달 */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-80 p-5">
            <div className="text-lg font-semibold mb-2">채팅 삭제</div>
            <div className="text-sm text-gray-600 mb-4">정말 이 채팅을 삭제하시겠습니까?</div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-100"
              >
                취소
              </button>

              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
