import { FigmaNode, FigmaFile } from '../types/figma';

export interface RealTimeProcessingConfig {
  enableWebSocket: boolean;
  enableServerSentEvents: boolean;
  batchSize: number;
  processingInterval: number;
  enableProgressiveRendering: boolean;
  enableIncrementalUpdates: boolean;
}

export interface ProcessingEvent {
  type: 'progress' | 'complete' | 'error' | 'node_processed' | 'batch_complete';
  data: any;
  timestamp: number;
  sessionId: string;
}

export interface ProcessingSession {
  id: string;
  startTime: number;
  totalNodes: number;
  processedNodes: number;
  status: 'active' | 'paused' | 'completed' | 'error';
  config: RealTimeProcessingConfig;
}

export class RealTimeProcessor {
  private sessions = new Map<string, ProcessingSession>();
  private eventListeners = new Map<string, ((event: ProcessingEvent) => void)[]>();
  private workers = new Map<string, Worker>();

  constructor(private config: RealTimeProcessingConfig) {}

  async startProcessing(
    figmaFile: FigmaFile,
    sessionId: string,
    onEvent?: (event: ProcessingEvent) => void
  ): Promise<void> {
    const session: ProcessingSession = {
      id: sessionId,
      startTime: Date.now(),
      totalNodes: this.countNodes(figmaFile.document),
      processedNodes: 0,
      status: 'active',
      config: this.config
    };

    this.sessions.set(sessionId, session);
    
    if (onEvent) {
      this.addEventListener(sessionId, onEvent);
    }

    // Create dedicated worker for processing
    if (typeof Worker !== 'undefined') {
      const worker = new Worker(new URL('../workers/figmaProcessor.worker.ts', import.meta.url));
      this.workers.set(sessionId, worker);
      
      worker.postMessage({
        type: 'START_PROCESSING',
        figmaFile,
        config: this.config,
        sessionId
      });

      worker.onmessage = (event) => {
        this.handleWorkerMessage(sessionId, event.data);
      };
    } else {
      // Fallback to main thread processing
      await this.processInMainThread(figmaFile, sessionId);
    }
  }

  private async processInMainThread(figmaFile: FigmaFile, sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const nodes = this.flattenNodes(figmaFile.document);
    const batches = this.createBatches(nodes, this.config.batchSize);

    for (let i = 0; i < batches.length; i++) {
      if (session.status !== 'active') break;

      const batch = batches[i];
      await this.processBatch(batch, sessionId);
      
      session.processedNodes += batch.length;
      
      this.emitEvent(sessionId, {
        type: 'batch_complete',
        data: {
          batchIndex: i,
          totalBatches: batches.length,
          processedNodes: session.processedNodes,
          totalNodes: session.totalNodes
        },
        timestamp: Date.now(),
        sessionId
      });

      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    session.status = 'completed';
    this.emitEvent(sessionId, {
      type: 'complete',
      data: { session },
      timestamp: Date.now(),
      sessionId
    });
  }

  private async processBatch(nodes: FigmaNode[], sessionId: string): Promise<void> {
    for (const node of nodes) {
      await this.processNode(node, sessionId);
    }
  }

  private async processNode(node: FigmaNode, sessionId: string): Promise<void> {
    // Simulate node processing
    await new Promise(resolve => setTimeout(resolve, 1));
    
    this.emitEvent(sessionId, {
      type: 'node_processed',
      data: { nodeId: node.id, nodeName: node.name },
      timestamp: Date.now(),
      sessionId
    });
  }

  private handleWorkerMessage(sessionId: string, message: any): void {
    switch (message.type) {
      case 'PROGRESS':
        this.emitEvent(sessionId, {
          type: 'progress',
          data: message.data,
          timestamp: Date.now(),
          sessionId
        });
        break;
      case 'COMPLETE':
        const session = this.sessions.get(sessionId);
        if (session) {
          session.status = 'completed';
        }
        this.emitEvent(sessionId, {
          type: 'complete',
          data: message.data,
          timestamp: Date.now(),
          sessionId
        });
        break;
      case 'ERROR':
        this.handleError(sessionId, message.error);
        break;
    }
  }

  private emitEvent(sessionId: string, event: ProcessingEvent): void {
    const listeners = this.eventListeners.get(sessionId) || [];
    listeners.forEach(listener => listener(event));
  }

  private handleError(sessionId: string, error: any): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'error';
    }

    this.emitEvent(sessionId, {
      type: 'error',
      data: { error: error.message || 'Unknown error' },
      timestamp: Date.now(),
      sessionId
    });
  }

  addEventListener(sessionId: string, listener: (event: ProcessingEvent) => void): void {
    if (!this.eventListeners.has(sessionId)) {
      this.eventListeners.set(sessionId, []);
    }
    this.eventListeners.get(sessionId)!.push(listener);
  }

  removeEventListener(sessionId: string, listener: (event: ProcessingEvent) => void): void {
    const listeners = this.eventListeners.get(sessionId);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  pauseProcessing(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'paused';
    }

    const worker = this.workers.get(sessionId);
    if (worker) {
      worker.postMessage({ type: 'PAUSE' });
    }
  }

  resumeProcessing(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'active';
    }

    const worker = this.workers.get(sessionId);
    if (worker) {
      worker.postMessage({ type: 'RESUME' });
    }
  }

  stopProcessing(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'error';
    }

    const worker = this.workers.get(sessionId);
    if (worker) {
      worker.terminate();
      this.workers.delete(sessionId);
    }

    this.sessions.delete(sessionId);
    this.eventListeners.delete(sessionId);
  }

  getSession(sessionId: string): ProcessingSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): ProcessingSession[] {
    return Array.from(this.sessions.values());
  }

  private countNodes(node: FigmaNode): number {
    let count = 1;
    if (node.children) {
      count += node.children.reduce((sum, child) => sum + this.countNodes(child), 0);
    }
    return count;
  }

  private flattenNodes(node: FigmaNode): FigmaNode[] {
    const nodes = [node];
    if (node.children) {
      node.children.forEach(child => {
        nodes.push(...this.flattenNodes(child));
      });
    }
    return nodes;
  }

  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }
}