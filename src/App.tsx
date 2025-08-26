import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import EnhancedFormSection from './components/EnhancedFormSection';
import ResultsSection from './components/ResultsSection';
import Sidebar from './components/Sidebar';
import RealTimeProcessor from './components/RealTimeProcessor';
import AIOptimizer from './components/AIOptimizer';
import SystemDashboard from './components/SystemDashboard';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import Toast from './components/Toast';
import Background from './components/Background';
import { useSystemMonitoring } from './hooks/useSystemMonitoring';
import { useComponentProfiler } from './utils/performanceProfiler';

export interface ConversionResults {
  html: string;
  js: string;
  jsx: string;
  css: string;
  layers: string;
}

function App() {
  const { renderCount, averageRenderTime } = useComponentProfiler('App');
  const { isMonitoring, metrics, startMonitoring, stopMonitoring } = useSystemMonitoring();
  
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false
  });
  const [results, setResults] = useState<ConversionResults | null>(null);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [conversionHistory, setConversionHistory] = useState<any[]>([]);

  const showToast = (message: string = 'Vágólapra másolva') => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 1600);
  };

  const handleConversionComplete = (results: ConversionResults) => {
    setResults(results);
    
    // Add to history
    const historyEntry = {
      id: `conversion-${Date.now()}`,
      timestamp: Date.now(),
      results,
      success: true,
      framework: 'html', // This would come from the actual config
      cssFramework: 'tailwind'
    };
    
    setConversionHistory(prev => [historyEntry, ...prev.slice(0, 19)]);
  };

  const handleOptimizationComplete = useCallback((optimizationResults: any[]) => {
    showToast(`${optimizationResults.length} komponens optimalizálva`);
  }, []);

  const handleProcessingComplete = useCallback((processingResults: any) => {
    showToast('Valós idejű feldolgozás befejezve');
  }, []);
  return (
    <div className="min-h-screen bg-black text-white antialiased overflow-x-hidden selection:bg-white/10 selection:text-white" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
      <Background />
      
      <div className="relative">
        <Header 
          showToast={showToast} 
          onToggleAdvanced={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
          showAdvanced={showAdvancedFeatures}
        />
        
        <main className="px-6 sm:px-8 pb-16 pt-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <EnhancedFormSection 
              showToast={showToast}
              onConversionComplete={handleConversionComplete}
            />
            <Sidebar showToast={showToast} />
          </div>
          
          {results && (
            <div className="max-w-7xl mx-auto mt-6 lg:mt-8">
              <ResultsSection 
                results={results}
                showToast={showToast}
              />
            </div>
          )}
          
          {/* Advanced Features Panel */}
          {showAdvancedFeatures && (
            <div className="max-w-7xl mx-auto mt-6 lg:mt-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RealTimeProcessor
                  figmaFile={null} // This would be populated from actual Figma data
                  onProcessingComplete={handleProcessingComplete}
                  showToast={showToast}
                />
                
                <AIOptimizer
                  components={[]} // This would be populated from generated components
                  config={{
                    framework: 'html',
                    cssFramework: 'tailwind',
                    typescript: true,
                    responsive: true,
                    optimizeImages: true,
                    extractTokens: true,
                    accessibility: true,
                    optimization: true,
                    semanticHtml: true,
                    componentExtraction: false
                  }}
                  onOptimizationComplete={handleOptimizationComplete}
                  showToast={showToast}
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SystemDashboard showToast={showToast} />
                <AdvancedAnalytics 
                  conversionHistory={conversionHistory}
                  showToast={showToast}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
      
      {/* Performance Debug Info (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded border border-white/20">
          Renders: {renderCount} | Avg: {averageRenderTime.toFixed(2)}ms
        </div>
      )}
    </div>
  );
}

export default App;