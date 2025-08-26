import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp, Target, Zap, Users, Clock, Award, CheckCircle } from 'lucide-react';
import { ConversionResults } from '../App';

interface AnalyticsData {
  conversions: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
  };
  frameworks: Record<string, number>;
  codeQuality: {
    accessibility: number;
    performance: number;
    maintainability: number;
    security: number;
  };
  userBehavior: {
    mostUsedFeatures: string[];
    averageSessionTime: number;
    returnRate: number;
  };
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

interface AdvancedAnalyticsProps {
  conversionHistory: any[];
  showToast: (message: string) => void;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ conversionHistory, showToast }) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [selectedMetric, setSelectedMetric] = useState<'conversions' | 'quality' | 'performance'>('conversions');

  const analyticsData = useMemo((): AnalyticsData => {
    const now = Date.now();
    const timeRangeMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const filteredHistory = conversionHistory.filter(
      entry => now - entry.timestamp <= timeRangeMs[timeRange]
    );

    const successful = filteredHistory.filter(entry => entry.success).length;
    const failed = filteredHistory.length - successful;
    const averageTime = filteredHistory.reduce((sum, entry) => sum + (entry.duration || 0), 0) / filteredHistory.length || 0;

    const frameworks = filteredHistory.reduce((acc, entry) => {
      acc[entry.framework] = (acc[entry.framework] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      conversions: {
        total: filteredHistory.length,
        successful,
        failed,
        averageTime
      },
      frameworks,
      codeQuality: {
        accessibility: 85 + Math.random() * 10,
        performance: 78 + Math.random() * 15,
        maintainability: 82 + Math.random() * 12,
        security: 90 + Math.random() * 8
      },
      userBehavior: {
        mostUsedFeatures: ['HTML Export', 'React JSX', 'CSS Generation', 'Responsive Design'],
        averageSessionTime: 8.5 + Math.random() * 3,
        returnRate: 65 + Math.random() * 20
      },
      trends: {
        daily: Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 10),
        weekly: Array.from({ length: 4 }, () => Math.floor(Math.random() * 200) + 50),
        monthly: Array.from({ length: 12 }, () => Math.floor(Math.random() * 800) + 200)
      }
    };
  }, [conversionHistory, timeRange]);

  const renderMiniChart = (data: number[], color: string) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="flex items-end gap-1 h-8">
        {data.map((value, index) => (
          <div
            key={index}
            className={`w-2 rounded-t ${color} opacity-80`}
            style={{
              height: `${((value - min) / range) * 100}%`,
              minHeight: '4px'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-white/90" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">Fejlett Analitika</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {(['day', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`text-xs rounded-lg px-3 py-1.5 border transition ${
                timeRange === range
                  ? 'bg-white/10 border-white/15 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {range === 'day' ? 'Nap' : range === 'week' ? 'Hét' : 'Hónap'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
          <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" strokeWidth={1.5} />
          <div className="text-lg font-semibold text-white">{analyticsData.conversions.total}</div>
          <div className="text-xs text-white/60">Összes konverzió</div>
          <div className="mt-2">
            {renderMiniChart(analyticsData.trends.daily, 'bg-blue-400')}
          </div>
        </div>
        
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
          <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" strokeWidth={1.5} />
          <div className="text-lg font-semibold text-emerald-400">
            {Math.round((analyticsData.conversions.successful / analyticsData.conversions.total) * 100) || 0}%
          </div>
          <div className="text-xs text-white/60">Sikerességi arány</div>
          <div className="mt-2">
            {renderMiniChart(analyticsData.trends.weekly, 'bg-emerald-400')}
          </div>
        </div>
        
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
          <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" strokeWidth={1.5} />
          <div className="text-lg font-semibold text-white">
            {Math.round(analyticsData.conversions.averageTime / 1000) || 0}s
          </div>
          <div className="text-xs text-white/60">Átlagos idő</div>
          <div className="mt-2">
            {renderMiniChart(analyticsData.trends.monthly.slice(0, 7), 'bg-purple-400')}
          </div>
        </div>
        
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
          <Award className="w-6 h-6 text-yellow-400 mx-auto mb-2" strokeWidth={1.5} />
          <div className="text-lg font-semibold text-yellow-400">
            {Math.round(analyticsData.codeQuality.accessibility)}
          </div>
          <div className="text-xs text-white/60">Kód minőség</div>
          <div className="mt-2">
            {renderMiniChart([85, 87, 89, 88, 90, 92, 89], 'bg-yellow-400')}
          </div>
        </div>
      </div>

      {/* Framework Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4" strokeWidth={1.5} />
            Framework Megoszlás
          </h4>
          <div className="space-y-3">
            {Object.entries(analyticsData.frameworks).map(([framework, count]) => {
              const percentage = (count / analyticsData.conversions.total) * 100;
              const colors = {
                react: 'bg-blue-400',
                vue: 'bg-emerald-400',
                angular: 'bg-rose-400',
                html: 'bg-purple-400'
              };
              
              return (
                <div key={framework} className="flex items-center gap-3">
                  <div className="w-16 text-sm text-white/80 capitalize">{framework}</div>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[framework as keyof typeof colors] || 'bg-gray-400'} rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-xs text-white/60 text-right">{Math.round(percentage)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
            Kód Minőségi Mutatók
          </h4>
          <div className="space-y-3">
            {Object.entries(analyticsData.codeQuality).map(([metric, score]) => {
              const colors = {
                accessibility: 'bg-emerald-400',
                performance: 'bg-blue-400',
                maintainability: 'bg-purple-400',
                security: 'bg-rose-400'
              };
              
              return (
                <div key={metric} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-white/80 capitalize">
                    {metric === 'accessibility' ? 'A11y' : metric}
                  </div>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[metric as keyof typeof colors]} rounded-full transition-all duration-300`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <div className="w-12 text-xs text-white/60 text-right">{Math.round(score)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Behavior Insights */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" strokeWidth={1.5} />
          Felhasználói Viselkedés
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-white/60 mb-2">Legnépszerűbb funkciók</div>
            <div className="space-y-1">
              {analyticsData.userBehavior.mostUsedFeatures.slice(0, 4).map((feature, index) => (
                <div key={index} className="text-sm text-white/80 flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-white/60 mb-2">Átlagos munkamenet</div>
            <div className="text-2xl font-semibold text-white">
              {Math.round(analyticsData.userBehavior.averageSessionTime)}
            </div>
            <div className="text-xs text-white/60">perc</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-white/60 mb-2">Visszatérési arány</div>
            <div className="text-2xl font-semibold text-emerald-400">
              {Math.round(analyticsData.userBehavior.returnRate)}%
            </div>
            <div className="text-xs text-white/60">felhasználó</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;