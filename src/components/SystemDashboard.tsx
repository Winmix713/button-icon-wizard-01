import React, { useState, useEffect } from 'react';
import { Activity, Cpu, MemoryStick, HardDrive, Wifi, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  uptime: number;
  activeProcesses: number;
  errorRate: number;
  successRate: number;
}

interface SystemDashboardProps {
  showToast: (message: string) => void;
}

const SystemDashboard: React.FC<SystemDashboardProps> = ({ showToast }) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    storage: 0,
    network: 0,
    uptime: 0,
    activeProcesses: 0,
    errorRate: 0,
    successRate: 100
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: number;
  }>>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isMonitoring) {
      interval = setInterval(() => {
        updateMetrics();
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  const updateMetrics = () => {
    const newMetrics: SystemMetrics = {
      cpu: Math.random() * 60 + 20,
      memory: Math.random() * 40 + 30,
      storage: Math.random() * 20 + 60,
      network: Math.random() * 30 + 50,
      uptime: Date.now() - (Date.now() - Math.random() * 86400000),
      activeProcesses: Math.floor(Math.random() * 5) + 1,
      errorRate: Math.random() * 5,
      successRate: 95 + Math.random() * 5
    };

    setMetrics(newMetrics);

    // Check for alerts
    checkForAlerts(newMetrics);
  };

  const checkForAlerts = (metrics: SystemMetrics) => {
    const newAlerts = [];

    if (metrics.cpu > 80) {
      newAlerts.push({
        id: `cpu-${Date.now()}`,
        type: 'warning' as const,
        message: 'Magas CPU használat észlelve',
        timestamp: Date.now()
      });
    }

    if (metrics.memory > 85) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'error' as const,
        message: 'Kritikus memória használat',
        timestamp: Date.now()
      });
    }

    if (metrics.errorRate > 10) {
      newAlerts.push({
        id: `error-${Date.now()}`,
        type: 'warning' as const,
        message: 'Magas hibaarány észlelve',
        timestamp: Date.now()
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]);
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}ó ${minutes % 60}p`;
    if (minutes > 0) return `${minutes}p ${seconds % 60}mp`;
    return `${seconds}mp`;
  };

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-rose-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return CheckCircle;
      default: return Activity;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-rose-400 bg-rose-500/20 border-rose-400/30';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'info': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  return (
    <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-white/90" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">Rendszer Dashboard</h3>
        </div>
        
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
            isMonitoring 
              ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30'
              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'}`}></div>
          {isMonitoring ? 'Monitorozás aktív' : 'Monitorozás indítása'}
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
          <Cpu className="w-6 h-6 text-blue-400 mx-auto mb-2" strokeWidth={1.5} />
          <div className={`text-lg font-semibold ${getMetricColor(metrics.cpu, { warning: 70, critical: 85 })}`}>
            {Math.round(metrics.cpu)}%
          </div>
          <div className="text-xs text-white/60">CPU</div>
        </div>
        
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
          <MemoryStick className="w-6 h-6 text-purple-400 mx-auto mb-2" strokeWidth={1.5} />
          <div className={`text-lg font-semibold ${getMetricColor(metrics.memory, { warning: 75, critical: 90 })}`}>
            {Math.round(metrics.memory)}%
          </div>
          <div className="text-xs text-white/60">Memória</div>
        </div>
        
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
          <HardDrive className="w-6 h-6 text-orange-400 mx-auto mb-2" strokeWidth={1.5} />
          <div className={`text-lg font-semibold ${getMetricColor(metrics.storage, { warning: 80, critical: 95 })}`}>
            {Math.round(metrics.storage)}%
          </div>
          <div className="text-xs text-white/60">Tárhely</div>
        </div>
        
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
          <Wifi className="w-6 h-6 text-emerald-400 mx-auto mb-2" strokeWidth={1.5} />
          <div className={`text-lg font-semibold ${getMetricColor(100 - metrics.network, { warning: 30, critical: 50 })}`}>
            {Math.round(metrics.network)}ms
          </div>
          <div className="text-xs text-white/60">Hálózat</div>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <h4 className="text-sm font-semibold text-white/80 mb-3">Rendszer Állapot</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Üzemidő</span>
              <span className="text-sm text-white/90">{formatUptime(metrics.uptime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Aktív folyamatok</span>
              <span className="text-sm text-white/90">{metrics.activeProcesses}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Sikerességi arány</span>
              <span className="text-sm text-emerald-400">{Math.round(metrics.successRate)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Hibaarány</span>
              <span className={`text-sm ${metrics.errorRate > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {Math.round(metrics.errorRate)}%
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <h4 className="text-sm font-semibold text-white/80 mb-3">Teljesítmény Trend</h4>
          <div className="flex items-center justify-center h-20">
            <TrendingUp className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
            <div className="ml-3 text-center">
              <div className="text-lg font-semibold text-emerald-400">Stabil</div>
              <div className="text-xs text-white/60">Optimális teljesítmény</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <h4 className="text-sm font-semibold text-white/80 mb-3">Rendszer Riasztások</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {alerts.map((alert) => {
              const AlertIcon = getAlertIcon(alert.type);
              return (
                <div key={alert.id} className={`flex items-start gap-3 p-2 rounded-lg border ${getAlertColor(alert.type)}`}>
                  <AlertIcon className="w-4 h-4 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{alert.message}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString('hu-HU')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemDashboard;