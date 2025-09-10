#!/usr/bin/env tsx

/**
 * Debug Viewport CLI Tool
 * Usage: tsx scripts/debug-viewport.ts
 */

import { ViewportDebugger } from "../server/utils/viewportDebugger";
import { writeFileSync } from "fs";
import { join } from "path";

function main() {
  console.log("🔍 SVG Viewport Debugger");
  console.log("========================");

  // Generate a test heart shape that might have viewport issues
  const heartCommands = ViewportDebugger.generateTestHeart(256, 256, 150); // Larger heart

  console.log("\n📊 Analyzing heart shape...");

  // Analyze with different viewBox scenarios
  const scenarios = [
    {
      name: "Standard 512x512",
      viewBox: "0 0 512 512",
      width: 512,
      height: 512,
    },
    { name: "Tight 400x400", viewBox: "0 0 400 400", width: 400, height: 400 },
    { name: "Small 200x200", viewBox: "0 0 200 200", width: 200, height: 200 },
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}`);
    console.log("   " + "=".repeat(scenario.name.length));

    const analysis = ViewportDebugger.analyzeViewport(
      heartCommands,
      scenario.viewBox,
      scenario.width,
      scenario.height
    );

    console.log(
      `   Content bounds: ${analysis.bounds.width.toFixed(1)} x ${analysis.bounds.height.toFixed(1)}`
    );
    console.log(`   ViewBox: ${scenario.viewBox}`);
    console.log(`   Issues found: ${analysis.issues.length}`);

    analysis.issues.forEach((issue, i) => {
      console.log(
        `     ${i + 1}. ${issue.type} (${issue.severity}): ${issue.description}`
      );
      console.log(`        💡 ${issue.suggestion}`);
    });

    if (analysis.issues.length === 0) {
      console.log("     ✅ No issues detected!");
    }

    console.log(`   Suggested viewBox: ${analysis.suggestedViewBox}`);

    // Generate debug SVG
    const debugSvg = ViewportDebugger.generateDebugSVG(
      heartCommands,
      scenario.viewBox,
      scenario.width,
      scenario.height
    );

    const filename = `debug-heart-${scenario.name.toLowerCase().replace(/\s+/g, "-")}.svg`;
    const filepath = join(process.cwd(), "debug-output", filename);

    try {
      // Create debug-output directory if it doesn't exist
      const { mkdirSync } = require("fs");
      mkdirSync(join(process.cwd(), "debug-output"), { recursive: true });

      writeFileSync(filepath, debugSvg);
      console.log(`   📁 Debug SVG saved: ${filename}`);
    } catch (error) {
      console.log(`   ❌ Failed to save debug SVG: ${error}`);
    }
  });

  // Test the viewport fix
  console.log("\n🔧 Testing Viewport Fix");
  console.log("=======================");

  const fix = ViewportDebugger.fixViewportIssues(heartCommands, 512, 512);
  console.log(`Transform applied: ${fix.transformApplied}`);
  console.log(`New viewBox: ${fix.newViewBox}`);

  // Generate fixed SVG
  const pathData = fix.fixedCommands
    .map((cmd) => {
      if (cmd.cmd === "Z") return "Z";
      return `${cmd.cmd} ${cmd.coords.join(" ")}`;
    })
    .join(" ");

  const fixedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fix.newViewBox}" width="512" height="512">
  <path d="${pathData}" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
</svg>`;

  try {
    const fixedFilepath = join(
      process.cwd(),
      "debug-output",
      "fixed-heart.svg"
    );
    writeFileSync(fixedFilepath, fixedSvg);
    console.log("📁 Fixed SVG saved: fixed-heart.svg");
  } catch (error) {
    console.log(`❌ Failed to save fixed SVG: ${error}`);
  }

  console.log("\n✨ Viewport debugging complete!");
  console.log("Check the debug-output/ directory for generated SVG files.");
  console.log("\nTips for fixing viewport issues:");
  console.log("• Red shape = your content");
  console.log("• Blue dashed box = content bounding box");
  console.log("• Green dashed box = current viewBox");
  console.log("• If red extends beyond green, you have clipping!");
}

if (require.main === module) {
  main();
}
