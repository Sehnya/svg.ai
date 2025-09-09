// Size configuration interfaces
export interface SizeConfig {
  preset: "icon" | "banner" | "square" | "custom";
  width: number;
  height: number;
}

// Palette configuration interfaces
export interface PaletteConfig {
  type: "preset" | "custom";
  colors: string[];
  name?: string;
}

// Layer information interface
export interface LayerInfo {
  id: string;
  label: string;
  type: "shape" | "group" | "text" | "path";
}

// SVG metadata interface
export interface SVGMetadata {
  width: number;
  height: number;
  viewBox: string;
  backgroundColor: string;
  palette: string[];
  description: string;
  seed: number;
}

// Generation request interface
export interface GenerationRequest {
  prompt: string;
  size: {
    width: number;
    height: number;
  };
  palette?: string[];
  seed?: number;
  model?: "rule-based" | "llm";
}

// Generation response interface
export interface GenerationResponse {
  svg: string;
  meta: SVGMetadata;
  layers: LayerInfo[];
  warnings: string[];
  errors: string[];
}

// SVG Contract interface for validation
export interface SVGContract {
  xmlns: "http://www.w3.org/2000/svg";
  viewBox: string;
  width: number;
  height: number;
  allowedTags: readonly [
    "svg",
    "g",
    "path",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "ellipse",
  ];
  forbiddenTags: readonly ["script", "foreignObject", "image"];
  forbiddenAttributes: RegExp;
}
