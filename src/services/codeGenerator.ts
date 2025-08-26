import { FigmaFile, FigmaNode, ConversionConfig, GeneratedCode } from '../types/figma';

export class CodeGenerator {
  private figmaFile: FigmaFile;
  private config: ConversionConfig;

  constructor(figmaFile: FigmaFile, config: ConversionConfig) {
    this.figmaFile = figmaFile;
    this.config = config;
  }

  async generateCode(): Promise<GeneratedCode> {
    // Simple mock implementation
    return {
      component: this.generateComponent(),
      styles: this.generateStyles(),
      assets: [],
      tokens: this.config.extractTokens ? this.extractTokens() : undefined,
      dependencies: this.getDependencies()
    };
  }

  private generateComponent(): string {
    if (this.config.framework === 'react') {
      return this.generateReactComponent();
    } else if (this.config.framework === 'vue') {
      return this.generateVueComponent();
    } else if (this.config.framework === 'angular') {
      return this.generateAngularComponent();
    } else {
      return this.generateVanillaComponent();
    }
  }

  private generateReactComponent(): string {
    return `import React from 'react';
${this.config.cssFramework === 'styled-components' ? "import styled from 'styled-components';" : ''}

const ${this.sanitizeComponentName(this.figmaFile.name)} = () => {
  return (
    <div className="container">
      <h1>Generated from Figma: ${this.figmaFile.name}</h1>
      {/* Generated content would go here */}
    </div>
  );
};

export default ${this.sanitizeComponentName(this.figmaFile.name)};`;
  }

  private generateVueComponent(): string {
    return `<template>
  <div class="container">
    <h1>Generated from Figma: ${this.figmaFile.name}</h1>
    <!-- Generated content would go here -->
  </div>
</template>

<script${this.config.typescript ? ' lang="ts"' : ''}>
export default {
  name: '${this.sanitizeComponentName(this.figmaFile.name)}'
}
</script>

<style scoped>
${this.generateStyles()}
</style>`;
  }

  private generateAngularComponent(): string {
    return `import { Component } from '@angular/core';

@Component({
  selector: 'app-${this.figmaFile.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}',
  template: \`
    <div class="container">
      <h1>Generated from Figma: ${this.figmaFile.name}</h1>
      <!-- Generated content would go here -->
    </div>
  \`,
  styleUrls: ['./component.css']
})
export class ${this.sanitizeComponentName(this.figmaFile.name)}Component {
  // Component logic here
}`;
  }

  private generateVanillaComponent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.figmaFile.name}</title>
    ${this.config.cssFramework === 'tailwind' ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
    <style>${this.generateStyles()}</style>
</head>
<body>
    <div class="container">
        <h1>Generated from Figma: ${this.figmaFile.name}</h1>
        <!-- Generated content would go here -->
    </div>
</body>
</html>`;
  }

  private generateStyles(): string {
    const baseStyles = this.config.responsive ? `
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

@media (max-width: 768px) {
  .container {
    padding: 0.5rem;
  }
}
` : `.container {
  padding: 1rem;
}`;

    return baseStyles;
  }

  private extractTokens(): Record<string, any> {
    return {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: {
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        }
      }
    };
  }

  private getDependencies(): string[] {
    const deps: string[] = [];
    
    if (this.config.framework === 'react') {
      deps.push('react', 'react-dom');
      if (this.config.typescript) deps.push('@types/react', '@types/react-dom');
    }
    
    if (this.config.cssFramework === 'styled-components') {
      deps.push('styled-components');
      if (this.config.typescript) deps.push('@types/styled-components');
    }
    
    if (this.config.cssFramework === 'emotion') {
      deps.push('@emotion/react', '@emotion/styled');
    }
    
    return deps;
  }

  private sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/^[0-9]/, 'Component$&');
  }

}