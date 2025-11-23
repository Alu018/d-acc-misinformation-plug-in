/**
 * Tests for LLM Verification Module
 * Run these tests to ensure the verification feature works correctly
 */

describe('LLM Verification', () => {
  let mockChrome;

  beforeEach(() => {
    // Mock Chrome storage API
    mockChrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };
    global.chrome = mockChrome;

    // Load the verifier module
    require('../llm-verify/verifier.js');
  });

  describe('isVerificationEnabled', () => {
    it('should return true when API key is set', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        openaiApiKey: 'sk-test123'
      });

      const enabled = await window.LLMVerifier.isVerificationEnabled();
      expect(enabled).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        openaiApiKey: ''
      });

      const enabled = await window.LLMVerifier.isVerificationEnabled();
      expect(enabled).toBe(false);
    });

    it('should return false when API key is only whitespace', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        openaiApiKey: '   '
      });

      const enabled = await window.LLMVerifier.isVerificationEnabled();
      expect(enabled).toBe(false);
    });

    it('should return false when API key is not set', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});

      const enabled = await window.LLMVerifier.isVerificationEnabled();
      expect(enabled).toBe(false);
    });

    it('should return false on error', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const enabled = await window.LLMVerifier.isVerificationEnabled();
      expect(enabled).toBe(false);
    });
  });

  describe('getApiKey', () => {
    it('should return API key when set', async () => {
      const testKey = 'sk-test123';
      mockChrome.storage.local.get.mockResolvedValue({
        openaiApiKey: testKey
      });

      const key = await window.LLMVerifier.getApiKey();
      expect(key).toBe(testKey);
    });

    it('should return null when API key is not set', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});

      const key = await window.LLMVerifier.getApiKey();
      expect(key).toBeNull();
    });

    it('should return null on error', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const key = await window.LLMVerifier.getApiKey();
      expect(key).toBeNull();
    });
  });

  describe('verifyFlag', () => {
    let mockFetch;

    beforeEach(() => {
      mockFetch = jest.fn();
      global.fetch = mockFetch;
    });

    it('should throw error when API key is missing', async () => {
      await expect(
        window.LLMVerifier.verifyFlag({
          apiKey: '',
          flagType: 'misinformation',
          selectedText: 'Test content',
          pageUrl: 'https://example.com'
        })
      ).rejects.toThrow('OpenAI API key is required');
    });

    it('should call OpenAI API with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                agrees_with_flag: true,
                reasoning: 'This is misinformation',
                sources: [
                  {
                    url: 'https://factcheck.org/article',
                    title: 'Fact Check Article',
                    relevance: 'Debunks this claim'
                  }
                ]
              })
            }
          }]
        })
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await window.LLMVerifier.verifyFlag({
        apiKey: 'sk-test123',
        flagType: 'misinformation',
        selectedText: 'Earth is flat',
        pageUrl: 'https://example.com'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-test123'
          })
        })
      );

      expect(result.agrees_with_flag).toBe(true);
      expect(result.sources).toHaveLength(1);
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'Invalid API key'
          }
        })
      };

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        window.LLMVerifier.verifyFlag({
          apiKey: 'sk-invalid',
          flagType: 'misinformation',
          selectedText: 'Test',
          pageUrl: 'https://example.com'
        })
      ).rejects.toThrow('Invalid API key');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        window.LLMVerifier.verifyFlag({
          apiKey: 'sk-test123',
          flagType: 'misinformation',
          selectedText: 'Test',
          pageUrl: 'https://example.com'
        })
      ).rejects.toThrow('Network error');
    });
  });
});

/**
 * Manual Test Cases
 * Run these manually in the browser console
 */
console.log(`
=== Manual Test Cases for LLM Verification ===

1. Test without API key:
   - Open extension settings
   - Leave OpenAI API Key field empty
   - Try to flag content as misinformation
   - Expected: Should flag normally without verification

2. Test with API key:
   - Open extension settings
   - Enter a valid OpenAI API key
   - Save settings
   - Expected: Status shows "✓ Enabled"

3. Test loading indicator:
   - With API key configured
   - Flag some text as misinformation
   - Expected: Should show "Verifying..." dialog with spinner

4. Test LLM agrees:
   - Flag obvious misinformation (e.g., "The Earth is flat")
   - Expected: Should save flag directly without confirmation dialog

5. Test LLM disagrees:
   - Flag something that's not misinformation
   - Expected: Should show confirmation dialog with reasoning and sources
   - Should allow user to confirm or cancel

6. Test error handling:
   - Use an invalid API key
   - Try to flag content
   - Expected: Should show error notification and proceed without verification

7. Test different flag types:
   - Flag content as "scam" with API key
   - Expected: Should verify
   - Flag content as "other" with API key
   - Expected: Should NOT verify (only misinformation and scam are verified)
`);
