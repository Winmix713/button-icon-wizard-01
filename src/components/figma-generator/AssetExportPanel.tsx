import React, { useState } from 'react';
import { FigmaApiResponse } from '@/types/figma';
import { useFigmaApi } from '@/hooks/useFigmaApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Image, FileImage, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssetExportPanelProps {
  figmaData: FigmaApiResponse;
  fileKey: string;
}

interface ExportableNode {
  id: string;
  name: string;
  type: string;
  selected: boolean;
}

interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  scale: number;
}

export function AssetExportPanel({ figmaData, fileKey }: AssetExportPanelProps) {
  const { toast } = useToast();
  const { getImages, isLoading } = useFigmaApi();
  
  const [exportableNodes, setExportableNodes] = useState<ExportableNode[]>([]);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    scale: 1,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResults, setExportResults] = useState<Array<{ nodeId: string; success: boolean; url?: string; error?: string }>>([]);

  React.useEffect(() => {
    // Collect exportable nodes from Figma data
    const collectExportableNodes = (node: any): ExportableNode[] => {
      const exportable: ExportableNode[] = [];
      
      // Include frames, components, and graphics that are exportable
      if (['FRAME', 'COMPONENT', 'INSTANCE', 'RECTANGLE', 'ELLIPSE', 'GROUP', 'VECTOR'].includes(node.type)) {
        exportable.push({
          id: node.id,
          name: node.name || 'Unnamed',
          type: node.type,
          selected: false,
        });
      }

      // Recursively collect from children
      if (node.children) {
        node.children.forEach((child: any) => {
          exportable.push(...collectExportableNodes(child));
        });
      }

      return exportable;
    };

    if (figmaData?.document) {
      const nodes = collectExportableNodes(figmaData.document);
      setExportableNodes(nodes);
    }
  }, [figmaData]);

  const toggleNodeSelection = (nodeId: string) => {
    setExportableNodes(prev => 
      prev.map(node => 
        node.id === nodeId ? { ...node, selected: !node.selected } : node
      )
    );
  };

  const selectAllNodes = () => {
    setExportableNodes(prev => prev.map(node => ({ ...node, selected: true })));
  };

  const deselectAllNodes = () => {
    setExportableNodes(prev => prev.map(node => ({ ...node, selected: false })));
  };

  const handleExport = async () => {
    const selectedNodes = exportableNodes.filter(node => node.selected);
    
    if (selectedNodes.length === 0) {
      toast({
        title: "Nincs kiválasztott elem",
        description: "Kérlek válassz ki legalább egy exportálható elemet.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportResults([]);

    try {
      const nodeIds = selectedNodes.map(node => node.id);
      
      // Export images in batches to avoid rate limiting
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < nodeIds.length; i += batchSize) {
        batches.push(nodeIds.slice(i, i + batchSize));
      }

      const allResults: Array<{ nodeId: string; success: boolean; url?: string; error?: string }> = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        try {
          const imagesMap = await getImages(fileKey, batch, {
            format: exportOptions.format,
            scale: exportOptions.scale,
          });

          // Process batch results
          for (const nodeId of batch) {
            if (imagesMap && imagesMap[nodeId]) {
              allResults.push({
                nodeId,
                success: true,
                url: imagesMap[nodeId],
              });

              // Download the image
              try {
                const response = await fetch(imagesMap[nodeId]);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                const nodeName = selectedNodes.find(n => n.id === nodeId)?.name || nodeId;
                a.download = `${nodeName}.${exportOptions.format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (downloadError) {
                console.error('Download error:', downloadError);
              }
            } else {
              allResults.push({
                nodeId,
                success: false,
                error: 'Nem sikerült generálni a képet',
              });
            }
          }

          setExportProgress(((i + 1) / batches.length) * 100);
          setExportResults([...allResults]);

          // Small delay between batches to avoid rate limiting
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (batchError) {
          console.error('Batch export error:', batchError);
          
          // Mark all nodes in this batch as failed
          for (const nodeId of batch) {
            allResults.push({
              nodeId,
              success: false,
              error: batchError instanceof Error ? batchError.message : 'Ismeretlen hiba',
            });
          }
        }
      }

      const successCount = allResults.filter(r => r.success).length;
      const errorCount = allResults.length - successCount;

      toast({
        title: "Export befejezve",
        description: `${successCount} kép sikeresen exportálva${errorCount > 0 ? `, ${errorCount} hiba` : ''}.`,
        variant: successCount > 0 ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export hiba",
        description: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const selectedCount = exportableNodes.filter(node => node.selected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Image className="w-5 h-5" />
            <span>Asset Export</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Exportálj képeket és grafikai elemeket a Figma fájlból különböző formátumokban és méretekben.
            </p>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Formátum</Label>
                <Select 
                  value={exportOptions.format} 
                  onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG (transzparens háttér)</SelectItem>
                    <SelectItem value="jpg">JPG (kisebb fájlméret)</SelectItem>
                    <SelectItem value="svg">SVG (vektorgrafika)</SelectItem>
                    <SelectItem value="pdf">PDF (dokumentum)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Méretezés</Label>
                <Select 
                  value={exportOptions.scale.toString()} 
                  onValueChange={(value) => setExportOptions(prev => ({ ...prev, scale: parseFloat(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x (fél méret)</SelectItem>
                    <SelectItem value="1">1x (eredeti méret)</SelectItem>
                    <SelectItem value="2">2x (dupla méret)</SelectItem>
                    <SelectItem value="3">3x (tripla méret)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleExport}
                  disabled={isExporting || selectedCount === 0}
                  className="w-full"
                >
                  {isExporting ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Exportálás...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Export ({selectedCount})</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress */}
            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Exportálás folyamatban...</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <Progress value={exportProgress} className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Node Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exportálható Elemek ({exportableNodes.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={selectAllNodes}>
                Összes kiválasztása
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllNodes}>
                Összes törlése
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {exportableNodes.map((node) => {
              const result = exportResults.find(r => r.nodeId === node.id);
              
              return (
                <div 
                  key={node.id} 
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    checked={node.selected}
                    onCheckedChange={() => toggleNodeSelection(node.id)}
                    disabled={isExporting}
                  />
                  
                  <FileImage className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{node.name}</div>
                    <div className="text-sm text-gray-500">
                      <Badge variant="outline" className="text-xs">{node.type}</Badge>
                    </div>
                  </div>

                  {result && (
                    <div className="flex-shrink-0">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {exportableNodes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileImage className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nincsenek exportálható elemek a fájlban.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Results */}
      {exportResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Export Eredmények</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exportResults.map((result) => {
                const node = exportableNodes.find(n => n.id === result.nodeId);
                return (
                  <div 
                    key={result.nodeId}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    
                    <div className="flex-1">
                      <div className="font-medium">{node?.name || result.nodeId}</div>
                      {result.error && (
                        <div className="text-sm text-red-600">{result.error}</div>
                      )}
                    </div>

                    {result.success && result.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(result.url, '_blank')}
                      >
                        Megnyitás
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}