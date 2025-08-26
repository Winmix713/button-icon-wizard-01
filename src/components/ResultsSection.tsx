import React, { useState } from 'react';
import { Archive, Copy, Check } from 'lucide-react';
import { ConversionResults } from '../App';
import CodeTabs from './CodeTabs';

interface ResultsSectionProps {
  results: ConversionResults;
  showToast: (message: string) => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ results, showToast }) => {
  const [activeTab, setActiveTab] = useState<keyof ConversionResults>('json');
  const [wrapCode, setWrapCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const contentToCopy = activeTab === 'json' ? 
        (results.json || '{"error": "No JSON data available"}') : 
        results[activeTab];
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      showToast('Vágólapra másolva');
      
      setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadAll = () => {
    showToast('Exportálás előkészítve (demo)');
  };

  return (
    <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Eredmények</h2>
          <p className="text-sm text-white/60 mt-1.5">A generált kódok az alábbi füleken érhetők el.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-2 text-xs rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-white/80 hover:text-white transition"
          >
            <Archive className="w-4 h-4" strokeWidth={1.5} />
            Letöltés .zip
          </button>
        </div>
      </div>

      <div className="mt-6">
        <CodeTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="mt-4 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/60">Kattints a Másolás gombra a vágólapra helyezéshez.</div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input 
                  type="checkbox" 
                  checked={wrapCode}
                  onChange={(e) => setWrapCode(e.target.checked)}
                  className="peer sr-only" 
                />
                <span className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/5 border border-white/10 text-white/80 peer-checked:text-white hover:bg-white/10 cursor-pointer">
                  Wrap
                </span>
              </label>
              <button 
                onClick={handleCopy}
                className="inline-flex items-center gap-2 text-xs rounded-xl px-3 py-2 bg-white/10 border border-white/15 hover:bg-white/20 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Másolva
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Másolás
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Panel */}
          <div className="rounded-2xl bg-black/50 border border-white/10">
            <pre className="overflow-auto p-4 text-xs leading-relaxed text-white/90">
              <code className={`font-mono ${wrapCode ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}>
                {activeTab === 'json' ? 
                  (results.json || '{"error": "No JSON data available"}') : 
                  results[activeTab]
                }
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSection;