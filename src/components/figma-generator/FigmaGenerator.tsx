import React, { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Link,
  Play,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';

import { FigmaApiService } from '../../services/figmaApi';
import { FigmaFile } from '../../types/figma';
import { OptimizedFigmaInfoDisplay } from './OptimizedFigmaInfoDisplay';

// --- Zod validációs séma aszinkron API kulcs validációval ---
const figmaFormSchema = z.object({
  figmaUrl: z
    .string()
    .url('Érvényes URL szükséges')
    .refine(
      (url) =>
        url.includes('figma.com/file/') || url.includes('figma.com/design/'),
      'A URL-nek Figma fájl vagy design linknek kell lennie'
    ),
  apiKey: z
    .string()
    .min(1, 'API kulcs szükséges')
    .refine((key) => {
      // Synchronous validation only - check format
      return /^figd_[A-Za-z0-9_-]{30,50}$/.test(key.trim());
    }, 'Érvénytelen Figma API kulcs formátum'),
});

type FigmaFormData = z.infer<typeof figmaFormSchema>;

// --- Upload komponens külön fájlban lehet, itt egyszerű megvalósítás ---
interface FileUploadProps {
  onFileRead: (fileContent: string) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileRead, disabled }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.fig')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onFileRead(reader.result);
        }
      };
      reader.readAsText(file);
    } else {
      toast.error('Csak .fig kiterjesztésű fájlokat fogadunk el.');
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'
      } transition-colors`}
      aria-disabled={disabled}
    >
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Húzd ide a Figma fájlt</h3>
      <p className="text-gray-500 mb-4">Vagy kattints a tallózáshoz (.fig fájl)</p>
      <input
        type="file"
        accept=".fig"
        onChange={handleFileChange}
        disabled={disabled}
        aria-label="Figma fájl feltöltése"
        className="hidden"
        id="figma-file-upload"
      />
      <label
        htmlFor="figma-file-upload"
        className="inline-block px-4 py-2 border border-gray-300 rounded-md cursor-pointer text-gray-700 hover:bg-gray-100"
      >
        Fájl Kiválasztása
      </label>
    </div>
  );
};

export function FigmaGenerator() {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [isProcessing, setIsProcessing] = useState(false);
  const [figmaData, setFigmaData] = useState<FigmaFile | null>(null);
  const [fileKey, setFileKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const form = useForm<FigmaFormData>({
    resolver: zodResolver(figmaFormSchema),
    mode: 'onBlur',
    defaultValues: {
      figmaUrl: '',
      apiKey: '',
    },
  });

  // --- Aszinkron API kulcs validáció futtatása manuálisan (React Hook Form nem támogatja jól async refine-t) ---
  const validateApiKeyAsync = useCallback(
    async (key: string) => {
      try {
        const service = new FigmaApiService();
        return service.validateToken(key);
      } catch {
        return false;
      }
    },
    []
  );

  // --- Submit handler ---
  const onSubmit = useCallback(
    async (data: FigmaFormData) => {
      setError(null);
      setFigmaData(null);
      setIsProcessing(true);

      // AbortController létrehozása a lekérdezés megszakításához
      const controller = new AbortController();
      setAbortController(controller);

      try {
        // API kulcs ellenőrzése aszinkron módon (ha szükséges)
        const apiClient = new FigmaApiService(data.apiKey);

        // API kapcsolat validálása (skip in development mock mode)
        if (process.env.NODE_ENV !== 'development') {
          const isValidConnection = await apiClient.testConnection();
          if (!isValidConnection) {
            throw new Error('Érvénytelen API kulcs vagy nincs hozzáférés a Figma API-hoz');
          }
        }

        // Fájl kulcs kinyerése
        const extractedFileKey = apiClient.extractFileId(data.figmaUrl);
        if (!extractedFileKey) {
          throw new Error('Érvénytelen Figma URL');
        }

        // Figma fájl lekérése
        const figmaFileData = await apiClient.getFile(extractedFileKey);

        if (!figmaFileData.document) {
          throw new Error('A Figma fájl nem tartalmaz document struktúrát');
        }

        setFigmaData(figmaFileData);
        setFileKey(extractedFileKey);
        
        if (process.env.NODE_ENV === 'development') {
          toast.success('Mock Figma fájl betöltve (fejlesztési mód)!');
        } else {
          toast.success('Figma fájl sikeresen lekérve!');
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          toast.info('Lekérdezés megszakítva.');
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Ismeretlen hiba történt';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        setIsProcessing(false);
        setAbortController(null);
      }
    },
    []
  );

  // --- Fájl feltöltés feldolgozása (feltételezve, hogy a fájl tartalmaz URL-t vagy fileKey-t) ---
  const handleFileRead = useCallback(
    (fileContent: string) => {
      // Itt lehet értelmezni a fájl tartalmát, pl. JSON parse, vagy URL kinyerés
      // Jelen példában csak toast-oljuk és visszatérünk a URL tabra
      toast.info('Fájl beolvasva, de a feldolgozás még nincs implementálva.');
    },
    []
  );

  // --- Vissza gomb kezelése ---
  const handleBackToForm = useCallback(() => {
    setFigmaData(null);
    setFileKey('');
    setError(null);
    form.reset();
  }, [form]);

  // --- Lekérdezés megszakítása ---
  const handleAbort = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  // --- Memoizált gomb tartalom ---
  const submitButtonContent = useMemo(() => {
    if (isProcessing) {
      return (
        <div className="flex items-center space-x-2" aria-live="polite" aria-busy="true">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          <span>Információk lekérdezése...</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2">
        <Play className="w-5 h-5" />
        <span>Információk Lekérdezése</span>
      </div>
    );
  }, [isProcessing]);

  // --- Ha van eredmény, megjelenítés ---
  if (figmaData) {
    return (
      <main className="max-w-6xl mx-auto p-6 space-y-8" role="main">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Figma Fájl Információk
            </h1>
            <p className="text-xl text-gray-600 mt-2">Részletes információk a Figma fájlról</p>
          </div>
          <Button
            onClick={handleBackToForm}
            variant="outline"
            className="flex items-center space-x-2"
            aria-label="Vissza az űrlaphoz"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vissza</span>
          </Button>
        </header>
        <OptimizedFigmaInfoDisplay figmaData={figmaData} fileKey={fileKey} />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8" role="main">
      <section className="text-center space-y-4" aria-label="Bevezető szöveg">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Figma-to-Code Generátor
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Figma fájl információk lekérdezése és megjelenítése
        </p>
      </section>

      {/* Input Form */}
      <section
        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        aria-label="Figma fájl lekérdező űrlap"
      >
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-8 space-y-6"
          aria-describedby="form-error"
          noValidate
        >
          <Tabs value={activeTab} onValueChange={(value: 'url' | 'upload') => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-2" role="tablist">
              <TabsTrigger
                value="url"
                className="flex items-center space-x-2"
                role="tab"
                aria-selected={activeTab === 'url'}
                tabIndex={activeTab === 'url' ? 0 : -1}
              >
                <Link className="w-4 h-4" aria-hidden="true" />
                <span>Figma URL</span>
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="flex items-center space-x-2"
                role="tab"
                aria-selected={activeTab === 'upload'}
                tabIndex={activeTab === 'upload' ? 0 : -1}
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span>Fájl Feltöltés</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4" role="tabpanel" tabIndex={0}>
              <div className="space-y-2">
                <Label htmlFor="figmaUrl">Figma Fájl URL</Label>
                <Input
                  id="figmaUrl"
                  placeholder="https://www.figma.com/file/... vagy https://www.figma.com/design/..."
                  {...form.register('figmaUrl', { disabled: isProcessing })}
                  aria-invalid={!!form.formState.errors.figmaUrl}
                  aria-describedby="figmaUrl-error"
                  disabled={isProcessing}
                />
                {form.formState.errors.figmaUrl && (
                  <p
                    id="figmaUrl-error"
                    className="text-sm text-red-600 flex items-center space-x-1"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    <span>{form.formState.errors.figmaUrl.message}</span>
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Támogatott formátumok: Figma fájl linkek (/file/) és design linkek (/design/)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">Figma API Kulcs</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="figd_..."
                  {...form.register('apiKey', { disabled: isProcessing })}
                  aria-invalid={!!form.formState.errors.apiKey}
                  aria-describedby="apiKey-error"
                  disabled={isProcessing}
                />
                {form.formState.errors.apiKey && (
                  <p
                    id="apiKey-error"
                    className="text-sm text-red-600 flex items-center space-x-1"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    <span>{form.formState.errors.apiKey.message}</span>
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Szerezd be a tokened: Figma → Account Settings → Personal Access Tokens
                </p>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4" role="tabpanel" tabIndex={0}>
              <FileUpload onFileRead={handleFileRead} disabled={isProcessing} />
            </TabsContent>
          </Tabs>

          {/* Generate Button és Abort */}
          <div className="pt-6 border-t border-gray-200 flex space-x-4 items-center">
            <Button
              type="submit"
              disabled={isProcessing}
              className="flex-grow bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-lg font-semibold"
              aria-disabled={isProcessing}
              aria-live="polite"
            >
              {submitButtonContent}
            </Button>
            {isProcessing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleAbort}
                aria-label="Lekérdezés megszakítása"
              >
                <XCircle className="w-5 h-5" />
                Megszakítás
              </Button>
            )}
          </div>
        </form>
      </section>

      {/* Error Display */}
      {error && (
        <section
          id="form-error"
          className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center space-x-2 text-red-800 font-medium">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
            <span>Hiba történt:</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </section>
      )}
    </main>
  );
}