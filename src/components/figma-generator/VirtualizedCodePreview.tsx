import React, { useState, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Button } from '@/components/ui/button';
import { Copy, Download, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface VirtualizedCodePreviewProps {
  code: string;
  language: string;
  filename: string;
  maxHeight?: number;
}

interface CodeLine {
  number: number;
  content: string;
  isHighlighted?: boolean;
}

export function VirtualizedCodePreview({ 
  code, 
  language, 
  filename,
  maxHeight = 400 
}: VirtualizedCodePreviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Split code into lines for virtualization
  const codeLines = useMemo(() => {
    const lines = code.split('\n');
    return lines.map((content, index) => ({
      number: index + 1,
      content,
      isHighlighted: searchTerm && content.toLowerCase().includes(searchTerm.toLowerCase())
    }));
  }, [code, searchTerm]);

  // Filter lines based on search
  const filteredLines = useMemo(() => {
    if (!searchTerm) return codeLines;
    return codeLines.filter(line => 
      line.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [codeLines, searchTerm]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [code, filename]);

  // Virtualized row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const line = filteredLines[index];
    if (!line) return null;

    return (
      <div style={style} className="flex">
        <div className="w-12 text-right pr-2 text-gray-500 text-sm font-mono bg-gray-50 border-r">
          {line.number}
        </div>
        <div className={`flex-1 px-2 text-sm font-mono ${line.isHighlighted ? 'bg-yellow-100' : ''}`}>
          <SyntaxHighlighter
            language={language}
            style={tomorrow}
            customStyle={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              fontSize: '12px',
              lineHeight: '1.4'
            }}
            PreTag="span"
          >
            {line.content || ' '}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }, [filteredLines, language]);

  if (isCollapsed) {
    return (
      <div className="border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{filename}</span>
            <Badge variant="outline">{language.toUpperCase()}</Badge>
            <Badge variant="secondary">{codeLines.length} lines</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">{filename}</span>
          <Badge variant="outline">{language.toUpperCase()}</Badge>
          <Badge variant="secondary">{codeLines.length} lines</Badge>
          {searchTerm && (
            <Badge variant="default">{filteredLines.length} matches</Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search in code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-40 h-8 text-sm"
            />
          </div>
          
          {/* Actions */}
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Virtualized Code Content */}
      <div style={{ height: maxHeight }}>
        <List
          height={maxHeight}
          itemCount={filteredLines.length}
          itemSize={20} // Height per line
          width="100%"
        >
          {Row}
        </List>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500">
        {filteredLines.length} of {codeLines.length} lines
        {searchTerm && ` • Filtered by "${searchTerm}"`}
      </div>
    </div>
  );
}