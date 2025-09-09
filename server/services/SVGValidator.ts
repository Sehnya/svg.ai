import { JSDOM } from "jsdom";
import type { ValidationResult } from "../types";
import { SVG_CONSTANTS } from "../types";

export class SVGValidator {
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
}
