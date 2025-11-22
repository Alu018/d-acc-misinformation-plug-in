# Testing Documentation

## Test Suite Overview

The test suite includes comprehensive tests for edge cases, security vulnerabilities, and functionality.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Categories

### 1. Selector Generation Tests (`tests/selector.test.js`)

Tests the CSS selector generation logic for reliably finding flagged elements.

**Edge Cases Covered:**
- Elements with unique IDs
- Nth-child elements without IDs
- Deeply nested elements
- Text nodes (should use parent element)
- Null/undefined elements
- Selector uniqueness verification

**Key Finding:** The selector generation works correctly for standard DOM elements, but care must be taken with dynamically generated content.

### 2. Content Edge Cases (`tests/content-edge-cases.test.js`)

Tests various edge cases in content handling.

**Text Content:**
- ✅ Empty selections (length = 0)
- ⚠️ **Very long text** (>100KB) - Consider adding length limits
- ✅ Special characters and HTML tags
- ✅ SQL injection attempts (safe with JSON API)
- ✅ Unicode and emoji content
- ✅ Newlines and whitespace
- ✅ Whitespace-only selections

**URL Handling:**
- ✅ Query parameters (strip for page matching)
- ✅ Hash fragments (strip for page matching)
- ✅ URLs with ports
- ✅ URLs with spaces (auto-encoded to %20)
- ⚠️ **Very long URLs** (>2000 chars) - May cause issues in some browsers

**Images and Videos:**
- ⚠️ **Images without src** - Need graceful handling
- ✅ Data URLs (very long base64 strings)
- ✅ Videos with multiple sources
- ⚠️ **Very long image URLs** - Consider length validation

**Validation:**
- ✅ Flag type enum validation
- ✅ Content type enum validation
- ✅ Empty required fields detection
- ⚠️ **Very long notes** - No current limit, could cause issues

### 3. Database Interactions (`tests/database.test.js`)

Tests API communication with Supabase.

**Tests Cover:**
- ✅ Correct HTTP headers
- ✅ Successful saves
- ✅ Network error handling
- ✅ Server error handling (500, 401)
- ✅ Special character encoding in JSON
- ✅ URL parameter encoding
- ✅ Empty result sets
- ✅ Malformed JSON responses
- ✅ Missing config file handling
- ✅ Concurrent flag submissions

**Key Finding:** All database interactions are safe from SQL injection when using the Supabase REST API with JSON payloads.

### 4. Security Tests (`tests/security.test.js`)

Comprehensive security vulnerability testing.

**XSS Prevention:**
- ✅ Scripts in flagged content (safe with textContent)
- ✅ HTML in notes (safe with textContent)
- ⚠️ **javascript: URLs** - Need protocol validation before use
- ⚠️ **data: URLs with scripts** - Need validation
- ✅ Event handlers (safe with textContent)

**SQL Injection Prevention:**
- ✅ Single quotes in content
- ✅ SQL commands in content
- ✅ Null bytes
- ✅ Multiple statements
- **Note:** Using JSON API with Supabase provides inherent protection

**Input Validation:**
- ⚠️ **Flag type validation** - Should validate before submission
- ⚠️ **Content type validation** - Should validate before submission
- ⚠️ **Empty required fields** - Should validate before submission
- ✅ Timestamp format validation

**Content Security:**
- ⚠️ **DoS via huge content** - No current size limits (recommend 100KB max)
- ✅ Binary data handling
- ⚠️ **URL scheme validation** - Should reject file://, javascript:, data: schemes
- ✅ Chrome extension permissions

**Data Privacy:**
- ✅ API key logging prevention
- ⚠️ **PII in flagged content** - Consider adding warning to users

## Critical Edge Cases Identified

### 1. Content Length Limits ⚠️
**Issue:** No limits on content, note, or URL length
**Impact:** Could cause DoS, database bloat, or UI issues
**Recommendation:** Add validation:
- Content: max 100KB
- Notes: max 5KB
- URLs: max 2KB
- Selector: max 2KB

### 2. URL Scheme Validation ⚠️
**Issue:** javascript:, data:, and file: URLs are not validated
**Impact:** Potential XSS or security issues
**Recommendation:** Only allow http: and https: protocols

### 3. Missing Image/Video Sources ⚠️
**Issue:** Elements without src attributes cause empty content
**Impact:** Invalid database entries
**Recommendation:** Validate src exists before flagging

### 4. Rate Limiting ⚠️
**Issue:** No client-side rate limiting
**Impact:** Potential abuse or spam
**Recommendation:** Implement client-side throttling (e.g., max 10 flags/minute)

### 5. Input Validation ⚠️
**Issue:** Enum values (flag_type, content_type) not validated client-side
**Impact:** Invalid data could reach database
**Recommendation:** Add validation before API calls

## Test Results Summary

```
Test Suites: 4 passed, 4 total
Tests:       66 passed, 66 total
```

All tests passing ✅

## Recommendations for Production

1. **Add Input Validation:** Validate all inputs before sending to API
2. **Add Length Limits:** Prevent DoS and database bloat
3. **URL Scheme Validation:** Only allow safe protocols
4. **Rate Limiting:** Implement client and server-side rate limiting
5. **User Warnings:** Warn users about flagging PII or sensitive data
6. **Error Boundaries:** Add try-catch blocks around critical functions
7. **Content Sanitization:** Always use textContent, never innerHTML for user content
8. **Timeout Handling:** Add timeouts for API calls
9. **Retry Logic:** Add exponential backoff for failed requests
10. **Analytics:** Track errors and edge cases in production

## Known Safe Practices

✅ Using Supabase REST API with JSON prevents SQL injection
✅ Using textContent instead of innerHTML prevents XSS
✅ Using URL constructor handles encoding
✅ Using JSON.stringify safely escapes special characters
✅ Chrome extension content scripts are sandboxed

## Security Checklist

- ✅ SQL Injection: Protected by JSON API
- ✅ XSS in content: Protected by textContent
- ✅ CSRF: API keys in headers
- ⚠️ DoS: Need length limits
- ⚠️ URL validation: Need protocol checks
- ⚠️ Rate limiting: Need implementation
- ✅ Permission model: Appropriate Chrome permissions
- ⚠️ PII handling: Need user warnings
