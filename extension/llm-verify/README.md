# LLM Verification Module

This isolated module handles AI-powered verification of misinformation flags using OpenAI's GPT with web search capabilities.

## Overview

When a user flags content as "misinformation" or "scam", this module can optionally verify the claim using an LLM before saving the flag to the database. This helps reduce false positives and provides users with fact-checking assistance.

## Features

- **BYOK (Bring Your Own Key)**: Users provide their own OpenAI API key
- **Web Search Integration**: Uses GPT with web search to verify claims against real sources
- **Structured Output**: Returns standardized verification results with sources
- **User Confirmation**: If LLM disagrees with the flag, user is prompted to confirm
- **Isolated Design**: Module is self-contained for easy maintenance and testing

## Files

- `verifier.js` - Main verification logic and API calls
- `prompt-template.js` - Prompt template for LLM verification
- `README.md` - This file

## Usage

### Setup

1. User enters OpenAI API key in extension settings
2. Key is stored securely in `chrome.storage.local`

### Verification Flow

```javascript
import { verifyFlag, isVerificationEnabled, getApiKey } from './llm-verify/verifier.js';

// Check if verification is enabled
const enabled = await isVerificationEnabled();

if (enabled) {
  const apiKey = await getApiKey();

  // Verify the flag
  const result = await verifyFlag({
    apiKey,
    flagType: 'misinformation',
    selectedText: 'Content to verify',
    pageUrl: 'https://example.com'
  });

  // Result contains:
  // - agrees_with_flag: boolean (true = agrees, false = flagged in error)
  // - reasoning: string
  // - sources: array of {url, title, relevance}
}
```

### Integration Points

The module is integrated into the content script at:

1. **Flag Submission** (`content.js:submitFlag()`):
   - Before saving to database, calls `verifyFlag()` if enabled
   - Only runs for "misinformation" and "scam" flag types

2. **User Confirmation** (`content.js:showConfirmationDialog()`):
   - If LLM disagrees, shows dialog with reasoning and sources
   - User can confirm or cancel the flag

## API Model

Currently configured to use: `gpt-5-mini`

This model provides:
- **Web search capabilities** - searches the internet in real-time
- Fast verification without thinking mode (reasoning_effort: low)
- Structured JSON output
- 45% less factual errors than GPT-4o with search enabled
- Cost-effective at scale

**Key Features**:
- Real-time web search during verification
- Returns actual sources found via search
- No extended reasoning for faster responses
- Accurate fact-checking with current information

## Data Storage

Verification results are stored in the database alongside flags:

```sql
llm_verified: boolean           -- Whether LLM verification was performed
llm_agrees: boolean             -- Whether LLM agreed with the flag (true) or believes it was flagged in error (false)
llm_reasoning: text             -- LLM's explanation
llm_sources: text               -- JSON array of sources
user_confirmed_despite_llm: boolean  -- User flagged anyway despite LLM disagreement
llm_error: text                 -- Error message if verification failed
```

## Error Handling

If LLM verification fails:
- Error is caught and logged
- User is notified with a warning message
- Flag proceeds without verification
- Error is stored in `llm_error` field

## Privacy & Security

- API keys are stored locally in browser storage only
- Keys are never transmitted to any server except OpenAI
- Keys are never included in flags or database records
- Users have full control over when verification runs

## Configuration

To modify the prompt template, edit `prompt-template.js`.

To change the model or parameters, edit the `verifyFlag()` function in `verifier.js`.

## Testing

Before deployment, test with:
1. Valid misinformation (should agree with flag)
2. False positive (should disagree with flag)
3. Edge cases (satire, opinion, etc.)
4. API errors (invalid key, rate limits)

## Future Enhancements

- [ ] Support for multiple LLM providers (Anthropic, Google, etc.)
- [ ] Caching of verification results to reduce API costs
- [ ] Batch verification for multiple flags
- [ ] Configurable confidence thresholds
- [ ] User feedback on verification accuracy
