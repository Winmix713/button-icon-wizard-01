"use client"

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  FileText,
  Layers,
  Code2,
  Zap,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  Square,
  MemoryStick,
  Clock,
  TrendingUp,
} from "lucide-react"

import { VirtualizedCodePreview } from "./VirtualizedCodePreview"

// --- Típusdefiníciók ---

interface FigmaApiResponse {
  name: string
  lastModified: string
  version: string
  document: FigmaNode
  components: Record<string, FigmaComponent>
  styles: Record<string, FigmaStyle>
}

interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  depth?: number
  // További mezők a bővíthetőséghez
  props?: Record<string, any>
}

interface FigmaComponent {
  key: string
  name: string
  description: string
}

interface FigmaStyle {
  key: string
  name: string
}

interface ProcessingProgress {
  totalNodes: number
  processedNodes: number
  currentChunk: number
  totalChunks: number
  memoryUsageMB: number
  estimatedTimeRemainingMS: number
  startTime: number
  elapsedTimeMS: number
}

interface ProcessingStatistics {
  totalNodes: number
  nodeTypesCount: Record<string, number>
  componentCount: number
  styleCount: number
  maxDepth: number
  elapsedTimeMS: number
  memoryUsageMB: number
}

// --- Segédfüggvények ---

/**
 * Lapítja a Figma dokumentumfát egyetlen csomópont tömbbé,
 * hozzáadva a 'depth' tulajdonságot.
 */
const flattenDocumentTree = (node: FigmaNode, depth = 0): FigmaNode[] => {
  if (!node) return []

  const nodes: FigmaNode[] = [{ ...node, depth }]

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      nodes.push(...flattenDocumentTree(child, depth + 1))
    }
  }

  return nodes
}

/**
 * Megszámolja a teljes csomópont számot egy Figma dokumentumban.
 */
const countNodes = (node: FigmaNode): number => {
  if (!node) return 0

  let count = 1
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      count += countNodes(child)
    }
  }
  return count
}

/**
 * Valós memóriahasználat lekérése MB-ban, ha elérhető.
 */
const getMemoryUsageMB = (): number => {
  if (typeof performance !== "undefined" && (performance as any).memory) {
    const mem = (performance as any).memory
    // mem.usedJSHeapSize, mem.totalJSHeapSize, mem.jsHeapSizeLimit
    return mem.usedJSHeapSize / 1024 / 1024
  }
  return 0
}

/**
 * Letölt egy fájlt a megadott tartalommal és névvel.
 */
const downloadFile = (content: string, filename: string): Promise<void> => {
  return new Promise((resolve) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    resolve()
  })
}

// --- Osztályok ---

interface LargeFileProcessorOptions {
  chunkSize: number
  maxConcurrentChunks: number
  enableVirtualization: boolean
  enableStreaming: boolean
  memoryThresholdMB: number
}

class LargeFileProcessor {
  private options: LargeFileProcessorOptions
  private isAborted = false
  private isPaused = false
  private resolvePause: (() => void) | null = null

  constructor(options: LargeFileProcessorOptions) {
    this.options = options
  }

  abort() {
    this.isAborted = true
    if (this.resolvePause) {
      this.resolvePause()
    }
  }

  pause() {
    if (!this.isPaused) {
      this.isPaused = true
    }
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false
      if (this.resolvePause) {
        this.resolvePause()
        this.resolvePause = null
      }
    }
  }

  private async waitForResume(): Promise<void> {
    if (this.isPaused) {
      return new Promise((resolve) => {
        this.resolvePause = resolve
      })
    }
    return Promise.resolve()
  }

  /**
   * Feldolgozza a Figma dokumentumot chunk-okban, aszinkron módon.
   */
  async processLargeFigmaFile(
    figmaData: FigmaApiResponse,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<{ processedNodes: FigmaNode[]; statistics: ProcessingStatistics }> {
    this.isAborted = false
    this.isPaused = false
    this.resolvePause = null

    if (!figmaData || !figmaData.document) {
      throw new Error("Érvénytelen Figma adat: hiányzó dokumentumstruktúra.")
    }

    const totalNodes = countNodes(figmaData.document)
    const flattenedNodes: FigmaNode[] = []
    const startTime = Date.now()

    // Feldolgozás chunk-okban, queue-val párhuzamosan
    const queue: FigmaNode[] = [figmaData.document]

    while (queue.length > 0) {
      if (this.isAborted) {
        throw new Error("Feldolgozás megszakítva.")
      }
      await this.waitForResume()

      const chunk = queue.splice(0, this.options.chunkSize)
      for (const node of chunk) {
        if (this.isAborted) {
          throw new Error("Feldolgozás megszakítva.")
        }
        flattenedNodes.push({ ...node, depth: node.depth ?? 0 })
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            queue.push({ ...child, depth: (node.depth ?? 0) + 1 })
          }
        }
      }

      // Progressz frissítés
      const elapsedTime = Date.now() - startTime
      const processedCount = flattenedNodes.length
      const memoryUsageMB = getMemoryUsageMB()

      const estimatedTimeRemaining =
        processedCount > 0
          ? (elapsedTime / processedCount) * (totalNodes - processedCount)
          : 0

      onProgress({
        totalNodes,
        processedNodes: processedCount,
        currentChunk: processedCount,
        totalChunks: totalNodes,
        memoryUsageMB,
        estimatedTimeRemainingMS: estimatedTimeRemaining,
        startTime,
        elapsedTimeMS: elapsedTime,
      })

      // Ha elérte a memória küszöböt, megvárja a folytatást
      if (memoryUsageMB > this.options.memoryThresholdMB) {
        this.pause()
        await this.waitForResume()
      }
    }

    const nodeTypesCount = flattenedNodes.reduce<Record<string, number>>(
      (acc, node) => {
        acc[node.type] = (acc[node.type] ?? 0) + 1
        return acc
      },
      {}
    )

    const depths = flattenedNodes.map((node) => node.depth ?? 0)
    const maxDepth = depths.length > 0 ? Math.max(...depths) : 0

    const statistics: ProcessingStatistics = {
      totalNodes: flattenedNodes.length,
      nodeTypesCount,
      componentCount: Object.keys(figmaData.components || {}).length,
      styleCount: Object.keys(figmaData.styles || {}).length,
      maxDepth,
      elapsedTimeMS: Date.now() - startTime,
      memoryUsageMB: getMemoryUsageMB(),
    }

    return { processedNodes: flattenedNodes, statistics }
  }
}

// --- React kód konverter ---

class JsonToReactConverter {
  /**
   * Fejlett konverzió: a Figma node-okból React komponenseket generál,
   * rekurzívan renderelve a gyerekeket.
   */
  private renderNodeToReact(node: FigmaNode): ReactNode {
    const children = node.children?.map((child) => this.renderNodeToReact(child))

    // Egyszerű példa: típus alapján elem választás
    switch (node.type) {
      case "FRAME":
        return (
          <div
            key={node.id}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              margin: 5,
              backgroundColor: "#f9f9f9",
            }}
          >
            <strong>{node.name}</strong>
            {children}
          </div>
        )
      case "TEXT":
        return (
          <p key={node.id} style={{ marginLeft: (node.depth ?? 0) * 10 }}>
            {node.name}
          </p>
        )
      case "COMPONENT":
        return (
          <section
            key={node.id}
            style={{
              border: "2px dashed #888",
              padding: 8,
              margin: 5,
            }}
          >
            <em>{node.name}</em>
            {children}
          </section>
        )
      default:
        return (
          <div key={node.id} style={{ marginLeft: (node.depth ?? 0) * 10 }}>
            {node.name}
            {children}
          </div>
        )
    }
  }

  /**
   * Konvertálja a JSON-t React komponens stringé és CSS-be.
   * Itt JSX string generálás helyett valódi komponens fájlt adunk vissza.
   */
  convertJsonToReact(
    jsonData: FigmaNode[]
  ): { appTsx: string; appCss: string } {
    // JSX komponens string generálása
    const renderNodesToJsx = (nodes: FigmaNode[]): string => {
      const indent = (level: number) => "  ".repeat(level)
      const renderNode = (node: FigmaNode, level: number): string => {
        const childrenJsx = node.children
          ? node.children.map((child) => renderNode(child, level + 1)).join("\n")
          : ""
        switch (node.type) {
          case "FRAME":
            return `${indent(level)}<div className="frame" key="${node.id}">\n${indent(
              level + 1
            )}<strong>${node.name}</strong>\n${childrenJsx}\n${indent(level)}</div>`
          case "TEXT":
            return `${indent(level)}<p key="${node.id}">${node.name}</p>`
          case "COMPONENT":
            return `${indent(level)}<section className="component" key="${node.id}">\n${indent(
              level + 1
            )}<em>${node.name}</em>\n${childrenJsx}\n${indent(level)}</section>`
          default:
            return `${indent(level)}<div key="${node.id}">${node.name}\n${childrenJsx}\n${indent(
              level
            )}</div>`
        }
      }
      return nodes.map((node) => renderNode(node, 2)).join("\n")
    }

    const appTsx = `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <h1>Figma Design to React</h1>
      ${renderNodesToJsx(jsonData)}
    </div>
  );
}

export default App;
`

    const appCss = `
.app-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  padding: 20px;
  background-color: #f0f0f0;
  min-height: 100vh;
}

.frame {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 5px 0;
  background-color: #fafafa;
}

.component {
  border: 2px dashed #888;
  padding: 8px;
  margin: 5px 0;
}

h1 {
  color: #333;
}

p {
  margin-left: 20px;
  color: #555;
}
`

    return { appTsx, appCss }
  }
}

// --- React komponens ---

interface OptimizedFigmaInfoDisplayProps {
  figmaData: FigmaApiResponse | null
  fileKey: string
}

const LARGE_FILE_NODE_THRESHOLD = 1000

export function OptimizedFigmaInfoDisplay({
  figmaData,
  fileKey,
}: OptimizedFigmaInfoDisplayProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [processedData, setProcessedData] = useState<{
    processedNodes: FigmaNode[]
    statistics: ProcessingStatistics
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  const processorRef = useRef<LargeFileProcessor | null>(null)

  // Inicializálás
  useEffect(() => {
    processorRef.current = new LargeFileProcessor({
      chunkSize: 100,
      maxConcurrentChunks: 3,
      enableVirtualization: true,
      enableStreaming: true,
      memoryThresholdMB: 150,
    })

    return () => {
      processorRef.current?.abort()
    }
  }, [])

  // Automatikus feldolgozás
  useEffect(() => {
    if (!figmaData) return
    if (!figmaData.document) {
      setError("Figma fájl nem tartalmaz document struktúrát.")
      return
    }
    if (!isProcessing && !processedData) {
      const nodeCount = countNodes(figmaData.document)
      if (nodeCount > LARGE_FILE_NODE_THRESHOLD) {
        handleStartProcessing()
      } else {
        // Kis fájl - azonnali lapítás
        const flattened = flattenDocumentTree(figmaData.document)
        const nodeTypesCount = flattened.reduce<Record<string, number>>(
          (acc, node) => {
            acc[node.type] = (acc[node.type] ?? 0) + 1
            return acc
          },
          {}
        )
        setProcessedData({
          processedNodes: flattened,
          statistics: {
            totalNodes: flattened.length,
            nodeTypesCount,
            componentCount: Object.keys(figmaData.components || {}).length,
            styleCount: Object.keys(figmaData.styles || {}).length,
            maxDepth:
              flattened.length > 0
                ? Math.max(...flattened.map((n) => n.depth ?? 0))
                : 0,
            elapsedTimeMS: 0,
            memoryUsageMB: getMemoryUsageMB(),
          },
        })
      }
    }
  }, [figmaData, isProcessing, processedData])

  const handleStartProcessing = useCallback(async () => {
    const processor = processorRef.current
    if (!processor || !figmaData) return

    setIsProcessing(true)
    setIsPaused(false)
    setError(null)
    setProgress(null)

    try {
      const result = await processor.processLargeFigmaFile(figmaData, (prog) => {
        setProgress(prog)
      })
      setProcessedData(result)
      setProgress(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Feldolgozás sikertelen"
      setError(message)
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [figmaData])

  const handlePauseResume = useCallback(() => {
    const processor = processorRef.current
    if (!processor || !isProcessing) return

    if (isPaused) {
      processor.resume()
    } else {
      processor.pause()
    }
    setIsPaused(!isPaused)
  }, [isPaused, isProcessing])

  const handleStop = useCallback(() => {
    const processor = processorRef.current
    if (processor) {
      processor.abort()
      setIsProcessing(false)
      setIsPaused(false)
      setProgress(null)
      setProcessedData(null)
      setError("Feldolgozás megszakítva.")
    }
  }, [])

  const statistics = useMemo(() => {
    if (!processedData) return null
    return processedData.statistics
  }, [processedData])

  const handleReactConversion = useCallback(async () => {
    if (!processedData) {
      alert("Nincs feldolgozott adat a konverzióhoz!")
      return
    }
    setIsConverting(true)
    try {
      const converter = new JsonToReactConverter()
      const { appTsx, appCss } = converter.convertJsonToReact(
        processedData.processedNodes
      )
      await downloadFile(appTsx, "App.tsx")
      await downloadFile(appCss, "App.css")
    } catch (error) {
      console.error(error)
      alert("Hiba történt a React kód generálása során!")
    } finally {
      setIsConverting(false)
    }
  }, [processedData])

  // Feldolgozás alatt UI
  if (isProcessing && progress) {
    const completionPct =
      progress.totalNodes > 0
        ? (progress.processedNodes / progress.totalNodes) * 100
        : 0
    const nodesPerSec =
      progress.elapsedTimeMS > 0
        ? progress.processedNodes / (progress.elapsedTimeMS / 1000)
        : 0

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span>Figma fájl feldolgozása</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(completionPct)}%
                </div>
                <div className="text-sm text-blue-800">Kész</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {progress.processedNodes.toLocaleString()}
                </div>
                <div className="text-sm text-green-800">Feldolgozott csomópont</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(progress.memoryUsageMB)}MB
                </div>
                <div className="text-sm text-purple-800">Memória használat</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(progress.estimatedTimeRemainingMS / 1000)}s
                </div>
                <div className="text-sm text-orange-800">Becsült hátralévő idő</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Csomópontok feldolgozása...</span>
                <span>
                  {progress.processedNodes} / {progress.totalNodes}
                </span>
              </div>
              <Progress value={completionPct} className="h-3" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Chunk progresszív</span>
                <span>
                  {progress.currentChunk} / {progress.totalChunks}
                </span>
              </div>
              <Progress
                value={(progress.currentChunk / progress.totalChunks) * 100}
                className="h-2"
              />
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" onClick={handlePauseResume} disabled={!isProcessing}>
                {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                {isPaused ? "Folytatás" : "Szüneteltetés"}
              </Button>
              <Button variant="destructive" onClick={handleStop} disabled={!isProcessing}>
                <Square className="w-4 h-4 mr-2" />
                Leállítás
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <MemoryStick className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Memória: {Math.round(progress.memoryUsageMB)}MB</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Eltelt idő: {Math.round(progress.elapsedTimeMS / 1000)}s</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm">Sebesség: {Math.round(nodesPerSec)} csomópont/s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Hibaállapot
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Feldolgozási hiba</span>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={handleStartProcessing} variant="outline">
            Újrapróbálkozás
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Nincs adat állapot
  if (!processedData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Készen áll a feldolgozásra
            </h3>
            <p className="text-gray-600 mb-4">
              Kattintson alább a Figma fájl feldolgozásának megkezdéséhez.
            </p>
            <Button onClick={handleStartProcessing} disabled={!figmaData}>
              <Zap className="w-4 h-4 mr-2" />
              Feldolgozás indítása
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hibakeresési információk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Figma adatok elérhetők:</strong> {figmaData ? "Igen" : "Nem"}
              </div>
              {figmaData && (
                <>
                  <div>
                    <strong>Dokumentum elérhető:</strong> {figmaData.document ? "Igen" : "Nem"}
                  </div>
                  <div>
                    <strong>Komponensek száma:</strong> {Object.keys(figmaData.components || {}).length}
                  </div>
                  <div>
                    <strong>Stílusok száma:</strong> {Object.keys(figmaData.styles || {}).length}
                  </div>
                  {figmaData.document && (
                    <div>
                      <strong>Dokumentum típusa:</strong> {figmaData.document.type}
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fő tartalom feldolgozott adatokkal
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Feldolgozás befejezve</span>
            {statistics && (
              <Badge variant="secondary">{statistics.totalNodes.toLocaleString()} csomópont feldolgozva</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Fájl információk</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Fájlnév</label>
              <p className="text-lg font-semibold">{figmaData?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Fájlkulcs</label>
              <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{fileKey}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Utolsó módosítás</label>
              <p>{figmaData ? new Date(figmaData.lastModified).toLocaleString() : "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Verzió</label>
              <p>{figmaData?.version}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Layers className="w-5 h-5" />
              <span>Tartalom statisztikák</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{statistics.totalNodes.toLocaleString()}</div>
                <div className="text-sm text-blue-800">Összes csomópont</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{statistics.componentCount}</div>
                <div className="text-sm text-green-800">Komponensek</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{statistics.styleCount}</div>
                <div className="text-sm text-purple-800">Stílusok</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{statistics.maxDepth}</div>
                <div className="text-sm text-orange-800">Max mélység</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Áttekintés</TabsTrigger>
          <TabsTrigger value="components">Komponensek</TabsTrigger>
          <TabsTrigger value="structure">Struktúra</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle>Csomópont típus eloszlás</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(statistics.nodeTypesCount).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle>Komponensek ({figmaData ? Object.keys(figmaData.components || {}).length : 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {figmaData &&
                  Object.entries(figmaData.components || {})
                    .slice(0, 50)
                    .map(([key, component]) => (
                      <div key={key} className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-semibold">{component.name}</h4>
                        {component.description && (
                          <p className="text-sm text-gray-600 mt-1">{component.description}</p>
                        )}
                      </div>
                    ))}
                {figmaData && Object.keys(figmaData.components || {}).length > 50 && (
                  <div className="text-center py-4 text-gray-500">
                    ... és még {Object.keys(figmaData.components || {}).length - 50} komponens
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dokumentum struktúra</CardTitle>
                {processedData && processedData.processedNodes.length > 0 && (
                  <Button
                    onClick={handleReactConversion}
                    disabled={isConverting}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isConverting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Konvertálás...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Code2 className="w-4 h-4" />
                        <span>React kódra konvertálás</span>
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {processedData?.processedNodes && (
                <VirtualizedCodePreview
                  code={JSON.stringify(processedData.processedNodes, null, 2)}
                  language="json"
                  filename="document-structure.json"
                  maxHeight={400}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}