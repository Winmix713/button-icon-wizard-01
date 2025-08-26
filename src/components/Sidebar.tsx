import React, { useState, useCallback, useRef } from 'react';
import { FileText, UploadCloud, Lightbulb, X } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

interface SidebarProps {
  showToast: (message: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ showToast }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFileTypes = ['.css', '.js', '.json', '.scss', '.ts', '.jsx', '.tsx'];
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileRead = useCallback((files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return acceptedFileTypes.includes(extension);
    });

    if (validFiles.length === 0) {
      showToast('Nem támogatott fájlformátum. Támogatott: .css, .js, .json, .scss, .ts, .jsx, .tsx');
      return;
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: UploadedFile = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          content: reader.result as string
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
        showToast(`${file.name} sikeresen feltöltve`);
      };
      reader.readAsText(file);
    });
  }, [showToast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileRead(files);
    }
  }, [handleFileRead]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileRead(files);
    }
  }, [handleFileRead]);

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    showToast('Fájl eltávolítva');
  }, [showToast]);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return <FileText className="w-4.5 h-4.5 text-white/90" strokeWidth={1.5} />;
  };

  return (
    <aside className="space-y-6">
      {/* File Upload */}
      <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold tracking-tight">Kiegészítő fájlok (opcionális)</h3>
          {uploadedFiles.length > 0 && (
            <span className="text-xs text-white/60">{uploadedFiles.length} fájl</span>
          )}
        </div>
        
        {/* Upload Area */}
        <div
          className={`rounded-xl border border-dashed p-6 text-center transition-all cursor-pointer ${
            isDragging 
              ? 'border-blue-400 bg-blue-500/10' 
              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileClick}
        >
          <UploadCloud className={`w-8 h-8 mx-auto mb-3 ${isDragging ? 'text-blue-400' : 'text-white/60'}`} strokeWidth={1.5} />
          <p className="text-sm text-white/70 mb-2">
            {isDragging ? 'Engedd el a fájlokat itt' : 'Húzd ide a fájlokat vagy kattints a böngészéshez'}
          </p>
          <p className="text-xs text-white/50">
            Támogatott: .css, .js, .json, .scss, .ts, .jsx, .tsx
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFileTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white/90 truncate">{file.name}</div>
                      <div className="text-xs text-white/60">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-red-400"
                    aria-label="Fájl eltávolítása"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4.5 h-4.5 text-yellow-300" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold tracking-tight">Tippek a jobb eredményhez</h3>
        </div>
        <ul className="mt-4 space-y-3 text-sm text-white/70">
          <li className="flex gap-2">
            <span className="text-white/40">•</span>
            Használj Auto Layout-ot és egyértelmű layer elnevezést.
          </li>
          <li className="flex gap-2">
            <span className="text-white/40">•</span>
            Kerüld a rasterizált szöveget; a szöveg legyen Text layer.
          </li>
          <li className="flex gap-2">
            <span className="text-white/40">•</span>
            A primér színek és árnyékok segítenek a glassmorphism megőrzésében.
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;