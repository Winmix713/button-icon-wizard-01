import { FigmaNode, GeneratedComponent } from '../types/figma';

export interface OptimizationConfig {
  enableCSSMinification: boolean;
  enableTreeShaking: boolean;
  enableComponentDeduplication: boolean;
  enableAssetOptimization: boolean;
  enableLazyLoading: boolean;
  maxBundleSize: number; // in KB
  targetPerformanceScore: number; // 0-100
}

export interface PerformanceMetrics {
  cssSize: number;
  jsSize: number;
  componentCount: number;
  duplicateComponents: number;
  optimizationSavings: number;
  renderTime: number;
  memoryUsage: number;
}

export class PerformanceOptimizer {
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics;

  constructor(config: OptimizationConfig) {
    this.config = config;
    this.metrics = {
      cssSize: 0,
      jsSize: 0,
      componentCount: 0,
      duplicateComponents: 0,
      optimizationSavings: 0,
      renderTime: 0,
      memoryUsage: 0
    };
  }

  // CSS Optimization Pipeline
  optimizeCSS(css: string): string {
    let optimizedCSS = css;

    // Remove duplicate rules
    optimizedCSS = this.removeDuplicateRules(optimizedCSS);

    // Merge similar selectors
    optimizedCSS = this.mergeSimilarSelectors(optimizedCSS);

    // Remove unused properties
    optimizedCSS = this.removeUnusedProperties(optimizedCSS);

    // Optimize values
    optimizedCSS = this.optimizeValues(optimizedCSS);

    // Minify if enabled
    if (this.config.enableCSSMinification) {
      optimizedCSS = this.minifyCSS(optimizedCSS);
    }

    return optimizedCSS;
  }

  // Component Deduplication
  deduplicateComponents(components: GeneratedComponent[]): GeneratedComponent[] {
    const uniqueComponents = new Map<string, GeneratedComponent>();
    const duplicateMap = new Map<string, string>();

    components.forEach(component => {
      const hash = this.generateComponentHash(component);
      
      if (uniqueComponents.has(hash)) {
        // Mark as duplicate and reference original
        const original = uniqueComponents.get(hash)!;
        duplicateMap.set(component.id, original.id);
        this.metrics.duplicateComponents++;
      } else {
        uniqueComponents.set(hash, component);
      }
    });

    return Array.from(uniqueComponents.values());
  }

  // Bundle Size Optimization
  optimizeBundleSize(components: GeneratedComponent[]): GeneratedComponent[] {
    let currentSize = this.calculateBundleSize(components);
    
    if (currentSize <= this.config.maxBundleSize) {
      return components;
    }

    // Apply progressive optimization strategies
    let optimizedComponents = [...components];

    // 1. Remove redundant styles
    optimizedComponents = this.removeRedundantStyles(optimizedComponents);

    // 2. Extract common styles to shared classes
    optimizedComponents = this.extractCommonStyles(optimizedComponents);

    // 3. Apply code splitting if still too large
    if (this.calculateBundleSize(optimizedComponents) > this.config.maxBundleSize) {
      optimizedComponents = this.applyCodeSplitting(optimizedComponents);
    }

    return optimizedComponents;
  }

  // Tree Shaking for Unused Code
  treeShakeUnusedCode(components: GeneratedComponent[]): GeneratedComponent[] {
    if (!this.config.enableTreeShaking) return components;

    const usedSelectors = new Set<string>();
    const usedVariables = new Set<string>();

    // Analyze usage
    components.forEach(component => {
      this.analyzeComponentUsage(component, usedSelectors, usedVariables);
    });

    // Remove unused code
    return components.map(component => ({
      ...component,
      css: this.removeUnusedCSS(component.css, usedSelectors, usedVariables)
    }));
  }

  // Asset Optimization
  optimizeAssets(components: GeneratedComponent[]): GeneratedComponent[] {
    if (!this.config.enableAssetOptimization) return components;

    return components.map(component => ({
      ...component,
      jsx: this.optimizeImages(component.jsx),
      css: this.optimizeBackgroundImages(component.css)
    }));
  }

  // Performance Monitoring
  measurePerformance<T>(operation: () => T, operationName: string): T {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    const result = operation();

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    console.log(`Performance: ${operationName} took ${endTime - startTime}ms`);
    console.log(`Memory: ${operationName} used ${endMemory - startMemory}MB`);

    return result;
  }

  // CSS Optimization Methods
  private removeDuplicateRules(css: string): string {
    const rules = css.split('}').filter(rule => rule.trim());
    const uniqueRules = new Set<string>();
    
    return rules
      .filter(rule => {
        const normalized = rule.trim().replace(/\s+/g, ' ');
        if (uniqueRules.has(normalized)) {
          return false;
        }
        uniqueRules.add(normalized);
        return true;
      })
      .join('}\n') + (rules.length > 0 ? '}' : '');
  }

  private mergeSimilarSelectors(css: string): string {
    const ruleMap = new Map<string, string[]>();
    const rules = css.match(/[^{}]+\{[^{}]*\}/g) || [];

    rules.forEach(rule => {
      const [selector, properties] = rule.split('{');
      const cleanProperties = properties.replace('}', '').trim();
      
      if (!ruleMap.has(cleanProperties)) {
        ruleMap.set(cleanProperties, []);
      }
      ruleMap.get(cleanProperties)!.push(selector.trim());
    });

    let optimizedCSS = '';
    ruleMap.forEach((selectors, properties) => {
      if (selectors.length > 1) {
        optimizedCSS += `${selectors.join(', ')} {\n  ${properties}\n}\n\n`;
      } else {
        optimizedCSS += `${selectors[0]} {\n  ${properties}\n}\n\n`;
      }
    });

    return optimizedCSS;
  }

  private removeUnusedProperties(css: string): string {
    // Remove properties that have no effect
    const unusedPatterns = [
      /\s*display:\s*block;\s*/g, // Default for div
      /\s*position:\s*static;\s*/g, // Default position
      /\s*z-index:\s*auto;\s*/g, // Default z-index
      /\s*opacity:\s*1;\s*/g, // Default opacity
    ];

    let optimized = css;
    unusedPatterns.forEach(pattern => {
      optimized = optimized.replace(pattern, '');
    });

    return optimized;
  }

  private optimizeValues(css: string): string {
    return css
      // Optimize colors
      .replace(/#([a-f0-9])\1([a-f0-9])\2([a-f0-9])\3/gi, '#$1$2$3')
      // Optimize zero values
      .replace(/\b0px\b/g, '0')
      .replace(/\b0em\b/g, '0')
      .replace(/\b0rem\b/g, '0')
      .replace(/\b0%\b/g, '0')
      // Optimize decimal values
      .replace(/\b0\.(\d+)/g, '.$1')
      // Remove unnecessary quotes
      .replace(/font-family:\s*"([^"]+)"/g, 'font-family: $1');
  }

  private minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove last semicolon
      .replace(/\s*{\s*/g, '{') // Remove spaces around braces
      .replace(/;\s*/g, ';') // Remove spaces after semicolons
      .replace(/:\s*/g, ':') // Remove spaces after colons
      .trim();
  }

  // Component Analysis Methods
  private generateComponentHash(component: GeneratedComponent): string {
    const content = component.jsx + component.css;
    return this.simpleHash(content);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  public calculateBundleSize(components: GeneratedComponent[]): number {
    return components.reduce((total, component) => {
      return total + 
        new Blob([component.jsx]).size + 
        new Blob([component.css]).size;
    }, 0) / 1024; // Convert to KB
  }

  private removeRedundantStyles(components: GeneratedComponent[]): GeneratedComponent[] {
    const commonStyles = this.extractCommonStylePatterns(components);
    
    return components.map(component => ({
      ...component,
      css: this.removeRedundantFromCSS(component.css, commonStyles)
    }));
  }

  private extractCommonStyles(components: GeneratedComponent[]): GeneratedComponent[] {
    const styleFrequency = new Map<string, number>();
    
    // Count style usage
    components.forEach(component => {
      const styles = this.extractStyleRules(component.css);
      styles.forEach(style => {
        styleFrequency.set(style, (styleFrequency.get(style) || 0) + 1);
      });
    });

    // Extract frequently used styles
    const commonStyles = Array.from(styleFrequency.entries())
      .filter(([_, count]) => count >= 3)
      .map(([style]) => style);

    // Generate utility classes
    const utilityCSS = this.generateUtilityClasses(commonStyles);

    // Update components to use utility classes
    return components.map(component => ({
      ...component,
      css: utilityCSS + '\n\n' + this.replaceWithUtilities(component.css, commonStyles),
      jsx: this.updateJSXWithUtilities(component.jsx, commonStyles)
    }));
  }

  private applyCodeSplitting(components: GeneratedComponent[]): GeneratedComponent[] {
    // Split components into chunks based on dependencies and usage
    const chunks = this.createComponentChunks(components);
    
    return components.map(component => ({
      ...component,
      metadata: {
        ...component.metadata,
        chunkId: this.getComponentChunk(component.id, chunks),
        lazyLoad: this.shouldLazyLoad(component)
      }
    }));
  }

  private analyzeComponentUsage(
    component: GeneratedComponent, 
    usedSelectors: Set<string>, 
    usedVariables: Set<string>
  ): void {
    // Extract selectors from JSX
    const classMatches = component.jsx.match(/className="([^"]+)"/g) || [];
    classMatches.forEach(match => {
      const classes = match.replace('className="', '').replace('"', '').split(' ');
      classes.forEach(cls => usedSelectors.add(cls));
    });

    // Extract CSS variables
    const variableMatches = component.css.match(/var\(--([^)]+)\)/g) || [];
    variableMatches.forEach(match => {
      const variable = match.replace('var(--', '').replace(')', '');
      usedVariables.add(variable);
    });
  }

  private removeUnusedCSS(
    css: string, 
    usedSelectors: Set<string>, 
    usedVariables: Set<string>
  ): string {
    const rules = css.split('}').filter(rule => rule.trim());
    
    return rules
      .filter(rule => {
        const selector = rule.split('{')[0].trim();
        return this.isSelectorUsed(selector, usedSelectors);
      })
      .join('}\n') + (rules.length > 0 ? '}' : '');
  }

  private optimizeImages(jsx: string): string {
    // Add lazy loading and optimize image attributes
    return jsx
      .replace(/<img([^>]*?)src="([^"]+)"([^>]*?)>/g, 
        '<img$1src="$2" loading="lazy" decoding="async"$3>')
      .replace(/width="(\d+)" height="(\d+)"/g, 
        'width="$1" height="$2" style="aspect-ratio: $1/$2"');
  }

  private optimizeBackgroundImages(css: string): string {
    // Optimize background image properties
    return css
      .replace(/background-image:\s*url\(([^)]+)\)/g, 
        'background-image: url($1); background-loading: lazy')
      .replace(/background-size:\s*cover/g, 
        'background-size: cover; background-position: center');
  }

  // Utility Methods
  private extractCommonStylePatterns(components: GeneratedComponent[]): string[] {
    const patterns = new Set<string>();
    
    components.forEach(component => {
      const rules = component.css.match(/[^{}]+\{[^{}]*\}/g) || [];
      rules.forEach(rule => {
        const properties = rule.split('{')[1]?.replace('}', '').trim();
        if (properties) patterns.add(properties);
      });
    });

    return Array.from(patterns);
  }

  private removeRedundantFromCSS(css: string, commonStyles: string[]): string {
    let optimized = css;
    commonStyles.forEach(style => {
      const regex = new RegExp(`\\{\\s*${style.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}`, 'g');
      optimized = optimized.replace(regex, '{ /* extracted to utility */ }');
    });
    return optimized;
  }

  private extractStyleRules(css: string): string[] {
    const rules = css.match(/[^{}]+\{[^{}]*\}/g) || [];
    return rules.map(rule => rule.split('{')[1]?.replace('}', '').trim()).filter(Boolean);
  }

  private generateUtilityClasses(commonStyles: string[]): string {
    return commonStyles
      .map((style, index) => `.utility-${index} {\n  ${style}\n}`)
      .join('\n\n');
  }

  private replaceWithUtilities(css: string, commonStyles: string[]): string {
    let optimized = css;
    commonStyles.forEach((style, index) => {
      const regex = new RegExp(`\\{\\s*${style.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}`, 'g');
      optimized = optimized.replace(regex, `{ @apply utility-${index}; }`);
    });
    return optimized;
  }

  private updateJSXWithUtilities(jsx: string, commonStyles: string[]): string {
    // This would require more sophisticated analysis to update JSX
    return jsx;
  }

  private createComponentChunks(components: GeneratedComponent[]): Map<string, string[]> {
    const chunks = new Map<string, string[]>();
    const chunkSize = Math.ceil(components.length / 5); // Create 5 chunks

    for (let i = 0; i < components.length; i += chunkSize) {
      const chunkId = `chunk-${Math.floor(i / chunkSize)}`;
      const chunkComponents = components.slice(i, i + chunkSize).map(c => c.id);
      chunks.set(chunkId, chunkComponents);
    }

    return chunks;
  }

  private getComponentChunk(componentId: string, chunks: Map<string, string[]>): string {
    for (const [chunkId, componentIds] of chunks.entries()) {
      if (componentIds.includes(componentId)) {
        return chunkId;
      }
    }
    return 'default';
  }

  private shouldLazyLoad(component: GeneratedComponent): boolean {
    return this.config.enableLazyLoading && 
           component.metadata.complexity !== 'simple';
  }

  private isSelectorUsed(selector: string, usedSelectors: Set<string>): boolean {
    // Check if selector or any of its parts are used
    const selectorParts = selector.split(/[\s>+~]/).map(s => s.trim());
    return selectorParts.some(part => {
      const className = part.replace(/^\./, '').replace(/:.*$/, '');
      return usedSelectors.has(className);
    });
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  // Public API
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}