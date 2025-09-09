import { JSDOM } from "jsdom";
import createDOMPurify from "isomorphic-dompurify";
import type { SanitizationResult } from "../types";
import { SVG_CONSTANTS } from "../../src/types";

export class SVGSanitizer {
  private purify: ReturnType<typeof createDOMPurify>;
  private window: Window;

  constructor() {
    this.window = new JSDOM("").window as unknown as Window;
    this.purify = createDOMPurify(this.window);
    this.configurePurify();
  }

  private configurePurify(): void {
    // Configure allowed tags and attributes for SVG
    this.purify.addHook("beforeSanitizeElements", (node) => {
      // Remove forbidden tags
      if (
        SVG_CONSTANTS.FORBIDDEN_TAGS.includes(
          node.tagName?.toLowerCase() as any
        )
      ) {
        node.remove();
        return node;
      }

      // Only allow specific SVG tags
      if (
        node.tagName &&
        !SVG_CONSTANTS.ALLOWED_TAGS.includes(node.tagName.toLowerCase() as any)
      ) {
        if (node.tagName.toLowerCase() !== "svg") {
          node.remove();
          return node;
        }
      }

      return node;
    });

    this.purify.addHook("beforeSanitizeAttributes", (node) => {
      // Remove event handlers and other forbidden attributes
      if (node.attributes) {
        const attributesToRemove: string[] = [];

        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          if (SVG_CONSTANTS.FORBIDDEN_ATTRIBUTES.test(attr.name)) {
            attributesToRemove.push(attr.name);
          }

          // Remove href attributes that reference external resources
          if (attr.name === "href" && attr.value.startsWith("http")) {
            attributesToRemove.push(attr.name);
          }
        }

        attributesToRemove.forEach((attrName) => {
          node.removeAttribute(attrName);
        });
      }

      return node;
    });
  }

  sanitize(svgString: string): SanitizationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Basic validation
      if (!svgString.trim()) {
        errors.push("SVG content is empty");
        return {
          sanitizedSVG: "",
          warnings,
          errors,
          isValid: false,
        };
      }

      // Sanitize with DOMPurify
      const sanitized = this.purify.sanitize(svgString, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ALLOWED_TAGS: SVG_CONSTANTS.ALLOWED_TAGS as any,
        FORBID_TAGS: SVG_CONSTANTS.FORBIDDEN_TAGS as any,
        FORBID_ATTR: ["onload", "onerror", "onclick"],
        RETURN_DOM: false,
      });

      if (!sanitized) {
        errors.push("SVG sanitization failed");
        return {
          sanitizedSVG: "",
          warnings,
          errors,
          isValid: false,
        };
      }

      // Parse the sanitized SVG for additional validation
      const dom = new JSDOM(sanitized);
      const svgElement = dom.window.document.querySelector("svg");

      if (!svgElement) {
        errors.push("No valid SVG element found");
        return {
          sanitizedSVG: sanitized,
          warnings,
          errors,
          isValid: false,
        };
      }

      // Validate required attributes
      this.validateRequiredAttributes(svgElement, warnings, errors);

      // Validate and fix numeric precision
      const processedSVG = this.processNumericPrecision(sanitized, warnings);

      // Validate stroke-width requirements
      this.validateStrokeWidth(dom.window.document, warnings, errors);

      return {
        sanitizedSVG: processedSVG,
        warnings,
        errors,
        isValid: errors.length === 0,
      };
    } catch (error) {
      errors.push(
        `Sanitization error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return {
        sanitizedSVG: "",
        warnings,
        errors,
        isValid: false,
      };
    }
  }

  private validateRequiredAttributes(
    svgElement: Element,
    warnings: string[],
    errors: string[]
  ): void {
    // Check for xmlns
    if (!svgElement.getAttribute("xmlns")) {
      errors.push("SVG missing required xmlns attribute");
    } else if (
      svgElement.getAttribute("xmlns") !== "http://www.w3.org/2000/svg"
    ) {
      errors.push("SVG has incorrect xmlns attribute");
    }

    // Check for viewBox
    if (!svgElement.getAttribute("viewBox")) {
      warnings.push("SVG missing viewBox attribute - may cause scaling issues");
    }

    // Validate viewBox format if present
    const viewBox = svgElement.getAttribute("viewBox");
    if (viewBox) {
      const viewBoxValues = viewBox.split(/\s+/).map(Number);
      if (viewBoxValues.length !== 4 || viewBoxValues.some(isNaN)) {
        errors.push("SVG viewBox attribute has invalid format");
      }
    }
  }

  private processNumericPrecision(
    svgString: string,
    warnings: string[]
  ): string {
    // Limit decimal precision to 2 places maximum
    const processed = svgString.replace(/(\d+\.\d{3,})/g, (match) => {
      const num = parseFloat(match);
      const rounded = Math.round(num * 100) / 100;
      if (Math.abs(num - rounded) > 0.001) {
        warnings.push(
          `Rounded numeric value ${match} to ${rounded} for precision`
        );
      }
      return rounded.toString();
    });

    return processed;
  }

  private validateStrokeWidth(
    document: Document,
    warnings: string[],
    errors: string[]
  ): void {
    const elementsWithStroke = document.querySelectorAll("[stroke]");

    elementsWithStroke.forEach((element) => {
      const stroke = element.getAttribute("stroke");
      const strokeWidth = element.getAttribute("stroke-width");

      if (
        stroke &&
        stroke !== "none" &&
        (!strokeWidth || parseFloat(strokeWidth) < 1)
      ) {
        warnings.push(`Element with stroke should have stroke-width >= 1`);
      }
    });
  }

  // Utility method to validate numeric attributes
  private validateNumericAttributes(
    document: Document,
    warnings: string[],
    errors: string[]
  ): void {
    const numericAttributes = [
      "x",
      "y",
      "width",
      "height",
      "cx",
      "cy",
      "r",
      "rx",
      "ry",
      "stroke-width",
    ];

    document.querySelectorAll("*").forEach((element) => {
      numericAttributes.forEach((attr) => {
        const value = element.getAttribute(attr);
        if (value && isNaN(parseFloat(value))) {
          errors.push(
            `Invalid numeric value "${value}" for attribute "${attr}"`
          );
        }
      });
    });
  }
}
