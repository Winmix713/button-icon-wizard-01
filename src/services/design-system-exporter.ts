import { DesignTokens } from './design-system-extractor';

export interface ExportOptions {
  format: 'css' | 'scss' | 'js' | 'json' | 'tailwind' | 'figma-tokens';
  includeComments: boolean;
  useCustomProperties: boolean;
  prefix?: string;
}

export class DesignSystemExporter {
  private tokens: DesignTokens;
  private options: ExportOptions;

  constructor(tokens: DesignTokens, options: ExportOptions) {
    this.tokens = tokens;
    this.options = options;
  }

  // Fő export metódus
  export(): { filename: string; content: string }[] {
    switch (this.options.format) {
      case 'css':
        return this.exportCSS();
      case 'scss':
        return this.exportSCSS();
      case 'js':
        return this.exportJS();
      case 'json':
        return this.exportJSON();
      case 'tailwind':
        return this.exportTailwind();
      case 'figma-tokens':
        return this.exportFigmaTokens();
      default:
        return this.exportCSS();
    }
  }

  // CSS export
  private exportCSS(): { filename: string; content: string }[] {
    const files = [];

    // Fő tokens fájl
    files.push({
      filename: 'tokens.css',
      content: this.generateCSSTokens()
    });

    // Utility classes
    files.push({
      filename: 'utilities.css',
      content: this.generateCSSUtilities()
    });

    // Component base styles
    files.push({
      filename: 'components.css',
      content: this.generateCSSComponents()
    });

    return files;
  }

  // SCSS export
  private exportSCSS(): { filename: string; content: string }[] {
    const files = [];

    files.push({
      filename: '_tokens.scss',
      content: this.generateSCSSTokens()
    });

    files.push({
      filename: '_mixins.scss',
      content: this.generateSCSSMixins()
    });

    files.push({
      filename: '_utilities.scss',
      content: this.generateSCSSUtilities()
    });

    files.push({
      filename: 'index.scss',
      content: `@import 'tokens';
@import 'mixins';
@import 'utilities';`
    });

    return files;
  }

  // JavaScript export
  private exportJS(): { filename: string; content: string }[] {
    return [{
      filename: 'tokens.js',
      content: `export const designTokens = ${JSON.stringify(this.tokens, null, 2)};

export const { colors, typography, spacing, shadows, borderRadius, breakpoints, animations } = designTokens;

// Utility functions
export const getColor = (path) => {
  const keys = path.split('.');
  let value = colors;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

export const getSpacing = (key) => spacing.semantic[key] || spacing.scale[key];
export const getTypography = (key) => typography.textStyles[key];
export const getShadow = (key) => shadows.elevation[key];
export const getBorderRadius = (key) => borderRadius[key];
export const getBreakpoint = (key) => breakpoints[key];
`
    }];
  }

  // JSON export
  private exportJSON(): { filename: string; content: string }[] {
    return [{
      filename: 'design-tokens.json',
      content: JSON.stringify(this.tokens, null, 2)
    }];
  }

  // Tailwind config export
  private exportTailwind(): { filename: string; content: string }[] {
    return [{
      filename: 'tailwind.config.js',
      content: this.generateTailwindConfig()
    }];
  }

  // Figma Tokens export
  private exportFigmaTokens(): { filename: string; content: string }[] {
    return [{
      filename: 'figma-tokens.json',
      content: JSON.stringify(this.convertToFigmaTokensFormat(), null, 2)
    }];
  }

  // CSS tokens generálás
  private generateCSSTokens(): string {
    const prefix = this.options.prefix || '';
    let css = '';

    if (this.options.includeComments) {
      css += `/* Design Tokens - Generated from Figma */\n\n`;
    }

    css += `:root {\n`;

    // Colors
    if (this.options.includeComments) {
      css += `  /* Colors */\n`;
    }
    
    Object.entries(this.tokens.colors.primary).forEach(([key, value]) => {
      css += `  --${prefix}color-primary-${key}: ${value};\n`;
    });

    Object.entries(this.tokens.colors.secondary).forEach(([key, value]) => {
      css += `  --${prefix}color-secondary-${key}: ${value};\n`;
    });

    Object.entries(this.tokens.colors.neutral).forEach(([key, value]) => {
      css += `  --${prefix}color-neutral-${key}: ${value};\n`;
    });

    // Semantic colors
    Object.entries(this.tokens.colors.semantic).forEach(([semanticKey, scale]) => {
      Object.entries(scale).forEach(([key, value]) => {
        css += `  --${prefix}color-${semanticKey}-${key}: ${value};\n`;
      });
    });

    // Typography
    if (this.options.includeComments) {
      css += `\n  /* Typography */\n`;
    }
    
    Object.entries(this.tokens.typography.fontFamilies).forEach(([key, value]) => {
      css += `  --${prefix}font-family-${key}: ${value};\n`;
    });

    Object.entries(this.tokens.typography.fontSizes).forEach(([key, value]) => {
      css += `  --${prefix}font-size-${key}: ${value};\n`;
    });

    Object.entries(this.tokens.typography.fontWeights).forEach(([key, value]) => {
      css += `  --${prefix}font-weight-${key}: ${value};\n`;
    });

    // Spacing
    if (this.options.includeComments) {
      css += `\n  /* Spacing */\n`;
    }
    
    Object.entries(this.tokens.spacing.semantic).forEach(([key, value]) => {
      css += `  --${prefix}spacing-${key}: ${value};\n`;
    });

    // Shadows
    if (this.options.includeComments) {
      css += `\n  /* Shadows */\n`;
    }
    
    Object.entries(this.tokens.shadows.elevation).forEach(([key, value]) => {
      css += `  --${prefix}shadow-${key}: ${value};\n`;
    });

    // Border Radius
    if (this.options.includeComments) {
      css += `\n  /* Border Radius */\n`;
    }
    
    Object.entries(this.tokens.borderRadius).forEach(([key, value]) => {
      css += `  --${prefix}border-radius-${key}: ${value};\n`;
    });

    // Breakpoints
    if (this.options.includeComments) {
      css += `\n  /* Breakpoints */\n`;
    }
    
    Object.entries(this.tokens.breakpoints).forEach(([key, value]) => {
      css += `  --${prefix}breakpoint-${key}: ${value};\n`;
    });

    // Animations
    if (this.options.includeComments) {
      css += `\n  /* Animations */\n`;
    }
    
    Object.entries(this.tokens.animations.duration).forEach(([key, value]) => {
      css += `  --${prefix}duration-${key}: ${value};\n`;
    });

    Object.entries(this.tokens.animations.easing).forEach(([key, value]) => {
      css += `  --${prefix}easing-${key}: ${value};\n`;
    });

    css += `}\n`;

    return css;
  }

  // CSS utilities generálás
  private generateCSSUtilities(): string {
    let css = '';

    if (this.options.includeComments) {
      css += `/* Utility Classes */\n\n`;
    }

    // Color utilities
    css += `/* Color Utilities */\n`;
    Object.entries(this.tokens.colors.primary).forEach(([key, value]) => {
      css += `.text-primary-${key} { color: var(--color-primary-${key}); }\n`;
      css += `.bg-primary-${key} { background-color: var(--color-primary-${key}); }\n`;
    });

    // Typography utilities
    css += `\n/* Typography Utilities */\n`;
    Object.entries(this.tokens.typography.fontSizes).forEach(([key, value]) => {
      css += `.text-${key} { font-size: var(--font-size-${key}); }\n`;
    });

    // Spacing utilities
    css += `\n/* Spacing Utilities */\n`;
    Object.entries(this.tokens.spacing.semantic).forEach(([key, value]) => {
      css += `.p-${key} { padding: var(--spacing-${key}); }\n`;
      css += `.m-${key} { margin: var(--spacing-${key}); }\n`;
    });

    return css;
  }

  // CSS components generálás
  private generateCSSComponents(): string {
    return `/* Component Base Styles */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  transition: all var(--duration-normal) var(--easing-ease-in-out);
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: var(--color-primary-500);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-600);
}

.card {
  background-color: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-level-1);
  padding: var(--spacing-lg);
}

.input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}
`;
  }

  // SCSS tokens generálás
  private generateSCSSTokens(): string {
    let scss = '';

    if (this.options.includeComments) {
      scss += `// Design Tokens - Generated from Figma\n\n`;
    }

    // Colors map
    scss += `// Colors\n`;
    scss += `$colors: (\n`;
    scss += `  primary: (\n`;
    Object.entries(this.tokens.colors.primary).forEach(([key, value]) => {
      scss += `    ${key}: ${value},\n`;
    });
    scss += `  ),\n`;
    scss += `  secondary: (\n`;
    Object.entries(this.tokens.colors.secondary).forEach(([key, value]) => {
      scss += `    ${key}: ${value},\n`;
    });
    scss += `  ),\n`;
    scss += `);\n\n`;

    // Typography map
    scss += `// Typography\n`;
    scss += `$typography: (\n`;
    scss += `  font-families: (\n`;
    Object.entries(this.tokens.typography.fontFamilies).forEach(([key, value]) => {
      scss += `    ${key}: ${value},\n`;
    });
    scss += `  ),\n`;
    scss += `  font-sizes: (\n`;
    Object.entries(this.tokens.typography.fontSizes).forEach(([key, value]) => {
      scss += `    ${key}: ${value},\n`;
    });
    scss += `  ),\n`;
    scss += `);\n\n`;

    // Spacing map
    scss += `// Spacing\n`;
    scss += `$spacing: (\n`;
    Object.entries(this.tokens.spacing.semantic).forEach(([key, value]) => {
      scss += `  ${key}: ${value},\n`;
    });
    scss += `);\n\n`;

    return scss;
  }

  // SCSS mixins generálás
  private generateSCSSMixins(): string {
    return `// Mixins

@function color($palette, $shade: 500) {
  @return map-get(map-get($colors, $palette), $shade);
}

@function spacing($key) {
  @return map-get($spacing, $key);
}

@mixin text-style($style) {
  $text-styles: map-get($typography, text-styles);
  $style-map: map-get($text-styles, $style);
  
  @if $style-map {
    font-family: map-get($style-map, font-family);
    font-size: map-get($style-map, font-size);
    font-weight: map-get($style-map, font-weight);
    line-height: map-get($style-map, line-height);
    letter-spacing: map-get($style-map, letter-spacing);
  }
}

@mixin button-variant($bg-color, $text-color: white) {
  background-color: $bg-color;
  color: $text-color;
  
  &:hover {
    background-color: darken($bg-color, 10%);
  }
  
  &:active {
    background-color: darken($bg-color, 15%);
  }
}

@mixin card-shadow($level: 1) {
  $shadows: map-get($tokens, shadows);
  $elevation: map-get($shadows, elevation);
  box-shadow: map-get($elevation, level-#{$level});
}
`;
  }

  // SCSS utilities generálás
  private generateSCSSUtilities(): string {
    return `// Utility Classes

// Color utilities
@each $palette, $shades in $colors {
  @each $shade, $color in $shades {
    .text-#{$palette}-#{$shade} {
      color: $color;
    }
    
    .bg-#{$palette}-#{$shade} {
      background-color: $color;
    }
  }
}

// Spacing utilities
@each $key, $value in $spacing {
  .p-#{$key} { padding: $value; }
  .m-#{$key} { margin: $value; }
  .pt-#{$key} { padding-top: $value; }
  .pb-#{$key} { padding-bottom: $value; }
  .pl-#{$key} { padding-left: $value; }
  .pr-#{$key} { padding-right: $value; }
  .mt-#{$key} { margin-top: $value; }
  .mb-#{$key} { margin-bottom: $value; }
  .ml-#{$key} { margin-left: $value; }
  .mr-#{$key} { margin-right: $value; }
}
`;
  }

  // Tailwind config generálás
  private generateTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: ${JSON.stringify(this.tokens.colors.primary, null, 8)},
        secondary: ${JSON.stringify(this.tokens.colors.secondary, null, 8)},
        neutral: ${JSON.stringify(this.tokens.colors.neutral, null, 8)},
        success: ${JSON.stringify(this.tokens.colors.semantic.success, null, 8)},
        warning: ${JSON.stringify(this.tokens.colors.semantic.warning, null, 8)},
        error: ${JSON.stringify(this.tokens.colors.semantic.error, null, 8)},
        info: ${JSON.stringify(this.tokens.colors.semantic.info, null, 8)},
      },
      fontFamily: ${JSON.stringify(this.tokens.typography.fontFamilies, null, 8)},
      fontSize: ${JSON.stringify(this.tokens.typography.fontSizes, null, 8)},
      fontWeight: ${JSON.stringify(this.tokens.typography.fontWeights, null, 8)},
      spacing: ${JSON.stringify(this.tokens.spacing.semantic, null, 8)},
      boxShadow: ${JSON.stringify(this.tokens.shadows.elevation, null, 8)},
      borderRadius: ${JSON.stringify(this.tokens.borderRadius, null, 8)},
      screens: ${JSON.stringify(this.tokens.breakpoints, null, 8)},
      transitionDuration: ${JSON.stringify(this.tokens.animations.duration, null, 8)},
      transitionTimingFunction: ${JSON.stringify(this.tokens.animations.easing, null, 8)},
    },
  },
  plugins: [],
};
`;
  }

  // Figma Tokens formátum konverzió
  private convertToFigmaTokensFormat(): any {
    return {
      global: {
        colors: {
          primary: this.convertColorScaleToFigmaTokens(this.tokens.colors.primary),
          secondary: this.convertColorScaleToFigmaTokens(this.tokens.colors.secondary),
          neutral: this.convertColorScaleToFigmaTokens(this.tokens.colors.neutral),
        },
        typography: {
          fontFamilies: this.convertToFigmaTokenValues(this.tokens.typography.fontFamilies),
          fontSizes: this.convertToFigmaTokenValues(this.tokens.typography.fontSizes),
          fontWeights: this.convertToFigmaTokenValues(this.tokens.typography.fontWeights),
        },
        spacing: this.convertToFigmaTokenValues(this.tokens.spacing.semantic),
        borderRadius: this.convertToFigmaTokenValues(this.tokens.borderRadius),
        boxShadow: this.convertToFigmaTokenValues(this.tokens.shadows.elevation),
      }
    };
  }

  private convertColorScaleToFigmaTokens(scale: any): any {
    const result: any = {};
    Object.entries(scale).forEach(([key, value]) => {
      result[key] = { value, type: 'color' };
    });
    return result;
  }

  private convertToFigmaTokenValues(obj: any): any {
    const result: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[key] = { value };
    });
    return result;
  }
}