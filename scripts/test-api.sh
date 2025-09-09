#!/bin/bash

echo "🚀 Testing SVG AI API..."

# Test health endpoint
echo "📋 Testing health endpoint..."
curl -s http://localhost:3001/health | jq '.'

echo -e "\n🎨 Testing rule-based generation..."
curl -s -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A red circle with blue border",
    "size": {"width": 200, "height": 200},
    "model": "rule-based"
  }' | jq '.meta'

echo -e "\n🤖 Testing OpenAI generation..."
curl -s -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A modern geometric logo with triangles and circles",
    "size": {"width": 300, "height": 300},
    "palette": ["#FF6B6B", "#4ECDC4", "#45B7D1"],
    "model": "llm",
    "seed": 42
  }' | jq '.meta'

echo -e "\n✅ API tests completed!"