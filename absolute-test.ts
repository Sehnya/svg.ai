import { LayerAnalyzer } from "/Users/sehnya/Code 2.0/svg.ai/svg-ai/server/services/LayerAnalyzer.ts";

const analyzer = new LayerAnalyzer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <rect x="10" y="10" width="180" height="80" rx="10" ry="10" fill="#FF0000" id="rounded-rect"/>
</svg>`;

const layers = analyzer.analyze(svg);
console.log("Result:", JSON.stringify(layers, null, 2));
