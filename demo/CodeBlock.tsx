import React, { useEffect, useMemo, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('bash', bash);

export function CopyButton({ value }: { value: string }) {
  const [status, setStatus] = useState('Copy');
  useEffect(() => {
    if (status === 'Copy') return;
    const timer = window.setTimeout(() => setStatus('Copy'), 2500);
    return () => clearTimeout(timer);
  }, [status]);
  return <button className="copy-button" onClick={async event => {
    const block = event.currentTarget.closest('.code-block, .sidebar-install');
    try { await navigator.clipboard.writeText(value); setStatus('Copied'); }
    catch {
      const code = block?.querySelector('pre code, code');
      const selection = window.getSelection();
      if (code && selection) {
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setStatus('Selected');
    }
  }} aria-label={status === 'Copy' ? 'Copy code' : status === 'Selected' ? 'Code selected; press Control or Command plus C to copy' : status}><span aria-live="polite">{status}</span></button>;
}

export default function CodeBlock({ code, language = 'tsx', compact = false }: {
  code: string; language?: 'tsx' | 'shell'; compact?: boolean;
}) {
  const [wrap, setWrap] = useState(false);
  const html = useMemo(() => hljs.highlight(code, {
    language: language === 'shell' ? 'bash' : 'typescript', ignoreIllegals: true,
  }).value, [code, language]);
  return <div className={`code-block${compact ? ' code-block-compact' : ''}`}>
    <div className="code-block-header"><span>{language === 'shell' ? 'Terminal' : 'TSX'}</span><div className="code-actions">{!compact && code.includes('\n') && <button className="code-wrap" aria-pressed={wrap} onClick={() => setWrap(!wrap)}>Wrap lines</button>}<CopyButton value={code} /></div></div>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to scroll long code horizontally. */}
    <pre className={wrap ? 'wrap-lines' : undefined} tabIndex={0} role="region" aria-label={`${language === 'shell' ? 'Terminal' : 'TSX'} code, scroll horizontally to read`}><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
  </div>;
}
