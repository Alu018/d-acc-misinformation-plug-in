# Debugging the Misinformation Scanner

## Quick Test Steps

1. **Load the extension:**
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder

2. **Open a test page:**
   - Open `/tmp/test-scanner.html` or the `test-page.html` in the project folder
   - Or use any webpage with paragraphs (Wikipedia, news article, etc.)

3. **Verify extension is loaded:**
   - Open DevTools Console (F12)
   - Type: `console.log(typeof window.MisinfoScanner)`
   - Should see: `"object"`
   - Type: `console.log(typeof window.LLMVerifier)`
   - Should see: `"object"`

4. **Set API Key:**
   - Click the extension icon
   - Click "Settings"
   - Enter your OpenAI API key
   - Click "Save Settings"

5. **Run a scan:**
   - Click "Scan for Misinformation" button
   - Watch the console for logs:
     ```
     === Starting misinformation scan ===
     API key available: true
     Starting paragraph scan...
     Scanning 5 paragraphs for misinformation...
     Progress: 1/5
     Progress: 2/5
     ...
     Scan complete. Found X suspicious paragraphs.
     ```

## Common Errors & Fixes

### Error: "Scanner module not loaded"
**Fix:** Refresh the page (Ctrl+R or Cmd+R)

### Error: "API key not configured"
**Fix:**
- Click extension icon → Settings
- Enter OpenAI API key (starts with `sk-`)
- Click "Save Settings"

### Error: "No paragraphs found on page"
**Fix:** Make sure the page has `<p>` tags with text content (>100 chars)

### Error: "OpenAI API error: 401"
**Fix:** Your API key is invalid or expired. Get a new one from platform.openai.com

### Error: "OpenAI API error: 429"
**Fix:** Rate limit exceeded. Wait a few seconds and try again.

## How the Scan Works

1. **Finds paragraphs:** Scans first 5 `<p>` elements with >100 characters
2. **Sends to LLM:** Each paragraph is checked by GPT-4o-mini
3. **Filters results:** Only flags items with confidence ≥ 80%
4. **Highlights:** Adds pink dashed border to suspicious paragraphs
5. **Saves to DB:** Stores with `ai_verification_status: 'ai_detected'`
6. **Shows tooltip:** Hover to see AI reasoning and sources

## Testing Without Real API

To test the UI without calling OpenAI:

1. Open `extension/scanner.js`
2. Replace the `checkChunkForMisinformation` function with:
   ```javascript
   async function checkChunkForMisinformation({ apiKey, textChunk, pageUrl }) {
     // MOCK RESPONSE FOR TESTING
     return {
       is_misinformation: true,
       confidence: 85,
       reasoning: "This is a mock detection for testing purposes.",
       sources: ["https://example.com/fact-check"]
     };
   }
   ```
3. Reload extension
4. Run scan - it will flag all paragraphs

## Console Commands

Test individual components:

```javascript
// Check if modules loaded
window.MisinfoScanner
window.LLMVerifier

// Get paragraph count
document.querySelectorAll('p').length

// Test text extraction
window.MisinfoScanner.extractPageText()

// Test normalization
window.MisinfoScanner.normalizeText("  Hello   World  ")
```
