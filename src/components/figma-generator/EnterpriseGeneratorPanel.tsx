import React, { useState, useCallback } from 'react';
import { FigmaApiResponse } from '@/types/figma';
import { EnterpriseCodeGenerator, EnterpriseGenerationConfig, GenerationResult } from '@/services/enterprise-code-generator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Zap, 
  Settings, 
  Rocket, 
  Target, 
  Shield, 
  Gauge, 
  Code2, 
  Package, 
  FileText, 
  TestTube,
  BookOpen,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Layers,
  Cpu,
  MemoryStick,
  Timer,
  Sparkles
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface EnterpriseGeneratorPanelProps {
  figmaData: FigmaApiResponse;
  fileKey: string;
}

export function EnterpriseGeneratorPanel({ figmaData, fileKey }: EnterpriseGeneratorPanelProps) {
  const [config, setConfig] = useState<EnterpriseGenerationConfig>({
    optimization: {
      enableCSSMinification: true,
      enableTreeShaking: true,
      enableComponentDeduplication: true,
      enableAssetOptimization: true,
      enableLazyLoading: true,
      maxBundleSize: 500, // KB
      targetPerformanceScore: 90
    },
    framework: 'react',
    styling: 'tailwind',
    typescript: true,
    componentArchitecture: 'atomic',
    cssArchitecture: 'bem',
    enableDesignSystem: true,
    enableComponentLibrary: true,
    enableThemeSupport: true,
    enableI18n: false,
    enableTesting: true,
    enableStorybook: true,
    enableDocumentation: true,
    enforceAccessibility: true,
    enforcePerformance: true,
    enforceCodeStandards: true,
    maxComponentsPerBundle: 20,
    enableCodeSplitting: true,
    enableTreeShaking: true,
    enableLazyLoading: true
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState('config');

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentPhase('Initializing Enterprise Pipeline...');

    try {
      const generator = new EnterpriseCodeGenerator(config);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Phase updates
      const phases = [
        'Analyzing Design System...',
        'Generating Components...',
        'Optimizing Performance...',
        'Creating Design System...',
        'Generating Documentation...',
        'Creating Tests...',
        'Building Storybook...',
        'Quality Analysis...',
        'Finalizing Output...'
      ];

      let phaseIndex = 0;
      const phaseInterval = setInterval(() => {
        if (phaseIndex < phases.length) {
          setCurrentPhase(phases[phaseIndex]);
          phaseIndex++;
        } else {
          clearInterval(phaseInterval);
        }
      }, 1000);

      const generationResult = await generator.generateEnterprise(figmaData);
      
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
      setGenerationProgress(100);
      setCurrentPhase('Generation Complete!');
      setResult(generationResult);
      setActiveTab('results');
      
    } catch (error) {
      console.error('Enterprise generation error:', error);
      setCurrentPhase('Generation Failed');
    } finally {
      setIsGenerating(false);
    }
  }, [config, figmaData]);

  const updateConfig = (updates: Partial<EnterpriseGenerationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const downloadAll = () => {
    if (!result) return;
    
    // Create and download a comprehensive package
    const files = [
      ...result.components.map(comp => ({
        name: `${comp.name}.tsx`,
        content: comp.jsx
      })),
      ...result.components.map(comp => ({
        name: `${comp.name}.css`,
        content: comp.css
      })),
      { name: 'design-tokens.css', content: result.designSystem.tokens },
      { name: 'README.md', content: result.documentation.readme },
      { name: 'package.json', content: generatePackageJson() }
    ];

    files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const generatePackageJson = () => {
    return JSON.stringify({
      name: "figma-generated-components",
      version: "1.0.0",
      description: "Enterprise-grade components generated from Figma",
      main: "index.js",
      scripts: {
        "dev": "vite",
        "build": "vite build",
        "test": "vitest",
        "storybook": "storybook dev -p 6006"
      },
      dependencies: {
        "react": "^18.0.0",
        "react-dom": "^18.0.0"
      },
      devDependencies: {
        "@storybook/react": "^7.0.0",
        "vitest": "^1.0.0",
        "vite": "^5.0.0"
      }
    }, null, 2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Rocket className="w-6 h-6 text-blue-600" />
            <span>Enterprise Code Generator</span>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </CardTitle>
          <p className="text-gray-600">
            Generate production-ready, enterprise-grade components with advanced optimization, 
            comprehensive testing, and complete documentation.
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Generation</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Results</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Framework & Architecture */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code2 className="w-5 h-5" />
                  <span>Framework & Architecture</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Framework</Label>
                    <Select value={config.framework} onValueChange={(value: any) => updateConfig({ framework: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="react">React</SelectItem>
                        <SelectItem value="vue">Vue.js</SelectItem>
                        <SelectItem value="angular">Angular</SelectItem>
                        <SelectItem value="svelte">Svelte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>CSS Framework</Label>
                    <Select value={config.styling} onValueChange={(value: any) => updateConfig({ styling: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                        <SelectItem value="css-modules">CSS Modules</SelectItem>
                        <SelectItem value="styled-components">Styled Components</SelectItem>
                        <SelectItem value="emotion">Emotion</SelectItem>
                        <SelectItem value="vanilla-extract">Vanilla Extract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Component Architecture</Label>
                    <Select value={config.componentArchitecture} onValueChange={(value: any) => updateConfig({ componentArchitecture: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="atomic">Atomic Design</SelectItem>
                        <SelectItem value="feature-based">Feature-Based</SelectItem>
                        <SelectItem value="domain-driven">Domain-Driven</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>CSS Architecture</Label>
                    <Select value={config.cssArchitecture} onValueChange={(value: any) => updateConfig({ cssArchitecture: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bem">BEM</SelectItem>
                        <SelectItem value="smacss">SMACSS</SelectItem>
                        <SelectItem value="itcss">ITCSS</SelectItem>
                        <SelectItem value="cube-css">CUBE CSS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="typescript"
                      checked={config.typescript}
                      onCheckedChange={(checked) => updateConfig({ typescript: !!checked })}
                    />
                    <Label htmlFor="typescript">TypeScript Support</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gauge className="w-5 h-5" />
                  <span>Performance Optimization</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Bundle Size (KB)</Label>
                  <Input
                    type="number"
                    value={config.optimization.maxBundleSize}
                    onChange={(e) => updateConfig({
                      optimization: {
                        ...config.optimization,
                        maxBundleSize: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Performance Score</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={config.optimization.targetPerformanceScore}
                    onChange={(e) => updateConfig({
                      optimization: {
                        ...config.optimization,
                        targetPerformanceScore: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="cssMinification"
                      checked={config.optimization.enableCSSMinification}
                      onCheckedChange={(checked) => updateConfig({
                        optimization: {
                          ...config.optimization,
                          enableCSSMinification: !!checked
                        }
                      })}
                    />
                    <Label htmlFor="cssMinification">CSS Minification</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="treeShaking"
                      checked={config.optimization.enableTreeShaking}
                      onCheckedChange={(checked) => updateConfig({
                        optimization: {
                          ...config.optimization,
                          enableTreeShaking: !!checked
                        }
                      })}
                    />
                    <Label htmlFor="treeShaking">Tree Shaking</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="componentDeduplication"
                      checked={config.optimization.enableComponentDeduplication}
                      onCheckedChange={(checked) => updateConfig({
                        optimization: {
                          ...config.optimization,
                          enableComponentDeduplication: !!checked
                        }
                      })}
                    />
                    <Label htmlFor="componentDeduplication">Component Deduplication</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="lazyLoading"
                      checked={config.optimization.enableLazyLoading}
                      onCheckedChange={(checked) => updateConfig({
                        optimization: {
                          ...config.optimization,
                          enableLazyLoading: !!checked
                        }
                      })}
                    />
                    <Label htmlFor="lazyLoading">Lazy Loading</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Enterprise Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="designSystem"
                    checked={config.enableDesignSystem}
                    onCheckedChange={(checked) => updateConfig({ enableDesignSystem: !!checked })}
                  />
                  <Label htmlFor="designSystem">Design System Generation</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="componentLibrary"
                    checked={config.enableComponentLibrary}
                    onCheckedChange={(checked) => updateConfig({ enableComponentLibrary: !!checked })}
                  />
                  <Label htmlFor="componentLibrary">Component Library</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="themeSupport"
                    checked={config.enableThemeSupport}
                    onCheckedChange={(checked) => updateConfig({ enableThemeSupport: !!checked })}
                  />
                  <Label htmlFor="themeSupport">Theme Support</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="i18n"
                    checked={config.enableI18n}
                    onCheckedChange={(checked) => updateConfig({ enableI18n: !!checked })}
                  />
                  <Label htmlFor="i18n">Internationalization</Label>
                </div>
              </CardContent>
            </Card>

            {/* Quality Assurance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Quality Assurance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="testing"
                    checked={config.enableTesting}
                    onCheckedChange={(checked) => updateConfig({ enableTesting: !!checked })}
                  />
                  <Label htmlFor="testing">Automated Testing</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="storybook"
                    checked={config.enableStorybook}
                    onCheckedChange={(checked) => updateConfig({ enableStorybook: !!checked })}
                  />
                  <Label htmlFor="storybook">Storybook Integration</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="documentation"
                    checked={config.enableDocumentation}
                    onCheckedChange={(checked) => updateConfig({ enableDocumentation: !!checked })}
                  />
                  <Label htmlFor="documentation">Auto Documentation</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="accessibility"
                    checked={config.enforceAccessibility}
                    onCheckedChange={(checked) => updateConfig({ enforceAccessibility: !!checked })}
                  />
                  <Label htmlFor="accessibility">Accessibility Enforcement</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="performance"
                    checked={config.enforcePerformance}
                    onCheckedChange={(checked) => updateConfig({ enforcePerformance: !!checked })}
                  />
                  <Label htmlFor="performance">Performance Enforcement</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="generation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Rocket className="w-5 h-5" />
                <span>Enterprise Generation Pipeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isGenerating && !result && (
                <div className="text-center space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
                    <Rocket className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Ready to Generate Enterprise Code
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Generate production-ready components with advanced optimization, 
                      comprehensive testing, and complete documentation.
                    </p>
                    <Button 
                      onClick={handleGenerate}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Start Enterprise Generation
                    </Button>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-blue-800 font-medium">{currentPhase}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Generation Progress</span>
                      <span>{Math.round(generationProgress)}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <Layers className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-blue-800">Components</div>
                      <div className="text-xs text-blue-600">Generating...</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <TestTube className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-green-800">Tests</div>
                      <div className="text-xs text-green-600">Queued</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-purple-800">Docs</div>
                      <div className="text-xs text-purple-600">Pending</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {result && (
            <>
              {/* Results Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Generation Complete</span>
                    </CardTitle>
                    <Button onClick={downloadAll} className="bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{result.components.length}</div>
                      <div className="text-sm text-blue-800">Components</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{result.quality.testCoverage}%</div>
                      <div className="text-sm text-green-800">Test Coverage</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{result.quality.accessibility}</div>
                      <div className="text-sm text-purple-800">Accessibility</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{Math.round(result.performance.bundleSize)}KB</div>
                      <div className="text-sm text-orange-800">Bundle Size</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Quality Report</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Code Quality</span>
                        <span>{result.quality.codeQuality}%</span>
                      </div>
                      <Progress value={result.quality.codeQuality} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Accessibility</span>
                        <span>{result.quality.accessibility}%</span>
                      </div>
                      <Progress value={result.quality.accessibility} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Performance</span>
                        <span>{result.quality.performance}%</span>
                      </div>
                      <Progress value={result.quality.performance} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Maintainability</span>
                        <span>{result.quality.maintainability}%</span>
                      </div>
                      <Progress value={result.quality.maintainability} className="h-2" />
                    </div>
                  </div>

                  {result.quality.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Issues Found</h4>
                      {result.quality.issues.slice(0, 5).map((issue, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-yellow-800">{issue.message}</div>
                            <div className="text-xs text-yellow-600">{issue.fix}</div>
                          </div>
                          <Badge variant="outline">{issue.category}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generated Files Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Generated Files</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="components">
                    <TabsList>
                      <TabsTrigger value="components">Components</TabsTrigger>
                      <TabsTrigger value="design-system">Design System</TabsTrigger>
                      <TabsTrigger value="documentation">Documentation</TabsTrigger>
                      <TabsTrigger value="tests">Tests</TabsTrigger>
                    </TabsList>

                    <TabsContent value="components" className="space-y-4">
                      {result.components.slice(0, 3).map((component, index) => (
                        <div key={index} className="border rounded-lg">
                          <div className="p-4 border-b bg-gray-50">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{component.name}</h4>
                              <Badge variant="outline">{component.metadata.componentType}</Badge>
                            </div>
                          </div>
                          <div className="max-h-64 overflow-auto">
                            <SyntaxHighlighter
                              language="tsx"
                              style={tomorrow}
                              customStyle={{ margin: 0, borderRadius: 0 }}
                            >
                              {component.jsx.slice(0, 1000) + (component.jsx.length > 1000 ? '...' : '')}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="design-system">
                      <div className="max-h-64 overflow-auto rounded-lg">
                        <SyntaxHighlighter
                          language="css"
                          style={tomorrow}
                          customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                        >
                          {result.designSystem.tokens.slice(0, 1500) + '...'}
                        </SyntaxHighlighter>
                      </div>
                    </TabsContent>

                    <TabsContent value="documentation">
                      <div className="max-h-64 overflow-auto rounded-lg bg-gray-50 p-4">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                          {result.documentation.readme.slice(0, 1000) + '...'}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="tests">
                      <div className="max-h-64 overflow-auto rounded-lg">
                        <SyntaxHighlighter
                          language="typescript"
                          style={tomorrow}
                          customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                        >
                          {Object.values(result.tests.unitTests)[0]?.slice(0, 1000) + '...' || 'No tests generated'}
                        </SyntaxHighlighter>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {result && (
            <>
              {/* Performance Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gauge className="w-5 h-5" />
                    <span>Performance Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-xl">
                      <Cpu className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-blue-900">{Math.round(result.performance.bundleSize)}KB</div>
                      <div className="text-sm text-blue-700">Bundle Size</div>
                      <div className="text-xs text-blue-600 mt-1">
                        Target: {config.optimization.maxBundleSize}KB
                      </div>
                    </div>

                    <div className="text-center p-6 bg-green-50 rounded-xl">
                      <Timer className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-green-900">{result.performance.renderTime}ms</div>
                      <div className="text-sm text-green-700">Render Time</div>
                      <div className="text-xs text-green-600 mt-1">
                        Optimized for 60fps
                      </div>
                    </div>

                    <div className="text-center p-6 bg-purple-50 rounded-xl">
                      <MemoryStick className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-purple-900">{result.performance.memoryUsage}MB</div>
                      <div className="text-sm text-purple-700">Memory Usage</div>
                      <div className="text-xs text-purple-600 mt-1">
                        Runtime footprint
                      </div>
                    </div>
                  </div>

                  {result.performance.recommendations.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Performance Recommendations</h4>
                      <div className="space-y-2">
                        {result.performance.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-800">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Component Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Layers className="w-5 h-5" />
                    <span>Component Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.components.slice(0, 5).map((component, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {component.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{component.name}</div>
                            <div className="text-sm text-gray-600">
                              {component.metadata.componentType} • {component.metadata.complexity}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-sm font-medium">{component.metadata.estimatedAccuracy}%</div>
                            <div className="text-xs text-gray-500">Accuracy</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{component.accessibility.score}%</div>
                            <div className="text-xs text-gray-500">A11y</div>
                          </div>
                          <Badge variant="outline">{component.accessibility.wcagCompliance}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}