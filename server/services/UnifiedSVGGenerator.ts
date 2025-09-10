/**
 * UnifiedSVGGenerator - Main generator class that orchestrates the unified SVG generation pipeline
 * Combines layout language and layered generation for consistent, high-quality SVG output
 */

import OpenAI from "openai";
import { UnifiedPromptBuilder } from "./UnifiedPromptBuilder";
import { UnifiedInterpreter } from "./UnifiedInterpreter";
import { JSONSchemaValidator } from "./JSONSchemaValidator";
import { UnifiedErrorHandler } from "./UnifiedErrorHandler";
import { RegionManager } from "./RegionManager";
import { CoordinateMapper } from "./CoordinateMapper";
import { LayerManager } from "./LayerManager";
import { DebugVisualizationSystem } from "./DebugVisualizationSystem";
import { RuleBasedGenerator } from "./RuleBasedGenerator";
import { SVGGenerator } from "./SVGGenerator";
import { LayoutLanguageParser } from "./LayoutLanguageParser";
import {
  UnifiedLayeredSVGDocument,
  GenerationRequest,
  GenerationResponse,
} from "../types/unified-layered";
import { AspectRatioManager, AspectRatio } from "./AspectRatioManager";
import { ViewportDebugger } from "../utils/viewportDebugger";

export interface UnifiedGenerationOptions {
  enableDebug?: boolean;
  enableFallback?: boolean;
  maxRetries?: number;
  timeout?: number;
  cacheResults?: boolean;
}

export class UnifiedSVGGenerator extends SVGGenerator {
  private openaiClient: OpenAI;
  private promptBuilder: UnifiedPromptBuilder;
  private interpreter: UnifiedInterpreter;
  private validator: JSONSchemaValidator;
  private errorHandler: UnifiedErrorHandler;
  private regionManager: RegionManager;
  private coordinateMapper: CoordinateMapper;
  private layerManager: LayerManager;
  private debugSystem?: DebugVisualizationSystem;
  private ruleBasedFallback: RuleBasedGenerator;
  private options: UnifiedGenerationOptions;

  constructor(
    openaiClient: OpenAI,
    promptBuilder?: UnifiedPromptBuilder,
    interpreter?: UnifiedInterpreter,
    validator?: JSONSchemaValidator,
    errorHandler?: UnifiedErrorHandler,
    regionManager?: RegionManager,
    coordinateMapper?: CoordinateMapper,
    layerManager?: LayerManager,
    options: UnifiedGenerationOptions = {}
  ) {
    super();
    this.openaiClient = openaiClient;

    // Initialize with defaults if not provided
    const aspectRatio: AspectRatio = "1:1";
    this.regionManager = regionManager || new RegionManager(aspectRatio);
    this.coordinateMapper =
      coordinateMapper || new CoordinateMapper(512, 512, this.regionManager);
    this.layerManager =
      layerManager ||
      new LayerManager(this.regionManager, this.coordinateMapper);

    this.promptBuilder = promptBuilder || new UnifiedPromptBuilder();
    this.interpreter = interpreter || new UnifiedInterpreter(aspectRatio);
    this.validator =
      validator ||
      new JSONSchemaValidator(
        this.regionManager,
        new LayoutLanguageParser(this.regionManager)
      );
    this.errorHandler = errorHandler || new UnifiedErrorHandler();
    this.ruleBasedFallback = new RuleBasedGenerator();

    this.options = {
      enableDebug: false,
      enableFallback: true,
      maxRetries: 3,
      timeout: 30000,
      cacheResults: true,
      ...options,
    };

    if (this.options.enableDebug || options.enableDebug) {
      this.debugSystem = new DebugVisualizationSystem(
        this.regionManager,
        this.coordinateMapper,
        this.layerManager
      );
    }
  }

  /**
   * Generate SVG using the unified layered approach
   */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = performance.now();

    try {
      // Handle different generation methods
      if (request.model === "rule-based") {
        return await this.generateWithRuleBased(request);
      }

      // Check feature flags
      if (request.features?.unifiedGeneration === false) {
        return await this.generateWithFallback(request, "Feature disabled");
      }

      // A/B testing support
      if (request.abTestGroup === "traditional") {
        return await this.generateWithFallback(request, "A/B test group");
      }

      // Try unified generation
      const result = await this.generateUnified(request);

      if (result.success) {
        return result;
      }

      // Fallback if enabled
      if (this.options.enableFallback) {
        return await this.generateWithFallback(
          request,
          "Unified generation failed"
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Unified generation error:", error);

      if (this.options.enableFallback) {
        return await this.generateWithFallback(
          request,
          `Error: ${errorMessage}`
        );
      }

      return {
        success: false,
        error: errorMessage,
        svg: "",
        metadata: {
          generationMethod: "unified-layered",
          fallbackUsed: false,
          errors: [errorMessage],
          performance: {
            generationTime: performance.now() - startTime,
          },
        },
      };
    }
  }

  /**
   * Generate using the unified layered approach
   */
  private async generateUnified(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    const startTime = performance.now();
    let retries = 0;

    while (retries < this.options.maxRetries!) {
      try {
        // 1. Build unified prompt
        const prompt = this.promptBuilder.buildUnifiedPrompt(request);

        // 2. Call OpenAI API with timeout
        const apiStartTime = performance.now();
        const response = (await Promise.race([
          this.openaiClient.chat.completions.create(prompt),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("API timeout")),
              this.options.timeout
            )
          ),
        ])) as OpenAI.Chat.Completions.ChatCompletion;
        const apiEndTime = performance.now();

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No content in OpenAI response");
        }

        // 3. Parse and validate JSON response
        let unifiedDoc: UnifiedLayeredSVGDocument;
        try {
          unifiedDoc = JSON.parse(content);
        } catch (parseError) {
          const parseErrorMessage =
            parseError instanceof Error
              ? parseError.message
              : String(parseError);
          throw new Error(`JSON parsing failed: ${parseErrorMessage}`);
        }

        // 4. Validate against schema
        const validationResult = this.validator.validateDocument(unifiedDoc);
        if (!validationResult.success) {
          // For now, we'll just throw an error since repairDocument doesn't exist yet
          throw new Error(
            `Validation failed: ${validationResult.errors.join(", ")}`
          );
        } else {
          unifiedDoc = validationResult.data!;
        }

        // 5. Process layout specifications
        const processedDoc = await this.processLayoutSpecifications(unifiedDoc);

        // 6. Auto-fit paths to prevent clipping and convert to SVG
        const fittedDoc = this.autoFitDocumentPaths(processedDoc);
        const svg = this.interpreter.convertToSVG(fittedDoc);

        // 7. Generate debug information if requested
        let debugInfo;
        if (request.debug && this.debugSystem) {
          debugInfo = this.debugSystem.generateDebugVisualization(processedDoc);
        }

        // 8. Calculate layout quality
        const layoutQuality = this.calculateLayoutQuality(processedDoc);

        const endTime = performance.now();

        return {
          success: true,
          svg,
          metadata: {
            generationMethod: "unified-layered",
            layers: this.layerManager.generateLayerMetadata(processedDoc),
            layout: this.getLayoutMetadata(processedDoc),
            layoutQuality,
            coordinatesRepaired: validationResult.sanitized || false,
            fallbackUsed: false,
            environment: request.environment,
            performance: {
              generationTime: endTime - startTime,
              apiTime: apiEndTime - apiStartTime,
              processingTime: endTime - apiEndTime,
            },
          },
          debug: debugInfo,
        };
      } catch (error) {
        retries++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(
          `Unified generation attempt ${retries} failed:`,
          errorMessage
        );

        if (retries >= this.options.maxRetries!) {
          throw error;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
      }
    }

    throw new Error("Max retries exceeded");
  }

  /**
   * Generate using rule-based fallback
   */
  private async generateWithRuleBased(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    const startTime = performance.now();

    try {
      // Convert unified request to api request format
      const apiRequest = {
        ...request,
        size: {
          width: this.getCanvasDimensions(request.aspectRatio).width,
          height: this.getCanvasDimensions(request.aspectRatio).height,
        },
      };
      const result = await this.ruleBasedFallback.generate(apiRequest);

      return {
        success: true,
        svg: result.svg,
        metadata: {
          generationMethod: "rule-based",
          fallbackUsed: false,
          performance: {
            generationTime: performance.now() - startTime,
          },
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
        svg: "",
        metadata: {
          generationMethod: "rule-based",
          fallbackUsed: false,
          errors: [errorMessage],
          performance: {
            generationTime: performance.now() - startTime,
          },
        },
      };
    }
  }

  /**
   * Generate using fallback chain
   */
  private async generateWithFallback(
    request: GenerationRequest,
    reason: string
  ): Promise<GenerationResponse> {
    const startTime = performance.now();

    try {
      // Try rule-based generator first
      // Convert unified request to api request format
      const apiRequest = {
        ...request,
        size: {
          width: this.getCanvasDimensions(request.aspectRatio).width,
          height: this.getCanvasDimensions(request.aspectRatio).height,
        },
      };
      const result = await this.ruleBasedFallback.generate(apiRequest);

      return {
        success: true,
        svg: result.svg,
        metadata: {
          generationMethod: "rule-based-fallback",
          fallbackUsed: true,
          fallbackReason: reason,
          performance: {
            generationTime: performance.now() - startTime,
          },
        },
      };
    } catch (error) {
      // Final fallback: basic geometric shape
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const basicSvg = this.generateBasicShape(request);

      return {
        success: true,
        svg: basicSvg,
        metadata: {
          generationMethod: "basic-geometric",
          fallbackUsed: true,
          fallbackReason: `${reason}, rule-based also failed: ${errorMessage}`,
          performance: {
            generationTime: performance.now() - startTime,
          },
        },
      };
    }
  }

  /**
   * Process layout specifications in the document
   */
  private async processLayoutSpecifications(
    doc: UnifiedLayeredSVGDocument
  ): Promise<UnifiedLayeredSVGDocument> {
    // Update managers for current document
    this.updateManagersForDocument(doc);

    // Process layout specifications at document, layer, and path levels
    const processedLayers = await Promise.all(
      doc.layers.map((layer) => this.processLayerLayout(layer, doc.canvas))
    );

    return {
      ...doc,
      layers: processedLayers,
    };
  }

  /**
   * Update managers for the current document
   */
  private updateManagersForDocument(doc: UnifiedLayeredSVGDocument): void {
    // Update region manager for current aspect ratio
    this.regionManager = new RegionManager(doc.canvas.aspectRatio);
    this.coordinateMapper = new CoordinateMapper(
      doc.canvas.width,
      doc.canvas.height,
      this.regionManager
    );

    // Add custom regions if defined
    if (doc.layout?.regions) {
      for (const region of doc.layout.regions) {
        this.regionManager.addCustomRegion(region.name, region.bounds);
      }
    }

    // Update interpreter for current aspect ratio
    this.interpreter = new UnifiedInterpreter(doc.canvas.aspectRatio);
  }

  /**
   * Process layout for a single layer
   */
  private async processLayerLayout(
    layer: any,
    canvas: { width: number; height: number; aspectRatio: AspectRatio }
  ): Promise<any> {
    if (!layer.layout) return layer;

    // Process paths within the layer
    const processedPaths = await Promise.all(
      layer.paths.map((path: any) =>
        this.processPathLayout(path, layer, canvas)
      )
    );

    return {
      ...layer,
      paths: processedPaths,
    };
  }

  /**
   * Process layout for a single path
   */
  private async processPathLayout(
    path: any,
    layer: any,
    canvas: { width: number; height: number; aspectRatio: AspectRatio }
  ): Promise<any> {
    if (!path.layout) return path;

    // Apply layout language transformations to path commands
    // For now, return the commands as-is since transformPathCommands doesn't exist yet
    const transformedCommands = path.commands;

    return {
      ...path,
      commands: transformedCommands,
    };
  }

  /**
   * Get layout metadata for the response
   */
  private getLayoutMetadata(doc: UnifiedLayeredSVGDocument): any {
    const usedRegions = new Set<string>();
    const usedAnchors = new Set<string>();

    doc.layers.forEach((layer) => {
      if (layer.layout?.region) {
        usedRegions.add(layer.layout.region);
      }
      if (layer.layout?.anchor) {
        usedAnchors.add(layer.layout.anchor);
      }

      layer.paths.forEach((path) => {
        if (path.layout?.region) {
          usedRegions.add(path.layout.region);
        }
        if (path.layout?.anchor) {
          usedAnchors.add(path.layout.anchor);
        }
      });
    });

    return {
      regionsUsed: Array.from(usedRegions),
      anchorsUsed: Array.from(usedAnchors),
      aspectRatio: doc.canvas.aspectRatio,
      canvasDimensions: {
        width: doc.canvas.width,
        height: doc.canvas.height,
      },
    };
  }

  /**
   * Calculate layout quality score
   */
  private calculateLayoutQuality(doc: UnifiedLayeredSVGDocument): number {
    let score = 100;

    // Deduct points for issues
    doc.layers.forEach((layer) => {
      layer.paths.forEach((path) => {
        path.commands.forEach((command) => {
          if (command.cmd !== "Z") {
            for (let i = 0; i < command.coords.length; i += 2) {
              const x = command.coords[i];
              const y = command.coords[i + 1];

              // Deduct points for coordinates near edges (less than 10px margin)
              if (
                x < 10 ||
                x > doc.canvas.width - 10 ||
                y < 10 ||
                y > doc.canvas.height - 10
              ) {
                score -= 2;
              }

              // Deduct points for out-of-bounds coordinates
              if (
                x < 0 ||
                x > doc.canvas.width ||
                y < 0 ||
                y > doc.canvas.height
              ) {
                score -= 10;
              }
            }
          }
        });
      });
    });

    // Bonus points for good practices
    if (doc.layers.length > 1 && doc.layers.length <= 10) {
      score += 5; // Good layer organization
    }

    const usedRegions = new Set<string>();
    doc.layers.forEach((layer) => {
      if (layer.layout?.region) usedRegions.add(layer.layout.region);
      layer.paths.forEach((path) => {
        if (path.layout?.region) usedRegions.add(path.layout.region);
      });
    });

    if (usedRegions.size > 1) {
      score += 10; // Good use of semantic regions
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Auto-fit document paths to prevent clipping
   */
  private autoFitDocumentPaths(
    doc: UnifiedLayeredSVGDocument
  ): UnifiedLayeredSVGDocument {
    // Collect all path commands from all layers
    const allCommands: any[] = [];
    doc.layers.forEach((layer) => {
      layer.paths.forEach((path) => {
        allCommands.push(...path.commands);
      });
    });

    if (allCommands.length === 0) {
      return doc;
    }

    // Use viewport debugger to fix viewport issues
    const currentViewBox =
      doc.canvas.viewBox || `0 0 ${doc.canvas.width} ${doc.canvas.height}`;
    const viewportFix = ViewportDebugger.fixViewportIssues(
      allCommands,
      doc.canvas.width,
      doc.canvas.height,
      0.15 // 15% padding
    );

    // Update the document's canvas viewBox
    const updatedDoc = {
      ...doc,
      canvas: {
        ...doc.canvas,
        viewBox: viewportFix.newViewBox,
      },
      layers: doc.layers.map((layer) => ({
        ...layer,
        paths: layer.paths.map((path, pathIndex) => {
          // Apply fixed commands if they were transformed
          const startIndex =
            doc.layers
              .slice(0, doc.layers.indexOf(layer))
              .reduce((sum, l) => sum + l.paths.length, 0) + pathIndex;

          if (viewportFix.fixedCommands !== allCommands) {
            const pathCommandCount = path.commands.length;
            const pathStartIndex = allCommands.slice(
              0,
              startIndex * pathCommandCount
            ).length;

            return {
              ...path,
              commands: viewportFix.fixedCommands.slice(
                pathStartIndex,
                pathStartIndex + pathCommandCount
              ),
            };
          }

          return path;
        }),
      })),
    };

    return updatedDoc;
  }

  /**
   * Generate a basic geometric shape as final fallback
   */
  private generateBasicShape(request: GenerationRequest): string {
    const { width, height } = this.getCanvasDimensions(request.aspectRatio);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="#3B82F6" stroke="#1E40AF" stroke-width="2"/>
</svg>`;
  }

  /**
   * Get canvas dimensions for aspect ratio
   */
  private getCanvasDimensions(aspectRatio: AspectRatio): {
    width: number;
    height: number;
  } {
    return AspectRatioManager.getCanvasDimensions(aspectRatio);
  }
}
