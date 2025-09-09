import { describe, it, expect, beforeEach } from "vitest";
import { SVGSanitizer } from "../../server/services/SVGSanitizer";

describe("SVGSanitizer", () => {
  let sanitizer: SVGSanitizer;

  beforeEach(() => {
    sanitizer = new SVGSanitizer();
  });

  describe("sanitize", () => {
    it("should sanitize a valid SVG", () => {
      const validSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = sanitizer.sanitize(validSVG);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedSVG).toContain(
        'xmlns="http://www.w3.org/2000/svg"'
      );
      expect(result.sanitizedSVG).toContain('viewBox="0 0 100 100"');
    });

    it("should remove script tags", () => {
      const maliciousSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <script>alert('xss')</script>
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = sanitizer.sanitize(maliciousSVG);

      expect(result.sanitizedSVG).not.toContain("<script>");
      expect(result.sanitizedSVG).not.toContain("alert");
    });

    it("should remove event handlers", () => {
      const maliciousSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="blue" onclick="alert('xss')" onload="badFunction()" />
      </svg>`;

      const result = sanitizer.sanitize(maliciousSVG);

      expect(result.sanitizedSVG).not.toContain("onclick");
      expect(result.sanitizedSVG).not.toContain("onload");
      expect(result.sanitizedSVG).toContain("<circle");
    });

    it("should remove foreignObject tags", () => {
      const maliciousSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <foreignObject>
          <div>HTML content</div>
        </foreignObject>
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = sanitizer.sanitize(maliciousSVG);

      expect(result.sanitizedSVG).not.toContain("<foreignObject>");
      expect(result.sanitizedSVG).not.toContain("<div>");
      expect(result.sanitizedSVG).toContain("<circle");
    });

    it("should handle empty SVG content", () => {
      const result = sanitizer.sanitize("");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("SVG content is empty");
    });

    it("should validate xmlns attribute", () => {
      const svgWithoutXmlns = `<svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = sanitizer.sanitize(svgWithoutXmlns);

      expect(result.errors).toContain("SVG missing required xmlns attribute");
    });

    it("should warn about missing viewBox", () => {
      const svgWithoutViewBox = `<svg xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = sanitizer.sanitize(svgWithoutViewBox);

      expect(result.warnings).toContain(
        "SVG missing viewBox attribute - may cause scaling issues"
      );
    });

    it("should limit decimal precision", () => {
      const svgWithPrecision = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50.123456" cy="50.789012" r="40.555555" fill="blue" />
      </svg>`;

      const result = sanitizer.sanitize(svgWithPrecision);

      expect(result.sanitizedSVG).toContain("50.12");
      expect(result.sanitizedSVG).toContain("50.79");
      expect(result.sanitizedSVG).toContain("40.56");
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should validate stroke-width requirements", () => {
      const svgWithInvalidStroke = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="red" stroke-width="0.5" fill="none" />
      </svg>`;

      const result = sanitizer.sanitize(svgWithInvalidStroke);

      expect(result.warnings).toContain(
        "Element with stroke should have stroke-width >= 1"
      );
    });

    it("should preserve valid SVG elements", () => {
      const validSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <g id="group1">
          <rect x="10" y="10" width="50" height="50" fill="red" />
          <circle cx="100" cy="100" r="30" fill="blue" />
          <path d="M150,50 L180,80 L150,110 Z" fill="green" />
          <line x1="0" y1="0" x2="200" y2="200" stroke="black" stroke-width="2" />
          <polyline points="20,20 40,25 60,40 80,120" stroke="purple" stroke-width="2" fill="none" />
          <polygon points="120,20 140,25 160,40 180,120" fill="orange" />
          <ellipse cx="100" cy="150" rx="30" ry="20" fill="pink" />
        </g>
      </svg>`;

      const result = sanitizer.sanitize(validSVG);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedSVG).toContain("<g");
      expect(result.sanitizedSVG).toContain("<rect");
      expect(result.sanitizedSVG).toContain("<circle");
      expect(result.sanitizedSVG).toContain("<path");
      expect(result.sanitizedSVG).toContain("<line");
      expect(result.sanitizedSVG).toContain("<polyline");
      expect(result.sanitizedSVG).toContain("<polygon");
      expect(result.sanitizedSVG).toContain("<ellipse");
    });
  });
});
