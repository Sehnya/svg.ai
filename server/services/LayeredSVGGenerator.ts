/**
 * LayeredSVGGenerator - Main generator class extending SVGGenerator base class
 * Integrates OpenAI API calls with proper error handling and timeout management
 * Implements JSON response parsing and validation pipeline
 * Adds layout language processing for semantic positioning
 * Includes fallback mechanism to rule-based generator when layered generation fails
 */

import { SVGGenerator } from "./SVGGenerator.js";
import { LLMIntentNormalizer } from "./LLMIntentNormalizer.js";
import { SVGInterpreter } from "./SVGInterpreter.js";
import { JSONSchemaValidator } from "./JSONSchemaValidator.js";
import { RuleBasedGenerator } from "./RuleBasedGenerator.js";
import { RegionManager } from "./RegionManager.js";
import { CoordinateMapper } from "./CoordinateMapper.js";
import { AspectRatioManager } from "./AspectRatioManager.js";
import type {
  GenerationRequest,
  GenerationResponse,
  SVGMetadata,
  LayerInfo,
} from "../types/api.js";
import type {
  UnifiedLayeredSVGDocument,
  AspectRatio,
  UnifiedLayer,
  UnifiedPath,
} from "../types/unified-layered.js";

export interface LayeredGenerationOptions {
  timeout?: number; // API timeout in milliseconds
  maxRetries?: number; // Maximum retry attempts
  fallbackToRuleBased?: boolean; // Whether to fallback to rule-based generator
  enforceCanvasConstraints?: boolean; // Strict 512x512 enforcement
  includeLayoutLanguage?: boolean; // Include layout language in prompts
  includeGeometryExamples?: boolean; // Include geometry examples
  maxLayers?: number; // Maximum number of layers
  maxPathsPerLayer?: number; // Maximum paths per layer
}

export interface LayeredGenerationContext {
  aspectRatio: AspectRatio;
  regionManager: RegionManager;
  coordinateMapper: CoordinateMapper;
  canvasWidth: number;
  canvasHeight: number;
}

export class LayeredSVGGenerator extends SVGGenerator {
  private llmNormalizer: LLMIntentNormalizer;
  private interpreter: SVGInterpreter;
  private validator: JSONSchemaValidator;
  private fallbackGenerator: RuleBasedGenerator;
  private options: Required<LayeredGenerationOptions>;

  constructor(apiKey: string, options: LayeredGenerationOptions = {}) {
    super();

    // Set default options
    this.options = {
      timeout: 30000, // 30 seconds
      maxRetries: 3,
      fallbackToRuleBased: true,
      enforceCanvasConstraints: true,
      includeLayoutLanguage: true,
      includeGeometryExamples: true,
      maxLayers: 10,
      maxPathsPerLayer: 20,
      ...options,
    };

    // Initialize services
    this.llmNormalizer = new LLMIntentNormalizer({
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 4000,
      apiKey,
    });

    this.interpreter = new SVGInterpreter();
    this.validator = new JSONSchemaValidator();
    this.fallbackGenerator = new RuleBasedGenerator();
  }

  /**
   * Main generation method with complete pipeline
   */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.success) {
      return this.createErrorResponse(
        request,
        `Invalid request: ${validation.errors.join(", ")}`
      );
    }

    try {
      // Attempt layered generation with layout language
      return await this.generateLayeredSVG(request);
    } catch (error) {
      console.warn("Layered generation failed:", error);

      if (this.options.fallbackToRuleBased) {
        try {
          console.log("Falling back to rule-based generator");
          return await this.fallbackGenerator.generate(request);
        } catch (fallbackError) {
          console.error("Fallback generation also failed:", fallbackError);
          return this.createErrorResponse(
            request,
            `Both layered and rule-based generation failed: ${error}`
          );
        }
      } else {
        return this.createErrorResponse(
          request,
          `Layered generation failed: ${error}`
        );
      }
    }
  }

  /**
   * Generate SVG using layered approach with layout language
   */
  private async generateLayeredSVG(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    const startTime = Date.now();

    // Determine aspect ratio from request size
    const aspectRatio = this.determineAspectRatio(request.size);

    // Create generation context
    const context = this.createGenerationContext(aspectRatio);

    // Generate unified layered document with retries
    const unifiedDoc = await this.generateUnifiedDocumentWithRetries(
      request,
      context
    );

    // Process layout language specifications
    const processedDoc = await this.processLayoutSpecifications(
      unifiedDoc,
      context
    );

    // Validate the processed document
    const validationResult = this.validator.validateDocument(processedDoc);
    if (!validationResult.success) {
      throw new Error(
        `Generated document validation failed: ${validationResult.errors.join(", ")}`
      );
    }

    // Convert to SVG
    const interpreterResult = this.interpreter.convertToSVG(processedDoc);

    // Create metadata
    const metadata = this.createMetadata(request, processedDoc, startTime);

    // Extract layer information
    const layers = this.extractLayerInfo(processedDoc);

    return {
      svg: interpreterResult.svg,
      meta: metadata,
      layers,
      warnings: [...validationResult.warnings, ...interpreterResult.warnings],
      errors: [],
    };
  }

  /**
   * Generate unified layered document with retry logic
   */
  private async generateUnifiedDocumentWithRetries(
    request: GenerationRequest,
    context: LayeredGenerationContext
  ): Promise<UnifiedLayeredSVGDocument> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        console.log(
          `Layered generation attempt ${attempt}/${this.options.maxRetries}`
        );

        const unifiedRequest = {
          prompt: request.prompt,
          context: {
            defaultPalette: request.palette,
            defaultSize: request.size,
          },
          options: {
            enforceCanvasConstraints: this.options.enforceCanvasConstraints,
            includeLayoutLanguage: this.options.includeLayoutLanguage,
            includeGeometryExamples: this.options.includeGeometryExamples,
            maxLayers: this.options.maxLayers,
            maxPathsPerLayer: this.options.maxPathsPerLayer,
            preferredRegions: ["center", "top_center", "bottom_center"],
          },
        };

        // Generate with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(`Generation timeout after ${this.options.timeout}ms`)
            );
          }, this.options.timeout);
        });

        const generationPromise =
          this.llmNormalizer.generateUnifiedLayeredSVG(unifiedRequest);

        const unifiedDoc = await Promise.race([
          generationPromise,
          timeoutPromise,
        ]);

        // Validate basic structure
        if (
          !unifiedDoc ||
          !unifiedDoc.layers ||
          unifiedDoc.layers.length === 0
        ) {
          throw new Error("Generated document has no layers");
        }

        console.log(
          `Successfully generated unified document with ${unifiedDoc.layers.length} layers`
        );
        return unifiedDoc;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Attempt ${attempt} failed:`, lastError.message);

        // If this is the last attempt, throw the error
        if (attempt === this.options.maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error("All generation attempts failed");
  }

  /**
   * Process layout language specifications in the document
   */
  private async processLayoutSpecifications(
    doc: UnifiedLayeredSVGDocument,
    context: LayeredGenerationContext
  ): Promise<UnifiedLayeredSVGDocument> {
    console.log("Processing layout specifications...");

    // Process each layer
    const processedLayers = await Promise.all(
      doc.layers.map((layer) => this.processLayerLayout(layer, context))
    );

    return {
      ...doc,
      layers: processedLayers,
    };
  }

  /**
   * Process layout specifications for a single layer
   */
  private async processLayerLayout(
    layer: UnifiedLayer,
    context: LayeredGenerationContext
  ): Promise<UnifiedLayer> {
    if (!layer.layout) {
      return layer;
    }

    // Process paths within the layer
    const processedPaths = await Promise.all(
      layer.paths.map((path) => this.processPathLayout(path, layer, context))
    );

    return {
      ...layer,
      paths: processedPaths,
    };
  }

  /**
   * Process layout specifications for a single path
   */
  private async processPathLayout(
    path: UnifiedPath,
    layer: UnifiedLayer,
    context: LayeredGenerationContext
  ): Promise<UnifiedPath> {
    if (!path.layout) {
      return path;
    }

    // Merge path layout with layer layout (path takes precedence)
    const effectiveLayout: LayoutSpecification = {
      region: path.layout.region || layer.layout?.region || "center",
      anchor: path.layout.anchor || layer.layout?.anchor || "center",
      offset: path.layout.offset || layer.layout?.offset || [0, 0],
      size: path.layout.size,
      repeat: path.layout.repeat,
      zIndex: path.layout.zIndex || layer.layout?.zIndex,
    };

    // Apply layout language transformations to path commands
    const transformedCommands = context.coordinateMapper.transformPathCommands(
      path.commands,
      effectiveLayout
    );

    return {
      ...path,
      commands: transformedCommands,
    };
  }

  /**
   * Create generation context for layout processing
   */
  private createGenerationContext(
    aspectRatio: AspectRatio
  ): LayeredGenerationContext {
    const regionManager = new RegionManager(aspectRatio);
    const canvasWidth = 512;
    const canvasHeight = 512;
    const coordinateMapper = new CoordinateMapper(
      canvasWidth,
      canvasHeight,
      regionManager
    );

    return {
      aspectRatio,
      regionManager,
      coordinateMapper,
      canvasWidth,
      canvasHeight,
    };
  }

  /**
   * Determine aspect ratio from request size
   */
  private determineAspectRatio(size: {
    width: number;
    height: number;
  }): AspectRatio {
    const ratio = size.width / size.height;

    if (Math.abs(ratio - 1) < 0.1) return "1:1";
    if (Math.abs(ratio - 4 / 3) < 0.1) return "4:3";
    if (Math.abs(ratio - 16 / 9) < 0.1) return "16:9";
    if (Math.abs(ratio - 3 / 2) < 0.1) return "3:2";
    if (Math.abs(ratio - 2 / 3) < 0.1) return "2:3";
    if (Math.abs(ratio - 9 / 16) < 0.1) return "9:16";

    // Default to 1:1 for unrecognized ratios
    return "1:1";
  }

  /**
   * Create metadata for the generated SVG
   */
  private createMetadata(
    request: GenerationRequest,
    doc: UnifiedLayeredSVGDocument,
    startTime: number
  ): SVGMetadata {
    const viewBox = AspectRatioManager.getViewBox(
      doc.canvas.aspectRatio,
      doc.canvas.width,
      doc.canvas.height
    );

    return {
      width: doc.canvas.width,
      height: doc.canvas.height,
      viewBox,
      backgroundColor: "transparent",
      palette: this.extractPalette(doc),
      description: `Layered SVG generated from: "${request.prompt}"`,
      seed: request.seed || this.generateSeed(),
    };
  }

  /**
   * Extract color palette from the document
   */
  private extractPalette(doc: UnifiedLayeredSVGDocument): string[] {
    const colors = new Set<string>();

    for (const layer of doc.layers) {
      for (const path of layer.paths) {
        if (path.style.fill && path.style.fill !== "none") {
          colors.add(path.style.fill);
        }
        if (path.style.stroke && path.style.stroke !== "none") {
          colors.add(path.style.stroke);
        }
      }
    }

    return Array.from(colors);
  }

  /**
   * Extract layer information for the response
   */
  private extractLayerInfo(doc: UnifiedLayeredSVGDocument): LayerInfo[] {
    return doc.layers.map((layer) => ({
      id: layer.id,
      label: layer.label,
      type: "group" as const,
    }));
  }

  /**
   * Create error response for failed generations
   */
  private createErrorResponse(
    request: GenerationRequest,
    errorMessage: string
  ): GenerationResponse {
    const errorSVG = this.createErrorSVG(request, errorMessage);
    const errorMetadata = this.createErrorMetadata(request);

    return {
      svg: errorSVG,
      meta: errorMetadata,
      layers: [],
      warnings: [],
      errors: [errorMessage],
    };
  }

  /**
   * Create error SVG for failed generations
   */
  private createErrorSVG(
    request: GenerationRequest,
    errorMessage: string
  ): string {
    const { width, height } = request.size;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" fill="#DC2626" font-family="Arial, sans-serif" font-size="14">
    Generation Failed
  </text>
  <text x="${width / 2}" y="${height / 2 + 20}" text-anchor="middle" dominant-baseline="middle" fill="#7F1D1D" font-family="Arial, sans-serif" font-size="10">
    ${errorMessage.length > 50 ? errorMessage.substring(0, 50) + "..." : errorMessage}
  </text>
</svg>`;
  }

  /**
   * Create error metadata for failed generations
   */
  private createErrorMetadata(request: GenerationRequest): SVGMetadata {
    return {
      width: request.size.width,
      height: request.size.height,
      viewBox: `0 0 ${request.size.width} ${request.size.height}`,
      backgroundColor: "#FEF2F2",
      palette: ["#DC2626", "#7F1D1D"],
      description: `Error generating SVG for: "${request.prompt}"`,
      seed: request.seed || this.generateSeed(),
    };
  }

  /**
   * Get generation statistics for monitoring
   */
  getGenerationStats(): {
    timeout: number;
    maxRetries: number;
    fallbackEnabled: boolean;
    constraintsEnabled: boolean;
  } {
    return {
      timeout: this.options.timeout,
      maxRetries: this.options.maxRetries,
      fallbackEnabled: this.options.fallbackToRuleBased,
      constraintsEnabled: this.options.enforceCanvasConstraints,
    };
  }

  /**
   * Update generation options
   */
  updateOptions(newOptions: Partial<LayeredGenerationOptions>): void {
    this.options = {
      ...this.options,
      ...newOptions,
    };
  }
}
