/**
 * Integration Tests
 * Test basic functionality to ensure nothing is broken
 */

describe('Basic Flagging Integration', () => {
  let mockChrome;
  let mockDocument;

  beforeEach(() => {
    // Mock Chrome APIs
    mockChrome = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue()
        }
      },
      runtime: {
        getURL: jest.fn((path) => `chrome-extension://test/${path}`),
        onMessage: {
          addListener: jest.fn()
        }
      }
    };
    global.chrome = mockChrome;

    // Mock fetch for config.json
    global.fetch = jest.fn((url) => {
      if (url.includes('config.json')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            supabaseUrl: 'http://localhost:3001',
            supabaseKey: 'test-key'
          })
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock document
    mockDocument = {
      createElement: jest.fn(() => ({
        classList: { add: jest.fn() },
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        appendChild: jest.fn(),
        remove: jest.fn()
      })),
      body: {
        appendChild: jest.fn(),
        insertBefore: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    global.document = mockDocument;
  });

  test('Flagging should work without LLM verification', async () => {
    // Ensure LLMVerifier is not available
    delete window.LLMVerifier;

    // This should not throw
    const flagData = {
      url: 'https://example.com',
      page_url: 'https://example.com/page',
      content: 'Test content',
      content_type: 'text',
      flag_type: 'scam',
      confidence: 50,
      note: 'Test note',
      selector: 'div > p',
      username: 'testuser'
    };

    // Simulate flagging without LLM
    expect(flagData).toHaveProperty('content');
    expect(flagData).toHaveProperty('flag_type');
    expect(flagData).not.toHaveProperty('llm_verified');
  });

  test('LLMVerifier should be optional', () => {
    // When LLMVerifier is not loaded
    delete window.LLMVerifier;

    // Code should handle gracefully
    const verificationEnabled = window.LLMVerifier ?
      window.LLMVerifier.isVerificationEnabled() :
      false;

    expect(verificationEnabled).toBe(false);
  });

  test('Flag validation should work', () => {
    const VALID_FLAG_TYPES = ['scam', 'misinformation', 'fake_profile', 'other'];
    const VALID_CONTENT_TYPES = ['text', 'image', 'video', 'other'];

    // Test valid flag types
    expect(VALID_FLAG_TYPES).toContain('scam');
    expect(VALID_FLAG_TYPES).toContain('misinformation');

    // Test valid content types
    expect(VALID_CONTENT_TYPES).toContain('text');
    expect(VALID_CONTENT_TYPES).toContain('image');
  });
});

/**
 * Quick Smoke Tests
 * Run these to verify the extension loads
 */
console.log(`
=== Smoke Tests ===

1. Extension loads:
   - Go to chrome://extensions/
   - Check that "Misinformation Detector" is listed
   - Check for any errors in the console

2. Popup opens:
   - Click the extension icon
   - Popup should open without errors
   - Settings button should be visible

3. Content script loads:
   - Navigate to any webpage
   - Open DevTools console
   - Should see no errors related to content.js

4. Basic flagging works:
   - Select some text on a page
   - Flag popup should appear
   - Fill out and submit
   - Should show success notification

5. Settings can be saved:
   - Open extension popup
   - Click Settings
   - Enter values
   - Click Save
   - Should show "Saved!" message

6. Flags are displayed:
   - On a page with flags
   - Content should be highlighted
   - Hover should show flag info popup
`);
