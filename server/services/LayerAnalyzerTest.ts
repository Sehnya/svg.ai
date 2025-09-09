import { JSDOM } from "jsdom";

export class LayerAnalyzerTest {
  private dom: JSDOM;

  constructor() {
    this.dom = new JSDOM();
  }

  test(): string {
    return "JSDOM import works";
  }
}
