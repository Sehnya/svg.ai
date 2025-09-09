import { readFileSync } from "fs";
import { join } from "path";

export interface StylePack {
  name: string;
  description: string;
  constraints: {
    fillMode: "fill-primary" | "stroke-only" | "mixed";
    background: "transparent" | "solid" | "gradient";
    lineWeights: number[];
    strokeLinecap: "round" | "square" | "butt";
    strokeLinejoin: "round" | "miter" | "bevel";
    maxElements: number;
  };
  palette: {
    primary: string[];
    accent: string[];
    neutral: string[];
  };
  motifs: Record<
    string,
    {
      description: string;
      elements: any[];
    }
  >;
  dos: string[];
  donts: string[];
}

export class StylePackManager {
  private stylePacks: Map<string, StylePack> = new Map();
  private stylesDir: string;

  constructor(stylesDir: string = "server/styles") {
    this.stylesDir = stylesDir;
    this.loadStylePacks();
  }

  private loadStylePacks(): void {
    try {
      // Load Mediterranean Line Art
      const medPath = join(
        process.cwd(),
        this.stylesDir,
        "mediterranean-line-art.json"
      );
      const medStyle = JSON.parse(readFileSync(medPath, "utf-8"));
      this.stylePacks.set("mediterranean", medStyle);

      // Load Geometric Modern
      const geoPath = join(
        process.cwd(),
        this.stylesDir,
        "geometric-modern.json"
      );
      const geoStyle = JSON.parse(readFileSync(geoPath, "utf-8"));
      this.stylePacks.set("geometric", geoStyle);

      console.log(`✅ Loaded ${this.stylePacks.size} style packs`);
    } catch (error) {
      console.warn("⚠️  Could not load style packs:", error);
    }
  }

  getStylePack(name: string): StylePack | null {
    return this.stylePacks.get(name) || null;
  }

  detectStyleFromPrompt(prompt: string): string | null {
    const lowerPrompt = prompt.toLowerCase();

    // Mediterranean keywords
    if (
      lowerPrompt.includes("mediterranean") ||
      lowerPrompt.includes("greek") ||
      lowerPrompt.includes("classical") ||
      lowerPrompt.includes("arch") ||
      lowerPrompt.includes("column") ||
      lowerPrompt.includes("line art")
    ) {
      return "mediterranean";
    }

    // Geometric keywords
    if (
      lowerPrompt.includes("geometric") ||
      lowerPrompt.includes("modern") ||
      lowerPrompt.includes("abstract") ||
      lowerPrompt.includes("minimal") ||
      lowerPrompt.includes("clean")
    ) {
      return "geometric";
    }

    return null;
  }

  createStylePrompt(
    stylePack: StylePack,
    prompt: string,
    size: { width: number; height: number }
  ): string {
    const motifNames = Object.keys(stylePack.motifs);
    const motifDescriptions = motifNames
      .map((name) => `${name}: ${stylePack.motifs[name].description}`)
      .join("\n");

    return `You are an SVG Shape Planner for ${stylePack.name} style. Output STRICT JSON that matches the schema.

CANVAS: ${size.width}x${size.height}
STYLE: ${stylePack.description}

CONSTRAINTS:
- Fill mode: ${stylePack.constraints.fillMode}
- Background: ${stylePack.constraints.background}
- Line weights: ${stylePack.constraints.lineWeights.join(", ")}
- Stroke linecap: ${stylePack.constraints.strokeLinecap}
- Stroke linejoin: ${stylePack.constraints.strokeLinejoin}
- Max elements: ${stylePack.constraints.maxElements}

PALETTE:
- Primary: ${stylePack.palette.primary.join(", ")}
- Accent: ${stylePack.palette.accent.join(", ")}
- Neutral: ${stylePack.palette.neutral.join(", ")}

AVAILABLE MOTIFS:
${motifDescriptions}

DO:
${stylePack.dos.map((item) => `- ${item}`).join("\n")}

DON'T:
${stylePack.donts.map((item) => `- ${item}`).join("\n")}

SELF-CRITIQUE RULE:
Before returning JSON, verify your design follows ALL style constraints and guidelines above. Fix any violations.

MOTIF USAGE:
Reference motifs by name in a "motifs" array. Example:
{
  "elements": [...],
  "motifs": [
    {"name": "arch", "x": 100, "y": 50, "w": 80, "h": 60, "color": "#2E8B57"},
    {"name": "olive_branch", "x": 200, "y": 100, "w": 40, "h": 20, "color": "#4682B4"}
  ]
}

Think in terms of basic primitives (rect, circle, ellipse, line, polyline, polygon, path, text).
All colors must be valid CSS color strings.
Prefer simple coordinates and whole numbers.
Never include explanations—ONLY the JSON.`;
  }

  expandMotifs(motifs: any[], stylePack: StylePack): any[] {
    const expandedElements: any[] = [];

    motifs.forEach((motif) => {
      const motifDef = stylePack.motifs[motif.name];
      if (!motifDef) {
        console.warn(`Unknown motif: ${motif.name}`);
        return;
      }

      motifDef.elements.forEach((element, index) => {
        // Replace template variables
        let expandedElement = JSON.parse(JSON.stringify(element));

        // Replace coordinate variables
        expandedElement = this.replaceVariables(expandedElement, {
          x: motif.x,
          y: motif.y,
          w: motif.w,
          h: motif.h,
          color: motif.color,
          accent: motif.accent || motif.color,
        });

        // Generate unique ID
        expandedElement.id = `${motif.name}-${index}`;

        expandedElements.push(expandedElement);
      });
    });

    return expandedElements;
  }

  private replaceVariables(obj: any, vars: Record<string, any>): any {
    if (typeof obj === "string") {
      let result = obj;
      Object.entries(vars).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        result = result.replace(regex, value.toString());
      });

      // Handle mathematical expressions
      result = result.replace(/\{([^}]+)\}/g, (match, expr) => {
        try {
          // Simple expression evaluation (safe for basic math)
          const safeExpr = expr.replace(/[^0-9+\-*/().x y w h]/g, "");
          if (safeExpr !== expr) return match; // Don't evaluate if unsafe chars found

          // Replace variables in expression
          let evalExpr = safeExpr;
          Object.entries(vars).forEach(([key, value]) => {
            evalExpr = evalExpr.replace(new RegExp(key, "g"), value.toString());
          });

          return eval(evalExpr).toString();
        } catch {
          return match; // Return original if evaluation fails
        }
      });

      return result;
    } else if (Array.isArray(obj)) {
      return obj.map((item) => this.replaceVariables(item, vars));
    } else if (typeof obj === "object" && obj !== null) {
      const result: any = {};
      Object.entries(obj).forEach(([key, value]) => {
        result[key] = this.replaceVariables(value, vars);
      });
      return result;
    }

    return obj;
  }

  getAvailableStyles(): string[] {
    return Array.from(this.stylePacks.keys());
  }

  getStyleInfo(name: string): { name: string; description: string } | null {
    const pack = this.stylePacks.get(name);
    return pack ? { name: pack.name, description: pack.description } : null;
  }
}
