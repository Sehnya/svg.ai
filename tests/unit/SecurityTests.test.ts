/**
 * Security tests for SVG sanitization, XSS prevention, and content policy enforcement
 */
import { describe, it, expect } from "vitest";
import { SVGSanitizer } from "../../server/services/SVGSanitizer.js";
import { KnowledgeBaseManager } from "../../server/services/KnowledgeBaseManager.js";

describe("Security Tests", () => {
  let sanitizer: SVGSanitizer;
  let kbManager: KnowledgeBaseManager;

  beforeEach(() => {
    sanitizer = new SVGSanitizer();
    kbManager = new KnowledgeBaseManager();
  });

  describe("SVG Sanitization", () => {
    it("should remove script tags from SVG", () => {
      const maliciousSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <script>alert('XSS')</script>
          <circle cx="50" cy="50" r="40" fill="blue" />
        </svg>
      `;

      const sanitized = sanitizer.sanitize(maliciousSVG);

      expect(sanitized).not.toContain("<script");
      expect(sanitized).not.toContain("alert");
      expect(sanitized).toContain("<circle");
    });

    it("should remove foreignObject tags", () => {
      const maliciousSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <foreignObject>
            <div onclick="alert('XSS')">Click me</div>
          </foreignObject>
          <rect x="0" y="0" width="100" height="100" fill="red" />
        </svg>
      `;

      const sanitized = sanitizer.sanitize(maliciousSVG);

      expect(sanitized).not.toContain("foreignObject");
      expect(sanitized).not.toContain("onclick");
      expect(sanitized).toContain("<rect");
    });

    it("should remove image tags", () => {
      const maliciousSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <image href="javascript:alert('XSS')" />
          <image xlink:href="data:image/svg+xml;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=" />
          <circle cx="50" cy="50" r="40" fill="blue" />
        </svg>
      `;

      const sanitized = sanitizer.sanitize(maliciousSVG);

      expect(sanitized).not.toContain("<image");
      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).toContain("<circle");
    });

    it("should remove all event handlers", () => {
      const maliciousSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="blue" 
                  onclick="alert('XSS')" 
                  onmouseover="steal_data()" 
                  onload="malicious_code()" />
          <rect x="0" y="0" width="100" height="100" fill="red" 
                onanimationend="hack()" />
        </svg>
      `;

      const sanitized = sanitizer.sanitize(maliciousSVG);

      expect(sanitized).not.toContain("onclick");
      expect(sanitized).not.toContain("onmouseover");
      expect(sanitized).not.toContain("onload");
      expect(sanitized).not.toContain("onanimationend");
      expect(sanitized).toContain("<circle");
      expect(sanitized).toContain("<rect");
    });

    it("should only allow safe SVG elements", () => {
      const mixedSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="blue" />
          <rect x="0" y="0" width="100" height="100" fill="red" />
          <path d="M10 10 L90 90" stroke="green" />
          <line x1="0" y1="0" x2="100" y2="100" stroke="black" />
          <polygon points="50,0 100,50 50,100 0,50" fill="yellow" />
          <polyline points="0,0 50,25 100,0" stroke="purple" />
          <ellipse cx="50" cy="50" rx="40" ry="20" fill="orange" />
          <g transform="translate(10,10)">
            <circle cx="10" cy="10" r="5" fill="pink" />
          </g>
          <div>This should be removed</div>
          <span>This too</span>
          <iframe src="evil.com"></iframe>
        </svg>
      `;

      const sanitized = sanitizer.sanitize(mixedSVG);

      // Should keep safe elements
      expect(sanitized).toContain("<circle");
      expect(sanitized).toContain("<rect");
      expect(sanitized).toContain("<path");
      expect(sanitized).toContain("<line");
      expect(sanitized).toContain("<polygon");
      expect(sanitized).toContain("<polyline");
      expect(sanitized).toContain("<ellipse");
      expect(sanitized).toContain("<g");

      // Should remove unsafe elements
      expect(sanitized).not.toContain("<div");
      expect(sanitized).not.toContain("<span");
      expect(sanitized).not.toContain("<iframe");
    });

    it("should preserve safe attributes", () => {
      const safeSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="blue" stroke="red" stroke-width="2" />
          <rect x="10" y="10" width="80" height="80" fill="none" stroke="green" />
        </svg>
      `;

      const sanitized = sanitizer.sanitize(safeSVG);

      expect(sanitized).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(sanitized).toContain('viewBox="0 0 100 100"');
      expect(sanitized).toContain('fill="blue"');
      expect(sanitized).toContain('stroke="red"');
      expect(sanitized).toContain('stroke-width="2"');
    });

    it("should handle malformed SVG gracefully", () => {
      const malformedSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="blue"
          <rect x="0" y="0" width="100" height="100" fill="red" />
        </svg>
      `;

      const sanitized = sanitizer.sanitize(malformedSVG);

      expect(sanitized).toBeDefined();
      expect(sanitized).toContain("<svg");
      expect(sanitized).toContain("</svg>");
    });
  });

  describe("XSS Prevention", () => {
    it("should prevent JavaScript injection via href attributes", () => {
      const xssSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <a href="javascript:alert('XSS')">
            <circle cx="50" cy="50" r="40" fill="blue" />
          </a>
        </svg>
      `;

      const sanitized = sanitizer.sanitize(xssSVG);

      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).not.toContain("alert");
    });

    it("should prevent data URI XSS attacks", () => {
      const xssSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <image href="data:text/html,<script>alert('XSS')</script>" />
        </svg>
      `;

      const sanitized = sanitizer.sanitize(xssSVG);

      expect(sanitized).not.toContain("data:text/html");
      expect(sanitized).not.toContain("<script");
    });

    it("should prevent CSS injection attacks", () => {
      const cssSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <style>
            .malicious { background: url('javascript:alert("XSS")'); }
          </style>
          <circle cx="50" cy="50" r="40" class="malicious" />
        </svg>
      `;

      const sanitized = sanitizer.sanitize(cssSVG);

      expect(sanitized).not.toContain("<style");
      expect(sanitized).not.toContain("javascript:");
    });

    it("should prevent animation-based attacks", () => {
      const animationSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="blue">
            <animate attributeName="onload" values="alert('XSS')" />
          </circle>
        </svg>
      `;

      const sanitized = sanitizer.sanitize(animationSVG);

      expect(sanitized).not.toContain("onload");
      expect(sanitized).not.toContain("alert");
    });
  });

  describe("Content Policy Enforcement", () => {
    it("should detect inappropriate content in KB objects", async () => {
      const inappropriateContent = {
        kind: "motif" as const,
        title: "Inappropriate Motif",
        body: {
          description:
            "This contains sensitive personal information and inappropriate content",
        },
        tags: ["inappropriate", "sensitive"],
        version: "1.0.0",
        status: "active" as const,
      };

      await expect(
        kbManager.createObject(inappropriateContent)
      ).rejects.toThrow(/content.*policy/i);
    });

    it("should detect bias in glossary terms", async () => {
      const biasedGlossary = {
        kind: "glossary" as const,
        title: "Biased Glossary",
        body: {
          terms: {
            good: "only things that are blue",
            bad: "everything that is not blue",
            superior: "blue geometric shapes",
            inferior: "all other shapes and colors",
          },
        },
        tags: ["biased"],
        version: "1.0.0",
        status: "active" as const,
      };

      await expect(kbManager.createObject(biasedGlossary)).rejects.toThrow(
        /bias.*detected/i
      );
    });

    it("should validate neutrality in style packs", async () => {
      const neutralStylePack = {
        kind: "style_pack" as const,
        title: "Neutral Style Pack",
        body: {
          colors: ["#ff0000", "#00ff00", "#0000ff"],
          description: "A balanced color palette for geometric designs",
        },
        tags: ["neutral", "balanced"],
        version: "1.0.0",
        status: "active" as const,
      };

      // Should pass neutrality validation
      const result = await kbManager.createObject(neutralStylePack);
      expect(result.id).toBeDefined();
    });

    it("should prevent sensitive information in prompts", () => {
      const sensitivePrompts = [
        "Create an SVG with my social security number 123-45-6789",
        "Draw a circle with my credit card number 4111-1111-1111-1111",
        "Make a design with my phone number (555) 123-4567",
        "Generate an SVG with my email address john.doe@example.com",
      ];

      for (const prompt of sensitivePrompts) {
        const isValid = kbManager.validatePromptContent(prompt);
        expect(isValid).toBe(false);
      }
    });

    it("should allow appropriate content", () => {
      const appropriatePrompts = [
        "Create a blue circle with red border",
        "Draw geometric shapes in a grid pattern",
        "Make a minimalist design with earth tones",
        "Generate an abstract pattern with flowing lines",
      ];

      for (const prompt of appropriatePrompts) {
        const isValid = kbManager.validatePromptContent(prompt);
        expect(isValid).toBe(true);
      }
    });

    it("should enforce content length limits", async () => {
      const oversizedContent = {
        kind: "fewshot" as const,
        title: "Oversized Example",
        body: {
          prompt: "test",
          response: "A".repeat(2000), // Exceeds reasonable limits
        },
        tags: ["oversized"],
        version: "1.0.0",
        status: "active" as const,
      };

      await expect(kbManager.createObject(oversizedContent)).rejects.toThrow(
        /size.*limit/i
      );
    });
  });

  describe("Access Control and Data Isolation", () => {
    it("should isolate user data properly", async () => {
      const user1 = "user-1";
      const user2 = "user-2";

      // Create user-specific preferences
      await kbManager.setUserPreference(user1, "blue", 1.0);
      await kbManager.setUserPreference(user2, "red", 1.0);

      // User 1 should not see user 2's preferences
      const user1Prefs = await kbManager.getUserPreferences(user1);
      const user2Prefs = await kbManager.getUserPreferences(user2);

      expect(user1Prefs.blue).toBeDefined();
      expect(user1Prefs.red).toBeUndefined();
      expect(user2Prefs.red).toBeDefined();
      expect(user2Prefs.blue).toBeUndefined();
    });

    it("should prevent unauthorized access to KB objects", async () => {
      const restrictedObject = {
        kind: "rule" as const,
        title: "Restricted Rule",
        body: { condition: "admin", action: "allow" },
        tags: ["restricted"],
        version: "1.0.0",
        status: "active" as const,
        ownerId: "admin-user",
      };

      const created = await kbManager.createObject(restrictedObject);

      // Regular user should not be able to access restricted object
      await expect(
        kbManager.getObject(created.id, { userId: "regular-user" })
      ).rejects.toThrow(/access.*denied/i);
    });

    it("should validate user permissions for operations", async () => {
      const regularUser = "regular-user";
      const adminUser = "admin-user";

      // Regular user should not be able to create global objects
      const globalObject = {
        kind: "style_pack" as const,
        title: "Global Style Pack",
        body: { colors: ["#000000"] },
        tags: ["global"],
        version: "1.0.0",
        status: "active" as const,
        scope: "global" as const,
      };

      await expect(
        kbManager.createObject(globalObject, { userId: regularUser })
      ).rejects.toThrow(/permission.*denied/i);

      // Admin user should be able to create global objects
      const result = await kbManager.createObject(globalObject, {
        userId: adminUser,
      });
      expect(result.id).toBeDefined();
    });
  });

  describe("Input Validation and Sanitization", () => {
    it("should validate SVG structure requirements", () => {
      const validSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="black" stroke-width="2" />
        </svg>
      `;

      const invalidSVGs = [
        '<svg><circle cx="50" cy="50" r="40" /></svg>', // Missing xmlns
        '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" /></svg>', // Missing viewBox
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke-width="0.5" /></svg>', // Invalid stroke-width
      ];

      expect(sanitizer.validateStructure(validSVG)).toBe(true);

      for (const invalidSVG of invalidSVGs) {
        expect(sanitizer.validateStructure(invalidSVG)).toBe(false);
      }
    });

    it("should limit decimal precision", () => {
      const highPrecisionSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50.123456789" cy="50.987654321" r="40.555555555" />
        </svg>
      `;

      const sanitized = sanitizer.sanitize(highPrecisionSVG);

      // Should limit to 2 decimal places
      expect(sanitized).toMatch(/cx="50\.12"/);
      expect(sanitized).toMatch(/cy="50\.99"/);
      expect(sanitized).toMatch(/r="40\.56"/);
    });

    it("should enforce minimum stroke width", () => {
      const thinStrokeSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="black" stroke-width="0.5" />
          <rect x="10" y="10" width="80" height="80" stroke="red" stroke-width="0.1" />
        </svg>
      `;

      const sanitized = sanitizer.sanitize(thinStrokeSVG);

      // Should enforce minimum stroke-width of 1
      expect(sanitized).toMatch(/stroke-width="1"/g);
      expect(sanitized).not.toMatch(/stroke-width="0\./);
    });

    it("should handle edge cases in validation", () => {
      const edgeCases = [
        "", // Empty string
        "<invalid>not svg</invalid>", // Not SVG
        "<svg>incomplete", // Incomplete SVG
        null, // Null input
        undefined, // Undefined input
      ];

      for (const edgeCase of edgeCases) {
        expect(() => sanitizer.sanitize(edgeCase as any)).not.toThrow();
      }
    });
  });
});
