import React, { useState } from 'react';
import { FigmaApiResponse } from '@/types/figma';
import { DesignSystemExtractor, DesignTokens } from '@/services/design-system-extractor';
import { DesignSystemExporter, ExportOptions } from '@/services/design-system-exporter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Palette, Download, Copy, Eye, Settings, FileCode, Layers, Type, Space as Spacing, Zap, Package, Sparkles } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { copyToClipboard, downloadFile } from '@/lib/utils';

interface DesignSystemPanelProps {
  figmaData: FigmaApiResponse;
  fileKey: string;
}

export function DesignSystemPanel({ figmaData, fileKey }: DesignSystemPanelProps) {
  const [designTokens, setDesignTokens] = useState<DesignTokens | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'css',
    includeComments: true,
    useCustomProperties: true,
    prefix: '',
  });
  const [activeTab, setActiveTab] = useState('colors');
  const [previewCode, setPreviewCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleExtractTokens = async () => {
    setIsExtracting(true);
    
    try {
      const extractor = new DesignSystemExtractor(figmaData);
      const tokens = extractor.extractDesignTokens();
      setDesignTokens(tokens);
      
      // Generate preview
      const exporter = new DesignSystemExporter(tokens, exportOptions);
      const files = exporter.export();
      if (files.length > 0) {
        setPreviewCode(files[0].content);
      }
    } catch (error) {
      console.error('Design token extraction error:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExport = () => {
    if (!designTokens) return;
    
    const exporter = new DesignSystemExporter(designTokens, exportOptions);
    const files = exporter.export();
    
    files.forEach(file => {
      downloadFile(file.content, file.filename);
    });
  };

  const handleCopy = async () => {
    if (!previewCode) return;
    
    try {
      await copyToClipboard(previewCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const updatePreview = (newOptions: Partial<ExportOptions>) => {
    const updatedOptions = { ...exportOptions, ...newOptions };
    setExportOptions(updatedOptions);
    
    if (designTokens) {
      const exporter = new DesignSystemExporter(designTokens, updatedOptions);
      const files = exporter.export();
      if (files.length > 0) {
        setPreviewCode(files[0].content);
      }
    }
  };

  const renderColorScale = (scale: any, title: string) => (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <div className="grid grid-cols-11 gap-2">
        {Object.entries(scale).map(([key, color]) => (
          <div key={key} className="text-center">
            <div 
              className="w-full h-12 rounded-lg border border-gray-200 mb-1"
              style={{ backgroundColor: color as string }}
              title={`${key}: ${color}`}
            />
            <div className="text-xs text-gray-600">{key}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTypographyStyles = (styles: any) => (
    <div className="space-y-4">
      {Object.entries(styles).map(([key, style]: [string, any]) => (
        <div key={key} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{key}</h4>
            <Badge variant="outline">{style.fontSize}</Badge>
          </div>
          <div 
            className="text-gray-700"
            style={{
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              lineHeight: style.lineHeight,
              letterSpacing: style.letterSpacing,
            }}
          >
            The quick brown fox jumps over the lazy dog
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {style.fontFamily} • {style.fontWeight} • {style.lineHeight}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSpacingScale = (spacing: any) => (
    <div className="space-y-4">
      {Object.entries(spacing).map(([key, value]: [string, any]) => (
        <div key={key} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
          <div className="w-16 text-sm font-medium text-gray-700">{key}</div>
          <div 
            className="bg-blue-200 rounded"
            style={{ width: value, height: '20px' }}
          />
          <div className="text-sm text-gray-600">{value}</div>
        </div>
      ))}
    </div>
  );

  const renderShadows = (shadows: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(shadows).map(([key, shadow]: [string, any]) => (
        <div key={key} className="space-y-2">
          <div className="text-sm font-medium text-gray-700">{key}</div>
          <div 
            className="w-full h-20 bg-white rounded-lg"
            style={{ boxShadow: shadow }}
          />
          <div className="text-xs text-gray-500 font-mono">{shadow}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Design System Export</span>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-4">
                Automatikus design token library generálás a Figma fájlból. 
                Teljes színpaletta, typography, spacing és egyéb design elemek kinyerése.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Palette className="w-4 h-4" />
                  <span>Színek</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Type className="w-4 h-4" />
                  <span>Typography</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Spacing className="w-4 h-4" />
                  <span>Spacing</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Layers className="w-4 h-4" />
                  <span>Shadows</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleExtractTokens}
              disabled={isExtracting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isExtracting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Kinyerés...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Design Tokenek Kinyerése</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Design Tokens Display */}
      {designTokens && (
        <div className="space-y-6">
          {/* Export Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Export Beállítások</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Export Formátum</Label>
                  <Select 
                    value={exportOptions.format} 
                    onValueChange={(value: any) => updatePreview({ format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="css">CSS Custom Properties</SelectItem>
                      <SelectItem value="scss">SCSS Variables</SelectItem>
                      <SelectItem value="js">JavaScript/TypeScript</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="tailwind">Tailwind Config</SelectItem>
                      <SelectItem value="figma-tokens">Figma Tokens</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prefix (opcionális)</Label>
                  <Input
                    placeholder="ds-"
                    value={exportOptions.prefix || ''}
                    onChange={(e) => updatePreview({ prefix: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Opciók</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="comments"
                        checked={exportOptions.includeComments}
                        onCheckedChange={(checked) => updatePreview({ includeComments: !!checked })}
                      />
                      <Label htmlFor="comments" className="text-sm">Kommentek</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="custom-props"
                        checked={exportOptions.useCustomProperties}
                        onCheckedChange={(checked) => updatePreview({ useCustomProperties: !!checked })}
                      />
                      <Label htmlFor="custom-props" className="text-sm">CSS Custom Properties</Label>
                    </div>
                  </div>
                </div>

                <div className="flex items-end space-x-2">
                  <Button onClick={handleExport} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" onClick={handleCopy}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Design Tokens Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Design Tokens Előnézet</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="colors">Színek</TabsTrigger>
                  <TabsTrigger value="typography">Typography</TabsTrigger>
                  <TabsTrigger value="spacing">Spacing</TabsTrigger>
                  <TabsTrigger value="shadows">Shadows</TabsTrigger>
                  <TabsTrigger value="radius">Border Radius</TabsTrigger>
                  <TabsTrigger value="code">Kód</TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-6 mt-6">
                  {renderColorScale(designTokens.colors.primary, 'Primary Colors')}
                  {renderColorScale(designTokens.colors.secondary, 'Secondary Colors')}
                  {renderColorScale(designTokens.colors.neutral, 'Neutral Colors')}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderColorScale(designTokens.colors.semantic.success, 'Success')}
                    {renderColorScale(designTokens.colors.semantic.error, 'Error')}
                  </div>
                </TabsContent>

                <TabsContent value="typography" className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Font Families</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(designTokens.typography.fontFamilies).map(([key, family]) => (
                          <div key={key} className="p-3 border border-gray-200 rounded-lg">
                            <div className="text-sm font-medium text-gray-700 mb-1">{key}</div>
                            <div style={{ fontFamily: family as string }} className="text-lg">
                              {family as string}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Text Styles</h4>
                      {renderTypographyStyles(designTokens.typography.textStyles)}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="spacing" className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Semantic Spacing</h4>
                      {renderSpacingScale(designTokens.spacing.semantic)}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="shadows" className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Elevation Shadows</h4>
                      {renderShadows(designTokens.shadows.elevation)}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="radius" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(designTokens.borderRadius).map(([key, value]) => (
                      <div key={key} className="text-center space-y-2">
                        <div className="text-sm font-medium text-gray-700">{key}</div>
                        <div 
                          className="w-full h-16 bg-blue-100 border-2 border-blue-300"
                          style={{ borderRadius: value as string }}
                        />
                        <div className="text-xs text-gray-500">{value as string}</div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="code" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Generált Kód Előnézet</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{exportOptions.format.toUpperCase()}</Badge>
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                          <Copy className="w-4 h-4 mr-1" />
                          {copied ? 'Másolva!' : 'Másolás'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-auto rounded-lg">
                      <SyntaxHighlighter
                        language={exportOptions.format === 'js' ? 'javascript' : exportOptions.format === 'scss' ? 'scss' : 'css'}
                        style={tomorrow}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.5rem',
                        }}
                        showLineNumbers
                      >
                        {previewCode}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Design System Statisztikák</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(designTokens.colors.primary).length + 
                     Object.keys(designTokens.colors.secondary).length + 
                     Object.keys(designTokens.colors.neutral).length}
                  </div>
                  <div className="text-sm text-blue-800">Színek</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.keys(designTokens.typography.textStyles).length}
                  </div>
                  <div className="text-sm text-green-800">Text Styles</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(designTokens.spacing.semantic).length}
                  </div>
                  <div className="text-sm text-purple-800">Spacing Values</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Object.keys(designTokens.shadows.elevation).length}
                  </div>
                  <div className="text-sm text-orange-800">Shadow Levels</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}