# Testing Checklist

## Quick Start - Test Basic Flagging

1. **Load Extension**
   ```bash
   # Open chrome://extensions/
   # Enable Developer Mode
   # Click "Load unpacked"
   # Select the extension/ folder
   ```

2. **Test Without LLM (Default)**
   - Navigate to any website
   - Select some text
   - Flag it as "scam"
   - Should work normally and save

3. **Test With LLM**
   - Click extension icon → Settings
   - Paste your OpenAI API key
   - Save (should see "✓ Enabled")
   - Flag something as "misinformation"
   - Should see "Verifying..." dialog

## Manual Test Cases

### Test 1: Basic Flagging (No LLM)
```
Expected: Flagging works without any API key
Steps:
1. Don't enter OpenAI API key
2. Select text and flag it
3. ✓ Should save immediately
4. ✓ No loading dialog
```

### Test 2: LLM Loading Indicator
```
Expected: Shows loading during verification
Steps:
1. Enter OpenAI API key in settings
2. Flag text as "misinformation"
3. ✓ Should show "Verifying..." dialog
4. ✓ Should show spinner animation
5. ✓ Should close after verification
```

### Test 3: LLM Disagrees
```
Expected: Shows confirmation dialog with sources
Steps:
1. Flag something that's clearly NOT misinformation
2. Wait for verification
3. ✓ Should show confirmation dialog
4. ✓ Should show reasoning
5. ✓ Should show sources with links
6. ✓ Can confirm or cancel
```

### Test 4: Error Handling
```
Expected: Gracefully handles errors
Steps:
1. Use invalid API key
2. Try to flag content
3. ✓ Should show error message
4. ✓ Should still save flag
5. ✓ Should not crash
```

### Test 5: Different Flag Types
```
Expected: Only verifies misinformation and scam
Steps:
1. Flag as "misinformation" ✓ Should verify
2. Flag as "scam" ✓ Should verify
3. Flag as "fake_profile" ✓ Should NOT verify
4. Flag as "other" ✓ Should NOT verify
```

## Common Issues & Fixes

### Issue: "Cannot use import statement outside a module"
**Status**: ✅ FIXED
- Changed from ES6 modules to global window object
- Verifier loaded before content.js in manifest

### Issue: Nothing happens when flagging
**Check**:
1. Open DevTools console - any errors?
2. Is content.js loaded? Check in DevTools > Sources
3. Is verifier.js loaded before content.js?
4. Check manifest.json script order

### Issue: Loading dialog doesn't close
**Check**:
1. Is API key valid?
2. Check Network tab for failed requests
3. Check console for timeout errors

## Automated Tests

Created test files:
- `extension/tests/llm-verify.test.js` - Unit tests
- `extension/tests/integration.test.js` - Integration tests

To run (if Jest is set up):
```bash
cd extension
npm test
```

## Database Verification

After flagging with LLM verification, check the database:

```sql
SELECT
  id,
  content,
  flag_type,
  llm_verified,
  llm_agrees,
  llm_confidence,
  llm_reasoning,
  llm_sources
FROM flagged_content
WHERE llm_verified = true
LIMIT 5;
```

Expected fields:
- `llm_verified`: true
- `llm_agrees`: true (agrees) or false (flagged in error)
- `llm_reasoning`: text explanation
- `llm_sources`: JSON string with sources
