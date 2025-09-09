try {
  console.log("Attempting to import LayerAnalyzer...");
  const module = await import("./server/services/LayerAnalyzer.ts");
  console.log("Module imported:", Object.keys(module));

  if (module.LayerAnalyzer) {
    console.log("LayerAnalyzer found in module");
    const analyzer = new module.LayerAnalyzer();
    console.log("LayerAnalyzer instance created successfully");
  } else {
    console.log("LayerAnalyzer not found in module");
  }
} catch (error) {
  console.error("Error importing LayerAnalyzer:", error);
}
