/**
 * Unit tests for LayeredPromptBuilder
 */

import { describe, it, expect, beforeEach } from "vitest";
import { LayeredPromptBuilder } from "../../server/services/LayeredPromptBuilder";
import { GenerationRequest } from "../../server/types";

describe("LayeredPromptBuilder", () => {
  let builder: LayeredPromptBuilder;

  beforeEach(() => {
    builder = new LayeredPromptBuilder();
  });

  describe("buildUnifiedPrompt", () => {
    it("should build complete OpenAI prompt structure", () => {
      const request: GenerationRequest = {
        prompt: "A blue house with a red roof",
        size: { width: 512, height: 512 },
        palette: ["#3B82F6", "#EF4444"],
        seed: 12345,
      };

      const prompt = builder.buildUnifiedPrompt(request);

      expect(prompt.model).toBe("gpt-4");
      expect(prompt.messages).toHaveLength(2);
      expect(prompt.messages[0].role).toBe("system");
      expect(prompt.messages[1].role).toBe("user");
      expect(prompt.temperature).toBe(0.7);
      expect(prompt.max_tokens).toBe(4000);
    });

    it("should include template-specific instructions when template provided", () => {
      const request: GenerationRequest = {
        prompt: "A geometric pattern",
        size: { width: 512, height: 512 },
      };

      const prompt = builder.buildUnifiedPrompt(request, "geometric");

      expect(prompt.messages[0].content).toContain(
        "TEMPLATE GUIDANCE (Geometric Shapes)"
      );
      expect(prompt.messages[0].content).toContain("simple geometric shapes");
    });

    it("should work without template", () => {
      const request: GenerationRequest = {
        prompt: "A simple design",
        size: { width: 512, height: 512 },
      };

      const prompt = builder.buildUnifiedPrompt(request);

      expect(prompt.messages[0].content).not.toContain("TEMPLATE GUIDANCE");
      expect(prompt.messages[0].content).toContain("unified layered approach");
    });
  });

  describe("buildSystemPrompt", () => {
    it("should include core principles and unified approach", () => {
      const systemPrompt = builder.buildSystemPrompt();

      expect(systemPrompt).toContain("CORE PRINCIPLES");
      expect(systemPrompt).toContain("UNIFIED LAYERED APPROACH");
      expect(systemPrompt).toContain("Break designs into logical layers");
      expect(systemPrompt).toContain("Use semantic regions for positioning");
      expect(systemPrompt).toContain("unified-layered-1.0");
    });

    it("should include region guide by default", () => {
      const systemPrompt = builder.buildSystemPrompt();

      expect(systemPrompt).toContain("SEMANTIC REGIONS");
      expect(systemPrompt).toContain("top_left");
      expect(systemPrompt).toContain("center");
      expect(systemPrompt).toContain("bottom_right");
      expect(systemPrompt).toContain("full_canvas");
    });

    it("should include anchor guide by default", () => {
      const systemPrompt = builder.buildSystemPrompt();

      expect(systemPrompt).toContain("ANCHOR POINTS");
      expect(systemPrompt).toContain("top_left: (0, 0)");
      expect(systemPrompt).toContain("center: (0.5, 0.5)");
      expect(systemPrompt).toContain("bottom_right: (1, 1)");
    });

    it("should include schema example by default", () => {
      const systemPrompt = builder.buildSystemPrompt();

      expect(systemPrompt).toContain("SCHEMA EXAMPLE");
      expect(systemPrompt).toContain('"version": "unified-layered-1.0"');
      expect(systemPrompt).toContain('"canvas"');
      expect(systemPrompt).toContain('"layers"');
    });

    it("should include layout examples by default", () => {
      const systemPrompt = builder.buildSystemPrompt();

      expect(systemPrompt).toContain("LAYOUT EXAMPLES");
      expect(systemPrompt).toContain("Center a shape");
      expect(systemPrompt).toContain("Top-left corner");
      expect(systemPrompt).toContain("Slight offset");
      expect(systemPrompt).toContain("Size control");
      expect(systemPrompt).toContain("Repetition");
    });

    it("should include constraints by default", () => {
      const systemPrompt = builder.buildSystemPrompt();

      expect(systemPrompt).toContain("STRICT CONSTRAINTS");
      expect(systemPrompt).toContain("Canvas: MUST be 512x512");
      expect(systemPrompt).toContain("Coordinates: MUST be absolute");
      expect(systemPrompt).toContain("Commands: ONLY M, L, C, Q, Z");
      expect(systemPrompt).toContain("ONLY JSON, no text");
    });

    it("should include template instructions when template specified", () => {
      const systemPrompt = builder.buildSystemPrompt("geometric");

      expect(systemPrompt).toContain("TEMPLATE GUIDANCE (Geometric Shapes)");
      expect(systemPrompt).toContain("clean geometric forms");
      expect(systemPrompt).toContain("simple geometric shapes");
    });

    it("should handle unknown template gracefully", () => {
      const systemPrompt = builder.buildSystemPrompt("unknown_template");

      expect(systemPrompt).not.toContain("TEMPLATE GUIDANCE");
      expect(systemPrompt).toContain("CORE PRINCIPLES");
    });
  });

  describe("buildUserPrompt", () => {
    it("should include the user prompt and basic requirements", () => {
      const request: GenerationRequest = {
        prompt: "A colorful flower",
        size: { width: 512, height: 512 },
      };

      const userPrompt = builder.buildUserPrompt(request.prompt, request);

      expect(userPrompt).toContain("A colorful flower");
      expect(userPrompt).toContain("Break the design into logical layers");
      expect(userPrompt).toContain("Use semantic regions for positioning");
      expect(userPrompt).toContain("unified-layered-1.0 JSON format");
      expect(userPrompt).toContain("Return ONLY the JSON object");
    });

    it("should include canvas information from request size", () => {
      const request: GenerationRequest = {
        prompt: "A design",
        size: { width: 800, height: 600 }, // 4:3 ratio
      };

      const userPrompt = builder.buildUserPrompt(request.prompt, request);

      expect(userPrompt).toContain("Canvas: 512x512 (aspect ratio: 4:3)");
    });

    it("should include palette information when provided", () => {
      const request: GenerationRequest = {
        prompt: "A design",
        size: { width: 512, height: 512 },
        palette: ["#FF0000", "#00FF00", "#0000FF"],
      };

      const userPrompt = builder.buildUserPrompt(request.prompt, request);

      expect(userPrompt).toContain("Color palette: #FF0000, #00FF00, #0000FF");
    });

    it("should include seed information when provided", () => {
      const request: GenerationRequest = {
        prompt: "A design",
        size: { width: 512, height: 512 },
        seed: 98765,
      };

      const userPrompt = builder.buildUserPrompt(request.prompt, request);

      expect(userPrompt).toContain("Seed: 98765");
      expect(userPrompt).toContain("consistent randomization");
    });

    it("should work with minimal request", () => {
      const request: GenerationRequest = {
        prompt: "Simple shape",
        size: { width: 512, height: 512 },
      };

      const userPrompt = builder.buildUserPrompt(request.prompt, request);

      expect(userPrompt).toContain("Simple shape");
      expect(userPrompt).toContain("Canvas: 512x512 (aspect ratio: 1:1)");
      expect(userPrompt).not.toContain("Color palette");
      expect(userPrompt).not.toContain("Seed");
    });
  });

  describe("template management", () => {
    it("should have built-in templates", () => {
      const templateNames = builder.getTemplateNames();

      expect(templateNames).toContain("geometric");
      expect(templateNames).toContain("organic");
      expect(templateNames).toContain("icon");
      expect(templateNames.length).toBeGreaterThanOrEqual(3);
    });

    it("should retrieve templates by name", () => {
      const geometricTemplate = builder.getTemplate("geometric");

      expect(geometricTemplate).toBeDefined();
      expect(geometricTemplate!.name).toBe("Geometric Shapes");
      expect(geometricTemplate!.description).toContain("clean geometric forms");
      expect(geometricTemplate!.systemPromptAdditions).toContain(
        "simple geometric shapes"
      );
      expect(geometricTemplate!.exampleDocument).toBeDefined();
    });

    it("should return undefined for unknown template", () => {
      const unknownTemplate = builder.getTemplate("unknown");

      expect(unknownTemplate).toBeUndefined();
    });

    it("should allow adding custom templates", () => {
      const customTemplate = {
        name: "custom",
        description: "A custom template for testing",
        systemPromptAdditions: "Use custom styling and approach",
        exampleDocument: {
          version: "unified-layered-1.0" as const,
          canvas: { width: 512, height: 512, aspectRatio: "1:1" as const },
          layers: [],
        },
      };

      builder.addTemplate(customTemplate);

      const templateNames = builder.getTemplateNames();
      expect(templateNames).toContain("custom");

      const retrievedTemplate = builder.getTemplate("custom");
      expect(retrievedTemplate).toEqual(customTemplate);
    });
  });

  describe("configuration options", () => {
    it("should respect includeSchemaExample option", () => {
      const builderWithoutSchema = new LayeredPromptBuilder({
        includeSchemaExample: false,
      });

      const systemPrompt = builderWithoutSchema.buildSystemPrompt();

      expect(systemPrompt).not.toContain("SCHEMA EXAMPLE");
      expect(systemPrompt).toContain("CORE PRINCIPLES"); // Should still have other content
    });

    it("should respect includeLayoutExamples option", () => {
      const builderWithoutExamples = new LayeredPromptBuilder({
        includeLayoutExamples: false,
      });

      const systemPrompt = builderWithoutExamples.buildSystemPrompt();

      expect(systemPrompt).not.toContain("LAYOUT EXAMPLES");
      expect(systemPrompt).toContain("CORE PRINCIPLES"); // Should still have other content
    });

    it("should respect includeRegionGuide option", () => {
      const builderWithoutRegions = new LayeredPromptBuilder({
        includeRegionGuide: false,
      });

      const systemPrompt = builderWithoutRegions.buildSystemPrompt();

      expect(systemPrompt).not.toContain("SEMANTIC REGIONS");
      expect(systemPrompt).toContain("CORE PRINCIPLES"); // Should still have other content
    });

    it("should respect includeAnchorGuide option", () => {
      const builderWithoutAnchors = new LayeredPromptBuilder({
        includeAnchorGuide: false,
      });

      const systemPrompt = builderWithoutAnchors.buildSystemPrompt();

      expect(systemPrompt).not.toContain("ANCHOR POINTS");
      expect(systemPrompt).toContain("CORE PRINCIPLES"); // Should still have other content
    });

    it("should respect enforceConstraints option", () => {
      const builderWithoutConstraints = new LayeredPromptBuilder({
        enforceConstraints: false,
      });

      const systemPrompt = builderWithoutConstraints.buildSystemPrompt();

      expect(systemPrompt).not.toContain("STRICT CONSTRAINTS");
      expect(systemPrompt).toContain("CORE PRINCIPLES"); // Should still have other content
    });

    it("should respect maxLayers and maxPathsPerLayer options", () => {
      const builderWithLimits = new LayeredPromptBuilder({
        maxLayers: 5,
        maxPathsPerLayer: 10,
      });

      const systemPrompt = builderWithLimits.buildSystemPrompt();

      expect(systemPrompt).toContain("Maximum 5 layers");
      expect(systemPrompt).toContain("Maximum 10 paths");
    });
  });

  describe("aspect ratio detection", () => {
    it("should detect 1:1 aspect ratio", () => {
      const request: GenerationRequest = {
        prompt: "Square design",
        size: { width: 512, height: 512 },
      };

      const userPrompt = builder.buildUserPrompt(request.prompt, request);

      expect(userPrompt).toContain("aspect ratio: 1:1");
    });

    it("should detect 4:3 aspect ratio", () => {
      const request: GenerationRequest = {
        prompt: "Landscape design",
        size: { width: 800, height: 600 },
      };

      const userPrompt = builder.buildUserPrompt(request.prompt, request);

      expect(userPrompt).toContain("aspect ratio: 4:3");
    });

    it("should detect 16:9 aspect ratio", () => {
      const request: GenerationRequest = {
        prompt: "Widescreen design",
        size: { width: 1920, height: 1080 },
      };

      const userPrompt = builder.buildUserPrompt(request.prompt, request);

      expect(userPrompt).toContain("aspect ratio: 16:9");
    });

    it("should find closest match for unknown ratios", () => {
      const request: GenerationRequest = {
        prompt: "Odd ratio design",
        size: { width: 700, height: 500 }, // 1.4:1 ratio, closest to 4:3 (1.33)
      };

      const userPrompt = builder.buildUserPrompt(request.prompt, request);

      expect(userPrompt).toContain("aspect ratio: 4:3");
    });
  });

  describe("built-in templates", () => {
    it("should have valid geometric template", () => {
      const template = builder.getTemplate("geometric");

      expect(template).toBeDefined();
      expect(template!.name).toBe("Geometric Shapes");
      expect(template!.exampleDocument.version).toBe("unified-layered-1.0");
      expect(template!.exampleDocument.canvas.width).toBe(512);
      expect(template!.exampleDocument.canvas.height).toBe(512);
      expect(template!.exampleDocument.layers.length).toBeGreaterThan(0);
      expect(template!.preferredRegions).toContain("center");
      expect(template!.suggestedAnchors).toContain("center");
    });

    it("should have valid organic template", () => {
      const template = builder.getTemplate("organic");

      expect(template).toBeDefined();
      expect(template!.name).toBe("Organic Forms");
      expect(template!.exampleDocument.version).toBe("unified-layered-1.0");
      expect(template!.exampleDocument.layers.length).toBeGreaterThan(0);
      expect(template!.systemPromptAdditions).toContain("curved paths");
    });

    it("should have valid icon template", () => {
      const template = builder.getTemplate("icon");

      expect(template).toBeDefined();
      expect(template!.name).toBe("Icon Design");
      expect(template!.exampleDocument.version).toBe("unified-layered-1.0");
      expect(template!.preferredRegions).toContain("center");
      expect(template!.suggestedAnchors).toContain("center");
      expect(template!.systemPromptAdditions).toContain(
        "clarity and recognizability"
      );
    });
  });

  describe("prompt content validation", () => {
    it("should include all required schema fields in example", () => {
      const systemPrompt = builder.buildSystemPrompt();

      expect(systemPrompt).toContain('"version"');
      expect(systemPrompt).toContain('"canvas"');
      expect(systemPrompt).toContain('"layers"');
      expect(systemPrompt).toContain('"width": 512');
      expect(systemPrompt).toContain('"height": 512');
      expect(systemPrompt).toContain('"aspectRatio"');
    });

    it("should include path structure in example", () => {
      const systemPrompt = builder.buildSystemPrompt();

      expect(systemPrompt).toContain('"paths"');
      expect(systemPrompt).toContain('"id"');
      expect(systemPrompt).toContain('"style"');
      expect(systemPrompt).toContain('"commands"');
      expect(systemPrompt).toContain('"cmd"');
      expect(systemPrompt).toContain('"coords"');
    });

    it("should include layout specifications in example", () => {
      const systemPrompt = builder.buildSystemPrompt();

      expect(systemPrompt).toContain('"layout"');
      expect(systemPrompt).toContain('"region"');
      expect(systemPrompt).toContain('"anchor"');
    });

    it("should emphasize JSON-only output", () => {
      const systemPrompt = builder.buildSystemPrompt();
      const request: GenerationRequest = {
        prompt: "Test",
        size: { width: 512, height: 512 },
      };
      const userPrompt = builder.buildUserPrompt(request.prompt, request);

      expect(systemPrompt).toContain("Return ONLY the JSON object");
      expect(systemPrompt).toContain("no additional text");
      expect(userPrompt).toContain("Return ONLY the JSON object");
      expect(userPrompt).toContain("no additional text");
    });
  });
});
