import React, { useState, useCallback } from 'react';
import { Zap, Settings, TrendingUp, Shield, Code, Gauge, CheckCircle, AlertTriangle } from 'lucide-react';
import { AICodeOptimizer, OptimizationStrategy, OptimizationResult } from '../services/aiCodeOptimizer';
import { GeneratedComponent, ConversionConfig } from '../types/figma';

interface AIOptimizerProps {
  components: GeneratedComponent[];
  config: ConversionConfig;
  onOptimizationComplete: (results: OptimizationResult[]) => void;
  showToast: (message: string) => void;
}

const AIOptimizer: React.FC<AIOptimizerProps> = ({
  components,
  config,
  onOptimizationComplete,
  showToast
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, component: '' });
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const optimizer = new AICodeOptimizer();
  const availableStrategies = optimizer.getAvailableStrategies();

  const handleOptimize = useCallback(async () => {
    if (components.length === 0) {
      showToast('Nincs komponens az optimalizáláshoz');
      return;
    }

    setIsOptimizing(true);
    setProgress({ current: 0, total: components.length, component: '' });

    try {
      const results = await optimizer.optimizeBatch(
        components,
        config,
        (progressData) => {
          setProgress(progressData);
        }
      );

      setOptimizationResults(results);
      onOptimizationComplete(results);
      showToast(`${results.length} komponens sikeresen optimalizálva!`);
      
    } catch (error) {
      console.error('Optimization error:', error);
      showToast('Optimalizálási hiba történt');
    } finally {
      setIsOptimizing(false);
    }
  }, [components, config, selectedStrategies, optimizer, onOptimizationComplete, showToast]);

  const toggleStrategy = (strategyName: string) => {
    setSelectedStrategies(prev => 
      prev.includes(strategyName)
        ? prev.filter(name => name !== strategyName)
        : [...prev, strategyName]
    );
  };

  const getStrategyIcon = (category: OptimizationStrategy['category']) => {
    switch (category) {
      case 'performance': return Gauge;
      case 'accessibility': return Shield;
      case 'maintainability': return Code;
      case 'security': return Shield;
      default: return Settings;
    }
  };

  const getStrategyColor = (category: OptimizationStrategy['category']) => {
    switch (category) {
      case 'performance': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'accessibility': return 'text-emerald-400 bg-emerald-500/20 border-emerald-400/30';
      case 'maintainability': return 'text-purple-400 bg-purple-500/20 border-purple-400/30';
      case 'security': return 'text-rose-400 bg-rose-500/20 border-rose-400/30';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const calculateOverallImprovement = () => {
    if (optimizationResults.length === 0) return 0;
    
    const totalImprovement = optimizationResults.reduce((sum, result) => 
      sum + result.improvements.bundleSizeReduction, 0
    );
    
    return totalImprovement / optimizationResults.length;
  };

  return (
    <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">AI Kód Optimalizáló</h3>
          <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
            {components.length} komponens
          </span>
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-white/60 hover:text-white/80 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
        >
          <Settings className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} />
          {showAdvanced ? 'Egyszerű' : 'Fejlett'}
        </button>
      </div>

      {/* Strategy Selection */}
      {showAdvanced && (
        <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-white/80 mb-4">Optimalizálási Stratégiák</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableStrategies.map((strategy) => {
              const StrategyIcon = getStrategyIcon(strategy.category);
              const isSelected = selectedStrategies.includes(strategy.name);
              
              return (
                <div
                  key={strategy.name}
                  onClick={() => toggleStrategy(strategy.name)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    isSelected 
                      ? getStrategyColor(strategy.category)
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <StrategyIcon className="w-4 h-4 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{strategy.name}</div>
                      <div className="text-xs opacity-80 mt-1">{strategy.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                          {strategy.category}
                        </span>
                        <span className="text-xs">Prioritás: {strategy.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-xs text-white/60">
            {selectedStrategies.length === 0 ? 'Minden stratégia alkalmazva lesz' : `${selectedStrategies.length} stratégia kiválasztva`}
          </div>
        </div>
      )}

      {/* Progress */}
      {isOptimizing && (
        <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/80">Optimalizálás folyamatban...</span>
            <span className="text-sm text-white/60">{progress.current} / {progress.total}</span>
          </div>
          
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-300"
              style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
            />
          </div>
          
          {progress.component && (
            <div className="text-xs text-white/60">
              Aktuális: {progress.component}
            </div>
          )}
        </div>
      )}

      {/* Results Summary */}
      {optimizationResults.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-white/80 mb-4">Optimalizálási Eredmények</h4>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-emerald-400">
                {Math.round(calculateOverallImprovement())}%
              </div>
              <div className="text-xs text-white/60">Átlagos javulás</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-400">
                {optimizationResults.reduce((sum, r) => sum + r.improvements.performanceGain, 0) / optimizationResults.length || 0}%
              </div>
              <div className="text-xs text-white/60">Teljesítmény</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-400">
                {Math.round(optimizationResults.reduce((sum, r) => sum + r.improvements.accessibilityScore, 0) / optimizationResults.length) || 0}
              </div>
              <div className="text-xs text-white/60">Accessibility</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-400">
                {optimizationResults.reduce((sum, r) => sum + r.appliedStrategies.length, 0)}
              </div>
              <div className="text-xs text-white/60">Alkalmazott stratégiák</div>
            </div>
          </div>

          {/* Individual Results */}
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {optimizationResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                  <span className="text-sm text-white/80">Komponens {index + 1}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span>{Math.round(result.improvements.bundleSizeReduction)}% méret csökkenés</span>
                  <span>{result.appliedStrategies.length} stratégia</span>
                  {result.warnings.length > 0 && (
                    <AlertTriangle className="w-3 h-3 text-yellow-400" strokeWidth={1.5} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleOptimize}
        disabled={isOptimizing || components.length === 0}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition px-6 py-3 text-sm font-medium disabled:opacity-50"
      >
        {isOptimizing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Optimalizálás...
          </>
        ) : (
          <>
            <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
            AI Optimalizálás Indítása
          </>
        )}
      </button>
    </div>
  );
};

export default AIOptimizer;