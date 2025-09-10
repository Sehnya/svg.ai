# SVG AI API Documentation

## Overview

The SVG AI API provides advanced SVG generation capabilities using multiple AI-powered and rule-based methods. The system supports unified layered generation, semantic layout language, A/B testing, and comprehensive quality control.

## Base URL

```
https://your-domain.com/api
```

## Authentication

Most endpoints are public, but configuration management requires admin authentication:

```http
Authorization: Bearer YOUR_ADMIN_API_KEY
```

## Generation Methods

### Pipeline (Recommended)

The full structured generation pipeline with knowledge base integration, preference learning, and quality control.

### Unified (Experimental)

The new unified layered generation system that combines semantic layout language with structured SVG output. Features:

- Semantic regions (top_left, center, bottom_right, etc.)
- Anchor-based positioning
- Layer organization
- Layout quality scoring

### LLM

Direct OpenAI integration with structured prompting for maximum creativity.

### Rule-Based

Template-based generation for reliable fallback and consistent results.

## A/B Testing

The system automatically assigns users to test groups:

- **Unified**: 50% - Uses unified layered generation
- **Traditional**: 30% - Uses established pipeline
- **Control**: 20% - Uses rule-based generation

Assignment is consistent per user ID and respects environment-specific rollout percentages.

## Rate Limiting

- **Development**: 120 requests/minute
- **Staging**: 60 requests/minute
- **Production**: 30 requests/minute

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "details": ["Additional error details"],
  "code": "ERROR_CODE",
  "retryable": true
}
```

Common error codes:

- `INVALID_PROMPT`: Prompt validation failed
- `INVALID_SIZE`: Size parameters out of range
- `RATE_LIMITED`: Rate limit exceeded
- `INTERNAL_ERROR`: Server error
- `API_TIMEOUT`: AI service timeout

## Endpoints

### Generate SVG

Generate an SVG image from a natural language prompt.

**Endpoint:** `POST /api/generate`

**Request Body:**

```json
{
  "prompt": "A modern house with solar panels and a garden",
  "size": {
    "width": 512,
    "height": 512
  },
  "palette": ["#2563EB", "#DC2626", "#059669", "#D97706"],
  "seed": 12345,
  "model": "pipeline",
  "userId": "user_123",
  "temperature": 0.7,
  "maxRetries": 3,
  "fallbackEnabled": true,
  "debug": false,
  "aspectRatio": "1:1"
}
```

**Parameters:**

| Parameter         | Type     | Required | Description                                            |
| ----------------- | -------- | -------- | ------------------------------------------------------ |
| `prompt`          | string   | Yes      | Natural language description (1-500 chars)             |
| `size`            | object   | No       | Canvas dimensions (default: 400x400)                   |
| `size.width`      | number   | No       | Width in pixels (16-2048)                              |
| `size.height`     | number   | No       | Height in pixels (16-2048)                             |
| `palette`         | string[] | No       | Color palette as hex codes (max 10)                    |
| `seed`            | number   | No       | Random seed for reproducible generation                |
| `model`           | string   | No       | Generation method (pipeline, unified, llm, rule-based) |
| `userId`          | string   | No       | User identifier for personalization                    |
| `temperature`     | number   | No       | AI creativity level (0-2, default: 0.2)                |
| `maxRetries`      | number   | No       | Maximum retry attempts (0-5, default: 2)               |
| `fallbackEnabled` | boolean  | No       | Enable fallback methods (default: true)                |
| `debug`           | boolean  | No       | Include debug information (default: false)             |
| `aspectRatio`     | string   | No       | Canvas aspect ratio (default: "1:1")                   |

**Response:**

```json
{
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" width=\"512\" height=\"512\">...</svg>",
  "metadata": {
    "width": 512,
    "height": 512,
    "viewBox": "0 0 512 512",
    "backgroundColor": "#FFFFFF",
    "palette": ["#3B82F6", "#EF4444", "#10B981"],
    "description": "A modern house with blue walls and red roof",
    "seed": 12345,
    "generationMethod": "unified-layered",
    "layoutQuality": 87,
    "coordinatesRepaired": false,
    "fallbackUsed": false,
    "usedObjects": ["style_pack_modern", "motif_house"],
    "performance": {
      "generationTime": 1250,
      "apiTime": 800,
      "processingTime": 450
    }
  },
  "layers": [
    {
      "id": "structure",
      "label": "House Structure",
      "type": "layer",
      "element": "g",
      "attributes": {
        "id": "structure",
        "data-label": "House Structure"
      },
      "metadata": {
        "motif": "building",
        "generated": true,
        "region": "center",
        "anchor": "bottom_center"
      }
    }
  ],
  "layout": {
    "regionsUsed": ["center", "top_center"],
    "anchorsUsed": ["center", "bottom_center"],
    "aspectRatio": "1:1",
    "canvasDimensions": {
      "width": 512,
      "height": 512
    }
  },
  "warnings": [],
  "errors": [],
  "eventId": 12345,
  "abTestGroup": "unified",
  "generationMethod": "unified"
}
```

**Response Fields:**

| Field              | Type     | Description                                  |
| ------------------ | -------- | -------------------------------------------- |
| `svg`              | string   | Generated SVG markup                         |
| `metadata`         | object   | Generation metadata and metrics              |
| `layers`           | array    | Layer information for inspection/editing     |
| `layout`           | object   | Layout information (unified generation only) |
| `warnings`         | string[] | Non-critical warnings                        |
| `errors`           | string[] | Error messages (if any)                      |
| `eventId`          | number   | Event ID for feedback tracking               |
| `abTestGroup`      | string   | A/B test group assignment                    |
| `generationMethod` | string   | Actual generation method used                |
| `debug`            | object   | Debug information (when debug=true)          |

### Health Check

Check the health status of the API server.

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "2.0.0",
  "components": {
    "database": "healthy",
    "openai": "healthy",
    "cache": "healthy"
  },
  "features": {
    "unifiedGeneration": true,
    "layeredGeneration": true,
    "debugVisualization": true
  }
}
```

### Get Feature Flags

Retrieve current feature flag configuration (Admin only).

**Endpoint:** `GET /api/config/feature-flags`

**Headers:**

```http
Authorization: Bearer YOUR_ADMIN_API_KEY
```

**Response:**

```json
{
  "environment": "production",
  "config": {
    "unifiedGeneration": {
      "enabled": true,
      "rolloutPercentage": 25,
      "abTestGroups": {
        "unified": 50,
        "traditional": 30,
        "control": 20
      }
    },
    "layeredGeneration": {
      "enabled": true,
      "enableLayoutLanguage": true,
      "enableSemanticRegions": true
    },
    "debugVisualization": {
      "enabled": false,
      "enabledInProduction": false
    }
  },
  "usage": {
    "unifiedGenerationEnabled": true,
    "layeredGenerationEnabled": true,
    "debugVisualizationEnabled": false
  },
  "metrics": {
    "totalRequests": 15420,
    "abTestDistribution": {
      "unified": 7710,
      "traditional": 4626,
      "control": 3084
    },
    "averageGenerationTime": 1250,
    "fallbackUsageRate": 0.05
  }
}
```

### Update Feature Flags

Update feature flag configuration (Admin only).

**Endpoint:** `PATCH /api/config/feature-flags`

**Headers:**

```http
Authorization: Bearer YOUR_ADMIN_API_KEY
Content-Type: application/json
```

**Request Body:**

```json
{
  "unifiedGeneration": {
    "enabled": true,
    "rolloutPercentage": 50,
    "abTestGroups": {
      "unified": 60,
      "traditional": 25,
      "control": 15
    }
  },
  "debugVisualization": {
    "enabled": true
  }
}
```

### Get A/B Test Assignment

Get A/B test group assignment for a user.

**Endpoint:** `POST /api/config/ab-test-assignment`

**Request Body:**

```json
{
  "userId": "user_123"
}
```

**Response:**

```json
{
  "userId": "user_123",
  "group": "unified",
  "metadata": {
    "environment": "production",
    "assignedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Examples

### Simple Generation

Generate a basic SVG with minimal parameters:

```bash
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A red circle",
    "model": "pipeline"
  }'
```

### Advanced Generation

Generate a complex SVG with all options:

```bash
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city skyline at sunset with flying cars",
    "size": {
      "width": 512,
      "height": 512
    },
    "palette": ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"],
    "seed": 42,
    "model": "unified",
    "userId": "user_123",
    "temperature": 0.8,
    "maxRetries": 3,
    "fallbackEnabled": true,
    "debug": true,
    "aspectRatio": "16:9"
  }'
```

### Rule-Based Generation

Use rule-based generation for consistent results:

```bash
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A geometric pattern with triangles",
    "model": "rule-based",
    "size": {
      "width": 400,
      "height": 400
    },
    "palette": ["#3B82F6", "#EF4444"]
  }'
```

### Check A/B Test Assignment

```bash
curl -X POST https://your-domain.com/api/config/ab-test-assignment \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123"
  }'
```

### Update Configuration (Admin)

```bash
curl -X PATCH https://your-domain.com/api/config/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "unifiedGeneration": {
      "rolloutPercentage": 75
    }
  }'
```

## Unified Generation Features

### Semantic Layout Language

The unified generation system uses semantic layout language for consistent positioning:

**Regions:**

- `top_left`, `top_center`, `top_right`
- `middle_left`, `center`, `middle_right`
- `bottom_left`, `bottom_center`, `bottom_right`
- `full_canvas`

**Anchors:**

- `center`, `top_left`, `top_right`, `bottom_left`, `bottom_right`
- `top_center`, `bottom_center`, `middle_left`, `middle_right`

**Example Layout Specification:**

```json
{
  "region": "center",
  "anchor": "bottom_center",
  "offset": [0.1, -0.2]
}
```

### Layer Organization

SVGs are organized into logical layers:

```json
{
  "id": "background",
  "label": "Background Elements",
  "layout": {
    "region": "full_canvas",
    "zIndex": 1
  },
  "paths": [...]
}
```

### Quality Control

The system includes automatic quality control:

- Coordinate bounds checking (0-512 range)
- Path command validation (absolute commands only)
- Layout quality scoring (0-100)
- Automatic repair of common issues

Quality scores above 80 indicate high-quality layouts with proper positioning and no coordinate issues.

## Migration Guide

### From Pixel Coordinates to Layout Language

**Before (Pixel-based):**

```json
{
  "x": 256,
  "y": 128,
  "width": 100,
  "height": 50
}
```

**After (Layout Language):**

```json
{
  "region": "top_center",
  "anchor": "center",
  "size": {
    "relative": 0.2
  }
}
```

### From Basic to Unified Generation

**Before:**

```json
{
  "prompt": "A house",
  "model": "llm"
}
```

**After:**

```json
{
  "prompt": "A house with garden and solar panels",
  "model": "unified",
  "aspectRatio": "4:3",
  "debug": true
}
```

## Troubleshooting

### Common Issues

**Generation Fails:**

- Check prompt length (1-500 characters)
- Verify size parameters (16-2048 pixels)
- Enable fallback for reliability

**Poor Quality Results:**

- Use higher temperature for creativity
- Provide more specific prompts
- Include color palette for better results

**Rate Limiting:**

- Implement exponential backoff
- Cache results when possible
- Use appropriate rate limits per environment

**A/B Test Inconsistency:**

- Ensure consistent user ID usage
- Check environment configuration
- Verify rollout percentages

### Debug Mode

Enable debug mode to get additional information:

```json
{
  "prompt": "A complex scene",
  "debug": true
}
```

Debug response includes:

- Region boundary visualization data
- Anchor point information
- Layout error details
- Layer structure analysis

### Performance Optimization

**Client-side:**

- Cache SVG results
- Use appropriate canvas sizes
- Implement request deduplication

**Server-side:**

- Enable caching optimizations
- Use appropriate generation methods
- Monitor performance metrics

## Support

For technical support or questions about the API:

- Check the health endpoint for system status
- Review error codes and messages
- Enable debug mode for detailed information
- Monitor A/B test assignments for consistency

## Changelog

### Version 2.0.0

- Added unified layered generation system
- Implemented semantic layout language
- Enhanced A/B testing capabilities
- Added comprehensive quality control
- Improved error handling and fallback systems

### Version 1.0.0

- Initial API release
- Basic SVG generation
- Rule-based and LLM methods
- Simple configuration system
