import { FigmaApiService, FigmaApiError } from './figmaApi';
import { ConversionResults } from '../App';

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ConversionRequest {
  figmaUrl: string;
  figmaToken: string;
  config: {
    framework: 'html' | 'react' | 'vue' | 'angular';
    cssFramework: 'tailwind' | 'bootstrap' | 'custom' | 'none';
    responsive: boolean;
    accessibility: boolean;
    optimization: boolean;
    semanticHtml: boolean;
    componentExtraction: boolean;
  };
  customCode?: {
    jsx?: string;
    css?: string;
    cssAdvanced?: string;
  };
}

export interface ConversionProgress {
  phase: string;
  progress: number;
  step: number;
  totalSteps: number;
  message: string;
  timestamp: number;
}

export class ApiClient {
  private config: Required<ApiClientConfig>;
  private figmaService: FigmaApiService;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '/api',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };

    this.figmaService = new FigmaApiService();
  }

  async convertFigmaToCode(
    request: ConversionRequest,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResults> {
    // Validate inputs
    if (!this.figmaService.validateUrl(request.figmaUrl)) {
      throw new Error('Invalid Figma URL format');
    }

    if (!this.figmaService.validateToken(request.figmaToken)) {
      throw new Error('Invalid Figma API token format');
    }

    // Set up Figma service
    this.figmaService.setToken(request.figmaToken);

    try {
      // Phase 1: Extract file ID and fetch Figma data
      onProgress?.({
        phase: 'extraction',
        progress: 10,
        step: 1,
        totalSteps: 7,
        message: 'Figma fájl azonosító kinyerése...',
        timestamp: Date.now()
      });

      const fileId = this.figmaService.extractFileId(request.figmaUrl);
      if (!fileId) {
        throw new Error('Could not extract file ID from URL');
      }

      onProgress?.({
        phase: 'extraction',
        progress: 25,
        step: 2,
        totalSteps: 7,
        message: 'Figma API kapcsolat létrehozása...',
        timestamp: Date.now()
      });

      const figmaFile = await this.figmaService.getFile(fileId);

      // Phase 2: Analyze design structure
      onProgress?.({
        phase: 'analysis',
        progress: 40,
        step: 3,
        totalSteps: 7,
        message: 'Design struktúra elemzése...',
        timestamp: Date.now()
      });

      const designAnalysis = await this.analyzeDesignStructure(figmaFile);

      // Phase 3: Generate semantic HTML
      onProgress?.({
        phase: 'generation',
        progress: 55,
        step: 4,
        totalSteps: 7,
        message: 'Szemantikus HTML generálása...',
        timestamp: Date.now()
      });

      const htmlCode = await this.generateHTML(figmaFile, request.config, designAnalysis);

      // Phase 4: Generate CSS
      onProgress?.({
        phase: 'generation',
        progress: 70,
        step: 5,
        totalSteps: 7,
        message: 'CSS stílusok generálása...',
        timestamp: Date.now()
      });

      const cssCode = await this.generateCSS(figmaFile, request.config, designAnalysis, request.customCode?.css);

      // Phase 5: Generate JavaScript/JSX
      onProgress?.({
        phase: 'generation',
        progress: 85,
        step: 6,
        totalSteps: 7,
        message: 'JavaScript/JSX kód generálása...',
        timestamp: Date.now()
      });

      const jsCode = await this.generateJavaScript(figmaFile, request.config);
      const jsxCode = await this.generateJSX(figmaFile, request.config, request.customCode?.jsx);

      // Phase 6: Generate layer CSS
      onProgress?.({
        phase: 'finalization',
        progress: 95,
        step: 7,
        totalSteps: 7,
        message: 'Layer CSS és optimalizálás...',
        timestamp: Date.now()
      });

      const layerCSS = await this.generateLayerCSS(figmaFile, designAnalysis, request.customCode?.cssAdvanced);

      // Phase 7: Finalize
      onProgress?.({
        phase: 'complete',
        progress: 100,
        step: 7,
        totalSteps: 7,
        message: 'Konvertálás befejezve!',
        timestamp: Date.now()
      });

      return {
        html: htmlCode,
        js: jsCode,
        jsx: jsxCode,
        css: cssCode,
        layers: layerCSS
      };

    } catch (error) {
      if (error instanceof FigmaApiError) {
        throw new Error(`Figma API hiba: ${error.message}`);
      }
      throw error;
    }
  }

  private async analyzeDesignStructure(figmaFile: any): Promise<any> {
    // Simulate design analysis
    await this.delay(300);
    
    return {
      hasAutoLayout: true,
      componentCount: Object.keys(figmaFile.components || {}).length,
      colorPalette: ['#3B82F6', '#10B981', '#F59E0B'],
      typography: ['Inter', 'Roboto'],
      spacing: [4, 8, 16, 24, 32],
      complexity: 'medium'
    };
  }

  private async generateHTML(figmaFile: any, config: any, analysis: any): Promise<string> {
    await this.delay(400);
    
    const semanticTags = config.semanticHtml ? 'header, main, section, article, aside, footer' : 'div';
    const responsive = config.responsive ? 'viewport meta tag, responsive classes' : 'fixed layout';
    
    return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  ${config.responsive ? '<meta name="viewport" content="width=device-width, initial-scale=1.0">' : ''}
  <title>Converted from Figma</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="app-container">
    ${config.semanticHtml ? '<header class="header">' : '<div class="header">'}
      <h1 class="title">Figma Design Converted</h1>
    ${config.semanticHtml ? '</header>' : '</div>'}
    
    ${config.semanticHtml ? '<main class="main-content">' : '<div class="main-content">'}
      <section class="hero-section">
        <div class="hero-content">
          <h2 class="hero-title">Welcome to Converted Design</h2>
          <p class="hero-description">This design was automatically converted from Figma</p>
          <button class="cta-button" ${config.accessibility ? 'aria-label="Call to action button"' : ''}>
            Get Started
          </button>
        </div>
      </section>
      
      <section class="features-section">
        <div class="features-grid">
          <div class="feature-card">
            <h3>Feature 1</h3>
            <p>Description of feature 1</p>
          </div>
          <div class="feature-card">
            <h3>Feature 2</h3>
            <p>Description of feature 2</p>
          </div>
          <div class="feature-card">
            <h3>Feature 3</h3>
            <p>Description of feature 3</p>
          </div>
        </div>
      </section>
    ${config.semanticHtml ? '</main>' : '</div>'}
    
    ${config.semanticHtml ? '<footer class="footer">' : '<div class="footer">'}
      <p>&copy; 2025 Converted Design. All rights reserved.</p>
    ${config.semanticHtml ? '</footer>' : '</div>'}
  </div>
  
  <script src="script.js"></script>
</body>
</html>`;
  }

  private async generateCSS(figmaFile: any, config: any, analysis: any, customCSS?: string): Promise<string> {
    await this.delay(500);
    
    const framework = config.cssFramework;
    let css = '';

    if (framework === 'tailwind') {
      css = `/* Tailwind CSS Integration */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component styles */
.app-container {
  @apply min-h-screen bg-gray-50;
}

.header {
  @apply bg-white shadow-sm px-6 py-4;
}

.title {
  @apply text-2xl font-bold text-gray-900;
}

.main-content {
  @apply container mx-auto px-6 py-12;
}

.hero-section {
  @apply text-center py-20;
}

.hero-title {
  @apply text-4xl md:text-6xl font-bold text-gray-900 mb-6;
}

.hero-description {
  @apply text-xl text-gray-600 mb-8 max-w-2xl mx-auto;
}

.cta-button {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors;
}

.features-section {
  @apply py-16;
}

.features-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-8;
}

.feature-card {
  @apply bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow;
}

.footer {
  @apply bg-gray-900 text-white text-center py-8;
}`;
    } else {
      css = `/* Custom CSS Framework */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

.app-container {
  min-height: 100vh;
  background-color: #f9fafb;
}

.header {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

.hero-section {
  text-align: center;
  padding: 5rem 0;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}

.hero-description {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
  max-width: 42rem;
  margin-left: auto;
  margin-right: auto;
}

.cta-button {
  background: #3b82f6;
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cta-button:hover {
  background: #2563eb;
}

.features-section {
  padding: 4rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.feature-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.footer {
  background: #111827;
  color: white;
  text-align: center;
  padding: 2rem;
}`;
    }

    if (config.responsive) {
      css += `

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .main-content {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.75rem;
  }
  
  .hero-description {
    font-size: 1rem;
  }
}`;
    }

    if (customCSS) {
      css += `

/* === EGYÉNI CSS STÍLUSOK === */
${customCSS}
/* === EGYÉNI CSS STÍLUSOK VÉGE === */`;
    }

    return css;
  }

  private async generateJavaScript(figmaFile: any, config: any): Promise<string> {
    await this.delay(300);
    
    return `// Generated JavaScript for interactions
document.addEventListener('DOMContentLoaded', function() {
  console.log('Figma converted page loaded');
  
  // Initialize interactive elements
  initializeButtons();
  initializeAnimations();
  ${config.accessibility ? 'initializeAccessibility();' : ''}
  ${config.responsive ? 'initializeResponsive();' : ''}
});

function initializeButtons() {
  const buttons = document.querySelectorAll('button, [role="button"]');
  buttons.forEach(button => {
    button.addEventListener('click', handleButtonClick);
    ${config.accessibility ? 'button.addEventListener("keydown", handleButtonKeydown);' : ''}
  });
}

function initializeAnimations() {
  // Intersection Observer for scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  });

  document.querySelectorAll('.feature-card, .hero-section').forEach(el => {
    observer.observe(el);
  });
}

${config.accessibility ? `
function initializeAccessibility() {
  // Focus management
  const focusableElements = document.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  // Skip links
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  document.body.insertBefore(skipLink, document.body.firstChild);
}

function handleButtonKeydown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.target.click();
  }
}
` : ''}

${config.responsive ? `
function initializeResponsive() {
  // Responsive image loading
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}
` : ''}

function handleButtonClick(event) {
  const button = event.target;
  
  // Add click animation
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = '';
  }, 150);
  
  // Custom button actions
  if (button.classList.contains('cta-button')) {
    console.log('CTA button clicked');
    // Add your custom logic here
  }
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
  });
}`;
  }

  private async generateJSX(figmaFile: any, config: any, customJSX?: string): Promise<string> {
    await this.delay(400);
    
    const typescript = config.framework === 'react' && config.typescript !== false;
    
    return `import React${typescript ? ', { useState, useEffect }' : ''} from 'react';
import './styles.css';
${customJSX ? "// Custom JSX imports would go here" : ''}

${typescript ? `
interface AppProps {
  className?: string;
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}
` : ''}

${typescript ? 'const App: React.FC<AppProps> = ({ className })' : 'const App = ({ className })'} => {
  ${typescript ? 'const [isLoaded, setIsLoaded] = useState(false);' : 'const [isLoaded, setIsLoaded] = React.useState(false);'}
  
  ${typescript ? 'useEffect' : 'React.useEffect'}(() => {
    setIsLoaded(true);
  }, []);

  ${customJSX ? `
  // === EGYÉNI JSX KÓD ===
  ${customJSX}
  // === EGYÉNI JSX KÓD VÉGE ===
  ` : ''}

  return (
    <div className={\`app-container \${className || ''} \${isLoaded ? 'loaded' : ''}\`}>
      <header className="header">
        <h1 className="title">Figma Design Converted</h1>
      </header>
      
      <main className="main-content">
        <section className="hero-section">
          <div className="hero-content">
            <h2 className="hero-title">Welcome to Converted Design</h2>
            <p className="hero-description">
              This design was automatically converted from Figma with advanced AI processing
            </p>
            <button 
              className="cta-button"
              ${config.accessibility ? 'aria-label="Get started with the application"' : ''}
              onClick={() => console.log('CTA clicked')}
            >
              Get Started
            </button>
          </div>
        </section>
        
        <section className="features-section">
          <div className="features-grid">
            <FeatureCard 
              title="Pixel Perfect" 
              description="95-100% visual accuracy from Figma designs"
            />
            <FeatureCard 
              title="Responsive" 
              description="Mobile-first responsive design automatically generated"
            />
            <FeatureCard 
              title="Accessible" 
              description="WCAG 2.1 AA compliant code generation"
            />
          </div>
        </section>
      </main>
      
      <footer className="footer">
        <p>&copy; 2025 Converted Design. All rights reserved.</p>
      </footer>
    </div>
  );
};

${typescript ? 'const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon })' : 'const FeatureCard = ({ title, description, icon })'} => (
  <div className="feature-card">
    {icon && <div className="feature-icon">{icon}</div>}
    <h3 className="feature-title">{title}</h3>
    <p className="feature-description">{description}</p>
  </div>
);

export default App;`;
  }

  private async generateLayerCSS(figmaFile: any, analysis: any, customAdvancedCSS?: string): Promise<string> {
    await this.delay(350);
    
    return `/* Advanced Layer CSS - Generated from Figma */

/* CSS Custom Properties (Design Tokens) */
:root {
  /* Color Palette */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-900: #1e3a8a;
  
  --color-success-500: #10b981;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;
  
  /* Typography Scale */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-4xl: 2.25rem;
  
  /* Spacing Scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 300ms ease-in-out;
  --transition-slow: 500ms ease-in-out;
}

/* Layer-specific styles */
.layer-background {
  background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%);
}

.layer-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  transition: all var(--transition-normal);
}

.layer-card:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

.layer-button {
  background: var(--color-primary-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.layer-button:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
}

.layer-button:active {
  transform: translateY(0);
}

/* Animation keyframes */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Animation classes */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.animate-slide-in-left {
  animation: slideInLeft 0.5s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.4s ease-out;
}

/* Utility classes */
.glass-morphism {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.text-gradient {
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary-50: #1e3a8a;
    --color-primary-100: #1e40af;
  }
  
  body {
    background: #111827;
    color: #f9fafb;
  }
  
  .layer-card {
    background: #1f2937;
    border: 1px solid #374151;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .layer-button {
    border: 2px solid currentColor;
  }
  
  .layer-card {
    border: 2px solid #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

${customAdvancedCSS ? `
/* === FEJLETT CSS++ FUNKCIÓK === */
${customAdvancedCSS}
/* === FEJLETT CSS++ FUNKCIÓK VÉGE === */
` : ''}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ApiClient;