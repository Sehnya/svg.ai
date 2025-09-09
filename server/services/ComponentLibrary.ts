/**
 * ComponentLibrary - Manages reusable SVG components and motifs
 */
import type { SVGComponent } from "../types/pipeline.js";

export interface ComponentTemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  template: string;
  parameters: ComponentParameter[];
  metadata: {
    reusable: boolean;
    scalable: boolean;
    tags: string[];
  };
}

export interface ComponentParameter {
  name: string;
  type: "color" | "number" | "string";
  default: any;
  min?: number;
  max?: number;
}

export class ComponentLibrary {
  private templates = new Map<string, ComponentTemplate>();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    // Geometric shapes
    this.addTemplate({
      id: "circle-basic",
      name: "Basic Circle",
      type: "circle",
      category: "geometric",
      template:
        '<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{strokeWidth}"/>',
      parameters: [
        { name: "cx", type: "number", default: 50 },
        { name: "cy", type: "number", default: 50 },
        { name: "r", type: "number", default: 25, min: 1, max: 100 },
        { name: "fill", type: "color", default: "#2563eb" },
        { name: "stroke", type: "color", default: "none" },
        { name: "strokeWidth", type: "number", default: 1, min: 0, max: 10 },
      ],
      metadata: {
        reusable: true,
        scalable: true,
        tags: ["circle", "geometric", "basic"],
      },
    });

    this.addTemplate({
      id: "rect-basic",
      name: "Basic Rectangle",
      type: "rect",
      category: "geometric",
      template:
        '<rect x="{x}" y="{y}" width="{width}" height="{height}" fill="{fill}" stroke="{stroke}" stroke-width="{strokeWidth}"/>',
      parameters: [
        { name: "x", type: "number", default: 25 },
        { name: "y", type: "number", default: 25 },
        { name: "width", type: "number", default: 50, min: 1, max: 200 },
        { name: "height", type: "number", default: 50, min: 1, max: 200 },
        { name: "fill", type: "color", default: "#16a34a" },
        { name: "stroke", type: "color", default: "none" },
        { name: "strokeWidth", type: "number", default: 1, min: 0, max: 10 },
      ],
      metadata: {
        reusable: true,
        scalable: true,
        tags: ["rectangle", "square", "geometric", "basic"],
      },
    });

    this.addTemplate({
      id: "triangle-basic",
      name: "Basic Triangle",
      type: "polygon",
      category: "geometric",
      template:
        '<polygon points="{points}" fill="{fill}" stroke="{stroke}" stroke-width="{strokeWidth}"/>',
      parameters: [
        { name: "points", type: "string", default: "50,10 90,90 10,90" },
        { name: "fill", type: "color", default: "#eab308" },
        { name: "stroke", type: "color", default: "none" },
        { name: "strokeWidth", type: "number", default: 1, min: 0, max: 10 },
      ],
      metadata: {
        reusable: true,
        scalable: true,
        tags: ["triangle", "polygon", "geometric", "basic"],
      },
    });

    // Organic shapes
    this.addTemplate({
      id: "leaf-organic",
      name: "Organic Leaf",
      type: "path",
      category: "nature",
      template:
        '<path d="{pathData}" fill="{fill}" stroke="{stroke}" stroke-width="{strokeWidth}"/>',
      parameters: [
        {
          name: "pathData",
          type: "string",
          default: "M50,10 Q70,30 60,50 Q50,70 40,50 Q30,30 50,10 Z",
        },
        { name: "fill", type: "color", default: "#16a34a" },
        { name: "stroke", type: "color", default: "#15803d" },
        { name: "strokeWidth", type: "number", default: 1, min: 0, max: 5 },
      ],
      metadata: {
        reusable: true,
        scalable: true,
        tags: ["leaf", "nature", "organic", "plant"],
      },
    });

    this.addTemplate({
      id: "wave-abstract",
      name: "Abstract Wave",
      type: "path",
      category: "abstract",
      template:
        '<path d="{pathData}" fill="none" stroke="{stroke}" stroke-width="{strokeWidth}"/>',
      parameters: [
        {
          name: "pathData",
          type: "string",
          default: "M10,50 Q30,20 50,50 Q70,80 90,50",
        },
        { name: "stroke", type: "color", default: "#2563eb" },
        { name: "strokeWidth", type: "number", default: 2, min: 1, max: 8 },
      ],
      metadata: {
        reusable: true,
        scalable: true,
        tags: ["wave", "curve", "abstract", "flow"],
      },
    });
  }

  addTemplate(template: ComponentTemplate) {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): ComponentTemplate | undefined {
    return this.templates.get(id);
  }

  findTemplates(criteria: {
    category?: string;
    type?: string;
    tags?: string[];
  }): ComponentTemplate[] {
    const results: ComponentTemplate[] = [];

    for (const template of this.templates.values()) {
      let matches = true;

      if (criteria.category && template.category !== criteria.category) {
        matches = false;
      }

      if (criteria.type && template.type !== criteria.type) {
        matches = false;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        const hasMatchingTag = criteria.tags.some((tag) =>
          template.metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          matches = false;
        }
      }

      if (matches) {
        results.push(template);
      }
    }

    return results;
  }

  instantiateComponent(
    templateId: string,
    parameters: Record<string, any>,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ): SVGComponent | null {
    const template = this.getTemplate(templateId);
    if (!template) {
      return null;
    }

    // Merge provided parameters with defaults
    const finalParams = {
      ...this.getDefaultParameters(template),
      ...parameters,
    };

    // Scale parameters based on size
    if (template.metadata.scalable) {
      finalParams.cx = (finalParams.cx || 50) * (size.width / 100);
      finalParams.cy = (finalParams.cy || 50) * (size.height / 100);
      finalParams.r =
        ((finalParams.r || 25) * Math.min(size.width, size.height)) / 100;
      finalParams.width = (finalParams.width || 50) * (size.width / 100);
      finalParams.height = (finalParams.height || 50) * (size.height / 100);
    }

    // Apply position offset
    if (finalParams.cx !== undefined) finalParams.cx += position.x;
    if (finalParams.cy !== undefined) finalParams.cy += position.y;
    if (finalParams.x !== undefined) finalParams.x += position.x;
    if (finalParams.y !== undefined) finalParams.y += position.y;

    // Generate SVG markup
    let markup = template.template;
    for (const [key, value] of Object.entries(finalParams)) {
      markup = markup.replace(new RegExp(`{${key}}`, "g"), String(value));
    }

    // Parse attributes from the markup
    const attributes = this.parseAttributes(markup, template.type);

    return {
      id: `${templateId}-${Date.now()}`,
      type: template.name,
      element: template.type as any,
      attributes,
      metadata: {
        motif: template.category,
        generated: true,
        reused: template.metadata.reusable,
      },
    };
  }

  private getDefaultParameters(
    template: ComponentTemplate
  ): Record<string, any> {
    const defaults: Record<string, any> = {};
    for (const param of template.parameters) {
      defaults[param.name] = param.default;
    }
    return defaults;
  }

  private parseAttributes(
    markup: string,
    elementType: string
  ): Record<string, string | number> {
    const attributes: Record<string, string | number> = {};

    // Extract attributes from SVG markup
    const attrRegex = /(\w+)="([^"]+)"/g;
    let match;

    while ((match = attrRegex.exec(markup)) !== null) {
      const [, name, value] = match;

      // Convert numeric values
      if (
        ["cx", "cy", "r", "x", "y", "width", "height", "stroke-width"].includes(
          name
        )
      ) {
        attributes[name] = parseFloat(value);
      } else {
        attributes[name] = value;
      }
    }

    return attributes;
  }

  getReusableComponents(motifs: string[]): ComponentTemplate[] {
    const components: ComponentTemplate[] = [];

    for (const motif of motifs) {
      const matching = this.findTemplates({ tags: [motif] });
      components.push(...matching.filter((t) => t.metadata.reusable));
    }

    return components;
  }

  generateVariation(
    templateId: string,
    variationLevel: number = 0.2
  ): ComponentTemplate | null {
    const template = this.getTemplate(templateId);
    if (!template) {
      return null;
    }

    // Create a variation by modifying parameters
    const newTemplate: ComponentTemplate = {
      ...template,
      id: `${template.id}-var-${Date.now()}`,
      name: `${template.name} Variation`,
      parameters: template.parameters.map((param) => {
        if (param.type === "number" && param.name !== "strokeWidth") {
          const variation =
            param.default * variationLevel * (Math.random() - 0.5) * 2;
          const newDefault = Math.max(
            param.min || 0,
            Math.min(param.max || 1000, param.default + variation)
          );
          return { ...param, default: newDefault };
        }
        return param;
      }),
    };

    return newTemplate;
  }
}
