import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info, Zap, Shield, Smartphone } from 'lucide-react';
import { GeneratedComponent } from '@/types/figma';
import { cn } from '@/lib/utils';

interface QualityReportProps {
  component: GeneratedComponent;
}

export function QualityReport({ component }: QualityReportProps) {
  const { accessibility, responsive, metadata } = component;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getIssueIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
    }
  };

  const getIssueColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
    }
  };

  return (
    <div className="border-t border-gray-200 p-6 bg-gray-50">
      <h4 className="text-lg font-semibold text-gray-900 mb-6">Minőségi Jelentés</h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Accuracy Score */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className={cn("p-2 rounded-lg", getScoreBg(metadata.estimatedAccuracy))}>
              <Zap className={cn("w-5 h-5", getScoreColor(metadata.estimatedAccuracy))} />
            </div>
            <div>
              <div className="text-sm text-gray-600">Vizuális Pontosság</div>
              <div className={cn("text-xl font-bold", getScoreColor(metadata.estimatedAccuracy))}>
                {metadata.estimatedAccuracy}%
              </div>
            </div>
          </div>
          <Progress value={metadata.estimatedAccuracy} className="h-2" />
        </div>

        {/* Accessibility Score */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className={cn("p-2 rounded-lg", getScoreBg(accessibility.score))}>
              <Shield className={cn("w-5 h-5", getScoreColor(accessibility.score))} />
            </div>
            <div>
              <div className="text-sm text-gray-600">Accessibility</div>
              <div className={cn("text-xl font-bold", getScoreColor(accessibility.score))}>
                {accessibility.score}%
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Progress value={accessibility.score} className="h-2 flex-1 mr-2" />
            <Badge variant={accessibility.wcagCompliance === 'AA' ? 'default' : 'secondary'}>
              WCAG {accessibility.wcagCompliance}
            </Badge>
          </div>
        </div>

        {/* Responsive Design */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className={cn(
              "p-2 rounded-lg",
              responsive.hasResponsiveDesign ? "bg-green-100" : "bg-gray-100"
            )}>
              <Smartphone className={cn(
                "w-5 h-5",
                responsive.hasResponsiveDesign ? "text-green-600" : "text-gray-400"
              )} />
            </div>
            <div>
              <div className="text-sm text-gray-600">Responsive Design</div>
              <div className={cn(
                "text-xl font-bold",
                responsive.hasResponsiveDesign ? "text-green-600" : "text-gray-400"
              )}>
                {responsive.hasResponsiveDesign ? 'Igen' : 'Nem'}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {responsive.hasResponsiveDesign ? 'Automatikus breakpoint támogatás' : 'Fix layout'}
          </div>
        </div>
      </div>

      {/* Accessibility Issues */}
      {accessibility.issues.length > 0 && (
        <div className="mb-6">
          <h5 className="text-md font-semibold text-gray-900 mb-3">Accessibility Problémák</h5>
          <div className="space-y-2">
            {accessibility.issues.map((issue, index) => {
              const IssueIcon = getIssueIcon(issue.type as 'error' | 'warning' | 'info');
              return (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                  <IssueIcon className={cn("w-5 h-5 mt-0.5", getIssueColor(issue.type as 'error' | 'warning' | 'info'))} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{issue.message}</div>
                    <div className="text-sm text-gray-600">Elem: {issue.element}</div>
                    <div className="text-sm text-blue-600 mt-1">Javítás: {issue.fix}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {accessibility.suggestions.length > 0 && (
        <div className="mb-6">
          <h5 className="text-md font-semibold text-gray-900 mb-3">Javaslatok</h5>
          <div className="space-y-2">
            {accessibility.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Component Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Típus</div>
          <div className="font-medium capitalize">{metadata.componentType}</div>
        </div>
        <div>
          <div className="text-gray-600">Komplexitás</div>
          <div className="font-medium capitalize">{metadata.complexity}</div>
        </div>
        <div>
          <div className="text-gray-600">Generálási idő</div>
          <div className="font-medium">{metadata.generationTime}ms</div>
        </div>
        <div>
          <div className="text-gray-600">Függőségek</div>
          <div className="font-medium">{metadata.dependencies.length} db</div>
        </div>
      </div>
    </div>
  );
}