'use client';

import { memo, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';

const MemoizedCodeBody = memo(({ codeContent }: { codeContent: string }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [codeContent]);

  return (
    <pre>
      <code ref={codeRef} className="language-javascript">
        {codeContent}
      </code>
    </pre>
  );
});

MemoizedCodeBody.displayName = 'MemoizedCodeBody';
export default MemoizedCodeBody;
