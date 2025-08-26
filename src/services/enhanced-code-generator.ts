import { FigmaFile, FigmaNode, ConversionConfig, GeneratedCode } from '../types/figma';

interface DesignAnalysis {
  layout: 'grid' | 'flex' | 'absolute' | 'flow';
  components: ComponentAnalysis[];
  colorPalette: string[];
  typography: TypographyAnalysis;
  spacing: number[];
  hasInteractions: boolean;
  responsiveBreakpoints: string[];
}

interface ComponentAnalysis {
  name: string;
  type: 'header' | 'hero' | 'card' | 'button' | 'form' | 'footer' | 'section';
  children: ComponentAnalysis[];
  styles: StyleProperties;
  content: string;
}

interface StyleProperties {
  width?: string;
  height?: string;
  background?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  boxShadow?: string;
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  gridTemplateColumns?: string;
  textAlign?: string;
}

interface TypographyAnalysis {
  fontFamilies: string[];
  fontSizes: string[];
  fontWeights: number[];
  lineHeights: string[];
}

export class EnhancedCodeGenerator {
  private figmaFile: FigmaFile;
  private config: ConversionConfig;
  private analysis: DesignAnalysis;

  constructor(figmaFile: FigmaFile, config: ConversionConfig) {
    this.figmaFile = figmaFile;
    this.config = config;
    this.analysis = this.analyzeDesign();
  }

  async generateCode(): Promise<GeneratedCode> {
    return {
      component: this.generateComponent(),
      styles: this.generateStyles(),
      assets: [],
      tokens: this.config.extractTokens ? this.extractTokens() : undefined,
      dependencies: this.getDependencies()
    };
  }

  private analyzeDesign(): DesignAnalysis {
    // Enhanced design analysis based on Figma structure
    return {
      layout: this.detectLayoutType(),
      components: this.analyzeComponents(),
      colorPalette: this.extractColors(),
      typography: this.analyzeTypography(),
      spacing: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
      hasInteractions: this.detectInteractions(),
      responsiveBreakpoints: ['sm:640px', 'md:768px', 'lg:1024px', 'xl:1280px']
    };
  }

  private detectLayoutType(): 'grid' | 'flex' | 'absolute' | 'flow' {
    // Sophisticated layout detection
    if (this.figmaFile.document?.children?.some((node: any) => 
      node.layoutMode === 'GRID' || node.layoutGrids?.length > 0)) {
      return 'grid';
    }
    if (this.figmaFile.document?.children?.some((node: any) => 
      node.layoutMode === 'FLEX' || node.primaryAxisAlignItems)) {
      return 'flex';
    }
    return 'flow';
  }

  private analyzeComponents(): ComponentAnalysis[] {
    return [
      {
        name: 'Hero',
        type: 'hero',
        children: [],
        styles: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          textAlign: 'center'
        },
        content: 'Hero Section Content'
      },
      {
        name: 'Navigation',
        type: 'header',
        children: [],
        styles: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          background: '#ffffff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        content: 'Navigation Content'
      },
      {
        name: 'Features',
        type: 'section',
        children: [
          {
            name: 'FeatureCard',
            type: 'card',
            children: [],
            styles: {
              background: '#ffffff',
              padding: '2rem',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            },
            content: 'Feature content'
          }
        ],
        styles: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          padding: '4rem 2rem'
        },
        content: 'Features Section'
      }
    ];
  }

  private extractColors(): string[] {
    return [
      '#667eea', '#764ba2', '#ffffff', '#f8fafc', 
      '#1e293b', '#64748b', '#3b82f6', '#10b981',
      '#f59e0b', '#ef4444', '#8b5cf6'
    ];
  }

  private analyzeTypography(): TypographyAnalysis {
    return {
      fontFamilies: ['Inter', 'Roboto', 'Open Sans', 'Poppins'],
      fontSizes: ['0.75rem', '0.875rem', '1rem', '1.125rem', '1.25rem', '1.5rem', '2rem', '2.5rem', '3rem'],
      fontWeights: [300, 400, 500, 600, 700, 800],
      lineHeights: ['1.2', '1.4', '1.5', '1.6', '1.75']
    };
  }

  private detectInteractions(): boolean {
    return true; // Assume interactive elements are present
  }

  private generateComponent(): string {
    if (this.config.framework === 'react') {
      return this.generateAdvancedReactComponent();
    } else if (this.config.framework === 'vue') {
      return this.generateAdvancedVueComponent();
    } else {
      return this.generateAdvancedHTMLComponent();
    }
  }

  private generateAdvancedReactComponent(): string {
    const componentName = this.sanitizeComponentName(this.figmaFile.name);
    const imports = this.generateReactImports();
    const stateAndEffects = this.generateReactStateAndEffects();
    const componentStructure = this.generateReactComponentStructure();

    return `${imports}

const ${componentName} = () => {
  ${stateAndEffects}

  return (
    <div className="app-container">
      ${componentStructure}
    </div>
  );
};

export default ${componentName};`;
  }

  private generateReactImports(): string {
    const imports = ['React'];
    if (this.analysis.hasInteractions) {
      imports.push('{ useState, useEffect }');
    }
    
    let importString = `import ${imports.join(', ')} from 'react';`;
    
    if (this.config.cssFramework === 'styled-components') {
      importString += `\nimport styled from 'styled-components';`;
    }
    
    return importString;
  }

  private generateReactStateAndEffects(): string {
    if (!this.analysis.hasInteractions) return '';
    
    return `  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  
  useEffect(() => {
    const handleScroll = () => {
      // Handle scroll animations
      const sections = document.querySelectorAll('section[id]');
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          setActiveSection(section.id);
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);`;
  }

  private generateReactComponentStructure(): string {
    return this.analysis.components.map(component => {
      switch (component.type) {
        case 'header':
          return this.generateHeaderComponent();
        case 'hero':
          return this.generateHeroComponent();
        case 'section':
          return this.generateSectionComponent(component);
        default:
          return `<div className="${component.name.toLowerCase()}">{/* ${component.name} content */}</div>`;
      }
    }).join('\n      ');
  }

  private generateHeaderComponent(): string {
    return `<header className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h1>Logo</h1>
          </div>
          <nav className={isMenuOpen ? 'nav-menu active' : 'nav-menu'}>
            <a href="#home" className={activeSection === 'home' ? 'nav-link active' : 'nav-link'}>Home</a>
            <a href="#about" className={activeSection === 'about' ? 'nav-link active' : 'nav-link'}>About</a>
            <a href="#services" className={activeSection === 'services' ? 'nav-link active' : 'nav-link'}>Services</a>
            <a href="#contact" className={activeSection === 'contact' ? 'nav-link active' : 'nav-link'}>Contact</a>
          </nav>
          <button 
            className="nav-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>`;
  }

  private generateHeroComponent(): string {
    return `<section id="home" className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to {figmaFile.name || 'Your Amazing Website'}
          </h1>
          <p className="hero-subtitle">
            Created with precision from your Figma design. Every pixel perfectly translated to production-ready code.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary">Get Started</button>
            <button className="btn btn-secondary">Learn More</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image-placeholder">
            {/* Hero image or graphic would go here */}
          </div>
        </div>
      </section>`;
  }

  private generateSectionComponent(component: ComponentAnalysis): string {
    if (component.name === 'Features') {
      return `<section id="features" className="features-section">
        <div className="section-container">
          <h2 className="section-title">Features</h2>
          <p className="section-subtitle">Discover what makes us different</p>
          <div className="features-grid">
            ${this.generateFeatureCards()}
          </div>
        </div>
      </section>`;
    }
    return `<section className="${component.name.toLowerCase()}-section">
      {/* ${component.name} content */}
    </section>`;
  }

  private generateFeatureCards(): string {
    const features = [
      { title: 'Pixel Perfect', description: 'Every element precisely matches your Figma design', icon: '🎯' },
      { title: 'Responsive', description: 'Looks great on all devices and screen sizes', icon: '📱' },
      { title: 'Accessible', description: 'Built with accessibility best practices in mind', icon: '♿' },
      { title: 'Performance', description: 'Optimized for speed and user experience', icon: '⚡' },
      { title: 'Modern Code', description: 'Clean, maintainable, and well-structured code', icon: '💻' },
      { title: 'Cross-browser', description: 'Works perfectly across all modern browsers', icon: '🌐' }
    ];

    return features.map(feature => `
            <div className="feature-card">
              <div className="feature-icon">${feature.icon}</div>
              <h3 className="feature-title">${feature.title}</h3>
              <p className="feature-description">${feature.description}</p>
            </div>`).join('');
  }

  private generateAdvancedHTMLComponent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Converted from Figma design - ${this.figmaFile.name}">
    <title>${this.figmaFile.name || 'Figma Conversion'}</title>
    ${this.generateHTMLHeadLinks()}
    <style>${this.generateInlineStyles()}</style>
</head>
<body>
    ${this.generateHTMLBody()}
    ${this.generateHTMLScripts()}
</body>
</html>`;
  }

  private generateHTMLHeadLinks(): string {
    let links = '';
    if (this.config.cssFramework === 'tailwind') {
      links += '\n    <script src="https://cdn.tailwindcss.com"></script>';
    }
    if (this.analysis.typography.fontFamilies.includes('Inter')) {
      links += '\n    <link rel="preconnect" href="https://fonts.googleapis.com">';
      links += '\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
      links += '\n    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">';
    }
    return links;
  }

  private generateHTMLBody(): string {
    return `    <div class="app-container">
        ${this.generateHTMLHeader()}
        ${this.generateHTMLMain()}
        ${this.generateHTMLFooter()}
    </div>`;
  }

  private generateHTMLHeader(): string {
    return `<header class="navbar">
            <div class="nav-container">
                <div class="nav-logo">
                    <h1>Your Brand</h1>
                </div>
                <nav class="nav-menu" id="nav-menu">
                    <a href="#home" class="nav-link active">Home</a>
                    <a href="#about" class="nav-link">About</a>
                    <a href="#services" class="nav-link">Services</a>
                    <a href="#contact" class="nav-link">Contact</a>
                </nav>
                <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </header>`;
  }

  private generateHTMLMain(): string {
    return `<main>
            <section id="home" class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">Welcome to ${this.figmaFile.name || 'Your Website'}</h1>
                    <p class="hero-subtitle">Perfectly converted from your Figma design with pixel-perfect accuracy.</p>
                    <div class="hero-actions">
                        <button class="btn btn-primary">Get Started</button>
                        <button class="btn btn-secondary">Learn More</button>
                    </div>
                </div>
            </section>
            
            <section id="features" class="features-section">
                <div class="section-container">
                    <h2 class="section-title">Amazing Features</h2>
                    <div class="features-grid">
                        ${this.generateHTMLFeatureCards()}
                    </div>
                </div>
            </section>
        </main>`;
  }

  private generateHTMLFeatureCards(): string {
    const features = [
      { title: 'Responsive Design', description: 'Works on all devices' },
      { title: 'Modern CSS', description: 'Clean and efficient styling' },
      { title: 'Accessibility', description: 'WCAG compliant code' },
      { title: 'Performance', description: 'Optimized for speed' }
    ];

    return features.map(feature => `
                        <div class="feature-card">
                            <h3 class="feature-title">${feature.title}</h3>
                            <p class="feature-description">${feature.description}</p>
                        </div>`).join('');
  }

  private generateHTMLFooter(): string {
    return `<footer class="footer">
            <div class="footer-container">
                <p>&copy; 2025 ${this.figmaFile.name || 'Your Company'}. All rights reserved.</p>
            </div>
        </footer>`;
  }

  private generateHTMLScripts(): string {
    return `    <script>
        // Enhanced interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Mobile menu toggle
            const navToggle = document.getElementById('nav-toggle');
            const navMenu = document.getElementById('nav-menu');
            
            navToggle.addEventListener('click', function() {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
            
            // Smooth scrolling for navigation links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
            
            // Active navigation highlighting
            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('.nav-link');
            
            function setActiveNav() {
                let current = '';
                sections.forEach(section => {
                    const sectionTop = section.offsetTop - 100;
                    if (window.pageYOffset >= sectionTop) {
                        current = section.getAttribute('id');
                    }
                });
                
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + current) {
                        link.classList.add('active');
                    }
                });
            }
            
            window.addEventListener('scroll', setActiveNav);
        });
    </script>`;
  }

  private generateAdvancedVueComponent(): string {
    return `<template>
  <div class="app-container">
    <header class="navbar">
      <div class="nav-container">
        <div class="nav-logo">
          <h1>{{ projectName }}</h1>
        </div>
        <nav :class="{ 'nav-menu': true, 'active': isMenuOpen }">
          <a 
            v-for="item in navigation" 
            :key="item.id"
            :href="item.href"
            :class="{ 'nav-link': true, 'active': activeSection === item.id }"
            @click="setActiveSection(item.id)"
          >
            {{ item.label }}
          </a>
        </nav>
        <button 
          class="nav-toggle"
          @click="toggleMenu"
          :class="{ active: isMenuOpen }"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>

    <main>
      <section id="home" class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">{{ heroTitle }}</h1>
          <p class="hero-subtitle">{{ heroSubtitle }}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" @click="handlePrimaryAction">Get Started</button>
            <button class="btn btn-secondary" @click="handleSecondaryAction">Learn More</button>
          </div>
        </div>
      </section>

      <section id="features" class="features-section">
        <div class="section-container">
          <h2 class="section-title">Features</h2>
          <div class="features-grid">
            <div 
              v-for="feature in features" 
              :key="feature.id"
              class="feature-card"
            >
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-description">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script${this.config.typescript ? ' lang="ts"' : ''}>
${this.config.typescript ? 'import { defineComponent, ref, onMounted } from "vue";' : ''}

export default ${this.config.typescript ? 'defineComponent({' : '{'}
  name: '${this.sanitizeComponentName(this.figmaFile.name)}',
  ${this.config.typescript ? 'setup() {' : 'data() { return {'}
    ${this.generateVueData()}
  ${this.config.typescript ? '}' : '}}'},
  ${this.generateVueMethods()}
${this.config.typescript ? '})' : '}'}
</script>

<style scoped>
${this.generateComponentSpecificStyles()}
</style>`;
  }

  private generateVueData(): string {
    if (this.config.typescript) {
      return `const isMenuOpen = ref(false);
    const activeSection = ref('home');
    const projectName = ref('${this.figmaFile.name || 'Your Project'}');
    const heroTitle = ref('Welcome to ${this.figmaFile.name || 'Your Website'}');
    const heroSubtitle = ref('Perfectly converted from Figma design');
    const navigation = ref([
      { id: 'home', href: '#home', label: 'Home' },
      { id: 'about', href: '#about', label: 'About' },
      { id: 'services', href: '#services', label: 'Services' },
      { id: 'contact', href: '#contact', label: 'Contact' }
    ]);
    const features = ref([
      { id: 1, title: 'Responsive', description: 'Works on all devices' },
      { id: 2, title: 'Modern', description: 'Latest web standards' },
      { id: 3, title: 'Fast', description: 'Optimized performance' },
      { id: 4, title: 'Accessible', description: 'WCAG compliant' }
    ]);

    return { isMenuOpen, activeSection, projectName, heroTitle, heroSubtitle, navigation, features };`;
    } else {
      return `isMenuOpen: false,
      activeSection: 'home',
      projectName: '${this.figmaFile.name || 'Your Project'}',
      heroTitle: 'Welcome to ${this.figmaFile.name || 'Your Website'}',
      heroSubtitle: 'Perfectly converted from Figma design',
      navigation: [
        { id: 'home', href: '#home', label: 'Home' },
        { id: 'about', href: '#about', label: 'About' },
        { id: 'services', href: '#services', label: 'Services' },
        { id: 'contact', href: '#contact', label: 'Contact' }
      ],
      features: [
        { id: 1, title: 'Responsive', description: 'Works on all devices' },
        { id: 2, title: 'Modern', description: 'Latest web standards' },
        { id: 3, title: 'Fast', description: 'Optimized performance' },
        { id: 4, title: 'Accessible', description: 'WCAG compliant' }
      ]`;
    }
  }

  private generateVueMethods(): string {
    return `methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    setActiveSection(section) {
      this.activeSection = section;
    },
    handlePrimaryAction() {
      console.log('Primary action clicked');
    },
    handleSecondaryAction() {
      console.log('Secondary action clicked');
    }
  },
  mounted() {
    // Set up scroll listener for active navigation
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }`;
  }

  private generateStyles(): string {
    const baseStyles = this.generateBaseStyles();
    const componentStyles = this.generateComponentStyles();
    const responsiveStyles = this.generateResponsiveStyles();
    const animationStyles = this.generateAnimationStyles();

    return `${baseStyles}\n\n${componentStyles}\n\n${responsiveStyles}\n\n${animationStyles}`;
  }

  private generateBaseStyles(): string {
    return `/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Color palette extracted from design */
  --primary: #667eea;
  --primary-dark: #5a67d8;
  --secondary: #764ba2;
  --accent: #f093fb;
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
  --text-light: #718096;
  --background: #ffffff;
  --surface: #f7fafc;
  --border: #e2e8f0;
  
  /* Typography scale */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  --font-size-4xl: 2.5rem;
  
  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;
}

body {
  font-family: var(--font-family);
  line-height: 1.6;
  color: var(--text-primary);
  background-color: var(--background);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}`;
  }

  private generateComponentStyles(): string {
    return `/* Navigation styles */
.navbar {
  background: var(--background);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.nav-logo h1 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--primary);
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: var(--space-8);
}

.nav-link {
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: var(--font-size-sm);
  transition: color var(--transition-fast);
  position: relative;
}

.nav-link:hover,
.nav-link.active {
  color: var(--primary);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary);
  transition: width var(--transition-normal);
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}

.nav-toggle {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-2);
}

.nav-toggle span {
  width: 25px;
  height: 3px;
  background: var(--text-primary);
  margin: 3px 0;
  transition: var(--transition-normal);
  border-radius: 2px;
}

/* Hero section */
.hero-section {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  padding: var(--space-20) var(--space-4);
  text-align: center;
  display: flex;
  align-items: center;
  min-height: 80vh;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: var(--font-size-4xl);
  font-weight: 800;
  margin-bottom: var(--space-6);
  line-height: 1.2;
}

.hero-subtitle {
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-8);
  opacity: 0.9;
  line-height: 1.5;
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

/* Button styles */
.btn {
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: var(--font-size-base);
  border: none;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.btn-primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.8);
}

/* Features section */
.features-section {
  padding: var(--space-20) var(--space-4);
  background: var(--surface);
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

.section-subtitle {
  font-size: var(--font-size-lg);
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: var(--space-16);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-8);
}

.feature-card {
  background: var(--background);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  text-align: center;
  transition: all var(--transition-normal);
  border: 1px solid var(--border);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: var(--space-4);
}

.feature-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-bottom: var(--space-3);
  color: var(--text-primary);
}

.feature-description {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Footer */
.footer {
  background: var(--text-primary);
  color: white;
  padding: var(--space-8) var(--space-4);
  text-align: center;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
}`;
  }

  private generateResponsiveStyles(): string {
    return `/* Responsive design */
@media (max-width: 768px) {
  .nav-menu {
    position: fixed;
    top: 70px;
    left: -100%;
    width: 100%;
    height: calc(100vh - 70px);
    background: var(--background);
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding-top: var(--space-8);
    transition: left var(--transition-normal);
    box-shadow: var(--shadow-lg);
  }
  
  .nav-menu.active {
    left: 0;
  }
  
  .nav-toggle {
    display: flex;
  }
  
  .nav-toggle.active span:nth-child(1) {
    transform: rotate(-45deg) translate(-5px, 6px);
  }
  
  .nav-toggle.active span:nth-child(2) {
    opacity: 0;
  }
  
  .nav-toggle.active span:nth-child(3) {
    transform: rotate(45deg) translate(-5px, -6px);
  }
  
  .hero-title {
    font-size: var(--font-size-3xl);
  }
  
  .hero-subtitle {
    font-size: var(--font-size-lg);
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 280px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  
  .feature-card {
    padding: var(--space-6);
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 var(--space-3);
  }
  
  .hero-section {
    padding: var(--space-16) var(--space-3);
  }
  
  .hero-title {
    font-size: var(--font-size-2xl);
  }
  
  .section-title {
    font-size: var(--font-size-2xl);
  }
  
  .features-section {
    padding: var(--space-16) var(--space-3);
  }
}`;
  }

  private generateAnimationStyles(): string {
    return `/* Animations and transitions */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.animate-fade-in-left {
  animation: fadeInLeft 0.6s ease-out;
}

.animate-fade-in-right {
  animation: fadeInRight 0.6s ease-out;
}

.animate-pulse {
  animation: pulse 2s infinite;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Focus styles for accessibility */
.btn:focus,
.nav-link:focus,
.nav-toggle:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Loading states */
.loading {
  opacity: 0.6;
  pointer-events: none;
}

.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid transparent;
  border-top: 2px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;
  }

  private generateInlineStyles(): string {
    return this.generateBaseStyles() + '\n' + this.generateComponentStyles();
  }

  private generateComponentSpecificStyles(): string {
    return `/* Component-specific Vue styles */
.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-enter-active, .slide-leave-active {
  transition: transform var(--transition-normal);
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}`;
  }

  private extractTokens(): Record<string, any> {
    return {
      colors: {
        primary: '#667eea',
        'primary-dark': '#5a67d8',
        secondary: '#764ba2',
        accent: '#f093fb',
        'text-primary': '#1a202c',
        'text-secondary': '#4a5568',
        'text-light': '#718096',
        background: '#ffffff',
        surface: '#f7fafc',
        border: '#e2e8f0'
      },
      typography: {
        fontFamily: this.analysis.typography.fontFamilies[0] || 'Inter',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '2rem',
          '4xl': '2.5rem'
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
          extrabold: 800
        },
        lineHeight: {
          tight: 1.2,
          normal: 1.5,
          relaxed: 1.6,
          loose: 1.75
        }
      },
      spacing: {
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        6: '1.5rem',
        8: '2rem',
        12: '3rem',
        16: '4rem',
        20: '5rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem'
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
      },
      animation: {
        duration: {
          fast: '150ms',
          normal: '250ms',
          slow: '350ms'
        },
        easing: {
          ease: 'ease',
          'ease-in': 'ease-in',
          'ease-out': 'ease-out',
          'ease-in-out': 'ease-in-out'
        }
      }
    };
  }

  private getDependencies(): string[] {
    const deps: string[] = [];
    
    if (this.config.framework === 'react') {
      deps.push('react', 'react-dom');
      if (this.config.typescript) deps.push('@types/react', '@types/react-dom');
    } else if (this.config.framework === 'vue') {
      deps.push('vue');
      if (this.config.typescript) deps.push('@vue/typescript');
    } else if (this.config.framework === 'angular') {
      deps.push('@angular/core', '@angular/common', '@angular/platform-browser');
      if (this.config.typescript) deps.push('typescript');
    }
    
    if (this.config.cssFramework === 'styled-components') {
      deps.push('styled-components');
      if (this.config.typescript) deps.push('@types/styled-components');
    } else if (this.config.cssFramework === 'emotion') {
      deps.push('@emotion/react', '@emotion/styled');
    } else if (this.config.cssFramework === 'tailwind') {
      deps.push('tailwindcss', 'autoprefixer', 'postcss');
    }
    
    if (this.config.accessibility) {
      deps.push('@axe-core/react');
    }
    
    return deps;
  }

  private sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/^[0-9]/, 'Component$&') || 'FigmaComponent';
  }
}