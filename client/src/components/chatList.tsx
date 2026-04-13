import { FiPlus, FiX } from 'react-icons/fi';
import { useChatStore } from '../store/chat.store';
import { useState } from 'react';

export default function ChatList() {
  const { chats, currentChatId, createChat, setCurrentChat, deleteChat } = useChatStore();

  const [search, setSearch] = useState('');

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-64 bg-white border-r p-4 flex flex-col">
      {/* 🔥 검색창 */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 검색어를 입력해주세요"
        className="mb-3 pl-3 p-2 border rounded-lg text-sm"
      />

      {/* 🔥 새 채팅 버튼 */}
      <button
        onClick={createChat}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 transition text-white py-2 pr-2 rounded-lg mb-4"
      >
        <FiPlus /> 새 채팅
      </button>

      {/* 🔥 섹션 텍스트 추가 */}
      <div className="text-xs text-left text-gray-400 mb-2 px-1">최근</div>

      {/* 🔥 채팅 리스트 */}
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
            {/* 🔥 좌측 정렬 + 강조 */}
            <div
              onClick={() => setCurrentChat(chat.id)}
              className="flex-1 truncate text-left font-medium"
            >
              {chat.title}
            </div>

            <FiX
              size={14}
              className="cursor-pointer text-gray-400 hover:text-gray-600"
              onClick={() => deleteChat(chat.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
