export interface ExportOptions {
  format: "svg" | "optimized" | "minified" | "png" | "jpeg";
  quality?: number; // For raster formats
  scale?: number; // For raster formats
  removeComments?: boolean;
  removeMetadata?: boolean;
  removeUnusedDefs?: boolean;
  minifyStyles?: boolean;
  precision?: number; // Decimal precision for numbers
}

export interface ExportResult {
  data: string | Blob;
  filename: string;
  mimeType: string;
  size: number;
}

export class SVGExporter {
  /**
   * Export SVG with various optimization options
   */
  static async exportSVG(
    svgContent: string,
    options: ExportOptions = { format: "svg" }
  ): Promise<ExportResult> {
    let processedContent = svgContent;

    switch (options.format) {
      case "optimized":
        processedContent = this.optimizeSVG(svgContent, options);
        break;
      case "minified":
        processedContent = this.minifySVG(svgContent, options);
        break;
      case "png":
      case "jpeg":
        return this.exportRaster(svgContent, options);
      default:
        processedContent = svgContent;
    }

    const blob = new Blob([processedContent], { type: "image/svg+xml" });

    return {
      data: processedContent,
      filename: this.generateFilename(options.format),
      mimeType: "image/svg+xml",
      size: blob.size,
    };
  }

  /**
   * Optimize SVG by removing unnecessary whitespace and formatting
   */
  private static optimizeSVG(svg: string, options: ExportOptions): string {
    let optimized = svg;

    // Remove comments if requested
    if (options.removeComments !== false) {
      optimized = optimized.replace(/<!--[\s\S]*?-->/g, "");
    }

    // Remove metadata if requested
    if (options.removeMetadata !== false) {
      optimized = optimized.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
      optimized = optimized.replace(/<title[\s\S]*?<\/title>/gi, "");
      optimized = optimized.replace(/<desc[\s\S]*?<\/desc>/gi, "");
    }

    // Normalize whitespace
    optimized = optimized
      .replace(/\s+/g, " ") // Multiple spaces to single space
      .replace(/>\s+</g, "><") // Remove whitespace between tags
      .replace(/\s*=\s*/g, "=") // Remove whitespace around equals
      .replace(/"\s+/g, '" ') // Normalize attribute spacing
      .trim();

    // Optimize numeric precision
    if (options.precision !== undefined) {
      optimized = this.optimizeNumericPrecision(optimized, options.precision);
    }

    // Minify inline styles if requested
    if (options.minifyStyles) {
      optimized = this.minifyInlineStyles(optimized);
    }

    return optimized;
  }

  /**
   * Aggressively minify SVG
   */
  private static minifySVG(svg: string, options: ExportOptions): string {
    let minified = this.optimizeSVG(svg, options);

    // More aggressive whitespace removal
    minified = minified
      .replace(/\s*\/>/g, "/>") // Remove space before self-closing tags
      .replace(/;\s*/g, ";") // Remove spaces after semicolons in styles
      .replace(/:\s*/g, ":") // Remove spaces after colons in styles
      .replace(/,\s*/g, ",") // Remove spaces after commas
      .replace(/\s*{\s*/g, "{") // Remove spaces around braces
      .replace(/\s*}\s*/g, "}");

    // Remove unnecessary quotes from attribute values where safe
    minified = minified.replace(/="([a-zA-Z0-9-_]+)"/g, "=$1");

    return minified;
  }

  /**
   * Export SVG as raster format (PNG/JPEG)
   */
  private static async exportRaster(
    svgContent: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    return new Promise((resolve, reject) => {
      // Create a temporary canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Create an image from the SVG
      const img = new Image();
      const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          const scale = options.scale || 1;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          // Set background color for JPEG
          if (options.format === "jpeg") {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);

              if (!blob) {
                reject(new Error("Failed to create blob"));
                return;
              }

              resolve({
                data: blob,
                filename: this.generateFilename(options.format),
                mimeType: options.format === "png" ? "image/png" : "image/jpeg",
                size: blob.size,
              });
            },
            options.format === "png" ? "image/png" : "image/jpeg",
            options.quality || 0.9
          );
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load SVG image"));
      };

      img.src = url;
    });
  }

  /**
   * Optimize numeric precision in SVG
   */
  private static optimizeNumericPrecision(
    svg: string,
    precision: number
  ): string {
    return svg.replace(/(\d+\.\d+)/g, (match) => {
      const num = parseFloat(match);
      return num.toFixed(precision).replace(/\.?0+$/, "");
    });
  }

  /**
   * Minify inline CSS styles
   */
  private static minifyInlineStyles(svg: string): string {
    return svg.replace(/style="([^"]+)"/g, (_match, styles) => {
      const minified = styles
        .replace(/\s*;\s*/g, ";")
        .replace(/\s*:\s*/g, ":")
        .replace(/;\s*$/, "") // Remove trailing semicolon
        .trim();

      return `style="${minified}"`;
    });
  }

  /**
   * Generate filename based on format
   */
  private static generateFilename(format: string): string {
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:-]/g, "");
    const extension =
      format === "optimized" || format === "minified" ? "svg" : format;
    const suffix = format === "svg" ? "" : `-${format}`;

    return `generated${suffix}-${timestamp}.${extension}`;
  }

  /**
   * Download file to user's device
   */
  static downloadFile(
    data: string | Blob,
    filename: string,
    mimeType: string
  ): void {
    const blob =
      data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Calculate compression ratio
   */
  static calculateCompressionRatio(
    originalSize: number,
    compressedSize: number
  ): number {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  }
}
