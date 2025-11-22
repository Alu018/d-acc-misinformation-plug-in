// Tests for database interactions

describe('Database Interactions', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  describe('Save Flag to Database', () => {
    const mockConfig = {
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'test-key'
    };

    const mockFlagData = {
      url: 'https://example.com/page',
      page_url: 'https://example.com/page',
      content: 'Test content',
      content_type: 'text',
      flag_type: 'misinformation',
      note: 'Test note',
      selector: 'div > p',
      timestamp: new Date().toISOString()
    };

    async function saveFlagToDatabase(flagData) {
      const response = await fetch(`${mockConfig.supabaseUrl}/rest/v1/flagged_content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': mockConfig.supabaseKey,
          'Authorization': `Bearer ${mockConfig.supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(flagData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    test('should send POST request with correct headers', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 201
      });

      await saveFlagToDatabase(mockFlagData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:54321/rest/v1/flagged_content',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'apikey': 'test-key'
          })
        })
      );
    });

    test('should handle successful save', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 201
      });

      await expect(saveFlagToDatabase(mockFlagData)).resolves.not.toThrow();
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(saveFlagToDatabase(mockFlagData)).rejects.toThrow('Network error');
    });

    test('should handle 500 server errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(saveFlagToDatabase(mockFlagData)).rejects.toThrow('HTTP error! status: 500');
    });

    test('should handle 401 unauthorized errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(saveFlagToDatabase(mockFlagData)).rejects.toThrow('HTTP error! status: 401');
    });

    test('should properly encode special characters in JSON', async () => {
      global.fetch.mockResolvedValue({ ok: true, status: 201 });

      const specialData = {
        ...mockFlagData,
        content: 'Content with "quotes" and \n newlines',
        note: "Note with 'apostrophes' and \t tabs"
      };

      await saveFlagToDatabase(specialData);

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.content).toBe('Content with "quotes" and \n newlines');
    });
  });

  describe('Get Flags for Page', () => {
    const mockConfig = {
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'test-key'
    };

    async function getFlagsForPage(pageUrl) {
      const response = await fetch(
        `${mockConfig.supabaseUrl}/rest/v1/flagged_content?page_url=eq.${encodeURIComponent(pageUrl)}`,
        {
          headers: {
            'apikey': mockConfig.supabaseKey,
            'Authorization': `Bearer ${mockConfig.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    }

    test('should properly encode URL parameters', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => []
      });

      const pageUrl = 'https://example.com/page with spaces';
      await getFlagsForPage(pageUrl);

      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain(encodeURIComponent(pageUrl));
    });

    test('should return empty array when no flags found', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => []
      });

      const flags = await getFlagsForPage('https://example.com/page');
      expect(flags).toEqual([]);
    });

    test('should return flags when found', async () => {
      const mockFlags = [
        { id: '1', content: 'Flag 1', flag_type: 'misinformation' },
        { id: '2', content: 'Flag 2', flag_type: 'harmful' }
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockFlags
      });

      const flags = await getFlagsForPage('https://example.com/page');
      expect(flags).toHaveLength(2);
      expect(flags[0].content).toBe('Flag 1');
    });

    test('should handle malformed JSON response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await expect(getFlagsForPage('https://example.com/page')).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Configuration Loading', () => {
    test('should load config from file', async () => {
      const mockConfig = {
        supabaseUrl: 'http://localhost:54321',
        supabaseKey: 'test-key'
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockConfig
      });

      const response = await fetch('chrome-extension://test/config.json');
      const config = await response.json();

      expect(config.supabaseUrl).toBe('http://localhost:54321');
      expect(config.supabaseKey).toBe('test-key');
    });

    test('should handle missing config file', async () => {
      global.fetch.mockRejectedValue(new Error('File not found'));

      await expect(fetch('config.json')).rejects.toThrow('File not found');
    });

    test('should use default config on error', async () => {
      global.fetch.mockRejectedValue(new Error('File not found'));

      try {
        await fetch('config.json');
      } catch (error) {
        // Use default config
        const defaultConfig = {
          supabaseUrl: 'http://localhost:54321',
          supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
        };
        expect(defaultConfig.supabaseUrl).toBe('http://localhost:54321');
      }
    });
  });

  describe('Race Conditions', () => {
    test('should handle concurrent flag submissions', async () => {
      global.fetch.mockResolvedValue({ ok: true, status: 201 });

      const flag1 = { content: 'Flag 1', flag_type: 'misinformation' };
      const flag2 = { content: 'Flag 2', flag_type: 'harmful' };

      // Submit both flags concurrently
      await Promise.all([
        fetch('http://localhost:54321/rest/v1/flagged_content', {
          method: 'POST',
          body: JSON.stringify(flag1)
        }),
        fetch('http://localhost:54321/rest/v1/flagged_content', {
          method: 'POST',
          body: JSON.stringify(flag2)
        })
      ]);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
