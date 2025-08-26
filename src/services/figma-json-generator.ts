import { FigmaFile, FigmaNode } from '../types/figma';

interface FigmaElementInfo {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  children?: FigmaElementInfo[];
  styles?: {
    background?: string;
    color?: string;
    fontSize?: number;
    fontWeight?: number;
    borderRadius?: number;
    opacity?: number;
    [key: string]: any;
  };
  constraints?: any;
  layoutMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  text?: string;
}

interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number; a?: number };
  usage: string[];
  name?: string;
}

interface TypographyInfo {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;
  usage: string[];
}

interface ComponentInfo {
  id: string;
  name: string;
  description?: string;
  type: string;
  variants?: any[];
  properties?: any[];
}

interface StyleTokenInfo {
  id: string;
  name: string;
  type: 'FILL' | 'EFFECT' | 'TEXT' | 'GRID';
  value: any;
  usage: string[];
}

interface FigmaAnalysisResult {
  fileInfo: {
    name: string;
    lastModified: string;
    version: string;
    thumbnailUrl?: string;
    role: string;
    editorType: string;
  };
  elements: FigmaElementInfo[];
  colorPalette: ColorInfo[];
  typography: TypographyInfo[];
  components: ComponentInfo[];
  styleTokens: StyleTokenInfo[];
  layoutAnalysis: {
    totalElements: number;
    layoutTypes: { [key: string]: number };
    containerElements: number;
    textElements: number;
    imageElements: number;
    buttonElements: number;
  };
  designTokens: {
    spacing: number[];
    borderRadius: number[];
    shadows: string[];
    gradients: string[];
  };
  exportInfo: {
    generatedAt: string;
    figmaFileId: string;
    totalPages: number;
    totalFrames: number;
    analysisVersion: string;
  };
}

export class FigmaJsonGenerator {
  private figmaFile: FigmaFile;

  constructor(figmaFile: FigmaFile) {
    this.figmaFile = figmaFile;
  }

  generateJson(): FigmaAnalysisResult {
    return {
      fileInfo: this.extractFileInfo(),
      elements: this.processElements(),
      colorPalette: this.extractColorPalette(),
      typography: this.extractTypography(),
      components: this.extractComponents(),
      styleTokens: this.extractStyleTokens(),
      layoutAnalysis: this.analyzeLayout(),
      designTokens: this.extractDesignTokens(),
      exportInfo: this.generateExportInfo()
    };
  }

  private extractFileInfo() {
    return {
      name: this.figmaFile.name,
      lastModified: this.figmaFile.lastModified,
      version: this.figmaFile.version,
      thumbnailUrl: this.figmaFile.thumbnailUrl,
      role: this.figmaFile.role,
      editorType: this.figmaFile.editorType
    };
  }

  private processElements(): FigmaElementInfo[] {
    const elements: FigmaElementInfo[] = [];
    
    if (this.figmaFile.document?.children) {
      this.figmaFile.document.children.forEach(page => {
        if (page.children) {
          page.children.forEach(frame => {
            const element = this.processNode(frame);
            if (element) {
              elements.push(element);
            }
          });
        }
      });
    }

    return elements;
  }

  private processNode(node: any): FigmaElementInfo | null {
    if (!node) return null;

    const element: FigmaElementInfo = {
      id: node.id,
      name: node.name,
      type: node.type,
      absoluteBoundingBox: node.absoluteBoundingBox,
      fills: node.fills,
      strokes: node.strokes,
      effects: node.effects,
      styles: this.extractNodeStyles(node),
      constraints: node.constraints,
      layoutMode: node.layoutMode,
      primaryAxisAlignItems: node.primaryAxisAlignItems,
      counterAxisAlignItems: node.counterAxisAlignItems,
      paddingLeft: node.paddingLeft,
      paddingRight: node.paddingRight,
      paddingTop: node.paddingTop,
      paddingBottom: node.paddingBottom,
      itemSpacing: node.itemSpacing,
      text: node.characters
    };

    // Process children
    if (node.children && Array.isArray(node.children)) {
      element.children = [];
      node.children.forEach(child => {
        const childElement = this.processNode(child);
        if (childElement) {
          element.children!.push(childElement);
        }
      });
    }

    return element;
  }

  private extractNodeStyles(node: any): any {
    const styles: any = {};

    // Background/Fill colors
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        styles.background = this.rgbaToHex(fill.color.r, fill.color.g, fill.color.b, fill.color.a || 1);
      } else if (fill.type === 'GRADIENT_LINEAR') {
        styles.background = this.extractGradient(fill);
      }
    }

    // Text styles
    if (node.style) {
      if (node.style.fontFamily) styles.fontFamily = node.style.fontFamily;
      if (node.style.fontSize) styles.fontSize = node.style.fontSize;
      if (node.style.fontWeight) styles.fontWeight = node.style.fontWeight;
      if (node.style.lineHeightPx) styles.lineHeight = node.style.lineHeightPx;
      if (node.style.letterSpacing) styles.letterSpacing = node.style.letterSpacing;
      if (node.style.textAlignHorizontal) styles.textAlign = node.style.textAlignHorizontal.toLowerCase();
    }

    // Border radius
    if (node.cornerRadius) {
      styles.borderRadius = node.cornerRadius;
    } else if (node.rectangleCornerRadii) {
      styles.borderRadius = node.rectangleCornerRadii;
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity !== 1) {
      styles.opacity = node.opacity;
    }

    // Effects (shadows, blurs)
    if (node.effects && node.effects.length > 0) {
      styles.effects = node.effects.map(effect => ({
        type: effect.type,
        visible: effect.visible,
        color: effect.color ? this.rgbaToHex(effect.color.r, effect.color.g, effect.color.b, effect.color.a || 1) : undefined,
        offset: effect.offset,
        radius: effect.radius,
        spread: effect.spread
      }));
    }

    return styles;
  }

  private extractColorPalette(): ColorInfo[] {
    const colors: Map<string, ColorInfo> = new Map();
    
    const addColor = (colorObj: any, usage: string) => {
      if (!colorObj || !colorObj.color) return;
      
      const { r, g, b, a = 1 } = colorObj.color;
      const hex = this.rgbaToHex(r, g, b, a);
      
      if (colors.has(hex)) {
        colors.get(hex)!.usage.push(usage);
      } else {
        colors.set(hex, {
          hex,
          rgb: { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a },
          usage: [usage]
        });
      }
    };

    const processNodeColors = (node: any, path: string = '') => {
      if (node.fills) {
        node.fills.forEach((fill: any, index: number) => {
          if (fill.type === 'SOLID' && fill.color) {
            addColor(fill, `${path}/${node.name || node.id} (fill ${index})`);
          }
        });
      }

      if (node.strokes) {
        node.strokes.forEach((stroke: any, index: number) => {
          if (stroke.type === 'SOLID' && stroke.color) {
            addColor(stroke, `${path}/${node.name || node.id} (stroke ${index})`);
          }
        });
      }

      if (node.children) {
        node.children.forEach((child: any) => {
          processNodeColors(child, `${path}/${node.name || node.id}`);
        });
      }
    };

    if (this.figmaFile.document?.children) {
      this.figmaFile.document.children.forEach(page => {
        if (page.children) {
          page.children.forEach(frame => {
            processNodeColors(frame, page.name || 'Page');
          });
        }
      });
    }

    return Array.from(colors.values());
  }

  private extractTypography(): TypographyInfo[] {
    const typography: Map<string, TypographyInfo> = new Map();

    const processNodeTypography = (node: any, path: string = '') => {
      if (node.type === 'TEXT' && node.style) {
        const key = `${node.style.fontFamily || 'default'}-${node.style.fontSize || 16}-${node.style.fontWeight || 400}`;
        
        if (typography.has(key)) {
          typography.get(key)!.usage.push(`${path}/${node.name || node.id}`);
        } else {
          typography.set(key, {
            fontFamily: node.style.fontFamily,
            fontSize: node.style.fontSize,
            fontWeight: node.style.fontWeight,
            lineHeight: node.style.lineHeightPx,
            letterSpacing: node.style.letterSpacing,
            textAlign: node.style.textAlignHorizontal?.toLowerCase(),
            usage: [`${path}/${node.name || node.id}`]
          });
        }
      }

      if (node.children) {
        node.children.forEach((child: any) => {
          processNodeTypography(child, `${path}/${node.name || node.id}`);
        });
      }
    };

    if (this.figmaFile.document?.children) {
      this.figmaFile.document.children.forEach(page => {
        if (page.children) {
          page.children.forEach(frame => {
            processNodeTypography(frame, page.name || 'Page');
          });
        }
      });
    }

    return Array.from(typography.values());
  }

  private extractComponents(): ComponentInfo[] {
    const components: ComponentInfo[] = [];

    if (this.figmaFile.components) {
      Object.entries(this.figmaFile.components).forEach(([id, component]: [string, any]) => {
        components.push({
          id,
          name: component.name,
          description: component.description,
          type: component.type,
          variants: component.variants,
          properties: component.properties
        });
      });
    }

    return components;
  }

  private extractStyleTokens(): StyleTokenInfo[] {
    const tokens: StyleTokenInfo[] = [];

    if (this.figmaFile.styles) {
      Object.entries(this.figmaFile.styles).forEach(([id, style]: [string, any]) => {
        tokens.push({
          id,
          name: style.name,
          type: style.styleType,
          value: style.value || style,
          usage: [] // This would need to be calculated by traversing the document
        });
      });
    }

    return tokens;
  }

  private analyzeLayout() {
    let totalElements = 0;
    let containerElements = 0;
    let textElements = 0;
    let imageElements = 0;
    let buttonElements = 0;
    const layoutTypes: { [key: string]: number } = {};

    const analyzeNode = (node: any) => {
      totalElements++;

      // Count layout types
      if (node.layoutMode) {
        layoutTypes[node.layoutMode] = (layoutTypes[node.layoutMode] || 0) + 1;
      }

      // Count element types
      switch (node.type) {
        case 'FRAME':
        case 'GROUP':
          containerElements++;
          break;
        case 'TEXT':
          textElements++;
          break;
        case 'RECTANGLE':
        case 'ELLIPSE':
          if (node.name?.toLowerCase().includes('button')) {
            buttonElements++;
          } else if (node.fills?.some((fill: any) => fill.type === 'IMAGE')) {
            imageElements++;
          }
          break;
      }

      if (node.children) {
        node.children.forEach(analyzeNode);
      }
    };

    if (this.figmaFile.document?.children) {
      this.figmaFile.document.children.forEach(page => {
        if (page.children) {
          page.children.forEach(analyzeNode);
        }
      });
    }

    return {
      totalElements,
      layoutTypes,
      containerElements,
      textElements,
      imageElements,
      buttonElements
    };
  }

  private extractDesignTokens() {
    const spacing: Set<number> = new Set();
    const borderRadius: Set<number> = new Set();
    const shadows: Set<string> = new Set();
    const gradients: Set<string> = new Set();

    const processNode = (node: any) => {
      // Extract spacing
      if (node.paddingLeft) spacing.add(node.paddingLeft);
      if (node.paddingRight) spacing.add(node.paddingRight);
      if (node.paddingTop) spacing.add(node.paddingTop);
      if (node.paddingBottom) spacing.add(node.paddingBottom);
      if (node.itemSpacing) spacing.add(node.itemSpacing);

      // Extract border radius
      if (node.cornerRadius) borderRadius.add(node.cornerRadius);
      if (node.rectangleCornerRadii) {
        node.rectangleCornerRadii.forEach((radius: number) => borderRadius.add(radius));
      }

      // Extract shadows and effects
      if (node.effects) {
        node.effects.forEach((effect: any) => {
          if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            const shadowStr = `${effect.offset?.x || 0}px ${effect.offset?.y || 0}px ${effect.radius || 0}px`;
            shadows.add(shadowStr);
          }
        });
      }

      // Extract gradients
      if (node.fills) {
        node.fills.forEach((fill: any) => {
          if (fill.type === 'GRADIENT_LINEAR') {
            gradients.add(this.extractGradient(fill));
          }
        });
      }

      if (node.children) {
        node.children.forEach(processNode);
      }
    };

    if (this.figmaFile.document?.children) {
      this.figmaFile.document.children.forEach(page => {
        if (page.children) {
          page.children.forEach(processNode);
        }
      });
    }

    return {
      spacing: Array.from(spacing).sort((a, b) => a - b),
      borderRadius: Array.from(borderRadius).sort((a, b) => a - b),
      shadows: Array.from(shadows),
      gradients: Array.from(gradients)
    };
  }

  private generateExportInfo() {
    let totalPages = 0;
    let totalFrames = 0;

    if (this.figmaFile.document?.children) {
      totalPages = this.figmaFile.document.children.length;
      this.figmaFile.document.children.forEach(page => {
        if (page.children) {
          totalFrames += page.children.length;
        }
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      figmaFileId: this.figmaFile.mainFileKey || 'unknown',
      totalPages,
      totalFrames,
      analysisVersion: '1.0.0'
    };
  }

  // Utility methods
  private rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    return a < 1 ? `${hex}${toHex(a)}` : hex;
  }

  private extractGradient(fill: any): string {
    if (!fill.gradientStops || fill.gradientStops.length < 2) return '';
    
    const stops = fill.gradientStops.map((stop: any) => {
      const color = this.rgbaToHex(stop.color.r, stop.color.g, stop.color.b, stop.color.a);
      return `${color} ${Math.round(stop.position * 100)}%`;
    }).join(', ');
    
    return `linear-gradient(135deg, ${stops})`;
  }
}