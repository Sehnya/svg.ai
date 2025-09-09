console.log("Starting fresh test...");

// Import the LayerAnalyzer
import { LayerAnalyzer } from "./server/services/LayerAnalyzer.ts";

console.log("LayerAnalyzer imported successfully");

const analyzer = new LayerAnalyzer();
console.log("LayerAnalyzer instance created");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <rect x="10" y="10" width="180" height="80" rx="10" ry="10" fill="#FF0000" id="rounded-rect"/>
</svg>`;

console.log("About to call analyze...");
const layers = analyzer.analyze(svg);
console.log("Analyze completed");
console.log("Result:", JSON.stringify(layers, null, 2));
