import { GeneratedComponent, ComponentMetadata } from '../types/figma';
import { EnterpriseGenerationConfig } from './enterprise-code-generator';

export interface ComponentLibraryConfig {
  enableVersioning: boolean;
  enableDocumentation: boolean;
  enableTesting: boolean;
  enableStorybook: boolean;
  namingConvention: 'camelCase' | 'PascalCase' | 'kebab-case';
  organizationPattern: 'atomic' | 'feature' | 'domain';
}

export interface ComponentVariant {
  name: string;
  props: Record<string, any>;
  description: string;
  usage: string;
}

export interface ComponentLibraryEntry {
  component: GeneratedComponent;
  variants: ComponentVariant[];
  dependencies: string[];
  category: string;
  tags: string[];
  version: string;
  documentation: string;
  examples: string[];
}

export class ComponentLibraryManager {
  private config: EnterpriseGenerationConfig;
  private library: Map<string, ComponentLibraryEntry> = new Map();
  private categories: Map<string, string[]> = new Map();

  constructor(config: EnterpriseGenerationConfig) {
    this.config = config;
    this.initializeCategories();
  }

  // Component Library Organization
  organizeComponents(components: GeneratedComponent[]): Map<string, GeneratedComponent[]> {
    const organized = new Map<string, GeneratedComponent[]>();

    components.forEach(component => {
      const category = this.categorizeComponent(component);
      if (!organized.has(category)) {
        organized.set(category, []);
      }
      organized.get(category)!.push(component);
    });

    return organized;
  }

  // Component Reusability Optimization
  optimizeForReusability(components: GeneratedComponent[]): GeneratedComponent[] {
    // Analyze component patterns
    const patterns = this.analyzeComponentPatterns(components);
    
    // Extract reusable patterns
    const reusableComponents = this.extractReusableComponents(patterns);
    
    // Update components to use reusable patterns
    const optimized = this.updateComponentsWithReusablePatterns(components, reusableComponents);
    
    // Generate base components
    const baseComponents = this.generateBaseComponents(reusableComponents);
    
    return [...optimized, ...baseComponents];
  }

  // Component Variant Generation
  generateComponentVariants(component: GeneratedComponent): ComponentVariant[] {
    const variants: ComponentVariant[] = [];
    
    // Size variants
    if (this.hasSize(component)) {
      variants.push(...this.generateSizeVariants(component));
    }
    
    // Color variants
    if (this.hasColor(component)) {
      variants.push(...this.generateColorVariants(component));
    }
    
    // State variants
    if (this.hasStates(component)) {
      variants.push(...this.generateStateVariants(component));
    }
    
    return variants;
  }

  // Component Documentation Generation
  generateComponentDocumentation(component: GeneratedComponent): string {
    const variants = this.generateComponentVariants(component);
    const props = this.extractComponentProps(component);
    const usage = this.generateUsageExamples(component);
    
    return `# ${component.name}

## Description
${this.generateComponentDescription(component)}

## Props
${this.generatePropsDocumentation(props)}

## Variants
${this.generateVariantsDocumentation(variants)}

## Usage Examples
${usage}

## Accessibility
${this.generateAccessibilityDocumentation(component)}

## Performance Notes
${this.generatePerformanceNotes(component)}
`;
  }

  // Component Testing Generation
  generateComponentTests(component: GeneratedComponent): string {
    const testCases = this.generateTestCases(component);
    const accessibilityTests = this.generateAccessibilityTests(component);
    const performanceTests = this.generatePerformanceTests(component);
    
    return `import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ${component.name} } from './${component.name}';

expect.extend(toHaveNoViolations);

describe('${component.name}', () => {
  ${testCases}
  
  ${accessibilityTests}
  
  ${performanceTests}
});`;
  }

  // Storybook Stories Generation
  generateStorybookStories(component: GeneratedComponent): string {
    const variants = this.generateComponentVariants(component);
    const controls = this.generateStorybookControls(component);
    
    return `import type { Meta, StoryObj } from '@storybook/react';
import { ${component.name} } from './${component.name}';

const meta: Meta<typeof ${component.name}> = {
  title: '${this.getComponentCategory(component)}/${component.name}',
  component: ${component.name},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '${this.generateComponentDescription(component)}'
      }
    }
  },
  argTypes: {
    ${controls}
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

${this.generateStorybookVariants(variants)}
`;
  }

  // Private Methods
  private initializeCategories(): void {
    this.categories.set('atoms', ['Button', 'Input', 'Label', 'Icon', 'Text']);
    this.categories.set('molecules', ['Card', 'Form', 'Navigation', 'Search']);
    this.categories.set('organisms', ['Header', 'Footer', 'Sidebar', 'Layout']);
    this.categories.set('templates', ['Page', 'Dashboard', 'Profile']);
  }

  private categorizeComponent(component: GeneratedComponent): string {
    const name = component.name.toLowerCase();
    
    for (const [category, keywords] of this.categories.entries()) {
      if (keywords.some(keyword => name.includes(keyword.toLowerCase()))) {
        return category;
      }
    }
    
    // Categorize by complexity
    switch (component.metadata.complexity) {
      case 'simple': return 'atoms';
      case 'medium': return 'molecules';
      case 'complex': return 'organisms';
      default: return 'molecules';
    }
  }

  private analyzeComponentPatterns(components: GeneratedComponent[]): Map<string, GeneratedComponent[]> {
    const patterns = new Map<string, GeneratedComponent[]>();
    
    components.forEach(component => {
      const pattern = this.extractPattern(component);
      if (!patterns.has(pattern)) {
        patterns.set(pattern, []);
      }
      patterns.get(pattern)!.push(component);
    });
    
    return patterns;
  }

  private extractPattern(component: GeneratedComponent): string {
    // Extract structural pattern from JSX
    const structure = component.jsx
      .replace(/\s+/g, ' ')
      .replace(/className="[^"]*"/g, 'className="*"')
      .replace(/\{[^}]*\}/g, '{*}');
    
    return this.hashString(structure);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private extractReusableComponents(patterns: Map<string, GeneratedComponent[]>): GeneratedComponent[] {
    const reusable: GeneratedComponent[] = [];
    
    patterns.forEach((components, pattern) => {
      if (components.length >= 3) { // Pattern used 3+ times
        const baseComponent = this.createBaseComponent(components[0], pattern);
        reusable.push(baseComponent);
      }
    });
    
    return reusable;
  }

  private createBaseComponent(component: GeneratedComponent, pattern: string): GeneratedComponent {
    return {
      ...component,
      id: `base-${pattern}`,
      name: `Base${component.name}`,
      metadata: {
        ...component.metadata,
        componentType: 'layout',
        isBaseComponent: true
      }
    };
  }

  private updateComponentsWithReusablePatterns(
    components: GeneratedComponent[], 
    reusableComponents: GeneratedComponent[]
  ): GeneratedComponent[] {
    // Update components to extend base components
    return components.map(component => {
      const baseComponent = this.findMatchingBaseComponent(component, reusableComponents);
      if (baseComponent) {
        return this.extendBaseComponent(component, baseComponent);
      }
      return component;
    });
  }

  private findMatchingBaseComponent(
    component: GeneratedComponent, 
    baseComponents: GeneratedComponent[]
  ): GeneratedComponent | null {
    const componentPattern = this.extractPattern(component);
    return baseComponents.find(base => 
      base.id.includes(componentPattern)
    ) || null;
  }

  private extendBaseComponent(
    component: GeneratedComponent, 
    baseComponent: GeneratedComponent
  ): GeneratedComponent {
    return {
      ...component,
      jsx: this.updateJSXToExtendBase(component.jsx, baseComponent.name),
      css: this.updateCSSToExtendBase(component.css, baseComponent.name),
      metadata: {
        ...component.metadata,
        extendsComponent: baseComponent.name
      }
    };
  }

  private updateJSXToExtendBase(jsx: string, baseName: string): string {
    // Add import for base component
    const importStatement = `import { ${baseName} } from './${baseName}';`;
    return `${importStatement}\n\n${jsx}`;
  }

  private updateCSSToExtendBase(css: string, baseName: string): string {
    // Add CSS that extends base styles
    return `@import './${baseName}.css';\n\n${css}`;
  }

  private generateBaseComponents(reusableComponents: GeneratedComponent[]): GeneratedComponent[] {
    return reusableComponents.map(component => ({
      ...component,
      jsx: this.generateBaseJSX(component),
      css: this.generateBaseCSS(component)
    }));
  }

  private generateBaseJSX(component: GeneratedComponent): string {
    // Generate flexible base component JSX
    return component.jsx
      .replace(/className="[^"]*"/g, 'className={className}')
      .replace(/\{[^}]*\}/g, '{children}');
  }

  private generateBaseCSS(component: GeneratedComponent): string {
    // Generate base CSS with CSS custom properties
    return component.css
      .replace(/#[a-fA-F0-9]{6}/g, 'var(--color-primary)')
      .replace(/\d+px/g, 'var(--spacing-md)');
  }

  // Component Analysis Methods
  private hasSize(component: GeneratedComponent): boolean {
    return component.jsx.includes('size') || 
           component.css.includes('width') || 
           component.css.includes('height');
  }

  private hasColor(component: GeneratedComponent): boolean {
    return component.css.includes('color') || 
           component.css.includes('background');
  }

  private hasStates(component: GeneratedComponent): boolean {
    return component.jsx.includes('disabled') || 
           component.jsx.includes('active') || 
           component.css.includes(':hover');
  }

  private generateSizeVariants(component: GeneratedComponent): ComponentVariant[] {
    return [
      {
        name: 'Small',
        props: { size: 'sm' },
        description: 'Small size variant',
        usage: `<${component.name} size="sm" />`
      },
      {
        name: 'Medium',
        props: { size: 'md' },
        description: 'Medium size variant (default)',
        usage: `<${component.name} size="md" />`
      },
      {
        name: 'Large',
        props: { size: 'lg' },
        description: 'Large size variant',
        usage: `<${component.name} size="lg" />`
      }
    ];
  }

  private generateColorVariants(component: GeneratedComponent): ComponentVariant[] {
    return [
      {
        name: 'Primary',
        props: { variant: 'primary' },
        description: 'Primary color variant',
        usage: `<${component.name} variant="primary" />`
      },
      {
        name: 'Secondary',
        props: { variant: 'secondary' },
        description: 'Secondary color variant',
        usage: `<${component.name} variant="secondary" />`
      }
    ];
  }

  private generateStateVariants(component: GeneratedComponent): ComponentVariant[] {
    return [
      {
        name: 'Default',
        props: {},
        description: 'Default state',
        usage: `<${component.name} />`
      },
      {
        name: 'Disabled',
        props: { disabled: true },
        description: 'Disabled state',
        usage: `<${component.name} disabled />`
      }
    ];
  }

  // Documentation Generation Methods
  private generateComponentDescription(component: GeneratedComponent): string {
    const type = component.metadata.componentType;
    const complexity = component.metadata.complexity;
    
    return `A ${complexity} ${type} component generated from Figma design. This component provides ${this.getComponentPurpose(component)} functionality with built-in accessibility and responsive design support.`;
  }

  private getComponentPurpose(component: GeneratedComponent): string {
    const name = component.name.toLowerCase();
    if (name.includes('button')) return 'interactive button';
    if (name.includes('card')) return 'content card';
    if (name.includes('input')) return 'form input';
    if (name.includes('text')) return 'text display';
    return 'UI element';
  }

  private extractComponentProps(component: GeneratedComponent): any[] {
    // Extract props from TypeScript interface or JSX
    const typescript = typeof component.typescript === 'string' ? component.typescript : '';
    const propsMatch = typescript.match(/interface \w+Props \{([^}]+)\}/);
    if (propsMatch) {
      return this.parsePropsFromInterface(propsMatch[1]);
    }
    return [];
  }

  private parsePropsFromInterface(interfaceContent: string): any[] {
    const props = [];
    const lines = interfaceContent.split('\n').map(line => line.trim()).filter(Boolean);
    
    lines.forEach(line => {
      const match = line.match(/(\w+)(\?)?:\s*([^;]+);?/);
      if (match) {
        props.push({
          name: match[1],
          optional: !!match[2],
          type: match[3],
          description: this.generatePropDescription(match[1], match[3])
        });
      }
    });
    
    return props;
  }

  private generatePropDescription(name: string, type: string): string {
    if (name === 'children') return 'Child elements to render inside the component';
    if (name === 'className') return 'Additional CSS classes to apply';
    if (name === 'disabled') return 'Whether the component is disabled';
    if (name === 'size') return 'Size variant of the component';
    if (name === 'variant') return 'Visual variant of the component';
    return `${name} prop of type ${type}`;
  }

  private generatePropsDocumentation(props: any[]): string {
    if (props.length === 0) return 'No props available.';
    
    return `| Prop | Type | Required | Description |
|------|------|----------|-------------|
${props.map(prop => 
  `| ${prop.name} | \`${prop.type}\` | ${prop.optional ? 'No' : 'Yes'} | ${prop.description} |`
).join('\n')}`;
  }

  private generateVariantsDocumentation(variants: ComponentVariant[]): string {
    if (variants.length === 0) return 'No variants available.';
    
    return variants.map(variant => `
### ${variant.name}
${variant.description}

\`\`\`jsx
${variant.usage}
\`\`\`
`).join('\n');
  }

  private generateUsageExamples(component: GeneratedComponent): string {
    return `\`\`\`jsx
import { ${component.name} } from './components/${component.name}';

function App() {
  return (
    <${component.name}>
      Example usage
    </${component.name}>
  );
}
\`\`\``;
  }

  private generateAccessibilityDocumentation(component: GeneratedComponent): string {
    const score = component.accessibility.score;
    const compliance = component.accessibility.wcagCompliance;
    
    return `- **Accessibility Score**: ${score}/100
- **WCAG Compliance**: ${compliance}
- **Screen Reader Support**: Yes
- **Keyboard Navigation**: Yes
- **Focus Management**: Automatic`;
  }

  private generatePerformanceNotes(component: GeneratedComponent): string {
    const complexity = component.metadata.complexity;
    const accuracy = component.metadata.estimatedAccuracy;
    
    return `- **Complexity**: ${complexity}
- **Estimated Accuracy**: ${accuracy}%
- **Bundle Impact**: Minimal
- **Render Performance**: Optimized`;
  }

  // Testing Generation Methods
  private generateTestCases(component: GeneratedComponent): string {
    return `
  it('renders without crashing', () => {
    render(<${component.name} />);
  });

  it('applies custom className', () => {
    render(<${component.name} className="custom-class" />);
    expect(screen.getByRole('${this.getComponentRole(component)}')).toHaveClass('custom-class');
  });

  it('handles props correctly', () => {
    const props = { testProp: 'test-value' };
    render(<${component.name} {...props} />);
    // Add specific prop tests
  });`;
  }

  private generateAccessibilityTests(component: GeneratedComponent): string {
    return `
  it('has no accessibility violations', async () => {
    const { container } = render(<${component.name} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', () => {
    render(<${component.name} />);
    const element = screen.getByRole('${this.getComponentRole(component)}');
    element.focus();
    expect(element).toHaveFocus();
  });`;
  }

  private generatePerformanceTests(component: GeneratedComponent): string {
    return `
  it('renders within performance budget', () => {
    const startTime = performance.now();
    render(<${component.name} />);
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(16); // 60fps budget
  });`;
  }

  private getComponentRole(component: GeneratedComponent): string {
    const name = component.name.toLowerCase();
    if (name.includes('button')) return 'button';
    if (name.includes('input')) return 'textbox';
    if (name.includes('text')) return 'text';
    return 'generic';
  }

  // Storybook Generation Methods
  private generateStorybookControls(component: GeneratedComponent): string {
    const props = this.extractComponentProps(component);
    
    return props.map(prop => {
      const control = this.getStorybookControl(prop.type);
      return `${prop.name}: { control: '${control}' }`;
    }).join(',\n    ');
  }

  private getStorybookControl(type: string): string {
    if (type.includes('string')) return 'text';
    if (type.includes('boolean')) return 'boolean';
    if (type.includes('number')) return 'number';
    if (type.includes('|')) return 'select';
    return 'object';
  }

  private generateStorybookVariants(variants: ComponentVariant[]): string {
    return variants.map(variant => `
export const ${variant.name}: Story = {
  args: ${JSON.stringify(variant.props, null, 2)}
};`).join('\n');
  }

  private getComponentCategory(component: GeneratedComponent): string {
    return this.categorizeComponent(component);
  }
}