// Content script for handling content selection, flagging, and highlighting

let selectedElement = null;
let selectedContent = null;
let flagPopup = null;

// Validation constants
const MAX_CONTENT_LENGTH = 102400; // 100KB
const MAX_NOTE_LENGTH = 5120; // 5KB
const MAX_URL_LENGTH = 2048; // 2KB
const MAX_SELECTOR_LENGTH = 2048; // 2KB
const VALID_FLAG_TYPES = ['scam', 'misinformation', 'fake_profile', 'other'];
const VALID_CONTENT_TYPES = ['text', 'image', 'video', 'other'];
const VALID_URL_SCHEMES = ['http:', 'https:'];

// Validation functions
function validateContent(content) {
  if (!content || content.length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return { valid: false, error: `Content too long (max ${MAX_CONTENT_LENGTH} characters)` };
  }
  return { valid: true };
}

function validateNote(note) {
  if (note && note.length > MAX_NOTE_LENGTH) {
    return { valid: false, error: `Note too long (max ${MAX_NOTE_LENGTH} characters)` };
  }
  return { valid: true };
}

function validateUrl(url) {
  if (!url || url.length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }
  if (url.length > MAX_URL_LENGTH) {
    return { valid: false, error: `URL too long (max ${MAX_URL_LENGTH} characters)` };
  }

  try {
    const parsedUrl = new URL(url);
    if (!VALID_URL_SCHEMES.includes(parsedUrl.protocol)) {
      return { valid: false, error: `Invalid URL scheme (only ${VALID_URL_SCHEMES.join(', ')} allowed)` };
    }
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }

  return { valid: true };
}

function validateFlagType(type) {
  if (!VALID_FLAG_TYPES.includes(type)) {
    return { valid: false, error: `Invalid flag type (must be one of: ${VALID_FLAG_TYPES.join(', ')})` };
  }
  return { valid: true };
}

function validateContentType(type) {
  if (!VALID_CONTENT_TYPES.includes(type)) {
    return { valid: false, error: `Invalid content type (must be one of: ${VALID_CONTENT_TYPES.join(', ')})` };
  }
  return { valid: true };
}

// Initialize the extension
async function init() {
  // Initialize username if not already set
  await initializeUsername();

  // Check if current URL is flagged
  await checkCurrentUrlFlag();

  // Load existing flags for this page
  await loadAndHighlightFlags();

  // Set up selection listener
  document.addEventListener('mouseup', handleSelection);
}

// Handle text/element selection
function handleSelection(event) {
  // Ignore clicks inside the flag popup
  if (flagPopup && flagPopup.contains(event.target)) {
    return;
  }

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    selectedElement = selection.getRangeAt(0).commonAncestorContainer;
    selectedContent = {
      text: selectedText,
      type: 'text'
    };
    showFlagPopup(event.pageX, event.pageY);
  } else {
    // Check if clicked element is an image or video
    const target = event.target;
    if (target.tagName === 'IMG') {
      // Validate that image has a source
      if (!target.src || target.src.length === 0) {
        showNotification('Cannot flag image without source', 'error');
        return;
      }

      selectedElement = target;
      selectedContent = {
        src: target.src,
        alt: target.alt || '',
        type: 'image'
      };
      showFlagPopup(event.pageX, event.pageY);
    } else if (target.tagName === 'VIDEO') {
      const videoSrc = target.src || target.currentSrc;

      // Validate that video has a source
      if (!videoSrc || videoSrc.length === 0) {
        showNotification('Cannot flag video without source', 'error');
        return;
      }

      selectedElement = target;
      selectedContent = {
        src: videoSrc,
        type: 'video'
      };
      showFlagPopup(event.pageX, event.pageY);
    }
  }
}

// Show the flag popup
function showFlagPopup(x, y) {
  // Remove existing popup if any
  if (flagPopup) {
    flagPopup.remove();
  }

  // Create popup
  flagPopup = document.createElement('div');
  flagPopup.className = 'misinfo-flag-popup';
  flagPopup.innerHTML = `
    <div class="misinfo-popup-content">
      <h3>Flag Content</h3>
      <select id="misinfo-flag-type">
        <option value="scam">Scam</option>
        <option value="misinformation">Misinformation</option>
        <option value="fake_profile">Fake Profile</option>
        <option value="other">Other</option>
      </select>
      <div class="misinfo-confidence-group">
        <label class="misinfo-confidence-label">Confidence: <span id="misinfo-confidence-value">50</span>%</label>
        <input type="range" id="misinfo-confidence-slider" min="0" max="100" value="50" step="1">
      </div>
      <textarea id="misinfo-flag-note" placeholder="Additional notes (optional)" maxlength="${MAX_NOTE_LENGTH}"></textarea>
      <div class="misinfo-char-count">
        <span id="misinfo-note-count">0</span>/${MAX_NOTE_LENGTH} characters
      </div>
      <div class="misinfo-popup-buttons">
        <button id="misinfo-flag-submit">Flag</button>
        <button id="misinfo-flag-cancel">Cancel</button>
      </div>
    </div>
  `;

  // Position popup near the selection
  flagPopup.style.left = `${x}px`;
  flagPopup.style.top = `${y + 10}px`;

  document.body.appendChild(flagPopup);

  // Add event listeners
  document.getElementById('misinfo-flag-submit').addEventListener('click', submitFlag);
  document.getElementById('misinfo-flag-cancel').addEventListener('click', closePopup);

  // Update character count
  const noteTextarea = document.getElementById('misinfo-flag-note');
  const noteCount = document.getElementById('misinfo-note-count');
  noteTextarea.addEventListener('input', () => {
    noteCount.textContent = noteTextarea.value.length;
  });

  // Update confidence slider value display
  const confidenceSlider = document.getElementById('misinfo-confidence-slider');
  const confidenceValue = document.getElementById('misinfo-confidence-value');
  confidenceSlider.addEventListener('input', () => {
    confidenceValue.textContent = confidenceSlider.value;
  });

  // Close popup when clicking outside
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 100);
}

// Handle clicks outside the popup
function handleOutsideClick(event) {
  if (flagPopup && !flagPopup.contains(event.target)) {
    closePopup();
  }
}

// Close the popup
function closePopup() {
  if (flagPopup) {
    flagPopup.remove();
    flagPopup = null;
  }
  document.removeEventListener('click', handleOutsideClick);
}

// Show loading dialog during LLM verification
function showLoadingDialog() {
  // Remove existing popup
  if (flagPopup) {
    flagPopup.remove();
  }

  // Create loading dialog
  const loading = document.createElement('div');
  loading.className = 'misinfo-flag-popup misinfo-loading-dialog';

  loading.innerHTML = `
    <div class="misinfo-popup-content misinfo-loading-content">
      <div class="misinfo-loading-spinner"></div>
      <h3>Verifying...</h3>
      <p class="misinfo-loading-text">AI is checking the content with web search</p>
    </div>
  `;

  document.body.appendChild(loading);

  // Position in center
  loading.style.position = 'fixed';
  loading.style.left = '50%';
  loading.style.top = '50%';
  loading.style.transform = 'translate(-50%, -50%)';
  loading.style.zIndex = '1000001';

  flagPopup = loading;

  return loading;
}

// Show confirmation dialog when LLM disagrees with flag
function showConfirmationDialog(verificationResult) {
  return new Promise((resolve) => {
    // Remove existing popup
    if (flagPopup) {
      flagPopup.remove();
    }

    // Create confirmation dialog
    const dialog = document.createElement('div');
    dialog.className = 'misinfo-flag-popup misinfo-confirmation-dialog';

    const sourcesHtml = verificationResult.sources
      .map(source => `
        <div class="misinfo-source-item">
          <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(source.title)}
          </a>
          <p class="misinfo-source-relevance">${escapeHtml(source.relevance)}</p>
        </div>
      `)
      .join('');

    dialog.innerHTML = `
      <div class="misinfo-popup-content misinfo-confirmation-content">
        <h3>⚠️ AI Verification Result</h3>
        <div class="misinfo-verification-result">
          <p class="misinfo-disagreement-notice">
            Our AI assistant reviewed the content and <strong>believes this was flagged in error</strong>.
          </p>
          <div class="misinfo-reasoning">
            <h4>Reasoning:</h4>
            <p>${escapeHtml(verificationResult.reasoning)}</p>
          </div>
          <div class="misinfo-sources">
            <h4>Sources:</h4>
            ${sourcesHtml}
          </div>
        </div>
        <p class="misinfo-confirmation-question">
          Do you still want to flag this content?
        </p>
        <div class="misinfo-popup-buttons">
          <button id="misinfo-confirm-yes" class="misinfo-btn-confirm">Yes, Flag Anyway</button>
          <button id="misinfo-confirm-no" class="misinfo-btn-cancel">No, Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Position in center
    dialog.style.position = 'fixed';
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.maxWidth = '600px';
    dialog.style.maxHeight = '80vh';
    dialog.style.overflowY = 'auto';

    flagPopup = dialog;

    // Add event listeners
    document.getElementById('misinfo-confirm-yes').addEventListener('click', () => {
      dialog.remove();
      flagPopup = null;
      resolve(true);
    });

    document.getElementById('misinfo-confirm-no').addEventListener('click', () => {
      dialog.remove();
      flagPopup = null;
      resolve(false);
    });
  });
}

// Submit flag to database
async function submitFlag() {
  const flagType = document.getElementById('misinfo-flag-type').value;
  const note = document.getElementById('misinfo-flag-note').value;
  const confidence = parseInt(document.getElementById('misinfo-confidence-slider').value);

  if (!selectedContent) {
    console.error('No content selected');
    closePopup();
    return;
  }

  // Validate flag type
  const flagTypeValidation = validateFlagType(flagType);
  if (!flagTypeValidation.valid) {
    showNotification(flagTypeValidation.error, 'error');
    return;
  }

  // Validate content type
  const contentTypeValidation = validateContentType(selectedContent.type);
  if (!contentTypeValidation.valid) {
    showNotification(contentTypeValidation.error, 'error');
    return;
  }

  // Validate content
  const content = selectedContent.text || selectedContent.src;
  const contentValidation = validateContent(content);
  if (!contentValidation.valid) {
    showNotification(contentValidation.error, 'error');
    return;
  }

  // Validate note
  const noteValidation = validateNote(note);
  if (!noteValidation.valid) {
    showNotification(noteValidation.error, 'error');
    return;
  }

  // Validate URLs
  const urlValidation = validateUrl(window.location.href);
  if (!urlValidation.valid) {
    showNotification(urlValidation.error, 'error');
    return;
  }

  // Create CSS selector for the element
  const selector = generateSelector(selectedElement);

  // Validate selector length
  if (selector && selector.length > MAX_SELECTOR_LENGTH) {
    showNotification(`Selector too long (max ${MAX_SELECTOR_LENGTH} characters)`, 'error');
    return;
  }

  // Get username
  const username = await getUsername();

  const flagData = {
    url: window.location.href,
    page_url: window.location.origin + window.location.pathname,
    content: content,
    content_type: selectedContent.type,
    flag_type: flagType,
    confidence: confidence,
    note: note,
    selector: selector,
    username: username
  };

  try {
    // Check if LLM verification is enabled
    const verificationEnabled = window.LLMVerifier ? await window.LLMVerifier.isVerificationEnabled() : false;

    if (verificationEnabled && (flagType === 'misinformation' || flagType === 'scam')) {
      // Show loading indicator
      const loadingDialog = showLoadingDialog();

      try {
        const apiKey = await window.LLMVerifier.getApiKey();
        const verificationResult = await window.LLMVerifier.verifyFlag({
          apiKey,
          flagType,
          selectedText: content,
          pageUrl: window.location.href
        });

        // Remove loading dialog
        if (loadingDialog) {
          loadingDialog.remove();
        }

        // Store verification result in flag data
        flagData.llm_verified = true;
        flagData.llm_agrees = verificationResult.agrees_with_flag;
        flagData.llm_reasoning = verificationResult.reasoning;
        flagData.llm_sources = JSON.stringify(verificationResult.sources);
        flagData.ai_verification_status = verificationResult.agrees_with_flag ? 'ai_agreed' : 'ai_disagreed';

        if (!verificationResult.agrees_with_flag) {
          // LLM disagrees with the flag - ask user for confirmation
          const userConfirmed = await showConfirmationDialog(verificationResult);

          if (!userConfirmed) {
            closePopup();
            return;
          }
          // User confirmed despite LLM disagreement
          flagData.user_confirmed_despite_llm = true;
        }
      } catch (verificationError) {
        console.error('LLM verification failed:', verificationError);

        // Remove loading dialog
        if (loadingDialog) {
          loadingDialog.remove();
        }

        showNotification('AI verification failed, proceeding without verification', 'warning');
        flagData.llm_verified = false;
        flagData.llm_error = verificationError.message;
        flagData.ai_verification_status = 'verification_disabled';
      }
    } else {
      flagData.ai_verification_status = 'verification_disabled';
    }
    const savedFlag = await saveFlagToDatabase(flagData);

    // Highlight the flagged content with the returned ID
    highlightElement(selectedElement, flagType, { ...savedFlag, created_at: savedFlag.created_at });

    // Show success message
    showNotification('Content flagged successfully!');

    closePopup();
  } catch (error) {
    console.error('Error saving flag:', error);
    showNotification('Error flagging content. Please try again.', 'error');
  }
}

// Generate CSS selector for an element
function generateSelector(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    element = element.parentElement;
  }

  if (!element) return '';

  const path = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();

    if (element.id) {
      selector += `#${element.id}`;
      path.unshift(selector);
      break;
    } else {
      let sibling = element;
      let nth = 1;
      while (sibling.previousElementSibling) {
        sibling = sibling.previousElementSibling;
        if (sibling.nodeName.toLowerCase() === selector) nth++;
      }
      if (nth > 1) selector += `:nth-of-type(${nth})`;
    }

    path.unshift(selector);
    element = element.parentElement;
  }

  return path.join(' > ');
}

// Highlight an element
function highlightElement(element, flagType, flagData = null) {
  if (!element) return;

  if (element.nodeType === Node.TEXT_NODE) {
    element = element.parentElement;
  }

  // If content type is text, only highlight the matching text
  if (flagData && flagData.content_type == 'text') {
      const content = flagData.content;
      console.log("flag data content: ", content)
      const originalText = element.innerHTML;
      const regex = new RegExp(content, 'g'); // Create a global regex for all occurrences
      const newText = originalText.replace(regex, `<strong>${content}</strong>`);
      element.innerHTML = newText;
      const strongElement = element.querySelector('strong');
      // Only reassign if we found the strong element
      if (strongElement) {
        element = strongElement;
      }
  }

  // Final check - element might still be null
  if (!element) return;

  element.classList.add('misinfo-highlighted');
  element.setAttribute('data-flag-type', flagType);

  // Store flag data for hover popup
  if (flagData) {
    element.setAttribute('data-flag-note', flagData.note || '');
    element.setAttribute('data-flag-date', flagData.created_at || flagData.timestamp || '');
    element.setAttribute('data-flag-confidence', flagData.confidence || '50');
    element.setAttribute('data-flag-id', flagData.id || '');

    // Add confidence class for styling (legacy support)
    if (flagData.confidence === 'uncertain') {
      element.classList.add('misinfo-uncertain');
    }
  }

  // Add hover listeners to show flag info popup
  element.addEventListener('mouseenter', (e) => {
    if (element.classList.contains('misinfo-highlighted')) {
      showFlagInfoPopup(element, e);
    }
  });

  element.addEventListener('mouseleave', (e) => {
    // Delay hiding to allow moving to popup
    setTimeout(() => {
      // Only hide if not hovering over popup
      if (flagInfoPopup && !flagInfoPopup.matches(':hover')) {
        hideFlagInfoPopup();
      }
    }, 100);
  });
}

// Show information about a flag (deprecated - keeping for compatibility)
function showFlagInfo(element) {
  const flagType = element.getAttribute('data-flag-type');
  const note = element.getAttribute('data-flag-note');

  let message = `This content has been flagged as: ${flagType}`;
  if (note && note.trim()) {
    message += `\n\nReason: ${note}`;
  }

  showNotification(message, 'info');
}

// Show flag info popup on hover
let flagInfoPopup = null;

function showFlagInfoPopup(element, event) {
  // Remove existing popup
  hideFlagInfoPopup();

  const flagType = element.getAttribute('data-flag-type');
  const note = element.getAttribute('data-flag-note');
  const date = element.getAttribute('data-flag-date');
  const confidence = element.getAttribute('data-flag-confidence') || '50';
  const flagId = element.getAttribute('data-flag-id');

  // Create popup
  flagInfoPopup = document.createElement('div');
  flagInfoPopup.className = 'misinfo-flag-info-popup';

  let dateStr = '';
  if (date) {
    const flagDate = new Date(date);
    dateStr = flagDate.toLocaleDateString() + ' ' + flagDate.toLocaleTimeString();
  }

  const confidenceValue = parseInt(confidence);
  let confidenceLabel = 'Medium';
  if (confidenceValue >= 67) confidenceLabel = 'High';
  else if (confidenceValue <= 33) confidenceLabel = 'Low';
  const confidenceText = ` (${confidenceValue}% - ${confidenceLabel})`;

  flagInfoPopup.innerHTML = `
    <div class="misinfo-flag-info-content">
      <div class="misinfo-flag-info-header">
        <span class="misinfo-flag-badge misinfo-flag-badge-${flagType}">${flagType}${confidenceText}</span>
      </div>
      ${note ? `<div class="misinfo-flag-info-note">${escapeHtml(note)}</div>` : '<div class="misinfo-flag-info-note-empty">No additional notes</div>'}
      ${dateStr ? `<div class="misinfo-flag-info-date">Flagged: ${dateStr}</div>` : ''}
      <button class="misinfo-unflag-button" data-flag-id="${flagId || ''}">Unflag this content</button>
    </div>
  `;

  document.body.appendChild(flagInfoPopup);

  // Add unflag button listener
  const unflagBtn = flagInfoPopup.querySelector('.misinfo-unflag-button');
  if (unflagBtn && flagId) {
    unflagBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await unflagContent(flagId, element);
    });
  }

  // Position popup near the element
  const rect = element.getBoundingClientRect();
  const popupRect = flagInfoPopup.getBoundingClientRect();

  let left = rect.left + window.scrollX;
  let top = rect.bottom + window.scrollY + 5;

  // Adjust if popup goes off screen
  if (left + popupRect.width > window.innerWidth) {
    left = window.innerWidth - popupRect.width - 10;
  }
  if (top + popupRect.height > window.innerHeight + window.scrollY) {
    top = rect.top + window.scrollY - popupRect.height - 5;
  }

  flagInfoPopup.style.left = `${left}px`;
  flagInfoPopup.style.top = `${top}px`;

  // Add show class for animation
  setTimeout(() => {
    if (flagInfoPopup) {
      flagInfoPopup.classList.add('misinfo-flag-info-popup-show');
    }
  }, 10);

  // Add mouseleave to popup to hide when leaving
  flagInfoPopup.addEventListener('mouseleave', () => {
    hideFlagInfoPopup();
  });
}

function hideFlagInfoPopup() {
  if (flagInfoPopup) {
    flagInfoPopup.remove();
    flagInfoPopup = null;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load and highlight existing flags for this page
async function loadAndHighlightFlags() {
  try {
    const pageUrl = window.location.origin + window.location.pathname;
    const flags = await getFlagsForPage(pageUrl);

    flags.forEach(flag => {
      try {
        // Try to find the element using the selector
        if (flag.selector) {
          const element = document.querySelector(flag.selector);
          if (element) {
            highlightElement(element, flag.flag_type, flag);
          }
        }

        // For text content, try to find and highlight matching text
        if (flag.content_type === 'text' && flag.content) {
          highlightTextContent(flag.content, flag.flag_type, flag);
        }
      } catch (error) {
        console.error('Error highlighting flag:', error);
      }
    });

    if (flags.length > 0) {
      showNotification(`Found ${flags.length} flagged item(s) on this page`, 'info');
    }
  } catch (error) {
    console.error('Error loading flags:', error);
  }
}

// Highlight text content
function highlightTextContent(text, flagType, flagData = null) {
  // Simple text highlighting - can be improved with better algorithm
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const nodesToHighlight = [];
  let node;

  while (node = walker.nextNode()) {
    if (node.textContent.includes(text)) {
      nodesToHighlight.push(node);
    }
  }

  nodesToHighlight.forEach(node => {
    highlightElement(node, flagType, flagData);
  });
}

// Save flag to database
async function saveFlagToDatabase(flagData) {
  const config = await loadConfig();
  const { supabaseUrl, supabaseKey } = config;

  const response = await fetch(buildApiUrl(supabaseUrl, 'flagged_content'), {
    method: 'POST',
    headers: {
      ...buildHeaders(supabaseUrl, supabaseKey),
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(flagData)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Return the created record (includes the ID)
  const result = await response.json();
  return result[0]; // PostgREST returns an array
}

// Get flags for current page
async function getFlagsForPage(pageUrl) {
  const config = await loadConfig();
  const { supabaseUrl, supabaseKey } = config;

  const response = await fetch(
    `${buildApiUrl(supabaseUrl, 'flagged_content')}?page_url=eq.${encodeURIComponent(pageUrl)}`,
    {
      headers: buildHeaders(supabaseUrl, supabaseKey)
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Helper to build API URL (local PostgREST vs Supabase)
function buildApiUrl(baseUrl, endpoint) {
  const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  return isLocal ? `${baseUrl}/${endpoint}` : `${baseUrl}/rest/v1/${endpoint}`;
}

// Helper to build headers (skip auth for localhost)
function buildHeaders(baseUrl, apiKey) {
  const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  const headers = { 'Content-Type': 'application/json' };
  if (!isLocal) {
    headers['apikey'] = apiKey;
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

// Normalize URL for matching (strip protocol, www, trailing slash, fragments)
function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    let normalized = parsed.hostname.replace(/^www\./, '') + parsed.pathname;
    normalized = normalized.replace(/\/$/, ''); // Remove trailing slash
    // Keep query params but remove fragments
    if (parsed.search) normalized += parsed.search;
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// Load config
async function loadConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'));
    const config = await response.json();

    // Check storage for mode and manual settings
    const storage = await chrome.storage.local.get(['serverMode', 'manualSupabaseUrl', 'manualSupabaseKey', 'supabaseUrl', 'supabaseKey']);

    const serverMode = storage.serverMode || 'global';

    if (serverMode === 'manual') {
      // Use manual settings if available
      if (storage.manualSupabaseUrl || storage.supabaseUrl) {
         config.supabaseUrl = storage.manualSupabaseUrl || storage.supabaseUrl;
      }
      if (storage.manualSupabaseKey || storage.supabaseKey) {
         config.supabaseKey = storage.manualSupabaseKey || storage.supabaseKey;
      }
    }

    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    // Return default config
    return {
      supabaseUrl: 'https://aujqbnyprthwfdqnefwc.supabase.co',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1anFibnlwcnRod2ZkcW5lZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTgxMDQsImV4cCI6MjA3OTM3NDEwNH0.yUUMzCwfw4L9LOmH2vUtggNsz1QvsweR7IKfxl9_UrI'
    };
  }
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `misinfo-notification misinfo-notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('misinfo-notification-show');
  }, 100);

  setTimeout(() => {
    notification.classList.remove('misinfo-notification-show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Link flagging functionality
let linkFlagData = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'flagLink') {
    showLinkFlagDialog(request.linkUrl, request.flagType);
  }
});

// Show flag dialog for links
function showLinkFlagDialog(linkUrl, initialFlagType) {
  linkFlagData = { url: linkUrl, flagType: initialFlagType };

  // Remove existing popup if any
  if (flagPopup) {
    flagPopup.remove();
  }

  // Create popup
  flagPopup = document.createElement('div');
  flagPopup.className = 'misinfo-flag-popup';
  flagPopup.innerHTML = `
    <div class="misinfo-popup-content">
      <h3>Flag Link</h3>
      <p class="misinfo-link-preview">${linkUrl}</p>
      <select id="misinfo-flag-type">
        <option value="scam" ${initialFlagType === 'scam' ? 'selected' : ''}>Scam</option>
        <option value="misinformation" ${initialFlagType === 'misinformation' ? 'selected' : ''}>Misinformation</option>
        <option value="fake_profile" ${initialFlagType === 'fake_profile' ? 'selected' : ''}>Fake Profile</option>
        <option value="other" ${initialFlagType === 'other' ? 'selected' : ''}>Other</option>
      </select>
      <div class="misinfo-confidence-group">
        <label class="misinfo-confidence-label">Confidence: <span id="misinfo-confidence-value-link">50</span>%</label>
        <input type="range" id="misinfo-confidence-slider-link" min="0" max="100" value="50" step="1">
      </div>
      <textarea id="misinfo-flag-note" placeholder="Additional notes (optional)" maxlength="${MAX_NOTE_LENGTH}"></textarea>
      <div class="misinfo-char-count">
        <span id="misinfo-note-count">0</span>/${MAX_NOTE_LENGTH} characters
      </div>
      <div class="misinfo-popup-buttons">
        <button id="misinfo-flag-submit">Flag Link</button>
        <button id="misinfo-flag-cancel">Cancel</button>
      </div>
    </div>
  `;

  // Position popup in the center of the viewport
  flagPopup.style.position = 'fixed';
  flagPopup.style.left = '50%';
  flagPopup.style.top = '50%';
  flagPopup.style.transform = 'translate(-50%, -50%)';

  document.body.appendChild(flagPopup);

  // Add event listeners
  document.getElementById('misinfo-flag-submit').addEventListener('click', submitLinkFlag);
  document.getElementById('misinfo-flag-cancel').addEventListener('click', closePopup);

  // Update character count
  const noteTextarea = document.getElementById('misinfo-flag-note');
  const noteCount = document.getElementById('misinfo-note-count');
  noteTextarea.addEventListener('input', () => {
    noteCount.textContent = noteTextarea.value.length;
  });

  // Update confidence slider value display
  const confidenceSliderLink = document.getElementById('misinfo-confidence-slider-link');
  const confidenceValueLink = document.getElementById('misinfo-confidence-value-link');
  confidenceSliderLink.addEventListener('input', () => {
    confidenceValueLink.textContent = confidenceSliderLink.value;
  });

  // Close popup when clicking outside
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 100);
}

// Submit link flag to database
async function submitLinkFlag() {
  const flagType = document.getElementById('misinfo-flag-type').value;
  const note = document.getElementById('misinfo-flag-note').value;
  const confidence = parseInt(document.getElementById('misinfo-confidence-slider-link').value);

  if (!linkFlagData) {
    console.error('No link data');
    closePopup();
    return;
  }

  // Validate flag type
  const flagTypeValidation = validateFlagType(flagType);
  if (!flagTypeValidation.valid) {
    showNotification(flagTypeValidation.error, 'error');
    return;
  }

  // Validate note
  const noteValidation = validateNote(note);
  if (!noteValidation.valid) {
    showNotification(noteValidation.error, 'error');
    return;
  }

  // Validate URL
  const urlValidation = validateUrl(linkFlagData.url);
  if (!urlValidation.valid) {
    showNotification(urlValidation.error, 'error');
    return;
  }

  // Get username
  const username = await getUsername();

  const flagData = {
    url: linkFlagData.url,
    flag_type: flagType,
    confidence: confidence,
    note: note,
    flagged_by_url: window.location.href,
    username: username,
    created_at: new Date().toISOString()
  };

  try {
    const savedFlag = await saveLinkFlagToDatabase(flagData);
    showNotification('Link flagged successfully!');
    closePopup();
    linkFlagData = null;

    // Show warning banner with the returned flag data (includes ID)
    showUrlWarningBanner(savedFlag);
  } catch (error) {
    console.error('Error saving link flag:', error);
    showNotification('Error flagging link. Please try again.', 'error');
  }
}

// Save link flag to database
async function saveLinkFlagToDatabase(flagData) {
  const config = await loadConfig();
  const { supabaseUrl, supabaseKey } = config;

  const response = await fetch(buildApiUrl(supabaseUrl, 'flagged_links'), {
    method: 'POST',
    headers: {
      ...buildHeaders(supabaseUrl, supabaseKey),
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(flagData)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Return the created record (includes the ID)
  const result = await response.json();
  return result[0]; // PostgREST returns an array
}

// Check if current URL is flagged
async function checkCurrentUrlFlag() {
  const currentUrl = window.location.href;
  const normalizedCurrent = normalizeUrl(currentUrl);
  const config = await loadConfig();
  const { supabaseUrl, supabaseKey } = config;

  try {
    // Get all flagged links and check normalized URLs
    const response = await fetch(
      buildApiUrl(supabaseUrl, 'flagged_links'),
      {
        headers: buildHeaders(supabaseUrl, supabaseKey)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const allFlags = await response.json();

    // Find matches by normalizing each flagged URL
    const matchingFlags = allFlags.filter(flag =>
      normalizeUrl(flag.url) === normalizedCurrent
    );

    if (matchingFlags && matchingFlags.length > 0) {
      // Show warning banner for the first (most recent) flag
      showUrlWarningBanner(matchingFlags[0]);
    }
  } catch (error) {
    console.error('Error checking URL flags:', error);
  }
}

// Show warning banner for flagged URL
function showUrlWarningBanner(flagData) {
  console.log('Showing warning banner for flag:', flagData);

  const banner = document.createElement('div');
  banner.className = 'misinfo-url-warning-banner';
  banner.innerHTML = `
    <div class="misinfo-banner-content">
      <div class="misinfo-banner-icon">⚠️</div>
      <div class="misinfo-banner-text">
        <strong>Warning:</strong> This page has been flagged as <span class="misinfo-flag-badge">${flagData.flag_type}</span>
        ${flagData.note ? `<br><em>${flagData.note}</em>` : ''}
      </div>
      <button class="misinfo-banner-close">×</button>
      ${flagData.id ? `<button class="misinfo-banner-unflag" data-flag-id="${flagData.id}">Unflag Page</button>` : ''}
    </div>
  `;

  // Add banner to top of page
  document.body.insertBefore(banner, document.body.firstChild);

  // Close button functionality
  banner.querySelector('.misinfo-banner-close').addEventListener('click', () => {
    banner.remove();
  });

  // Unflag page button functionality
  const unflagBtn = banner.querySelector('.misinfo-banner-unflag');
  console.log('Unflag button found:', !!unflagBtn, 'Flag ID:', flagData.id);

  if (unflagBtn && flagData.id) {
    unflagBtn.addEventListener('click', async () => {
      console.log('Unflag button clicked');
      await unflagPage(flagData.id, banner);
    });
  } else if (!flagData.id) {
    console.warn('Warning: Flag data does not have an ID!', flagData);
  }
}

// Unflag content - remove flag from database and remove highlight
async function unflagContent(flagId, element) {
  if (!flagId) {
    showNotification('Cannot unflag: No flag ID found', 'error');
    return;
  }

  try {
    // Hide the popup immediately for better UX
    hideFlagInfoPopup();

    const config = await loadConfig();
    const { supabaseUrl, supabaseKey } = config;

    // Delete from database
    const response = await fetch(
      `${buildApiUrl(supabaseUrl, 'flagged_content')}?id=eq.${flagId}`,
      {
        method: 'DELETE',
        headers: buildHeaders(supabaseUrl, supabaseKey)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Remove highlight from element
    removeHighlight(element);

    showNotification('Content unflagged successfully!');
  } catch (error) {
    console.error('Error unflagging content:', error);
    showNotification('Error unflagging content. Please try again.', 'error');
  }
}

// Unflag page - remove page flag from database and remove banner
async function unflagPage(flagId, banner) {
  if (!flagId) {
    showNotification('Cannot unflag page: No flag ID found', 'error');
    return;
  }

  try {
    console.log('Unflagging page with ID:', flagId);
    const config = await loadConfig();
    const { supabaseUrl, supabaseKey } = config;

    // Delete from database
    const deleteUrl = `${buildApiUrl(supabaseUrl, 'flagged_links')}?id=eq.${flagId}`;
    console.log('DELETE request to:', deleteUrl);

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: buildHeaders(supabaseUrl, supabaseKey)
    });

    console.log('DELETE response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DELETE failed:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Remove banner
    if (banner) {
      banner.remove();
    }

    showNotification('Page unflagged successfully!');
  } catch (error) {
    console.error('Error unflagging page:', error);
    showNotification('Error unflagging page. Please try again.', 'error');
  }
}

// Remove highlight from an element
function removeHighlight(element) {
  if (!element) return;

  // Remove highlight classes and attributes
  element.classList.remove('misinfo-highlighted', 'misinfo-uncertain');
  element.removeAttribute('data-flag-type');
  element.removeAttribute('data-flag-note');
  element.removeAttribute('data-flag-date');
  element.removeAttribute('data-flag-confidence');
  element.removeAttribute('data-flag-id');

  // If element is a <strong> tag created by text highlighting, unwrap it
  if (element.tagName === 'STRONG' && element.parentElement) {
    const parent = element.parentElement;
    const textContent = element.textContent;
    parent.innerHTML = parent.innerHTML.replace(element.outerHTML, textContent);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
