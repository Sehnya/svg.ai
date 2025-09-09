// Cloudflare Pages Function - Browser-compatible API
export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/", "");

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (path === "health") {
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: "cloudflare-pages-functions",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // SVG generation endpoint
  if (path === "generate" && request.method === "POST") {
    try {
      const requestData = await request.json();

      // Validate request
      if (!requestData.prompt || !requestData.size) {
        return new Response(
          JSON.stringify({
            error: "Invalid request",
            details: ["Missing required fields: prompt, size"],
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      // Simple rule-based SVG generation (browser-compatible)
      const { prompt, size } = requestData;
      const { width, height } = size;

      // Generate a simple SVG based on the prompt
      let svgContent = "";
      const seed = requestData.seed || Math.floor(Math.random() * 1000000);

      // Simple pattern matching for shapes
      if (prompt.toLowerCase().includes("circle")) {
        const radius = Math.min(width, height) * 0.3;
        const cx = width / 2;
        const cy = height / 2;
        const color = getColorFromPrompt(prompt);

        svgContent = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" id="main-circle"></circle>`;
      } else if (
        prompt.toLowerCase().includes("square") ||
        prompt.toLowerCase().includes("rect")
      ) {
        const rectWidth = width * 0.6;
        const rectHeight = height * 0.6;
        const x = (width - rectWidth) / 2;
        const y = (height - rectHeight) / 2;
        const color = getColorFromPrompt(prompt);

        svgContent = `<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" fill="${color}" id="main-rect"></rect>`;
      } else if (prompt.toLowerCase().includes("triangle")) {
        const points = `${width / 2},${height * 0.1} ${width * 0.1},${height * 0.9} ${width * 0.9},${height * 0.9}`;
        const color = getColorFromPrompt(prompt);

        svgContent = `<polygon points="${points}" fill="${color}" id="main-triangle"></polygon>`;
      } else {
        // Default to a circle
        const radius = Math.min(width, height) * 0.3;
        const cx = width / 2;
        const cy = height / 2;
        const color = getColorFromPrompt(prompt);

        svgContent = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" id="main-shape"></circle>`;
      }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      ${svgContent}
    </svg>`;

      const response = {
        svg,
        meta: {
          width,
          height,
          viewBox: `0 0 ${width} ${height}`,
          backgroundColor: "transparent",
          palette: ["#3B82F6", "#1E40AF", "#1D4ED8"],
          description: `Generated SVG based on prompt: "${prompt}"`,
          seed,
        },
        layers: [
          {
            id: svgContent.includes('id="')
              ? svgContent.match(/id="([^"]+)"/)?.[1] || "main-shape"
              : "main-shape",
            label: "Main Shape",
            type: "shape",
          },
        ],
        warnings: [],
        errors: [],
      };

      return new Response(JSON.stringify(response), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Generation failed",
          details: [error instanceof Error ? error.message : "Unknown error"],
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  }

  // 404 for other routes
  return new Response(
    JSON.stringify({
      error: "Not found",
      details: [`API endpoint ${path} not found`],
    }),
    {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

// Helper function to extract color from prompt
function getColorFromPrompt(prompt: string): string {
  const colorMap: Record<string, string> = {
    red: "#EF4444",
    blue: "#3B82F6",
    green: "#10B981",
    yellow: "#F59E0B",
    purple: "#8B5CF6",
    pink: "#EC4899",
    orange: "#F97316",
    gray: "#6B7280",
    black: "#1F2937",
    white: "#F9FAFB",
  };

  const lowerPrompt = prompt.toLowerCase();

  for (const [color, hex] of Object.entries(colorMap)) {
    if (lowerPrompt.includes(color)) {
      return hex;
    }
  }

  // Default color
  return "#3B82F6";
}
