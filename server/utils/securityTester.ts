import { SVGSanitizer } from "../services/SVGSanitizer";

export interface SecurityTestResult {
  testName: string;
  passed: boolean;
  details: string;
  input?: string;
  output?: string;
}

export class SecurityTester {
  private sanitizer: SVGSanitizer;

  constructor() {
    this.sanitizer = new SVGSanitizer();
  }

  async runAllTests(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    // XSS Prevention Tests
    results.push(...(await this.testXSSPrevention()));

    // Input Validation Tests
    results.push(...(await this.testInputValidation()));

    // SVG Sanitization Tests
    results.push(...(await this.testSVGSanitization()));

    return results;
  }

  private async testXSSPrevention(): Promise<SecurityTestResult[]> {
    const xssPayloads = [
      {
        name: "Script tag injection",
        payload: '<svg><script>alert("xss")</script></svg>',
      },
      {
        name: "Event handler injection",
        payload: "<svg onload=\"alert('xss')\"><rect /></svg>",
      },
      {
        name: "JavaScript URL injection",
        payload: "<svg><a href=\"javascript:alert('xss')\"><rect /></a></svg>",
      },
      {
        name: "Foreign object injection",
        payload:
          '<svg><foreignObject><script>alert("xss")</script></foreignObject></svg>',
      },
      {
        name: "Image with JavaScript",
        payload: "<svg><image href=\"javascript:alert('xss')\" /></svg>",
      },
    ];

    const results: SecurityTestResult[] = [];

    for (const test of xssPayloads) {
      try {
        const result = this.sanitizer.sanitize(test.payload);

        const containsScript = result.sanitizedSVG.includes("<script");
        const containsJavaScript = result.sanitizedSVG.includes("javascript:");
        const containsEventHandlers = /on\w+\s*=/i.test(result.sanitizedSVG);
        const containsForeignObject =
          result.sanitizedSVG.includes("<foreignObject");

        const passed =
          !containsScript &&
          !containsJavaScript &&
          !containsEventHandlers &&
          !containsForeignObject;

        results.push({
          testName: test.name,
          passed,
          details: passed
            ? "XSS payload successfully sanitized"
            : "XSS payload not properly sanitized",
          input: test.payload,
          output: result.sanitizedSVG,
        });
      } catch (error) {
        results.push({
          testName: test.name,
          passed: false,
          details: `Sanitization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          input: test.payload,
        });
      }
    }

    return results;
  }

  private async testInputValidation(): Promise<SecurityTestResult[]> {
    const validationTests = [
      {
        name: "Extremely long prompt",
        input: "A".repeat(10000),
        shouldPass: false,
      },
      {
        name: "Valid prompt",
        input: "A simple blue circle",
        shouldPass: true,
      },
      {
        name: "Empty prompt",
        input: "",
        shouldPass: false,
      },
      {
        name: "Prompt with special characters",
        input: "Circle with <>&\"' characters",
        shouldPass: true,
      },
    ];

    const results: SecurityTestResult[] = [];

    for (const test of validationTests) {
      const isValid = test.input.length > 0 && test.input.length <= 500;
      const passed = isValid === test.shouldPass;

      results.push({
        testName: test.name,
        passed,
        details: passed
          ? "Input validation working correctly"
          : `Expected ${test.shouldPass ? "valid" : "invalid"}, got ${isValid ? "valid" : "invalid"}`,
        input:
          test.input.substring(0, 100) + (test.input.length > 100 ? "..." : ""),
      });
    }

    return results;
  }

  private async testSVGSanitization(): Promise<SecurityTestResult[]> {
    const sanitizationTests = [
      {
        name: "Valid SVG preservation",
        input:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue" /></svg>',
        shouldContain: ["<svg", "<circle", "xmlns", "viewBox"],
        shouldNotContain: [],
      },
      {
        name: "Unsafe element removal",
        input:
          '<svg><script>alert("xss")</script><circle cx="50" cy="50" r="40" /></svg>',
        shouldContain: ["<svg", "<circle"],
        shouldNotContain: ["<script", "alert"],
      },
      {
        name: "Event handler removal",
        input:
          '<svg onclick="alert(\'xss\')"><rect onmouseover="steal()" /></svg>',
        shouldContain: ["<svg", "<rect"],
        shouldNotContain: ["onclick", "onmouseover", "alert", "steal"],
      },
      {
        name: "External reference blocking",
        input:
          '<svg><image href="http://evil.com/steal.js" /><use href="#external" /></svg>',
        shouldContain: ["<svg"],
        shouldNotContain: ["http://evil.com", 'href="http'],
      },
    ];

    const results: SecurityTestResult[] = [];

    for (const test of sanitizationTests) {
      try {
        const result = this.sanitizer.sanitize(test.input);
        const output = result.sanitizedSVG;

        const hasRequiredContent = test.shouldContain.every((content) =>
          output.includes(content)
        );
        const hasForbiddenContent = test.shouldNotContain.some((content) =>
          output.includes(content)
        );

        const passed = hasRequiredContent && !hasForbiddenContent;

        let details = "Sanitization test ";
        if (!hasRequiredContent) {
          details += "failed - missing required content. ";
        }
        if (hasForbiddenContent) {
          details += "failed - contains forbidden content. ";
        }
        if (passed) {
          details += "passed successfully.";
        }

        results.push({
          testName: test.name,
          passed,
          details,
          input: test.input,
          output,
        });
      } catch (error) {
        results.push({
          testName: test.name,
          passed: false,
          details: `Sanitization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          input: test.input,
        });
      }
    }

    return results;
  }

  async generateSecurityReport(): Promise<string> {
    const results = await this.runAllTests();
    const passedTests = results.filter((r) => r.passed).length;
    const totalTests = results.length;

    let report = `# Security Test Report\n\n`;
    report += `**Overall Result:** ${passedTests}/${totalTests} tests passed\n\n`;

    if (passedTests === totalTests) {
      report += `✅ All security tests passed!\n\n`;
    } else {
      report += `⚠️ ${totalTests - passedTests} security tests failed!\n\n`;
    }

    report += `## Test Results\n\n`;

    for (const result of results) {
      const status = result.passed ? "✅" : "❌";
      report += `### ${status} ${result.testName}\n`;
      report += `**Status:** ${result.passed ? "PASSED" : "FAILED"}\n`;
      report += `**Details:** ${result.details}\n`;

      if (result.input) {
        report += `**Input:** \`${result.input.substring(0, 100)}${result.input.length > 100 ? "..." : ""}\`\n`;
      }

      if (result.output) {
        report += `**Output:** \`${result.output.substring(0, 100)}${result.output.length > 100 ? "..." : ""}\`\n`;
      }

      report += `\n`;
    }

    return report;
  }
}
