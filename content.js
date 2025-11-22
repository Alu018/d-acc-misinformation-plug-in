// Content script for handling content selection, flagging, and highlighting

let selectedElement = null;
let selectedContent = null;
let flagPopup = null;

// Validation constants
const MAX_CONTENT_LENGTH = 102400; // 100KB
const MAX_NOTE_LENGTH = 5120; // 5KB
const MAX_URL_LENGTH = 2048; // 2KB
const MAX_SELECTOR_LENGTH = 2048; // 2KB
const VALID_FLAG_TYPES = ['scam', 'misinformation', 'other'];
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
  // Load existing flags for this page
  await loadAndHighlightFlags();

  // Set up selection listener
  document.addEventListener('mouseup', handleSelection);
}

// Handle text/element selection
function handleSelection(event) {
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
        <option value="other">Other</option>
      </select>
      <div class="misinfo-confidence-group">
        <label class="misinfo-confidence-label">Confidence:</label>
        <div class="misinfo-confidence-options">
          <label class="misinfo-confidence-option">
            <input type="radio" name="confidence" value="certain" checked>
            <span>Certain</span>
          </label>
          <label class="misinfo-confidence-option">
            <input type="radio" name="confidence" value="uncertain">
            <span>Not quite certain</span>
          </label>
        </div>
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

// Submit flag to database
async function submitFlag() {
  const flagType = document.getElementById('misinfo-flag-type').value;
  const note = document.getElementById('misinfo-flag-note').value;
  const confidence = document.querySelector('input[name="confidence"]:checked').value;

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

  const flagData = {
    url: window.location.href,
    page_url: window.location.origin + window.location.pathname,
    content: content,
    content_type: selectedContent.type,
    flag_type: flagType,
    confidence: confidence,
    note: note,
    selector: selector,
    timestamp: new Date().toISOString()
  };

  try {
    await saveFlagToDatabase(flagData);

    // Highlight the flagged content with confidence level
    highlightElement(selectedElement, flagType, { ...flagData, created_at: flagData.timestamp });

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

  element.classList.add('misinfo-highlighted');
  element.setAttribute('data-flag-type', flagType);

  // Store flag data for hover popup
  if (flagData) {
    element.setAttribute('data-flag-note', flagData.note || '');
    element.setAttribute('data-flag-date', flagData.created_at || flagData.timestamp || '');
    element.setAttribute('data-flag-confidence', flagData.confidence || 'certain');

    // Add confidence class for styling
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

  element.addEventListener('mouseleave', () => {
    hideFlagInfoPopup();
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
  const confidence = element.getAttribute('data-flag-confidence') || 'certain';

  // Create popup
  flagInfoPopup = document.createElement('div');
  flagInfoPopup.className = 'misinfo-flag-info-popup';

  let dateStr = '';
  if (date) {
    const flagDate = new Date(date);
    dateStr = flagDate.toLocaleDateString() + ' ' + flagDate.toLocaleTimeString();
  }

  const confidenceText = confidence === 'uncertain' ? ' (Uncertain)' : '';

  flagInfoPopup.innerHTML = `
    <div class="misinfo-flag-info-content">
      <div class="misinfo-flag-info-header">
        <span class="misinfo-flag-badge misinfo-flag-badge-${flagType}${confidence === 'uncertain' ? ' misinfo-flag-badge-uncertain' : ''}">${flagType}${confidenceText}</span>
      </div>
      ${note ? `<div class="misinfo-flag-info-note">${escapeHtml(note)}</div>` : '<div class="misinfo-flag-info-note-empty">No additional notes</div>'}
      ${dateStr ? `<div class="misinfo-flag-info-date">Flagged: ${dateStr}</div>` : ''}
    </div>
  `;

  document.body.appendChild(flagInfoPopup);

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

  const response = await fetch(`${supabaseUrl}/rest/v1/flagged_content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(flagData)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

// Get flags for current page
async function getFlagsForPage(pageUrl) {
  const config = await loadConfig();
  const { supabaseUrl, supabaseKey } = config;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/flagged_content?page_url=eq.${encodeURIComponent(pageUrl)}`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Load config
async function loadConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'));
    return await response.json();
  } catch (error) {
    console.error('Error loading config:', error);
    // Return default config
    return {
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
