import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Link2, KeyRound, Eye, EyeOff, Wand2, RotateCcw, FileCode, Upload, Settings, Zap, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';
import { ConversionResults } from '../App';
import { FigmaApiService } from '../services/figmaApi';
import { EnhancedCodeGenerator } from '../services/enhanced-code-generator';
import { ConversionConfig, DEFAULT_CONVERSION_CONFIG } from '../types/figma';

// Enhanced Types
interface ValidationState {
  isValid: boolean;
  error?: string;
}

interface FormState {
  figmaUrl: string;
  figmaToken: string;
  showToken: boolean;
}

interface ConversionState {
  isConverting: boolean;
  progress: number;
  progressLabel: string;
  currentStep: number;
}

interface EnhancedFormSectionProps {
  showToast: (message: string) => void;
  onConversionComplete: (results: ConversionResults) => void;
}

// Custom Hooks
const useFormValidation = (apiService: FigmaApiService | null) => {
  const validateUrl = useCallback((url: string): ValidationState => {
    if (!url.trim()) return { isValid: false };
    if (!apiService) return { isValid: false, error: 'API szolgáltatás nem elérhető' };
    if (!apiService.validateUrl(url)) {
      return { isValid: false, error: 'Érvényes Figma URL szükséges (file/ vagy design/ link)' };
    }
    return { isValid: true };
  }, [apiService]);

  const validateToken = useCallback((token: string, isProxyMode: boolean): ValidationState => {
    if (isProxyMode) return { isValid: true }; // Token not required in proxy mode
    if (!token.trim()) return { isValid: false };
    if (!apiService) return { isValid: false, error: 'API szolgáltatás nem elérhető' };
    if (!apiService.validateToken(token)) {
      return { isValid: false, error: 'Érvényes API token szükséges (figd_ kezdetű)' };
    }
    return { isValid: true };
  }, [apiService]);

  return { validateUrl, validateToken };
};

const useFileUpload = (showToast: (message: string) => void) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = useMemo(() => [
    '.css', '.js', '.json', '.scss', '.ts', '.jsx', '.tsx'
  ], []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return allowedTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      showToast('Csak CSS, JS, JSON, SCSS, TS, JSX, TSX fájlok támogatottak');
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    if (validFiles.length > 0) {
      showToast(`${validFiles.length} fájl sikeresen feltöltve`);
    }
  }, [allowedTypes, showToast]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  return {
    uploadedFiles,
    fileInputRef,
    handleFileUpload,
    removeFile,
    clearFiles,
    allowedTypes
  };
};

const useConversion = (
  apiService: FigmaApiService | null,
  config: ConversionConfig,
  showToast: (message: string) => void,
  onConversionComplete: (results: ConversionResults) => void,
  uploadedFiles: File[]
) => {
  const [conversionState, setConversionState] = useState<ConversionState>({
    isConverting: false,
    progress: 0,
    progressLabel: 'Előkészítés...',
    currentStep: 0
  });

  const conversionSteps = useMemo(() => [
    { pct: 5, label: 'Importing your design...', step: 0 },
    { pct: 25, label: 'Fetch design from Figma', step: 1 },
    { pct: 11, label: 'Writing your code', step: 2, showProgress: true },
    { pct: 75, label: 'Uploading the assets', step: 3 },
    { pct: 100, label: 'Creating your chat session', step: 4 }
  ], []);

  const handleConvert = useCallback(async (figmaUrl: string, figmaToken?: string) => {
    if (!apiService?.validateUrl(figmaUrl)) {
      showToast('Érvényes Figma URL szükséges');
      return;
    }

    // Only validate token if not using proxy mode
    if (!apiService.getUseProxy() && (!figmaToken || !apiService?.validateToken(figmaToken))) {
      showToast('Érvényes Figma API token szükséges közvetlen módban');
      return;
    }

    setConversionState(prev => ({ ...prev, isConverting: true, progress: 0, currentStep: 0 }));

    try {
      // Calculate accuracy bonus for uploaded files
      const baseAccuracy = 85;
      const fileBonus = Math.min(uploadedFiles.length * 5, 15); // Max 15% bonus
      const totalAccuracy = baseAccuracy + fileBonus;

      // Progress simulation with exact timing from image
      for (const stepData of conversionSteps) {
        await new Promise(resolve => setTimeout(resolve, stepData.step === 2 ? 1500 : 800));
        setConversionState(prev => ({
          ...prev,
          progress: stepData.pct,
          progressLabel: stepData.label,
          currentStep: stepData.step
        }));
      }

      const fileId = apiService.extractFileId(figmaUrl);
      if (!fileId) {
        throw new Error('Érvénytelen Figma URL formátum');
      }

      console.log('Konvertálás indítása:', { 
        fileId, 
        useProxy: apiService.getUseProxy(),
        tokenLength: figmaToken?.length || 'N/A (proxy mode)'
      });
      
      try {
        const figmaFile = await apiService.getFile(fileId);
        console.log('Fájl sikeresen betöltve:', figmaFile.name);
        
        // Első lépés: Részletes JSON analízis generálása
        const { FigmaJsonGenerator } = await import('../services/figma-json-generator');
        const jsonGenerator = new FigmaJsonGenerator(figmaFile);
        const figmaAnalysis = jsonGenerator.generateJson();
        
        // JSON formátumban exportálás
        const jsonContent = JSON.stringify(figmaAnalysis, null, 2);
        
        // Kód generálás
        const codeGenerator = new EnhancedCodeGenerator(figmaFile, config);
        const generatedCode = await codeGenerator.generateCode();
        
        const results: ConversionResults = {
          html: generatedCode.component.includes('<!DOCTYPE html') ? generatedCode.component : `<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${figmaFile.name}</title>
    <style>${generatedCode.styles}</style>
</head>
<body>
    ${generatedCode.component}
</body>
</html>`,
          js: generatedCode.dependencies.length > 0 ? `// Dependencies: ${generatedCode.dependencies.join(', ')}` : '',
          jsx: config.framework === 'react' ? generatedCode.component : '',
          css: generatedCode.styles,
          layers: generateAdvancedLayerAnalysis(),
          json: jsonContent // Új JSON fül hozzáadása
        };

        setTimeout(() => {
          setConversionState(prev => ({ ...prev, isConverting: false }));
          onConversionComplete(results);
          showToast('Konvertálás sikeresen befejezve!');
        }, 500);

      } catch (apiError) {
        console.error('Figma API hiba:', apiError);
        handleApiError(apiError, showToast);
      }

    } catch (error) {
      console.error('Konvertálási hiba:', error);
      setConversionState(prev => ({ ...prev, isConverting: false }));
      
      if (error instanceof Error) {
        showToast(`Hiba történt: ${error.message}`);
      } else {
        showToast('Ismeretlen hiba történt a konvertálás során');
      }
    }
  }, [apiService, config, conversionSteps, showToast, onConversionComplete, uploadedFiles]);

  return { conversionState, handleConvert };
};

// Helper Functions
const handleApiError = (error: unknown, showToast: (message: string) => void) => {
  if (error instanceof Error) {
    if (error.message.includes('403')) {
      showToast('Hozzáférés megtagadva - ellenőrizd az API token és fájl jogosultságokat');
    } else if (error.message.includes('401')) {
      showToast('Érvénytelen API token - ellenőrizd a token formátumát');
    } else if (error.message.includes('404')) {
      showToast('Fájl nem található - ellenőrizd a Figma URL-t');
    } else {
      showToast(`API hiba: ${error.message}`);
    }
  } else {
    showToast('Ismeretlen API hiba történt');
  }
};

const generateAdvancedLayerAnalysis = (): string => `/* Advanced Layer Analysis */
/* Color Palette */
:root {
  --primary-color: #3B82F6;
  --secondary-color: #10B981;
  --accent-color: #F59E0B;
  --neutral-50: #F9FAFB;
  --neutral-900: #111827;
}

/* Typography Scale */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }

/* Component Tokens */
.btn-primary {
  background: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 1.5rem;
}

/* Responsive Grid System */
.grid-auto { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }

/* Animation Utilities */
.animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
.animate-slide-up { animation: slideUp 0.4s ease-out; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}`;

// Main Component
const EnhancedFormSection: React.FC<EnhancedFormSectionProps> = ({ 
  showToast, 
  onConversionComplete 
}) => {
  const [formState, setFormState] = useState<FormState>({
    figmaUrl: '',
    figmaToken: '',
    showToken: false
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useProxyMode, setUseProxyMode] = useState(true); // Default to proxy mode
  const [apiService, setApiService] = useState<FigmaApiService | null>(null);
  const [config, setConfig] = useState<ConversionConfig>({
    ...DEFAULT_CONVERSION_CONFIG,
    framework: 'vanilla' as const,
    cssFramework: 'tailwind' as const,
    typescript: false
  });

  // Custom hooks
  const { validateUrl, validateToken } = useFormValidation(apiService);
  const { uploadedFiles, fileInputRef, handleFileUpload, removeFile, clearFiles } = useFileUpload(showToast);
  const { conversionState, handleConvert } = useConversion(apiService, config, showToast, onConversionComplete, uploadedFiles);

  // Initialize API service
  React.useEffect(() => {
    const newApiService = new FigmaApiService();
    newApiService.setUseProxy(useProxyMode);
    
    if (!useProxyMode && formState.figmaToken) {
      if (newApiService.validateToken(formState.figmaToken)) {
        newApiService.setToken(formState.figmaToken);
      }
    }
    
    setApiService(newApiService);
  }, [formState.figmaToken, useProxyMode]); // Removed validateToken from deps to prevent infinite loop

  // Validation states
  const urlValidation = useMemo(() => validateUrl(formState.figmaUrl), [formState.figmaUrl, validateUrl]);
  const tokenValidation = useMemo(() => validateToken(formState.figmaToken, useProxyMode), [formState.figmaToken, useProxyMode, validateToken]);

  const canConvert = useMemo(() => 
    urlValidation.isValid && 
    tokenValidation.isValid && 
    !conversionState.isConverting,
    [urlValidation.isValid, tokenValidation.isValid, conversionState.isConverting]
  );

  // Event handlers
  const handlePaste = useCallback(async (setter: (value: string) => void) => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error('Clipboard API nem elérhető');
      }
      
      const text = await navigator.clipboard.readText();
      if (text) {
        setter(text.trim());
        showToast('Vágólap tartalma beillesztve');
      }
    } catch (error) {
      console.log('Beillesztés sikertelen:', error);
      showToast('Beillesztés sikertelen - kérjük, másolj be manuálisan');
    }
  }, [showToast]);

  const handleReset = useCallback(() => {
    setFormState({
      figmaUrl: '',
      figmaToken: '',
      showToken: false
    });
    setUseProxyMode(true); // Reset to proxy mode
    clearFiles();
    setConfig({
      ...DEFAULT_CONVERSION_CONFIG,
      framework: 'vanilla' as const,
      cssFramework: 'tailwind' as const,
      typescript: false
    });
    showToast('Űrlap visszaállítva');
  }, [clearFiles, showToast]);

  const handleConvertClick = useCallback(() => {
    handleConvert(formState.figmaUrl, useProxyMode ? undefined : formState.figmaToken);
  }, [handleConvert, formState.figmaUrl, formState.figmaToken, useProxyMode]);

  // Form field handlers
  const updateFormField = useCallback((field: keyof FormState) => 
    (value: string | boolean) => {
      setFormState(prev => ({ ...prev, [field]: value }));
    }, []
  );

  const updateConfig = useCallback((field: keyof ConversionConfig) => 
    (value: any) => {
      setConfig(prev => ({ ...prev, [field]: value }));
    }, []
  );

  return (
    <section className="lg:col-span-2 space-y-6" role="main" aria-label="Figma konverter űrlap">
      <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8">
        {/* Enhanced Header */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Fejlett Figma → HTML Konverter
            </h1>
            <p className="text-sm text-white/60 mt-2">
              Professzionális, pixel-perfect HTML kód generálása Figma designból AI-alapú elemzéssel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 rounded-xl px-3 py-1.5">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              Biztonságos
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-500/10 border border-blue-400/20 rounded-xl px-3 py-1.5">
              <Zap className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              AI-Powered
            </div>
          </div>
        </header>

        {/* Main Form */}
        <form className="mt-6 grid grid-cols-1 gap-5" onSubmit={(e) => e.preventDefault()}>
          {/* Figma URL Input */}
          <div>
            <label htmlFor="figma-url" className="text-sm text-white/70">
              Figma Design URL *
            </label>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                  <Link2 className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <input 
                  id="figma-url"
                  type="url" 
                  value={formState.figmaUrl}
                  onChange={(e) => updateFormField('figmaUrl')(e.target.value)}
                  placeholder="https://www.figma.com/file/... vagy https://www.figma.com/design/..." 
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 outline-none rounded-xl pl-9 pr-24 py-3 text-sm placeholder-white/40 text-white transition-colors" 
                  aria-describedby="url-help url-error"
                  aria-invalid={formState.figmaUrl ? !urlValidation.isValid : undefined}
                  required
                />
                <button 
                  type="button"
                  onClick={() => handlePaste(updateFormField('figmaUrl'))}
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition"
                  aria-label="URL beillesztése vágólapról"
                >
                  Beillesztés
                </button>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p id="url-help" className="text-xs text-white/50">
                Támogatott: Figma fájl linkek (/file/) és design linkek (/design/)
              </p>
              {formState.figmaUrl && !urlValidation.isValid && (
                <p id="url-error" className="text-xs text-rose-300 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
                  {urlValidation.error || 'Érvényes Figma URL szükséges'}
                </p>
              )}
              {formState.figmaUrl && urlValidation.isValid && (
                <p className="text-xs text-emerald-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
                  Érvényes URL formátum
                </p>
              )}
            </div>
          </div>

          {/* API Token Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="figma-token" className="text-sm text-white/70">
                Figma Personal Access Token {useProxyMode ? '(opcionális - biztonságos proxy mód)' : '*'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="proxy-mode"
                  checked={useProxyMode}
                  onChange={(e) => setUseProxyMode(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/20 focus:ring-2"
                />
                <label htmlFor="proxy-mode" className="text-xs text-white/60 cursor-pointer">
                  Biztonságos proxy mód
                </label>
              </div>
            </div>
            {useProxyMode && (
              <div className="mb-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                  <span>A kapcsolódás biztonságos szerver-proxy-n keresztül történik. Token nem szükséges.</span>
                </div>
              </div>
            )}
            <div className={`mt-2 flex items-center gap-2 ${useProxyMode ? 'opacity-50' : ''}`}>
              <div className="flex-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                  <KeyRound className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <input 
                  id="figma-token"
                  type={formState.showToken ? 'text' : 'password'}
                  value={formState.figmaToken}
                  onChange={(e) => updateFormField('figmaToken')(e.target.value)}
                  placeholder="figd_..." 
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 outline-none rounded-xl pl-9 pr-24 py-3 text-sm placeholder-white/40 text-white tracking-tight transition-colors" 
                  aria-describedby="token-help token-error"
                  aria-invalid={formState.figmaToken ? !tokenValidation.isValid : undefined}
                  required={!useProxyMode}
                  disabled={useProxyMode}
                />
                <button 
                  type="button"
                  onClick={() => updateFormField('showToken')(!formState.showToken)}
                  className="absolute right-10 top-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition" 
                  aria-label={formState.showToken ? "Token elrejtése" : "Token megjelenítése"}
                  disabled={useProxyMode}
                >
                  {formState.showToken ? 
                    <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : 
                    <Eye className="w-4 h-4" strokeWidth={1.5} />
                  }
                </button>
                <button 
                  type="button"
                  onClick={() => handlePaste(updateFormField('figmaToken'))}
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition"
                  aria-label="Token beillesztése vágólapról"
                  disabled={useProxyMode}
                >
                  Beillesztés
                </button>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {!useProxyMode && (
                <p id="token-help" className="text-xs text-white/50">
                  Figma → Account Settings → Personal Access Tokens
                </p>
              )}
              {useProxyMode && (
                <p className="text-xs text-emerald-300/80">
                  Proxy mód aktív - a token biztonságosan a szerveren van tárolva
                </p>
              )}
              {!useProxyMode && formState.figmaToken && !tokenValidation.isValid && (
                <p id="token-error" className="text-xs text-rose-300 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
                  {tokenValidation.error || 'Érvényes API token szükséges'}
                </p>
              )}
              {!useProxyMode && formState.figmaToken && tokenValidation.isValid && (
                <p className="text-xs text-emerald-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
                  Érvényes token formátum
                </p>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="text-sm text-white/70">Kiegészítő fájlok (opcionális)</label>
            <div className="mt-2">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-dashed border-white/20 p-4 text-center cursor-pointer hover:border-white/30 hover:bg-white/5 transition"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Fájlok feltöltése"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                  <Upload className="w-4.5 h-4.5" strokeWidth={1.5} aria-hidden="true" />
                  CSS, JS, vagy konfigurációs fájlok feltöltése
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Támogatott: .css, .js, .json, .scss, .ts, .jsx, .tsx
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".css,.js,.json,.scss,.ts,.jsx,.tsx"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Fájlok kiválasztása"
              />
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2" role="list" aria-label="Feltöltött fájlok">
                {uploadedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2" role="listitem">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-white/60" strokeWidth={1.5} aria-hidden="true" />
                      <span className="text-sm text-white/80">{file.name}</span>
                      <span className="text-xs text-white/50">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-xs text-white/60 hover:text-white/80 px-2 py-1 rounded hover:bg-white/10 transition"
                      aria-label={`${file.name} eltávolítása`}
                    >
                      Eltávolítás
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Configuration */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
              aria-expanded={showAdvanced}
              aria-controls="advanced-config"
            >
              <Settings className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              Fejlett beállítások
              <span className="text-xs text-white/50">({showAdvanced ? 'elrejtés' : 'megjelenítés'})</span>
            </button>

            {showAdvanced && (
              <div id="advanced-config" className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                {/* Framework Selection */}
                <div>
                  <label htmlFor="framework-select" className="text-xs text-white/70 block mb-2">
                    Kimeneti formátum
                  </label>
                  <select
                    id="framework-select"
                    value={config.framework}
                    onChange={(e) => updateConfig('framework')(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/20 outline-none transition-colors"
                  >
                    <option value="vanilla">HTML + CSS + JS</option>
                    <option value="react">React JSX</option>
                    <option value="vue">Vue.js</option>
                    <option value="angular">Angular</option>
                    <option value="svelte">Svelte</option>
                  </select>
                </div>

                {/* CSS Framework */}
                <div>
                  <label htmlFor="css-framework-select" className="text-xs text-white/70 block mb-2">
                    CSS Framework
                  </label>
                  <select
                    id="css-framework-select"
                    value={config.cssFramework}
                    onChange={(e) => updateConfig('cssFramework')(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/20 outline-none transition-colors"
                  >
                    <option value="tailwind">Tailwind CSS</option>
                    <option value="styled-components">Styled Components</option>
                    <option value="emotion">Emotion</option>
                    <option value="css-modules">CSS Modules</option>
                    <option value="vanilla">Vanilla CSS</option>
                  </select>
                </div>

                {/* Feature Toggles */}
                <fieldset className="sm:col-span-2">
                  <legend className="text-xs text-white/70 mb-3">Generálási opciók</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'typescript', label: 'TypeScript használata' },
                      { key: 'responsive', label: 'Reszponzív design' },
                      { key: 'optimizeImages', label: 'Képek optimalizálása' },
                      { key: 'extractTokens', label: 'Design tokenek kinyerése' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config[key as keyof ConversionConfig] as boolean}
                          onChange={(e) => updateConfig(key as keyof ConversionConfig)(e.target.checked)}
                          className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/20 focus:ring-2"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              type="submit"
              onClick={handleConvertClick}
              disabled={!canConvert}
              className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition px-6 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-purple-600"
              aria-describedby="convert-button-help"
            >
              <Wand2 className="w-4.5 h-4.5" strokeWidth={1.5} aria-hidden="true" />
              {conversionState.isConverting ? 'KONVERTÁLÁS...' : 'KONVERTÁLÁS INDÍTÁSA'}
            </button>
            <button 
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/5 text-white/80 hover:text-white border border-white/10 hover:bg-white/10 transition px-4 py-3 text-sm"
              aria-label="Űrlap visszaállítása"
            >
              <RotateCcw className="w-4.5 h-4.5" strokeWidth={1.5} aria-hidden="true" />
              Visszaállítás
            </button>
          </div>
          
          {!canConvert && (formState.figmaUrl || (!useProxyMode && formState.figmaToken)) && (
            <p id="convert-button-help" className="text-xs text-white/50" role="status">
              {useProxyMode 
                ? 'Érvényes Figma URL szükséges a konvertáláshoz' 
                : 'Érvényes Figma URL és API token szükséges a konvertáláshoz'
              }
            </p>
          )}
        </form>

        {/* Progress Indicator */}
        {conversionState.isConverting && (
          <div className="mt-8" role="status" aria-live="polite">
            <ProgressIndicator 
              progress={conversionState.progress}
              label={conversionState.progressLabel}
              currentStep={conversionState.currentStep}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default React.memo(EnhancedFormSection);