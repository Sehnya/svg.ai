/**
 * Unit tests for repair loop functionality and KB object compatibility
 */
import { describe, it, expect, beforeEach } from "vitest";
import { SVGSynthesizer } from "../../server/services/SVGSynthesizer.js";
import { QualityGate } from "../../server/services/QualityGate.js";
import { KnowledgeBaseManager } from "../../server/services/KnowledgeBaseManager.js";

describe("Repair Loop Functionality", () => {
  let synthesizer: SVGSynthesizer;
  let qualityGate: QualityGate;
  let kbManager: KnowledgeBaseManager;

  beforeEach(() => {
    synthesizer = new SVGSynthesizer();
    qualityGate = new QualityGate();
    kbManager = new KnowledgeBaseManager();
  });

  describe("SVG validation and repair", () => {
    it("should detect and repair missing xmlns attribute", async () => {
      const invalidSVG = `
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="blue" />
        </svg>
      `;

      const repairResult = await synthesizer.repairSVG(invalidSVG);

      expect(repairResult.success).toBe(true);
      expect(repairResult.repairedSVG).toContain(
        'xmlns="http://www.w3.org/2000/svg"'
      );
      expect(repairResult.repairsApplied).toContain("added_xmlns");
    });

    it("should detect and repair missing viewBox attribute", async () => {
      const invalidSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="blue" />
        </svg>
      `;

      const repairResult = await synthesizer.repairSVG(invalidSVG);

      expect(repairResult.success).toBe(true);
      expect(repairResult.repairedSVG).toContain("viewBox=");
      expect(repairResult.repairsApplied).toContain("added_viewbox");
    });

    it("should repair invalid stroke-width values", async () => {
      const invalidSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="black" stroke-width="0.5" />
          <rect x="10" y="10" width="80" height="80" stroke="red" stroke-width="0.1" />
        </svg>
      `;

      const repairResult = await synthesizer.repairSVG(invalidSVG);

      expect(repairResult.success).toBe(true);
      expect(repairResult.repairedSVG).not.toMatch(/stroke-width="0\./);
      expect(repairResult.repairedSVG).toMatch(/stroke-width="1"/g);
      expect(repairResult.repairsApplied).toContain("fixed_stroke_width");
    });

    it("should limit decimal precision to 2 places", async () => {
      const highPrecisionSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50.123456789" cy="50.987654321" r="40.555555555" />
        </svg>
      `;

      const repairResult = await synthesizer.repairSVG(highPrecisionSVG);

      expect(repairResult.success).toBe(true);
      expect(repairResult.repairedSVG).toMatch(/cx="50\.12"/);
      expect(repairResult.repairedSVG).toMatch(/cy="50\.99"/);
      expect(repairResult.repairedSVG).toMatch(/r="40\.56"/);
      expect(repairResult.repairsApplied).toContain("limited_precision");
    });

    it("should handle maximum repair attempts", async () => {
      const severelyInvalidSVG = `
        <svg>
          <circle cx="invalid" cy="invalid" r="invalid" stroke-width="0" />
          <rect x="NaN" y="NaN" width="NaN" height="NaN" />
        </svg>
      `;

      const repairResult = await synthesizer.repairSVG(severelyInvalidSVG, {
        maxAttempts: 2,
      });

      expect(repairResult.attempts).toBeLessThanOrEqual(2);

      if (!repairResult.success) {
        expect(repairResult.finalErrors).toBeDefined();
        expect(repairResult.finalErrors.length).toBeGreaterThan(0);
      }
    });

    it("should provide structured error feedback", async () => {
      const invalidSVG = `
        <svg>
          <circle />
          <rect />
        </svg>
      `;

      const repairResult = await synthesizer.repairSVG(invalidSVG);

      if (!repairResult.success) {
        expect(repairResult.errors).toBeDefined();
        expect(Array.isArray(repairResult.errors)).toBe(true);

        repairResult.errors.forEach((error) => {
          expect(error.type).toBeDefined();
          expect(error.message).toBeDefined();
          expect(error.element).toBeDefined();
        });
      }
    });
  });

  describe("Quality gate validation", () => {
    it("should validate required motifs are present", async () => {
      const svgWithMotifs = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="blue" />
          <rect x="10" y="10" width="30" height="30" fill="red" />
        </svg>
      `;

      const requiredMotifs = ["circle", "rectangle"];
      const validation = await qualityGate.validateMotifs(
        svgWithMotifs,
        requiredMotifs
      );

      expect(validation.passed).toBe(true);
      expect(validation.foundMotifs).toContain("circle");
      expect(validation.foundMotifs).toContain("rectangle");
    });

    it("should enforce stroke-only rules when required", async () => {
      const strokeOnlySVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="black" stroke-width="2" fill="none" />
          <rect x="10" y="10" width="30" height="30" stroke="red" stroke-width="1" fill="none" />
        </svg>
      `;

      const validation = await qualityGate.validateStrokeOnly(strokeOnlySVG);

      expect(validation.passed).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it("should detect stroke-only violations", async () => {
      const filledSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="blue" />
          <rect x="10" y="10" width="30" height="30" fill="red" />
        </svg>
      `;

      const validation = await qualityGate.validateStrokeOnly(filledSVG);

      expect(validation.passed).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.violations[0].element).toBe("circle");
      expect(validation.violations[0].issue).toContain("fill");
    });

    it("should enforce element count limits", async () => {
      const manyElementsSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          ${Array.from(
            { length: 15 },
            (_, i) => `<circle cx="${i * 5}" cy="${i * 5}" r="2" fill="blue" />`
          ).join("\n")}
        </svg>
      `;

      const validation = await qualityGate.validateElementCount(
        manyElementsSVG,
        {
          maxElements: 10,
        }
      );

      expect(validation.passed).toBe(false);
      expect(validation.elementCount).toBe(15);
      expect(validation.maxAllowed).toBe(10);
    });

    it("should validate component reuse efficiency", async () => {
      const reusedComponentsSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <defs>
            <g id="star">
              <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" />
            </g>
          </defs>
          <use href="#star" x="0" y="0" />
          <use href="#star" x="50" y="50" />
        </svg>
      `;

      const validation =
        await qualityGate.validateComponentReuse(reusedComponentsSVG);

      expect(validation.passed).toBe(true);
      expect(validation.reuseRatio).toBeGreaterThan(0.5);
      expect(validation.reusedComponents).toContain("star");
    });
  });

  describe("KB object compatibility testing", () => {
    it("should test object compatibility with canonical prompts", async () => {
      const testObject = {
        kind: "style_pack" as const,
        title: "Modern Minimalist",
        body: {
          colors: ["#000000", "#ffffff", "#808080"],
          description: "Clean, modern aesthetic with minimal color palette",
        },
        tags: ["modern", "minimal", "monochrome"],
        version: "1.0.0",
        status: "experimental" as const,
      };

      const canonicalPrompts = [
        "modern minimalist design",
        "black and white geometric shapes",
        "clean simple layout",
        "monochrome pattern",
      ];

      const compatibilityResult = await kbManager.testObjectCompatibility(
        testObject,
        canonicalPrompts
      );

      expect(compatibilityResult.totalTests).toBe(canonicalPrompts.length);
      expect(compatibilityResult.passedTests).toBeGreaterThan(0);
      expect(compatibilityResult.compatibilityScore).toBeGreaterThan(0);
      expect(compatibilityResult.compatibilityScore).toBeLessThanOrEqual(1);
    });

    it("should identify incompatible objects", async () => {
      const incompatibleObject = {
        kind: "motif" as const,
        title: "Broken Motif",
        body: {
          shape: "invalid_shape_type",
          properties: { invalid: "structure" },
        },
        tags: ["broken", "invalid"],
        version: "1.0.0",
        status: "experimental" as const,
      };

      const canonicalPrompts = [
        "geometric circle",
        "simple square",
        "basic triangle",
      ];

      const compatibilityResult = await kbManager.testObjectCompatibility(
        incompatibleObject,
        canonicalPrompts
      );

      expect(compatibilityResult.compatibilityScore).toBeLessThan(0.5);
      expect(compatibilityResult.issues).toBeDefined();
      expect(compatibilityResult.issues.length).toBeGreaterThan(0);
    });

    it("should validate object structure before testing", async () => {
      const malformedObject = {
        kind: "rule" as const,
        // Missing required fields
        body: null,
        tags: [],
        version: "invalid",
      };

      await expect(
        kbManager.testObjectCompatibility(malformedObject as any, ["test"])
      ).rejects.toThrow(/invalid.*object.*structure/i);
    });

    it("should provide detailed compatibility feedback", async () => {
      const testObject = {
        kind: "fewshot" as const,
        title: "Circle Example",
        body: {
          prompt: "blue circle",
          response: '<circle cx="50" cy="50" r="40" fill="blue" />',
        },
        tags: ["circle", "blue", "example"],
        version: "1.0.0",
        status: "experimental" as const,
      };

      const canonicalPrompts = [
        "blue circle",
        "red circle",
        "blue square",
        "green triangle",
      ];

      const compatibilityResult = await kbManager.testObjectCompatibility(
        testObject,
        canonicalPrompts
      );

      expect(compatibilityResult.detailedResults).toBeDefined();
      expect(compatibilityResult.detailedResults).toHaveLength(
        canonicalPrompts.length
      );

      compatibilityResult.detailedResults.forEach((result, index) => {
        expect(result.prompt).toBe(canonicalPrompts[index]);
        expect(result.passed).toBeDefined();
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("Repair loop integration", () => {
    it("should integrate validation and repair in pipeline", async () => {
      const invalidDocument = {
        svg: '<svg><circle cx="50" cy="50" r="40" stroke-width="0.5" /></svg>',
        metadata: { prompt: "test circle" },
        layers: [],
      };

      const repairPipeline = {
        validate: (doc: any) => qualityGate.validateDocument(doc),
        repair: (doc: any) => synthesizer.repairDocument(doc),
        maxAttempts: 2,
      };

      let currentDoc = invalidDocument;
      let attempts = 0;
      let success = false;

      while (attempts < repairPipeline.maxAttempts && !success) {
        const validation = await repairPipeline.validate(currentDoc);

        if (validation.passed) {
          success = true;
          break;
        }

        const repairResult = await repairPipeline.repair(currentDoc);
        if (repairResult.success) {
          currentDoc = repairResult.repairedDocument;
        }

        attempts++;
      }

      expect(attempts).toBeLessThanOrEqual(repairPipeline.maxAttempts);

      if (success) {
        expect(currentDoc.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(currentDoc.svg).toContain("viewBox=");
        expect(currentDoc.svg).not.toMatch(/stroke-width="0\./);
      }
    });

    it("should handle repair failures gracefully", async () => {
      const unreparableSVG = `
        <svg>
          <invalid-element with="malformed attributes" />
          <circle cx="NaN" cy="undefined" r="null" />
        </svg>
      `;

      const repairResult = await synthesizer.repairSVG(unreparableSVG, {
        maxAttempts: 3,
        strictMode: true,
      });

      expect(repairResult.attempts).toBe(3);
      expect(repairResult.success).toBe(false);
      expect(repairResult.finalErrors).toBeDefined();
      expect(repairResult.fallbackRecommended).toBe(true);
    });

    it("should track repair statistics", async () => {
      const testSVGs = [
        '<svg><circle cx="50" cy="50" r="40" /></svg>', // Missing xmlns, viewBox
        '<svg xmlns="http://www.w3.org/2000/svg"><rect stroke-width="0.1" /></svg>', // Missing viewBox, invalid stroke
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle /></svg>', // Valid structure, missing attributes
      ];

      const repairStats = {
        totalAttempts: 0,
        successfulRepairs: 0,
        failedRepairs: 0,
        commonIssues: {} as Record<string, number>,
      };

      for (const svg of testSVGs) {
        const repairResult = await synthesizer.repairSVG(svg);
        repairStats.totalAttempts++;

        if (repairResult.success) {
          repairStats.successfulRepairs++;
        } else {
          repairStats.failedRepairs++;
        }

        repairResult.repairsApplied?.forEach((repair) => {
          repairStats.commonIssues[repair] =
            (repairStats.commonIssues[repair] || 0) + 1;
        });
      }

      expect(repairStats.totalAttempts).toBe(testSVGs.length);
      expect(repairStats.successfulRepairs + repairStats.failedRepairs).toBe(
        repairStats.totalAttempts
      );
      expect(Object.keys(repairStats.commonIssues).length).toBeGreaterThan(0);
    });
  });
});
