#!/usr/bin/env bun

import { OpenAIGenerator } from "../server/services/OpenAIGenerator";

async function testOpenAI() {
  try {
    console.log("🧪 Testing OpenAI integration...");

    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY not found in environment variables");
      console.log("Please add your OpenAI API key to the .env file");
      process.exit(1);
    }

    const generator = new OpenAIGenerator();

    const testRequest = {
      prompt: "A simple blue circle",
      size: { width: 100, height: 100 },
      palette: ["#0066CC"],
      seed: 12345,
      model: "llm" as const,
    };

    console.log("📝 Generating SVG with prompt:", testRequest.prompt);

    const result = await generator.generate(testRequest);

    if (result.errors.length > 0) {
      console.error("❌ Generation failed with errors:");
      result.errors.forEach((error) => console.error("  -", error));

      if (result.warnings.length > 0) {
        console.log("⚠️  Warnings:");
        result.warnings.forEach((warning) => console.log("  -", warning));
      }

      if (result.warnings.includes("Fell back to rule-based generation")) {
        console.log("✅ Fallback to rule-based generation worked correctly");
      }
    } else {
      console.log("✅ OpenAI generation successful!");
      console.log("📊 Generated SVG length:", result.svg.length, "characters");
      console.log("🎨 Layers found:", result.layers.length);

      if (result.warnings.length > 0) {
        console.log("⚠️  Warnings:");
        result.warnings.forEach((warning) => console.log("  -", warning));
      }

      // Show first 200 characters of SVG
      console.log("🖼️  SVG preview:");
      console.log(result.svg.substring(0, 200) + "...");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testOpenAI();
