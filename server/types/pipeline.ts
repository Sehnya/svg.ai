/**
 * Core pipeline types for structured SVG generation
 */

export interface StrokeRules {
  strokeOnly: boolean;
  minStrokeWidth: number;
  maxStrokeWidth: number;
  allowFill: boolean;
}

export interface ComponentSize {
  type: string;
  minSize: number;
  maxSize: number;
  aspectRatio?: number;
}

export interface ComponentCount {
  type: string;
  min: number;
  max: number;
  preferred: number;
}

export interface DesignIntent {
  style: {
    palette: string[];
    strokeRules: StrokeRules;
    density: "sparse" | "medium" | "dense";
    symmetry: "none" | "horizontal" | "vertical" | "radial";
  };
  motifs: string[];
  layout: {
    sizes: ComponentSize[];
    counts: ComponentCount[];
    arrangement: "grid" | "organic" | "centered" | "scattered";
  };
  constraints: {
    strokeOnly: boolean;
    maxElements: number;
    requiredMotifs: string[];
  };
}

export interface ComponentPlan {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  style: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  };
  motif?: string;
}

export interface LayoutPlan {
  bounds: { width: number; height: number };
  viewBox: string;
  background?: string;
  arrangement: "grid" | "organic" | "centered" | "scattered";
  spacing: number;
}

export interface CompositionPlan {
  components: ComponentPlan[];
  layout: LayoutPlan;
  zIndex: number[];
}

export interface SVGComponent {
  id: string;
  type: string;
  element: string; // SVG element type (path, circle, etc.)
  attributes: Record<string, string | number>;
  children?: SVGComponent[];
  metadata?: {
    motif?: string;
    generated?: boolean;
    reused?: boolean;
  };
}

export interface DocumentMetadata {
  prompt: string;
  seed?: number;
  palette: string[];
  description: string;
  generatedAt: Date;
  model?: string;
  usedObjects?: string[];
}

export interface AISVGDocument {
  components: SVGComponent[];
  metadata: DocumentMetadata;
  bounds: { width: number; height: number };
  palette: string[];
}

export interface GenerationResponse {
  svg: string;
  metadata: DocumentMetadata;
  layers: SVGComponent[];
  warnings?: string[];
  errors?: string[];
}
