import { FigmaFile, FigmaFileResponse } from '../types/figma';

export class FigmaApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'FigmaApiError';
  }
}

export class FigmaApiService {
  private apiToken: string = '';
  private baseUrl = 'https://api.figma.com/v1';
  private mockMode = false; // Development mock mode
  private useProxy = true; // Use proxy by default for security
  private proxyBaseUrl = '/functions/v1/figma-proxy';
  
  // Rate limiting
  private lastRequestTime = 0;
  private requestCount = 0;
  private resetTime = Date.now() + 60000; // Reset every minute

  constructor(token?: string, enableMock = false) {
    if (token) {
      this.apiToken = token;
    }
    this.mockMode = !!enableMock;
    this.useProxy = true; // Default to proxy mode
  }

  setToken(token: string): void {
    this.apiToken = token;
  }

  // Public getters/setters for proxy and mock mode
  setUseProxy(useProxy: boolean): void {
    this.useProxy = useProxy;
  }

  getUseProxy(): boolean {
    return this.useProxy;
  }

  isMockMode(): boolean {
    return this.mockMode;
  }

  getToken(): string {
    return this.apiToken;
  }

  setProxyBaseUrl(url: string): void {
    this.proxyBaseUrl = url;
  }

  setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
  }

  // Rate limiting check
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counter every minute
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 60000;
    }
    
    // Figma allows ~500 requests per minute
    if (this.requestCount >= 450) {
      const waitTime = this.resetTime - now;
      throw new FigmaApiError(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`, 429);
    }
    
    // Minimum delay between requests (100ms)
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 100) {
      await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastRequest));
    }
    
    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  validateToken(token: string): boolean {
    // Figma tokens typically start with 'figd_' and are around 40-50 characters
    return /^figd_[A-Za-z0-9_-]{30,50}$/.test(token.trim());
  }

  validateUrl(url: string): boolean {
    const figmaUrlPattern = /^https:\/\/(?:www\.)?figma\.com\/(file|design)\/([a-zA-Z0-9]+)/;
    return figmaUrlPattern.test(url.trim());
  }

  extractFileId(url: string): string | null {
    const match = url.match(/\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  async getFile(fileId: string): Promise<FigmaFile> {
    if (!fileId) {
      throw new FigmaApiError('File ID is required', 400);
    }

    // Mock mode for development
    if (this.mockMode) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      return this.getMockFile(fileId);
    }

    // Check rate limiting
    await this.checkRateLimit();

    // Check if we need direct token for non-proxy mode
    if (!this.useProxy && !this.apiToken) {
      throw new FigmaApiError('API token is required for direct mode', 401);
    }

    try {
      let response: Response;
      
      if (this.useProxy) {
        // Use proxy mode - no token needed on frontend
        response = await fetch(`${this.proxyBaseUrl}/files/${fileId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        // Direct mode - use token
        response = await fetch(`${this.baseUrl}/files/${fileId}`, {
          headers: {
            'X-Figma-Token': this.apiToken,
            'Content-Type': 'application/json',
          },
        });
      }

      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If response is not JSON, try to get text for better error message
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Non-JSON error response:', errorText.substring(0, 500));
          throw new FigmaApiError(
            `${this.getErrorMessage(response.status)} - Server returned HTML instead of JSON. Check your API token and Supabase configuration.`,
            response.status,
            { error: errorText.substring(0, 500) }
          );
        }
        throw new FigmaApiError(
          this.getErrorMessage(response.status, errorData),
          response.status,
          errorData
        );
      }

      let data: FigmaFileResponse;
      try {
        data = await response.json();
      } catch (parseError) {
        const responseText = await response.text().catch(() => 'Unable to read response');
        console.error('Failed to parse JSON response:', parseError);
        console.error('Response text:', responseText.substring(0, 500));
        throw new FigmaApiError(
          'Invalid JSON response from Figma API. Check your Figma API token and file permissions.',
          500,
          { parseError: parseError instanceof Error ? parseError.message : 'JSON parse failed' }
        );
      }
      
      if (data.error) {
        throw new FigmaApiError(
          data.err || 'Unknown API error',
          data.status || 500,
          data
        );
      }

      return {
        name: data.name,
        role: data.role || 'viewer',
        lastModified: data.lastModified,
        editorType: data.editorType || 'figma',
        thumbnailUrl: data.thumbnailUrl,
        version: data.version,
        document: data.document,
        components: data.components,
        componentSets: data.componentSets || {},
        schemaVersion: data.schemaVersion,
        styles: data.styles,
        mainFileKey: data.mainFileKey,
        branches: data.branches,
      };
    } catch (error) {
      if (error instanceof FigmaApiError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        // If direct API fails due to CORS and we're in dev mode, suggest proxy
        if (import.meta.env.DEV && !this.useProxy) {
          throw new FigmaApiError('CORS hiba: Használd a proxy módot a biztonságos kapcsolódáshoz!', 0);
        }
        throw new FigmaApiError('CORS hiba: A Figma API közvetlenül nem elérhető a böngészőből.', 0);
      }

      throw new FigmaApiError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  async getFileNodes(fileId: string, nodeIds: string[]): Promise<any> {
    if (!fileId || nodeIds.length === 0) {
      throw new FigmaApiError('File ID and node IDs are required', 400);
    }

    // Mock mode
    if (this.mockMode) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { nodes: {} }; // Mock response
    }

    // Check rate limiting
    await this.checkRateLimit();

    // Check if we need direct token for non-proxy mode
    if (!this.useProxy && !this.apiToken) {
      throw new FigmaApiError('API token is required for direct mode', 401);
    }

    try {
      const idsParam = nodeIds.join(',');
      let response: Response;
      
      if (this.useProxy) {
        response = await fetch(
          `${this.proxyBaseUrl}/files/${fileId}/nodes?ids=${encodeURIComponent(idsParam)}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        response = await fetch(
          `${this.baseUrl}/files/${fileId}/nodes?ids=${encodeURIComponent(idsParam)}`,
          {
            headers: {
              'X-Figma-Token': this.apiToken,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new FigmaApiError(
          this.getErrorMessage(response.status, errorData),
          response.status,
          errorData
        );
      }

      const data = await response.json();
      return data.nodes;
    } catch (error) {
      if (error instanceof FigmaApiError) {
        throw error;
      }

      throw new FigmaApiError(`Failed to fetch nodes: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  async getImages(fileId: string, nodeIds: string[], options: { format?: 'jpg' | 'png' | 'svg' | 'pdf'; scale?: number } = {}): Promise<Record<string, string>> {
    // Mock mode
    if (this.mockMode) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockImages: Record<string, string> = {};
      nodeIds.forEach(nodeId => {
        mockImages[nodeId] = `https://via.placeholder.com/400x300.${options.format || 'png'}?text=Mock+Image`;
      });
      return mockImages;
    }

    // Check rate limiting
    await this.checkRateLimit();

    // Check if we need direct token for non-proxy mode
    if (!this.useProxy && !this.apiToken) {
      throw new FigmaApiError('API token is required for direct mode', 401);
    }

    try {
      const params = new URLSearchParams({
        ids: nodeIds.join(','),
        format: options.format || 'png',
        scale: String(options.scale || 1),
      });

      let response: Response;
      
      if (this.useProxy) {
        response = await fetch(
          `${this.proxyBaseUrl}/images/${fileId}?${params}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        response = await fetch(
          `${this.baseUrl}/images/${fileId}?${params}`,
          {
            headers: {
              'X-Figma-Token': this.apiToken,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new FigmaApiError(
          this.getErrorMessage(response.status, errorData),
          response.status,
          errorData
        );
      }

      const data = await response.json();
      return data.images;
    } catch (error) {
      if (error instanceof FigmaApiError) {
        throw error;
      }

      throw new FigmaApiError(`Failed to fetch images: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  private getErrorMessage(status: number, errorData?: any): string {
    switch (status) {
      case 400:
        return 'Bad request - Invalid file ID or parameters';
      case 401:
        return 'Unauthorized - Invalid or missing API token';
      case 403:
        return 'Forbidden - Insufficient permissions or file is private';
      case 404:
        return 'File not found - Check if the file ID is correct and accessible';
      case 429:
        return 'Rate limit exceeded - Please try again later';
      case 500:
        return 'Figma server error - Please try again later';
      default:
        return errorData?.err || errorData?.message || `HTTP ${status} error`;
    }
  }

  // Utility methods
  isValidFileKey(key: string): boolean {
    return /^[a-zA-Z0-9]{22,25}$/.test(key);
  }

  parseFileUrl(url: string): { fileId: string; nodeId?: string } | null {
    const figmaUrlPattern = /^https:\/\/(?:www\.)?figma\.com\/(file|design)\/([a-zA-Z0-9]+)(?:\/[^?]*)?(?:\?[^#]*)?(?:#(.*))?$/;
    const match = url.match(figmaUrlPattern);

    if (!match) {
      return null;
    }

    const [, , fileId, hash] = match;
    let nodeId: string | undefined;

    if (hash) {
      // Extract node ID from hash (usually in format like "123:456")
      const nodeMatch = hash.match(/(\d+:\d+)/);
      if (nodeMatch) {
        nodeId = nodeMatch[1];
      }
    }

    return { fileId, nodeId };
  }

  async testConnection(): Promise<boolean> {
    if (this.mockMode) {
      return true; // Always return true in mock mode
    }
    
    try {
      // Test with a simple API call that doesn't require a specific file
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'X-Figma-Token': this.apiToken,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private getMockFile(fileId: string): FigmaFile {
    return {
      name: `Mock Figma File ${fileId}`,
      role: 'viewer',
      lastModified: new Date().toISOString(),
      editorType: 'figma',
      thumbnailUrl: 'https://via.placeholder.com/400x300',
      version: '1.0.0',
      document: {
        id: '0:0',
        name: 'Document',
        type: 'DOCUMENT',
        children: [
          {
            id: '1:2',
            name: 'Page 1',
            type: 'CANVAS',
            children: [
              {
                id: '1:3',
                name: 'Frame 1',
                type: 'FRAME',
                children: [
                  {
                    id: '1:4',
                    name: 'Button',
                    type: 'RECTANGLE',
                    fills: [
                      {
                        type: 'SOLID',
                        color: { r: 0.2, g: 0.4, b: 1, a: 1 }
                      }
                    ],
                    absoluteBoundingBox: {
                      x: 0,
                      y: 0,
                      width: 120,
                      height: 40
                    }
                  }
                ],
                absoluteBoundingBox: {
                  x: 0,
                  y: 0,
                  width: 200,
                  height: 100
                }
              }
            ]
          }
        ]
      },
      components: {},
      componentSets: {},
      schemaVersion: 0,
      styles: {},
      mainFileKey: fileId,
      branches: []
    };
  }
}