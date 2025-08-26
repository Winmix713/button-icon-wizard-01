import { FigmaNode, FigmaApiResponse, GeneratedComponent, ComponentMetadata, AccessibilityReport, ResponsiveBreakpoints } from '../types/figma';

export interface CodeGenerationOptions {
  framework: 'react' | 'vue' | 'html';
  styling: 'tailwind' | 'css-modules' | 'styled-components' | 'plain-css';
  typescript: boolean;
  accessibility: boolean;
  responsive: boolean;
  optimizeImages: boolean;
}

export interface CustomCodeInputs {
  jsx: string;
  css: string;
  cssAdvanced: string;
}

export class AdvancedCodeGenerator {
  private figmaData: FigmaApiResponse;
  private options: CodeGenerationOptions;
  private customCode: CustomCodeInputs = { jsx: '', css: '', cssAdvanced: '' };

  constructor(figmaData: FigmaApiResponse, options: CodeGenerationOptions) {
    this.figmaData = figmaData;
    this.options = options;
  }

  // Egyéni kód beállítása
  setCustomCode(customCode: CustomCodeInputs) {
    this.customCode = customCode;
  }

  // Fő generálási metódus
  generateComponents(): GeneratedComponent[] {
    const components: GeneratedComponent[] = [];
    
    // Komponensek generálása
    Object.entries(this.figmaData.components || {}).forEach(([key, component]) => {
      const node = this.findNodeById(component.key);
      if (node) {
        const generatedComponent = this.generateSingleComponent(node, component.name);
        components.push(generatedComponent);
      }
    });

    // Ha nincsenek komponensek, generáljuk a fő frame-eket
    if (components.length === 0) {
      this.findMainFrames(this.figmaData.document).forEach(frame => {
        const generatedComponent = this.generateSingleComponent(frame, frame.name);
        components.push(generatedComponent);
      });
    }

    return components;
  }

  private generateSingleComponent(node: FigmaNode, componentName: string): GeneratedComponent {
    const startTime = Date.now();
    
    const sanitizedName = this.sanitizeComponentName(componentName);
    const jsx = this.generateJSX(node, sanitizedName);
    const css = this.generateCSS(node, sanitizedName);
    const accessibility = this.analyzeAccessibility(node);
    const responsive = this.analyzeResponsive(node);
    const metadata = this.generateMetadata(node, Date.now() - startTime);

    return {
      id: node.id,
      name: sanitizedName,
      component: jsx,
      styles: css,
      assets: [],
      dependencies: this.extractDependencies(node),
      jsx,
      css,
      ...(this.options.typescript && { typescript: this.generateTypeScript(node, sanitizedName) }),
      accessibility,
      responsive,
      metadata,
    };
  }

  // JSX generálás fejlett logikával + egyéni kód
  private generateJSX(node: FigmaNode, componentName: string): string {
    const props = this.extractProps(node);
    const children = this.generateChildren(node);
    const className = this.generateClassName(node);
    const styles = this.generateInlineStyles(node);

    if (this.options.framework === 'react') {
      const imports = this.generateImports(node);
      const propsInterface = this.options.typescript ? this.generatePropsInterface(props, componentName) : '';
      const componentSignature = this.options.typescript 
        ? `export const ${componentName}: React.FC<${componentName}Props> = ({ ${props.map(p => p.name).join(', ')} })`
        : `export const ${componentName} = ({ ${props.map(p => p.name).join(', ')} })`;

      // Egyéni JSX kód beépítése
      const customJSXSection = this.customCode.jsx ? `
  // === EGYÉNI JSX KÓD ===
  ${this.customCode.jsx}
  // === EGYÉNI JSX KÓD VÉGE ===
` : '';

      return `${imports}
${propsInterface}
${componentSignature} => {${customJSXSection}
  return (
    ${this.generateJSXElement(node, className, styles, children, 1)}
  );
};

export default ${componentName};`;
    }

    // HTML generálás
    if (this.options.framework === 'html') {
      return this.generateHTML(node, className, styles, children);
    }

    return `import React from "react";

export const ${componentName} = () => {
  return (
    ${this.generateJSXElement(node, className, styles, children, 1)}
  );
};

export default ${componentName};`;
  }

  private generateJSXElement(node: FigmaNode, className: string, styles: string, children: string, depth: number): string {
    const indent = '  '.repeat(depth);
    const tag = this.getHtmlTag(node);
    const attributes = this.generateAttributes(node);
    
    if (node.type === 'TEXT' && node.characters) {
      return `${indent}<${tag}${className ? ` className="${className}"` : ''}${styles ? ` style={${styles}}` : ''}${attributes}>
${indent}  {${node.characters ? `"${node.characters}"` : 'children'}}
${indent}</${tag}>`;
    }

    if (children) {
      return `${indent}<${tag}${className ? ` className="${className}"` : ''}${styles ? ` style={${styles}}` : ''}${attributes}>
${children}
${indent}</${tag}>`;
    }

    return `${indent}<${tag}${className ? ` className="${className}"` : ''}${styles ? ` style={${styles}}` : ''}${attributes} />`;
  }

  private generateChildren(node: FigmaNode): string {
    if (!node.children || node.children.length === 0) return '';
    
    return node.children
      .map(child => {
        const childClassName = this.generateClassName(child);
        const childStyles = this.generateInlineStyles(child);
        const grandChildren = this.generateChildren(child);
        return this.generateJSXElement(child, childClassName, childStyles, grandChildren, 2);
      })
      .join('\n');
  }

  // CSS generálás fejlett logikával + egyéni CSS
  private generateCSS(node: FigmaNode, componentName: string): string {
    let baseCSS = '';
    
    if (this.options.styling === 'tailwind') {
      baseCSS = this.generateTailwindCSS(node);
    } else {
      const styles = this.extractAllStyles(node);
      const cssRules = this.convertToCSSRules(styles, componentName);
      
      if (this.options.styling === 'css-modules') {
        baseCSS = this.generateCSSModules(cssRules);
      } else if (this.options.styling === 'styled-components') {
        baseCSS = this.generateStyledComponents(cssRules, componentName);
      } else {
        baseCSS = this.generatePlainCSS(cssRules, componentName);
      }
    }

    // Egyéni CSS hozzáadása
    const customCSSSection = this.customCode.css ? `

/* === EGYÉNI CSS STÍLUSOK === */
${this.customCode.css}
/* === EGYÉNI CSS STÍLUSOK VÉGE === */` : '';

    // Fejlett CSS++ hozzáadása
    const advancedCSSSection = this.customCode.cssAdvanced ? `

/* === FEJLETT CSS++ FUNKCIÓK === */
${this.customCode.cssAdvanced}
/* === FEJLETT CSS++ FUNKCIÓK VÉGE === */` : '';

    return `${baseCSS}${customCSSSection}${advancedCSSSection}`;
  }

  private extractAllStyles(node: FigmaNode): Record<string, any> {
    const styles: Record<string, any> = {};

    // Layout és pozíció
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      styles.width = `${width}px`;
      styles.height = `${height}px`;
    }

    // Flexbox layout
    if (node.layoutMode) {
      styles.display = 'flex';
      styles.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
      
      if (node.itemSpacing) {
        styles.gap = `${node.itemSpacing}px`;
      }
    }

    // Padding
    if (node.paddingLeft || node.paddingRight || node.paddingTop || node.paddingBottom) {
      styles.padding = `${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`;
    }

    // Háttérszín
    if (node.backgroundColor) {
      styles.backgroundColor = this.colorToCSS(node.backgroundColor);
    }

    // Fills (háttér, gradientek)
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        styles.backgroundColor = this.colorToCSS(fill.color, fill.opacity);
      } else if (fill.type === 'GRADIENT_LINEAR') {
        styles.background = this.gradientToCSS(fill);
      }
    }

    // Border radius
    if (node.cornerRadius) {
      styles.borderRadius = `${node.cornerRadius}px`;
    }

    // Strokes (border)
    if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
      const stroke = node.strokes[0];
      if (stroke.color) {
        styles.border = `${node.strokeWeight}px solid ${this.colorToCSS(stroke.color, stroke.opacity)}`;
      }
    }

    // Text stílusok
    if (node.type === 'TEXT' && node.style) {
      styles.fontFamily = `"${node.style.fontFamily}", sans-serif`;
      styles.fontSize = `${node.style.fontSize}px`;
      styles.lineHeight = `${node.style.lineHeightPx}px`;
      styles.letterSpacing = `${node.style.letterSpacing}px`;
      
      if (node.style.fills && node.style.fills.length > 0) {
        const textFill = node.style.fills[0];
        if (textFill.color) {
          styles.color = this.colorToCSS(textFill.color, textFill.opacity);
        }
      }
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity !== 1) {
      styles.opacity = node.opacity;
    }

    // Effects (shadows, blur)
    if (node.effects && node.effects.length > 0) {
      const shadows = node.effects
        .filter(effect => effect.type === 'DROP_SHADOW' && effect.visible !== false)
        .map(effect => this.effectToCSS(effect));
      
      if (shadows.length > 0) {
        styles.boxShadow = shadows.join(', ');
      }
    }

    return styles;
  }

  private generateTailwindCSS(node: FigmaNode): string {
    const classes = this.generateTailwindClasses(node);
    return `/* Figma alapú Tailwind osztályok: ${classes} */

/* Komponens alapstílusok */
.${this.sanitizeComponentName(node.name).toLowerCase()} {
  @apply ${classes};
}`;
  }

  private generateTailwindClasses(node: FigmaNode): string {
    const classes: string[] = [];

    // Layout
    if (node.layoutMode === 'HORIZONTAL') {
      classes.push('flex', 'flex-row');
    } else if (node.layoutMode === 'VERTICAL') {
      classes.push('flex', 'flex-col');
    }

    // Spacing
    if (node.itemSpacing) {
      const gap = this.pxToTailwindSpacing(node.itemSpacing);
      classes.push(`gap-${gap}`);
    }

    // Padding
    if (node.paddingLeft) classes.push(`pl-${this.pxToTailwindSpacing(node.paddingLeft)}`);
    if (node.paddingRight) classes.push(`pr-${this.pxToTailwindSpacing(node.paddingRight)}`);
    if (node.paddingTop) classes.push(`pt-${this.pxToTailwindSpacing(node.paddingTop)}`);
    if (node.paddingBottom) classes.push(`pb-${this.pxToTailwindSpacing(node.paddingBottom)}`);

    // Size
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      classes.push(`w-[${width}px]`, `h-[${height}px]`);
    }

    // Background color
    if (node.backgroundColor) {
      classes.push(this.colorToTailwind(node.backgroundColor));
    }

    // Border radius
    if (node.cornerRadius) {
      classes.push(this.borderRadiusToTailwind(node.cornerRadius));
    }

    // Text styles
    if (node.type === 'TEXT' && node.style) {
      if (node.style.fontSize) {
        classes.push(this.fontSizeToTailwind(node.style.fontSize));
      }
    }

    return classes.join(' ');
  }

  // Accessibility elemzés
  private analyzeAccessibility(node: FigmaNode): AccessibilityReport {
    const issues: any[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Képek alt text ellenőrzése
    if (this.isImage(node)) {
      issues.push({
        type: 'error',
        message: 'Kép hiányzó alt szöveg',
        element: node.name,
        fix: 'Adj hozzá alt attribútumot leíró szöveggel'
      });
      score -= 15;
    }

    // Szöveg kontraszt ellenőrzése
    if (node.type === 'TEXT') {
      const contrastRatio = this.calculateContrastRatio(node);
      if (contrastRatio < 4.5) {
        issues.push({
          type: 'warning',
          message: 'Alacsony szöveg kontraszt',
          element: node.name,
          fix: 'Növeld a szöveg és háttér közötti kontrasztot'
        });
        score -= 10;
      }
    }

    // Interaktív elemek ellenőrzése
    if (this.isInteractiveElement(node)) {
      suggestions.push('Biztosítsd a billentyűzetes navigáció támogatását');
      suggestions.push('Adj hozzá ARIA címkéket a képernyőolvasókhoz');
      suggestions.push('Használj megfelelő focus állapotokat');
    }

    // Címsor hierarchia ellenőrzése
    if (this.isHeading(node)) {
      suggestions.push('Ellenőrizd a címsor hierarchiát (h1, h2, h3...)');
    }

    // Egyéni kód accessibility javítások
    if (this.customCode.jsx || this.customCode.css) {
      suggestions.push('Ellenőrizd az egyéni kód accessibility megfelelőségét');
      suggestions.push('Teszteld a komponenst képernyőolvasóval');
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
      wcagCompliance: score >= 80 ? 'AA' : score >= 60 ? 'A' : 'Non-compliant'
    };
  }

  // Responsive design elemzés
  private analyzeResponsive(node: FigmaNode): ResponsiveBreakpoints {
    const hasFlexLayout = node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL';
    const hasConstraints = node.constraints?.horizontal !== 'LEFT' || node.constraints?.vertical !== 'TOP';
    const hasResponsiveDesign = hasFlexLayout || hasConstraints;

    return {
      mobile: this.generateResponsiveCSS(node, 'mobile'),
      tablet: this.generateResponsiveCSS(node, 'tablet'),
      desktop: this.generateResponsiveCSS(node, 'desktop'),
      hasResponsiveDesign
    };
  }

  // Segédfüggvények
  private findNodeById(id: string): FigmaNode | null {
    const search = (node: FigmaNode): FigmaNode | null => {
      if (node.id === id) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = search(child);
          if (found) return found;
        }
      }
      return null;
    };
    return search(this.figmaData.document);
  }

  private findMainFrames(node: FigmaNode): FigmaNode[] {
    const frames: FigmaNode[] = [];
    
    const traverse = (currentNode: FigmaNode) => {
      if (currentNode.type === 'FRAME' && currentNode.children && currentNode.children.length > 0) {
        frames.push(currentNode);
      }
      if (currentNode.children) {
        currentNode.children.forEach(traverse);
      }
    };

    traverse(node);
    return frames;
  }

  private sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[0-9]/, 'Component$&')
      .replace(/^./, str => str.toUpperCase()) || 'Component';
  }

  private colorToCSS(color: any, opacity?: number): string {
    const { r, g, b, a } = color;
    const alpha = opacity !== undefined ? opacity : (a !== undefined ? a : 1);
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
  }

  private colorToTailwind(color: any): string {
    const { r, g, b } = color;
    
    // Egyszerűsített színkonverzió
    if (r > 0.9 && g > 0.9 && b > 0.9) return 'bg-white';
    if (r < 0.1 && g < 0.1 && b < 0.1) return 'bg-black';
    if (r > 0.8 && g < 0.3 && b < 0.3) return 'bg-red-500';
    if (r < 0.3 && g > 0.8 && b < 0.3) return 'bg-green-500';
    if (r < 0.3 && g < 0.3 && b > 0.8) return 'bg-blue-500';
    
    return 'bg-gray-500';
  }

  private pxToTailwindSpacing(px: number): string {
    const spacing = Math.round(px / 4);
    if (spacing <= 0) return '0';
    if (spacing <= 96) return spacing.toString();
    return `[${px}px]`;
  }

  private borderRadiusToTailwind(radius: number): string {
    if (radius <= 2) return 'rounded-sm';
    if (radius <= 4) return 'rounded';
    if (radius <= 6) return 'rounded-md';
    if (radius <= 8) return 'rounded-lg';
    if (radius <= 12) return 'rounded-xl';
    if (radius <= 16) return 'rounded-2xl';
    return `rounded-[${radius}px]`;
  }

  private fontSizeToTailwind(fontSize: number): string {
    if (fontSize <= 12) return 'text-xs';
    if (fontSize <= 14) return 'text-sm';
    if (fontSize <= 16) return 'text-base';
    if (fontSize <= 18) return 'text-lg';
    if (fontSize <= 20) return 'text-xl';
    if (fontSize <= 24) return 'text-2xl';
    if (fontSize <= 30) return 'text-3xl';
    return `text-[${fontSize}px]`;
  }

  private getHtmlTag(node: FigmaNode): string {
    switch (node.type) {
      case 'TEXT': return this.isHeading(node) ? 'h2' : 'span';
      case 'FRAME': return 'div';
      case 'RECTANGLE': return this.isImage(node) ? 'img' : 'div';
      case 'COMPONENT':
      case 'INSTANCE': return 'div';
      default: return 'div';
    }
  }

  private isImage(node: FigmaNode): boolean {
    return node.fills?.some(fill => fill.type === 'IMAGE') || false;
  }

  private isInteractiveElement(node: FigmaNode): boolean {
    const name = node.name.toLowerCase();
    return name.includes('button') || 
           name.includes('link') ||
           name.includes('input') ||
           name.includes('click');
  }

  private isHeading(node: FigmaNode): boolean {
    if (node.type !== 'TEXT') return false;
    const name = node.name.toLowerCase();
    return name.includes('title') || 
           name.includes('heading') || 
           name.includes('header') ||
           (node.style?.fontSize && node.style.fontSize > 20);
  }

  private calculateContrastRatio(node: FigmaNode): number {
    // Egyszerűsített kontraszt számítás
    // Valós implementációban WCAG kontrasztszámítást használnánk
    return 4.5; // Placeholder
  }

  private generateImports(node: FigmaNode): string {
    const imports = ['import React from "react";'];
    
    if (this.options.typescript) {
      // TypeScript típusok importálása szükség esetén
    }
    
    return imports.join('\n');
  }

  private generatePropsInterface(props: any[], componentName: string): string {
    if (props.length === 0) return '';
    
    return `interface ${componentName}Props {
  ${props.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type};`).join('\n  ')}
}

`;
  }

  private extractProps(node: FigmaNode): Array<{name: string, type: string, optional: boolean}> {
    const props = [];
    
    if (node.type === 'TEXT' && node.characters) {
      props.push({ name: 'children', type: 'React.ReactNode', optional: true });
    }
    
    if (this.isImage(node)) {
      props.push({ name: 'src', type: 'string', optional: false });
      props.push({ name: 'alt', type: 'string', optional: false });
    }

    props.push({ name: 'className', type: 'string', optional: true });
    
    return props;
  }

  private generateClassName(node: FigmaNode): string {
    if (this.options.styling === 'tailwind') {
      return this.generateTailwindClasses(node);
    }
    return node.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  private generateInlineStyles(node: FigmaNode): string {
    if (this.options.styling === 'tailwind') return '';
    
    const styles = this.extractAllStyles(node);
    const styleEntries = Object.entries(styles)
      .map(([key, value]) => `${key}: "${value}"`)
      .join(', ');
    
    return styleEntries ? `{{ ${styleEntries} }}` : '';
  }

  private generateAttributes(node: FigmaNode): string {
    const attributes = [];
    
    if (this.isImage(node)) {
      attributes.push('src={src}', 'alt={alt}');
    }
    
    return attributes.length > 0 ? ' ' + attributes.join(' ') : '';
  }

  private generateHTML(node: FigmaNode, className: string, styles: string, children: string): string {
    // HTML generálás implementációja
    return `<!-- HTML implementation -->`;
  }

  private convertToCSSRules(styles: Record<string, any>, componentName: string): string {
    const cssRules = Object.entries(styles)
      .map(([property, value]) => `  ${this.camelToKebab(property)}: ${value};`)
      .join('\n');
    
    return `.${componentName.toLowerCase()} {\n${cssRules}\n}`;
  }

  private generateCSSModules(cssRules: string): string {
    return cssRules;
  }

  private generateStyledComponents(cssRules: string, componentName: string): string {
    return `import styled from 'styled-components';

export const Styled${componentName} = styled.div\`
${cssRules.replace(/^\.[^{]+\{/, '').replace(/\}$/, '')}
\`;`;
  }

  private generatePlainCSS(cssRules: string, componentName: string): string {
    return cssRules;
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  private gradientToCSS(fill: any): string {
    // Gradient konverzió implementációja
    return 'linear-gradient(90deg, #000 0%, #fff 100%)';
  }

  private effectToCSS(effect: any): string {
    if (effect.type === 'DROP_SHADOW') {
      const { offset, radius, color } = effect;
      const x = offset?.x || 0;
      const y = offset?.y || 0;
      const blur = radius || 0;
      const colorCSS = color ? this.colorToCSS(color) : 'rgba(0,0,0,0.25)';
      return `${x}px ${y}px ${blur}px ${colorCSS}`;
    }
    return '';
  }

  private generateResponsiveCSS(node: FigmaNode, breakpoint: string): string {
    // Responsive CSS generálás breakpoint alapján
    return `/* ${breakpoint} responsive styles */`;
  }

  private generateTypeScript(node: FigmaNode, componentName: string): string {
    const props = this.extractProps(node);
    
    return `export interface ${componentName}Props {
  ${props.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type};`).join('\n  ')}
}

export type ${componentName}Ref = HTMLDivElement;`;
  }

  private generateMetadata(node: FigmaNode, generationTime: number): ComponentMetadata {
    return {
      id: node.id,
      name: node.name || 'UnnamedComponent',
      type: node.type,
      figmaNodeId: node.id,
      componentType: this.detectComponentType(node),
      complexity: this.calculateComplexity(node),
      estimatedAccuracy: this.estimateAccuracy(node),
      generationTime,
      dependencies: this.extractDependencies(node)
    };
  }

  private detectComponentType(node: FigmaNode): ComponentMetadata['componentType'] {
    const name = node.name.toLowerCase();
    
    if (name.includes('button')) return 'button';
    if (name.includes('card')) return 'card';
    if (name.includes('text') || node.type === 'TEXT') return 'text';
    if (name.includes('input')) return 'input';
    if (node.children && node.children.length > 3) return 'layout';
    
    return 'complex';
  }

  private calculateComplexity(node: FigmaNode): ComponentMetadata['complexity'] {
    let complexity = 0;
    
    if (node.children) complexity += node.children.length;
    if (node.effects && node.effects.length > 0) complexity += 2;
    if (node.fills && node.fills.length > 1) complexity += 1;
    
    // Egyéni kód növeli a komplexitást
    if (this.customCode.jsx || this.customCode.css || this.customCode.cssAdvanced) {
      complexity += 1;
    }
    
    if (complexity <= 3) return 'simple';
    if (complexity <= 8) return 'medium';
    return 'complex';
  }

  private estimateAccuracy(node: FigmaNode): number {
    let accuracy = 85;
    
    if (this.calculateComplexity(node) === 'simple') accuracy += 10;
    if (node.children && node.children.length > 5) accuracy -= 5;
    
    const componentType = this.detectComponentType(node);
    if (['button', 'text', 'card'].includes(componentType)) accuracy += 5;
    
    // Egyéni kód javítja a pontosságot
    if (this.customCode.jsx || this.customCode.css || this.customCode.cssAdvanced) {
      accuracy += 5;
    }
    
    return Math.min(100, Math.max(70, accuracy));
  }

  private extractDependencies(node: FigmaNode): string[] {
    const deps = ['react'];
    
    if (this.options.typescript) deps.push('@types/react');
    if (this.isImage(node)) deps.push('next/image');
    if (this.options.styling === 'styled-components') deps.push('styled-components');
    
    return deps;
  }
}