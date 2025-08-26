import { FigmaApiResponse, FigmaNode, Color, Paint, TypeStyle } from '../types/figma';

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  borderRadius: BorderRadiusTokens;
  breakpoints: BreakpointTokens;
  animations: AnimationTokens;
}

export interface ColorTokens {
  primary: ColorScale;
  secondary: ColorScale;
  neutral: ColorScale;
  semantic: SemanticColors;
  custom: Record<string, string>;
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface SemanticColors {
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
}

export interface TypographyTokens {
  fontFamilies: Record<string, string>;
  fontSizes: Record<string, string>;
  fontWeights: Record<string, number>;
  lineHeights: Record<string, string>;
  letterSpacing: Record<string, string>;
  textStyles: Record<string, TextStyleToken>;
}

export interface TextStyleToken {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
  textTransform?: string;
}

export interface SpacingTokens {
  scale: Record<string, string>;
  semantic: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
}

export interface ShadowTokens {
  elevation: Record<string, string>;
  colored: Record<string, string>;
}

export interface BorderRadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface BreakpointTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface AnimationTokens {
  duration: Record<string, string>;
  easing: Record<string, string>;
  keyframes: Record<string, string>;
}

export class DesignSystemExtractor {
  private figmaData: FigmaApiResponse;
  private extractedColors: Set<string> = new Set();
  private extractedSpacing: Set<number> = new Set();
  private extractedTypography: Map<string, TypeStyle> = new Map();
  private extractedShadows: Set<string> = new Set();
  private extractedBorderRadius: Set<number> = new Set();

  constructor(figmaData: FigmaApiResponse) {
    this.figmaData = figmaData;
  }

  // Fő extrakciós metódus
  extractDesignTokens(): DesignTokens {
    this.analyzeDocument(this.figmaData.document);
    this.analyzeStyles();

    return {
      colors: this.generateColorTokens(),
      typography: this.generateTypographyTokens(),
      spacing: this.generateSpacingTokens(),
      shadows: this.generateShadowTokens(),
      borderRadius: this.generateBorderRadiusTokens(),
      breakpoints: this.generateBreakpointTokens(),
      animations: this.generateAnimationTokens(),
    };
  }

  // Dokumentum elemzése
  private analyzeDocument(node: FigmaNode): void {
    // Színek gyűjtése
    this.extractColorsFromNode(node);
    
    // Spacing értékek gyűjtése
    this.extractSpacingFromNode(node);
    
    // Typography gyűjtése
    this.extractTypographyFromNode(node);
    
    // Shadows gyűjtése
    this.extractShadowsFromNode(node);
    
    // Border radius gyűjtése
    this.extractBorderRadiusFromNode(node);

    // Rekurzív feldolgozás
    if (node.children) {
      node.children.forEach(child => this.analyzeDocument(child));
    }
  }

  // Figma styles elemzése
  private analyzeStyles(): void {
    Object.values(this.figmaData.styles || {}).forEach(style => {
      if (style.styleType === 'FILL') {
        // Színstílusok feldolgozása
      } else if (style.styleType === 'TEXT') {
        // Szövegstílusok feldolgozása
      } else if (style.styleType === 'EFFECT') {
        // Effekt stílusok feldolgozása
      }
    });
  }

  // Színek kinyerése node-ból
  private extractColorsFromNode(node: FigmaNode): void {
    // Background color
    if (node.backgroundColor) {
      this.extractedColors.add(this.colorToHex(node.backgroundColor));
    }

    // Fills
    if (node.fills) {
      node.fills.forEach(fill => {
        if (fill.type === 'SOLID' && fill.color) {
          this.extractedColors.add(this.colorToHex(fill.color, fill.opacity));
        }
      });
    }

    // Strokes
    if (node.strokes) {
      node.strokes.forEach(stroke => {
        if (stroke.type === 'SOLID' && stroke.color) {
          this.extractedColors.add(this.colorToHex(stroke.color, stroke.opacity));
        }
      });
    }

    // Text colors
    if (node.type === 'TEXT' && node.style?.fills) {
      node.style.fills.forEach(fill => {
        if (fill.type === 'SOLID' && fill.color) {
          this.extractedColors.add(this.colorToHex(fill.color, fill.opacity));
        }
      });
    }
  }

  // Spacing értékek kinyerése
  private extractSpacingFromNode(node: FigmaNode): void {
    if (node.paddingLeft) this.extractedSpacing.add(node.paddingLeft);
    if (node.paddingRight) this.extractedSpacing.add(node.paddingRight);
    if (node.paddingTop) this.extractedSpacing.add(node.paddingTop);
    if (node.paddingBottom) this.extractedSpacing.add(node.paddingBottom);
    if (node.itemSpacing) this.extractedSpacing.add(node.itemSpacing);
  }

  // Typography kinyerése
  private extractTypographyFromNode(node: FigmaNode): void {
    if (node.type === 'TEXT' && node.style) {
      const key = `${node.style.fontFamily}-${node.style.fontSize}-${node.style.fontWeight || 400}`;
      this.extractedTypography.set(key, node.style);
    }
  }

  // Shadows kinyerése
  private extractShadowsFromNode(node: FigmaNode): void {
    if (node.effects) {
      node.effects.forEach(effect => {
        if (effect.type === 'DROP_SHADOW' && effect.visible !== false) {
          const shadow = this.effectToCSS(effect);
          this.extractedShadows.add(shadow);
        }
      });
    }
  }

  // Border radius kinyerése
  private extractBorderRadiusFromNode(node: FigmaNode): void {
    if (node.cornerRadius) {
      this.extractedBorderRadius.add(node.cornerRadius);
    }
  }

  // Színtokenek generálása
  private generateColorTokens(): ColorTokens {
    const colors = Array.from(this.extractedColors);
    
    return {
      primary: this.generateColorScale(colors[0] || '#3b82f6'),
      secondary: this.generateColorScale(colors[1] || '#6366f1'),
      neutral: this.generateColorScale('#6b7280'),
      semantic: {
        success: this.generateColorScale('#10b981'),
        warning: this.generateColorScale('#f59e0b'),
        error: this.generateColorScale('#ef4444'),
        info: this.generateColorScale('#3b82f6'),
      },
      custom: this.generateCustomColors(colors),
    };
  }

  // Színskála generálása
  private generateColorScale(baseColor: string): ColorScale {
    // HSL konverzió és skála generálás
    const hsl = this.hexToHsl(baseColor);
    
    return {
      50: this.hslToHex(hsl.h, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 45)),
      100: this.hslToHex(hsl.h, Math.max(0, hsl.s - 15), Math.min(100, hsl.l + 35)),
      200: this.hslToHex(hsl.h, Math.max(0, hsl.s - 10), Math.min(100, hsl.l + 25)),
      300: this.hslToHex(hsl.h, Math.max(0, hsl.s - 5), Math.min(100, hsl.l + 15)),
      400: this.hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 5)),
      500: baseColor,
      600: this.hslToHex(hsl.h, Math.min(100, hsl.s + 5), Math.max(0, hsl.l - 5)),
      700: this.hslToHex(hsl.h, Math.min(100, hsl.s + 10), Math.max(0, hsl.l - 15)),
      800: this.hslToHex(hsl.h, Math.min(100, hsl.s + 15), Math.max(0, hsl.l - 25)),
      900: this.hslToHex(hsl.h, Math.min(100, hsl.s + 20), Math.max(0, hsl.l - 35)),
      950: this.hslToHex(hsl.h, Math.min(100, hsl.s + 25), Math.max(0, hsl.l - 45)),
    };
  }

  // Typography tokenek generálása
  private generateTypographyTokens(): TypographyTokens {
    const fontFamilies: Record<string, string> = {};
    const fontSizes: Record<string, string> = {};
    const fontWeights: Record<string, number> = {};
    const lineHeights: Record<string, string> = {};
    const letterSpacing: Record<string, string> = {};
    const textStyles: Record<string, TextStyleToken> = {};

    this.extractedTypography.forEach((style, key) => {
      // Font families
      const familyKey = style.fontFamily.toLowerCase().replace(/\s+/g, '-');
      fontFamilies[familyKey] = `"${style.fontFamily}", sans-serif`;

      // Font sizes
      const sizeKey = this.getFontSizeKey(style.fontSize);
      fontSizes[sizeKey] = `${style.fontSize}px`;

      // Font weights
      const weight = style.fontWeight || 400;
      const weightKey = this.getFontWeightKey(weight);
      fontWeights[weightKey] = weight;

      // Line heights
      if (style.lineHeightPx) {
        const lhKey = this.getLineHeightKey(style.lineHeightPx, style.fontSize);
        lineHeights[lhKey] = `${style.lineHeightPx}px`;
      }

      // Letter spacing
      if (style.letterSpacing) {
        const lsKey = this.getLetterSpacingKey(style.letterSpacing);
        letterSpacing[lsKey] = `${style.letterSpacing}px`;
      }

      // Text styles
      textStyles[key] = {
        fontFamily: fontFamilies[familyKey],
        fontSize: fontSizes[sizeKey],
        fontWeight: weight,
        lineHeight: style.lineHeightPx ? `${style.lineHeightPx}px` : '1.5',
        letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : 'normal',
      };
    });

    return {
      fontFamilies,
      fontSizes,
      fontWeights,
      lineHeights,
      letterSpacing,
      textStyles,
    };
  }

  // Spacing tokenek generálása
  private generateSpacingTokens(): SpacingTokens {
    const spacingArray = Array.from(this.extractedSpacing).sort((a, b) => a - b);
    const scale: Record<string, string> = {};

    spacingArray.forEach((value, index) => {
      scale[index.toString()] = `${value}px`;
    });

    return {
      scale,
      semantic: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
    };
  }

  // Shadow tokenek generálása
  private generateShadowTokens(): ShadowTokens {
    const shadows = Array.from(this.extractedShadows);
    const elevation: Record<string, string> = {};
    const colored: Record<string, string> = {};

    shadows.forEach((shadow, index) => {
      elevation[`level-${index + 1}`] = shadow;
    });

    return {
      elevation,
      colored,
    };
  }

  // Border radius tokenek generálása
  private generateBorderRadiusTokens(): BorderRadiusTokens {
    const radiusArray = Array.from(this.extractedBorderRadius).sort((a, b) => a - b);
    
    return {
      none: '0px',
      sm: `${radiusArray[0] || 2}px`,
      md: `${radiusArray[1] || 4}px`,
      lg: `${radiusArray[2] || 8}px`,
      xl: `${radiusArray[3] || 12}px`,
      '2xl': `${radiusArray[4] || 16}px`,
      '3xl': `${radiusArray[5] || 24}px`,
      full: '9999px',
    };
  }

  // Breakpoint tokenek generálása
  private generateBreakpointTokens(): BreakpointTokens {
    return {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    };
  }

  // Animáció tokenek generálása
  private generateAnimationTokens(): AnimationTokens {
    return {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
        slower: '750ms',
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        'ease-in': 'ease-in',
        'ease-out': 'ease-out',
        'ease-in-out': 'ease-in-out',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.3s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
      },
    };
  }

  // Segédfüggvények
  private colorToHex(color: Color, opacity?: number): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = opacity !== undefined ? opacity : (color.a !== undefined ? color.a : 1);
    
    if (a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    // Egyszerűsített HSL konverzió
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;

    if (0 <= h && h < 1/6) {
      r = c; g = x; b = 0;
    } else if (1/6 <= h && h < 1/3) {
      r = x; g = c; b = 0;
    } else if (1/3 <= h && h < 1/2) {
      r = 0; g = c; b = x;
    } else if (1/2 <= h && h < 2/3) {
      r = 0; g = x; b = c;
    } else if (2/3 <= h && h < 5/6) {
      r = x; g = 0; b = c;
    } else if (5/6 <= h && h < 1) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private generateCustomColors(colors: string[]): Record<string, string> {
    const custom: Record<string, string> = {};
    colors.forEach((color, index) => {
      custom[`custom-${index + 1}`] = color;
    });
    return custom;
  }

  private getFontSizeKey(fontSize: number): string {
    if (fontSize <= 12) return 'xs';
    if (fontSize <= 14) return 'sm';
    if (fontSize <= 16) return 'base';
    if (fontSize <= 18) return 'lg';
    if (fontSize <= 20) return 'xl';
    if (fontSize <= 24) return '2xl';
    if (fontSize <= 30) return '3xl';
    if (fontSize <= 36) return '4xl';
    if (fontSize <= 48) return '5xl';
    return '6xl';
  }

  private getFontWeightKey(weight: number): string {
    if (weight <= 200) return 'thin';
    if (weight <= 300) return 'light';
    if (weight <= 400) return 'normal';
    if (weight <= 500) return 'medium';
    if (weight <= 600) return 'semibold';
    if (weight <= 700) return 'bold';
    if (weight <= 800) return 'extrabold';
    return 'black';
  }

  private getLineHeightKey(lineHeight: number, fontSize: number): string {
    const ratio = lineHeight / fontSize;
    if (ratio <= 1.2) return 'tight';
    if (ratio <= 1.4) return 'snug';
    if (ratio <= 1.6) return 'normal';
    if (ratio <= 1.8) return 'relaxed';
    return 'loose';
  }

  private getLetterSpacingKey(spacing: number): string {
    if (spacing <= -0.5) return 'tighter';
    if (spacing <= -0.25) return 'tight';
    if (spacing <= 0.25) return 'normal';
    if (spacing <= 0.5) return 'wide';
    return 'wider';
  }

  private effectToCSS(effect: any): string {
    if (effect.type === 'DROP_SHADOW') {
      const x = effect.offset?.x || 0;
      const y = effect.offset?.y || 0;
      const blur = effect.radius || 0;
      const spread = effect.spread || 0;
      const color = effect.color ? this.colorToHex(effect.color) : 'rgba(0,0,0,0.25)';
      return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
    }
    return '';
  }
}