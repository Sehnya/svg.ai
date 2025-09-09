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

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  private repairDocument(
    document: AISVGDocument,
    issues: string[]
  ): AISVGDocument {
    let repairedDocument = { ...document };

    for (const issue of issues) {
      if (issue.includes("Too many components")) {
        // Remove excess components
        const maxElements = parseInt(issue.match(/\d+/)?.[0] || "10");
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
    }

    return repairedDocument;
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
