// LLM Verification Module
// This module handles calling OpenAI GPT to verify misinformation flags

/**
 * Build verification prompt for LLM
 */
function buildVerificationPrompt(flagType, selectedText, pageUrl) {
  return `You are a fact-checking assistant. A user has flagged the following content as "${flagType}" on the webpage: ${pageUrl}

**Content flagged by user:**
"""
${selectedText}
"""

**Your task:**
1. Use web search to find current, authoritative information about this claim
2. Assess whether the user's flagging as "${flagType}" is accurate based on what you find
3. Determine if this content is genuinely problematic or was flagged in error
4. Provide your assessment with the actual sources you found via web search

**Important guidelines:**
- MUST use web search to verify claims - don't rely only on training data
- Only agree with the flag if the content is clearly ${flagType}
- Consider the context - satire, opinion, and speculation are NOT misinformation
- Provide 2-3 credible source URLs from your web search results
- Sources should be reputable fact-checking sites, news outlets, or authoritative organizations

Please respond with your assessment in the following JSON format:
{
  "agrees_with_flag": boolean,  // true if you agree the content is ${flagType}, false if flagged in error
  "reasoning": string,           // Brief explanation of your assessment (2-3 sentences)
  "sources": [                   // Array of source URLs that support your assessment
    {
      "url": string,
      "title": string,
      "relevance": string        // Brief note on how this source is relevant
    }
  ]
}`;
}

/**
 * Verify a flag using OpenAI GPT with web search
 * @param {Object} params - Verification parameters
 * @param {string} params.apiKey - OpenAI API key
 * @param {string} params.flagType - Type of flag (misinformation, scam, etc)
 * @param {string} params.selectedText - The content that was flagged
 * @param {string} params.pageUrl - URL of the page where content was found
 * @returns {Promise<Object>} Verification result with agrees_with_flag, confidence, reasoning, sources
 */
async function verifyFlag({ apiKey, flagType, selectedText, pageUrl }) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required for verification');
  }

  const prompt = buildVerificationPrompt(flagType, selectedText, pageUrl);

  try {
    // Call OpenAI API with structured output
    // Using GPT-5 with web search (no thinking mode for speed)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini', // GPT-5 mini with web search - fast and accurate
        messages: [
          {
            role: 'system',
            content: 'You are a fact-checking assistant with web search capabilities. Use web search to verify claims and provide accurate, well-sourced assessments.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        reasoning_effort: 'low', // Disable thinking mode for faster responses
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'verification_result',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                agrees_with_flag: {
                  type: 'boolean',
                  description: 'Whether the LLM agrees with the user flag or believes it was flagged in error'
                },
                reasoning: {
                  type: 'string',
                  description: 'Explanation of the assessment'
                },
                sources: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      url: { type: 'string' },
                      title: { type: 'string' },
                      relevance: { type: 'string' }
                    },
                    required: ['url', 'title', 'relevance'],
                    additionalProperties: false
                  }
                }
              },
              required: ['agrees_with_flag', 'reasoning', 'sources'],
              additionalProperties: false
            }
          }
        },
        max_completion_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return result;
  } catch (error) {
    console.error('Error in LLM verification:', error);
    throw error;
  }
}

/**
 * Check if LLM verification is enabled (API key is configured AND toggle is on)
 * @returns {Promise<boolean>}
 */
async function isVerificationEnabled() {
  try {
    const storage = await chrome.storage.local.get(['openaiApiKey', 'llmVerificationEnabled']);
    const hasApiKey = !!(storage.openaiApiKey && storage.openaiApiKey.trim().length > 0);
    const isToggleEnabled = storage.llmVerificationEnabled !== undefined ? storage.llmVerificationEnabled : true;
    return hasApiKey && isToggleEnabled;
  } catch (error) {
    console.error('Error checking verification status:', error);
    return false;
  }
}

/**
 * Get the configured OpenAI API key
 * @returns {Promise<string|null>}
 */
async function getApiKey() {
  try {
    const storage = await chrome.storage.local.get(['openaiApiKey']);
    return storage.openaiApiKey || null;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

// Make functions available globally for content.js
window.LLMVerifier = {
  verifyFlag,
  isVerificationEnabled,
  getApiKey
};
