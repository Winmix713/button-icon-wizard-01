// =============================================================================
// INTERFACES & TYPES
// =============================================================================

// Core Figma types
export interface FigmaNode {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly children?: readonly FigmaNode[];
  readonly fills?: readonly Paint[];
  readonly strokes?: readonly Paint[];
  readonly style?: TypeStyle;
  readonly layoutMode?: 'VERTICAL' | 'HORIZONTAL';
  readonly itemSpacing?: number;
  readonly paddingLeft?: number;
  readonly paddingRight?: number;
  readonly paddingTop?: number;
  readonly paddingBottom?: number;
  readonly constraints?: {
    readonly horizontal?: 'MINIMUM' | 'CENTER' | 'SCALE' | 'STRETCH';
    readonly vertical?: 'MINIMUM' | 'CENTER' | 'SCALE' | 'STRETCH';
  };
  readonly absoluteBoundingBox?: Rectangle;
}

export interface FigmaFile {
  readonly document: FigmaNode;
  readonly name?: string;
  readonly version?: string;
}

export interface Paint {
  readonly type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  readonly color?: RGBA;
  readonly gradientStops?: readonly GradientStop[];
  readonly opacity?: number;
}

export interface RGBA {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export interface GradientStop {
  readonly position: number;
  readonly color: RGBA;
}

export interface TypeStyle {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly lineHeight?: number;
  readonly letterSpacing?: number;
}

export interface Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// Analysis result types
export type SemanticRole = 
  | 'header' | 'nav' | 'main' | 'section' | 'article' | 'aside' 
  | 'footer' | 'form' | 'button' | 'input' | 'label' | 'div' | 'span';

export interface SemanticMapping {
  readonly [nodeId: string]: SemanticRole;
}

export interface ColorPalette {
  readonly primary: readonly string[];
  readonly secondary: readonly string[];
  readonly neutral: readonly string[];
  readonly semantic: readonly string[];
  readonly all: readonly string[];
}

export interface TypographyScale {
  readonly [styleName: string]: {
    readonly fontFamily: string;
    readonly fontSize: string;
    readonly fontWeight: number;
    readonly lineHeight?: string;
    readonly letterSpacing?: string;
    readonly usage: 'heading' | 'body' | 'caption' | 'button' | 'label';
  };
}

export interface LayoutProperties {
  readonly display: 'flex' | 'block' | 'inline-block' | 'grid';
  readonly flexDirection?: 'row' | 'column';
  readonly justifyContent?: string;
  readonly alignItems?: string;
  readonly gap?: string;
  readonly padding?: string;
  readonly margin?: string;
  readonly width?: string;
  readonly height?: string;
}

export interface ResponsiveRules {
  readonly breakpoints: readonly string[];
  readonly rules: {
    readonly [breakpoint: string]: {
      readonly [property: string]: string | number;
    };
  };
}

export interface ComponentInstance {
  readonly id: string;
  readonly name: string;
  readonly type: 'component' | 'instance';
  readonly masterComponent?: string;
  readonly variants?: readonly ComponentInstance[];
}

// =============================================================================
// CONFIGURATION & RULES
// =============================================================================

export interface SemanticRule {
  readonly role: SemanticRole;
  readonly patterns: readonly string[];
  readonly contextualRules?: readonly {
    readonly condition: (node: FigmaNode, depth: number, parent?: FigmaNode) => boolean;
    readonly priority: number;
  }[];
}

export interface AnalysisConfig {
  readonly semanticRules: readonly SemanticRule[];
  readonly colorAnalysis: {
    readonly groupSimilarColors: boolean;
    readonly colorDistanceThreshold: number;
    readonly extractFromImages: boolean;
  };
  readonly typographyAnalysis: {
    readonly groupSimilarStyles: boolean;
    readonly fontSizeThreshold: number;
    readonly createTypeScale: boolean;
  };
  readonly componentDetection: {
    readonly enabled: boolean;
    readonly similarityThreshold: number;
    readonly minInstanceCount: number;
  };
  readonly performance: {
    readonly maxDepth: number;
    readonly enableCaching: boolean;
    readonly chunkSize: number;
  };
}

// =============================================================================
// ANALYZERS - SINGLE RESPONSIBILITY CLASSES
// =============================================================================

export class SemanticAnalyzer {
  private readonly rules: readonly SemanticRule[];
  private readonly mapping = new Map<string, SemanticRole>();

  constructor(rules: readonly SemanticRule[]) {
    this.rules = rules;
  }

  analyze(node: FigmaNode, depth: number = 0, parent?: FigmaNode): void {
    const role = this.determineSemanticRole(node, depth, parent);
    this.mapping.set(node.id, role);

    node.children?.forEach(child => 
      this.analyze(child, depth + 1, node)
    );
  }

  private determineSemanticRole(
    node: FigmaNode, 
    depth: number, 
    parent?: FigmaNode
  ): SemanticRole {
    const name = node.name.toLowerCase();
    
    // Find best matching rule
    let bestMatch: SemanticRole = 'div';
    let highestPriority = -1;

    for (const rule of this.rules) {
      // Check pattern matching
      const patternMatch = rule.patterns.some(pattern => 
        new RegExp(pattern, 'i').test(name)
      );

      if (patternMatch) {
        // Check contextual rules if present
        if (rule.contextualRules) {
          const contextualMatch = rule.contextualRules.find(cr => 
            cr.condition(node, depth, parent)
          );
          
          if (contextualMatch && contextualMatch.priority > highestPriority) {
            bestMatch = rule.role;
            highestPriority = contextualMatch.priority;
          }
        } else {
          bestMatch = rule.role;
        }
      }
    }

    return bestMatch;
  }

  getMapping(): SemanticMapping {
    return Object.fromEntries(this.mapping);
  }

  getSemanticHierarchy(): Record<SemanticRole, string[]> {
    const hierarchy: Record<string, string[]> = {};
    
    for (const [nodeId, role] of this.mapping) {
      if (!hierarchy[role]) {
        hierarchy[role] = [];
      }
      hierarchy[role].push(nodeId);
    }

    return hierarchy as Record<SemanticRole, string[]>;
  }
}

export class ColorAnalyzer {
  private readonly config: AnalysisConfig['colorAnalysis'];
  private readonly colors = new Set<string>();
  private readonly colorFrequency = new Map<string, number>();

  constructor(config: AnalysisConfig['colorAnalysis']) {
    this.config = config;
  }

  analyze(node: FigmaNode): void {
    this.extractColorsFromNode(node);
    node.children?.forEach(child => this.analyze(child));
  }

  private extractColorsFromNode(node: FigmaNode): void {
    node.fills?.forEach(fill => this.extractFromPaint(fill));
    node.strokes?.forEach(stroke => this.extractFromPaint(stroke));
  }

  private extractFromPaint(paint: Paint): void {
    if (paint.color) {
      const hexColor = this.rgbaToHex(paint.color);
      this.addColor(hexColor);
    }

    if (paint.gradientStops) {
      paint.gradientStops.forEach(stop => {
        const hexColor = this.rgbaToHex(stop.color);
        this.addColor(hexColor);
      });
    }
  }

  private addColor(color: string): void {
    if (this.config.groupSimilarColors) {
      const existingSimilar = this.findSimilarColor(color);
      if (existingSimilar) {
        this.colorFrequency.set(existingSimilar, 
          (this.colorFrequency.get(existingSimilar) || 0) + 1
        );
        return;
      }
    }

    this.colors.add(color);
    this.colorFrequency.set(color, (this.colorFrequency.get(color) || 0) + 1);
  }

  private findSimilarColor(targetColor: string): string | null {
    if (!this.config.groupSimilarColors) return null;

    for (const existingColor of this.colors) {
      if (this.calculateColorDistance(targetColor, existingColor) < 
          this.config.colorDistanceThreshold) {
        return existingColor;
      }
    }
    return null;
  }

  private calculateColorDistance(color1: string, color2: string): number {
    // Simplified color distance calculation
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return Infinity;

    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  private rgbaToHex(rgba: RGBA): string {
    const r = Math.round(rgba.r * 255);
    const g = Math.round(rgba.g * 255);
    const b = Math.round(rgba.b * 255);
    
    if (rgba.a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${rgba.a.toFixed(2)})`;
    }
    
    return `#${[r, g, b]
      .map(c => c.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  getPalette(): ColorPalette {
    const sortedColors = Array.from(this.colors)
      .sort((a, b) => (this.colorFrequency.get(b) || 0) - (this.colorFrequency.get(a) || 0));

    return {
      primary: sortedColors.slice(0, 3),
      secondary: sortedColors.slice(3, 8),
      neutral: this.extractNeutralColors(sortedColors),
      semantic: this.extractSemanticColors(sortedColors),
      all: sortedColors
    };
  }

  private extractNeutralColors(colors: string[]): string[] {
    return colors.filter(color => this.isNeutralColor(color));
  }

  private extractSemanticColors(colors: string[]): string[] {
    return colors.filter(color => this.isSemanticColor(color));
  }

  private isNeutralColor(color: string): boolean {
    const rgb = this.hexToRgb(color);
    if (!rgb) return false;
    
    const { r, g, b } = rgb;
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    return maxDiff < 30; // Colors with similar RGB values are likely neutral
  }

  private isSemanticColor(color: string): boolean {
    const semanticColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff8000'];
    return semanticColors.some(semantic => 
      this.calculateColorDistance(color, semantic) < 50
    );
  }
}

export class TypographyAnalyzer {
  private readonly config: AnalysisConfig['typographyAnalysis'];
  private readonly styles = new Map<string, TypeStyle & { usage: string; frequency: number }>();

  constructor(config: AnalysisConfig['typographyAnalysis']) {
    this.config = config;
  }

  analyze(node: FigmaNode): void {
    if (node.style) {
      this.addTypographyStyle(node);
    }
    node.children?.forEach(child => this.analyze(child));
  }

  private addTypographyStyle(node: FigmaNode): void {
    if (!node.style) return;

    const styleKey = this.getStyleKey(node.style);
    const usage = this.determineUsage(node);

    if (this.styles.has(styleKey)) {
      const existing = this.styles.get(styleKey)!;
      this.styles.set(styleKey, {
        ...existing,
        frequency: existing.frequency + 1
      });
    } else {
      this.styles.set(styleKey, {
        ...node.style,
        usage,
        frequency: 1
      });
    }
  }

  private getStyleKey(style: TypeStyle): string {
    return `${style.fontFamily}-${style.fontSize}-${style.fontWeight}`;
  }

  private determineUsage(node: FigmaNode): string {
    const name = node.name.toLowerCase();
    
    if (name.includes('h1') || name.includes('title')) return 'heading';
    if (name.includes('h2') || name.includes('subtitle')) return 'heading';
    if (name.includes('body') || name.includes('text')) return 'body';
    if (name.includes('caption') || name.includes('small')) return 'caption';
    if (name.includes('button') || name.includes('btn')) return 'button';
    if (name.includes('label')) return 'label';
    
    // Determine by font size
    if (node.style && node.style.fontSize > 24) return 'heading';
    if (node.style && node.style.fontSize < 12) return 'caption';
    
    return 'body';
  }

  getTypographyScale(): TypographyScale {
    // Mutable intermediate type (not readonly)
    const mutableScale: { [styleName: string]: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight?: string;
      letterSpacing?: string;
      usage: 'heading' | 'body' | 'caption' | 'button' | 'label';
    } } = {};

    for (const [key, style] of this.styles) {
      const styleName = this.generateStyleName(style);
      mutableScale[styleName] = {
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight ? `${style.lineHeight}px` : undefined,
        letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
        usage: style.usage as 'heading' | 'body' | 'caption' | 'button' | 'label'
      };
    }

    // Cast back to the readonly TypographyScale
    return mutableScale as TypographyScale;
  }

  private generateStyleName(style: TypeStyle & { usage: string }): string {
    const sizeCategory = style.fontSize > 24 ? 'large' : 
                        style.fontSize > 16 ? 'medium' : 'small';
    const weightName = style.fontWeight >= 700 ? 'bold' : 
                       style.fontWeight >= 500 ? 'medium' : 'regular';
    
    return `${style.usage}-${sizeCategory}-${weightName}`;
  }
}

export class LayoutAnalyzer {
  analyze(node: FigmaNode): LayoutProperties {
    // Mutable intermediate type (not readonly)
    type MutableLayoutProperties = {
      display?: 'flex' | 'block' | 'inline-block' | 'grid';
      flexDirection?: 'row' | 'column';
      justifyContent?: string;
      alignItems?: string;
      gap?: string;
      padding?: string;
      margin?: string;
      width?: string;
      height?: string;
    };

    const layout: MutableLayoutProperties = {};

    // Determine display type
    if (node.layoutMode) {
      layout.display = 'flex';
      layout.flexDirection = node.layoutMode === 'VERTICAL' ? 'column' : 'row';
      
      if (node.itemSpacing) {
        layout.gap = `${node.itemSpacing}px`;
      }

      // Analyze flex properties based on constraints and content
      layout.justifyContent = this.inferJustifyContent(node);
      layout.alignItems = this.inferAlignItems(node);
    } else {
      layout.display = this.inferBlockDisplayType(node);
    }

    // Extract spacing
    layout.padding = this.extractPadding(node);
    
    // Extract dimensions with responsive considerations
    if (node.constraints) {
      if (node.constraints.horizontal === 'STRETCH') {
        layout.width = '100%';
      } else if (node.absoluteBoundingBox) {
        layout.width = `${node.absoluteBoundingBox.width}px`;
      }

      if (node.constraints.vertical === 'STRETCH') {
        layout.height = '100%';
      } else if (node.absoluteBoundingBox) {
        layout.height = `${node.absoluteBoundingBox.height}px`;
      }
    }

    return layout as LayoutProperties;
  }

  private inferJustifyContent(node: FigmaNode): string {
    // This would analyze the actual positioning of children
    // For now, return a sensible default
    return 'flex-start';
  }

  private inferAlignItems(node: FigmaNode): string {
    // This would analyze cross-axis alignment
    return 'stretch';
  }

  private inferBlockDisplayType(node: FigmaNode): 'block' | 'inline-block' {
    // Simple heuristic: if node has specific dimensions, likely block
    return node.absoluteBoundingBox ? 'block' : 'inline-block';
  }

  private extractPadding(node: FigmaNode): string | undefined {
    const { paddingTop = 0, paddingRight = 0, paddingBottom = 0, paddingLeft = 0 } = node;
    
    if (paddingTop === 0 && paddingRight === 0 && paddingBottom === 0 && paddingLeft === 0) {
      return undefined;
    }

    // Optimize padding notation
    if (paddingTop === paddingRight && paddingRight === paddingBottom && paddingBottom === paddingLeft) {
      return `${paddingTop}px`;
    }
    
    if (paddingTop === paddingBottom && paddingLeft === paddingRight) {
      return `${paddingTop}px ${paddingRight}px`;
    }

    return `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`;
  }

  analyzeResponsive(node: FigmaNode): ResponsiveRules {
    // Mutable intermediate type (not readonly)
    type MutableResponsiveRules = { [breakpoint: string]: { [property: string]: string | number } };

    const rules: MutableResponsiveRules = {};

    // Analyze constraints for responsive behavior
    if (node.constraints) {
      const mobileRules: Record<string, string | number> = {};
      const tabletRules: Record<string, string | number> = {};
      const desktopRules: Record<string, string | number> = {};

      // Horizontal constraints
      if (node.constraints.horizontal === 'STRETCH') {
        mobileRules.width = '100%';
        tabletRules.width = '100%';
        desktopRules.width = '100%';
      } else if (node.constraints.horizontal === 'SCALE') {
        mobileRules.width = '80%';
        tabletRules.width = '90%';
        desktopRules.width = '100%';
      }

      rules.mobile = mobileRules;
      rules.tablet = tabletRules;
      rules.desktop = desktopRules;
    }

    return {
      breakpoints: ['mobile', 'tablet', 'desktop'],
      rules
    } as ResponsiveRules; // Cast to the readonly type
  }
}

// =============================================================================
// MAIN DESIGN ANALYZER - ORCHESTRATES ALL ANALYZERS
// =============================================================================

export class DesignAnalyzer {
  private readonly config: AnalysisConfig;
  private readonly semanticAnalyzer: SemanticAnalyzer;
  private readonly colorAnalyzer: ColorAnalyzer;
  private readonly typographyAnalyzer: TypographyAnalyzer;
  private readonly layoutAnalyzer: LayoutAnalyzer;

  // Analysis results
  private semanticMapping: SemanticMapping = {};
  private colorPalette: ColorPalette | null = null;
  private typographyScale: TypographyScale = {};
  private layoutMap = new Map<string, LayoutProperties>();
  private responsiveRules = new Map<string, ResponsiveRules>();

  constructor(config: Partial<AnalysisConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
    this.semanticAnalyzer = new SemanticAnalyzer(this.config.semanticRules);
    this.colorAnalyzer = new ColorAnalyzer(this.config.colorAnalysis);
    this.typographyAnalyzer = new TypographyAnalyzer(this.config.typographyAnalysis);
    this.layoutAnalyzer = new LayoutAnalyzer();
  }

  private mergeWithDefaults(config: Partial<AnalysisConfig>): AnalysisConfig {
    return {
      semanticRules: config.semanticRules || this.getDefaultSemanticRules(),
      colorAnalysis: {
        groupSimilarColors: true,
        colorDistanceThreshold: 30,
        extractFromImages: false,
        ...config.colorAnalysis
      },
      typographyAnalysis: {
        groupSimilarStyles: true,
        fontSizeThreshold: 2,
        createTypeScale: true,
        ...config.typographyAnalysis
      },
      componentDetection: {
        enabled: true,
        similarityThreshold: 0.8,
        minInstanceCount: 2,
        ...config.componentDetection
      },
      performance: {
        maxDepth: 50,
        enableCaching: true,
        chunkSize: 1000,
        ...config.performance
      }
    };
  }

  private getDefaultSemanticRules(): SemanticRule[] {
    return [
      {
        role: 'header',
        patterns: ['header', 'navbar', 'nav', 'topbar'],
        contextualRules: [
          {
            condition: (node, depth) => depth <= 1 && node.name.toLowerCase().includes('nav'),
            priority: 10
          }
        ]
      },
      {
        role: 'footer',
        patterns: ['footer', 'bottom']
      },
      {
        role: 'main',
        patterns: ['main', 'content', 'body']
      },
      {
        role: 'aside',
        patterns: ['sidebar', 'aside', 'side']
      },
      {
        role: 'section',
        patterns: ['section', 'block', 'area']
      },
      {
        role: 'article',
        patterns: ['article', 'post', 'card']
      },
      {
        role: 'button',
        patterns: ['button', 'btn', 'cta']
      },
      {
        role: 'input',
        patterns: ['input', 'field', 'textbox']
      },
      {
        role: 'form',
        patterns: ['form', 'contact']
      }
    ];
  }

  /**
   * Analyze the complete Figma file
   */
  async analyze(figmaFile: FigmaFile): Promise<void> {
    try {
      // Run all analyzers
      await Promise.all([
        this.runSemanticAnalysis(figmaFile.document),
        this.runColorAnalysis(figmaFile.document),
        this.runTypographyAnalysis(figmaFile.document),
        this.runLayoutAnalysis(figmaFile.document)
      ]);
    } catch (error) {
      throw new Error(`Design analysis failed: ${error}`);
    }
  }

  private async runSemanticAnalysis(rootNode: FigmaNode): Promise<void> {
    this.semanticAnalyzer.analyze(rootNode);
    this.semanticMapping = this.semanticAnalyzer.getMapping();
  }

  private async runColorAnalysis(rootNode: FigmaNode): Promise<void> {
    this.colorAnalyzer.analyze(rootNode);
    this.colorPalette = this.colorAnalyzer.getPalette();
  }

  private async runTypographyAnalysis(rootNode: FigmaNode): Promise<void> {
    this.typographyAnalyzer.analyze(rootNode);
    this.typographyScale = this.typographyAnalyzer.getTypographyScale();
  }

  private async runLayoutAnalysis(rootNode: FigmaNode): Promise<void> {
    this.traverseForLayout(rootNode);
  }

  private traverseForLayout(node: FigmaNode): void {
    const layout = this.layoutAnalyzer.analyze(node);
    const responsive = this.layoutAnalyzer.analyzeResponsive(node);
    
    this.layoutMap.set(node.id, layout);
    this.responsiveRules.set(node.id, responsive);

    node.children?.forEach(child => this.traverseForLayout(child));
  }

  // =============================================================================
  // PUBLIC API - GETTERS FOR ANALYSIS RESULTS
  // =============================================================================

  getSemanticMapping(): SemanticMapping {
    return { ...this.semanticMapping };
  }

  getSemanticHierarchy(): Record<SemanticRole, string[]> {
    return this.semanticAnalyzer.getSemanticHierarchy();
  }

  getColorPalette(): ColorPalette {
    if (!this.colorPalette) {
      throw new Error('Color analysis not completed. Run analyze() first.');
    }
    return { ...this.colorPalette };
  }

  getTypographyScale(): TypographyScale {
    return { ...this.typographyScale };
  }

  getLayoutProperties(nodeId: string): LayoutProperties | undefined {
    return this.layoutMap.get(nodeId);
  }

  getResponsiveRules(nodeId: string): ResponsiveRules | undefined {
    return this.responsiveRules.get(nodeId);
  }

  getAllLayoutProperties(): Record<string, LayoutProperties> {
    return Object.fromEntries(this.layoutMap);
  }

  getAllResponsiveRules(): Record<string, ResponsiveRules> {
    return Object.fromEntries(this.responsiveRules);
  }

  /**
   * Export complete analysis results as JSON
   */
  exportAnalysis(): {
    semantic: SemanticMapping;
    semanticHierarchy: Record<SemanticRole, string[]>;
    colors: ColorPalette;
    typography: TypographyScale;
    layout: Record<string, LayoutProperties>;
    responsive: Record<string, ResponsiveRules>;
    metadata: {
      analyzedAt: string;
      nodesAnalyzed: number;
      config: AnalysisConfig;
    };
  } {
    return {
      semantic: this.getSemanticMapping(),
      semanticHierarchy: this.getSemanticHierarchy(),
      colors: this.getColorPalette(),
      typography: this.getTypographyScale(),
      layout: this.getAllLayoutProperties(),
      responsive: this.getAllResponsiveRules(),
      metadata: {
        analyzedAt: new Date().toISOString(),
        nodesAnalyzed: this.layoutMap.size,
        config: this.config
      }
    };
  }
}

// =============================================================================
// USAGE EXAMPLE
// =============================================================================

/*
// Example usage:
const config: Partial<AnalysisConfig> = {
  semanticRules: [
    {
      role: 'header',
      patterns: ['header', 'navbar'],
      contextualRules: [
        {
          condition: (node, depth) => depth === 0,
          priority: 10
        }
      ]
    }
  ],
  colorAnalysis: {
    groupSimilarColors: true,
    colorDistanceThreshold: 25
  }
};

const analyzer = new DesignAnalyzer(config);
await analyzer.analyze(figmaFile);

const results = analyzer.exportAnalysis();
console.log('Analysis complete:', results);
*/