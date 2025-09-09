# SVG AI Code Generator

An AI-powered web application that transforms natural language prompts into accurate, sanitized SVG markup. The system provides live preview, copyable code output, and structured metadata about generated SVGs.

## Features

- 🎨 **Natural Language to SVG**: Convert text descriptions into SVG graphics
- 🤖 **Dual Generation Methods**: Rule-based fallback and OpenAI-powered generation
- 🔒 **Security First**: Comprehensive SVG sanitization and validation
- 👀 **Live Preview**: Real-time SVG rendering and preview
- 📋 **Copy & Export**: Easy code copying and file download
- 🎯 **Customizable**: Size presets, color palettes, and deterministic seeds
- 📚 **OpenAPI Documentation**: Full API documentation with Swagger UI

## Tech Stack

**Frontend:**

- Vue 3 with Composition API
- Vite for fast development
- TailwindCSS for styling
- TypeScript for type safety

**Backend:**

- Bun runtime
- Hono web framework
- OpenAI API integration
- Zod for validation
- OpenAPI/Swagger documentation

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed
- OpenAI API key (optional, for LLM generation)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd svg-ai
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

4. Start the development servers:

Frontend:

```bash
bun run dev
```

Backend (in another terminal):

```bash
bun run dev:server
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required for LLM generation (optional)
OPENAI_API_KEY=your_openai_api_key_here

# Server configuration
PORT=3001
NODE_ENV=development
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:3001/docs
- **OpenAPI Spec**: http://localhost:3001/openapi.json

## Usage

### Basic Generation

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A blue circle with red border",
    "size": {"width": 400, "height": 400},
    "model": "rule-based"
  }'
```

### With OpenAI (LLM)

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A modern logo with geometric shapes",
    "size": {"width": 200, "height": 200},
    "palette": ["#3B82F6", "#1E40AF", "#1D4ED8"],
    "model": "llm",
    "seed": 12345
  }'
```

## Development

### Available Scripts

```bash
# Frontend development
bun run dev

# Backend development
bun run dev:server

# Run tests
bun test

# Build for production
bun run build

# Preview production build
bun run preview
```

### Project Structure

```
svg-ai/
├── src/                    # Vue frontend
│   ├── components/         # Vue components
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── server/                # Bun backend
│   ├── api/               # API routes
│   ├── services/          # Business logic
│   ├── schemas/           # OpenAPI schemas
│   └── types/             # Server types
├── tests/                 # Test files
│   └── unit/              # Unit tests
└── docs/                  # Documentation
```

### Testing

Run the test suite:

```bash
# All tests
bun test

# Specific test file
bun test tests/unit/SVGSanitizer.test.ts

# Watch mode
bun test --watch
```

## Generation Methods

### Rule-Based Generation

- Fast, deterministic generation
- Pattern matching on keywords
- Supports: circles, rectangles, triangles, stars, icons, patterns
- Always available as fallback

### LLM Generation (OpenAI)

- Advanced natural language understanding
- Creative and complex designs
- Requires OpenAI API key
- Falls back to rule-based on failure

## Security

The application implements comprehensive security measures:

- **SVG Sanitization**: Removes scripts, event handlers, and unsafe elements
- **Input Validation**: Zod schemas for all API inputs
- **CORS Protection**: Configured for development origins
- **Content Security**: Only allows safe SVG elements and attributes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details
