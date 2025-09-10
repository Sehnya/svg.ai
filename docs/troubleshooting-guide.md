# Troubleshooting Guide

## Common Issues and Solutions

### Generation Failures

#### Issue: "Generation failed with no fallback"

**Symptoms:**

- API returns 500 error
- Error message: "All generation methods failed"
- No SVG output

**Causes:**

- OpenAI API key missing or invalid
- All generation methods disabled
- Network connectivity issues

**Solutions:**

1. Check OpenAI API key configuration:

   ```bash
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

2. Verify feature flags:

   ```bash
   curl https://your-domain.com/api/config/feature-flags \
        -H "Authorization: Bearer $ADMIN_API_KEY"
   ```

3. Enable fallback generation:
   ```json
   {
     "prompt": "Your prompt",
     "fallbackEnabled": true,
     "model": "pipeline"
   }
   ```

#### Issue: "Invalid prompt" error

**Symptoms:**

- 400 error response
- Error code: `INVALID_PROMPT`

**Causes:**

- Prompt too short (< 1 character)
- Prompt too long (> 500 characters)
- Empty or whitespace-only prompt

**Solutions:**

1. Validate prompt length:

   ```javascript
   function validatePrompt(prompt) {
     const trimmed = prompt.trim();
     if (trimmed.length < 1) {
       throw new Error("Prompt cannot be empty");
     }
     if (trimmed.length > 500) {
       throw new Error("Prompt too long (max 500 characters)");
     }
     return trimmed;
   }
   ```

2. Sanitize input:
   ```javascript
   const cleanPrompt = prompt
     .replace(/[^\w\s\-.,!?]/g, "") // Remove special characters
     .substring(0, 500) // Truncate if too long
     .trim();
   ```

#### Issue: Poor quality SVG output

**Symptoms:**

- SVG renders but looks incorrect
- Layout quality score < 50
- Coordinates out of bounds

**Causes:**

- Vague or ambiguous prompts
- Conflicting style requirements
- AI model limitations

**Solutions:**

1. Use more specific prompts:

   ```javascript
   // Bad
   const prompt = "A thing";

   // Good
   const prompt = "A red house with a triangular roof and two square windows";
   ```

2. Provide color palette:

   ```json
   {
     "prompt": "A landscape scene",
     "palette": ["#87CEEB", "#228B22", "#8B4513", "#FFD700"]
   }
   ```

3. Enable coordinate repair:
   ```json
   {
     "prompt": "Your prompt",
     "model": "unified",
     "debug": true
   }
   ```

### A/B Testing Issues

#### Issue: Inconsistent A/B test assignments

**Symptoms:**

- Same user gets different groups across sessions
- A/B test distribution doesn't match configuration

**Causes:**

- User ID not provided consistently
- Configuration changes during active tests
- Caching issues

**Solutions:**

1. Always provide consistent user ID:

   ```javascript
   // Store user ID in localStorage or session
   const userId = localStorage.getItem("userId") || generateUserId();
   localStorage.setItem("userId", userId);

   const result = await generateSVG(prompt, { userId });
   ```

2. Verify assignment consistency:

   ```javascript
   async function verifyAssignment(userId) {
     const assignment1 = await getABTestAssignment(userId);
     const assignment2 = await getABTestAssignment(userId);

     if (assignment1.group !== assignment2.group) {
       console.error("Inconsistent A/B test assignment!");
     }
   }
   ```

3. Check configuration:
   ```bash
   curl https://your-domain.com/api/config/feature-flags \
        -H "Authorization: Bearer $ADMIN_API_KEY"
   ```

#### Issue: A/B test groups don't sum to 100%

**Symptoms:**

- 400 error when updating configuration
- Error: "A/B test group percentages must sum to 100"

**Solution:**

```json
{
  "unifiedGeneration": {
    "abTestGroups": {
      "unified": 50,
      "traditional": 30,
      "control": 20
    }
  }
}
```

### Performance Issues

#### Issue: Slow generation times

**Symptoms:**

- Generation takes > 10 seconds
- Timeout errors
- Poor user experience

**Causes:**

- Complex prompts requiring multiple AI calls
- Network latency to AI services
- Server overload

**Solutions:**

1. Implement client-side caching:

   ```javascript
   const cache = new Map();

   async function cachedGenerate(prompt, options) {
     const key = JSON.stringify({ prompt, ...options });

     if (cache.has(key)) {
       return cache.get(key);
     }

     const result = await generateSVG(prompt, options);
     cache.set(key, result);

     return result;
   }
   ```

2. Use appropriate timeouts:

   ```javascript
   const controller = new AbortController();
   setTimeout(() => controller.abort(), 15000); // 15 second timeout

   const response = await fetch("/api/generate", {
     method: "POST",
     signal: controller.signal,
     body: JSON.stringify(request),
   });
   ```

3. Show progress indicators:
   ```javascript
   async function generateWithProgress(prompt, onProgress) {
     onProgress("Initializing...");

     const response = await fetch("/api/generate", {
       method: "POST",
       body: JSON.stringify({ prompt, debug: true }),
     });

     onProgress("Processing...");
     const result = await response.json();

     onProgress("Complete!");
     return result;
   }
   ```

#### Issue: Rate limiting errors

**Symptoms:**

- 429 error responses
- Error code: `RATE_LIMITED`
- Requests blocked

**Solutions:**

1. Implement exponential backoff:

   ```javascript
   async function retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (error.code !== "RATE_LIMITED" || i === maxRetries - 1) {
           throw error;
         }

         const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
         await new Promise((resolve) => setTimeout(resolve, delay));
       }
     }
   }
   ```

2. Implement request queuing:

   ```javascript
   class RequestQueue {
     constructor(maxConcurrent = 3, delayMs = 1000) {
       this.queue = [];
       this.active = 0;
       this.maxConcurrent = maxConcurrent;
       this.delayMs = delayMs;
     }

     async add(fn) {
       return new Promise((resolve, reject) => {
         this.queue.push({ fn, resolve, reject });
         this.process();
       });
     }

     async process() {
       if (this.active >= this.maxConcurrent || this.queue.length === 0) {
         return;
       }

       this.active++;
       const { fn, resolve, reject } = this.queue.shift();

       try {
         const result = await fn();
         resolve(result);
       } catch (error) {
         reject(error);
       } finally {
         this.active--;
         setTimeout(() => this.process(), this.delayMs);
       }
     }
   }

   const queue = new RequestQueue();
   const result = await queue.add(() => generateSVG(prompt));
   ```

### Configuration Issues

#### Issue: Feature flags not updating

**Symptoms:**

- Configuration changes don't take effect
- Old behavior persists after updates

**Causes:**

- Caching at application level
- Multiple server instances with stale config
- Browser caching

**Solutions:**

1. Force configuration reload:

   ```javascript
   // Clear local cache
   localStorage.removeItem("feature-flags-cache");

   // Fetch fresh configuration
   const config = await fetch("/api/config/feature-flags", {
     cache: "no-cache",
   });
   ```

2. Implement configuration versioning:
   ```javascript
   class ConfigManager {
     constructor() {
       this.config = null;
       this.version = null;
     }

     async getConfig() {
       const response = await fetch("/api/config/feature-flags");
       const data = await response.json();

       if (data.version !== this.version) {
         this.config = data.config;
         this.version = data.version;
         console.log("Configuration updated to version:", data.version);
       }

       return this.config;
     }
   }
   ```

#### Issue: Admin API access denied

**Symptoms:**

- 403 error when accessing configuration endpoints
- "Access denied" message

**Solutions:**

1. Check admin API key:

   ```bash
   # Test admin access
   curl -H "Authorization: Bearer $ADMIN_API_KEY" \
        https://your-domain.com/api/config/feature-flags
   ```

2. Verify environment configuration:

   ```bash
   echo $ADMIN_API_KEY
   # Should output your admin key
   ```

3. Check request headers:
   ```javascript
   const response = await fetch("/api/config/feature-flags", {
     headers: {
       Authorization: `Bearer ${adminApiKey}`,
       "Content-Type": "application/json",
     },
   });
   ```

### Integration Issues

#### Issue: CORS errors in browser

**Symptoms:**

- "Access to fetch blocked by CORS policy"
- Network errors in browser console

**Solutions:**

1. Configure CORS on server:

   ```javascript
   app.use(
     cors({
       origin: ["https://your-frontend.com", "http://localhost:3000"],
       credentials: true,
     })
   );
   ```

2. Use proxy in development:

   ```json
   // package.json
   {
     "proxy": "https://your-api-domain.com"
   }
   ```

3. Make requests from server-side:
   ```javascript
   // Next.js API route
   export default async function handler(req, res) {
     const response = await fetch("https://your-api-domain.com/api/generate", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(req.body),
     });

     const data = await response.json();
     res.json(data);
   }
   ```

#### Issue: SVG not rendering in browser

**Symptoms:**

- SVG markup returned but not displayed
- Blank or broken images

**Causes:**

- Invalid SVG markup
- Missing namespace declarations
- CSS conflicts

**Solutions:**

1. Validate SVG markup:

   ```javascript
   function validateSVG(svgString) {
     try {
       const parser = new DOMParser();
       const doc = parser.parseFromString(svgString, "image/svg+xml");
       const errors = doc.getElementsByTagName("parsererror");

       if (errors.length > 0) {
         throw new Error("Invalid SVG markup");
       }

       return true;
     } catch (error) {
       console.error("SVG validation failed:", error);
       return false;
     }
   }
   ```

2. Ensure proper namespace:

   ```javascript
   function ensureSVGNamespace(svgString) {
     if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
       return svgString.replace(
         "<svg",
         '<svg xmlns="http://www.w3.org/2000/svg"'
       );
     }
     return svgString;
   }
   ```

3. Use proper rendering method:

   ```javascript
   // React
   <div dangerouslySetInnerHTML={{ __html: svgString }} />;

   // Vanilla JS
   document.getElementById("svg-container").innerHTML = svgString;

   // As image source
   const blob = new Blob([svgString], { type: "image/svg+xml" });
   const url = URL.createObjectURL(blob);
   img.src = url;
   ```

## Debugging Tools

### Debug Mode

Enable debug mode to get detailed information:

```json
{
  "prompt": "Your prompt",
  "debug": true
}
```

Debug response includes:

- Region boundary data
- Anchor point information
- Layout error details
- Layer structure analysis
- Performance metrics

### Health Check Endpoint

Monitor system health:

```bash
curl https://your-domain.com/health
```

Response indicates:

- Overall system status
- Component health (database, OpenAI, cache)
- Feature availability
- Version information

### Configuration Monitoring

Check current configuration:

```bash
curl https://your-domain.com/api/config/feature-flags \
     -H "Authorization: Bearer $ADMIN_API_KEY"
```

### Performance Monitoring

Track generation performance:

```javascript
function monitorPerformance(result) {
  const metrics = result.metadata?.performance;

  if (metrics) {
    console.log("Generation Time:", metrics.generationTime + "ms");
    console.log("API Time:", metrics.apiTime + "ms");
    console.log("Processing Time:", metrics.processingTime + "ms");

    if (metrics.generationTime > 5000) {
      console.warn("Slow generation detected");
    }
  }
}
```

## Error Codes Reference

| Code                     | Description              | Retryable | Solution                       |
| ------------------------ | ------------------------ | --------- | ------------------------------ |
| `INVALID_PROMPT`         | Prompt validation failed | No        | Fix prompt length/content      |
| `INVALID_SIZE`           | Size parameters invalid  | No        | Use valid dimensions (16-2048) |
| `RATE_LIMITED`           | Rate limit exceeded      | Yes       | Implement backoff/queuing      |
| `INTERNAL_ERROR`         | Server error             | Yes       | Retry with exponential backoff |
| `API_TIMEOUT`            | AI service timeout       | Yes       | Reduce complexity or retry     |
| `INVALID_AB_TEST_CONFIG` | A/B test config invalid  | No        | Fix percentage totals          |
| `ACCESS_DENIED`          | Admin access required    | No        | Provide valid admin API key    |

## Getting Help

### Log Analysis

Enable detailed logging:

```bash
# Set log level
export LOG_LEVEL=debug

# Check logs
tail -f /var/log/svg-api.log | grep ERROR
```

### Support Information

When reporting issues, include:

1. **Request details:**

   ```json
   {
     "prompt": "Your prompt",
     "model": "unified",
     "userId": "user_123",
     "timestamp": "2024-01-15T10:30:00Z"
   }
   ```

2. **Error response:**

   ```json
   {
     "error": "Generation failed",
     "code": "INTERNAL_ERROR",
     "details": ["OpenAI API timeout"]
   }
   ```

3. **Environment information:**
   - API version
   - Client library version
   - Browser/Node.js version
   - Network configuration

4. **Steps to reproduce:**
   - Exact request parameters
   - Expected vs actual behavior
   - Frequency of occurrence

### Community Resources

- GitHub Issues: Report bugs and feature requests
- Documentation: Latest API documentation
- Examples: Sample code and integrations
- Status Page: Real-time system status

This troubleshooting guide covers the most common issues developers encounter when integrating with the SVG AI API. For additional support, refer to the API documentation or contact the development team.
