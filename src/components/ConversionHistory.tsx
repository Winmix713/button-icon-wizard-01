import React, { useState } from 'react';
import { History, Clock, Download, Eye, RotateCcw, Trash2, Search, Filter } from 'lucide-react';
import { ConversionResults } from '../App';

interface ConversionHistoryEntry {
  id: string;
  timestamp: number;
  figmaUrl: string;
  framework: string;
  cssFramework: string;
  results: ConversionResults;
  duration?: number;
  success: boolean;
}

interface ConversionHistoryProps {
  history: ConversionHistoryEntry[];
  onRerun: (id: string) => void;
  onView: (results: ConversionResults) => void;
  onClear: () => void;
  showToast: (message: string) => void;
}

const ConversionHistory: React.FC<ConversionHistoryProps> = ({
  history,
  onRerun,
  onView,
  onClear,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFramework, setFilterFramework] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'duration' | 'framework'>('timestamp');

  const filteredHistory = history
    .filter(entry => {
      const matchesSearch = !searchTerm || 
        entry.figmaUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.framework.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterFramework === 'all' || entry.framework === filterFramework;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return b.timestamp - a.timestamp;
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'framework':
          return a.framework.localeCompare(b.framework);
        default:
          return 0;
      }
    });

  const handleDownload = async (entry: ConversionHistoryEntry) => {
    try {
      const blob = new Blob([JSON.stringify(entry.results, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conversion-${entry.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('Konverzió letöltve');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Letöltési hiba');
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Most';
    if (diffMins < 60) return `${diffMins} perce`;
    if (diffHours < 24) return `${diffHours} órája`;
    if (diffDays < 7) return `${diffDays} napja`;
    
    return date.toLocaleDateString('hu-HU');
  };

  const getFrameworkColor = (framework: string) => {
    switch (framework) {
      case 'react': return 'bg-blue-100 text-blue-800';
      case 'vue': return 'bg-green-100 text-green-800';
      case 'angular': return 'bg-red-100 text-red-800';
      case 'html': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (history.length === 0) {
    return (
      <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center">
        <History className="w-12 h-12 text-white/40 mx-auto mb-4" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold text-white/80 mb-2">Nincs konverziós előzmény</h3>
        <p className="text-sm text-white/60">
          A sikeres konverziók automatikusan megjelennek itt a gyors újrafelhasználáshoz.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-white/90" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">Konverziós Előzmények</h3>
          <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
            {history.length} elem
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-white/60 hover:text-white/80 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
        >
          <Trash2 className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} />
          Törlés
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Keresés URL vagy framework alapján..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-white/20 outline-none rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-white/40 text-white"
          />
        </div>
        
        <select
          value={filterFramework}
          onChange={(e) => setFilterFramework(e.target.value)}
          className="bg-white/5 border border-white/10 focus:border-white/20 outline-none rounded-xl px-3 py-2.5 text-sm text-white"
        >
          <option value="all">Minden framework</option>
          <option value="html">HTML</option>
          <option value="react">React</option>
          <option value="vue">Vue</option>
          <option value="angular">Angular</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-white/5 border border-white/10 focus:border-white/20 outline-none rounded-xl px-3 py-2.5 text-sm text-white"
        >
          <option value="timestamp">Dátum szerint</option>
          <option value="duration">Időtartam szerint</option>
          <option value="framework">Framework szerint</option>
        </select>
      </div>

      {/* History List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredHistory.map((entry) => (
          <div
            key={entry.id}
            className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getFrameworkColor(entry.framework)}`}>
                    {entry.framework.toUpperCase()}
                  </span>
                  <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
                    {entry.cssFramework}
                  </span>
                  {entry.success ? (
                    <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-full">
                      Sikeres
                    </span>
                  ) : (
                    <span className="text-xs text-rose-300 bg-rose-500/20 px-2 py-1 rounded-full">
                      Hiba
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-white/80 truncate mb-1" title={entry.figmaUrl}>
                  {entry.figmaUrl}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-white/60">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" strokeWidth={1.5} />
                    {formatTimestamp(entry.timestamp)}
                  </div>
                  {entry.duration && (
                    <div>Időtartam: {formatDuration(entry.duration)}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onView(entry.results)}
                  className="text-xs rounded-lg px-2.5 py-1.5 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition"
                  title="Eredmények megtekintése"
                >
                  <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                
                <button
                  onClick={() => handleDownload(entry)}
                  className="text-xs rounded-lg px-2.5 py-1.5 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition"
                  title="Letöltés"
                >
                  <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                
                <button
                  onClick={() => onRerun(entry.id)}
                  className="text-xs rounded-lg px-2.5 py-1.5 bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 hover:bg-emerald-500/20 transition"
                  title="Újrafuttatás"
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && searchTerm && (
        <div className="text-center py-8 text-white/60">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
          <p>Nincs találat a keresési feltételeknek</p>
        </div>
      )}
    </div>
  );
};

export default ConversionHistory;