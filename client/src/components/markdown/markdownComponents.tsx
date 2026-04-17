import type { Components } from 'react-markdown';

export const markdownComponents: Components = {
  h1({ children }) {
    return <h1 className="text-xl font-bold mt-3 mb-2 text-gray-900">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-lg font-semibold mt-2 mb-2 text-gray-900">{children}</h2>;
  },
  p({ children }) {
    return <p className="leading-7 text-gray-800">{children}</p>;
  },
  ul({ children }) {
    return <ul className="list-disc pl-5 space-y-2 my-3 text-gray-800">{children}</ul>;
  },
  li({ children }) {
    return <li className="leading-7">{children}</li>;
  },
  table({ children }) {
    return <table className="w-full border border-gray-200 my-3 text-sm">{children}</table>;
  },
  thead({ children }) {
    return <thead className="bg-gray-100">{children}</thead>;
  },
  th({ children }) {
    return <th className="border px-3 py-2 text-left font-semibold text-gray-700">{children}</th>;
  },
  td({ children }) {
    return <td className="border px-3 py-2 text-gray-700">{children}</td>;
  },
  strong({ children }) {
    return <strong className="font-semibold text-blue-600">{children}</strong>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="mt-3 text-xs text-gray-400 border-l-2 pl-3 border-gray-300">
        {children}
      </blockquote>
    );
  },
  code({ children }) {
    return (
      <code className="bg-gray-800 text-green-400 px-1.5 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    );
  },

  pre({ children }) {
    const child = children as React.ReactElement<{ children: React.ReactNode }>;
    const code = child?.props?.children ?? '';
    const text = Array.isArray(code) ? code.join('') : String(code);

    const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
      navigator.clipboard.writeText(text);
      e.currentTarget.innerText = '✅';

      setTimeout(() => {
        e.currentTarget.innerText = '📋';
      }, 1500);
    };

    return (
      <div className="relative group my-4">
        <div className="flex items-center justify-between bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-t-lg">
          <span>code</span>
          <button onClick={handleCopy} className="opacity-70 hover:opacity-100 transition">
            📋
          </button>
        </div>

        <pre className="bg-gray-900 text-gray-200 p-4 rounded-b-lg overflow-x-auto text-sm leading-6 border border-gray-800">
          {children}
        </pre>
      </div>
    );
  },
};
