// Figma API type definitions

export interface FigmaFile {
  name: string;
  role: string;
  lastModified: string;
  editorType: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  componentSets: Record<string, FigmaComponentSet>;
  schemaVersion: number;
  styles: Record<string, FigmaStyle>;
  mainFileKey?: string;
  branches?: FigmaBranch[];
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  pluginData?: any;
  sharedPluginData?: any;
  visible?: boolean;
  locked?: boolean;
  exportSettings?: FigmaExportSetting[];
  blendMode?: string;
  preserveRatio?: boolean;
  layoutAlign?: string;
  layoutGrow?: number;
  constraints?: FigmaLayoutConstraint;
  transitionNodeID?: string;
  transitionDuration?: number;
  transitionEasing?: string;
  opacity?: number;
  absoluteBoundingBox?: FigmaRectangle;
  absoluteRenderBounds?: FigmaRectangle;
  size?: FigmaVector;
  relativeTransform?: FigmaTransform;
  clipsContent?: boolean;
  background?: FigmaPaint[];
  backgroundColor?: FigmaColor;
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  strokeMiterLimit?: number;
  strokeAlign?: string;
  strokeCap?: string;
  strokeJoin?: string;
  strokeDashes?: number[];
  cornerRadius?: number;
  cornerSmoothing?: number;
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomLeftRadius?: number;
  bottomRightRadius?: number;
  effects?: FigmaEffect[];
  isMask?: boolean;
  isMaskOutline?: boolean;
  styles?: Record<string, string>;
  children?: FigmaNode[];
  
  // Layout properties
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  layoutWrap?: 'NO_WRAP' | 'WRAP';
  layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
  layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  itemReverseZIndex?: boolean;
  strokesIncludedInLayout?: boolean;
  layoutGrids?: FigmaLayoutGrid[];
  
  // Text specific properties
  characters?: string;
  style?: FigmaTypeStyle;
  characterStyleOverrides?: number[];
  styleOverrideTable?: Record<string, FigmaTypeStyle>;
  lineTypes?: string[];
  lineIndentations?: number[];
  
  // Component specific properties
  componentId?: string;
  componentSetId?: string;
  variantProperties?: Record<string, string>;
  
  // Instance specific properties
  componentProperties?: Record<string, FigmaComponentProperty>;
  overrides?: FigmaOverride[];
  
  // Geometry specific properties
  arcData?: FigmaArcData;
  rectangleCornerRadii?: number[];
  
  // Vector specific properties
  vectorNetwork?: FigmaVectorNetwork;
  vectorPaths?: FigmaVectorPath[];
  
  // Boolean operation specific properties
  booleanOperation?: 'UNION' | 'INTERSECT' | 'SUBTRACT' | 'EXCLUDE';
}

export interface FigmaComponent {
  key: string;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user: FigmaUser;
  containing_frame?: {
    name: string;
    node_id: string;
  };
  node_type: string;
  componentSetId?: string;
  documentationLinks?: Array<{ uri: string }>;
}

export interface FigmaComponentSet {
  key: string;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user: FigmaUser;
  containing_frame?: {
    name: string;
    node_id: string;
  };
}

export interface FigmaStyle {
  key: string;
  file_key: string;
  node_id: string;
  style_type: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  thumbnail_url: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user: FigmaUser;
  sort_position: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
}

export interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
  email?: string;
}

export interface FigmaBranch {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
  link_access: string;
}

export interface FigmaExportSetting {
  suffix: string;
  format: 'JPG' | 'PNG' | 'SVG' | 'PDF';
  constraint: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
}

export interface FigmaLayoutConstraint {
  vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
  horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';
}

export interface FigmaRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaVector {
  x: number;
  y: number;
}

export interface FigmaTransform {
  0: [number, number, number];
  1: [number, number, number];
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'EMOJI';
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  blendMode?: string;
  gradientHandlePositions?: FigmaVector[];
  gradientStops?: FigmaColorStop[];
  scaleMode?: 'FILL' | 'FIT' | 'TILE' | 'STRETCH';
  imageTransform?: FigmaTransform;
  scalingFactor?: number;
  rotation?: number;
  imageRef?: string;
  filters?: FigmaImageFilters;
  gifRef?: string;
}

export interface FigmaColorStop {
  position: number;
  color: FigmaColor;
}

export interface FigmaImageFilters {
  exposure?: number;
  highlights?: number;
  shadows?: number;
  saturation?: number;
  temperature?: number;
  tint?: number;
  contrast?: number;
}

export interface FigmaEffect {
  type: 'INNER_SHADOW' | 'DROP_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible?: boolean;
  radius: number;
  color?: FigmaColor;
  blendMode?: string;
  offset?: FigmaVector;
  spread?: number;
  showShadowBehindNode?: boolean;
}

export interface FigmaLayoutGrid {
  pattern: 'COLUMNS' | 'ROWS' | 'GRID';
  sectionSize?: number;
  visible?: boolean;
  color?: FigmaColor;
  alignment: 'MIN' | 'STRETCH' | 'CENTER';
  gutterSize?: number;
  offset?: number;
  count?: number;
}

export interface FigmaTypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  listSpacing?: number;
  italic?: boolean;
  fontWeight: number;
  fontSize: number;
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED';
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
  textAlignHorizontal?: 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing?: number;
  fills?: FigmaPaint[];
  hyperlink?: FigmaHyperlink;
  opentypeFlags?: Record<string, number>;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightPercentFontSize?: number;
  lineHeightUnit?: 'PIXELS' | 'FONT_SIZE_%' | 'INTRINSIC_%';
}

export interface FigmaHyperlink {
  type: 'URL' | 'NODE';
  url?: string;
  nodeID?: string;
}

export interface FigmaComponentProperty {
  type: 'BOOLEAN' | 'INSTANCE_SWAP' | 'TEXT' | 'VARIANT';
  value: any;
  preferredValues?: any[];
  defaultValue?: any;
}

export interface FigmaOverride {
  id: string;
  overriddenFields: string[];
}

export interface FigmaArcData {
  startingAngle: number;
  endingAngle: number;
  innerRadius: number;
}

export interface FigmaVectorNetwork {
  vertices: FigmaVectorVertex[];
  edges: FigmaVectorEdge[];
  regions?: FigmaVectorRegion[];
}

export interface FigmaVectorVertex {
  x: number;
  y: number;
  strokeCap?: string;
  strokeJoin?: string;
  cornerRadius?: number;
  handleMirroring?: string;
}

export interface FigmaVectorEdge {
  strokeCap?: string;
  strokeJoin?: string;
  strokeMiterLimit?: number;
}

export interface FigmaVectorRegion {
  windingRule: 'EVENODD' | 'NONZERO';
  loops: number[][];
  fills?: FigmaPaint[];
  fillStyleId?: string;
}

export interface FigmaVectorPath {
  windingRule: 'EVENODD' | 'NONZERO';
  data: string;
}

// Conversion and generation types
export interface ConversionConfig {
  framework: 'react' | 'vue' | 'angular' | 'svelte' | 'vanilla' | 'html';
  cssFramework: 'tailwind' | 'styled-components' | 'emotion' | 'css-modules' | 'vanilla';
  typescript: boolean;
  responsive: boolean;
  optimizeImages: boolean;
  extractTokens: boolean;
  accessibility?: boolean;
  optimization?: boolean;
  semanticHtml?: boolean;
  componentExtraction?: boolean;
}

export interface GeneratedCode {
  component: string;
  styles: string;
  assets: string[];
  tokens?: Record<string, any>;
  dependencies: string[];
  // Legacy compatibility
  html?: string;
  css?: string;
  javascript?: string;
  jsx?: string;
}

// API Response Types
export interface FigmaApiResponse<T = any> extends FigmaFile {
  error?: boolean;
  status?: number;
  err?: string;
  data?: T;
}

export interface FigmaFileResponse extends FigmaApiResponse {
  name: string;
  role: string;
  lastModified: string;
  editorType: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  componentSets: Record<string, FigmaComponentSet>;
  schemaVersion: number;
  styles: Record<string, FigmaStyle>;
  mainFileKey?: string;
  branches?: FigmaBranch[];
}

// Legacy compatibility types  
export interface GeneratedComponent extends GeneratedCode {
  // Legacy alias for GeneratedCode
  id?: string;
  name?: string;
  typescript?: string; // Changed from boolean to string to hold generated TypeScript code
  metadata?: ComponentMetadata;
  accessibility?: AccessibilityReport;
  responsive?: ResponsiveBreakpoints;
}

export interface ComponentMetadata {
  id: string;
  name: string;
  type: string;
  componentType?: string;
  complexity?: string;
  estimatedAccuracy?: number;
  generationTime?: number;
  dependencies?: string[];
  figmaNodeId?: string;
  isBaseComponent?: boolean;
  variationType?: string;
  extendsComponent?: string;
  props?: Record<string, any>;
  children?: ComponentMetadata[];
}

export interface AccessibilityReport {
  issues: Array<{
    type: string;
    message: string;
    element?: string;
    fix?: string;
  }>;
  score: number;
  suggestions: string[];
  wcagCompliance?: string;
}

export interface ResponsiveBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
  hasResponsiveDesign?: boolean;
}

export interface ProcessingPhase {
  id: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'error';
  progress: number;
  error?: string;
}

// Type aliases for compatibility
export type Color = FigmaColor;
export type Paint = FigmaPaint;
export type TypeStyle = FigmaTypeStyle;

export const DEFAULT_CONVERSION_CONFIG: ConversionConfig = {
  framework: 'react',
  cssFramework: 'tailwind',
  typescript: true,
  responsive: true,
  optimizeImages: true,
  extractTokens: true,
  accessibility: true,
};