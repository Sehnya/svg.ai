import { JSDOM } from "jsdom";
import type { LayerInfo } from "../types";

export class LayerAnalyzerTest2 {
  private dom: JSDOM;

  constructor() {
    this.dom = new JSDOM();
  }

  test(): LayerInfo {
    return {
      id: "test",
      label: "Test",
      type: "shape",
    };
  }
}
