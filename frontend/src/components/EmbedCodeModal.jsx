import React, { useState } from 'react';
import { X, Copy, Check, Code, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EmbedCodeModal({ isOpen, onClose, shopId }) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const { t } = useAuth();

  if (!isOpen) return null;

  const currentHost = window.location.origin;
  const scriptSnippet = `<script 
  src="${currentHost}/widget.js" 
  data-shop-id="${shopId}"
  data-position="bottom-right"
  async>
</script>`;

  const iframeSnippet = `<iframe 
  src="${currentHost}/#/chat/${shopId}" 
  width="400" 
  height="600" 
  style="border: none; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);"
  title="DukaanBot Chat Widget">
</iframe>`;

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{t.embedTitle}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t.embedDesc}</p>
          </div>
        </div>

        {/* Option 1: Floating Script Widget */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold uppercase text-emerald-400 tracking-wider">
              Option 1: Floating Widget Script (Recommended)
            </label>
            <button
              onClick={() => copyText(scriptSnippet, 'script')}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedScript ? t.copiedBtn : t.copyCodeBtn}
            </button>
          </div>
          <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto">
            {scriptSnippet}
          </pre>
        </div>

        {/* Option 2: Embeddable iframe */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold uppercase text-sky-400 tracking-wider">
              Option 2: Inline Iframe Embed
            </label>
            <button
              onClick={() => copyText(iframeSnippet, 'iframe')}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition"
            >
              {copiedIframe ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedIframe ? t.copiedBtn : t.copyCodeBtn}
            </button>
          </div>
          <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto">
            {iframeSnippet}
          </pre>
        </div>

        {/* Standalone link */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Direct Customer Link:</span>
          <a
            href={`/#/chat/${shopId}`}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <Globe className="w-3.5 h-3.5" /> Open Standalone Chat Page
          </a>
        </div>
      </div>
    </div>
  );
}
