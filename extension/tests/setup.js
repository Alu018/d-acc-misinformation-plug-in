// Test setup file
// Polyfill for jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.chrome = {
  runtime: {
    getURL: jest.fn((path) => `chrome-extension://test-extension-id/${path}`)
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      })
    }
  },
  tabs: {
    query: jest.fn((query, callback) => {
      const tabs = [{ id: 1, url: 'https://example.com/test' }];
      if (callback) callback(tabs);
      return Promise.resolve(tabs);
    }),
    reload: jest.fn((tabId, callback) => {
      if (callback) callback();
      return Promise.resolve();
    })
  }
};

// Mock fetch globally
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch.mockClear();
});
