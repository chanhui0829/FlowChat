import { useChatStore } from '../store/chat.store';

// 🔥 타입 정의 추가
type ChatWindowProps = {
  typing: string;
  loading: boolean;
};

export default function ChatWindow({ typing, loading }: ChatWindowProps) {
  const { chats, currentChatId } = useChatStore();
  const currentChat = chats.find((c) => c.id === currentChatId);

  return (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      {currentChat?.messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[80%] px-4 py-2 rounded-2xl ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}

      {/* 로딩 */}
      {loading && !typing && (
        <div className="flex">
          <div className="bg-white shadow-sm px-4 py-2 rounded-xl flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
          </div>
        </div>
      )}

      {/* 타이핑 */}
      {typing && <div className="bg-gray-100 px-4 py-2 rounded-xl w-fit">{typing}</div>}
    </div>
  );
}
