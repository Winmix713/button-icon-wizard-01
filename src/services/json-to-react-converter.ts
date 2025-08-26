import { FigmaNode, FigmaColor, FigmaPaint, FigmaRectangle, FigmaTypeStyle, FigmaLayoutConstraint } from '../types/figma';

export interface ConversionResult {
  appTsx: string;
  appCss: string;
}

export class JsonToReactConverter {
  // Fő konverziós metódus
  convertJsonToReact(rootNode: FigmaNode): ConversionResult {
    if (!rootNode || !rootNode.children || rootNode.children.length === 0) {
      return { appTsx: this.generateEmptyApp(), appCss: this.generateEmptyCSS() };
    }

    // Főkomponens keresése (általában a legfelső szintű FRAME vagy CANVAS)
    // A rootNode maga is lehet a főkomponens, vagy annak első gyermeke
    const mainComponent = rootNode.type === 'DOCUMENT' || rootNode.type === 'CANVAS' ? rootNode.children[0] : rootNode;

    // JSX generálás
    const appTsx = this.generateAppTsx(mainComponent);

    // CSS generálás
    const allNodes: FigmaNode[] = [];
    this.collectAllNodes(rootNode, allNodes); // Összegyűjtjük az összes node-ot a CSS generáláshoz
    const appCss = this.generateAppCss(allNodes);

    return { appTsx, appCss };
  }

  // Segédfüggvény az összes node összegyűjtésére (rekurzívan)
  private collectAllNodes(node: FigmaNode, nodesArray: FigmaNode[]) {
    nodesArray.push(node);
    if (node.children) {
      node.children.forEach(child => this.collectAllNodes(child, nodesArray));
    }
  }

  // App.tsx generálás
  private generateAppTsx(mainComponent: FigmaNode): string {
    const componentName = this.sanitizeComponentName(mainComponent?.name || 'App');
    // A JSX tartalom generálása a főkomponens gyermekeiből
    const jsxContent = this.generateJSXFromNode(mainComponent, 2); // Kezdő indentáció 2 space

    return `import React from 'react';
import './App.css';

interface ${componentName}Props {
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className }) => {
  return (
    <div className={\`app-container \${className || ''}\`}>
${jsxContent}
    </div>
  );
};

export default ${componentName};`;
  }

  // JSX tartalom generálás egyetlen node-ból és annak gyermekeiből (rekurzívan)
  private generateJSXFromNode(node: FigmaNode, indent: number = 0): string {
    const indentStr = ' '.repeat(indent);
    const className = this.generateClassName(node);
    const tag = this.getHtmlTag(node);
    const content = this.getNodeContent(node);

    // Speciális kezelés IMAGE és VECTOR node-oknak
    if (node.type === 'IMAGE') {
      // Feltételezzük, hogy egy imageRef tulajdonság létezik vagy placeholder-t használunk
      const imgSrc = '/placeholder.svg'; // Placeholder kép
      return `${indentStr}<img className="${className}" src="${imgSrc}" alt="${node.name || 'Image'}" />`;
    }

    if (node.type === 'VECTOR') {
      // A vector adatok feldolgozása bonyolult, itt csak placeholder SVG-t használunk
      const svgContent = `<!-- SVG content for ${node.name} would go here -->`;
      return `${indentStr}<svg className="${className}" viewBox="0 0 ${node.absoluteBoundingBox?.width || 100} ${node.absoluteBoundingBox?.height || 100}">${svgContent}</svg>`;
    }

    const hasChildren = node.children && node.children.length > 0;

    if (hasChildren) {
      const childrenJSX = node.children.map(child => this.generateJSXFromNode(child, indent + 2)).join('\n');
      return `${indentStr}<${tag} className="${className}">
${content ? `${indentStr}  ${content}\n` : ''}${childrenJSX}
${indentStr}</${tag}>`;
    } else {
      if (content) {
        return `${indentStr}<${tag} className="${className}">${content}</${tag}>`;
      } else {
        return `${indentStr}<${tag} className="${className}" />`;
      }
    }
  }

  // CSS generálás
  private generateAppCss(nodes: FigmaNode[]): string {
    let css = `/* Generated CSS from Figma JSON */
.app-container {
  width: 100%;
  min-height: 100vh;
  position: relative; /* A fő konténer relatív pozíciója */
  overflow: hidden; /* Megakadályozza a tartalom kilógását */
}
`;

    // CSS szabályok generálása minden node-hoz
    nodes.forEach(node => {
      const className = this.generateClassName(node);
      const styles = this.extractNodeStyles(node);
      if (Object.keys(styles).length > 0) {
        css += `.${className} {\n`;
        Object.entries(styles).forEach(([property, value]) => {
          css += `  ${this.camelToKebab(property)}: ${value};\n`;
        });
        css += '}\n\n';
      }
    });

    // Responsive CSS hozzáadása
    css += this.generateResponsiveCSS(nodes);
    return css;
  }

  // Node stílusok kinyerése
  private extractNodeStyles(node: FigmaNode): Record<string, string> {
    const styles: Record<string, string> = {};

    // Pozíció és méret
    if (node.absoluteBoundingBox) {
      styles.width = `${node.absoluteBoundingBox.width}px`;
      styles.height = `${node.absoluteBoundingBox.height}px`;

      // Abszolút pozícionálás, ha a szülő FRAME
      // Megjegyzés: A Figma API nem adja meg közvetlenül a szülő típusát.
      // Itt feltételezzük, hogy ha egy node-nak van absoluteBoundingBox-a,
      // és nem a legfelső szintű FRAME/CANVAS, akkor abszolút pozíciót kaphat.
      // Egy robusztusabb megoldás a szülő node típusát is figyelembe venné.
      if (node.relativeTransform) { // relativeTransform a szülőhöz képesti pozíció
        styles.position = 'absolute';
        styles.left = `${node.relativeTransform[0][2]}px`;
        styles.top = `${node.relativeTransform[1][2]}px`;
      }
    }

    // Háttérszín / Fills
    if (node.fills && node.fills.length > 0) {
      const solidFill = node.fills.find(fill => fill.type === 'SOLID' && fill.visible);
      if (solidFill && solidFill.color) {
        styles.backgroundColor = this.colorToCSS(solidFill.color);
      }
      // TODO: Kezelni a gradienseket és képeket a fills-ben
    } else if (node.backgroundColor) { // Fallback, ha nincs fills
      styles.backgroundColor = this.colorToCSS(node.backgroundColor);
    }

    // Border / Strokes
    if (node.strokes && node.strokes.length > 0 && node.strokeWeight !== undefined) {
      const solidStroke = node.strokes.find(stroke => stroke.type === 'SOLID' && stroke.visible);
      if (solidStroke && solidStroke.color) {
        styles.border = `${node.strokeWeight}px solid ${this.colorToCSS(solidStroke.color)}`;
        // TODO: strokeAlign (INSIDE, OUTSIDE, CENTER) kezelése
      }
    }

    // Border radius
    if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
      styles.borderRadius = `${node.cornerRadius}px`;
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity !== 1) {
      styles.opacity = node.opacity.toString();
    }

    // Auto Layout tulajdonságok (FRAME-ekre és GROUP-okra)
    if (node.type === 'FRAME' || node.type === 'GROUP') {
      if (node.layoutMode && node.layoutMode !== 'NONE') {
        styles.display = 'flex';
        styles.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
        if (node.itemSpacing !== undefined) {
          styles.gap = `${node.itemSpacing}px`;
        }
        if (node.paddingTop !== undefined || node.paddingRight !== undefined || node.paddingBottom !== undefined || node.paddingLeft !== undefined) {
          styles.padding = `${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`;
        }
        // Align items és justify content a layoutAlign alapján
        if (node.layoutAlign) {
          if (node.layoutMode === 'HORIZONTAL') {
            if (node.layoutAlign === 'MIN') styles.alignItems = 'flex-start';
            if (node.layoutAlign === 'CENTER') styles.alignItems = 'center';
            if (node.layoutAlign === 'MAX') styles.alignItems = 'flex-end';
          } else { // VERTICAL
            if (node.layoutAlign === 'MIN') styles.justifyContent = 'flex-start';
            if (node.layoutAlign === 'CENTER') styles.justifyContent = 'center';
            if (node.layoutAlign === 'MAX') styles.justifyContent = 'flex-end';
          }
        }
        // layoutSizingHorizontal/Vertical kezelése (pl. flex-grow)
        if (node.layoutSizingHorizontal === 'FILL') {
          styles.flexGrow = '1';
        }
        if (node.layoutSizingVertical === 'FILL') {
          styles.flexShrink = '0'; // Prevent shrinking if FILL
        }
      }
      // Ha FRAME, de nincs Auto Layout, akkor is lehet relatív pozíció
      if (node.type === 'FRAME' && !node.layoutMode || node.layoutMode === 'NONE') {
        styles.position = 'relative';
      }
    }

    // Szöveg stílusok
    if (node.type === 'TEXT' && node.style) {
      const style = node.style;
      if (style.fontFamily) {
        styles.fontFamily = `"${style.fontFamily}", sans-serif`;
      }
      if (style.fontSize) {
        styles.fontSize = `${style.fontSize}px`;
      }
      if (style.fontWeight) {
        styles.fontWeight = style.fontWeight.toString();
      }
      if (style.fills && style.fills.length > 0) {
        const textFill = style.fills.find(fill => fill.type === 'SOLID' && fill.visible);
        if (textFill && textFill.color) {
          styles.color = this.colorToCSS(textFill.color);
        }
      }
      if (style.textAlignHorizontal) {
        styles.textAlign = style.textAlignHorizontal.toLowerCase();
      }
      if (style.lineHeightPx) {
        styles.lineHeight = `${style.lineHeightPx}px`;
      } else if (style.lineHeightPercent) {
        styles.lineHeight = `${style.lineHeightPercent}%`;
      }
      if (style.letterSpacing) {
        styles.letterSpacing = `${style.letterSpacing}px`;
      }
      if (style.textDecoration) {
        styles.textDecoration = style.textDecoration.toLowerCase().replace('_', '-');
      }
      if (style.textCase) {
        if (style.textCase === 'UPPER') styles.textTransform = 'uppercase';
        if (style.textCase === 'LOWER') styles.textTransform = 'lowercase';
        if (style.textCase === 'TITLE') styles.textTransform = 'capitalize';
      }
    }

    // Effektek (pl. árnyékok)
    if (node.effects && node.effects.length > 0) {
      const dropShadows = node.effects.filter(e => e.type === 'DROP_SHADOW' && e.visible);
      if (dropShadows.length > 0) {
        styles.boxShadow = dropShadows.map(shadow => {
          const color = this.colorToCSS(shadow.color || { r: 0, g: 0, b: 0, a: 0.25 });
          const offsetX = shadow.offset?.x || 0;
          const offsetY = shadow.offset?.y || 0;
          const blurRadius = shadow.radius || 0;
          const spread = shadow.spread || 0;
          return `${offsetX}px ${offsetY}px ${blurRadius}px ${spread}px ${color}`;
        }).join(', ');
      }
      // TODO: Inner shadow, layer blur, background blur
    }

    return styles;
  }

  // Segédfüggvények
  private sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '') // Csak betűk és számok
      .replace(/^[0-9]/, 'Component$&') // Ha számmal kezdődik, előtag
      .replace(/^./, str => str.toUpperCase()) // Első betű nagybetű
      || 'App';
  }

  private generateClassName(node: FigmaNode): string {
    const baseName = node.name || node.type || 'element';
    return baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // Nem alfanumerikus karakterek cseréje kötőjelre
      .replace(/^-+|-+$/g, '') // Kezdő/záró kötőjelek eltávolítása
      .replace(/-+/g, '-') // Több kötőjel egyre cserélése
      || 'element';
  }

  private getHtmlTag(node: FigmaNode): string {
    switch (node.type) {
      case 'TEXT':
        return 'span';
      case 'FRAME':
      case 'RECTANGLE':
      case 'ELLIPSE':
      case 'GROUP':
      case 'COMPONENT':
      case 'INSTANCE':
        return 'div';
      case 'VECTOR':
        return 'svg';
      case 'IMAGE':
        return 'img';
      default:
        return 'div';
    }
  }

  private getNodeContent(node: FigmaNode): string {
    if (node.type === 'TEXT' && node.characters) {
      return node.characters;
    }
    return '';
  }

  private colorToCSS(color: FigmaColor): string {
    if (typeof color === 'string') return color; // Ha már CSS string
    if (color.r !== undefined && color.g !== undefined && color.b !== undefined) {
      const r = Math.round(color.r * 255);
      const g = Math.round(color.g * 255);
      const b = Math.round(color.b * 255);
      const a = color.a !== undefined ? color.a : 1;
      if (a < 1) {
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`; // Kerekítés 2 tizedesjegyre
      } else {
        return `rgb(${r}, ${g}, ${b})`;
      }
    }
    return 'transparent';
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  // Responsive CSS generálás (alapvető megközelítés)
  private generateResponsiveCSS(nodes: FigmaNode[]): string {
    let responsiveCss = `/* Responsive Design - Basic implementation based on Figma constraints */\n`;

    // Általános mobil stílusok
    responsiveCss += `@media (max-width: 768px) {
  .app-container {
    padding: 16px;
  }
}\n\n`;

    responsiveCss += `@media (max-width: 480px) {
  .app-container {
    padding: 8px;
  }
}\n\n`;

    // Node-specifikus responsive szabályok a constraints alapján
    nodes.forEach(node => {
      const className = this.generateClassName(node);
      if (node.constraints) {
        const { vertical, horizontal } = node.constraints;

        // Példa: Ha a szélesség SCALE, akkor mobil nézetben 100% szélesség
        if (horizontal === 'SCALE' || node.layoutSizingHorizontal === 'FILL') {
          responsiveCss += `@media (max-width: 768px) {
  .${className} {
    width: 100% !important; /* Fontos, hogy felülírja az abszolút szélességet */
    left: 0 !important; /* Középre igazítás vagy balra igazítás */
    right: 0 !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
}\n\n`;
        }

        // Példa: Ha a magasság SCALE, akkor mobil nézetben auto magasság
        if (vertical === 'SCALE' || node.layoutSizingVertical === 'FILL') {
          responsiveCss += `@media (max-width: 768px) {
  .${className} {
    height: auto !important;
  }
}\n\n`;
        }

        // Ha a constraint CENTER, akkor flexbox-szal középre igazítás
        if (horizontal === 'CENTER' || vertical === 'CENTER') {
          responsiveCss += `@media (max-width: 768px) {
  .${className} {
    /* A szülőnek kell flexbox-nak lennie */
    /* Ez a rész bonyolultabb, mert a szülő layout-jától függ */
  }
}\n\n`;
        }
      }
    });

    return responsiveCss;
  }

  private generateEmptyApp(): string {
    return `import React from 'react';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <h1>No Figma data available</h1>
      <p>Please load a Figma file to generate React components.</p>
    </div>
  );
};

export default App;`;
  }

  private generateEmptyCSS(): string {
    return `/* No Figma data available */
.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f0f2f5;
}
.app-container h1 {
  color: #333;
  margin-bottom: 16px;
  font-size: 2em;
}
.app-container p {
  color: #666;
  text-align: center;
  max-width: 600px;
  line-height: 1.5;
}
`;
  }
}