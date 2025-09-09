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

    // If element has an ID, use formatted ID as label (except for groups which have special logic)
    if (id && tagName !== "g") {
      return this.formatIdAsLabel(id);
    }

    // For groups, check for ID first, then use group-specific logic
    if (tagName === "g") {
      if (id) {
        return this.formatIdAsLabel(id);
      }
      return this.generateGroupLabel(element);
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

    let label = "Polygon";

    if (fill && fill !== "none") {
      const colorName = this.getColorName(fill);
      label = `${colorName} Polygon`;
    } else if (stroke && stroke !== "none") {
      const colorName = this.getColorName(stroke);
      label = `${colorName} Polygon Outline`;
    }

    // Count points to determine polygon type
    if (points) {
      const pointCount = points.trim().split(/\s+/).length / 2;
      if (pointCount === 3) {
        label = label.replace("Polygon", "Triangle");
      } else if (pointCount === 4) {
        label = label.replace("Polygon", "Quadrilateral");
      } else if (pointCount === 5) {
        label = label.replace("Polygon", "Pentagon");
      } else if (pointCount === 6) {
        label = label.replace("Polygon", "Hexagon");
      }
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
    if (color.startsWith("#") && color.length === 7) {
      const r = parseInt(color.substring(1, 3), 16);
      const g = parseInt(color.substring(3, 5), 16);
      const b = parseInt(color.substring(5, 7), 16);

      // Determine dominant color
      if (r > g && r > b) {
        return "Red";
      } else if (g > r && g > b) {
        return "Green";
      } else if (b > r && b > g) {
        return "Blue";
      } else if (r === g && r > b) {
        return "Yellow";
      } else if (r === b && r > g) {
        return "Magenta";
      } else if (g === b && g > r) {
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
      if (elementCount > 20 || colorCount > 5 || hasGroups) {
        complexity = "complex";
      } else if (elementCount > 5 || colorCount > 2) {
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
