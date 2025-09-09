import { describe, it, expect, beforeEach } from "vitest";
import { SVGValidator } from "../../server/services/SVGValidator";

describe("SVGValidator", () => {
  let validator: SVGValidator;

  beforeEach(() => {
    validator = new SVGValidator();
  });

  describe("validateSVGStructure", () => {
    it("should validate a correct SVG structure", () => {
      const validSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = validator.validateSVGStructure(validSVG);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for empty content", () => {
      const result = validator.validateSVGStructure("");

      expect(result.success).toBe(false);
      expect(result.errors).toContain("SVG content is empty");
    });

    it("should fail for missing xmlns", () => {
      const invalidSVG = `<svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = validator.validateSVGStructure(invalidSVG);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("SVG missing xmlns attribute");
    });

    it("should fail for incorrect xmlns", () => {
      const invalidSVG = `<svg xmlns="http://www.w3.org/1999/xhtml" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = validator.validateSVGStructure(invalidSVG);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("SVG has incorrect xmlns attribute");
    });

    it("should fail for missing viewBox", () => {
      const invalidSVG = `<svg xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = validator.validateSVGStructure(invalidSVG);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("SVG missing viewBox attribute");
    });

    it("should fail for invalid viewBox format", () => {
      const invalidSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="invalid">
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = validator.validateSVGStructure(invalidSVG);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("SVG viewBox has invalid format");
    });

    it("should fail for forbidden elements", () => {
      const invalidSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <script>alert('xss')</script>
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = validator.validateSVGStructure(invalidSVG);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "SVG contains forbidden elements: script"
      );
    });

    it("should fail for forbidden attributes", () => {
      const invalidSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="blue" onclick="alert('xss')" />
      </svg>`;

      const result = validator.validateSVGStructure(invalidSVG);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Element contains forbidden attribute: onclick"
      );
    });
  });

  describe("validateSVGContract", () => {
    it("should validate allowed elements", () => {
      const validSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <g>
          <rect x="10" y="10" width="50" height="50" fill="red" />
          <circle cx="100" cy="100" r="30" fill="blue" />
          <path d="M150,50 L180,80 L150,110 Z" fill="green" />
          <line x1="0" y1="0" x2="200" y2="200" stroke="black" stroke-width="2" />
          <polyline points="20,20 40,25 60,40 80,120" stroke="purple" stroke-width="2" fill="none" />
          <polygon points="120,20 140,25 160,40 180,120" fill="orange" />
          <ellipse cx="100" cy="150" rx="30" ry="20" fill="pink" />
        </g>
      </svg>`;

      const result = validator.validateSVGContract(validSVG);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for disallowed elements", () => {
      const invalidSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <div>Invalid HTML element</div>
        <circle cx="50" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = validator.validateSVGContract(invalidSVG);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Disallowed element found: div");
    });

    it("should fail for excessive decimal precision", () => {
      const invalidSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50.123456" cy="50" r="40" fill="blue" />
      </svg>`;

      const result = validator.validateSVGContract(invalidSVG);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "SVG contains numbers with excessive decimal precision"
      );
    });

    it("should fail for invalid stroke-width", () => {
      const invalidSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="red" stroke-width="0.5" fill="none" />
      </svg>`;

      const result = validator.validateSVGContract(invalidSVG);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Elements with stroke must have stroke-width >= 1"
      );
    });
  });

  describe("validateDimensions", () => {
    it("should validate correct dimensions", () => {
      const result = validator.validateDimensions(100, 200);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for dimensions too small", () => {
      const result = validator.validateDimensions(10, 200);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Width must be an integer between 16 and 2048"
      );
    });

    it("should fail for dimensions too large", () => {
      const result = validator.validateDimensions(100, 3000);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Height must be an integer between 16 and 2048"
      );
    });

    it("should fail for non-integer dimensions", () => {
      const result = validator.validateDimensions(100.5, 200.7);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Width must be an integer between 16 and 2048"
      );
      expect(result.errors).toContain(
        "Height must be an integer between 16 and 2048"
      );
    });
  });

  describe("validateColors", () => {
    it("should validate correct hex colors", () => {
      const colors = ["#FF0000", "#00FF00", "#0000FF", "#123ABC"];
      const result = validator.validateColors(colors);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for invalid hex colors", () => {
      const colors = ["#FF0000", "red", "#GG0000", "#12345"];
      const result = validator.validateColors(colors);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Invalid color format at index 1: red");
      expect(result.errors).toContain(
        "Invalid color format at index 2: #GG0000"
      );
      expect(result.errors).toContain(
        "Invalid color format at index 3: #12345"
      );
    });
  });
});
