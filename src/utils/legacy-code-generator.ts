import { FigmaNode, GeneratedComponent, ComponentMetadata, AccessibilityReport, ResponsiveBreakpoints } from '../types/figma';

export class LegacyCodeGenerator {
  generateComponent(node: FigmaNode, config: {
    framework: 'react' | 'vue' | 'html';
    styling: 'tailwind' | 'css-modules' | 'styled-components' | 'plain-css';
    typescript: boolean;
  }): GeneratedComponent {
    const startTime = Date.now();
    
    const jsx = this.generateJSX(node, config);
    const css = this.generateCSS(node, config.styling);
    const accessibility = this.analyzeAccessibility(node);
    const responsive = this.analyzeResponsive(node);
    const metadata = this.generateMetadata(node, Date.now() - startTime);

    return {
      id: node.id,
      name: this.sanitizeComponentName(node.name),
      jsx,
      css,
      component: jsx, // Main component code
      styles: css, // CSS styles  
      assets: [], // No assets initially
      dependencies: this.extractDependencies(node),
      ...(config.typescript && { typescript: this.generateTypeScript(node) }),
      accessibility,
      responsive,
      metadata,
    };
  }

  private generateJSX(node: FigmaNode, config: any): string {
    const componentName = this.sanitizeComponentName(node.name);
    const props = this.extractProps(node);
    const children = this.generateChildren(node, config);
    const className = this.generateClassName(node, config.styling);

    if (config.framework === 'react') {
      return `import React from 'react';
${config.typescript ? `
interface ${componentName}Props {
  ${props.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type};`).join('\n  ')}
}

export const ${componentName}: React.FC<${componentName}Props> = ({ ${props.map(p => p.name).join(', ')} }) => {` : `
export const ${componentName} = ({ ${props.map(p => p.name).join(', ')} }) => {`}
  return (
    <${this.getHtmlTag(node)} className="${className}">
      ${children}
    </${this.getHtmlTag(node)}>
  );
};`;
    }

    // Vue and HTML implementations would go here
    return `export const ${componentName} = () => <div>Default Component</div>`;
  }

  private generateCSS(node: FigmaNode, styling: string): string {
    const styles = this.extractStyles(node);
    
    if (styling === 'tailwind') {
      return this.convertToTailwind(styles);
    }

    return this.convertToCSS(styles, styling);
  }

  private generateTypeScript(node: FigmaNode): string {
    const props = this.extractProps(node);
    const componentName = this.sanitizeComponentName(node.name);

    return `export interface ${componentName}Props {
  ${props.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type};`).join('\n  ')}
}`;
  }

  private analyzeAccessibility(node: FigmaNode): AccessibilityReport {
    const issues: any[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check for missing alt text on images
    if (node.type === 'RECTANGLE' && node.fills?.some(f => f.type === 'IMAGE')) {
      issues.push({
        type: 'error',
        message: 'Image missing alt text',
        element: node.name,
        fix: 'Add alt attribute with descriptive text'
      });
      score -= 20;
    }

    // Check for text contrast
    if (node.type === 'TEXT') {
      // Simplified contrast check
      suggestions.push('Verify text contrast meets WCAG AA standards');
    }

    // Check for interactive elements
    if (this.isInteractiveElement(node)) {
      suggestions.push('Ensure keyboard navigation support');
      suggestions.push('Add ARIA labels for screen readers');
    }

    return {
      score,
      issues,
      suggestions,
      wcagCompliance: score >= 80 ? 'AA' : score >= 60 ? 'A' : 'Non-compliant'
    };
  }

  private analyzeResponsive(node: FigmaNode): ResponsiveBreakpoints {
    // Analyze layout properties to determine responsive behavior
    const hasFlexLayout = node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL';
    const hasConstraints = node.constraints?.horizontal !== 'LEFT' || node.constraints?.vertical !== 'TOP';

    return {
      mobile: this.generateResponsiveCSS(node, 'mobile'),
      tablet: this.generateResponsiveCSS(node, 'tablet'),
      desktop: this.generateResponsiveCSS(node, 'desktop'),
      hasResponsiveDesign: hasFlexLayout || hasConstraints
    };
  }

  private generateMetadata(node: FigmaNode, generationTime: number): ComponentMetadata {
    return {
      id: node.id,
      name: this.sanitizeComponentName(node.name),
      type: this.detectComponentType(node),
      figmaNodeId: node.id,
      componentType: this.detectComponentType(node),
      complexity: this.calculateComplexity(node),
      estimatedAccuracy: this.estimateAccuracy(node),
      generationTime,
      dependencies: this.extractDependencies(node)
    };
  }

  // Helper methods
  private sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[0-9]/, 'Component$&')
      .replace(/^./, str => str.toUpperCase());
  }

  private extractProps(node: FigmaNode): Array<{name: string, type: string, optional: boolean}> {
    const props = [];
    
    if (node.type === 'TEXT' && node.characters) {
      props.push({ name: 'text', type: 'string', optional: false });
    }
    
    if (node.fills?.some(f => f.type === 'IMAGE')) {
      props.push({ name: 'src', type: 'string', optional: false });
      props.push({ name: 'alt', type: 'string', optional: false });
    }

    props.push({ name: 'className', type: 'string', optional: true });
    
    return props;
  }

  private generateChildren(node: FigmaNode, config: any): string {
    if (!node.children) return '';
    
    return node.children
      .map(child => this.generateJSX(child, config))
      .join('\n      ');
  }

  private generateClassName(node: FigmaNode, styling: string): string {
    if (styling === 'tailwind') {
      return this.generateTailwindClasses(node);
    }
    return `${node.name.toLowerCase().replace(/\s+/g, '-')}`;
  }

  private generateTailwindClasses(node: FigmaNode): string {
    const classes = [];
    
    // Layout classes
    if (node.layoutMode === 'HORIZONTAL') classes.push('flex', 'flex-row');
    if (node.layoutMode === 'VERTICAL') classes.push('flex', 'flex-col');
    
    // Spacing
    if (node.itemSpacing) classes.push(`gap-${Math.round(node.itemSpacing / 4)}`);
    if (node.paddingLeft) classes.push(`pl-${Math.round(node.paddingLeft / 4)}`);
    if (node.paddingRight) classes.push(`pr-${Math.round(node.paddingRight / 4)}`);
    if (node.paddingTop) classes.push(`pt-${Math.round(node.paddingTop / 4)}`);
    if (node.paddingBottom) classes.push(`pb-${Math.round(node.paddingBottom / 4)}`);
    
    // Border radius
    if (node.cornerRadius) {
      const radius = Math.round(node.cornerRadius / 4);
      classes.push(`rounded-${radius <= 3 ? radius === 1 ? 'sm' : radius === 2 ? '' : 'md' : 'lg'}`);
    }
    
    // Background color
    if (node.backgroundColor) {
      classes.push(this.colorToTailwind(node.backgroundColor));
    }
    
    return classes.join(' ');
  }

  private colorToTailwind(color: any): string {
    // Simplified color conversion - in production, this would be more sophisticated
    const { r, g, b } = color;
    
    if (r > 0.9 && g > 0.9 && b > 0.9) return 'bg-white';
    if (r < 0.1 && g < 0.1 && b < 0.1) return 'bg-black';
    if (r > 0.8 && g < 0.3 && b < 0.3) return 'bg-red-500';
    if (r < 0.3 && g > 0.8 && b < 0.3) return 'bg-green-500';
    if (r < 0.3 && g < 0.3 && b > 0.8) return 'bg-blue-500';
    
    return 'bg-gray-500';
  }

  private getHtmlTag(node: FigmaNode): string {
    switch (node.type) {
      case 'TEXT': return 'span';
      case 'FRAME': return 'div';
      case 'RECTANGLE': return node.fills?.some(f => f.type === 'IMAGE') ? 'img' : 'div';
      default: return 'div';
    }
  }

  private extractStyles(node: FigmaNode): Record<string, any> {
    const styles: Record<string, any> = {};
    
    if (node.absoluteBoundingBox) {
      styles.width = `${node.absoluteBoundingBox.width}px`;
      styles.height = `${node.absoluteBoundingBox.height}px`;
    }
    
    if (node.backgroundColor) {
      const { r, g, b, a } = node.backgroundColor;
      styles.backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    }
    
    if (node.cornerRadius) {
      styles.borderRadius = `${node.cornerRadius}px`;
    }
    
    return styles;
  }

  private convertToTailwind(styles: Record<string, any>): string {
    // Convert CSS styles to Tailwind classes
    const classes = [];
    
    Object.entries(styles).forEach(([property, value]) => {
      // This would be a comprehensive mapping in production
      switch (property) {
        case 'backgroundColor':
          classes.push('bg-gray-500'); // Simplified
          break;
        case 'borderRadius':
          classes.push('rounded');
          break;
      }
    });
    
    return classes.join(' ');
  }

  private convertToCSS(styles: Record<string, any>, styling: string): string {
    const cssRules = Object.entries(styles)
      .map(([property, value]) => `  ${property}: ${value};`)
      .join('\n');
    
    return `.component {\n${cssRules}\n}`;
  }

  private isInteractiveElement(node: FigmaNode): boolean {
    return node.name.toLowerCase().includes('button') || 
           node.name.toLowerCase().includes('link') ||
           node.name.toLowerCase().includes('input');
  }

  private generateResponsiveCSS(node: FigmaNode, breakpoint: string): string {
    // Generate responsive CSS for different breakpoints
    return `/* ${breakpoint} styles */`;
  }

  private detectComponentType(node: FigmaNode): string {
    const name = node.name.toLowerCase();
    
    if (name.includes('button')) return 'button';
    if (name.includes('card')) return 'card';
    if (name.includes('text') || node.type === 'TEXT') return 'text';
    if (name.includes('input')) return 'input';
    if (node.children && node.children.length > 3) return 'layout';
    
    return 'complex';
  }

  private calculateComplexity(node: FigmaNode): string {
    let complexity = 0;
    
    if (node.children) complexity += node.children.length;
    if (node.effects && node.effects.length > 0) complexity += 2;
    if (node.fills && node.fills.length > 1) complexity += 1;
    
    if (complexity <= 3) return 'simple';
    if (complexity <= 8) return 'medium';
    return 'complex';
  }

  private estimateAccuracy(node: FigmaNode): number {
    let accuracy = 85; // Base accuracy
    
    // Boost accuracy for simple components
    if (this.calculateComplexity(node) === 'simple') accuracy += 10;
    
    // Reduce accuracy for complex layouts
    if (node.children && node.children.length > 5) accuracy -= 5;
    
    // Boost accuracy for standard component types
    const componentType = this.detectComponentType(node);
    if (['button', 'text', 'card'].includes(componentType)) accuracy += 5;
    
    return Math.min(100, Math.max(70, accuracy));
  }

  private extractDependencies(node: FigmaNode): string[] {
    const deps = ['react'];
    
    if (node.type === 'TEXT') deps.push('@types/react');
    if (node.fills?.some(f => f.type === 'IMAGE')) deps.push('next/image');
    
    return deps;
  }
}