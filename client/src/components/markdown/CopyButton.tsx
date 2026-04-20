import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

export const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 transition-all text-slate-400 hover:text-white"
    >
      {copied ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} />}
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {copied ? 'Done' : 'Copy'}
      </span>
    </button>
  );
};
