// Content script for handling content selection, flagging, and highlighting

let selectedElement = null;
let selectedContent = null;
let flagPopup = null;

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
      selectedElement = target;
      selectedContent = {
        src: target.src,
        alt: target.alt || '',
        type: 'image'
      };
      showFlagPopup(event.pageX, event.pageY);
    } else if (target.tagName === 'VIDEO') {
      selectedElement = target;
      selectedContent = {
        src: target.src || target.currentSrc,
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
        <option value="misinformation">AI Misinformation</option>
        <option value="harmful">Harmful Information</option>
        <option value="misleading">Misleading Content</option>
        <option value="other">Other</option>
      </select>
      <textarea id="misinfo-flag-note" placeholder="Additional notes (optional)"></textarea>
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

  if (!selectedContent) {
    console.error('No content selected');
    closePopup();
    return;
  }

  // Create CSS selector for the element
  const selector = generateSelector(selectedElement);

  const flagData = {
    url: window.location.href,
    page_url: window.location.origin + window.location.pathname,
    content: selectedContent.text || selectedContent.src,
    content_type: selectedContent.type,
    flag_type: flagType,
    note: note,
    selector: selector,
    timestamp: new Date().toISOString()
  };

  try {
    await saveFlagToDatabase(flagData);

    // Highlight the flagged content
    highlightElement(selectedElement, flagType);

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
function highlightElement(element, flagType) {
  if (!element) return;

  if (element.nodeType === Node.TEXT_NODE) {
    element = element.parentElement;
  }

  element.classList.add('misinfo-highlighted');
  element.setAttribute('data-flag-type', flagType);

  // Add click listener to show flag info
  element.addEventListener('click', (e) => {
    if (element.classList.contains('misinfo-highlighted')) {
      e.stopPropagation();
      showFlagInfo(element);
    }
  });
}

// Show information about a flag
function showFlagInfo(element) {
  const flagType = element.getAttribute('data-flag-type');
  const message = `This content has been flagged as: ${flagType}`;
  showNotification(message, 'info');
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
            highlightElement(element, flag.flag_type);
          }
        }

        // For text content, try to find and highlight matching text
        if (flag.content_type === 'text' && flag.content) {
          highlightTextContent(flag.content, flag.flag_type);
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
function highlightTextContent(text, flagType) {
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
    highlightElement(node, flagType);
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
