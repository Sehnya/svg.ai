import { describe, it, expect } from "bun:test";
import { LayerAnalyzer } from "../../server/services/LayerAnalyzer";

describe("LayerAnalyzer", () => {
  const analyzer = new LayerAnalyzer();

  describe("analyze", () => {
    it("should analyze simple circle SVG", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="25" fill="#3B82F6" id="main-circle"/>
      </svg>`;

      const layers = analyzer.analyze(svg);

      expect(layers).toHaveLength(1);
      expect(layers[0]).toEqual({
        id: "main-circle",
        label: "Main Circle",
        type: "shape",
      });
    });

    it("should analyze rectangle with rounded corners", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
        <rect x="10" y="10" width="180" height="80" rx="10" ry="10" fill="#FF0000" id="rounded-rect"/>
      </svg>`;

      const layers = analyzer.analyze(svg);

      expect(layers).toHaveLength(1);
      expect(layers[0]).toEqual({
        id: "rounded-rect",
        label: "Rounded Rect",
        type: "shape",
      });
    });

    it("should analyze complex SVG with groups", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <g id="house-group">
          <rect x="50" y="100" width="100" height="80" fill="#8B4513" id="house-base"/>
          <polygon points="100,50 50,100 150,100" fill="#FF0000" id="house-roof"/>
          <rect x="80" y="130" width="20" height="30" fill="#654321" id="door"/>
        </g>
      </svg>`;

      const layers = analyzer.analyze(svg);

      expect(layers).toHaveLength(4);

      // Check group
      const group = layers.find((l) => l.id === "house-group");
      expect(group).toEqual({
        id: "house-group",
        label: "Group (3 items)",
        type: "group",
      });

      // Check individual elements
      const base = layers.find((l) => l.id === "house-base");
      expect(base?.type).toBe("shape");

      const roof = layers.find((l) => l.id === "house-roof");
      expect(roof?.type).toBe("shape");

      const door = layers.find((l) => l.id === "door");
      expect(door?.type).toBe("shape");
    });

    it("should generate IDs for elements without them", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="25" fill="#3B82F6"/>
      </svg>`;

      const layers = analyzer.analyze(svg);

      expect(layers).toHaveLength(1);
      expect(layers[0].id).toMatch(/^circle-/);
      expect(layers[0].type).toBe("shape");
    });

    it("should handle text elements", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
        <text x="100" y="50" text-anchor="middle" fill="#000000" id="title">Hello World</text>
      </svg>`;

      const layers = analyzer.analyze(svg);

      expect(layers).toHaveLength(1);
      expect(layers[0]).toEqual({
        id: "title",
        label: "Title",
        type: "text",
      });
    });

    it("should handle path elements", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M10,10 L90,10 L90,90 L10,90 Z" fill="#00FF00" id="custom-path"/>
      </svg>`;

      const layers = analyzer.analyze(svg);

      expect(layers).toHaveLength(1);
      expect(layers[0]).toEqual({
        id: "custom-path",
        label: "Custom Path",
        type: "path",
      });
    });

    it("should return empty array for invalid SVG", () => {
      const invalidSvg = "<div>Not an SVG</div>";
      const layers = analyzer.analyze(invalidSvg);
      expect(layers).toHaveLength(0);
    });

    it("should return empty array for empty input", () => {
      const layers = analyzer.analyze("");
      expect(layers).toHaveLength(0);
    });
  });

  describe("extractMetadata", () => {
    it("should extract basic metadata", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="25" fill="#3B82F6"/>
        <rect x="10" y="10" width="30" height="30" fill="#FF0000"/>
      </svg>`;

      const metadata = analyzer.extractMetadata(svg);

      expect(metadata.elementCount).toBe(2);
      expect(metadata.hasGroups).toBe(false);
      expect(metadata.hasText).toBe(false);
      expect(metadata.colorCount).toBe(2);
      expect(metadata.complexity).toBe("simple");
    });

    it("should detect groups and text", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <g id="content">
          <circle cx="50" cy="50" r="25" fill="#3B82F6"/>
          <text x="100" y="100">Hello</text>
        </g>
      </svg>`;

      const metadata = analyzer.extractMetadata(svg);

      expect(metadata.hasGroups).toBe(true);
      expect(metadata.hasText).toBe(true);
      expect(metadata.complexity).toBe("moderate");
    });

    it("should determine complexity correctly", () => {
      // Simple SVG
      const simpleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="25" fill="#3B82F6"/>
      </svg>`;

      let metadata = analyzer.extractMetadata(simpleSvg);
      expect(metadata.complexity).toBe("simple");

      // Moderate SVG
      const moderateSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="25" cy="25" r="20" fill="#3B82F6"/>
        <circle cx="75" cy="25" r="20" fill="#FF0000"/>
        <circle cx="25" cy="75" r="20" fill="#00FF00"/>
        <circle cx="75" cy="75" r="20" fill="#FFFF00"/>
        <rect x="40" y="40" width="20" height="20" fill="#FF00FF"/>
      </svg>`;

      metadata = analyzer.extractMetadata(moderateSvg);
      expect(metadata.complexity).toBe("moderate");

      // Complex SVG (with groups)
      const complexSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <g id="group1">
          <circle cx="50" cy="50" r="25" fill="#3B82F6"/>
        </g>
      </svg>`;

      metadata = analyzer.extractMetadata(complexSvg);
      expect(metadata.complexity).toBe("complex");
    });
  });

  describe("label generation", () => {
    it("should generate descriptive labels for circles", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="25" fill="#FF0000"/>
      </svg>`;

      const layers = analyzer.analyze(svg);
      expect(layers[0].label).toContain("Red Circle");
    });

    it("should generate descriptive labels for rectangles", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="60" fill="#00FF00"/>
      </svg>`;

      const layers = analyzer.analyze(svg);
      expect(layers[0].label).toContain("Green Rectangle");
    });

    it("should handle stroke-only elements", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="25" fill="none" stroke="#0000FF" stroke-width="2"/>
      </svg>`;

      const layers = analyzer.analyze(svg);
      expect(layers[0].label).toContain("Blue Circle Outline");
    });

    it("should generate labels for text elements", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
        <text x="100" y="50">Test</text>
      </svg>`;

      const layers = analyzer.analyze(svg);
      expect(layers[0].label).toBe('Text: "Test"');
    });

    it("should handle long text content", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
        <text x="100" y="50">This is a very long text that should be truncated</text>
      </svg>`;

      const layers = analyzer.analyze(svg);
      expect(layers[0].label).toBe("Text");
    });

    it("should detect polygon types", () => {
      // Triangle
      const triangleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <polygon points="50,10 10,90 90,90" fill="#FF0000"/>
      </svg>`;

      let layers = analyzer.analyze(triangleSvg);
      expect(layers[0].label).toContain("Triangle");

      // Pentagon
      const pentagonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <polygon points="50,10 90,35 75,85 25,85 10,35" fill="#FF0000"/>
      </svg>`;

      layers = analyzer.analyze(pentagonSvg);
      expect(layers[0].label).toContain("Pentagon");
    });
  });

  describe("color recognition", () => {
    it("should recognize common colors", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="25" fill="#FF0000"/>
      </svg>`;

      const layers = analyzer.analyze(svg);
      expect(layers[0].label).toContain("Red");
    });

    it("should handle custom colors", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="25" fill="#123456"/>
      </svg>`;

      const layers = analyzer.analyze(svg);
      expect(layers[0].label).toContain("Colored");
    });

    it("should recognize theme colors", () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="25" fill="#3B82F6"/>
      </svg>`;

      const layers = analyzer.analyze(svg);
      expect(layers[0].label).toContain("Blue");
    });
  });
});
