import { JSDOM } from "jsdom";
import type { LayerInfo } from "../types";

export class LayerAnalyzer {
  private dom: JSDOM;

  constructor() {
    this.dom = new JSDOM();
  }

  analyze(svgContent: string): LayerInfo[] {
    try {
      const parser = this.dom.window.DOMParser;
      const doc = new parser().parseFromString(svgContent, "image/svg+xml");
      const svgElement = doc.documentElement;

      if (!svgElement || svgElement.tagName !== "svg") {
        return [];
      }

      const layers: LayerInfo[] = [];
      this.extractLayers(svgElement, layers);
      return layers;
    } catch (error) {
      console.error("Error analyzing SVG layers:", error);
      return [];
    }
  }

  private extractLayers(element: Element, layers: LayerInfo[]): void {
    if (element.tagName === "svg") {
      Array.from(element.children).forEach((child) => {
        this.extractLayers(child, layers);
      });
      return;
    }

    if (this.isLayerElement(element)) {
      const layerInfo = this.createLayerInfo(element);
      if (layerInfo) {
        layers.push(layerInfo);
      }
    }

    if (element.tagName === "g") {
      Array.from(element.children).forEach((child) => {
        this.extractLayers(child, layers);
      });
    }
  }

  private isLayerElement(element: Element): boolean {
    const layerTags = [
      "g",
      "circle",
      "rect",
      "path",
      "line",
      "polyline",
      "polygon",
      "ellipse",
      "text",
    ];
    return layerTags.includes(element.tagName.toLowerCase());
  }

  private createLayerInfo(element: Element): LayerInfo | null {
    const id = element.getAttribute("id") || this.generateId(element);
    const label = this.generateLabel(element);
    const type = this.classifyElement(element);

    return { id, label, type };
  }

  private generateId(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${tagName}-${timestamp}-${random}`;
  }

  private generateLabel(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const id = element.getAttribute("id");

    // For groups, always use group-specific logic unless ID suggests otherwise
    if (tagName === "g") {
      if (id) {
        // Check if ID suggests it should be treated as a group count
        const formattedId = this.formatIdAsLabel(id);
        if (formattedId.toLowerCase().includes("group")) {
          return this.generateGroupLabel(element);
        }
        return formattedId;
      }
      return this.generateGroupLabel(element);
    }

    // If element has an ID, use formatted ID as label
    if (id) {
      return this.formatIdAsLabel(id);
    }

    // For elements without IDs, use descriptive labels based on attributes
    switch (tagName) {
      case "circle":
        return this.generateCircleLabel(element);
      case "rect":
        return this.generateRectLabel(element);
      case "polygon":
        return this.generatePolygonLabel(element);
      case "text":
        return this.generateTextLabel(element);
      default:
        return this.capitalizeFirst(tagName);
    }
  }

  private formatIdAsLabel(id: string): string {
    return id
      .replace(/[-_]/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(" ")
      .map((word) => this.capitalizeFirst(word))
      .join(" ");
  }

  private classifyElement(element: Element): LayerInfo["type"] {
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case "g":
        return "group";
      case "text":
        return "text";
      case "path":
        return "path";
      default:
        return "shape";
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private generateCircleLabel(element: Element): string {
    const r = element.getAttribute("r");
    const fill = element.getAttribute("fill");
    const stroke = element.getAttribute("stroke");

    let label = "Circle";

    if (fill && fill !== "none") {
      const colorName = this.getColorName(fill);
      label = `${colorName} Circle`;
    } else if (stroke && stroke !== "none") {
      const colorName = this.getColorName(stroke);
      label = `${colorName} Circle Outline`;
    }

    if (r) {
      label += ` (r=${r})`;
    }

    return label;
  }

  private generateRectLabel(element: Element): string {
    const width = element.getAttribute("width");
    const height = element.getAttribute("height");
    const rx = element.getAttribute("rx");
    const fill = element.getAttribute("fill");
    const stroke = element.getAttribute("stroke");

    let label = rx ? "Rounded Rectangle" : "Rectangle";

    if (fill && fill !== "none") {
      const colorName = this.getColorName(fill);
      label = `${colorName} ${label}`;
    } else if (stroke && stroke !== "none") {
      const colorName = this.getColorName(stroke);
      label = `${colorName} ${label} Outline`;
    }

    if (width && height) {
      label += ` (${width}×${height})`;
    }

    return label;
  }

  private generateTextLabel(element: Element): string {
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length <= 20) {
      return `Text: "${textContent}"`;
    }
    return "Text";
  }

  private generateGroupLabel(element: Element): string {
    const childCount = element.children.length;
    if (childCount === 0) {
      return "Empty Group";
    } else if (childCount === 1) {
      return "Group (1 item)";
    } else {
      return `Group (${childCount} items)`;
    }
  }

  private generatePolygonLabel(element: Element): string {
    const points = element.getAttribute("points");
    const fill = element.getAttribute("fill");
    const stroke = element.getAttribute("stroke");

    let shapeType = "Polygon";

    // Count points to determine polygon type
    if (points) {
      const pointPairs = points
        .trim()
        .split(/\s+|,/)
        .filter((p) => p.trim() !== "");
      const pointCount = Math.floor(pointPairs.length / 2);
      if (pointCount === 3) {
        shapeType = "Triangle";
      } else if (pointCount === 4) {
        shapeType = "Quadrilateral";
      } else if (pointCount === 5) {
        shapeType = "Pentagon";
      } else if (pointCount === 6) {
        shapeType = "Hexagon";
      }
    }

    let label = shapeType;

    if (fill && fill !== "none") {
      const colorName = this.getColorName(fill);
      label = `${colorName} ${shapeType}`;
    } else if (stroke && stroke !== "none") {
      const colorName = this.getColorName(stroke);
      label = `${colorName} ${shapeType} Outline`;
    }

    return label;
  }

  private getColorName(color: string): string {
    const colorMap: Record<string, string> = {
      "#FF0000": "Red",
      "#00FF00": "Green",
      "#0000FF": "Blue",
      "#FFFF00": "Yellow",
      "#FF00FF": "Magenta",
      "#00FFFF": "Cyan",
      "#000000": "Black",
      "#FFFFFF": "White",
      "#808080": "Gray",
      "#FFA500": "Orange",
      "#800080": "Purple",
      "#FFC0CB": "Pink",
      "#A52A2A": "Brown",
      "#3B82F6": "Blue",
      "#1E40AF": "Dark Blue",
      "#1D4ED8": "Royal Blue",
    };

    const normalizedColor = color.toUpperCase();

    if (colorMap[normalizedColor]) {
      return colorMap[normalizedColor];
    }

    // For hex colors, try to determine basic color
    if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
      let r, g, b;

      if (color.length === 4) {
        // Short hex format #RGB
        r = parseInt(color.substring(1, 2) + color.substring(1, 2), 16);
        g = parseInt(color.substring(2, 3) + color.substring(2, 3), 16);
        b = parseInt(color.substring(3, 4) + color.substring(3, 4), 16);
      } else {
        // Full hex format #RRGGBB
        r = parseInt(color.substring(1, 3), 16);
        g = parseInt(color.substring(3, 5), 16);
        b = parseInt(color.substring(5, 7), 16);
      }

      // Determine dominant color - require significant dominance
      const threshold = 50; // Minimum difference to be considered dominant

      if (r > g + threshold && r > b + threshold) {
        return "Red";
      } else if (g > r + threshold && g > b + threshold) {
        return "Green";
      } else if (b > r + threshold && b > g + threshold) {
        return "Blue";
      } else if (Math.abs(r - g) < threshold && r > b + threshold) {
        return "Yellow";
      } else if (Math.abs(r - b) < threshold && r > g + threshold) {
        return "Magenta";
      } else if (Math.abs(g - b) < threshold && g > r + threshold) {
        return "Cyan";
      }
    }

    return "Colored";
  }

  extractMetadata(svgContent: string): {
    elementCount: number;
    hasGroups: boolean;
    hasText: boolean;
    colorCount: number;
    complexity: "simple" | "moderate" | "complex";
  } {
    try {
      const parser = this.dom.window.DOMParser;
      const doc = new parser().parseFromString(svgContent, "image/svg+xml");
      const svgElement = doc.documentElement;

      if (!svgElement || svgElement.tagName !== "svg") {
        return {
          elementCount: 0,
          hasGroups: false,
          hasText: false,
          colorCount: 0,
          complexity: "simple",
        };
      }

      const elements = svgElement.querySelectorAll("*");
      const elementCount = elements.length;
      const hasGroups = svgElement.querySelector("g") !== null;
      const hasText = svgElement.querySelector("text") !== null;

      // Extract unique colors
      const colors = new Set<string>();
      elements.forEach((el) => {
        const fill = el.getAttribute("fill");
        const stroke = el.getAttribute("stroke");
        if (fill && fill !== "none") colors.add(fill);
        if (stroke && stroke !== "none") colors.add(stroke);
      });

      const colorCount = colors.size;

      // Determine complexity
      let complexity: "simple" | "moderate" | "complex" = "simple";
      if (
        elementCount > 20 ||
        colorCount > 5 ||
        (hasGroups && elementCount <= 2)
      ) {
        complexity = "complex";
      } else if (elementCount > 5 || colorCount > 2 || hasGroups || hasText) {
        complexity = "moderate";
      }

      return {
        elementCount,
        hasGroups,
        hasText,
        colorCount,
        complexity,
      };
    } catch (error) {
      console.error("Error extracting SVG metadata:", error);
      return {
        elementCount: 0,
        hasGroups: false,
        hasText: false,
        colorCount: 0,
        complexity: "simple",
      };
    }
  }
}
