import { GeneratedComponent, ConversionConfig } from '../types/figma';

export interface OptimizationStrategy {
  name: string;
  description: string;
  apply: (code: string, context: OptimizationContext) => Promise<string>;
  priority: number;
  category: 'performance' | 'accessibility' | 'maintainability' | 'security';
}

export interface OptimizationContext {
  component: GeneratedComponent;
  config: ConversionConfig;
  targetFramework: string;
  performanceTargets: {
    bundleSize: number;
    renderTime: number;
    memoryUsage: number;
  };
}

export interface OptimizationResult {
  originalCode: string;
  optimizedCode: string;
  improvements: {
    bundleSizeReduction: number;
    performanceGain: number;
    accessibilityScore: number;
    maintainabilityScore: number;
  };
  appliedStrategies: string[];
  warnings: string[];
}

export class AICodeOptimizer {
  private strategies: Map<string, OptimizationStrategy> = new Map();
  private optimizationHistory: Map<string, OptimizationResult[]> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // Performance optimizations
    this.addStrategy({
      name: 'remove-unused-css',
      description: 'Remove unused CSS rules and properties',
      category: 'performance',
      priority: 9,
      apply: async (code: string, context: OptimizationContext) => {
        return this.removeUnusedCSS(code, context);
      }
    });

    this.addStrategy({
      name: 'optimize-selectors',
      description: 'Optimize CSS selectors for better performance',
      category: 'performance',
      priority: 8,
      apply: async (code: string, context: OptimizationContext) => {
        return this.optimizeSelectors(code);
      }
    });

    this.addStrategy({
      name: 'minify-code',
      description: 'Minify CSS and JavaScript code',
      category: 'performance',
      priority: 7,
      apply: async (code: string, context: OptimizationContext) => {
        return this.minifyCode(code, context.targetFramework);
      }
    });

    // Accessibility optimizations
    this.addStrategy({
      name: 'add-aria-labels',
      description: 'Add missing ARIA labels and roles',
      category: 'accessibility',
      priority: 10,
      apply: async (code: string, context: OptimizationContext) => {
        return this.addAriaLabels(code);
      }
    });

    this.addStrategy({
      name: 'improve-color-contrast',
      description: 'Improve color contrast for better accessibility',
      category: 'accessibility',
      priority: 9,
      apply: async (code: string, context: OptimizationContext) => {
        return this.improveColorContrast(code);
      }
    });

    // Maintainability optimizations
    this.addStrategy({
      name: 'extract-constants',
      description: 'Extract magic numbers and strings to constants',
      category: 'maintainability',
      priority: 6,
      apply: async (code: string, context: OptimizationContext) => {
        return this.extractConstants(code);
      }
    });

    this.addStrategy({
      name: 'add-type-annotations',
      description: 'Add TypeScript type annotations',
      category: 'maintainability',
      priority: 5,
      apply: async (code: string, context: OptimizationContext) => {
        return this.addTypeAnnotations(code, context);
      }
    });

    // Security optimizations
    this.addStrategy({
      name: 'sanitize-inputs',
      description: 'Add input sanitization and validation',
      category: 'security',
      priority: 8,
      apply: async (code: string, context: OptimizationContext) => {
        return this.sanitizeInputs(code);
      }
    });
  }

  addStrategy(strategy: OptimizationStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  async optimizeComponent(
    component: GeneratedComponent,
    config: ConversionConfig,
    options: {
      enabledStrategies?: string[];
      performanceTargets?: Partial<OptimizationContext['performanceTargets']>;
    } = {}
  ): Promise<OptimizationResult> {
    const context: OptimizationContext = {
      component,
      config,
      targetFramework: config.framework || 'react',
      performanceTargets: {
        bundleSize: 100, // KB
        renderTime: 16, // ms (60fps)
        memoryUsage: 50, // MB
        ...options.performanceTargets
      }
    };

    const enabledStrategies = options.enabledStrategies || Array.from(this.strategies.keys());
    const applicableStrategies = enabledStrategies
      .map(name => this.strategies.get(name))
      .filter((strategy): strategy is OptimizationStrategy => !!strategy)
      .sort((a, b) => b.priority - a.priority);

    let optimizedJSX = component.jsx;
    let optimizedCSS = component.css;
    const appliedStrategies: string[] = [];
    const warnings: string[] = [];

    // Apply JSX optimizations
    for (const strategy of applicableStrategies) {
      try {
        const newJSX = await strategy.apply(optimizedJSX, context);
        if (newJSX !== optimizedJSX) {
          optimizedJSX = newJSX;
          appliedStrategies.push(strategy.name);
        }
      } catch (error) {
        warnings.push(`Strategy "${strategy.name}" failed: ${error}`);
      }
    }

    // Apply CSS optimizations
    for (const strategy of applicableStrategies) {
      try {
        const newCSS = await strategy.apply(optimizedCSS, context);
        if (newCSS !== optimizedCSS) {
          optimizedCSS = newCSS;
          if (!appliedStrategies.includes(strategy.name)) {
            appliedStrategies.push(strategy.name);
          }
        }
      } catch (error) {
        warnings.push(`CSS strategy "${strategy.name}" failed: ${error}`);
      }
    }

    const originalSize = new Blob([component.jsx + component.css]).size;
    const optimizedSize = new Blob([optimizedJSX + optimizedCSS]).size;
    const bundleSizeReduction = ((originalSize - optimizedSize) / originalSize) * 100;

    const result: OptimizationResult = {
      originalCode: component.jsx + '\n\n' + component.css,
      optimizedCode: optimizedJSX + '\n\n' + optimizedCSS,
      improvements: {
        bundleSizeReduction,
        performanceGain: this.calculatePerformanceGain(component, optimizedJSX, optimizedCSS),
        accessibilityScore: this.calculateAccessibilityScore(optimizedJSX),
        maintainabilityScore: this.calculateMaintainabilityScore(optimizedJSX, optimizedCSS)
      },
      appliedStrategies,
      warnings
    };

    // Store in history
    const componentHistory = this.optimizationHistory.get(component.id) || [];
    componentHistory.push(result);
    this.optimizationHistory.set(component.id, componentHistory);

    return result;
  }

  // Strategy implementations
  private async removeUnusedCSS(code: string, context: OptimizationContext): Promise<string> {
    const usedClasses = this.extractUsedClasses(context.component.jsx);
    const cssRules = code.split('}').filter(rule => rule.trim());
    
    const optimizedRules = cssRules.filter(rule => {
      const selector = rule.split('{')[0]?.trim();
      if (!selector) return false;
      
      const className = selector.replace(/^\./, '').replace(/:.*$/, '');
      return usedClasses.has(className) || this.isUtilityClass(className);
    });

    return optimizedRules.join('}\n') + (optimizedRules.length > 0 ? '}' : '');
  }

  private optimizeSelectors(code: string): Promise<string> {
    return Promise.resolve(
      code
        .replace(/\s*>\s*/g, '>')
        .replace(/\s*\+\s*/g, '+')
        .replace(/\s*~\s*/g, '~')
        .replace(/\s*,\s*/g, ',')
    );
  }

  private minifyCode(code: string, framework: string): Promise<string> {
    if (framework === 'css' || code.includes('{') && code.includes('}')) {
      return Promise.resolve(
        code
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\s+/g, ' ')
          .replace(/;\s*}/g, '}')
          .replace(/\s*{\s*/g, '{')
          .replace(/;\s*/g, ';')
          .replace(/:\s*/g, ':')
          .trim()
      );
    }
    return Promise.resolve(code);
  }

  private addAriaLabels(code: string): Promise<string> {
    let optimized = code;

    // Add aria-label to buttons without text content
    optimized = optimized.replace(
      /<button([^>]*?)>(\s*)<\/button>/g,
      '<button$1 aria-label="Button">$2</button>'
    );

    // Add alt attributes to images
    optimized = optimized.replace(
      /<img([^>]*?)(?!.*alt=)([^>]*?)>/g,
      '<img$1 alt="Image"$2>'
    );

    // Add role attributes to interactive elements
    optimized = optimized.replace(
      /<div([^>]*?)onClick/g,
      '<div$1 role="button" tabIndex={0} onClick'
    );

    return Promise.resolve(optimized);
  }

  private improveColorContrast(code: string): Promise<string> {
    // Simple contrast improvement by darkening light colors
    const colorRegex = /color:\s*(#[a-fA-F0-9]{6}|rgb\([^)]+\))/g;
    
    return Promise.resolve(
      code.replace(colorRegex, (match, color) => {
        const improvedColor = this.improveContrast(color);
        return match.replace(color, improvedColor);
      })
    );
  }

  private extractConstants(code: string): Promise<string> {
    const constants: Record<string, string> = {};
    let constantCounter = 0;

    // Extract color values
    let optimized = code.replace(/#[a-fA-F0-9]{6}/g, (match) => {
      if (!constants[match]) {
        constants[match] = `COLOR_${constantCounter++}`;
      }
      return `var(--${constants[match].toLowerCase().replace('_', '-')})`;
    });

    // Extract numeric values
    optimized = optimized.replace(/(\d+)px/g, (match, num) => {
      const value = parseInt(num);
      if (value >= 8 && value % 4 === 0) {
        const spacingName = `SPACING_${value / 4}`;
        return `var(--spacing-${value / 4})`;
      }
      return match;
    });

    // Add constants to the beginning
    const constantsCSS = Object.entries(constants)
      .map(([value, name]) => `  --${name.toLowerCase().replace('_', '-')}: ${value};`)
      .join('\n');

    if (constantsCSS) {
      optimized = `:root {\n${constantsCSS}\n}\n\n${optimized}`;
    }

    return Promise.resolve(optimized);
  }

  private addTypeAnnotations(code: string, context: OptimizationContext): Promise<string> {
    if (!context.config.typescript) {
      return Promise.resolve(code);
    }

    let optimized = code;

    // Add prop types
    optimized = optimized.replace(
      /const\s+(\w+)\s*=\s*\(\s*\{\s*([^}]+)\s*\}\s*\)/g,
      (match, componentName, props) => {
        const propTypes = props.split(',').map((prop: string) => {
          const propName = prop.trim();
          return `  ${propName}: any;`;
        }).join('\n');

        return `interface ${componentName}Props {\n${propTypes}\n}\n\n${match.replace(')', '): React.FC<' + componentName + 'Props>')}`;
      }
    );

    return Promise.resolve(optimized);
  }

  private sanitizeInputs(code: string): Promise<string> {
    let optimized = code;

    // Add input validation
    optimized = optimized.replace(
      /<input([^>]*?)onChange=\{([^}]+)\}/g,
      '<input$1 onChange={(e) => { const sanitized = e.target.value.replace(/[<>]/g, ""); $2(sanitized); }}'
    );

    // Add XSS protection for dynamic content
    optimized = optimized.replace(
      /dangerouslySetInnerHTML=\{\{__html:\s*([^}]+)\}\}/g,
      'dangerouslySetInnerHTML={{__html: sanitizeHTML($1)}}'
    );

    return Promise.resolve(optimized);
  }

  // Helper methods
  private extractUsedClasses(jsx: string): Set<string> {
    const classes = new Set<string>();
    const classMatches = jsx.match(/className="([^"]+)"/g) || [];
    
    classMatches.forEach(match => {
      const classNames = match.replace('className="', '').replace('"', '').split(' ');
      classNames.forEach(className => {
        if (className.trim()) {
          classes.add(className.trim());
        }
      });
    });

    return classes;
  }

  private isUtilityClass(className: string): boolean {
    const utilityPrefixes = ['flex', 'grid', 'text', 'bg', 'p-', 'm-', 'w-', 'h-'];
    return utilityPrefixes.some(prefix => className.startsWith(prefix));
  }

  private improveContrast(color: string): string {
    // Simple contrast improvement logic
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // If too light, darken it
      if (luminance > 0.7) {
        const factor = 0.7;
        const newR = Math.round(r * factor);
        const newG = Math.round(g * factor);
        const newB = Math.round(b * factor);
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
      }
    }
    
    return color;
  }

  private calculatePerformanceGain(
    component: GeneratedComponent,
    optimizedJSX: string,
    optimizedCSS: string
  ): number {
    const originalSize = component.jsx.length + component.css.length;
    const optimizedSize = optimizedJSX.length + optimizedCSS.length;
    
    return ((originalSize - optimizedSize) / originalSize) * 100;
  }

  private calculateAccessibilityScore(jsx: string): number {
    let score = 70; // Base score
    
    // Check for accessibility features
    if (jsx.includes('aria-label')) score += 10;
    if (jsx.includes('role=')) score += 10;
    if (jsx.includes('tabIndex')) score += 5;
    if (jsx.includes('alt=')) score += 5;
    
    return Math.min(100, score);
  }

  private calculateMaintainabilityScore(jsx: string, css: string): number {
    let score = 70; // Base score
    
    // Check for good practices
    if (jsx.includes('interface ')) score += 10;
    if (css.includes(':root')) score += 5;
    if (jsx.includes('const ')) score += 5;
    if (css.includes('/* ')) score += 5;
    if (jsx.includes('React.FC')) score += 5;
    
    return Math.min(100, score);
  }

  async optimizeBatch(
    components: GeneratedComponent[],
    config: ConversionConfig,
    onProgress?: (progress: { current: number; total: number; component: string }) => void
  ): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      
      onProgress?.({
        current: i + 1,
        total: components.length,
        component: component.name
      });

      const result = await this.optimizeComponent(component, config);
      results.push(result);
    }

    return results;
  }

  getOptimizationHistory(componentId: string): OptimizationResult[] {
    return this.optimizationHistory.get(componentId) || [];
  }

  clearHistory(componentId?: string): void {
    if (componentId) {
      this.optimizationHistory.delete(componentId);
    } else {
      this.optimizationHistory.clear();
    }
  }

  getAvailableStrategies(): OptimizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  getStrategiesByCategory(category: OptimizationStrategy['category']): OptimizationStrategy[] {
    return Array.from(this.strategies.values()).filter(s => s.category === category);
  }
}