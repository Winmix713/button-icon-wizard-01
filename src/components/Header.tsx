import React, { useState } from 'react';
import { Sparkles, HelpCircle as CircleHelp, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  showToast: (message: string) => void;
  onToggleAdvanced?: () => void;
  showAdvanced?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showToast, onToggleAdvanced, showAdvanced }) => {
  const [isDark, setIsDark] = useState(true);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    showToast('Téma váltás (demo)');
  };

  const handleHelpClick = () => {
    showToast('Dokumentáció hamarosan');
  };

  return (
    <header className="px-6 sm:px-8 pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white/90" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-semibold tracking-tight">Figma → HTML Converter</div>
              <div className="text-xs text-white/60">Adapted from a glassmorphism dashboard</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {onToggleAdvanced && (
              <button 
                onClick={onToggleAdvanced}
                className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition ${
                  showAdvanced 
                    ? 'bg-blue-500/20 border-blue-400/30 text-blue-300 hover:bg-blue-500/30'
                    : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                {showAdvanced ? 'Egyszerű nézet' : 'Fejlett funkciók'}
              </button>
            )}
            <button 
              onClick={handleHelpClick}
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <CircleHelp className="w-4 h-4" strokeWidth={1.5} />
              Súgó
            </button>
            <button 
              onClick={handleThemeToggle}
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              {isDark ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
              {isDark ? 'Fény' : 'Sötét'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;