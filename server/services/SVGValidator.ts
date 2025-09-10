import { JSDOM } from "jsdom";
import type { ValidationResult } from "../types";
import { SVG_CONSTANTS } from "../types";
import { RegionManager } from "./RegionManager";
import { AspectRatioManager, AspectRatio } from "./AspectRatioManager";
import type {
  UnifiedLayeredSVGDocument,
  UnifiedLayer,
  UnifiedPath,
  PathCommand,
  LayoutSpecification,
  RegionName,
  AnchorPoint,
  CoordinateValidationResult,
  LayoutValidationResult,
  UnifiedValidationResult,
  COORDINATE_BOUNDS,
} from "../types/unified-layered";

export interface ValidationFeedback {
  type: "error" | "warning" | "suggestion";
  category: "structure" | "coordinates" | "layout" | "style" | "performance";
  message: string;
  suggestion?: string;
  autoFixable?: boolean;
  location?: {
    layer?: string;
    path?: string;
    command?: number;
  };
}

export interface UnifiedValidationOptions {
  enforceCoordinateBounds?: boolean;
  validateLayoutLanguage?: boolean;
  checkSemanticCorrectness?: boolean;
  enableAutoFix?: boolean;
  strictMode?: boolean;
  maxLayers?: number;
  maxPathsPerLayer?: number;
  maxCommandsPerPath?: number;
}

export interface ValidationReport {
  success: boolean;
  errors: ValidationFeedback[];
  warnings: ValidationFeedback[];
  suggestions: ValidationFeedback[];
  autoFixApplied: boolean;
  fixedDocument?: UnifiedLayeredSVGDocument;
  statistics: {
    totalLayers: number;
    totalPaths: number;
    totalCommands: number;
    coordinateRange: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    };
    regionsUsed: string[];
    anchorsUsed: string[];
  };
}

export class SVGValidator {
  private regionManager: RegionManager;
  private options: Required<UnifiedValidationOptions>;

  constructor(options: UnifiedValidationOptions = {}) {
    this.options = {
      enforceCoordinateBounds: true,
      validateLayoutLanguage: true,
      checkSemanticCorrectness: true,
      enableAutoFix: true,
      strictMode: false,
      maxLayers: 20,
      maxPathsPerLayer: 50,
      maxCommandsPerPath: 100,
      ...options,
    };

    this.regionManager = new RegionManager("1:1"); // Default, will be updated per validation
  }
  validateSVGStructure(svgString: string): ValidationResult {
    const errors: string[] = [];

    try {
      if (!svgString.trim()) {
        errors.push("SVG content is empty");
        return { success: false, errors };
      }

      const dom = new JSDOM(svgString);
      const svgElement = dom.window.document.querySelector("svg");

      if (!svgElement) {
        errors.push("No SVG element found");
        return { success: false, errors };
      }

      // Validate xmlns
      const xmlns = svgElement.getAttribute("xmlns");
      if (!xmlns) {
        errors.push("SVG missing xmlns attribute");
      } else if (xmlns !== "http://www.w3.org/2000/svg") {
        errors.push("SVG has incorrect xmlns attribute");
      }

      // Validate viewBox
      const viewBox = svgElement.getAttribute("viewBox");
      if (!viewBox) {
        errors.push("SVG missing viewBox attribute");
      } else {
        const viewBoxValues = viewBox.split(/\s+/).map(Number);
        if (viewBoxValues.length !== 4 || viewBoxValues.some(isNaN)) {
          errors.push("SVG viewBox has invalid format");
        }
      }

      // Check for forbidden elements
      const forbiddenElements = dom.window.document.querySelectorAll(
        SVG_CONSTANTS.FORBIDDEN_TAGS.join(", ")
      );
      if (forbiddenElements.length > 0) {
        errors.push(
          `SVG contains forbidden elements: ${Array.from(forbiddenElements)
            .map((el) => el.tagName)
            .join(", ")}`
        );
      }

      // Check for forbidden attributes (event handlers)
      const allElements = dom.window.document.querySelectorAll("*");
      allElements.forEach((element) => {
        Array.from(element.attributes).forEach((attr) => {
          if (SVG_CONSTANTS.FORBIDDEN_ATTRIBUTES.test(attr.name)) {
            errors.push(`Element contains forbidden attribute: ${attr.name}`);
          }
        });
      });

      return {
        success: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(
        `SVG parsing error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return { success: false, errors };
    }
  }

  validateSVGContract(svgString: string): ValidationResult {
    const errors: string[] = [];

    try {
      // First check for disallowed elements in the raw string
      SVG_CONSTANTS.FORBIDDEN_TAGS.forEach((tag) => {
        const regex = new RegExp(`<${tag}[^>]*>`, "gi");
        if (regex.test(svgString)) {
          errors.push(`Disallowed element found: ${tag}`);
        }
      });

      // Check for other disallowed HTML elements (use word boundaries to avoid false matches)
      const htmlTags = ["div", "span", "a", "img", "iframe", "object", "embed"];
      htmlTags.forEach((tag) => {
        const regex = new RegExp(`<${tag}\\b[^>]*>`, "gi");
        if (regex.test(svgString)) {
          errors.push(`Disallowed element found: ${tag}`);
        }
      });

      // Special check for 'p' tag to avoid matching 'polygon' or 'polyline'
      const pTagRegex = /<p\b[^>]*>/gi;
      if (pTagRegex.test(svgString)) {
        errors.push(`Disallowed element found: p`);
      }

      const dom = new JSDOM(svgString);
      const svgElement = dom.window.document.querySelector("svg");

      if (!svgElement) {
        errors.push("No SVG element found");
        return { success: false, errors };
      }

      // Validate all elements are allowed (excluding JSDOM-added elements)
      const svgElements = svgElement.querySelectorAll("*");
      svgElements.forEach((element) => {
        const tagName = element.tagName.toLowerCase();
        if (!SVG_CONSTANTS.ALLOWED_TAGS.includes(tagName as any)) {
          errors.push(`Disallowed element found: ${tagName}`);
        }
      });

      // Validate numeric precision
      const numericPattern = /(\d+\.\d{3,})/g;
      if (numericPattern.test(svgString)) {
        errors.push("SVG contains numbers with excessive decimal precision");
      }

      // Validate stroke-width requirements
      const elementsWithStroke =
        dom.window.document.querySelectorAll("[stroke]");
      elementsWithStroke.forEach((element) => {
        const stroke = element.getAttribute("stroke");
        const strokeWidth = element.getAttribute("stroke-width");

        if (
          stroke &&
          stroke !== "none" &&
          (!strokeWidth || parseFloat(strokeWidth) < 1)
        ) {
          errors.push("Elements with stroke must have stroke-width >= 1");
        }
      });

      return {
        success: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(
        `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return { success: false, errors };
    }
  }

  validateDimensions(width: number, height: number): ValidationResult {
    const errors: string[] = [];

    if (!Number.isInteger(width) || width < 16 || width > 2048) {
      errors.push("Width must be an integer between 16 and 2048");
    }

    if (!Number.isInteger(height) || height < 16 || height > 2048) {
      errors.push("Height must be an integer between 16 and 2048");
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  validateColors(colors: string[]): ValidationResult {
    const errors: string[] = [];
    const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;

    colors.forEach((color, index) => {
      if (!hexColorPattern.test(color)) {
        errors.push(`Invalid color format at index ${index}: ${color}`);
      }
    });

    return {
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Comprehensive validation for unified layered SVG documents
   */
  validateUnifiedDocument(doc: UnifiedLayeredSVGDocument): ValidationReport {
    const feedback: ValidationFeedback[] = [];
    let autoFixApplied = false;
    let fixedDocument: UnifiedLayeredSVGDocument | undefined;

    // Update region manager for current document
    this.regionManager.updateAspectRatio(doc.canvas.aspectRatio);

    // Initialize statistics
    const statistics = {
      totalLayers: doc.layers.length,
      totalPaths: 0,
      totalCommands: 0,
      coordinateRange: {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
      },
      regionsUsed: new Set<string>(),
      anchorsUsed: new Set<string>(),
    };

    // Validate document structure
    this.validateDocumentStructure(doc, feedback);

    // Validate canvas configuration
    this.validateCanvas(doc.canvas, feedback);

    // Validate layers
    const layerValidationResult = this.validateLayers(
      doc.layers,
      feedback,
      statistics
    );

    if (this.options.enableAutoFix && layerValidationResult.fixedLayers) {
      fixedDocument = {
        ...doc,
        layers: layerValidationResult.fixedLayers,
      };
      autoFixApplied = true;
    }

    // Validate layout configuration if present
    if (doc.layout) {
      this.validateLayoutConfig(doc.layout, feedback);
    }

    // Finalize statistics
    statistics.totalPaths = doc.layers.reduce(
      (sum, layer) => sum + layer.paths.length,
      0
    );
    statistics.totalCommands = doc.layers.reduce(
      (sum, layer) =>
        sum +
        layer.paths.reduce(
          (pathSum, path) => pathSum + path.commands.length,
          0
        ),
      0
    );

    // Convert sets to arrays for statistics
    const finalStatistics = {
      ...statistics,
      regionsUsed: Array.from(statistics.regionsUsed),
      anchorsUsed: Array.from(statistics.anchorsUsed),
    };

    // Categorize feedback
    const errors = feedback.filter((f) => f.type === "error");
    const warnings = feedback.filter((f) => f.type === "warning");
    const suggestions = feedback.filter((f) => f.type === "suggestion");

    return {
      success: errors.length === 0,
      errors,
      warnings,
      suggestions,
      autoFixApplied,
      fixedDocument,
      statistics: finalStatistics,
    };
  }

  /**
   * Validate document structure and version
   */
  private validateDocumentStructure(
    doc: UnifiedLayeredSVGDocument,
    feedback: ValidationFeedback[]
  ): void {
    if (doc.version !== "unified-layered-1.0") {
      feedback.push({
        type: "error",
        category: "structure",
        message: `Invalid document version: ${doc.version}`,
        suggestion: "Use version 'unified-layered-1.0'",
        autoFixable: true,
      });
    }

    if (!doc.canvas) {
      feedback.push({
        type: "error",
        category: "structure",
        message: "Document missing canvas configuration",
        autoFixable: false,
      });
    }

    if (!doc.layers || doc.layers.length === 0) {
      feedback.push({
        type: "error",
        category: "structure",
        message: "Document must contain at least one layer",
        autoFixable: false,
      });
    }

    if (doc.layers && doc.layers.length > this.options.maxLayers) {
      feedback.push({
        type: this.options.strictMode ? "error" : "warning",
        category: "performance",
        message: `Document has ${doc.layers.length} layers, exceeding recommended maximum of ${this.options.maxLayers}`,
        suggestion: "Consider consolidating layers for better performance",
        autoFixable: false,
      });
    }
  }

  /**
   * Validate canvas configuration
   */
  private validateCanvas(
    canvas: UnifiedLayeredSVGDocument["canvas"],
    feedback: ValidationFeedback[]
  ): void {
    if (canvas.width <= 0 || canvas.height <= 0) {
      feedback.push({
        type: "error",
        category: "structure",
        message: "Canvas dimensions must be positive",
        autoFixable: false,
      });
    }

    if (canvas.width > 2048 || canvas.height > 2048) {
      feedback.push({
        type: "warning",
        category: "performance",
        message: `Large canvas size (${canvas.width}x${canvas.height}) may impact performance`,
        suggestion: "Consider using smaller dimensions for better performance",
        autoFixable: false,
      });
    }

    // Validate aspect ratio consistency
    const actualRatio = canvas.width / canvas.height;
    const expectedDimensions = AspectRatioManager.getCanvasDimensions(
      canvas.aspectRatio
    );
    const expectedRatio = expectedDimensions.width / expectedDimensions.height;

    if (Math.abs(actualRatio - expectedRatio) > 0.01) {
      feedback.push({
        type: "warning",
        category: "structure",
        message: `Canvas dimensions don't match aspect ratio ${canvas.aspectRatio}`,
        suggestion: `Use dimensions ${expectedDimensions.width}x${expectedDimensions.height} for ${canvas.aspectRatio}`,
        autoFixable: true,
      });
    }
  }

  /**
   * Validate all layers in the document
   */
  private validateLayers(
    layers: UnifiedLayer[],
    feedback: ValidationFeedback[],
    statistics: any
  ): { fixedLayers?: UnifiedLayer[] } {
    const fixedLayers: UnifiedLayer[] = [];
    let hasFixableIssues = false;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const layerResult = this.validateLayer(layer, feedback, statistics, i);

      if (layerResult.fixedLayer) {
        fixedLayers.push(layerResult.fixedLayer);
        hasFixableIssues = true;
      } else {
        fixedLayers.push(layer);
      }
    }

    return hasFixableIssues ? { fixedLayers } : {};
  }

  /**
   * Validate a single layer
   */
  private validateLayer(
    layer: UnifiedLayer,
    feedback: ValidationFeedback[],
    statistics: any,
    layerIndex: number
  ): { fixedLayer?: UnifiedLayer } {
    let fixedLayer: UnifiedLayer | undefined;
    const fixedPaths: UnifiedPath[] = [];
    let hasFixableIssues = false;

    // Validate layer structure
    if (!layer.id || layer.id.trim() === "") {
      feedback.push({
        type: "error",
        category: "structure",
        message: `Layer ${layerIndex} missing required id`,
        location: { layer: layer.id || `layer_${layerIndex}` },
        autoFixable: true,
      });

      if (this.options.enableAutoFix) {
        hasFixableIssues = true;
      }
    }

    if (!layer.label || layer.label.trim() === "") {
      feedback.push({
        type: "warning",
        category: "structure",
        message: `Layer ${layer.id || layerIndex} missing descriptive label`,
        location: { layer: layer.id || `layer_${layerIndex}` },
        suggestion: "Add a human-readable label for better organization",
        autoFixable: true,
      });
    }

    if (!layer.paths || layer.paths.length === 0) {
      feedback.push({
        type: "error",
        category: "structure",
        message: `Layer ${layer.id || layerIndex} contains no paths`,
        location: { layer: layer.id || `layer_${layerIndex}` },
        autoFixable: false,
      });
    }

    if (layer.paths && layer.paths.length > this.options.maxPathsPerLayer) {
      feedback.push({
        type: this.options.strictMode ? "error" : "warning",
        category: "performance",
        message: `Layer ${layer.id || layerIndex} has ${layer.paths.length} paths, exceeding recommended maximum of ${this.options.maxPathsPerLayer}`,
        location: { layer: layer.id || `layer_${layerIndex}` },
        suggestion: "Consider splitting into multiple layers",
        autoFixable: false,
      });
    }

    // Validate layer layout
    if (layer.layout) {
      this.validateLayoutSpecification(
        layer.layout,
        feedback,
        statistics,
        layer.id || `layer_${layerIndex}`
      );
    }

    // Validate paths
    if (layer.paths) {
      for (let j = 0; j < layer.paths.length; j++) {
        const path = layer.paths[j];
        const pathResult = this.validatePath(
          path,
          feedback,
          statistics,
          layer.id || `layer_${layerIndex}`,
          j
        );

        if (pathResult.fixedPath) {
          fixedPaths.push(pathResult.fixedPath);
          hasFixableIssues = true;
        } else {
          fixedPaths.push(path);
        }
      }
    }

    if (hasFixableIssues && this.options.enableAutoFix) {
      fixedLayer = {
        ...layer,
        id: layer.id || `layer_${layerIndex}`,
        label: layer.label || `Layer ${layerIndex + 1}`,
        paths: fixedPaths,
      };
    }

    return { fixedLayer };
  }

  /**
   * Validate a single path
   */
  private validatePath(
    path: UnifiedPath,
    feedback: ValidationFeedback[],
    statistics: any,
    layerId: string,
    pathIndex: number
  ): { fixedPath?: UnifiedPath } {
    let fixedPath: UnifiedPath | undefined;
    let hasFixableIssues = false;

    // Validate path structure
    if (!path.id || path.id.trim() === "") {
      feedback.push({
        type: "error",
        category: "structure",
        message: `Path ${pathIndex} in layer ${layerId} missing required id`,
        location: { layer: layerId, path: path.id || `path_${pathIndex}` },
        autoFixable: true,
      });
      hasFixableIssues = true;
    }

    if (!path.commands || path.commands.length === 0) {
      feedback.push({
        type: "error",
        category: "structure",
        message: `Path ${path.id || pathIndex} in layer ${layerId} contains no commands`,
        location: { layer: layerId, path: path.id || `path_${pathIndex}` },
        autoFixable: false,
      });
    }

    if (
      path.commands &&
      path.commands.length > this.options.maxCommandsPerPath
    ) {
      feedback.push({
        type: this.options.strictMode ? "error" : "warning",
        category: "performance",
        message: `Path ${path.id || pathIndex} has ${path.commands.length} commands, exceeding recommended maximum of ${this.options.maxCommandsPerPath}`,
        location: { layer: layerId, path: path.id || `path_${pathIndex}` },
        suggestion:
          "Consider simplifying the path or splitting into multiple paths",
        autoFixable: false,
      });
    }

    // Validate path commands
    const commandValidationResult = this.validatePathCommands(
      path.commands,
      feedback,
      statistics,
      layerId,
      path.id || `path_${pathIndex}`
    );

    // Validate path style
    this.validatePathStyle(
      path.style,
      feedback,
      layerId,
      path.id || `path_${pathIndex}`
    );

    // Validate path layout
    if (path.layout) {
      this.validateLayoutSpecification(
        path.layout,
        feedback,
        statistics,
        layerId,
        path.id || `path_${pathIndex}`
      );
    }

    if (
      (hasFixableIssues || commandValidationResult.fixedCommands) &&
      this.options.enableAutoFix
    ) {
      fixedPath = {
        ...path,
        id: path.id || `path_${pathIndex}`,
        commands: commandValidationResult.fixedCommands || path.commands,
      };
    }

    return { fixedPath };
  }

  /**
   * Validate path commands and coordinates
   */
  private validatePathCommands(
    commands: PathCommand[],
    feedback: ValidationFeedback[],
    statistics: any,
    layerId: string,
    pathId: string
  ): { fixedCommands?: PathCommand[] } {
    const fixedCommands: PathCommand[] = [];
    let hasFixableIssues = false;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      const commandResult = this.validatePathCommand(
        command,
        feedback,
        statistics,
        layerId,
        pathId,
        i
      );

      if (commandResult.fixedCommand) {
        fixedCommands.push(commandResult.fixedCommand);
        hasFixableIssues = true;
      } else {
        fixedCommands.push(command);
      }
    }

    // Validate command sequence
    this.validateCommandSequence(commands, feedback, layerId, pathId);

    return hasFixableIssues ? { fixedCommands } : {};
  }

  /**
   * Validate a single path command
   */
  private validatePathCommand(
    command: PathCommand,
    feedback: ValidationFeedback[],
    statistics: any,
    layerId: string,
    pathId: string,
    commandIndex: number
  ): { fixedCommand?: PathCommand } {
    let fixedCommand: PathCommand | undefined;

    // Validate command type
    const validCommands = ["M", "L", "C", "Q", "Z"];
    if (!validCommands.includes(command.cmd)) {
      feedback.push({
        type: "error",
        category: "structure",
        message: `Invalid path command '${command.cmd}' at index ${commandIndex}`,
        location: { layer: layerId, path: pathId, command: commandIndex },
        suggestion: `Use one of: ${validCommands.join(", ")}`,
        autoFixable: false,
      });
      return {};
    }

    // Validate coordinate count
    const expectedCoordCount = this.getExpectedCoordinateCount(command.cmd);
    if (command.coords.length !== expectedCoordCount) {
      feedback.push({
        type: "error",
        category: "structure",
        message: `Command '${command.cmd}' expects ${expectedCoordCount} coordinates, got ${command.coords.length}`,
        location: { layer: layerId, path: pathId, command: commandIndex },
        autoFixable: false,
      });
      return {};
    }

    // Validate coordinate bounds and precision
    if (this.options.enforceCoordinateBounds && command.cmd !== "Z") {
      const coordResult = this.validateCoordinates(
        command.coords,
        feedback,
        layerId,
        pathId,
        commandIndex
      );

      if (coordResult.clampedCoordinates) {
        fixedCommand = {
          ...command,
          coords: coordResult.clampedCoordinates,
        };
      }

      // Update statistics
      for (let i = 0; i < command.coords.length; i += 2) {
        const x = command.coords[i];
        const y = command.coords[i + 1];

        if (typeof x === "number" && typeof y === "number") {
          statistics.coordinateRange.minX = Math.min(
            statistics.coordinateRange.minX,
            x
          );
          statistics.coordinateRange.maxX = Math.max(
            statistics.coordinateRange.maxX,
            x
          );
          statistics.coordinateRange.minY = Math.min(
            statistics.coordinateRange.minY,
            y
          );
          statistics.coordinateRange.maxY = Math.max(
            statistics.coordinateRange.maxY,
            y
          );
        }
      }
    }

    return { fixedCommand };
  }

  /**
   * Validate coordinate values
   */
  private validateCoordinates(
    coords: number[],
    feedback: ValidationFeedback[],
    layerId: string,
    pathId: string,
    commandIndex: number
  ): CoordinateValidationResult {
    const clampedCoordinates: number[] = [];
    let outOfBounds = false;
    let needsClamping = false;

    for (let i = 0; i < coords.length; i++) {
      const coord = coords[i];

      if (typeof coord !== "number" || isNaN(coord)) {
        feedback.push({
          type: "error",
          category: "coordinates",
          message: `Invalid coordinate value at index ${i}: ${coord}`,
          location: { layer: layerId, path: pathId, command: commandIndex },
          autoFixable: false,
        });
        return { valid: false, outOfBounds: true };
      }

      // Check bounds
      if (coord < COORDINATE_BOUNDS.MIN || coord > COORDINATE_BOUNDS.MAX) {
        outOfBounds = true;
        needsClamping = true;

        feedback.push({
          type: this.options.strictMode ? "error" : "warning",
          category: "coordinates",
          message: `Coordinate ${coord} is outside valid range [${COORDINATE_BOUNDS.MIN}, ${COORDINATE_BOUNDS.MAX}]`,
          location: { layer: layerId, path: pathId, command: commandIndex },
          suggestion: "Coordinates will be clamped to valid range",
          autoFixable: true,
        });
      }

      // Clamp coordinate
      const clampedCoord = Math.max(
        COORDINATE_BOUNDS.MIN,
        Math.min(COORDINATE_BOUNDS.MAX, coord)
      );

      // Round to specified precision
      const roundedCoord =
        Math.round(clampedCoord * Math.pow(10, COORDINATE_BOUNDS.PRECISION)) /
        Math.pow(10, COORDINATE_BOUNDS.PRECISION);

      clampedCoordinates.push(roundedCoord);
    }

    return {
      valid: !outOfBounds || !this.options.strictMode,
      clampedCoordinates: needsClamping ? clampedCoordinates : undefined,
      outOfBounds,
    };
  }

  /**
   * Validate command sequence (e.g., paths should start with M)
   */
  private validateCommandSequence(
    commands: PathCommand[],
    feedback: ValidationFeedback[],
    layerId: string,
    pathId: string
  ): void {
    if (commands.length === 0) return;

    // First command should be M (move)
    if (commands[0].cmd !== "M") {
      feedback.push({
        type: "error",
        category: "structure",
        message: "Path must start with a Move (M) command",
        location: { layer: layerId, path: pathId, command: 0 },
        suggestion: "Add a Move command at the beginning of the path",
        autoFixable: false,
      });
    }

    // Check for orphaned Z commands
    let hasOpenPath = false;
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      if (command.cmd === "M") {
        hasOpenPath = true;
      } else if (command.cmd === "Z") {
        if (!hasOpenPath) {
          feedback.push({
            type: "warning",
            category: "structure",
            message: `Close (Z) command at index ${i} without corresponding Move command`,
            location: { layer: layerId, path: pathId, command: i },
            suggestion: "Ensure Z commands are paired with M commands",
            autoFixable: false,
          });
        }
        hasOpenPath = false;
      }
    }
  }

  /**
   * Validate path style properties
   */
  private validatePathStyle(
    style: UnifiedPath["style"],
    feedback: ValidationFeedback[],
    layerId: string,
    pathId: string
  ): void {
    // Validate colors
    if (style.fill && style.fill !== "none" && !this.isValidColor(style.fill)) {
      feedback.push({
        type: "error",
        category: "style",
        message: `Invalid fill color: ${style.fill}`,
        location: { layer: layerId, path: pathId },
        suggestion: "Use valid hex color format (#RRGGBB)",
        autoFixable: false,
      });
    }

    if (
      style.stroke &&
      style.stroke !== "none" &&
      !this.isValidColor(style.stroke)
    ) {
      feedback.push({
        type: "error",
        category: "style",
        message: `Invalid stroke color: ${style.stroke}`,
        location: { layer: layerId, path: pathId },
        suggestion: "Use valid hex color format (#RRGGBB)",
        autoFixable: false,
      });
    }

    // Validate stroke width
    if (style.strokeWidth !== undefined) {
      if (typeof style.strokeWidth !== "number" || style.strokeWidth < 0) {
        feedback.push({
          type: "error",
          category: "style",
          message: `Invalid stroke width: ${style.strokeWidth}`,
          location: { layer: layerId, path: pathId },
          suggestion: "Stroke width must be a non-negative number",
          autoFixable: false,
        });
      }

      if (style.stroke && style.stroke !== "none" && style.strokeWidth < 1) {
        feedback.push({
          type: "warning",
          category: "style",
          message: "Stroke width less than 1 may not be visible",
          location: { layer: layerId, path: pathId },
          suggestion: "Consider using stroke width >= 1 for better visibility",
          autoFixable: false,
        });
      }
    }

    // Validate opacity
    if (style.opacity !== undefined) {
      if (
        typeof style.opacity !== "number" ||
        style.opacity < 0 ||
        style.opacity > 1
      ) {
        feedback.push({
          type: "error",
          category: "style",
          message: `Invalid opacity: ${style.opacity}`,
          location: { layer: layerId, path: pathId },
          suggestion: "Opacity must be a number between 0 and 1",
          autoFixable: false,
        });
      }
    }

    // Check for invisible paths
    if (
      (!style.fill || style.fill === "none") &&
      (!style.stroke || style.stroke === "none")
    ) {
      feedback.push({
        type: "warning",
        category: "style",
        message: "Path has no fill or stroke and will be invisible",
        location: { layer: layerId, path: pathId },
        suggestion: "Add fill or stroke color to make the path visible",
        autoFixable: false,
      });
    }
  }

  /**
   * Validate layout specification
   */
  private validateLayoutSpecification(
    layout: LayoutSpecification,
    feedback: ValidationFeedback[],
    statistics: any,
    layerId: string,
    pathId?: string
  ): LayoutValidationResult {
    let regionExists = true;
    let anchorValid = true;
    let offsetInRange = true;

    // Validate region
    if (layout.region) {
      if (!this.regionManager.hasRegion(layout.region)) {
        regionExists = false;
        feedback.push({
          type: "error",
          category: "layout",
          message: `Unknown region: ${layout.region}`,
          location: { layer: layerId, path: pathId },
          suggestion: `Use one of: ${this.regionManager.getStandardRegions().join(", ")}`,
          autoFixable: false,
        });
      } else {
        statistics.regionsUsed.add(layout.region);
      }
    }

    // Validate anchor
    if (layout.anchor) {
      const validAnchors = [
        "center",
        "top_left",
        "top_right",
        "bottom_left",
        "bottom_right",
        "top_center",
        "bottom_center",
        "middle_left",
        "middle_right",
      ];
      if (!validAnchors.includes(layout.anchor)) {
        anchorValid = false;
        feedback.push({
          type: "error",
          category: "layout",
          message: `Invalid anchor: ${layout.anchor}`,
          location: { layer: layerId, path: pathId },
          suggestion: `Use one of: ${validAnchors.join(", ")}`,
          autoFixable: false,
        });
      } else {
        statistics.anchorsUsed.add(layout.anchor);
      }
    }

    // Validate offset
    if (layout.offset) {
      if (!Array.isArray(layout.offset) || layout.offset.length !== 2) {
        offsetInRange = false;
        feedback.push({
          type: "error",
          category: "layout",
          message: "Offset must be an array of two numbers",
          location: { layer: layerId, path: pathId },
          suggestion: "Use format: [x, y] where x and y are between -1 and 1",
          autoFixable: false,
        });
      } else {
        const [x, y] = layout.offset;
        if (
          typeof x !== "number" ||
          typeof y !== "number" ||
          x < -1 ||
          x > 1 ||
          y < -1 ||
          y > 1
        ) {
          offsetInRange = false;
          feedback.push({
            type: "error",
            category: "layout",
            message: `Offset values must be between -1 and 1, got [${x}, ${y}]`,
            location: { layer: layerId, path: pathId },
            suggestion: "Use normalized offset values between -1 and 1",
            autoFixable: true,
          });
        }
      }
    }

    // Validate size specification
    if (layout.size) {
      this.validateSizeSpecification(layout.size, feedback, layerId, pathId);
    }

    // Validate repetition specification
    if (layout.repeat) {
      this.validateRepetitionSpecification(
        layout.repeat,
        feedback,
        layerId,
        pathId
      );
    }

    return {
      valid: regionExists && anchorValid && offsetInRange,
      regionExists,
      anchorValid,
      offsetInRange,
    };
  }

  /**
   * Validate layout configuration
   */
  private validateLayoutConfig(
    layout: UnifiedLayeredSVGDocument["layout"],
    feedback: ValidationFeedback[]
  ): void {
    if (layout.regions) {
      for (const region of layout.regions) {
        if (!region.name || region.name.trim() === "") {
          feedback.push({
            type: "error",
            category: "layout",
            message: "Custom region missing name",
            autoFixable: false,
          });
        }

        if (!region.bounds) {
          feedback.push({
            type: "error",
            category: "layout",
            message: `Custom region '${region.name}' missing bounds`,
            autoFixable: false,
          });
        } else {
          const { x, y, width, height } = region.bounds;
          if (
            x < 0 ||
            x > 1 ||
            y < 0 ||
            y > 1 ||
            width <= 0 ||
            width > 1 ||
            height <= 0 ||
            height > 1
          ) {
            feedback.push({
              type: "error",
              category: "layout",
              message: `Custom region '${region.name}' has invalid bounds`,
              suggestion: "Bounds must be normalized values between 0 and 1",
              autoFixable: false,
            });
          }

          if (x + width > 1 || y + height > 1) {
            feedback.push({
              type: "error",
              category: "layout",
              message: `Custom region '${region.name}' extends beyond canvas bounds`,
              suggestion: "Ensure x + width <= 1 and y + height <= 1",
              autoFixable: false,
            });
          }
        }
      }
    }
  }

  /**
   * Helper methods
   */
  private getExpectedCoordinateCount(cmd: string): number {
    switch (cmd) {
      case "M":
      case "L":
        return 2;
      case "Q":
        return 4;
      case "C":
        return 6;
      case "Z":
        return 0;
      default:
        return 0;
    }
  }

  private isValidColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  }

  private validateSizeSpecification(
    size: LayoutSpecification["size"],
    feedback: ValidationFeedback[],
    layerId: string,
    pathId?: string
  ): void {
    if (!size) return;

    const definedSpecs = [
      size.absolute,
      size.relative,
      size.aspect_constrained,
    ].filter(Boolean);
    if (definedSpecs.length !== 1) {
      feedback.push({
        type: "error",
        category: "layout",
        message: "Exactly one size specification method must be provided",
        location: { layer: layerId, path: pathId },
        suggestion:
          "Use either absolute, relative, or aspect_constrained sizing",
        autoFixable: false,
      });
    }

    if (size.relative !== undefined) {
      if (
        typeof size.relative !== "number" ||
        size.relative <= 0 ||
        size.relative > 1
      ) {
        feedback.push({
          type: "error",
          category: "layout",
          message: `Relative size must be between 0 and 1, got ${size.relative}`,
          location: { layer: layerId, path: pathId },
          autoFixable: false,
        });
      }
    }

    if (size.absolute) {
      if (size.absolute.width <= 0 || size.absolute.height <= 0) {
        feedback.push({
          type: "error",
          category: "layout",
          message: "Absolute size dimensions must be positive",
          location: { layer: layerId, path: pathId },
          autoFixable: false,
        });
      }
    }

    if (size.aspect_constrained) {
      if (
        size.aspect_constrained.width <= 0 ||
        size.aspect_constrained.aspect <= 0
      ) {
        feedback.push({
          type: "error",
          category: "layout",
          message: "Aspect constrained size values must be positive",
          location: { layer: layerId, path: pathId },
          autoFixable: false,
        });
      }
    }
  }

  private validateRepetitionSpecification(
    repeat: LayoutSpecification["repeat"],
    feedback: ValidationFeedback[],
    layerId: string,
    pathId?: string
  ): void {
    if (!repeat) return;

    if (!["grid", "radial"].includes(repeat.type)) {
      feedback.push({
        type: "error",
        category: "layout",
        message: `Invalid repetition type: ${repeat.type}`,
        location: { layer: layerId, path: pathId },
        suggestion: "Use 'grid' or 'radial'",
        autoFixable: false,
      });
    }

    if (Array.isArray(repeat.count)) {
      if (
        repeat.count.length !== 2 ||
        repeat.count.some((c) => !Number.isInteger(c) || c <= 0)
      ) {
        feedback.push({
          type: "error",
          category: "layout",
          message: "Grid count must be an array of two positive integers",
          location: { layer: layerId, path: pathId },
          autoFixable: false,
        });
      }
    } else {
      if (!Number.isInteger(repeat.count) || repeat.count <= 0) {
        feedback.push({
          type: "error",
          category: "layout",
          message: "Repetition count must be a positive integer",
          location: { layer: layerId, path: pathId },
          autoFixable: false,
        });
      }
    }

    if (
      repeat.spacing !== undefined &&
      (typeof repeat.spacing !== "number" || repeat.spacing <= 0)
    ) {
      feedback.push({
        type: "error",
        category: "layout",
        message: "Repetition spacing must be a positive number",
        location: { layer: layerId, path: pathId },
        autoFixable: false,
      });
    }

    if (
      repeat.radius !== undefined &&
      (typeof repeat.radius !== "number" || repeat.radius <= 0)
    ) {
      feedback.push({
        type: "error",
        category: "layout",
        message: "Radial repetition radius must be a positive number",
        location: { layer: layerId, path: pathId },
        autoFixable: false,
      });
    }
  }

  /**
   * Generate feedback for model correction
   */
  generateModelFeedback(report: ValidationReport): string[] {
    const feedback: string[] = [];

    // Prioritize critical errors
    const criticalErrors = report.errors.filter(
      (e) => e.category === "structure" || e.category === "coordinates"
    );

    if (criticalErrors.length > 0) {
      feedback.push("Critical issues found:");
      criticalErrors.forEach((error) => {
        feedback.push(`- ${error.message}`);
        if (error.suggestion) {
          feedback.push(`  Suggestion: ${error.suggestion}`);
        }
      });
    }

    // Add layout-specific feedback
    const layoutErrors = report.errors.filter((e) => e.category === "layout");
    if (layoutErrors.length > 0) {
      feedback.push("Layout language issues:");
      layoutErrors.forEach((error) => {
        feedback.push(`- ${error.message}`);
        if (error.suggestion) {
          feedback.push(`  Suggestion: ${error.suggestion}`);
        }
      });
    }

    // Add performance suggestions
    const performanceWarnings = report.warnings.filter(
      (w) => w.category === "performance"
    );
    if (performanceWarnings.length > 0) {
      feedback.push("Performance recommendations:");
      performanceWarnings.forEach((warning) => {
        feedback.push(`- ${warning.message}`);
        if (warning.suggestion) {
          feedback.push(`  Suggestion: ${warning.suggestion}`);
        }
      });
    }

    return feedback;
  }

  /**
   * Update validation options
   */
  updateOptions(newOptions: Partial<UnifiedValidationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current validation options
   */
  getOptions(): Required<UnifiedValidationOptions> {
    return { ...this.options };
  }
}
