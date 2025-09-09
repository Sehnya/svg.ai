/**
 * QualityGate - Validates SVG documents with heuristic checks
 */
import type { AISVGDocument, DesignIntent } from "../types/pipeline.js";

export interface QualityResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
  score: number; // 0-100 quality score
}

export interface QualityMetrics {
  structuralIntegrity: number;
  motifCompliance: number;
  styleConsistency: number;
  technicalQuality: number;
}

export class QualityGate {
  private readonly PASS_THRESHOLD = 70; // Minimum score to pass

  async validate(
    document: AISVGDocument,
    intent: DesignIntent
  ): Promise<QualityResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Run all quality checks
    const structuralResult = this.checkStructuralIntegrity(document, intent);
    const motifResult = this.checkMotifCompliance(document, intent);
    const styleResult = this.checkStyleConsistency(document, intent);
    const technicalResult = this.checkTechnicalQuality(document, intent);

    // Collect issues and warnings
    issues.push(...structuralResult.issues);
    issues.push(...motifResult.issues);
    issues.push(...styleResult.issues);
    issues.push(...technicalResult.issues);

    warnings.push(...structuralResult.warnings);
    warnings.push(...motifResult.warnings);
    warnings.push(...styleResult.warnings);
    warnings.push(...technicalResult.warnings);

    // Calculate overall quality score
    const metrics: QualityMetrics = {
      structuralIntegrity: structuralResult.score,
      motifCompliance: motifResult.score,
      styleConsistency: styleResult.score,
      technicalQuality: technicalResult.score,
    };

    const score = this.calculateOverallScore(metrics);
    const passed = score >= this.PASS_THRESHOLD && issues.length === 0;

    return {
      passed,
      issues,
      warnings,
      score,
    };
  }

  private checkStructuralIntegrity(
    document: AISVGDocument,
    intent: DesignIntent
  ) {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check component count constraints
    if (document.components.length > intent.constraints.maxElements) {
      issues.push(
        `Too many components: ${document.components.length} > ${intent.constraints.maxElements}`
      );
      score -= 30;
    }

    if (document.components.length === 0) {
      issues.push("Document has no components");
      score = 0;
    }

    // Check bounds validity
    if (!document.bounds.width || !document.bounds.height) {
      issues.push("Invalid document bounds");
      score -= 20;
    }

    if (document.bounds.width < 16 || document.bounds.height < 16) {
      warnings.push("Document bounds are very small");
      score -= 5;
    }

    if (document.bounds.width > 2048 || document.bounds.height > 2048) {
      warnings.push("Document bounds are very large");
      score -= 5;
    }

    // Check component positioning
    let componentsOutOfBounds = 0;
    for (const component of document.components) {
      if (this.isComponentOutOfBounds(component, document.bounds)) {
        componentsOutOfBounds++;
      }
    }

    if (componentsOutOfBounds > 0) {
      const ratio = componentsOutOfBounds / document.components.length;
      if (ratio > 0.5) {
        issues.push(`${componentsOutOfBounds} components are out of bounds`);
        score -= 25;
      } else {
        warnings.push(
          `${componentsOutOfBounds} components are partially out of bounds`
        );
        score -= 10;
      }
    }

    return { issues, warnings, score: Math.max(0, score) };
  }

  private checkMotifCompliance(document: AISVGDocument, intent: DesignIntent) {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check required motifs
    const presentMotifs = new Set(
      document.components.map((c) => c.metadata?.motif).filter(Boolean)
    );

    const missingMotifs = intent.constraints.requiredMotifs.filter(
      (motif) => !presentMotifs.has(motif)
    );

    if (missingMotifs.length > 0) {
      issues.push(`Missing required motifs: ${missingMotifs.join(", ")}`);
      score -= missingMotifs.length * 20;
    }

    // Check motif distribution
    const motifCounts = new Map<string, number>();
    document.components.forEach((comp) => {
      const motif = comp.metadata?.motif;
      if (motif) {
        motifCounts.set(motif, (motifCounts.get(motif) || 0) + 1);
      }
    });

    // Warn about motif imbalance
    if (motifCounts.size > 1) {
      const counts = Array.from(motifCounts.values());
      const max = Math.max(...counts);
      const min = Math.min(...counts);

      if (max / min > 3) {
        warnings.push("Motif distribution is imbalanced");
        score -= 10;
      }
    }

    // Check for unexpected motifs
    const allowedMotifs = new Set([
      ...intent.motifs,
      ...intent.constraints.requiredMotifs,
    ]);
    const unexpectedMotifs = Array.from(presentMotifs).filter(
      (motif) => !allowedMotifs.has(motif!)
    );

    if (unexpectedMotifs.length > 0) {
      warnings.push(
        `Unexpected motifs present: ${unexpectedMotifs.join(", ")}`
      );
      score -= 5;
    }

    return { issues, warnings, score: Math.max(0, score) };
  }

  private checkStyleConsistency(document: AISVGDocument, intent: DesignIntent) {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check stroke-only compliance
    if (intent.constraints.strokeOnly) {
      const componentsWithFill = document.components.filter(
        (comp) => comp.attributes.fill && comp.attributes.fill !== "none"
      );

      if (componentsWithFill.length > 0) {
        issues.push(
          `${componentsWithFill.length} components have fill but stroke-only is required`
        );
        score -= componentsWithFill.length * 15;
      }
    }

    // Check stroke width consistency
    const strokeWidths = document.components
      .map((comp) => comp.attributes["stroke-width"])
      .filter((width) => typeof width === "number") as number[];

    if (strokeWidths.length > 0) {
      const minStroke = Math.min(...strokeWidths);
      const maxStroke = Math.max(...strokeWidths);

      // Check minimum stroke width requirement
      if (minStroke < 1) {
        issues.push(`Stroke width ${minStroke} is below minimum of 1`);
        score -= 20;
      }

      // Check stroke width consistency
      if (maxStroke / minStroke > 4) {
        warnings.push("Stroke widths vary significantly");
        score -= 5;
      }
    }

    // Check color palette compliance
    const usedColors = new Set<string>();
    document.components.forEach((comp) => {
      if (comp.attributes.fill && comp.attributes.fill !== "none") {
        usedColors.add(comp.attributes.fill as string);
      }
      if (comp.attributes.stroke) {
        usedColors.add(comp.attributes.stroke as string);
      }
    });

    const paletteColors = new Set(document.palette);
    const unauthorizedColors = Array.from(usedColors).filter(
      (color) => !paletteColors.has(color)
    );

    if (unauthorizedColors.length > 0) {
      warnings.push(
        `Colors used outside palette: ${unauthorizedColors.join(", ")}`
      );
      score -= unauthorizedColors.length * 5;
    }

    return { issues, warnings, score: Math.max(0, score) };
  }

  private checkTechnicalQuality(document: AISVGDocument, intent: DesignIntent) {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check decimal precision
    let highPrecisionCount = 0;
    document.components.forEach((comp) => {
      Object.entries(comp.attributes).forEach(([key, value]) => {
        if (typeof value === "number" && !Number.isInteger(value)) {
          const decimals = value.toString().split(".")[1]?.length || 0;
          if (decimals > 2) {
            highPrecisionCount++;
          }
        }
      });
    });

    if (highPrecisionCount > 0) {
      warnings.push(`${highPrecisionCount} attributes have >2 decimal places`);
      score -= Math.min(20, highPrecisionCount * 2);
    }

    // Check for required SVG attributes
    const hasValidViewBox =
      document.bounds.width > 0 && document.bounds.height > 0;
    if (!hasValidViewBox) {
      issues.push("Invalid or missing viewBox");
      score -= 25;
    }

    // Check component validity
    let invalidComponents = 0;
    document.components.forEach((comp) => {
      if (!this.isValidComponent(comp)) {
        invalidComponents++;
      }
    });

    if (invalidComponents > 0) {
      issues.push(`${invalidComponents} components have invalid attributes`);
      score -= invalidComponents * 10;
    }

    // Check for empty or degenerate shapes
    let degenerateShapes = 0;
    document.components.forEach((comp) => {
      if (this.isDegenerateShape(comp)) {
        degenerateShapes++;
      }
    });

    if (degenerateShapes > 0) {
      warnings.push(
        `${degenerateShapes} components are degenerate (zero size)`
      );
      score -= degenerateShapes * 5;
    }

    // Check complexity
    if (document.components.length > 20) {
      warnings.push("Document is quite complex");
      score -= 5;
    }

    return { issues, warnings, score: Math.max(0, score) };
  }

  private isComponentOutOfBounds(
    component: any,
    bounds: { width: number; height: number }
  ): boolean {
    const attrs = component.attributes;

    switch (component.element) {
      case "circle":
        const cx = attrs.cx as number;
        const cy = attrs.cy as number;
        const r = attrs.r as number;
        return (
          cx - r < 0 ||
          cx + r > bounds.width ||
          cy - r < 0 ||
          cy + r > bounds.height
        );

      case "rect":
        const x = attrs.x as number;
        const y = attrs.y as number;
        const width = attrs.width as number;
        const height = attrs.height as number;
        return (
          x < 0 ||
          y < 0 ||
          x + width > bounds.width ||
          y + height > bounds.height
        );

      case "ellipse":
        const ecx = attrs.cx as number;
        const ecy = attrs.cy as number;
        const rx = attrs.rx as number;
        const ry = attrs.ry as number;
        return (
          ecx - rx < 0 ||
          ecx + rx > bounds.width ||
          ecy - ry < 0 ||
          ecy + ry > bounds.height
        );

      default:
        // For other shapes, do a simple bounds check
        return false; // Simplified for now
    }
  }

  private isValidComponent(component: any): boolean {
    const attrs = component.attributes;

    switch (component.element) {
      case "circle":
        return (
          typeof attrs.cx === "number" &&
          typeof attrs.cy === "number" &&
          typeof attrs.r === "number" &&
          attrs.r > 0
        );

      case "rect":
        return (
          typeof attrs.x === "number" &&
          typeof attrs.y === "number" &&
          typeof attrs.width === "number" &&
          attrs.width > 0 &&
          typeof attrs.height === "number" &&
          attrs.height > 0
        );

      case "ellipse":
        return (
          typeof attrs.cx === "number" &&
          typeof attrs.cy === "number" &&
          typeof attrs.rx === "number" &&
          attrs.rx > 0 &&
          typeof attrs.ry === "number" &&
          attrs.ry > 0
        );

      case "line":
        return (
          typeof attrs.x1 === "number" &&
          typeof attrs.y1 === "number" &&
          typeof attrs.x2 === "number" &&
          typeof attrs.y2 === "number"
        );

      case "polygon":
      case "polyline":
        return typeof attrs.points === "string" && attrs.points.length > 0;

      case "path":
        return typeof attrs.d === "string" && attrs.d.length > 0;

      default:
        return true; // Unknown elements pass by default
    }
  }

  private isDegenerateShape(component: any): boolean {
    const attrs = component.attributes;

    switch (component.element) {
      case "circle":
        return (attrs.r as number) <= 0;

      case "rect":
        return (attrs.width as number) <= 0 || (attrs.height as number) <= 0;

      case "ellipse":
        return (attrs.rx as number) <= 0 || (attrs.ry as number) <= 0;

      case "line":
        return attrs.x1 === attrs.x2 && attrs.y1 === attrs.y2;

      default:
        return false;
    }
  }

  private calculateOverallScore(metrics: QualityMetrics): number {
    // Weighted average of quality metrics
    const weights = {
      structuralIntegrity: 0.3,
      motifCompliance: 0.25,
      styleConsistency: 0.25,
      technicalQuality: 0.2,
    };

    return Math.round(
      metrics.structuralIntegrity * weights.structuralIntegrity +
        metrics.motifCompliance * weights.motifCompliance +
        metrics.styleConsistency * weights.styleConsistency +
        metrics.technicalQuality * weights.technicalQuality
    );
  }
}
