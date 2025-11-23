/**
 * Misinformation Scanner Module
 * Scans webpage text for potential misinformation using AI
 */

// Simple recursive character text splitter (LangChain-inspired)
class RecursiveCharacterTextSplitter {
  constructor({ chunkSize = 1000, chunkOverlap = 200 }) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    // Split by paragraphs, then sentences, then words
    this.separators = ['\n\n', '\n', '. ', ' ', ''];
  }

  splitText(text) {
    const chunks = [];
    this._splitTextRecursive(text, chunks, 0);
    return chunks;
  }

  _splitTextRecursive(text, chunks, separatorIndex) {
    if (!text || text.trim().length === 0) {
      return;
    }

    // If text is small enough, add it as a chunk
    if (text.length <= this.chunkSize) {
      chunks.push(text.trim());
      return;
    }

    // Try current separator
    const separator = this.separators[separatorIndex];
    const splits = separator ? text.split(separator) : [text];

    let currentChunk = '';
    for (let i = 0; i < splits.length; i++) {
      const piece = splits[i];
      const testChunk = currentChunk + (currentChunk ? separator : '') + piece;

      if (testChunk.length <= this.chunkSize) {
        currentChunk = testChunk;
      } else {
        // Save current chunk if it exists
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        // If single piece is too large, try next separator
        if (piece.length > this.chunkSize) {
          if (separatorIndex < this.separators.length - 1) {
            this._splitTextRecursive(piece, chunks, separatorIndex + 1);
            currentChunk = '';
          } else {
            // Force split by character if we've exhausted separators
            for (let j = 0; j < piece.length; j += this.chunkSize) {
              chunks.push(piece.substring(j, j + this.chunkSize).trim());
            }
            currentChunk = '';
          }
        } else {
          currentChunk = piece;
        }
      }
    }

    // Add remaining chunk
    if (currentChunk && currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
  }
}

/**
 * Extract text content from webpage
 */
function extractPageText() {
  // Use innerText to get visible text without HTML tags
  const text = document.body.innerText;
  return text;
}

/**
 * Normalize text for matching (handle whitespace differences)
 */
function normalizeText(text) {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\n+/g, ' '); // Replace newlines with spaces
}

/**
 * Build prompt for LLM misinformation detection
 */
function buildMisinfoDetectionPrompt(textChunk, pageUrl) {
  return `You are a fact-checking assistant. Analyze the following text for potential misinformation.

**IMPORTANT**: Only flag content as suspicious if you are CERTAIN it contains false or misleading information. Be very conservative - when in doubt, do NOT flag.

Text to analyze:
"""
${textChunk}
"""

Page URL: ${pageUrl}

Analyze this text carefully. Use web search to verify any factual claims if needed.

Answer this question: **Are you sure this is suspicious/misinformation?**

Only answer YES (true) if:
1. The text contains demonstrably false factual claims
2. You are highly confident it's misinformation
3. You can provide credible sources contradicting the claims

Respond with a JSON object with this exact structure:
{
  "is_suspicious": boolean,
  "reasoning": "Brief explanation of why this is or isn't suspicious",
  "sources": ["URL1", "URL2"] (credible sources supporting your assessment)
}`;
}

/**
 * Check text chunk for misinformation using LLM
 */
async function checkChunkForMisinformation({ apiKey, textChunk, pageUrl }) {
  const prompt = buildMisinfoDetectionPrompt(textChunk, pageUrl);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a careful fact-checking assistant. Only flag content as misinformation when you are highly confident.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'misinformation_check',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                is_suspicious: {
                  type: 'boolean',
                  description: 'Whether the text is suspicious/misinformation'
                },
                reasoning: {
                  type: 'string',
                  description: 'Explanation for the assessment'
                },
                sources: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'URLs of credible sources'
                }
              },
              required: ['is_suspicious', 'reasoning', 'sources'],
              additionalProperties: false
            }
          }
        },
        max_completion_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return result;
  } catch (error) {
    console.error('Error checking chunk for misinformation:', error);
    throw error;
  }
}

/**
 * Scan entire page for misinformation (parallel processing)
 */
async function scanPageForMisinformation({ apiKey, onProgress }) {
  // Get all text content blocks - try multiple selectors including divs with text
  const elements = Array.from(document.querySelectorAll('p, article p, .article p, [class*="article"] p, [class*="content"] p, [class*="comment"] div, div.body p, div[class*="text"], div[class*="paragraph"]'));

  console.log(`Found ${elements.length} potential text elements`);

  // Store both element and text for later matching
  const paragraphData = elements
    .map(el => ({
      element: el,
      text: el.innerText.trim()
    }))
    .filter(item => item.text.length > 50); // Lower threshold to 50 chars

  console.log(`Filtered to ${paragraphData.length} paragraphs with >50 chars`);

  const paragraphs = paragraphData.map(item => item.text);

  if (paragraphs.length === 0) {
    throw new Error('No text content found on page. Try a different page with articles or paragraphs.');
  }

  // Scan more paragraphs - up to 20
  const paragraphsToScan = paragraphs.slice(0, 20);

  console.log(`Scanning ${paragraphsToScan.length} paragraphs for misinformation in parallel...`);

  // Process all paragraphs in parallel
  const promises = paragraphsToScan.map(async (paragraph, i) => {
    try {
      console.log(`Checking paragraph ${i + 1}: "${paragraph.substring(0, 80)}..."`);

      const result = await checkChunkForMisinformation({
        apiKey,
        textChunk: paragraph,
        pageUrl: window.location.href
      });

      console.log(`Paragraph ${i + 1} result:`, result.is_suspicious ? 'SUSPICIOUS ⚠️' : 'OK ✓');

      // Report progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: paragraphsToScan.length,
          chunk: paragraph.substring(0, 100) + '...'
        });
      }

      // Only include chunks flagged as suspicious
      if (result.is_suspicious) {
        console.log(`→ Will preflag: "${paragraph.substring(0, 80)}..."`);
        console.log(`→ Reasoning: ${result.reasoning}`);
        return {
          chunk: paragraph,
          normalizedChunk: normalizeText(paragraph),
          reasoning: result.reasoning,
          sources: result.sources || []
        };
      }
      return null;
    } catch (error) {
      console.error(`Error processing paragraph ${i}:`, error);
      return null;
    }
  });

  // Wait for all checks to complete
  const allResults = await Promise.all(promises);

  // Filter out null results
  const results = allResults.filter(r => r !== null);

  console.log(`Parallel scan complete. Found ${results.length} suspicious paragraphs.`);

  return results;
}

// Export to global scope
window.MisinfoScanner = {
  scanPageForMisinformation,
  extractPageText,
  normalizeText,
  RecursiveCharacterTextSplitter
};
