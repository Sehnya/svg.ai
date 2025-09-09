/**
 * GenerationPipeline - Orchestrates the structured SVG generation process
 */
import type {
  DesignIntent,
  CompositionPlan,
  AISVGDocument,
  GenerationResponse,
  DocumentMetadata,
} from "../types/pipeline.js";
import {
  IntentNormalizer,
  type NormalizationContext,
} from "./IntentNormalizer.js";
import { LLMIntentNormalizer } from "./LLMIntentNormalizer.js";
import {
  CompositionPlanner,
  type GroundingData,
  type PlanningContext,
} from "./CompositionPlanner.js";
import { ComponentLibrary } from "./ComponentLibrary.js";
import { SVGSynthesizer } from "./SVGSynthesizer.js";
import { QualityGate } from "./QualityGate.js";
import { SVGRenderer } from "./SVGRenderer.js";

export interface GenerationRequest {
  prompt: string;
  size?: { width: number; height: number };
  palette?: string[];
  seed?: number;
  userId?: string;
  model?: string;
}

export interface PipelineContext {
  temperature: number;
  maxRetries: number;
  fallbackToRuleBased: boolean;
}

export class GenerationPipeline {
  private intentNormalizer: IntentNormalizer;
  private llmNormalizer?: LLMIntentNormalizer;
  private compositionPlanner: CompositionPlanner;
  private componentLibrary: ComponentLibrary;
  private svgSynthesizer: SVGSynthesizer;
  private qualityGate: QualityGate;
  private svgRenderer: SVGRenderer;

  constructor() {
    this.intentNormalizer = new IntentNormalizer();

    // Initialize LLM normalizer if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.llmNormalizer = new LLMIntentNormalizer({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        maxTokens: 1000,
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    this.compositionPlanner = new CompositionPlanner();
    this.componentLibrary = new ComponentLibrary();
    this.svgSynthesizer = new SVGSynthesizer();
    this.qualityGate = new QualityGate();
    this.svgRenderer = new SVGRenderer();
  }

  async process(
    request: GenerationRequest,
    grounding: GroundingData,
    context: PipelineContext = {
      temperature: 0.2,
      maxRetries: 2,
      fallbackToRuleBased: true,
    }
  ): Promise<GenerationResponse> {
    try {
      // Stage 1: Normalize prompt to structured intent
      const intent = await this.normalizeIntent(request, grounding);

      // Stage 2: Plan composition with layout and positioning
      const plan = await this.planComposition(intent, grounding, request);

      // Stage 3: Synthesize SVG document with strict schema
      let document = await this.synthesizeDocument(
        plan,
        intent,
        grounding,
        request
      );

      // Stage 4: Validate and repair (max 2 attempts)
      document = await this.validateAndRepair(
        document,
        intent,
        context.maxRetries
      );

      // Stage 5: Quality gate with heuristic checks
      const qaResult = await this.qualityGate.validate(document, intent);
      if (!qaResult.passed) {
        throw new Error(`QA failed: ${qaResult.issues.join(", ")}`);
      }

      // Stage 6: Render final SVG with component expansion
      const svg = await this.svgRenderer.render(document);

      // Create response
      const response: GenerationResponse = {
        svg,
        metadata: document.metadata,
        layers: document.components,
        warnings: qaResult.warnings,
      };

      return response;
    } catch (error) {
      if (context.fallbackToRuleBased) {
        console.warn(
          "Pipeline failed, falling back to rule-based generation:",
          error
        );
        return this.fallbackGeneration(request);
      }
      throw error;
    }
  }

  private async normalizeIntent(
    request: GenerationRequest,
    grounding: GroundingData
  ): Promise<DesignIntent> {
    const normalizationContext: NormalizationContext = {
      defaultPalette: request.palette,
      defaultSize: request.size,
    };

    // Use LLM normalizer if available, otherwise fall back to rule-based
    if (this.llmNormalizer) {
      try {
        return await this.llmNormalizer.normalize(
          request.prompt,
          normalizationContext,
          grounding
        );
      } catch (error) {
        console.warn(
          "LLM normalization failed, using rule-based fallback:",
          error
        );
      }
    }

    return this.intentNormalizer.normalize(
      request.prompt,
      normalizationContext
    );
  }

  private async planComposition(
    intent: DesignIntent,
    grounding: GroundingData,
    request: GenerationRequest
  ): Promise<CompositionPlan> {
    // Update planner with seed for deterministic generation
    this.compositionPlanner = new CompositionPlanner(request.seed);

    const planningContext: PlanningContext = {
      targetSize: request.size || { width: 400, height: 400 },
      seed: request.seed,
    };

    return this.compositionPlanner.plan(intent, grounding, planningContext);
  }

  private async synthesizeDocument(
    plan: CompositionPlan,
    intent: DesignIntent,
    grounding: GroundingData,
    request: GenerationRequest
  ): Promise<AISVGDocument> {
    // Use the SVGSynthesizer
    const context = {
      prompt: request.prompt,
      seed: request.seed,
      model: request.model || "pipeline-v1",
      userId: request.userId,
    };

    return this.svgSynthesizer.synthesize(plan, grounding, context);
  }

  private async createComponent(
    componentPlan: any,
    intent: DesignIntent,
    grounding: GroundingData
  ) {
    // Try to use component library first
    if (componentPlan.motif) {
      const templates = this.componentLibrary.findTemplates({
        tags: [componentPlan.motif],
        type: componentPlan.type,
      });

      if (templates.length > 0) {
        const template = templates[0];
        return this.componentLibrary.instantiateComponent(
          template.id,
          componentPlan.style,
          componentPlan.position,
          componentPlan.size
        );
      }
    }

    // Fallback to basic component generation
    return this.createBasicComponent(componentPlan);
  }

  private createBasicComponent(componentPlan: any) {
    const { id, type, position, size, style } = componentPlan;

    const attributes: Record<string, string | number> = {};

    // Set common attributes based on type
    switch (type) {
      case "circle":
        attributes.cx = position.x;
        attributes.cy = position.y;
        attributes.r = Math.min(size.width, size.height) / 2;
        break;

      case "rect":
        attributes.x = position.x - size.width / 2;
        attributes.y = position.y - size.height / 2;
        attributes.width = size.width;
        attributes.height = size.height;
        break;

      case "polygon":
        // Create a simple triangle
        const points = [
          `${position.x},${position.y - size.height / 2}`,
          `${position.x - size.width / 2},${position.y + size.height / 2}`,
          `${position.x + size.width / 2},${position.y + size.height / 2}`,
        ].join(" ");
        attributes.points = points;
        break;

      default:
        // Default to circle
        attributes.cx = position.x;
        attributes.cy = position.y;
        attributes.r = Math.min(size.width, size.height) / 2;
        type = "circle";
    }

    // Apply style
    if (style.fill && style.fill !== "none") {
      attributes.fill = style.fill;
    }
    if (style.stroke) {
      attributes.stroke = style.stroke;
    }
    if (style.strokeWidth) {
      attributes["stroke-width"] = style.strokeWidth;
    }
    if (style.opacity) {
      attributes.opacity = style.opacity;
    }

    return {
      id,
      type: componentPlan.motif || type,
      element: type as any,
      attributes,
      metadata: {
        motif: componentPlan.motif,
        generated: true,
        reused: false,
      },
    };
  }

  private async validateAndRepair(
    document: AISVGDocument,
    intent: DesignIntent,
    maxRetries: number
  ): Promise<AISVGDocument> {
    let currentDocument = document;
    let retries = 0;

    while (retries < maxRetries) {
      const validationResult = this.validateDocument(currentDocument, intent);

      if (validationResult.isValid) {
        return currentDocument;
      }

      // Attempt repair
      currentDocument = this.repairDocument(
        currentDocument,
        validationResult.issues
      );
      retries++;
    }

    // If we can't repair, return the best attempt
    return currentDocument;
  }

  private validateDocument(document: AISVGDocument, intent: DesignIntent) {
    const issues: string[] = [];

    // Check component count
    if (document.components.length > intent.constraints.maxElements) {
      issues.push(
        `Too many components: ${document.components.length} > ${intent.constraints.maxElements}`
      );
    }

    // Check required motifs
    const presentMotifs = new Set(
      document.components.map((c) => c.metadata?.motif).filter(Boolean)
    );

    for (const requiredMotif of intent.constraints.requiredMotifs) {
      if (!presentMotifs.has(requiredMotif)) {
        issues.push(`Missing required motif: ${requiredMotif}`);
      }
    }

    // Check stroke rules
    if (intent.constraints.strokeOnly) {
      for (const component of document.components) {
        if (component.attributes.fill && component.attributes.fill !== "none") {
          issues.push(
            `Component ${component.id} has fill but stroke-only is required`
          );
        }
      }
    }

    // Check for invalid numeric values (NaN, Infinity)
    for (const component of document.components) {
      for (const [key, value] of Object.entries(component.attributes)) {
        if (typeof value === "number" && !this.isValidNumber(value)) {
          issues.push(`Component ${component.id} has invalid ${key}: ${value}`);
        }
      }
    }

    // Check stroke width requirements
    for (const component of document.components) {
      const strokeWidth = component.attributes["stroke-width"];
      if (
        typeof strokeWidth === "number" &&
        component.attributes.stroke &&
        strokeWidth < 1
      ) {
        issues.push(
          `Component ${component.id} has stroke-width ${strokeWidth} below minimum of 1`
        );
      }
    }

    // Check decimal precision (max 2 decimal places)
    for (const component of document.components) {
      for (const [key, value] of Object.entries(component.attributes)) {
        if (
          typeof value === "number" &&
          !Number.isInteger(value) &&
          this.isValidNumber(value)
        ) {
          const decimals = value.toString().split(".")[1]?.length || 0;
          if (decimals > 2) {
            issues.push(
              `Component ${component.id} has ${key} with >2 decimal places: ${value}`
            );
          }
        }
      }
    }

    // Check bounds validity
    if (!document.bounds.width || !document.bounds.height) {
      issues.push("Document has invalid bounds");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  private isValidNumber(value: number): boolean {
    return typeof value === "number" && isFinite(value) && !isNaN(value);
  }

  private repairDocument(
    document: AISVGDocument,
    issues: string[]
  ): AISVGDocument {
    let repairedDocument = { ...document };

    for (const issue of issues) {
      if (issue.includes("Too many components")) {
        // Remove excess components (keep the first ones as they're likely most important)
        const maxMatch = issue.match(/> (\d+)/);
        const maxElements = maxMatch ? parseInt(maxMatch[1]) : 10;
        repairedDocument.components = repairedDocument.components.slice(
          0,
          maxElements
        );
      }

      if (issue.includes("stroke-only is required")) {
        // Remove fills from all components
        repairedDocument.components = repairedDocument.components.map(
          (component) => ({
            ...component,
            attributes: {
              ...component.attributes,
              fill: "none",
            },
          })
        );
      }

      if (issue.includes("invalid") && issue.includes("NaN")) {
        // Fix invalid numeric values
        repairedDocument.components = repairedDocument.components.map(
          (component) => {
            const fixedAttributes = { ...component.attributes };
            for (const [key, value] of Object.entries(fixedAttributes)) {
              if (typeof value === "number" && !this.isValidNumber(value)) {
                // Replace with sensible defaults based on attribute type
                if (key.includes("x") || key.includes("y")) {
                  fixedAttributes[key] = 0; // Position defaults to 0
                } else if (key.includes("width") || key.includes("height")) {
                  fixedAttributes[key] = 10; // Size defaults to 10
                } else if (key.includes("r")) {
                  fixedAttributes[key] = 5; // Radius defaults to 5
                } else {
                  fixedAttributes[key] = 1; // Other numeric values default to 1
                }
              }
            }
            return { ...component, attributes: fixedAttributes };
          }
        );
      }

      if (issue.includes("stroke-width") && issue.includes("below minimum")) {
        // Fix stroke width below minimum
        repairedDocument.components = repairedDocument.components.map(
          (component) => {
            if (
              typeof component.attributes["stroke-width"] === "number" &&
              component.attributes["stroke-width"] < 1
            ) {
              return {
                ...component,
                attributes: {
                  ...component.attributes,
                  "stroke-width": 1,
                },
              };
            }
            return component;
          }
        );
      }

      if (issue.includes("decimal places")) {
        // Fix excessive decimal precision
        repairedDocument.components = repairedDocument.components.map(
          (component) => {
            const fixedAttributes = { ...component.attributes };
            for (const [key, value] of Object.entries(fixedAttributes)) {
              if (
                typeof value === "number" &&
                !Number.isInteger(value) &&
                this.isValidNumber(value)
              ) {
                fixedAttributes[key] = Math.round(value * 100) / 100; // Round to 2 decimal places
              }
            }
            return { ...component, attributes: fixedAttributes };
          }
        );
      }

      if (issue.includes("invalid bounds")) {
        // Fix invalid document bounds
        if (
          !repairedDocument.bounds.width ||
          repairedDocument.bounds.width <= 0
        ) {
          repairedDocument.bounds.width = 400; // Default width
        }
        if (
          !repairedDocument.bounds.height ||
          repairedDocument.bounds.height <= 0
        ) {
          repairedDocument.bounds.height = 400; // Default height
        }
      }

      if (issue.includes("Missing required motif")) {
        // Add missing motifs by creating simple components
        const motifMatch = issue.match(/Missing required motif: (.+)/);
        if (motifMatch) {
          const missingMotif = motifMatch[1];
          const newComponent = this.createSimpleMotifComponent(
            missingMotif,
            repairedDocument.bounds
          );
          repairedDocument.components.push(newComponent);
        }
      }
    }

    return repairedDocument;
  }

  private createSimpleMotifComponent(
    motif: string,
    bounds: { width: number; height: number }
  ): any {
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const size = Math.min(bounds.width, bounds.height) / 8;

    // Create a simple component based on motif type
    switch (motif.toLowerCase()) {
      case "circle":
      case "sun":
      case "moon":
        return {
          id: `repair-${motif}-${Date.now()}`,
          type: motif,
          element: "circle",
          attributes: {
            cx: centerX,
            cy: centerY,
            r: size,
            fill: "none",
            stroke: "#333",
            "stroke-width": 1,
          },
          metadata: {
            motif,
            generated: true,
            reused: false,
            repaired: true,
          },
        };

      case "star":
        return {
          id: `repair-${motif}-${Date.now()}`,
          type: motif,
          element: "polygon",
          attributes: {
            points: this.generateStarPoints(centerX, centerY, size),
            fill: "none",
            stroke: "#333",
            "stroke-width": 1,
          },
          metadata: {
            motif,
            generated: true,
            reused: false,
            repaired: true,
          },
        };

      default:
        // Default to a simple rectangle
        return {
          id: `repair-${motif}-${Date.now()}`,
          type: motif,
          element: "rect",
          attributes: {
            x: centerX - size,
            y: centerY - size,
            width: size * 2,
            height: size * 2,
            fill: "none",
            stroke: "#333",
            "stroke-width": 1,
          },
          metadata: {
            motif,
            generated: true,
            reused: false,
            repaired: true,
          },
        };
    }
  }

  private generateStarPoints(
    centerX: number,
    centerY: number,
    size: number
  ): string {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? size : size / 2;
      const x = centerX + Math.cos(angle - Math.PI / 2) * radius;
      const y = centerY + Math.sin(angle - Math.PI / 2) * radius;
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return points.join(" ");
  }

  private async fallbackGeneration(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    // Simple fallback using existing rule-based generator
    // This would integrate with the existing RuleBasedGenerator
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <circle cx="200" cy="200" r="100" fill="#2563eb" stroke="none"/>
      <text x="200" y="350" text-anchor="middle" fill="#666" font-size="12">Fallback: ${request.prompt}</text>
    </svg>`;

    const metadata: DocumentMetadata = {
      prompt: request.prompt,
      seed: request.seed,
      palette: request.palette || ["#2563eb"],
      description: "Fallback generation",
      generatedAt: new Date(),
      model: "fallback",
    };

    return {
      svg,
      metadata,
      layers: [],
      warnings: ["Used fallback generation due to pipeline failure"],
    };
  }
}
