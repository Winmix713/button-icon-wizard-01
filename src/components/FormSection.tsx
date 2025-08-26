import React, { useState } from 'react';
import { Link2, KeyRound, Eye, EyeOff, Wand2, RotateCcw, FileCode, Braces, FileType, Layers, ShieldCheck } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';
import { ConversionResults } from '../App';

interface FormSectionProps {
  showToast: (message: string) => void;
  onConversionComplete: (results: ConversionResults) => void;
}

const FormSection: React.FC<FormSectionProps> = ({ showToast, onConversionComplete }) => {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaToken, setFigmaToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [refEnabled, setRefEnabled] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Előkészítés...');
  const [currentStep, setCurrentStep] = useState(0);

  const isValidFigmaUrl = (url: string) => 
    /^(https?:\/\/)?(www\.)?figma\.com\/(file|design|proto)\/[A-Za-z0-9\-_]+/i.test(url.trim());
  
  const isValidToken = (token: string) => 
    /^figd_[A-Za-z0-9]{20,}$/.test(token.trim());

  const urlError = figmaUrl && !isValidFigmaUrl(figmaUrl);
  const tokenError = figmaToken && !isValidToken(figmaToken);

  const handlePaste = async (setter: (value: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setter(text.trim());
      }
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  const handleReset = () => {
    setFigmaUrl('');
    setFigmaToken('');
    setIsConverting(false);
    setProgress(0);
    setProgressLabel('Előkészítés...');
    setCurrentStep(0);
  };

  const handleConvert = async () => {
    if (!isValidFigmaUrl(figmaUrl) || !isValidToken(figmaToken)) {
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setCurrentStep(0);

    const steps = [
      { pct: 18, label: 'Figma adatok letöltése...', step: 0 },
      { pct: 42, label: 'Rétegek feldolgozása...', step: 1 },
      { pct: 63, label: 'Reszponzív layout generálása...', step: 2 },
      { pct: 82, label: 'Glassmorphism stílus alkalmazása...', step: 3 },
      { pct: 100, label: 'Kód exportálása...', step: 4 },
    ];

    for (const stepData of steps) {
      await new Promise(resolve => setTimeout(resolve, 520));
      setProgress(stepData.pct);
      setProgressLabel(stepData.label);
      setCurrentStep(stepData.step + 1);
    }

    // Generate example results
    const meta = `<!-- Source: ${figmaUrl.trim()} | Reference: ${refEnabled ? 'Attached/Style' : 'Direct'} -->`;
    const results: ConversionResults = {
      html: `${meta}
<div class="container mx-auto p-6">
  <header class="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-4">
    <h1 class="text-2xl font-semibold tracking-tight">Converted UI</h1>
    <p class="text-sm text-white/60">Figma → HTML export</p>
  </header>
  <main class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="rounded-2xl bg-white/5 border border-white/10 p-4">Section A</div>
    <div class="rounded-2xl bg-white/5 border border-white/10 p-4">Section B</div>
  </main>
</div>`,
      js: `// Generated interactions
document.querySelectorAll('[data-action="toggle"]').forEach(el=>{
  el.addEventListener('click',()=>el.classList.toggle('active'));
});`,
      jsx: `// Generated JSX scaffold
export default function Converted() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">Converted UI</h1>
      </header>
    </div>
  );
}`,
      css: `/* Minimal CSS hooks (utility-first) */
:root { --glass-border: rgba(255,255,255,0.10); }
.card { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); backdrop-filter: blur(16px); }`,
      layers: `/* Layer tokens mapped from Figma */
:root{
  --color-primary: 59 130 246; /* #3B82F6 */
  --radius-lg: 16px;
  --shadow-lg: 0 10px 30px rgba(0,0,0,0.35);
}
/* Example layer mappings */
.layer-Button { border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); }
.layer-Card { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.10); }`
    };

    setTimeout(() => {
      setIsConverting(false);
      onConversionComplete(results);
    }, 300);
  };

  return (
    <section className="lg:col-span-2 space-y-6">
      {/* Intro */}
      <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Figma-ból HTML</h1>
            <p className="text-sm text-white/60 mt-2">Illeszd be a Figma linket és a személyes API kulcsot a konvertáláshoz.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 rounded-xl px-3 py-1.5">
            <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
            Biztonságos
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-6 grid grid-cols-1 gap-5">
          {/* Figma URL */}
          <div>
            <label className="text-sm text-white/70">Figma Fájl URL</label>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                  <Link2 className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <input 
                  type="url" 
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/file/... vagy https://www.figma.com/design/..." 
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 outline-none rounded-xl pl-9 pr-24 py-3 text-sm placeholder-white/40 text-white" 
                />
                <button 
                  onClick={() => handlePaste(setFigmaUrl)}
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition"
                >
                  Beilleszt
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-white/50">Támogatott formátumok: Figma fájl linkek (/file/) és design linkek (/design/)</p>
            {urlError && (
              <p className="mt-2 text-xs text-rose-300">Kérjük, adj meg érvényes Figma URL-t.</p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="text-sm text-white/70">Figma API Kulcs</label>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                  <KeyRound className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <input 
                  type={showToken ? 'text' : 'password'}
                  value={figmaToken}
                  onChange={(e) => setFigmaToken(e.target.value)}
                  placeholder="figd_..." 
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 outline-none rounded-xl pl-9 pr-24 py-3 text-sm placeholder-white/40 text-white tracking-tight" 
                />
                <button 
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-10 top-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition" 
                  aria-label="Mutat/Elrejt"
                >
                  {showToken ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                </button>
                <button 
                  onClick={() => handlePaste(setFigmaToken)}
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition"
                >
                  Beilleszt
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-white/50">Szerezhető be: Figma → Account Settings → Personal Access Tokens</p>
            {tokenError && (
              <p className="mt-2 text-xs text-rose-300">Kérjük, adj meg érvényes Figma API kulcsot (figd_...).</p>
            )}
          </div>

          {/* Options */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Reference Toggle */}
            <div 
              onClick={() => setRefEnabled(!refEnabled)}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className={`w-11 h-6 rounded-full border relative transition ${
                refEnabled 
                  ? 'bg-emerald-500/20 border-emerald-400/35' 
                  : 'bg-white/10 border-white/15'
              }`}>
                <div 
                  className={`h-5 w-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    refEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className="text-sm text-white/80">Csatolt fájlok felhasználása stílus referenciaként</span>
            </div>

            <div className="hidden sm:block h-5 w-px bg-white/10"></div>

            {/* Code Type Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/60">add code</span>
              <button className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 bg-yellow-500/10 text-yellow-300 border border-yellow-400/20 hover:bg-yellow-500/15 transition">
                <FileCode className="w-3.5 h-3.5" strokeWidth={1.5} /> javascript
              </button>
              <button className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-400/20 hover:bg-indigo-500/15 transition">
                <Braces className="w-3.5 h-3.5" strokeWidth={1.5} /> jsx
              </button>
              <button className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 bg-sky-500/10 text-sky-300 border border-sky-400/20 hover:bg-sky-500/15 transition">
                <FileType className="w-3.5 h-3.5" strokeWidth={1.5} /> css
              </button>
              <button className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 hover:bg-emerald-500/15 transition">
                <Layers className="w-3.5 h-3.5" strokeWidth={1.5} /> all layer css
              </button>
            </div>
          </div>

          {/* Convert CTA */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleConvert}
              disabled={isConverting}
              className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white/90 text-black hover:bg-white transition px-5 py-3 text-sm font-medium disabled:opacity-50"
            >
              <Wand2 className="w-4.5 h-4.5" strokeWidth={1.5} />
              CONVERT
            </button>
            <button 
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/5 text-white/80 hover:text-white border border-white/10 hover:bg-white/10 transition px-4 py-3 text-sm"
            >
              <RotateCcw className="w-4.5 h-4.5" strokeWidth={1.5} />
              Reset
            </button>
          </div>
        </div>

        {/* Progress */}
        {isConverting && (
          <ProgressIndicator 
            progress={progress}
            label={progressLabel}
            currentStep={currentStep}
          />
        )}
      </div>
    </section>
  );
};

export default FormSection;