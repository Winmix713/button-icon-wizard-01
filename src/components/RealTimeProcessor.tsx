import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Zap, Activity, Clock, MemoryStick, Cpu } from 'lucide-react';
import { RealTimeProcessor, ProcessingEvent, ProcessingSession } from '../services/realTimeProcessor';
import { FigmaFile } from '../types/figma';

interface RealTimeProcessorProps {
  figmaFile: FigmaFile | null;
  onProcessingComplete: (results: any) => void;
  showToast: (message: string) => void;
}

const RealTimeProcessorComponent: React.FC<RealTimeProcessorProps> = ({
  figmaFile,
  onProcessingComplete,
  showToast
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [session, setSession] = useState<ProcessingSession | null>(null);
  const [events, setEvents] = useState<ProcessingEvent[]>([]);
  const [metrics, setMetrics] = useState({
    nodesPerSecond: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    elapsedTime: 0
  });

  const processorRef = useRef<RealTimeProcessor | null>(null);
  const sessionIdRef = useRef<string>('');
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    processorRef.current = new RealTimeProcessor({
      enableWebSocket: false,
      enableServerSentEvents: false,
      batchSize: 50,
      processingInterval: 100,
      enableProgressiveRendering: true,
      enableIncrementalUpdates: true
    });

    return () => {
      if (sessionIdRef.current) {
        processorRef.current?.stopProcessing(sessionIdRef.current);
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, []);

  const startMetricsCollection = useCallback(() => {
    metricsIntervalRef.current = setInterval(() => {
      const currentSession = processorRef.current?.getSession(sessionIdRef.current);
      if (currentSession && currentSession.status === 'active') {
        const elapsedTime = Date.now() - currentSession.startTime;
        const nodesPerSecond = currentSession.processedNodes / (elapsedTime / 1000);
        
        setMetrics(prev => ({
          ...prev,
          nodesPerSecond: Math.round(nodesPerSecond),
          elapsedTime: Math.round(elapsedTime / 1000),
          memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
          cpuUsage: Math.random() * 30 + 20 // Simulated CPU usage
        }));
      }
    }, 1000);
  }, []);

  const stopMetricsCollection = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
  }, []);

  const handleStart = useCallback(async () => {
    if (!figmaFile || !processorRef.current) {
      showToast('Nincs Figma fájl betöltve');
      return;
    }

    sessionIdRef.current = `session-${Date.now()}`;
    setIsProcessing(true);
    setIsPaused(false);
    setEvents([]);
    
    startMetricsCollection();

    const eventHandler = (event: ProcessingEvent) => {
      setEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
      
      if (event.type === 'complete') {
        setIsProcessing(false);
        stopMetricsCollection();
        showToast('Feldolgozás sikeresen befejezve!');
        onProcessingComplete(event.data);
      } else if (event.type === 'error') {
        setIsProcessing(false);
        stopMetricsCollection();
        showToast('Hiba történt a feldolgozás során');
      }
    };

    try {
      await processorRef.current.startProcessing(figmaFile, sessionIdRef.current, eventHandler);
      
      // Update session state
      const currentSession = processorRef.current.getSession(sessionIdRef.current);
      setSession(currentSession || null);
      
    } catch (error) {
      setIsProcessing(false);
      stopMetricsCollection();
      showToast('Feldolgozás indítása sikertelen');
      console.error('Processing error:', error);
    }
  }, [figmaFile, showToast, onProcessingComplete, startMetricsCollection, stopMetricsCollection]);

  const handlePause = useCallback(() => {
    if (processorRef.current && sessionIdRef.current) {
      if (isPaused) {
        processorRef.current.resumeProcessing(sessionIdRef.current);
        setIsPaused(false);
        startMetricsCollection();
        showToast('Feldolgozás folytatva');
      } else {
        processorRef.current.pauseProcessing(sessionIdRef.current);
        setIsPaused(true);
        stopMetricsCollection();
        showToast('Feldolgozás szüneteltetve');
      }
    }
  }, [isPaused, showToast, startMetricsCollection, stopMetricsCollection]);

  const handleStop = useCallback(() => {
    if (processorRef.current && sessionIdRef.current) {
      processorRef.current.stopProcessing(sessionIdRef.current);
      setIsProcessing(false);
      setIsPaused(false);
      setSession(null);
      stopMetricsCollection();
      showToast('Feldolgozás leállítva');
    }
  }, [showToast, stopMetricsCollection]);

  const formatEventTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('hu-HU');
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'progress': return Activity;
      case 'complete': return Zap;
      case 'error': return Square;
      default: return Activity;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'progress': return 'text-blue-400';
      case 'complete': return 'text-emerald-400';
      case 'error': return 'text-rose-400';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-white/90" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">Valós Idejű Feldolgozó</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {!isProcessing ? (
            <button
              onClick={handleStart}
              disabled={!figmaFile}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 transition px-4 py-2 text-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4" strokeWidth={1.5} />
              Indítás
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/30 transition px-4 py-2 text-sm"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4" strokeWidth={1.5} />
                    Folytatás
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" strokeWidth={1.5} />
                    Szünet
                  </>
                )}
              </button>
              
              <button
                onClick={handleStop}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 hover:bg-rose-500/30 transition px-4 py-2 text-sm"
              >
                <Square className="w-4 h-4" strokeWidth={1.5} />
                Leállítás
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metrics Dashboard */}
      {isProcessing && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
            <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" strokeWidth={1.5} />
            <div className="text-lg font-semibold text-white">{metrics.nodesPerSecond}</div>
            <div className="text-xs text-white/60">node/sec</div>
          </div>
          
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
            <MemoryStick className="w-6 h-6 text-purple-400 mx-auto mb-2" strokeWidth={1.5} />
            <div className="text-lg font-semibold text-white">{Math.round(metrics.memoryUsage)}MB</div>
            <div className="text-xs text-white/60">memória</div>
          </div>
          
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
            <Cpu className="w-6 h-6 text-orange-400 mx-auto mb-2" strokeWidth={1.5} />
            <div className="text-lg font-semibold text-white">{Math.round(metrics.cpuUsage)}%</div>
            <div className="text-xs text-white/60">CPU</div>
          </div>
          
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
            <Clock className="w-6 h-6 text-emerald-400 mx-auto mb-2" strokeWidth={1.5} />
            <div className="text-lg font-semibold text-white">{metrics.elapsedTime}s</div>
            <div className="text-xs text-white/60">eltelt idő</div>
          </div>
        </div>
      )}

      {/* Session Info */}
      {session && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/80">Munkamenet: {session.id}</div>
              <div className="text-xs text-white/60">
                {session.processedNodes} / {session.totalNodes} csomópont feldolgozva
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                session.status === 'active' ? 'bg-emerald-400' :
                session.status === 'paused' ? 'bg-yellow-400' :
                session.status === 'completed' ? 'bg-blue-400' : 'bg-rose-400'
              }`}></div>
              <span className="text-xs text-white/70 capitalize">{session.status}</span>
            </div>
          </div>
          
          {session.totalNodes > 0 && (
            <div className="mt-3">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${(session.processedNodes / session.totalNodes) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event Log */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <h4 className="text-sm font-semibold text-white/80 mb-3">Esemény Napló</h4>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
              <p className="text-sm">Nincs esemény</p>
            </div>
          ) : (
            events.map((event, index) => {
              const EventIcon = getEventIcon(event.type);
              return (
                <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
                  <EventIcon className={`w-4 h-4 mt-0.5 ${getEventColor(event.type)}`} strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80 capitalize">{event.type.replace('_', ' ')}</span>
                      <span className="text-xs text-white/50">{formatEventTime(event.timestamp)}</span>
                    </div>
                    {event.data && (
                      <div className="text-xs text-white/60 mt-1">
                        {typeof event.data === 'object' ? JSON.stringify(event.data, null, 2) : event.data}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-4 flex items-center justify-between text-xs text-white/60">
        <div>
          {isProcessing ? (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              Aktív feldolgozás
            </span>
          ) : (
            <span>Készen áll</span>
          )}
        </div>
        <div>
          Események: {events.length}
        </div>
      </div>
    </div>
  );
};

export default RealTimeProcessorComponent;