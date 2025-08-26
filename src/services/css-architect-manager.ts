import { FigmaNode } from '../types/figma';

export type CSSArchitecture = 'bem' | 'smacss' | 'itcss' | 'cube-css';

export interface CSSArchitectureConfig {
  architecture: CSSArchitecture;
  enableModularScale: boolean;
  enableCustomProperties: boolean;
  enableLogicalProperties: boolean;
  enableContainerQueries: boolean;
  enableLayerCascade: boolean;
}

export class CSSArchitectManager {
  private architecture: CSSArchitecture;
  private config: CSSArchitectureConfig;

  constructor(architecture: CSSArchitecture, config?: Partial<CSSArchitectureConfig>) {
    this.architecture = architecture;
    this.config = {
      architecture,
      enableModularScale: true,
      enableCustomProperties: true,
      enableLogicalProperties: true,
      enableContainerQueries: true,
      enableLayerCascade: true,
      ...config
    };
  }

  // Main CSS Generation Method
  generateArchitecturalCSS(node: FigmaNode, componentName: string): string {
    switch (this.architecture) {
      case 'bem':
        return this.generateBEMCSS(node, componentName);
      case 'smacss':
        return this.generateSMACSS(node, componentName);
      case 'itcss':
        return this.generateITCSS(node, componentName);
      case 'cube-css':
        return this.generateCubeCSS(node, componentName);
      default:
        return this.generateBEMCSS(node, componentName);
    }
  }

  // BEM (Block Element Modifier) Architecture
  private generateBEMCSS(node: FigmaNode, componentName: string): string {
    const blockName = this.toBEMBlock(componentName);
    const baseStyles = this.extractBaseStyles(node);
    const elements = this.extractElements(node);
    const modifiers = this.extractModifiers(node);

    let css = this.generateCSSHeader('BEM Architecture');

    // Block styles
    css += this.generateBlockStyles(blockName, baseStyles);

    // Element styles
    elements.forEach(element => {
      css += this.generateElementStyles(blockName, element);
    });

    // Modifier styles
    modifiers.forEach(modifier => {
      css += this.generateModifierStyles(blockName, modifier);
    });

    // Responsive styles
    css += this.generateResponsiveStyles(blockName, node);

    return css;
  }

  // SMACSS (Scalable and Modular Architecture for CSS) Architecture
  private generateSMACSS(node: FigmaNode, componentName: string): string {
    let css = this.generateCSSHeader('SMACSS Architecture');

    // Base rules (if needed)
    css += this.generateSMACSBase(node);

    // Layout rules
    css += this.generateSMACSLayout(node, componentName);

    // Module rules
    css += this.generateSMACSModule(node, componentName);

    // State rules
    css += this.generateSMACSState(node, componentName);

    // Theme rules
    css += this.generateSMACSTheme(node, componentName);

    return css;
  }

  // ITCSS (Inverted Triangle CSS) Architecture
  private generateITCSS(node: FigmaNode, componentName: string): string {
    let css = this.generateCSSHeader('ITCSS Architecture');

    // Settings layer (CSS custom properties)
    css += this.generateITCSSSettings(node);

    // Tools layer (mixins and functions)
    css += this.generateITCSSTools();

    // Generic layer (normalize, reset)
    css += this.generateITCSSGeneric();

    // Elements layer (base element styles)
    css += this.generateITCSSElements(node);

    // Objects layer (layout patterns)
    css += this.generateITCSSObjects(node, componentName);

    // Components layer (UI components)
    css += this.generateITCSSComponents(node, componentName);

    // Utilities layer (helper classes)
    css += this.generateITCSSUtilities(node);

    return css;
  }

  // CUBE CSS Architecture
  private generateCubeCSS(node: FigmaNode, componentName: string): string {
    let css = this.generateCSSHeader('CUBE CSS Architecture');

    // Composition layer
    css += this.generateCubeComposition(node, componentName);

    // Utilities layer
    css += this.generateCubeUtilities(node);

    // Block layer
    css += this.generateCubeBlock(node, componentName);

    // Exception layer
    css += this.generateCubeExceptions(node, componentName);

    return css;
  }

  // BEM Implementation Methods
  private toBEMBlock(componentName: string): string {
    return componentName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
  }

  private generateBlockStyles(blockName: string, styles: any): string {
    const properties = this.stylesToCSS(styles);
    
    return `
/* Block: ${blockName} */
.${blockName} {
${properties}
${this.config.enableCustomProperties ? this.generateCustomProperties(styles) : ''}
}
`;
  }

  private generateElementStyles(blockName: string, element: any): string {
    const elementName = element.name.toLowerCase().replace(/\s+/g, '-');
    const properties = this.stylesToCSS(element.styles);

    return `
/* Element: ${blockName}__${elementName} */
.${blockName}__${elementName} {
${properties}
}
`;
  }

  private generateModifierStyles(blockName: string, modifier: any): string {
    const modifierName = modifier.name.toLowerCase().replace(/\s+/g, '-');
    const properties = this.stylesToCSS(modifier.styles);

    return `
/* Modifier: ${blockName}--${modifierName} */
.${blockName}--${modifierName} {
${properties}
}
`;
  }

  // SMACSS Implementation Methods
  private generateSMACSBase(node: FigmaNode): string {
    return `
/* Base Rules */
/* Minimal base styles if needed */
`;
  }

  private generateSMACSLayout(node: FigmaNode, componentName: string): string {
    const layoutStyles = this.extractLayoutStyles(node);
    const className = `l-${componentName.toLowerCase()}`;

    return `
/* Layout Rules */
.${className} {
${this.stylesToCSS(layoutStyles)}
}
`;
  }

  private generateSMACSModule(node: FigmaNode, componentName: string): string {
    const moduleStyles = this.extractModuleStyles(node);
    const className = componentName.toLowerCase();

    return `
/* Module Rules */
.${className} {
${this.stylesToCSS(moduleStyles)}
}

.${className}-header {
  /* Header styles */
}

.${className}-body {
  /* Body styles */
}

.${className}-footer {
  /* Footer styles */
}
`;
  }

  private generateSMACSState(node: FigmaNode, componentName: string): string {
    return `
/* State Rules */
.is-hidden {
  display: none;
}

.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.is-active {
  /* Active state styles */
}

.is-loading {
  /* Loading state styles */
}
`;
  }

  private generateSMACSTheme(node: FigmaNode, componentName: string): string {
    return `
/* Theme Rules */
.theme-dark .${componentName.toLowerCase()} {
  /* Dark theme styles */
}

.theme-light .${componentName.toLowerCase()} {
  /* Light theme styles */
}
`;
  }

  // ITCSS Implementation Methods
  private generateITCSSSettings(node: FigmaNode): string {
    const colors = this.extractColors(node);
    const spacing = this.extractSpacing(node);
    const typography = this.extractTypography(node);

    return `
/* Settings Layer - CSS Custom Properties */
:root {
  /* Colors */
${colors.map(color => `  --color-${color.name}: ${color.value};`).join('\n')}

  /* Spacing */
${spacing.map(space => `  --spacing-${space.name}: ${space.value};`).join('\n')}

  /* Typography */
${typography.map(typo => `  --font-${typo.name}: ${typo.value};`).join('\n')}
}
`;
  }

  private generateITCSSTools(): string {
    return `
/* Tools Layer - Mixins and Functions */
/* Note: These would typically be in a preprocessor */

/* Utility mixins would go here */
`;
  }

  private generateITCSSGeneric(): string {
    return `
/* Generic Layer - Normalize/Reset */
/* Minimal generic styles */
`;
  }

  private generateITCSSElements(node: FigmaNode): string {
    return `
/* Elements Layer - Base Element Styles */
/* Component-specific element styles if needed */
`;
  }

  private generateITCSSObjects(node: FigmaNode, componentName: string): string {
    const layoutStyles = this.extractLayoutStyles(node);

    return `
/* Objects Layer - Layout Patterns */
.o-${componentName.toLowerCase()} {
${this.stylesToCSS(layoutStyles)}
}
`;
  }

  private generateITCSSComponents(node: FigmaNode, componentName: string): string {
    const componentStyles = this.extractComponentStyles(node);

    return `
/* Components Layer - UI Components */
.c-${componentName.toLowerCase()} {
${this.stylesToCSS(componentStyles)}
}
`;
  }

  private generateITCSSUtilities(node: FigmaNode): string {
    return `
/* Utilities Layer - Helper Classes */
.u-hidden {
  display: none !important;
}

.u-visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
`;
  }

  // CUBE CSS Implementation Methods
  private generateCubeComposition(node: FigmaNode, componentName: string): string {
    const layoutStyles = this.extractLayoutStyles(node);

    return `
/* Composition Layer - Layout and Structure */
.${componentName.toLowerCase()} {
${this.stylesToCSS(layoutStyles)}
${this.config.enableContainerQueries ? this.generateContainerQueries(node) : ''}
}
`;
  }

  private generateCubeUtilities(node: FigmaNode): string {
    const utilities = this.extractUtilities(node);

    return `
/* Utilities Layer - Single Purpose Classes */
${utilities.map(utility => `
.${utility.name} {
  ${utility.property}: ${utility.value} !important;
}`).join('\n')}
`;
  }

  private generateCubeBlock(node: FigmaNode, componentName: string): string {
    const blockStyles = this.extractBlockStyles(node);

    return `
/* Block Layer - Component Styles */
.${componentName.toLowerCase()} {
${this.stylesToCSS(blockStyles)}
}
`;
  }

  private generateCubeExceptions(node: FigmaNode, componentName: string): string {
    return `
/* Exception Layer - Context-Specific Overrides */
.${componentName.toLowerCase()}[data-state="loading"] {
  /* Loading state overrides */
}

.${componentName.toLowerCase()}[data-variant="primary"] {
  /* Primary variant overrides */
}
`;
  }

  // Responsive Styles Generation
  private generateResponsiveStyles(blockName: string, node: FigmaNode): string {
    if (!this.config.enableContainerQueries) {
      return this.generateMediaQueries(blockName, node);
    }

    return this.generateContainerQueries(node);
  }

  private generateMediaQueries(blockName: string, node: FigmaNode): string {
    return `
/* Responsive Styles */
@media (min-width: 768px) {
  .${blockName} {
    /* Tablet styles */
  }
}

@media (min-width: 1024px) {
  .${blockName} {
    /* Desktop styles */
  }
}
`;
  }

  private generateContainerQueries(node: FigmaNode): string {
    return `
/* Container Queries */
@container (min-width: 300px) {
  /* Small container styles */
}

@container (min-width: 500px) {
  /* Medium container styles */
}

@container (min-width: 700px) {
  /* Large container styles */
}
`;
  }

  // CSS Layer Cascade
  private generateCSSHeader(architectureName: string): string {
    if (!this.config.enableLayerCascade) {
      return `/* ${architectureName} */\n\n`;
    }

    return `/* ${architectureName} */
@layer reset, base, layout, components, utilities, overrides;

`;
  }

  // Helper Methods
  private extractBaseStyles(node: FigmaNode): any {
    return {
      display: this.getDisplayValue(node),
      position: 'relative',
      ...this.extractDimensions(node),
      ...this.extractColors(node),
      ...this.extractSpacing(node),
      ...this.extractBorders(node),
      ...this.extractShadows(node)
    };
  }

  private extractElements(node: FigmaNode): any[] {
    const elements = [];
    
    if (node.children) {
      node.children.forEach(child => {
        elements.push({
          name: child.name,
          styles: this.extractBaseStyles(child)
        });
      });
    }

    return elements;
  }

  private extractModifiers(node: FigmaNode): any[] {
    // Extract potential modifiers based on naming patterns
    const modifiers = [];
    
    // Size modifiers
    if (this.hasVariations(node, 'size')) {
      modifiers.push({
        name: 'small',
        styles: { fontSize: '0.875rem', padding: '0.5rem' }
      });
      modifiers.push({
        name: 'large',
        styles: { fontSize: '1.125rem', padding: '1rem' }
      });
    }

    // State modifiers
    modifiers.push({
      name: 'disabled',
      styles: { opacity: '0.5', pointerEvents: 'none' }
    });

    return modifiers;
  }

  private extractLayoutStyles(node: FigmaNode): any {
    return {
      display: this.getDisplayValue(node),
      flexDirection: node.layoutMode === 'HORIZONTAL' ? 'row' : 'column',
      gap: node.itemSpacing ? `${node.itemSpacing}px` : undefined,
      padding: this.extractPadding(node),
      ...this.extractDimensions(node)
    };
  }

  private extractModuleStyles(node: FigmaNode): any {
    return {
      ...this.extractColors(node),
      ...this.extractBorders(node),
      ...this.extractShadows(node),
      ...this.extractTypography(node)
    };
  }

  private extractComponentStyles(node: FigmaNode): any {
    return {
      ...this.extractBaseStyles(node),
      ...this.generateInteractionStyles(node)
    };
  }

  private extractBlockStyles(node: FigmaNode): any {
    return {
      ...this.extractColors(node),
      ...this.extractTypography(node),
      ...this.extractBorders(node)
    };
  }

  private extractUtilities(node: FigmaNode): any[] {
    const utilities = [];
    
    // Extract spacing utilities
    const spacing = this.extractSpacing(node);
    Object.entries(spacing).forEach(([key, value]) => {
      utilities.push({
        name: `p-${key}`,
        property: 'padding',
        value: value
      });
      utilities.push({
        name: `m-${key}`,
        property: 'margin',
        value: value
      });
    });

    return utilities;
  }

  private getDisplayValue(node: FigmaNode): string {
    if (node.layoutMode) {
      return 'flex';
    }
    if (node.type === 'TEXT') {
      return 'inline-block';
    }
    return 'block';
  }

  private extractDimensions(node: FigmaNode): any {
    const dimensions: any = {};
    
    if (node.absoluteBoundingBox) {
      dimensions.width = `${node.absoluteBoundingBox.width}px`;
      dimensions.height = `${node.absoluteBoundingBox.height}px`;
    }

    return dimensions;
  }

  private extractColors(node: FigmaNode): any {
    const colors: any = {};

    if (node.backgroundColor) {
      colors.backgroundColor = this.colorToCSS(node.backgroundColor);
    }

    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        colors.backgroundColor = this.colorToCSS(fill.color, fill.opacity);
      }
    }

    return colors;
  }

  private extractSpacing(node: FigmaNode): any {
    const spacing: any = {};

    if (node.paddingLeft || node.paddingRight || node.paddingTop || node.paddingBottom) {
      spacing.padding = this.extractPadding(node);
    }

    if (node.itemSpacing) {
      spacing.gap = `${node.itemSpacing}px`;
    }

    return spacing;
  }

  private extractPadding(node: FigmaNode): string {
    const top = node.paddingTop || 0;
    const right = node.paddingRight || 0;
    const bottom = node.paddingBottom || 0;
    const left = node.paddingLeft || 0;

    return `${top}px ${right}px ${bottom}px ${left}px`;
  }

  private extractBorders(node: FigmaNode): any {
    const borders: any = {};

    if (node.cornerRadius) {
      borders.borderRadius = `${node.cornerRadius}px`;
    }

    if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
      const stroke = node.strokes[0];
      if (stroke.color) {
        borders.border = `${node.strokeWeight}px solid ${this.colorToCSS(stroke.color)}`;
      }
    }

    return borders;
  }

  private extractShadows(node: FigmaNode): any {
    const shadows: any = {};

    if (node.effects && node.effects.length > 0) {
      const shadowEffects = node.effects.filter(effect => 
        effect.type === 'DROP_SHADOW' && effect.visible !== false
      );

      if (shadowEffects.length > 0) {
        shadows.boxShadow = shadowEffects
          .map(effect => this.effectToCSS(effect))
          .join(', ');
      }
    }

    return shadows;
  }

  private extractTypography(node: FigmaNode): any {
    const typography: any = {};

    if (node.type === 'TEXT' && node.style) {
      typography.fontFamily = `"${node.style.fontFamily}", sans-serif`;
      typography.fontSize = `${node.style.fontSize}px`;
      typography.lineHeight = `${node.style.lineHeightPx}px`;
      typography.letterSpacing = `${node.style.letterSpacing}px`;

      if (node.style.fills && node.style.fills.length > 0) {
        const textFill = node.style.fills[0];
        if (textFill.color) {
          typography.color = this.colorToCSS(textFill.color);
        }
      }
    }

    return typography;
  }

  private generateInteractionStyles(node: FigmaNode): any {
    const interactions: any = {};

    // Add hover states for interactive elements
    if (this.isInteractive(node)) {
      interactions['&:hover'] = {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
      };

      interactions['&:active'] = {
        transform: 'translateY(0)'
      };

      interactions['&:focus'] = {
        outline: '2px solid var(--color-primary)',
        outlineOffset: '2px'
      };
    }

    return interactions;
  }

  private generateCustomProperties(styles: any): string {
    const properties = [];

    Object.entries(styles).forEach(([key, value]) => {
      const customProp = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      properties.push(`  ${customProp}: ${value};`);
    });

    return properties.join('\n');
  }

  private stylesToCSS(styles: any): string {
    return Object.entries(styles)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `  ${this.camelToKebab(key)}: ${value};`)
      .join('\n');
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  private colorToCSS(color: any, opacity?: number): string {
    const { r, g, b, a } = color;
    const alpha = opacity !== undefined ? opacity : (a !== undefined ? a : 1);
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
  }

  private effectToCSS(effect: any): string {
    if (effect.type === 'DROP_SHADOW') {
      const x = effect.offset?.x || 0;
      const y = effect.offset?.y || 0;
      const blur = effect.radius || 0;
      const color = effect.color ? this.colorToCSS(effect.color) : 'rgba(0,0,0,0.25)';
      return `${x}px ${y}px ${blur}px ${color}`;
    }
    return '';
  }

  private hasVariations(node: FigmaNode, type: string): boolean {
    // Check if component has variations based on naming or properties
    return node.name.toLowerCase().includes(type);
  }

  private isInteractive(node: FigmaNode): boolean {
    const name = node.name.toLowerCase();
    return name.includes('button') || 
           name.includes('link') || 
           name.includes('click') ||
           name.includes('interactive');
  }
}