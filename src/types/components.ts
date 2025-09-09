import type { SizeConfig, PaletteConfig, SVGMetadata, LayerInfo } from "./api";

// Component prop interfaces
export interface PromptInputProps {
  modelValue: string;
  maxLength: number;
  placeholder: string;
}

export interface PromptInputEmits {
  "update:modelValue": (value: string) => void;
  submit: () => void;
}

export interface GenerationControlsProps {
  size: SizeConfig;
  palette: PaletteConfig;
  seed: number | null;
  model: string;
}

export interface SVGPreviewProps {
  svgContent: string;
  metadata: SVGMetadata;
  loading: boolean;
  error: string | null;
}

export interface CodeOutputProps {
  svgCode: string;
  metadata: SVGMetadata;
  layers: LayerInfo[];
  warnings: string[];
  errors: string[];
}

// UI state interfaces
export interface AppState {
  prompt: string;
  size: SizeConfig;
  palette: PaletteConfig;
  seed: number | null;
  model: "rule-based" | "llm";
  loading: boolean;
  result: {
    svg: string;
    metadata: SVGMetadata;
    layers: LayerInfo[];
    warnings: string[];
    errors: string[];
  } | null;
  error: string | null;
}
