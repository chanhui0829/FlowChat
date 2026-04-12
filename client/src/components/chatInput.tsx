import { FiSend } from 'react-icons/fi';

type Props = {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
};

export default function ChatInput({ input, setInput, onSend }: Props) {
  return (
    <div className="p-4 flex gap-2 border-t">
      <input
        className="flex-1 border rounded-xl p-3"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === 'Enter') {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <button onClick={onSend} className="px-6 bg-blue-500 hover:bg-blue-400 text-white rounded-xl">
        <FiSend />
      </button>
    </div>
  );
}
