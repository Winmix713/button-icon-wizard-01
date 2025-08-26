// Típusok a Figma dokumentum node-jaihoz (példa, bővíthető a valós specifikáció alapján)
export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: any[];
  backgroundColor?: any;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string | number;
  };
}

export interface ProcessingConfig {
  chunkSize: number;
  maxConcurrentChunks: number;
  enableVirtualization: boolean;
  enableStreaming: boolean;
  memoryThresholdMB: number; // MB
  maxRetriesPerChunk: number; // új: retry limit chunk hibákra
  progressThrottleMS: number; // új: progress callback throttle idő ms-ben
}

export interface ProcessingProgress {
  totalNodes: number;
  processedNodes: number;
  currentChunk: number;
  totalChunks: number;
  memoryUsageMB: number;
  estimatedTimeRemainingMS: number;
}

export interface ProcessedNode {
  id: string;
  name: string;
  type: string;
  depth: number;
  bounds?: { x: number; y: number; width: number; height: number };
  fills?: any[];
  backgroundColor?: any;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string | number;
  };
  childCount: number;
}

export interface ProcessedData {
  originalData: any;
  processedNodes: ProcessedNode[];
  statistics: {
    totalNodes: number;
    processedNodes: number;
    startTime: number;
  };
}

type ProgressCallback = (progress: ProcessingProgress) => void;

export class LargeFileProcessor {
  private config: ProcessingConfig;
  private abortController: AbortController | null = null;
  private progressCallback?: ProgressCallback;
  private lastProgressEmitTime = 0;
  private memoryCheckInterval?: NodeJS.Timeout;

  constructor(config: Partial<ProcessingConfig> = {}) {
    // Alapértelmezett konfiguráció
    this.config = {
      chunkSize: 50,
      maxConcurrentChunks: 3,
      enableVirtualization: true,
      enableStreaming: true,
      memoryThresholdMB: 100,
      maxRetriesPerChunk: 3,
      progressThrottleMS: 200,
      ...config,
    };
  }

  /**
   * Nagy Figma fájl feldolgozása chunkokban, párhuzamosan, progress visszajelzéssel.
   * @param figmaData - Figma dokumentum adat
   * @param onProgress - opcionális callback a feldolgozási állapotokhoz
   * @returns feldolgozott adatokat tartalmazó objektum
   */
  public async processLargeFigmaFile(
    figmaData: { document: FigmaNode },
    onProgress?: ProgressCallback
  ): Promise<ProcessedData> {
    this.progressCallback = onProgress;
    this.abortController = new AbortController();

    try {
      this.startMemoryMonitoring();

      const allNodes = this.flattenDocumentTree(figmaData.document);
      const chunks = this.createChunks(allNodes, this.config.chunkSize);

      const processedData: ProcessedData = {
        originalData: figmaData,
        processedNodes: [],
        statistics: {
          totalNodes: allNodes.length,
          processedNodes: 0,
          startTime: Date.now(),
        },
      };

      await this.processChunksWithConcurrency(chunks, processedData);

      return processedData;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Processing aborted by user');
      } else {
        console.error('Processing failed:', error);
      }
      throw error;
    } finally {
      this.stopMemoryMonitoring();
      this.abortController = null;
      this.progressCallback = undefined;
    }
  }

  /**
   * Rekurzívan lapos tömbbé alakítja a dokumentumfa node-jait.
   * @param node - Figma node
   * @param depth - fa mélysége (rekurzív)
   * @returns lapos node tömb
   */
  private flattenDocumentTree(node: FigmaNode, depth = 0): Array<FigmaNode & { depth: number }> {
    if (!node) {
      console.warn('Null or undefined node encountered at depth', depth);
      return [];
    }
    const nodes: Array<FigmaNode & { depth: number }> = [{ ...node, depth }];

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (child) {
          nodes.push(...this.flattenDocumentTree(child, depth + 1));
        }
      }
    }
    return nodes;
  }

  /**
   * Tömböt kisebb chunkokra bont chunkSize alapján.
   * @param array - feldolgozandó tömb
   * @param chunkSize - chunk méret
   * @returns chunkok tömbje
   */
  private createChunks<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Chunk-ok párhuzamos feldolgozása, retry és abort támogatással.
   * @param chunks - chunk tömb
   * @param processedData - feldolgozott adatokat tartalmazó objektum
   */
  private async processChunksWithConcurrency(
    chunks: Array<(FigmaNode & { depth: number })[]>,
    processedData: ProcessedData
  ): Promise<void> {
    const semaphore = new Semaphore(this.config.maxConcurrentChunks);
    const promises: Promise<void>[] = [];

    for (let i = 0; i < chunks.length; i++) {
      if (this.abortController?.signal.aborted) {
        throw new DOMException('Processing aborted', 'AbortError');
      }

      const chunk = chunks[i];

      const promise = semaphore.acquire().then(async (release) => {
        try {
          await this.processChunkWithRetries(chunk, i, chunks.length, processedData);
        } finally {
          release();
        }
      });

      promises.push(promise);

      // Yield control every 10 chunks to keep UI responsive
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    await Promise.all(promises);
  }

  /**
   * Egy chunk feldolgozása retry mechanizmussal.
   * @param chunk - feldolgozandó chunk
   * @param chunkIndex - chunk index
   * @param totalChunks - összes chunk száma
   * @param processedData - feldolgozott adatokat tartalmazó objektum
   */
  private async processChunkWithRetries(
    chunk: Array<FigmaNode & { depth: number }>,
    chunkIndex: number,
    totalChunks: number,
    processedData: ProcessedData
  ): Promise<void> {
    let attempt = 0;
    while (attempt < this.config.maxRetriesPerChunk) {
      if (this.abortController?.signal.aborted) {
        throw new DOMException('Processing aborted', 'AbortError');
      }

      try {
        await this.processChunk(chunk, chunkIndex, totalChunks, processedData);
        return; // sikeres feldolgozás
      } catch (error) {
        attempt++;
        console.warn(`Chunk ${chunkIndex + 1} processing failed on attempt ${attempt}:`, error);
        if (attempt >= this.config.maxRetriesPerChunk) {
          throw error;
        }
        // Exponenciális visszavárás retry között
        await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt)));
      }
    }
  }

  /**
   * Egy chunk feldolgozása, aszinkron node feldolgozással és progress frissítéssel.
   * @param chunk - feldolgozandó chunk
   * @param chunkIndex - chunk index
   * @param totalChunks - összes chunk száma
   * @param processedData - feldolgozott adatokat tartalmazó objektum
   */
  private async processChunk(
    chunk: Array<FigmaNode & { depth: number }>,
    chunkIndex: number,
    totalChunks: number,
    processedData: ProcessedData
  ): Promise<void> {
    // Aszinkron feldolgozás támogatása (pl. I/O művelet helyére)
    const processedChunk: ProcessedNode[] = await Promise.all(
      chunk.map(async (node) => this.processNode(node))
    );

    processedData.processedNodes.push(...processedChunk);
    processedData.statistics.processedNodes += chunk.length;

    this.maybeEmitProgress(
      processedData.statistics.totalNodes,
      processedData.statistics.processedNodes,
      chunkIndex + 1,
      totalChunks
    );

    // Memóriahasználat ellenőrzése, chunkSize dinamikus csökkentése ha szükséges
    const memUsage = this.getMemoryUsageMB();
    if (memUsage > this.config.memoryThresholdMB) {
      console.warn(
        `Memory usage high (${memUsage.toFixed(2)}MB), consider reducing chunk size or concurrency`
      );
      // Nem kényszerítünk GC-t, de jelezzük a problémát
    }

    // Kis késleltetés a UI thread tehermentesítésére
    await new Promise((resolve) => setTimeout(resolve, 1));
  }

  /**
   * Node feldolgozása aszinkron, lightweight módon.
   * @param node - Figma node
   * @returns feldolgozott node adatai
   */
  private async processNode(node: FigmaNode & { depth: number }): Promise<ProcessedNode> {
    // Itt lehet később pl. hálózati vagy fájl művelet is
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      depth: node.depth,
      bounds: node.absoluteBoundingBox,
      fills: node.fills ? node.fills.slice(0, 3) : undefined,
      backgroundColor: node.backgroundColor,
      style: node.style
        ? {
            fontFamily: node.style.fontFamily,
            fontSize: node.style.fontSize,
            fontWeight: node.style.fontWeight,
          }
        : undefined,
      childCount: node.children ? node.children.length : 0,
    };
  }

  /**
   * Progress callback meghívása throttle-ozva.
   * @param totalNodes - összes node
   * @param processedNodes - feldolgozott node-ok száma
   * @param currentChunk - aktuális chunk index
   * @param totalChunks - összes chunk száma
   */
  private maybeEmitProgress(
    totalNodes: number,
    processedNodes: number,
    currentChunk: number,
    totalChunks: number
  ): void {
    const now = Date.now();
    if (
      this.progressCallback &&
      (now - this.lastProgressEmitTime > this.config.progressThrottleMS || processedNodes === totalNodes)
    ) {
      this.lastProgressEmitTime = now;

      const eta = this.calculateETA(processedNodes, totalNodes);

      this.progressCallback({
        totalNodes,
        processedNodes,
        currentChunk,
        totalChunks,
        memoryUsageMB: this.getMemoryUsageMB(),
        estimatedTimeRemainingMS: eta,
      });
    }
  }

  /**
   * Memóriahasználat lekérdezése MB-ban, böngésző és Node.js támogatással.
   * @returns memóriahasználat MB-ban
   */
  private getMemoryUsageMB(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory?.usedJSHeapSize) {
      // Böngésző környezet
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }

    if (typeof process !== 'undefined' && process.memoryUsage) {
      // Node.js környezet
      const mem = process.memoryUsage();
      return mem.heapUsed / 1024 / 1024;
    }

    return 0; // Nem támogatott környezet
  }

  /**
   * Egyszerű becslés az ETA-ra ms-ban.
   * @param processed - feldolgozott node-ok száma
   * @param total - összes node száma
   * @returns becsült hátralévő idő ms-ban
   */
  private calculateETA(processed: number, total: number): number {
    const now = Date.now();
    const elapsed = now - (this.lastProgressEmitTime || now);
    if (processed === 0 || elapsed === 0) return Infinity;
    const rate = processed / elapsed; // node/ms
    const remaining = total - processed;
    return remaining / rate;
  }

  /**
   * Memória monitorozás elindítása időzítővel.
   */
  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      const usage = this.getMemoryUsageMB();
      if (usage > this.config.memoryThresholdMB * 0.8) {
        console.warn(`Memory usage high: ${usage.toFixed(2)}MB`);
      }
    }, 1000);
  }

  /**
   * Memória monitorozás leállítása.
   */
  private stopMemoryMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }
  }

  /**
   * Feldolgozás megszakítása.
   */
  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

/**
 * Egyszerű Semaphore implementáció párhuzamosság szabályozására.
 */
class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  public async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.queue.push(() => {
          this.permits--;
          resolve(() => this.release());
        });
      }
    });
  }

  private release(): void {
    this.permits++;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}