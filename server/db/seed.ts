import { db, closeDatabaseConnection } from "./config";
import { kbObjects, kbLinks, globalPreferences } from "./schema";

// Default style packs
const defaultStylePacks = [
  {
    id: "mediterranean-line-art",
    kind: "style_pack" as const,
    title: "Mediterranean Line Art",
    body: {
      name: "Mediterranean Line Art",
      description:
        "Clean line art inspired by Mediterranean architecture and motifs",
      styleParameters: {
        colorPalette: ["#2563eb", "#0ea5e9", "#06b6d4", "#14b8a6"],
        strokeWidth: 2,
        cornerRadius: 4,
        fillOpacity: 0,
        strokeOpacity: 1,
        fontFamily: "Inter",
        fontSize: 14,
        lineHeight: 1.4,
        spacing: 16,
      },
    },
    tags: ["mediterranean", "line-art", "architecture", "clean", "minimal"],
    version: "1.0.0",
    status: "active" as const,
    qualityScore: "0.9",
    sourceProvenance: {
      source: "curator",
      notes: "Default Mediterranean style pack",
    },
  },
  {
    id: "art-deco-geometric",
    kind: "style_pack" as const,
    title: "Art Deco Geometric",
    body: {
      name: "Art Deco Geometric",
      description: "Bold geometric patterns inspired by Art Deco design",
      styleParameters: {
        colorPalette: ["#dc2626", "#ea580c", "#d97706", "#ca8a04"],
        strokeWidth: 3,
        cornerRadius: 0,
        fillOpacity: 0.8,
        strokeOpacity: 1,
        fontFamily: "Inter",
        fontSize: 16,
        lineHeight: 1.2,
        spacing: 20,
      },
    },
    tags: ["art-deco", "geometric", "bold", "patterns", "vintage"],
    version: "1.0.0",
    status: "active" as const,
    qualityScore: "0.85",
    sourceProvenance: {
      source: "curator",
      notes: "Default Art Deco style pack",
    },
  },
  {
    id: "modern-minimal",
    kind: "style_pack" as const,
    title: "Modern Minimal",
    body: {
      name: "Modern Minimal",
      description: "Clean, modern minimalist design with subtle colors",
      styleParameters: {
        colorPalette: ["#6b7280", "#9ca3af", "#d1d5db", "#f3f4f6"],
        strokeWidth: 1.5,
        cornerRadius: 8,
        fillOpacity: 0.1,
        strokeOpacity: 0.8,
        fontFamily: "Inter",
        fontSize: 12,
        lineHeight: 1.5,
        spacing: 12,
      },
    },
    tags: ["modern", "minimal", "clean", "subtle", "contemporary"],
    version: "1.0.0",
    status: "active" as const,
    qualityScore: "0.95",
    sourceProvenance: {
      source: "curator",
      notes: "Default modern minimal style pack",
    },
  },
];

// Default motifs
const defaultMotifs = [
  {
    id: "mediterranean-arch",
    kind: "motif" as const,
    title: "Mediterranean Arch",
    body: {
      name: "Mediterranean Arch",
      description: "Classic rounded arch found in Mediterranean architecture",
      parameters: {
        shapes: [
          {
            type: "path",
            pathData: "M 10 50 Q 50 10 90 50 L 90 60 L 10 60 Z",
            strokeWidth: 2,
            fill: "none",
          },
        ],
        patterns: [],
        decorativeElements: [],
        layoutHints: ["center", "architectural"],
      },
    },
    tags: ["arch", "mediterranean", "architecture", "curved", "classic"],
    version: "1.0.0",
    status: "active" as const,
    qualityScore: "0.9",
    sourceProvenance: {
      source: "curator",
      notes: "Classic Mediterranean arch motif",
    },
  },
  {
    id: "olive-branch",
    kind: "motif" as const,
    title: "Olive Branch",
    body: {
      name: "Olive Branch",
      description: "Stylized olive branch with leaves",
      parameters: {
        shapes: [
          {
            type: "path",
            pathData: "M 20 50 Q 30 40 40 50 Q 50 40 60 50 Q 70 40 80 50",
            strokeWidth: 2,
            fill: "none",
          },
        ],
        patterns: ["organic", "flowing"],
        decorativeElements: ["leaves", "natural"],
        layoutHints: ["decorative", "border", "accent"],
      },
    },
    tags: ["olive", "branch", "natural", "mediterranean", "organic", "peace"],
    version: "1.0.0",
    status: "active" as const,
    qualityScore: "0.85",
    sourceProvenance: {
      source: "curator",
      notes: "Mediterranean olive branch motif",
    },
  },
  {
    id: "greek-key",
    kind: "motif" as const,
    title: "Greek Key Pattern",
    body: {
      name: "Greek Key Pattern",
      description: "Traditional Greek key geometric pattern",
      parameters: {
        shapes: [
          {
            type: "path",
            pathData:
              "M 10 10 L 30 10 L 30 30 L 50 30 L 50 10 L 70 10 L 70 50 L 10 50 Z",
            strokeWidth: 2,
            fill: "none",
          },
        ],
        patterns: ["geometric", "repeating"],
        decorativeElements: ["border", "frame"],
        layoutHints: ["border", "pattern", "geometric"],
      },
    },
    tags: ["greek", "key", "pattern", "geometric", "traditional", "border"],
    version: "1.0.0",
    status: "active" as const,
    qualityScore: "0.88",
    sourceProvenance: {
      source: "curator",
      notes: "Traditional Greek key pattern",
    },
  },
];

// Default glossary terms
const defaultGlossary = [
  {
    id: "stroke-width-guide",
    kind: "glossary" as const,
    title: "Stroke Width Guidelines",
    body: {
      term: "stroke-width",
      definition: "The width of the outline of SVG shapes",
      guidelines: {
        thin: "1-1.5px for delicate details",
        medium: "2-3px for standard elements",
        thick: "4-6px for bold emphasis",
        constraints: "Must be >= 1px for visibility",
      },
    },
    tags: ["stroke", "width", "guidelines", "technical"],
    version: "1.0.0",
    status: "active" as const,
    qualityScore: "0.95",
    sourceProvenance: {
      source: "curator",
      notes: "Technical guidelines for stroke width",
    },
  },
];

// Default rules
const defaultRules = [
  {
    id: "stroke-only-rule",
    kind: "rule" as const,
    title: "Stroke-Only Rendering",
    body: {
      rule: "stroke-only",
      description: "All elements must use stroke rendering without fill",
      constraints: {
        fill: "none",
        stroke: "required",
        strokeWidth: ">= 1",
      },
      exceptions: ["background", "canvas"],
    },
    tags: ["stroke", "rendering", "constraint", "style"],
    version: "1.0.0",
    status: "active" as const,
    qualityScore: "1.0",
    sourceProvenance: {
      source: "curator",
      notes: "Core rendering constraint for stroke-only SVGs",
    },
  },
];

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Check if data already exists
    const existingObjects = await db.select().from(kbObjects).limit(1);
    if (existingObjects.length > 0) {
      console.log("Database already contains data. Skipping seed.");
      return;
    }

    // Insert style packs
    console.log("Inserting default style packs...");
    for (const stylePack of defaultStylePacks) {
      await db.insert(kbObjects).values(stylePack);
    }

    // Insert motifs
    console.log("Inserting default motifs...");
    for (const motif of defaultMotifs) {
      await db.insert(kbObjects).values(motif);
    }

    // Insert glossary terms
    console.log("Inserting default glossary...");
    for (const glossaryItem of defaultGlossary) {
      await db.insert(kbObjects).values(glossaryItem);
    }

    // Insert rules
    console.log("Inserting default rules...");
    for (const rule of defaultRules) {
      await db.insert(kbObjects).values(rule);
    }

    // Create some relationships
    console.log("Creating object relationships...");
    await db.insert(kbLinks).values([
      {
        srcId: "mediterranean-arch",
        dstId: "mediterranean-line-art",
        rel: "belongs_to",
      },
      {
        srcId: "olive-branch",
        dstId: "mediterranean-line-art",
        rel: "belongs_to",
      },
      {
        srcId: "greek-key",
        dstId: "mediterranean-line-art",
        rel: "belongs_to",
      },
    ]);

    // Insert default global preferences
    console.log("Setting up default preferences...");
    await db.insert(globalPreferences).values({
      id: true,
      weights: {
        motifs: {
          "mediterranean-arch": 1.0,
          "olive-branch": 0.9,
          "greek-key": 0.8,
        },
        tags: {
          mediterranean: 1.0,
          clean: 0.9,
          minimal: 0.8,
          geometric: 0.7,
        },
        strokeWidth: "[1.5, 3]",
      },
    });

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

seedDatabase();
