import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Loader2, Database, Code, Layers } from 'lucide-react';
import { ProcessingPhase } from '@/types/figma';
import { cn } from '@/lib/utils';

interface ProcessingPipelineProps {
  phases: ProcessingPhase[];
}

export function ProcessingPipeline({ phases }: ProcessingPipelineProps) {
  const getPhaseIcon = (phaseId: number) => {
    switch (phaseId) {
      case 1: return Database;
      case 2: return Code;
      case 3: return Layers;
      default: return Database;
    }
  };

  const getStatusIcon = (status: ProcessingPhase['status']) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'error': return AlertCircle;
      case 'processing': return Loader2;
      default: return null;
    }
  };

  const getStatusColor = (status: ProcessingPhase['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'processing': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  };

  const getProgressColor = (status: ProcessingPhase['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      case 'processing': return 'bg-blue-600';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          3-Fázisú Feldolgozási Pipeline
        </h2>
        <p className="text-gray-600">
          Fejlett AI rendszer a Figma designok teljes körű feldolgozásához
        </p>
      </div>

      <div className="space-y-6">
        {phases.map((phase, index) => {
          const PhaseIcon = getPhaseIcon(phase.id);
          const StatusIcon = getStatusIcon(phase.status);
          
          return (
            <div key={phase.id} className="relative">
              <div className={cn(
                "flex items-center space-x-4 p-6 rounded-xl border-2 transition-all duration-300",
                phase.status === 'processing' && "border-blue-200 bg-blue-50",
                phase.status === 'completed' && "border-green-200 bg-green-50",
                phase.status === 'error' && "border-red-200 bg-red-50",
                phase.status === 'pending' && "border-gray-200 bg-gray-50"
              )}>
                {/* Phase Icon */}
                <div className={cn(
                  "p-3 rounded-xl",
                  phase.status === 'processing' && "bg-blue-100",
                  phase.status === 'completed' && "bg-green-100",
                  phase.status === 'error' && "bg-red-100",
                  phase.status === 'pending' && "bg-gray-100"
                )}>
                  <PhaseIcon className={cn(
                    "w-6 h-6",
                    getStatusColor(phase.status)
                  )} />
                </div>

                {/* Phase Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Fázis {phase.id}: {phase.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {StatusIcon && (
                        <StatusIcon className={cn(
                          "w-5 h-5",
                          getStatusColor(phase.status),
                          phase.status === 'processing' && "animate-spin"
                        )} />
                      )}
                      <span className={cn(
                        "text-sm font-medium capitalize",
                        getStatusColor(phase.status)
                      )}>
                        {phase.status === 'pending' && 'Várakozás'}
                        {phase.status === 'processing' && 'Feldolgozás'}
                        {phase.status === 'completed' && 'Befejezve'}
                        {phase.status === 'error' && 'Hiba'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Előrehaladás</span>
                      <span className="font-medium">{phase.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          getProgressColor(phase.status)
                        )}
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {phase.status === 'error' && phase.error && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{phase.error}</p>
                    </div>
                  )}

                  {/* Phase Details */}
                  <div className="mt-3 text-sm text-gray-600">
                    {phase.id === 1 && "Figma API-n keresztül minden design tulajdonság kinyerése"}
                    {phase.id === 2 && "Plugin által generált ~80% pontosságú kód javítása"}
                    {phase.id === 3 && "4000+ soros CSS optimalizálása és finomhangolása"}
                  </div>
                </div>
              </div>

              {/* Connection Line */}
              {index < phases.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="w-px h-6 bg-gray-300"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Progress */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Összesített előrehaladás</span>
          <span className="text-sm font-bold text-gray-900">
            {Math.round(phases.reduce((acc, phase) => acc + phase.progress, 0) / phases.length)}%
          </span>
        </div>
        <Progress 
          value={phases.reduce((acc, phase) => acc + phase.progress, 0) / phases.length}
          className="h-3"
        />
      </div>
    </div>
  );
}