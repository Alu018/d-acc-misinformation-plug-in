const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Simple test helper
async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    return false;
  }
}

// HTTP request helper
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Tests
async function runTests() {
  console.log('\n🧪 Running API Tests\n');

  let passed = 0;
  let failed = 0;

  // Test 1: GET all flagged content
  if (await test('GET /rest/v1/flagged_content returns array', async () => {
    const res = await request('GET', '/rest/v1/flagged_content');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Response is not an array');
  })) passed++; else failed++;

  // Test 2: GET with PostgREST filter syntax
  if (await test('GET with eq. filter works', async () => {
    const testUrl = 'https://example.com/test';
    const res = await request('GET', `/rest/v1/flagged_content?page_url=eq.${encodeURIComponent(testUrl)}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Response is not an array');
  })) passed++; else failed++;

  // Test 3: POST new flagged content
  let createdId;
  if (await test('POST /rest/v1/flagged_content creates new entry', async () => {
    const data = {
      url: 'https://test.com/page',
      page_url: 'https://test.com/page',
      content: 'Test content for validation',
      content_type: 'text',
      flag_type: 'misinformation',
      note: 'Test note',
      selector: 'div.test'
    };
    const res = await request('POST', '/rest/v1/flagged_content', data);
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (!res.data || !res.data.id) throw new Error('No ID returned');
    createdId = res.data.id;
  })) passed++; else failed++;

  // Test 4: Verify created entry exists
  if (await test('Created entry can be retrieved', async () => {
    const res = await request('GET', '/rest/v1/flagged_content?page_url=eq.https://test.com/page');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const found = res.data.find(item => item.id === createdId);
    if (!found) throw new Error('Created entry not found');
    if (found.note !== 'Test note') throw new Error('Note does not match');
  })) passed++; else failed++;

  // Test 5: Count endpoint
  if (await test('Count endpoint works', async () => {
    const res = await request('GET', '/rest/v1/flagged_content/count?page_url=https://test.com/page');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (typeof res.data.count !== 'number') throw new Error('Count is not a number');
    if (res.data.count < 1) throw new Error('Count should be at least 1');
  })) passed++; else failed++;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
